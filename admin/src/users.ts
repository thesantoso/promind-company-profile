import { z } from 'zod';
import { AuthError, getUserById, inputSchemas, revokeAllSessions, type Ctx, type User } from './auth';
import { encryptSecret } from './crypto';
import { writeAudit } from './db';
import { generateTotpSecret } from './totp';

function assertAdmin(actor: User): void {
  if (actor.role !== 'administrator' || !actor.active) throw new AuthError('forbidden', 403, 'Administrators only');
}

export const patchSchema = z
  .object({ name: inputSchemas.name.optional(), role: inputSchemas.role.optional(), active: z.boolean().optional() })
  .strict();

export async function listUsers(c: Ctx, actor: User): Promise<User[]> {
  assertAdmin(actor);
  const { results } = await c.db.prepare('SELECT id FROM users ORDER BY id').all<{ id: number }>();
  const users: User[] = [];
  for (const r of results) users.push((await getUserById(c, r.id))!);
  return users;
}

async function target(c: Ctx, id: number): Promise<User> {
  const u = await getUserById(c, id);
  if (!u) throw new AuthError('not_found', 404, 'User not found');
  return u;
}

export async function updateUser(c: Ctx, actor: User, id: number, patch: z.infer<typeof patchSchema>): Promise<User> {
  assertAdmin(actor);
  const u = await target(c, id);
  const demoting = patch.role === 'editor' && u.role === 'administrator';
  const deactivating = patch.active === false && u.active;
  if (u.role === 'administrator' && u.active && (demoting || deactivating)) {
    const others = await c.db
      .prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'administrator' AND active = 1 AND id <> ?")
      .bind(id)
      .first<{ n: number }>();
    if ((others?.n ?? 0) === 0) {
      throw new AuthError('last_administrator', 409, 'There must always be at least one active administrator');
    }
  }
  const next = {
    name: patch.name ?? u.name,
    role: patch.role ?? u.role,
    active: patch.active ?? u.active,
  };
  await c.db
    .prepare('UPDATE users SET name = ?, role = ?, active = ? WHERE id = ?')
    .bind(next.name, next.role, next.active ? 1 : 0, id)
    .run();
  if (!next.active) await revokeAllSessions(c, id);
  await writeAudit(c.db, c.now(), actor.id, 'user.update', { target: id, email: u.email, patch });
  return (await getUserById(c, id))!;
}

export async function resetTwoFactor(c: Ctx, actor: User, id: number): Promise<void> {
  assertAdmin(actor);
  const u = await target(c, id);
  await c.db
    .prepare('UPDATE users SET totp_secret_enc = ?, totp_confirmed = 0, totp_last_step = NULL WHERE id = ?')
    .bind(await encryptSecret(generateTotpSecret(), c.key), id)
    .run();
  await c.db.prepare('DELETE FROM recovery_codes WHERE user_id = ?').bind(id).run();
  await revokeAllSessions(c, id);
  await writeAudit(c.db, c.now(), actor.id, 'user.reset_2fa', { target: id, email: u.email });
}

export async function revokeUserSessions(c: Ctx, actor: User, id: number): Promise<void> {
  assertAdmin(actor);
  const u = await target(c, id);
  await revokeAllSessions(c, id);
  await writeAudit(c.db, c.now(), actor.id, 'user.revoke_sessions', { target: id, email: u.email });
}

export interface AuditEntry {
  id: number;
  ts: number;
  action: string;
  detail: unknown;
  userId: number | null;
  userName: string | null;
}

export async function listAudit(c: Ctx, actor: User, opts: { limit?: number; before?: number } = {}): Promise<AuditEntry[]> {
  assertAdmin(actor);
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const { results } = await c.db
    .prepare(
      `SELECT a.id, a.ts, a.action, a.detail, a.user_id, u.name AS user_name
       FROM audit_log a LEFT JOIN users u ON u.id = a.user_id
       WHERE (? IS NULL OR a.id < ?) ORDER BY a.id DESC LIMIT ?`,
    )
    .bind(opts.before ?? null, opts.before ?? null, limit)
    .all<{ id: number; ts: number; action: string; detail: string | null; user_id: number | null; user_name: string | null }>();
  return results.map((r) => ({
    id: r.id, ts: r.ts, action: r.action, detail: r.detail ? JSON.parse(r.detail) : null, userId: r.user_id, userName: r.user_name,
  }));
}
