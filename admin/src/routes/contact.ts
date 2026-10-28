import { Hono } from 'hono';
import { ContactError, MAX_BODY_BYTES, submitContact } from '../contact';
import { ctxOf, type AppEnv } from '../middleware';

export const contactRoutes = new Hono<AppEnv>();

/** Origin yang boleh memanggil: situs sendiri (SITE_ORIGIN) atau origin yang sama dengan permintaan (rute staging/produksi). */
function allowedOrigin(origin: string | undefined, requestUrl: string, siteOrigin: string): origin is string {
  return !!origin && (origin === new URL(requestUrl).origin || origin === siteOrigin);
}

function cors(headers: Headers, origin: string, requestUrl: string): void {
  headers.append('Vary', 'Origin');
  if (origin !== new URL(requestUrl).origin) headers.set('Access-Control-Allow-Origin', origin);
}

contactRoutes.options('/', (c) => {
  const origin = c.req.header('Origin');
  if (!allowedOrigin(origin, c.req.url, c.env.SITE_ORIGIN)) return c.json({ error: 'bad_origin' }, 403);
  const res = new Response(null, { status: 204 });
  cors(res.headers, origin, c.req.url);
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  res.headers.set('Access-Control-Max-Age', '600');
  return res;
});

contactRoutes.post('/', async (c) => {
  const origin = c.req.header('Origin');
  if (!allowedOrigin(origin, c.req.url, c.env.SITE_ORIGIN)) return c.json({ error: 'bad_origin' }, 403);
  const respond = (body: unknown, status: 200 | 400 | 413 | 429 | 502): Response => {
    const res = c.json(body, status);
    cors(res.headers, origin, c.req.url);
    return res;
  };

  if (Number(c.req.header('Content-Length') ?? 0) > MAX_BODY_BYTES) return respond({ error: 'too_large' }, 413);
  const text = await c.req.text();
  if (text.length > MAX_BODY_BYTES) return respond({ error: 'too_large' }, 413);
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return respond({ error: 'bad_request' }, 400);
  }
  try {
    const ip = c.req.header('CF-Connecting-IP') ?? 'unknown';
    return respond(await submitContact({ c: ctxOf(c.env), env: c.env, fetchImpl: c.get('fetchImpl') }, raw, ip), 200);
  } catch (e) {
    if (e instanceof ContactError) return respond({ error: e.code }, e.status === 413 ? 413 : e.status);
    throw e;
  }
});
