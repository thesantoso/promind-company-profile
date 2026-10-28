import { z } from 'zod';
import { writeAudit } from './db';
import {
  decryptSecret, encryptSecret, hashPassword, randomToken, sha256Hex, verifyPassword,
} from './crypto';
import { generateTotpSecret, otpauthUri, verifyTotp } from './totp';

export type Role = 'administrator' | 'editor';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  active: boolean;
  totpConfirmed: boolean;
  createdAt: number;
  lastLoginAt: number | null;
}

export interface Ctx {
  db: D1Database;
  /** ENCRYPTION_KEY (base64, 32 byte). */
  key: string;
  /** Jam dalam milidetik; disuntik agar bisa diuji. */
  now: () => number;
}

export class AuthError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message = code,
    readonly retryAfter?: number,
  ) {
    super(message);
  }
}

const HOUR = 3_600_000;
const INVITE_TTL_MS = 72 * HOUR;
const SESSION_ABSOLUTE_MS = 12 * HOUR;
const SESSION_IDLE_MS = 2 * HOUR;
const ATTEMPT_WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 5;
const MAX_ATTEMPTS_PER_IP = 30;
const TOUCH_AFTER_MS = 60_000;

const INVALID = () => new AuthError('invalid_credentials', 401, 'Email, password, or code is incorrect');

interface UserRow {
  id: number; email: string; name: string; role: Role; password_hash: string; totp_secret_enc: string | null;
  totp_confirmed: number; totp_last_step: number | null; active: number; created_at: number; last_login_at: number | null;
}

const toUser = (r: UserRow): User => ({
  id: r.id, email: r.email, name: r.name, role: r.role, active: r.active === 1,
  totpConfirmed: r.totp_confirmed === 1, createdAt: r.created_at, lastLoginAt: r.last_login_at,
});

export const inputSchemas = {
  email: z.email().max(254),
  name: z.string().trim().min(1).max(80),
  role: z.enum(['administrator', 'editor']),
};

export function assertStrongPassword(password: string, who: { email: string; name: string }): void {
  const weak = () => new AuthError('weak_password', 400, 'Password must be at least 12 characters and not based on your name or email');
  if (password.length < 12 || password.length > 128) throw weak();
  const p = password.toLowerCase();
  const local = who.email.toLowerCase().split('@')[0]!;
  if ([who.email.toLowerCase(), local, who.name.toLowerCase()].includes(p)) throw weak();
  if (new Set(p).size < 4) throw weak();
}

// ---- rate limit -----------------------------------------------------------------------------

async function attempts(c: Ctx, key: string): Promise<{ count: number; oldest: number | null }> {
  const since = Math.floor((c.now() - ATTEMPT_WINDOW_MS) / 1000);
  const r = await c.db
    .prepare('SELECT COUNT(*) AS n, MIN(ts) AS oldest FROM login_attempts WHERE key = ? AND ts > ?')
    .bind(key, since)
    .first<{ n: number; oldest: number | null }>();
  return { count: r?.n ?? 0, oldest: r?.oldest ?? null };
}

async function assertNotLimited(c: Ctx, keys: [string, number][]): Promise<void> {
  for (const [key, max] of keys) {
    const { count, oldest } = await attempts(c, key);
    if (count >= max) {
      const retry = Math.max(1, Math.ceil(((oldest ?? 0) * 1000 + ATTEMPT_WINDOW_MS - c.now()) / 1000));
      throw new AuthError('rate_limited', 429, 'Too many attempts. Try again later.', retry);
    }
  }
}

async function recordFailure(c: Ctx, keys: string[]): Promise<void> {
  const ts = Math.floor(c.now() / 1000);
  for (const key of keys) await c.db.prepare('INSERT INTO login_attempts (key, ts) VALUES (?, ?)').bind(key, ts).run();
  await c.db.prepare('DELETE FROM login_attempts WHERE ts < ?').bind(ts - 86_400).run();
}

const loginKeys = (email: string, ip: string): [string, string] => [`login:${email.toLowerCase()}|${ip}`, `ip:${ip}`];

// ---- invites ----------------------------------------------------------------------------------

