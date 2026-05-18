'use client'

import { useMemo, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
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

// ── Helpers ───────────────────────────────────────────────────────────────────

type TabId = 'infraestructura' | 'flujos'
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'infraestructura', label: 'Infraestructura en espacio-tiempo' },
  { id: 'flujos',          label: 'Flujos y hoja de ruta operativa' },
]

const FASE_COLORS = ['#C8E6A4', '#A5C97A', '#7DA84A', '#5A8C2C', '#3B6D11', '#1A4200']

// ── Main component ────────────────────────────────────────────────────────────

export function InfrastructureOperationsStack() {
  const { resultados, horizonte, municipiosActivos, seleccionMunicipioCatalog } = useSimulatorStore()
  const [tab, setTab] = useState<TabId>('infraestructura')

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

          {/* Executive reading + Brecha card */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Lectura ejecutiva */}
            <div className="lg:col-span-2 rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-4">Lectura ejecutiva de infraestructura y operación</p>
              <div className="grid grid-cols-2 gap-4 text-[11px]">
                <div>
                  <p className="text-[10px] font-semibold text-[#C0392B] mb-2 uppercase tracking-wide">¿Qué observamos?</p>
                  <ul className="space-y-1.5 text-[#6B6760]">
                    <li className="flex items-start gap-2"><span className="text-[#C0392B] shrink-0">›</span>La capacidad actual cubre solo el 22% del potencial capturable de RSU.</li>
                    <li className="flex items-start gap-2"><span className="text-[#C0392B] shrink-0">›</span>Déficit de centros de acopio para volumen estimado en fases 3–5.</li>
                    <li className="flex items-start gap-2"><span className="text-[#C0392B] shrink-0">›</span>Brecha de infraestructura limita captura y empleo formal.</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#3B6D11] mb-2 uppercase tracking-wide">¿Qué decisión habilita?</p>
                  <ul className="space-y-1.5 text-[#5A6347]">
                    <li className="flex items-start gap-2"><span className="text-[#3B6D11] shrink-0">›</span>Despliegue progresivo de centros de acopio y recicladoras por fase.</li>
                    <li className="flex items-start gap-2"><span className="text-[#3B6D11] shrink-0">›</span>Plan de sitios con demanda por zona y flujo para maximizar captura.</li>
                    <li className="flex items-start gap-2"><span className="text-[#3B6D11] shrink-0">›</span>Generación de empleo formal con {r ? fmt.num0(r.empleosTotalesDirectos) : '—'} puestos directos.</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#D4881E] mb-2 uppercase tracking-wide">¿Qué falta verificar?</p>
                  <ul className="space-y-1.5 text-[#6B6760]">
                    <li className="flex items-start gap-2"><span className="text-[#D4881E] shrink-0">›</span>Validar disponibilidad de predios, permisos y demanda por corriente.</li>
                    <li className="flex items-start gap-2"><span className="text-[#D4881E] shrink-0">›</span>Confirmar logística municipal de recolección.</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#1A5FA8] mb-2 uppercase tracking-wide">Fuente y evidencia</p>
                  <ul className="space-y-1.5 text-[#6B6760]">
                    <li className="flex items-start gap-2"><span className="text-[#1A5FA8] shrink-0">›</span>Estimaciones CA_CORNE_ALQUIMIA (médicas) — supuestos técnicos.</li>
                    <li className="flex items-start gap-2"><span className="text-[#1A5FA8] shrink-0">›</span>Referencias técnicas y supuestos operativos.</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Brecha de capacidad */}
            <div className="rounded-[12px] border border-[#FDE8E8] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Brecha de capacidad</p>
              <div className="space-y-3">
                {[
                  { label: 'Capturable',   value: rsuCapturable > 0 ? `${rsuCapturable.toFixed(1)} t/día` : '—',  color: '#3B6D11', bg: 'bg-[#EAF3DE]' },
                  { label: 'Capacidad',    value: `${capacidadInstalada} t/día`,                                   color: '#1A5FA8', bg: 'bg-[#EBF3FB]' },
                  { label: 'Brecha',       value: brechaOperativa > 0 ? `${brechaOperativa.toFixed(1)} t/día` : 'Sin brecha', color: '#C0392B', bg: 'bg-[#FDE8E8]' },
                  { label: 'Cobertura',    value: `${coberturaEst}%`,                                             color: coberturaEst >= 60 ? '#3B6D11' : '#D4881E', bg: 'bg-[#F4F2ED]' },
                ].map(item => (
                  <div key={item.label} className={cn('rounded-[8px] px-3 py-2.5', item.bg)}>
                    <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">{item.label}</p>
                    <p className="font-mono text-[18px] font-semibold mt-0.5" style={{ color: item.color }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[9px] text-[#A8A49C] leading-relaxed">
                Se requiere aumento significativo de la capacidad con la plaza para cerrar la brecha y alcanzar la cobertura objetivo.
              </p>
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

          {/* Phase capacity bar chart */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Volumen despliegue — progresión por fases</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Capacidad instalada (t/día) acumulada por fase.</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={faseChartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} width={36} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }}
                  formatter={(v: number, name: string) => [
                    name === 'capacidad' ? `${v} t/día` : `${v}%`,
                    name === 'capacidad' ? 'Capacidad' : 'Cobertura',
                  ]}
                />
                <Bar dataKey="capacidad" radius={[3, 3, 0, 0]}>
                  {faseChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.optimal ? '#3B6D11' : (FASE_COLORS[i] ?? '#8CAA7A')} />
                  ))}
                </Bar>
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
          <OperacionPERBitacora />
          <PortalEmpresarial />
        </div>
      )}
    </div>
  )
}
