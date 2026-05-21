import React from 'react'
import { CVA, type VariantProps } from '@/utils/variants'
import { cn } from '@/utils/cn'

const buttonVariants = CVA(
  'inline-flex items-center justify-center whitespace-nowrap font-semibold rounded-sm border transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary border-primary text-white hover:bg-primary-800 active:bg-primary-900',
        secondary: 'bg-neutral-200 border-neutral-300 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400',
        ghost: 'border-transparent text-neutral-700 hover:bg-neutral-200 hover:border-neutral-300 active:bg-neutral-300',
        destructive: 'bg-error border-error-700 text-white hover:bg-red-600 active:bg-red-700',
      },
      size: {
        sm: 'h-7 px-3 text-xs gap-1',
        md: 'h-8 px-4 text-sm gap-2',
        lg: 'h-10 px-5 text-base gap-2',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
)
Button.displayName = 'Button'

export { Button, buttonVariants }
