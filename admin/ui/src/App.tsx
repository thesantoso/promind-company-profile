import { lazy, Suspense, useEffect } from 'react';
import { Announcer, Loading } from './components/ui';
import { Layout } from './Layout';
import { Account } from './pages/Account';
import { ContentList } from './pages/ContentList';
import { Forbidden, NotFound } from './pages/Errors';
import { Login } from './pages/Login';
import { Overview } from './pages/Overview';
import { Photos } from './pages/Photos';
import { match, navigate, useLocation } from './router';
import { isAdmin, SessionGate, useSession } from './session';

function Redirect({ to }: { to: string }) {
  useEffect(() => {
    void navigate(to, { replace: true, force: true });
  }, [to]);
  return null;
}

const EditorPage = lazy(() => import('./editor/EditorPage'));
const AcceptInvite = lazy(() => import('./pages/Enrol').then((m) => ({ default: m.AcceptInvite })));
const ActivateTwoFactor = lazy(() => import('./pages/Enrol').then((m) => ({ default: m.ActivateTwoFactor })));
const Users = lazy(() => import('./pages/Users').then((m) => ({ default: m.Users })));
const Audit = lazy(() => import('./pages/Audit').then((m) => ({ default: m.Audit })));

function Routes() {
  const { path } = useLocation();
  const { user } = useSession();
  if (path === '/masuk') return <Redirect to="/" />;
  if (path === '/') return <Overview />;
  if (path === '/konten') return <ContentList />;
  const ed = match('/konten/:key', path) ?? match('/konten/:key/riwayat', path);
  if (ed) {
    return (
      <Suspense fallback={<Loading what="editor" />}>
        <EditorPage key={ed.key} fileKey={ed.key!} tab={path.endsWith('/riwayat') ? 'history' : 'form'} />
      </Suspense>
    );
  }
  if (path === '/foto') return <Photos />;
  if (path === '/pengguna') return isAdmin(user) ? <Suspense fallback={<Loading what="pengguna" />}><Users /></Suspense> : <Forbidden />;
  if (path === '/log-audit') return isAdmin(user) ? <Suspense fallback={<Loading what="log audit" />}><Audit /></Suspense> : <Forbidden />;
  if (path === '/akun') return <Account />;
  return <NotFound />;
}

export function App({ inviteToken }: { inviteToken: string | null }) {
  const { path } = useLocation();
  let body;
  if (path === '/accept' || path === '/aktifkan-2fa') {
    body = (
      <Suspense fallback={<main className="center-screen"><Loading what="halaman" /></main>}>
        {path === '/accept' ? <AcceptInvite token={inviteToken} /> : <ActivateTwoFactor />}
      </Suspense>
    );
  }
  else {
    body = (
      <SessionGate renderAnonymous={(p) => <Login {...p} />}>
        <Layout>
          <Routes />
        </Layout>
      </SessionGate>
    );
  }
  return (
    <>
      {body}
      <Announcer />
    </>
  );
}
