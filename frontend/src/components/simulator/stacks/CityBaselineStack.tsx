'use client'

import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { Lock, TrendingUp, Leaf, Heart, Users, Truck } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
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

// ── Capture trajectory (moderado profile) ────────────────────────────────────
function buildTrajectory(horizonte: number) {
  return Array.from({ length: horizonte + 1 }, (_, yr) => ({
    año: yr,
    captura: yr === 0 ? 0 : Math.round(68 * Math.pow(yr / horizonte, 0.6) * 10) / 10,
  }))
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
  } = useSimulatorStore()

  const r = resultados
  const municipioLabel = seleccionMunicipioCatalog?.nombre ?? `ZM ${zmActiva}`
  const narrative = getMunicipalNarrative(zmActiva, municipiosActivos)

  const trajectoryData = useMemo(() => buildTrajectory(horizonte), [horizonte])
  const capturaFinal = trajectoryData[trajectoryData.length - 1]?.captura ?? 68

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

      {/* ── Row 1: KPIs + Trayectoria + Donut en la misma franja ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Col 1 — KPIs de volumen */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
          <SectionHeader n={1} title="Volumen y derrama" sub="Escenario municipal · simulación" />

          {/* Hero RSU */}
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

          {/* Sub KPIs */}
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

        {/* Col 2 — Trayectoria de captura */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
          <div className="flex items-start justify-between mb-3">
            <SectionHeader n={2} title="Trayectoria de captura" sub={`Perfil moderado · ${horizonte} años`} />
            <div className="text-right shrink-0">
              <p className="font-mono text-[24px] text-[#3B6D11] leading-none font-semibold">{capturaFinal.toFixed(0)}%</p>
              <p className="text-[9px] text-[#A8A49C]">al año {horizonte}</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trajectoryData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
              <XAxis dataKey="año" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} width={32} />
              <Tooltip formatter={(v: number) => [`${v.toFixed(1)}%`, 'Captura RSU']} labelFormatter={(l: number) => `Año ${l}`} contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }} />
              <Line type="monotone" dataKey="captura" stroke="#3B6D11" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3B6D11', stroke: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Col 3 — Composición RSU donut (contexto fijo, va con los sliders visualmente) */}
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

      {/* ── Section 4: ¿Qué sí/no se ajusta? + Cadena del modelo ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sí se ajusta */}
        <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-4">
          <p className="text-[11px] font-semibold text-[#3B6D11] mb-3">✓ ¿Qué sí se ajusta?</p>
          <ul className="space-y-2">
            {[
              'Municipio / zona metropolitana activa',
              'Horizonte de análisis (3 · 5 · 10 · 15 años)',
              'Generación per cápita (kg/hab·día)',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-[11px] text-[#3B5F23]">
                <span className="text-[#5A9438] mt-0.5 shrink-0">›</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* No se ajusta */}
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

        {/* Estado del escenario */}
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
              <span className="font-medium text-[#3B6D11]">{capturaFinal.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A8A49C]">RSU diario</span>
              <span className="font-medium text-[#1C1B18]">{r ? fmt.kgd(r.rsuTotalTonDia) : '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A8A49C]">Trayectoria</span>
              <span className="font-medium text-[#1C1B18]">Moderado</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lectura municipal — colapsado por default ────────────────────── */}
      <details className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
        <summary className="cursor-pointer px-5 py-3 text-[12px] font-medium text-[#6B6760] hover:text-[#1C1B18] hover:bg-[#FAFAF8] transition-colors select-none flex items-center gap-2">
          <ScopeAnclaKicker className="text-[11px] inline" />
          Lectura municipal · {narrative.title}
        </summary>
        <div className="px-5 pb-5 pt-2 border-t border-[#F0EDE5]">
          <div className="rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] px-4 py-4">
            <p className="font-serif text-[15px] text-[#1C1B18] mb-1">{narrative.title}</p>
            <p className="text-[12px] leading-relaxed text-[#5A6347]">{narrative.body}</p>
            <p className="mt-2 text-[11px] font-medium text-[#3B6D11]">{narrative.maturity}</p>
          </div>
        </div>
      </details>

      {/* ── Impactos acumulados — colapsado por default ──────────────────── */}
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
    </div>
  )
}
