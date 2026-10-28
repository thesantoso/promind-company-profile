import { describe, expect, test } from 'vitest';
import {
  AuthError, acceptInvite, changePassword, confirmTotpEnrollment, createBootstrapInvite, createInvite, getSession, login,
  logout, revokeAllSessions,
} from '../src/auth';
import { totpCode } from '../src/totp';
import { createTestDb } from './support/d1';
import { codeNow, makeCtx, seedUser } from './support/auth';

const IP = { ip: '203.0.113.9' };
const HOUR = 3_600_000;

async function failure(p: Promise<unknown>): Promise<AuthError> {
  try {
    await p;
  } catch (e) {
    if (e instanceof AuthError) return e;
    throw e;
  }
  throw new Error('expected AuthError');
}

describe('login', () => {
  test('succeeds with password and a current TOTP code, and the session is readable', async () => {
    const c = makeCtx();
    const u = await seedUser(c);
    const s = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
    expect(s.user.email).toBe(u.email);
    expect(s.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const got = await getSession(c, s.token);
    expect(got?.user.id).toBe(u.id);
    expect(got?.csrf).toBe(s.csrf);
  });

  test('right password with a wrong or missing TOTP code creates no session', async () => {
    const c = makeCtx();
    const u = await seedUser(c);
    for (const code of ['000000', '', undefined]) {
      const e = await failure(login(c, { email: u.email, password: u.password, code }, IP));
      expect(e.code).toBe('invalid_credentials');
    }
    expect((await c.db.prepare('SELECT COUNT(*) AS n FROM sessions').first<{ n: number }>())!.n).toBe(0);
  });

  test('the same error for an unknown email and a wrong password', async () => {
    const c = makeCtx();
    const u = await seedUser(c);
    const a = await failure(login(c, { email: 'nobody@promind.co.id', password: 'x'.repeat(14), code: '123456' }, IP));
    const b = await failure(login(c, { email: u.email, password: 'salah-salah-salah', code: await codeNow(u, c) }, IP));
    expect([a.code, a.status, a.message]).toEqual([b.code, b.status, b.message]);
  });

  test('a deactivated user or one who has not confirmed 2FA cannot log in', async () => {
    const c = makeCtx();
    const off = await seedUser(c, { email: 'off@promind.co.id', active: 0 });
    const pending = await seedUser(c, { email: 'pending@promind.co.id', confirmed: 0 });
    for (const u of [off, pending]) {
      const e = await failure(login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP));
      expect(e.code).toBe('invalid_credentials');
    }
  });

  test('the sixth attempt within 15 minutes is rate limited even with correct credentials', async () => {
    const c = makeCtx();
    const u = await seedUser(c);
    for (let i = 0; i < 5; i++) {
      const e = await failure(login(c, { email: u.email, password: 'salah-salah-salah', code: '000000' }, IP));
      expect(e.code).toBe('invalid_credentials');
    }
    const limited = await failure(login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP));
    expect(limited.code).toBe('rate_limited');
    expect(limited.status).toBe(429);
    expect(limited.retryAfter).toBeGreaterThan(0);
    c.advance(16 * 60_000);
    const ok = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
    expect(ok.token).toBeTruthy();
  });

  test('a TOTP code cannot be used twice', async () => {
    const c = makeCtx();
    const u = await seedUser(c);
    const code = await codeNow(u, c);
    await login(c, { email: u.email, password: u.password, code }, IP);
    const again = await failure(login(c, { email: u.email, password: u.password, code }, IP));
    expect(again.code).toBe('invalid_credentials');
    c.advance(31_000);
    await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
  });

  test('a recovery code works exactly once', async () => {
    const c = makeCtx();
    const u = await seedUser(c);
    // pendaftaran melalui confirmTotpEnrollment menghasilkan kode pemulihan
    await c.db.prepare('UPDATE users SET totp_confirmed = 0 WHERE id = ?').bind(u.id).run();
    const { recoveryCodes } = await confirmTotpEnrollment(c, { email: u.email, password: u.password, code: await codeNow(u, c) });
    expect(recoveryCodes).toHaveLength(8);
    const first = await login(c, { email: u.email, password: u.password, recoveryCode: recoveryCodes[0] }, IP);
    expect(first.token).toBeTruthy();
    const second = await failure(login(c, { email: u.email, password: u.password, recoveryCode: recoveryCodes[0] }, IP));
    expect(second.code).toBe('invalid_credentials');
  });
});

