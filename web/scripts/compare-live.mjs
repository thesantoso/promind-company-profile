#!/usr/bin/env node
/*
  compare-live.mjs: pixel and text comparison of the new site against the live promind.co.id.

  How to run (from web/):
    npm run build && npx astro preview --ignore-lock --host 127.0.0.1 --port 4330 &
    node scripts/compare-live.mjs --out /tmp/promind-compare
  Options (all optional):
    --live   https://promind.co.id        live origin
    --new    http://127.0.0.1:4330        new site origin (a running `astro preview`)
    --out    <dir>                        where screenshots, diffs and report.md go (default: OS temp dir)
    --pages  home,services                only these page keys (default: all)
    --widths 1440,390                     only these viewport widths (default: 1440,1024,768,390)
    --langs  id                           only these languages (default: id and en where listed)
  The build must have PUBLIC_TURNSTILE_SITEKEY set (as the e2e tests do) so the contact form renders.

  For every page x language x width it captures, with identical settings (reduced motion, animations
  off, fonts loaded, lazy images scrolled into view):
    - full page, above the fold, and the header after scrolling to 600px, on both sites;
    - per section (header, each top-level <section> in <main>, footer): pixel diff and visible text.
  Differing pixels use pixelmatch's YIQ colour distance with threshold 0.1 (no anti-alias detection,
  so text anti-aliasing counts as a difference). Nothing is written to the repository.
*/
import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);
const LIVE = args.live ?? 'https://promind.co.id';
const NEW = args.new ?? 'http://127.0.0.1:4330';
const OUT = args.out ?? join(tmpdir(), 'promind-compare');
const WIDTHS = (args.widths ?? '1440,1024,768,390').split(',').map(Number);
const ONLY = args.pages ? args.pages.split(',') : null;
const LANGS = args.langs ? args.langs.split(',') : ['id', 'en'];

// key, live path, new paths per language, languages compared
const PAGES = [
  ['home', '/', { id: '/id/', en: '/en/' }, ['id', 'en']],
  ['services', '/services', { id: '/id/layanan/', en: '/en/services/' }, ['id', 'en']],
  ['portfolio', '/portfolio', { id: '/id/portofolio/' }, ['id']],
  ['research', '/research', { id: '/id/riset/' }, ['id']],
  ['about', '/about', { id: '/id/tentang-kami/' }, ['id']],
  ['careers', '/careers', { id: '/id/karir/', en: '/en/careers/' }, ['id', 'en']],
  ['career-detail', '/careers/building-manager', { id: '/id/karir/building-manager/' }, ['id']],
  ['contact', '/contact', { id: '/id/kontak/' }, ['id']],
];

const FREEZE = `*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}
.client-marquee-track{transform:none!important}`;

async function prepare(page, url, { live, lang }) {
  await page.goto(url, { waitUntil: 'networkidle' });
  if (live && lang === 'en') {
    // The live site keeps the language in React state: switch it with its own toggle.
    const toggle = page.locator('header button', { hasText: /^(ID \/ EN|ID)$/ }).filter({ visible: true }).first();
    await toggle.click();
    await page.waitForTimeout(400);
  }
  await page.addStyleTag({ content: FREEZE });
  await page.evaluate(async () => {
    await document.fonts.ready;
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
    // Hidden lazy images (e.g. the second marquee copy under reduced motion) never load: cap the wait.
    const loads = [...document.images].map((img) => (img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; })));
    await Promise.race([Promise.all(loads), new Promise((r) => setTimeout(r, 5000))]);
  });
  await page.waitForTimeout(500);
}

