import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

/** Pil status: selalu berisi teks, warna hanya penguat. */
const badgeVariants = cva('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium leading-5', {
  variants: {
    tone: {
      neutral: 'border-border bg-muted text-foreground',
      draft: 'border-primary/30 bg-primary-soft text-link',
      muted: 'border-border bg-subtle text-muted-foreground',
      danger: 'border-destructive-border bg-destructive-soft text-destructive',
      success: 'border-success-border bg-success-soft text-success',
      warning: 'border-warning-border bg-warning-soft text-warning',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

const dot: Record<string, string> = {
  neutral: 'bg-muted-foreground',
  draft: 'bg-link',
  muted: 'bg-muted-foreground',
  danger: 'bg-destructive',
  success: 'bg-success',
  warning: 'bg-warning',
};

export function Badge({ className, tone, children, ...props }: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...props}>
      <span aria-hidden="true" className={cn('size-1.5 rounded-full', dot[tone ?? 'neutral'])} />
      {children}
    </span>
  );
}
