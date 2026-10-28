import { describe, expect, test } from 'vitest';
import { ImageError, jpegSize, normalizeImageName, saveDraftImage } from '../src/images';
import { getUserById } from '../src/auth';
import { createTestDb } from './support/d1';
import { makeCtx, seedUser } from './support/auth';
import { makeJpeg } from './support/jpeg';
import { json, world } from './support/world';

describe('jpegSize', () => {
  test('reads the dimensions from the SOF marker', () => {
    expect(jpegSize(makeJpeg(1200, 800))).toEqual({ width: 1200, height: 800 });
  });
  test('returns null for non-JPEGs, truncated files and garbage', () => {
    expect(jpegSize(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBeNull();
    expect(jpegSize(new Uint8Array([0xff, 0xd8, 0xff]))).toBeNull();
    expect(jpegSize(new Uint8Array(0))).toBeNull();
    expect(jpegSize(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0xff, 0xff, 1, 2, 3]))).toBeNull();
  });
});

describe('normalizeImageName', () => {
  test.each([
    ['hse.jpg', 'hse.jpg'],
    ['A B.JPG', 'a-b.jpg'],
    ['Foto_Lapangan 2.jpeg', 'foto-lapangan-2.jpg'],
    ['../../etc/x.jpg', 'x.jpg'],
    ['C:\\temp\\gedung.jpg', 'gedung.jpg'],
  ])('%j -> %j', (input, expected) => {
    expect(normalizeImageName(input)).toBe(expected);
  });

  test.each(['x.php.jpg', 'x.png', 'x', '.jpg', '', 'a\u0000b.jpg', 'bagus!.jpg', `${'a'.repeat(70)}.jpg`, '日本.jpg'])('rejects %j', (input) => {
    expect(() => normalizeImageName(input)).toThrow(ImageError);
  });
});

describe('saveDraftImage', () => {
  async function ctx() {
    const db = createTestDb();
    const c = makeCtx(db, Date.now());
    const seed = await seedUser(c, { role: 'editor' });
    return { db, c, user: (await getUserById(c, seed.id))! };
  }
  const code = async (p: Promise<unknown>) => {
    try { await p; } catch (e) { if (e instanceof ImageError) return e.code; throw e; }
    return 'ok';
  };

  test('stores a valid JPEG as a draft image under the photos directory', async () => {
    const { c, user, db } = await ctx();
    const r = await saveDraftImage(c, user, 'Gedung Baru.JPG', makeJpeg(1600, 1000), { existing: new Set() });
    expect(r).toMatchObject({ name: 'gedung-baru.jpg', path: 'web/src/assets/photos/gedung-baru.jpg', width: 1600, height: 1000 });
    const row = await db.prepare('SELECT mime, length(data) AS n FROM draft_images WHERE path = ?').bind(r.path).first<{ mime: string; n: number }>();
    expect(row).toMatchObject({ mime: 'image/jpeg' });
  });

  test('rejects a PNG renamed to .jpg, files over 1.5 MB, images narrower than 800 px and absurd dimensions', async () => {
    const { c, user } = await ctx();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, ...new Array(100).fill(0)]);
    expect(await code(saveDraftImage(c, user, 'a.jpg', png, { existing: new Set() }))).toBe('not_jpeg');
    expect(await code(saveDraftImage(c, user, 'a.jpg', makeJpeg(1600, 1000, 1_500_001), { existing: new Set() }))).toBe('too_large');
    expect(await code(saveDraftImage(c, user, 'a.jpg', makeJpeg(799, 1000), { existing: new Set() }))).toBe('too_small');
    expect(await code(saveDraftImage(c, user, 'a.jpg', makeJpeg(20000, 20000), { existing: new Set() }))).toBe('too_large');
  });

  test('refuses to replace a photo that already exists unless overwrite is set', async () => {
    const { c, user } = await ctx();
    const jpg = makeJpeg(1600, 1000);
    expect(await code(saveDraftImage(c, user, 'hse.jpg', jpg, { existing: new Set(['hse.jpg']) }))).toBe('exists');
    expect(await code(saveDraftImage(c, user, 'hse.jpg', jpg, { existing: new Set(['hse.jpg']), overwrite: true }))).toBe('ok');
  });

  test('uploading the same draft name again replaces the draft', async () => {
    const { c, user, db } = await ctx();
    await saveDraftImage(c, user, 'x.jpg', makeJpeg(900, 600), { existing: new Set() });
    await saveDraftImage(c, user, 'x.jpg', makeJpeg(1000, 700), { existing: new Set() });
    expect((await db.prepare('SELECT COUNT(*) AS n FROM draft_images').first<{ n: number }>())!.n).toBe(1);
  });
});

