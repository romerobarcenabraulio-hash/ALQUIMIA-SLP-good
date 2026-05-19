'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts'
import { Truck, Building2, AlertTriangle, TrendingUp, Users, Star } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_CA } from '@/lib/constants'
import { fmt, cn } from '@/lib/utils'
import { CentrosAcopio } from '@/components/simulator/CentrosAcopio'
import { CentrosAcopioMap } from '@/components/simulator/CentrosAcopioMap'
import { Logistica } from '@/components/simulator/Logistica'
import { SankeyFlujoResiduos } from '@/components/simulator/SankeyFlujoResiduos'
import { FlujosResiduos } from '@/components/simulator/FlujosResiduos'
import { HojaRuta } from '@/components/simulator/HojaRuta'
import { OperacionPERBitacora } from '@/components/simulator/OperacionPERBitacora'
import { PortalEmpresarial } from '@/components/simulator/PortalEmpresarial'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { ModuleBottomBar } from '@/components/simulator/ModuleBottomBar'

// ── Helpers ───────────────────────────────────────────────────────────────────

type TabId = 'infraestructura' | 'flujos'
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'infraestructura', label: 'Infraestructura en espacio-tiempo' },
  { id: 'flujos',          label: 'Flujos y hoja de ruta operativa' },
]

const FASE_COLORS = ['#C8E6A4', '#A5C97A', '#7DA84A', '#5A8C2C', '#3B6D11', '#1A4200']

// ── Spatial-temporal deployment data ─────────────────────────────────────────

type FuenteId = 'todos' | 'residencial' | 'comercial' | 'privado' | 'institucional'
const FUENTES: Array<{ id: FuenteId; label: string }> = [
  { id: 'todos',          label: 'Todos' },
  { id: 'residencial',    label: 'Residencial' },
  { id: 'comercial',      label: 'Comercial' },
  { id: 'privado',        label: 'Privado / Ind.' },
  { id: 'institucional',  label: 'Institucional' },
]

const DESPLIEGUE_ESPACIAL = [
  { fase: 1, zonas: 'Zona 1',      residencial: 60,  comercial: 0,  privado: 0,  institucional: 0,  total: 15 },
  { fase: 2, zonas: 'Zona 1–2',    residencial: 60,  comercial: 20, privado: 0,  institucional: 5,  total: 38 },
  { fase: 3, zonas: 'Zona 1–3',    residencial: 65,  comercial: 40, privado: 10, institucional: 15, total: 58 },
  { fase: 4, zonas: 'Zona 1–4',    residencial: 70,  comercial: 55, privado: 25, institucional: 25, total: 75 },
  { fase: 5, zonas: 'ZM completa', residencial: 75,  comercial: 65, privado: 40, institucional: 35, total: 90 },
]

const SOURCE_COLORS: Record<string, string> = {
  residencial:   '#3B6D11',
  comercial:     '#1A5FA8',
  privado:       '#D4881E',
  institucional: '#8B6B4A',
}

// ── Main component ────────────────────────────────────────────────────────────

