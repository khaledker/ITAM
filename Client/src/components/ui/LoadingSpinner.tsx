import React from 'react'
import { cn } from '@/utils/cn'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-3',
  lg: 'h-8 w-8 border-4',
}

const LoadingSpinner = React.forwardRef<HTMLDivElement, LoadingSpinnerProps>(
  ({ size = 'md', className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-spin rounded-full border border-transparent border-t-primary',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
)
LoadingSpinner.displayName = 'LoadingSpinner'

export { LoadingSpinner }
