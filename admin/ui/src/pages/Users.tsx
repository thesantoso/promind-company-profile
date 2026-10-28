import { KeyRound, LogOut, MoreHorizontal, Pencil, Power, UserPlus } from 'lucide-react';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, get, patch, post, type Role, type User } from '../api';
import {
  Alert, Badge, Button, ConfirmDialog, CopyButton, Dialog, ErrorText, FieldHint, Input, Label, Loading, NativeSelect, PageHeader,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, toast,
} from '../components/ui';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../components/ui/dropdown-menu';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { useSession } from '../session';

const ROLE_LABEL: Record<Role, string> = { administrator: 'Administrator', editor: 'Editor' };
const errText = (e: unknown) => errorMessage(e instanceof ApiError ? e.code : 'network');

type Action = { kind: 'edit' | 'toggle' | 'reset' | 'revoke'; user: User };

function StatusBadge({ u }: { u: User }) {
  if (!u.active) return <Badge tone="muted">Nonaktif</Badge>;
  if (!u.totpConfirmed) return <Badge tone="warning">Menunggu aktivasi 2 langkah</Badge>;
  return <Badge tone="success">Aktif</Badge>;
}

function InviteDialog({ open, onClose, onInvited }: { open: boolean; onClose: () => void; onInvited: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string; link: string; expiresAt: number } | null>(null);

  useEffect(() => {
    if (open) {
      setEmail('');
      setName('');
      setRole('editor');
      setError(null);
      setResult(null);
    }
  }, [open]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await post<{ email: string; expiresAt: number; link: string }>('/api/users/invite', { email: email.trim(), name: name.trim(), role });
      setResult(r);
      toast('Undangan dibuat. Salin tautannya sekarang.');
      onInvited();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'network';
      setError(code === 'bad_request' ? 'Periksa lagi: email harus valid dan nama wajib diisi (maks. 80 karakter).' : errText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={result ? 'Tautan undangan' : 'Undang pengguna'}
      busy={busy}
      footer={
        result ? (
          <Button key="done" onClick={onClose}>
            Selesai
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={busy}>
              Batal
            </Button>
            <Button type="submit" form="invite-form" disabled={busy}>
              {busy ? 'Membuat…' : 'Buat undangan'}
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <Alert tone="success">Undangan untuk {result.email} sudah dibuat.</Alert>
          <p className="text-muted-foreground">
            Kirim tautan ini ke <strong className="text-foreground">{result.email}</strong> lewat jalur pribadi (mis. pesan langsung). Portal
            tidak mengirim email. <strong className="text-foreground">Tautan hanya ditampilkan sekali</strong> dan berlaku sampai{' '}
            {formatDateTime(result.expiresAt)}.
          </p>
          <div>
            <Label htmlFor="invite-link">Tautan undangan</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="invite-link" readOnly value={result.link} onFocus={(e) => e.target.select()} data-autofocus className="font-mono text-xs" />
              <CopyButton text={result.link} label="Salin tautan" what="Tautan undangan" />
            </div>
          </div>
        </div>
      ) : (
        <form id="invite-form" onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
          <div className="rounded-md border bg-subtle p-3 text-muted-foreground">
            <p className="font-medium text-foreground">Yang akan dilakukan pengguna yang diundang:</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-5">
              <li>Membuat kata sandi.</li>
              <li>Menyiapkan aplikasi autentikator (Google Authenticator atau sejenisnya) dengan memindai kode QR.</li>
              <li>Menyimpan kode pemulihan, lalu langsung masuk ke portal.</li>
            </ol>
          </div>
          <div>
            <Label htmlFor="inv-name">Nama</Label>
            <Input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required data-autofocus />
          </div>
          <div>
            <Label htmlFor="inv-email">Email</Label>
            <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="inv-role">Peran</Label>
            <NativeSelect id="inv-role" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-describedby="inv-role-hint">
              <option value="editor">Editor</option>
              <option value="administrator">Administrator</option>
            </NativeSelect>
            <FieldHint id="inv-role-hint">Editor mengelola konten dan foto. Administrator juga mengelola pengguna dan melihat log audit.</FieldHint>
          </div>
          {error && <Alert tone="error">{error}</Alert>}
        </form>
      )}
    </Dialog>
  );
}

function EditDialog({ user, onClose, onSaved }: { user: User | null; onClose: () => void; onSaved: (u: User) => void }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('editor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (user) {
      setName(user.name);
      setRole(user.role);
      setError(null);
    }
  }, [user]);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const body: { name?: string; role?: Role } = {};
      if (name.trim() !== user.name) body.name = name.trim();
      if (role !== user.role) body.role = role;
      if (Object.keys(body).length === 0) return onClose();
      const r = await patch<{ user: User }>(`/api/users/${user.id}`, body);
      onSaved(r.user);
    } catch (err) {
      const code = err instanceof ApiError ? err.code : 'network';
      setError(code === 'bad_request' ? 'Nama wajib diisi (maks. 80 karakter).' : errText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={user !== null}
      onClose={onClose}
      title={`Ubah ${user?.name ?? ''}`}
      busy={busy}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button type="submit" form="edit-user-form" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </Button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={(e) => void submit(e)} noValidate className="space-y-4">
        <div>
          <Label htmlFor="edit-name">Nama</Label>
          <Input id="edit-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} data-autofocus />
        </div>
        <div>
          <Label htmlFor="edit-role">Peran</Label>
          <NativeSelect id="edit-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="editor">Editor</option>
            <option value="administrator">Administrator</option>
          </NativeSelect>
          {user?.role === 'administrator' && role === 'editor' && <FieldHint>Pengguna ini tidak bisa lagi mengelola pengguna atau melihat log audit.</FieldHint>}
        </div>
        {error && <Alert tone="error">{error}</Alert>}
      </form>
    </Dialog>
  );
}

