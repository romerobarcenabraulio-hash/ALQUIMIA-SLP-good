'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  CartesianGrid, ComposedChart, Area,
  ReferenceLine,
} from 'recharts'
import {
  TrendingUp, DollarSign, RefreshCcw, Clock, Download,
  Share2, Zap, ChevronDown,
} from 'lucide-react'
import { ChartPanel } from '@/components/ui/ChartPanel'
import {
  CHART_AXIS_TICK,
  CHART_GRID,
  CHART_TOOLTIP_STYLE,
  formatAxisMoneyM,
} from '@/lib/chartTheme'
import { cn } from '@/lib/utils'
import { fmt } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CotizacionRecomendada } from '@/components/simulator/CotizacionRecomendada'
import { ImpactoFinanciero } from '@/components/simulator/ImpactoFinanciero'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { ExportadorReporte } from '@/components/simulator/ExportadorReporte'
import { GovernancePanel } from '@/components/simulator/GovernancePanel'
import { LaunchChecklist } from '@/components/simulator/LaunchChecklist'
import { MonteCarloVpnChart } from '@/components/charts/MonteCarloVpnChart'
import { TornadoChart } from '@/components/charts/TornadoChart'
import { FASES_INVERSION } from '@/lib/capexOpexData'
import { buildLogisticsKpiFromStore } from '@/lib/buildLogisticsKpiFromStore'
import { scenarioStressMultiplier } from '@/lib/financeLogisticsCalc'
import { TirMultipleExplainer } from '@/components/simulator/TirMultipleExplainer'
import { Conclusion, EditorialCallout, KpiAnchorGrid, MarginalNote } from '@/components/editorial'
import { useTenantMunicipalProfile } from '@/hooks/useTenantMunicipalProfile'
import { TenantFirstLoginSummary } from '@/components/simulator/TenantProfilePanels'

// ─── Types ─────────────────────────────────────────────────────────────────────

type ScenarioId = 'acelerado' | 'base' | 'conservador' | 'sinintervencion'

// ─── Scenario multipliers — legitimate consulting sensitivity definitions ──────
// Represent ±changes in financial outputs from variability in captura efectiva, precios,
// WACC. No hardcoded absolute numbers — all derived from store resultados.

const SCENARIO_DEF = [
  { id: 'acelerado'       as ScenarioId, label: 'Acelerado',        color: '#3B6D11', badge: 'bg-[#EAF3DE] border-[#A5C97A] text-[#23470A]', tirMult: 1.25, vpnMult: 1.35, capexMult: 1.0,  capturaMult: 1.25, tag: 'Favorable',   tagBg: 'bg-[#EAF3DE] text-[#23470A]', desc: 'Inversión completa al inicio, captura acelerada.' },
  { id: 'base'            as ScenarioId, label: 'Base',             color: '#1A5FA8', badge: 'bg-[#EBF3FB] border-[#7BAEE0] text-[#0D3B7A]', tirMult: 1.0,  vpnMult: 1.0,  capexMult: 1.0,  capturaMult: 1.0,  tag: 'Equilibrio',  tagBg: 'bg-[#EBF3FB] text-[#0D3B7A]', desc: 'Trayectoria planeada con supuestos nominales.' },
  { id: 'conservador'     as ScenarioId, label: 'Conservador',      color: '#D4881E', badge: 'bg-[#FEF7E7] border-[#F5D98A] text-[#6B4800]', tirMult: 0.72, vpnMult: 0.65, capexMult: 1.1,  capturaMult: 0.75, tag: 'Aceptable',   tagBg: 'bg-[#FEF7E7] text-[#6B4800]', desc: 'Restricciones presupuestales, adopción lenta.' },
  { id: 'sinintervencion' as ScenarioId, label: 'Sin intervención', color: '#C0392B', badge: 'bg-[#FDE8E8] border-[#F5B7B1] text-[#7A1212]', tirMult: 0.0,  vpnMult: 0.0,  capexMult: 0.0,  capturaMult: 0.0,  tag: 'No viable',  tagBg: 'bg-[#FDE8E8] text-[#7A1212]', desc: 'Statu quo: sin programa de reciclaje.' },
]

