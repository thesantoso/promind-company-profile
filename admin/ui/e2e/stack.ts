/**
 * Full stack lokal untuk uji e2e: Worker admin yang asli (createApp) di atas Node, dengan D1 di memori
 * (node:sqlite), GitHub palsu, aset UI hasil build, dan `version.json` situs palsu.
 * Endpoint `/__test/*` hanya ada di server uji ini, tidak pernah di Worker.
 *
 * Jalankan dari folder `admin`: `npx tsx ui/e2e/stack.ts` (PORT opsional, default 8788).
 */
import { serve } from '@hono/node-server';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { KEY, makeCtx, seedUser, type SeedUser } from '../../test/support/auth';
import { initialRepo } from '../../test/support/content';
import { createTestDb } from '../../test/support/d1';
import { createFakeGithub } from '../../test/support/fakeGithub';
import { totpCode } from '../../src/totp';
import { createApp } from '../../src/worker';
import type { Env } from '../../src/env';

const PORT = Number(process.env.PORT ?? 8788);
const ORIGIN = `http://127.0.0.1:${PORT}`;
const DIST = join(import.meta.dirname, '..', 'dist');
const SITE_DELAY_MS = Number(process.env.SITE_DELAY_MS ?? 2500);
const PASSWORD = 'Sangat-Rahasia-2026';
const REPO = 'thesantoso/promind-company-profile';

const db = createTestDb();
const ctx = makeCtx(db, Date.now());
// Jam nyata: Worker memakai Date.now(); seedUser hanya memakai ctx.now untuk created_at.
ctx.now = () => Date.now();
const fake = createFakeGithub(REPO, 'main', initialRepo());
const app = createApp({ fetchImpl: fake.fetch });

/** Pengguna uji. Selain dua pengguna utama, beberapa akun terpisah agar uji tidak saling mengganggu (rate limit, kata sandi, sesi). */
const SEEDS = [
  { email: 'admin@promind.co.id', name: 'Admin Utama', role: 'administrator' as const },
  { email: 'editor@promind.co.id', name: 'Editor Satu', role: 'editor' as const },
  { email: 'login@promind.co.id', name: 'Uji Masuk', role: 'editor' as const },
  { email: 'batas@promind.co.id', name: 'Uji Batas', role: 'editor' as const },
  { email: 'akun@promind.co.id', name: 'Uji Akun', role: 'editor' as const },
];
const users = new Map<string, SeedUser>();
for (const s of SEEDS) users.set(s.email, await seedUser(ctx, { ...s, password: PASSWORD }));
// Pengguna dengan autentikator yang belum disiapkan (untuk demo dan uji alur penyiapan). Rahasianya tidak dibuka lewat /__test/*;
// uji membacanya dari kunci manual di layar penyiapan.
await seedUser(ctx, { email: 'staf@promind.co.id', name: 'Staf Baru', role: 'editor', password: PASSWORD, confirmed: 0 });

// ---- aset statis dengan aturan _headers ----------------------------------------------------------

type HeaderRule = { pattern: string; headers: [string, string][] };
function parseHeaders(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    if (!/^\s/.test(line)) rules.push({ pattern: line.trim(), headers: [] });
    else {
      const i = line.indexOf(':');
      rules.at(-1)?.headers.push([line.slice(0, i).trim(), line.slice(i + 1).trim()]);
    }
  }
  return rules;
}
const matches = (pattern: string, path: string) => (pattern.endsWith('*') ? path.startsWith(pattern.slice(0, -1)) : pattern === path);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

