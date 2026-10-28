import { describe, expect, test } from 'vitest';
import { hmacSha256Hex } from '../src/contact';
import type { Env } from '../src/env';
import { createApp } from '../src/worker';
import { createTestDb } from './support/d1';

const SITE = 'https://promind.co.id';
const MAILER = 'https://promind.co.id/mail/contact-mailer.php';
const HMAC_KEY = 'k'.repeat(40);

function stack(opts: { turnstile?: boolean | 'throw'; mailerStatus?: number } = {}) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url);
    calls.push({ url, init });
    if (url.startsWith('https://challenges.cloudflare.com/')) {
      if (opts.turnstile === 'throw') throw new Error('network down');
      return Response.json({ success: opts.turnstile ?? true });
    }
    if (url === MAILER) return new Response('{"detail":"smtp exploded with secret"}', { status: opts.mailerStatus ?? 200 });
    return new Response('nope', { status: 404 });
  }) as typeof fetch;
  const db = createTestDb();
  const env = {
    DB: db, ADMIN_ORIGIN: 'https://admin.promind.co.id', SITE_ORIGIN: SITE, CONTACT_HMAC_KEY: HMAC_KEY,
    CONTACT_MAILER_URL: MAILER, TURNSTILE_SECRET: 'ts-secret',
  } as unknown as Env;
  const app = createApp({ fetchImpl });
  const valid = () => ({
    name: 'Budi Santoso', email: 'budi@example.com', phone: '+62 811-1234-5678', topic: 'Pengelolaan Gedung Perkantoran',
    message: 'Kami ingin mendiskusikan pengelolaan gedung kami di Jakarta Selatan.', lang: 'id', turnstileToken: 'tok-123', website: '',
  });
  const post = (body: unknown, h: Record<string, string> = {}, url = 'https://admin.promind.co.id/api/contact') =>
    app.request(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: SITE, 'CF-Connecting-IP': '203.0.113.5', ...h }, body: typeof body === 'string' ? body : JSON.stringify(body) }, env);
  return { calls, post, valid, app, env };
}
const mailerCalls = (s: ReturnType<typeof stack>) => s.calls.filter((c) => c.url === MAILER);

describe('hmacSha256Hex', () => {
  test('matches the well-known HMAC-SHA256 test vector', async () => {
    expect(await hmacSha256Hex('key', 'The quick brown fox jumps over the lazy dog')).toBe(
      'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8',
    );
  });
});

