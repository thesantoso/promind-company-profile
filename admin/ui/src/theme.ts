/** Tema terang/gelap: mengikuti sistem kecuali pengguna memilih; pilihan disimpan di localStorage (opsional). */
export type ThemeChoice = 'system' | 'light' | 'dark';
const KEY = 'promind-admin-theme';

export function readTheme(): ThemeChoice {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : 'system';
  } catch {
    return 'system';
  }
}

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

export function applyTheme(choice: ThemeChoice): void {
  const dark = choice === 'dark' || (choice === 'system' && media().matches);
  document.documentElement.classList.toggle('dark', dark);
}

export function saveTheme(choice: ThemeChoice): void {
  try {
    if (choice === 'system') window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, choice);
  } catch {
    // Penyimpanan diblokir (mode privat): pilihan berlaku untuk sesi ini saja.
  }
  applyTheme(choice);
}

export function initTheme(): void {
  applyTheme(readTheme());
  media().addEventListener('change', () => applyTheme(readTheme()));
}
