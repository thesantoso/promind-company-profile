import { describe, expect, test } from 'vitest';
import { createTestDb } from './support/d1';

const TABLES = ['users', 'invites', 'sessions', 'login_attempts', 'recovery_codes', 'drafts', 'draft_images', 'audit_log'];

describe('migrations', () => {
  test('create every table', async () => {
    const db = createTestDb();
    const { results } = await db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all<{ name: string }>();
    const names = results.map((r) => r.name);
    for (const t of TABLES) expect(names, t).toContain(t);
  });

  const insertUser = (db: D1Database, email: string, role = 'editor') =>
    db
      .prepare('INSERT INTO users (email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?)')
      .bind(email, 'Nama', role, 'x', 1)
      .run();

  test('only administrator and editor roles are allowed', async () => {
    const db = createTestDb();
    await insertUser(db, 'a@promind.co.id', 'administrator');
    await insertUser(db, 'b@promind.co.id', 'editor');
    await expect(insertUser(db, 'c@promind.co.id', 'owner')).rejects.toThrow();
  });

  test('emails are unique regardless of case', async () => {
    const db = createTestDb();
    await insertUser(db, 'Rizky@Promind.co.id');
    await expect(insertUser(db, 'rizky@promind.co.id')).rejects.toThrow();
  });

  test('sessions require an existing user (foreign keys are enforced)', async () => {
    const db = createTestDb();
    await expect(
      db
        .prepare('INSERT INTO sessions (token_hash, user_id, csrf_token, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind('h', 999, 'c', 1, 1, 2)
        .run(),
    ).rejects.toThrow();
  });

  test('prepare/bind/first/all/run/batch behave like D1', async () => {
    const db = createTestDb();
    await insertUser(db, 'a@promind.co.id');
    expect(await db.prepare('SELECT email FROM users WHERE id = ?').bind(999).first()).toBeNull();
    const row = await db.prepare('SELECT email FROM users WHERE id = ?').bind(1).first<{ email: string }>();
    expect(row?.email).toBe('a@promind.co.id');
    const res = await db.batch([
      db.prepare('UPDATE users SET name = ? WHERE id = ?').bind('Baru', 1),
      db.prepare('SELECT name FROM users WHERE id = ?').bind(1),
    ]);
    expect(res).toHaveLength(2);
    expect((res[1]!.results as { name: string }[])[0]!.name).toBe('Baru');
  });
});