describe('image API', () => {
  const form = (name: string, bytes: Uint8Array, extra: Record<string, string> = {}) => {
    const f = new FormData();
    f.set('file', new File([bytes], name, { type: 'image/jpeg' }));
    for (const [k, v] of Object.entries(extra)) f.set(k, v);
    return f;
  };
  const upload = async (w: Awaited<ReturnType<typeof world>>, user: Awaited<ReturnType<Awaited<ReturnType<typeof world>>['as']>>, f: FormData) =>
    w.app.request('https://admin.promind.co.id/api/images', { method: 'POST', body: f, headers: { Cookie: `__Host-promind_session=${user.token}`, 'X-CSRF-Token': user.csrf, Origin: 'https://admin.promind.co.id' } }, w.env);

  test('an editor uploads, lists and previews a draft image', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const jpg = makeJpeg(1600, 1000);
    const up = await upload(w, ed, form('Foto Baru.jpg', jpg));
    expect(up.status).toBe(200);
    expect(await json(up)).toMatchObject({ name: 'foto-baru.jpg' });
    const list = await json(await ed('GET', '/api/images'));
    expect(list.images).toContainEqual({ name: 'foto-baru.jpg', draft: true });
    expect(list.images.some((i: any) => i.name === 'hse.jpg' && i.draft === false)).toBe(true);
    const get = await ed('GET', '/api/images/foto-baru.jpg');
    expect(get.status).toBe(200);
    expect(get.headers.get('content-type')).toBe('image/jpeg');
    expect([...new Uint8Array(await get.arrayBuffer())]).toEqual([...jpg]);
  });

  test('maps rejections to clear statuses', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    expect((await upload(w, ed, form('a.jpg', new Uint8Array([1, 2, 3, 4])))).status).toBe(415);
    expect((await upload(w, ed, form('a.jpg', makeJpeg(1600, 900, 1_600_000)))).status).toBe(413);
    expect((await upload(w, ed, form('a.jpg', makeJpeg(500, 500)))).status).toBe(422);
    expect((await upload(w, ed, form('x.php.jpg', makeJpeg(1600, 900)))).status).toBe(400);
    expect((await upload(w, ed, form('hse.jpg', makeJpeg(1600, 900)))).status).toBe(409); // sudah ada di repo
    expect((await upload(w, ed, form('hse.jpg', makeJpeg(1600, 900), { overwrite: 'true' }))).status).toBe(200);
    const noFile = await w.app.request('https://admin.promind.co.id/api/images', { method: 'POST', body: new FormData(), headers: { Cookie: `__Host-promind_session=${ed.token}`, 'X-CSRF-Token': ed.csrf, Origin: 'https://admin.promind.co.id' } }, w.env);
    expect(noFile.status).toBe(400);
  });

  test('needs a session and CSRF; an unknown or unsafe name is a 404', async () => {
    const w = await world();
    expect((await w.anon('GET', '/api/images')).status).toBe(401);
    const ed = await w.as(w.editor);
    expect((await ed('GET', '/api/images/tidak-ada.jpg')).status).toBe(404);
    expect((await ed('GET', '/api/images/..%2Fsecret.jpg')).status).toBe(404);
    const noCsrf = await w.app.request('https://admin.promind.co.id/api/images', { method: 'POST', body: form('a.jpg', makeJpeg(1600, 900)), headers: { Cookie: `__Host-promind_session=${ed.token}`, Origin: 'https://admin.promind.co.id' } }, w.env);
    expect(noCsrf.status).toBe(403);
  });
});
