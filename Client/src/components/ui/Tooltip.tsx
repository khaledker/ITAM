import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/utils/cn'

export interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayMs?: number
}

const sideClasses = {
  top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
  right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
  left: 'right-full mr-2 top-1/2 -translate-y-1/2',
}

const arrowClasses = {
  top: 'top-full border-t-neutral-800 border-l-transparent border-r-transparent',
  right: 'right-full border-r-neutral-800 border-t-transparent border-b-transparent',
  bottom: 'bottom-full border-b-neutral-800 border-l-transparent border-r-transparent',
  left: 'left-full border-l-neutral-800 border-t-transparent border-b-transparent',
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  ({ content, children, side = 'top', delayMs = 200 }, ref) => {
    const [isVisible, setIsVisible] = useState(false)
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const handleMouseEnter = () => {
      timeoutRef.current = setTimeout(() => setIsVisible(true), delayMs)
    }

    const handleMouseLeave = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      setIsVisible(false)
    }

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    }, [])

    return (
      <div
        ref={ref}
        className="relative inline-block"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}

        {isVisible && (
          <div
            className={cn(
              'absolute z-50 rounded-lg bg-neutral-800 px-3 py-2 text-sm text-white shadow-xl whitespace-nowrap',
              sideClasses[side]
            )}
          >
            {content}
            <div
              className={cn(
                'absolute h-2 w-2 border-2',
                arrowClasses[side]
              )}
            />
          </div>
        )}
      </div>
    )
  }
)
Tooltip.displayName = 'Tooltip'

export { Tooltip }
