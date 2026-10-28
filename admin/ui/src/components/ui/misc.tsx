import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export function Separator({ className, ...props }: HTMLAttributes<HTMLHRElement>) {
  return <hr className={cn('my-0 border-0 border-t border-border', className)} {...props} />;
}

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}

/** Kerangka pemuatan dengan teks status untuk pembaca layar. */
export function Loading({ what = 'data', rows = 4 }: { what?: string; rows?: number }) {
  return (
    <div className="space-y-3">
      <p role="status" className="sr-only">
        Memuat {what}…
      </p>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={cn('h-12', i % 2 ? 'w-11/12' : 'w-full')} />
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, children }: { icon?: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-6 py-10 text-center">
      {icon && (
        <span aria-hidden="true" className="mb-1 grid size-10 place-items-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
          {icon}
        </span>
      )}
      <p className="font-display font-semibold text-foreground">{title}</p>
      {children && <div className="max-w-md text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border bg-muted px-1.5 font-mono text-xs">{children}</kbd>;
}
