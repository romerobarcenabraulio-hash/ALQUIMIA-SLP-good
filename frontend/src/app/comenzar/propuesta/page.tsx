'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/lib/api'
import { Building2, TrendingUp, Factory, CheckCircle, ArrowRight, AlertCircle, Leaf } from 'lucide-react'
import { PublicPageShell } from '@/components/public/PublicPageShell'

// ─── Types ─────────────────────────────────────────────────────────────────

interface EmpresaLocal {
  nombre: string
  actividad: string
  scian: string
  rol: string
  municipio: string
}

interface PerfilResiduos {
  poblacion: number
  generacion_ton_dia: number
  mix_corrientes: Record<string, number>
  tasa_recuperacion_actual_pct: number
  fuente_poblacion: string
  fuente_generacion: string
}

interface BrechaCircular {
  ton_recuperables_perdidas_dia: number
  pct_recuperable_no_capturado: number
  ingreso_potencial_anual_mxn: number
  tasa_actual_pct: number
  tasa_potencial_pct: number
}

interface TierPropuesta {
  id: string
  nombre: string
  descripcion: string
  entregables: string[]
  precio_min_mxn: number
  precio_max_mxn: number
  precio_recomendado_mxn: number
  duracion_meses: number | null
  color: string
  tag: string
  recomendado: boolean
}

interface PropuestaPersonalizada {
  municipio_nombre: string
  estado: string
  perfil: PerfilResiduos
  empresas_locales: EmpresaLocal[]
  brecha: BrechaCircular
  tiers: TierPropuesta[]
  tier_recomendado_id: string
  resumen_oportunidad: string
  advertencias: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 0): string {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: decimals }).format(n)
}

