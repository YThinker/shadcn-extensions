import type { ComponentProps } from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shadcn/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-full px-0.5 text-xs font-normal leading-none w-fit min-h-1 whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-danger/20 dark:aria-invalid:ring-danger/40 aria-invalid:border-danger transition-all overflow-hidden',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const badgePositionVariants = cva('', {
  variants: {
    position: {
      'top-left': 'absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2',
      'top-right': 'absolute right-0 top-0 -translate-y-1/2 translate-x-1/2',
      'bottom-right':
        'absolute right-0 bottom-0 translate-y-1/2 translate-x-1/2',
      'bottom-left': 'absolute left-0 bottom-0 translate-y-1/2 -translate-x-1/2'
    }
  }
});

function Badge({
  className,
  variant,
  asChild = false,
  position,
  children,
  ...props
}: ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> &
  VariantProps<typeof badgePositionVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot='badge'
      className={cn(
        badgeVariants({ variant }),
        badgePositionVariants({ position }),
        !children && 'size-2',
        className
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}

function BadgeWrapper({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('relative inline-block', className)} {...props} />;
}

export { Badge, BadgeWrapper, badgeVariants };
