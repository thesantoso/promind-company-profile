import {
  ChevronDown, FileText, Image as ImageIcon, LayoutDashboard, LogOut, Menu as MenuIcon, Monitor, Moon, ScrollText, Sun, UserRound, Users, X,
} from 'lucide-react';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Button } from './components/ui/button';
import { Sheet } from './components/ui/dialog';
import {
  DropdownMenu, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator,
} from './components/ui/dropdown-menu';
import { cn } from './lib/cn';
import { Link, navigate, useLocation } from './router';
import { isAdmin, useSession } from './session';
import { readTheme, saveTheme, type ThemeChoice } from './theme';

const ROLE_LABEL = { administrator: 'Administrator', editor: 'Editor' } as const;

interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  admin?: boolean;
}

const ITEMS: NavItem[] = [
  { href: '/', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/konten', label: 'Konten', icon: FileText },
  { href: '/foto', label: 'Foto', icon: ImageIcon },
  { href: '/pengguna', label: 'Pengguna', icon: Users, admin: true },
  { href: '/log-audit', label: 'Log audit', icon: ScrollText, admin: true },
  { href: '/akun', label: 'Akun saya', icon: UserRound },
];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('');

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-md text-foreground no-underline hover:text-foreground">
      <span aria-hidden="true" className="grid size-7 place-items-center rounded-md bg-primary font-display text-sm font-extrabold text-primary-foreground">
        P
      </span>
      <span className="font-display text-[0.95rem] font-extrabold tracking-[0.08em]">PROMIND</span>
      <span className="text-xs font-medium text-muted-foreground">Admin</span>
    </Link>
  );
}

function NavList({ items, current }: { items: NavItem[]; current: (href: string) => boolean }) {
  return (
    <ul className="space-y-0.5">
      {items.map((i) => {
        const active = current(i.href);
        const Icon = i.icon;
        return (
          <li key={i.href}>
            <Link
              href={i.href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium no-underline transition-colors duration-150 max-lg:h-11',
                active ? 'bg-accent text-foreground hover:text-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon aria-hidden className={cn('size-4', active && 'text-link')} />
              {i.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ThemeIcon({ choice }: { choice: ThemeChoice }) {
  if (choice === 'dark') return <Moon aria-hidden="true" />;
  if (choice === 'light') return <Sun aria-hidden="true" />;
  return <Monitor aria-hidden="true" />;
}

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();
  const { path } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<ThemeChoice>(readTheme);

  useEffect(() => {
    setMenuOpen(false);
    // Pindahkan fokus ke judul halaman agar pembaca layar mengetahui halaman berganti.
    const t = window.setTimeout(() => document.getElementById('page-title')?.focus({ preventScroll: true }), 50);
    return () => window.clearTimeout(t);
  }, [path]);

  const items = ITEMS.filter((i) => !i.admin || isAdmin(user));
  const current = (href: string) => (href === '/' ? path === '/' : path === href || path.startsWith(`${href}/`));
  const section = items.find((i) => current(i.href))?.label ?? 'Portal';

  return (
    <div className="min-h-dvh bg-background">
      <a href="#main" className="absolute -top-16 left-2 z-50 rounded-md border bg-card px-4 py-2 text-sm font-medium focus:top-2">
        Lewati ke konten utama
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r bg-card lg:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Wordmark />
        </div>
        <nav id="sidenav" aria-label="Navigasi utama" className="flex-1 overflow-y-auto p-3">
          <NavList items={items} current={current} />
        </nav>
        <div className="border-t p-4 text-xs leading-relaxed text-muted-foreground">
          Masuk sebagai <span className="font-medium text-foreground">{user.name}</span>
          <br />
          {ROLE_LABEL[user.role]}
        </div>
      </aside>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} label="Menu navigasi">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Wordmark />
          <Button variant="ghost" size="icon" aria-label="Tutup menu" onClick={() => setMenuOpen(false)}>
            <X aria-hidden="true" />
          </Button>
        </div>
        <nav aria-label="Navigasi utama" className="p-3">
          <NavList items={items} current={current} />
        </nav>
      </Sheet>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b bg-card px-3 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-haspopup="dialog"
            onClick={() => setMenuOpen(true)}
          >
            <MenuIcon aria-hidden="true" />
          </Button>
          <span className="font-display text-sm font-extrabold tracking-[0.08em] lg:hidden">PROMIND</span>
          <p className="hidden text-sm text-muted-foreground lg:block">
            Portal admin <span aria-hidden="true">/</span> <span className="font-medium text-foreground">{section}</span>
          </p>
          <div className="ml-auto">
            <DropdownMenu
              label="Menu pengguna"
              trigger={
                <Button variant="ghost" className="h-10 gap-2 px-2 max-lg:h-11">
                  <span aria-hidden="true" className="grid size-7 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-link">
                    {initials(user.name)}
                  </span>
                  <span className="text-left leading-tight max-sm:sr-only">
                    <span className="block text-sm font-medium">{user.name}</span>
                    <span className="block text-xs font-normal text-muted-foreground">{ROLE_LABEL[user.role]}</span>
                  </span>
                  <span className="sr-only">, menu pengguna</span>
                  <ChevronDown aria-hidden="true" className="text-muted-foreground" />
                </Button>
              }
            >
              <DropdownMenuLabel>
                <span className="block font-medium text-foreground">{user.name}</span>
                {user.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void navigate('/akun')}>
                <UserRound aria-hidden="true" />
                Akun saya
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="flex items-center gap-2 [&_svg]:size-3.5">
                <ThemeIcon choice={theme} /> Tema tampilan
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={theme}
                onValueChange={(v) => {
                  const c = v as ThemeChoice;
                  setTheme(c);
                  saveTheme(c);
                }}
              >
                <DropdownMenuRadioItem value="system">Ikuti sistem</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="light">Terang</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="dark">Gelap</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => void signOut()}>
                <LogOut aria-hidden="true" />
                Keluar
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="mx-auto w-full max-w-[1200px] px-4 py-6 outline-none sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
