'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Recycle, FileText, BarChart2, ArrowRight, TrendingUp,
  Download, Settings, Users, CheckCircle2, Clock, AlertTriangle, Scale, MapPin, Search, Zap,
} from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { JourneyPanel } from '@/components/journey/JourneyPanel'
import { getApiUrl } from '@/lib/api'
import { getTokenPayload } from '@/lib/authSession'
import { useAlquimiaToken } from '@/lib/useAlquimiaToken'

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string
  nombre: string
  municipio_nombre: string | null
  estado_mx: string | null
  municipio_id: string | null
  rol: string
  reglamento_uploaded?: boolean
}

interface TenantSummary {
  id: string
  nombre: string
  current_stage: string
  tier_comercial: string
  simulaciones_count?: number
}

interface QuickAction {
  label: string
  href: string
  icon: React.ReactNode
  color: string
  desc: string
}

// ─── Quick actions per stage ──────────────────────────────────────────────────

const ACTIONS_BY_STAGE: Record<string, QuickAction[]> = {
  validation: [
    { label: 'Ver propuesta', href: '/comenzar/propuesta', icon: <TrendingUp size={16} />, color: '#3B6D11', desc: 'Propuesta personalizada de circularidad' },
    { label: 'Diagnóstico rápido', href: '/decision-tree', icon: <BarChart2 size={16} />, color: '#1C4B8F', desc: 'Estimar generación de residuos' },
    { label: 'ARCHIVO', href: '/archivo', icon: <Search size={16} />, color: '#1A5FA8', desc: 'Búsqueda semántica en catálogo regulatorio' },
    { label: 'Simulador', href: '/simulator', icon: <BarChart2 size={16} />, color: '#1C4B8F', desc: 'Modelar escenarios financieros' },
    { label: 'Subir reglamento', href: '/gobierno/rsu', icon: <FileText size={16} />, color: '#7B3F00', desc: 'Diagnóstico jurídico del municipio' },
  ],
  planning: [
    { label: 'Simulaciones', href: '/simulaciones', icon: <BarChart2 size={16} />, color: '#1C4B8F', desc: 'Revisar escenarios guardados' },
    { label: 'Análisis RCD', href: '/rcd', icon: <Zap size={16} />, color: '#7B3F00', desc: 'Composición de residuos construcción' },
    { label: 'Plan Maestro', href: '/hub/plan-maestro', icon: <FileText size={16} />, color: '#3B6D11', desc: 'Generar Plan Maestro para cabildo' },
    { label: 'Documentos Hub', href: '/hub/documentos', icon: <Download size={16} />, color: '#7B3F00', desc: 'Paquete de documentos institucionales' },
  ],
  execution: [
    { label: 'Documentos Hub', href: '/hub/documentos', icon: <Download size={16} />, color: '#3B6D11', desc: 'Paquete completo de implementación' },
    { label: 'Mapa de circularidad', href: '/hub/mapa-circularidad', icon: <MapPin size={16} />, color: '#1C4B8F', desc: 'Centros de acopio y flujos RSU' },
    { label: 'Generadores de residuos', href: '/hub/generadores', icon: <Users size={16} />, color: '#7B3F00', desc: 'Empresas y entidades generadoras' },
    { label: 'Registro de residuos', href: '/residue-recording', icon: <BarChart2 size={16} />, color: '#3B6D11', desc: 'Captura diaria de datos' },
    { label: 'Empresas locales', href: '/gobierno/rsu#denue', icon: <Users size={16} />, color: '#1C4B8F', desc: 'Recicladores y compradores ancla' },
    { label: 'Indicadores', href: '/gobierno/rsu#indicadores', icon: <TrendingUp size={16} />, color: '#7B3F00', desc: 'Monitoreo de metas operativas' },
  ],
  monitoring: [
    { label: 'Análisis de residuos', href: '/hub/residue-analytics', icon: <TrendingUp size={16} />, color: '#3B6D11', desc: 'Tendencias y proyecciones' },
    { label: 'Reporte ESG', href: '/hub/reporte-esg', icon: <FileText size={16} />, color: '#5B21B6', desc: 'Generar reporte trimestral ESG' },
    { label: 'Marco regulatorio', href: '/hub/catalogo-iniciativas', icon: <Scale size={16} />, color: '#1A5FA8', desc: 'LGPGIR, NOMs, GRI, ASF y más' },
    { label: 'Socios y BANOBRAS', href: '/hub/partners', icon: <TrendingUp size={16} />, color: '#3B6D11', desc: 'Ecosistema y elegibilidad crédito verde' },
    { label: 'Indicadores', href: '/gobierno/rsu#indicadores', icon: <BarChart2 size={16} />, color: '#7B3F00', desc: 'Dashboard de monitoreo continuo' },
    { label: 'Configuración', href: '/perfil', icon: <Settings size={16} />, color: '#6B6760', desc: 'Ajustes del municipio y equipo' },
  ],
}

