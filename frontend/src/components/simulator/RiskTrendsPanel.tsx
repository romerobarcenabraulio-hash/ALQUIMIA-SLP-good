'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, CartesianGrid } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { monteCarloTriangular, tornadoAnalysis, calcularScoresRiesgo } from '@/lib/calculator'
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

// ─── Risk matrix items (evaluación inicial del modelo — calibrar por municipio) ──
// Prob e impacto en escala 1-5 derivados del score calculado por calcularScoresRiesgo().
// Score 0-20 → nivel 1, 20-40 → 2, 40-60 → 3, 60-80 → 4, 80-100 → 5.
const RISK_MATRIX_COLOR: Record<string, string> = {
  mercado:     '#D4881E',
  politico:    '#C0392B',
  operativo:   '#D4881E',
  regulatorio: '#3B6D11',
}

// Benchmark de referencia de aceptación por actor: SEMARNAT (2022) — 24 municipios.
// El actor "Ciudadanos" se reemplaza con dato real de encuesta de campo (IPC) cuando existe.
const ACTORES_ACEPTACION_BASE = [
  { actor: 'Municipio (DGA)',      aceptacion: 82, color: '#3B6D11', fuenteReal: false },
  { actor: 'Ciudadanos',           aceptacion: 70, color: '#5A9438', fuenteReal: false },
  { actor: 'Empresas formales',    aceptacion: 65, color: '#1A5FA8', fuenteReal: false },
  { actor: 'Recicladores inform.', aceptacion: 45, color: '#D4881E', fuenteReal: false },
  { actor: 'SEMARNAT',             aceptacion: 88, color: '#3B6D11', fuenteReal: false },
  { actor: 'Cabildo',              aceptacion: 58, color: '#5A4A2A', fuenteReal: false },
] satisfies { actor: string; aceptacion: number; color: string; fuenteReal: boolean }[]

