import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const css = readFileSync(new URL('./global.css', import.meta.url), 'utf8');
const tokenValue = (name: string) =>
  new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`).exec(css)?.[1]?.toLowerCase();

describe('design tokens', () => {
  test.each([
    ['--color-surface', '#ffffff'],
    ['--color-bg', '#f6f5f1'],
    ['--color-heading', '#172b42'],
    ['--color-body', '#526374'],
    ['--color-accent', '#2b5caf'],
    ['--color-accent-hover', '#194586'],
    ['--color-navy', '#183b68'],
  ])('%s is %s', (name, hex) => {
    expect(tokenValue(name)).toBe(hex);
  });

  test('fonts are self-hosted, never Google Fonts', () => {
    expect(css).not.toContain('fonts.googleapis.com');
    expect(css).toContain('@fontsource-variable/manrope');
    expect(css).toContain('@fontsource-variable/dm-sans');
  });

  test('honours prefers-reduced-motion', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });
});
