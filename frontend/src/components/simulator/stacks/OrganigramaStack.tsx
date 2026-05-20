'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Users, ChevronDown, Shield, CheckCircle } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { CA_CONFIG } from '@/lib/constants'

// ── Staff data per CA type ────────────────────────────────────────────────────

const STAFF: Record<'P' | 'M' | 'G', Array<{ puesto: string; cantidad: number; salario: number; nivel: string }>> = {
  P: [
    { puesto: 'Supervisor operativo', cantidad: 1, salario: 17500, nivel: 'supervision' },
    { puesto: 'Operario clasificación', cantidad: 2, salario: 9000, nivel: 'operativo' },
    { puesto: 'Chofer auxiliar', cantidad: 1, salario: 11000, nivel: 'operativo' },
    { puesto: 'Seguridad / limpieza', cantidad: 1, salario: 7500, nivel: 'operativo' },
  ],
  M: [
    { puesto: 'Administrador CA', cantidad: 1, salario: 22000, nivel: 'supervision' },
    { puesto: 'Supervisor operativo', cantidad: 2, salario: 17500, nivel: 'supervision' },
    { puesto: 'Operario clasificación', cantidad: 6, salario: 9000, nivel: 'operativo' },
    { puesto: 'Chofer auxiliar', cantidad: 3, salario: 11000, nivel: 'operativo' },
    { puesto: 'Seguridad / limpieza', cantidad: 2, salario: 7500, nivel: 'operativo' },
  ],
  G: [
    { puesto: 'Jefe de planta', cantidad: 1, salario: 35000, nivel: 'direccion' },
    { puesto: 'Administrador CA', cantidad: 2, salario: 22000, nivel: 'supervision' },
    { puesto: 'Supervisor operativo', cantidad: 4, salario: 17500, nivel: 'supervision' },
    { puesto: 'Operario clasificación', cantidad: 16, salario: 9000, nivel: 'operativo' },
    { puesto: 'Chofer auxiliar', cantidad: 6, salario: 11000, nivel: 'operativo' },
    { puesto: 'Mantenimiento', cantidad: 3, salario: 14000, nivel: 'operativo' },
    { puesto: 'Seguridad / limpieza', cantidad: 2, salario: 7500, nivel: 'operativo' },
  ],
}

const OPEX_CONCEPTS: Record<'P' | 'M' | 'G', Array<{ concepto: string; pct: number }>> = {
  P: [
    { concepto: 'Nómina con prestaciones', pct: 52 },
    { concepto: 'Energía eléctrica', pct: 15 },
    { concepto: 'Transporte / combustible', pct: 13 },
    { concepto: 'Mantenimiento equipo', pct: 8 },
    { concepto: 'Insumos y consumibles', pct: 7 },
    { concepto: 'Agua y servicios', pct: 3 },
    { concepto: 'Seguros', pct: 2 },
  ],
  M: [
    { concepto: 'Nómina con prestaciones', pct: 48 },
    { concepto: 'Energía eléctrica', pct: 17 },
    { concepto: 'Transporte / combustible', pct: 14 },
    { concepto: 'Mantenimiento equipo', pct: 10 },
    { concepto: 'Insumos y consumibles', pct: 6 },
    { concepto: 'Agua y servicios', pct: 3 },
    { concepto: 'Seguros', pct: 2 },
  ],
  G: [
    { concepto: 'Nómina con prestaciones', pct: 42 },
    { concepto: 'Energía eléctrica', pct: 20 },
    { concepto: 'Transporte / combustible', pct: 13 },
    { concepto: 'Mantenimiento equipo', pct: 12 },
    { concepto: 'Insumos y consumibles', pct: 8 },
    { concepto: 'Agua y servicios', pct: 3 },
    { concepto: 'Seguros', pct: 2 },
  ],
}

const ADOPTION_PHASES = [
  {
    id: 'F1', label: 'F1 · Piloto inicial', dur: '8 h presencial + 4 h e-learning',
    participantes: 'Operadores de CA, recolectores de ruta, supervisores de zona',
    temas: ['Clasificación de RSU', 'Manejo seguro', 'Registro PER', 'Comunicación vecinal'],
    kpi: 'Tasa de captura ≥35% al cierre del trimestre 2',
  },
  {
    id: 'F2', label: 'F2 · Expansión territorial', dur: '8 h taller + 4 h recorrido',
    participantes: 'Promotores ciudadanos, líderes de manzana, personal de recolección ampliado',
    temas: ['Separación en fuente', 'Uso digital básico', 'Técnica de compostaje', 'Trazabilidad'],
    kpi: 'Adopción ≥55% en zona de expansión',
  },
  {
    id: 'F3', label: 'F3 · Consolidación y mejora', dur: '4 h presencial + protocolo web',
    participantes: 'Inspectores, comercios registrados, cuarta categoría',
    temas: ['Reglamento municipal', 'Informe RSU no conformes', 'Reporte a API'],
    kpi: 'Circularidad potencial ≥40% al cierre de año 3',
  },
]

