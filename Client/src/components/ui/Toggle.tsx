import React from 'react'
import { cn } from '@/utils/cn'

export interface ToggleProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className, ...props }, ref) => (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className={cn(
          'sr-only peer',
          className
        )}
        ref={ref}
        {...props}
      />
      <div className="relative w-11 h-6 bg-neutral-300 peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
    </label>
  )
)
Toggle.displayName = 'Toggle'

export { Toggle }
