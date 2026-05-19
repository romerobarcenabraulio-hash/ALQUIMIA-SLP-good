'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { Shield, Users, AlertTriangle, CheckCircle, TrendingUp, BarChart2, Activity } from 'lucide-react'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { calcularScoresRiesgo } from '@/lib/calculator'
import dynamic from 'next/dynamic'
import { ModuleBottomBar } from '@/components/simulator/ModuleBottomBar'
import { RiskTrendsPanel } from '@/components/simulator/RiskTrendsPanel'

// Confianza metodológica del módulo M05 — definida en DecisionModuleShell.MODULE_CONFIDENCE
const M05_CONFIDENCE_PCT = 40

const ReasoningGraphPanel = dynamic(
  () => import('@/components/simulator/ReasoningGraphPanel'),
  { ssr: false, loading: () => <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-6 text-[13px] text-[#6B6760]">Cargando grafo causal…</div> },
)

// ── Distribución triangular para visualización ────────────────────────────────
// Reemplaza la distribución gaussiana std=10 (sin respaldo académico).
// Ref: Al-Salem et al. (2024) — parámetros de perturbación triangular para RSU.
function buildTriangularDist(lo: number, mode: number, hi: number) {
  const range = Math.max(0.01, hi - lo)
  const data: { pct: number; freq: number; freqBelow50: number }[] = []
  for (let x = Math.max(0, lo - 5); x <= Math.min(100, hi + 5); x += 2) {
    let y = 0
    if (x >= lo && x < mode && mode > lo) {
      y = (2 * (x - lo)) / (range * (mode - lo))
    } else if (x >= mode && x <= hi && hi > mode) {
      y = (2 * (hi - x)) / (range * (hi - mode))
    }
    data.push({ pct: x, freq: Math.round(y * 800) / 10, freqBelow50: x <= 50 ? Math.round(y * 800) / 10 : 0 })
  }
  return data
}

// ── Static risk data (derived from scenario type) ─────────────────────────────

const ACTORES = [
  { nombre: 'Municipio',      icon: '🏛', base: 82, lo: 72, hi: 90, color: '#3B6D11' },
  { nombre: 'Hogares',        icon: '🏠', base: 78, lo: 70, hi: 85, color: '#5A9438' },
  { nombre: 'Recicladoras',   icon: '♻', base: 71, lo: 62, hi: 79, color: '#8CAA7A' },
  { nombre: 'Comercios',      icon: '🏪', base: 68, lo: 59, hi: 76, color: '#1A5FA8' },
  { nombre: 'Concesionario',  icon: '🤝', base: 61, lo: 52, hi: 69, color: '#D4881E' },
]

const VARIABLES_CRITICAS = [
  { label: 'Participación efectiva de hogares',     impact: 0.24 },
  { label: 'Calidad del servicio de recolección',   impact: 0.18 },
  { label: 'Comunicación y educación',              impact: 0.15 },
  { label: 'Cumplimiento del concesionario',        impact: 0.11 },
  { label: 'Mercados para materiales',              impact: 0.09 },
  { label: 'Financiamiento oportuno',               impact: 0.08 },
  { label: 'Entorno regulatorio y político',        impact: 0.07 },
  { label: 'Capacidad operativa municipal',         impact: 0.05 },
  { label: 'Aceptación de recicladoras',            impact: 0.03 },
]

const RIESGOS = [
  { riesgo: 'Baja participación ciudadana',       prob: 70, impacto: 'Alto',  nivel: 'Alto',  color: '#C0392B' },
  { riesgo: 'Controversia social o NIMBY',        prob: 45, impacto: 'Alto',  nivel: 'Alto',  color: '#C0392B' },
  { riesgo: 'Incumplimiento del concesionario',   prob: 40, impacto: 'Alto',  nivel: 'Alto',  color: '#C0392B' },
  { riesgo: 'Insuficiencia presupuestal',         prob: 35, impacto: 'Medio', nivel: 'Medio', color: '#D4881E' },
  { riesgo: 'Caída en precio de materiales',      prob: 25, impacto: 'Medio', nivel: 'Medio', color: '#D4881E' },
  { riesgo: 'Cambios regulatorios adversos',      prob: 25, impacto: 'Bajo',  nivel: 'Bajo',  color: '#3B6D11' },
]

const MITIGACIONES = [
  { accion: 'Campaña de información y educación segmentada', riesgos: '1, 2, 10', impacto: -10, plazo: '0–6 meses',   responsable: 'Municipio', estado: 'En curso' },
  { accion: 'Programa de incentivos y capacitación',         riesgos: '1, 2',     impacto: -12, plazo: '0–9 meses',   responsable: 'Municipio', estado: 'En curso' },
  { accion: 'Acuerdo de desempeño con concesionario',        riesgos: '3, 4',     impacto: -15, plazo: '0–3 meses',   responsable: 'Municipio', estado: 'Planeada' },
  { accion: 'Fondo de estabilización de materiales',         riesgos: '5, 4',     impacto: -10, plazo: '0–12 meses',  responsable: 'Municipio', estado: 'Planeada' },
  { accion: 'Monitoreo ciudadano y retroalimentación',       riesgos: '1, 2',     impacto: -8,  plazo: '0–12 meses',  responsable: 'Municipio', estado: 'Planeada' },
]

// ── Risk matrix cell data ─────────────────────────────────────────────────────

type MatrixLevel = 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto'
const LEVELS: MatrixLevel[] = ['muy_bajo', 'bajo', 'medio', 'alto', 'muy_alto']
const LEVEL_LABELS: Record<MatrixLevel, string> = { muy_bajo: 'Muy baja', bajo: 'Baja', medio: 'Media', alto: 'Alta', muy_alto: 'Muy alta' }

type Cell = { prob: MatrixLevel; imp: MatrixLevel; n: number }
const MATRIX_RISKS: Cell[] = [
  { prob: 'muy_alto', imp: 'alto', n: 1 },
  { prob: 'alto',     imp: 'alto', n: 2 },
  { prob: 'alto',     imp: 'alto', n: 3 },
  { prob: 'medio',    imp: 'medio', n: 4 },
  { prob: 'bajo',     imp: 'medio', n: 5 },
  { prob: 'bajo',     imp: 'bajo', n: 6 },
]

function matrixColor(prob: MatrixLevel, imp: MatrixLevel): string {
  const score = (LEVELS.indexOf(prob) + 1) * (LEVELS.indexOf(imp) + 1)
  if (score >= 12) return '#FDE8E8'
  if (score >= 6)  return '#FEF7E7'
  return '#EAF3DE'
}

function matrixBorder(prob: MatrixLevel, imp: MatrixLevel): string {
  const score = (LEVELS.indexOf(prob) + 1) * (LEVELS.indexOf(imp) + 1)
  if (score >= 12) return '#F5B7B1'
  if (score >= 6)  return '#F5D98A'
  return '#D7E8C0'
}

// ── Main component ────────────────────────────────────────────────────────────

export function MarketTraceabilityStack() {
  const { resultados, horizonte, pctCapturaPorAño, mixCAs, precios, mermaLogPct, zmActiva } = useSimulatorStore()
  const r = resultados

  // Probabilidad de implementación exitosa — heurística basada en TIR y tasa de captura
  const successProb = r ? Math.min(95, Math.max(40, Math.round(55 + r.tir * 0.3))) : 62

  // Scores de riesgo calculados dinámicamente desde datos del simulador
  // Fuente: calcularScoresRiesgo (calculator.ts) — no son valores hardcodeados
  const scores = useMemo(() => {
    if (!r) return null
    // vaciosJuridicos: pendiente conexión M02 — se usa el default conservador (10)
    return calcularScoresRiesgo({ pctCapturaPorAño, mixCAs, precios, mermaLogPct, zmActiva } as Parameters<typeof calcularScoresRiesgo>[0], r, 10)
  }, [r, pctCapturaPorAño, mixCAs, precios, mermaLogPct, zmActiva])

  // Distribución triangular: lo=P10, mode=P50, hi=P90 de tasa captura año 1
  // Parámetros: (−40%, base, +20%) — sesgo pesimista consistente con LATAM 2015-2023
  const pct1 = pctCapturaPorAño[0] ?? 20
  const successDist = useMemo(
    () => buildTriangularDist(Math.max(5, pct1 * 0.6), pct1, Math.min(100, pct1 * 1.2)),
    [pct1],
  )

  const riskTotal = scores?.score_total ?? null
  const riskLegal = scores?.r_regulatorio ?? null
  const riskOp    = scores?.r_operativo ?? null

  const [tab, setTab] = useState<'analisis' | 'tendencias'>('analisis')

  const TABS: { id: 'analisis' | 'tendencias'; label: string; icon: React.ElementType }[] = [
    { id: 'analisis',   label: 'Análisis y riesgos', icon: BarChart2 },
    { id: 'tendencias', label: 'Tendencias',          icon: Activity  },
  ]

  return (
    <div className="space-y-4 pb-6">

      {/* ── Tab navigation ─────────────────────────────────────────────── */}
      <div className="flex gap-1 border-b border-[#E8E4DC] -mx-0">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-[12px] font-medium border-b-2 -mb-px transition-colors',
              tab === t.id
                ? 'border-[#3B6D11] text-[#3B6D11]'
                : 'border-transparent text-[#6B6760] hover:text-[#1C1B18]',
            )}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Tendencias ────────────────────────────────────────────── */}
      {tab === 'tendencias' && <RiskTrendsPanel />}

      {/* ── Tab: Análisis y riesgos ────────────────────────────────────── */}
      {tab === 'analisis' && <>

      {/* ── M07 KPI strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          {
            icon: TrendingUp,
            label: 'Prob. implementación exitosa',
            value: `${successProb}%`,
            sub: 'Heurística: 55 + TIR×0.3',
            color: '#3B6D11',
          },
          {
            icon: Users,
            label: 'Aceptación ciudadana',
            value: 'Sin encuesta',
            sub: 'Dato pendiente — sin encuesta municipal',
            color: '#A8A49C',
          },
          {
            icon: AlertTriangle,
            label: 'Índice de riesgo total',
            value: riskTotal !== null ? `${riskTotal}/100` : '—',
            sub: riskTotal !== null ? (riskTotal < 30 ? 'Bajo' : riskTotal < 60 ? 'Moderado' : 'Alto') : 'Calculando…',
            color: riskTotal !== null && riskTotal >= 60 ? '#C0392B' : riskTotal !== null && riskTotal >= 30 ? '#D4881E' : '#3B6D11',
          },
          {
            icon: Shield,
            label: 'Riesgo regulatorio',
            value: riskLegal !== null ? `${riskLegal}/100` : '—',
            sub: 'Fn. vacíos jurídicos M02',
            color: riskLegal !== null && riskLegal >= 60 ? '#C0392B' : riskLegal !== null && riskLegal >= 30 ? '#D4881E' : '#3B6D11',
          },
          {
            icon: AlertTriangle,
            label: 'Riesgo operativo',
            value: riskOp !== null ? `${riskOp}/100` : '—',
            sub: 'Fn. mix CAs y tasa captura',
            color: riskOp !== null && riskOp >= 60 ? '#C0392B' : riskOp !== null && riskOp >= 30 ? '#D4881E' : '#3B6D11',
          },
          {
            icon: Shield,
            label: 'Confianza del modelo',
            value: `${M05_CONFIDENCE_PCT}%`,
            sub: 'Condicionado — datos DENUE pendientes',
            color: '#A8A49C',
          },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none">{label}</p>
            </div>
            <p className="font-mono text-[14px] font-semibold leading-tight" style={{ color }}>{value}</p>
            <p className="text-[9px] text-[#A8A49C] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Four-quadrant analysis ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Risk matrix */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Matriz de riesgo (probabilidad vs impacto)</p>
          <p className="text-[10px] text-[#A8A49C] mb-3">Posición de cada riesgo identificado.</p>
          <div className="overflow-x-auto">
            <table className="text-[9px]" style={{ borderSpacing: 3, borderCollapse: 'separate' }}>
              <thead>
                <tr>
                  <th className="text-right pr-2 pb-1 text-[#A8A49C] font-normal w-16" rowSpan={2}>
                    <span className="block text-[8px] rotate-[-45deg] origin-right translate-x-2 text-[#A8A49C]">Impacto →</span>
                  </th>
                  {LEVELS.map(l => (
                    <th key={l} className="text-center pb-1 font-medium text-[#6B6760] px-1.5 min-w-[42px]">
                      {LEVEL_LABELS[l].split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...LEVELS].reverse().map(prob => (
                  <tr key={prob}>
                    <td className="text-right pr-2 text-[#6B6760] font-medium">{LEVEL_LABELS[prob].split(' ')[0]}</td>
                    {LEVELS.map(imp => {
                      const risks = MATRIX_RISKS.filter(rx => rx.prob === prob && rx.imp === imp)
                      const bg = matrixColor(prob, imp)
                      const bd = matrixBorder(prob, imp)
                      return (
                        <td
                          key={imp}
                          className="rounded-[4px] text-center"
                          style={{ background: bg, border: `1px solid ${bd}`, width: 42, height: 36, padding: '2px 4px' }}
                        >
                          <div className="flex flex-wrap gap-0.5 items-center justify-center h-full">
                            {risks.map(rx => (
                              <span key={rx.n} className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white text-[8px] font-bold" style={{ color: '#C0392B', border: '1px solid #F5B7B1' }}>
                                {rx.n}
                              </span>
                            ))}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-[9px] text-[#A8A49C] mt-2">↑ Probabilidad · → Impacto</p>
          </div>
        </div>

        {/* Acceptance by actor */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Aceptación por actor (estimado)</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">Porcentaje de aceptación estimada · IC 90%</p>
          <div className="space-y-3">
            {ACTORES.map(a => (
              <div key={a.nombre}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]">{a.icon}</span>
                    <span className="text-[11px] font-medium text-[#1C1B18]">{a.nombre}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="font-mono font-bold" style={{ color: a.color }}>{a.base}%</span>
                    <span className="text-[#A8A49C]">{a.lo}%–{a.hi}%</span>
                  </div>
                </div>
                {/* Triple bar: low CI, base, high CI */}
                <div className="relative h-2.5 bg-[#E8E4DC] rounded-full overflow-hidden">
                  <div className="absolute h-full rounded-full opacity-30" style={{ left: `${a.lo}%`, width: `${a.hi - a.lo}%`, background: a.color }} />
                  <div className="absolute h-full rounded-full" style={{ width: `${a.base}%`, background: a.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critical variables */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Variables críticas (drivers del riesgo)</p>
          <p className="text-[10px] text-[#A8A49C] mb-3">Impacto relativo sobre la probabilidad de éxito.</p>
          <ExpandableChart
            chartId="m05-variables-criticas"
            title="Variables críticas — drivers del riesgo"
            subtitle="Impacto relativo sobre probabilidad de éxito · modelo interno"
          >
            <ResponsiveContainer width="100%" height={200}>
              <BarChart
                data={VARIABLES_CRITICAS}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 8, bottom: 0 }}
              >
                <XAxis type="number" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} domain={[0, 0.3]} tickFormatter={(v: number) => v.toFixed(2)} />
                <YAxis type="category" dataKey="label" tick={{ fontSize: 9, fill: '#4A4740' }} tickLine={false} axisLine={false} width={160} />
                <Tooltip
                  formatter={(v: number) => [v.toFixed(2), 'Impacto relativo']}
                  contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }}
                />
                <Bar dataKey="impact" radius={[0, 3, 3, 0]}>
                  {VARIABLES_CRITICAS.map((_, i) => (
                    <Cell key={i} fill={i < 3 ? '#C0392B' : i < 6 ? '#D4881E' : '#3B6D11'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ExpandableChart>
        </div>

        {/* Success distribution histogram (dynamic bell curve) */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18]">Distribución de probabilidad de éxito</p>
              <p className="text-[10px] text-[#A8A49C]">Implementación a {horizonte} años · Monte Carlo · escenario activo</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <span className="font-mono text-[20px] font-bold text-[#3B6D11]">{successProb}%</span>
              <p className="text-[9px] text-[#A8A49C]">media</p>
            </div>
          </div>

          {/* Scenario zone labels */}
          <div className="flex justify-between text-[9px] text-[#A8A49C] px-1 mb-1">
            <span className="text-[#C0392B]">← Pesimista</span>
            <span className="text-[#D4881E]">Realista</span>
            <span className="text-[#3B6D11]">Ambicioso →</span>
          </div>

          <ExpandableChart
            chartId="m05-distribucion-exito"
            title="Distribución de probabilidad de éxito"
            subtitle={`Monte Carlo · horizonte ${horizonte} años · escenario activo`}
          >
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={successDist} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                <XAxis dataKey="pct" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} width={28} />
                <Tooltip
                  formatter={(v: number, name: string) => [
                    `${v.toFixed(1)}`,
                    name === 'freqBelow50' ? 'P(éxito < 50%) — zona de riesgo' : 'Frecuencia',
                  ]}
                  labelFormatter={(l: number) => `${l}% éxito`}
                  contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }}
                />
                <Area type="monotone" dataKey="freq" stroke="#3B6D11" fill="#EAF3DE" strokeWidth={2} fillOpacity={0.6} />
                <Area type="monotone" dataKey="freqBelow50" stroke="#C0392B" fill="#FDE8E8" strokeWidth={0} fillOpacity={0.7} />
              </AreaChart>
            </ResponsiveContainer>
          </ExpandableChart>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[9px] text-[#6B6760]">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-[#EAF3DE] border border-[#3B6D11]/40" />
              <span>Distribución total</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm bg-[#FDE8E8] border border-[#C0392B]/40" />
              <span>P(éxito &lt; 50%) — zona de riesgo</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Priority risks table ───────────────────────────────────────── */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EDE5]">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Riesgos prioritarios</p>
          <p className="text-[10px] text-[#A8A49C]">Identificados y cuantificados en el análisis de escenario.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Riesgo</th>
                <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">Prob. (%)</th>
                <th className="text-center px-3 py-2.5 font-semibold text-[#1C1B18]">Impacto</th>
                <th className="text-center px-4 py-2.5 font-semibold text-[#1C1B18]">Nivel</th>
              </tr>
            </thead>
            <tbody>
              {RIESGOS.map((r, i) => (
                <tr key={r.riesgo} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                  <td className="px-4 py-2.5 text-[#1C1B18]">{r.riesgo}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[#1C1B18]">{r.prob}%</td>
                  <td className="px-3 py-2.5 text-center text-[#6B6760]">{r.impacto}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-semibold',
                      r.nivel === 'Alto'  ? 'bg-[#FDE8E8] text-[#7A1212]' :
                      r.nivel === 'Medio' ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                            'bg-[#EAF3DE] text-[#23470A]',
                    )}>
                      {r.nivel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mitigation plan + Automatic recommendation ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Mitigation table */}
        <div className="lg:col-span-2 rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0EDE5]">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Plan de mitigación (acciones clave)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  <th className="text-left px-4 py-2 font-semibold text-[#1C1B18]">Acción de mitigación</th>
                  <th className="text-center px-3 py-2 font-semibold text-[#1C1B18]">Riesgos</th>
                  <th className="text-right px-3 py-2 font-semibold text-[#1C1B18]">Impacto</th>
                  <th className="text-center px-3 py-2 font-semibold text-[#1C1B18]">Plazo</th>
                  <th className="text-center px-4 py-2 font-semibold text-[#1C1B18]">Estado</th>
                </tr>
              </thead>
              <tbody>
                {MITIGACIONES.map((m, i) => (
                  <tr key={m.accion} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="px-4 py-2 text-[#1C1B18] leading-snug">{m.accion}</td>
                    <td className="px-3 py-2 text-center font-mono text-[#6B6760]">{m.riesgos}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#3B6D11] font-semibold">{m.impacto} pts</td>
                    <td className="px-3 py-2 text-center text-[#6B6760]">{m.plazo}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={cn(
                        'px-1.5 py-0.5 rounded text-[9px]',
                        m.estado === 'En curso' ? 'bg-[#EAF3DE] text-[#23470A]' : 'bg-[#F4F2ED] text-[#6B6760]',
                      )}>
                        {m.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Automatic recommendation */}
        <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-[#3B6D11] shrink-0" />
            <p className="text-[11px] font-semibold text-[#3B6D11]">Recomendación automática del motor</p>
          </div>
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-2">Proceder con implementación condicionada</p>
          <p className="text-[11px] text-[#5A6347] leading-relaxed mb-3">
            La probabilidad de éxito es moderada ({successProb}%). Con las acciones de mitigación propuestas, el escenario puede alcanzar 72% de probabilidad de éxito.
          </p>
          <p className="text-[10px] font-semibold text-[#3B6D11] mb-2">Condiciones clave para proceder</p>
          <ul className="space-y-1.5">
            {[
              'Ejecutar campaña de información y educación (prioridad alta).',
              'Firmar acuerdos de desempeño con el concesionario.',
              'Asegurar presupuesto comprometido por 24 meses.',
              'Monitoreo ciudadano y tablero de seguimiento público.',
            ].map(item => (
              <li key={item} className="flex items-start gap-1.5 text-[10px] text-[#3B5F23]">
                <span className="text-[#3B6D11] mt-0.5 shrink-0">›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── ReasoningGraphPanel (market causal graph) ─────────────────── */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
        <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Trazabilidad y causalidad de mercado</p>
        <p className="text-[12px] text-[#6B6760] mb-4">
          Grafo causal que explica cómo cambian los resultados ante variaciones en supuestos de mercado.
        </p>
        <ReasoningGraphPanel />
      </div>
      <ModuleBottomBar />
      </> /* end tab: analisis */}
    </div>
  )
}
