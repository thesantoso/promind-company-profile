import { describe, expect, test } from 'vitest';
import { formatDate, formatIDR, formatNumber } from './format';

const plain = (s: string) => s.replace(/\s/g, ' ');

describe('formatters', () => {
  test('formatDate follows each language', () => {
    expect(formatDate('2026-10-28', 'id')).toBe('28 Oktober 2026');
    expect(formatDate('2026-10-28', 'en')).toBe('October 28, 2026');
  });

  test('formatDate is timezone-stable near midnight UTC', () => {
    expect(formatDate(new Date('2026-12-31T23:30:00Z'), 'en')).toBe('December 31, 2026');
  });

  test('formatNumber uses locale separators', () => {
    expect(formatNumber(1500000, 'id')).toBe('1.500.000');
    expect(formatNumber(1500000, 'en')).toBe('1,500,000');
  });

  test('formatIDR has no decimals and the right symbol', () => {
    const id = plain(formatIDR(1500000, 'id'));
    const en = plain(formatIDR(1500000, 'en'));
    expect(id).toContain('Rp');
    expect(id).toContain('1.500.000');
    expect(en).toContain('IDR');
    expect(en).toContain('1,500,000');
    expect(en).not.toContain('.00');
  });
});
