import React from 'react'
import { cn } from '@/utils/cn'

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement> {
  count?: number
  circle?: boolean
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, count = 1, circle = false, ...props }, ref) => {
    const items = Array.from({ length: count })

    if (count === 1) {
      return (
        <div
          ref={ref}
          className={cn(
            'bg-neutral-200 animate-pulse',
            circle ? 'rounded-full' : 'rounded-lg',
            !circle && 'h-4 w-full',
            circle && 'h-10 w-10',
            className
          )}
          {...props}
        />
      )
    }

    return (
      <div className="space-y-2">
        {items.map((_, i) => (
          <div
            key={i}
            ref={i === 0 ? ref : undefined}
            className={cn(
              'bg-neutral-200 animate-pulse rounded-lg h-4 w-full',
              className
            )}
          />
        ))}
      </div>
    )
  }
)
Skeleton.displayName = 'Skeleton'

export { Skeleton }
