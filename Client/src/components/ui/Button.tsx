import React from 'react'
import { CVA, type VariantProps } from '@/utils/variants'
import { cn } from '@/utils/cn'

const buttonVariants = CVA(
  'inline-flex items-center justify-center whitespace-nowrap font-medium rounded-lg transition-colors duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-800 active:bg-primary-900',
        secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:bg-neutral-400',
        ghost: 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
        destructive: 'bg-error text-white hover:bg-red-600 active:bg-red-700',
      },
      size: {
        sm: 'h-8 px-3 text-sm gap-1',
        md: 'h-10 px-4 text-base gap-2',
        lg: 'h-12 px-6 text-lg gap-2',
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
