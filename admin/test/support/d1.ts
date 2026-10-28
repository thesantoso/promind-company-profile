import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

type Params = SQLInputValue[];

class Statement {
  constructor(
    private readonly db: DatabaseSync,
    readonly sql: string,
    private params: Params = [],
  ) {}

  bind(...params: Params): Statement {
    return new Statement(this.db, this.sql, params);
  }

  async first<T = Record<string, unknown>>(column?: string): Promise<T | null> {
    const row = this.db.prepare(this.sql).get(...this.params) as Record<string, unknown> | undefined;
    if (!row) return null;
    return (column ? row[column] : row) as T;
  }

  async all<T = Record<string, unknown>>(): Promise<{ results: T[]; success: true; meta: Record<string, unknown> }> {
    const results = this.db.prepare(this.sql).all(...this.params) as T[];
    return { results, success: true, meta: { changes: 0 } };
  }

  async run(): Promise<{ results: never[]; success: true; meta: { changes: number; last_row_id: number } }> {
    const r = this.db.prepare(this.sql).run(...this.params);
    return { results: [], success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } };
  }
}

/** Database SQLite di memori dengan semua migrasi, berperilaku seperti subset D1 yang dipakai admin. */
export function createTestDb(): D1Database {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  const dir = join(process.cwd(), 'migrations');
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(join(dir, file), 'utf8'));
  }
  const facade = {
    prepare: (sql: string) => new Statement(db, sql),
    async batch(statements: Statement[]) {
      db.exec('BEGIN');
      try {
        const out = [];
        for (const s of statements) {
          const isRead = /^\s*(select|with|pragma)/i.test(s.sql);
          out.push(isRead ? await s.all() : await s.run());
        }
        db.exec('COMMIT');
        return out;
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    exec: async (sql: string) => {
      db.exec(sql);
      return { count: 1, duration: 0 };
    },
  };
  return facade as unknown as D1Database;
}
