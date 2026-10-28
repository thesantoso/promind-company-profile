import { writeFileSync } from 'node:fs';
import { buildVersion } from './version.mjs';

writeFileSync(new URL('../dist/version.json', import.meta.url), JSON.stringify(buildVersion(process.env), null, 2) + '\n');
