import { useState, type FormEvent } from 'react';
import { ApiError, post } from '../api';
import { ErrorText, Notice, PageHeader } from '../components/ui';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { passwordHints, passwordOk } from '../lib/password';
import { useSession } from '../session';
import { useTitle } from '../useTitle';

const ROLE_TEXT = {
  administrator: 'Administrator: bisa mengedit dan menerbitkan konten, mengelola pengguna, dan melihat log audit.',
  editor: 'Editor: bisa mengedit dan menerbitkan konten serta mengunggah foto.',
} as const;

export function Account() {
  useTitle('Akun saya');
  const { user } = useSession();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setOk(false);
    if (!passwordOk(next, user)) return setError('Kata sandi baru belum memenuhi syarat di bawah.');
    if (next !== confirm) return setError('Kata sandi baru dan ulangannya tidak sama.');
    setBusy(true);
    try {
      await post('/api/auth/password', { current, next });
      setOk(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'network';
      setError(code === 'invalid_credentials' ? 'Kata sandi saat ini salah.' : errorMessage(code));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Akun saya" />
      <section className="panel" aria-labelledby="me-title">
        <h2 id="me-title">Profil</h2>
        <dl className="facts">
          <dt>Nama</dt>
          <dd>{user.name}</dd>
          <dt>Email</dt>
          <dd>{user.email}</dd>
          <dt>Peran</dt>
          <dd>{ROLE_TEXT[user.role]}</dd>
          <dt>Terakhir masuk</dt>
          <dd>{user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Belum tercatat'}</dd>
        </dl>
        <p className="small muted">Untuk mengubah nama atau peran, hubungi administrator.</p>
      </section>
      <section className="panel" aria-labelledby="pw-title">
        <h2 id="pw-title">Ganti kata sandi</h2>
        <p>Setelah diganti, sesi Anda di perangkat lain otomatis keluar.</p>
        {ok && <Notice tone="success">Kata sandi sudah diganti.</Notice>}
        <form onSubmit={(e) => void submit(e)} noValidate className="narrow">
          <div className="field">
            <label htmlFor="pw-current">Kata sandi saat ini</label>
            <input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="pw-next">Kata sandi baru</label>
            <input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-describedby="pw-next-hints" required />
            <ul className="hints" id="pw-next-hints">
              {passwordHints(next, user).map((h) => (
                <li key={h.id} className={h.ok ? 'ok' : 'todo'}>
                  <span aria-hidden="true">{h.ok ? '✓' : '·'}</span>
                  <span>
                    {h.text}
                    <span className="visually-hidden">{h.ok ? ' (terpenuhi)' : ' (belum)'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="field">
            <label htmlFor="pw-confirm">Ulangi kata sandi baru</label>
            <input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <ErrorText>{error}</ErrorText>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Ganti kata sandi'}
          </button>
        </form>
      </section>
    </>
  );
}