describe('sessions', () => {
  async function session() {
    const c = makeCtx();
    const u = await seedUser(c);
    const s = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
    return { c, u, s };
  }

  test('expire after 12 hours even when used continuously', async () => {
    const { c, s } = await session();
    for (let h = 1; h <= 11; h++) {
      c.advance(HOUR);
      expect(await getSession(c, s.token), `hour ${h}`).not.toBeNull();
    }
    c.advance(1.5 * HOUR);
    expect(await getSession(c, s.token)).toBeNull();
  });

  test('expire after 2 hours without activity', async () => {
    const { c, s } = await session();
    c.advance(2 * HOUR + 60_000);
    expect(await getSession(c, s.token)).toBeNull();
  });

  test('activity keeps an idle session alive', async () => {
    const { c, s } = await session();
    for (let i = 0; i < 4; i++) {
      c.advance(1.5 * HOUR);
      expect(await getSession(c, s.token), `step ${i}`).not.toBeNull();
    }
  });

  test('logout and revoke-all end the session immediately', async () => {
    const { c, u, s } = await session();
    await logout(c, s.token);
    expect(await getSession(c, s.token)).toBeNull();
    c.advance(31_000);
    const s2 = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
    await revokeAllSessions(c, u.id);
    expect(await getSession(c, s2.token)).toBeNull();
  });

  test('a user deactivated after login loses the session', async () => {
    const { c, u, s } = await session();
    await c.db.prepare('UPDATE users SET active = 0 WHERE id = ?').bind(u.id).run();
    expect(await getSession(c, s.token)).toBeNull();
  });

  test('a made-up token is rejected', async () => {
    const { c } = await session();
    expect(await getSession(c, 'x'.repeat(43))).toBeNull();
    expect(await getSession(c, '')).toBeNull();
  });
});

