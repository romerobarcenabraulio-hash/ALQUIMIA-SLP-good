'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  ChevronRight, AlertTriangle, CheckCircle, Clock, DollarSign,
  FileText, Shield, Users, TrendingUp, Zap, MapPin,
  BarChart2, Lock, ChevronDown, Info, ArrowRight,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'
import { TRAJECTORY_UI } from '@/lib/constants'
import { ExpandableChart } from '@/components/ui/ExpandableChart'

// ── Legal summary per ZM (mirrors LEGAL_BY_ZM in MunicipalContextStack) ──────

const LEGAL_SUMMARY: Record<string, { vacios: number; adendas: number; fase: string }> = {
  SLP: { vacios: 18, adendas: 12, fase: 'Diagnóstico y reforma' },
  MTY: { vacios: 23, adendas: 18, fase: 'Diagnóstico y reforma' },
  QRO: { vacios: 16, adendas: 14, fase: 'Diagnóstico y reforma' },
  GDL: { vacios: 21, adendas: 16, fase: 'Diagnóstico y reforma' },
}
function legalFor(zm: string) { return LEGAL_SUMMARY[zm] ?? LEGAL_SUMMARY['SLP']! }

// ── M03 Phases (6 operational — distinct from FASES_INSTITUCIONALES) ──────────

const M03_PHASES = [
  {
    n: 1, label: 'Preparación y diagnóstico', semanas: 4, color: '#1A5FA8',
    entregables: ['Línea base y metas', 'Análisis de brechas', 'Alcance y priorización'],
    gate: 'Diagnóstico aprobado',
  },
  {
    n: 2, label: 'Alineación jurídica e institucional', semanas: 6, color: '#3B6D11',
    entregables: ['Reforma y vacíos legales', 'Marco institucional', 'Gobernanza y convenios'],
    gate: 'Marco validado',
  },
  {
    n: 3, label: 'Diseño técnico y presupuestal', semanas: 7, color: '#8B6B4A',
    entregables: ['Ingeniería conceptual', 'Modelo operativo', 'Presupuesto y viabilidad'],
    gate: 'Diseño aprobado',
  },
  {
    n: 4, label: 'Contratación, permisos y predios', semanas: 8, color: '#D4881E',
    entregables: ['Permisos y MIA', 'Predios y servidumbres', 'Contratación'],
    gate: 'Listo para construir',
  },
  {
    n: 5, label: 'Piloto territorial', semanas: 6, color: '#C0392B',
    entregables: ['Implementación piloto', 'Puesta en marcha', 'Ajustes operativos'],
    gate: 'Piloto validado',
  },
  {
    n: 6, label: 'Escalamiento y monitoreo', semanas: 0, color: '#5A4A2A',
    entregables: ['Expansión territorial', 'Monitoreo de KPIs', 'Mejora continua'],
    gate: 'Escalamiento autorizado',
  },
]

// ── PERT summary (9-node linear sequence for Page 1) ─────────────────────────

const PERT_SUMMARY = [
  { id: 'P1', label: 'Diagnóstico', m2: false },
  { id: 'P2', label: 'Marco jurídico validado', m2: true },
  { id: 'P3', label: 'Presupuesto aprobado', m2: false },
  { id: 'P4', label: 'Predios y permisos', m2: false },
  { id: 'P5', label: 'Contratación', m2: false },
  { id: 'P6', label: 'Infraestructura', m2: false },
  { id: 'P7', label: 'Piloto operativo', m2: false },
  { id: 'P8', label: 'Evaluación', m2: false },
  { id: 'P9', label: 'Escalamiento', m2: false },
]

// ── PERT full nodes T01–T15 (Page 2) ─────────────────────────────────────────

const PERT_NODES = [
  { id: 'T01', label: 'Diagnóstico territorial y levantamiento', row: 0, col: 0, critico: true,  holgura: 0,  depende: '—',       responsable: 'Catastro Municipal',         impacto: '+14 días' },
  { id: 'T02', label: 'Diagnóstico legal y reglamento',          row: 1, col: 0, critico: false, holgura: 4,  depende: '—',       responsable: 'Dirección Jurídica',         impacto: '+8 días'  },
  { id: 'T03', label: 'Proceso licitatorio / adjudicación',      row: 0, col: 1, critico: true,  holgura: 0,  depende: 'T01',     responsable: 'Dirección de Obras Públicas', impacto: '+18 días' },
  { id: 'T04', label: 'Gestión de permisos ambientales',         row: 1, col: 1, critico: false, holgura: 6,  depende: 'T02',     responsable: 'Dirección Medio Ambiente',   impacto: '+20 días' },
  { id: 'T05', label: 'Liberación de predios',                   row: 2, col: 1, critico: false, holgura: 3,  depende: 'T01',     responsable: 'Catastro Municipal',         impacto: '+12 días' },
  { id: 'T06', label: 'Adquisición de flota de recolección',     row: 0, col: 2, critico: true,  holgura: 0,  depende: 'T03',     responsable: 'Comité de Adquisiciones',    impacto: '+12 días' },
  { id: 'T07', label: 'Diseño técnico de centros de acopio',     row: 1, col: 2, critico: false, holgura: 5,  depende: 'T04,T05', responsable: 'Dirección de Obras Públicas', impacto: '+10 días' },
  { id: 'T08', label: 'Contratación de operador',                row: 2, col: 2, critico: false, holgura: 2,  depende: 'T03',     responsable: 'Tesorería',                  impacto: '+16 días' },
  { id: 'T09', label: 'Operación de Centros de Acopio',          row: 0, col: 3, critico: true,  holgura: 0,  depende: 'T06',     responsable: 'Operador de CA',             impacto: '+16 días' },
  { id: 'T10', label: 'Construcción centros de acopio',          row: 1, col: 3, critico: false, holgura: 4,  depende: 'T07',     responsable: 'Dirección de Obras Públicas', impacto: '+14 días' },
  { id: 'T11', label: 'Capacitación y comunicación ciudadana',   row: 2, col: 3, critico: false, holgura: 8,  depende: 'T08',     responsable: 'Comunicación Social',        impacto: '+6 días'  },
  { id: 'T12', label: 'Implementación de planta de pretratamiento', row: 0, col: 4, critico: true, holgura: 0, depende: 'T09',   responsable: 'Dirección de Medio Ambiente','impacto': '+20 días' },
  { id: 'T13', label: 'Integración de recicladores formales',    row: 1, col: 4, critico: false, holgura: 3,  depende: 'T10',     responsable: 'Dirección de Economía',      impacto: '+8 días'  },
  { id: 'T14', label: 'Arranque oficial del programa municipal',  row: 0, col: 5, critico: true,  holgura: 0,  depende: 'T12',     responsable: 'Presidencia Municipal',      impacto: '+15 días' },
  { id: 'T15', label: 'Primeras ventas de materiales reciclables', row: 0, col: 6, critico: true, holgura: 0, depende: 'T14',    responsable: 'Dirección de Servicios Públicos', impacto: '+10 días' },
]

// ── Gantt master lines (Page 1, 7 work streams) ───────────────────────────────

const GANTT_MASTER = [
  { linea: 'Jurídico / institucional', inicio: 0,  fin: 10, color: '#1A5FA8' },
  { linea: 'Infraestructura',          inicio: 8,  fin: 31, color: '#3B6D11' },
  { linea: 'Operación y logística',    inicio: 20, fin: 37, color: '#5A9438' },
  { linea: 'Comunicación ciudadana',   inicio: 4,  fin: 37, color: '#D4881E' },
  { linea: 'Datos y monitoreo',        inicio: 6,  fin: 37, color: '#8B6B4A' },
  { linea: 'Finanzas y presupuesto',   inicio: 2,  fin: 16, color: '#C0392B' },
  { linea: 'Gobernanza y coordinación', inicio: 0, fin: 37, color: '#5A4A2A' },
]

