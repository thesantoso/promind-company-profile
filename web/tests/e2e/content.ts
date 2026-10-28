import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Playwright's loader cannot import JSON modules, so e2e tests read the content files directly.
export const readContent = <T = any>(file: string): T =>
  JSON.parse(readFileSync(join(process.cwd(), 'content', `${file}.json`), 'utf8'));
