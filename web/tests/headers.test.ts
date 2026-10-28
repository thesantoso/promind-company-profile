import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';

const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');

describe('public/_headers', () => {
  test.each([
    'Content-Security-Policy:',
    'Strict-Transport-Security: max-age=31536000; includeSubDomains',
    'X-Content-Type-Options: nosniff',
    'Referrer-Policy: strict-origin-when-cross-origin',
    'Permissions-Policy: camera=(), microphone=(), geolocation=()',
  ])('sets %s', (line) => {
    expect(headers).toContain(line);
  });

  test('CSP forbids inline and eval code and framing', () => {
    const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1] ?? '';
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  test('hashed assets are immutable for a year', () => {
    expect(headers).toMatch(/\/_astro\/\*\s+Cache-Control: public, max-age=31536000, immutable/);
  });
});
