'use client'

import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { Check, TrendingUp, Leaf, Heart, Users, Truck, ChevronDown } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { PRESETS_TRAYECTORIA, TRAJECTORY_UI, RSU_SEMARNAT, PRECIOS_RANGO } from '@/lib/constants'
import { fmt, cn, MATERIAL_LABELS } from '@/lib/utils'
import { getMunicipalNarrative } from '@/data/municipalNarratives'
import { MATERIAL_PRICE_RESEARCH } from '@/data/materialPriceResearch'
import type { MaterialPriceResearch } from '@/data/materialPriceResearch'
import type { PreciosMaterial } from '@/types'
import {
  getInegiHousingDistribution,
  getOperationalHousingSegments,
} from '@/lib/viviendaInegi'
import { ResearchCompletenessBar } from '@/components/simulator/ResearchCompletenessBar'
import { ImpactScenariosPanel } from '@/components/simulator/ImpactScenariosPanel'
import { BaselineImpactoAmbientalSection } from '@/components/simulator/stacks/BaselineImpactoAmbientalSection'
import { ChartPanel } from '@/components/ui/ChartPanel'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'
import {
  CHART_AXIS_TICK,
  CHART_GRID,
  CHART_TOOLTIP_STYLE,
} from '@/lib/chartTheme'

// ── Helpers ───────────────────────────────────────────────────────────────────

function interpolatePreset(presetId: string, horizonte: number): number[] {
  const preset = PRESETS_TRAYECTORIA[presetId]
  if (!preset) return Array(horizonte + 1).fill(0) as number[]
  const años = preset.años
  return Array.from({ length: horizonte + 1 }, (_, yr) => {
    if (yr === 0) return 0
    const t = yr / horizonte
    const raw = t * (años.length - 1)
    const lo = Math.floor(raw)
    const hi = Math.min(lo + 1, años.length - 1)
    const frac = raw - lo
    return Math.round(((años[lo] ?? 0) * (1 - frac) + (años[hi] ?? 0) * frac) * 10) / 10
  })
}

function buildTrajectoryFromStore(pctArr: number[], horizonte: number) {
  return Array.from({ length: horizonte + 1 }, (_, yr) => {
    if (yr === 0) return { año: yr, captura: 0 }
    const t = yr / horizonte
    const raw = t * (pctArr.length - 1)
    const lo = Math.floor(raw)
    const hi = Math.min(lo + 1, pctArr.length - 1)
    const frac = raw - lo
    const captura = Math.round(((pctArr[lo] ?? 0) * (1 - frac) + (pctArr[hi] ?? 0) * frac) * 10) / 10
    return { año: yr, captura }
  })
}

// ── Recommendation constants ──────────────────────────────────────────────────

const RECO_BY_HORIZON: Record<number, { presetId: string; label: string; reason: string }> = {
  3:  { presetId: 'Agresivo',    label: 'Ambicioso',   reason: 'Horizonte corto — maximiza impacto visible, velocidad de recuperación y legitimidad política.' },
  4:  { presetId: 'Agresivo',    label: 'Ambicioso',   reason: 'Horizonte corto — maximiza impacto visible, velocidad de recuperación y legitimidad política.' },
  5:  { presetId: 'Agresivo',    label: 'Ambicioso',   reason: 'Ventana TIR/CAPEX óptima: la mejor relación costo-beneficio se logra antes del año 5.' },
  6:  { presetId: 'Realista',    label: 'Moderado',    reason: 'Escalado progresivo sin sobrecargar el CAPEX inicial; riesgo político acotado.' },
  7:  { presetId: 'Realista',    label: 'Moderado',    reason: 'Escalado progresivo sin sobrecargar el CAPEX inicial; riesgo político acotado.' },
  10: { presetId: 'Realista',    label: 'Moderado',    reason: 'Escalado progresivo sin sobrecargar el CAPEX inicial; riesgo político acotado.' },
  15: { presetId: 'Conservador', label: 'Conservador', reason: 'Horizonte largo reduce riesgo político-operativo; la adopción gradual es más sostenible.' },
}

// ── Price context helper ──────────────────────────────────────────────────────

function priceContext(value: number, r: MaterialPriceResearch) {
  if (value < r.min)
    return { label: `Por debajo del mínimo documentado ($${r.min}/kg) · ${r.verdict}`, cls: 'text-[#D4881E]', dot: 'bg-[#D4881E]' }
  if (value > r.max)
    return { label: `Por encima del máximo ($${r.max}/kg) · ${r.verdict}`, cls: 'text-[#C0392B]', dot: 'bg-[#C0392B]' }
  return { label: `Rango: $${r.min}–$${r.max}/kg · Mediana $${r.median}/kg`, cls: 'text-[#3B6D11]', dot: 'bg-[#3B6D11]' }
}

