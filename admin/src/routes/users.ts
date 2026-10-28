import { Hono } from 'hono';
import { z } from 'zod';
import { AuthError, createInvite, inputSchemas } from '../auth';
import { csrfCheck, ctxOf, requireRole, requireSession, type AppEnv } from '../middleware';
import { listAudit, listUsers, patchSchema, resetTwoFactor, revokeUserSessions, updateUser } from '../users';

export const usersRoutes = new Hono<AppEnv>();
usersRoutes.use('*', requireSession, csrfCheck, requireRole('administrator'));

const idOf = (raw: string): number => {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) throw new AuthError('not_found', 404);
  return id;
};

usersRoutes.get('/', async (c) => c.json({ users: await listUsers(ctxOf(c.env), c.get('session').user) }));

usersRoutes.post('/invite', async (c) => {
  const parsed = z
    .object({ email: inputSchemas.email, name: inputSchemas.name, role: inputSchemas.role })
    .safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request' }, 400);
  const r = await createInvite(ctxOf(c.env), c.get('session').user, parsed.data);
  return c.json({ email: parsed.data.email.toLowerCase(), expiresAt: r.expiresAt, link: `${c.env.ADMIN_ORIGIN}/accept#token=${r.token}` });
});

usersRoutes.patch('/:id', async (c) => {
  const parsed = patchSchema.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request' }, 400);
  return c.json({ user: await updateUser(ctxOf(c.env), c.get('session').user, idOf(c.req.param('id')), parsed.data) });
});

usersRoutes.post('/:id/reset-2fa', async (c) => {
  await resetTwoFactor(ctxOf(c.env), c.get('session').user, idOf(c.req.param('id')));
  return c.json({ ok: true });
});

usersRoutes.post('/:id/revoke-sessions', async (c) => {
  await revokeUserSessions(ctxOf(c.env), c.get('session').user, idOf(c.req.param('id')));
  return c.json({ ok: true });
});

export const auditRoutes = new Hono<AppEnv>();
auditRoutes.use('*', requireSession, csrfCheck, requireRole('administrator'));
auditRoutes.get('/', async (c) => {
  const limit = Number(c.req.query('limit') ?? 50);
  const before = c.req.query('before') ? Number(c.req.query('before')) : undefined;
  return c.json({ entries: await listAudit(ctxOf(c.env), c.get('session').user, { limit, before }) });
});
