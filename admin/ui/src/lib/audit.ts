/** Label Indonesia untuk tindakan di log audit, dan ringkasan detail. */

export const ACTION_LABELS: Record<string, string> = {
  'login.ok': 'Masuk berhasil',
  'login.fail': 'Gagal masuk',
  'invite.create': 'Membuat undangan',
  'invite.accept': 'Menerima undangan',
  'totp.enrol': 'Mengaktifkan verifikasi 2 langkah',
  'password.change': 'Mengganti kata sandi',
  'user.update': 'Mengubah pengguna',
  'user.reset_2fa': 'Mereset verifikasi 2 langkah',
  'user.revoke_sessions': 'Mencabut semua sesi',
  'content.publish': 'Menerbitkan konten',
  'content.discard': 'Membuang draf',
  'content.restore': 'Memulihkan versi lama',
  'image.upload': 'Mengunggah foto',
};

export const actionLabel = (action: string): string => ACTION_LABELS[action] ?? action;

const REASONS: Record<string, string> = {
  credentials: 'email atau kata sandi salah',
  totp: 'kode autentikator salah',
  recovery: 'kode pemulihan salah',
  no_second_factor: 'tanpa kode verifikasi',
};

const ROLE: Record<string, string> = { administrator: 'administrator', editor: 'editor' };

/** Satu baris ringkas untuk kolom detail; detail lengkap tetap bisa dibuka. */
export function detailSummary(action: string, detail: unknown): string {
  if (!detail || typeof detail !== 'object') return '';
  const d = detail as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : v === undefined || v === null ? '' : JSON.stringify(v));
  switch (action) {
    case 'login.fail':
      return `Alasan: ${REASONS[str(d.reason)] ?? str(d.reason)}`;
    case 'login.ok':
      return d.method === 'recovery' ? 'Memakai kode pemulihan' : 'Memakai kode autentikator';
    case 'invite.create':
      return `${str(d.email)} sebagai ${ROLE[str(d.role)] ?? str(d.role)}`;
    case 'invite.accept':
      return str(d.email);
    case 'user.update': {
      const p = (d.patch ?? {}) as Record<string, unknown>;
      const bits: string[] = [];
      if (typeof p.name === 'string') bits.push(`nama → ${p.name}`);
      if (typeof p.role === 'string') bits.push(`peran → ${ROLE[p.role] ?? p.role}`);
      if (p.active === true) bits.push('diaktifkan');
      if (p.active === false) bits.push('dinonaktifkan');
      return `${str(d.email)}${bits.length ? `: ${bits.join(', ')}` : ''}`;
    }
    case 'user.reset_2fa':
    case 'user.revoke_sessions':
      return str(d.email);
    case 'content.publish': {
      const keys = Array.isArray(d.keys) ? d.keys.join(', ') : '';
      const commit = typeof d.commit === 'string' ? ` (commit ${d.commit.slice(0, 7)})` : '';
      return `${keys}${commit}`;
    }
    case 'content.discard':
      return str(d.key);
    case 'content.restore':
      return `${str(d.key)} ke versi ${str(d.from).slice(0, 7)}`;
    case 'image.upload':
      return str(d.name);
    default:
      return '';
  }
}
