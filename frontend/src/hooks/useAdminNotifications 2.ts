import { useState, useCallback } from 'react'

export interface AdminNotification {
  id: string
  type: 'info' | 'warning' | 'success' | 'error'
  title: string
  message: string
  timestamp: number
  read: boolean
  action?: {
    label: string
    onClick: () => void
  }
}

export function useAdminNotifications() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([])

  const addNotification = useCallback(
    (notification: Omit<AdminNotification, 'id' | 'timestamp' | 'read'>) => {
      const id = `notif-${Date.now()}`
      const newNotification: AdminNotification = {
        ...notification,
        id,
        timestamp: Date.now(),
        read: false,
      }
      setNotifications(prev => [newNotification, ...prev])

      // Auto-remove after 10 seconds for non-error notifications
      if (notification.type !== 'error') {
        setTimeout(() => {
          removeNotification(id)
        }, 10000)
      }

      return id
    },
    []
  )

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  return {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    unreadCount,
  }
}
