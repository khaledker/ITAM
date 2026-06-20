import React, { useState, useRef, useEffect, useMemo } from 'react'
import { cn } from '@/utils/cn'
import { ChevronDown } from 'lucide-react'

export interface ComboboxOption {
  value: string | number
  label: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value: string | number
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  required?: boolean
  disabled?: boolean
}

const Combobox = React.forwardRef<HTMLDivElement, ComboboxProps>(
  ({ options, value, onChange, placeholder = 'Select...', className, required, disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selectedLabel = useMemo(() => {
      const opt = options.find(o => String(o.value) === String(value))
      return opt ? opt.label : ''
    }, [options, value])

    const filteredOptions = useMemo(() => {
      if (!search.trim()) return options
      const q = search.toLowerCase()
      return options.filter(o => o.label.toLowerCase().includes(q))
    }, [options, search])

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleToggle = () => {
      if (disabled) return
      setIsOpen(prev => !prev)
      setSearch('')
      setHighlightedIndex(-1)
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 0)
      }
    }

    const handleSelect = (opt: ComboboxOption) => {
      onChange(String(opt.value))
      setIsOpen(false)
      setSearch('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'ArrowDown' || e.key === 'Enter') {
          setIsOpen(true)
          setHighlightedIndex(-1)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex(prev => (prev > 0 ? prev - 1 : -1))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            handleSelect(filteredOptions[highlightedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSearch('')
          break
      }
    }

    return (
      <div ref={containerRef} className={cn('relative inline-flex w-full mt-1', className)}>
        <div
          className={cn(
            'flex h-[30px] w-full items-center rounded-sm border bg-[#fbfbfb] px-3 text-sm transition-colors cursor-pointer',
            'hover:border-neutral-600',
            isOpen ? 'border-primary ring-1 ring-primary bg-white' : 'border-neutral-400',
            disabled && 'cursor-not-allowed bg-neutral-200 text-neutral-600'
          )}
          onClick={handleToggle}
        >
          {isOpen ? (
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setHighlightedIndex(-1) }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full bg-transparent outline-none text-sm text-neutral-900 placeholder:text-neutral-600"
              disabled={disabled}
              required={required}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className={cn('flex-1 truncate', value ? 'text-neutral-900' : 'text-neutral-600')}>
              {selectedLabel || placeholder}
            </span>
          )}
          <ChevronDown className={cn('h-3.5 w-3.5 text-neutral-600 transition-transform', isOpen && 'rotate-180')} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-sm border border-neutral-300 bg-white shadow-lg">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-neutral-600">No results found</div>
            ) : (
              filteredOptions.map((opt, idx) => (
                <div
                  key={opt.value}
                  className={cn(
                    'px-3 py-1.5 text-sm cursor-pointer transition-colors',
                    String(opt.value) === String(value) && 'bg-primary/10 font-semibold text-primary',
                    idx === highlightedIndex && 'bg-neutral-100'
                  )}
                  onClick={() => handleSelect(opt)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  {opt.label}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )
  }
)
Combobox.displayName = 'Combobox'

export { Combobox }
