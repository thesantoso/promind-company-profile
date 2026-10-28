import { useSyncExternalStore, type AnchorHTMLAttributes, type MouseEvent } from 'react';

/** Router kecil berbasis History API (tanpa hash). */

type Guard = () => Promise<boolean> | boolean;
const guards = new Set<Guard>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

if (typeof window !== 'undefined') window.addEventListener('popstate', emit);

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

const snapshot = () => window.location.pathname + window.location.search;

export function useLocation(): { path: string; search: URLSearchParams } {
  const full = useSyncExternalStore(subscribe, snapshot);
  const [path, query = ''] = full.split('?');
  return { path: path || '/', search: new URLSearchParams(query) };
}

/** Penjaga navigasi (mis. editor dengan perubahan yang belum tersimpan). Kembalikan false untuk membatalkan. */
export function addNavigationGuard(g: Guard): () => void {
  guards.add(g);
  return () => guards.delete(g);
}

export async function navigate(to: string, opts: { replace?: boolean; force?: boolean } = {}): Promise<boolean> {
  if (!opts.force) {
    for (const g of [...guards]) if (!(await g())) return false;
  }
  if (opts.replace) window.history.replaceState(null, '', to);
  else window.history.pushState(null, '', to);
  emit();
  window.scrollTo(0, 0);
  return true;
}

export function Link({ href, onClick, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    void navigate(href);
  };
  return <a href={href} onClick={handle} {...rest} />;
}

/** Cocokkan pola seperti `/konten/:key` → `{ key }`, atau null. */
export function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split('/').filter(Boolean);
  const s = path.split('/').filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    const seg = p[i]!;
    if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(s[i]!);
    else if (seg !== s[i]) return null;
  }
  return params;
}
