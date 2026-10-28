import { KeyRound, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ApiError, post, type User } from '../api';
import { Alert, Button, FieldHint, Input, Label } from '../components/ui';
import { consumePrefillEmail } from '../invite';
import { errorMessage } from '../lib/errors';
import { cn } from '../lib/cn';
import { Link } from '../router';

/** Kartu di tengah layar untuk masuk, undangan, dan aktivasi 2FA. */
export function AuthFrame({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.title = `${title} · Portal Admin PROMIND`;
  }, [title]);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className={cn('w-full', wide ? 'max-w-xl' : 'max-w-sm')}>
        <p className="mb-6 flex items-center justify-center gap-2">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-md bg-primary font-display text-base font-extrabold text-primary-foreground">
            P
          </span>
          <span className="font-display text-lg font-extrabold tracking-[0.1em] text-foreground">PROMIND</span>
          <span className="text-sm text-muted-foreground">Portal admin</span>
        </p>
        <div className="rounded-lg border bg-card p-6 sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-foreground">PT Properti Manajemen Inovasi Indonesia</p>
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
      const c = err instanceof ApiError ? err.code : 'network';
      setError(errorMessage(c, 'general', err instanceof ApiError ? err.retryAfter : undefined));
      setCode('');
      setRecovery('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthFrame title="Masuk">
      <h1 className="text-xl font-bold">Masuk</h1>
      <p className="mt-1 text-sm text-muted-foreground">Masukkan email, kata sandi, dan kode 6 angka dari aplikasi autentikator Anda.</p>
      {reason === 'expired' && (
        <Alert tone="warning" className="mt-4">
          Sesi Anda sudah berakhir. Silakan masuk lagi untuk melanjutkan.
        </Alert>
      )}
      {reason === 'signed_out' && (
        <Alert tone="success" className="mt-4">
          Anda sudah keluar.
        </Alert>
      )}
      <form onSubmit={(e) => void submit(e)} noValidate className="mt-6 space-y-4">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input id="login-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="login-password">Kata sandi</Label>
          <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {useRecovery ? (
          <div>
            <Label htmlFor="login-recovery">Kode pemulihan</Label>
            <Input
              id="login-recovery"
              ref={secondRef}
              autoComplete="off"
              spellCheck={false}
              className="font-mono"
              value={recovery}
              onChange={(e) => setRecovery(e.target.value)}
              aria-describedby="login-recovery-hint"
              required
            />
            <FieldHint id="login-recovery-hint">
              Salah satu dari 8 kode yang Anda simpan saat mendaftar, mis. <code>a1b2-c3d4-e5f6</code>. Tiap kode hanya bisa dipakai sekali.
            </FieldHint>
          </div>
        ) : (
          <div>
            <Label htmlFor="login-code">Kode verifikasi (6 angka)</Label>
            <Input
              id="login-code"
              ref={secondRef}
              className="font-mono text-base tracking-[0.3em]"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              aria-describedby="login-code-hint"
              required
            />
            <FieldHint id="login-code-hint">Buka aplikasi autentikator (mis. Google Authenticator) dan ketik kode untuk PROMIND Admin.</FieldHint>
          </div>
        )}
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? 'Memeriksa…' : 'Masuk'}
        </Button>
        <Button variant="ghost" className="w-full whitespace-normal text-muted-foreground" onClick={toggleRecovery} aria-pressed={useRecovery}>
          {useRecovery ? <Smartphone aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          {useRecovery ? 'Pakai kode dari aplikasi autentikator' : 'Tidak bisa membuka aplikasi? Pakai kode pemulihan'}
        </Button>
      </form>
      <p className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
        Admin mereset verifikasi 2 langkah Anda? <Link href="/aktifkan-2fa">Aktifkan ulang di sini</Link>.
      </p>
    </AuthFrame>
  );
}
