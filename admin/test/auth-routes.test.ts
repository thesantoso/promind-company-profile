import { describe, expect, test } from 'vitest';
import { createApp } from '../src/worker';
import type { Env } from '../src/env';
import { createTestDb } from './support/d1';
import { KEY, makeCtx, seedUser } from './support/auth';
import { totpCode } from '../src/totp';

const ORIGIN = 'https://admin.promind.co.id';

function setup() {
  const db = createTestDb();
  const c = makeCtx(db);
  const env = { DB: db, ENCRYPTION_KEY: KEY, ADMIN_ORIGIN: ORIGIN } as unknown as Env;
  const app = createApp();
  const call = (path: string, init: RequestInit & { origin?: string | null } = {}) => {
    const headers = new Headers(init.headers);
    if (init.origin !== null) headers.set('Origin', init.origin ?? ORIGIN);
    if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return app.request(`https://admin.promind.co.id${path}`, { ...init, headers }, env);
  };
  return { db, c, env, call };
}

async function loginViaHttp(s: ReturnType<typeof setup>) {
  const u = await seedUser(s.c);
  const res = await s.call('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: u.email, password: u.password, code: await totpCode(u.totpSecret, Date.now()) }),
  });
  return { u, res };
}

describe('login endpoint', () => {
  test('sets a __Host- session cookie that is HttpOnly, Secure and SameSite=Strict', async () => {
    const s = setup();
    const { res } = await loginViaHttp(s);
    expect(res.status).toBe(200);
    const cookie = res.headers.get('set-cookie')!;
    expect(cookie).toMatch(/^__Host-promind_session=[A-Za-z0-9_-]{43};/);
    for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) expect(cookie).toContain(flag);
    expect(cookie).not.toMatch(/Domain=/i);
    const body = (await res.json()) as { csrf: string; user: { email: string } };
    expect(body.csrf).toBeTruthy();
    expect(JSON.stringify(body)).not.toContain('password');
  });

  test('wrong credentials give 401 with a uniform body and no cookie', async () => {
    const s = setup();
    const res = await s.call('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'x@promind.co.id', password: 'salah-salah-salah', code: '123456' }) });
    expect(res.status).toBe(401);
    expect(res.headers.get('set-cookie')).toBeNull();
    expect(await res.json()).toEqual({ error: 'invalid_credentials' });
  });

  test('a foreign or missing Origin is refused (login CSRF)', async () => {
    const s = setup();
    const body = JSON.stringify({ email: 'x@promind.co.id', password: 'salah-salah-salah', code: '123456' });
    expect((await s.call('/api/auth/login', { method: 'POST', body, origin: 'https://evil.example' })).status).toBe(403);
    expect((await s.call('/api/auth/login', { method: 'POST', body, origin: null })).status).toBe(403);
  });

  test('malformed bodies are a 400, not a crash', async () => {
    const s = setup();
    expect((await s.call('/api/auth/login', { method: 'POST', body: '{"email":5}' })).status).toBe(400);
    expect((await s.call('/api/auth/login', { method: 'POST', body: 'not json' })).status).toBe(400);
  });
});

describe('session and CSRF', () => {
  test('GET /session needs the cookie and returns the CSRF token', async () => {
    const s = setup();
    expect((await s.call('/api/auth/session')).status).toBe(401);
    const { res } = await loginViaHttp(s);
    const cookie = res.headers.get('set-cookie')!.split(';')[0]!;
    const me = await s.call('/api/auth/session', { headers: { Cookie: cookie } });
    expect(me.status).toBe(200);
    expect(((await me.json()) as { csrf: string }).csrf).toBeTruthy();
  });

  test('mutations need the matching X-CSRF-Token and the admin Origin', async () => {
    const s = setup();
    const { res } = await loginViaHttp(s);
    const cookie = res.headers.get('set-cookie')!.split(';')[0]!;
    const csrf = ((await res.json()) as { csrf: string }).csrf;
    const base = { method: 'POST', headers: { Cookie: cookie } } as const;
    expect((await s.call('/api/auth/logout', base)).status).toBe(403);
    expect((await s.call('/api/auth/logout', { ...base, headers: { Cookie: cookie, 'X-CSRF-Token': 'salah' } })).status).toBe(403);
    expect((await s.call('/api/auth/logout', { ...base, headers: { Cookie: cookie, 'X-CSRF-Token': csrf }, origin: 'https://evil.example' })).status).toBe(403);
    const ok = await s.call('/api/auth/logout', { ...base, headers: { Cookie: cookie, 'X-CSRF-Token': csrf } });
    expect(ok.status).toBe(200);
    expect(ok.headers.get('set-cookie')).toMatch(/Max-Age=0/);
    expect((await s.call('/api/auth/session', { headers: { Cookie: cookie } })).status).toBe(401);
  });

  test('responses are not cacheable and carry security headers', async () => {
    const s = setup();
    const res = await s.call('/api/auth/session');
    expect(res.headers.get('cache-control')).toContain('no-store');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
  });
});
