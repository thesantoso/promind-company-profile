#!/usr/bin/env node
/*
  dedupe-live-css.mjs: shrinks src/styles/live.css without changing how any page renders.

  live.css is the live site's two stylesheets one after the other. The second (the Vite bundle) repeats about 98% of the
  first verbatim. Deleting a top-level rule from the earlier copy when the identical rule appears again later is
  cascade-neutral: whichever rules sit between the two copies, the later copy is still the last word. This took ~47 KB
  (8 KB gzipped) off the render-blocking CSS, which the Lighthouse LCP budgets need.

  Run from web/ after refreshing live.css from the live site: `node scripts/dedupe-live-css.mjs`. Idempotent.
*/
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'src/styles/live.css';
const MARK = '/* ---- index-';

function topLevelRules(css) {
  const rules = [];
  let depth = 0, start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) { rules.push(css.slice(start, i + 1)); start = i + 1; }
  }
  return { rules, rest: css.slice(start) };
}

const text = readFileSync(FILE, 'utf8');
const cut = text.indexOf(MARK);
if (cut < 0) throw new Error(`${MARK}… marker not found in ${FILE}`);
const lines = text.slice(0, cut).split('\n');
const bigIndex = lines.reduce((best, l, i) => (l.length > lines[best].length ? i : best), 0);
const later = new Set(topLevelRules(text.slice(cut)).rules.map((r) => r.trim()));
const { rules, rest } = topLevelRules(lines[bigIndex]);
const kept = rules.filter((r) => !later.has(r.trim()));
lines[bigIndex] = kept.join('') + rest;
writeFileSync(FILE, lines.join('\n') + text.slice(cut));
console.log(`${FILE}: block 1 rules ${rules.length} -> ${kept.length}, bytes ${text.length} -> ${readFileSync(FILE, 'utf8').length}`);
