import { describe, expect, test } from 'vitest';
import { login } from '../src/auth';
import type { Env } from '../src/env';
import { createApp } from '../src/worker';
import { totpCode } from '../src/totp';
import { createTestDb } from './support/d1';
import { KEY, codeNow, makeCtx, seedUser, type SeedUser } from './support/auth';

const ORIGIN = 'https://admin.promind.co.id';
const IP = { ip: '198.51.100.7' };

async function world() {
  const db = createTestDb();
  const c = makeCtx(db, Date.now());
  const env = { DB: db, ENCRYPTION_KEY: KEY, ADMIN_ORIGIN: ORIGIN } as unknown as Env;
  const app = createApp();
  const admin = await seedUser(c, { email: 'admin@promind.co.id', name: 'Admin', role: 'administrator' });
  const editor = await seedUser(c, { email: 'editor@promind.co.id', name: 'Editor', role: 'editor' });

  async function as(u: SeedUser) {
    const s = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, IP);
    c.advance(31_000);
    return (method: string, path: string, body?: unknown) =>
      app.request(
        `${ORIGIN}${path}`,
        {
          method,
          headers: {
            Cookie: `__Host-promind_session=${s.token}`,
            'X-CSRF-Token': s.csrf,
            Origin: ORIGIN,
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
        env,
      );
  }
  const anon = (method: string, path: string, body?: unknown) =>
    app.request(`${ORIGIN}${path}`, { method, headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }, env);
  return { db, c, env, app, admin, editor, as, anon };
}

const json = async (r: Response) => (await r.json()) as any;

describe('access control', () => {
  test('anonymous gets 401 and an editor gets 403 on every admin-only endpoint', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const calls: [string, string, unknown?][] = [
      ['GET', '/api/users'],
      ['POST', '/api/users/invite', { email: 'n@promind.co.id', name: 'N', role: 'editor' }],
      ['PATCH', '/api/users/1', { name: 'X' }],
      ['POST', '/api/users/1/reset-2fa'],
      ['POST', '/api/users/1/revoke-sessions'],
      ['GET', '/api/audit'],
    ];
    for (const [m, p, b] of calls) {
      expect((await w.anon(m, p, b)).status, `anon ${m} ${p}`).toBe(401);
      expect((await ed(m, p, b)).status, `editor ${m} ${p}`).toBe(403);
    }
  });

  test('the user list never exposes hashes or 2FA secrets', async () => {
    const w = await world();
    const ad = await w.as(w.admin);
    const res = await ad('GET', '/api/users');
    expect(res.status).toBe(200);
    const text = JSON.stringify(await res.json());
    expect(text).toContain('editor@promind.co.id');
    for (const leak of ['password', 'totp_secret', 'totpSecret', 'pbkdf2', 'v1.']) expect(text).not.toContain(leak);
  });
});

describe('last administrator protection', () => {
  test('the only administrator can neither be deactivated nor demoted', async () => {
    const w = await world();
    const ad = await w.as(w.admin);
    for (const patch of [{ active: false }, { role: 'editor' }]) {
      const r = await ad('PATCH', `/api/users/${w.admin.id}`, patch);
      expect(r.status).toBe(409);
      expect((await json(r)).error).toBe('last_administrator');
    }
  });

  test('with two administrators one can be demoted, and then the other is protected', async () => {
    const w = await world();
    const second = await seedUser(w.c, { email: 'admin2@promind.co.id', role: 'administrator' });
    const ad = await w.as(w.admin);
    expect((await ad('PATCH', `/api/users/${second.id}`, { role: 'editor' })).status).toBe(200);
    expect((await ad('PATCH', `/api/users/${w.admin.id}`, { role: 'editor' })).status).toBe(409);
  });

  test('an administrator can deactivate another administrator but not the last remaining one', async () => {
    const w = await world();
    const second = await seedUser(w.c, { email: 'admin2@promind.co.id', role: 'administrator' });
    const ad = await w.as(w.admin);
    expect((await ad('PATCH', `/api/users/${second.id}`, { active: false })).status).toBe(200);
    expect((await ad('PATCH', `/api/users/${w.admin.id}`, { active: false })).status).toBe(409);
  });
});

