/** Format tanggal dan angka untuk UI berbahasa Indonesia. Zona waktu tetap WIB (Asia/Jakarta). */

export const TIME_ZONE = 'Asia/Jakarta';

const parts = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('id-ID', { timeZone: TIME_ZONE, ...opts }).formatToParts(d).map((p) => [p.type, p.value]),
  ) as Record<string, string>;

const toDate = (v: number | string | Date): Date => (v instanceof Date ? v : typeof v === 'number' ? new Date(v * 1000) : new Date(v));

/** `HH:MM` (24 jam, WIB). Angka detik Unix, string ISO, atau Date. */
export function formatTime(v: number | string | Date): string {
  const p = parts(toDate(v), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${p.hour}:${p.minute}`;
}

/** `28 Okt 2026` */
export function formatDate(v: number | string | Date): string {
  const p = parts(toDate(v), { day: 'numeric', month: 'short', year: 'numeric' });
  return `${p.day} ${p.month} ${p.year}`;
}

/** `28 Okt 2026, 19:00 WIB` */
export function formatDateTime(v: number | string | Date): string {
  return `${formatDate(v)}, ${formatTime(v)} WIB`;
}

/** Tanggal hari ini (WIB) sebagai `YYYY-MM-DD`. */
export function todayIso(now: Date = new Date()): string {
  const p = parts(now, { year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${p.year}-${p.month}-${p.day}`;
}

/** `1,2 MB`, `850 KB` */
export function formatBytes(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} MB`;
  return `${Math.max(1, Math.round(n / 1000))} KB`;
}

/** Lama menunggu yang ramah: `45 detik`, `3 menit`. */
export function formatWait(seconds: number): string {
  const s = Math.max(1, Math.ceil(seconds));
  if (s < 60) return `${s} detik`;
  return `${Math.ceil(s / 60)} menit`;
}

/** Kunci 2FA dikelompokkan 4 karakter agar mudah diketik. */
export function groupKey(secret: string): string {
  return secret.replace(/(.{4})/g, '$1 ').trim();
}
