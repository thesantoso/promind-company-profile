import { forwardRef, type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

const field =
  'w-full rounded-md border border-input bg-card px-3 text-sm text-foreground transition-colors duration-150 placeholder:text-muted-foreground ' +
  'hover:border-[color-mix(in_srgb,var(--input),var(--foreground)_25%)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-60 read-only:bg-muted read-only:text-muted-foreground ' +
  'aria-[invalid=true]:border-destructive aria-[invalid=true]:outline-destructive';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, type = 'text', ...props }, ref) => (
  <input ref={ref} type={type} className={cn(field, 'h-10 max-md:min-h-11', className)} {...props} />
));
Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(field, 'min-h-24 resize-y py-2 leading-relaxed', className)} {...props} />
));
Textarea.displayName = 'Textarea';

/** Select bawaan browser bergaya shadcn: aksesibel di semua perangkat dan tanpa injeksi style. */
export const NativeSelect = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      field,
      'h-10 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat pr-9 max-md:min-h-11',
      'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A//www.w3.org/2000/svg%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%23778899%27%20stroke-width%3D%272%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27/%3E%3C/svg%3E")]',
      className,
    )}
    {...props}
  />
));
NativeSelect.displayName = 'NativeSelect';

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn('mb-1.5 block text-sm font-medium text-foreground', className)} {...props} />;
}

/** Kotak centang bawaan dengan warna aksen. */
export const Checkbox = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input ref={ref} type="checkbox" className={cn('size-4 shrink-0 cursor-pointer rounded accent-primary max-md:size-5', className)} {...props} />
));
Checkbox.displayName = 'Checkbox';

/** Sakelar: checkbox bawaan dengan role="switch", jadi tetap bisa dioperasikan keyboard dan pembaca layar. */
export const Switch = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="checkbox"
    role="switch"
    className={cn(
      'relative h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-muted transition-colors duration-150',
      'before:absolute before:left-0.5 before:top-1/2 before:size-[18px] before:-translate-y-1/2 before:rounded-full before:bg-card before:shadow-sm before:ring-1 before:ring-input before:transition-transform before:duration-150',
      'checked:border-primary checked:bg-primary checked:before:translate-x-5 checked:before:ring-primary',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
      className,
    )}
    {...props}
  />
));
Switch.displayName = 'Switch';

export function FieldHint({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn('mt-1.5 block text-xs leading-relaxed text-muted-foreground', className)} {...props} />;
}