const MATERIALS: Array<keyof PreciosMaterial> = ['pet', 'hdpe', 'papel', 'vidrio', 'aluminio', 'organico']

const MATERIAL_LABEL: Record<keyof PreciosMaterial, string> = {
  pet:      'PET',
  hdpe:     'HDPE',
  papel:    'Papel / cartón',
  vidrio:   MATERIAL_LABELS.vidrio,
  aluminio: MATERIAL_LABELS.aluminio,
  organico: 'Orgánicos',
}

type SourceConfidence = 'inegi' | 'bibliography' | 'assumption'

const CONFIDENCE_STYLE: Record<SourceConfidence, { dot: string; text: string; label: string }> = {
  inegi:        { dot: 'bg-[#3B6D11]', text: 'text-[#3B6D11]', label: 'INEGI' },
  bibliography: { dot: 'bg-[#D4881E]', text: 'text-[#D4881E]', label: 'Bibliografía' },
  assumption:   { dot: 'bg-[#A8A49C]', text: 'text-[#6B6760]', label: 'Supuesto editorial' },
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BlockLabel({ n, title, source }: { n: string; title: string; source?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <h3 className="text-[12px] font-semibold text-[#1C1B18]">
        <span className="font-mono text-[#3B6D11] mr-1">{n}.</span>{title}
      </h3>
      {source && (
        <span className="shrink-0 text-[8px] uppercase tracking-[0.06em] text-[#A8A49C] border border-[#E8E4DC] rounded-full px-2 py-0.5">
          {source}
        </span>
      )}
    </div>
  )
}

function PercentSlider({
  id, label, value, onChange,
  min = 0, max = 100, step = 5,
  suffix = '%', display, source, confidence = 'assumption',
}: {
  id: string; label: string; value: number; onChange: (n: number) => void
  min?: number; max?: number; step?: number; suffix?: string; display?: string
  source?: string; confidence?: SourceConfidence
}) {
  const shown = display ?? `${value.toFixed(step < 1 ? 1 : 0)}${suffix}`
  const cs = CONFIDENCE_STYLE[confidence]
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className="text-[11px] font-medium text-[#1C1B18] leading-snug">{label}</label>
        <span className="font-mono text-[12px] font-semibold text-[#3B6D11] shrink-0">{shown}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[#3B6D11]"
      />
      {source && (
        <p className={cn('mt-1 flex items-center gap-1 text-[9px] leading-snug', cs.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cs.dot)} />
          <span>{cs.label} · {source}</span>
        </p>
      )}
    </div>
  )
}

function KpiStrip({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string; sub: string; accent: string
}) {
  return (
    <div className="flex items-center gap-2 rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 min-w-0">
      <Icon className="w-3 h-3 shrink-0" style={{ color: accent }} strokeWidth={2} />
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-[0.05em] text-[#A8A49C] leading-none truncate">{label}</p>
        <p className="font-mono text-[13px] font-semibold leading-tight truncate" style={{ color: accent }}>{value}</p>
        <p className="text-[9px] text-[#A8A49C] leading-none truncate">{sub}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CityBaselineStack() {
  const {
    resultados,
    resultadosSinPrograma,
    horizonte,
    setHorizonte,
    genPercapita,
    setGenPercapita,
    zmActiva,
    municipiosActivos,
    tiposVivienda,
    toggleTipoVivienda,
    seleccionMunicipioCatalog,
    presetTrayectoria,
    pctCapturaPorAño,
    setPreset,
    viviendaCondominioPct,
    setViviendaCondominioPct,
    setViviendaNoCondominioPct,
    viviendaCondominioDepartamentoPct,
    setViviendaCondominioDepartamentoPct,
    ocupantesPorViviendaEscenario,
    setOcupantesPorViviendaEscenario,
    setCasaViaPublicaPct,
    mermaPctPorMaterial,
    setMermaMaterialPct,
    costoDisposicionActivo,
    setCostoDisposicionActivo,
    costoDisposicionPorTon,
    setCostoDisposicionPorTon,
    precios,
    setPrecio,
  } = useSimulatorStore()

  const r = resultados
  const narrative = getMunicipalNarrative(zmActiva, municipiosActivos)

  // ── Housing distribution ─────────────────────────────────────────────────────
  const distribution = getInegiHousingDistribution(zmActiva, municipiosActivos)
  const operationalSegments = getOperationalHousingSegments(zmActiva, tiposVivienda)
  const ocupantesBase = distribution?.stateAvgOccupants2020 ?? 3.6
  const ocupantesEscenario = ocupantesPorViviendaEscenario ?? ocupantesBase
  const viviendaNoCondominioPct = 100 - viviendaCondominioPct
  const casaViaPublicaPct = useSimulatorStore(s => (s as typeof s & { casaViaPublicaPct?: number }).casaViaPublicaPct ?? 70)
  const viviendaCondominioCasaPct = 100 - viviendaCondominioDepartamentoPct
  const viviendasActivas = r?.vivActivas ?? distribution?.stateOccupiedDwellings2020 ?? 0
  const capturaBasePct = pctCapturaPorAño[Math.max(0, Math.min(horizonte - 1, pctCapturaPorAño.length - 1))] ?? 70
  const pagoEvitableAnual = r ? r.ahorroDisposicion / Math.max(1, horizonte) : 0

  // ── Trajectory data ──────────────────────────────────────────────────────────
  const trajectoryData = useMemo(() => buildTrajectoryFromStore(pctCapturaPorAño, horizonte), [pctCapturaPorAño, horizonte])
  const capturaFinal = trajectoryData[trajectoryData.length - 1]?.captura ?? 0
  const activeUI = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)

  // ── Impact lines: year-by-year for all 4 trajectories ────────────────────────
  const impactLines = useMemo(() => {
    if (!r) return null
    const rsuTonDia = r.rsuTotalTonDia
    const cf = Math.max(capturaFinal, 1)
    const capTonDia = cf / 100 * rsuTonDia
    const co2eRate  = capTonDia > 0 ? r.co2eEvitadasAnualTon / (capTonDia * 365) : 0
    const ingrRate  = capTonDia > 0 ? (r.ingresosBrutos / Math.max(1, horizonte)) / (capTonDia * 365) : 0
    const saludRate = capTonDia > 0 ? r.ahorroSalud / (capTonDia * 365) : 0
    const trajs = TRAJECTORY_UI.map(s => ({ ...s, captures: interpolatePreset(s.presetId, horizonte) }))
    const acc: Record<string, { co2e: number; derr: number; salud: number }> = {}
    trajs.forEach(t => { acc[t.label] = { co2e: 0, derr: 0, salud: 0 } })
    const captChartData: Record<string, number>[] = []
    const coChartData:   Record<string, number>[] = []
    const derrChartData: Record<string, number>[] = []
    const saludChartData: Record<string, number>[] = []
    for (let yr = 0; yr <= horizonte; yr++) {
      const cp: Record<string, number> = { año: yr }
      const co: Record<string, number> = { año: yr }
      const de: Record<string, number> = { año: yr }
      const sa: Record<string, number> = { año: yr }
      trajs.forEach(t => {
        const capPct = t.captures[yr] ?? 0
        cp[t.label] = capPct
        const a = acc[t.label] ?? { co2e: 0, derr: 0, salud: 0 }
        if (yr > 0) {
          const tons = capPct / 100 * rsuTonDia * 365
          a.co2e  += tons * co2eRate
          a.derr  += tons * ingrRate
          a.salud += tons * saludRate
        }
        co[t.label] = Math.round(a.co2e / 1000)
        de[t.label] = Math.round(a.derr / 1_000_000)
        sa[t.label] = Math.round(a.salud / 1_000_000)
      })
      captChartData.push(cp)
      coChartData.push(co)
      derrChartData.push(de)
      saludChartData.push(sa)
    }
    return { captChartData, coChartData, derrChartData, saludChartData, trajs }
  }, [r, horizonte, capturaFinal])

  // ── Recommendation engine ────────────────────────────────────────────────────
  const motorRecomendacion = useMemo(() => {
    if (!r) return null
    const hint = RECO_BY_HORIZON[horizonte] ?? RECO_BY_HORIZON[7]!
    const isOptimal = presetTrayectoria === hint.presetId
    const activeLabel = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)?.label ?? presetTrayectoria
    const reco = TRAJECTORY_UI.find(t => t.presetId === hint.presetId)
    const capActiva = interpolatePreset(presetTrayectoria, horizonte)[horizonte] ?? 0
    const capReco   = interpolatePreset(hint.presetId, horizonte)[horizonte] ?? 0
    const capBrecha = capReco - capActiva
    const derrAnual = r.ingresosBrutos / Math.max(1, horizonte)
    const derrDelta = capActiva > 0 ? derrAnual * (capBrecha / Math.max(capActiva, 1)) : 0
    return { isOptimal, activeLabel, hint, reco, capBrecha, derrDelta }
  }, [r, horizonte, presetTrayectoria])

  // ── Comparison table ─────────────────────────────────────────────────────────
  const comparisonTable = useMemo(() => {
    const baseCaptura = interpolatePreset('Realista', horizonte)[horizonte] ?? 1
    return TRAJECTORY_UI.map(s => {
      const traj = interpolatePreset(s.presetId, horizonte)
      const captura = traj[horizonte] ?? 0
      const ratio = baseCaptura > 0 ? captura / baseCaptura : 0
      const valoracion = captura >= 80 ? 'Excelente' : captura >= 50 ? 'Óptimo' : captura >= 30 ? 'Viable' : 'Insuficiente'
      return {
        label: s.label,
        color: s.color,
        presetId: s.presetId,
        captura,
        co2e:   r ? Math.round(r.co2eEvitadasAnualTon * ratio / 1000)   : null,
        derrama: r ? Math.round(r.ingresosBrutos * ratio / 1_000_000)    : null,
        salud:  r ? Math.round(r.ahorroSalud * ratio / 1_000_000)       : null,
        valoracion,
      }
    })
  }, [horizonte, r])

  // ── Comparative lines (multi-trajectory) ────────────────────────────────────
  const comparativeLines = useMemo(() =>
    Array.from({ length: horizonte + 1 }, (_, yr) => {
      const point: Record<string, number> = { año: yr }
      for (const s of TRAJECTORY_UI) {
        const traj = interpolatePreset(s.presetId, horizonte)
        point[s.label] = traj[yr] ?? 0
      }
      return point
    }), [horizonte])

  return (
    <div className="space-y-4 pb-6">

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2" data-chart-id="volumen-rsu">
        <KpiStrip icon={Truck}     label="RSU generado"  value={r ? fmt.kgd(r.rsuTotalTonDia) : '—'}                              sub="diario estimado"        accent="#3B6D11" />
        <KpiStrip icon={TrendingUp} label="Derrama anual" value={r ? fmt.mxnM(r.ingresosBrutos / Math.max(1, horizonte)) : '—'}   sub="valorización"           accent="#3B6D11" />
        <KpiStrip icon={Leaf}      label="CO₂e evitado"  value={r ? `${(r.co2eEvitadasAnualTon / 1000).toFixed(0)}K t` : '—'}    sub="por año"                accent="#1A5FA8" />
        <KpiStrip icon={Heart}     label="Ahorro salud"  value={r ? fmt.mxnM(r.ahorroSalud) : '—'}                               sub="anual est."             accent="#C0392B" />
      </div>

      <ResearchCompletenessBar />

      {/* ── 2-column layout: inputs (left) + results (right) ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-5 items-start">

        {/* ══ LEFT COLUMN — INPUTS ═══════════════════════════════════════════ */}
        <div className="space-y-3">

          {/* Block 1 — Vivienda en condominio */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
            <BlockLabel n="1" title="Distribución de vivienda" source="INEGI Censo 2020" />

            {(distribution || seleccionMunicipioCatalog) ? (() => {
              // Prefer the live API municipality figure; fall back to static ZM/state census
              const poblacion = seleccionMunicipioCatalog?.poblacion ?? distribution?.statePopulation2020 ?? 0
              const viviendas = seleccionMunicipioCatalog
                ? Math.round(poblacion / Math.max(ocupantesBase, 1))
                : (distribution?.stateOccupiedDwellings2020 ?? 0)
              const ocup = distribution?.stateAvgOccupants2020 ?? ocupantesBase
              const isApiData = !!seleccionMunicipioCatalog
              return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                  {[
                    { label: 'Población',          value: fmt.num0(poblacion),       source: isApiData ? 'API' : 'INEGI ZM' },
                    { label: 'Viviendas habitadas', value: fmt.num0(viviendas),       source: isApiData ? 'Estimado' : 'INEGI ZM' },
                    { label: 'Ocup./viv. base',     value: ocup.toFixed(1),           source: 'INEGI Censo' },
                  ].map(c => (
                    <AnchorFigure
                      key={c.label}
                      figure={c.value}
                      context={`${c.label} · ${c.source}`}
                      figureClassName="text-[22px]"
                    />
                  ))}
                </div>
              )
            })() : (
              <p className="mb-3 text-[11px] text-amber-800 rounded-[7px] border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                Selecciona un municipio para cargar los datos de vivienda.
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 mb-3">
              {operationalSegments.map(tipo => (
                <button key={tipo.key} type="button" onClick={() => toggleTipoVivienda(tipo.key)}
                  className={cn('rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors',
                    tipo.active ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]' : 'border-[#E8E4DC] bg-white text-[#A8A49C]',
                  )}
                >{tipo.label}</button>
              ))}
            </div>

            <div className="space-y-3">
              <PercentSlider
                id="vivienda-edificio-condominio" label="% en edificio / condominio"
                value={viviendaCondominioPct} min={10} max={60} step={5}
                onChange={setViviendaCondominioPct}
                confidence="bibliography" source="CONAVI Necesidades de Vivienda 2030"
              />
              <div className="flex items-center justify-between rounded-[7px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-1.5">
                <span className="text-[11px] text-[#6B6760]">Casa independiente (derivado)</span>
                <span className="font-mono text-[11px] font-semibold text-[#4A4642]">{viviendaNoCondominioPct.toFixed(0)}%</span>
              </div>

              {/* VP vs. privada — desglose de Hemisferio 2 */}
              <PercentSlider
                id="casa-via-publica" label="% de casas en calle pública (vía pública)"
                value={casaViaPublicaPct} min={20} max={95} step={5}
                onChange={setCasaViaPublicaPct}
                confidence="bibliography"
                source="DONUE INEGI · Estimado nacional: 70% de viviendas no-condominio son casas VP"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between rounded-[7px] border border-[#FEF7E7] bg-[#FEF7E7]/60 px-2.5 py-1.5">
                  <div>
                    <span className="text-[10px] text-[#D4881E] font-medium">Hemisferio 2</span>
                    <p className="text-[9px] text-[#A8A49C]">Calle pública (VP)</p>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#D4881E]">
                    {(viviendaNoCondominioPct * casaViaPublicaPct / 100).toFixed(0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-[7px] border border-[#D7E8C0] bg-[#F4FAEC] px-2.5 py-1.5">
                  <div>
                    <span className="text-[10px] text-[#3B6D11] font-medium">Hemisferio 1</span>
                    <p className="text-[9px] text-[#A8A49C]">Privada / coto</p>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-[#3B6D11]">
                    {(viviendaNoCondominioPct * (100 - casaViaPublicaPct) / 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <PercentSlider
                id="vivienda-edificio-depto" label="Departamentos (dentro de condominio)"
                value={viviendaCondominioDepartamentoPct}
                onChange={setViviendaCondominioDepartamentoPct}
                confidence="assumption" source="Estimado · INEGI no desglosa tipo dentro de condominio"
              />
              <div className="flex items-center justify-between rounded-[7px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-1.5">
                <span className="text-[11px] text-[#6B6760]">Casas en condominio (derivado)</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#23470A]">
                  <Check size={12} />{viviendaCondominioCasaPct.toFixed(0)}%
                </span>
              </div>
              <PercentSlider
                id="ocupantes-vivienda" label="Ocupantes por vivienda"
                value={ocupantesEscenario} min={1} max={6} step={0.1}
                suffix="" display={ocupantesEscenario.toFixed(1)}
                onChange={setOcupantesPorViviendaEscenario}
                confidence="inegi" source={`INEGI Censo 2020 base: ${ocupantesBase.toFixed(1)} ocup./viv.`}
              />
            </div>
          </div>

          {/* Block 2 — Trayectoria + horizonte + generación */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
            <BlockLabel n="2" title="Trayectoria de captura" source="SEMARNAT BDE + ALQUIMIA" />

            {/* 2.1 Horizonte */}
            <div className="mb-3">
              <p className="text-[10px] text-[#6B6760] mb-1.5 font-medium">Horizonte del plan (años)</p>
              <div className="flex flex-wrap gap-1.5">
                {[3, 4, 5, 6, 7].map(yr => (
                  <button key={yr} type="button" onClick={() => setHorizonte(yr)}
                    className={cn('h-8 min-w-[2rem] rounded-full border px-2.5 text-[12px] font-medium',
                      horizonte === yr ? 'border-[#3B6D11] bg-[#3B6D11] text-white' : 'border-[#E8E4DC] bg-white text-[#6B6760]',
                    )}
                  >{yr}</button>
                ))}
              </div>
            </div>

            {/* 2.2 Trayectoria selector */}
            <div className="mb-3">
              <p className="text-[10px] text-[#6B6760] mb-1.5 font-medium">Perfil de adopción</p>
              <div className="flex flex-wrap gap-1.5">
                {TRAJECTORY_UI.map(t => (
                  <button key={t.presetId} type="button" onClick={() => setPreset(t.presetId)}
                    className={cn('px-3 py-1 rounded-full border text-[11px] font-medium transition-colors',
                      presetTrayectoria === t.presetId ? t.badge + ' shadow-sm' : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760] hover:border-[#C8C4BC]',
                    )}
                  >{t.label}</button>
                ))}
              </div>
              {activeUI && (
                <p className="mt-1.5 text-[10px] text-[#A8A49C]">
                  Captura estimada al año {horizonte}:{' '}
                  <span className="font-mono font-semibold text-[#1C1B18]">{capturaFinal.toFixed(0)}%</span>
                </p>
              )}
            </div>

            {/* 2.3 Generación per cápita */}
            <PercentSlider
              id="gen-percapita" label="Generación RSU per cápita"
              value={genPercapita} min={0.65} max={1.55} step={0.05}
              suffix=" kg/hab·día" display={genPercapita.toFixed(2)}
              onChange={setGenPercapita}
              confidence="bibliography" source="SEMARNAT BDE 2022 · rango 0.65–1.55 kg/hab·día"
            />

            {/* 2.4 Tasa de aprovechamiento (read-only derived) */}
            <div className="mt-3 flex items-center justify-between rounded-[7px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-1.5">
              <span className="text-[11px] text-[#6B6760]">Tasa de aprovechamiento global</span>
              <span className="font-mono text-[13px] font-semibold text-[#3B6D11]">{capturaBasePct.toFixed(0)}%</span>
            </div>
          </div>

          {/* Block 3 — Merma por material (colapsable) */}
          <details className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 flex items-center justify-between select-none hover:bg-[#FAFAF8] transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#3B6D11] text-[12px] font-semibold">3.</span>
                <span className="text-[12px] font-semibold text-[#1C1B18]">Merma y precio por material</span>
              </div>
              <ChevronDown size={14} className="text-[#A8A49C] shrink-0" />
            </summary>
            <div className="px-4 pb-4 pt-1 border-t border-[#F0EDE5]">
              <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] gap-x-2 gap-y-1 items-center text-[9px] uppercase tracking-[0.05em] text-[#A8A49C] mb-2">
                <span>Material</span>
                <span className="text-center">Merma</span>
                <span className="text-right">Precio/kg</span>
              </div>
              <div className="space-y-2">
                {MATERIALS.map(material => {
                  const range = PRECIOS_RANGO[material]
                  const research = MATERIAL_PRICE_RESEARCH[material]
                  return (
                    <div key={material}>
                      <div className="grid grid-cols-[minmax(0,1fr)_72px_minmax(0,1fr)] gap-x-2 items-center">
                        <span className="text-[11px] text-[#1C1B18] truncate font-medium">{MATERIAL_LABEL[material]}</span>
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="font-mono text-[10px] text-[#D4881E]">{(mermaPctPorMaterial[material] ?? 10).toFixed(0)}%</span>
                          <input type="range" min={0} max={60} step={5} value={mermaPctPorMaterial[material] ?? 10}
                            onChange={e => setMermaMaterialPct(material, Number(e.target.value))}
                            className="h-1 w-full cursor-pointer accent-[#D4881E]"
                            aria-label={`Merma ${MATERIAL_LABEL[material]}`}
                          />
                        </div>
                        <div>
                          <span className="block text-right font-mono text-[10px] text-[#3B6D11] mb-0.5">${precios[material].toFixed(2)}</span>
                          <input type="range" min={range.min} max={range.max} step={range.step} value={precios[material]}
                            onChange={e => setPrecio(material, Number(e.target.value))}
                            className="h-1 w-full cursor-pointer accent-[#3B6D11]"
                            aria-label={`Precio ${MATERIAL_LABEL[material]}`}
                          />
                        </div>
                      </div>
                      {research && (() => {
                        const ctx = priceContext(precios[material], research)
                        return (
                          <p className={cn('mt-0.5 text-[8px] leading-tight truncate', ctx.cls)} title={research.explanation}>
                            <span className={cn('w-1.5 h-1.5 rounded-full inline-block mr-1 align-middle', ctx.dot)} />
                            {ctx.label}
                          </p>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>
          </details>

          {/* Block 4 — Composición base RSU (colapsable) */}
          <details className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden" data-chart-id="composicion-rsu">
            <summary className="cursor-pointer px-4 py-3 flex items-center justify-between select-none hover:bg-[#FAFAF8] transition-colors">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#3B6D11] text-[12px] font-semibold">4.</span>
                <span className="text-[12px] font-semibold text-[#1C1B18]">Composición base RSU</span>
                <span className="text-[9px] text-[#A8A49C] border border-[#E8E4DC] rounded-full px-1.5 py-0.5">No editable</span>
              </div>
              <ChevronDown size={14} className="text-[#A8A49C] shrink-0" />
            </summary>
            <div className="px-4 pb-4 pt-1 border-t border-[#F0EDE5]">
              <p className="text-[9px] text-[#A8A49C] mb-3">SEMARNAT BDE 2022 · referencia nacional · ciudades medias</p>
              <div className="flex items-center gap-3">
                <div className="shrink-0" style={{ width: 90, height: 90 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[...RSU_SEMARNAT]} cx="50%" cy="50%" innerRadius={22} outerRadius={42} dataKey="pct" strokeWidth={2} stroke="#fff">
                        {RSU_SEMARNAT.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-0.5">
                  {RSU_SEMARNAT.map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: item.color }} />
                        <span className="text-[9px] text-[#4A4740]">{item.name}</span>
                      </div>
                      <span className="font-mono text-[10px] font-medium text-[#1C1B18]">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </details>

          {/* Block 5 — Costo por tonelada enterrada */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
            <BlockLabel n="5" title="Costo por tonelada enterrada" source="Finanzas municipales SLP 2023" />
            <div className="flex flex-wrap items-center gap-3">
              <button type="button"
                onClick={() => setCostoDisposicionActivo(!costoDisposicionActivo)}
                className={cn('rounded-full border px-3 py-1 text-[11px] font-medium shrink-0',
                  costoDisposicionActivo ? 'border-[#3B6D11]/35 bg-[#EAF3DE] text-[#23470A]' : 'border-[#E8E4DC] bg-white text-[#6B6760]',
                )}
              >{costoDisposicionActivo ? 'Incluido' : 'Excluido'}</button>
              {costoDisposicionActivo && (
                <div className="flex-1 min-w-[160px]">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label htmlFor="costo-disposicion-ton" className="text-[11px] text-[#6B6760]">MXN por tonelada</label>
                    <span className="font-mono text-[12px] font-semibold text-[#D4881E]">${costoDisposicionPorTon.toFixed(0)}/t</span>
                  </div>
                  <input id="costo-disposicion-ton" type="range" min={0} max={900} step={20}
                    value={costoDisposicionPorTon} onChange={e => setCostoDisposicionPorTon(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer accent-[#D4881E]"
                  />
                </div>
              )}
            </div>
            {costoDisposicionActivo && r && (
              <p className="mt-2 text-[11px] text-[#6B6760]">
                Pago evitable por entierro: <span className="font-mono font-semibold text-[#3B6D11]">{fmt.mxnM(pagoEvitableAnual)}/año</span>
              </p>
            )}
          </div>

          <section className="pt-4 border-t border-[#F0EDE5]">
            <div className="border-l-2 border-[#3B6D11] pl-3">
              <p className="font-serif text-[14px] text-[#1C1B18] mb-1">{narrative.title}</p>
              <p className="text-[12px] leading-relaxed text-[#5A6347]">{narrative.body}</p>
              <p className="mt-2 text-[11px] font-medium text-[#3B6D11]">{narrative.maturity}</p>
            </div>
          </section>

        </div>

        {/* ══ RIGHT COLUMN — LIVE RESULTS ════════════════════════════════════ */}
        <div className="space-y-4">

          {/* Trayectoria de captura — live gráfica */}
          <ChartPanel
            chartId="trayectoria-captura"
            title="Trayectoria de captura"
            subtitle={`Perfil ${activeUI?.label ?? presetTrayectoria} · ${horizonte} años`}
            expandable={false}
            kpis={[
              {
                label: `Captura al año ${horizonte}`,
                value: `${capturaFinal.toFixed(0)}%`,
                accent: activeUI?.color ?? '#3B6D11',
              },
            ]}
          >
            <div className="px-5 pb-4">
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={trajectoryData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid {...CHART_GRID} />
                  <XAxis dataKey="año" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis
                    tick={CHART_AXIS_TICK}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    width={32}
                  />
                  <Tooltip
                    formatter={(v: number) => [`${(v as number).toFixed(1)}%`, 'Captura RSU']}
                    labelFormatter={(l: number) => `Año ${l}`}
                    contentStyle={CHART_TOOLTIP_STYLE}
                  />
                  <Line
                    type="monotone"
                    dataKey="captura"
                    stroke={activeUI?.color ?? '#3B6D11'}
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, fill: activeUI?.color ?? '#3B6D11', stroke: '#fff', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>

          {impactLines && (
            <ImpactScenariosPanel
              impactLines={impactLines}
              horizonte={horizonte}
              presetTrayectoria={presetTrayectoria}
              activeLabel={activeUI?.label ?? presetTrayectoria}
            />
          )}

          {/* Tabla comparativa ejecutiva */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0EDE5]">
              <p className="text-[13px] font-semibold text-[#1C1B18]">Comparativa al año {horizonte}</p>
              <p className="text-[11px] text-[#6B6760]">Valores al año {horizonte} · escenario activo resaltado</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Trayectoria</th>
                    <th className="text-right px-3 py-2 font-semibold text-[#1C1B18]">Captura</th>
                    <th className="text-right px-3 py-2 font-semibold text-[#1A5FA8]">CO₂e/año</th>
                    <th className="text-right px-3 py-2 font-semibold text-[#3B6D11]">Derrama</th>
                    <th className="text-right px-3 py-2 font-semibold text-[#C0392B]">Salud</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#1C1B18]">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, i) => {
                    const isActive = presetTrayectoria === row.presetId
                    return (
                      <tr key={row.label} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]', isActive && 'ring-1 ring-inset ring-[#3B6D11]/30')}>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: row.color }} />
                            <span className="font-medium text-[#1C1B18]">{row.label}</span>
                            {isActive && <span className="text-[9px] text-[#3B6D11] font-semibold">● activo</span>}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono" style={{ color: row.color }}>{row.captura.toFixed(0)}%</td>
                        <td className="px-3 py-2 text-right font-mono text-[#1A5FA8]">{row.co2e !== null ? `${row.co2e}K t` : '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-[#3B6D11]">{row.derrama !== null ? `$${row.derrama}M` : '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-[#C0392B]">{row.salud !== null ? `$${row.salud}M` : '—'}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={cn('px-2 py-0.5 rounded text-[9px] font-semibold',
                            row.valoracion === 'Excelente' ? 'bg-[#EAF3DE] text-[#23470A]' :
                            row.valoracion === 'Óptimo'    ? 'bg-[#EBF3FB] text-[#0D3B7A]' :
                            row.valoracion === 'Viable'    ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                            'bg-[#FDE8E8] text-[#7A1212]',
                          )}>{row.valoracion}</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recomendación del motor — prominente */}
          {motorRecomendacion && (
            <div className={cn('rounded-[12px] border p-4',
              motorRecomendacion.isOptimal ? 'border-[#D7E8C0] bg-[#F4FAEC]' : 'border-[#F5D98A] bg-[#FEF7E7]',
            )}>
              <div className="flex items-start gap-3">
                <div className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold',
                  motorRecomendacion.isOptimal ? 'bg-[#D7E8C0] text-[#1A4200]' : 'bg-[#F5D98A] text-[#6B4800]',
                )}>
                  {motorRecomendacion.isOptimal ? '✓' : '!'}
                </div>
                <div className="flex-1">
                  <p className={cn('text-[12px] font-semibold mb-1', motorRecomendacion.isOptimal ? 'text-[#1A4200]' : 'text-[#6B4800]')}>
                    {motorRecomendacion.isOptimal
                      ? `Trayectoria óptima para ${horizonte} años: "${motorRecomendacion.activeLabel}"`
                      : `Motor recomienda "${motorRecomendacion.hint.label}" para ${horizonte} años`}
                  </p>
                  <p className="text-[11px] text-[#4A4740] mb-2">{motorRecomendacion.hint.reason}</p>
                  {!motorRecomendacion.isOptimal && motorRecomendacion.capBrecha > 0 && (
                    <div className="flex flex-wrap gap-3 text-[11px] mb-2">
                      <span className="text-[#6B6760]">Brecha de captura: <span className="font-mono font-semibold text-[#D4881E]">{motorRecomendacion.capBrecha.toFixed(0)}%</span></span>
                      {motorRecomendacion.derrDelta !== 0 && (
                        <span className="text-[#6B6760]">Derrama potencial: <span className="font-mono font-semibold text-[#C0392B]">{fmt.mxnM(Math.abs(motorRecomendacion.derrDelta))}</span></span>
                      )}
                    </div>
                  )}
                  {!motorRecomendacion.isOptimal && motorRecomendacion.reco && (
                    <button type="button"
                      onClick={() => motorRecomendacion.reco && setPreset(motorRecomendacion.reco.presetId)}
                      className="px-4 py-1.5 rounded-[7px] text-[11px] font-medium bg-[#3B6D11] text-white hover:bg-[#2D5A0D] transition-colors"
                    >
                      Aplicar "{motorRecomendacion.hint.label}"
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sin datos placeholder */}
          {!r && (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-6 text-center">
              <p className="text-[12px] text-[#A8A49C]">Ajusta los parámetros en la columna izquierda para ver los impactos proyectados.</p>
            </div>
          )}

          {/* Impacto ambiental y sanitario (antes M01B — integrado) */}
          <BaselineImpactoAmbientalSection />

        </div>
      </div>

      {/* ── Module bridge footer ─────────────────────────────────────────────── */}
      <div className="pt-3 border-t border-[#F0EDE5] flex items-start gap-2 text-[10px] text-[#6B6760]">
        <span className="shrink-0 text-[#3B6D11] mt-0.5 font-semibold">→</span>
        <span>Con línea base e impacto ambiental calibrados, abra <strong className="text-[#1C1B18]">M02 diagnóstico social</strong> antes de reforma reglamentaria o expediente financiero.</span>
      </div>

      {/* ── Footer actions ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button"
          className="px-4 py-2 rounded-[8px] text-[11px] font-medium bg-[#3B6D11] text-white hover:bg-[#2D5A0D] transition-colors"
          onClick={() => {
            const el = document.getElementById('m01-comparativa-table')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
        >Ver comparativa completa</button>
        <button type="button"
          className="px-4 py-2 rounded-[8px] text-[11px] font-medium border border-[#E8E4DC] bg-white text-[#4A4740] hover:border-[#C8C4BC] transition-colors"
        >Guardar escenario</button>
        <button type="button"
          className="px-4 py-2 rounded-[8px] text-[11px] font-medium border border-[#E8E4DC] bg-white text-[#4A4740] hover:border-[#C8C4BC] transition-colors"
        >Exportar</button>
        <button type="button"
          className="ml-auto px-4 py-2 rounded-[8px] text-[11px] font-medium border border-[#3B6D11]/30 bg-[#EAF3DE] text-[#23470A] hover:bg-[#D7E8C0] transition-colors"
        >Siguiente módulo →</button>
      </div>

    </div>
  )
}