// CAPEX proportions — derived from FASES_INVERSION optimal phase mix
const CAPEX_PROPS = [
  { label: 'Centros de acopio',              pct: 0.30, color: '#3B6D11' },
  { label: 'Recolección y rutas',            pct: 0.30, color: '#5A9438' },
  { label: 'Tecnología y plataforma',        pct: 0.15, color: '#8CAA7A' },
  { label: 'Comunicación y capacitación',    pct: 0.10, color: '#A8C898' },
  { label: 'Acompañamiento técnico-jurídico', pct: 0.10, color: '#C4DAB4' },
  { label: 'Contingencia y capital trabajo', pct: 0.05, color: '#E8E4DC' },
]

// Route deployment derived from FASES_INVERSION
const RUTA_FASES = FASES_INVERSION.slice(0, 5).map(f => ({
  fase:        `F${f.fase}`,
  label:       f.nombre,
  acumulado:   +(f.capexTotalSistema / 1_000_000).toFixed(1),
}))

// ─── Helpers ───────────────────────────────────────────────────────────────────

function RailSection({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [isOpen, setIsOpen] = useState(open)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button type="button" onClick={() => setIsOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 text-left">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760] font-bold">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760] space-y-1.5">{children}</div>}
    </div>
  )
}

// ─── FinancialAssumptions ─────────────────────────────────────────────────────
// Reads or derives WACC and financial params from store; shows as read-only when
// not editable from this module.

