'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, ExternalLink, CheckCircle2, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface Partner {
  id: string
  nombre: string
  nombre_corto?: string
  tipo: string
  zm: string
  estado_mx: string
  municipio?: string
  materiales: string[]
  capacidad_ton_mes?: number
  precio_compra_json: Record<string, number>
  contacto_nombre?: string
  contacto_telefono?: string
  url?: string
  certificaciones: string[]
  fuente: string
}

interface PartnerLink {
  id: string
  partner_id: string
  partner_nombre?: string
  estatus: string
  material?: string
  precio_acordado_ton?: number
}

const TIPO_CFG: Record<string, { label: string; color: string; bg: string }> = {
  recicladora:    { label: 'Recicladora',     color: 'text-[#2D5409]', bg: 'bg-[#EAF3DE]' },
  comprador_ancla:{ label: 'Comprador ancla', color: 'text-[#1A5FA8]', bg: 'bg-[#E8F0FB]' },
  procesador:     { label: 'Procesador',      color: 'text-[#8B5A00]', bg: 'bg-[#FEF7E7]' },
  transportista:  { label: 'Transportista',   color: 'text-[#5B2C8A]', bg: 'bg-[#F3EDFB]' },
  financiero:     { label: 'Financiero',      color: 'text-[#C0392B]', bg: 'bg-[#FBEAEA]' },
  consultor:      { label: 'Consultor',       color: 'text-[#6B6760]', bg: 'bg-[#F0EDE5]' },
}

