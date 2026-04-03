import React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type AlertVariant = 'info' | 'success' | 'warning' | 'error'

export interface AlertProps {
  variant?: AlertVariant
  title?: string
  message: string
  onClose?: () => void
  closeable?: boolean
  className?: string
}

const variantClasses = {
  info: {
    container: 'bg-info-light border-info border-l-4',
    icon: 'text-info',
  },
  success: {
    container: 'bg-success-light border-success border-l-4',
    icon: 'text-success',
  },
  warning: {
    container: 'bg-warning-light border-warning border-l-4',
    icon: 'text-warning',
  },
  error: {
    container: 'bg-error-light border-error border-l-4',
    icon: 'text-error',
  },
}

const iconMap = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      message,
      onClose,
      closeable = true,
      className,
    },
    ref
  ) => {
    const { container, icon } = variantClasses[variant]

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-start gap-3 rounded-lg border px-4 py-3',
          container,
          className
        )}
        role="alert"
      >
        <div className={cn('flex-shrink-0 mt-0.5', icon)}>
          {iconMap[variant]}
        </div>
        <div className="flex-1 min-w-0">
          {title && <h4 className="font-semibold text-neutral-900">{title}</h4>}
          <p className={cn('text-sm text-neutral-700', title && 'mt-1')}>
            {message}
          </p>
        </div>
        {closeable && (
          <button
            onClick={onClose}
            className="flex-shrink-0 text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }
)
Alert.displayName = 'Alert'

export { Alert }