async function newInvite(
  c: Ctx,
  createdBy: number | null,
  input: { email: string; name: string; role: Role },
): Promise<{ token: string; expiresAt: number }> {
  const email = inputSchemas.email.parse(input.email).toLowerCase();
  const name = inputSchemas.name.parse(input.name);
  const role = inputSchemas.role.parse(input.role);
  if (await c.db.prepare('SELECT 1 AS x FROM users WHERE email = ?').bind(email).first()) {
    throw new AuthError('email_taken', 409, 'A user with this email already exists');
  }
  const nowS = Math.floor(c.now() / 1000);
  await c.db.prepare('UPDATE invites SET used_at = ? WHERE email = ? AND used_at IS NULL').bind(nowS, email).run();
  const token = randomToken();
  const expiresAt = Math.floor((c.now() + INVITE_TTL_MS) / 1000);
  await c.db
    .prepare('INSERT INTO invites (token_hash, email, name, role, created_by, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(await sha256Hex(token), email, name, role, createdBy, expiresAt)
    .run();
  await writeAudit(c.db, c.now(), createdBy, 'invite.create', { email, role });
  return { token, expiresAt };
}

export async function createInvite(
  c: Ctx,
  actor: User,
  input: { email: string; name: string; role: Role },
): Promise<{ token: string; expiresAt: number }> {
  if (actor.role !== 'administrator' || !actor.active) throw new AuthError('forbidden', 403, 'Administrators only');
  return newInvite(c, actor.id, input);
}

/** Dipakai skrip provisioning (akses langsung ke DB), tidak pernah lewat HTTP. */
export function createBootstrapInvite(c: Ctx, input: { email: string; name: string }) {
  return newInvite(c, null, { ...input, role: 'administrator' });
}

export async function acceptInvite(
  c: Ctx,
  token: string,
  password: string,
): Promise<{ user: User; totpSecret: string; otpauth: string }> {
  const invalid = () => new AuthError('invalid_invite', 400, 'This invitation is invalid or has expired');
  if (typeof token !== 'string' || token.length < 20) throw invalid();
  const tokenHash = await sha256Hex(token);
  const inv = await c.db
    .prepare('SELECT id, email, name, role, expires_at, used_at FROM invites WHERE token_hash = ?')
    .bind(tokenHash)
    .first<{ id: number; email: string; name: string; role: Role; expires_at: number; used_at: number | null }>();
  const nowS = Math.floor(c.now() / 1000);
  if (!inv || inv.used_at !== null || inv.expires_at <= nowS) throw invalid();
  assertStrongPassword(password, inv);

  const claim = await c.db
    .prepare('UPDATE invites SET used_at = ? WHERE id = ? AND used_at IS NULL')
    .bind(nowS, inv.id)
    .run();
  if (claim.meta.changes !== 1) throw invalid();

  const totpSecret = generateTotpSecret();
  try {
    const r = await c.db
      .prepare(
        'INSERT INTO users (email, name, role, password_hash, totp_secret_enc, totp_confirmed, active, created_at) VALUES (?, ?, ?, ?, ?, 0, 1, ?)',
      )
      .bind(inv.email, inv.name, inv.role, await hashPassword(password), await encryptSecret(totpSecret, c.key), nowS)
      .run();
    await writeAudit(c.db, c.now(), r.meta.last_row_id, 'invite.accept', { email: inv.email });
    const user = await getUserById(c, r.meta.last_row_id);
    return { user: user!, totpSecret, otpauth: otpauthUri(inv.email, totpSecret) };
  } catch (e) {
    await c.db.prepare('UPDATE invites SET used_at = NULL WHERE id = ?').bind(inv.id).run();
    throw new AuthError('email_taken', 409, 'A user with this email already exists');
  }
}

export async function getUserById(c: Ctx, id: number): Promise<User | null> {
  const r = await c.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>();
  return r ? toUser(r) : null;
}

// ---- 2FA enrolment ------------------------------------------------------------------------------

const normalizeRecovery = (code: string) => code.toLowerCase().replace(/[^a-z0-9]/g, '');

function newRecoveryCode(): string {
  const b = crypto.getRandomValues(new Uint8Array(6));
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}`;
}

export async function confirmTotpEnrollment(
  c: Ctx,
  input: { email: string; password: string; code: string },
): Promise<{ recoveryCodes: string[] }> {
  const email = String(input.email).toLowerCase();
  await assertNotLimited(c, [[`totp:${email}`, MAX_ATTEMPTS]]);
  const row = await c.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  if (!row || row.active !== 1 || row.totp_confirmed === 1 || !row.totp_secret_enc || !(await verifyPassword(input.password, row.password_hash))) {
    await recordFailure(c, [`totp:${email}`]);
    throw INVALID();
  }
  const step = await verifyTotp(await decryptSecret(row.totp_secret_enc, c.key), String(input.code), c.now());
  if (step === null) {
    await recordFailure(c, [`totp:${email}`]);
    throw new AuthError('invalid_code', 400, 'The code is incorrect');
  }
  const codes = Array.from({ length: 8 }, newRecoveryCode);
  await c.db.prepare('UPDATE users SET totp_confirmed = 1, totp_last_step = ? WHERE id = ?').bind(step, row.id).run();
  await c.db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').bind(row.id).run();
  for (const code of codes) {
    await c.db
      .prepare('INSERT INTO recovery_codes (user_id, code_hash) VALUES (?, ?)')
      .bind(row.id, await sha256Hex(normalizeRecovery(code)))
      .run();
  }
  await writeAudit(c.db, c.now(), row.id, 'totp.enrol');
  return { recoveryCodes: codes };
}

// ---- login / sessions ---------------------------------------------------------------------------

let dummyHash: Promise<string> | undefined;

export interface SessionInfo {
  token: string;
  csrf: string;
  sessionId: number;
  user: User;
}

export async function login(
  c: Ctx,
  input: { email: string; password: string; code?: string; recoveryCode?: string },
  req: { ip: string },
): Promise<SessionInfo> {
  const email = String(input.email ?? '').toLowerCase();
  const keys = loginKeys(email, req.ip);
  await assertNotLimited(c, [[keys[0], MAX_ATTEMPTS], [keys[1], MAX_ATTEMPTS_PER_IP]]);

  const row = await c.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>();
  // Selalu menghitung hash agar waktu respons tidak membedakan email yang ada dan tidak ada.
  const passwordOk = await verifyPassword(String(input.password ?? ''), row?.password_hash ?? (await (dummyHash ??= hashPassword('dummy-password-for-timing'))));
  const fail = async (reason: string): Promise<never> => {
    await recordFailure(c, keys);
    await writeAudit(c.db, c.now(), row?.id ?? null, 'login.fail', { reason });
    throw INVALID();
  };
  if (!row || !passwordOk || row.active !== 1 || row.totp_confirmed !== 1 || !row.totp_secret_enc) return fail('credentials');

  let step: number | null = null;
  if (input.code) {
    step = await verifyTotp(await decryptSecret(row.totp_secret_enc, c.key), input.code, c.now());
    if (step === null || (row.totp_last_step !== null && step <= row.totp_last_step)) return fail('totp');
  } else if (input.recoveryCode) {
    const used = await c.db
      .prepare('UPDATE recovery_codes SET used_at = ? WHERE user_id = ? AND code_hash = ? AND used_at IS NULL')
      .bind(Math.floor(c.now() / 1000), row.id, await sha256Hex(normalizeRecovery(input.recoveryCode)))
      .run();
    if (used.meta.changes !== 1) return fail('recovery');
  } else {
    return fail('no_second_factor');
  }

  const nowS = Math.floor(c.now() / 1000);
  await c.db.prepare('DELETE FROM login_attempts WHERE key = ?').bind(keys[0]).run();
  if (step !== null) await c.db.prepare('UPDATE users SET last_login_at = ?, totp_last_step = ? WHERE id = ?').bind(nowS, step, row.id).run();
  else await c.db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(nowS, row.id).run();

  const token = randomToken();
  const csrf = randomToken(24);
  const r = await c.db
    .prepare('INSERT INTO sessions (token_hash, user_id, csrf_token, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(await sha256Hex(token), row.id, csrf, nowS, nowS, Math.floor((c.now() + SESSION_ABSOLUTE_MS) / 1000))
    .run();
  await writeAudit(c.db, c.now(), row.id, 'login.ok', { method: step !== null ? 'totp' : 'recovery' });
  return { token, csrf, sessionId: r.meta.last_row_id, user: toUser({ ...row, last_login_at: nowS }) };
}

export async function getSession(
  c: Ctx,
  token: string,
): Promise<{ user: User; csrf: string; sessionId: number } | null> {
  if (typeof token !== 'string' || token.length < 20) return null;
  const r = await c.db
    .prepare(
      `SELECT s.id AS sid, s.csrf_token, s.last_seen_at, s.expires_at, s.revoked_at, u.*
       FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    )
    .bind(await sha256Hex(token))
    .first<UserRow & { sid: number; csrf_token: string; last_seen_at: number; expires_at: number; revoked_at: number | null }>();
  if (!r || r.revoked_at !== null || r.active !== 1) return null;
  const now = c.now();
  if (r.expires_at * 1000 <= now || r.last_seen_at * 1000 + SESSION_IDLE_MS <= now) return null;
  if (now - r.last_seen_at * 1000 > TOUCH_AFTER_MS) {
    await c.db.prepare('UPDATE sessions SET last_seen_at = ? WHERE id = ?').bind(Math.floor(now / 1000), r.sid).run();
  }
  return { user: toUser(r), csrf: r.csrf_token, sessionId: r.sid };
}

export async function logout(c: Ctx, token: string): Promise<void> {
  await c.db
    .prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
    .bind(Math.floor(c.now() / 1000), await sha256Hex(token))
    .run();
}

export async function revokeAllSessions(c: Ctx, userId: number, exceptSessionId?: number): Promise<void> {
  await c.db
    .prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND id <> ? AND revoked_at IS NULL')
    .bind(Math.floor(c.now() / 1000), userId, exceptSessionId ?? -1)
    .run();
}

export async function changePassword(
  c: Ctx,
  userId: number,
  currentSessionId: number,
  current: string,
  next: string,
): Promise<void> {
  const row = await c.db.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first<UserRow>();
  if (!row || !(await verifyPassword(current, row.password_hash))) throw INVALID();
  assertStrongPassword(next, row);
  await c.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').bind(await hashPassword(next), userId).run();
  await revokeAllSessions(c, userId, currentSessionId);
  await writeAudit(c.db, c.now(), userId, 'password.change');
}
