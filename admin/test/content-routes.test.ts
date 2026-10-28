import { describe, expect, test } from 'vitest';
import { json, world } from './support/world';
import { real } from './support/content';
import { serializeContent } from '../src/content';

const clone = <T,>(v: T): T => structuredClone(v);

describe('content API', () => {
  test('requires a session; editors may use it', async () => {
    const w = await world();
    expect((await w.anon('GET', '/api/content')).status).toBe(401);
    const ed = await w.as(w.editor);
    const r = await ed('GET', '/api/content');
    expect(r.status).toBe(200);
    const b = await json(r);
    expect(b.files).toHaveLength(12);
    expect(b.files[0]).toMatchObject({ key: expect.any(String), label: expect.any(String), hasDraft: false });
  });

  test('saving a draft returns validation issues and GET shows the draft with them', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const d = clone(real('services'));
    d[0].title.en = '';
    const put = await ed('PUT', '/api/content/services', { data: d });
    expect(put.status).toBe(200);
    expect((await json(put)).issues.length).toBeGreaterThan(0);
    const get = await json(await ed('GET', '/api/content/services'));
    expect(get.data).toEqual(real('services'));
    expect(get.draft.data).toEqual(d);
    expect(get.draft.issues.length).toBeGreaterThan(0);
  });

  test('mutations need the CSRF token', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const r = await w.app.request(
      'https://admin.promind.co.id/api/content/services',
      { method: 'PUT', headers: { Cookie: `__Host-promind_session=${ed.token}`, Origin: 'https://admin.promind.co.id', 'Content-Type': 'application/json' }, body: JSON.stringify({ data: [] }) },
      w.env,
    );
    expect(r.status).toBe(403);
  });

  test('publish: success, then the live data reflects it', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const d = clone(real('services'));
    d[0].summary.en = 'A new summary.';
    await ed('PUT', '/api/content/services', { data: d });
    const pub = await ed('POST', '/api/publish', { keys: ['services'] });
    expect(pub.status).toBe(200);
    const { commit } = await json(pub);
    expect(w.fake.head).toBe(commit);
    expect(w.fake.file('web/content/services.json')).toBe(serializeContent(d));
    expect((await json(await ed('GET', '/api/content/services'))).data[0].summary.en).toBe('A new summary.');
  });

  test('publish errors map to clear statuses', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    expect((await ed('POST', '/api/publish', { keys: ['services'] })).status).toBe(409); // no draft

    const bad = clone(real('services')); bad[0].title.en = '';
    await ed('PUT', '/api/content/services', { data: bad });
    const inv = await ed('POST', '/api/publish', { keys: ['services'] });
    expect(inv.status).toBe(422);
    const ib = await json(inv);
    expect(ib.error).toBe('invalid');
    expect(ib.issues[0]).toMatchObject({ key: 'services', path: expect.stringContaining('title.en') });

    const good = clone(real('pillars')); good[0].summary.en = 'Edited.';
    await ed('PUT', '/api/content/pillars', { data: good });
    w.fake.commitDirect({ 'web/content/pillars.json': serializeContent(clone(real('pillars')).reverse()) });
    const conflict = await ed('POST', '/api/publish', { keys: ['pillars'] });
    expect(conflict.status).toBe(409);
    expect(await json(conflict)).toMatchObject({ error: 'conflict', key: 'pillars' });

    expect((await ed('GET', '/api/content/bogus')).status).toBe(404);
    expect((await ed('POST', '/api/publish', { keys: 'x' })).status).toBe(400);
  });

  test('a GitHub outage is a 502 that does not leak the token or GitHub details', async () => {
    const w = await world({ fetchImpl: async () => new Response(JSON.stringify({ message: 'Server Error ghp_TOKEN_SHOULD_NEVER_LEAK' }), { status: 500 }) });
    const ed = await w.as(w.editor);
    const r = await ed('GET', '/api/content/services');
    expect(r.status).toBe(502);
    const text = await r.text();
    expect(text).not.toContain('ghp_');
    expect(JSON.parse(text)).toEqual({ error: 'github_unavailable' });
  });

  test('history and restore work through the API', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    const v2 = clone(real('pillars')); v2[0].summary.en = 'Version two.';
    await ed('PUT', '/api/content/pillars', { data: v2 });
    await ed('POST', '/api/publish', { keys: ['pillars'] });
    const h = (await json(await ed('GET', '/api/content/pillars/history'))).commits;
    expect(h.length).toBeGreaterThanOrEqual(2);
    const initial = h[h.length - 1];
    const res = await ed('POST', '/api/content/pillars/restore', { sha: initial.sha });
    expect(res.status).toBe(200);
    expect(w.fake.file('web/content/pillars.json')).toBe(serializeContent(real('pillars')));
    expect((await ed('POST', '/api/content/pillars/restore', { sha: 'zzz' })).status).toBe(404);
  });

  test('discarding a draft removes it', async () => {
    const w = await world();
    const ed = await w.as(w.editor);
    await ed('PUT', '/api/content/clients', { data: clone(real('clients')) });
    expect((await ed('DELETE', '/api/content/clients/draft')).status).toBe(200);
    expect((await json(await ed('GET', '/api/content/clients'))).draft).toBeNull();
  });
});
