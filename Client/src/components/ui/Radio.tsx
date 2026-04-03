import React from 'react'
import { cn } from '@/utils/cn'

export interface RadioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, ...props }, ref) => (
    <input
      type="radio"
      className={cn(
        'h-5 w-5 border border-neutral-300 bg-white cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-100',
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Radio.displayName = 'Radio'

export { Radio }
