import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';

/**
 * Toast kecil yang aksesibel tanpa pustaka (sonner menyuntikkan <style>, diblokir CSP).
 * Satu wilayah aria-live polite selalu ada; toast terlihat hilang sendiri setelah beberapa detik.
 */
type Tone = 'info' | 'success' | 'error';
interface Toast {
  id: number;
  message: string;
  tone: Tone;
  visible: boolean;
}

let push: ((message: string, tone: Tone, visible: boolean) => void) | null = null;
let seq = 0;

/** Pengumuman untuk pembaca layar saja (tanpa toast terlihat). */
export function announce(message: string): void {
  push?.(message, 'info', false);
}

/** Toast terlihat + diumumkan. */
export function toast(message: string, tone: Tone = 'success'): void {
  push?.(message, tone, true);
}

const ICON = { info: Info, success: CheckCircle2, error: XCircle } as const;
const ICON_COLOR = { info: 'text-link', success: 'text-success', error: 'text-destructive' } as const;

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [live, setLive] = useState('');

  useEffect(() => {
    push = (message, tone, visible) => {
      setLive('');
      window.setTimeout(() => setLive(message), 30);
      if (!visible) return;
      const id = ++seq;
      setToasts((t) => [...t.slice(-2), { id, message, tone, visible }]);
      window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
    };
    return () => {
      push = null;
    };
  }, []);

  return (
    <>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {live}
      </div>
      <div aria-hidden="true" className="pointer-events-none fixed right-4 bottom-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {toasts.map((t) => {
          const Icon = ICON[t.tone];
          return (
            <div key={t.id} className={cn('pointer-events-auto flex items-start gap-3 rounded-lg border bg-popover px-4 py-3 text-sm shadow-[var(--shadow-overlay)]')}>
              <Icon className={cn('mt-0.5 size-4 shrink-0', ICON_COLOR[t.tone])} />
              <p className="flex-1 leading-relaxed">{t.message}</p>
              <button
                type="button"
                tabIndex={-1}
                className="-mr-1 grid size-6 cursor-pointer place-items-center rounded text-muted-foreground hover:bg-accent"
                onClick={() => setToasts((all) => all.filter((x) => x.id !== t.id))}
              >
                <X className="size-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
