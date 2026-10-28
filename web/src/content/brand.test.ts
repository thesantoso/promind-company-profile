import { describe, expect, test } from 'vitest';
import { findBrandViolations } from './brand';

describe('findBrandViolations', () => {
  test('flags mixed-case brand names in prose', () => {
    expect(findBrandViolations('Welcome to Promind Tower')).toEqual(['Promind']);
    expect(findBrandViolations('ProMind and Proapps')).toEqual(['ProMind', 'Proapps']);
  });

  test('allows the uppercase brand and hostnames or emails', () => {
    expect(findBrandViolations('PROMIND menyediakan layanan PROAPPS')).toEqual([]);
    expect(findBrandViolations('corporate@promind.co.id')).toEqual([]);
    expect(findBrandViolations('https://www.promind.co.id/id/')).toEqual([]);
  });
});
