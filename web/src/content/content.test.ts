import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { findBrandViolations } from './brand';
import { englishStrings, findBritishSpelling, findUnexplainedAbbreviations } from './rules';
import * as load from './load';

const dir = join(process.cwd(), 'content');
const COLLECTIONS: Record<string, () => unknown[]> = {
  'services.json': load.loadServices,
  'property-types.json': load.loadPropertyTypes,
  'pillars.json': load.loadPillars,
  'fieldwork.json': load.loadFieldwork,
  'engagement.json': load.loadEngagement,
  'standards.json': load.loadStandards,
  'portfolio.json': load.loadPortfolio,
  'clients.json': load.loadClients,
  'insights.json': load.loadInsights,
  'careers.json': load.loadJobs,
};

const strings = (v: unknown): string[] =>
  typeof v === 'string' ? [v] : Array.isArray(v) ? v.flatMap(strings) : v && typeof v === 'object' ? Object.values(v).flatMap(strings) : [];
const keys = (v: unknown): string[] =>
  Array.isArray(v) ? v.flatMap(keys) : v && typeof v === 'object' ? Object.entries(v).flatMap(([k, x]) => [k, ...keys(x)]) : [];

describe('content gate', () => {
  const files = readdirSync(dir).filter((f) => f.endsWith('.json'));

  test('every collection file has a loader', () => {
    const collectionFiles = files.filter((f) => !['settings.json', 'pages.json'].includes(f));
    expect(collectionFiles.sort()).toEqual(Object.keys(COLLECTIONS).sort());
  });

  test.each(Object.entries(COLLECTIONS))('%s validates', (_file, loader) => {
    expect(() => loader()).not.toThrow();
  });

  test.each(files)('%s has no number badges and correct brand casing', (file) => {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    expect(keys(data)).not.toContain('num');
    expect(strings(data).flatMap(findBrandViolations)).toEqual([]);
  });
});

describe('migrated company-wide content', () => {
  test('has every item from the old site', () => {
    expect(load.loadServices()).toHaveLength(6);
    expect(load.loadPropertyTypes()).toHaveLength(6);
    expect(load.loadPillars()).toHaveLength(5);
    expect(load.loadFieldwork()).toHaveLength(4);
    expect(load.loadEngagement()).toHaveLength(4);
    expect(load.loadStandards()).toHaveLength(5);
  });

  test('field photos reference files that will live in src/assets/photos and have alt text', () => {
    for (const f of load.loadFieldwork()) {
      expect(f.image.src).toMatch(/^[a-z-]+\.jpg$/);
      expect(f.image.alt.en.length).toBeGreaterThan(20);
    }
  });

  test('every referenced field photo exists in src/assets/photos', () => {
    for (const f of load.loadFieldwork()) {
      expect(existsSync(join(process.cwd(), 'src/assets/photos', f.image.src)), f.image.src).toBe(true);
    }
  });

  test('English is not a copy of the Indonesian text', () => {
    for (const s of load.loadServices()) expect(s.summary.en).not.toBe(s.summary.id);
    for (const p of load.loadPropertyTypes()) expect(p.detail.en).not.toBe(p.detail.id);
  });
});

describe('migrated portfolio, clients, insights', () => {
  test('has every item from the old site', () => {
    expect(load.loadPortfolio()).toHaveLength(12);
    expect(load.loadClients()).toHaveLength(14);
    expect(load.loadInsights()).toHaveLength(4);
  });

  test('portfolio sectors are the four known groups', () => {
    const sectors = new Set(load.loadPortfolio().map((p) => p.sector.en));
    expect([...sectors].sort()).toEqual(['Apartment', 'Mall & Commercial', 'Office Building', 'Real Estate & Facility']);
  });

  test('English locations and scopes are really English', () => {
    for (const p of load.loadPortfolio()) {
      expect(p.location.en, p.name).not.toMatch(/\b(Selatan|Pusat|Utara|Barat)\b/);
      expect(p.scope.en, p.name).not.toMatch(/\b(Pengelolaan|Manajemen|serta|dan)\b/);
      expect(p.scope.en).not.toBe(p.scope.id);
    }
  });

  test('every insight has at least three highlights in each language', () => {
    for (const i of load.loadInsights()) expect(i.highlights.en.length).toBeGreaterThanOrEqual(3);
  });
});

