'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, X, CheckCheck, Trash2, Loader2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

interface Notification {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  icon?: string
  color?: string
  action_url?: string
  action_label?: string
  metadata: Record<string, any>
  leido: boolean
  descartado: boolean
  created_at: string
}

interface ListResponse {
  total: number
  unread: number
  items: Notification[]
}

const TIPO_CFG: Record<string, { icon: string; color: string; bg: string }> = {
  gate_approval:    { icon: '⚪', color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]' },
  data_stale:       { icon: '⚠️',  color: 'text-[#D4881E]', bg: 'bg-[#FEF7E7]' },
  new_iniciativa:   { icon: '📖', color: 'text-[#1A5FA8]', bg: 'bg-[#E8F0FB]' },
  stage_transition: { icon: '🚀', color: 'text-[#5B21B6]', bg: 'bg-[#F3EDFB]' },
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const loadNotifications = () => {
    setLoading(true)
    fetch(`${getApiUrl()}/api/v1/notifications?limit=10`, { headers: authHdr() })
      .then(r => r.json())
      .then((d: ListResponse) => {
        setNotifications(d.items)
        setUnreadCount(d.unread)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!open) return
    loadNotifications()
    const timer = setInterval(loadNotifications, 30000) // Refresh every 30s
    return () => clearInterval(timer)
  }, [open])

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handle)
      return () => document.removeEventListener('mousedown', handle)
    }
  }, [open])

  async function markAsRead(id: string) {
    await fetch(`${getApiUrl()}/api/v1/notifications/${id}/leido`, {
      method: 'PATCH',
      headers: authHdr(),
    })
    loadNotifications()
  }

  async function dismiss(id: string) {
    await fetch(`${getApiUrl()}/api/v1/notifications/${id}/descartado`, {
      method: 'PATCH',
      headers: authHdr(),
    })
    loadNotifications()
  }

  const cfg = TIPO_CFG[notifications[0]?.tipo] || { icon: '📬', color: 'text-[#6B6760]', bg: 'bg-[#F0EDE5]' }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="relative flex h-8 w-8 items-center justify-center rounded-[8px] text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-[#C0392B] text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-10 z-50 w-[360px] rounded-[12px] border border-[#E8E4DC] bg-white shadow-lg overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-[#F0EDE5] px-4 py-3">
            <h3 className="text-[13px] font-semibold text-[#1C1B18]">Notificaciones</h3>
            <button
              onClick={() => setOpen(false)}
              className="text-[#A8A49C] hover:text-[#1C1B18]"
            >
              <X size={16} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={16} className="animate-spin text-[#A8A49C]" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell size={20} className="mx-auto mb-2 text-[#A8A49C]" />
                <p className="text-[11px] text-[#8E8980]">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => {
                const typeCfg = TIPO_CFG[n.tipo] || { icon: '📬', color: 'text-[#6B6760]', bg: 'bg-[#F0EDE5]' }
                return (
                  <div
                    key={n.id}
                    className={`border-b border-[#F0EDE5] p-3 last:border-0 transition-colors ${
                      n.leido ? 'bg-white' : 'bg-[#FAFAF8]'
                    }`}
                  >
                    <div className="flex gap-2">
                      {/* Icon */}
                      <div className={`mt-0.5 shrink-0 text-[16px] ${typeCfg.color}`}>
                        {typeCfg.icon}
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-[#1C1B18] leading-tight">
                          {n.titulo}
                        </p>
                        <p className="mt-0.5 text-[11px] text-[#6B6760] leading-snug">
                          {n.descripcion}
                        </p>
                        <p className="mt-1 text-[10px] text-[#A8A49C]">
                          {new Date(n.created_at).toLocaleString('es-MX')}
                        </p>

                        {/* Actions */}
                        <div className="mt-2 flex flex-wrap gap-1">
                          {n.action_url && (
                            <a
                              href={n.action_url}
                              onClick={() => setOpen(false)}
                              className="inline-flex items-center gap-1 rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1 text-[10px] text-[#3B6D11] hover:border-[#3B6D11] hover:bg-[#EAF3DE] transition-colors"
                            >
                              {n.action_label || 'Ver'}
                            </a>
                          )}
                          {!n.leido && (
                            <button
                              onClick={() => markAsRead(n.id)}
                              className="inline-flex items-center gap-1 rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1 text-[10px] text-[#6B6760] hover:border-[#3B6D11] transition-colors"
                            >
                              <CheckCheck size={10} />
                              Marcar leído
                            </button>
                          )}
                          <button
                            onClick={() => dismiss(n.id)}
                            className="inline-flex items-center gap-1 rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1 text-[10px] text-[#A8A49C] hover:border-[#C0392B] hover:text-[#C0392B] transition-colors"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-[#F0EDE5] px-4 py-2">
              <a
                href="/notifications"
                className="text-[11px] font-semibold text-[#3B6D11] hover:text-[#2D5409]"
                onClick={() => setOpen(false)}
              >
                Ver todas →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
