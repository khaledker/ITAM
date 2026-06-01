import React, { useCallback, useRef } from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

export interface Toast {
  id: string
  variant?: ToastVariant
  title?: string
  message: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export interface ToastProviderProps {
  children: React.ReactNode
}

export const ToastProvider = ({ children }: ToastProviderProps) => {
  const [toasts, setToasts] = React.useState<Toast[]>([])
  const idCounterRef = useRef(0)

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = String(idCounterRef.current++)
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration || 4000,
    }

    setToasts((prev) => [...prev, newToast])

    if (newToast.duration) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const clearToasts = useCallback(() => {
    setToasts([])
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

interface ToastItemProps {
  toast: Toast
  onRemove: (id: string) => void
}

const variantClasses = {
  info: 'bg-info border-info text-white',
  success: 'bg-success border-success text-white',
  warning: 'bg-warning border-warning text-white',
  error: 'bg-error border-error text-white',
}

const iconMap = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  warning: <AlertTriangle className="h-5 w-5" />,
  error: <AlertCircle className="h-5 w-5" />,
}

const ToastItem = ({ toast, onRemove }: ToastItemProps) => {
  const variant = toast.variant || 'info'
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 shadow-xl animate-in slide-in-from-right-full duration-300',
        variantClasses[variant]
      )}
    >
      <div className="flex-shrink-0 mt-0.5">{iconMap[variant]}</div>
      <div className="flex-1 min-w-0">
        {toast.title && <h4 className="font-semibold">{toast.title}</h4>}
        <p className={cn('text-sm', toast.title && 'mt-1')}>{toast.message}</p>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 hover:opacity-80 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onRemove: (id: string) => void
}

const ToastContainer = ({ toasts, onRemove }: ToastContainerProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  )
}
