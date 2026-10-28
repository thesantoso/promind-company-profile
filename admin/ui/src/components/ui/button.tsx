import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors duration-150 ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 ' +
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        destructive: 'bg-destructive text-white hover:bg-destructive-hover dark:text-[#1a0b0b]',
        outline: 'border border-input bg-card text-foreground hover:bg-accent',
        secondary: 'bg-muted text-foreground hover:bg-accent',
        ghost: 'text-foreground hover:bg-accent',
        'ghost-destructive': 'text-destructive hover:bg-destructive-soft',
        link: 'h-auto px-0 text-link underline underline-offset-4 hover:text-link-hover',
      },
      size: {
        default: 'h-10 px-4 max-md:min-h-11',
        sm: 'h-9 px-3 max-md:min-h-11',
        lg: 'h-11 px-6',
        icon: 'size-10 max-md:size-11',
        'icon-sm': 'size-9 max-md:size-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, type, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...(asChild ? {} : { type: type ?? 'button' })} {...props} />;
});
Button.displayName = 'Button';
