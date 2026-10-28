import { useEffect, useRef, useState } from 'react';
import { ApiError, del, post } from '../api';
import { loadDoc, type ContentDoc } from '../content';
import { buildDiff, type DiffEntry } from '../lib/diff';
import { errorMessage } from '../lib/errors';
import { humanPath } from '../lib/labels';
import { interpretVersion, POLL_INTERVAL_MS, POLL_TIMEOUT_MS, versionUrl } from '../lib/publishState';
import { useSession } from '../session';
import { Dialog, ErrorText, Notice, announce } from './ui';

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
  if (entries.length === 0) return <p className="muted">Tidak ada perubahan isi dibanding versi yang tayang.</p>;
  return (
    <ul className="diff">
      {entries.map((e) => (
        <li key={e.path}>
          <div className="where">{e.label}</div>
          <div className="change">
            {e.kind !== 'added' && (
              <>
                <span className="tag">Sebelum</span>
                <span className="old">{e.before ?? '(kosong)'}</span>
              </>
            )}
            {e.kind !== 'removed' && (
              <>
                <span className="tag">{e.kind === 'added' ? 'Ditambah' : 'Sesudah'}</span>
                <span className="new">{e.after === '' ? '(kosong)' : e.after}</span>
              </>
            )}
            {e.kind === 'removed' && (
              <>
                <span className="tag">Sesudah</span>
                <span className="new">Dihapus</span>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
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
    <button type="button" className="btn btn-primary" onClick={onClose} data-autofocus>
      {stage === 'waiting' ? 'Tutup (pemantauan berhenti)' : 'Selesai'}
    </button>
  ) : (
    <>
      <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
        Batal
      </button>
      {stage !== 'error' && (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => void publish()}
          disabled={stage !== 'review' || withDraft.length === 0 || issueCount > 0}
        >
          {busy ? 'Mengirim…' : 'Ya, terbitkan sekarang'}
        </button>
      )}
    </>
  );

  return (
    <Dialog open={open} onClose={onClose} title={title} busy={busy} wide footer={footer}>
      {stage === 'loading' && <p role="status">Memuat perubahan…</p>}

      {(stage === 'review' || stage === 'sending') && (
        <>
          <p>Periksa perubahan berikut. Setelah diterbitkan, situs publik diperbarui dalam 1–2 menit.</p>
          {reviews.map((r) => (
            <section key={r.key} aria-labelledby={`rev-${r.key}`}>
              <h3 id={`rev-${r.key}`}>
                {r.label} <span className="muted small">({r.diff.length} perubahan)</span>
              </h3>
              {r.issues.length > 0 && (
                <ErrorText>
                  Berkas ini masih punya {r.issues.length} isian bermasalah. Perbaiki dulu di editor.
                </ErrorText>
              )}
              <DiffList entries={r.diff} />
            </section>
          ))}
          <p className="small muted">Foto baru yang sudah diunggah ikut diterbitkan bersama perubahan ini.</p>
          <div className="field">
            <label htmlFor="publish-note">Catatan (opsional)</label>
            <textarea
              id="publish-note"
              value={note}
              maxLength={NOTE_MAX}
              onChange={(e) => setNote(e.target.value)}
              aria-describedby="publish-note-hint"
            />
            <span className="hint" id="publish-note-hint">
              Mis. alasan perubahan. Tersimpan di riwayat. {note.length}/{NOTE_MAX} karakter.
            </span>
          </div>
        </>
      )}

      {(stage === 'sending' || finished) && (
        <ol className="progress" aria-label="Kemajuan penerbitan">
          <li className={stage === 'sending' ? 'active' : 'done'}>
            <span className="mark">{stage === 'sending' ? 'Berjalan' : 'Selesai'}</span>Mengirim ke Git
          </li>
          <li className={stage === 'waiting' ? 'active' : stage === 'live' ? 'done' : ''}>
            <span className="mark">{stage === 'waiting' ? 'Berjalan' : stage === 'live' ? 'Selesai' : stage === 'unverified' ? 'Dilewati' : 'Menunggu'}</span>
            Menunggu situs diperbarui
          </li>
          <li className={stage === 'live' ? 'done' : ''}>
            <span className="mark">{stage === 'live' ? 'Selesai' : 'Menunggu'}</span>Tayang di situs
          </li>
        </ol>
      )}

      {stage === 'waiting' && <p role="status">Situs sedang dibangun ulang. Biasanya butuh 1–2 menit; Anda boleh menutup dialog ini.</p>}
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
      {commit && <p className="small muted">Commit: <code>{commit.slice(0, 7)}</code></p>}

      {stage === 'error' && (
        <>
          <ErrorText>
            {error}
            {conflictKey && ` (berkas: ${labelOf(conflictKey)})`}
          </ErrorText>
          {badIssues.length > 0 && (
            <ul className="bullets">
              {badIssues.map((i) => (
                <li key={`${i.key}${i.path}${i.message}`}>
                  {labelOf(i.key)} › {humanPath(i.path, i.key, reviews.find((r) => r.key === i.key)?.data)}: {i.message}
                </li>
              ))}
            </ul>
          )}
          {conflictKey && (
            <p>
              <button type="button" className="btn btn-danger" onClick={() => void discardConflict()}>
                Buang draf {labelOf(conflictKey)} dan muat ulang
              </button>
            </p>
          )}
        </>
      )}
    </Dialog>
  );
}