// ─── Components ───────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color = '#3B6D11' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[11px] uppercase tracking-wide text-[#8E8980]">{label}</p>
      <p className="mt-1 text-[24px] font-bold text-[#1C1B18]" style={{ color }}>{value}</p>
      {sub && <p className="text-[10px] text-[#9E9B96]">{sub}</p>}
    </div>
  )
}

function ActionCard({ action }: { action: QuickAction }) {
  return (
    <Link
      href={action.href || '#'}
      className="group flex items-start gap-3 rounded-[12px] border border-[#E8E4DC] bg-white p-4 transition-all hover:border-[#3B6D11]/40 hover:shadow-sm"
    >
      <span
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] text-white"
        style={{ background: action.color }}
      >
        {action.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-[#1C1B18] group-hover:text-[#3B6D11] transition-colors">
          {action.label}
        </p>
        <p className="text-[11px] text-[#6B6760]">{action.desc}</p>
      </div>
      <ArrowRight size={14} className="mt-1 shrink-0 text-[#C4BFB6] group-hover:text-[#3B6D11] transition-colors" />
    </Link>
  )
}

// ─── Main content ─────────────────────────────────────────────────────────────

function HubContent() {
  const router = useRouter()
  const { token: bridgedToken, loading: tokenLoading } = useAlquimiaToken()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tenant, setTenant] = useState<TenantSummary | null>(null)
  const [simCount, setSimCount] = useState(0)
  const [loading, setLoading] = useState(true)

  function authHdr(): HeadersInit {
    const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  useEffect(() => {
    if (tokenLoading) return
    const token = bridgedToken
    if (!token) { router.replace('/sign-in'); return }

    const payload = getTokenPayload()
    const isAdmin = payload?.rol === 'admin' || payload?.rol === 'analista'

    // Active tenant from sessionStorage (set by TenantContextChip)
    const activeTenantId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('alquimia_active_tenant_id') ?? '')
      : ''

    Promise.all([
      fetch(`${getApiUrl()}/auth/me`, { headers: authHdr() }).then(r => r.ok ? r.json() : null),
      activeTenantId
        ? fetch(`${getApiUrl()}/api/admin/tenants/${activeTenantId}`, { headers: authHdr() }).then(r => r.ok ? r.json() : null)
        : Promise.resolve(null),
      fetch(`${getApiUrl()}/api/simulations`, { headers: authHdr() }).then(r => r.ok ? r.json() : { simulations: [] }),
    ]).then(([me, tenantData, simsData]) => {
      if (me) setProfile(me)
      if (tenantData) {
        setTenant({
          id: tenantData.id,
          nombre: tenantData.nombre,
          current_stage: tenantData.state?.current_stage ?? 'validation',
          tier_comercial: tenantData.tier_comercial ?? 'diagnostico',
        })
      }
      setSimCount((simsData?.simulations ?? []).length)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [router, bridgedToken, tokenLoading])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B6D11] border-t-transparent" />
      </div>
    )
  }

  const stage = (tenant?.current_stage ?? 'validation') as keyof typeof ACTIONS_BY_STAGE
  const actions = ACTIONS_BY_STAGE[stage] ?? ACTIONS_BY_STAGE.validation
  const municipioNombre = profile?.municipio_nombre
    ?? (typeof window !== 'undefined' ? sessionStorage.getItem('alquimia_active_tenant_nombre') : null)
    ?? 'Tu municipio'

  // Patch proposal link with municipio context
  const actionsWithContext = actions.map(a =>
    a.label === 'Ver propuesta'
      ? { ...a, href: `/comenzar/propuesta?municipio=${encodeURIComponent(municipioNombre)}&estado=${encodeURIComponent(profile?.estado_mx ?? 'San Luis Potosí')}` }
      : a
  )

  const stageLabels: Record<string, string> = {
    validation: 'Validación', planning: 'Planeación',
    execution: 'Ejecución', monitoring: 'Monitoreo',
  }
  const tierLabels: Record<string, string> = {
    diagnostico: 'Diagnóstico Circular',
    implementacion: 'Implementación Piloto',
    operacion: 'Operación Continua',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

      {/* Greeting */}
      <div className="mb-8">
        <h1 className="font-serif text-[26px] font-semibold text-[#1C1B18]">
          {municipioNombre}
        </h1>
        {profile?.estado_mx && (
          <p className="mt-1 text-[13px] text-[#6B6760]">{profile.estado_mx}</p>
        )}
      </div>

      {/* KPI bar */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Etapa actual"
          value={stageLabels[stage] ?? stage}
          sub="en el journey"
          color="#3B6D11"
        />
        <StatCard
          label="Tier"
          value={tierLabels[tenant?.tier_comercial ?? 'diagnostico'] ?? '—'}
          sub="servicio activo"
          color="#1C4B8F"
        />
        <StatCard
          label="Simulaciones"
          value={simCount}
          sub="escenarios guardados"
          color="#7B3F00"
        />
        <StatCard
          label="Reglamento"
          value={profile?.reglamento_uploaded ? '✓' : '—'}
          sub={profile?.reglamento_uploaded ? 'subido' : 'pendiente'}
          color={profile?.reglamento_uploaded ? '#3B6D11' : '#D97706'}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* Left: journey panel */}
        <div>
          <h2 className="mb-3 text-[13px] font-semibold text-[#1C1B18]">Journey institucional</h2>
          {tenant?.id ? (
            <JourneyPanel tenantId={tenant.id} />
          ) : (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-6 text-center">
              <AlertTriangle size={20} className="mx-auto mb-2 text-amber-400" />
              <p className="text-[13px] text-[#6B6760]">Municipio no asignado a un tenant activo.</p>
              <p className="mt-1 text-[11px] text-[#9E9B96]">El administrador debe vincular tu cuenta.</p>
            </div>
          )}
        </div>

        {/* Right: quick actions */}
        <div>
          <h2 className="mb-3 text-[13px] font-semibold text-[#1C1B18]">Acciones disponibles</h2>
          <div className="space-y-2">
            {actionsWithContext.map(action => (
              <ActionCard key={action.label} action={action} />
            ))}
          </div>

          {/* Navigation shortcuts */}
          <div className="mt-4 rounded-[12px] border border-[#E8E4DC] bg-white p-4">
            <p className="mb-2 text-[11px] uppercase tracking-wide text-[#8E8980]">Módulos</p>
            <div className="space-y-1">
              {[
                { label: 'RSU — Residuos sólidos', href: '/gobierno/rsu', icon: <Recycle size={13} /> },
                { label: 'Simulador financiero', href: '/simulator', icon: <BarChart2 size={13} /> },
                { label: 'Documentos y exportes', href: '/hub/documentos', icon: <Download size={13} /> },
                { label: 'Paquete de consultoría RSU', href: '/v', icon: <FileText size={13} /> },
              ].map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-[8px] px-2 py-2 text-[12px] text-[#3B3326] hover:bg-[#F4F2ED] transition-colors"
                >
                  <span className="text-[#3B6D11]">{item.icon}</span>
                  {item.label}
                  <ChevronRight size={11} className="ml-auto text-[#C4BFB6]" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Need ChevronRight in scope
import { ChevronRight } from 'lucide-react'

export default function HubPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B6D11] border-t-transparent" />
        </div>
      }>
        <HubContent />
      </Suspense>
    </AppShell>
  )
}
