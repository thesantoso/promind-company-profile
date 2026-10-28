/** Waktu sekarang dalam detik Unix. */
export const nowSec = (): number => Math.floor(Date.now() / 1000);

export async function writeAudit(
  db: D1Database,
  tsMs: number,
  userId: number | null,
  action: string,
  detail?: unknown,
): Promise<void> {
  await db
    .prepare('INSERT INTO audit_log (ts, user_id, action, detail) VALUES (?, ?, ?, ?)')
    .bind(Math.floor(tsMs / 1000), userId, action, detail === undefined ? null : JSON.stringify(detail))
    .run();
}
