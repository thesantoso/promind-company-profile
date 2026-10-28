import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { findBrandViolations } from './brand';
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
