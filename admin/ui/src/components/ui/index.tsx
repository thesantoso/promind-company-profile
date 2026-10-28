import { Check, Copy } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { Alert } from './alert';
import { Button } from './button';
import { announce } from './toast';

export * from './alert';
export * from './badge';
export * from './button';
export * from './card';
export * from './dialog';
export * from './form';
export * from './misc';
export * from './table';
export * from './toast';
export * from './tooltip';

export function ErrorText({ children, className }: { children: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <Alert tone="error" className={className ?? 'my-3'}>
      {children}
    </Alert>
  );
}

export function Notice({ children, tone = 'info', title }: { children: ReactNode; tone?: 'info' | 'success' | 'warning'; title?: ReactNode }) {
  return (
    <Alert tone={tone} title={title} className="my-3">
      {children}
    </Alert>
  );
}

/** Judul halaman: h1 menerima fokus setelah navigasi agar pembaca layar tahu halaman berganti. */
export function PageHeader({ title, lead, actions, eyebrow }: { title: string; lead?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  useEffect(() => {
    document.title = `${title} · Portal Admin PROMIND`;
  }, [title]);
  return (
    <header className="page-head mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1 text-sm text-muted-foreground">{eyebrow}</div>}
        <h1 id="page-title" tabIndex={-1} className="text-2xl font-bold tracking-tight text-foreground outline-none md:text-[1.75rem]">
          {title}
        </h1>
        {lead && <div className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{lead}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function CopyButton({ text, label = 'Salin', what, variant = 'outline' }: { text: string; label?: string; what: string; variant?: 'outline' | 'secondary' }) {
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
    <Button variant={variant} onClick={() => void copy()}>
      {done === 'ok' ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {done === 'ok' ? 'Tersalin' : done === 'fail' ? 'Salin manual' : label}
    </Button>
  );
}
