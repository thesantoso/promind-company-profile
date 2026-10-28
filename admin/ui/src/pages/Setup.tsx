import { Check, Download } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { ApiError, post, type User } from '../api';
import { Alert, announce, Button, Checkbox, CopyButton, Input, Label } from '../components/ui';
import { cn } from '../lib/cn';
import { errorMessage } from '../lib/errors';
import { groupKey } from '../lib/format';
import { qrPath } from '../lib/qr';

export const errText = (e: unknown) => errorMessage(e instanceof ApiError ? e.code : 'network', 'general', e instanceof ApiError ? e.retryAfter : undefined);

export type Session = { user: User; csrf: string };

/** Penanda langkah: lingkaran bertanda centang untuk langkah selesai, teks untuk semua langkah. */
export function Steps({ current, labels, label = 'Langkah' }: { current: number; labels: string[]; label?: string }) {
  return (
    <ol className="mb-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-xs" aria-label={label}>
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

/** Judul langkah yang menerima fokus saat langkah baru tampil, dan diumumkan ke pembaca layar. */
export function StepHeading({ children, announceText, focus = true }: { children: string; announceText?: string; focus?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus({ preventScroll: true });
    announce(announceText ?? children);
  }, [children, announceText, focus]);
  return (
    <h2 ref={ref} tabIndex={-1} className="text-base font-semibold outline-none">
      {children}
    </h2>
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

/** Menyelesaikan penyiapan autentikator; server sekaligus memasukkan pengguna (cookie sesi terpasang). */
export async function confirmEnrolment(email: string, password: string, code: string): Promise<{ recoveryCodes: string[] } & Session> {
  return post('/api/auth/totp/confirm', { email, password, code }, { anonymous: true });
}

/** Langkah penyiapan autentikator: petunjuk bernomor, QR, kunci manual, dan kolom kode. Dipakai oleh layar masuk dan undangan. */
export function AuthenticatorSetup({
  secret,
  otpauth,
  heading,
  onConfirm,
}: {
  secret: string;
  otpauth: string;
  heading: string;
  onConfirm: (code: string) => Promise<void>;
}) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await onConfirm(code.trim());
    } catch (err) {
      setError(errText(err));
      setCode('');
      window.setTimeout(() => codeRef.current?.focus(), 0);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <StepHeading>{heading}</StepHeading>
      <ol className="mt-4 list-decimal space-y-5 pl-5 text-sm marker:font-semibold marker:text-foreground">
        <li className="pl-1">
          Pasang aplikasi autentikator di ponsel Anda, mis. Google Authenticator, Microsoft Authenticator, atau 1Password.
        </li>
        <li className="pl-1">
          Di aplikasi, pilih tambah akun lalu pindai kode QR ini.
          <div className="mt-3 flex flex-col items-start gap-3">
            <QrCode text={otpauth} />
            <details className="w-full text-sm">
              <summary className="flex min-h-11 cursor-pointer items-center text-link md:min-h-10">Tidak bisa scan?</summary>
              <div className="mt-2 space-y-3">
                <p className="text-muted-foreground">Pilih masukkan kunci manual di aplikasi, lalu ketik kunci ini:</p>
                <p className="rounded-md border bg-subtle px-3 py-2 font-mono text-sm tracking-wide break-all" data-testid="totp-secret">
                  {groupKey(secret)}
                </p>
                <CopyButton text={secret} label="Salin kunci" what="Kunci" />
                <p className="text-muted-foreground">
                  Atau buka tautan ini di ponsel yang sama:{' '}
                  <a className="otpauth font-mono text-xs break-all" href={otpauth}>
                    {otpauth}
                  </a>
                </p>
              </div>
            </details>
          </div>
        </li>
        <li className="pl-1">
          <form onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
            <div>
              <Label htmlFor="enrol-code">Masukkan kode 6 angka dari aplikasi</Label>
              <Input
                id="enrol-code"
                ref={codeRef}
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
              {busy ? 'Memeriksa…' : 'Verifikasi dan lanjut'}
            </Button>
          </form>
        </li>
      </ol>
    </>
  );
}

/** Kode pemulihan: ditampilkan sekali; tombol lanjut baru aktif setelah pengguna menyatakan sudah menyimpannya. */
export function RecoveryCodes({ codes, email, onDone }: { codes: string[]; email: string; onDone: () => void }) {
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
  return (
    <>
      <Alert tone="success">Verifikasi 2 langkah sudah aktif dan Anda sudah masuk.</Alert>
      <div className="mt-5">
        <StepHeading announceText="Verifikasi 2 langkah aktif. Simpan kode pemulihan Anda.">Simpan kode pemulihan</StepHeading>
      </div>
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
        <CopyButton text={codes.join('\n')} label="Salin" what="Kode pemulihan" />
        <Button variant="outline" onClick={download}>
          <Download aria-hidden="true" />
          Unduh .txt
        </Button>
      </div>
      <div className="mt-5 flex items-start gap-3 rounded-md border p-3">
        <Checkbox id="saved-codes" className="mt-0.5" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        <label htmlFor="saved-codes" className="cursor-pointer text-sm">
          Saya sudah menyimpan kode pemulihan
        </label>
      </div>
      <Button className="mt-4 w-full sm:w-auto" disabled={!saved} onClick={onDone}>
        Masuk ke portal
      </Button>
    </>
  );
}
