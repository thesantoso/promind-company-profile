/** Token undangan dan email isian awal: hanya disimpan di memori, tidak pernah di storage. */

/** Membaca `#token=` dari URL, lalu menghapus fragmen dari bilah alamat dan riwayat. */
export function takeInviteToken(): string | null {
  const m = window.location.hash.match(/(?:^#|&)token=([A-Za-z0-9_-]{20,200})/);
  if (window.location.hash) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return m ? m[1]! : null;
}

let prefillEmail: string | null = null;

export function setPrefillEmail(email: string): void {
  prefillEmail = email;
}

export function consumePrefillEmail(): string | null {
  const e = prefillEmail;
  prefillEmail = null;
  return e;
}
