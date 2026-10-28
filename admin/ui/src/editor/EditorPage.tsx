import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError, api, del, type Issue } from '../api';
import { PublishDialog } from '../components/PublishDialog';
import { Badge, ConfirmDialog, ErrorText, Loading, Notice, PageHeader, announce } from '../components/ui';
import { listImages, loadDoc, type ContentDoc, type ImageInfo } from '../content';
import { errorMessage } from '../lib/errors';
import { formatTime } from '../lib/format';
import { humanPath } from '../lib/labels';
import { closestPath, fieldId } from '../lib/paths';
import { publishBlockReason } from '../lib/publishState';
import { deepEqual, type Json } from '../lib/shape';
import { addNavigationGuard, Link } from '../router';
import { useTitle } from '../useTitle';
import { FormContext } from './ctx';
import { RootForm } from './Form';
import { History } from './History';
import { ImagesContext } from './ImageField';

const AUTOSAVE_MS = 1500;

type SaveState = { kind: 'idle' } | { kind: 'pending' } | { kind: 'saving' } | { kind: 'saved'; at: Date } | { kind: 'failed'; message: string };

/** Fokus ke kontrol untuk sebuah path masalah (atau induk terdekatnya), membuka butir yang tertutup. */
export function focusPath(path: string): void {
  const target = closestPath(path, (p) => document.getElementById(fieldId(p)) !== null);
  if (target === null) return;
  const el = document.getElementById(fieldId(target))!;
  for (let d = el.closest('details'); d; d = d.parentElement?.closest('details') ?? null) d.open = true;
  const focusable = el.matches('input, textarea, select, button')
    ? el
    : el.querySelector<HTMLElement>('[aria-invalid="true"], input, textarea, select') ?? el;
  focusable.focus();
  focusable.scrollIntoView({ block: 'center' });
}

function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  let text = '';
  if (state.kind === 'pending') text = 'Ada perubahan, menyimpan sebentar lagi…';
  if (state.kind === 'saving') text = 'Menyimpan…';
  if (state.kind === 'saved') text = `Draf tersimpan ${formatTime(state.at)}`;
  return (
    <div className={state.kind === 'failed' ? 'save-state failed' : 'save-state'}>
      <span role="status" aria-live="polite" data-testid="save-state">
        {state.kind === 'failed' ? `Gagal menyimpan — coba lagi. ${state.message}` : text}
      </span>
      {state.kind === 'failed' && (
        <>
          {' '}
          <button type="button" className="btn btn-secondary btn-small" onClick={onRetry}>
            Coba simpan lagi
          </button>
        </>
      )}
    </div>
  );
}

