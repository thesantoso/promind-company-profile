/** Primitif kripto berbasis WebCrypto saja (jalan di Workers dan Node). */

/** Batas keras runtime Workers adalah 100000; diukur lolos 10/10 di paket gratis (lihat docs/decisions.md). */
export const PBKDF2_ITERATIONS = 100_000;
const SCHEME = 'pbkdf2-sha512';

const enc = new TextEncoder();
const bytes = (a: ArrayBuffer | Uint8Array): Uint8Array => (a instanceof Uint8Array ? a : new Uint8Array(a));

export function b64encode(data: ArrayBuffer | Uint8Array): string {
  let s = '';
  for (const b of bytes(data)) s += String.fromCharCode(b);
  return btoa(s);
}

export function b64decode(text: string): Uint8Array {
  const std = text.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(std + '='.repeat((4 - (std.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

const b64url = (data: ArrayBuffer | Uint8Array): string =>
  b64encode(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function randomToken(size = 32): string {
  return b64url(crypto.getRandomValues(new Uint8Array(size)));
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(a: string, b: string): boolean {
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  const len = Math.max(x.length, y.length);
  for (let i = 0; i < len; i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-512', salt, iterations }, key, 512);
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await derive(password, salt, PBKDF2_ITERATIONS);
  return `${SCHEME}$${PBKDF2_ITERATIONS}$${b64encode(salt)}$${b64encode(hash)}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const parts = stored.split('$');
    if (parts.length !== 4 || parts[0] !== SCHEME) return false;
    const iterations = Number(parts[1]);
    if (!Number.isInteger(iterations) || iterations < 1 || iterations > PBKDF2_ITERATIONS) return false;
    const salt = b64decode(parts[2]!);
    const expected = parts[3]!;
    if (salt.length < 8 || !expected) return false;
    return timingSafeEqual(b64encode(await derive(password, salt, iterations)), expected);
  } catch {
    return false;
  }
}

async function aesKey(keyB64: string, usage: KeyUsage): Promise<CryptoKey> {
  const raw = b64decode(keyB64);
  if (raw.length !== 32) throw new Error('ENCRYPTION_KEY must be 32 bytes (base64)');
  return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, [usage]);
}

export async function encryptSecret(plain: string, keyB64: string): Promise<string> {
  const key = await aesKey(keyB64, 'encrypt');
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
  return `v1.${b64url(iv)}.${b64url(ct)}`;
}

export async function decryptSecret(blob: string, keyB64: string): Promise<string> {
  const [version, iv, ct] = blob.split('.');
  if (version !== 'v1' || !iv || !ct) throw new Error('unknown secret format');
  const key = await aesKey(keyB64, 'decrypt');
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b64decode(iv) }, key, b64decode(ct));
  return new TextDecoder().decode(plain);
}
