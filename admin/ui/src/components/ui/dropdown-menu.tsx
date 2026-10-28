import * as Menu from '@radix-ui/react-dropdown-menu';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../../lib/cn';

/**
 * Radix DropdownMenu dengan modal={false}: mode modal memakai react-remove-scroll yang menyuntikkan <style>
 * (diblokir CSP). Navigasi keyboard, fokus, dan peran menu tetap dari Radix.
 */
export function DropdownMenu({ trigger, children, align = 'end', label }: { trigger: ReactNode; children: ReactNode; align?: 'start' | 'end'; label?: string }) {
  return (
    <Menu.Root modal={false}>
      <Menu.Trigger asChild>{trigger}</Menu.Trigger>
      <Menu.Portal>
        <Menu.Content
          align={align}
          sideOffset={6}
          aria-label={label}
          className="z-50 min-w-48 rounded-lg border bg-popover p-1 text-sm text-foreground shadow-[var(--shadow-overlay)]"
        >
          {children}
        </Menu.Content>
      </Menu.Portal>
    </Menu.Root>
  );
}

export function DropdownMenuItem({ className, destructive, ...props }: ComponentPropsWithoutRef<typeof Menu.Item> & { destructive?: boolean }) {
  return (
    <Menu.Item
      className={cn(
        'flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-md px-2.5 py-1.5 outline-none max-md:min-h-11 [&_svg]:size-4 [&_svg]:text-muted-foreground',
        'data-[highlighted]:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        destructive && 'text-destructive [&_svg]:text-destructive data-[highlighted]:bg-destructive-soft',
        className,
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: ComponentPropsWithoutRef<typeof Menu.Label>) {
  return <Menu.Label className={cn('px-2.5 py-1.5 text-xs text-muted-foreground', className)} {...props} />;
}

export function DropdownMenuSeparator() {
  return <Menu.Separator className="-mx-1 my-1 h-px bg-border" />;
}

export const DropdownMenuRadioGroup = Menu.RadioGroup;

export function DropdownMenuRadioItem({ className, children, ...props }: ComponentPropsWithoutRef<typeof Menu.RadioItem>) {
  return (
    <Menu.RadioItem
      className={cn(
        'flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-md py-1.5 pr-2.5 pl-8 outline-none relative max-md:min-h-11 [&_svg]:size-4',
        'data-[highlighted]:bg-accent',
        className,
      )}
      {...props}
    >
      <span className="absolute left-2.5 grid size-4 place-items-center">
        <Menu.ItemIndicator>
          <span className="block size-1.5 rounded-full bg-foreground" />
        </Menu.ItemIndicator>
      </span>
      {children}
    </Menu.RadioItem>
  );
}
