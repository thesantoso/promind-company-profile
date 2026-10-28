import type { Ctx, User } from './auth';
import { CONTENT_FILES, CONTENT_KEYS, isContentKey, serializeContent, validateContent, type ContentKey, type Issue } from './content';
import { writeAudit } from './db';
import type { CommitInfo, FileToCommit, GitHub } from './github';

export type PublishErrorCode = 'invalid' | 'no_draft' | 'conflict' | 'draft_exists' | 'not_found' | 'too_large';

export class PublishError extends Error {
  constructor(
    readonly code: PublishErrorCode,
    message: string = code,
    readonly issues: (Issue & { key?: ContentKey })[] = [],
    readonly key?: ContentKey,
  ) {
    super(message);
  }
}

export interface Deps {
  c: Ctx;
  gh: GitHub;
}

export const PHOTOS_DIR = 'web/src/assets/photos';
const MAX_DRAFT_CHARS = 500_000;

interface DraftRow {
  key: string;
  data: string;
  base_sha: string;
  updated_by: number | null;
  updated_at: number;
}

const toBytes = (v: unknown): Uint8Array =>
  v instanceof Uint8Array ? v : v instanceof ArrayBuffer ? new Uint8Array(v) : Uint8Array.from(v as number[]);

function assertKey(key: string): asserts key is ContentKey {
  if (!isContentKey(key)) throw new PublishError('not_found', `Unknown content file: ${key}`);
}

/** Nama foto yang ada di repo atau di unggahan draft. */
export async function knownImages({ c, gh }: Deps): Promise<Set<string>> {
  const inRepo = await gh.listDir(PHOTOS_DIR);
  const { results } = await c.db.prepare('SELECT path FROM draft_images').all<{ path: string }>();
  return new Set([...inRepo, ...results.map((r) => r.path.split('/').pop()!)]);
}

async function draftOf(c: Ctx, key: ContentKey): Promise<DraftRow | null> {
  return c.db.prepare('SELECT key, data, base_sha, updated_by, updated_at FROM drafts WHERE key = ?').bind(key).first<DraftRow>();
}

export async function getContent(deps: Deps, key: string) {
  assertKey(key);
  const file = await deps.gh.getFile(CONTENT_FILES[key].path);
  if (!file) throw new PublishError('not_found', `${CONTENT_FILES[key].path} is missing in the repository`);
  const draft = await draftOf(deps.c, key);
  return {
    data: JSON.parse(file.content) as unknown,
    sha: file.sha,
    draft: draft
      ? { data: JSON.parse(draft.data) as unknown, baseSha: draft.base_sha, updatedAt: draft.updated_at, updatedBy: draft.updated_by }
      : null,
  };
}

