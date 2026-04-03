import React from 'react'
import { CVA, type VariantProps } from '@/utils/variants'
import { cn } from '@/utils/cn'

const badgeVariants = CVA(
  'inline-flex items-center rounded-full font-semibold text-xs gap-1.5 px-2.5 py-1',
  {
    variants: {
      variant: {  
        active: 'bg-success bg-opacity-10 text-success border border-success border-opacity-30',
        inactive: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
        warning: 'bg-warning bg-opacity-10 text-warning border border-warning border-opacity-30',
        critical: 'bg-error bg-opacity-10 text-error border border-error border-opacity-30',
        maintenance: 'bg-maintenance bg-opacity-10 text-maintenance border border-maintenance border-opacity-30',
      },
    },
    defaultVariants: {
      variant: 'inactive',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      className={cn(badgeVariants({ variant, className }))}
      ref={ref}
      {...props}
    />
  )
)
Badge.displayName = 'Badge'

export { Badge, badgeVariants }