describe('POST /api/contact', () => {
  test('sends one signed message to the mailer after Turnstile passes', async () => {
    const s = stack();
    const res = await s.post(s.valid());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const ts = s.calls.find((c) => c.url.startsWith('https://challenges.cloudflare.com/'))!;
    const form = new URLSearchParams(String(ts.init.body));
    expect(form.get('secret')).toBe('ts-secret');
    expect(form.get('response')).toBe('tok-123');
    expect(form.get('remoteip')).toBe('203.0.113.5');

    expect(mailerCalls(s)).toHaveLength(1);
    const m = mailerCalls(s)[0]!;
    const h = new Headers(m.init.headers);
    const body = String(m.init.body);
    const stamp = h.get('X-Timestamp')!;
    expect(Math.abs(Number(stamp) - Date.now() / 1000)).toBeLessThan(5);
    expect(h.get('X-Signature')).toBe(await hmacSha256Hex(HMAC_KEY, `${stamp}.${body}`));
    expect(JSON.parse(body)).toEqual({
      name: 'Budi Santoso', email: 'budi@example.com', phone: '+62 811-1234-5678', topic: 'Pengelolaan Gedung Perkantoran',
      message: 'Kami ingin mendiskusikan pengelolaan gedung kami di Jakarta Selatan.', lang: 'id', ip: '203.0.113.5',
    });
  });

  test('a failed Turnstile check is refused before anything is sent', async () => {
    const s = stack({ turnstile: false });
    const res = await s.post(s.valid());
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'turnstile_failed' });
    expect(mailerCalls(s)).toHaveLength(0);
  });

  test('an unreachable Turnstile fails closed', async () => {
    const s = stack({ turnstile: 'throw' });
    const res = await s.post(s.valid());
    expect(res.status).toBe(502);
    expect(mailerCalls(s)).toHaveLength(0);
  });

  test('a filled honeypot pretends success and makes no outside calls at all', async () => {
    const s = stack();
    const res = await s.post({ ...s.valid(), website: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(s.calls).toHaveLength(0);
  });

  const bad: [string, (v: any) => any][] = [
    ['invalid email', (v) => ({ ...v, email: 'bukan-email' })],
    ['newline in name (header injection)', (v) => ({ ...v, name: 'Budi\r\nBcc: x@evil.example' })],
    ['newline in topic', (v) => ({ ...v, topic: 'a\nb' })],
    ['empty name', (v) => ({ ...v, name: '  ' })],
    ['short message', (v) => ({ ...v, message: 'halo' })],
    ['huge message', (v) => ({ ...v, message: 'x'.repeat(4001) })],
    ['missing topic', (v) => ({ ...v, topic: undefined })],
    ['unknown language', (v) => ({ ...v, lang: 'fr' })],
    ['letters in phone', (v) => ({ ...v, phone: 'telepon-saya' })],
    ['missing token', (v) => ({ ...v, turnstileToken: '' })],
  ];
  test.each(bad)('rejects %s with 400 and sends nothing', async (_n, mutate) => {
    const s = stack();
    const res = await s.post(mutate(s.valid()));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'bad_request' });
    expect(s.calls).toHaveLength(0);
  });

  test('malformed or oversized bodies are refused', async () => {
    const s = stack();
    expect((await s.post('not json')).status).toBe(400);
    expect((await s.post(JSON.stringify({ ...s.valid(), message: 'x'.repeat(60_000) }), { 'Content-Length': '60100' })).status).toBe(413);
    expect(s.calls).toHaveLength(0);
  });

  test('allows 5 messages per hour per IP, the 6th is rate limited; other IPs are unaffected', async () => {
    const s = stack();
    for (let i = 0; i < 5; i++) expect((await s.post(s.valid())).status, `#${i + 1}`).toBe(200);
    const sixth = await s.post(s.valid());
    expect(sixth.status).toBe(429);
    expect(await sixth.json()).toEqual({ error: 'rate_limited' });
    expect(mailerCalls(s)).toHaveLength(5);
    expect((await s.post(s.valid(), { 'CF-Connecting-IP': '203.0.113.99' })).status).toBe(200);
  });

  test('a mailer failure is a 502 that leaks nothing', async () => {
    const s = stack({ mailerStatus: 500 });
    const res = await s.post(s.valid());
    expect(res.status).toBe(502);
    const text = await res.text();
    expect(text).not.toContain('smtp');
    expect(JSON.parse(text)).toEqual({ error: 'mail_unavailable' });
  });
});

describe('origin and CORS', () => {
  test('foreign or missing Origin is refused', async () => {
    const s = stack();
    expect((await s.post(s.valid(), { Origin: 'https://evil.example' })).status).toBe(403);
    const noOrigin = await s.app.request('https://admin.promind.co.id/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s.valid()) }, s.env);
    expect(noOrigin.status).toBe(403);
    expect(s.calls).toHaveLength(0);
  });

  test('the site origin gets CORS headers; a same-origin call (staging route) works without them', async () => {
    const s = stack();
    const cross = await s.post(s.valid());
    expect(cross.headers.get('access-control-allow-origin')).toBe(SITE);
    const staging = await s.post(s.valid(), { Origin: 'https://staging.promind.co.id' }, 'https://staging.promind.co.id/api/contact');
    expect(staging.status).toBe(200);
    expect(staging.headers.get('access-control-allow-origin')).toBeNull();
  });

  test('preflight is answered for the site and refused for strangers', async () => {
    const s = stack();
    const ok = await s.app.request('https://admin.promind.co.id/api/contact', { method: 'OPTIONS', headers: { Origin: SITE, 'Access-Control-Request-Method': 'POST' } }, s.env);
    expect(ok.status).toBe(204);
    expect(ok.headers.get('access-control-allow-origin')).toBe(SITE);
    expect(ok.headers.get('access-control-allow-methods')).toContain('POST');
    const bad = await s.app.request('https://admin.promind.co.id/api/contact', { method: 'OPTIONS', headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' } }, s.env);
    expect(bad.status).toBe(403);
    expect(bad.headers.get('access-control-allow-origin')).toBeNull();
  });

  test('the admin CSRF rules still protect every other route', async () => {
    const s = stack();
    const res = await s.app.request('https://admin.promind.co.id/api/auth/logout', { method: 'POST', headers: { Origin: SITE } }, s.env);
    expect(res.status).toBe(403);
  });
});
