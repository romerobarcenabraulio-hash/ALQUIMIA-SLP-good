'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'
import {
  AlertTriangle, Users, MapPin, Building2, ArrowRight, Zap,
  Target, Package, ChevronDown,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'
import { TRAJECTORY_UI, CA_CONFIG, FASES_CA } from '@/lib/constants'
import { ExpandableChart } from '@/components/ui/ExpandableChart'

// ── Center table generation ───────────────────────────────────────────────────

type CenterRow = {
  id: string; zona: string; tipo: string; estado: string
  uso: string; vial: string; permiso: string; prioridad: string; cap: number; fase: string
}

const ZONAS_GENERICAS = ['Norte', 'Sur', 'Poniente', 'Oriente', 'Centro', 'Periférico']
const LETRAS_ZONA = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']

function generateCentersTable(mixCAs: { P: number; M: number; G: number }): CenterRow[] {
  const rows: CenterRow[] = []
  let idx = 1
  const zonaIdx = () => ZONAS_GENERICAS[(idx - 1) % ZONAS_GENERICAS.length] ?? 'Norte'
  const letraIdx = () => LETRAS_ZONA[(idx - 1) % LETRAS_ZONA.length] ?? 'A'
  const addRow = (tipo: string, cap: number, prioridad: string, fase: string) => {
    rows.push({
      id: `CA-${String(idx).padStart(2, '0')} Zona ${letraIdx()}`,
      zona: zonaIdx(), tipo, estado: idx <= 2 ? 'En diseño' : 'Planeación',
      uso: tipo === 'Grande' ? 'Industrial/Mixto' : 'Residencial',
      vial: tipo === 'Grande' ? 'Muy buena' : tipo === 'Mediano' ? 'Buena' : 'Adecuada',
      permiso: idx === 2 ? 'Aprobado' : idx === 1 ? 'En trámite' : 'Pendiente',
      prioridad, cap, fase,
    })
    idx++
  }
  for (let i = 0; i < (mixCAs.P ?? 0); i++) addRow('Pequeño', 5, i < 2 ? 'Alta' : 'Media', i < 2 ? 'F2' : 'F3')
  for (let i = 0; i < (mixCAs.M ?? 0); i++) addRow('Mediano', 15, i < 1 ? 'Alta' : 'Media', 'F2')
  for (let i = 0; i < (mixCAs.G ?? 0); i++) addRow('Grande', 50, 'Alta', 'F3')
  if (rows.length === 0) addRow('Pequeño', 5, 'Alta', 'F2')
  return rows
}

// ── DecisionCommitBar ─────────────────────────────────────────────────────────

function DecisionCommitBar({
  municipio, horizonte, trayectoria, rsuDia,
}: { municipio: string; horizonte: number; trayectoria: string; rsuDia: number }) {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4 mb-5">
      <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-3 font-semibold">Decisiones comprometidas — no editables en este módulo</p>
      <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-2">
        <div className="flex-1 min-w-[160px] rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#3B6D11] font-bold mb-1.5">M01 · Escenario base</p>
          <p className="text-[13px] font-semibold text-[#1C1B18]">{municipio}</p>
          <p className="text-[11px] text-[#5A5750]">{horizonte} años · {trayectoria}</p>
          <p className="text-[11px] font-semibold text-[#3B6D11]">{fmt.kgd(rsuDia)} capturable</p>
        </div>
        <div className="hidden lg:flex items-center"><ArrowRight className="w-4 h-4 text-[#A8A49C] shrink-0" /></div>
        <div className="flex-1 min-w-[160px] rounded-[10px] border border-[#E8D4A0] bg-[#FEF7E7] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#D4881E] font-bold mb-1.5">M05 · Plan logístico</p>
          <p className="text-[13px] font-semibold text-[#1C1B18]">Fase actual F3</p>
          <p className="text-[11px] text-[#5A5750]">Oleadas territoriales · calendario aprobado</p>
        </div>
        <div className="hidden lg:flex items-center"><ArrowRight className="w-4 h-4 text-[#A8A49C] shrink-0" /></div>
        <div className="flex-1 min-w-[160px] rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C] font-bold mb-1.5">M06 · Decisión actual</p>
          <p className="text-[13px] font-semibold text-[#1C1B18]">Dimensionar centros de acopio</p>
          <p className="text-[11px] text-[#5A5750]">Capacidad · brechas · tipología P/M/G</p>
        </div>
      </div>
    </div>
  )
}