export function Users() {
  const { user: me } = useSession();
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setUsers((await get<{ users: User[] }>('/api/users')).users);
      setError(null);
    } catch (e) {
      setError(errText(e));
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const finish = (msg: string) => {
    setAction(null);
    setDone(msg);
    toast(msg);
    void load();
  };

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
    } catch (e) {
      throw new Error(errText(e));
    }
    finish(msg);
  };

  const a = action;
  const self = a?.user.id === me.id;

  return (
    <>
      <PageHeader
        title="Pengguna"
        lead="Orang yang bisa masuk ke portal ini. Pengguna baru bergabung lewat tautan undangan."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus aria-hidden="true" />
            Undang pengguna
          </Button>
        }
      />
      {done && (
        <Alert tone="success" className="mb-4">
          {done}
        </Alert>
      )}
      <ErrorText>{error}</ErrorText>
      {!users && !error && <Loading what="pengguna" />}
      {users && (
        <Table>
          <caption className="sr-only">Daftar pengguna</caption>
          <TableHeader>
            <tr>
              <TableHead scope="col">Nama</TableHead>
              <TableHead scope="col">Peran</TableHead>
              <TableHead scope="col">Status</TableHead>
              <TableHead scope="col">Terakhir masuk</TableHead>
              <TableHead scope="col">
                <span className="sr-only">Tindakan</span>
              </TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell data-label="Nama">
                  <div className="flex items-center gap-3">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground max-md:hidden">
                      {u.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('')}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium">
                        {u.name}
                        {u.id === me.id && <span className="font-normal text-muted-foreground"> (Anda)</span>}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell data-label="Peran">{ROLE_LABEL[u.role]}</TableCell>
                <TableCell data-label="Status">
                  <StatusBadge u={u} />
                </TableCell>
                <TableCell data-label="Terakhir masuk" className="text-muted-foreground">
                  {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah'}
                </TableCell>
                <TableCell className="text-right max-md:text-left">
                  <DropdownMenu
                    label={`Tindakan untuk ${u.name}`}
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={`Tindakan untuk ${u.name}`}>
                        <MoreHorizontal aria-hidden="true" />
                      </Button>
                    }
                  >
                    <DropdownMenuItem onSelect={() => setAction({ kind: 'edit', user: u })}>
                      <Pencil aria-hidden="true" />
                      Ubah nama atau peran
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setAction({ kind: 'revoke', user: u })}>
                      <LogOut aria-hidden="true" />
                      Cabut semua sesi
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setAction({ kind: 'reset', user: u })}>
                      <KeyRound aria-hidden="true" />
                      Reset 2FA
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem destructive={u.active} onSelect={() => setAction({ kind: 'toggle', user: u })}>
                      <Power aria-hidden="true" />
                      {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                    </DropdownMenuItem>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <InviteDialog open={inviting} onClose={() => setInviting(false)} onInvited={() => void load()} />
      <EditDialog
        user={a?.kind === 'edit' ? a.user : null}
        onClose={() => setAction(null)}
        onSaved={(u) => finish(`Data ${u.name} disimpan.`)}
      />
      <ConfirmDialog
        open={a?.kind === 'toggle'}
        title={a?.user.active ? `Nonaktifkan ${a.user.name}?` : `Aktifkan ${a?.user.name ?? ''}?`}
        confirmLabel={a?.user.active ? 'Ya, nonaktifkan' : 'Ya, aktifkan'}
        danger={a?.user.active}
        onClose={() => setAction(null)}
        onConfirm={() =>
          run(
            () => patch(`/api/users/${a!.user.id}`, { active: !a!.user.active }),
            a!.user.active ? `${a!.user.name} dinonaktifkan.` : `${a!.user.name} diaktifkan kembali.`,
          )
        }
      >
        {a?.user.active ? (
          <p>
            {a.user.name} tidak bisa masuk lagi dan semua sesinya langsung berakhir. Draf dan riwayatnya tetap tersimpan.
            Anda bisa mengaktifkannya kembali kapan saja.
            {self && <strong> Ini akun Anda sendiri: Anda akan langsung keluar.</strong>}
          </p>
        ) : (
          <p>{a?.user.name} bisa masuk lagi dengan kata sandi dan verifikasi 2 langkah yang sama.</p>
        )}
      </ConfirmDialog>
      <ConfirmDialog
        open={a?.kind === 'reset'}
        title={`Reset verifikasi 2 langkah ${a?.user.name ?? ''}?`}
        confirmLabel="Ya, reset 2FA"
        danger
        onClose={() => setAction(null)}
        onConfirm={() =>
          run(() => post(`/api/users/${a!.user.id}/reset-2fa`), `Verifikasi 2 langkah ${a!.user.name} direset. Ia akan dipandu menyiapkan autentikator baru saat masuk berikutnya.`)
        }
      >
        <p>
          Pakai ini bila {a?.user.name} kehilangan ponsel atau kode pemulihan. Aplikasi autentikator dan kode pemulihan
          lamanya tidak berlaku lagi, dan semua sesinya berakhir (keluar dari semua perangkat). Saat masuk berikutnya dengan email dan
          kata sandi yang sama, ia akan dipandu menyiapkan autentikator baru dan menyimpan kode pemulihan baru.
          {self && <strong> Ini akun Anda sendiri: Anda akan langsung keluar.</strong>}
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={a?.kind === 'revoke'}
        title={`Cabut semua sesi ${a?.user.name ?? ''}?`}
        confirmLabel="Ya, cabut semua sesi"
        onClose={() => setAction(null)}
        onConfirm={() => run(() => post(`/api/users/${a!.user.id}/revoke-sessions`), `Semua sesi ${a!.user.name} sudah dicabut.`)}
      >
        <p>
          {a?.user.name} akan keluar dari semua perangkat dan harus masuk lagi. Berguna bila ada perangkat yang hilang atau
          dipakai bersama. Kata sandi dan 2FA tidak berubah.
          {self && <strong> Ini akun Anda sendiri: sesi ini juga berakhir.</strong>}
        </p>
      </ConfirmDialog>
    </>
  );
}