const LINK_STATUS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  identificado: { label: 'Identificado', icon: <Clock size={11} />, color: 'text-[#A8A49C]' },
  contactado:   { label: 'Contactado',   icon: <Clock size={11} />, color: 'text-[#D4881E]' },
  cotizando:    { label: 'Cotizando',    icon: <Clock size={11} />, color: 'text-[#1A5FA8]' },
  contratado:   { label: 'Contratado',  icon: <CheckCircle2 size={11} />, color: 'text-[#2D5409]' },
  activo:       { label: 'Activo',      icon: <CheckCircle2 size={11} />, color: 'text-[#3B6D11]' },
  pausado:      { label: 'Pausado',     icon: <Clock size={11} />, color: 'text-[#6B6760]' },
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function PartnersContent() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [links, setLinks] = useState<PartnerLink[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('')
  const [filterMat, setFilterMat] = useState('')
  const [savingLink, setSavingLink] = useState<string | null>(null)

  const tenantId = typeof window !== 'undefined'
    ? sessionStorage.getItem('alquimia_active_tenant_id') || ''
    : ''

  useEffect(() => {
    const params = new URLSearchParams()
    if (filterTipo) params.set('tipo', filterTipo)
    if (filterMat) params.set('material', filterMat)

    Promise.all([
      fetch(`${getApiUrl()}/api/v1/partners?${params}`).then(r => r.json()),
      tenantId
        ? fetch(`${getApiUrl()}/api/v1/partners/tenant/${tenantId}/links`, { headers: authHdr() })
            .then(r => r.json())
        : Promise.resolve([]),
    ])
      .then(([ps, ls]) => {
        setPartners(Array.isArray(ps) ? ps : [])
        setLinks(Array.isArray(ls) ? ls : [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filterTipo, filterMat, tenantId])

  async function addLink(partnerId: string) {
    if (!tenantId) return
    setSavingLink(partnerId)
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/partners/tenant/${tenantId}/links`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({ partner_id: partnerId, estatus: 'identificado' }),
      })
      if (res.ok) {
        const link = await res.json()
        setLinks(prev => [...prev.filter(l => l.partner_id !== partnerId), link])
      }
    } finally {
      setSavingLink(null)
    }
  }

  async function updateLinkStatus(linkId: string, estatus: string) {
    try {
      await fetch(`${getApiUrl()}/api/v1/partners/links/${linkId}/estatus?estatus=${estatus}`, {
        method: 'PATCH',
        headers: authHdr(),
      })
      setLinks(prev => prev.map(l => l.id === linkId ? { ...l, estatus } : l))
    } catch {}
  }

  const linkedPartnerIds = new Set(links.map(l => l.partner_id))

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/hub" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Ecosistema de Socios</h1>
          <p className="text-[13px] text-[#6B6760]">Recicladoras, compradores ancla y financiadores en tu ZM</p>
        </div>
        <Link
          href="/hub/banobras"
          className="flex items-center gap-2 rounded-[8px] border border-[#C9DDB1] bg-[#EAF3DE] px-3 py-2 text-[12px] font-semibold text-[#2D5409] hover:border-[#3B6D11] transition-colors"
        >
          BANOBRAS Elegibilidad →
        </Link>
      </div>

      {/* Active links */}
      {links.length > 0 && (
        <div className="mb-5 rounded-[12px] border border-[#C9DDB1] bg-[#EAF3DE] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#2D5409] mb-2">Mis socios</p>
          <div className="flex flex-wrap gap-2">
            {links.map(l => {
              const sc = LINK_STATUS[l.estatus] || LINK_STATUS.identificado
              return (
                <div key={l.id} className="flex items-center gap-1.5 rounded-[8px] border border-[#C9DDB1] bg-white px-2.5 py-1.5">
                  <span className={sc.color}>{sc.icon}</span>
                  <span className="text-[11px] text-[#1C1B18]">{l.partner_nombre || l.partner_id}</span>
                  <select
                    value={l.estatus}
                    onChange={e => updateLinkStatus(l.id, e.target.value)}
                    className="ml-1 border-0 bg-transparent text-[10px] text-[#6B6760] outline-none cursor-pointer"
                  >
                    {Object.entries(LINK_STATUS).map(([v, cfg]) => (
                      <option key={v} value={v}>{cfg.label}</option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_CFG).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filtrar por material…"
          value={filterMat}
          onChange={e => setFilterMat(e.target.value)}
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[12px] placeholder:text-[#A8A49C] outline-none focus:border-[#3B6D11]"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#3B6D11]" />
        </div>
      ) : (
        <div className="space-y-3">
          {partners.map(p => {
            const cfg = TIPO_CFG[p.tipo] || TIPO_CFG.consultor
            const isLinked = linkedPartnerIds.has(p.id)
            const link = links.find(l => l.partner_id === p.id)
            const linkStatus = link ? LINK_STATUS[link.estatus] : null

            return (
              <div key={p.id} className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="text-[13px] font-semibold text-[#1C1B18]">{p.nombre}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${cfg.bg} ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      {p.certificaciones.map(c => (
                        <span key={c} className="rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-0.5 text-[10px] text-[#6B6760]">
                          {c}
                        </span>
                      ))}
                    </div>

                    <p className="text-[11px] text-[#6B6760]">{p.municipio ?? p.estado_mx} · {p.zm}</p>

                    {p.materiales.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {p.materiales.map(m => (
                          <span key={m} className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-1.5 py-0.5 text-[10px] text-[#3D3A35]">
                            {m}
                          </span>
                        ))}
                      </div>
                    )}

                    {Object.keys(p.precio_compra_json).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-3">
                        {Object.entries(p.precio_compra_json).slice(0, 3).map(([mat, precio]) => (
                          <div key={mat} className="text-[10px]">
                            <span className="text-[#6B6760]">{mat}: </span>
                            <span className="font-mono font-bold text-[#3B6D11]">${Number(precio).toLocaleString('es-MX')}/ton</span>
                          </div>
                        ))}
                        {p.capacidad_ton_mes && (
                          <div className="text-[10px]">
                            <span className="text-[#6B6760]">Cap: </span>
                            <span className="font-mono font-bold text-[#1C1B18]">{p.capacidad_ton_mes} ton/mes</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {p.url && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer"
                        className="text-[#A8A49C] hover:text-[#3B6D11]">
                        <ExternalLink size={14} />
                      </a>
                    )}
                    {tenantId && (
                      isLinked && linkStatus ? (
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${linkStatus.color}`}>
                          {linkStatus.icon} {linkStatus.label}
                        </span>
                      ) : (
                        <button
                          onClick={() => addLink(p.id)}
                          disabled={savingLink === p.id}
                          className="flex items-center gap-1 rounded-[8px] border border-[#E8E4DC] px-2.5 py-1.5 text-[11px] font-semibold text-[#3B6D11] hover:border-[#3B6D11] hover:bg-[#EAF3DE] transition-colors disabled:opacity-40"
                        >
                          {savingLink === p.id ? <Loader2 size={10} className="animate-spin" /> : <Plus size={11} />}
                          Agregar
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {partners.length === 0 && (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-10 text-center">
              <p className="text-[13px] text-[#8E8980]">Sin socios registrados para estos filtros.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function PartnersPage() {
  return (
    <AppShell>
      <Suspense fallback={<div className="flex min-h-[60vh] items-center justify-center"><Loader2 size={24} className="animate-spin text-[#3B6D11]" /></div>}>
        <PartnersContent />
      </Suspense>
    </AppShell>
  )
}
