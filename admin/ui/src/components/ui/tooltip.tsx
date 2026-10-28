import * as T from '@radix-ui/react-tooltip';
import type { ReactNode } from 'react';

export const TooltipProvider = ({ children }: { children: ReactNode }) => (
  <T.Provider delayDuration={300} skipDelayDuration={100}>
    {children}
  </T.Provider>
);

/** Petunjuk untuk tombol ikon. Tombolnya sendiri tetap wajib punya aria-label. */
export function Tooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <T.Root>
      <T.Trigger asChild>{children}</T.Trigger>
      <T.Portal>
        <T.Content
          sideOffset={6}
          className="z-50 rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background shadow-[var(--shadow-overlay)]"
        >
          {content}
        </T.Content>
      </T.Portal>
    </T.Root>
  );
}