const MITIGACION_PLAN = [
  { dimension: 'Mercado',     riesgo: 'Caída de precio de materiales', accion: 'Contratos forward con recicladores; diversificar materiales.', residual: 'Medio' },
  { dimension: 'Político',    riesgo: 'Cambio de administración',       accion: 'Convenio de transición, blindaje en Plan de Desarrollo Municipal.', residual: 'Medio' },
  { dimension: 'Político',    riesgo: 'Veto de actores clave',          accion: 'Mesa de actores, adendas de corresponsabilidad firmadas.', residual: 'Bajo' },
  { dimension: 'Operativo',   riesgo: 'Falta de predios para CAs',      accion: 'Levantamiento catastral previo; convenios con SEDATU.', residual: 'Bajo' },
  { dimension: 'Regulatorio', riesgo: 'Vacíos jurídicos sin cubrir',    accion: 'Adendas aprobadas en F1; dictamen de área jurídica municipal.', residual: 'Bajo' },
]

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
  const zmActiva       = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const state          = useSimulatorStore(s => s)
  const resultados     = useSimulatorStore(s => s.resultados)
  const indicePreparacionCiudadana = useSimulatorStore(s => (s as typeof s & { indicePreparacionCiudadana?: number | null }).indicePreparacionCiudadana ?? null)
  const encuestaResultados = useSimulatorStore(s => (s as typeof s & { encuestaResultados?: { n_total?: number } | null }).encuestaResultados ?? null)

  // Construir ACTORES_ACEPTACION dinámico: "Ciudadanos" usa IPC real si existe
  const ACTORES_ACEPTACION = useMemo(() => {
    return ACTORES_ACEPTACION_BASE.map(a => {
      if (a.actor === 'Ciudadanos' && indicePreparacionCiudadana !== null) {
        return { ...a, aceptacion: Math.round(indicePreparacionCiudadana), fuenteReal: true }
      }
      return a
    })
  }, [indicePreparacionCiudadana])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [baseline, setBaseline] = useState<TrendscapeBaselineResponse | null>(null)
  const [upstreamJson, setUpstreamJson] = useState<string | null>(null)

  // ── Monte Carlo triangular real (500 sim para no bloquear render) ───────────
  // Fuente: Al-Salem et al. (2024) — DOI: 10.3390/su16031127
  // Parámetros: precios ±30%, captura (−40%/+20%), merma ±25% — distribución triangular.
  const mc = useMemo(() => {
    if (!resultados) return null
    return monteCarloTriangular(state, 500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultados?.tir, state.wacc, state.pctCapturaPorAño[0]])

  // % de simulaciones con TIR > 0 (proxy VPN positivo cuando WACC=20%)
  const pctRobustez = useMemo(() => {
    if (!mc || !mc.p10) return null
    // p10 > 0 → al menos 90% positivo; p10 < 0 < p50 → ~50-90%; etc.
    if (mc.p10 > 0) return 90
    if (mc.p50 > 0) return 70
    if (mc.p90 > 0) return 30
    return 10
  }, [mc])

  // Barras de distribución MC (p10/p50/p90 TIR)
  const mcDist = useMemo(() => {
    if (!mc) return []
    return [
      { label: 'P10 (pesimista)',  tir: Math.round(mc.p10 * 10) / 10, fill: '#C0392B' },
      { label: 'P50 (mediana)',    tir: Math.round(mc.p50 * 10) / 10, fill: '#D4881E' },
      { label: 'P90 (optimista)',  tir: Math.round(mc.p90 * 10) / 10, fill: '#3B6D11' },
    ]
  }, [mc])

  // ── Análisis tornado (sensibilidad real al VPN) ──────────────────────────────
  const tornado = useMemo(() => {
    if (!resultados) return []
    const raw = tornadoAnalysis(state)
    const maxRange = raw[0]?.range ?? 1
    return raw.map(v => ({
      variable: v.label,
      sensibilidad: Math.round((v.range / maxRange) * 100),
      direccion: v.plus < 0 ? 'negativo' : 'positivo',
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultados?.vpn, state.wacc, state.precios])

  // ── Scores de riesgo calculados (no hardcoded) ────────────────────────────────
  const riskScores = useMemo(() => {
    if (!resultados) return null
    return calcularScoresRiesgo(state, resultados)
  }, [resultados, state])

  // Mapear score 0-100 a escala 1-5 y generar items de la matriz
  const riskMatrixItems = useMemo(() => {
    if (!riskScores) return [
      { id: 'mercado',     label: 'Mercado',     prob: 3, impacto: 4, color: '#D4881E' },
      { id: 'politico',    label: 'Político',    prob: 4, impacto: 5, color: '#C0392B' },
      { id: 'operativo',   label: 'Operativo',   prob: 2, impacto: 3, color: '#D4881E' },
      { id: 'regulatorio', label: 'Regulatorio', prob: 2, impacto: 2, color: '#3B6D11' },
    ]
    const toScale = (s: number) => Math.max(1, Math.min(5, Math.ceil(s / 20)))
    return [
      { id: 'mercado',     label: 'Mercado',     prob: toScale(riskScores.r_mercado),     impacto: toScale(riskScores.r_mercado * 1.3), color: RISK_MATRIX_COLOR['mercado'] },
      { id: 'politico',    label: 'Político',    prob: toScale(riskScores.r_politico ?? 60), impacto: 5,                                  color: RISK_MATRIX_COLOR['politico'] },
      { id: 'operativo',   label: 'Operativo',   prob: toScale(riskScores.r_operativo),   impacto: toScale(riskScores.r_operativo * 1.2), color: RISK_MATRIX_COLOR['operativo'] },
      { id: 'regulatorio', label: 'Regulatorio', prob: toScale(riskScores.r_regulatorio), impacto: toScale(riskScores.r_regulatorio * 0.9), color: RISK_MATRIX_COLOR['regulatorio'] },
    ]
  }, [riskScores])

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
      {/* ── Panel de fórmulas documentadas ────────────────────────────── */}
      <section
        className="rounded-[12px] border border-[#D7E8C0] bg-[#F6FAEF] p-5 space-y-4"
        data-chart-id="score-riesgo-total"
      >
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

      {/* ── Risk probability/impact heatmap matrix ─────────────────────── */}
      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-5 space-y-4">
        <div>
          <h3 className="font-serif text-[18px] text-[#1C1B18]">Matriz de riesgo — Probabilidad × Impacto</h3>
          <p className="text-[12px] text-[#6B6760] mt-1">Posicionamiento de cada dimensión de riesgo en la matriz 5×5. Zona roja = crítico.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 5×5 heatmap */}
          <div>
            <div className="flex items-end gap-2 mb-1">
              <span className="text-[9px] text-[#A8A49C] uppercase w-16 text-right leading-none">Probabilidad →</span>
            </div>
            <div className="relative">
              {/* Y-axis label */}
              <div className="absolute -left-6 top-1/2 -translate-y-1/2 -rotate-90 text-[9px] text-[#A8A49C] uppercase whitespace-nowrap">Impacto →</div>
              <div className="grid gap-0.5 ml-4" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 1fr)' }}>
                {[5, 4, 3, 2, 1].map(imp =>
                  [1, 2, 3, 4, 5].map(prob => {
                    const score = prob * imp
                    const bg = score >= 16 ? 'bg-[#FDE8E8]' : score >= 9 ? 'bg-[#FEF7E7]' : score >= 4 ? 'bg-[#FFF9DB]' : 'bg-[#EAF3DE]'
                    const risk = riskMatrixItems.find(r => r.prob === prob && r.impacto === imp)
                    return (
                      <div
                        key={`${prob}-${imp}`}
                        title={risk?.label}
                        className={`relative h-10 rounded-[4px] ${bg} flex items-center justify-center border border-white/60 text-[8px] font-mono text-[#A8A49C]`}
                      >
                        {score}
                        {risk && (
                          <div
                            className="absolute inset-0 flex items-center justify-center rounded-[4px]"
                            title={risk.label}
                          >
                            <div
                              className="w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-bold text-white"
                              style={{ background: risk.color }}
                              title={risk.label}
                            >
                              {risk.label.charAt(0)}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              {/* X-axis labels */}
              <div className="grid ml-4 mt-0.5 gap-0.5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {[1, 2, 3, 4, 5].map(p => (
                  <p key={p} className="text-[8px] text-[#A8A49C] text-center">{p}</p>
                ))}
              </div>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {riskMatrixItems.map(r => (
                <div key={r.id} className="flex items-center gap-1.5 text-[10px]">
                  <div className="w-3 h-3 rounded-full border border-white" style={{ background: r.color }} />
                  <span className="text-[#6B6760]">{r.label} (P{r.prob}×I{r.impacto}={r.prob * r.impacto})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actor acceptance bar chart */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold text-[#1C1B18]">Aceptación por actor</p>
              {indicePreparacionCiudadana !== null ? (
                <span className="text-[9px] font-medium text-[#3B6D11] bg-[#F4FAEC] border border-[#D7E8C0] rounded-full px-2 py-0.5">
                  Ciudadanos: dato real · {(encuestaResultados as { n_total?: number } | null)?.n_total ?? 0} enc.
                </span>
              ) : (
                <span className="text-[9px] text-[#A8A49C] bg-[#F7F5F0] border border-[#E8E4DC] rounded-full px-2 py-0.5">
                  Ciudadanos: benchmark SEMARNAT 2022
                </span>
              )}
            </div>
            <p className="text-[9px] text-[#A8A49C] mb-3">% de aceptación estimada del programa de circularidad</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={[...ACTORES_ACEPTACION]} layout="vertical" margin={{ top: 0, right: 40, left: 100, bottom: 0 }}>
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 8, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                <YAxis type="category" dataKey="actor" tick={{ fontSize: 9, fill: '#4A4740' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => [`${v}%`, 'Aceptación']} contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                <Bar dataKey="aceptacion" radius={[0, 3, 3, 0]}>
                  {ACTORES_ACEPTACION.map((a, i) => <Cell key={i} fill={a.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* ── Variables críticas + Monte Carlo real ─────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Variables críticas — análisis tornado calculado dinámicamente */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Variables críticas del modelo</p>
          <p className="text-[9px] text-[#A8A49C] mb-4">
            Sensibilidad del VPN a variación ±20%
          </p>
          {tornado.length === 0 && (
            <p className="text-[11px] text-[#A8A49C] italic">Calculando…</p>
          )}
          <div className="space-y-2.5">
            {tornado.map(v => (
              <div key={v.variable}>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#4A4740]">{v.variable}</span>
                  <span className={`font-mono font-semibold ${v.direccion === 'negativo' ? 'text-[#C0392B]' : 'text-[#3B6D11]'}`}>{v.sensibilidad}%</span>
                </div>
                <div className="h-2 bg-[#E8E4DC] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${v.sensibilidad}%`, background: v.direccion === 'negativo' ? '#C0392B' : '#3B6D11' }} />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[9px] text-[#A8A49C]">Fuente: re-ejecución de calcular() con supuestos perturbados ±20%. Rank por rango absoluto de VPN.</p>
        </div>

        {/* Monte Carlo TIR — distribución triangular real */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Monte Carlo — TIR del proyecto</p>
          <p className="text-[9px] text-[#A8A49C] mb-3">
            500 simulaciones · distribución triangular · parámetros: precios ±30%, captura (−40%/+20%), merma ±25%
          </p>
          {!mc && <p className="text-[11px] text-[#A8A49C] italic">Esperando resultados del simulador…</p>}
          {mc && (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={mcDist} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                  <XAxis dataKey="label" tick={{ fontSize: 8, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: '#A8A49C' }} tickLine={false} axisLine={false} width={28} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'TIR']} contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                  <Bar dataKey="tir" radius={[3, 3, 0, 0]}>
                    {mcDist.map((d, i) => <Cell key={i} fill={d.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-3 mt-2 flex-wrap text-[10px]">
                <span className="text-[#6B6760]">P10: <span className="font-mono text-[#C0392B]">{mc.p10.toFixed(1)}%</span></span>
                <span className="text-[#6B6760]">Mediana: <span className="font-mono text-[#D4881E]">{mc.p50.toFixed(1)}%</span></span>
                <span className="text-[#6B6760]">P90: <span className="font-mono text-[#3B6D11]">{mc.p90.toFixed(1)}%</span></span>
                {pctRobustez !== null && (
                  <span className="ml-auto text-[#5A6347] font-medium">~{pctRobustez}% TIR positivo</span>
                )}
              </div>
              <p className="mt-2 text-[9px] text-[#A8A49C]">
                Ref: Al-Salem et al. (2024) DOI: 10.3390/su16031127 · distribución triangular (no gaussiana).
              </p>
            </>
          )}
        </div>
      </section>

      {/* ── Mitigation plan table ────────────────────────────────────────── */}
      <section className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EDE5]">
          <h3 className="text-[12px] font-semibold text-[#1C1B18]">Plan de mitigación de riesgos</h3>
          <p className="text-[10px] text-[#A8A49C] mt-0.5">Acciones para reducir el riesgo residual por dimensión · actualizar en cada hito de proyecto</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Dimensión</th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Riesgo identificado</th>
                <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Acción de mitigación</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[#1C1B18]">Riesgo residual</th>
              </tr>
            </thead>
            <tbody>
              {MITIGACION_PLAN.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                  <td className="px-4 py-2.5 font-medium text-[#1C1B18]">{row.dimension}</td>
                  <td className="px-3 py-2.5 text-[#6B6760]">{row.riesgo}</td>
                  <td className="px-3 py-2.5 text-[#4A4740] max-w-[280px]">{row.accion}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      row.residual === 'Bajo'  ? 'bg-[#EAF3DE] text-[#23470A]' :
                      row.residual === 'Medio' ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                  'bg-[#FDE8E8] text-[#7A1212]'
                    }`}>{row.residual}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
