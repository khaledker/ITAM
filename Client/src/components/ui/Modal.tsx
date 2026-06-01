import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children?: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  closeButton?: boolean
}

const sizeClasses = {
  sm: 'max-w-[24rem]',
  md: 'max-w-[28rem]',
  lg: 'max-w-[32rem]',
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      isOpen,
      onClose,
      title,
      description,
      children,
      footer,
      size = 'md',
      closeButton = true,
    },
    ref
  ) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose()
      }

      if (isOpen) {
        document.addEventListener('keydown', handleEscape)
        document.body.style.overflow = 'hidden'
        return () => {
          document.removeEventListener('keydown', handleEscape)
          document.body.style.overflow = 'unset'
        }
      }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div
          ref={ref}
          className="fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 transform"
        >
          <div
            className={cn(
              'mx-auto w-full rounded-lg bg-white shadow-xl',
              sizeClasses[size]
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(title || closeButton) && (
              <div className="flex items-start justify-between border-b border-neutral-300 px-6 py-4">
                <div>
                  {title && (
                    <h2 className="text-lg font-semibold text-neutral-900">
                      {title}
                    </h2>
                  )}
                  {description && (
                    <p className="mt-1 text-sm text-neutral-600">{description}</p>
                  )}
                </div>
                {closeButton && (
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {/* Content */}
            <div className="px-6 py-4">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="border-t border-neutral-300 px-6 py-4">
                {footer}
              </div>
            )}
          </div>
        </div>
      </>
    )
  }
)
Modal.displayName = 'Modal'

export interface ConfirmModalProps extends Omit<ModalProps, 'children'> {
  onConfirm: () => void
  onCancel?: () => void
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
}

const ConfirmModal = React.forwardRef<HTMLDivElement, ConfirmModalProps>(
  (
    {
      onConfirm,
      onCancel,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      isDangerous = false,
      onClose,
      ...props
    },
    ref
  ) => {
    return (
      <Modal
        ref={ref}
        {...props}
        onClose={() => {
          onCancel?.()
          onClose()
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                onCancel?.()
                onClose()
              }}
            >
              {cancelText}
            </Button>
            <Button
              variant={isDangerous ? 'destructive' : 'primary'}
              onClick={() => {
                onConfirm()
                onClose()
              }}
            >
              {confirmText}
            </Button>
          </div>
        }
      />
    )
  }
)
ConfirmModal.displayName = 'ConfirmModal'

export interface FormModalProps extends Omit<ModalProps, 'children'> {
  onSubmit: (formData: FormData) => void | Promise<void>
  onCancel?: () => void
  submitText?: string
  cancelText?: string
  children: React.ReactNode
  isSubmitting?: boolean
}

const FormModal = React.forwardRef<HTMLDivElement, FormModalProps>(
  (
    {
      onSubmit,
      onCancel,
      submitText = 'Submit',
      cancelText = 'Cancel',
      onClose,
      isSubmitting = false,
      children,
      ...props
    },
    ref
  ) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      onSubmit(formData)
    }

    return (
      <Modal
        ref={ref}
        {...props}
        onClose={() => {
          onCancel?.()
          onClose()
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {children}
          <div className="flex justify-end gap-2 border-t border-neutral-300 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onCancel?.()
                onClose()
              }}
              disabled={isSubmitting}
            >
              {cancelText}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : submitText}
            </Button>
          </div>
        </form>
      </Modal>
    )
  }
)
FormModal.displayName = 'FormModal'

export { Modal, ConfirmModal, FormModal }
