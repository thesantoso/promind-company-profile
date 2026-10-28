import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, post, type User } from '../api';
import { ErrorText, Notice } from '../components/ui';
import { errorMessage } from '../lib/errors';
import { Link } from '../router';
import { consumePrefillEmail } from '../invite';

export function AuthFrame({ title, children, wide = false }: { title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.title = `${title} · Portal Admin PROMIND`;
  }, [title]);
  return (
    <main className="center-screen">
      <div className={wide ? 'auth-card wide' : 'auth-card'}>
        <p className="auth-brand">
          PROMIND <span>Portal admin</span>
        </p>
        {children}
      </div>
    </main>
  );
}

export function Login({ onSignedIn, reason }: { onSignedIn: (s: { user: User; csrf: string }) => void; reason?: 'expired' | 'signed_out' }) {
  const [email, setEmail] = useState(() => consumePrefillEmail() ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recovery, setRecovery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const secondRef = useRef<HTMLInputElement>(null);

  const toggleRecovery = () => {
    setUseRecovery((v) => !v);
    setError(null);
    window.setTimeout(() => secondRef.current?.focus(), 0);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = useRecovery
        ? { email: email.trim(), password, recoveryCode: recovery.trim() }
        : { email: email.trim(), password, code: code.trim() };
      const s = await post<{ user: User; csrf: string }>('/api/auth/login', body, { anonymous: true });
      setPassword('');
      onSignedIn(s);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'network';
      setError(errorMessage(code, 'general', err instanceof ApiError ? err.retryAfter : undefined));
      setCode('');
      setRecovery('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Masuk">
      <h1>Masuk</h1>
      <p>Masukkan email, kata sandi, dan kode 6 angka dari aplikasi autentikator Anda.</p>
      {reason === 'expired' && <Notice tone="warning">Sesi Anda sudah berakhir. Silakan masuk lagi untuk melanjutkan.</Notice>}
      {reason === 'signed_out' && <Notice tone="success">Anda sudah keluar.</Notice>}
      <form onSubmit={(e) => void submit(e)} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="login-password">Kata sandi</label>
          <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {useRecovery ? (
          <div className="field">
            <label htmlFor="login-recovery">Kode pemulihan</label>
            <input
              id="login-recovery"
              ref={secondRef}
              type="text"
              autoComplete="off"
              spellCheck={false}
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              aria-describedby="login-recovery-hint"
              required
            />
            <span className="hint" id="login-recovery-hint">
              Salah satu dari 8 kode yang Anda simpan saat mendaftar, mis. <code>a1b2-c3d4-e5f6</code>. Tiap kode hanya bisa dipakai sekali.
            </span>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="login-code">Kode verifikasi (6 angka)</label>
            <input
              id="login-code"
              ref={secondRef}
              className="code-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              aria-describedby="login-code-hint"
              required
            />
            <span className="hint" id="login-code-hint">
              Buka aplikasi autentikator (mis. Google Authenticator) dan ketik kode untuk PROMIND Admin.
            </span>
          </div>
        )}
        <p>
          <button type="button" className="btn btn-link" onClick={toggleRecovery} aria-pressed={useRecovery}>
            {useRecovery ? 'Pakai kode dari aplikasi autentikator' : 'Tidak bisa membuka aplikasi? Pakai kode pemulihan'}
          </button>
        </p>
        <ErrorText>{error}</ErrorText>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
      <p className="small muted mt">
        Admin mereset verifikasi 2 langkah Anda? <Link href="/aktifkan-2fa">Aktifkan ulang di sini</Link>.
      </p>
    </AuthFrame>
  );
}
