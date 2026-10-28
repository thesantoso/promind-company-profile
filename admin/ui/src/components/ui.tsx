import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

/* ---------- pengumuman untuk pembaca layar ---------- */

let announceFn: ((msg: string) => void) | null = null;

/** Mengumumkan perubahan status lewat satu wilayah aria-live yang selalu ada. */
export function announce(msg: string): void {
  announceFn?.(msg);
}

export function Announcer() {
  const [msg, setMsg] = useState('');
  useEffect(() => {
    announceFn = (m) => {
      setMsg('');
      // Jeda kecil agar pesan yang sama tetap dibacakan ulang.
      window.setTimeout(() => setMsg(m), 30);
    };
    return () => {
      announceFn = null;
    };
  }, []);
  return (
    <div className="visually-hidden" aria-live="polite" aria-atomic="true">
      {msg}
    </div>
  );
}

/* ---------- pesan ---------- */

export function ErrorText({ children, id }: { children: ReactNode; id?: string }) {
  if (!children) return null;
  return (
    <div className="msg msg-error" role="alert" id={id}>
      <span className="msg-label">Galat:</span> {children}
    </div>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'success' | 'warning' }) {
  const label = tone === 'success' ? 'Berhasil:' : tone === 'warning' ? 'Perhatian:' : 'Info:';
  return (
    <div className={`msg msg-${tone}`} role="status">
      <span className="msg-label">{label}</span> {children}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'draft' | 'muted' | 'danger' }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

/* ---------- dialog modal ---------- */

export function Dialog({
  open,
  onClose,
  title,
  children,
  footer,
  busy = false,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement;
      d.showModal();
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    } else if (!open && d.open) {
      d.close();
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
      if (returnTo.current instanceof HTMLElement && returnTo.current.isConnected) returnTo.current.focus();
    };
  }, []);

  useEffect(() => {
    if (open) return;
    const el = returnTo.current;
    if (el instanceof HTMLElement && el.isConnected) el.focus();
    returnTo.current = null;
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={wide ? 'dialog dialog-wide' : 'dialog'}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      {open && (
        <div className="dialog-inner">
          <div className="dialog-head">
            <h2 id={titleId}>{title}</h2>
            <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} disabled={busy} aria-label="Tutup dialog">
              <span aria-hidden="true">×</span>
            </button>
          </div>
          <div className="dialog-body">{children}</div>
          {footer && <div className="dialog-foot">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Dialog konfirmasi dengan penjelasan konsekuensi; galat dari tindakan ditampilkan di dalam dialog. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  danger = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) setError(null);
  }, [open]);
  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      busy={busy}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button type="button" className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={() => void run()} disabled={busy}>
            {busy ? 'Memproses…' : confirmLabel}
          </button>
        </>
      }
    >
      {children}
      <ErrorText>{error}</ErrorText>
    </Dialog>
  );
}

/* ---------- salin ---------- */

export function CopyButton({ text, label = 'Salin', what }: { text: string; label?: string; what: string }) {
  const [done, setDone] = useState<null | 'ok' | 'fail'>(null);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone('ok');
      announce(`${what} disalin ke papan klip.`);
    } catch {
      setDone('fail');
      announce(`${what} tidak bisa disalin otomatis. Pilih teksnya lalu salin manual.`);
    }
    window.setTimeout(() => setDone(null), 2500);
  };
  return (
    <button type="button" className="btn btn-secondary" onClick={() => void copy()}>
      {done === 'ok' ? 'Tersalin' : done === 'fail' ? 'Salin manual' : label}
    </button>
  );
}

/* ---------- kerangka halaman ---------- */

export function PageHeader({ title, lead, actions }: { title: string; lead?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="page-head">
      <div>
        <h1 id="page-title" tabIndex={-1}>
          {title}
        </h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Loading({ what = 'data' }: { what?: string }) {
  return (
    <p className="muted" role="status">
      Memuat {what}…
    </p>
  );
}
