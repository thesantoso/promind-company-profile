import { useMemo, useState, type FormEvent } from 'react';
import { ApiError, post } from '../api';
import { CopyButton, ErrorText, Notice } from '../components/ui';
import { errorMessage } from '../lib/errors';
import { groupKey } from '../lib/format';
import { passwordHints, passwordOk } from '../lib/password';
import { qrPath } from '../lib/qr';
import { Link, navigate } from '../router';
import { setPrefillEmail } from '../invite';
import { AuthFrame } from './Login';

const errText = (e: unknown) => errorMessage(e instanceof ApiError ? e.code : 'network', 'general', e instanceof ApiError ? e.retryAfter : undefined);

/* ---------- langkah-langkah bersama ---------- */

function Steps({ current, labels }: { current: number; labels: string[] }) {
  return (
    <ol className="steps" aria-label="Langkah pendaftaran">
      {labels.map((l, i) => (
        <li key={l} aria-current={i === current ? 'step' : undefined}>
          {i + 1}. {l}
        </li>
      ))}
    </ol>
  );
}

function QrCode({ text }: { text: string }) {
  const { size, d } = useMemo(() => qrPath(text), [text]);
  return (
    <svg className="qr" viewBox={`-2 -2 ${size + 4} ${size + 4}`} role="img" aria-label="Kode QR untuk aplikasi autentikator" shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={size + 4} height={size + 4} fill="#ffffff" />
      <path d={d} fill="#172b42" />
    </svg>
  );
}

function TotpStep({
  secret,
  otpauth,
  onConfirm,
}: {
  secret: string;
  otpauth: string;
  onConfirm: (code: string) => Promise<void>;
}) {
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
      <h2>Hubungkan aplikasi autentikator</h2>
      <p>
        Buka aplikasi autentikator di ponsel (mis. Google Authenticator, Microsoft Authenticator, atau 1Password), pilih
        tambah akun, lalu pindai kode QR ini.
      </p>
      <div className="qr-wrap">
        <QrCode text={otpauth} />
        <div>
          <p className="label">Tidak bisa memindai? Ketik kunci ini secara manual:</p>
          <p className="secret-key" data-testid="totp-secret">
            {groupKey(secret)}
          </p>
          <CopyButton text={secret} label="Salin kunci" what="Kunci" />
          <details className="detail">
            <summary>Tampilkan tautan otpauth</summary>
            <p className="otpauth mono">{otpauth}</p>
          </details>
        </div>
      </div>
      <form onSubmit={(e) => void submit(e)} noValidate>
        <div className="field">
          <label htmlFor="enrol-code">Kode 6 angka dari aplikasi</label>
          <input
            id="enrol-code"
            className="code-input"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            required
          />
        </div>
        <ErrorText>{error}</ErrorText>
        <button type="submit" className="btn btn-primary" disabled={busy || code.length !== 6}>
          {busy ? 'Memeriksa…' : 'Konfirmasi kode'}
        </button>
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
      <Notice tone="success">Verifikasi 2 langkah sudah aktif.</Notice>
      <h2>Simpan kode pemulihan</h2>
      <p>
        Kode ini dipakai bila ponsel Anda hilang atau aplikasi autentikator tidak bisa dibuka. Simpan di tempat aman
        (mis. pengelola kata sandi). <strong>Kode hanya ditampilkan sekali ini.</strong>
      </p>
      <ul className="codes" aria-label="Kode pemulihan" data-testid="recovery-codes">
        {codes.map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ul>
      <div className="row">
        <CopyButton text={codes.join('\n')} label="Salin semua kode" what="Kode pemulihan" />
        <button type="button" className="btn btn-secondary" onClick={download}>
          Unduh .txt
        </button>
      </div>
      <label className="checkbox mt">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        Saya sudah menyimpan kode pemulihan ini di tempat yang aman.
      </label>
      <button type="button" className="btn btn-primary" disabled={!saved} onClick={finish}>
        Lanjut ke halaman masuk
      </button>
    </>
  );
}