// ── Gantt detailed tasks (Page 2, by work stream) ────────────────────────────

type GanttFilter = 'todo' | 'critico' | 'juridico' | 'infraestructura' | 'operacion' | 'comunicacion' | 'presupuesto'

const GANTT_DETAIL: Array<{
  id: string; linea: GanttFilter; actividad: string
  inicio: number; fin: number; critico: boolean
  estado: 'completado' | 'en_ejecucion' | 'programado' | 'pendiente'
}> = [
  { id: 'G01', linea: 'juridico',        actividad: 'Diagnóstico legal municipal',             inicio: 1,  fin: 4,  critico: false, estado: 'completado' },
  { id: 'G02', linea: 'juridico',        actividad: 'Reforma reglamentaria',                   inicio: 3,  fin: 10, critico: true,  estado: 'en_ejecucion' },
  { id: 'G03', linea: 'juridico',        actividad: 'Convenios institucionales',                inicio: 8,  fin: 12, critico: false, estado: 'programado' },
  { id: 'G04', linea: 'infraestructura', actividad: 'Diseño técnico CAs',                       inicio: 8,  fin: 14, critico: false, estado: 'programado' },
  { id: 'G05', linea: 'infraestructura', actividad: 'Licitación y contratación de obra',        inicio: 12, fin: 20, critico: true,  estado: 'pendiente' },
  { id: 'G06', linea: 'infraestructura', actividad: 'Construcción centros de acopio',           inicio: 20, fin: 30, critico: true,  estado: 'pendiente' },
  { id: 'G07', linea: 'infraestructura', actividad: 'Adquisición de flota',                     inicio: 14, fin: 22, critico: true,  estado: 'pendiente' },
  { id: 'G08', linea: 'operacion',       actividad: 'Diseño de rutas de recolección',           inicio: 16, fin: 22, critico: false, estado: 'pendiente' },
  { id: 'G09', linea: 'operacion',       actividad: 'Piloto de separación en origen',           inicio: 24, fin: 30, critico: true,  estado: 'pendiente' },
  { id: 'G10', linea: 'operacion',       actividad: 'Arranque oficial del programa',            inicio: 30, fin: 37, critico: true,  estado: 'pendiente' },
  { id: 'G11', linea: 'comunicacion',    actividad: 'Estrategia de comunicación',               inicio: 4,  fin: 10, critico: false, estado: 'completado' },
  { id: 'G12', linea: 'comunicacion',    actividad: 'Campaña ciudadana de separación',          inicio: 18, fin: 37, critico: false, estado: 'pendiente' },
  { id: 'G13', linea: 'presupuesto',     actividad: 'Gestión de recursos y ministraciones',     inicio: 2,  fin: 8,  critico: true,  estado: 'en_ejecucion' },
  { id: 'G14', linea: 'presupuesto',     actividad: 'Contratación operador ancla',              inicio: 10, fin: 16, critico: true,  estado: 'pendiente' },
]

// ── RACI matrix ───────────────────────────────────────────────────────────────

const RACI_ACTORS = ['Presidencia', 'Obras Públicas', 'Servicios Públicos', 'Medio Ambiente', 'Contraloría', 'Tesorería', 'Concesionario', 'Recicladoras']
const RACI_ACTIVITIES = [
  { actividad: 'Diagnóstico territorial',     vals: ['A','C','R','C','I','I','I','C'] },
  { actividad: 'Reforma reglamentaria',       vals: ['A','C','C','R','C','I','C','I'] },
  { actividad: 'Proceso licitatorio',         vals: ['A','R','C','C','A','C','I','I'] },
  { actividad: 'Operación de Centros de Acopio', vals: ['I','C','A','R','I','I','R','C'] },
  { actividad: 'Planta de pretratamiento',    vals: ['A','R','C','R','C','I','C','I'] },
  { actividad: 'Primeras ventas reciclables', vals: ['I','I','A','C','I','I','R','R'] },
]

// ── Bottleneck risks ──────────────────────────────────────────────────────────

const BOTTLENECKS = [
  { riesgo: 'Retraso en proceso licitatorio',          prob: 0.55, impacto: 4, efecto: '+16 días', mitigacion: 'Preparar bases tipo y validar con antelación' },
  { riesgo: 'Demora en liberación presupuestal',       prob: 0.40, impacto: 3, efecto: '+12 días', mitigacion: 'Calendario de ministraciones y alertas' },
  { riesgo: 'Disponibilidad de proveedores de flota',  prob: 0.35, impacto: 3, efecto: '+10 días', mitigacion: 'Precalificación y contratos marco' },
  { riesgo: 'Trámites ambientales (permisos)',         prob: 0.45, impacto: 4, efecto: '+20 días', mitigacion: 'Gestión temprana con SEMARNAT/Estado' },
  { riesgo: 'Aceptación social en operación de CA',   prob: 0.30, impacto: 2, efecto: '+6 días',  mitigacion: 'Comunicación y comités comunitarios' },
]

// ── Territorial waves ─────────────────────────────────────────────────────────

const WAVES = [
  { nombre: 'Oleada 1 · Poniente', estado: 'En curso',  zonas: 4, mesInicio: 1,  mesFin: 12, riesgo: 'Disponibilidad de predios y permisos' },
  { nombre: 'Oleada 2 · Centro',   estado: 'Siguiente', zonas: 3, mesInicio: 10, mesFin: 22, riesgo: 'Gestión de rutas y operador ancla' },
  { nombre: 'Oleada 3 · Norte',    estado: 'Planeada',  zonas: 3, mesInicio: 18, mesFin: 34, riesgo: 'Infraestructura complementaria' },
  { nombre: 'Oleada 4 · Sur',      estado: 'Planeada',  zonas: 2, mesInicio: 28, mesFin: 44, riesgo: 'Coordinación intermunicipal' },
]

// ── Gates ─────────────────────────────────────────────────────────────────────

