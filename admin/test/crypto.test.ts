import { describe, expect, test } from 'vitest';
import {
  PBKDF2_ITERATIONS, decryptSecret, encryptSecret, hashPassword, randomToken, sha256Hex, timingSafeEqual, verifyPassword,
} from '../src/crypto';

const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i + 1)));

describe('password hashing', () => {
  test('uses PBKDF2-SHA512 at the iteration count measured on Workers (100000)', async () => {
    expect(PBKDF2_ITERATIONS).toBe(100_000);
    const h = await hashPassword('correct horse battery');
    expect(h.startsWith('pbkdf2-sha512$100000$')).toBe(true);
    expect(h.split('$')).toHaveLength(4);
  });

  test('verifies the right password and rejects wrong ones', async () => {
    const h = await hashPassword('correct horse battery');
    expect(await verifyPassword('correct horse battery', h)).toBe(true);
    expect(await verifyPassword('correct horse batterz', h)).toBe(false);
    expect(await verifyPassword('', h)).toBe(false);
  });

  test('salts differ so equal passwords never hash equal', async () => {
    expect(await hashPassword('same-password-123')).not.toBe(await hashPassword('same-password-123'));
  });

  test.each(['', 'plain', 'pbkdf2-sha512$abc$x$y', 'pbkdf2-sha1$100000$AAAA$BBBB', 'pbkdf2-sha512$100000$AAAA'])(
    'refuses malformed stored hash %j',
    async (stored) => {
      expect(await verifyPassword('anything', stored)).toBe(false);
    },
  );

  test('refuses an iteration count above the runtime limit instead of throwing', async () => {
    expect(await verifyPassword('x', 'pbkdf2-sha512$999999$AAAAAAAAAAAAAAAAAAAAAA$AAAA')).toBe(false);
  });
});

describe('tokens and digests', () => {
  test('randomToken is url-safe, long and unique', () => {
    const a = randomToken();
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(randomToken()).not.toBe(a);
    expect(randomToken(16)).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  test('sha256Hex matches the known digest of "abc"', async () => {
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  test('timingSafeEqual compares equal, different and different-length strings', () => {
    expect(timingSafeEqual('abc', 'abc')).toBe(true);
    expect(timingSafeEqual('abc', 'abd')).toBe(false);
    expect(timingSafeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('secret encryption (AES-GCM)', () => {
  test('round-trips', async () => {
    const blob = await encryptSecret('JBSWY3DPEHPK3PXP', KEY);
    expect(blob).not.toContain('JBSWY3DPEHPK3PXP');
    expect(await decryptSecret(blob, KEY)).toBe('JBSWY3DPEHPK3PXP');
  });

  test('uses a fresh IV each time', async () => {
    expect(await encryptSecret('x', KEY)).not.toBe(await encryptSecret('x', KEY));
  });

  test('a flipped byte or the wrong key fails to decrypt', async () => {
    const blob = await encryptSecret('secret', KEY);
    const parts = blob.split('.');
    const ct = atob(parts[2]!.replace(/-/g, '+').replace(/_/g, '/'));
    const flipped = ct.slice(0, 2) + String.fromCharCode(ct.charCodeAt(2) ^ 1) + ct.slice(3);
    const bad = `${parts[0]}.${parts[1]}.${btoa(flipped).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
    await expect(decryptSecret(bad, KEY)).rejects.toThrow();
    const otherKey = btoa(String.fromCharCode(...new Uint8Array(32).fill(9)));
    await expect(decryptSecret(blob, otherKey)).rejects.toThrow();
  });

  test('rejects a key that is not 32 bytes', async () => {
    await expect(encryptSecret('x', btoa('short'))).rejects.toThrow();
  });
});
