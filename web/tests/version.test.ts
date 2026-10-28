import { describe, expect, test } from 'vitest';
import { buildVersion } from '../scripts/version.mjs';

describe('buildVersion', () => {
  test('uses the GitHub commit SHA and an ISO timestamp', () => {
    const v = buildVersion({ GITHUB_SHA: 'a'.repeat(40) }, new Date('2026-10-28T12:00:00Z'));
    expect(v).toEqual({ commit: 'a'.repeat(40), builtAt: '2026-10-28T12:00:00.000Z' });
  });

  test('falls back to "local" outside CI', () => {
    expect(buildVersion({}, new Date(0)).commit).toBe('local');
    expect(buildVersion({ GITHUB_SHA: '   ' }, new Date(0)).commit).toBe('local');
  });

  test('ignores anything that is not a hex commit SHA', () => {
    expect(buildVersion({ GITHUB_SHA: '<script>' }, new Date(0)).commit).toBe('local');
  });
});
