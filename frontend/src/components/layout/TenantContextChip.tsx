'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Building2, Check } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { getTokenPayload } from '@/lib/authSession'

interface TenantOption {
  id: string
  nombre: string
  estado_mx: string
  current_stage: string
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('alquimia_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export function TenantContextChip() {
  const [municipioNombre, setMunicipioNombre] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [tenants, setTenants] = useState<TenantOption[]>([])
  const [activeTenantId, setActiveTenantId] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const payload = getTokenPayload()
    if (!payload) return

    const rol = payload.rol
    setIsAdmin(rol === 'admin' || rol === 'analista')

    // Load user profile to get municipio
    const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
    if (!token) return

    fetch(`${getApiUrl()}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (data.municipio_nombre) setMunicipioNombre(data.municipio_nombre)
        if (data.municipio_id) setActiveTenantId(data.municipio_id)
      })
      .catch(() => {})

    // If admin, load tenant list for switching
    if (rol === 'admin' || rol === 'analista') {
      fetch('/api/admin/tenants', { headers: authHeaders() })
        .then(r => r.ok ? r.json() : { tenants: [] })
        .then(data => {
          const list = (data.tenants ?? []).map((t: {
            id: string; nombre: string; estado_mx: string; state?: { current_stage: string }
          }) => ({
            id: t.id,
            nombre: t.nombre,
            estado_mx: t.estado_mx,
            current_stage: t.state?.current_stage ?? 'validation',
          }))
          setTenants(list)
        })
        .catch(() => {})
    }
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (!municipioNombre && !isAdmin) return null

  const displayName = municipioNombre ?? 'Municipio'

  if (!isAdmin || tenants.length === 0) {
    return (
      <span className="hidden sm:flex items-center gap-1.5 rounded-full border border-[#D8D1C4] bg-[#F0EDE6] px-2.5 py-1 text-[11px] text-[#4A4740]">
        <Building2 size={11} className="text-[#3B6D11]" />
        {displayName}
      </span>
    )
  }

  const activeT = tenants.find(t => t.id === activeTenantId)

  return (
    <div ref={ref} className="relative hidden sm:block">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 rounded-full border border-[#D8D1C4] bg-[#F0EDE6] px-2.5 py-1 text-[11px] text-[#4A4740] hover:border-[#3B6D11] transition-colors"
      >
        <Building2 size={11} className="text-[#3B6D11]" />
        {activeT?.nombre ?? displayName}
        <ChevronDown size={11} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 rounded-lg border border-[#E8E4DC] bg-white shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-[#F0EDE6]">
            <p className="text-[10px] uppercase tracking-wide text-[#8E8980]">Cambiar contexto municipal</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {tenants.map(t => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTenantId(t.id)
                  setMunicipioNombre(t.nombre)
                  // Store in sessionStorage so other components can read it
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('alquimia_active_tenant_id', t.id)
                    sessionStorage.setItem('alquimia_active_tenant_nombre', t.nombre)
                  }
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left hover:bg-[#F4F2ED] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#1C1B18] truncate">{t.nombre}</p>
                  <p className="text-[10px] text-[#8E8980]">{t.estado_mx} · {t.current_stage}</p>
                </div>
                {t.id === activeTenantId && (
                  <Check size={12} className="text-[#3B6D11] shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
