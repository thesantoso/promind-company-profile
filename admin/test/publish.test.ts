import { describe, expect, test } from 'vitest';
import { getUserById } from '../src/auth';
import { serializeContent } from '../src/content';
import { GitHub } from '../src/github';
import { PublishError, discardDraft, getContent, history, listStatus, publish, restoreVersion, saveDraft, type Deps } from '../src/publish';
import { createTestDb } from './support/d1';
import { makeCtx, seedUser } from './support/auth';
import { createFakeGithub } from './support/fakeGithub';
import { initialRepo, real, realText } from './support/content';

async function setup() {
  const db = createTestDb();
  const c = makeCtx(db, Date.now());
  const fake = createFakeGithub('thesantoso/promind-company-profile', 'main', initialRepo());
  const gh = new GitHub({ token: 'ghp_x', repo: 'thesantoso/promind-company-profile', branch: 'main' }, fake.fetch);
  const seed = await seedUser(c, { name: 'Rizky Santoso', role: 'editor' });
  const user = (await getUserById(c, seed.id))!;
  const deps: Deps = { c, gh };
  return { db, c, fake, gh, user, deps };
}
const clone = <T,>(v: T): T => structuredClone(v);
async function fail(p: Promise<unknown>): Promise<PublishError> {
  try { await p; } catch (e) { if (e instanceof PublishError) return e; throw e; }
  throw new Error('expected PublishError');
}

describe('drafts', () => {
  test('getContent returns the live data and sha; saveDraft keeps the base sha of the live file', async () => {
    const { deps, user } = await setup();
    const before = await getContent(deps, 'services');
    expect(before.data).toEqual(real('services'));
    expect(before.draft).toBeNull();
    const d = clone(real('services'));
    d[0].title.en = 'Property Preliminary Management (edited)';
    const r = await saveDraft(deps, user, 'services', d);
    expect(r.issues).toEqual([]);
    expect(r.baseSha).toBe(before.sha);
    const after = await getContent(deps, 'services');
    expect(after.draft?.data).toEqual(d);
    expect(after.data).toEqual(real('services')); // data live tidak berubah
  });

  test('an invalid draft is saved (work in progress) and returns its issues', async () => {
    const { deps, user } = await setup();
    const d = clone(real('services'));
    d[0].title.en = '';
    const r = await saveDraft(deps, user, 'services', d);
    expect(r.issues.length).toBeGreaterThan(0);
    expect((await getContent(deps, 'services')).draft).not.toBeNull();
  });

  test('saving again keeps the original base sha; discard removes the draft', async () => {
    const { deps, user, fake } = await setup();
    const d = clone(real('pillars'));
    const first = await saveDraft(deps, user, 'pillars', d);
    fake.commitDirect({ 'web/content/pillars.json': serializeContent([...real('pillars')].reverse()) }, 'outside edit');
    const second = await saveDraft(deps, user, 'pillars', d);
    expect(second.baseSha).toBe(first.baseSha);
    await discardDraft(deps, user, 'pillars');
    expect((await getContent(deps, 'pillars')).draft).toBeNull();
  });

  test('listStatus reports which files have drafts', async () => {
    const { deps, user } = await setup();
    await saveDraft(deps, user, 'clients', clone(real('clients')));
    const st = await listStatus(deps);
    expect(st).toHaveLength(12);
    expect(st.find((s) => s.key === 'clients')?.hasDraft).toBe(true);
    expect(st.find((s) => s.key === 'services')?.hasDraft).toBe(false);
  });

  test('an enormous draft is refused', async () => {
    const { deps, user } = await setup();
    const d = clone(real('clients'));
    d[0].name = 'x'.repeat(600_000);
    expect((await fail(saveDraft(deps, user, 'clients', d))).code).toBe('too_large');
  });
});

