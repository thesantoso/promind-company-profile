import { useCallback, useEffect, useState } from 'react';
import { ApiError, get, type User } from '../api';
import { PublishDialog } from '../components/PublishDialog';
import { Badge, ErrorText, Loading, PageHeader } from '../components/ui';
import { listFiles, type FileStatus } from '../content';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { Link } from '../router';
import { isAdmin, useSession } from '../session';
import { useTitle } from '../useTitle';

interface LastPublish {
  ts: number;
  userName: string | null;
  keys: string[];
}

export function useUserNames(): (id: number | null) => string {
  const { user } = useSession();
  const [names, setNames] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    if (!isAdmin(user)) return;
    get<{ users: User[] }>('/api/users')
      .then((r) => setNames(new Map(r.users.map((u) => [u.id, u.name]))))
      .catch(() => undefined);
  }, [user]);
  return useCallback(
    (id: number | null) => (id === null ? 'tidak diketahui' : id === user.id ? 'Anda' : names.get(id) ?? 'pengguna lain'),
    [names, user.id],
  );
}

export function Overview() {
  useTitle('Ringkasan');
  const { user, siteOrigin } = useSession();
  const [files, setFiles] = useState<FileStatus[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<LastPublish | null>(null);
  const [publishing, setPublishing] = useState(false);
  const nameOf = useUserNames();

  const load = useCallback(async () => {
    try {
      setFiles(await listFiles());
      setError(null);
    } catch (e) {
      setError(errorMessage(e instanceof ApiError ? e.code : 'network'));
    }
    if (isAdmin(user)) {
      try {
        const { entries } = await get<{ entries: { ts: number; action: string; detail: unknown; userName: string | null }[] }>('/api/audit?limit=100');
        const p = entries.find((e) => e.action === 'content.publish' || e.action === 'content.restore');
        if (p) {
          const d = (p.detail ?? {}) as { keys?: string[]; key?: string };
          setLast({ ts: p.ts, userName: p.userName, keys: d.keys ?? (d.key ? [d.key] : []) });
        }
      } catch {
        // Info tambahan saja; abaikan bila gagal.
      }
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const drafts = (files ?? []).filter((f) => f.hasDraft);
  const labelOf = (key: string) => files?.find((f) => f.key === key)?.label ?? key;

  return (
    <>
      <PageHeader
        title="Ringkasan"
        lead={`Halo, ${user.name}. Di sini terlihat perubahan yang belum diterbitkan ke situs.`}
        actions={
          drafts.length > 0 && (
            <button type="button" className="btn btn-primary" onClick={() => setPublishing(true)}>
              Terbitkan semua draf ({drafts.length})
            </button>
          )
        }
      />
      <ErrorText>{error}</ErrorText>
      {!files && !error && <Loading what="ringkasan" />}
      {files && (
        <div className="overview-grid">
          <section className="panel callout" aria-labelledby="drafts-title">
            <h2 id="drafts-title">Draf belum terbit</h2>
            {drafts.length === 0 ? (
              <p>Tidak ada draf. Semua konten di portal sama dengan yang tayang di situs.</p>
            ) : (
              <>
                <p className="big-number">{drafts.length}</p>
                <ul className="list-plain list-rows panel-tight">
                  {drafts.map((f) => (
                    <li key={f.key}>
                      <span>
                        <Link href={`/konten/${f.key}`} className="title">
                          {f.label}
                        </Link>
                        <span className="meta">
                          {' '}
                          · diubah {f.draftUpdatedAt ? formatDateTime(f.draftUpdatedAt) : ''} oleh {nameOf(f.draftUpdatedBy)}
                        </span>
                      </span>
                      <Badge tone="draft">Draf</Badge>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
          <section className="panel" aria-labelledby="last-title">
            <h2 id="last-title">Terakhir diterbitkan</h2>
            {last ? (
              <p>
                {formatDateTime(last.ts)} oleh {last.userName ?? 'pengguna terhapus'}
                {last.keys.length > 0 && <>: {last.keys.map(labelOf).join(', ')}</>}.
              </p>
            ) : (
              <p className="muted">{isAdmin(user) ? 'Belum ada penerbitan yang tercatat.' : 'Lihat tab Riwayat di tiap berkas konten untuk perubahan terakhir.'}</p>
            )}
            {siteOrigin && (
              <p>
                <a href={siteOrigin} target="_blank" rel="noopener noreferrer">
                  Buka situs publik
                </a>
              </p>
            )}
          </section>
          <section className="panel" aria-labelledby="start-title">
            <h2 id="start-title">Mulai mengedit</h2>
            <ul className="bullets">
              <li>
                <Link href="/konten">Konten</Link>: teks halaman, layanan, lowongan, dan lainnya.
              </li>
              <li>
                <Link href="/foto">Foto</Link>: unggah foto baru untuk dipakai di konten.
              </li>
            </ul>
            <p className="small muted">Perubahan tersimpan otomatis sebagai draf dan baru tampil di situs setelah diterbitkan.</p>
          </section>
        </div>
      )}
      <PublishDialog
        open={publishing}
        files={drafts.map((d) => ({ key: d.key, label: d.label }))}
        onClose={() => setPublishing(false)}
        onPublished={() => void load()}
      />
    </>
  );
}
