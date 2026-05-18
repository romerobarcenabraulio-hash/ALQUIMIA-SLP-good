'use client'

import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
  BarChart, Bar,
} from 'recharts'
import { Lock, TrendingUp, Leaf, Heart, Users, Truck } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { PRESETS_TRAYECTORIA, TRAJECTORY_UI } from '@/lib/constants'
import { fmt, cn } from '@/lib/utils'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { getMunicipalNarrative } from '@/data/municipalNarratives'

// ── RSU composition (national reference, SEMARNAT/DBGIR) ─────────────────────
const COMPOSICION = [
  { name: 'Orgánicos',     pct: 52, color: '#5A9438' },
  { name: 'Papel/Cartón',  pct: 12, color: '#8BC34A' },
  { name: 'Plásticos',     pct: 13, color: '#2196F3' },
  { name: 'Vidrio',        pct:  4, color: '#00BCD4' },
  { name: 'Metales',       pct:  3, color: '#9E9E9E' },
  { name: 'Otros',         pct: 16, color: '#FF9800' },
]

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

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ n, title, sub }: { n: number; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[#3B6D11] text-white text-[11px] font-bold shrink-0">
        {n}
      </span>
      <div>
        <p className="text-[13px] font-semibold text-[#1C1B18] leading-tight">{title}</p>
        {sub && <p className="text-[10px] text-[#A8A49C]">{sub}</p>}
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub: string
  accent: string
}) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-3.5">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} strokeWidth={2} />
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none">{label}</p>
      </div>
      <p className="font-mono text-[18px] font-medium leading-none" style={{ color: accent }}>{value}</p>
      <p className="text-[10px] text-[#A8A49C] mt-1">{sub}</p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function CityBaselineStack() {
  const {
    resultados,
    resultadosSinPrograma,
    horizonte,
    genPercapita,
    zmActiva,
    municipiosActivos,
    seleccionMunicipioCatalog,
    audience,
    presetTrayectoria,
    pctCapturaPorAño,
    setPreset,
  } = useSimulatorStore()

  const [tab, setTab] = useState<'base' | 'comparativa'>('base')

  const r = resultados
  const municipioLabel = seleccionMunicipioCatalog?.nombre ?? `ZM ${zmActiva}`
  const narrative = getMunicipalNarrative(zmActiva, municipiosActivos)

  const trajectoryData = useMemo(() => buildTrajectoryFromStore(pctCapturaPorAño, horizonte), [pctCapturaPorAño, horizonte])
  const capturaFinal = trajectoryData[trajectoryData.length - 1]?.captura ?? 0

  // Active trajectory UI label
  const activeUI = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)

  // ── Comparative data ────────────────────────────────────────────────────────

  const comparativeLines = useMemo(() =>
    Array.from({ length: horizonte + 1 }, (_, yr) => {
      const point: Record<string, number> = { año: yr }
      for (const s of TRAJECTORY_UI) {
        const traj = interpolatePreset(s.presetId, horizonte)
        point[s.label] = traj[yr] ?? 0
      }
      return point
    }), [horizonte])

  const comparisonTable = useMemo(() => {
    const baseCaptura = interpolatePreset('Realista', horizonte)[horizonte] ?? 1
    return TRAJECTORY_UI.map(s => {
      const traj = interpolatePreset(s.presetId, horizonte)
      const captura = traj[horizonte] ?? 0
      const ratio = baseCaptura > 0 ? captura / baseCaptura : 0
      const recomendacion = captura >= 80 ? 'Excelente' : captura >= 50 ? 'Óptimo' : captura >= 30 ? 'Viable' : 'Insuficiente'
      return {
        label: s.label,
        color: s.color,
        captura,
        co2e: r ? Math.round(r.co2eEvitadasAnualTon * ratio / 1000) : null,
        derrama: r ? Math.round(r.ingresosBrutos * ratio / 1_000_000) : null,
        salud: r ? Math.round(r.ahorroSalud * ratio / 1_000_000) : null,
        recomendacion,
      }
    })
  }, [horizonte, r])

  const maxCaptura = comparisonTable[0]?.captura ?? 1

  return (
    <div className="space-y-5 pb-6">
      {/* ── Scope reminder strip ─────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 rounded-[8px] border border-[#E8E4DC] bg-[#F4F2ED] px-4 py-2.5 text-[11px]">
        <span className="text-[#6B6760]">
          📍 <strong className="text-[#1C1B18]">{municipioLabel}</strong>
        </span>
        <span className="text-[#6B6760]">
          ⏱ Horizonte: <strong className="text-[#1C1B18]">{horizonte} años</strong>
        </span>
        <span className="text-[#6B6760]">
          ⚖ Generación: <strong className="text-[#1C1B18]">{genPercapita.toFixed(2)} kg/hab·día</strong>
        </span>
        <span className="ml-auto text-[#A8A49C]">
          Audiencia: {audience === 'functionary' ? 'Funcionario público' : audience === 'citizen' ? 'Ciudadano' : 'Empresario'}
        </span>
      </div>

      {/* ── Trajectory selector ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] text-[#6B6760] shrink-0">Trayectoria de adopción:</span>
        <div className="flex gap-1.5 flex-wrap">
          {TRAJECTORY_UI.map(t => (
            <button
              key={t.presetId}
              type="button"
              onClick={() => setPreset(t.presetId)}
              className={cn(
                'px-3 py-1 rounded-full border text-[11px] font-medium transition-colors',
                presetTrayectoria === t.presetId
                  ? t.badge + ' shadow-sm'
                  : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760] hover:border-[#C8C4BC]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {activeUI && (
          <span className="ml-auto text-[10px] text-[#A8A49C]">
            Captura estimada al año {horizonte}: <span className="font-mono font-medium text-[#1C1B18]">{capturaFinal.toFixed(0)}%</span>
          </span>
        )}
      </div>

      {/* ── View tabs ────────────────────────────────────────────────────── */}
      <nav className="flex gap-1.5 rounded-[10px] border border-[#E8E4DC] bg-[#F4F2ED] p-1.5">
        {([
          { id: 'base',        label: 'Diagnóstico base' },
          { id: 'comparativa', label: 'Comparativa de escenarios' },
        ] as const).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'flex-1 px-4 py-2 rounded-[7px] text-[12px] font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-[#1C1B18] shadow-sm border border-[#E8E4DC]'
                : 'text-[#6B6760] hover:text-[#1C1B18]',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Tab: Diagnóstico base ─────────────────────────────────────────── */}
      {tab === 'base' && (
        <>
          {/* Row 1: KPIs + Trayectoria + Donut */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Col 1 — KPIs de volumen */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <SectionHeader n={1} title="Volumen y derrama" sub="Escenario municipal · simulación" />

              <div className="mb-3 rounded-[10px] bg-[#F4FAEC] border border-[#D7E8C0] px-4 py-2.5">
                <div className="flex items-end gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.06em] text-[#5A9438] mb-0.5">RSU generado diario</p>
                    <p className="font-mono text-[30px] font-semibold text-[#1C1B18] leading-none">
                      {r ? fmt.kgd(r.rsuTotalTonDia) : '—'}
                    </p>
                  </div>
                  <Truck className="w-6 h-6 text-[#8CAA7A] mb-0.5" strokeWidth={1.5} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <KpiCard icon={TrendingUp} label="Derrama anual" value={r ? fmt.mxnM(r.ingresosBrutos / Math.max(1, horizonte)) : '—'} sub="valorización" accent="#3B6D11" />
                <KpiCard icon={Leaf} label="CO₂ evitado/año" value={r ? `${(r.co2eEvitadasAnualTon / 1000).toFixed(0)}K tCO₂e` : '—'} sub="equivalente" accent="#1A5FA8" />
                <KpiCard icon={Heart} label="Ahorro salud" value={r ? fmt.mxnM(r.ahorroSalud) : '—'} sub="anual est." accent="#C0392B" />
                <KpiCard icon={Users} label="Empleos" value={r ? fmt.num0(r.empleosTotalesDirectos) : '—'} sub="directos" accent="#5A4A2A" />
              </div>

              {r && resultadosSinPrograma && (
                <div className="mt-2 rounded-[8px] bg-[#FEF7E7] border border-[#F5D98A] px-3 py-1.5 text-[10px] text-[#6B4800]">
                  Sin programa: {fmt.kgd(resultadosSinPrograma.rsuTotalTonDia)} · {fmt.mxnM(resultadosSinPrograma.ingresosBrutos / Math.max(1, horizonte))}
                </div>
              )}
            </div>

            {/* Col 2 — Trayectoria de captura (uses store data) */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <div className="flex items-start justify-between mb-3">
                <SectionHeader n={2} title="Trayectoria de captura" sub={`Perfil ${activeUI?.label ?? presetTrayectoria} · ${horizonte} años`} />
                <div className="text-right shrink-0">
                  <p className="font-mono text-[24px] leading-none font-semibold" style={{ color: activeUI?.color ?? '#3B6D11' }}>{capturaFinal.toFixed(0)}%</p>
                  <p className="text-[9px] text-[#A8A49C]">al año {horizonte}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={trajectoryData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                  <XAxis dataKey="año" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} width={32} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Captura RSU']} labelFormatter={(l: number) => `Año ${l}`} contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                  <Line type="monotone" dataKey="captura" stroke={activeUI?.color ?? '#3B6D11'} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: activeUI?.color ?? '#3B6D11', stroke: '#fff', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Col 3 — Composición RSU donut */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <div className="flex items-start justify-between mb-3">
                <SectionHeader n={3} title="Composición del RSU" sub="Referencia fija · SEMARNAT" />
                <span className="flex items-center gap-1 rounded border border-[#E8E4DC] bg-[#F4F2ED] px-2 py-0.5 text-[9px] text-[#A8A49C] shrink-0">
                  <Lock className="w-2.5 h-2.5" />
                  No editable
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="shrink-0" style={{ width: 120, height: 120 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={COMPOSICION} cx="50%" cy="50%" innerRadius={34} outerRadius={54} dataKey="pct" strokeWidth={2} stroke="#fff">
                        {COMPOSICION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1">
                  {COMPOSICION.map(item => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: item.color }} />
                        <span className="text-[10px] text-[#4A4740]">{item.name}</span>
                      </div>
                      <span className="font-mono text-[11px] font-medium text-[#1C1B18]">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Qué sí/no se ajusta + Estado del escenario */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-4">
              <p className="text-[11px] font-semibold text-[#3B6D11] mb-3">✓ ¿Qué sí se ajusta?</p>
              <ul className="space-y-2">
                {[
                  'Municipio / zona metropolitana activa',
                  'Horizonte de análisis (3 · 5 · 10 · 15 años)',
                  'Generación per cápita (kg/hab·día)',
                  'Trayectoria de adopción (4 perfiles)',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-[#3B5F23]">
                    <span className="text-[#5A9438] mt-0.5 shrink-0">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4">
              <p className="text-[11px] font-semibold text-[#6B6760] mb-3">🔒 ¿Qué no se ajusta aquí?</p>
              <ul className="space-y-2">
                {[
                  'Composición base RSU (SEMARNAT)',
                  'Factores de emisión CO₂e (IPCC AR6)',
                  'Supuestos macro (inflación, población)',
                  'Precios por material (módulo Infraestructura)',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-[11px] text-[#A8A49C]">
                    <Lock className="w-2.5 h-2.5 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Estado del escenario</p>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-[#A8A49C]">Escenario activo</span>
                  <span className="font-medium text-[#1C1B18] truncate ml-2">{municipioLabel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A49C]">Horizonte</span>
                  <span className="font-medium text-[#1C1B18]">{horizonte} años</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A49C]">Captura objetivo</span>
                  <span className="font-medium" style={{ color: activeUI?.color ?? '#3B6D11' }}>{capturaFinal.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A49C]">RSU diario</span>
                  <span className="font-medium text-[#1C1B18]">{r ? fmt.kgd(r.rsuTotalTonDia) : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A8A49C]">Trayectoria</span>
                  <span className="font-medium" style={{ color: activeUI?.color ?? '#3B6D11' }}>{activeUI?.label ?? presetTrayectoria}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Lectura municipal — colapsado */}
          <details className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <summary className="cursor-pointer px-5 py-3 text-[12px] font-medium text-[#6B6760] hover:text-[#1C1B18] hover:bg-[#FAFAF8] transition-colors select-none">
              Lectura municipal · {narrative.title}
            </summary>
            <div className="px-5 pb-5 pt-2 border-t border-[#F0EDE5]">
              <ScopeAnclaKicker className="mb-3 text-[11px]" />
              <div className="rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] px-4 py-4">
                <p className="font-serif text-[15px] text-[#1C1B18] mb-1">{narrative.title}</p>
                <p className="text-[12px] leading-relaxed text-[#5A6347]">{narrative.body}</p>
                <p className="mt-2 text-[11px] font-medium text-[#3B6D11]">{narrative.maturity}</p>
              </div>
            </div>
          </details>

          {/* Impactos acumulados — colapsado */}
          {r && (
            <details className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
              <summary className="cursor-pointer px-5 py-3 text-[12px] font-medium text-[#6B6760] hover:text-[#1C1B18] hover:bg-[#FAFAF8] transition-colors select-none">
                Impactos acumulados al horizonte · {fmt.mxnM(r.ingresosBrutos)} derrama base
              </summary>
              <div className="px-5 pb-5 pt-2 border-t border-[#F0EDE5]">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                  {[
                    { label: 'CO₂e/año',        value: fmt.co2(r.co2eEvitadasAnualTon),         color: '#1A5FA8' },
                    { label: 'CO₂e acumulado',  value: fmt.co2(r.co2eEvitadasHorizonteTon),     color: '#1A5FA8' },
                    { label: 'PM2.5 evitado',   value: `${r.pm25EvitadoTon.toFixed(1)} t`,       color: '#5A9438' },
                    { label: 'Biogás',          value: fmt.kwh(r.kwhBiogas),                     color: '#5A4A2A' },
                    { label: 'AVAD evitados',   value: r.avadEvitados.toFixed(0),                 color: '#C0392B' },
                    { label: 'Vida relleno',    value: `+${r.extensionRelleno.toFixed(1)} años`, color: '#3B6D11' },
                  ].map(item => (
                    <div key={item.label} className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2.5 text-center">
                      <p className="font-mono text-[14px] font-semibold" style={{ color: item.color }}>{item.value}</p>
                      <p className="text-[9px] text-[#A8A49C] mt-0.5 leading-snug">{item.label}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-[10px] bg-gradient-to-r from-[#EAF3DE] to-[#EBF3FB] p-4">
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[#3B6D11] mb-1">Derrama base por venta de materiales (horizonte)</p>
                  <p className="font-mono text-[28px] text-[#3B6D11] font-semibold">{fmt.mxnM(r.ingresosBrutos)}</p>
                </div>
              </div>
            </details>
          )}
        </>
      )}

      {/* ── Tab: Comparativa de escenarios ────────────────────────────────── */}
      {tab === 'comparativa' && (
        <div className="space-y-5">
          {/* Multi-line capture chart */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Trayectorias de captura RSU — 4 escenarios</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Porcentaje de captura por año · horizonte {horizonte} años</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={comparativeLines} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                <XAxis dataKey="año" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} label={{ value: 'Año', position: 'insideBottom', offset: -2, fontSize: 9, fill: '#A8A49C' }} />
                <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} width={32} />
                <Tooltip
                  formatter={(v: number, name: string) => [`${v.toFixed(1)}%`, name]}
                  labelFormatter={(l: number) => `Año ${l}`}
                  contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {TRAJECTORY_UI.map(s => (
                  <Line
                    key={s.label}
                    type="monotone"
                    dataKey={s.label}
                    stroke={s.color}
                    strokeWidth={presetTrayectoria === s.presetId ? 2.5 : 1.5}
                    strokeDasharray={presetTrayectoria === s.presetId ? undefined : '4 2'}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison table */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0EDE5]">
              <p className="text-[12px] font-semibold text-[#1C1B18]">Resumen comparativo al año {horizonte}</p>
              <p className="text-[10px] text-[#A8A49C]">CO₂e, derrama y salud escalados proporcionalmente desde escenario Moderado activo</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Trayectoria</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">Captura final</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">CO₂e evitado/año</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">Derrama base</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">Ahorro salud</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-[#1C1B18]">Valoración</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonTable.map((row, i) => (
                    <tr key={row.label} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]', presetTrayectoria === TRAJECTORY_UI[i]?.presetId && 'ring-1 ring-inset ring-[#3B6D11]/30')}>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                          <span className="font-medium text-[#1C1B18]">{row.label}</span>
                          {presetTrayectoria === TRAJECTORY_UI[i]?.presetId && (
                            <span className="text-[9px] text-[#3B6D11] font-semibold">• activo</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono" style={{ color: row.color }}>{row.captura.toFixed(0)}%</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#1A5FA8]">{row.co2e !== null ? `${row.co2e}K tCO₂e` : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#3B6D11]">{row.derrama !== null ? `$${row.derrama}M` : '—'}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#C0392B]">{row.salud !== null ? `$${row.salud}M` : '—'}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-semibold',
                          row.recomendacion === 'Excelente' ? 'bg-[#EAF3DE] text-[#23470A]' :
                          row.recomendacion === 'Óptimo'    ? 'bg-[#EBF3FB] text-[#0D3B7A]' :
                          row.recomendacion === 'Viable'    ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                              'bg-[#FDE8E8] text-[#7A1212]',
                        )}>
                          {row.recomendacion}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Impact index bar */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Índice de impacto relativo</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Normalizado a Ambicioso = 100 · captura final al año {horizonte}</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={comparisonTable.map(row => ({
                  name: row.label,
                  index: Math.round((row.captura / maxCaptura) * 100),
                  color: row.color,
                }))}
                layout="vertical"
                margin={{ top: 0, right: 40, left: 80, bottom: 0 }}
              >
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#4A4740' }} tickLine={false} axisLine={false} width={75} />
                <Tooltip
                  formatter={(v: number) => [`${v}`, 'Índice de impacto']}
                  contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }}
                />
                <Bar dataKey="index" radius={[0, 4, 4, 0]}>
                  {comparisonTable.map((row, i) => (
                    <Cell key={i} fill={row.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