// ── InfrastructureKpiRow ──────────────────────────────────────────────────────

function InfrastructureKpiRow({
  rsuDia, capInstalada, brecha, empleos, centrosObj, cobertura,
}: {
  rsuDia: number; capInstalada: number; brecha: number
  empleos: number; centrosObj: number; cobertura: number
}) {
  const hasBrecha = brecha > 0
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5"><Package className="w-3.5 h-3.5 text-[#1A5FA8]" /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">RSU capturable</p></div>
        <p className="font-bold text-[22px] text-[#1A5FA8]">{fmt.kgd(rsuDia)}</p>
        <p className="text-[9px] text-[#A8A49C]">100% del potencial</p>
      </div>
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5"><Building2 className="w-3.5 h-3.5 text-[#3B6D11]" /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">Capacidad instalada</p></div>
        <p className="font-bold text-[22px] text-[#3B6D11]">{fmt.kgd(capInstalada)}</p>
        <p className="text-[9px] text-[#A8A49C]">{rsuDia > 0 ? Math.round((capInstalada / rsuDia) * 100) : 0}% del potencial</p>
      </div>
      <div className={cn('rounded-[10px] border p-3.5', hasBrecha ? 'border-[#FCA5A5] bg-[#FFF5F5]' : 'border-[#E8E4DC] bg-white')}>
        <div className="flex items-center gap-1.5 mb-1.5"><AlertTriangle className={cn('w-3.5 h-3.5', hasBrecha ? 'text-[#C0392B]' : 'text-[#A8A49C]')} /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">Brecha operativa</p></div>
        <p className={cn('font-bold text-[22px]', hasBrecha ? 'text-[#C0392B]' : 'text-[#3B6D11]')}>{fmt.kgd(Math.abs(brecha))}</p>
        <p className="text-[9px] text-[#A8A49C]">{hasBrecha ? `${Math.round((brecha / rsuDia) * 100)}% sin cubrir` : 'Sin brecha'}</p>
      </div>
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5"><Users className="w-3.5 h-3.5 text-[#8B6B4A]" /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">Empleos al cierre</p></div>
        <p className="font-bold text-[22px] text-[#8B6B4A]">{empleos}</p>
        <p className="text-[9px] text-[#A8A49C]">Directos + indirectos</p>
      </div>
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5"><MapPin className="w-3.5 h-3.5 text-[#1A5FA8]" /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">Centros objetivo</p></div>
        <p className="font-bold text-[22px] text-[#1A5FA8]">{centrosObj}</p>
        <p className="text-[9px] text-[#A8A49C]">En horizonte planificado</p>
      </div>
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
        <div className="flex items-center gap-1.5 mb-1.5"><Target className="w-3.5 h-3.5 text-[#D4881E]" /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">Cobertura estimada</p></div>
        <p className="font-bold text-[22px] text-[#D4881E]">{cobertura}%</p>
        <p className="text-[9px] text-[#A8A49C]">Población atendida</p>
      </div>
    </div>
  )
}

// ── RailSection ───────────────────────────────────────────────────────────────

function RailSection({ title, children, open: defaultOpen = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 text-left">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760] font-bold">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760] space-y-1">{children}</div>}
    </div>
  )
}

// ── RightRail ─────────────────────────────────────────────────────────────────

function RightRail() {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Consideraciones</p>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#EAF3DE] text-[#2D5A0D]">Confianza 58%</span>
      </div>
      <RailSection title="Cómo se calcula" open>
        <p>Capacidades derivadas de CA_CONFIG (P/M/G). Brecha = RSU capturable − capacidad instalada. Empleos = suma de empleos por tipo de centro × mix del escenario.</p>
      </RailSection>
      <RailSection title="Decisión que habilita">
        <p>Definir qué, dónde y cuándo instalar centros para cerrar la brecha y cumplir el plan operativo.</p>
      </RailSection>
      <RailSection title="Metodología">
        <p>Capacidades por tipología (P/M/G) con benchmark sectorial. Localización multi-criterio: accesibilidad, generación, conectividad y suelo. Fuente: CA_CONFIG y FASES_CA.</p>
      </RailSection>
      <RailSection title="Módulos relacionados">
        <p>M07 Organigrama: quién opera cada centro. M08 Logística: rutas y flota. M09 Costos: CAPEX/OPEX del sistema.</p>
      </RailSection>
      <RailSection title="Qué verificar aún">
        <ul className="space-y-1">
          {[
            'Disponibilidad y compatibilidad de suelo, permisos ambientales, factibilidad eléctrica.',
            'Acuerdos intermunicipales y capacidad del operador ancla.',
          ].map(v => (
            <li key={v} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#D4881E] shrink-0" />{v}</li>
          ))}
        </ul>
      </RailSection>
      <RailSection title="Condiciones de lectura">
        <p className="text-[9px] text-[#A8A49C]">Estimaciones del modelo con datos de referencia sectorial. Deben validarse con información municipal actualizada antes de tomar decisiones de inversión.</p>
      </RailSection>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function InfrastructureOperationsStack() {
  const { zmActiva, horizonte, presetTrayectoria, resultados, mixCAs, seleccionMunicipioCatalog } = useSimulatorStore()

  const trayectoria = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)?.label ?? presetTrayectoria
  const municipio   = seleccionMunicipioCatalog?.nombre ?? zmActiva

  const centersTable = useMemo(() => generateCentersTable(mixCAs), [mixCAs])
  const rsuDia = resultados?.rsuTotalTonDia ?? 379.3

  const capInstalada = useMemo(() =>
    (mixCAs.P ?? 0) * CA_CONFIG.P.capTonDia +
    (mixCAs.M ?? 0) * CA_CONFIG.M.capTonDia +
    (mixCAs.G ?? 0) * CA_CONFIG.G.capTonDia,
  [mixCAs])

  const brecha   = Math.max(0, rsuDia - capInstalada)
  const empleos  = resultados?.empleosTotalesDirectos ?? (
    (mixCAs.P ?? 0) * CA_CONFIG.P.empleos +
    (mixCAs.M ?? 0) * CA_CONFIG.M.empleos +
    (mixCAs.G ?? 0) * CA_CONFIG.G.empleos
  )
  const centros  = (mixCAs.P ?? 0) + (mixCAs.M ?? 0) + (mixCAs.G ?? 0)
  const targetCA = FASES_CA.find(f => f.esOptimo)?.nCAs ?? 18
  const cobertura = FASES_CA.find(f => f.nCAs === centros)?.coberturaPct ?? Math.round((capInstalada / Math.max(rsuDia, 1)) * 90)

  const phaseData = FASES_CA.map(f => ({
    fase: `F${f.fase}`, centros: f.nCAs, cap: f.capTonDia,
    cobertura: f.coberturaPct, capex: Math.round(f.capexMXN / 1_000_000),
  }))

  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div>
          <DecisionCommitBar
            municipio={municipio} horizonte={horizonte}
            trayectoria={trayectoria} rsuDia={rsuDia}
          />
          <InfrastructureKpiRow
            rsuDia={rsuDia} capInstalada={capInstalada} brecha={brecha}
            empleos={empleos} centrosObj={targetCA} cobertura={cobertura}
          />

          {/* Capacity decision chain */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5 mb-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-4">Cadena de decisión de capacidad</p>
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
              {[
                { label: 'RSU capturable', value: fmt.kgd(rsuDia), sub: 'Potencial total del municipio', color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5' },
                null,
                { label: 'Capacidad instalada', value: fmt.kgd(capInstalada), sub: 'Capacidad operativa actual', color: '#3B6D11', bg: '#EAF3DE', border: '#D7E8C0' },
                null,
                { label: 'Brecha operativa', value: fmt.kgd(brecha), sub: 'Capacidad por instalar', color: '#C0392B', bg: '#FFF5F5', border: '#FCA5A5' },
                null,
                { label: 'Acción requerida', value: `Instalar ${targetCA} centros`, sub: 'Priorizar zonas F3–F5', color: '#D4881E', bg: '#FEF7E7', border: '#FDE68A' },
              ].map((b, i) => b === null
                ? <ArrowRight key={i} className="w-4 h-4 text-[#A8A49C] shrink-0 hidden lg:block" />
                : (
                  <div key={b.label} className="flex-1 min-w-[130px] rounded-[10px] border px-3 py-2.5" style={{ borderColor: b.border, background: b.bg }}>
                    <p className="text-[8px] uppercase tracking-[0.07em] font-bold mb-1" style={{ color: b.color }}>{b.label}</p>
                    <p className="text-[20px] font-bold leading-none mb-0.5" style={{ color: b.color }}>{b.value}</p>
                    <p className="text-[9px] text-[#6B6760]">{b.sub}</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Portfolio */}
          <div className="space-y-2.5 mb-5">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Portafolio recomendado de infraestructura</p>
            {(['P', 'M', 'G'] as const).map(tipo => {
              const c = CA_CONFIG[tipo]
              const meta = {
                P: { label: 'Centro Pequeño', color: '#3B6D11', uso: 'Colonias y microrregiones', funcion: 'Recolección, pretratamiento y valorización inicial' },
                M: { label: 'Centro Mediano', color: '#1A5FA8', uso: 'Polos urbanos y corredores', funcion: 'Recuperación de materiales y valorización' },
                G: { label: 'Centro Grande', color: '#8B6B4A', uso: 'Polígonos industriales o periféricos', funcion: 'Clasificación avanzada, tratamiento y valorización energética' },
              }[tipo]
              const pxn = (n: number) => `$${n.toLocaleString('es-MX')}`
              return (
                <div key={tipo} className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded" style={{ background: meta.color }}>{meta.label}</span>
                        <span className="text-[10px] font-bold text-[#1C1B18]">{c.capTonDia} t/día</span>
                      </div>
                      <p className="text-[10px] text-[#6B6760]">{meta.funcion}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-[9px]">
                    {[
                      ['Uso recom.', meta.uso],
                      ['CAPEX', pxn(c.capexMXN)],
                      ['OPEX/mes', pxn(c.opexMesMXN)],
                      ['Payback', `${c.paybackMeses} meses`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[#A8A49C] uppercase tracking-wide">{k}</p>
                        <p className="font-semibold text-[#1C1B18] text-[10px]">{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Phase deployment chart */}
          <ExpandableChart chartId="m06-phase-deploy" title="Despliegue de infraestructura por fase" subtitle="Centros activos · capacidad instalada · cobertura acumulada">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5 mb-5">
              <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Despliegue de infraestructura por fase</p>
              <p className="text-[10px] text-[#A8A49C] mb-4">Centros activos · capacidad instalada · cobertura acumulada · CAPEX por fase</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-[#A8A49C] mb-2">Centros activos y capacidad (t/día)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={phaseData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                      <XAxis dataKey="fase" tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="l" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar yAxisId="l" dataKey="centros" name="Centros" fill="#3B6D11" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="r" dataKey="cap" name="Cap. t/día" fill="#1A5FA8" radius={[4, 4, 0, 0]} opacity={0.7} />
                      {rsuDia > 0 && <ReferenceLine yAxisId="r" y={rsuDia} stroke="#C0392B" strokeDasharray="4 3" label={{ value: 'RSU obj.', position: 'right', fontSize: 8, fill: '#C0392B' }} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-[10px] text-[#A8A49C] mb-2">Cobertura (%) y CAPEX acumulado (M MXN)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={phaseData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                      <XAxis dataKey="fase" tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="cobertura" name="Cobertura %" fill="#D4881E" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="capex" name="CAPEX M MXN" fill="#8B6B4A" radius={[4, 4, 0, 0]} opacity={0.7} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </ExpandableChart>

          {/* Center table */}
          <ExpandableChart chartId="m06-center-table" title="Centros propuestos y gates de habilitación" subtitle="Estado · uso de suelo · conectividad · permiso · prioridad">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden mb-5">
              <div className="px-5 py-4 border-b border-[#F0EDE5]">
                <p className="text-[12px] font-semibold text-[#1C1B18]">Centros propuestos y gates de habilitación</p>
                <p className="text-[10px] text-[#A8A49C]">Un centro no puede ser operable sin cumplir los gates mínimos</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                      {['Centro', 'Zona', 'Tipo', 'Estado', 'Uso de suelo', 'Conectividad vial', 'Permiso', 'Prioridad'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[9px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {centersTable.map((c, i) => {
                      const prioColor = c.prioridad === 'Alta' ? 'bg-[#FDE8E8] text-[#B91C1C]' : c.prioridad === 'Media' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#F4F2ED] text-[#6B6760]'
                      const estadoColor = c.estado === 'En diseño' ? 'text-[#1A5FA8]' : 'text-[#6B6760]'
                      return (
                        <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                          <td className="px-3 py-2.5 font-semibold text-[#1C1B18]">{c.id}</td>
                          <td className="px-3 py-2.5 text-[#6B6760]">{c.zona}</td>
                          <td className="px-3 py-2.5"><span className="px-1.5 py-0.5 rounded-full bg-[#EAF3DE] text-[#2D5A0D] font-semibold">{c.tipo}</span></td>
                          <td className={cn('px-3 py-2.5 font-semibold', estadoColor)}>{c.estado}</td>
                          <td className="px-3 py-2.5 text-[#6B6760]">{c.uso}</td>
                          <td className="px-3 py-2.5 text-[#6B6760]">{c.vial}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn('px-1.5 py-0.5 rounded font-semibold', c.permiso === 'Aprobado' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#92400E]')}>{c.permiso}</span>
                          </td>
                          <td className="px-3 py-2.5"><span className={cn('px-1.5 py-0.5 rounded font-semibold', prioColor)}>{c.prioridad}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </ExpandableChart>

          {/* Executive reading */}
          <div className="rounded-[12px] border-2 border-[#3B6D11] bg-[#F4FAEC] px-6 py-5 flex items-start gap-4">
            <Zap className="w-7 h-7 text-[#3B6D11] shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-[13px] font-bold text-[#3B6D11] mb-2">Lectura ejecutiva del motor</p>
              <p className="text-[13px] text-[#3B5F23] leading-relaxed mb-3">
                La brecha de <strong>{fmt.kgd(brecha)}</strong> implica que, sin nueva infraestructura, el municipio
                dependerá de traslados fuera de su territorio con mayores costos, tiempos y emisiones.
                Instalar <strong>{targetCA} centros</strong> en el horizonte F3–F5 permitiría capturar el{' '}
                {FASES_CA.find(f => f.esOptimo)?.coberturaPct ?? 61}% del potencial.
                Ver M07 para el organigrama de quién opera cada centro, M08 para las rutas y M09 para el CAPEX detallado.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: 'Recomendación', value: 'Plan moderado F3–F5', color: '#3B6D11' },
                  { label: 'Riesgo principal', value: 'Predios y permisos', color: '#C0392B' },
                  { label: 'Condición crítica', value: 'Operador contratado', color: '#D4881E' },
                  { label: 'Siguiente paso', value: 'Ver M07 Organigrama', color: '#1A5FA8' },
                ].map(c => (
                  <div key={c.label} className="rounded-[8px] border border-[#C4DFA0] bg-white px-2.5 py-2">
                    <p className="text-[8px] uppercase text-[#A8A49C]">{c.label}</p>
                    <p className="text-[11px] font-semibold" style={{ color: c.color }}>{c.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <RightRail />
      </div>
    </div>
  )
}
