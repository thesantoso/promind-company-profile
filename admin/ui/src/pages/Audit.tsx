import { ChevronRight, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError, get } from '../api';
import { Button, EmptyState, ErrorText, Input, Label, Loading, NativeSelect, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui';
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
  const [action, setAction] = useState('');
  const [query, setQuery] = useState('');

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

  const actions = useMemo(() => [...new Set((entries ?? []).map((e) => e.action))].map((a) => ({ a, label: actionLabel(a) })).sort((x, y) => x.label.localeCompare(y.label, 'id')), [entries]);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (entries ?? []).filter((e) => {
      if (action && e.action !== action) return false;
      if (!q) return true;
      const hay = `${e.userName ?? ''} ${actionLabel(e.action)} ${detailSummary(e.action, e.detail) ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [entries, action, query]);
  const filtered = action !== '' || query.trim() !== '';

  return (
    <>
      <PageHeader title="Log audit" lead="Catatan siapa melakukan apa di portal, terbaru di atas. Waktu dalam WIB." />
      <ErrorText>{error}</ErrorText>
      {!entries && !error && <Loading what="log audit" />}
      {entries && entries.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end" role="search" aria-label="Saring log audit">
          <div className="sm:w-64">
            <Label htmlFor="audit-action">Tindakan</Label>
            <NativeSelect id="audit-action" value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">Semua tindakan</option>
              {actions.map((o) => (
                <option key={o.a} value={o.a}>
                  {o.label}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="relative sm:w-72">
            <Label htmlFor="audit-query">Cari pengguna atau detail</Label>
            <Search aria-hidden="true" className="pointer-events-none absolute bottom-3 left-3 size-4 text-muted-foreground max-md:bottom-3.5" />
            <Input id="audit-query" type="search" className="pl-9" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <p className="text-sm text-muted-foreground sm:ml-auto" role="status">
            {filtered ? `${shown.length} dari ${entries.length} catatan dimuat` : `${entries.length} catatan dimuat`}
          </p>
        </div>
      )}
      {entries && shown.length > 0 && (
        <Table>
          <caption className="sr-only">Log audit</caption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead scope="col">Waktu</TableHead>
              <TableHead scope="col">Pengguna</TableHead>
              <TableHead scope="col">Tindakan</TableHead>
              <TableHead scope="col">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map((e) => {
              const summary = detailSummary(e.action, e.detail);
              return (
                <TableRow key={e.id} className="align-top">
                  <TableCell data-label="Waktu" className="whitespace-nowrap text-muted-foreground">{formatDateTime(e.ts)}</TableCell>
                  <TableCell data-label="Pengguna">{e.userName ?? (e.userId === null ? 'Tidak dikenal' : `Pengguna #${e.userId}`)}</TableCell>
                  <TableCell data-label="Tindakan" className="font-medium">{actionLabel(e.action)}</TableCell>
                  <TableCell data-label="Detail">
                    {summary && <div className="text-muted-foreground">{summary}</div>}
                    {e.detail !== null && e.detail !== undefined && (
                      <details className="detail group/d mt-1">
                        <summary className="inline-flex min-h-6 cursor-pointer list-none items-center gap-1 rounded text-xs font-medium text-link hover:text-link-hover max-md:min-h-11 [&::-webkit-details-marker]:hidden">
                          <ChevronRight aria-hidden="true" className="size-3.5 transition-transform duration-150 group-open/d:rotate-90" />
                          Data lengkap<span className="sr-only"> untuk entri {e.id}</span>
                        </summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded-md border bg-subtle p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">{JSON.stringify(e.detail, null, 2)}</pre>
                      </details>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
      {entries && entries.length === 0 && <EmptyState title="Belum ada catatan">Tindakan di portal akan muncul di sini.</EmptyState>}
      {entries && entries.length > 0 && shown.length === 0 && (
        <EmptyState title="Tidak ada catatan yang cocok">
          <Button variant="outline" onClick={() => { setAction(''); setQuery(''); }}>Hapus saringan</Button>
        </EmptyState>
      )}
      {more && entries && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" disabled={busy} onClick={() => void fetchPage(entries[entries.length - 1]!.id)}>
            {busy ? 'Memuat…' : 'Muat lebih banyak'}
          </Button>
        </div>
      )}
    </>
  );
}
