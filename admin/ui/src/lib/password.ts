/** Petunjuk kekuatan kata sandi; aturan yang sama dengan server (minimal 12, maks. 128, ≥4 karakter berbeda, bukan nama/email). */

export interface Hint {
  id: string;
  text: string;
  ok: boolean;
}

export function passwordHints(pw: string, who: { email?: string; name?: string } = {}): Hint[] {
  const p = pw.toLowerCase();
  const email = (who.email ?? '').toLowerCase();
  const local = email.split('@')[0] ?? '';
  const name = (who.name ?? '').toLowerCase();
  const personal = [email, local, name].filter(Boolean);
  return [
    { id: 'length', text: 'Minimal 12 karakter', ok: pw.length >= 12 && pw.length <= 128 },
    { id: 'variety', text: 'Memakai minimal 4 karakter yang berbeda', ok: new Set(p).size >= 4 },
    { id: 'personal', text: 'Tidak sama dengan nama atau alamat email', ok: pw.length > 0 && !personal.includes(p) },
  ];
}

export const passwordOk = (pw: string, who?: { email?: string; name?: string }) => passwordHints(pw, who).every((h) => h.ok);
