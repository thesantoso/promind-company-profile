import { expect, test } from 'vitest';
import { ordinal } from './ordinal';

test('ordinal pads to two digits from a zero-based index', () => {
  expect(ordinal(0)).toBe('01');
  expect(ordinal(8)).toBe('09');
  expect(ordinal(11)).toBe('12');
});
