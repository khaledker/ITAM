import React, { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  className?: string
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ isOpen, onToggle, children, className }, ref) => (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        ref={ref}
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r border-neutral-300 transition-transform duration-300 ease-in-out md:static md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-0',
          className
        )}
      >
        {children}
      </aside>

      {/* Sidebar toggle button for mobile */}
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 z-50 md:hidden rounded-lg bg-primary p-2 text-white shadow-xl"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
    </>
  )
)
Sidebar.displayName = 'Sidebar'

export interface HeaderProps {
  title?: string
  children?: React.ReactNode
  className?: string
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(
  ({ title, children, className }, ref) => (
    <header
      ref={ref}
      className={cn(
        'border-b border-neutral-300 bg-white px-4 py-3 sm:px-6',
        className
      )}
    >
      <div className="flex items-center justify-between">
        {title && (
          <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        )}
        {children}
      </div>
    </header>
  )
)
Header.displayName = 'Header'

export interface BreadcrumbsProps {
  items: Array<{
    label: string
    href?: string
    onClick?: () => void
    active?: boolean
  }>
  className?: string
}

const Breadcrumbs = React.forwardRef<HTMLDivElement, BreadcrumbsProps>(
  ({ items, className }, ref) => (
    <nav
      ref={ref}
      className={cn('flex items-center gap-2 text-sm', className)}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-neutral-600">/</span>}
          {item.href ? (
            <a
              href={item.href}
              className="text-primary hover:underline"
            >
              {item.label}
            </a>
          ) : item.onClick ? (
            <button
              onClick={item.onClick}
              className="text-primary hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span
              className={item.active ? 'font-medium text-neutral-900' : 'text-neutral-600'}
            >
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
)
Breadcrumbs.displayName = 'Breadcrumbs'

export interface AppShellProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
  header?: React.ReactNode
  contentClassName?: string
}

const AppShell = ({ children, sidebar, header, contentClassName }: AppShellProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-neutral-50">
      {sidebar && (
        <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)}>
          {sidebar}
        </Sidebar>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        {header && <Header>{header}</Header>}

        <main
          className={cn(
            'flex-1 overflow-auto',
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

export { Sidebar, Header, Breadcrumbs, AppShell }