/** Top-level page regions in document order, with their visible text. */
async function regions(page) {
  return page.evaluate(() => {
    const els = [
      document.querySelector('header'),
      ...document.querySelectorAll('main section'),
      document.querySelector('footer'),
    ].filter((el) => el && !el.parentElement.closest('main section'));
    return els.map((el) => {
      const r = el.getBoundingClientRect();
      const heading = el.querySelector('h1, h2')?.innerText ?? '';
      return {
        name: `${el.tagName.toLowerCase()}${el.className ? '.' + String(el.className).trim().split(/\s+/)[0] : ''}${heading ? ` "${heading.slice(0, 40)}"` : ''}`,
        box: { x: 0, y: Math.round(r.top + window.scrollY), width: document.documentElement.clientWidth, height: Math.round(r.height) },
        text: el.innerText.split('\n').map((l) => l.replace(/\s+/g, ' ').trim()).filter(Boolean),
      };
    });
  });
}

async function raw(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

// pixelmatch's YIQ colour delta (Kotsarenko & Ramos), max 35215.
function delta(a, b, i) {
  const r1 = a[i], g1 = a[i + 1], b1 = a[i + 2], r2 = b[i], g2 = b[i + 1], b2 = b[i + 2];
  const y = (r1 - r2) * 0.29889531 + (g1 - g2) * 0.58662247 + (b1 - b2) * 0.11448223;
  const iq = (r1 - r2) * 0.59597799 - (g1 - g2) * 0.2741761 - (b1 - b2) * 0.32180189;
  const q = (r1 - r2) * 0.21147017 - (g1 - g2) * 0.52261711 + (b1 - b2) * 0.31114694;
  return 0.5053 * y * y + 0.299 * iq * iq + 0.1957 * q * q;
}
const LIMIT = 35215 * 0.1 * 0.1;

/** Compares two RGBA images; areas present in only one image count as different. */
function compare(a, b, diffOut) {
  const width = Math.max(a.width, b.width);
  const height = Math.max(a.height, b.height);
  let differing = 0;
  const out = diffOut ? Buffer.alloc(width * height * 4, 255) : null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inA = x < a.width && y < a.height;
      const inB = x < b.width && y < b.height;
      let same = false;
      if (inA && inB) same = delta(a.data, b.data, (y * a.width + x) * 4) <= LIMIT ? true : false;
      if (inA && inB && same) {
        if (out) {
          const v = a.data[(y * a.width + x) * 4 + 1];
          const o = (y * width + x) * 4;
          out[o] = out[o + 1] = out[o + 2] = 255 - Math.round((255 - v) * 0.15);
        }
      } else {
        differing++;
        if (out) {
          const o = (y * width + x) * 4;
          out[o] = 255; out[o + 1] = 0; out[o + 2] = 0;
        }
      }
    }
  }
  return { differing, total: width * height, percent: (100 * differing) / (width * height), out, width, height };
}
// Same pixel loop but comparing b's pixel at the same position (delta reads a and b at one index
// only when widths match; for different widths, fall back to a per-pixel index on each image).
function comparePair(a, b, diffOut) {
  if (a.width === b.width) return compare(a, b, diffOut);
  const w = Math.min(a.width, b.width);
  const crop = (img) => {
    const data = Buffer.alloc(w * img.height * 4);
    for (let y = 0; y < img.height; y++) img.data.copy(data, y * w * 4, y * img.width * 4, y * img.width * 4 + w * 4);
    return { data, width: w, height: img.height };
  };
  return compare(crop(a), crop(b), diffOut);
}

async function crop(buf, box, fullHeight) {
  const top = Math.max(0, Math.min(box.y, fullHeight - 1));
  const height = Math.max(1, Math.min(box.height, fullHeight - top));
  return raw(await sharp(buf).extract({ left: 0, top, width: box.width, height }).png().toBuffer());
}

/** Line diff (LCS): lines only on live, lines only on new. */
function textDiff(live, mine) {
  const n = live.length, m = mine.length;
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = live[i] === mine[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const onlyLive = [], onlyNew = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (live[i] === mine[j]) { i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) onlyLive.push(live[i++]); else onlyNew.push(mine[j++]);
  }
  while (i < n) onlyLive.push(live[i++]);
  while (j < m) onlyNew.push(mine[j++]);
  return { onlyLive, onlyNew };
}

