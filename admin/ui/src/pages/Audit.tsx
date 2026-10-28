import { useCallback, useEffect, useState } from 'react';
import { ApiError, get } from '../api';
import { ErrorText, Loading, PageHeader } from '../components/ui';
import { actionLabel, detailSummary } from '../lib/audit';
import { errorMessage } from '../lib/errors';
import { formatDateTime } from '../lib/format';
import { useTitle } from '../useTitle';

interface Entry {
  id: number;
  ts: number;
  action: string;
  detail: unknown;
  userId: number | null;
  userName: string | null;
}

const PAGE = 50;

export function Audit() {
  useTitle('Log audit');
  const [entries, setEntries] = useState<Entry[] | null>(null);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (before?: number) => {
    setBusy(true);
    try {
      const q = before ? `?limit=${PAGE}&before=${before}` : `?limit=${PAGE}`;
      const r = await get<{ entries: Entry[] }>(`/api/audit${q}`);
      setEntries((prev) => (before && prev ? [...prev, ...r.entries] : r.entries));
      setMore(r.entries.length === PAGE);
      setError(null);
    } catch (e) {
      setError(errorMessage(e instanceof ApiError ? e.code : 'network'));
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void fetchPage();
  }, [fetchPage]);

  return (
    <>
      <PageHeader title="Log audit" lead="Catatan siapa melakukan apa di portal, terbaru di atas. Waktu dalam WIB." />
      <ErrorText>{error}</ErrorText>
      {!entries && !error && <Loading what="log audit" />}
      {entries && (
        <div className="table-wrap">
          <table className="stack-table">
            <caption className="visually-hidden">Log audit</caption>
            <thead>
              <tr>
                <th scope="col">Waktu</th>
                <th scope="col">Pengguna</th>
                <th scope="col">Tindakan</th>
                <th scope="col">Detail</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const summary = detailSummary(e.action, e.detail);
                return (
                  <tr key={e.id}>
                    <td data-label="Waktu">{formatDateTime(e.ts)}</td>
                    <td data-label="Pengguna">{e.userName ?? (e.userId === null ? 'Tidak dikenal' : `Pengguna #${e.userId}`)}</td>
                    <td data-label="Tindakan">{actionLabel(e.action)}</td>
                    <td data-label="Detail">
                      {summary && <div>{summary}</div>}
                      {e.detail !== null && e.detail !== undefined && (
                        <details className="detail">
                          <summary>
                            Data lengkap<span className="visually-hidden"> untuk entri {e.id}</span>
                          </summary>
                          <pre>{JSON.stringify(e.detail, null, 2)}</pre>
                        </details>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {entries && entries.length === 0 && <p className="muted">Belum ada catatan.</p>}
      {more && entries && (
        <p className="mt">
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void fetchPage(entries[entries.length - 1]!.id)}>
            {busy ? 'Memuat…' : 'Muat lebih banyak'}
          </button>
        </p>
      )}
    </>
  );
}
