import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  loading?: boolean
  className?: string
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(
  ({ label, value, icon, trend, loading = false, className }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-lg border border-neutral-200 bg-white p-4 sm:p-6',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600">{label}</p>
          {loading ? (
            <div className="mt-2 h-8 w-24 bg-neutral-200 rounded animate-pulse" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold text-neutral-900">
                {value}
              </p>
              {trend && (
                <div
                  className={cn(
                    'inline-flex items-center gap-1 text-sm font-medium',
                    trend.direction === 'up'
                      ? 'text-success'
                      : 'text-error'
                  )}
                >
                  {trend.value}%
                  {trend.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0">
            <div className="inline-flex rounded-lg bg-primary bg-primary/10 p-3">
              {icon}
            </div>
          </div>
        )}
      </div>
    </div>
  )
)
StatCard.displayName = 'StatCard'

export { StatCard }
