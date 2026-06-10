'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCheck, Trash2, Loader2, Filter, Settings } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'
import { useAlquimiaToken } from '@/lib/useAlquimiaToken'

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

interface Preferences {
  gate_approvals: boolean
  data_staleness: boolean
  new_initiatives: boolean
  stage_transitions: boolean
}

const TIPO_CFG: Record<string, { label: string; icon: string; color: string; bg: string }> = {
  gate_approval:    { label: 'Puerta',            icon: '⚪', color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]' },
  data_stale:       { label: 'Datos desactualizados', icon: '⚠️',  color: 'text-[#D4881E]', bg: 'bg-[#FEF7E7]' },
  new_iniciativa:   { label: 'Nueva iniciativa',  icon: '📖', color: 'text-[#1A5FA8]', bg: 'bg-[#E8F0FB]' },
  stage_transition: { label: 'Etapa',             icon: '🚀', color: 'text-[#5B21B6]', bg: 'bg-[#F3EDFB]' },
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

function NotificationsContent() {
  const router = useRouter()
  const { token: bridgedToken, loading: tokenLoading } = useAlquimiaToken()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [prefs, setPrefs] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrefs, setShowPrefs] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterTipo, setFilterTipo] = useState('')

  useEffect(() => {
    if (tokenLoading) return
    const token = bridgedToken
    if (!token) { router.replace('/sign-in'); return }

    Promise.all([
      fetch(`${getApiUrl()}/api/v1/notifications?limit=100`, { headers: authHdr() })
        .then(r => r.json())
        .then((d: ListResponse) => setNotifications(d.items)),
      fetch(`${getApiUrl()}/api/v1/notifications/preferences`, { headers: authHdr() })
        .then(r => r.json())
        .then((d: Preferences) => setPrefs(d)),
    ]).finally(() => setLoading(false))
  }, [router, bridgedToken, tokenLoading])

  async function markAsRead(id: string) {
    await fetch(`${getApiUrl()}/api/v1/notifications/${id}/leido`, {
      method: 'PATCH',
      headers: authHdr(),
    })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n))
  }

  async function dismiss(id: string) {
    await fetch(`${getApiUrl()}/api/v1/notifications/${id}/descartado`, {
      method: 'PATCH',
      headers: authHdr(),
    })
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  async function updatePrefs(updates: Partial<Preferences>) {
    if (!prefs) return
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/notifications/preferences`, {
        method: 'PATCH',
        headers: authHdr(),
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const d = await res.json()
        setPrefs(d)
      }
    } finally {
      setSaving(false)
    }
  }

  const filtered = filterTipo
    ? notifications.filter(n => n.tipo === filterTipo)
    : notifications

  const unread = notifications.filter(n => !n.leido && !n.descartado).length

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/hub"
          className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Notificaciones</h1>
          <p className="text-[13px] text-[#6B6760]">{unread} sin leer</p>
        </div>
        <button
          onClick={() => setShowPrefs(!showPrefs)}
          className="flex items-center gap-1 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] text-[#6B6760] hover:border-[#3B6D11] hover:text-[#3B6D11] transition-colors"
        >
          <Settings size={14} />
          Preferencias
        </button>
      </div>

      {/* Preferences panel */}
      {showPrefs && prefs && (
        <div className="mb-5 rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <h3 className="text-[13px] font-semibold text-[#1C1B18] mb-3">Tipo de notificaciones</h3>
          <div className="space-y-2">
            {[
              { key: 'gate_approvals', label: 'Aprobación de puertas' },
              { key: 'data_staleness', label: 'Datos desactualizados' },
              { key: 'new_initiatives', label: 'Nuevas iniciativas' },
              { key: 'stage_transitions', label: 'Cambios de etapa' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(prefs as any)[key]}
                  onChange={e => updatePrefs({ [key]: e.target.checked })}
                  disabled={saving}
                  className="rounded border border-[#E8E4DC]"
                />
                <span className="text-[12px] text-[#3D3A35]">{label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Filter chips */}
      {notifications.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          <button
            onClick={() => setFilterTipo('')}
            className={`flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
              filterTipo === ''
                ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#2D5409]'
                : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C9DDB1]'
            }`}
          >
            <Filter size={11} />
            Todas ({notifications.length})
          </button>
          {Object.entries(TIPO_CFG).map(([tipo, cfg]) => {
            const count = notifications.filter(n => n.tipo === tipo).length
            return count > 0 ? (
              <button
                key={tipo}
                onClick={() => setFilterTipo(filterTipo === tipo ? '' : tipo)}
                className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors ${
                  filterTipo === tipo
                    ? `border-[#3B6D11] ${cfg.bg} text-[#2D5409]`
                    : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C9DDB1]'
                }`}
              >
                {cfg.icon} {cfg.label} ({count})
              </button>
            ) : null
          })}
        </div>
      )}

      {/* States */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#3B6D11]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-10 text-center">
          <p className="text-[13px] text-[#8E8980]">Sin notificaciones {filterTipo ? 'de este tipo' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const typeCfg = TIPO_CFG[n.tipo] || { label: 'Otro', icon: '📬', color: 'text-[#6B6760]', bg: 'bg-[#F0EDE5]' }
            return (
              <div
                key={n.id}
                className={`rounded-[12px] border p-4 transition-colors ${
                  n.leido
                    ? 'border-[#E8E4DC] bg-white'
                    : 'border-[#C9DDB1] bg-[#EAF3DE]'
                }`}
              >
                <div className="flex gap-3">
                  {/* Icon */}
                  <div className={`mt-0.5 shrink-0 text-[24px]`}>
                    {typeCfg.icon}
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[13px] font-semibold text-[#1C1B18]">
                          {n.titulo}
                        </p>
                        <p className="mt-0.5 text-[12px] text-[#6B6760] leading-snug">
                          {n.descripcion}
                        </p>
                        <p className="mt-1 text-[10px] text-[#A8A49C]">
                          {new Date(n.created_at).toLocaleString('es-MX')}
                        </p>
                      </div>
                      {!n.leido && (
                        <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-[#3B6D11] mt-1" />
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {n.action_url && (
                        <a
                          href={n.action_url}
                          className="inline-flex items-center gap-1 rounded-[8px] border border-[#C9DDB1] bg-[#EAF3DE] px-3 py-1.5 text-[11px] font-semibold text-[#2D5409] hover:border-[#3B6D11] transition-colors"
                        >
                          {n.action_label || 'Ver'}
                        </a>
                      )}
                      {!n.leido && (
                        <button
                          onClick={() => markAsRead(n.id)}
                          className="inline-flex items-center gap-1 rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-1.5 text-[11px] text-[#6B6760] hover:border-[#3B6D11] transition-colors"
                        >
                          <CheckCheck size={12} />
                          Marcar leído
                        </button>
                      )}
                      <button
                        onClick={() => dismiss(n.id)}
                        className="inline-flex items-center gap-1 rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-1.5 text-[11px] text-[#A8A49C] hover:border-[#C0392B] hover:text-[#C0392B] transition-colors"
                      >
                        <Trash2 size={12} />
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <NotificationsContent />
      </Suspense>
    </AppShell>
  )
}
