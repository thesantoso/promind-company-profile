import { describe, expect, test } from 'vitest';
import { totpCode } from '../src/totp';
import { json, world, ORIGIN } from './support/world';

/** Alur umum (GitHub/Google/Okta): undangan -> set password -> pasang authenticator (QR) -> kode pemulihan -> langsung masuk. */

async function invited(w: Awaited<ReturnType<typeof world>>, email = 'baru@promind.co.id', role = 'editor') {
  const ad = await w.as(w.admin);
  const r = await json(await ad('POST', '/api/users/invite', { email, name: 'Staf Baru', role }));
  const token = new URL(r.link).hash.replace('#token=', '');
  return { token, email };
}
const PASSWORD = 'Kata-Sandi-Baru-2026';

describe('precheck: langkah 1 login (email + password)', () => {
  test('wrong password or unknown email is the same uniform 401 and never reveals 2FA state', async () => {
    const w = await world();
    const a = await w.anon('POST', '/api/auth/login/precheck', { email: 'nobody@promind.co.id', password: 'salah-salah-salah' });
    const b = await w.anon('POST', '/api/auth/login/precheck', { email: w.admin.email, password: 'salah-salah-salah' });
    expect([a.status, await json(a)]).toEqual([b.status, await json(b)]);
    expect(a.status).toBe(401);
    expect(a.headers.get('set-cookie')).toBeNull();
  });

  test('right password for an enrolled user asks for the authenticator code and creates no session', async () => {
    const w = await world();
    const r = await w.anon('POST', '/api/auth/login/precheck', { email: w.editor.email, password: w.editor.password });
    expect(r.status).toBe(200);
    expect(await json(r)).toEqual({ next: 'code' });
    expect(r.headers.get('set-cookie')).toBeNull();
  });

  test('right password for a user who has not set up an authenticator returns the setup details (no separate page needed)', async () => {
    const w = await world();
    const { token, email } = await invited(w);
    await w.anon('POST', '/api/auth/invite/accept', { token, password: PASSWORD });
    const r = await w.anon('POST', '/api/auth/login/precheck', { email, password: PASSWORD });
    expect(r.status).toBe(200);
    const b = await json(r);
    expect(b.next).toBe('enroll');
    expect(b.otpauth).toContain(b.totpSecret);
  });

  test('failed prechecks count toward the same rate limit as logins', async () => {
    const w = await world();
    for (let i = 0; i < 5; i++) {
      expect((await w.anon('POST', '/api/auth/login/precheck', { email: w.admin.email, password: 'salah-salah-salah' })).status).toBe(401);
    }
    expect((await w.anon('POST', '/api/auth/login/precheck', { email: w.admin.email, password: w.admin.password })).status).toBe(429);
  });

  test('a deactivated user is refused like any wrong credential', async () => {
    const w = await world();
    const ad = await w.as(w.admin);
    await ad('PATCH', `/api/users/${w.editor.id}`, { active: false });
    const r = await w.anon('POST', '/api/auth/login/precheck', { email: w.editor.email, password: w.editor.password });
    expect(r.status).toBe(401);
  });

  test('a foreign Origin is refused', async () => {
    const w = await world();
    const r = await w.app.request(`${ORIGIN}/api/auth/login/precheck`, { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a@b.co', password: 'x' }) }, w.env);
    expect(r.status).toBe(403);
  });
});

describe('finishing the authenticator setup signs the user straight in', () => {
  test('invite -> accept -> precheck(enroll) -> confirm: recovery codes AND a working session in one step', async () => {
    const w = await world();
    const { token, email } = await invited(w);
    const acc = await json(await w.anon('POST', '/api/auth/invite/accept', { token, password: PASSWORD }));
    const confirm = await w.anon('POST', '/api/auth/totp/confirm', { email, password: PASSWORD, code: await totpCode(acc.totpSecret, Date.now()) });
    expect(confirm.status).toBe(200);
    const cb = await json(confirm);
    expect(cb.recoveryCodes).toHaveLength(8);
    expect(cb.csrf).toBeTruthy();
    expect(cb.user.email).toBe(email);
    const cookie = confirm.headers.get('set-cookie')!;
    for (const flag of ['__Host-promind_session=', 'HttpOnly', 'Secure', 'SameSite=Strict']) expect(cookie).toContain(flag);
    const me = await w.app.request(`${ORIGIN}/api/auth/session`, { headers: { Cookie: cookie.split(';')[0]! } }, w.env);
    expect(me.status).toBe(200);
    expect((await json(me)).user.role).toBe('editor');
  });

  test('a wrong code in the setup step gives no session', async () => {
    const w = await world();
    const { token, email } = await invited(w);
    await w.anon('POST', '/api/auth/invite/accept', { token, password: PASSWORD });
    const r = await w.anon('POST', '/api/auth/totp/confirm', { email, password: PASSWORD, code: '000000' });
    expect(r.status).toBe(400);
    expect(r.headers.get('set-cookie')).toBeNull();
  });

  test('the setup code cannot be replayed to log in again within its window', async () => {
    const w = await world();
    const { token, email } = await invited(w);
    const acc = await json(await w.anon('POST', '/api/auth/invite/accept', { token, password: PASSWORD }));
    const code = await totpCode(acc.totpSecret, Date.now());
    await w.anon('POST', '/api/auth/totp/confirm', { email, password: PASSWORD, code });
    const again = await w.anon('POST', '/api/auth/login', { email, password: PASSWORD, code });
    expect(again.status).toBe(401);
  });
});

describe('administrator resets someone\'s authenticator', () => {
  test('on the next login the user is guided into setup and ends up signed in', async () => {
    const w = await world();
    const ad = await w.as(w.admin);
    await ad('POST', `/api/users/${w.editor.id}/reset-2fa`);
    const pre = await json(await w.anon('POST', '/api/auth/login/precheck', { email: w.editor.email, password: w.editor.password }));
    expect(pre.next).toBe('enroll');
    expect(pre.totpSecret).not.toBe(w.editor.totpSecret);
    const done = await w.anon('POST', '/api/auth/totp/confirm', { email: w.editor.email, password: w.editor.password, code: await totpCode(pre.totpSecret, Date.now()) });
    expect(done.status).toBe(200);
    expect(done.headers.get('set-cookie')).toContain('__Host-promind_session=');
  });
});