function serveAsset(req: Request): Response {
  const url = new URL(req.url);
  const rules = existsSync(join(DIST, '_headers')) ? parseHeaders(readFileSync(join(DIST, '_headers'), 'utf8')) : [];
  let rel = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(DIST, rel);
  const isFile = file.startsWith(DIST) && existsSync(file) && statSync(file).isFile() && !rel.endsWith('_headers');
  if (!isFile) {
    // SPA: alamat yang tidak dikenal mendapat index.html (seperti not_found_handling = single-page-application).
    rel = '/index.html';
    file = join(DIST, 'index.html');
  }
  const headers = new Headers({ 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  for (const r of rules) if (matches(r.pattern, url.pathname) || matches(r.pattern, rel)) for (const [k, v] of r.headers) headers.set(k, v);
  return new Response(readFileSync(file), { headers });
}

// ---- situs palsu: version.json mengikuti commit terakhir setelah jeda "build" -----------------------

let siteCommit = fake.head;
let seenHead = fake.head;
let headChangedAt = Date.now();
function siteVersion() {
  if (fake.head !== seenHead) {
    seenHead = fake.head;
    headChangedAt = Date.now();
  }
  if (Date.now() - headChangedAt >= SITE_DELAY_MS) siteCommit = seenHead;
  return { commit: siteCommit, builtAt: new Date(headChangedAt).toISOString() };
}

// ---- server --------------------------------------------------------------------------------------

const env = {
  DB: db,
  ENCRYPTION_KEY: KEY,
  ADMIN_ORIGIN: ORIGIN,
  GITHUB_TOKEN: 'x',
  GITHUB_REPO: REPO,
  GITHUB_BRANCH: 'main',
  SITE_ORIGIN: ORIGIN,
  ASSETS: { fetch: async (input: RequestInfo | URL) => serveAsset(input instanceof Request ? input : new Request(String(input))) },
} as unknown as Env;

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

async function handle(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (url.pathname === '/version.json') return json(siteVersion());
  if (url.pathname === '/__test/totp') {
    const u = users.get(url.searchParams.get('email') ?? '');
    return u ? json({ secret: u.totpSecret, password: PASSWORD }) : json({ error: 'unknown' }, 404);
  }
  if (url.pathname === '/__test/code') {
    // Kode TOTP yang belum pernah dipakai pengguna ini: tunggu sampai langkah 30 detik berikutnya bila perlu
    // (Worker menolak pemakaian ulang kode dalam langkah yang sama).
    const u = users.get(url.searchParams.get('email') ?? '');
    if (!u) return json({ error: 'unknown' }, 404);
    const row = await db.prepare('SELECT totp_last_step FROM users WHERE id = ?').bind(u.id).first<{ totp_last_step: number | null }>();
    const last = row?.totp_last_step ?? -1;
    while (Math.floor(Date.now() / 30_000) <= last) await new Promise((r) => setTimeout(r, 250));
    return json({ code: await totpCode(u.totpSecret, Date.now()) });
  }
  if (url.pathname === '/__test/code-for-secret') {
    return json({ code: await totpCode(url.searchParams.get('secret') ?? '', Date.now()) });
  }
  if (url.pathname === '/__test/commit' && req.method === 'POST') {
    // Mensimulasikan perubahan langsung di Git (mis. orang lain) untuk menguji konflik.
    const { key, transform } = (await req.json()) as { key: string; transform: 'reverse' | 'touch' };
    const path = `web/content/${key}.json`;
    const data = JSON.parse(fake.file(path) ?? 'null');
    const next = transform === 'reverse' && Array.isArray(data) ? [...data].reverse() : data;
    const sha = fake.commitDirect({ [path]: JSON.stringify(next, null, 2) + '\n' }, `direct edit of ${key}`, 'someone-else');
    return json({ sha });
  }
  if (url.pathname === '/__test/head') return json({ head: fake.head, message: fake.message() });
  const forwarded = new Request(req, { headers: new Headers(req.headers) });
  forwarded.headers.set('CF-Connecting-IP', '127.0.0.1');
  return app.fetch(forwarded, env);
}

serve({ fetch: handle, port: PORT, hostname: '127.0.0.1' }, () => {
  console.log(`e2e stack listening on ${ORIGIN}`);
});