function PasswordHints({ password, who }: { password: string; who?: { email?: string; name?: string } }) {
  return (
    <ul className="hints" id="pw-hints" aria-live="polite">
      {passwordHints(password, who).map((h) => (
        <li key={h.id} className={h.ok ? 'ok' : 'todo'}>
          <span aria-hidden="true">{h.ok ? '✓' : '·'}</span>
          <span>
            {h.text}
            <span className="visually-hidden">{h.ok ? ' (terpenuhi)' : ' (belum)'}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ---------- undangan ---------- */

type Enrolment = { email: string; password: string; secret: string; otpauth: string };

export function AcceptInvite({ token }: { token: string | null }) {
  const [step, setStep] = useState(0);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrol, setEnrol] = useState<(Enrolment & { name: string }) | null>(null);
  const [codes, setCodes] = useState<string[] | null>(null);
  const labels = ['Kata sandi', 'Aplikasi autentikator', 'Kode pemulihan'];

  if (!token) {
    return (
      <AuthFrame title="Undangan tidak lengkap">
        <h1>Tautan undangan tidak lengkap</h1>
        <p>
          Tautan ini tidak memuat kode undangan, atau halaman sudah dimuat ulang (demi keamanan kode undangan dihapus
          dari alamat setelah dibuka). Buka lagi tautan lengkap dari administrator, atau minta undangan baru.
        </p>
        <p>
          <Link href="/masuk">Ke halaman masuk</Link>
        </p>
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
      const r = await post<{ email: string; name: string; totpSecret: string; otpauth: string }>(
        '/api/auth/invite/accept',
        { token, password },
        { anonymous: true },
      );
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
    const r = await post<{ recoveryCodes: string[] }>(
      '/api/auth/totp/confirm',
      { email: enrol.email, password: enrol.password, code },
      { anonymous: true },
    );
    setCodes(r.recoveryCodes);
    setEnrol({ ...enrol, password: '', secret: '', otpauth: '' });
    setPassword('');
    setStep(2);
  };

  return (
    <AuthFrame title="Terima undangan" wide>
      <h1>Selamat datang di Portal Admin PROMIND</h1>
      {enrol?.name && <p>Halo, {enrol.name}.</p>}
      <Steps current={step} labels={labels} />
      {step === 0 && (
        <form onSubmit={(e) => void submitPassword(e)} noValidate>
          <h2>Buat kata sandi</h2>
          <p>Pilih kata sandi yang panjang dan belum pernah Anda pakai di tempat lain. Kalimat pendek yang mudah diingat juga boleh.</p>
          <div className="field">
            <label htmlFor="new-password">Kata sandi baru</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="pw-hints"
              required
            />
            <PasswordHints password={password} />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Ulangi kata sandi</label>
            <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>
          <ErrorText>{error}</ErrorText>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan dan lanjut'}
          </button>
        </form>
      )}
      {step === 1 && enrol && <TotpStep secret={enrol.secret} otpauth={enrol.otpauth} onConfirm={confirmCode} />}
      {step === 2 && codes && enrol && <RecoveryStep codes={codes} email={enrol.email} />}
    </AuthFrame>
  );
}

/* ---------- aktifkan ulang 2FA setelah direset administrator ---------- */

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
      const code = err instanceof ApiError ? err.code : 'network';
      setError(
        code === 'invalid_credentials'
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
      <h1>Aktifkan ulang verifikasi 2 langkah</h1>
      <p>Pakai halaman ini bila administrator sudah mereset verifikasi 2 langkah akun Anda (mis. karena ganti ponsel).</p>
      <Steps current={step} labels={['Email dan kata sandi', 'Aplikasi autentikator', 'Kode pemulihan']} />
      {step === 0 && (
        <form onSubmit={(e) => void begin(e)} noValidate>
          <div className="field">
            <label htmlFor="act-email">Email</label>
            <input id="act-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="act-password">Kata sandi</label>
            <input id="act-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <ErrorText>{error}</ErrorText>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Memeriksa…' : 'Lanjut'}
          </button>
        </form>
      )}
      {step === 1 && key && <TotpStep secret={key.secret} otpauth={key.otpauth} onConfirm={confirmCode} />}
      {step === 2 && codes && <RecoveryStep codes={codes} email={email.trim().toLowerCase()} />}
      {step === 0 && (
        <p className="small muted mt">
          <Link href="/masuk">Kembali ke halaman masuk</Link>
        </p>
      )}
    </AuthFrame>
  );
}