function fmtMXN(n: number): string {
  if (n >= 1_000_000) return `MXN $${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `MXN $${(n / 1_000).toFixed(0)}K`
  return `MXN $${fmt(n)}`
}

const MIX_COLORS: Record<string, string> = {
  organico: '#4CAF50',
  papel: '#2196F3',
  carton: '#00BCD4',
  plastico: '#FF9800',
  vidrio: '#9C27B0',
  metal: '#607D8B',
  textil: '#E91E63',
  otros: '#9E9E9E',
}

const ROL_LABEL: Record<string, string> = {
  recolector: 'Recolector',
  acopiador: 'Centro de Acopio',
  comprador_ancla: 'Comprador Ancla',
  actor: 'Actor local',
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function WasteMixBar({ mix }: { mix: Record<string, number> }) {
  const sorted = Object.entries(mix).sort((a, b) => b[1] - a[1])
  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-full">
        {sorted.map(([k, v]) => (
          <div
            key={k}
            style={{ width: `${v * 100}%`, background: MIX_COLORS[k] ?? '#ccc' }}
            title={`${k}: ${(v * 100).toFixed(0)}%`}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {sorted.map(([k, v]) => (
          <span key={k} className="flex items-center gap-1 text-[11px] text-[#6B6760]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: MIX_COLORS[k] ?? '#ccc' }} />
            {k} {(v * 100).toFixed(0)}%
          </span>
        ))}
      </div>
    </div>
  )
}

function TierCard({ tier, onSelect }: { tier: TierPropuesta; onSelect: () => void }) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 transition-all ${
        tier.recomendado
          ? 'border-[#3B6D11] bg-white shadow-lg ring-2 ring-[#3B6D11]/20'
          : 'border-[#E8E4DC] bg-white hover:border-[#3B6D11]/40'
      }`}
    >
      {tier.tag && (
        <span
          className="absolute -top-3 left-4 rounded-full px-3 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          style={{ background: tier.color }}
        >
          {tier.tag}
        </span>
      )}
      <h3 className="mt-1 text-[15px] font-semibold text-[#1C1B18]">{tier.nombre}</h3>
      <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">{tier.descripcion}</p>

      <div className="mt-4">
        <p className="text-[11px] uppercase tracking-wide text-[#8E8980]">Inversión estimada</p>
        <p className="text-[22px] font-bold text-[#1C1B18]">
          {fmtMXN(tier.precio_recomendado_mxn)}
        </p>
        <p className="text-[11px] text-[#8E8980]">
          Rango: {fmtMXN(tier.precio_min_mxn)} – {fmtMXN(tier.precio_max_mxn)}
          {tier.duracion_meses ? ` · ${tier.duracion_meses} meses` : ' · mensual'}
        </p>
      </div>

      <ul className="mt-4 space-y-1.5">
        {tier.entregables.map((e, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-[#3B3326]">
            <CheckCircle size={13} className="mt-0.5 shrink-0 text-[#3B6D11]" />
            {e}
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-medium transition-colors ${
          tier.recomendado
            ? 'bg-[#3B6D11] text-white hover:bg-[#2D5409]'
            : 'border border-[#D8D1C4] text-[#3B3326] hover:border-[#3B6D11] hover:text-[#3B6D11]'
        }`}
      >
        Quiero este plan
        <ArrowRight size={14} />
      </button>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PropuestaPage() {
  const router = useRouter()
  const params = useSearchParams()
  const municipio = params.get('municipio') ?? ''
  const estado = params.get('estado') ?? 'San Luis Potosí'

  const [propuesta, setPropuesta] = useState<PropuestaPersonalizada | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!municipio) {
      router.replace('/comenzar')
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
    if (!token) {
      // Show public summary instead
      fetch(`${getApiUrl()}/api/v1/propuesta/public/${encodeURIComponent(municipio)}?estado=${encodeURIComponent(estado)}`)
        .then(r => r.json())
        .then(data => {
          // Build a minimal PropuestaPersonalizada from public response
          const pop = data.poblacion_estimada ?? 80_000
          const ingreso = data.ingreso_potencial_anual_mxn ?? 0
          const tierRec = data.tier_sugerido ?? 'diagnostico'
          const tiers: TierPropuesta[] = [
            { id: 'diagnostico', nombre: 'Diagnóstico Circular', descripcion: 'Evaluación completa del perfil de residuos y hoja de ruta.', entregables: ['Índice de Circularidad Municipal', 'Diagnóstico de residuos', 'Hoja de ruta priorizada'], precio_min_mxn: 350_000, precio_max_mxn: 1_200_000, precio_recomendado_mxn: 500_000, duracion_meses: 3, color: '#3B6D11', tag: 'Más elegido', recomendado: tierRec === 'diagnostico' },
            { id: 'implementacion', nombre: 'Implementación Piloto', descripcion: 'Diseño e implementación de infraestructura de separación.', entregables: ['Todo de Diagnóstico', 'Convenios con empresas ancla', 'Panel de monitoreo'], precio_min_mxn: 800_000, precio_max_mxn: 4_500_000, precio_recomendado_mxn: 1_500_000, duracion_meses: 12, color: '#1C4B8F', tag: 'Mayor impacto', recomendado: tierRec === 'implementacion' },
            { id: 'operacion', nombre: 'Operación Continua', descripcion: 'Monitoreo mensual, reportes y soporte técnico permanente.', entregables: ['Actualización ICM mensual', 'Reportes SEMARNAT', 'Acceso plataforma ALQUIMIA'], precio_min_mxn: 80_000, precio_max_mxn: 400_000, precio_recomendado_mxn: 120_000, duracion_meses: null, color: '#7B3F00', tag: 'Mensual', recomendado: tierRec === 'operacion' },
          ]
          setPropuesta({
            municipio_nombre: municipio,
            estado,
            perfil: {
              poblacion: pop,
              generacion_ton_dia: data.generacion_ton_dia ?? 0,
              mix_corrientes: { organico: 0.52, papel: 0.09, carton: 0.06, plastico: 0.11, vidrio: 0.07, metal: 0.04, textil: 0.03, otros: 0.08 },
              tasa_recuperacion_actual_pct: 12,
              fuente_poblacion: 'CONAPO 2020 (estimado)',
              fuente_generacion: 'SEMARNAT 2022',
            },
            empresas_locales: [],
            brecha: {
              ton_recuperables_perdidas_dia: data.generacion_ton_dia * 0.52 * 0.88,
              pct_recuperable_no_capturado: 40,
              ingreso_potencial_anual_mxn: ingreso,
              tasa_actual_pct: 12,
              tasa_potencial_pct: 65,
            },
            tiers,
            tier_recomendado_id: tierRec,
            resumen_oportunidad: data.nota ?? '',
            advertencias: [],
          })
        })
        .catch(() => setError('No se pudo cargar la propuesta. Intenta de nuevo.'))
        .finally(() => setLoading(false))
      return
    }

    fetch(`${getApiUrl()}/api/v1/propuesta/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ municipio_nombre: municipio, estado }),
    })
      .then(r => r.ok ? r.json() : r.json().then(e => Promise.reject(e.detail ?? 'Error')))
      .then(data => setPropuesta(data))
      .catch(e => setError(typeof e === 'string' ? e : 'Error generando propuesta.'))
      .finally(() => setLoading(false))
  }, [municipio, estado, router])

  function handleSelectTier(tierId: string) {
    router.push(`/comenzar?tier=${tierId}&municipio=${encodeURIComponent(municipio)}&estado=${encodeURIComponent(estado)}`)
  }

  if (loading) {
    return (
      <PublicPageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#3B6D11] border-t-transparent" />
            <p className="text-[14px] text-[#6B6760]">Generando propuesta personalizada para {municipio}…</p>
          </div>
        </div>
      </PublicPageShell>
    )
  }

  if (error || !propuesta) {
    return (
      <PublicPageShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle size={24} className="mx-auto mb-2 text-red-500" />
            <p className="text-[14px] text-red-700">{error || 'Error desconocido'}</p>
            <button
              onClick={() => router.back()}
              className="mt-4 rounded-lg border border-red-200 px-4 py-2 text-[13px] text-red-700 hover:bg-red-100"
            >
              Volver
            </button>
          </div>
        </div>
      </PublicPageShell>
    )
  }

  const p = propuesta
  const mxnM = p.brecha.ingreso_potencial_anual_mxn / 1_000_000

  return (
    <PublicPageShell>
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-wide text-[#8E8980]">
            <Leaf size={13} className="text-[#3B6D11]" />
            <span>Propuesta personalizada</span>
          </div>
          <h1 className="mt-2 font-serif text-[28px] font-semibold text-[#1C1B18]">
            {p.municipio_nombre}
          </h1>
          <p className="text-[14px] text-[#6B6760]">{p.estado}</p>
        </div>

        {/* Oportunidad summary */}
        <div className="mb-8 rounded-xl border border-[#D8F0C8] bg-[#F2FAF0] p-5">
          <p className="text-[13px] leading-relaxed text-[#2D5409]">{p.resumen_oportunidad}</p>
        </div>

        {/* KPI bar */}
        <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-[#E8E4DC] bg-white p-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-[#8E8980]">Población</p>
            <p className="mt-1 text-[20px] font-bold text-[#1C1B18]">{fmt(p.perfil.poblacion)}</p>
            <p className="text-[10px] text-[#8E8980]">hab.</p>
          </div>
          <div className="rounded-xl border border-[#E8E4DC] bg-white p-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-[#8E8980]">Generación</p>
            <p className="mt-1 text-[20px] font-bold text-[#1C1B18]">{fmt(p.perfil.generacion_ton_dia, 1)}</p>
            <p className="text-[10px] text-[#8E8980]">ton/día</p>
          </div>
          <div className="rounded-xl border border-[#E8E4DC] bg-white p-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-[#8E8980]">Perdido/día</p>
            <p className="mt-1 text-[20px] font-bold text-[#DC2626]">{fmt(p.brecha.ton_recuperables_perdidas_dia, 1)}</p>
            <p className="text-[10px] text-[#8E8980]">ton recuperables</p>
          </div>
          <div className="rounded-xl border border-[#D8F0C8] bg-[#F2FAF0] p-4 text-center">
            <p className="text-[11px] uppercase tracking-wide text-[#4A7C23]">Potencial anual</p>
            <p className="mt-1 text-[20px] font-bold text-[#3B6D11]">MXN ${mxnM.toFixed(1)}M</p>
            <p className="text-[10px] text-[#4A7C23]">en valor materiales</p>
          </div>
        </div>

        {/* Two column: mix + empresas */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2">
          {/* Waste mix */}
          <div className="rounded-xl border border-[#E8E4DC] bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp size={14} className="text-[#3B6D11]" />
              <h2 className="text-[13px] font-semibold text-[#1C1B18]">Composición de residuos</h2>
            </div>
            <WasteMixBar mix={p.perfil.mix_corrientes} />
            <div className="mt-4 flex items-center justify-between text-[12px]">
              <span className="text-[#6B6760]">Recuperación actual</span>
              <span className="font-semibold text-[#DC2626]">{p.brecha.tasa_actual_pct}%</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[12px]">
              <span className="text-[#6B6760]">Potencial alcanzable</span>
              <span className="font-semibold text-[#3B6D11]">{p.brecha.tasa_potencial_pct}%</span>
            </div>
            <p className="mt-3 text-[10px] text-[#9E9B96]">
              Fuente: {p.perfil.fuente_generacion}
            </p>
          </div>

          {/* Local companies */}
          <div className="rounded-xl border border-[#E8E4DC] bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <Factory size={14} className="text-[#3B6D11]" />
              <h2 className="text-[13px] font-semibold text-[#1C1B18]">
                Empresas locales identificadas
                {p.empresas_locales.length > 0 && (
                  <span className="ml-2 rounded-full bg-[#F0EDE6] px-2 py-0.5 text-[10px] font-normal text-[#6B6760]">
                    {p.empresas_locales.length}
                  </span>
                )}
              </h2>
            </div>
            {p.empresas_locales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Building2 size={24} className="mb-2 text-[#D8D1C4]" />
                <p className="text-[12px] text-[#8E8980]">
                  Empresas cargadas con INEGI_DENUE_TOKEN.<br />
                  El diagnóstico completo las incluye.
                </p>
              </div>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto">
                {p.empresas_locales.map((e, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-[#FAFAF8] p-2">
                    <span className="mt-0.5 rounded bg-[#F0EDE6] px-1.5 py-0.5 text-[9px] font-medium uppercase text-[#6B6760]">
                      {ROL_LABEL[e.rol] ?? e.rol}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-[#1C1B18]">{e.nombre}</p>
                      <p className="text-[10px] text-[#8E8980]">{e.actividad}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tier cards */}
        <div className="mb-6">
          <h2 className="mb-1 font-serif text-[20px] font-semibold text-[#1C1B18]">
            Elige tu plan de circularidad
          </h2>
          <p className="text-[13px] text-[#6B6760]">
            Precios calibrados para un municipio de {fmt(p.perfil.poblacion)} habitantes.
          </p>
        </div>
        <div className="mb-10 grid gap-5 sm:grid-cols-3">
          {p.tiers.map(tier => (
            <TierCard key={tier.id} tier={tier} onSelect={() => handleSelectTier(tier.id)} />
          ))}
        </div>

        {/* Advertencias */}
        {p.advertencias.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-amber-700">
              <AlertCircle size={13} />
              Notas metodológicas
            </div>
            <ul className="space-y-1">
              {p.advertencias.map((a, i) => (
                <li key={i} className="text-[11px] text-amber-700">{a}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </PublicPageShell>
  )
}