async function shoot(browser, url, opts, width) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await prepare(page, url, opts);
  const full = await page.screenshot({ fullPage: true });
  const fold = await page.screenshot();
  const parts = await regions(page);
  const fullHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(300);
  const headerBox = await page.locator('header').first().boundingBox();
  const scrolledHeader = await page.screenshot({ clip: { x: 0, y: 0, width, height: Math.max(1, Math.round((headerBox?.y ?? 0) + (headerBox?.height ?? 90))) } });
  await ctx.close();
  return { full, fold, parts, fullHeight, scrolledHeader };
}

const pct = (x) => `${x.toFixed(2)}%`;

async function main() {
  mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = [];
  for (const [key, livePath, newPaths, langs] of PAGES) {
    if (ONLY && !ONLY.includes(key)) continue;
    for (const lang of langs.filter((l) => LANGS.includes(l))) {
      for (const width of WIDTHS) {
        const tag = `${key}-${lang}-${width}`;
        const live = await shoot(browser, LIVE + livePath, { live: true, lang }, width);
        const mine = await shoot(browser, NEW + newPaths[lang], { live: false, lang }, width);
        writeFileSync(join(OUT, `${tag}-live.png`), live.full);
        writeFileSync(join(OUT, `${tag}-new.png`), mine.full);
        const [lf, nf] = [await raw(live.full), await raw(mine.full)];
        const full = comparePair(lf, nf, true);
        await sharp(full.out, { raw: { width: full.width, height: full.height, channels: 4 } }).png().toFile(join(OUT, `${tag}-diff.png`));
        const fold = comparePair(await raw(live.fold), await raw(mine.fold));
        const header600 = comparePair(await raw(live.scrolledHeader), await raw(mine.scrolledHeader));
        const sections = [];
        const count = Math.max(live.parts.length, mine.parts.length);
        for (let i = 0; i < count; i++) {
          const l = live.parts[i], n = mine.parts[i];
          if (!l || !n) {
            sections.push({ name: (l ?? n).name, onlyOn: l ? 'live' : 'new', percent: 100, heights: [l?.box.height ?? 0, n?.box.height ?? 0], text: textDiff(l?.text ?? [], n?.text ?? []) });
            continue;
          }
          const d = comparePair(await crop(live.full, l.box, live.fullHeight), await crop(mine.full, n.box, mine.fullHeight));
          sections.push({ name: l.name, newName: n.name, percent: d.percent, heights: [l.box.height, n.box.height], text: textDiff(l.text, n.text) });
        }
        const row = { tag, full: full.percent, heights: [lf.height, nf.height], fold: fold.percent, header600: header600.percent, sections };
        report.push(row);
        console.log(`${tag.padEnd(28)} full ${pct(row.full).padStart(7)}  fold ${pct(row.fold).padStart(7)}  header@600 ${pct(row.header600).padStart(7)}  height ${lf.height}/${nf.height}`);
      }
    }
  }
  await browser.close();
  writeFileSync(join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  const md = ['# Live vs new', '', '| page | full | above fold | header @600 | height live/new |', '|---|---|---|---|---|'];
  for (const r of report) md.push(`| ${r.tag} | ${pct(r.full)} | ${pct(r.fold)} | ${pct(r.header600)} | ${r.heights.join(' / ')} |`);
  for (const r of report) {
    md.push('', `## ${r.tag}`, '', '| section | diff | height live/new | text only on live | text only on new |', '|---|---|---|---|---|');
    for (const s of r.sections) {
      const cell = (a) => a.map((x) => x.replace(/\|/g, '\\|')).join('<br>') || '';
      md.push(`| ${s.name}${s.onlyOn ? ` (only on ${s.onlyOn})` : ''} | ${pct(s.percent)} | ${s.heights.join(' / ')} | ${cell(s.text.onlyLive)} | ${cell(s.text.onlyNew)} |`);
    }
  }
  writeFileSync(join(OUT, 'report.md'), md.join('\n') + '\n');
  console.log(`\nReport: ${join(OUT, 'report.md')}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
