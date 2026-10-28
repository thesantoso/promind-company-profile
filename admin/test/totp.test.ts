import { describe, expect, test } from 'vitest';
import { base32Decode, base32Encode, generateTotpSecret, otpauthUri, totpCode, verifyTotp } from '../src/totp';

// RFC 6238 appendix B: SHA-1 secret "12345678901234567890"; the 6-digit code is the last 6 digits of the 8-digit values.
const RFC_SECRET = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
const VECTORS: [number, string][] = [
  [59, '287082'],
  [1111111109, '081804'],
  [1111111111, '050471'],
  [1234567890, '005924'],
  [2000000000, '279037'],
  [20000000000, '353130'],
];

describe('base32', () => {
  test('round-trips and matches the RFC secret', () => {
    expect(base32Encode(new TextEncoder().encode('12345678901234567890'))).toBe(RFC_SECRET);
    expect(new TextDecoder().decode(base32Decode(RFC_SECRET))).toBe('12345678901234567890');
  });
  test('tolerates lowercase, spaces and padding', () => {
    expect(new TextDecoder().decode(base32Decode('gezd gnbv gy3t qojq gezd gnbv gy3t qojq=='))).toBe('12345678901234567890');
  });
  test('rejects characters outside the alphabet', () => {
    expect(() => base32Decode('GEZD1!')).toThrow();
  });
});

describe('totpCode', () => {
  test.each(VECTORS)('matches RFC 6238 at t=%i', async (t, code) => {
    expect(await totpCode(RFC_SECRET, t * 1000)).toBe(code);
  });
});

describe('verifyTotp', () => {
  const t = 1111111111 * 1000;
  test('accepts the current code and returns its time step', async () => {
    expect(await verifyTotp(RFC_SECRET, '050471', t)).toBe(Math.floor(1111111111 / 30));
  });
  test('accepts one step either side, rejects two steps away', async () => {
    expect(await verifyTotp(RFC_SECRET, '050471', t + 30_000)).not.toBeNull();
    expect(await verifyTotp(RFC_SECRET, '050471', t - 30_000)).not.toBeNull();
    expect(await verifyTotp(RFC_SECRET, '050471', t + 60_000)).toBeNull();
    expect(await verifyTotp(RFC_SECRET, '050471', t - 60_000)).toBeNull();
  });
  test.each(['', '12345', '1234567', 'abcdef', '05047 1', '０５０４７１'])('rejects malformed code %j', async (code) => {
    expect(await verifyTotp(RFC_SECRET, code, t)).toBeNull();
  });
  test('rejects a wrong code', async () => {
    expect(await verifyTotp(RFC_SECRET, '000000', t)).toBeNull();
  });
});

describe('enrolment helpers', () => {
  test('generateTotpSecret is 32 base32 chars (20 bytes) and random', () => {
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{32}$/);
    expect(generateTotpSecret()).not.toBe(s);
  });
  test('otpauthUri names the issuer and account', () => {
    const u = otpauthUri('rizky@promind.co.id', RFC_SECRET);
    expect(u.startsWith('otpauth://totp/PROMIND%20Admin:rizky%40promind.co.id?')).toBe(true);
    expect(u).toContain(`secret=${RFC_SECRET}`);
    expect(u).toContain('issuer=PROMIND%20Admin');
    expect(u).toContain('digits=6');
    expect(u).toContain('period=30');
  });
});
