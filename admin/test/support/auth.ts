import { hashPassword, encryptSecret } from '../../src/crypto';
import { generateTotpSecret, totpCode } from '../../src/totp';
import type { Ctx } from '../../src/auth';
import { createTestDb } from './d1';

export const KEY = btoa(String.fromCharCode(...new Uint8Array(32).map((_, i) => i * 3 + 1)));
export const T0 = Date.UTC(2026, 9, 28, 12, 0, 0);

export interface TestCtx extends Ctx {
  advance(ms: number): void;
  clock: { t: number };
}

export function makeCtx(db: D1Database = createTestDb(), start: number = T0): TestCtx {
  const clock = { t: start };
  return { db, key: KEY, now: () => clock.t, clock, advance: (ms: number) => void (clock.t += ms) };
}

export interface SeedUser {
  id: number;
  email: string;
  password: string;
  totpSecret: string;
}

/** Membuat user yang sudah selesai pendaftaran 2FA (tanpa melalui undangan). */
export async function seedUser(
  c: Ctx,
  over: { email?: string; name?: string; role?: 'administrator' | 'editor'; password?: string; active?: number; confirmed?: number } = {},
): Promise<SeedUser> {
  const email = over.email ?? 'rizky@promind.co.id';
  const password = over.password ?? 'Sangat-Rahasia-2026';
  const totpSecret = generateTotpSecret();
  const r = await c.db
    .prepare(
      'INSERT INTO users (email, name, role, password_hash, totp_secret_enc, totp_confirmed, active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    )
    .bind(
      email,
      over.name ?? 'Rizky',
      over.role ?? 'administrator',
      await hashPassword(password),
      await encryptSecret(totpSecret, c.key),
      over.confirmed ?? 1,
      over.active ?? 1,
      Math.floor(c.now() / 1000),
    )
    .run();
  return { id: r.meta.last_row_id, email, password, totpSecret };
}

export const codeNow = (s: SeedUser, c: Ctx) => totpCode(s.totpSecret, c.now());
