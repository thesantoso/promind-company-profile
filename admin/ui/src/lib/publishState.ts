/** Keputusan murni seputar tombol Terbitkan dan pemantauan situs setelah terbit. */

export interface PublishInput {
  hasDraft: boolean;
  dirty: boolean;
  saving: boolean;
  saveFailed: boolean;
  issueCount: number;
  changed: boolean;
}

/** Alasan tombol Terbitkan dinonaktifkan, atau null bila boleh terbit. */
export function publishBlockReason(s: PublishInput): string | null {
  if (s.saving || s.dirty) return 'Menunggu draf tersimpan…';
  if (s.saveFailed) return 'Draf belum tersimpan. Simpan dulu sebelum menerbitkan.';
  if (s.issueCount > 0) return `Perbaiki ${s.issueCount} isian yang bermasalah sebelum menerbitkan.`;
  if (!s.hasDraft || !s.changed) return 'Belum ada perubahan dibanding versi yang tayang.';
  return null;
}

export type SiteCheck = 'live' | 'waiting' | 'unknown';

/** Hasil satu kali cek `version.json`: tayang, belum, atau tidak bisa dibaca. */
export function interpretVersion(body: unknown, commit: string): SiteCheck {
  if (!body || typeof body !== 'object') return 'unknown';
  const c = (body as { commit?: unknown }).commit;
  if (typeof c !== 'string') return 'unknown';
  return c === commit ? 'live' : 'waiting';
}

export const POLL_INTERVAL_MS = 5_000;
export const POLL_TIMEOUT_MS = 5 * 60_000;

/** `siteOrigin` + `/version.json` dengan pembersihan garis miring. */
export const versionUrl = (siteOrigin: string) => `${siteOrigin.replace(/\/+$/, '')}/version.json`;
