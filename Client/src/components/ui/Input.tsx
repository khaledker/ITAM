import React from 'react'
import { cn } from '@/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex w-full rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-base transition-all duration-200 mt-1.5 placeholder:text-neutral-500 hover:border-neutral-400 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = 'Input'

export { Input }
