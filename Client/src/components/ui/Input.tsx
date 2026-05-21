import React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'block h-[30px] w-full rounded-sm border border-neutral-400 bg-[#fbfbfb] px-3 py-1 text-sm text-neutral-900 shadow-none transition-colors mt-1 placeholder:text-neutral-400 hover:border-neutral-600 focus-visible:outline-none focus-visible:border-primary focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