const GATES_DATA = [
  { label: 'Validación jurídica',    estado: 'cumplido'   as const },
  { label: 'Presupuesto aprobado',   estado: 'cumplido'   as const },
  { label: 'Predios liberados',      estado: 'en_curso'   as const },
  { label: 'Operador contratado',    estado: 'en_curso'   as const },
  { label: 'Rutas logísticas',       estado: 'cumplido'   as const },
  { label: 'Comunicación ciudadana', estado: 'en_curso'   as const },
  { label: 'Monitoreo y datos',      estado: 'pendiente'  as const },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function sum(a: number, b: number) { return a + b }
function mean(arr: number[]) { return arr.length ? arr.reduce(sum, 0) / arr.length : 0 }

// ── DecisionCommitBar ─────────────────────────────────────────────────────────

function DecisionCommitBar({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  vacios, adendas, faseLegal,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number
  vacios: number; adendas: number; faseLegal: string
}) {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4 mb-4">
      <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] mb-3 font-semibold">
        Decisiones comprometidas — no editables en este módulo
      </p>
      <div className="flex flex-wrap lg:flex-nowrap items-start gap-2">
        {/* M1 */}
        <div className="flex-1 min-w-0 rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] p-3">
          <p className="text-[9px] uppercase tracking-[0.06em] text-[#3B6D11] font-semibold mb-1">Módulo 1 · Escenario</p>
          <p className="text-[12px] font-semibold text-[#1C1B18]">{municipio}</p>
          <p className="text-[10px] text-[#6B6760]">{horizonte} años · {trayectoria}</p>
          <p className="text-[10px] text-[#6B6760]">Captura final {capturaFinal}% · RSU obj. {fmt.kgd(rsuDia)}</p>
        </div>
        <div className="hidden lg:flex items-center pt-4">
          <ChevronRight className="w-4 h-4 text-[#A8A49C]" />
        </div>
        {/* M2 */}
        <div className="flex-1 min-w-0 rounded-[10px] border border-[#BDD7F5] bg-[#EBF3FB] p-3">
          <p className="text-[9px] uppercase tracking-[0.06em] text-[#1A5FA8] font-semibold mb-1">Módulo 2 · Condición jurídica</p>
          <p className="text-[12px] font-semibold text-[#1C1B18]">{faseLegal}</p>
          <p className="text-[10px] text-[#6B6760]">{vacios} vacíos jurídicos · {adendas} adendos propuestos</p>
          <p className="text-[10px] text-[#A8A49C]">Reforma requerida antes de contratación</p>
        </div>
        <div className="hidden lg:flex items-center pt-4">
          <ChevronRight className="w-4 h-4 text-[#A8A49C]" />
        </div>
        {/* M3 */}
        <div className="flex-1 min-w-0 rounded-[10px] border border-[#E8E4DC] bg-white p-3">
          <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] font-semibold mb-1">Módulo 3 · Decisión actual</p>
          <p className="text-[12px] font-semibold text-[#1C1B18]">Definir ruta crítica y calendario</p>
          <p className="text-[10px] text-[#6B6760]">Responsables, fases, dependencias y gates</p>
        </div>
      </div>
    </div>
  )
}

// ── PlanningKpiCard ───────────────────────────────────────────────────────────

function PlanningKpiCard({
  icon: Icon, label, value, sub, color = '#1C1B18',
}: {
  icon: React.ElementType; label: string; value: string
  sub?: string; color?: string
}) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
        <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      </div>
      <p className="font-semibold text-[14px] leading-tight" style={{ color }}>{value}</p>
      {sub && <p className="text-[9px] text-[#A8A49C] mt-0.5">{sub}</p>}
    </div>
  )
}

// ── RailSection ───────────────────────────────────────────────────────────────

function RailSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2.5 px-1 text-left"
      >
        <span className="text-[10px] uppercase tracking-[0.07em] text-[#6B6760] font-semibold">{title}</span>
        <ChevronDown className={cn('w-3 h-3 text-[#A8A49C] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760]">{children}</div>}
    </div>
  )
}

// ── RaciChip ──────────────────────────────────────────────────────────────────

function RaciChip({ val }: { val: string }) {
  const cls = val === 'R' ? 'bg-[#EAF3DE] text-[#23470A]'
    : val === 'A' ? 'bg-[#EBF3FB] text-[#0D3B6E]'
    : val === 'C' ? 'bg-[#FEF7E7] text-[#6B4800]'
    : 'bg-[#F4F2ED] text-[#6B6760]'
  return (
    <span className={cn('inline-flex items-center justify-center w-5 h-5 rounded text-[9px] font-bold', cls)}>
      {val}
    </span>
  )
}

// ── Page 1 ────────────────────────────────────────────────────────────────────

