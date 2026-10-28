import { Check } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { ApiError, post } from '../api';
import { Alert, Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, PageHeader } from '../components/ui';
import { cn } from '../lib/cn';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { passwordHints, passwordOk } from '../lib/password';
import { useSession } from '../session';

const ROLE_TEXT = {
  administrator: 'Bisa mengedit dan menerbitkan konten, mengelola pengguna, dan melihat log audit.',
  editor: 'Bisa mengedit dan menerbitkan konten serta mengunggah foto.',
} as const;

export function Account() {
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
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Profil</CardTitle>
            <CardDescription>Untuk mengubah nama atau peran, hubungi administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="divide-y text-sm">
              {[
                ['Nama', user.name],
                ['Email', user.email],
                ['Terakhir masuk', user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Belum tercatat'],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 py-2.5">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
              <div className="py-2.5">
                <dt className="text-muted-foreground">Peran</dt>
                <dd className="mt-1.5 space-y-1">
                  <Badge tone="draft">{user.role === 'administrator' ? 'Administrator' : 'Editor'}</Badge>
                  <p className="text-muted-foreground">{ROLE_TEXT[user.role]}</p>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ganti kata sandi</CardTitle>
            <CardDescription>Setelah diganti, sesi Anda di perangkat lain otomatis keluar.</CardDescription>
          </CardHeader>
          <CardContent>
            {ok && (
              <Alert tone="success" className="mb-4">
                Kata sandi sudah diganti.
              </Alert>
            )}
            <form onSubmit={(e) => void submit(e)} noValidate className="max-w-md space-y-4">
              <div>
                <Label htmlFor="pw-current">Kata sandi saat ini</Label>
                <Input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="pw-next">Kata sandi baru</Label>
                <Input id="pw-next" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} aria-describedby="pw-next-hints" required />
                <ul className="mt-2 space-y-1 text-xs" id="pw-next-hints">
                  {passwordHints(next, user).map((h) => (
                    <li key={h.id} className={cn('flex items-center gap-2', h.ok ? 'text-success' : 'text-muted-foreground')}>
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
              </div>
              <div>
                <Label htmlFor="pw-confirm">Ulangi kata sandi baru</Label>
                <Input id="pw-confirm" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <Alert tone="error">{error}</Alert>}
              <Button type="submit" disabled={busy}>
                {busy ? 'Menyimpan…' : 'Ganti kata sandi'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
