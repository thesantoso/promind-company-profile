import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from './router';
import { isAdmin, useSession } from './session';

const ROLE_LABEL = { administrator: 'Administrator', editor: 'Editor' } as const;

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();
  const { path } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    // Pindahkan fokus ke judul halaman agar pembaca layar mengetahui halaman berganti.
    const t = window.setTimeout(() => document.getElementById('page-title')?.focus({ preventScroll: true }), 50);
    return () => window.clearTimeout(t);
  }, [path]);

  const items: { href: string; label: string; admin?: boolean }[] = [
    { href: '/', label: 'Ringkasan' },
    { href: '/konten', label: 'Konten' },
    { href: '/foto', label: 'Foto' },
    { href: '/pengguna', label: 'Pengguna', admin: true },
    { href: '/log-audit', label: 'Log audit', admin: true },
    { href: '/akun', label: 'Akun saya' },
  ];
  const current = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));

  return (
    <>
      <a className="skip-link" href="#main">
        Lewati ke konten utama
      </a>
      <header className="topbar">
        <div className="topbar-inner">
          <button
            type="button"
            className="btn btn-secondary menu-toggle"
            aria-expanded={menuOpen}
            aria-controls="sidenav"
            onClick={() => setMenuOpen((o) => !o)}
          >
            Menu
          </button>
          <Link href="/" className="brand">
            PROMIND<small>Portal admin</small>
          </Link>
          <div className="topbar-user">
            <span className="who">
              <strong>{user.name}</strong>
              {ROLE_LABEL[user.role]}
            </span>
            <button type="button" className="btn btn-secondary" onClick={() => void signOut()}>
              Keluar
            </button>
          </div>
        </div>
      </header>
      <div className="shell">
        <nav id="sidenav" className={menuOpen ? 'sidenav open' : 'sidenav'} aria-label="Navigasi utama">
          <ul>
            {items
              .filter((i) => !i.admin || isAdmin(user))
              .map((i) => (
                <li key={i.href}>
                  <Link href={i.href} aria-current={current(i.href) ? 'page' : undefined}>
                    {i.label}
                  </Link>
                </li>
              ))}
          </ul>
          <div className="nav-sep" />
          <p className="small muted nav-user">
            Masuk sebagai <strong>{user.name}</strong> ({ROLE_LABEL[user.role]})
          </p>
        </nav>
        <main id="main" className="content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </>
  );
}
