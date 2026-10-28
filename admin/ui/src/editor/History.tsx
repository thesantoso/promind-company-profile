import { useCallback, useEffect, useState } from 'react';
import { ApiError, get, post } from '../api';
import { RotateCcw } from 'lucide-react';
import { Button, ConfirmDialog, EmptyState, ErrorText, Loading, Notice, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, announce } from '../components/ui';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export function History({ fileKey, label, hasDraft, onRestored }: { fileKey: string; label: string; hasDraft: boolean; onRestored: () => void }) {
  const [commits, setCommits] = useState<Commit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<Commit | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCommits((await get<{ commits: Commit[] }>(`/api/content/${encodeURIComponent(fileKey)}/history`)).commits);
      setError(null);
    } catch (e) {
      setError(errorMessage(e instanceof ApiError ? e.code : 'network'));
    }
  }, [fileKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section aria-labelledby="history-title" className="space-y-4">
      <div>
        <h2 id="history-title" className="text-lg font-semibold">
          Riwayat perubahan
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Setiap penerbitan tersimpan sebagai satu versi. Memulihkan versi lama langsung menerbitkannya ke situs sebagai
          perubahan baru; riwayat sebelumnya tetap tersimpan.
        </p>
      </div>
      {hasDraft && (
        <Notice tone="warning">
          Berkas ini masih punya draf yang belum diterbitkan. Terbitkan atau buang draf itu dulu sebelum memulihkan versi
          lama.
        </Notice>
      )}
      {done && <Notice tone="success">{done}</Notice>}
      <ErrorText>{error}</ErrorText>
      {!commits && !error && <Loading what="riwayat" />}
      {commits && commits.length === 0 && <EmptyState title="Belum ada riwayat">Belum ada riwayat untuk berkas ini.</EmptyState>}
      {commits && commits.length > 0 && (
        <Table>
          <caption className="sr-only">Riwayat {label}, terbaru di atas</caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col">Waktu</TableHead>
              <TableHead scope="col">Oleh</TableHead>
              <TableHead scope="col">Keterangan</TableHead>
              <TableHead scope="col">Tindakan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commits.map((c, i) => (
              <TableRow key={c.sha}>
                <TableCell data-label="Waktu" className="whitespace-nowrap">{formatDateTime(c.date)}</TableCell>
                <TableCell data-label="Oleh">{c.author}</TableCell>
                <TableCell data-label="Keterangan">
                  <span className="font-medium">{c.message.split('\n')[0]}</span>
                  {c.message.includes('\n') && <div className="meta text-xs text-muted-foreground">{c.message.split('\n').slice(1).join(' ').trim()}</div>}
                  <div className="meta text-xs text-muted-foreground">
                    Versi <code>{c.sha.slice(0, 7)}</code>
                  </div>
                </TableCell>
                <TableCell data-label="Tindakan">
                  {i === 0 ? (
                    <span className="text-muted-foreground">Versi yang tayang sekarang</span>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setRestoring(c)}>
                      <RotateCcw aria-hidden="true" />
                      Pulihkan versi ini<span className="sr-only"> ({formatDateTime(c.date)})</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ConfirmDialog
        open={restoring !== null}
        title="Pulihkan versi ini?"
        confirmLabel="Ya, pulihkan dan terbitkan"
        onClose={() => setRestoring(null)}
        onConfirm={async () => {
          const c = restoring!;
          try {
            const r = await post<{ commit: string }>(`/api/content/${encodeURIComponent(fileKey)}/restore`, { sha: c.sha });
            setRestoring(null);
            const msg = `Versi ${formatDateTime(c.date)} dipulihkan dan diterbitkan (commit ${r.commit.slice(0, 7)}). Situs diperbarui dalam 1–2 menit.`;
            setDone(msg);
            announce(msg);
            onRestored();
            await load();
          } catch (e) {
            const code = e instanceof ApiError ? e.code : 'network';
            throw new Error(code === 'invalid' ? 'Versi ini tidak lagi lolos aturan konten saat ini, jadi tidak bisa dipulihkan.' : errorMessage(code));
          }
        }}
      >
        <p>
          Isi <strong>{label}</strong> akan dikembalikan ke versi {restoring ? formatDateTime(restoring.date) : ''} dan
          langsung diterbitkan ke situs publik.
        </p>
      </ConfirmDialog>
    </section>
  );
}
