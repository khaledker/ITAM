import React from 'react'
import { cn } from '@/utils/cn'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ icon, title, description, action, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border-2 border-dashed border-neutral-200 bg-neutral-50 px-6 py-12 text-center',
        className
      )}
    >
      {icon && (
        <div className="mx-auto mb-4 inline-flex rounded-full bg-neutral-100 p-3">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-800 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
)
EmptyState.displayName = 'EmptyState'

export { EmptyState }
