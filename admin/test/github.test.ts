import { describe, expect, test } from 'vitest';
import { ConflictError, GitHub, GitHubError } from '../src/github';
import { createFakeGithub, gitBlobSha } from './support/fakeGithub';

const cfg = (token = 'ghp_SECRET_TOKEN_VALUE') => ({ token, repo: 'thesantoso/promind-company-profile', branch: 'main' });

function setup(initial: Record<string, string | Uint8Array> = { 'a.txt': 'halo\n', 'dir/x.json': '{}\n' }) {
  const fake = createFakeGithub(undefined, undefined, initial);
  return { fake, gh: new GitHub(cfg(), fake.fetch) };
}

describe('reading', () => {
  test('getFile decodes UTF-8 and returns the git blob sha; a missing file is null', async () => {
    const { gh } = setup({ 'a.txt': 'Sertifikat – Jakarta Selatan\n' });
    const f = await gh.getFile('a.txt');
    expect(f?.content).toBe('Sertifikat – Jakarta Selatan\n');
    expect(f?.sha).toBe(gitBlobSha(new TextEncoder().encode('Sertifikat – Jakarta Selatan\n')));
    expect(await gh.getFile('nope.txt')).toBeNull();
  });

  test('listDir returns file names; a missing directory is empty', async () => {
    const { gh } = setup({ 'photos/a.jpg': 'x', 'photos/b.jpg': 'y' });
    expect((await gh.listDir('photos')).sort()).toEqual(['a.jpg', 'b.jpg']);
    expect(await gh.listDir('kosong')).toEqual([]);
  });
});

describe('commitFiles', () => {
  test('creates one commit with blobs, a tree on the previous commit, and a fast-forward ref update', async () => {
    const { gh, fake } = setup();
    const before = fake.commitCount();
    const { sha } = await gh.commitFiles([{ path: 'a.txt', content: 'baru\n' }, { path: 'dir/y.json', content: '[]\n' }], 'content: update (by Rizky)');
    expect(fake.commitCount()).toBe(before + 1);
    expect(fake.head).toBe(sha);
    expect(fake.file('a.txt')).toBe('baru\n');
    expect(fake.file('dir/x.json')).toBe('{}\n'); // berkas lain tetap
    expect(fake.message()).toBe('content: update (by Rizky)');
    const order = fake.calls.map((c) => c.replace(/^(\w+) \/repos\/[^/]+\/[^/]+/, '$1 ').replace(/\/[0-9a-f]{40}.*$/, ''));
    expect(order.indexOf('PATCH /git/refs/heads/main')).toBeGreaterThan(order.lastIndexOf('POST /git/commits'));
    expect(order.lastIndexOf('POST /git/commits')).toBeGreaterThan(order.lastIndexOf('POST /git/trees'));
  });

  test('binary files survive byte for byte', async () => {
    const { gh, fake } = setup();
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0, 255, 254]);
    await gh.commitFiles([{ path: 'photos/x.jpg', content: jpeg }], 'img');
    expect([...fake.bytes('photos/x.jpg')!]).toEqual([...jpeg]);
  });

  test('retries on a non-fast-forward race and keeps the other writer\'s change', async () => {
    const fake = createFakeGithub(undefined, undefined, { 'a.txt': '1\n' });
    let raced = false;
    const racing: typeof fetch = async (input, init) => {
      const res = await fake.fetch(input, init);
      if (!raced && String(typeof input === 'string' ? input : (input as Request).url).endsWith('/git/commits') && init?.method === 'POST') {
        raced = true;
        fake.commitDirect({ 'other.txt': 'dari orang lain\n' }, 'concurrent');
      }
      return res;
    };
    const gh = new GitHub(cfg(), racing);
    await gh.commitFiles([{ path: 'a.txt', content: '2\n' }], 'mine');
    expect(raced).toBe(true);
    expect(fake.file('a.txt')).toBe('2\n');
    expect(fake.file('other.txt')).toBe('dari orang lain\n');
  });

  test('gives up with ConflictError if the ref keeps moving', async () => {
    const fake = createFakeGithub(undefined, undefined, { 'a.txt': '1\n' });
    const hostile: typeof fetch = async (input, init) => {
      const res = await fake.fetch(input, init);
      if (String(typeof input === 'string' ? input : (input as Request).url).endsWith('/git/commits') && init?.method === 'POST') fake.commitDirect({ [`n${Math.random()}.txt`]: 'x' });
      return res;
    };
    await expect(new GitHub(cfg(), hostile).commitFiles([{ path: 'a.txt', content: '2\n' }], 'mine')).rejects.toBeInstanceOf(ConflictError);
  });
});

describe('history', () => {
  test('listCommits returns newest first for one path and getFileAt reads an old version', async () => {
    const { gh, fake } = setup({ 'a.txt': 'v1\n' });
    const c2 = fake.commitDirect({ 'a.txt': 'v2\n' }, 'second', 'Sari');
    fake.commitDirect({ 'b.txt': 'lain\n' }, 'unrelated');
    const c4 = fake.commitDirect({ 'a.txt': 'v3\n' }, 'third', 'Rizky');
    const list = await gh.listCommits('a.txt', 10);
    expect(list.map((c) => c.message)).toEqual(['third', 'second', 'initial']);
    expect(list[0]).toMatchObject({ sha: c4, author: 'Rizky' });
    expect(await gh.getFileAt('a.txt', c2)).toBe('v2\n');
  });
});

describe('errors', () => {
  test('a rejected token becomes a GitHubError that never contains the token', async () => {
    const fake = createFakeGithub();
    const gh = new GitHub({ ...cfg(), token: '' }, fake.fetch);
    const err = await gh.getHead().catch((e) => e);
    expect(err).toBeInstanceOf(GitHubError);
    expect(err.status).toBe(401);
    expect(String(err.message)).not.toContain('SECRET');
  });
});

describe('GitHub with an injected fetch', () => {
  test('never invokes the injected fetch with the client as `this` (Workers: Illegal invocation)', async () => {
    let seenThis: unknown = 'unset';
    const strict = function (this: unknown) {
      seenThis = this;
      return Promise.resolve(new Response(JSON.stringify({ object: { sha: 'abc' } }), { status: 200 }));
    } as typeof fetch;
    const gh = new GitHub(cfg(), strict);
    await (gh as any).request('GET', '/git/ref/heads/b');
    expect(seenThis === undefined || seenThis === globalThis).toBe(true);
  });
});
