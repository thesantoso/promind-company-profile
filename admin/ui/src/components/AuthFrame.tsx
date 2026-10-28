import { useEffect, type ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Kartu di tengah layar untuk masuk dan undangan. */
export function AuthFrame({ title, children, wide = false }: { title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    document.title = `${title} · Portal Admin PROMIND`;
  }, [title]);
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10">
      <div className={cn('w-full', wide ? 'max-w-xl' : 'max-w-sm')}>
        <p className="mb-6 flex items-center justify-center gap-2">
          <span aria-hidden="true" className="grid size-8 place-items-center rounded-md bg-primary font-display text-base font-extrabold text-primary-foreground">
            P
          </span>
          <span className="font-display text-lg font-extrabold tracking-[0.1em] text-foreground">PROMIND</span>
          <span className="text-sm text-muted-foreground">Portal admin</span>
        </p>
        <div className="rounded-lg border bg-card p-6 sm:p-8">{children}</div>
        <p className="mt-6 text-center text-xs text-muted-foreground">PT Properti Manajemen Inovasi Indonesia</p>
      </div>
    </main>
  );
}
