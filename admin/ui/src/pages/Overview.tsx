import { ArrowRight, CheckCircle2, ExternalLink, FileText, Image as ImageIcon, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ApiError, get, type User } from '../api';
import { PublishDialog } from '../components/PublishDialog';
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, EmptyState, ErrorText, Loading, PageHeader } from '../components/ui';
import { listFiles, type FileStatus } from '../content';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { Link } from '../router';
import { isAdmin, useSession } from '../session';

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
  return useCallback((id: number | null) => (id === null ? 'tidak diketahui' : id === user.id ? 'Anda' : names.get(id) ?? 'pengguna lain'), [names, user.id]);
}

export function Overview() {
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
            <Button onClick={() => setPublishing(true)}>
              <Send aria-hidden="true" />
              Terbitkan semua draf ({drafts.length})
            </Button>
          )
        }
      />
      <ErrorText>{error}</ErrorText>
      {!files && !error && <Loading what="ringkasan" rows={3} />}
      {files && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardTitle id="drafts-title">Draf belum terbit</CardTitle>
                <CardDescription>Perubahan yang tersimpan di portal tetapi belum tayang di situs.</CardDescription>
              </div>
              <span className="font-display text-3xl font-bold leading-none tabular-nums" aria-label={`${drafts.length} draf`}>
                {drafts.length}
              </span>
            </CardHeader>
            <CardContent>
              {drafts.length === 0 ? (
                <EmptyState icon={<CheckCircle2 />} title="Tidak ada draf">
                  Semua konten di portal sama dengan yang tayang di situs.
                </EmptyState>
              ) : (
                <ul className="divide-y rounded-md border" aria-labelledby="drafts-title">
                  {drafts.map((f) => (
                    <li key={f.key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                      <div className="min-w-0">
                        <Link href={`/konten/${f.key}`} className="font-medium text-foreground no-underline hover:underline">
                          {f.label}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Diubah {f.draftUpdatedAt ? formatDateTime(f.draftUpdatedAt) : ''} oleh {nameOf(f.draftUpdatedBy)}
                        </p>
                      </div>
                      <Badge tone="draft">Draf</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Terakhir diterbitkan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {last ? (
                  <p>
                    {formatDateTime(last.ts)} oleh <span className="font-medium">{last.userName ?? 'pengguna terhapus'}</span>
                    {last.keys.length > 0 && <>: {last.keys.map(labelOf).join(', ')}</>}.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {isAdmin(user) ? 'Belum ada penerbitan yang tercatat.' : 'Lihat tab Riwayat di tiap berkas konten untuk perubahan terakhir.'}
                  </p>
                )}
                {siteOrigin && (
                  <a href={siteOrigin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-medium">
                    Buka situs publik <ExternalLink aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">(tab baru)</span>
                  </a>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Mulai mengedit</CardTitle>
                <CardDescription>Perubahan tersimpan otomatis sebagai draf dan baru tampil setelah diterbitkan.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/konten">
                    <span className="flex items-center gap-2">
                      <FileText aria-hidden="true" /> Konten
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="justify-between">
                  <Link href="/foto">
                    <span className="flex items-center gap-2">
                      <ImageIcon aria-hidden="true" /> Foto
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
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