describe('migrated careers', () => {
  const jobs = () => load.loadJobs();

  test('keeps the five distinct jobs and drops the old "(Copy)" duplicate', () => {
    expect(jobs().map((j) => j.slug)).toEqual([
      'building-manager', 'chief-engineer', 'tenant-relations-officer', 'finance-supervisor', 'hse-officer',
    ]);
    for (const j of jobs()) expect(j.title.en).not.toMatch(/copy/i);
  });

  test('uses the company mail domain for applications', () => {
    for (const j of jobs()) expect(j.applicationEmail).toMatch(/@promind\.co\.id$/);
  });

  test('every job lists at least three items per list in both languages', () => {
    for (const j of jobs()) {
      for (const l of [j.responsibilities, j.qualifications, j.benefits]) {
        expect(l.id.length, j.slug).toBeGreaterThanOrEqual(3);
        expect(l.en.length).toBe(l.id.length);
      }
    }
  });

  test('English job text contains no leftover Indonesian words', () => {
    const bad = /\b(dan|serta|untuk|pengalaman|minimal|gedung|yang|dengan)\b/i;
    for (const j of jobs()) {
      for (const v of [j.summary.en, j.experience.en, j.location.en, ...j.responsibilities.en, ...j.qualifications.en, ...j.benefits.en]) {
        expect(v, `${j.slug}: ${v}`).not.toMatch(bad);
      }
    }
  });
});

describe('page copy', () => {
  const pages = () => load.loadPages();
  const seoOf = () => Object.entries(pages()).map(([key, p]) => [key, (p as { seo: { title: { id: string; en: string }; description: { id: string; en: string } } }).seo] as const);

  test('every page has SEO text with a PROMIND title and a description of 70-170 characters', () => {
    expect(seoOf().map(([k]) => k).sort()).toEqual(['about', 'careers', 'contact', 'home', 'insights', 'portfolio', 'services']);
    for (const [key, seo] of seoOf()) {
      for (const lang of ['id', 'en'] as const) {
        expect(seo.title[lang], `${key}.${lang}`).toMatch(/PROMIND/);
        expect(seo.description[lang].length, `${key}.${lang}`).toBeGreaterThanOrEqual(70);
        expect(seo.description[lang].length, `${key}.${lang}`).toBeLessThanOrEqual(170);
      }
    }
  });

  test('the home page has exactly one call to action pointing at a real route', () => {
    const cta = pages().home.hero.cta;
    expect(Object.keys(pages().home.hero).filter((k) => k.startsWith('cta'))).toEqual(['cta']);
    expect(['services', 'portfolio', 'research', 'about', 'careers', 'contact']).toContain(cta.route);
  });

  test('the hero highlight is the end of the hero title in both languages', () => {
    const { title, titleHighlight } = pages().home.hero;
    for (const lang of ['id', 'en'] as const) expect(title[lang].endsWith(titleHighlight[lang]), lang).toBe(true);
  });

  test('every page-level call to action points at a real route', () => {
    const { hero, contact } = pages().home;
    for (const link of [hero.cta, hero.secondaryLink, contact.cardLink]) {
      expect(['services', 'portfolio', 'research', 'about', 'careers', 'contact']).toContain(link.route);
    }
  });

  test('technology section has three steps and the about story has three paragraphs', () => {
    expect(pages().home.technology.steps).toHaveLength(3);
    expect(pages().about.story.id).toHaveLength(3);
    expect(pages().contact.serviceAreas.id).toHaveLength(6);
    expect(pages().contact.propertyTypes.id).toHaveLength(4);
  });
});

describe('English is US English', () => {
  test.each(readdirSync(dir).filter((f) => f.endsWith('.json')))('%s uses US spelling and spells out abbreviations', (file) => {
    const data = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const issues = englishStrings(data).flatMap(([path, text]) => [
      ...findBritishSpelling(text).map((w) => `${path}: ${w}`),
      ...findUnexplainedAbbreviations(text).map((w) => `${path}: ${w}`),
    ]);
    expect(issues).toEqual([]);
  });
});
