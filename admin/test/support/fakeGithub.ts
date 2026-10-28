import { createHash } from 'node:crypto';

interface Commit {
  sha: string;
  parent: string | null;
  message: string;
  author: string;
  date: string;
  files: Map<string, Uint8Array>;
}

const enc = new TextEncoder();
export const gitBlobSha = (bytes: Uint8Array): string =>
  createHash('sha1').update(enc.encode(`blob ${bytes.length}\0`)).update(bytes).digest('hex');
const toB64 = (b: Uint8Array) => Buffer.from(b).toString('base64');
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/** GitHub Git Data API palsu di memori (subset yang dipakai admin), dengan SHA blob seperti Git. */
export function createFakeGithub(repo = 'thesantoso/promind-company-profile', branch = 'main', initial: Record<string, string | Uint8Array> = {}) {
  const commits = new Map<string, Commit>();
  const blobs = new Map<string, Uint8Array>();
  const trees = new Map<string, Map<string, Uint8Array>>();
  let counter = 0;
  let head = '';
  const calls: string[] = [];

  const newSha = () => (++counter).toString(16).padStart(40, '0');
  const asBytes = (v: string | Uint8Array) => (typeof v === 'string' ? enc.encode(v) : v);

  function commitDirect(files: Record<string, string | Uint8Array>, message = 'direct', author = 'someone') {
    const parent = head ? commits.get(head)! : null;
    const snapshot = new Map(parent?.files ?? []);
    for (const [p, v] of Object.entries(files)) snapshot.set(p, asBytes(v));
    const sha = newSha();
    commits.set(sha, { sha, parent: parent?.sha ?? null, message, author, date: new Date(1_700_000_000_000 + counter * 1000).toISOString(), files: snapshot });
    head = sha;
    return sha;
  }
  commitDirect(initial, 'initial');

  const snapshotAt = (ref: string): Map<string, Uint8Array> | null => {
    const sha = ref === branch ? head : ref;
    return commits.get(sha)?.files ?? null;
  };

  async function handler(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const method = (init.method ?? 'GET').toUpperCase();
    calls.push(`${method} ${url.pathname}${url.search}`);
    const auth = new Headers(init.headers).get('Authorization');
    if (!auth?.startsWith('Bearer ')) return json(401, { message: 'Bad credentials' });
    const base = `/repos/${repo}`;
    if (!url.pathname.startsWith(base)) return json(404, { message: 'Not Found' });
    const rest = url.pathname.slice(base.length);
    const body = init.body ? JSON.parse(String(init.body)) : {};

    let m: RegExpMatchArray | null;
    if (method === 'GET' && (m = rest.match(/^\/contents\/(.+)$/))) {
      const path = decodeURIComponent(m[1]!);
      const files = snapshotAt(url.searchParams.get('ref') ?? branch);
      if (!files) return json(404, { message: 'No commit found for the ref' });
      const bytes = files.get(path);
      if (bytes) return json(200, { type: 'file', path, sha: gitBlobSha(bytes), size: bytes.length, encoding: 'base64', content: toB64(bytes).replace(/(.{60})/g, '$1\n') });
      const prefix = path.replace(/\/$/, '') + '/';
      const children = [...files.keys()].filter((k) => k.startsWith(prefix));
      if (children.length === 0) return json(404, { message: 'Not Found' });
      const names = [...new Set(children.map((k) => k.slice(prefix.length).split('/')[0]!))];
      return json(200, names.map((n) => ({ name: n, path: prefix + n, type: 'file', sha: gitBlobSha(files.get(prefix + n) ?? new Uint8Array()) })));
    }
    if (method === 'GET' && rest === `/git/ref/heads/${branch}`) return json(200, { object: { sha: head } });
    if (method === 'GET' && (m = rest.match(/^\/git\/commits\/([0-9a-f]+)$/))) {
      const c = commits.get(m[1]!);
      return c ? json(200, { sha: c.sha, tree: { sha: `tree-${c.sha}` } }) : json(404, { message: 'Not Found' });
    }
    if (method === 'POST' && rest === '/git/blobs') {
      const bytes = body.encoding === 'base64' ? new Uint8Array(Buffer.from(body.content, 'base64')) : enc.encode(body.content);
      const sha = gitBlobSha(bytes);
      blobs.set(sha, bytes);
      return json(201, { sha });
    }
    if (method === 'POST' && rest === '/git/trees') {
      const baseCommit = String(body.base_tree).replace(/^tree-/, '');
      const snap = new Map(commits.get(baseCommit)?.files ?? []);
      for (const e of body.tree as { path: string; sha: string }[]) {
        const bytes = blobs.get(e.sha);
        if (!bytes) return json(422, { message: 'Tree entry references a missing blob' });
        snap.set(e.path, bytes);
      }
      const sha = newSha();
      trees.set(sha, snap);
      return json(201, { sha });
    }
    if (method === 'POST' && rest === '/git/commits') {
      const files = trees.get(body.tree);
      if (!files) return json(422, { message: 'Tree not found' });
      const sha = newSha();
      commits.set(sha, { sha, parent: body.parents[0] ?? null, message: body.message, author: 'promind-admin', date: new Date(1_700_000_000_000 + counter * 1000).toISOString(), files });
      return json(201, { sha });
    }
    if (method === 'PATCH' && rest === `/git/refs/heads/${branch}`) {
      const c = commits.get(body.sha);
      if (!c) return json(422, { message: 'Object does not exist' });
      if (c.parent !== head) return json(422, { message: 'Update is not a fast forward' });
      head = c.sha;
      return json(200, { object: { sha: head } });
    }
    if (method === 'GET' && rest === '/commits') {
      const path = url.searchParams.get('path') ?? '';
      const limit = Number(url.searchParams.get('per_page') ?? 30);
      const out: unknown[] = [];
      for (let c = commits.get(head); c && out.length < limit; c = c.parent ? commits.get(c.parent) : undefined) {
        const prev = c.parent ? commits.get(c.parent)!.files.get(path) : undefined;
        const cur = c.files.get(path);
        const changed = (cur ? gitBlobSha(cur) : null) !== (prev ? gitBlobSha(prev) : null);
        if (changed) out.push({ sha: c.sha, commit: { message: c.message, author: { name: c.author, date: c.date } } });
      }
      return json(200, out);
    }
    return json(404, { message: `Unhandled ${method} ${rest}` });
  }

  return {
    fetch: handler as typeof fetch,
    calls,
    commitDirect,
    get head() { return head; },
    file: (path: string): string | undefined => {
      const b = commits.get(head)!.files.get(path);
      return b ? new TextDecoder().decode(b) : undefined;
    },
    bytes: (path: string): Uint8Array | undefined => commits.get(head)!.files.get(path),
    commitCount: () => commits.size,
    message: (sha = head) => commits.get(sha)!.message,
  };
}
export type FakeGithub = ReturnType<typeof createFakeGithub>;
