import { Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { post, setCsrf } from '../api';
import { AuthFrame } from '../components/AuthFrame';
import { Alert, Button, Input, Label } from '../components/ui';
import { cn } from '../lib/cn';
import { passwordHints, passwordOk } from '../lib/password';
import { Link, navigate } from '../router';
import { AuthenticatorSetup, confirmEnrolment, errText, RecoveryCodes, Steps, type Session } from './Setup';

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
  const [done, setDone] = useState<({ recoveryCodes: string[] } & Session) | null>(null);

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
    const r = await confirmEnrolment(enrol.email, enrol.password, code);
    // Kata sandi dan kunci tidak dipakai lagi; hapus dari memori.
    setEnrol({ ...enrol, password: '', secret: '', otpauth: '' });
    setPassword('');
    setDone(r);
    setStep(2);
  };

  const finish = () => {
    if (!done) return;
    // Cookie sesi sudah terpasang oleh server; portal memuat sesi itu saat dibuka.
    setCsrf(done.csrf);
    void navigate('/', { replace: true, force: true });
  };

  return (
    <AuthFrame title="Terima undangan" wide>
      <h1 className="text-xl font-bold">Selamat datang di Portal Admin PROMIND</h1>
      <p className="mt-1 mb-5 text-sm text-muted-foreground">{enrol?.name ? `Halo, ${enrol.name}. ` : ''}Tiga langkah singkat: kata sandi, aplikasi autentikator, lalu kode pemulihan.</p>
      <Steps current={step} labels={['Kata sandi', 'Aplikasi autentikator', 'Kode pemulihan']} label="Langkah pendaftaran" />
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
            <Input id="new-password" autoFocus type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} aria-describedby="pw-hints" required />
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
      {step === 1 && enrol && <AuthenticatorSetup secret={enrol.secret} otpauth={enrol.otpauth} heading="Hubungkan aplikasi autentikator" onConfirm={confirmCode} />}
      {step === 2 && done && enrol && <RecoveryCodes codes={done.recoveryCodes} email={enrol.email} onDone={finish} />}
    </AuthFrame>
  );
}

