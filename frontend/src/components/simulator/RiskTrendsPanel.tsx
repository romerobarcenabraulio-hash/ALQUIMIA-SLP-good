'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { TrendscapeAxis, TrendscapeBaselineResponse, TrendscapeTrendItem } from '@/data/trendscapeBaseline'

// ─── Fórmulas documentadas por dimensión ─────────────────────────────────────

const RIESGO_DIMENSIONES = [
  {
    id: 'mercado',
    label: 'Riesgo de Mercado',
    ponderacion: 0.30,
    formula_aplicada: 'R_mercado = (1 − tasa_colocacion) × vol_ton_anual × precio_prom_mxn × 0.35',
    descripcion: 'Probabilidad de no colocar el material reciclable separado a precio razonable. La tasa de colocación de referencia es 85%; sin contrato confirmado se aplica el factor de descuento 0.35.',
    fuente_datos: 'Precios: investigación mercado secundario México 2025. Tasa colocación benchmarks: SEMARNAT evaluaciones programas municipales 2019–2024.',
  },
  {
    id: 'politico',
    label: 'Riesgo Político',
    ponderacion: 0.40,
    formula_aplicada: 'R_político = (n_actores_veto × 20) + (1 − madurez_normativa) × 30 + ciclo_político_penalidad',
    descripcion: 'Probabilidad de cancelación o paralización por factores políticos: cambio de administración, oposición de actores clave, conflicto de interés. Es la dimensión con mayor peso porque históricamente es la que más cancela programas exitosos técnicamente.',
    fuente_datos: 'Mapa de actores: modelo Proyecto Vivo. Cobertura normativa: módulo M02. Ciclo electoral: INE calendarios municipales.',
  },
  {
    id: 'operativo',
    label: 'Riesgo Operativo',
    ponderacion: 0.20,
    formula_aplicada: 'R_operativo = (slack_ruta_crítica < 4sem ? 40 : 0) + (capacidad_CA < 80% ? 30 : 0) + (tareas_sin_responsable / total) × 30',
    descripcion: 'Probabilidad de retraso por capacidad insuficiente: predios, flota, personal, licitaciones. El slack de la ruta crítica PERT es el indicador más sensible.',
    fuente_datos: 'Slack PERT: módulo planning. Capacidad CA: módulo infraestructura. RACI: plan maestro.',
  },
  {
    id: 'regulatorio',
    label: 'Riesgo Regulatorio',
    ponderacion: 0.10,
    formula_aplicada: 'R_regulatorio = (vacíos_jurídicos / 20) × 60 + (cobertura < 50% ? 40 : 20 × (0.85 − cobertura))',
    descripcion: 'Probabilidad de que vacíos normativos invaliden acciones del programa o expongan al municipio a responsabilidades legales. Se calcula desde los vacíos jurídicos del módulo M02.',
    fuente_datos: 'Vacíos jurídicos y cobertura normativa: módulo M02 / LGPGIR artículos clave (Art. 10, 17, 18, 19, 22, 25, 28, DOF 2022).',
  },
] as const

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

      {/* ── Panel de fórmulas documentadas ────────────────────────────── */}
      <section className="rounded-[12px] border border-[#D7E8C0] bg-[#F6FAEF] p-5 space-y-4">
        <div>
          <h3 className="font-serif text-[18px] text-[#1C1B18]">Cómo se calculan los riesgos</h3>
          <p className="text-[11px] text-[#5A6347] mt-1">
            Cada dimensión tiene una fórmula documentada. No hay scores sin respaldo — ALQUIMIA es analítico, no especulativo.
          </p>
        </div>

        {RIESGO_DIMENSIONES.map(dim => (
          <div key={dim.id} className="rounded-[10px] border border-[#E8E4DC] bg-white p-4 space-y-2">
            {/* Header con nombre y ponderación */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.07em] text-[#A8A49C]">Dimensión</p>
                <p className="font-semibold text-[13px] text-[#1C1B18]">{dim.label}</p>
              </div>
              <span className="shrink-0 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-[#EAF3DE] text-[#23470A]">
                peso {(dim.ponderacion * 100).toFixed(0)}%
              </span>
            </div>

            {/* Fórmula */}
            <div className="rounded-[7px] bg-[#1C1B18]/5 px-3 py-2 font-mono text-[10px] text-[#1C1B18] overflow-x-auto whitespace-pre">
              {dim.formula_aplicada}
            </div>

            {/* Descripción */}
            <p className="text-[11px] text-[#6B6760] leading-relaxed">{dim.descripcion}</p>

            {/* Fuente */}
            <p className="text-[9px] text-[#A8A49C] flex items-center gap-1">
              <span className="font-semibold text-[#8CAA7A]">Fuente:</span>
              {dim.fuente_datos}
            </p>
          </div>
        ))}

        {/* Score total */}
        <div className="rounded-[10px] border border-[#3B6D11]/25 bg-[#F0F7E8] px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.07em] text-[#8CAA7A] mb-1">Score total ponderado</p>
          <p className="font-mono text-[11px] text-[#1C1B18]">
            R_total = 0.30 × R_mercado + 0.40 × R_político + 0.20 × R_operativo + 0.10 × R_regulatorio
          </p>
          <div className="flex gap-3 mt-2 flex-wrap">
            {[
              { label: '0–24', nivel: 'Bajo', color: 'bg-emerald-100 text-emerald-800' },
              { label: '25–49', nivel: 'Medio', color: 'bg-amber-100 text-amber-800' },
              { label: '50–74', nivel: 'Alto', color: 'bg-orange-100 text-orange-800' },
              { label: '75–100', nivel: 'Crítico', color: 'bg-red-100 text-red-800' },
            ].map(s => (
              <span key={s.nivel} className={`text-[9px] font-semibold px-2 py-0.5 rounded ${s.color}`}>
                {s.label} → {s.nivel}
              </span>
            ))}
          </div>
        </div>

        <p className="text-[10px] text-[#A8A49C]">
          No sustituye dictamen jurídico ni estudio de campo; vincula el simulador a conversación de consultoría con riesgos explícitos.
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
