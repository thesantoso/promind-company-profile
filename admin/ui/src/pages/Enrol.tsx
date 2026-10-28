import { Check, Download } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import { ApiError, post } from '../api';
import { Alert, Button, Checkbox, CopyButton, Input, Label } from '../components/ui';
import { setPrefillEmail } from '../invite';
import { cn } from '../lib/cn';
import { errorMessage } from '../lib/errors';
import { groupKey } from '../lib/format';
import { passwordHints, passwordOk } from '../lib/password';
import { qrPath } from '../lib/qr';
import { Link, navigate } from '../router';
import { AuthFrame } from './Login';

const errText = (e: unknown) => errorMessage(e instanceof ApiError ? e.code : 'network', 'general', e instanceof ApiError ? e.retryAfter : undefined);

/** Penanda langkah: lingkaran bertanda centang untuk langkah selesai, teks untuk semua langkah. */
function Steps({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" aria-label="Langkah pendaftaran">
      {labels.map((l, i) => {
        const done = i < current;
        const now = i === current;
        return (
          <li key={l} aria-current={now ? 'step' : undefined} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className={cn(
                'grid size-6 place-items-center rounded-full border text-[0.7rem] font-semibold',
                done && 'border-primary bg-primary text-primary-foreground',
                now && 'border-primary text-link',
                !done && !now && 'text-muted-foreground',
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(now ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
              {l}
              {done && <span className="sr-only"> (selesai)</span>}
            </span>
            {i < labels.length - 1 && <span aria-hidden="true" className="mx-1 hidden h-px w-6 bg-border sm:block" />}
          </li>
        );
      })}
    </ol>
  );
}

function QrCode({ text }: { text: string }) {
  const { size, d } = useMemo(() => qrPath(text), [text]);
  return (
    <svg className="size-44 shrink-0 rounded-md border bg-white p-2" viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label="Kode QR untuk aplikasi autentikator" shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#ffffff" />
      <path d={d} fill="#172b42" />
    </svg>
  );
}

function TotpStep({ secret, otpauth, onConfirm }: { secret: string; otpauth: string; onConfirm: (code: string) => Promise<void> }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onConfirm(code.trim());
    } catch (err) {
      setError(errText(err));
      setCode('');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <h2 className="text-base font-semibold">Hubungkan aplikasi autentikator</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Buka aplikasi autentikator di ponsel (mis. Google Authenticator, Microsoft Authenticator, atau 1Password), pilih tambah akun, lalu
        pindai kode QR ini.
      </p>
      <div className="my-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        <QrCode text={otpauth} />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm font-medium">Tidak bisa memindai? Ketik kunci ini secara manual:</p>
          <p className="rounded-md border bg-subtle px-3 py-2 font-mono text-sm tracking-wide break-all" data-testid="totp-secret">
            {groupKey(secret)}
          </p>
          <CopyButton text={secret} label="Salin kunci" what="Kunci" />
          <details className="text-sm">
            <summary className="flex min-h-10 cursor-pointer items-center text-link">Tampilkan tautan otpauth</summary>
            <p className="otpauth mt-1 font-mono text-xs break-all text-muted-foreground">{otpauth}</p>
          </details>
        </div>
      </div>
      <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4 border-t pt-5">
        <div>
          <Label htmlFor="enrol-code">Kode 6 angka dari aplikasi</Label>
          <Input
            id="enrol-code"
            className="max-w-44 font-mono text-base tracking-[0.3em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>
        {error && <Alert tone="error">{error}</Alert>}
        <Button type="submit" disabled={busy || code.length !== 6}>
          {busy ? 'Memeriksa…' : 'Konfirmasi kode'}
        </Button>
      </form>
    </>
  );
}

function RecoveryStep({ codes, email }: { codes: string[]; email: string }) {
  const [saved, setSaved] = useState(false);
  const text = `Kode pemulihan Portal Admin PROMIND untuk ${email}\nTiap kode hanya bisa dipakai sekali.\n\n${codes.join('\n')}\n`;
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kode-pemulihan-promind.txt';
    document.body.append(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const finish = () => {
    setPrefillEmail(email);
    void navigate('/masuk', { replace: true });
  };
  return (
    <>
      <Alert tone="success">Verifikasi 2 langkah sudah aktif.</Alert>
      <h2 className="mt-5 text-base font-semibold">Simpan kode pemulihan</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Kode ini dipakai bila ponsel Anda hilang atau aplikasi autentikator tidak bisa dibuka. Simpan di tempat aman (mis. pengelola kata
        sandi). <strong className="text-foreground">Kode hanya ditampilkan sekali ini.</strong>
      </p>
      <ul
        className="my-4 grid grid-cols-2 gap-x-6 gap-y-1.5 rounded-md border bg-subtle p-4 font-mono text-sm text-foreground"
        aria-label="Kode pemulihan"
        data-testid="recovery-codes"
      >
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <CopyButton text={codes.join('\n')} label="Salin semua kode" what="Kode pemulihan" />
        <Button variant="outline" onClick={download}>
          <Download aria-hidden="true" />
          Unduh .txt
        </Button>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-md border p-3">
        <Checkbox id="saved-codes" className="mt-0.5" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <label htmlFor="saved-codes" className="cursor-pointer text-sm">
          Saya sudah menyimpan kode pemulihan ini di tempat yang aman.
        </label>
      </div>
      <Button className="mt-4 w-full sm:w-auto" disabled={!saved} onClick={finish}>
        Lanjut ke halaman masuk
      </Button>
    </>
  );
}

function PasswordHints({ password, who }: { password: string; who?: { email?: string; name?: string } }) {
  return (
    <ul className="mt-2 space-y-1 text-xs" id="pw-hints" aria-live="polite">
      {passwordHints(password, who).map((h) => (
        <li key={h.id} className={cn(h.ok ? 'ok text-success' : 'todo text-muted-foreground', 'flex items-center gap-2')}>
          <span aria-hidden="true" className={cn('grid size-4 place-items-center rounded-full border', h.ok && 'border-success bg-success-soft')}>
            {h.ok && <Check className="size-3" />}
          </span>
          <span>
            {h.text}
            <span className="sr-only">{h.ok ? ' (terpenuhi)' : ' (belum)'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

type Enrolment = { email: string; name: string; password: string; secret: string; otpauth: string };

export function AcceptInvite({ token }: { token: string | null }) {
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrol, setEnrol] = useState<Enrolment | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  if (!token) {
    return (
      <AuthFrame title="Undangan tidak lengkap">
        <h1 className="text-xl font-bold">Tautan undangan tidak lengkap</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Tautan ini tidak memuat kode undangan, atau halaman sudah dimuat ulang (demi keamanan kode undangan dihapus dari alamat setelah
          dibuka). Buka lagi tautan lengkap dari administrator, atau minta undangan baru.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/masuk">Ke halaman masuk</Link>
        </Button>
      </AuthFrame>
    );
  }

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!passwordOk(password)) return setError('Kata sandi belum memenuhi syarat di bawah.');
    if (password !== confirm) return setError('Kedua kata sandi tidak sama.');
    setBusy(true);
    try {
      const r = await post<{ email: string; name: string; totpSecret: string; otpauth: string }>('/api/auth/invite/accept', { token, password }, { anonymous: true });
      setEnrol({ email: r.email, name: r.name, password, secret: r.totpSecret, otpauth: r.otpauth });
      setConfirm('');
      setStep(1);
    } catch (err) {
      setError(errText(err));
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async (code: string) => {
    if (!enrol) return;
    const r = await post<{ recoveryCodes: string[] }>('/api/auth/totp/confirm', { email: enrol.email, password: enrol.password, code }, { anonymous: true });
    setCodes(r.recoveryCodes);
    setEnrol({ ...enrol, password: '', secret: '', otpauth: '' });
    setPassword('');
    setStep(2);
  };

  return (
    <AuthFrame title="Terima undangan" wide>
      <h1 className="text-xl font-bold">Selamat datang di Portal Admin PROMIND</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{enrol?.name ? `Halo, ${enrol.name}. ` : ''}Tiga langkah singkat untuk menyiapkan akun Anda.</p>
      <Steps current={step} labels={['Kata sandi', 'Aplikasi autentikator', 'Kode pemulihan']} />
      {step === 0 && (
        <form onSubmit={(e) => void submitPassword(e)} noValidate className="space-y-4">
          <div>
            <h2 className="text-base font-semibold">Buat kata sandi</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Pilih kata sandi yang panjang dan belum pernah Anda pakai di tempat lain. Kalimat pendek yang mudah diingat juga boleh.
            </p>
          </div>
          <div>
            <Label htmlFor="new-password">Kata sandi baru</Label>
            <Input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="pw-hints" required />
            <PasswordHints password={password} />
          </div>
          <div>
            <Label htmlFor="confirm-password">Ulangi kata sandi</Label>
            <Input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <Button type="submit" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan dan lanjut'}
          </Button>
        </form>
      )}
      {step === 1 && enrol && <TotpStep secret={enrol.secret} otpauth={enrol.otpauth} onConfirm={confirmCode} />}
      {step === 2 && codes && enrol && <RecoveryStep codes={codes} email={enrol.email} />}
    </AuthFrame>
  );
}

export function ActivateTwoFactor() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState<{ secret: string; otpauth: string } | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);

  const begin = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await post<{ totpSecret: string; otpauth: string }>('/api/auth/totp/begin', { email: email.trim(), password }, { anonymous: true });
      setKey({ secret: r.totpSecret, otpauth: r.otpauth });
      setStep(1);
    } catch (err) {
      const c = err instanceof ApiError ? err.code : 'network';
      setError(
        c === 'invalid_credentials'
          ? 'Email atau kata sandi tidak cocok, atau verifikasi 2 langkah akun ini masih aktif (tidak perlu diaktifkan ulang).'
          : errText(err),
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmCode = async (code: string) => {
    const r = await post<{ recoveryCodes: string[] }>('/api/auth/totp/confirm', { email: email.trim(), password, code }, { anonymous: true });
    setCodes(r.recoveryCodes);
    setKey(null);
    setPassword('');
    setStep(2);
  };

  return (
    <AuthFrame title="Aktifkan verifikasi 2 langkah" wide>
      <h1 className="text-xl font-bold">Aktifkan ulang verifikasi 2 langkah</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">
        Pakai halaman ini bila administrator sudah mereset verifikasi 2 langkah akun Anda (mis. karena ganti ponsel).
      </p>
      <Steps current={step} labels={['Email dan kata sandi', 'Aplikasi autentikator', 'Kode pemulihan']} />
      {step === 0 && (
        <form onSubmit={(e) => void begin(e)} noValidate className="space-y-4">
          <div>
            <Label htmlFor="act-email">Email</Label>
            <Input id="act-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="act-password">Kata sandi</Label>
            <Input id="act-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="submit" disabled={busy}>
              {busy ? 'Memeriksa…' : 'Lanjut'}
            </Button>
            <Link href="/masuk" className="text-sm">
              Kembali ke halaman masuk
            </Link>
          </div>
        </form>
      )}
      {step === 1 && key && <TotpStep secret={key.secret} otpauth={key.otpauth} onConfirm={confirmCode} />}
      {step === 2 && codes && <RecoveryStep codes={codes} email={email.trim().toLowerCase()} />}
    </AuthFrame>
  );
}
