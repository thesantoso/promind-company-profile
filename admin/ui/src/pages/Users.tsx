import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { ApiError, get, patch, post, type Role, type User } from '../api';
import { Badge, ConfirmDialog, CopyButton, Dialog, ErrorText, Loading, Notice, PageHeader, announce } from '../components/ui';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { useSession } from '../session';
import { useTitle } from '../useTitle';

const ROLE_LABEL: Record<Role, string> = { administrator: 'Administrator', editor: 'Editor' };
const errText = (e: unknown) => errorMessage(e instanceof ApiError ? e.code : 'network');

type Action = { kind: 'edit' | 'toggle' | 'reset' | 'revoke'; user: User };

function StatusBadge({ u }: { u: User }) {
  if (!u.active) return <Badge tone="muted">Nonaktif</Badge>;
  if (!u.totpConfirmed) return <Badge tone="draft">Menunggu aktivasi 2 langkah</Badge>;
  return <Badge>Aktif</Badge>;
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
      announce('Undangan dibuat. Salin tautannya sekarang.');
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
          <button key="done" type="button" className="btn btn-primary" onClick={onClose}>
            Selesai
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
              Batal
            </button>
            <button type="submit" form="invite-form" className="btn btn-primary" disabled={busy}>
              {busy ? 'Membuat…' : 'Buat undangan'}
            </button>
          </>
        )
      }
    >
      {result ? (
        <>
          <Notice tone="success">Undangan untuk {result.email} sudah dibuat.</Notice>
          <p>
            Kirim tautan ini ke <strong>{result.email}</strong> lewat jalur pribadi (mis. pesan langsung). Portal tidak
            mengirim email. <strong>Tautan hanya ditampilkan sekali</strong> dan berlaku sampai{' '}
            {formatDateTime(result.expiresAt)}.
          </p>
          <label htmlFor="invite-link">Tautan undangan</label>
          <input id="invite-link" type="text" readOnly value={result.link} onFocus={(e) => e.target.select()} data-autofocus />
          <p className="mt">
            <CopyButton text={result.link} label="Salin tautan" what="Tautan undangan" />
          </p>
        </>
      ) : (
        <form id="invite-form" onSubmit={(e) => void submit(e)} noValidate>
          <div className="field">
            <label htmlFor="inv-name">Nama</label>
            <input id="inv-name" type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required data-autofocus />
          </div>
          <div className="field">
            <label htmlFor="inv-email">Email</label>
            <input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="inv-role">Peran</label>
            <select id="inv-role" value={role} onChange={(e) => setRole(e.target.value as Role)} aria-describedby="inv-role-hint">
              <option value="editor">Editor</option>
              <option value="administrator">Administrator</option>
            </select>
            <span className="hint" id="inv-role-hint">
              Editor mengelola konten dan foto. Administrator juga mengelola pengguna dan melihat log audit.
            </span>
          </div>
          <ErrorText>{error}</ErrorText>
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
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="submit" form="edit-user-form" className="btn btn-primary" disabled={busy}>
            {busy ? 'Menyimpan…' : 'Simpan'}
          </button>
        </>
      }
    >
      <form id="edit-user-form" onSubmit={(e) => void submit(e)} noValidate>
        <div className="field">
          <label htmlFor="edit-name">Nama</label>
          <input id="edit-name" type="text" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} data-autofocus />
        </div>
        <div className="field">
          <label htmlFor="edit-role">Peran</label>
          <select id="edit-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="editor">Editor</option>
            <option value="administrator">Administrator</option>
          </select>
          {user?.role === 'administrator' && role === 'editor' && (
            <span className="hint">Pengguna ini tidak bisa lagi mengelola pengguna atau melihat log audit.</span>
          )}
        </div>
        <ErrorText>{error}</ErrorText>
      </form>
    </Dialog>
  );
}

export function Users() {
  useTitle('Pengguna');
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
    announce(msg);
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
          <button type="button" className="btn btn-primary" onClick={() => setInviting(true)}>
            Undang pengguna
          </button>
        }
      />
      {done && <Notice tone="success">{done}</Notice>}
      <ErrorText>{error}</ErrorText>
      {!users && !error && <Loading what="pengguna" />}
      {users && (
        <div className="table-wrap">
          <table className="stack-table">
            <caption className="visually-hidden">Daftar pengguna</caption>
            <thead>
              <tr>
                <th scope="col">Nama</th>
                <th scope="col">Email</th>
                <th scope="col">Peran</th>
                <th scope="col">Status</th>
                <th scope="col">Terakhir masuk</th>
                <th scope="col">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td data-label="Nama">
                    <strong>{u.name}</strong>
                    {u.id === me.id && <span className="muted"> (Anda)</span>}
                  </td>
                  <td data-label="Email">{u.email}</td>
                  <td data-label="Peran">{ROLE_LABEL[u.role]}</td>
                  <td data-label="Status">
                    <StatusBadge u={u} />
                  </td>
                  <td data-label="Terakhir masuk">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : 'Belum pernah'}</td>
                  <td data-label="Tindakan">
                    <div className="actions" role="group" aria-label={`Tindakan untuk ${u.name}`}>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => setAction({ kind: 'edit', user: u })}>
                        Ubah<span className="visually-hidden"> {u.name}</span>
                      </button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => setAction({ kind: 'toggle', user: u })}>
                        {u.active ? 'Nonaktifkan' : 'Aktifkan'}
                        <span className="visually-hidden"> {u.name}</span>
                      </button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => setAction({ kind: 'reset', user: u })}>
                        Reset 2FA<span className="visually-hidden"> {u.name}</span>
                      </button>
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => setAction({ kind: 'revoke', user: u })}>
                        Cabut sesi<span className="visually-hidden"> {u.name}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
          run(() => post(`/api/users/${a!.user.id}/reset-2fa`), `Verifikasi 2 langkah ${a!.user.name} direset. Minta ia membuka halaman Aktifkan 2FA.`)
        }
      >
        <p>
          Pakai ini bila {a?.user.name} kehilangan ponsel atau kode pemulihan. Aplikasi autentikator dan kode pemulihan
          lamanya tidak berlaku lagi, dan semua sesinya berakhir. Setelah itu ia harus membuka{' '}
          <code>{window.location.origin}/aktifkan-2fa</code>, masuk dengan email dan kata sandi, lalu memindai kode QR baru.
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