function Page1({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  vacios, adendas, faseLegal, capexTotal, totalSemanas,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number
  vacios: number; adendas: number; faseLegal: string
  capexTotal: number; totalSemanas: number
}) {
  return (
    <div className="space-y-5">
      <DecisionCommitBar
        municipio={municipio} horizonte={horizonte} trayectoria={trayectoria}
        capturaFinal={capturaFinal} rsuDia={rsuDia}
        vacios={vacios} adendas={adendas} faseLegal={faseLegal}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <PlanningKpiCard icon={Clock}      label="Duración total"        value={`${totalSemanas} sem`}   sub="del plan operativo"    color="#1A5FA8" />
        <PlanningKpiCard icon={BarChart2}  label="Fases principales"     value="6"                       sub="fases de implementación" />
        <PlanningKpiCard icon={AlertTriangle} label="Actividades críticas" value="7 / 15"               sub="sin holgura"            color="#C0392B" />
        <PlanningKpiCard icon={DollarSign} label="Costo planificado"     value={fmt.mxnM(capexTotal)}    sub="CAPEX estimado"         color="#3B6D11" />
        <PlanningKpiCard icon={ChevronRight} label="Dependencias críticas" value="12"                   sub="nodos PERT críticos" />
        <PlanningKpiCard icon={Shield}     label="Confianza cronograma"  value="72%"                     sub="supuestos validados"    color="#D4881E" />
      </div>

      {/* Executive reading */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-2 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />
          Lectura ejecutiva del módulo
        </p>
        <p className="text-[13px] leading-relaxed text-[#4A4740] mb-2">
          Este módulo convierte el escenario aprobado en una ruta operativa integral. Integra actividades
          jurídicas, técnicas, financieras, operativas y sociales para identificar qué debe ocurrir primero,
          qué depende de qué, quién debe decidir y qué riesgos pueden retrasar la implementación.
        </p>
        <p className="text-[13px] leading-relaxed text-[#4A4740]">
          La planeación aquí es una traducción ejecutiva del escenario: convierte toneladas, capturas, costos
          y condiciones jurídicas en fases, actividades, responsables y gates de decisión. No se trata de
          calendarizar tareas: se trata de asegurar que el programa no llegue a infraestructura sin permisos,
          a operación sin responsables o a metas sin capacidad instalada.
        </p>
      </div>

      {/* Phase timeline */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
        <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Fases maestras del plan</p>
        <p className="text-[10px] text-[#A8A49C] mb-4">
          Secuencia de implementación operativa — {M03_PHASES.reduce((s, f) => s + f.semanas, 0)} semanas de preparación + escalamiento continuo
        </p>
        <div className="flex flex-wrap gap-2 lg:gap-0 lg:flex-nowrap">
          {M03_PHASES.map((f, i) => (
            <div key={f.n} className="flex items-stretch lg:flex-1">
              <div className="flex-1 rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ background: f.color }}>
                    F{f.n}
                  </span>
                  {f.semanas > 0 && <span className="text-[9px] text-[#A8A49C]">{f.semanas} sem</span>}
                  {f.semanas === 0 && <span className="text-[9px] text-[#A8A49C]">continuo</span>}
                </div>
                <p className="text-[10px] font-semibold text-[#1C1B18] leading-snug mb-1.5">{f.label}</p>
                <ul className="space-y-0.5 mb-2">
                  {f.entregables.map(e => (
                    <li key={e} className="text-[9px] text-[#6B6760] flex items-start gap-1">
                      <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ background: f.color }} />
                      {e}
                    </li>
                  ))}
                </ul>
                <p className="text-[9px] font-medium text-[#3B6D11] border-t border-[#F0EDE5] pt-1 mt-1">
                  Gate {f.n}: {f.gate}
                </p>
              </div>
              {i < M03_PHASES.length - 1 && (
                <div className="hidden lg:flex items-center px-0.5">
                  <ArrowRight className="w-3 h-3 text-[#A8A49C] shrink-0" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* PERT summary */}
      <ExpandableChart chartId="m03-pert-summary" title="PERT resumido — secuencia lógica" subtitle="Flujo principal de dependencias del plan de implementación">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">PERT resumido — secuencia lógica</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">Flujo principal · nodo marcado con M2 requiere validación jurídica previa</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {PERT_SUMMARY.map((n, i) => (
              <div key={n.id} className="flex items-center gap-1.5">
                <div className={cn(
                  'rounded-[8px] border px-2.5 py-1.5 text-center',
                  n.m2
                    ? 'border-[#BDD7F5] bg-[#EBF3FB]'
                    : 'border-[#D7E8C0] bg-[#F4FAEC]',
                )}>
                  <p className="text-[9px] font-mono text-[#A8A49C]">{n.id}</p>
                  <p className={cn('text-[10px] font-semibold leading-snug max-w-[80px]', n.m2 ? 'text-[#1A5FA8]' : 'text-[#1C1B18]')}>
                    {n.label}
                  </p>
                  {n.m2 && <p className="text-[8px] text-[#1A5FA8]">← M2</p>}
                </div>
                {i < PERT_SUMMARY.length - 1 && <ArrowRight className="w-3 h-3 text-[#A8A49C] shrink-0" />}
              </div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* Gantt master */}
      <ExpandableChart chartId="m03-gantt-master" title="Gantt maestro — líneas de trabajo" subtitle="Duración por línea de trabajo en semanas">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0EDE5] flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18]">Gantt maestro — líneas de trabajo</p>
              <p className="text-[10px] text-[#A8A49C]">Duración estimada en semanas · horizonte {totalSemanas} sem</p>
            </div>
          </div>
          <div className="p-5 space-y-2.5">
            {GANTT_MASTER.map(g => {
              const total = totalSemanas
              const left = (g.inicio / total) * 100
              const width = ((g.fin - g.inicio) / total) * 100
              return (
                <div key={g.linea} className="flex items-center gap-3">
                  <p className="w-40 shrink-0 text-[10px] text-[#4A4740] text-right truncate">{g.linea}</p>
                  <div className="flex-1 h-5 bg-[#F4F2ED] rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-0 h-full rounded-full flex items-center justify-end pr-1"
                      style={{ left: `${left}%`, width: `${width}%`, background: g.color }}
                    >
                      <span className="text-[8px] text-white font-mono">{g.fin - g.inicio}s</span>
                    </div>
                  </div>
                  <p className="w-10 shrink-0 text-[9px] text-[#A8A49C] font-mono">S{g.fin}</p>
                </div>
              )
            })}
            <div className="flex items-center gap-3 pt-1 border-t border-[#F0EDE5]">
              <p className="w-40 shrink-0 text-[9px] text-right text-[#A8A49C]">Semanas</p>
              <div className="flex-1 flex justify-between">
                {[0, Math.round(totalSemanas / 4), Math.round(totalSemanas / 2), Math.round(3 * totalSemanas / 4), totalSemanas].map(w => (
                  <span key={w} className="text-[8px] text-[#A8A49C] font-mono">{w}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </ExpandableChart>

      {/* Recommendation card */}
      <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-[#3B6D11] flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#3B6D11] mb-1">Recomendación del motor</p>
            <p className="text-[12px] text-[#3B5F23] leading-relaxed mb-3">
              El motor recomienda proceder con un plan moderado de implementación. Equilibra tiempo, costo,
              capacidad institucional y riesgo de retraso. Priorice permisos, predios y contratación antes
              de iniciar infraestructura para evitar retrabajos.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { label: 'Tiempo total', value: `${totalSemanas} sem` },
                { label: 'Costo total', value: fmt.mxnM(capexTotal) },
                { label: 'Riesgo global', value: 'Medio' },
                { label: 'Cap. institucional', value: 'Adecuada' },
                { label: 'Confianza', value: '72%' },
              ].map(c => (
                <div key={c.label} className="rounded-[7px] border border-[#C4DFA0] bg-white px-2 py-1.5">
                  <p className="text-[8px] uppercase tracking-[0.04em] text-[#A8A49C]">{c.label}</p>
                  <p className="text-[11px] font-semibold text-[#1C1B18]">{c.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page 2 ────────────────────────────────────────────────────────────────────

function Page2({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  vacios, adendas, faseLegal, totalSemanas,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number
  vacios: number; adendas: number; faseLegal: string
  totalSemanas: number
}) {
  const [ganttFilter, setGanttFilter] = useState<GanttFilter>('todo')
  const criticalNodes = PERT_NODES.filter(n => n.critico)
  const avgHolgura = Math.round(mean(PERT_NODES.map(n => n.holgura)))
  const noHolgura = PERT_NODES.filter(n => n.holgura === 0).length

  const filteredGantt = ganttFilter === 'todo' ? GANTT_DETAIL
    : ganttFilter === 'critico' ? GANTT_DETAIL.filter(g => g.critico)
    : GANTT_DETAIL.filter(g => g.linea === ganttFilter)

  const FILTERS: Array<{ id: GanttFilter; label: string }> = [
    { id: 'todo', label: 'Todo' },
    { id: 'critico', label: 'Solo ruta crítica' },
    { id: 'juridico', label: 'Jurídico' },
    { id: 'infraestructura', label: 'Infraestructura' },
    { id: 'operacion', label: 'Operación' },
    { id: 'comunicacion', label: 'Comunicación' },
    { id: 'presupuesto', label: 'Presupuesto' },
  ]

  return (
    <div className="space-y-5">
      {/* Compact decision bar */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4">
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] mb-2 font-semibold">Decisiones comprometidas heredadas</p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'M1 · Escenario', value: `${municipio} · ${horizonte}a · ${trayectoria} · RSU ${fmt.kgd(rsuDia)}`, color: '#3B6D11', bg: '#F4FAEC', border: '#D7E8C0' },
            { label: 'M2 · Condición jurídica', value: `${faseLegal} · ${vacios} vacíos · ${adendas} adendos`, color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5' },
          ].map(c => (
            <div key={c.label} className="rounded-[8px] border px-3 py-1.5" style={{ borderColor: c.border, background: c.bg }}>
              <p className="text-[8px] uppercase tracking-[0.06em] font-semibold" style={{ color: c.color }}>{c.label}</p>
              <p className="text-[10px] text-[#4A4740]">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPI control strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        <PlanningKpiCard icon={AlertTriangle} label="Nodos críticos"       value={`${criticalNodes.length} / ${PERT_NODES.length}`} color="#C0392B" />
        <PlanningKpiCard icon={Clock}         label="Holgura promedio"     value={`${avgHolgura} días`}    sub="media de la red PERT" />
        <PlanningKpiCard icon={Zap}           label="Sin holgura"          value={String(noHolgura)}       sub="actividades críticas"  color="#D4881E" />
        <PlanningKpiCard icon={Lock}          label="Bloqueos jurídicos"   value={String(vacios)}          sub="vacíos sin resolver"   color="#1A5FA8" />
        <PlanningKpiCard icon={DollarSign}    label="Bloqueos pres."       value="2"                       sub="sin ministración" />
        <PlanningKpiCard icon={Shield}        label="Riesgo de retraso"    value="Medio"                   sub="+23 días estimados"    color="#D4881E" />
      </div>

      {/* PERT network */}
      <ExpandableChart chartId="m03-pert-full" title="Red PERT — dependencias y ruta crítica" subtitle="Nodos T01–T15 · ruta crítica en verde · holgura cero sin color">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">A) Red PERT — dependencias y ruta crítica</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">Verde = ruta crítica · gris = dependencia · naranja = bloqueo condicional</p>
          <div className="overflow-x-auto">
            <div className="flex gap-6 min-w-[700px] pb-2">
              {[0, 1, 2, 3, 4, 5, 6].map(col => (
                <div key={col} className="flex flex-col gap-3">
                  {PERT_NODES.filter(n => n.col === col).map(n => (
                    <div
                      key={n.id}
                      className={cn(
                        'rounded-[8px] border px-2.5 py-2 w-32',
                        n.critico ? 'border-[#3B6D11] bg-[#F4FAEC]' : 'border-[#E8E4DC] bg-white',
                      )}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <span className={cn(
                          'text-[8px] font-mono font-bold px-1 rounded',
                          n.critico ? 'bg-[#3B6D11] text-white' : 'bg-[#F4F2ED] text-[#6B6760]',
                        )}>{n.id}</span>
                        {n.holgura === 0 && <span className="text-[7px] bg-[#FDE8E8] text-[#7A1212] px-1 rounded">H=0</span>}
                      </div>
                      <p className="text-[9px] text-[#1C1B18] leading-snug">{n.label}</p>
                      <p className="text-[8px] text-[#A8A49C] mt-0.5 truncate">{n.responsable}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-3 mt-3 flex-wrap text-[9px]">
            {[['#3B6D11','Ruta crítica'],['#E8E4DC','Dependencia fuerte'],['#D4881E','Condicional']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded border-2" style={{ borderColor: c }} />
                <span className="text-[#6B6760]">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* Critical path table */}
      <ExpandableChart chartId="m03-critical-table" title="B) Ruta crítica — secuencia lógica" subtitle="Actividades con holgura 0 y su impacto en retraso">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0EDE5]">
            <p className="text-[11px] font-semibold text-[#1C1B18]">B) Ruta crítica — secuencia lógica</p>
            <p className="text-[10px] text-[#A8A49C]">Actividades sin holgura · responsable · impacto si se retrasa</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['ID','Actividad','Depende de','Responsable','Holgura','Impacto si se retrasa'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-semibold text-[#1C1B18] text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERT_NODES.filter(n => n.critico).map((n, i) => (
                  <tr key={n.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="px-3 py-2.5">
                      <span className="font-mono text-[10px] font-bold bg-[#EAF3DE] text-[#23470A] px-1.5 py-0.5 rounded">{n.id}</span>
                    </td>
                    <td className="px-3 py-2.5 text-[#4A4740] max-w-[200px]">{n.label}</td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-[#A8A49C]">{n.depende}</td>
                    <td className="px-3 py-2.5 text-[#6B6760]">{n.responsable}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="bg-[#FDE8E8] text-[#7A1212] text-[9px] font-mono px-1.5 py-0.5 rounded">{n.holgura}d</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-semibold text-[#C0392B]">Alto {n.impacto}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ExpandableChart>

      {/* Gantt detailed */}
      <ExpandableChart chartId="m03-gantt-detail" title="C) Gantt detallado por líneas de trabajo" subtitle="Filtrar por línea · actividades críticas · estado">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0EDE5] flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18]">C) Gantt detallado por líneas de trabajo</p>
              <p className="text-[10px] text-[#A8A49C]">Filtrar por tipo · mostrar todos o solo ruta crítica</p>
            </div>
          </div>
          <div className="px-5 py-3 flex flex-wrap gap-1.5 border-b border-[#F0EDE5]">
            {FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setGanttFilter(f.id)}
                className={cn(
                  'px-2.5 py-1 rounded-full text-[10px] font-medium transition-colors',
                  ganttFilter === f.id
                    ? 'bg-[#3B6D11] text-white'
                    : 'bg-[#F4F2ED] text-[#6B6760] hover:bg-[#E8E4DC]',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="p-5 space-y-2">
            {filteredGantt.map(g => {
              const left = ((g.inicio - 1) / totalSemanas) * 100
              const width = ((g.fin - g.inicio + 1) / totalSemanas) * 100
              const color = g.critico ? '#3B6D11'
                : g.estado === 'completado' ? '#A8A49C'
                : g.estado === 'en_ejecucion' ? '#1A5FA8'
                : '#E8E4DC'
              const estadoLabel = g.estado === 'completado' ? 'Completado'
                : g.estado === 'en_ejecucion' ? 'En ejecución'
                : g.estado === 'programado' ? 'Programado' : 'Pendiente'
              return (
                <div key={g.id} className="flex items-center gap-3">
                  <div className="w-48 shrink-0 flex items-center gap-1.5">
                    {g.critico && <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />}
                    <p className="text-[10px] text-[#4A4740] truncate">{g.actividad}</p>
                  </div>
                  <div className="flex-1 h-5 bg-[#F4F2ED] rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{ left: `${left}%`, width: `${Math.max(width, 2)}%`, background: color }}
                    />
                  </div>
                  <span className={cn(
                    'shrink-0 text-[9px] px-1.5 py-0.5 rounded',
                    g.estado === 'completado' ? 'bg-[#F4F2ED] text-[#A8A49C]'
                    : g.estado === 'en_ejecucion' ? 'bg-[#EBF3FB] text-[#1A5FA8]'
                    : 'bg-[#F4F2ED] text-[#6B6760]',
                  )}>
                    {estadoLabel}
                  </span>
                </div>
              )
            })}
          </div>
          {/* Legend */}
          <div className="px-5 pb-4 flex gap-4 flex-wrap">
            {[['#3B6D11','Ruta crítica'],['#1A5FA8','En ejecución'],['#A8A49C','Completado'],['#E8E4DC','Pendiente']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[9px] text-[#6B6760]">
                <div className="w-3 h-2 rounded-sm" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* RACI */}
      <ExpandableChart chartId="m03-raci" title="D) Matriz RACI — responsables por actividad crítica" subtitle="R=Responsable A=Aprueba C=Consulta I=Informa">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-3 border-b border-[#F0EDE5]">
            <p className="text-[11px] font-semibold text-[#1C1B18]">D) Matriz RACI — responsables por actividad crítica</p>
            <p className="text-[10px] text-[#A8A49C]">La claridad en gobernanza evita cuellos de botella y acelera decisiones críticas</p>
          </div>
          <div className="overflow-x-auto p-5">
            <table className="text-[10px]">
              <thead>
                <tr>
                  <th className="text-left pb-2 pr-4 font-semibold text-[#1C1B18] min-w-[180px]">Actividad</th>
                  {RACI_ACTORS.map(a => (
                    <th key={a} className="pb-2 px-1 text-center font-medium text-[#6B6760] min-w-[60px]">
                      <span className="text-[8px] block leading-tight">{a}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RACI_ACTIVITIES.map((row, i) => (
                  <tr key={row.actividad} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="py-1.5 pr-4 text-[#4A4740]">{row.actividad}</td>
                    {row.vals.map((v, j) => (
                      <td key={j} className="py-1.5 px-1 text-center">
                        <RaciChip val={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-3 mt-3 text-[9px]">
              {[['#EAF3DE text-[#23470A]','R','Responsable'],['#EBF3FB text-[#0D3B6E]','A','Aprueba'],['#FEF7E7 text-[#6B4800]','C','Consulta'],['#F4F2ED text-[#6B6760]','I','Informa']].map(([cls,v,label]) => (
                <div key={v} className="flex items-center gap-1">
                  <RaciChip val={v} />
                  <span className="text-[#6B6760]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ExpandableChart>

      {/* Bottlenecks */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F0EDE5]">
          <p className="text-[11px] font-semibold text-[#1C1B18]">E) Cuellos de botella y riesgos de calendario</p>
          <p className="text-[10px] text-[#A8A49C]">Probabilidad × impacto · efecto en días · mitigación</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                {['Riesgo / cuello de botella','Prob.','Impacto','Ponderado','Efecto est.','Mitigación sugerida'].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 font-semibold text-[#1C1B18] text-[10px]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BOTTLENECKS.map((b, i) => {
                const ponderado = (b.prob * b.impacto).toFixed(2)
                return (
                  <tr key={b.riesgo} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="px-3 py-2.5 text-[#4A4740] max-w-[200px]">{b.riesgo}</td>
                    <td className="px-3 py-2.5 font-mono">{b.prob}</td>
                    <td className="px-3 py-2.5 text-center">
                      <span className="bg-[#FEF7E7] text-[#6B4800] text-[9px] px-1.5 py-0.5 rounded font-mono">{b.impacto}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono font-semibold text-[#D4881E]">{ponderado}</td>
                    <td className="px-3 py-2.5 text-[#C0392B] font-semibold">{b.efecto}</td>
                    <td className="px-3 py-2.5 text-[#6B6760] text-[10px]">{b.mitigacion}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision card */}
      <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-5 flex items-start gap-4">
        <CheckCircle className="w-6 h-6 text-[#3B6D11] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-[#3B6D11] mb-1">Decisión sugerida</p>
          <p className="text-[12px] text-[#3B5F23] leading-relaxed mb-3">
            Priorizar actividades críticas sin holgura y resolver bloqueos jurídico-presupuestales identificados.
          </p>
          <ul className="space-y-1 mb-3">
            {[
              'Desbloquear licitación con bases tipo.',
              'Asegurar recursos para adquisición de flota.',
              'Alinear permisos ambientales de planta.',
              'Formalizar responsables de actividades críticas.',
            ].map(a => (
              <li key={a} className="flex items-start gap-1.5 text-[11px] text-[#3B5F23]">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />
                {a}
              </li>
            ))}
          </ul>
          <button type="button" className="px-4 py-2 bg-[#3B6D11] text-white text-[12px] font-medium rounded-[8px] hover:bg-[#2D5A0D] transition-colors">
            Ir a plan de acción →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page 3 ────────────────────────────────────────────────────────────────────

function Page3({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  faseLegal, genPercapita, capexTotal, empleosMeta, co2Meta,
  derraMeta, serieAnual,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number; faseLegal: string
  genPercapita: number; capexTotal: number
  empleosMeta: number; co2Meta: number; derraMeta: number
  serieAnual: Array<{ año: number; ingresos: number; co2e: number; empleosDirectos: number; pctCaptura: number }>
}) {
  const [chartWindow, setChartWindow] = useState<1 | 3 | 5 | 10>(10)
  const totalMeses = horizonte * 12

  // Build progression series from serieAnual
  const progData = useMemo(() => {
    let cumIngresos = 0
    let cumCo2 = 0
    return serieAnual.slice(0, chartWindow).map(a => {
      cumIngresos += a.ingresos
      cumCo2 += a.co2e
      return {
        año: `A${a.año}`,
        empleos: a.empleosDirectos,
        co2Acum: Math.round(cumCo2 / 1000),
        derrAcum: Math.round(cumIngresos / 1_000_000),
        captura: Math.round(a.pctCaptura),
      }
    })
  }, [serieAnual, chartWindow])

  const gatesCumplidos = GATES_DATA.filter(g => g.estado === 'cumplido').length

  return (
    <div className="space-y-5">
      {/* Inherited decisions */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4">
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] mb-2 font-semibold">
          Decisiones comprometidas heredadas de Módulo 1 y Módulo 2 — solo lectura
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Escenario', value: trayectoria },
            { label: 'Horizonte', value: `${horizonte} años` },
            { label: 'Gen. per cápita', value: `${genPercapita.toFixed(2)} kg/hab/día` },
            { label: 'Trayectoria captura', value: `${capturaFinal}% final` },
            { label: 'Marco jurídico', value: faseLegal },
            { label: 'Responsable inst.', value: 'Dir. Economía Circular' },
          ].map(c => (
            <div key={c.label} className="rounded-[7px] border border-[#E8E4DC] bg-white px-2.5 py-1.5">
              <p className="text-[8px] uppercase tracking-[0.04em] text-[#A8A49C]">{c.label}</p>
              <p className="text-[10px] font-semibold text-[#1C1B18]">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress timeline */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
        <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Lectura del plan comprometido</p>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-2 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#3B6D11]" style={{ width: `${(9 / Math.max(totalMeses, 1)) * 100}%` }} />
          </div>
          <span className="text-[10px] font-mono text-[#6B6760] shrink-0">Mes 9 de {totalMeses}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { label: 'Fase actual', value: 'Instalación', sub: '' },
            { label: 'Captura acum.', value: '2,689 t', sub: `de ${Math.round(empleosMeta * 30)} t meta` },
            { label: 'Centros activos', value: '12', sub: 'de 147 plan.' },
            { label: 'Empleos gen.', value: String(Math.min(147, empleosMeta)), sub: `de ${empleosMeta} plan.` },
            { label: 'CO₂ evitado', value: `${(co2Meta * 0.025 / 1000).toFixed(1)} kt`, sub: `de ${(co2Meta / 1000).toFixed(0)} kt` },
            { label: 'Derrama acum.', value: `$${(derraMeta * 0.028 / 1_000_000).toFixed(1)} M`, sub: `de ${fmt.mxnM(derraMeta)}` },
            { label: 'Fase plan.', value: `Mes ${Math.min(9, totalMeses)}`, sub: `de ${totalMeses}` },
          ].map(c => (
            <div key={c.label} className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-2.5">
              <p className="text-[8px] uppercase tracking-[0.04em] text-[#A8A49C]">{c.label}</p>
              <p className="text-[11px] font-semibold text-[#1C1B18] font-mono">{c.value}</p>
              {c.sub && <p className="text-[8px] text-[#A8A49C]">{c.sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Map + Waves 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Territorial map placeholder */}
        <ExpandableChart chartId="m03-map" title="Mapa de avance territorial" subtitle="Estado del despliegue por zona territorial">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0EDE5]">
              <p className="text-[11px] font-semibold text-[#1C1B18]">Mapa de avance territorial</p>
              <p className="text-[10px] text-[#A8A49C]">Estado del despliegue por zona · basado en fase dominante</p>
            </div>
            <div className="p-4">
              <div className="h-48 rounded-[8px] bg-[#EAF3DE] border border-[#D7E8C0] flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-1/4 left-1/4 w-1/3 h-1/3 bg-[#3B6D11] rounded-lg" />
                  <div className="absolute top-1/2 left-1/2 w-1/4 h-1/4 bg-[#1A5FA8] rounded-lg" />
                  <div className="absolute top-1/6 right-1/4 w-1/5 h-1/5 bg-[#D4881E] rounded-lg" />
                  <div className="absolute bottom-1/4 left-1/3 w-1/5 h-1/5 bg-[#C0392B] rounded-lg" />
                </div>
                <div className="text-center z-10">
                  <MapPin className="w-8 h-8 text-[#3B6D11] mx-auto mb-2" />
                  <p className="text-[12px] font-semibold text-[#1C1B18]">{municipio}</p>
                  <p className="text-[10px] text-[#6B6760]">Ver mapa en pantalla completa →</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  ['#F4F2ED','#A8A49C','Sin iniciar'],
                  ['#EBF3FB','#1A5FA8','Diagnóstico'],
                  ['#FEF7E7','#D4881E','Permisos'],
                  ['#EAF3DE','#3B6D11','Instalación'],
                  ['#FDE8E8','#C0392B','Piloto'],
                  ['#1C2B15','#7AAB60','Escala plena'],
                ].map(([bg, color, label]) => (
                  <div key={label} className="flex items-center gap-1 text-[9px]">
                    <div className="w-3 h-3 rounded-sm" style={{ background: bg, border: `1.5px solid ${color}` }} />
                    <span className="text-[#6B6760]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ExpandableChart>

        {/* Waves */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold text-[#1C1B18] px-1">Oleadas territoriales</p>
          {WAVES.map(w => {
            const estadoColor = w.estado === 'En curso' ? '#3B6D11' : w.estado === 'Siguiente' ? '#1A5FA8' : '#A8A49C'
            const estadoBg = w.estado === 'En curso' ? '#EAF3DE' : w.estado === 'Siguiente' ? '#EBF3FB' : '#F4F2ED'
            return (
              <div key={w.nombre} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-semibold text-[#1C1B18]">{w.nombre}</p>
                    <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded" style={{ background: estadoBg, color: estadoColor }}>
                      {w.estado}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#6B6760]">{w.zonas} zonas · Meses {w.mesInicio}–{w.mesFin}</p>
                  <p className="text-[9px] text-[#A8A49C] mt-0.5">Riesgo: {w.riesgo}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progression chart */}
      <ExpandableChart chartId="m03-progression" title="Progresión acumulada contra meta del plan" subtitle="Empleos, CO₂ evitado, derrama y captura por año">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18]">Progresión acumulada — contra meta del plan</p>
              <p className="text-[9px] text-[#A8A49C]">Estos filtros solo cambian la ventana de lectura; el horizonte real viene del Módulo 1</p>
            </div>
            <div className="flex gap-1">
              {([1, 3, 5, 10] as const).map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setChartWindow(w)}
                  className={cn(
                    'px-2.5 py-1 rounded text-[10px] font-medium transition-colors',
                    chartWindow === w ? 'bg-[#3B6D11] text-white' : 'bg-[#F4F2ED] text-[#6B6760]',
                  )}
                >
                  {w}a
                </button>
              ))}
            </div>
          </div>
          {progData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={progData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                <XAxis dataKey="año" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="empleos"  stroke="#1A5FA8" fill="#EBF3FB" strokeWidth={1.5} name="Empleos directos" />
                <Area type="monotone" dataKey="co2Acum"  stroke="#3B6D11" fill="#EAF3DE" strokeWidth={1.5} name="CO₂ evit. (kt acum.)" />
                <Area type="monotone" dataKey="derrAcum" stroke="#D4881E" fill="#FEF7E7" strokeWidth={1.5} name="Derrama acum. (M MXN)" />
                <Area type="monotone" dataKey="captura"  stroke="#8B6B4A" fill="#F5EDE3" strokeWidth={1.5} name="Captura %" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[12px] text-[#A8A49C]">Selecciona un municipio en Módulo 1 para ver la progresión.</p>
            </div>
          )}
        </div>
      </ExpandableChart>

      {/* Gates + Interdependency 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gates */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18]">Gates para avanzar de fase</p>
              <p className="text-[10px] text-[#A8A49C]">Condiciones indispensables para continuar</p>
            </div>
            <span className={cn(
              'text-[11px] font-bold px-2 py-0.5 rounded',
              gatesCumplidos >= 5 ? 'bg-[#EAF3DE] text-[#23470A]' : 'bg-[#FEF7E7] text-[#6B4800]',
            )}>
              {gatesCumplidos} / {GATES_DATA.length}
            </span>
          </div>
          <div className="space-y-2">
            {GATES_DATA.map(g => {
              const icon = g.estado === 'cumplido' ? <CheckCircle className="w-3.5 h-3.5 text-[#3B6D11] shrink-0" />
                : g.estado === 'en_curso' ? <Clock className="w-3.5 h-3.5 text-[#D4881E] shrink-0" />
                : <AlertTriangle className="w-3.5 h-3.5 text-[#C0392B] shrink-0" />
              const cls = g.estado === 'cumplido' ? 'border-[#D7E8C0] bg-[#F4FAEC]'
                : g.estado === 'en_curso' ? 'border-[#F5D98A] bg-[#FEF7E7]'
                : 'border-[#F5C4C4] bg-[#FDE8E8]'
              return (
                <div key={g.label} className={cn('flex items-center gap-2 rounded-[7px] border px-2.5 py-2', cls)}>
                  {icon}
                  <span className="text-[11px] text-[#4A4740]">{g.label}</span>
                  <span className={cn(
                    'ml-auto text-[9px] font-semibold',
                    g.estado === 'cumplido' ? 'text-[#3B6D11]' : g.estado === 'en_curso' ? 'text-[#D4881E]' : 'text-[#C0392B]',
                  )}>
                    {g.estado === 'cumplido' ? 'Cumplido' : g.estado === 'en_curso' ? 'En curso' : 'Pendiente'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Interdependency */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Interdependencia con otros módulos</p>
          <p className="text-[10px] text-[#A8A49C] mb-3">Este plan se construye sobre decisiones ya validadas</p>
          <div className="space-y-2">
            {[
              { m: 'M1', label: 'Escenario y trayectoria', desc: 'Define meta y ritmo de captura', color: '#3B6D11', bg: '#F4FAEC', border: '#D7E8C0' },
              { m: 'M2', label: 'Marco jurídico e institucional', desc: 'Define reglas, permisos y roles', color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5' },
              { m: 'M3', label: 'Operatividad del despliegue', desc: 'Gantt, rutas y madurez (este módulo)', color: '#A8A49C', bg: '#F4F2ED', border: '#E8E4DC' },
              { m: 'M4', label: 'Infraestructura', desc: 'Convierte la ruta en centros y operación física', color: '#8B6B4A', bg: '#F5EDE3', border: '#E5D5C5' },
            ].map(c => (
              <div key={c.m} className="flex items-start gap-2.5 rounded-[8px] border p-2.5" style={{ borderColor: c.border, background: c.bg }}>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded font-mono" style={{ background: c.color, color: '#fff' }}>{c.m}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold" style={{ color: c.color }}>{c.label}</p>
                  <p className="text-[9px] text-[#6B6760]">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Right rail ────────────────────────────────────────────────────────────────

function RightRail({ page }: { page: number }) {
  const railContent = page === 1 ? {
    calcula: 'Duraciones PERT = (O + 4M + P) / 6. Costos del plan y líneas de trabajo con dependencias críticas.',
    contexto: 'Convierte las decisiones previas en un plan ejecutable con secuencia lógica, responsables y calendario operativo.',
    supuestos: ['Permisos dentro de los plazos meta.', 'Predios disponibles sin litigio.', 'Financiamiento aprobado en tiempo.', 'Capacidad institucional constante.'],
    verifica: ['No iniciar infraestructura sin permisos.', 'No operar sin responsables definidos.', 'No prometer metas sin capacidad instalada y presupuesto aprobado.'],
  } : page === 2 ? {
    calcula: 'Ruta crítica = secuencia de actividades sin holgura que define la duración mínima del plan. Riesgo de retraso = índice compuesto con probabilidad e impacto.',
    contexto: 'La ejecución depende de dependencias resueltas, responsables claros y mitigación temprana de cuellos de botella.',
    supuestos: ['Precios y costos en pesos de 2025.', 'Recursos y permisos disponibles según calendario.', 'Operación continua de proveedores clave.', 'Capacidad institucional según escenario.'],
    verifica: ['Coherencia del calendario y dependencias.', 'Asignación de responsables.', 'Ruta crítica y holguras.', 'Riesgos y decisiones requeridas.'],
  } : {
    calcula: 'Datos del plan comprometido mostrados con respecto a metas totales definidas en Módulo 1.',
    contexto: 'Traduce el plan integrado en oleadas territoriales, madurez operativa y resultados acumulados en el tiempo.',
    supuestos: ['Capacidad instalada crece por oleadas.', 'Rutas y operador definidos antes de escalar.', 'Monitoreo continuo para ajuste adaptativo.'],
    verifica: ['Ritmo de despliegue vs. lo planeado.', 'Cumplimiento de gates por fase.', 'Generación de valor público y evitar CO₂.'],
  }

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 space-y-0 text-[11px]">
      <RailSection title="Cómo se calcula">
        <p>{railContent.calcula}</p>
      </RailSection>
      <RailSection title="Contexto del módulo">
        <p>{railContent.contexto}</p>
      </RailSection>
      <RailSection title="Supuestos clave">
        <ul className="space-y-1">
          {railContent.supuestos.map(s => (
            <li key={s} className="flex items-start gap-1.5">
              <span className="mt-1 w-1 h-1 rounded-full bg-[#3B6D11] shrink-0" />
              {s}
            </li>
          ))}
        </ul>
      </RailSection>
      <RailSection title="Qué verifica el plan">
        <ul className="space-y-1">
          {railContent.verifica.map(v => (
            <li key={v} className="flex items-start gap-1.5">
              <CheckCircle className="w-2.5 h-2.5 text-[#3B6D11] shrink-0 mt-0.5" />
              {v}
            </li>
          ))}
        </ul>
      </RailSection>
      <RailSection title="Nivel de confianza">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full">
            <div className="h-full rounded-full bg-[#D4881E]" style={{ width: '72%' }} />
          </div>
          <span className="font-semibold text-[#D4881E]">72%</span>
        </div>
        <p className="text-[9px] text-[#A8A49C]">Medio · Basado en completitud de supuestos, datos históricos y madurez institucional.</p>
      </RailSection>
      <RailSection title="Interdependencias del programa">
        <div className="space-y-1">
          {[['M1','Escenario y trayectoria'],['M2','Marco jurídico'],['M3','Planeación logística'],['M4','Infraestructura'],['M6','Financiero'],['M7','Riesgos'],['M8','Seguimiento']].map(([m, l]) => (
            <div key={m} className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold bg-[#F4F2ED] text-[#6B6760] px-1.5 rounded">{m}</span>
              <span className="text-[#6B6760]">{l}</span>
              {m === 'M3' && <span className="ml-auto w-2 h-2 rounded-full bg-[#3B6D11]" />}
            </div>
          ))}
        </div>
      </RailSection>
    </div>
  )
}

// ── Page navigation footer ────────────────────────────────────────────────────

function PageNavFooter({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const labels = ['Plan maestro', 'Ruta crítica y responsables', 'Oleadas territoriales']
  return (
    <div className="mt-6 pt-4 border-t border-[#E8E4DC] flex items-center justify-between gap-2 flex-wrap">
      <div className="flex gap-2">
        {page > 1 && (
          <button
            type="button"
            onClick={() => setPage(page - 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
          >
            ← Pág. {page - 1}: {labels[page - 2]}
          </button>
        )}
        {page < 3 && (
          <button
            type="button"
            onClick={() => setPage(page + 1)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] border border-[#3B6D11] text-[#3B6D11] text-[11px] font-medium hover:bg-[#EAF3DE] transition-colors"
          >
            Pág. {page + 1}: {labels[page]} →
          </button>
        )}
        {page === 3 && (
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-[#3B6D11] text-white text-[11px] font-medium hover:bg-[#2D5A0D] transition-colors"
          >
            Módulo 4: Infraestructura →
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" className="px-3 py-1.5 rounded-[7px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED]">
          Exportar borrador PDF
        </button>
        <button type="button" className="px-3 py-1.5 rounded-[7px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED]">
          Guardar vista
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function FutureGoalsModule({ notice }: { notice?: React.ReactNode }) {
  const {
    zmActiva, horizonte, presetTrayectoria, pctCapturaPorAño,
    resultados, genPercapita, mixCAs, seleccionMunicipioCatalog,
  } = useSimulatorStore()

  const [page, setPage] = useState(1)

  const trayectoria = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)?.label ?? presetTrayectoria
  const capturaFinal = Math.round(pctCapturaPorAño[Math.min(horizonte - 1, pctCapturaPorAño.length - 1)] ?? pctCapturaPorAño.at(-1) ?? 65)
  const rsuDia = resultados?.rsuTotalTonDia ?? 0
  const capexTotal = resultados?.capexTotal ?? 0
  const totalSemanas = Math.min(horizonte * 52, 260)
  const municipio = seleccionMunicipioCatalog?.nombre ?? zmActiva

  const legal = legalFor(zmActiva)

  const empleosMeta = resultados?.empleosTotalesDirectos ?? 0
  const co2Meta = resultados?.co2eEvitadasTon ?? 0
  const derraMeta = resultados?.ingresosBrutos ?? 0
  const serieAnual = resultados?.serieAnual ?? []

  const pageLabels = ['Plan maestro y visión logística', 'Ruta crítica, dependencias y responsables', 'Oleadas territoriales y progresión']

  return (
    <div className="space-y-0 pb-4">
      {/* Page indicator */}
      <div className="flex items-center gap-1.5 mb-4">
        {[1, 2, 3].map(p => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[10px] font-medium transition-colors',
              page === p
                ? 'bg-[#1C2B15] text-white'
                : 'bg-[#F4F2ED] text-[#6B6760] hover:bg-[#E8E4DC]',
            )}
          >
            <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold', page === p ? 'bg-[#3B6D11]' : 'bg-[#D4D0C8]')}>{p}</span>
            <span className="hidden sm:block">{['Plan maestro', 'Ruta crítica', 'Oleadas'][p - 1]}</span>
          </button>
        ))}
        <span className="ml-2 text-[10px] text-[#A8A49C] hidden sm:block">{pageLabels[page - 1]}</span>
      </div>

      {/* 2-col layout: content + rail */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5 items-start">
        <div>
          {page === 1 && (
            <Page1
              municipio={municipio} horizonte={horizonte} trayectoria={trayectoria}
              capturaFinal={capturaFinal} rsuDia={rsuDia}
              vacios={legal.vacios} adendas={legal.adendas} faseLegal={legal.fase}
              capexTotal={capexTotal} totalSemanas={totalSemanas}
            />
          )}
          {page === 2 && (
            <Page2
              municipio={municipio} horizonte={horizonte} trayectoria={trayectoria}
              capturaFinal={capturaFinal} rsuDia={rsuDia}
              vacios={legal.vacios} adendas={legal.adendas} faseLegal={legal.fase}
              totalSemanas={totalSemanas}
            />
          )}
          {page === 3 && (
            <Page3
              municipio={municipio} horizonte={horizonte} trayectoria={trayectoria}
              capturaFinal={capturaFinal} rsuDia={rsuDia} faseLegal={legal.fase}
              genPercapita={genPercapita} capexTotal={capexTotal}
              empleosMeta={empleosMeta} co2Meta={co2Meta}
              derraMeta={derraMeta} serieAnual={serieAnual}
            />
          )}
          <PageNavFooter page={page} setPage={setPage} />
        </div>
        <RightRail page={page} />
      </div>
    </div>
  )
}
