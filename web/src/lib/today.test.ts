import { describe, expect, test } from 'vitest';
import { todayUtc } from './today';

describe('todayUtc', () => {
  test('formats the UTC calendar date, not the local one', () => {
    expect(todayUtc(new Date('2026-12-31T23:30:00-05:00'))).toBe('2027-01-01');
    expect(todayUtc(new Date('2026-10-28T00:30:00+07:00'))).toBe('2026-10-27');
  });

  test('defaults to the current moment and returns YYYY-MM-DD', () => {
    expect(todayUtc()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
