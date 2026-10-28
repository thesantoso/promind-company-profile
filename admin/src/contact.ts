import { z } from 'zod';
import type { Ctx } from './auth';

const enc = new TextEncoder();

/** HMAC-SHA256 dalam heksadesimal; dipakai menandatangani payload ke endpoint PHP di Rumahweb. */
export async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(message)));
  return [...mac].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export class ContactError extends Error {
  constructor(readonly code: string, readonly status: 400 | 413 | 429 | 502) {
    super(code);
  }
}

const noBreaks = (s: string) => !/[\r\n\u2028\u2029\u0000]/.test(s);
const line = (max: number) => z.string().trim().min(1).max(max).refine(noBreaks, { message: 'no line breaks' });

export const contactSchema = z.object({
  name: line(80),
  email: z.email().max(254).refine(noBreaks),
  phone: z
    .string()
    .trim()
    .max(30)
    .regex(/^[0-9+()\-\s.]{6,30}$/)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  topic: line(120),
  message: z.string().trim().min(10).max(4000),
  lang: z.enum(['id', 'en']),
  turnstileToken: z.string().min(1).max(2048),
  website: z.string().max(500).optional(),
});

const RATE_WINDOW_S = 3600;
const RATE_MAX = 5;
export const MAX_BODY_BYTES = 50_000;

export async function verifyTurnstile(secret: string, token: string, ip: string, fetchImpl: typeof fetch): Promise<boolean> {
  let res: Response;
  try {
    res = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }).toString(),
    });
  } catch {
    throw new ContactError('turnstile_unavailable', 502);
  }
  if (!res.ok) throw new ContactError('turnstile_unavailable', 502);
  const body = (await res.json().catch(() => ({}))) as { success?: boolean };
  return body.success === true;
}

export interface ContactEnv {
  CONTACT_HMAC_KEY: string;
  CONTACT_MAILER_URL: string;
  TURNSTILE_SECRET: string;
}

export async function submitContact(
  deps: { c: Ctx; env: ContactEnv; fetchImpl: typeof fetch },
  raw: unknown,
  ip: string,
): Promise<{ ok: true }> {
  const { c, env, fetchImpl } = deps;
  // Honeypot: bot mengisi kolom tersembunyi. Pura-pura berhasil tanpa panggilan keluar.
  if (raw && typeof raw === 'object' && typeof (raw as { website?: unknown }).website === 'string' && (raw as { website: string }).website.trim() !== '') {
    return { ok: true };
  }
  const parsed = contactSchema.safeParse(raw);
  if (!parsed.success) throw new ContactError('bad_request', 400);
  const input = parsed.data;

  const key = `contact:${ip}`;
  const since = Math.floor(c.now() / 1000) - RATE_WINDOW_S;
  const used = await c.db.prepare('SELECT COUNT(*) AS n FROM login_attempts WHERE key = ? AND ts > ?').bind(key, since).first<{ n: number }>();
  if ((used?.n ?? 0) >= RATE_MAX) throw new ContactError('rate_limited', 429);
  await c.db.prepare('INSERT INTO login_attempts (key, ts) VALUES (?, ?)').bind(key, Math.floor(c.now() / 1000)).run();

  if (!(await verifyTurnstile(env.TURNSTILE_SECRET, input.turnstileToken, ip, fetchImpl))) {
    throw new ContactError('turnstile_failed', 400);
  }

  const payload = JSON.stringify({
    name: input.name,
    email: input.email,
    ...(input.phone ? { phone: input.phone } : {}),
    topic: input.topic,
    message: input.message,
    lang: input.lang,
    ip,
  });
  const ts = String(Math.floor(c.now() / 1000));
  let res: Response;
  try {
    res = await fetchImpl(env.CONTACT_MAILER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Timestamp': ts,
        'X-Signature': await hmacSha256Hex(env.CONTACT_HMAC_KEY, `${ts}.${payload}`),
      },
      body: payload,
    });
  } catch {
    throw new ContactError('mail_unavailable', 502);
  }
  if (!res.ok) throw new ContactError('mail_unavailable', 502);
  return { ok: true };
}
