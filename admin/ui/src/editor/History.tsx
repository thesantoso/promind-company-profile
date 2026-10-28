import { useCallback, useEffect, useState } from 'react';
import { ApiError, get, post } from '../api';
import { ConfirmDialog, ErrorText, Loading, Notice, announce } from '../components/ui';
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
    <section aria-labelledby="history-title">
      <h2 id="history-title">Riwayat perubahan</h2>
      <p>
        Setiap penerbitan tersimpan sebagai satu versi. Memulihkan versi lama langsung menerbitkannya ke situs sebagai
        perubahan baru; riwayat sebelumnya tetap tersimpan.
      </p>
      {hasDraft && (
        <Notice tone="warning">
          Berkas ini masih punya draf yang belum diterbitkan. Terbitkan atau buang draf itu dulu sebelum memulihkan versi
          lama.
        </Notice>
      )}
      {done && <Notice tone="success">{done}</Notice>}
      <ErrorText>{error}</ErrorText>
      {!commits && !error && <Loading what="riwayat" />}
      {commits && commits.length === 0 && <p className="muted">Belum ada riwayat untuk berkas ini.</p>}
      {commits && commits.length > 0 && (
        <div className="table-wrap">
          <table className="stack-table">
            <caption className="visually-hidden">Riwayat {label}, terbaru di atas</caption>
            <thead>
              <tr>
                <th scope="col">Waktu</th>
                <th scope="col">Oleh</th>
                <th scope="col">Keterangan</th>
                <th scope="col">Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {commits.map((c, i) => (
                <tr key={c.sha}>
                  <td data-label="Waktu">{formatDateTime(c.date)}</td>
                  <td data-label="Oleh">{c.author}</td>
                  <td data-label="Keterangan">
                    {c.message.split('\n')[0]}
                    {c.message.includes('\n') && <div className="meta">{c.message.split('\n').slice(1).join(' ').trim()}</div>}
                    <div className="meta">
                      Versi <code>{c.sha.slice(0, 7)}</code>
                    </div>
                  </td>
                  <td data-label="Tindakan">
                    {i === 0 ? (
                      <span className="muted">Versi yang tayang sekarang</span>
                    ) : (
                      <button type="button" className="btn btn-secondary btn-small" onClick={() => setRestoring(c)}>
                        Pulihkan versi ini<span className="visually-hidden"> ({formatDateTime(c.date)})</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
