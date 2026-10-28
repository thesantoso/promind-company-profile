import { useEffect, useRef, useState } from 'react';
import { ApiError, del, post } from '../api';
import { loadDoc, type ContentDoc } from '../content';
import { buildDiff, type DiffEntry } from '../lib/diff';
import { errorMessage } from '../lib/errors';
import { humanPath } from '../lib/labels';
import { interpretVersion, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, versionUrl } from '../lib/publishState';
import { useSession } from '../session';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button, Dialog, ErrorText, Label, Notice, Textarea, FieldHint, announce } from './ui';
import { cn } from '../lib/cn';

type Stage = 'loading' | 'review' | 'sending' | 'waiting' | 'live' | 'unverified' | 'error';

interface Review {
  key: string;
  label: string;
  diff: DiffEntry[];
  issues: { path: string; message: string }[];
  data: unknown;
}

const NOTE_MAX = 200;

function DiffList({ entries }: { entries: DiffEntry[] }) {
  if (entries.length === 0) return <p className="text-muted-foreground">Tidak ada perubahan isi dibanding versi yang tayang.</p>;
  return (
    <ul className="diff divide-y overflow-hidden rounded-lg border">
      {entries.map((e) => (
        <li key={e.path} className="bg-card px-3 py-2.5">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">{e.label}</div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-start">
            {e.kind !== 'added' ? (
              <div className="rounded-md border border-destructive-border bg-destructive-soft px-2.5 py-1.5">
                <span className="mb-0.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-destructive">Sebelum</span>
                <span className="old block whitespace-pre-wrap break-words text-foreground line-through decoration-destructive/50">{e.before ?? '(kosong)'}</span>
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
            <ArrowRight aria-hidden="true" className="hidden size-4 self-center text-muted-foreground sm:block" />
            <div className="rounded-md border border-success-border bg-success-soft px-2.5 py-1.5">
              <span className="mb-0.5 block text-[0.6875rem] font-semibold uppercase tracking-wide text-success">
                {e.kind === 'added' ? 'Ditambah' : 'Sesudah'}
              </span>
              <span className="new block whitespace-pre-wrap break-words text-foreground">
                {e.kind === 'removed' ? 'Dihapus' : e.after === '' ? '(kosong)' : e.after}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Step({ state, label, mark }: { state: 'todo' | 'active' | 'done' | 'skipped'; label: string; mark: string }) {
  return (
    <li className={cn('flex items-center gap-3 py-1.5', state === 'todo' && 'text-muted-foreground')}>
      <span
        aria-hidden="true"
        className={cn(
          'grid size-6 shrink-0 place-items-center rounded-full border',
          state === 'done' && 'border-success bg-success-soft text-success',
          state === 'active' && 'border-primary bg-primary-soft text-link',
        )}
      >
        {state === 'done' ? <Check className="size-3.5" /> : state === 'active' ? <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" /> : null}
      </span>
      <span className="font-medium">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{mark}</span>
    </li>
  );
}

/**
 * Tinjau perubahan lalu terbitkan satu atau beberapa berkas. Setelah commit, memantau `version.json` situs
 * sampai commit yang sama tayang (atau menyerah dengan pesan ramah bila tidak bisa diverifikasi).
 */
export function PublishDialog({
  open,
  files,
  onClose,
  onPublished,
}: {
  open: boolean;
  files: { key: string; label: string }[];
  onClose: () => void;
  onPublished: () => void;
}) {
  const { siteOrigin } = useSession();
  const [stage, setStage] = useState<Stage>('loading');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conflictKey, setConflictKey] = useState<string | null>(null);
  const [badIssues, setBadIssues] = useState<{ key: string; path: string; message: string }[]>([]);
  const [commit, setCommit] = useState<string | null>(null);
  const cancelled = useRef(false);
  // Daftar berkas dibekukan saat dialog dibuka; induk boleh memuat ulang datanya selama dialog terbuka.
  const [snapshot, setSnapshot] = useState(files);

  useEffect(() => {
    if (!open) return;
    cancelled.current = false;
    setStage('loading');
    setError(null);
    setConflictKey(null);
    setBadIssues([]);
    setNote('');
    setCommit(null);
    setSnapshot(files);
    (async () => {
      try {
        const docs: ContentDoc[] = await Promise.all(files.map((f) => loadDoc(f.key)));
        if (cancelled.current) return;
        setReviews(
          docs.map((d) => ({
            key: d.key,
            label: d.label,
            diff: d.draft ? buildDiff(d.data, d.draft.data, d.key) : [],
            issues: d.draft?.issues ?? [],
            data: d.draft?.data ?? d.data,
          })),
        );
        setStage('review');
      } catch (e) {
        setError(errorMessage(e instanceof ApiError ? e.code : 'network'));
        setStage('error');
      }
    })();
    return () => {
      cancelled.current = true;
    };
    // Sengaja hanya bergantung pada `open`: daftar berkas dibekukan saat dialog dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const withDraft = reviews.filter((r) => r.diff.length > 0);
  const issueCount = reviews.reduce((n, r) => n + r.issues.length, 0);
  const labelOf = (key: string) => snapshot.find((f) => f.key === key)?.label ?? key;

  const poll = async (sha: string) => {
    setStage('waiting');
    announce('Perubahan terkirim. Menunggu situs diperbarui.');
    const started = Date.now();
    while (!cancelled.current && Date.now() - started < POLL_TIMEOUT_MS) {
      let result: 'live' | 'waiting' | 'unknown';
      try {
        const res = await fetch(versionUrl(siteOrigin), { cache: 'no-store', credentials: 'omit' });
        result = res.ok ? interpretVersion(await res.json(), sha) : 'unknown';
      } catch {
        result = 'unknown';
      }
      if (cancelled.current) return;
      if (result === 'live') {
        setStage('live');
        announce('Selesai. Perubahan sudah tayang di situs.');
        return;
      }
      if (result === 'unknown') break;
      await new Promise((r) => window.setTimeout(r, POLL_INTERVAL_MS));
    }
    if (!cancelled.current) {
      setStage('unverified');
      announce('Perubahan terkirim. Status situs tidak bisa diverifikasi otomatis.');
    }
  };

  const publish = async () => {
    setStage('sending');
    setError(null);
    announce('Mengirim perubahan ke Git.');
    try {
      const r = await post<{ commit: string; files: string[] }>('/api/publish', {
        keys: withDraft.map((w) => w.key),
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setCommit(r.commit);
      onPublished();
      void poll(r.commit);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : 'network';
      const body = e instanceof ApiError ? e.body : {};
      if (code === 'conflict') setConflictKey(typeof body.key === 'string' ? body.key : null);
      if (code === 'invalid' && Array.isArray(body.issues)) setBadIssues(body.issues as { key: string; path: string; message: string }[]);
      setError(errorMessage(code));
      setStage('error');
    }
  };

  const discardConflict = async () => {
    if (!conflictKey) return;
    try {
      await del(`/api/content/${encodeURIComponent(conflictKey)}/draft`);
      announce('Draf dibuang. Data terbaru dimuat ulang.');
      onPublished();
      onClose();
    } catch (e) {
      setError(errorMessage(e instanceof ApiError ? e.code : 'network'));
    }
  };

  const busy = stage === 'sending';
  const finished = stage === 'live' || stage === 'unverified' || stage === 'waiting';
  const title = snapshot.length === 1 ? `Terbitkan: ${snapshot[0]!.label}` : `Terbitkan ${snapshot.length} berkas`;

  const footer = finished ? (
    <Button onClick={onClose} data-autofocus>
      {stage === 'waiting' ? 'Tutup (pemantauan berhenti)' : 'Selesai'}
    </Button>
  ) : (
    <>
      <Button variant="outline" onClick={onClose} disabled={busy}>
        Batal
      </Button>
      {stage !== 'error' && (
        <Button onClick={() => void publish()} disabled={stage !== 'review' || withDraft.length === 0 || issueCount > 0}>
          {busy ? 'Mengirim…' : 'Ya, terbitkan sekarang'}
        </Button>
      )}
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={stage === 'review' || stage === 'sending' ? 'Periksa perubahan berikut. Setelah diterbitkan, situs publik diperbarui dalam 1–2 menit.' : undefined}
      busy={busy}
      size="lg"
      footer={footer}
    >
      <div className="space-y-4">
        {stage === 'loading' && <p role="status" className="text-muted-foreground">Memuat perubahan…</p>}

        {(stage === 'review' || stage === 'sending') && (
          <>
            {reviews.map((r) => (
              <section key={r.key} aria-labelledby={`rev-${r.key}`} className="space-y-2">
                <h3 id={`rev-${r.key}`} className="text-sm font-semibold">
                  {r.label} <span className="font-normal text-muted-foreground">({r.diff.length} perubahan)</span>
                </h3>
                {r.issues.length > 0 && <ErrorText className="">Berkas ini masih punya {r.issues.length} isian bermasalah. Perbaiki dulu di editor.</ErrorText>}
                <DiffList entries={r.diff} />
              </section>
            ))}
            <p className="text-xs text-muted-foreground">Foto baru yang sudah diunggah ikut diterbitkan bersama perubahan ini.</p>
            <div>
              <Label htmlFor="publish-note">Catatan (opsional)</Label>
              <Textarea id="publish-note" className="min-h-16" value={note} maxLength={NOTE_MAX} onChange={(e) => setNote(e.target.value)} aria-describedby="publish-note-hint" />
              <FieldHint id="publish-note-hint">
                Mis. alasan perubahan. Tersimpan di riwayat. {note.length}/{NOTE_MAX} karakter.
              </FieldHint>
            </div>
          </>
        )}

        {(stage === 'sending' || finished) && (
          <ol className="progress divide-y rounded-lg border bg-subtle px-4 text-sm" aria-label="Kemajuan penerbitan">
            <Step state={stage === 'sending' ? 'active' : 'done'} label="Mengirim ke Git" mark={stage === 'sending' ? 'Berjalan' : 'Selesai'} />
            <Step
              state={stage === 'waiting' ? 'active' : stage === 'live' ? 'done' : stage === 'unverified' ? 'skipped' : 'todo'}
              label="Menunggu situs diperbarui"
              mark={stage === 'waiting' ? 'Berjalan' : stage === 'live' ? 'Selesai' : stage === 'unverified' ? 'Dilewati' : 'Menunggu'}
            />
            <Step state={stage === 'live' ? 'done' : 'todo'} label="Tayang di situs" mark={stage === 'live' ? 'Selesai' : 'Menunggu'} />
          </ol>
        )}

        {stage === 'waiting' && <p role="status" className="text-muted-foreground">Situs sedang dibangun ulang. Biasanya butuh 1–2 menit; Anda boleh menutup dialog ini.</p>}
        {stage === 'live' && (
          <Notice tone="success">
            Selesai. Perubahan sudah tayang di{' '}
            <a href={siteOrigin} target="_blank" rel="noopener noreferrer">
              situs PROMIND
            </a>
            .
          </Notice>
        )}
        {stage === 'unverified' && (
          <Notice tone="info">
            Perubahan sudah dikirim; biasanya tampil di situs dalam 1–2 menit. Status situs tidak bisa diperiksa otomatis dari
            sini, jadi silakan cek sendiri:{' '}
            <a href={siteOrigin} target="_blank" rel="noopener noreferrer">
              buka situs PROMIND
            </a>
            .
          </Notice>
        )}
        {commit && (
          <p className="text-xs text-muted-foreground">
            Commit: <code>{commit.slice(0, 7)}</code>
          </p>
        )}

        {stage === 'error' && (
          <>
            <ErrorText className="">
              {error}
              {conflictKey && ` (berkas: ${labelOf(conflictKey)})`}
            </ErrorText>
            {badIssues.length > 0 && (
              <ul className="list-disc space-y-1 pl-5">
                {badIssues.map((i) => (
                  <li key={`${i.key}${i.path}${i.message}`}>
                    {labelOf(i.key)} › {humanPath(i.path, i.key, reviews.find((r) => r.key === i.key)?.data)}: {i.message}
                  </li>
                ))}
              </ul>
            )}
            {conflictKey && (
              <Button variant="destructive" onClick={() => void discardConflict()}>
                Buang draf {labelOf(conflictKey)} dan muat ulang
              </Button>
            )}
          </>
        )}
      </div>
    </Dialog>
  );
}
