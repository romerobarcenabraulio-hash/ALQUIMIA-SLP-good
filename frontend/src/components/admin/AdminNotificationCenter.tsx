'use client'

import { useState } from 'react'
import { X, Bell, CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AdminNotification } from '@/hooks/useAdminNotifications'

interface AdminNotificationCenterProps {
  notifications: AdminNotification[]
  unreadCount: number
  onRemove: (id: string) => void
  onMarkAsRead: (id: string) => void
  onMarkAllAsRead: () => void
  className?: string
}

const NOTIFICATION_COLORS: Record<AdminNotification['type'], { bg: string; icon: string; text: string }> = {
  success: { bg: 'bg-green-50 border-green-200', icon: '✓', text: 'text-green-700' },
  error: { bg: 'bg-red-50 border-red-200', icon: '✕', text: 'text-red-700' },
  warning: { bg: 'bg-yellow-50 border-yellow-200', icon: '⚠', text: 'text-yellow-700' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: 'ℹ', text: 'text-blue-700' },
}

export function AdminNotificationCenter({
  notifications,
  unreadCount,
  onRemove,
  onMarkAsRead,
  onMarkAllAsRead,
  className,
}: AdminNotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className={cn('relative', className)}>
      {/* Bell Icon */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg border border-[#E8E4DC] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg border border-[#E8E4DC] shadow-xl z-50 max-h-96 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E8E4DC] p-4">
            <h3 className="font-semibold text-[#1C1B18]">Notificaciones</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllAsRead}
                  className="text-xs text-[#3B6D11] hover:text-[#2D5209] font-medium"
                >
                  Marcar como leído
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-[#F4F2ED] rounded transition-colors"
              >
                <X className="h-4 w-4 text-[#8E8980]" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto space-y-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-[#6B6760]">No hay notificaciones</div>
            ) : (
              notifications.map(notif => {
                const colors = NOTIFICATION_COLORS[notif.type]
                return (
                  <div
                    key={notif.id}
                    onClick={() => !notif.read && onMarkAsRead(notif.id)}
                    className={cn(
                      'border-b border-[#E8E4DC] p-3 cursor-pointer transition-colors hover:bg-[#FDFCFA]',
                      !notif.read && 'bg-blue-50'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1C1B18] text-sm">{notif.title}</p>
                        <p className="text-xs text-[#6B6760] mt-0.5">{notif.message}</p>
                        <p className="text-xs text-[#8E8980] mt-1">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </p>
                        {notif.action && (
                          <button
                            onClick={e => {
                              e.stopPropagation()
                              notif.action?.onClick()
                            }}
                            className="text-xs text-[#3B6D11] hover:text-[#2D5209] font-medium mt-2"
                          >
                            {notif.action.label}
                          </button>
                        )}
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          onRemove(notif.id)
                        }}
                        className="flex-shrink-0 p-1 text-[#8E8980] hover:text-red-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
