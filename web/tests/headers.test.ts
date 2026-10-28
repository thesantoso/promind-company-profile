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

  test('allows Cloudflare Turnstile (script and frame) and nothing else new', () => {
    const csp = /Content-Security-Policy:\s*(.+)/.exec(headers)?.[1] ?? '';
    expect(csp).toMatch(/script-src 'self' https:\/\/challenges\.cloudflare\.com;/);
    expect(csp).toMatch(/frame-src https:\/\/challenges\.cloudflare\.com;/);
    expect(csp).toContain("connect-src 'self'");
    expect((csp.match(/https?:\/\/[^\s;]+/g) ?? []).every((u) => u === 'https://challenges.cloudflare.com')).toBe(true);
  });

  test('version.json is never cached and may be read by the admin portal only', () => {
    const block = /\/version\.json\n((?:[ \t]+.+\n?)+)/.exec(headers)?.[1] ?? '';
    expect(block).toContain('Cache-Control: no-store');
    expect(block).toContain('Access-Control-Allow-Origin: https://admin.promind.co.id');
    expect(block).not.toContain('*');
  });
});
