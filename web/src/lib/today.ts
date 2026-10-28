/** The build date as YYYY-MM-DD in UTC. The single "today" used for job expiry everywhere. */
export function todayUtc(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}
