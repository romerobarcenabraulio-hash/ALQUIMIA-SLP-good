'use client'

import { useEffect, useState } from 'react'
import { Loader2, Users, MonitorSmartphone } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

interface Props {
  tenantId: string
  className?: string
}

type Modo = 'consulting' | 'self_service'

const MODO_CFG = {
  consulting: {
    label: 'Consultoría',
    desc: 'El equipo ALQUIMIA gestiona y entrega los productos.',
    icon: <Users size={16} />,
    bg: 'bg-[#EAF3DE]',
    border: 'border-[#C9DDB1]',
    text: 'text-[#2D5409]',
    dot: '#3B6D11',
  },
  self_service: {
    label: 'Autoservicio (Modo B)',
    desc: 'El municipio opera la plataforma de forma autónoma.',
    icon: <MonitorSmartphone size={16} />,
    bg: 'bg-[#E8F0FB]',
    border: 'border-[#A8C4E8]',
    text: 'text-[#1A4F8A]',
    dot: '#1A5FA8',
  },
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

export function ModoBToggle({ tenantId, className = '' }: Props) {
  const [modo, setModo] = useState<Modo>('consulting')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tenantId) return
    fetch(`${getApiUrl()}/api/v1/modo-b/${tenantId}`, { headers: authHdr() })
      .then(r => r.json())
      .then(d => setModo(d.modo === 'self_service' ? 'self_service' : 'consulting'))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  async function toggle(next: Modo) {
    if (saving || next === modo) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/modo-b/${tenantId}`, {
        method: 'PATCH',
        headers: authHdr(),
        body: JSON.stringify({ modo: next }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail ?? 'Error')
      setModo(next)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cambiar modo')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 size={14} className="animate-spin text-[#A8A49C]" />
        <span className="text-[11px] text-[#A8A49C]">Cargando modo…</span>
      </div>
    )
  }

  const activeCfg = MODO_CFG[modo]

  return (
    <div className={`rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-[#F0EDE5]">
        <p className="text-[12px] font-semibold text-[#1C1B18]">Modo de entrega</p>
        <p className="text-[10px] text-[#8E8980]">Cómo se opera la plataforma para este municipio.</p>
      </div>

      <div className="p-3 grid gap-2 sm:grid-cols-2">
        {(Object.entries(MODO_CFG) as [Modo, typeof MODO_CFG['consulting']][]).map(([key, cfg]) => {
          const active = modo === key
          return (
            <button
              key={key}
              onClick={() => toggle(key)}
              disabled={saving}
              className={`flex items-start gap-3 rounded-[10px] border p-3 text-left transition-colors disabled:opacity-60 ${
                active
                  ? `${cfg.bg} ${cfg.border} ${cfg.text}`
                  : 'border-[#E8E4DC] bg-[#FAFAF8] text-[#6B6760] hover:border-[#C9DDB1] hover:bg-white'
              }`}
            >
              <span className={`mt-0.5 shrink-0 ${active ? cfg.text : 'text-[#A8A49C]'}`}>
                {cfg.icon}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-[12px] font-semibold">{cfg.label}</p>
                  {active && saving && <Loader2 size={10} className="animate-spin" />}
                  {active && !saving && (
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: cfg.dot }}
                    />
                  )}
                </div>
                <p className={`text-[10px] leading-snug mt-0.5 ${active ? 'opacity-80' : 'text-[#A8A49C]'}`}>
                  {cfg.desc}
                </p>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mx-3 mb-3 rounded-[8px] bg-[#FBEAEA] px-3 py-2 text-[11px] text-[#7B1F1F]">
          {error}
        </div>
      )}
    </div>
  )
}
