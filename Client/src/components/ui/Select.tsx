import React from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown } from 'lucide-react'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, ...props }, ref) => (
    <div className="relative inline-flex w-full mt-1">
      <select
        className={cn(
          'block h-[30px] w-full appearance-none rounded-sm border border-neutral-400 bg-[#fbfbfb] px-3 py-1 pr-8 text-sm md:text-sm text-neutral-900 shadow-none transition-colors hover:border-neutral-600 focus:bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500',
          className
        )}
        ref={ref}
        {...props}
      />
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 transform text-neutral-600" />
    </div>
  )
)
Select.displayName = 'Select'

export { Select }
