import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Button } from './button';
import { Alert } from './alert';

/**
 * Dialog bergaya shadcn di atas <dialog>.showModal() bawaan: lapisan atas, latar belakang inert,
 * Esc menutup, fokus kembali ke pemicu. Tidak memakai Radix Dialog karena react-remove-scroll
 * menyuntikkan elemen <style> yang diblokir CSP `style-src 'self'`.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  busy = false,
  size = 'md',
  alert = false,
  icon,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  busy?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** AlertDialog: role="alertdialog" untuk konfirmasi tindakan. */
  alert?: boolean;
  icon?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<Element | null>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      returnTo.current = document.activeElement;
      d.showModal();
      d.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    } else if (!open && d.open) {
      d.close();
      const el = returnTo.current;
      if (el instanceof HTMLElement && el.isConnected) el.focus();
      returnTo.current = null;
    }
  }, [open]);

  useEffect(() => {
    const d = ref.current;
    return () => {
      if (d?.open) d.close();
      const el = returnTo.current;
      if (el instanceof HTMLElement && el.isConnected) el.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      role={alert ? 'alertdialog' : undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={cn(
        'dlg m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-hidden rounded-lg border bg-card p-0 text-foreground shadow-[var(--shadow-overlay)]',
        size === 'sm' && 'max-w-md',
        size === 'md' && 'max-w-xl',
        size === 'lg' && 'max-w-3xl',
      )}
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start gap-3 px-6 pt-5 pb-3">
            {icon && <span aria-hidden="true" className="mt-0.5 [&_svg]:size-5">{icon}</span>}
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-semibold leading-snug">
                {title}
              </h2>
              {description && (
                <div id={descId} className="mt-1 text-sm text-muted-foreground">
                  {description}
                </div>
              )}
            </div>
            <Button variant="ghost" size="icon-sm" className="-mr-2 -mt-1 text-muted-foreground" onClick={onClose} disabled={busy} aria-label="Tutup dialog">
              <X aria-hidden="true" />
            </Button>
          </div>
          {children && <div className="overflow-y-auto px-6 pb-5 text-sm">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t bg-subtle px-6 py-3">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** AlertDialog untuk konfirmasi; galat dari tindakan tampil di dalamnya. */
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
      size="sm"
      alert
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Batal
          </Button>
          <Button variant={danger ? 'destructive' : 'default'} onClick={() => void run()} disabled={busy}>
            {busy ? 'Memproses…' : confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-muted-foreground [&_strong]:text-foreground">{children}</div>
      {error && (
        <Alert tone="error" className="mt-4">
          {error}
        </Alert>
      )}
    </Dialog>
  );
}

/** Laci samping untuk navigasi di layar sempit (juga <dialog> bawaan). */
export function Sheet({ open, onClose, label, children }: { open: boolean; onClose: () => void; label: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    else if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className="dlg sheet m-0 h-dvh max-h-dvh w-[min(20rem,85vw)] max-w-none border-r bg-card p-0 text-foreground shadow-[var(--shadow-overlay)]"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && children}
    </dialog>
  );
}