describe('editing users', () => {
  test('changes name and role, and rejects an invalid role or unknown user', async () => {
    const w = await world();
    const ad = await w.as(w.admin);
    const ok = await ad('PATCH', `/api/users/${w.editor.id}`, { name: 'Editor Baru', role: 'administrator' });
    expect(ok.status).toBe(200);
    expect((await json(ok)).user).toMatchObject({ name: 'Editor Baru', role: 'administrator' });
    expect((await ad('PATCH', `/api/users/${w.editor.id}`, { role: 'owner' })).status).toBe(400);
    expect((await ad('PATCH', '/api/users/9999', { name: 'X' })).status).toBe(404);
  });

  test('deactivating a user ends their sessions immediately', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const ad = await w.as(w.admin);
    expect((await ed('GET', '/api/auth/session')).status).toBe(200);
    await ad('PATCH', `/api/users/${w.editor.id}`, { active: false });
    expect((await ed('GET', '/api/auth/session')).status).toBe(401);
  });

  test('revoke-sessions logs the user out everywhere', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const ad = await w.as(w.admin);
    expect((await ad('POST', `/api/users/${w.editor.id}/revoke-sessions`)).status).toBe(200);
    expect((await ed('GET', '/api/auth/session')).status).toBe(401);
  });
});

describe('invites via the API', () => {
  test('returns a one-time link and refuses an existing email', async () => {
    const w = await world();
    const ad = await w.as(w.admin);
    const r = await ad('POST', '/api/users/invite', { email: 'baru@promind.co.id', name: 'Baru', role: 'editor' });
    expect(r.status).toBe(200);
    const b = await json(r);
    expect(b.link).toMatch(/^https:\/\/admin\.promind\.co\.id\/accept#token=[A-Za-z0-9_-]{43}$/);
    expect(b.expiresAt).toBeGreaterThan(Date.now() / 1000);
    const dup = await ad('POST', '/api/users/invite', { email: 'EDITOR@promind.co.id', name: 'Dobel', role: 'editor' });
    expect(dup.status).toBe(409);
    expect((await ad('POST', '/api/users/invite', { email: 'bukan-email', name: 'X', role: 'editor' })).status).toBe(400);
  });
});

describe('reset 2FA', () => {
  test('forces re-enrolment: sessions end, login fails until the new code is confirmed', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const ad = await w.as(w.admin);
    expect((await ad('POST', `/api/users/${w.editor.id}/reset-2fa`)).status).toBe(200);
    expect((await ed('GET', '/api/auth/session')).status).toBe(401);
    const oldCode = await codeNow(w.editor, w.c);
    const denied = await w.anon('POST', '/api/auth/login', { email: w.editor.email, password: w.editor.password, code: oldCode });
    expect(denied.status).toBe(401);

    const begin = await w.anon('POST', '/api/auth/totp/begin', { email: w.editor.email, password: w.editor.password });
    expect(begin.status).toBe(200);
    const { totpSecret, otpauth } = await json(begin);
    expect(otpauth).toContain(totpSecret);
    expect(totpSecret).not.toBe(w.editor.totpSecret);

    const bad = await w.anon('POST', '/api/auth/totp/confirm', { email: w.editor.email, password: w.editor.password, code: '000000' });
    expect(bad.status).toBe(400);
    const done = await w.anon('POST', '/api/auth/totp/confirm', { email: w.editor.email, password: w.editor.password, code: await totpCode(totpSecret, Date.now()) });
    expect(done.status).toBe(200);
    expect((await json(done)).recoveryCodes).toHaveLength(8);
    // Rute memakai jam asli: geser langkah terakhir satu kali untuk mensimulasikan 30 detik berlalu (anti-replay).
    await w.db.prepare('UPDATE users SET totp_last_step = totp_last_step - 1 WHERE id = ?').bind(w.editor.id).run();
    const ok = await w.anon('POST', '/api/auth/login', { email: w.editor.email, password: w.editor.password, code: await totpCode(totpSecret, Date.now()) });
    expect(ok.status).toBe(200);
    const again = await w.anon('POST', '/api/auth/login', { email: w.editor.email, password: w.editor.password, code: await totpCode(totpSecret, Date.now()) });
    expect(again.status).toBe(401);
  });

  test('begin is refused for a user whose 2FA is already confirmed', async () => {
    const w = await world();
    const r = await w.anon('POST', '/api/auth/totp/begin', { email: w.editor.email, password: w.editor.password });
    expect(r.status).toBe(401);
  });
});

describe('audit log', () => {
  test('records who did what, newest first, with names but no secrets', async () => {
    const w = await world();
    const ad = await w.as(w.admin);
    await ad('PATCH', `/api/users/${w.editor.id}`, { name: 'Editor Baru' });
    await ad('POST', `/api/users/${w.editor.id}/revoke-sessions`);
    const r = await ad('GET', '/api/audit?limit=10');
    expect(r.status).toBe(200);
    const { entries } = await json(r);
    const actions = entries.map((e: any) => e.action);
    expect(actions.indexOf('user.revoke_sessions')).toBeLessThan(actions.indexOf('user.update'));
    expect(actions).toContain('login.ok');
    expect(entries.find((e: any) => e.action === 'user.update').userName).toBe('Admin');
    expect(JSON.stringify(entries)).not.toMatch(/password|secret/i);
  });
});
