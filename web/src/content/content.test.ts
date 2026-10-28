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
