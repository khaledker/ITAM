import React from 'react'
import { cn } from '@/utils/cn'

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  indeterminate?: boolean
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate, ...props }, ref) => {
    const checkboxRef = React.useRef<HTMLInputElement>(null)

    React.useImperativeHandle(ref, () => checkboxRef.current as HTMLInputElement)

    React.useEffect(() => {
      if (checkboxRef.current) {
        checkboxRef.current.indeterminate = indeterminate || false
      }
    }, [indeterminate])

    return (
      <input
        type="checkbox"
        className={cn(
          'h-5 w-5 rounded border border-neutral-300 bg-white cursor-pointer accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-neutral-100',
          className
        )}
        ref={checkboxRef}
        {...props}
      />
    )
  }
)
Checkbox.displayName = 'Checkbox'

export { Checkbox }
