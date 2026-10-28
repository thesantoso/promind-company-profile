import { describe, expect, test } from 'vitest';
import worker from '../worker/index.js';

function env() {
  const seen: { admin: string[]; assets: string[] } = { admin: [], assets: [] };
  return {
    seen,
    env: {
      ADMIN: { fetch: async (r: Request) => (seen.admin.push(`${r.method} ${new URL(r.url).pathname}`), new Response('admin')) },
      ASSETS: { fetch: async (r: Request) => (seen.assets.push(new URL(r.url).pathname), new Response('asset')) },
    },
  };
}
const call = (e: ReturnType<typeof env>, path: string, method = 'GET') =>
  worker.fetch(new Request(`https://promind.co.id${path}`, { method }), e.env as never);

describe('public site worker', () => {
  test('forwards only /api/contact to the admin worker, for any method', async () => {
    const e = env();
    expect(await (await call(e, '/api/contact', 'POST')).text()).toBe('admin');
    expect(await (await call(e, '/api/contact', 'OPTIONS')).text()).toBe('admin');
    expect(e.seen.admin).toEqual(['POST /api/contact', 'OPTIONS /api/contact']);
    expect(e.seen.assets).toEqual([]);
  });

  test('never exposes the other admin API on the public domain', async () => {
    const e = env();
    for (const p of ['/api/auth/login', '/api/users', '/api/content/services', '/api/contact/x', '/api']) {
      const res = await call(e, p, 'POST');
      expect(res.status, p).toBe(404);
    }
    expect(e.seen.admin).toEqual([]);
  });

  test('everything else is served from the static assets', async () => {
    const e = env();
    expect(await (await call(e, '/id/')).text()).toBe('asset');
    expect(await (await call(e, '/version.json')).text()).toBe('asset');
    expect(e.seen.assets).toEqual(['/id/', '/version.json']);
  });
});
