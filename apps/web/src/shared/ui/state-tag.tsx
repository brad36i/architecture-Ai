'use client';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/lib/utils';

const stateTagVariants = cva(
  'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0',
  {
    variants: {
      variant: {
        blue: 'bg-state-muted-blue text-state-blue',
        green: 'bg-state-muted-green text-state-green',
        yellow: 'bg-state-muted-yellow text-state-yellow',
        red: 'bg-state-muted-red text-state-red',
        darkgray: 'bg-state-muted-darkgray text-state-darkgray',
      },
      bordered: {
        true: 'border',
        false: 'border-0',
      },
    },
    compoundVariants: [
      { variant: 'blue', bordered: true, class: 'border-state-blue' },
      { variant: 'green', bordered: true, class: 'border-state-green' },
      { variant: 'yellow', bordered: true, class: 'border-state-yellow' },
      { variant: 'red', bordered: true, class: 'border-state-red' },
      { variant: 'darkgray', bordered: true, class: 'border-state-darkgray' },
    ],
    defaultVariants: {
      variant: 'blue',
      bordered: false,
    },
  }
);

interface StateTagProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof stateTagVariants> {}

export function StateTag({
  className,
  variant = 'blue',
  bordered = false,
  ...props
}: StateTagProps) {
  return (
    <span
      data-slot='state-tag'
      data-variant={variant}
      data-bordered={bordered}
      className={cn(stateTagVariants({ variant, bordered }), className)}
      {...props}
    />
  );
}