describe('publish', () => {
  test('writes one commit with byte-identical JSON formatting, clears the draft and audits', async () => {
    const { deps, user, fake, db } = await setup();
    const d = clone(real('services'));
    d[0].title.en = 'Property Preliminary Management (edited)';
    await saveDraft(deps, user, 'services', d);
    const before = fake.commitCount();
    const r = await publish(deps, user, ['services']);
    expect(fake.commitCount()).toBe(before + 1);
    expect(fake.head).toBe(r.commit);
    expect(fake.file('web/content/services.json')).toBe(serializeContent(d));
    expect(fake.message()).toBe('content: update services (by Rizky Santoso)');
    expect((await getContent(deps, 'services')).draft).toBeNull();
    const audit = await db.prepare("SELECT action, detail FROM audit_log WHERE action = 'content.publish'").first<{ detail: string }>();
    expect(JSON.parse(audit!.detail)).toMatchObject({ keys: ['services'], commit: r.commit });
  });

  test('publishes several files in a single commit', async () => {
    const { deps, user, fake } = await setup();
    const s = clone(real('services')); s[0].summary.en = 'Edited summary.';
    const p = clone(real('pillars')); p[0].summary.en = 'Edited pillar.';
    await saveDraft(deps, user, 'services', s);
    await saveDraft(deps, user, 'pillars', p);
    const before = fake.commitCount();
    await publish(deps, user, ['services', 'pillars']);
    expect(fake.commitCount()).toBe(before + 1);
    expect(fake.file('web/content/pillars.json')).toBe(serializeContent(p));
    expect(fake.message()).toBe('content: update services, pillars (by Rizky Santoso)');
  });

  test.each([
    ['blank English', (d: any) => { d[0].title.en = ''; }],
    ['mis-cased brand', (d: any) => { d[0].summary.id = 'Layanan dari Promind'; }],
    ['British spelling', (d: any) => { d[0].summary.en = 'Run the Training Centre.'; }],
    ['duplicate slug', (d: any) => { d[1].slug = d[0].slug; }],
  ])('refuses to publish a draft with %s and commits nothing', async (_name, mutate) => {
    const { deps, user, fake } = await setup();
    const d = clone(real('services'));
    mutate(d);
    await saveDraft(deps, user, 'services', d);
    const before = fake.commitCount();
    const e = await fail(publish(deps, user, ['services']));
    expect(e.code).toBe('invalid');
    expect(e.issues.length).toBeGreaterThan(0);
    expect(fake.commitCount()).toBe(before);
    expect((await getContent(deps, 'services')).draft).not.toBeNull(); // draft tetap ada
  });

  test('refuses when the file changed in Git since the draft was started', async () => {
    const { deps, user, fake } = await setup();
    const d = clone(real('services')); d[0].summary.en = 'My edit.';
    await saveDraft(deps, user, 'services', d);
    const other = clone(real('services')); other[0].summary.en = 'Someone else changed this.';
    fake.commitDirect({ 'web/content/services.json': serializeContent(other) }, 'direct edit');
    const before = fake.commitCount();
    const e = await fail(publish(deps, user, ['services']));
    expect(e.code).toBe('conflict');
    expect(e.key).toBe('services');
    expect(fake.commitCount()).toBe(before);
  });

  test('refuses when there is no draft or an unknown key', async () => {
    const { deps, user } = await setup();
    expect((await fail(publish(deps, user, ['services']))).code).toBe('no_draft');
    expect((await fail(publish(deps, user, []))).code).toBe('not_found');
    expect((await fail(publish(deps, user, ['bogus' as any]))).code).toBe('not_found');
  });

  test('unrelated commits to other files do not block publishing', async () => {
    const { deps, user, fake } = await setup();
    const d = clone(real('services')); d[0].summary.en = 'My edit.';
    await saveDraft(deps, user, 'services', d);
    fake.commitDirect({ 'web/src/unrelated.ts': 'export {}\n' }, 'code change');
    await publish(deps, user, ['services']);
    expect(fake.file('web/src/unrelated.ts')).toBe('export {}\n');
    expect(fake.file('web/content/services.json')).toBe(serializeContent(d));
  });

  test('includes draft images in the same commit and clears them', async () => {
    const { deps, user, fake, db, c } = await setup();
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 9, 9, 9]);
    await db.prepare('INSERT INTO draft_images (path, mime, data, created_by, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind('web/src/assets/photos/baru.jpg', 'image/jpeg', jpeg, user.id, Math.floor(c.now() / 1000)).run();
    const f = clone(real('fieldwork'));
    f[0].image.src = 'baru.jpg';
    expect((await saveDraft(deps, user, 'fieldwork', f)).issues).toEqual([]); // foto draft dikenali
    await publish(deps, user, ['fieldwork']);
    expect([...fake.bytes('web/src/assets/photos/baru.jpg')!]).toEqual([...jpeg]);
    const left = await db.prepare('SELECT COUNT(*) AS n FROM draft_images').first<{ n: number }>();
    expect(left!.n).toBe(0);
  });

  test('a commit message cannot be injected through the user name', async () => {
    const { deps, c, fake, db } = await setup();
    const evil = await seedUser(c, { email: 'evil@promind.co.id', name: 'Eve\nSigned-off-by: Admin', role: 'editor' });
    const user = (await getUserById(c, evil.id))!;
    const d = clone(real('pillars')); d[0].summary.en = 'x edit.';
    await saveDraft(deps, user, 'pillars', d);
    await publish(deps, user, ['pillars']);
    expect(fake.message().split('\n')).toHaveLength(1);
    void db;
  });
});