export async function saveDraft(deps: Deps, user: User, key: string, data: unknown): Promise<{ issues: Issue[]; baseSha: string }> {
  assertKey(key);
  const text = JSON.stringify(data);
  if (text === undefined || text.length > MAX_DRAFT_CHARS) throw new PublishError('too_large', 'Draft is too large');
  const issues = validateContent(key, data, { knownImages: await knownImages(deps) });
  const existing = await draftOf(deps.c, key);
  const baseSha = existing?.base_sha ?? (await deps.gh.getFile(CONTENT_FILES[key].path))?.sha ?? '';
  await deps.c.db
    .prepare(
      `INSERT INTO drafts (key, data, base_sha, updated_by, updated_at) VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    )
    .bind(key, text, baseSha, user.id, Math.floor(deps.c.now() / 1000))
    .run();
  return { issues, baseSha };
}

export async function discardDraft(deps: Deps, user: User, key: string): Promise<void> {
  assertKey(key);
  await deps.c.db.prepare('DELETE FROM drafts WHERE key = ?').bind(key).run();
  await writeAudit(deps.c.db, deps.c.now(), user.id, 'content.discard', { key });
}

export async function listStatus({ c }: Deps) {
  const { results } = await c.db.prepare('SELECT key, updated_at, updated_by FROM drafts').all<{ key: string; updated_at: number; updated_by: number | null }>();
  const byKey = new Map(results.map((r) => [r.key, r]));
  return CONTENT_KEYS.map((key) => ({
    key,
    label: CONTENT_FILES[key].label,
    path: CONTENT_FILES[key].path,
    hasDraft: byKey.has(key),
    draftUpdatedAt: byKey.get(key)?.updated_at ?? null,
    draftUpdatedBy: byKey.get(key)?.updated_by ?? null,
  }));
}

const oneLine = (s: string) => s.replace(/[\r\n]+/g, ' ').trim();

export async function publish(deps: Deps, user: User, keys: string[], note?: string): Promise<{ commit: string; files: string[] }> {
  const unique = [...new Set(keys)];
  if (unique.length === 0) throw new PublishError('not_found', 'Nothing to publish');
  unique.forEach(assertKey);
  const list = unique as ContentKey[];
  const { c, gh } = deps;

  const drafts: { key: ContentKey; data: unknown; text: string; baseSha: string }[] = [];
  for (const key of list) {
    const d = await draftOf(c, key);
    if (!d) throw new PublishError('no_draft', `There is no draft for ${key}`, [], key);
    drafts.push({ key, data: JSON.parse(d.data), text: d.data, baseSha: d.base_sha });
  }

  const known = await knownImages(deps);
  const issues = drafts.flatMap((d) => validateContent(d.key, d.data, { knownImages: known }).map((i) => ({ ...i, key: d.key })));
  if (issues.length > 0) throw new PublishError('invalid', 'The draft has errors that must be fixed first', issues);

  for (const d of drafts) {
    const live = await gh.getFile(CONTENT_FILES[d.key].path);
    if ((live?.sha ?? '') !== d.baseSha) {
      throw new PublishError('conflict', `${CONTENT_FILES[d.key].path} changed in the repository after this draft was started`, [], d.key);
    }
  }

  const files: FileToCommit[] = drafts.map((d) => ({ path: CONTENT_FILES[d.key].path, content: serializeContent(d.data) }));
  const { results: imgs } = await c.db.prepare('SELECT path, data FROM draft_images').all<{ path: string; data: unknown }>();
  for (const i of imgs) files.push({ path: i.path, content: toBytes(i.data) });

  const message = `content: update ${list.join(', ')} (by ${oneLine(user.name)})${note ? `\n\n${oneLine(note)}` : ''}`;
  const { sha } = await gh.commitFiles(files, message);

  for (const key of list) await c.db.prepare('DELETE FROM drafts WHERE key = ?').bind(key).run();
  await c.db.prepare('DELETE FROM draft_images').run();
  await writeAudit(c.db, c.now(), user.id, 'content.publish', { keys: list, commit: sha, images: imgs.map((i) => i.path) });
  return { commit: sha, files: files.map((f) => f.path) };
}

export async function history(deps: Deps, key: string, limit = 20): Promise<CommitInfo[]> {
  assertKey(key);
  return deps.gh.listCommits(CONTENT_FILES[key].path, limit);
}

export async function restoreVersion(deps: Deps, user: User, key: string, sha: string): Promise<{ commit: string }> {
  assertKey(key);
  const { c, gh } = deps;
  if (await draftOf(c, key)) throw new PublishError('draft_exists', 'Publish or discard the current draft before restoring a version', [], key);
  if (!/^[0-9a-f]{7,40}$/i.test(sha)) throw new PublishError('not_found', 'Unknown version');
  const old = await gh.getFileAt(CONTENT_FILES[key].path, sha);
  if (old === null) throw new PublishError('not_found', 'That version does not exist');
  let data: unknown;
  try {
    data = JSON.parse(old);
  } catch {
    throw new PublishError('invalid', 'That version is not valid JSON', [{ path: '', message: 'Versi lama bukan JSON yang valid', key }]);
  }
  const issues = validateContent(key, data, { knownImages: await knownImages(deps) });
  if (issues.length > 0) {
    throw new PublishError('invalid', 'That version no longer passes the content rules', issues.map((i) => ({ ...i, key })));
  }
  const { sha: commit } = await gh.commitFiles(
    [{ path: CONTENT_FILES[key].path, content: serializeContent(data) }],
    `content: restore ${key} to ${sha.slice(0, 7)} (by ${oneLine(user.name)})`,
  );
  await writeAudit(c.db, c.now(), user.id, 'content.restore', { key, from: sha, commit });
  return { commit };
}
