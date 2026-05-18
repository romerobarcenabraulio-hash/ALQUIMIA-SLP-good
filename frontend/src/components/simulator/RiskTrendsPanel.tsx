'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { TrendscapeAxis, TrendscapeBaselineResponse, TrendscapeTrendItem } from '@/data/trendscapeBaseline'

const AXIS_LABEL: Record<TrendscapeAxis, string> = {
  salud_publica: 'Salud pública',
  calidad_vida_urbana: 'Calidad de vida urbana',
  gestion_residuos: 'Gestión de residuos',
  agua_aire_suelo: 'Agua / aire / suelo',
  gobernanza: 'Gobernanza y transparencia',
}

function DirectionBadge({ d }: { d: TrendscapeTrendItem['direction'] }) {
  const cls =
    d === 'up'
      ? 'bg-amber-100 text-amber-900'
      : d === 'down'
        ? 'bg-emerald-100 text-emerald-900'
        : d === 'volatile'
          ? 'bg-violet-100 text-violet-900'
          : 'bg-[#E8E4DC] text-[#5C5740]'
  const lab = d === 'up' ? 'Sube presión' : d === 'down' ? 'Alivia' : d === 'volatile' ? 'Volátil' : 'Estable'
  return <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${cls}`}>{lab}</span>
}

export function RiskTrendsPanel() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<TrendscapeBaselineResponse | null>(null)
  const [upstreamJson, setUpstreamJson] = useState<string | null>(null)

  const territorio = useMemo(() => {
    if (municipiosActivos.length === 0) return `ZM ${zmActiva} (sin municipio activo todavía)`
    return `${municipiosActivos.length} municipio(s) activo(s) en ZM ${zmActiva}`
  }, [municipiosActivos.length, zmActiva])

  const municipiosKey = useMemo(() => municipiosActivos.join(','), [municipiosActivos])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const q = new URLSearchParams()
        q.set('zm', zmActiva)
        if (municipiosKey) q.set('municipios', municipiosKey)
        const res = await fetch(`/api/trendscape?${q.toString()}`)
        const data = (await res.json()) as TrendscapeBaselineResponse | { source: string; payload?: unknown }
        if (cancelled) return
        if ('trends' in data && data.source === 'alquimia_baseline') {
          setBaseline(data)
          setUpstreamJson(null)
        } else if ('payload' in data) {
          setBaseline(null)
          setUpstreamJson(JSON.stringify(data.payload, null, 2))
        } else {
          setError('Respuesta de tendencias no reconocida.')
        }
      } catch {
        if (!cancelled) setError('No se pudo cargar tendencias. Reintenta.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [zmActiva, municipiosKey])

  return (
    <div className="space-y-6">
      <section className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">S19 — Riesgos y tendencias</p>
        <h2 className="mt-1 font-serif text-[22px] text-[#1C1B18]">Estudio operativo y lectura de tendencias</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
          Alcance de lectura para análisis: <span className="font-medium text-[#1C1B18]">{territorio}</span>. Las decisiones
          formales por municipio conservan su propio trámite; la ZM no sustituye al ayuntamiento en actos de autoridad.
        </p>
      </section>

      <section className="rounded-[12px] border border-[#D7E8C0] bg-[#F6FAEF] p-5">
        <h3 className="font-serif text-[18px] text-[#1C1B18]">Registro orientativo de riesgos (sesión)</h3>
        <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-[#3D4A33]">
          <li>
            <span className="font-semibold text-[#23470A]">Operativo:</span> brecha entre toneladas capturables y infraestructura
            instalada o contratable bajo el marco vigente.
          </li>
          <li>
            <span className="font-semibold text-[#23470A]">Institucional:</span> coherencia entre reglamento de limpia, compras y
            obligaciones de trazabilidad documental.
          </li>
          <li>
            <span className="font-semibold text-[#23470A]">Mercado / valorización:</span> estabilidad de canales y precios
            sombra frente a volatilidad de insumos o cambios normativos.
          </li>
        </ul>
        <p className="mt-3 text-[11px] text-[#5A6347]">
          No sustituye dictamen jurídico ni estudio de campo; vincula el simulador a una conversación de consultoría con
          riesgos explícitos.
        </p>
      </section>

      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-serif text-[18px] text-[#1C1B18]">Tendencias externas agregadas</h3>
            <p className="mt-1 text-[12px] text-[#6B6760]">
              Limpieza urbana, salud pública, calidad de vida y gestión de residuos. Fuente según banner inferior.
            </p>
          </div>
          {loading && <p className="text-[12px] text-[#A8A49C]">Sincronizando…</p>}
        </div>
        {error && (
          <p className="mt-3 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">{error}</p>
        )}
        {!loading && baseline && (
          <>
            <p className="mt-3 text-[11px] text-[#A8A49C]">{baseline.nota_fuente}</p>
            <ul className="mt-4 space-y-4">
              {baseline.trends.map(t => (
                <li
                  key={t.id}
                  className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.05em] text-[#A8A49C]">
                        {AXIS_LABEL[t.axis]}
                      </p>
                      <p className="mt-1 font-medium text-[#1C1B18]">{t.title}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <DirectionBadge d={t.direction} />
                      <span className="rounded bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-medium text-[#23470A]">
                        RSU: {t.relevance_for_rsu}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">{t.summary}</p>
                </li>
              ))}
            </ul>
          </>
        )}
        {!loading && upstreamJson && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-medium text-[#5C5740]">Payload proveedor (JSON)</p>
            <pre className="max-h-[320px] overflow-auto rounded-[8px] border border-[#E8E4DC] bg-[#1C1B18]/5 p-3 text-[11px] leading-snug text-[#1C1B18]">
              {upstreamJson}
            </pre>
          </div>
        )}
      </section>
    </div>
  )
}
