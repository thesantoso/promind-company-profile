import { Hono } from 'hono';
import { GitHub } from '../github';
import { ImageError, MAX_IMAGE_BYTES, PHOTOS_DIR, getDraftImage, listDraftImageNames, saveDraftImage } from '../images';
import { csrfCheck, ctxOf, requireSession, type AppEnv } from '../middleware';

export const imageRoutes = new Hono<AppEnv>();
imageRoutes.use('*', requireSession, csrfCheck);

const STATUS = { bad_name: 400, not_jpeg: 415, too_large: 413, too_small: 422, exists: 409 } as const;

const ghOf = (c: { env: AppEnv['Bindings']; get: (k: 'fetchImpl') => typeof fetch }) =>
  new GitHub({ token: c.env.GITHUB_TOKEN, repo: c.env.GITHUB_REPO, branch: c.env.GITHUB_BRANCH }, c.get('fetchImpl'));

imageRoutes.get('/', async (c) => {
  const repo = await ghOf(c).listDir(PHOTOS_DIR);
  const drafts = await listDraftImageNames(ctxOf(c.env));
  const draftSet = new Set(drafts);
  return c.json({
    images: [
      ...drafts.map((name) => ({ name, draft: true })),
      ...repo.filter((n) => !draftSet.has(n)).map((name) => ({ name, draft: false })),
    ],
  });
});

imageRoutes.post('/', async (c) => {
  const declared = Number(c.req.header('Content-Length') ?? 0);
  if (declared > MAX_IMAGE_BYTES + 100_000) return c.json({ error: 'too_large' }, 413);
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: 'bad_request' }, 400);
  }
  const file = form.get('file');
  if (!(file instanceof File)) return c.json({ error: 'bad_request' }, 400);
  if (file.size > MAX_IMAGE_BYTES) return c.json({ error: 'too_large' }, 413);
  try {
    const existing = new Set(await ghOf(c).listDir(PHOTOS_DIR));
    const r = await saveDraftImage(ctxOf(c.env), c.get('session').user, file.name, new Uint8Array(await file.arrayBuffer()), {
      existing,
      overwrite: form.get('overwrite') === 'true',
    });
    return c.json({ name: r.name, width: r.width, height: r.height, size: r.size });
  } catch (e) {
    if (e instanceof ImageError) return c.json({ error: e.code, message: e.message }, STATUS[e.code]);
    throw e;
  }
});

imageRoutes.get('/:name', async (c) => {
  const bytes = await getDraftImage(ctxOf(c.env), c.req.param('name'));
  if (!bytes) return c.json({ error: 'not_found' }, 404);
  return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg', 'Content-Length': String(bytes.length), 'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff' } });
});