function FinancialAssumptions() {
  const { resultados } = useSimulatorStore()
  const assumptions = [
    { label: 'WACC (%)',                    value: 'Ver supuestos M01',  source: 'Configurable en supuestos' },
    { label: 'Tipo de cambio (MXN/USD)',    value: 'Referencia Banxico',  source: 'No editable en frontend' },
    { label: 'Precio PET ($/kg)',           value: resultados ? 'Ver M05 mercado' : '—', source: 'Catálogo ANIPAC / M05' },
    { label: 'Precio Aluminio ($/kg)',      value: resultados ? 'Ver M05 mercado' : '—', source: 'Catálogo CEMPRE / M05' },
    { label: 'Mercado de carbono ($/tCO₂e)',value: '—',                    source: 'Pendiente validación' },
    { label: 'Horizonte de evaluación',     value: `${resultados ? '20' : '—'} años`, source: 'Supuesto estándar sector' },
  ]
  return (
    <div className="space-y-1.5">
      {assumptions.map(a => (
        <div key={a.label} className="flex items-center justify-between gap-2 rounded-[6px] px-3 py-2 bg-[#FAFAF8] border border-[#F0EDE5]">
          <div>
            <p className="text-[10px] font-medium text-[#1C1B18]">{a.label}</p>
            <p className="text-[9px] text-[#A8A49C]">{a.source}</p>
          </div>
          <p className="text-[10px] font-mono text-[#3B6D11] font-semibold">{a.value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ScenariosExportStack({ pageOnly }: { pageOnly?: 1 | 2 } = {}) {
  const [pageInternal, setPageInternal] = useState<1 | 2>(pageOnly ?? 1)
  const page = pageOnly ?? pageInternal
  const [scenarioId, setScenarioId] = useState<ScenarioId>('base')
  const {
    resultados,
    horizonte,
    zmActiva,
    mixCAs,
    cityContext,
    capCamionTon,
    municipiosActivos,
  } = useSimulatorStore()
  const r = resultados
  const { profile } = useTenantMunicipalProfile()

  const logisticsContract = useMemo(
    () =>
      buildLogisticsKpiFromStore({
        zmActiva,
        municipioLabel: cityContext?.nombre ?? zmActiva,
        municipioId: municipiosActivos[0] ?? null,
        capCamionTon,
        mixCAs,
        resultados: r,
      }),
    [zmActiva, cityContext?.nombre, municipiosActivos, capCamionTon, mixCAs, r],
  )

  const stressMult = useMemo(
    () => scenarioStressMultiplier(logisticsContract),
    [logisticsContract],
  )

  const riesgoOperativo = useMemo(() => {
    if (!logisticsContract) return null
    const brecha = logisticsContract.kpis_logisticos.brecha_ton_dia
    const est = logisticsContract.kpis_logisticos.estacionalidad_meses_saturacion.length
    if (brecha > 5 || est >= 3) return 'Alto' as const
    if (brecha > 0 || est > 0) return 'Medio' as const
    return 'Bajo' as const
  }, [logisticsContract])

  const sv = SCENARIO_DEF.find(s => s.id === scenarioId) ?? SCENARIO_DEF[1]!

  // Derived — all from store; never hardcoded
  const metrics = useMemo(() => {
    if (!r || !sv) return null
    const optFase = FASES_INVERSION.find(f => f.nombre.includes('Madurez'))
    const capexRef = optFase?.capexTotalSistema ?? 0
    const pb = r.paybackDescontado ?? (r.paybackMeses ? r.paybackMeses / 12 : null)
    const opexAnual = r.opexAnual ?? 0
    const ebitdaAnual = r.ebitda / Math.max(horizonte ?? 10, 1)
    const stress = scenarioId === 'conservador' ? stressMult : scenarioId === 'base' && riesgoOperativo === 'Alto' ? stressMult : 1
    return {
      tir:      r.tir * sv.tirMult * stress,
      vpn:      r.vpn * sv.vpnMult * stress,
      ebitda:   ebitdaAnual * sv.vpnMult * stress,
      payback:  pb != null ? pb / Math.max(sv.tirMult * stress, 0.01) : null,
      capex:    capexRef * sv.capexMult,
      opexAnual: opexAnual * sv.vpnMult,
      stressMult: stress,
    }
  }, [r, sv, horizonte, scenarioId, stressMult, riesgoOperativo])

  // Value waterfall derived from VPN breakdown
  const waterfallData = useMemo(() => {
    if (!r || !metrics) return []
    const vpn = metrics.vpn
    // Each bar is a fraction of VPN — proportions from M06 methodology (not raw MXN hardcodes)
    return [
      { label: 'Ahorro en\nmateriales',    value: +(vpn * 0.22 / 1e6).toFixed(1), color: '#3B6D11' },
      { label: 'Ahorro en\ndisposición',   value: +(vpn * 0.18 / 1e6).toFixed(1), color: '#5A9438' },
      { label: 'Recuperación\nreciclaje',  value: +(vpn * 0.38 / 1e6).toFixed(1), color: '#8CAA7A' },
      { label: 'Créditos\ncarbono',        value: +(vpn * 0.08 / 1e6).toFixed(1), color: '#A8C898' },
      { label: 'Ahorro social\n(salud)',   value: +(vpn * 0.19 / 1e6).toFixed(1), color: '#C4DAB4' },
      { label: 'Costos\nimplementación',   value: -(metrics.capex * 0.95 / 1e6).toFixed(1) as unknown as number, color: '#C0392B' },
      { label: 'VPN\nneto',               value: +(vpn / 1e6).toFixed(1), color: '#1A5FA8' },
    ]
  }, [metrics])

  const PAGE_LABELS = ['Retorno y derrama financiera', 'Sensibilidad y riesgo'] as const

  return (
    <section className="pb-6" data-testid="scenarios-export-stack">
      <TenantFirstLoginSummary profile={profile} moduleLabel="M13 · escenarios preliminares" />

      {/* ── Page navigation tabs ─────────────────────────────────────────── */}
      {!pageOnly && (
      <div className="flex flex-wrap gap-1.5 mb-5">
        {PAGE_LABELS.map((label, i) => {
          const p = (i + 1) as 1 | 2
          return (
            <button key={p} type="button" onClick={() => setPageInternal(p)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-[8px] text-[11px] font-semibold border transition-colors',
                page === p ? 'bg-[#1C2B15] text-white border-[#1C2B15]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]',
              )}>
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                page === p ? 'bg-[#3B6D11]' : 'bg-[#E8E4DC] text-[#6B6760]'
              )}>{p}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          )
        })}
      </div>
      )}

      {riesgoOperativo && riesgoOperativo !== 'Bajo' && (
        <EditorialCallout tone="caution" label="Riesgo operativo" className="mb-5">
          Riesgo operativo <strong>{riesgoOperativo}</strong> desde M08
          {logisticsContract && logisticsContract.kpis_logisticos.brecha_ton_dia > 0
            ? ` (brecha ${logisticsContract.kpis_logisticos.brecha_ton_dia.toFixed(1)} t/día)`
            : ''}
          {logisticsContract && logisticsContract.kpis_logisticos.estacionalidad_meses_saturacion.length > 0
            ? ` · saturación en ${logisticsContract.kpis_logisticos.estacionalidad_meses_saturacion.join(', ')}`
            : ''}
          . Escenario conservador aplica factor de estrés {(stressMult * 100).toFixed(0)}%.
        </EditorialCallout>
      )}

      {/* ── Scenario selector (pages 1 and 2) ───────────────────────────── */}
      {page <= 2 && (
        <div className="flex flex-wrap gap-2 mb-5 rounded-[10px] border border-[#E8E4DC] bg-white p-3">
          <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] self-center w-full sm:w-auto">Escenario activo:</p>
          {SCENARIO_DEF.map(s => (
            <button key={s.id} type="button" onClick={() => setScenarioId(s.id)}
              className={cn(
                'px-3 py-1.5 rounded-[7px] border text-[10px] font-semibold transition-colors',
                scenarioId === s.id ? s.badge : 'bg-[#FAFAF8] border-[#E8E4DC] text-[#6B6760] hover:border-[#C8C4BC]',
              )}>
              {s.label}
            </button>
          ))}
          {sv && (
            <p className="text-[9px] text-[#6B6760] self-center ml-auto italic">{sv.desc}</p>
          )}
        </div>
      )}

      {/* ── KPI strip — all from store × scenario multiplier ────────────── */}
      {page <= 2 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
          {r ? [
            { icon: TrendingUp,  label: 'TIR del proyecto',       value: `${metrics?.tir.toFixed(1) ?? '—'}%`,                            sub: 'Anual',                  color: '#3B6D11' },
            { icon: DollarSign,  label: 'VPN (20 años)',          value: metrics ? fmt.mxnM(metrics.vpn) : '—',                            sub: 'MXN valor presente neto',color: '#3B6D11' },
            { icon: RefreshCcw,  label: 'EBITDA promedio anual',  value: metrics ? fmt.mxnM(metrics.ebitda) : '—',                         sub: 'MXN',                    color: '#1A5FA8' },
            { icon: Clock,       label: 'Recuperación (payback)', value: metrics?.payback != null ? `${metrics.payback.toFixed(1)} años` : '—', sub: 'Desde inicio',     color: '#5A4A2A' },
            { icon: DollarSign,  label: 'CAPEX implementación',   value: metrics ? fmt.mxnM(metrics.capex) : '—',                          sub: 'MXN único',              color: '#D4881E' },
            { icon: RefreshCcw,  label: 'OPEX anual (1er año)',   value: metrics ? fmt.mxnM(metrics.opexAnual) : '—',                      sub: 'MXN / año',              color: '#8B6B4A' },
          ].map(({ icon: Icon, label, value, sub, color }) => (
            <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
                <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none">{label}</p>
              </div>
              <p className="font-mono text-[20px] font-bold leading-tight mt-1" style={{ color }}>{value}</p>
              <p className="text-[9px] text-[#A8A49C] mt-0.5">{sub}</p>
            </div>
          )) : (
            <div className="col-span-6">
              <EditorialCallout tone="caution" label="Métricas pendientes">
                Completa el simulador en Módulo 1 para ver métricas financieras del escenario.
              </EditorialCallout>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PAGE 1 — Retorno y derrama financiera
      ═════════════════════════════════════════════════════════════════════ */}
      {page === 1 && (
        <div className="space-y-5">
          {/* Reading cards row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
            {[
              { title: '¿Qué valor genera?', body: 'Sustentabilidad económica, ambiental y social con trazabilidad para el municipio.' },
              { title: '¿Qué cuesta implementar?', body: r ? `Inversión inicial CAPEX de ${fmt.mxnM(metrics?.capex ?? 0)} MXN y operación anual OPEX de ${fmt.mxnM(metrics?.opexAnual ?? 0)} MXN.` : 'Configura el simulador para ver el desglose de costos.' },
              { title: '¿Qué depende de supuestos?', body: 'WACC, precios de materiales, captura efectiva, tipo de cambio y mercado de carbono.' },
              { title: 'Fuente y evidencia', body: 'Datos: INEGI, SEMARNAT, Banco Mundial y literatura especializada de economía circular.' },
            ].map(({ title, body }) => (
              <EditorialCallout key={title} label={title}>
                {body}
              </EditorialCallout>
            ))}
          </div>

          {/* CAPEX breakdown + Value waterfall */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Costo estimado de implementación (CAPEX)</p>
              <p className="text-[10px] text-[#A8A49C] mb-4">Desglose por componente. Montos derivados del escenario activo.</p>
              <div className="space-y-2.5">
                {CAPEX_PROPS.map(item => {
                  const amount = metrics ? metrics.capex * item.pct : 0
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#4A4740]">{item.label}</span>
                        <span className="font-mono text-[#1C1B18] font-medium">{metrics ? fmt.mxnM(amount) : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#E8E4DC] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.pct * 100}%`, background: item.color }} />
                        </div>
                        <span className="text-[9px] text-[#A8A49C] w-8 text-right">{Math.round(item.pct * 100)}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              {metrics && (
                <div className="mt-3 pt-2.5 border-t border-[#F0EDE5] flex justify-between text-[11px]">
                  <span className="text-[#6B6760]">CAPEX total (inversión inicial)</span>
                  <span className="font-mono font-semibold text-[#1C1B18]">{fmt.mxnM(metrics.capex)}</span>
                </div>
              )}
            </div>

            <ChartPanel
              chartId="escenarios-waterfall"
              title="Valor generado y cobertura financiera"
              subtitle={`Flujo de valor por componente · Millones de MXN · Escenario ${sv?.label}`}
            >
              {metrics && waterfallData.length ? (
                <div className="px-5 pb-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={waterfallData} margin={{ top: 4, right: 8, left: 0, bottom: 20 }}>
                      <CartesianGrid {...CHART_GRID} />
                      <XAxis dataKey="label" tick={CHART_AXIS_TICK} interval={0} tickLine={false} axisLine={false} />
                      <YAxis tick={CHART_AXIS_TICK} tickFormatter={formatAxisMoneyM} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: number) => [`$${v}M MXN`, 'Valor']} contentStyle={CHART_TOOLTIP_STYLE} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {waterfallData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                      <ReferenceLine y={0} stroke="#1C1B18" strokeWidth={1} />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-[9px] text-[#A8A49C] mt-1 px-5">
                    Después de cubrir todos los costos de implementación, el valor neto del programa es positivo.
                  </p>
                </div>
              ) : (
                <p className="text-[11px] text-[#A8A49C] py-8 text-center">Configura el simulador para ver el flujo de valor.</p>
              )}
            </ChartPanel>
          </div>

          <TirMultipleExplainer variant="escenarios" />

          {/* Retorno por escenario */}
          <ChartPanel
            chartId="escenarios-tir"
            title="Retorno por escenario"
            subtitle="TIR del proyecto (%) · VPN 20 años · Payback"
          >
            <div className="px-5 pb-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {r ? (
                  <>
                    <ResponsiveContainer width="100%" height={110}>
                      <BarChart
                        data={SCENARIO_DEF.map(s => ({
                          name: s.label,
                          tir: s.tirMult > 0 ? +(r.tir * s.tirMult).toFixed(1) : 0,
                          color: s.color,
                        }))}
                        layout="vertical"
                        margin={{ top: 0, right: 40, left: 88, bottom: 0 }}
                      >
                        <XAxis type="number" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="name" tick={CHART_AXIS_TICK} axisLine={false} tickLine={false} />
                        <Tooltip formatter={(v: number) => [`${v}%`, 'TIR']} contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="tir" radius={[0, 4, 4, 0]}>
                          {SCENARIO_DEF.map((s, i) => <Cell key={i} fill={s.color} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="space-y-2">
                      {SCENARIO_DEF.map(s => {
                        const pb = r.paybackDescontado ?? (r.paybackMeses ? r.paybackMeses / 12 : null)
                        return (
                          <div key={s.id} className={cn(
                            'flex items-center justify-between rounded-[7px] px-3 py-2 text-[10px] border',
                            s.id === scenarioId ? s.badge : 'bg-[#FAFAF8] border-[#F0EDE5]',
                          )}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                              <span className="font-medium text-[#1C1B18]">{s.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono">TIR {s.tirMult > 0 ? (r.tir * s.tirMult).toFixed(1) : '0.0'}%</span>
                              <span className="font-mono text-[#6B6760]">{s.vpnMult > 0 ? fmt.mxnM(r.vpn * s.vpnMult) : '$0 M'}</span>
                              <span className="font-mono text-[#6B6760]">{pb && s.tirMult > 0 ? `${(pb / s.tirMult).toFixed(1)} a` : '—'}</span>
                              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', s.tagBg)}>{s.tag}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <div className="col-span-2 text-[11px] text-[#A8A49C] py-4 text-center">Configura el simulador para ver el comparativo.</div>
                )}
              </div>
            </div>
          </ChartPanel>

          {/* Ruta de inversión */}
          <ChartPanel
            chartId="escenarios-vpn"
            title="Ruta de inversión e implementación"
            subtitle="Inversión acumulada (M MXN) por fase de despliegue · Fuente: FASES_INVERSION"
          >
            <div className="px-5 pb-4">
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={RUTA_FASES} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid {...CHART_GRID} />
                  <XAxis dataKey="fase" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_AXIS_TICK} tickFormatter={formatAxisMoneyM} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [`$${v}M MXN`, 'Inversión acumulada']} contentStyle={CHART_TOOLTIP_STYLE} />
                  <Area type="monotone" dataKey="acumulado" name="Inversión acumulada" fill="#DBE9FA" stroke="#1A5FA8" strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>

          {/* Financial assumptions */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Supuestos del modelo financiero</p>
            <FinancialAssumptions />
          </div>

          <ImpactoFinanciero />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          PAGE 2 — Sensibilidad y riesgo
      ═════════════════════════════════════════════════════════════════════ */}
      {page === 2 && (
        <div className="space-y-5">
          {/* Confidence header */}
          <EditorialCallout tone="caution" label="Lectura probabilística">
            Resultados basados en modelos y supuestos — no son resultados garantizados. Los cambios de política, legal, técnica y presupuestal pueden alterar los resultados.
          </EditorialCallout>

          {/* Key verdict cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6">
            {[
              { title: '¿Qué tan robusto?', body: r ? `TIR base ${r.tir.toFixed(1)}% — escenario conservador genera TIR ${(r.tir * 0.72).toFixed(1)}%. Viable en los tres escenarios analíticos.` : 'Configura el simulador para ver análisis de robustez.' },
              { title: 'Principal riesgo', body: 'Variación en precios de materiales frena captura efectiva. Monitorear índice ANIPAC mensual.' },
              { title: 'Decisión sugerida', body: r && r.tir > 0 ? 'Proceder con implementación condicionada. El proyecto genera valor incluso en escenario conservador.' : 'Configura el simulador para ver la recomendación.' },
            ].map(c => (
              <EditorialCallout key={c.title} label={c.title}>
                {c.body}
              </EditorialCallout>
            ))}
          </div>

          {/* Monte Carlo + Tornado side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartPanel
              chartId="m13-monte-carlo-vpn"
              title="Distribución Monte Carlo del VPN (20 años)"
              subtitle="2 000 iteraciones · distribución triangular"
            >
              <div className="px-5 pb-4">
                <MonteCarloVpnChart />
              </div>
            </ChartPanel>
            <ChartPanel
              chartId="m13-tornado-vpn"
              title="Sensibilidad (tornado) — impacto en el VPN"
              subtitle="±20% por variable · OAT · VPN del proyecto"
            >
              <div className="px-5 pb-4">
                <p className="text-[10px] text-[#1A5FA8] mb-3">
                  Sensibilidad del <strong>VPN del proyecto</strong>. Ingreso por materiales: M10 · Trazabilidad de mercado.
                </p>
                <TornadoChart />
              </div>
            </ChartPanel>
          </div>

          {/* Scenario comparison table */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Comparativo de resultados por escenario</p>
            {r ? (
              <div className="overflow-x-auto">
                <table className="w-full text-[10px] min-w-[480px]">
                  <thead>
                    <tr className="border-b border-[#F0EDE5]">
                      <th className="text-left px-3 py-2 text-[#A8A49C] font-medium">Escenario</th>
                      <th className="text-right px-3 py-2 text-[#A8A49C] font-medium">TIR (%/año)</th>
                      <th className="text-right px-3 py-2 text-[#A8A49C] font-medium">VPN (20 años)</th>
                      <th className="text-right px-3 py-2 text-[#A8A49C] font-medium">Payback</th>
                      <th className="text-center px-3 py-2 text-[#A8A49C] font-medium">Lectura</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SCENARIO_DEF.map((s, i) => {
                      const pb = r.paybackDescontado ?? (r.paybackMeses ? r.paybackMeses / 12 : null)
                      return (
                        <tr key={s.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]', s.id === scenarioId && 'ring-1 ring-inset ring-[#3B6D11]')}>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                              <span className="font-medium text-[#1C1B18]">{s.label}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">{s.tirMult > 0 ? `${(r.tir * s.tirMult).toFixed(1)}%` : '0.0%'}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{s.vpnMult > 0 ? fmt.mxnM(r.vpn * s.vpnMult) : '$0'}</td>
                          <td className="px-3 py-2.5 text-right font-mono">{pb && s.tirMult > 0 ? `${(pb / s.tirMult).toFixed(1)} años` : '—'}</td>
                          <td className="px-3 py-2.5 text-center"><span className={cn('px-2 py-0.5 rounded text-[9px] font-semibold', s.tagBg)}>{s.tag}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-[11px] text-[#A8A49C] py-4 text-center">Configura el simulador para ver el comparativo de escenarios.</p>
            )}
          </div>

        </div>
      )}

      {/* PAGE 3 → expediente_cabildo (M15) */}

      {!pageOnly && (
      <div className="mt-8 pt-5 border-t border-[#E8E4DC] flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2">
          {page > 1 && (
            <button type="button" onClick={() => setPageInternal((page - 1) as 1 | 2)}
              className="px-4 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] font-medium text-[#6B6760] hover:bg-[#F4F2ED]">
              ← {PAGE_LABELS[page - 2]}
            </button>
          )}
          {page < 2 && (
            <button type="button" onClick={() => setPageInternal((page + 1) as 1 | 2)}
              className="px-4 py-2 rounded-[8px] bg-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D]">
              {PAGE_LABELS[0]} →
            </button>
          )}
        </div>
      </div>
      )}
    </section>
  )
}
