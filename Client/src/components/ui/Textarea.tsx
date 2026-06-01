import React from 'react'
import { cn } from '@/utils/cn'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        'block min-h-[50px] w-full rounded-sm border border-neutral-400 bg-[#fbfbfb] px-3 py-1.5 text-sm text-neutral-900 shadow-none transition-colors mt-1 placeholder:text-neutral-600 hover:border-neutral-600 focus-visible:outline-none focus-visible:border-primary focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-600 resize-y',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Textarea.displayName = 'Textarea'

export { Textarea }