describe('history and restore', () => {
  async function twoVersions() {
    const s = await setup();
    const v2 = clone(real('services')); v2[0].summary.en = 'Second version.';
    await saveDraft(s.deps, s.user, 'services', v2);
    await publish(s.deps, s.user, ['services']);
    const v3 = clone(v2); v3[0].summary.en = 'Third version.';
    await saveDraft(s.deps, s.user, 'services', v3);
    await publish(s.deps, s.user, ['services']);
    return { ...s, v2, v3 };
  }

  test('history lists the commits that touched the file, newest first', async () => {
    const s = await twoVersions();
    const h = await history(s.deps, 'services', 10);
    expect(h.map((c) => c.message)).toEqual(['content: update services (by Rizky Santoso)', 'content: update services (by Rizky Santoso)', 'initial']);
  });

  test('restore creates a NEW commit with the old content; history is not rewritten', async () => {
    const s = await twoVersions();
    const h = await history(s.deps, 'services', 10);
    const secondSha = h[1]!.sha;
    const before = s.fake.commitCount();
    const r = await restoreVersion(s.deps, s.user, 'services', secondSha);
    expect(s.fake.commitCount()).toBe(before + 1);
    expect(s.fake.file('web/content/services.json')).toBe(serializeContent(s.v2));
    expect(s.fake.message(r.commit)).toBe(`content: restore services to ${secondSha.slice(0, 7)} (by Rizky Santoso)`);
  });

  test('restore is refused while a draft exists, for an unknown sha, and for an invalid old version', async () => {
    const s = await twoVersions();
    const h = await history(s.deps, 'services', 10);
    await saveDraft(s.deps, s.user, 'services', clone(s.v3));
    expect((await fail(restoreVersion(s.deps, s.user, 'services', h[1]!.sha))).code).toBe('draft_exists');
    await discardDraft(s.deps, s.user, 'services');
    expect((await fail(restoreVersion(s.deps, s.user, 'services', 'f'.repeat(40)))).code).toBe('not_found');
    const bad = clone(real('services')); bad[0].title.en = '';
    const badSha = s.fake.commitDirect({ 'web/content/services.json': serializeContent(bad) }, 'broken');
    s.fake.commitDirect({ 'web/content/services.json': realText('services') }, 'fixed');
    expect((await fail(restoreVersion(s.deps, s.user, 'services', badSha))).code).toBe('invalid');
  });
});