// RACI — activities × roles
const RACI_ROWS = [
  { actividad: 'Pesaje diario de material', coord: 'A', dirCA: 'R', supervisor: 'R', operario: 'I' },
  { actividad: 'Bitácora PER (reporte operativo)', coord: 'A', dirCA: 'R', supervisor: 'R', operario: 'I' },
  { actividad: 'Control de calidad de separación', coord: 'I', dirCA: 'A', supervisor: 'R', operario: 'C' },
  { actividad: 'Reporte mensual a autoridad', coord: 'R', dirCA: 'A', supervisor: 'I', operario: '' },
  { actividad: 'Gestión de compradores / precios', coord: 'R', dirCA: 'C', supervisor: 'I', operario: '' },
  { actividad: 'Mantenimiento preventivo equipo', coord: 'I', dirCA: 'A', supervisor: 'R', operario: 'R' },
  { actividad: 'Capacitación ciudadana en zona', coord: 'A', dirCA: 'C', supervisor: 'R', operario: 'R' },
  { actividad: 'Autorización de gasto OPEX', coord: 'R', dirCA: 'A', supervisor: 'I', operario: '' },
]

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

function raciColor(val: string) {
  if (val === 'R') return 'bg-[#EAF3DE] text-[#23470A] font-bold'
  if (val === 'A') return 'bg-[#FEF3C7] text-[#92400E] font-bold'
  if (val === 'C') return 'bg-[#EBF3FB] text-[#0D3B7A] font-semibold'
  if (val === 'I') return 'bg-[#F4F2ED] text-[#6B6760]'
  return 'bg-transparent text-[#A8A49C]'
}

