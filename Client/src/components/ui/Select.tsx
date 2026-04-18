import React from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown } from 'lucide-react'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <div className="relative inline-flex w-full mt-1.5">
      <select
        className={cn(
          'flex h-11 w-full appearance-none rounded-lg border border-neutral-300 bg-white px-4 py-2 pr-10 text-base transition-all duration-200 hover:border-neutral-400 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500',
          className
        )}
        ref={ref}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-neutral-500" />
    </div>
  )
)
Select.displayName = 'Select'

export { Select }
