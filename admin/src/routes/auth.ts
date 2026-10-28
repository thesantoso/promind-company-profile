import { Hono } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';
import {
  acceptInvite, beginTotpEnrollment, changePassword, confirmTotpEnrollment, login, logout,
} from '../auth';
import { csrfCheck, ctxOf, requireSession, SESSION_COOKIE, type AppEnv } from '../middleware';

export const authRoutes = new Hono<AppEnv>();

async function body<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S> | null> {
  try {
    const parsed = schema.safeParse(await req.json());
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
const bad = (c: { json: (b: unknown, s: 400) => Response }) => c.json({ error: 'bad_request' }, 400);

authRoutes.post('/invite/accept', async (c) => {
  const b = await body(c.req.raw, z.object({ token: z.string().min(20).max(200), password: z.string().max(200) }));
  if (!b) return bad(c);
  const r = await acceptInvite(ctxOf(c.env), b.token, b.password);
  return c.json({ email: r.user.email, name: r.user.name, totpSecret: r.totpSecret, otpauth: r.otpauth });
});

authRoutes.post('/totp/begin', async (c) => {
  const b = await body(c.req.raw, z.object({ email: z.string().max(254), password: z.string().max(200) }));
  if (!b) return bad(c);
  return c.json(await beginTotpEnrollment(ctxOf(c.env), b));
});

authRoutes.post('/totp/confirm', async (c) => {
  const b = await body(c.req.raw, z.object({ email: z.string().max(254), password: z.string().max(200), code: z.string().max(10) }));
  if (!b) return bad(c);
  return c.json(await confirmTotpEnrollment(ctxOf(c.env), b));
});

authRoutes.post('/login', async (c) => {
  const b = await body(
    c.req.raw,
    z.object({
      email: z.string().max(254),
      password: z.string().max(200),
      code: z.string().max(10).optional(),
      recoveryCode: z.string().max(40).optional(),
    }),
  );
  if (!b) return bad(c);
  const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
  const s = await login(ctxOf(c.env), b, { ip });
  setCookie(c, SESSION_COOKIE, s.token, { prefix: 'host', httpOnly: true, sameSite: 'Strict', maxAge: 12 * 3600 });
  return c.json({ user: s.user, csrf: s.csrf });
});

authRoutes.get('/session', requireSession, (c) => {
  const s = c.get('session');
  return c.json({ user: s.user, csrf: s.csrf });
});

authRoutes.post('/logout', requireSession, csrfCheck, async (c) => {
  await logout(ctxOf(c.env), c.get('session').token);
  deleteCookie(c, SESSION_COOKIE, { prefix: 'host', path: '/', secure: true });
  return c.json({ ok: true });
});

authRoutes.post('/password', requireSession, csrfCheck, async (c) => {
  const b = await body(c.req.raw, z.object({ current: z.string().max(200), next: z.string().max(200) }));
  if (!b) return bad(c);
  const s = c.get('session');
  await changePassword(ctxOf(c.env), s.user.id, s.sessionId, b.current, b.next);
  return c.json({ ok: true });
});
