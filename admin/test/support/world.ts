import { login } from '../../src/auth';
import type { Env } from '../../src/env';
import { createApp } from '../../src/worker';
import { createTestDb } from './d1';
import { KEY, codeNow, makeCtx, seedUser, type SeedUser } from './auth';
import { createFakeGithub, type FakeGithub } from './fakeGithub';
import { initialRepo } from './content';

export const ORIGIN = 'https://admin.promind.co.id';

export async function world(opts: { fetchImpl?: typeof fetch } = {}) {
  const db = createTestDb();
  const c = makeCtx(db, Date.now());
  const fake: FakeGithub = createFakeGithub('thesantoso/promind-company-profile', 'main', initialRepo());
  const env = {
    DB: db, ENCRYPTION_KEY: KEY, ADMIN_ORIGIN: ORIGIN, GITHUB_TOKEN: 'ghp_TOKEN_SHOULD_NEVER_LEAK',
    GITHUB_REPO: 'thesantoso/promind-company-profile', GITHUB_BRANCH: 'main',
  } as unknown as Env;
  const app = createApp({ fetchImpl: opts.fetchImpl ?? fake.fetch });
  const admin = await seedUser(c, { email: 'admin@promind.co.id', name: 'Admin', role: 'administrator' });
  const editor = await seedUser(c, { email: 'editor@promind.co.id', name: 'Editor Satu', role: 'editor' });

  async function as(u: SeedUser) {
    const s = await login(c, { email: u.email, password: u.password, code: await codeNow(u, c) }, { ip: '198.51.100.7' });
    c.advance(31_000);
    const call = (method: string, path: string, body?: unknown, extra: Record<string, string> = {}) =>
      app.request(
        `${ORIGIN}${path}`,
        {
          method,
          headers: {
            Cookie: `__Host-promind_session=${s.token}`, 'X-CSRF-Token': s.csrf, Origin: ORIGIN,
            ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...extra,
          },
          body: body === undefined ? undefined : JSON.stringify(body),
        },
        env,
      );
    return Object.assign(call, { token: s.token, csrf: s.csrf });
  }
  const anon = (method: string, path: string, body?: unknown) =>
    app.request(`${ORIGIN}${path}`, { method, headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) }, env);
  return { db, c, env, app, fake, admin, editor, as, anon };
}
export const json = async (r: Response) => (await r.json()) as any;
