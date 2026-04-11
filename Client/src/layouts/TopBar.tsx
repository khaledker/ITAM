import React from 'react'
import { Bell, LogOut, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'

export interface UserAvatarProps {
  initials: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  className?: string
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

const UserAvatar = React.forwardRef<HTMLButtonElement, UserAvatarProps>(
  ({ initials, name, size = 'md', onClick, className }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-primary text-white font-semibold transition-opacity hover:opacity-90',
        sizeClasses[size],
        className
      )}
      title={name}
    >
      {initials}
    </button>
  )
)
UserAvatar.displayName = 'UserAvatar'

export interface NotificationBellProps {
  count?: number
  onClick?: () => void
  className?: string
}

const NotificationBell = React.forwardRef<HTMLButtonElement, NotificationBellProps>(
  ({ count, onClick, className }, ref) => (
    <button
      ref={ref}
      onClick={onClick}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        className
      )}
      aria-label="Notifications"
    >
      <Bell className="h-5 w-5" strokeWidth={2} />
      {count !== undefined && count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  )
)
NotificationBell.displayName = 'NotificationBell'

export interface TopBarProps {
  userName?: string
  userInitials?: string
  notificationCount?: number
  onUserClick?: () => void
  onNotificationClick?: () => void
  onSettingsClick?: () => void
  onLogout?: () => void
  children?: React.ReactNode
  className?: string
}

const TopBar = React.forwardRef<HTMLDivElement, TopBarProps>(
  (
    {
      userName,
      userInitials = 'U',
      notificationCount,
      onUserClick,
      onNotificationClick,
      onSettingsClick,
      onLogout,
      children,
      className,
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3 sm:px-6',
        className
      )}
    >
      <div>{children}</div>

      <div className="flex items-center gap-2 sm:gap-4">
        <NotificationBell
          count={notificationCount}
          onClick={onNotificationClick}
        />

        <button
          onClick={onSettingsClick}
          className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="h-6 w-px bg-neutral-200" />

        <div className="flex items-center gap-2">
          <UserAvatar
            initials={userInitials}
            name={userName}
            size="sm"
            onClick={onUserClick}
          />
          {userName && (
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-neutral-900">{userName}</p>
            </div>
          )}
        </div>

        {onLogout && (
          <button
            onClick={onLogout}
            className="rounded-lg p-2 text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
)
TopBar.displayName = 'TopBar'

export { UserAvatar, NotificationBell, TopBar }
