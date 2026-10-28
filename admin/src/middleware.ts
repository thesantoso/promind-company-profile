import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { getSession, type Ctx, type Role, type User } from './auth';
import { timingSafeEqual } from './crypto';
import type { Env } from './env';

export const SESSION_COOKIE = 'promind_session';

export type AppEnv = {
  Bindings: Env;
  Variables: { session: { user: User; csrf: string; sessionId: number; token: string }; fetchImpl: typeof fetch };
};

export const ctxOf = (env: Env): Ctx => ({ db: env.DB, key: env.ENCRYPTION_KEY, now: Date.now });

export const securityHeaders = createMiddleware<AppEnv>(async (c, next) => {
  await next();
  c.res.headers.set('Cache-Control', 'no-store');
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('Referrer-Policy', 'no-referrer');
});

const SAFE = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Menolak mutasi yang tidak berasal dari origin admin (melindungi login CSRF dan semua mutasi). */
export const originCheck = createMiddleware<AppEnv>(async (c, next) => {
  if (!SAFE.has(c.req.method) && c.req.header('Origin') !== c.env.ADMIN_ORIGIN) {
    return c.json({ error: 'bad_origin' }, 403);
  }
  await next();
});

export const requireSession = createMiddleware<AppEnv>(async (c, next) => {
  const token = getCookie(c, SESSION_COOKIE, 'host') ?? '';
  const s = await getSession(ctxOf(c.env), token);
  if (!s) return c.json({ error: 'unauthenticated' }, 401);
  c.set('session', { ...s, token });
  await next();
});

export const csrfCheck = createMiddleware<AppEnv>(async (c, next) => {
  if (!SAFE.has(c.req.method)) {
    const header = c.req.header('X-CSRF-Token') ?? '';
    if (!timingSafeEqual(header, c.get('session').csrf)) return c.json({ error: 'bad_csrf' }, 403);
  }
  await next();
});

export const requireRole = (role: Role) =>
  createMiddleware<AppEnv>(async (c, next) => {
    if (c.get('session').user.role !== role) return c.json({ error: 'forbidden' }, 403);
    await next();
  });
