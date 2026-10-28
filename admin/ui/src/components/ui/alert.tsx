import { cva, type VariantProps } from 'class-variance-authority';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

const alertVariants = cva('flex gap-3 rounded-lg border px-4 py-3 text-sm [&_a]:font-medium', {
  variants: {
    tone: {
      info: 'border-border bg-card text-foreground',
      success: 'border-success-border bg-success-soft text-foreground',
      warning: 'border-warning-border bg-warning-soft text-foreground',
      error: 'border-destructive-border bg-destructive-soft text-foreground',
    },
  },
  defaultVariants: { tone: 'info' },
});

const ICON = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle } as const;
const ICON_COLOR = { info: 'text-link', success: 'text-success', warning: 'text-warning', error: 'text-destructive' } as const;
const LABEL = { info: 'Info', success: 'Berhasil', warning: 'Perhatian', error: 'Galat' } as const;

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  role,
  ...props
}: Omit<HTMLAttributes<HTMLDivElement>, 'title'> & VariantProps<typeof alertVariants> & { title?: ReactNode }) {
  const t = tone ?? 'info';
  const Icon = ICON[t];
  return (
    <div role={role ?? (t === 'error' ? 'alert' : 'status')} className={cn(alertVariants({ tone: t }), className)} {...props}>
      <Icon aria-hidden="true" className={cn('mt-0.5 size-4 shrink-0', ICON_COLOR[t])} />
      <div className="min-w-0 flex-1">
        <span className="sr-only">{LABEL[t]}: </span>
        {title && <p className="font-semibold leading-snug">{title}</p>}
        <div className={cn(title && 'mt-1', 'leading-relaxed')}>{children}</div>
      </div>
    </div>
  );
}
