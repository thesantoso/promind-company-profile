import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join(process.cwd(), '..', 'web', 'content');
export const CONTENT_KEYS = readdirSync(dir)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .sort();

export const realText = (key: string): string => readFileSync(join(dir, `${key}.json`), 'utf8');
export const real = <T = any>(key: string): T => JSON.parse(realText(key));

/** Isi awal repo palsu: semua berkas konten nyata + foto placeholder yang dirujuk. */
export function initialRepo(): Record<string, string | Uint8Array> {
  const files: Record<string, string | Uint8Array> = {};
  for (const k of CONTENT_KEYS) files[`web/content/${k}.json`] = realText(k);
  for (const f of real<{ image: { src: string } }[]>('fieldwork')) files[`web/src/assets/photos/${f.image.src}`] = new Uint8Array([0xff, 0xd8, 0xff, 1, 2, 3]);
  return files;
}
