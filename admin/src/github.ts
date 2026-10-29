import { b64decode, b64encode } from './crypto';

export class GitHubError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/** Terjadi bila branch terus bergerak sehingga commit tidak bisa di-fast-forward. */
export class ConflictError extends Error {
  constructor(message = 'The repository changed while publishing. Try again.', readonly key?: string) {
    super(message);
  }
}

export interface GitHubConfig {
  token: string;
  repo: string;
  branch: string;
}

export interface FileToCommit {
  path: string;
  content: string | Uint8Array;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: string;
  date: string;
}

const API = 'https://api.github.com';
const enc = new TextEncoder();
const encodePath = (p: string) => p.split('/').map(encodeURIComponent).join('/');

export class GitHub {
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly cfg: GitHubConfig,
    fetchImpl: typeof fetch = fetch,
  ) {
    // Workers reject a bare `fetch` called as a method of another object (Illegal invocation).
    this.fetchImpl = (input, init) => fetchImpl(input, init);
  }

  private async request(method: string, path: string, body?: unknown, allow404 = false): Promise<any> {
    const res = await this.fetchImpl(`${API}/repos/${this.cfg.repo}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.cfg.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'promind-admin',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 404 && allow404) return null;
    if (!res.ok) {
      let detail = '';
      try {
        detail = String(((await res.json()) as { message?: string }).message ?? '');
      } catch {
        /* abaikan */
      }
      const safe = this.cfg.token ? detail.split(this.cfg.token).join('***') : detail;
      throw new GitHubError(res.status, `GitHub ${method} ${path.split('?')[0]} failed (${res.status}): ${safe}`);
    }
    return res.json();
  }

  async getHead(): Promise<string> {
    return (await this.request('GET', `/git/ref/heads/${this.cfg.branch}`)).object.sha;
  }

  async getFile(path: string, ref = this.cfg.branch): Promise<{ content: string; sha: string } | null> {
    const r = await this.request('GET', `/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`, undefined, true);
    if (!r || Array.isArray(r)) return null;
    return { content: new TextDecoder().decode(b64decode(String(r.content).replace(/\s/g, ''))), sha: r.sha };
  }

  async getFileAt(path: string, sha: string): Promise<string | null> {
    return (await this.getFile(path, sha))?.content ?? null;
  }

  async listDir(path: string): Promise<string[]> {
    const r = await this.request('GET', `/contents/${encodePath(path)}?ref=${encodeURIComponent(this.cfg.branch)}`, undefined, true);
    return Array.isArray(r) ? r.map((e: { name: string }) => e.name) : [];
  }

  async listCommits(path: string, limit = 20): Promise<CommitInfo[]> {
    const r = await this.request(
      'GET',
      `/commits?sha=${encodeURIComponent(this.cfg.branch)}&path=${encodeURIComponent(path)}&per_page=${Math.min(limit, 100)}`,
    );
    return (r as { sha: string; commit: { message: string; author: { name: string; date: string } } }[]).map((c) => ({
      sha: c.sha, message: c.commit.message, author: c.commit.author.name, date: c.commit.author.date,
    }));
  }

  /** Satu commit atomik: blob -> tree -> commit -> fast-forward ref. Mengulang bila branch bergerak. */
  async commitFiles(files: FileToCommit[], message: string, maxAttempts = 3): Promise<{ sha: string }> {
    const blobShas = new Map<string, string>();
    for (const f of files) {
      const bytes = typeof f.content === 'string' ? enc.encode(f.content) : f.content;
      blobShas.set(f.path, (await this.request('POST', '/git/blobs', { content: b64encode(bytes), encoding: 'base64' })).sha);
    }
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const head = await this.getHead();
      const baseTree = (await this.request('GET', `/git/commits/${head}`)).tree.sha;
      const tree = await this.request('POST', '/git/trees', {
        base_tree: baseTree,
        tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', sha: blobShas.get(f.path) })),
      });
      const commit = await this.request('POST', '/git/commits', { message, tree: tree.sha, parents: [head] });
      try {
        await this.request('PATCH', `/git/refs/heads/${this.cfg.branch}`, { sha: commit.sha, force: false });
        return { sha: commit.sha };
      } catch (e) {
        if (e instanceof GitHubError && e.status === 422 && attempt < maxAttempts) continue;
        if (e instanceof GitHubError && e.status === 422) throw new ConflictError();
        throw e;
      }
    }
    throw new ConflictError();
  }
}
