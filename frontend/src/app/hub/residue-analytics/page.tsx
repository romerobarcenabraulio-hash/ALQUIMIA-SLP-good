'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface Analytics {
  municipio: string
  dias_con_datos: number
  media_tons_diarios: number
  desviacion_estandar: number
  minimo_tons_diarios: number
  maximo_tons_diarios: number
  coef_variacion: number
  proyeccion_mes_tons: number
  tendencia: string
  cambio_semana_pct: number | null
  cambio_mes_pct: number | null
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return (t ? { Authorization: `Bearer ${t}` } : {}) as HeadersInit
}

function ResidueAnalyticsContent() {
  const [municipio, setMunicipio] = useState('')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const tenantId = typeof window !== 'undefined'
    ? sessionStorage.getItem('alquimia_active_tenant_id') || ''
    : ''

  const tenantNombre = typeof window !== 'undefined'
    ? sessionStorage.getItem('alquimia_active_tenant_nombre') || ''
    : ''

  useEffect(() => {
    if (tenantNombre) {
      setMunicipio(tenantNombre)
      loadAnalytics(tenantNombre)
    }
  }, [tenantNombre])

  async function loadAnalytics(mun: string) {
    if (!mun) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `${getApiUrl()}/api/v1/municipios/${encodeURIComponent(mun)}/residue-analytics?days=30`,
        { headers: authHdr() }
      )

      if (!res.ok) {
        setError('No hay datos disponibles')
        setAnalytics(null)
        setLoading(false)
        return
      }

      const data = await res.json()
      setAnalytics(data)
    } catch (e) {
      console.error('Error loading analytics:', e)
      setError('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return <TrendingUp className="text-[#D97706]" size={16} />
    if (trend === 'decreasing') return <TrendingDown className="text-[#3B6D11]" size={16} />
    return <Activity className="text-[#1A5FA8]" size={16} />
  }

  const getTrendLabel = (trend: string) => {
    if (trend === 'increasing') return 'Aumentando'
    if (trend === 'decreasing') return 'Disminuyendo'
    return 'Estable'
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/hub" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Análisis de Residuos</h1>
          <p className="text-[13px] text-[#6B6760]">Tendencias y proyecciones municipales</p>
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      ) : error ? (
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-10 text-center">
          <p className="text-[13px] text-[#8E8980]">{error}</p>
          <p className="text-[12px] text-[#6B6760] mt-2">Necesitas registros de residuos para ver análisis</p>
          <Link href="/residue-recording" className="text-[12px] text-[#3B6D11] hover:underline mt-3 inline-block">
            Ir al registro de residuos →
          </Link>
        </div>
      ) : analytics ? (
        <div className="space-y-6">
          {/* Main metrics grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Promedio diario */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Promedio diario</p>
              <p className="text-[24px] font-bold text-[#3B6D11]">{analytics.media_tons_diarios.toFixed(2)}</p>
              <p className="text-[10px] text-[#6B6760]">toneladas</p>
            </div>

            {/* Proyección mensual */}
            <div className="rounded-[12px] border border-[#C9DDB1] bg-[#EAF3DE] p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#2D5409] mb-2">Proyección mensual</p>
              <p className="text-[24px] font-bold text-[#3B6D11]">{analytics.proyeccion_mes_tons.toFixed(2)}</p>
              <p className="text-[10px] text-[#2D5409]">toneladas</p>
            </div>

            {/* Días con datos */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Cobertura</p>
              <p className="text-[24px] font-bold text-[#1C1B18]">{analytics.dias_con_datos}</p>
              <p className="text-[10px] text-[#6B6760]">días reportados</p>
            </div>

            {/* Tendencia */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Tendencia</p>
              <div className="flex items-center gap-2">
                {getTrendIcon(analytics.tendencia)}
                <p className="text-[13px] font-semibold text-[#1C1B18]">{getTrendLabel(analytics.tendencia)}</p>
              </div>
            </div>
          </div>

          {/* Variability and changes */}
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Variabilidad */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Variabilidad</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-[#6B6760]">Desv. estándar</p>
                  <p className="text-[14px] font-bold text-[#1C1B18]">{analytics.desviacion_estandar.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6760]">Coef. variación</p>
                  <p className="text-[14px] font-bold text-[#1C4B8F]">{analytics.coef_variacion.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {/* Range */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Rango</p>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-[#6B6760]">Mínimo</p>
                  <p className="text-[14px] font-bold text-[#3B6D11]">{analytics.minimo_tons_diarios.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#6B6760]">Máximo</p>
                  <p className="text-[14px] font-bold text-[#D97706]">{analytics.maximo_tons_diarios.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Period changes */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Cambios</p>
              <div className="space-y-2">
                {analytics.cambio_semana_pct !== null && (
                  <div>
                    <p className="text-[10px] text-[#6B6760]">Semana vs semana ant.</p>
                    <p className={`text-[14px] font-bold ${analytics.cambio_semana_pct > 0 ? 'text-[#D97706]' : 'text-[#3B6D11]'}`}>
                      {analytics.cambio_semana_pct > 0 ? '+' : ''}{analytics.cambio_semana_pct.toFixed(1)}%
                    </p>
                  </div>
                )}
                {analytics.cambio_mes_pct !== null && (
                  <div>
                    <p className="text-[10px] text-[#6B6760]">Mes vs mes ant.</p>
                    <p className={`text-[14px] font-bold ${analytics.cambio_mes_pct > 0 ? 'text-[#D97706]' : 'text-[#3B6D11]'}`}>
                      {analytics.cambio_mes_pct > 0 ? '+' : ''}{analytics.cambio_mes_pct.toFixed(1)}%
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="rounded-[12px] border border-[#E8F0FB] bg-white p-4">
            <h2 className="text-[13px] font-semibold text-[#1C1B18] mb-3">Insights</h2>
            <div className="space-y-2 text-[12px] text-[#6B6760]">
              <p>
                • Tu municipio genera un promedio de <span className="font-semibold text-[#1C1B18]">{analytics.media_tons_diarios.toFixed(1)} tons/día</span>, con proyección mensual de <span className="font-semibold text-[#3B6D11]">{analytics.proyeccion_mes_tons.toFixed(0)} tons</span>
              </p>
              <p>
                • La tendencia es {getTrendLabel(analytics.tendencia).toLowerCase()}
                {analytics.cambio_semana_pct && ` (cambio de ${analytics.cambio_semana_pct > 0 ? '+' : ''}${analytics.cambio_semana_pct.toFixed(1)}% esta semana)`}
              </p>
              <p>
                • La variabilidad ({analytics.coef_variacion.toFixed(1)}%) indica {analytics.coef_variacion < 20 ? 'generación muy estable' : analytics.coef_variacion < 50 ? 'generación moderada' : 'fluctuaciones significativas'}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href="/residue-recording"
              className="flex-1 rounded-[8px] border border-[#3B6D11] bg-[#EAF3DE] px-3 py-2 text-[12px] font-semibold text-[#3B6D11] hover:bg-[#3B6D11] hover:text-white transition-colors text-center"
            >
              Registrar datos
            </Link>
            <button
              onClick={() => loadAnalytics(municipio)}
              className="flex-1 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] text-[#6B6760] hover:bg-[#F0EDE5] transition-colors"
            >
              Actualizar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default function ResidueAnalyticsPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <ResidueAnalyticsContent />
      </Suspense>
    </AppShell>
  )
}