export function InfrastructureOperationsStack() {
  const { resultados, horizonte, municipiosActivos, seleccionMunicipioCatalog } = useSimulatorStore()
  const [tab, setTab] = useState<TabId>('infraestructura')
  const [fuente, setFuente] = useState<FuenteId>('todos')

  const municipioLabel = seleccionMunicipioCatalog?.nombre ?? municipiosActivos[0] ?? '—'
  const r = resultados

  const rsuCapturable = useMemo(() => {
    const vol = r?.volCapturablePorMat as Record<string, number> | undefined
    if (!vol) return 0
    return Object.values(vol).reduce((s, v) => s + (v ?? 0), 0)
  }, [r])

  // Find optimal phase (Madurez ★)
  const optimalFase = FASES_CA.find(f => f.esOptimo) ?? FASES_CA[4]!
  const capacidadInstalada = optimalFase.capTonDia
  const brechaOperativa = Math.max(0, rsuCapturable - capacidadInstalada)
  const coberturaEst = rsuCapturable > 0
    ? Math.min(100, Math.round((capacidadInstalada / rsuCapturable) * 100))
    : optimalFase.coberturaPct

  // Chart data: phases coverage
  const faseChartData = FASES_CA.map(f => ({
    name: `F${f.fase}`,
    capacidad: f.capTonDia,
    cobertura: f.coberturaPct,
    optimal: f.esOptimo ?? false,
  }))

  // Dual-line deployment: CAs + Recicladoras per phase
  const despliegueLineData = FASES_CA.map(f => ({
    name: `F${f.fase}`,
    label: f.nombre,
    centrosAcopio: f.nCAs,
    recicladoras: Math.max(1, Math.floor(f.nCAs / 4)),
    cobertura: f.coberturaPct,
    esOptimo: f.esOptimo ?? false,
  }))

  // Centros propuestos card data (from optimal phase mix)
  const centrosCards = [
    { tipo: 'P', nombre: 'Centro Pequeño',  capacidad: '5 t/día',  area: '250 m²', capex: '$726K',  zonas: 'Residencial / Colonia', color: '#C8E6A4', count: 10 },
    { tipo: 'M', nombre: 'Centro Mediano',  capacidad: '15 t/día', area: '750 m²', capex: '$2.5M',  zonas: 'Comercial / Centro',   color: '#7DA84A', count: 6  },
    { tipo: 'G', nombre: 'Centro Grande',   capacidad: '50 t/día', area: '2,000 m²', capex: '$7.1M', zonas: 'Industrial / Periférico', color: '#3B6D11', count: 2  },
  ]

  return (
    <div className="space-y-4 pb-6">

      {/* ── M04 KPI strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { icon: Truck,        label: 'RSU capturable',        value: rsuCapturable > 0 ? `${rsuCapturable.toFixed(1)} t/día` : '—',       color: '#1A5FA8' },
          { icon: Building2,    label: 'Capacidad instalada',   value: `${capacidadInstalada} t/día`,                                        color: '#3B6D11' },
          { icon: AlertTriangle, label: 'Brecha operativa',     value: brechaOperativa > 0 ? `${brechaOperativa.toFixed(1)} t/día` : '—',    color: '#C0392B' },
          { icon: Users,        label: 'Empleos al cierre',     value: r ? fmt.num0(r.empleosTotalesDirectos) : '—',                         color: '#5A4A2A' },
          { icon: Building2,    label: 'Centros objetivo',      value: `${optimalFase.nCAs}`,                                                color: '#3B6D11' },
          { icon: TrendingUp,   label: 'Cobertura estimada',    value: `${coberturaEst}%`,                                                   color: coberturaEst >= 60 ? '#3B6D11' : '#D4881E' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none">{label}</p>
            </div>
            <p className="font-mono text-[14px] font-semibold leading-tight" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab navigation ─────────────────────────────────────────────── */}
      <nav className="flex gap-1.5 rounded-[10px] border border-[#E8E4DC] bg-[#F4F2ED] p-1.5">
        {TABS.map(t => (
          <button
            key={t.id}
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

      {/* ── Tab 1: Infraestructura en espacio-tiempo ───────────────────── */}
      {tab === 'infraestructura' && (
        <div className="space-y-4">
          <ScopeAnclaKicker className="text-[11px]" />

          {/* Key finding chip */}
          <div className="flex items-center gap-2 rounded-[8px] border border-[#FDE8E8] bg-[#FDE8E8]/60 px-4 py-2.5 text-[11px]">
            <span className="text-[#C0392B] shrink-0">⚠</span>
            <span className="text-[#7A1212]">
              Capacidad instalada cubre <strong>{coberturaEst}%</strong> del RSU capturable
              {brechaOperativa > 0 && <> · brecha de <strong>{brechaOperativa.toFixed(1)} t/día</strong></>}
            </span>
            <span className="ml-auto text-[10px] text-[#A8A49C] shrink-0">Ver análisis completo en Consideraciones →</span>
          </div>

          {/* Brecha de capacidad — 4-KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Capturable',  value: rsuCapturable > 0 ? `${rsuCapturable.toFixed(1)} t/día` : '—',  color: '#3B6D11', bg: 'bg-[#EAF3DE]' },
              { label: 'Capacidad',   value: `${capacidadInstalada} t/día`,                                   color: '#1A5FA8', bg: 'bg-[#EBF3FB]' },
              { label: 'Brecha',      value: brechaOperativa > 0 ? `${brechaOperativa.toFixed(1)} t/día` : 'Sin brecha', color: '#C0392B', bg: 'bg-[#FDE8E8]' },
              { label: 'Cobertura',   value: `${coberturaEst}%`,                                             color: coberturaEst >= 60 ? '#3B6D11' : '#D4881E', bg: 'bg-[#F4F2ED]' },
            ].map(item => (
              <div key={item.label} className={cn('rounded-[10px] px-3 py-2.5', item.bg)}>
                <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">{item.label}</p>
                <p className="font-mono text-[16px] font-semibold mt-0.5" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Dual-line deployment chart: CAs + Recicladoras */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Despliegue de infraestructura por fase</p>
              <p className="text-[10px] text-[#A8A49C] mb-4">Centros de Acopio (CA) y Recicladoras habilitadas por fase operativa</p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={despliegueLineData} margin={{ top: 2, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} width={24} />
                  <Tooltip
                    formatter={(v: number, name: string) => [v, name === 'centrosAcopio' ? 'Centros de Acopio' : 'Recicladoras']}
                    labelFormatter={(l: string) => `${l} — ${despliegueLineData.find(d => d.name === l)?.label ?? ''}`}
                    contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                    formatter={(v: string) => v === 'centrosAcopio' ? 'Centros de Acopio' : 'Recicladoras'}
                  />
                  <Bar dataKey="centrosAcopio" name="centrosAcopio" fill="#3B6D11" radius={[3, 3, 0, 0]}>
                    {despliegueLineData.map((d, i) => (
                      <Cell key={i} fill={d.esOptimo ? '#3B6D11' : FASE_COLORS[i] ?? '#3B6D11'} />
                    ))}
                  </Bar>
                  <Bar dataKey="recicladoras" name="recicladoras" fill="#1A5FA8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Centros propuestos card grid */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Centros propuestos — mix óptimo (F5)</p>
              <p className="text-[10px] text-[#A8A49C] mb-4">Tipología en fase de madurez: {optimalFase.mix} · {optimalFase.nCAs} CAs total</p>
              <div className="space-y-2.5">
                {centrosCards.map(c => (
                  <div key={c.tipo} className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="shrink-0 w-9 h-9 rounded-[8px] flex items-center justify-center text-white text-[12px] font-bold" style={{ background: c.color }}>
                        {c.tipo}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] font-semibold text-[#1C1B18]">{c.nombre}</p>
                          <span className="text-[10px] font-mono font-semibold text-[#3B6D11]">×{c.count}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[9px] text-[#6B6760]">
                          <span>{c.capacidad}</span>
                          <span>{c.area}</span>
                          <span className="font-mono">{c.capex} CAPEX</span>
                        </div>
                        <p className="text-[9px] text-[#A8A49C] mt-0.5">{c.zonas}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Deployment phases table */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EDE5] flex items-center justify-between">
              <div>
                <p className="text-[12px] font-semibold text-[#1C1B18]">Fases de despliegue</p>
                <p className="text-[10px] text-[#A8A49C]">Progresión por fase: CAs, capacidad, CAPEX y cobertura estimada.</p>
              </div>
              <p className="text-[10px] text-[#A8A49C]">Horizonte activo: <strong className="text-[#1C1B18]">{horizonte} años</strong></p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Fase</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Nombre</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Mix CAs</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">N.º CAs</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">Cap. t/día</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">CAPEX</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-[#1C1B18]">EBITDA/mes</th>
                    <th className="px-4 py-2.5 font-semibold text-[#1C1B18]">Cobertura</th>
                  </tr>
                </thead>
                <tbody>
                  {FASES_CA.map((f, i) => (
                    <tr
                      key={f.fase}
                      className={cn(
                        i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]',
                        f.esOptimo && 'ring-1 ring-inset ring-[#3B6D11]/30',
                      )}
                    >
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold"
                          style={{ background: FASE_COLORS[i] ?? '#3B6D11' }}>
                          F{f.fase}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-[#1C1B18]">
                        {f.nombre}
                        {f.esOptimo && (
                          <span className="ml-1.5 inline-flex items-center gap-0.5 text-[9px] text-[#3B6D11] font-bold">
                            <Star className="w-2.5 h-2.5 fill-[#3B6D11]" /> ÓPTIMO
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] text-[#6B6760]">{f.mix}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#1C1B18]">{f.nCAs}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#1C1B18]">{f.capTonDia}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-[#1C1B18]">{fmt.mxnM(f.capexMXN)}</td>
                      <td className="px-3 py-2.5 text-right font-mono" style={{ color: FASE_COLORS[i] ?? '#3B6D11' }}>
                        ${f.ebitdaMesK}K
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full min-w-[60px]">
                            <div className="h-full rounded-full" style={{ width: `${f.coberturaPct}%`, background: FASE_COLORS[i] ?? '#3B6D11' }} />
                          </div>
                          <span className="font-mono text-[10px] text-[#1C1B18] w-8 text-right">{f.coberturaPct}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-2.5 text-[9px] text-[#A8A49C] border-t border-[#F0EDE5]">
              Los montos son referenciales y no consideran operación ni coberturas adicionales.
            </p>
          </div>

          {/* ── Desglose espacio-temporal por fuente ──────────────────── */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0EDE5] flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-[#1C1B18]">Desglose espacio-temporal por fuente</p>
                <p className="text-[10px] text-[#A8A49C]">Cobertura (%) por tipo de generador en cada fase de despliegue</p>
              </div>
              {/* Source type filter */}
              <div className="flex gap-1 flex-wrap">
                {FUENTES.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFuente(f.id)}
                    className={cn(
                      'px-2.5 py-1 rounded-full border text-[10px] font-medium transition-colors',
                      fuente === f.id
                        ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                        : 'border-[#E8E4DC] text-[#6B6760] hover:border-[#3B6D11]/40 bg-[#FDFCFA]',
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Breakdown table */}
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Fase</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Zonas activas</th>
                    {(fuente === 'todos' || fuente === 'residencial') && (
                      <th className="text-right px-3 py-2.5 font-semibold" style={{ color: SOURCE_COLORS.residencial }}>Residencial</th>
                    )}
                    {(fuente === 'todos' || fuente === 'comercial') && (
                      <th className="text-right px-3 py-2.5 font-semibold" style={{ color: SOURCE_COLORS.comercial }}>Comercial</th>
                    )}
                    {(fuente === 'todos' || fuente === 'privado') && (
                      <th className="text-right px-3 py-2.5 font-semibold" style={{ color: SOURCE_COLORS.privado }}>Privado/Ind.</th>
                    )}
                    {(fuente === 'todos' || fuente === 'institucional') && (
                      <th className="text-right px-3 py-2.5 font-semibold" style={{ color: SOURCE_COLORS.institucional }}>Institucional</th>
                    )}
                    <th className="text-right px-4 py-2.5 font-semibold text-[#1C1B18]">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {DESPLIEGUE_ESPACIAL.map((f, i) => (
                    <tr key={f.fase} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-[10px] font-bold"
                          style={{ background: FASE_COLORS[i] ?? '#3B6D11' }}>
                          F{f.fase}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[#6B6760]">{f.zonas}</td>
                      {(fuente === 'todos' || fuente === 'residencial') && (
                        <td className="px-3 py-2.5 text-right font-mono" style={{ color: f.residencial > 0 ? SOURCE_COLORS.residencial : '#A8A49C' }}>
                          {f.residencial > 0 ? `${f.residencial}%` : '—'}
                        </td>
                      )}
                      {(fuente === 'todos' || fuente === 'comercial') && (
                        <td className="px-3 py-2.5 text-right font-mono" style={{ color: f.comercial > 0 ? SOURCE_COLORS.comercial : '#A8A49C' }}>
                          {f.comercial > 0 ? `${f.comercial}%` : '—'}
                        </td>
                      )}
                      {(fuente === 'todos' || fuente === 'privado') && (
                        <td className="px-3 py-2.5 text-right font-mono" style={{ color: f.privado > 0 ? SOURCE_COLORS.privado : '#A8A49C' }}>
                          {f.privado > 0 ? `${f.privado}%` : '—'}
                        </td>
                      )}
                      {(fuente === 'todos' || fuente === 'institucional') && (
                        <td className="px-3 py-2.5 text-right font-mono" style={{ color: f.institucional > 0 ? SOURCE_COLORS.institucional : '#A8A49C' }}>
                          {f.institucional > 0 ? `${f.institucional}%` : '—'}
                        </td>
                      )}
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-[#E8E4DC] rounded-full hidden sm:block">
                            <div className="h-full rounded-full bg-[#3B6D11]" style={{ width: `${f.total}%` }} />
                          </div>
                          <span className="font-mono font-medium text-[#1C1B18]">{f.total}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="px-5 py-2 text-[9px] text-[#A8A49C] border-t border-[#F0EDE5]">
              Porcentajes representan cobertura estimada del tipo de fuente en esa fase. Valores de referencia — validar con plan operativo municipal.
            </p>
          </div>

          {/* Stacked bar chart: source progression by phase */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Progresión por tipo de fuente</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Cobertura (%) apilada por fase · {fuente === 'todos' ? 'todos los tipos' : FUENTES.find(f => f.id === fuente)?.label}</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart
                data={DESPLIEGUE_ESPACIAL.map(f => ({ name: `F${f.fase}`, ...f }))}
                margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} width={30} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }}
                  formatter={(v: number, name: string) => [`${v}%`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                {(fuente === 'todos' || fuente === 'residencial') && (
                  <Bar key="residencial" dataKey="residencial" name="Residencial" stackId="a" fill={SOURCE_COLORS.residencial} radius={[0, 0, 0, 0]} />
                )}
                {(fuente === 'todos' || fuente === 'comercial') && (
                  <Bar key="comercial" dataKey="comercial" name="Comercial" stackId="a" fill={SOURCE_COLORS.comercial} />
                )}
                {(fuente === 'todos' || fuente === 'privado') && (
                  <Bar key="privado" dataKey="privado" name="Privado/Ind." stackId="a" fill={SOURCE_COLORS.privado} />
                )}
                {(fuente === 'todos' || fuente === 'institucional') && (
                  <Bar key="institucional" dataKey="institucional" name="Institucional" stackId="a" fill={SOURCE_COLORS.institucional} radius={[3, 3, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* CentrosAcopio + Mapa directorio + Logistica */}
          <CentrosAcopio />

          {/* Directorio interactivo de centros de acopio */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-semibold text-[#1C1B18]">Directorio de centros de acopio</p>
                <p className="text-[10px] text-[#A8A49C]">
                  Puntos de entrega para ciudadanos y empresas — filtrado por material
                </p>
              </div>
            </div>
            <CentrosAcopioMap />
          </div>

          <Logistica />
        </div>
      )}

      {/* ── Tab 2: Flujos y hoja de ruta operativa ─────────────────────── */}
      {tab === 'flujos' && (
        <div className="space-y-4">
          <ScopeAnclaKicker className="text-[11px]" />

          {/* Operational context */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Vista operativa — cierre de ciclo</p>
            <p className="text-[12px] text-[#6B6760]">
              Cómo fluyen los residuos desde las fuentes de generación hasta los destinos de valorización o disposición final.
              Usa el Sankey para identificar brechas de captura y oportunidades de cierre de ciclo.
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              {[
                { label: 'Municipio', value: municipioLabel },
                { label: 'Horizonte', value: `${horizonte} años` },
                { label: 'Circularidad actual', value: r ? `${((r.ingresosBrutos / Math.max(r.ingresosBrutos + (r.ahorroDisposicion ?? 0), 1)) * 100).toFixed(1)}%` : '—' },
                { label: 'Derrama total', value: r ? fmt.mxnM(r.ingresosBrutos) : '—' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 rounded-[6px] bg-[#F4F2ED] px-3 py-1.5 text-[11px]">
                  <span className="text-[#A8A49C]">{item.label}:</span>
                  <span className="font-medium text-[#1C1B18]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <SankeyFlujoResiduos />
          <FlujosResiduos />
          <HojaRuta />

          {/* Hoja de ruta ejecutiva municipal — action grid */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Hoja de ruta ejecutiva municipal</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Acciones clave por dimensión para cerrar el ciclo de residuos en el municipio</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { fase: 'F1–F2', titulo: 'Habilitación legal',        desc: 'Reformar reglamento, crear adendas y establecer base sancionatoria.',        color: '#C8E6A4', icon: '⚖' },
                { fase: 'F2–F3', titulo: 'Infraestructura piloto',    desc: 'Instalar primeros 6 CAs en zonas de alta densidad y cobertura residencial.',  color: '#7DA84A', icon: '🏗' },
                { fase: 'F3–F4', titulo: 'Separación en origen',      desc: 'Programa de comunicación ciudadana, capacitación y rutas diferenciadas.',     color: '#5A8C2C', icon: '♻' },
                { fase: 'F3–F5', titulo: 'Mercado de materiales',     desc: 'Contratos con recicladores formales y plataforma de trazabilidad.',           color: '#3B6D11', icon: '📦' },
                { fase: 'F4–F5', titulo: 'Escala metropolitana',      desc: 'Convenios ZM, homologar tarifas, sistema unificado de reporte.',              color: '#1A5FA8', icon: '🌐' },
                { fase: 'F5+',   titulo: 'Circularidad y ESG',        desc: 'Bonos verdes, reporte ESG y metas de economía circular para Cabildo.',        color: '#5A4A2A', icon: '🏆' },
              ].map(item => (
                <div key={item.titulo} className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[16px]">{item.icon}</span>
                    <div>
                      <p className="text-[10px] font-mono text-[#A8A49C]">{item.fase}</p>
                      <p className="text-[11px] font-semibold text-[#1C1B18]">{item.titulo}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#6B6760] leading-relaxed">{item.desc}</p>
                  <div className="mt-2 h-1 rounded-full" style={{ background: item.color }} />
                </div>
              ))}
            </div>
          </div>

          <OperacionPERBitacora />
          <PortalEmpresarial />
        </div>
      )}

      <ModuleBottomBar onProfundizar={() => setTab('flujos')} />
    </div>
  )
}