export function OrganigramaStack() {
  const { mixCAs, resultados } = useSimulatorStore()
  const [caTipo, setCaTipo] = useState<'P' | 'M' | 'G'>('M')

  const ca = CA_CONFIG[caTipo]
  const staffList = STAFF[caTipo]
  const opexList = OPEX_CONCEPTS[caTipo]
  const prestFactor = 1.35
  const pxn = (n: number) => `$${n.toLocaleString('es-MX')}`

  const totalPersonal = staffList.reduce((s, p) => s + p.cantidad, 0)
  const totalNomina = staffList.reduce((s, p) => s + p.cantidad * p.salario * prestFactor, 0)

  // Total staff across all CAs
  const totalSistema = (mixCAs.P * CA_CONFIG.P.empleos) + (mixCAs.M * CA_CONFIG.M.empleos) + (mixCAs.G * CA_CONFIG.G.empleos)

  // Chart data for staff by level
  const staffByLevel = [
    { nivel: 'Dirección', P: 0, M: 1, G: 1 },
    { nivel: 'Supervisión', P: 1, M: 3, G: 6 },
    { nivel: 'Operativo', P: 4, M: 11, G: 27 },
  ]

  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div className="space-y-5">

          {/* System-level KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Personal total sistema', value: totalSistema, sub: 'Empleos directos' },
              { label: 'Turnos por CA Grande', value: '3 turnos', sub: '24h operación continua' },
              { label: 'Factor prestaciones', value: '1.35×', sub: 'IMSS Ramo 37, 2025' },
              { label: 'Nómina total sistema', value: pxn(resultados?.empleosTotalesDirectos ? resultados.empleosTotalesDirectos * 12000 : totalSistema * 12000), sub: 'Est. mensual con prest.' },
            ].map(c => (
              <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5"><Users className="w-3.5 h-3.5 text-[#3B6D11]" /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">{c.label}</p></div>
                <p className="font-bold text-[20px] text-[#3B6D11]">{typeof c.value === 'number' ? c.value : c.value}</p>
                <p className="text-[9px] text-[#A8A49C]">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Org chart visual */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-4">Estructura orgánica del programa</p>
            <div className="flex flex-col items-center gap-0">
              {/* Level 0 — Program coordinator */}
              <div className="rounded-[10px] border-2 border-[#3B6D11] bg-[#EAF3DE] px-5 py-3 text-center min-w-[200px]">
                <p className="text-[10px] font-bold text-[#23470A] uppercase tracking-wide">Coordinador del Programa</p>
                <p className="text-[9px] text-[#5A7A3A]">Dirección Municipal / Dir. Medio Ambiente</p>
              </div>
              <div className="w-px h-5 bg-[#C9DDB1]" />

              {/* Level 1 — Director CA per type */}
              <div className="flex gap-4 flex-wrap justify-center">
                {[
                  { label: 'Director CA Grande', sub: '1 por CA tipo G', color: '#8B6B4A', border: '#E5D5C5', bg: '#FAF6F2' },
                  { label: 'Administrador CA Mediano', sub: '1 por CA tipo M', color: '#1A5FA8', border: '#BDD7F5', bg: '#EBF3FB' },
                  { label: 'Supervisor CA Pequeño', sub: '1 por CA tipo P', color: '#3B6D11', border: '#D7E8C0', bg: '#EAF3DE' },
                ].map(n => (
                  <div key={n.label} className="flex flex-col items-center gap-0">
                    <div className="w-px h-5 bg-[#C9DDB1]" />
                    <div className="rounded-[10px] border px-4 py-2.5 text-center min-w-[160px]" style={{ borderColor: n.border, background: n.bg }}>
                      <p className="text-[10px] font-bold" style={{ color: n.color }}>{n.label}</p>
                      <p className="text-[9px] text-[#A8A49C]">{n.sub}</p>
                    </div>
                    <div className="w-px h-4 bg-[#E8E4DC]" />
                    <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-1.5 text-center min-w-[120px]">
                      <p className="text-[9px] font-semibold text-[#4A4740]">Supervisor de turno</p>
                      <p className="text-[8px] text-[#A8A49C]">Bitácora PER · pesaje</p>
                    </div>
                    <div className="w-px h-4 bg-[#E8E4DC]" />
                    <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-1.5 text-center min-w-[120px]">
                      <p className="text-[9px] font-semibold text-[#4A4740]">Operadores</p>
                      <p className="text-[8px] text-[#A8A49C]">Clasificación · composta · logística</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CA type selector + staff table */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
            <div className="flex items-center gap-3 mb-4">
              <p className="text-[12px] font-semibold text-[#1C1B18]">Plantilla por tipo de CA</p>
              {(['P', 'M', 'G'] as const).map(t => (
                <button key={t} type="button" onClick={() => setCaTipo(t)}
                  className={cn('px-3 py-1.5 rounded-[7px] text-[10px] font-semibold border transition-colors',
                    caTipo === t ? 'bg-[#3B6D11] text-white border-[#3B6D11]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]'
                  )}>
                  {t === 'P' ? 'Pequeño 5t' : t === 'M' ? 'Mediano 15t' : 'Grande 50t'}
                </button>
              ))}
              <span className="text-[9px] text-[#A8A49C] ml-2">Factor prest. 1.35×</span>
            </div>

            {/* KPIs for selected type */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              {[
                { label: 'Personal total', value: String(totalPersonal), color: '#3B6D11' },
                { label: 'OPEX mensual', value: pxn(ca.opexMesMXN), color: '#C0392B' },
                { label: 'Nómina mensual', value: pxn(Math.round(totalNomina)), color: '#D4881E' },
              ].map(c => (
                <div key={c.label} className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2.5">
                  <p className="text-[8px] uppercase text-[#A8A49C] mb-1">{c.label}</p>
                  <p className="text-[16px] font-bold" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>

            {/* Staff table */}
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Puesto', '#', 'Salario bruto', 'Subtotal mensual', 'Con prestaciones'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staffList.map((p, i) => {
                  const subtotal = p.cantidad * p.salario
                  const conPrest = Math.round(subtotal * prestFactor)
                  const nivelBg = p.nivel === 'direccion' ? 'bg-[#FAF6F2]' : p.nivel === 'supervision' ? 'bg-[#EBF3FB]' : ''
                  return (
                    <tr key={p.puesto} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]', nivelBg)}>
                      <td className="px-3 py-2 text-[#4A4740]">{p.puesto}</td>
                      <td className="px-3 py-2 font-mono font-bold text-[#1A5FA8] text-center">{p.cantidad}</td>
                      <td className="px-3 py-2 font-mono">{pxn(p.salario)}</td>
                      <td className="px-3 py-2 font-mono">{pxn(subtotal)}</td>
                      <td className="px-3 py-2 font-mono font-semibold text-[#D4881E]">{pxn(conPrest)}</td>
                    </tr>
                  )
                })}
                <tr className="bg-[#1C2B15]">
                  <td className="px-3 py-2.5 font-bold text-white text-[9px]">Total mensual personal</td>
                  <td className="px-3 py-2.5 font-bold text-white font-mono text-center">{totalPersonal}</td>
                  <td className="px-3 py-2.5 text-[#A8A49C]">—</td>
                  <td className="px-3 py-2.5 text-[#A8A49C]">—</td>
                  <td className="px-3 py-2.5 font-bold text-white font-mono">{pxn(Math.round(totalNomina))}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Staff composition chart */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Composición del personal por nivel y tipo de CA</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Dirección · Supervisión · Operativo</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={staffByLevel} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                <XAxis dataKey="nivel" tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="P" name="CA Pequeño" fill="#3B6D11" radius={[4, 4, 0, 0]} />
                <Bar dataKey="M" name="CA Mediano" fill="#1A5FA8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="G" name="CA Grande" fill="#8B6B4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* RACI matrix */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EDE5] flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#D4881E]" />
              <div>
                <p className="text-[12px] font-semibold text-[#1C1B18]">Matriz RACI — Responsabilidades por actividad</p>
                <p className="text-[10px] text-[#A8A49C]">R=Responsable · A=Aprobador · C=Consultado · I=Informado</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    <th className="text-left px-4 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase min-w-[180px]">Actividad</th>
                    {['Coordinador', 'Director CA', 'Supervisor', 'Operario'].map(h => (
                      <th key={h} className="text-center px-3 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RACI_ROWS.map((r, i) => (
                    <tr key={r.actividad} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-4 py-2 text-[#4A4740]">{r.actividad}</td>
                      {[r.coord, r.dirCA, r.supervisor, r.operario].map((v, j) => (
                        <td key={j} className="px-3 py-2 text-center">
                          {v && <span className={cn('px-2 py-0.5 rounded text-[9px]', raciColor(v))}>{v}</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Training phases */}
          <div className="space-y-2.5">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Fases de formación del personal operativo</p>
            {ADOPTION_PHASES.map(f => (
              <div key={f.id} className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-[10px] font-bold text-white bg-[#3B6D11] px-2 py-0.5 rounded">{f.id}</span>
                  <p className="text-[12px] font-semibold text-[#1C1B18]">{f.label}</p>
                  <span className="text-[10px] text-[#A8A49C]">{f.dur}</span>
                </div>
                <p className="text-[10px] text-[#6B6760] mb-2"><strong>Participantes:</strong> {f.participantes}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {f.temas.map(t => <span key={t} className="text-[9px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-0.5 rounded-full text-[#4A4740]">{t}</span>)}
                </div>
                <p className="text-[10px] text-[#3B6D11] font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-3 h-3" /> KPI de cierre: {f.kpi}
                </p>
              </div>
            ))}
          </div>

          {/* OPEX breakdown */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0EDE5]">
              <p className="text-[11px] font-semibold text-[#1C1B18]">OPEX mensual por concepto — CA {caTipo === 'P' ? 'Pequeño' : caTipo === 'M' ? 'Mediano' : 'Grande'}</p>
              <p className="text-[9px] text-[#A8A49C]">Fuentes: ANIPAC, CEMPRE México, IMSS Ramo 37, CFE GDMTH</p>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  <th className="text-left px-4 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase">Concepto</th>
                  <th className="text-right px-4 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase">MXN/mes</th>
                  <th className="text-right px-4 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase">% OPEX</th>
                </tr>
              </thead>
              <tbody>
                {opexList.map((o, i) => {
                  const val = Math.round(ca.opexMesMXN * o.pct / 100)
                  return (
                    <tr key={o.concepto} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-4 py-2 text-[#4A4740]">{o.concepto}</td>
                      <td className="px-4 py-2 text-right font-mono">{`$${val.toLocaleString('es-MX')}`}</td>
                      <td className="px-4 py-2 text-right text-[#D4881E] font-semibold">{o.pct}%</td>
                    </tr>
                  )
                })}
                <tr className="bg-[#1C2B15]">
                  <td className="px-4 py-2.5 font-bold text-white">OPEX TOTAL</td>
                  <td className="px-4 py-2.5 text-right font-bold text-white font-mono">{`$${ca.opexMesMXN.toLocaleString('es-MX')}`}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-white">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right rail */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Consideraciones</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#EAF3DE] text-[#2D5A0D]">Confianza 65%</span>
          </div>
          <RailSection title="Cómo se calcula" open>
            <p>Plantilla derivada de benchmarks sectoriales (ANIPAC, IMSS Ramo 37). Factor de prestaciones 1.35× sobre salario bruto. Datos paramétricos por tipo de CA.</p>
          </RailSection>
          <RailSection title="Decisión que habilita">
            <p>Aprobar la estructura de personal y el presupuesto de nómina antes de la autorización de inversión en infraestructura. El cabildo requiere saber quién es responsable.</p>
          </RailSection>
          <RailSection title="Módulos relacionados">
            <p>M06: Cuántos centros se operarán (input para dimensionar plantilla). M09: CAPEX total del programa. M08: Logística que el personal opera.</p>
          </RailSection>
          <RailSection title="Qué verificar aún">
            <ul className="space-y-1">
              {[
                'Tabulador salarial vigente del municipio (puede diferir del benchmark sectorial).',
                'Disponibilidad de personal certificado para operación de prensas y báscula.',
              ].map(v => (
                <li key={v} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#D4881E] shrink-0" />{v}</li>
              ))}
            </ul>
          </RailSection>
        </div>
      </div>
    </div>
  )
}
