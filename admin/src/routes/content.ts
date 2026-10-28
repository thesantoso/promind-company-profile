import { Hono } from 'hono';
import { z } from 'zod';
import { CONTENT_FILES, isContentKey, validateContent } from '../content';
import { GitHub } from '../github';
import { csrfCheck, ctxOf, requireSession, type AppEnv } from '../middleware';
import { PublishError, discardDraft, getContent, history, knownImages, listStatus, publish, restoreVersion, saveDraft, type Deps } from '../publish';

export const contentRoutes = new Hono<AppEnv>();
contentRoutes.use('*', requireSession, csrfCheck);

const depsOf = (c: { env: AppEnv['Bindings']; get: (k: 'fetchImpl') => typeof fetch }): Deps => ({
  c: ctxOf(c.env),
  gh: new GitHub({ token: c.env.GITHUB_TOKEN, repo: c.env.GITHUB_REPO, branch: c.env.GITHUB_BRANCH }, c.get('fetchImpl')),
});

const keyOrThrow = (key: string) => {
  if (!isContentKey(key)) throw new PublishError('not_found', `Unknown content file: ${key}`);
  return key;
};

contentRoutes.get('/', async (c) => c.json({ files: await listStatus(depsOf(c)) }));

contentRoutes.get('/:key', async (c) => {
  const key = keyOrThrow(c.req.param('key'));
  const deps = depsOf(c);
  const r = await getContent(deps, key);
  const draft = r.draft && { ...r.draft, issues: validateContent(key, r.draft.data, { knownImages: await knownImages(deps) }) };
  return c.json({ key, label: CONTENT_FILES[key].label, kind: CONTENT_FILES[key].kind, data: r.data, sha: r.sha, draft });
});

contentRoutes.put('/:key', async (c) => {
  const key = keyOrThrow(c.req.param('key'));
  const parsed = z.object({ data: z.unknown() }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success || parsed.data.data === undefined) return c.json({ error: 'bad_request' }, 400);
  return c.json(await saveDraft(depsOf(c), c.get('session').user, key, parsed.data.data));
});

contentRoutes.delete('/:key/draft', async (c) => {
  await discardDraft(depsOf(c), c.get('session').user, keyOrThrow(c.req.param('key')));
  return c.json({ ok: true });
});

contentRoutes.get('/:key/history', async (c) => {
  const limit = Math.min(Math.max(Number(c.req.query('limit') ?? 20) || 20, 1), 50);
  return c.json({ commits: await history(depsOf(c), keyOrThrow(c.req.param('key')), limit) });
});

contentRoutes.post('/:key/restore', async (c) => {
  const parsed = z.object({ sha: z.string().max(64) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request' }, 400);
  return c.json(await restoreVersion(depsOf(c), c.get('session').user, keyOrThrow(c.req.param('key')), parsed.data.sha));
});

export const publishRoutes = new Hono<AppEnv>();
publishRoutes.use('*', requireSession, csrfCheck);
publishRoutes.post('/', async (c) => {
  const parsed = z
    .object({ keys: z.array(z.string().max(40)).min(1).max(12), note: z.string().max(200).optional() })
    .safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: 'bad_request' }, 400);
  return c.json(await publish(depsOf(c), c.get('session').user, parsed.data.keys, parsed.data.note));
});