export default function EditorPage({ fileKey, tab }: { fileKey: string; tab: 'form' | 'history' }) {
  const [doc, setDoc] = useState<ContentDoc | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [work, setWork] = useState<Json | null>(null);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: 'idle' });
  const [images, setImages] = useState<ImageInfo[] | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const [discardedNote, setDiscardedNote] = useState(false);
  useTitle(doc ? `Edit ${doc.label}` : 'Editor konten');

  const workRef = useRef<Json | null>(null);
  const version = useRef(0);
  const savedVersion = useRef(0);
  const saving = useRef<Promise<void> | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const isDirty = () => version.current !== savedVersion.current;

  const load = useCallback(async () => {
    try {
      const d = await loadDoc(fileKey);
      setDoc(d);
      const w = d.draft ? d.draft.data : d.data;
      setWork(w);
      workRef.current = w;
      setIssues(d.draft?.issues ?? []);
      setHasDraft(d.draft !== null);
      version.current = 0;
      savedVersion.current = 0;
      setSave({ kind: 'idle' });
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof ApiError && e.status === 404 ? 'Berkas konten ini tidak ada.' : errorMessage(e instanceof ApiError ? e.code : 'network'));
    }
  }, [fileKey]);

  const refreshImages = useCallback(() => {
    listImages().then(setImages).catch(() => setImages([]));
  }, []);

  useEffect(() => {
    void load();
    refreshImages();
  }, [load, refreshImages]);

  const saveNow = useCallback(async (): Promise<void> => {
    window.clearTimeout(timer.current);
    if (saving.current) {
      await saving.current;
      if (isDirty()) return saveNow();
      return;
    }
    if (!isDirty()) return;
    const v = version.current;
    setSave({ kind: 'saving' });
    const run = (async () => {
      try {
        const r = await api<{ issues: Issue[]; baseSha: string }>('PUT', `/api/content/${encodeURIComponent(fileKey)}`, { data: workRef.current });
        savedVersion.current = v;
        setIssues(r.issues);
        setHasDraft(true);
        if (version.current === v) {
          setSave({ kind: 'saved', at: new Date() });
          announce(r.issues.length ? `Draf tersimpan. Ada ${r.issues.length} isian yang perlu diperbaiki.` : 'Draf tersimpan.');
        }
      } catch (e) {
        setSave({ kind: 'failed', message: errorMessage(e instanceof ApiError ? e.code : 'network', 'draft') });
      }
    })();
    saving.current = run;
    await run;
    saving.current = null;
    if (isDirty() && version.current !== v) await saveNow();
  }, [fileKey]);

  const onChange = (next: Json) => {
    workRef.current = next;
    version.current += 1;
    setDiscardedNote(false);
    setWork(next);
    setSave((s) => (s.kind === 'saving' ? s : { kind: 'pending' }));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void saveNow(), AUTOSAVE_MS);
  };

  // Peringatan saat menutup tab dengan perubahan yang belum tersimpan.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty() || saving.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  // Navigasi di dalam portal: simpan dulu; bila gagal, tanyakan.
  useEffect(
    () =>
      addNavigationGuard(async () => {
        if (!isDirty() && !saving.current) return true;
        await saveNow();
        if (!isDirty()) return true;
        return window.confirm('Perubahan terakhir belum tersimpan. Tetap tinggalkan halaman ini dan buang perubahan itu?');
      }),
    [saveNow],
  );

  // Keluar lewat tombol Kembali browser: kirim perubahan yang tertunda tanpa menunggu.
  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      if (isDirty()) void api('PUT', `/api/content/${encodeURIComponent(fileKey)}`, { data: workRef.current }).catch(() => undefined);
    },
    [fileKey],
  );

  const issueMap = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const i of issues) m.set(i.path, [...(m.get(i.path) ?? []), i.message]);
    return m;
  }, [issues]);
  const ctx = useMemo(
    () => ({
      fileKey,
      issues: issueMap,
      hasIssuesUnder: (p: string) => issues.some((i) => i.path === p || i.path.startsWith(`${p}.`) || i.path.startsWith(`${p}[`)),
    }),
    [fileKey, issueMap, issues],
  );
  const imagesCtx = useMemo(() => ({ images, refresh: refreshImages }), [images, refreshImages]);

  if (loadError) {
    return (
      <>
        <PageHeader title="Editor konten" />
        <ErrorText>{loadError}</ErrorText>
        <Link href="/konten">Kembali ke daftar konten</Link>
      </>
    );
  }
  if (!doc || work === null) return <Loading what="berkas konten" />;

  const changed = !deepEqual(work, doc.data);
  const blocked = publishBlockReason({
    hasDraft,
    dirty: isDirty(),
    saving: save.kind === 'saving' || save.kind === 'pending',
    saveFailed: save.kind === 'failed',
    issueCount: issues.length,
    changed,
  });
  const stale = doc.draft !== null && doc.draft.baseSha !== doc.sha;

  return (
    <FormContext.Provider value={ctx}>
      <ImagesContext.Provider value={imagesCtx}>
        <PageHeader
          title={doc.label}
          lead={
            <>
              <Link href="/konten">Konten</Link> › {doc.label} · <code>{doc.key}.json</code>{' '}
              {hasDraft ? <Badge tone="draft">Ada draf</Badge> : <Badge tone="muted">Sama dengan situs</Badge>}
            </>
          }
        />
        <nav className="tabs" aria-label="Bagian editor">
          <Link href={`/konten/${fileKey}`} aria-current={tab === 'form' ? 'page' : undefined}>
            Isi
          </Link>
          <Link href={`/konten/${fileKey}/riwayat`} aria-current={tab === 'history' ? 'page' : undefined}>
            Riwayat
          </Link>
        </nav>

        {tab === 'history' ? (
          <History fileKey={fileKey} label={doc.label} hasDraft={hasDraft} onRestored={() => void load()} />
        ) : (
          <>
            <div className="editor-bar">
              <SaveStatus state={save} onRetry={() => void saveNow()} />
              <div className="row">
                {hasDraft && (
                  <button type="button" className="btn btn-link-danger" onClick={() => setDiscarding(true)}>
                    Buang draf
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={blocked !== null}
                  aria-describedby="publish-reason"
                  onClick={() => setPublishing(true)}
                >
                  Terbitkan
                </button>
              </div>
              <p id="publish-reason" className="small muted full-row">
                {blocked ?? 'Draf siap diterbitkan.'}
              </p>
            </div>

            {discardedNote && <Notice tone="success">Draf dibuang. Isian kembali sama dengan yang tayang di situs.</Notice>}
            {stale && (
              <Notice tone="warning">
                Berkas ini sudah berubah di tempat lain (mis. dipulihkan dari riwayat) setelah draf Anda dimulai, sehingga
                draf tidak bisa diterbitkan. Catat perubahan Anda, lalu buang draf untuk memuat versi terbaru.
              </Notice>
            )}

            {issues.length > 0 && (
              <section className="issue-summary" aria-labelledby="issues-title">
                <h2 id="issues-title">Ada {issues.length} isian yang perlu diperbaiki</h2>
                <ul>
                  {issues.map((i, n) => (
                    <li key={`${i.path}-${n}`}>
                      <a
                        href={`#${fieldId(i.path)}`}
                        onClick={(e) => {
                          e.preventDefault();
                          focusPath(i.path);
                        }}
                      >
                        {humanPath(i.path, fileKey, work)}
                      </a>
                      : {i.message}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <form onSubmit={(e) => e.preventDefault()} aria-label={`Isi ${doc.label}`} noValidate>
              <RootForm kind={doc.kind} value={work} onChange={onChange} />
            </form>
          </>
        )}

        <PublishDialog
          open={publishing}
          files={[{ key: fileKey, label: doc.label }]}
          onClose={() => setPublishing(false)}
          onPublished={() => void load()}
        />
        <ConfirmDialog
          open={discarding}
          title="Buang draf?"
          confirmLabel="Ya, buang draf"
          danger
          onClose={() => setDiscarding(false)}
          onConfirm={async () => {
            window.clearTimeout(timer.current);
            try {
              await del(`/api/content/${encodeURIComponent(fileKey)}/draft`);
            } catch (e) {
              throw new Error(errorMessage(e instanceof ApiError ? e.code : 'network'));
            }
            setDiscarding(false);
            await load();
            setDiscardedNote(true);
            announce('Draf dibuang.');
          }}
        >
          <p>
            Semua perubahan yang belum diterbitkan pada <strong>{doc.label}</strong> akan hilang, termasuk perubahan
            pengguna lain di berkas ini. Isian kembali sama dengan yang tayang di situs.
          </p>
        </ConfirmDialog>
      </ImagesContext.Provider>
    </FormContext.Provider>
  );
}
