import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { get, post, setCsrf, setUnauthorizedHandler, type User } from './api';

interface SessionValue {
  user: User;
  siteOrigin: string;
  signOut: () => Promise<void>;
}

type State =
  | { status: 'loading' }
  | { status: 'anonymous'; reason?: 'expired' | 'signed_out' }
  | { status: 'signed_in'; user: User; siteOrigin: string };

const Ctx = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession outside a signed-in area');
  return v;
}

export const isAdmin = (u: User) => u.role === 'administrator';

async function loadConfig(): Promise<string> {
  try {
    return (await get<{ siteOrigin: string }>('/api/config')).siteOrigin ?? '';
  } catch {
    return '';
  }
}

/**
 * Memuat sesi saat aplikasi dibuka. Bila belum masuk, `renderAnonymous` menampilkan layar masuk;
 * `onSignedIn` dipanggil layar masuk dengan `{user, csrf}` dari server.
 */
export function SessionGate({
  renderAnonymous,
  children,
}: {
  renderAnonymous: (props: { onSignedIn: (s: { user: User; csrf: string }) => void; reason?: 'expired' | 'signed_out' }) => ReactNode;
  children: ReactNode;
}) {
  const [state, setState] = useState<State>({ status: 'loading' });

  const expire = useCallback(() => {
    setCsrf(null);
    setState((s) => (s.status === 'signed_in' ? { status: 'anonymous', reason: 'expired' } : s));
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(expire);
    let cancelled = false;
    (async () => {
      try {
        const [s, siteOrigin] = await Promise.all([get<{ user: User; csrf: string }>('/api/auth/session'), loadConfig()]);
        if (cancelled) return;
        setCsrf(s.csrf);
        setState({ status: 'signed_in', user: s.user, siteOrigin });
      } catch {
        if (!cancelled) setState({ status: 'anonymous' });
      }
    })();
    return () => {
      cancelled = true;
      setUnauthorizedHandler(null);
    };
  }, [expire]);

  const onSignedIn = useCallback(async (s: { user: User; csrf: string }) => {
    setCsrf(s.csrf);
    const siteOrigin = await loadConfig();
    setState({ status: 'signed_in', user: s.user, siteOrigin });
  }, []);

  const signOut = useCallback(async () => {
    try {
      await post('/api/auth/logout');
    } catch {
      // Sesi mungkin sudah habis; tetap keluar di sisi browser.
    }
    setCsrf(null);
    setState({ status: 'anonymous', reason: 'signed_out' });
  }, []);

  const value = useMemo<SessionValue | null>(
    () => (state.status === 'signed_in' ? { user: state.user, siteOrigin: state.siteOrigin, signOut } : null),
    [state, signOut],
  );

  if (state.status === 'loading') {
    return (
      <main className="center-screen" aria-busy="true">
        <p role="status">Memuat portal…</p>
      </main>
    );
  }
  if (state.status === 'anonymous') return <>{renderAnonymous({ onSignedIn: (s) => void onSignedIn(s), reason: state.reason })}</>;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