describe('invites', () => {
  test('full flow: invite -> accept -> enrol 2FA -> login', async () => {
    const c = makeCtx();
    const admin = await seedUser(c);
    const actor = (await getUser(c, admin.id))!;
    const { token } = await createInvite(c, actor, { email: 'Sari@Promind.co.id', name: 'Sari', role: 'editor' });
    const acc = await acceptInvite(c, token, 'Kata-Sandi-Baru-2026');
    expect(acc.user.role).toBe('editor');
    expect(acc.otpauth).toContain(acc.totpSecret);
    // belum bisa login sebelum 2FA dikonfirmasi
    const early = await failure(login(c, { email: 'sari@promind.co.id', password: 'Kata-Sandi-Baru-2026', code: await totpCode(acc.totpSecret, c.now()) }, IP));
    expect(early.code).toBe('invalid_credentials');
    const wrong = await failure(confirmTotpEnrollment(c, { email: 'sari@promind.co.id', password: 'Kata-Sandi-Baru-2026', code: '000000' }));
    expect(wrong.code).toBe('invalid_code');
    await confirmTotpEnrollment(c, { email: 'sari@promind.co.id', password: 'Kata-Sandi-Baru-2026', code: await totpCode(acc.totpSecret, c.now()) });
    c.advance(31_000);
    const s = await login(c, { email: 'sari@promind.co.id', password: 'Kata-Sandi-Baru-2026', code: await totpCode(acc.totpSecret, c.now()) }, IP);
    expect(s.user.name).toBe('Sari');
  });

  test('only administrators can invite', async () => {
    const c = makeCtx();
    const ed = await seedUser(c, { email: 'ed@promind.co.id', role: 'editor' });
    const e = await failure(createInvite(c, (await getUser(c, ed.id))!, { email: 'x@promind.co.id', name: 'X', role: 'editor' }));
    expect(e.code).toBe('forbidden');
  });

  test('an invite for an existing email is refused', async () => {
    const c = makeCtx();
    const a = await seedUser(c);
    const e = await failure(createInvite(c, (await getUser(c, a.id))!, { email: 'RIZKY@promind.co.id', name: 'Dobel', role: 'editor' }));
    expect(e.code).toBe('email_taken');
  });

  test('expired, reused or wrong tokens create no account', async () => {
    const c = makeCtx();
    const a = await seedUser(c);
    const actor = (await getUser(c, a.id))!;
    const { token } = await createInvite(c, actor, { email: 'late@promind.co.id', name: 'Late', role: 'editor' });
    c.advance(73 * HOUR);
    expect((await failure(acceptInvite(c, token, 'Kata-Sandi-Baru-2026'))).code).toBe('invalid_invite');
    expect((await failure(acceptInvite(c, 'salah'.repeat(9), 'Kata-Sandi-Baru-2026'))).code).toBe('invalid_invite');
    c.clock.t -= 73 * HOUR;
    await acceptInvite(c, token, 'Kata-Sandi-Baru-2026');
    expect((await failure(acceptInvite(c, token, 'Kata-Sandi-Baru-2026'))).code).toBe('invalid_invite');
    const n = await c.db.prepare("SELECT COUNT(*) AS n FROM users WHERE email = 'late@promind.co.id'").first<{ n: number }>();
    expect(n!.n).toBe(1);
  });

  test('weak passwords are refused and the invite stays usable', async () => {
    const c = makeCtx();
    const a = await seedUser(c);
    const { token } = await createInvite(c, (await getUser(c, a.id))!, { email: 'budi.santoso@promind.co.id', name: 'Budi Santoso', role: 'editor' });
    for (const pw of ['pendek', 'budi.santoso', 'Budi Santoso', 'aaaaaaaaaaaa'.slice(0, 11)]) {
      expect((await failure(acceptInvite(c, token, pw))).code, pw).toBe('weak_password');
    }
    await acceptInvite(c, token, 'Kata-Sandi-Baru-2026');
  });

  test('bootstrap invite can create the first administrator without an actor', async () => {
    const c = makeCtx(createTestDb());
    const { token } = await createBootstrapInvite(c, { email: 'rizky@promind.co.id', name: 'Rizky' });
    const acc = await acceptInvite(c, token, 'Kata-Sandi-Baru-2026');
    expect(acc.user.role).toBe('administrator');
  });

  test('tokens and recovery codes are never stored in plaintext', async () => {
    const c = makeCtx();
    const a = await seedUser(c);
    const { token } = await createInvite(c, (await getUser(c, a.id))!, { email: 'x1@promind.co.id', name: 'X1', role: 'editor' });
    const acc = await acceptInvite(c, token, 'Kata-Sandi-Baru-2026');
    const { recoveryCodes } = await confirmTotpEnrollment(c, { email: 'x1@promind.co.id', password: 'Kata-Sandi-Baru-2026', code: await totpCode(acc.totpSecret, c.now()) });
    c.advance(31_000);
    const s = await login(c, { email: 'x1@promind.co.id', password: 'Kata-Sandi-Baru-2026', code: await totpCode(acc.totpSecret, c.now()) }, IP);
    const dump = JSON.stringify(
      await Promise.all(['users', 'invites', 'sessions', 'recovery_codes'].map(async (t) => (await c.db.prepare(`SELECT * FROM ${t}`).all()).results)),
    );
    for (const secret of [token, s.token, acc.totpSecret, 'Kata-Sandi-Baru-2026', ...recoveryCodes]) {
      expect(dump.includes(secret), secret.slice(0, 6)).toBe(false);
    }
  });
});

describe('changePassword', () => {
  test('requires the current password, enforces the policy, and ends other sessions', async () => {
    const c = makeCtx();
    const u = await seedUser(c);
    const s1 = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
    c.advance(31_000);
    const s2 = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
    expect((await failure(changePassword(c, u.id, s2.sessionId, 'salah-salah-salah', 'Password-Baru-2026-xx'))).code).toBe('invalid_credentials');
    expect((await failure(changePassword(c, u.id, s2.sessionId, u.password, 'pendek'))).code).toBe('weak_password');
    await changePassword(c, u.id, s2.sessionId, u.password, 'Password-Baru-2026-xx');
    expect(await getSession(c, s1.token)).toBeNull();
    expect(await getSession(c, s2.token)).not.toBeNull();
    c.advance(31_000);
    await login(c, { email: u.email, password: 'Password-Baru-2026-xx', code: await codeNow(u, c) }, IP);
  });
});

async function getUser(c: { db: D1Database }, id: number) {
  const r = await c.db.prepare('SELECT id, email, name, role, active FROM users WHERE id = ?').bind(id).first<{ id: number; email: string; name: string; role: 'administrator' | 'editor'; active: number }>();
  return r ? { id: r.id, email: r.email, name: r.name, role: r.role, active: r.active === 1, totpConfirmed: true, createdAt: 0, lastLoginAt: null } : null;
}
