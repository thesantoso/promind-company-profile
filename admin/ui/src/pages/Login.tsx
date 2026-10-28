import { ArrowLeft, KeyRound, Smartphone } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { ApiError, post, type User } from '../api';
import { AuthFrame } from '../components/AuthFrame';
import { Alert, Button, FieldHint, Input, Label } from '../components/ui';
import { consumePrefillEmail } from '../invite';
import { errorMessage } from '../lib/errors';
import { navigate } from '../router';
import { AuthenticatorSetup, confirmEnrolment, RecoveryCodes, StepHeading, Steps, type Session } from './Setup';

type Phase =
  | { kind: 'credentials' }
  | { kind: 'code' }
  | { kind: 'enroll'; secret: string; otpauth: string }
  | { kind: 'saved'; codes: string[]; session: Session };

const failText = (err: unknown, credentialsOnly = false) => {
  const c = err instanceof ApiError ? err.code : 'network';
  if (credentialsOnly && c === 'invalid_credentials') return 'Email atau kata sandi tidak cocok. Periksa lagi lalu coba ulang.';
  return errorMessage(c, 'general', err instanceof ApiError ? err.retryAfter : undefined);
};

export function Login({ onSignedIn, reason }: { onSignedIn: (s: { user: User; csrf: string }) => void; reason?: 'expired' | 'signed_out' }) {
  const [phase, setPhase] = useState<Phase>({ kind: 'credentials' });
  const [email, setEmail] = useState(() => consumePrefillEmail() ?? '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [recovery, setRecovery] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);
  const firstRender = useRef(true);

  // Fokus ke isian pertama pada setiap langkah baru (langkah enroll/pemulihan memindahkan fokus ke judulnya sendiri).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (phase.kind === 'credentials') emailRef.current?.focus();
    if (phase.kind === 'code') secondRef.current?.focus();
  }, [phase.kind]);

  const toggleRecovery = () => {
    setUseRecovery((v) => !v);
    setError(null);
    window.setTimeout(() => secondRef.current?.focus(), 0);
  };

  const back = () => {
    setPhase({ kind: 'credentials' });
    setError(null);
    setCode('');
    setRecovery('');
    setUseRecovery(false);
    setPassword('');
  };

  const precheck = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await post<{ next: 'code' | 'enroll'; totpSecret?: string; otpauth?: string }>(
        '/api/auth/login/precheck',
        { email: email.trim(), password },
        { anonymous: true },
      );
      if (r.next === 'enroll' && r.totpSecret && r.otpauth) setPhase({ kind: 'enroll', secret: r.totpSecret, otpauth: r.otpauth });
      else setPhase({ kind: 'code' });
    } catch (err) {
      setError(failText(err, true));
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = useRecovery
        ? { email: email.trim(), password, recoveryCode: recovery.trim() }
        : { email: email.trim(), password, code: code.trim() };
      const s = await post<Session>('/api/auth/login', body, { anonymous: true });
      setPassword('');
      onSignedIn(s);
    } catch (err) {
      setError(failText(err));
      setCode('');
      setRecovery('');
      window.setTimeout(() => secondRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  };

  const enrolled = async (c: string) => {
    const r = await confirmEnrolment(email.trim(), password, c);
    setPassword('');
    setPhase({ kind: 'saved', codes: r.recoveryCodes, session: { user: r.user, csrf: r.csrf } });
  };

  const steps = phase.kind === 'code' ? ['Email dan kata sandi', 'Kode verifikasi'] : ['Email dan kata sandi', 'Aplikasi autentikator', 'Kode pemulihan'];
  const stepNo = phase.kind === 'code' ? 1 : phase.kind === 'enroll' ? 1 : 2;
  const wide = phase.kind === 'enroll' || phase.kind === 'saved';

  return (
    <AuthFrame title="Masuk" wide={wide}>
      <h1 className="text-xl font-bold">Masuk</h1>
      {phase.kind === 'credentials' && (
        <>
          <p className="mt-1 text-sm text-muted-foreground">Masukkan email dan kata sandi Anda.</p>
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
          <form onSubmit={(e) => void precheck(e)} noValidate className="mt-6 space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" ref={emailRef} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="login-password">Kata sandi</Label>
              <Input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <Alert tone="error">{error}</Alert>}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? 'Memeriksa…' : 'Lanjut'}
            </Button>
          </form>
          <p className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
            Verifikasi 2 langkah direset administrator? Cukup masuk dengan email dan password; Anda akan dipandu menyiapkannya lagi.
          </p>
        </>
      )}
      {phase.kind !== 'credentials' && (
        <div className="mt-3">
          <Steps current={stepNo} labels={steps} label="Langkah masuk" />
        </div>
      )}
      {phase.kind === 'code' && (
        <form onSubmit={(e) => void submitCode(e)} noValidate className="space-y-4">
          <StepHeading focus={false} announceText="Langkah 2 dari 2. Masukkan kode verifikasi.">Kode verifikasi</StepHeading>
          <p className="text-sm text-muted-foreground">
            Masuk sebagai <strong className="break-words text-foreground">{email.trim()}</strong>
          </p>
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
            {useRecovery ? 'Pakai kode dari aplikasi autentikator' : 'Pakai kode pemulihan'}
          </Button>
          <Button variant="ghost" className="w-full text-muted-foreground" onClick={back}>
            <ArrowLeft aria-hidden="true" />
            Kembali
          </Button>
        </form>
      )}
      {phase.kind === 'enroll' && (
        <div>
          <Alert tone="info" className="mb-5">
            Akun <strong className="break-words">{email.trim()}</strong> belum punya aplikasi autentikator. Siapkan sekarang; hanya perlu sekali.
          </Alert>
          <AuthenticatorSetup secret={phase.secret} otpauth={phase.otpauth} heading="Siapkan verifikasi 2 langkah" onConfirm={enrolled} />
          <Button variant="ghost" className="mt-4 text-muted-foreground" onClick={back}>
            <ArrowLeft aria-hidden="true" />
            Kembali
          </Button>
        </div>
      )}
      {phase.kind === 'saved' && (
        <div>
          <RecoveryCodes codes={phase.codes} email={email.trim().toLowerCase()} onDone={() => {
            void navigate('/', { replace: true, force: true });
            onSignedIn(phase.session);
          }} />
        </div>
      )}
    </AuthFrame>
  );
}
