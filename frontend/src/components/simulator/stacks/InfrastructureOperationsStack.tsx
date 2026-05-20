'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell, ReferenceLine,
  ComposedChart, Area,
} from 'recharts'
import {
  AlertTriangle, CheckCircle, Clock, DollarSign, Users, MapPin,
  Truck, TrendingUp, Zap, Building2, ArrowRight, ChevronDown,
  Target, Shield, Package, Leaf,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'
import { TRAJECTORY_UI, CA_CONFIG, FASES_CA, COMPOSICION_RSU, ESTACIONALIDAD } from '@/lib/constants'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
import { CapexOpexBreakdown } from '@/components/simulator/CapexOpexBreakdown'
import { FASES_INVERSION } from '@/lib/capexOpexData'

// ── Constants & static data ───────────────────────────────────────────────────

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

// Legal summary for M2 chip (mirrors FutureGoalsModule)
const LEGAL_ZM: Record<string, { fase: string }> = {
  SLP: { fase: 'Diagnóstico y reforma' },
  MTY: { fase: 'Diagnóstico y reforma' },
  QRO: { fase: 'Diagnóstico y reforma' },
  GDL: { fase: 'Diagnóstico y reforma' },
}

// Proposed center table — generado dinámicamente en el componente según mixCAs del municipio activo
// Mantenemos los datos de ejemplo solo como fallback; la tabla real se genera con generateCentersTable()
type CenterRow = {
  id: string; zona: string; tipo: string; estado: string
  uso: string; vial: string; permiso: string; prioridad: string; cap: number; fase: string
}

const ZONAS_GENERICAS = ['Norte', 'Sur', 'Poniente', 'Oriente', 'Centro', 'Periférico']
const LETRAS_ZONA = ['A','B','C','D','E','F','G','H']

function generateCentersTable(mixCAs: { P: number; M: number; G: number }): CenterRow[] {
  const rows: CenterRow[] = []
  let idx = 1
  const zonaIdx = () => ZONAS_GENERICAS[(idx - 1) % ZONAS_GENERICAS.length] ?? 'Norte'
  const letraIdx = () => LETRAS_ZONA[(idx - 1) % LETRAS_ZONA.length] ?? 'A'
  const addRow = (tipo: string, cap: number, prioridad: string, fase: string) => {
    rows.push({
      id: `CA-${String(idx).padStart(2,'0')} Zona ${letraIdx()}`,
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
  // Minimum 1 row for display
  if (rows.length === 0) addRow('Pequeño', 5, 'Alta', 'F2')
  return rows
}

// Material flows
type FuenteId = 'todos' | 'residencial' | 'comercial' | 'privado' | 'institucional'

const FLOW_BY_STREAM = [
  { corriente: 'Orgánico',         tdiaBase: 188.7, destino: 'Relleno sanitario',  recuperable: 85.3, riesgo: 'Alta',  advertencia: 'Alta carga orgánica en relleno, alto valor perdido',        accion: 'Instalar composta y separación de orgánicos' },
  { corriente: 'Papel / cartón',   tdiaBase: 60.5,  destino: 'Reciclaje',          recuperable: 11.9, riesgo: 'Media', advertencia: 'Depende de acuerdos con recicladoras locales',               accion: 'Formalizar convenios con recicladoras' },
  { corriente: 'Plásticos',        tdiaBase: 67.9,  destino: 'Relleno sanitario',  recuperable: 44.3, riesgo: 'Alta',  advertencia: 'Mejorar separación en origen; recuperable con inversión',      accion: 'Cerrar convenios con recicladoras PET/HDPE' },
  { corriente: 'Vidrio',           tdiaBase: 19.8,  destino: 'Relleno sanitario',  recuperable: 12.1, riesgo: 'Baja',  advertencia: 'Buen valor, requiere acopio seguro y trazable',              accion: 'Establecer punto de acopio de vidrio' },
  { corriente: 'Metales (Al/Fe)',  tdiaBase: 6.7,   destino: 'Reciclaje',          recuperable: 6.7,  riesgo: 'Baja',  advertencia: 'Alta recuperabilidad, bajo volumen',                         accion: 'Mantener canal activo' },
  { corriente: 'Otros (tela, pak.)',tdiaBase: 36.1,  destino: 'Relleno sanitario', recuperable: 13.4, riesgo: 'Baja',  advertencia: 'Oportunidad baja de valorización en esquema estándar',       accion: 'Evaluación por giro y posibilidad de upcycling' },
]

// Trucks by material
const TRUCKS_BY_MATERIAL = [
  { material: 'Materia orgánica', volDia: 188.7, camiones: 9,  frecuencia: 'Diaria', riesgo: 'Alto', obs: 'Perecible — no retrasar recolección' },
  { material: 'Papel / cartón',   volDia: 60.5,  camiones: 3,  frecuencia: '3×/sem', riesgo: 'Medio', obs: 'Compactar para reducir viajes' },
  { material: 'Plásticos',        volDia: 67.9,  camiones: 3,  frecuencia: '3×/sem', riesgo: 'Alto', obs: 'Alta densidad variable; revisar carga' },
  { material: 'Vidrio',           volDia: 19.8,  camiones: 1,  frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Pesado — camión de bajo perfil' },
  { material: 'Metales',          volDia: 6.7,   camiones: 1,  frecuencia: '1×/sem', riesgo: 'Bajo', obs: 'Alto valor por peso; prioritario' },
  { material: 'Otros',            volDia: 36.1,  camiones: 1,  frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Consolidar con ruta de residuos mixtos' },
]

// PER routes — IDs generados dinámicamente según municipio activo
function generatePERRoutes(municipioPrefix: string) {
  return [
    {
      id: `${municipioPrefix}-Z1`, material: 'Orgánicos',  presion: 'Saturación en zona sur. Carga 110% de capacidad.',
      estado: 'Programada. Unidad RSU-01. Lun-Mié-Vie 07:00.',
      respuesta: 'Ajuste en frecuencia. Agregar 1 recorrido. Revisar bitácora semanal.',
      bitacora: 'Últimas visitas recientes', estado_chip: 'alerta' as const,
    },
    {
      id: `${municipioPrefix}-Z2`, material: 'Reciclables', presion: 'Ruta incompleta; 2 colonias fuera de cobertura.',
      estado: 'En operación. Unidad RSU-04. Mar-Jue 08:00.',
      respuesta: 'Monitoreo de precio. Monitoreo calidad de separación.',
      bitacora: 'Últimas visitas recientes', estado_chip: 'info' as const,
    },
  ]
}

// Bottlenecks — referencias a zonas sin nombres hardcoded
const BOTTLENECKS_LOG = [
  { zona: 'Zona sur con saturación',      gravedad: 'Alto',  causa: 'Carga superior a capacidad instalada', impacto: 'Retrasos y desbordamiento', accion: 'Desviar rutas al CA mediano de zona norte temporalmente' },
  { zona: 'Ruta de orgánicos incompleta', gravedad: 'Medio', causa: 'Pérdida de material orgánico fresco',  impacto: 'Pérdida de valor compostal',  accion: 'Completar ruta en colonias pendientes de cobertura' },
  { zona: 'Ventana de descarga insuficiente', gravedad: 'Medio', causa: 'Tiempo de descarga > ventana operativa', impacto: 'Tiempos muertos y filas', accion: 'Ampliar horario del CA principal a 6:00 am' },
]

// Adoption phases
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
    participantes: 'Inspectores, comercios registrados, 4° categoría',
    temas: ['Reglamento municipal', 'Informe de RSU no conformes', 'Reporte a API'],
    kpi: 'Circularidad potencial ≥40% al cierre de año 3',
  },
]

// Adoption curve data (años × pct)
const ADOPTION_CURVE = [
  { año: 'A1', proyectado: 23, meta: 35 },
  { año: 'A2', proyectado: 45, meta: 55 },
  { año: 'A3', proyectado: 62, meta: 70 },
  { año: 'A4', proyectado: 74, meta: 80 },
  { año: 'A5', proyectado: 83, meta: 90 },
]

// Priority actions
const PRIORITY_ACTIONS = [
  { titulo: 'Instalar composta y separación de orgánicos', prioridad: 'Alta', impacto: 'Reduce carga orgánica a relleno y genera abono/biogás', resp: 'Dir. Medio Ambiente', modulo: 'M4+M5' },
  { titulo: 'Cerrar convenios con recicladoras PET/HDPE',  prioridad: 'Alta', impacto: 'Asegura salida de plásticos de mayor valor y estabilidad de precios', resp: 'Dir. Economía', modulo: 'M4+M6' },
  { titulo: 'Optimizar trazabilidad de rutas y centros',   prioridad: 'Media', impacto: 'Reduce desvíos, rechazos y pérdidas de material', resp: 'Operador ancla', modulo: 'M4' },
  { titulo: 'Elevar control de rechazo en separación',     prioridad: 'Media', impacto: 'Mejora pureza del material y reduce contaminación del flujo', resp: 'Comunicación Social', modulo: 'M4+M2' },
]

// OPEX concepts
const OPEX_CONCEPTS: Record<'P'|'M'|'G', Array<{ concepto: string; pct: number }>> = {
  P: [
    { concepto: 'Nómina con prestaciones',        pct: 52 },
    { concepto: 'Energía eléctrica',               pct: 15 },
    { concepto: 'Transporte / combustible',        pct: 13 },
    { concepto: 'Mantenimiento equipo',            pct: 8 },
    { concepto: 'Insumos y consumibles de línea',  pct: 7 },
    { concepto: 'Agua y servicios',                pct: 3 },
    { concepto: 'Seguros',                         pct: 2 },
  ],
  M: [
    { concepto: 'Nómina con prestaciones',         pct: 48 },
    { concepto: 'Energía eléctrica',               pct: 17 },
    { concepto: 'Transporte / combustible',        pct: 14 },
    { concepto: 'Mantenimiento equipo',            pct: 10 },
    { concepto: 'Insumos y consumibles de línea',  pct: 6 },
    { concepto: 'Agua y servicios',                pct: 3 },
    { concepto: 'Seguros',                         pct: 2 },
  ],
  G: [
    { concepto: 'Nómina con prestaciones',         pct: 42 },
    { concepto: 'Energía eléctrica',               pct: 20 },
    { concepto: 'Transporte / combustible',        pct: 13 },
    { concepto: 'Mantenimiento equipo',            pct: 12 },
    { concepto: 'Insumos y consumibles de línea',  pct: 8 },
    { concepto: 'Agua y servicios',                pct: 3 },
    { concepto: 'Seguros',                         pct: 2 },
  ],
}

const STAFF: Record<'P'|'M'|'G', Array<{ puesto: string; cantidad: number; salario: number }>> = {
  P: [
    { puesto: 'Operario clasificación',  cantidad: 2, salario: 9000 },
    { puesto: 'Supervisor operativo',    cantidad: 1, salario: 17500 },
    { puesto: 'Chofer auxiliar',         cantidad: 1, salario: 11000 },
    { puesto: 'Seguridad/limpieza',      cantidad: 1, salario: 7500 },
  ],
  M: [
    { puesto: 'Operario clasificación',  cantidad: 6, salario: 9000 },
    { puesto: 'Supervisor operativo',    cantidad: 2, salario: 17500 },
    { puesto: 'Administrador',           cantidad: 1, salario: 22000 },
    { puesto: 'Chofer auxiliar',         cantidad: 3, salario: 11000 },
    { puesto: 'Seguridad/limpieza',      cantidad: 2, salario: 7500 },
  ],
  G: [
    { puesto: 'Operario clasificación',  cantidad: 16, salario: 9000 },
    { puesto: 'Supervisor operativo',    cantidad: 4,  salario: 17500 },
    { puesto: 'Administrador',           cantidad: 2,  salario: 22000 },
    { puesto: 'Jefe de planta',          cantidad: 1,  salario: 35000 },
    { puesto: 'Chofer auxiliar',         cantidad: 6,  salario: 11000 },
    { puesto: 'Mantenimiento',           cantidad: 3,  salario: 14000 },
    { puesto: 'Seguridad/limpieza',      cantidad: 2,  salario: 7500 },
  ],
}

const EQUIPMENT: Array<{ equipo: string; cant: number; costoUnit: number; kw: number; vidaUtil: number }> = [
  { equipo: 'Prensa compactadora 15HP',   cant: 1, costoUnit: 237500,  kw: 11,  vidaUtil: 10 },
  { equipo: 'Báscula plataforma 1,000 kg', cant: 1, costoUnit: 12500,   kw: 0.2, vidaUtil: 7  },
  { equipo: 'Mesa de clasificación',       cant: 2, costoUnit: 18000,   kw: 0,   vidaUtil: 5  },
  { equipo: 'Patín hidráulico',            cant: 2, costoUnit: 7000,    kw: 0,   vidaUtil: 5  },
  { equipo: 'Contenedor 1,100 L',         cant: 10, costoUnit: 9500,    kw: 0,   vidaUtil: 8  },
  { equipo: 'Herramientas menores',        cant: 1, costoUnit: 15000,   kw: 0,   vidaUtil: 3  },
  { equipo: 'EPP (kit inicial)',           cant: 1, costoUnit: 8500,    kw: 0,   vidaUtil: 1  },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function pxn(n: number) { return `$${n.toLocaleString('es-MX')}` }

// ── DecisionCommitBar M4 ──────────────────────────────────────────────────────

function DecisionCommitBar({
  municipio, horizonte, trayectoria, rsuDia, compact = false,
}: { municipio: string; horizonte: number; trayectoria: string; rsuDia: number; compact?: boolean }) {
  if (compact) {
    return (
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3 mb-4">
        <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-2 font-semibold">Decisiones comprometidas heredadas — solo lectura</p>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-[6px] border border-[#D7E8C0] bg-[#F4FAEC] px-2.5 py-1">
            <span className="text-[#3B6D11] font-semibold">M1:</span>{' '}<span className="text-[#4A4740]">{municipio} · {horizonte}a · {trayectoria} · {fmt.kgd(rsuDia)} capturable</span>
          </span>
          <ChevronDown className="w-3 h-3 text-[#A8A49C] self-center rotate-[-90deg] shrink-0" />
          <span className="rounded-[6px] border border-[#E8D4A0] bg-[#FEF7E7] px-2.5 py-1">
            <span className="text-[#D4881E] font-semibold">M3:</span>{' '}<span className="text-[#4A4740]">Fase activa F3 · oleadas territoriales · calendario aprobado</span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4 mb-5">
      <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-3 font-semibold">Decisiones comprometidas — no editables en este módulo</p>
      <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-2">
        <div className="flex-1 min-w-[160px] rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#3B6D11] font-bold mb-1.5">Módulo 1 · Escenario</p>
          <p className="text-[13px] font-semibold text-[#1C1B18]">{municipio}</p>
          <p className="text-[11px] text-[#5A5750]">{horizonte} años · {trayectoria}</p>
          <p className="text-[11px] font-semibold text-[#3B6D11]">{fmt.kgd(rsuDia)} capturable</p>
          <p className="text-[8px] text-[#A8A49C] mt-1">Flujo objetivo que el sistema físico debe absorber</p>
        </div>
        <div className="hidden lg:flex items-center"><ArrowRight className="w-4 h-4 text-[#A8A49C] shrink-0" /></div>
        <div className="flex-1 min-w-[160px] rounded-[10px] border border-[#E8D4A0] bg-[#FEF7E7] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#D4881E] font-bold mb-1.5">Módulo 3 · Plan logístico</p>
          <p className="text-[13px] font-semibold text-[#1C1B18]">Fase actual F3</p>
          <p className="text-[11px] text-[#5A5750]">Oleadas territoriales · calendario aprobado</p>
          <p className="text-[8px] text-[#A8A49C] mt-1">Define cuándo y en qué secuencia se despliega la infraestructura</p>
        </div>
        <div className="hidden lg:flex items-center"><ArrowRight className="w-4 h-4 text-[#A8A49C] shrink-0" /></div>
        <div className="flex-1 min-w-[160px] rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C] font-bold mb-1.5">Módulo 4 · Decisión actual</p>
          <p className="text-[13px] font-semibold text-[#1C1B18]">Dimensionar capacidad y centros</p>
          <p className="text-[11px] text-[#5A5750]">Centros · rutas · costos · condiciones operativas</p>
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
        <p className="text-[9px] text-[#A8A49C]">En horizonte {5} años</p>
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

// ── Simplified Sankey (HTML-based) ────────────────────────────────────────────

function SimpleSankey({ año, fuente }: { año: number; fuente: FuenteId }) {
  const scale = Math.min(1, 0.5 + año * 0.1)
  const MATERIALS = [
    { mat: 'Orgánico',       pct: 0.52, circ: scale * 0.15, color: '#5A9438' },
    { mat: 'Papel/Cartón',   pct: 0.12, circ: scale * 0.55, color: '#1A5FA8' },
    { mat: 'Plásticos',      pct: 0.13, circ: scale * 0.35, color: '#D4881E' },
    { mat: 'Vidrio',         pct: 0.04, circ: scale * 0.40, color: '#8B6B4A' },
    { mat: 'Metales',        pct: 0.03, circ: scale * 0.85, color: '#A8A49C' },
    { mat: 'Otros',          pct: 0.16, circ: scale * 0.10, color: '#CBD5E1' },
  ]
  const rsuTotal = 379.3
  const srcPct: Record<FuenteId, number> = { todos: 1, residencial: 0.62, comercial: 0.24, privado: 0.10, institucional: 0.04 }
  const multiplier = srcPct[fuente] ?? 1

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3 flex-wrap text-[10px]">
        <span className="text-[#A8A49C]">Fuentes → Materiales → Destino</span>
        <span className="text-[#A8A49C]">·</span>
        <span className="text-[#6B6760]">Año {año} · {fuente === 'todos' ? 'Todas las fuentes' : fuente}</span>
      </div>
      {MATERIALS.map(m => {
        const vol = rsuTotal * m.pct * multiplier
        const circVol = vol * m.circ
        const rellVol = vol - circVol
        return (
          <div key={m.mat} className="flex items-center gap-2">
            <div className="w-20 shrink-0 text-right text-[10px] text-[#4A4740]">{m.mat}</div>
            <div className="flex-1 h-6 bg-[#F4F2ED] rounded flex overflow-hidden">
              <div className="h-full rounded-l flex items-center justify-end pr-1 transition-all duration-500"
                style={{ width: `${m.circ * 100}%`, background: m.color }}>
                {m.circ > 0.2 && <span className="text-[7px] text-white font-semibold">{circVol.toFixed(0)}t</span>}
              </div>
              <div className="h-full bg-[#FCA5A5] flex items-center justify-center transition-all duration-500"
                style={{ width: `${(1 - m.circ) * 100}%` }}>
                {(1 - m.circ) > 0.3 && <span className="text-[7px] text-[#7A1212] font-semibold">{rellVol.toFixed(0)}t</span>}
              </div>
            </div>
            <div className="w-12 shrink-0 text-[9px] text-[#A8A49C] font-mono">{vol.toFixed(0)}t</div>
          </div>
        )
      })}
      <div className="flex gap-4 mt-2 flex-wrap text-[9px]">
        {[['#5A9438','Flujos hacia circularidad'],['#FCA5A5','Flujo a relleno sanitario'],['#F4F2ED','Flujo menor/mixto']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: c }} /><span className="text-[#6B6760]">{l}</span></div>
        ))}
      </div>
      <p className="text-[9px] text-[#A8A49C] italic">
        El Sankey cambia según el año/fase seleccionado. No es una infografía estática; refleja supuestos y escenario del modelo.
      </p>
    </div>
  )
}

// ── Right rail ────────────────────────────────────────────────────────────────

function RightRail({ page }: { page: number }) {
  const content = {
    1: {
      observamos: 'Dónde van los centros, qué flota los mueve y quién responde por cada zona. Sin nueva infraestructura, el municipio dependerá de traslados fuera de su territorio.',
      contexto: 'Módulo 4 traduce el escenario comprometido en infraestructura real: centros, capacidad, brechas, costos y condiciones de habilitación. No vuelve a decidir el escenario — lo ejecuta.',
      que_habilita: 'Definir qué, dónde y cuándo instalar centros para cerrar la brecha y cumplir el plan operativo.',
      metodologia: 'Capacidades por tipología (P/M/G) con benchmark sectorial y localización multi-criterio (accesibilidad, generación, conectividad y suelo).',
      confianza: 58,
    },
    2: {
      observamos: 'La mayor pérdida de valor está en los orgánicos y plásticos. Mejorar separación y rutas de acopio puede reducir fuertemente la dependencia al relleno sanitario.',
      contexto: 'Este módulo muestra los flujos materiales desde las fuentes hasta sus destinos actuales y potenciales. El Sankey es una lectura dinámica en el tiempo (por año/fase), no una infografía estática.',
      que_habilita: 'Priorizar inversiones en composta, precio de referencia de materiales y trazabilidad de rutas para elevar la circularidad real.',
      metodologia: 'Sankey construido a partir del modelo de flujos del módulo S19, con proyecciones sectoriales por año/fase y supuestos de operación.',
      confianza: 58,
    },
    3: {
      observamos: 'La ruta ZM 1 · QRO-Z1 · Orgánicos y corredor sur. Sin nuevas rutas, la cobertura y la valorización se estancan y aumentan traslados y costos operativos.',
      contexto: 'Rutas óptimas por colonia y horarios de servicio. Topografía, tráfico, tiempos de carga y descarga afectan la eficiencia operativa.',
      que_habilita: 'Cumplimiento de frecuencias y tiempos. Estado de unidades y rendimiento real. Accesibilidad en puntos críticos (calles, contenedores, maniobras).',
      metodologia: 'Análisis logístico con supuesto de 12 t/camión/día y factores de estacionalidad del modelo. PER basado en bitácoras operativas del piloto.',
      confianza: 35,
    },
    4: {
      observamos: 'La expansión es sustentable en supuestos verificables e indicadores operativos vinculados al desempeño real.',
      contexto: 'Tab integra los habilitadores humanos y los costos operativos para tomar decisiones sobre cómo financiar y sostener el sistema.',
      que_habilita: 'Define si el municipio cuenta con las capacidades humanas y financieras para operar y expandir de forma sostenible y ordenada.',
      metodologia: 'Parámetros por tamaño de centro, precios de referencia: ANIPAC, CEMPRE México, IMSS Ramo 37, CFE GDMTH. Factor de prestaciones 1.35x.',
      confianza: 65,
    },
    5: {
      observamos: 'El sistema de centros genera derrama positiva desde la Fase 1. El punto de inflexión empleo-inversión ocurre en la Fase 4 al incorporar recicladoras.',
      contexto: 'Los datos CAPEX/OPEX provienen de modelos CFO verificados (Centros_Acopio_v2.xlsx, Recicladoras_por_Giro.xlsx). TIR y payback calculados por escenario de captura efectiva al 40%.',
      que_habilita: 'Comparar rentabilidad y derrama por tipología y giro para priorizar qué centros y recicladoras abrir primero.',
      metodologia: 'Empleo indirecto: multiplicador 2.5× sobre empleos directos (BID/CEPAL — sector residuos y economía circular). Ahorros al municipio: flujo EBITDA anual estimado como ahorro en costo de disposición final evitado.',
      confianza: 72,
    },
  } as const

  const c = content[page as 1|2|3|4|5] ?? content[1]

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Consideraciones</p>
        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded', c.confianza >= 60 ? 'bg-[#EAF3DE] text-[#2D5A0D]' : 'bg-[#FEF3C7] text-[#92400E]')}>
          Confianza {c.confianza}%
        </span>
      </div>
      <RailSection title="Cómo se calcula" open>
        <p>Capacidades derivadas de CA_CONFIG (P/M/G). Brecha = RSU capturable − capacidad instalada. Empleos = suma de empleos por tipo de centro × mix del escenario.</p>
      </RailSection>
      <RailSection title="Consideraciones">
        <p>{c.observamos}</p>
      </RailSection>
      <RailSection title="Contexto del módulo">
        <p>{c.contexto}</p>
      </RailSection>
      <RailSection title="Observamos">
        <p>{c.observamos}</p>
      </RailSection>
      <RailSection title="Decisión que habilita">
        <p>{c.que_habilita}</p>
      </RailSection>
      <RailSection title="Qué verificar aún">
        <ul className="space-y-1">
          {['Disponibilidad y compatibilidad de suelo, permisos ambientales, factibilidad eléctrica y acuerdos intermunicipales.',
            'Calidad del dato en origen, capacidad de operación, logística de embarques y cumplimiento regulatorio.',
            'Plan de formación y adopción, presupuesto de costo, vista rápida CAPEX/OPEX y costos de personal.'].map(v => (
            <li key={v} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#D4881E] shrink-0" />{v}</li>
          ))}
        </ul>
      </RailSection>
      <RailSection title="Metodología">
        <p>{c.metodologia}</p>
      </RailSection>
      <RailSection title="Condiciones de lectura">
        <p className="text-[9px] text-[#A8A49C]">Estos datos no son registros administrativos. Son estimaciones del modelo con datos de referencia sectorial. Deben validarse con información municipal actualizada antes de tomar decisiones de inversión.</p>
      </RailSection>
      <RailSection title="Nivel de confianza">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${c.confianza}%`, background: c.confianza >= 60 ? '#3B6D11' : '#D4881E' }} />
          </div>
          <span className={cn('font-bold text-[11px]', c.confianza >= 60 ? 'text-[#3B6D11]' : 'text-[#D4881E]')}>{c.confianza}%</span>
        </div>
        <p className="text-[9px] text-[#A8A49C]">Medio · validar con datos municipales y levantamiento de campo.</p>
      </RailSection>
    </div>
  )
}

// ── Page 1 — Infraestructura y capacidad ─────────────────────────────────────

function Page1({ rsuDia, capInstalada, brecha, centros, centersTable }: {
  rsuDia: number; capInstalada: number; brecha: number; centros: number
  centersTable: CenterRow[]
}) {
  // Phase deployment chart data from FASES_CA
  const phaseData = FASES_CA.map(f => ({
    fase: `F${f.fase}`, centros: f.nCAs, cap: f.capTonDia,
    cobertura: f.coberturaPct, capex: Math.round(f.capexMXN / 1_000_000),
    ebitdaK: f.ebitdaMesK,
  }))

  return (
    <div className="space-y-6">
      {/* Capacity decision chain */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
        <p className="text-[12px] font-semibold text-[#1C1B18] mb-4">Cadena de decisión de capacidad</p>
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
          {[
            { label: 'RSU capturable', value: fmt.kgd(rsuDia), sub: 'Potencial total del municipio', color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5' },
            null,
            { label: 'Capacidad instalada', value: fmt.kgd(capInstalada), sub: 'Capacidad operativa actual', color: '#3B6D11', bg: '#EAF3DE', border: '#D7E8C0' },
            null,
            { label: 'Brecha operativa', value: fmt.kgd(brecha), sub: 'Capacidad por instalar', color: '#C0392B', bg: '#FFF5F5', border: '#FCA5A5' },
            null,
            { label: 'Acción requerida', value: `Instalar ${centros} centros`, sub: 'Priorizar zonas F3–F5', color: '#D4881E', bg: '#FEF7E7', border: '#FDE68A' },
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

      {/* Map + Portfolio 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Map */}
        <ExpandableChart chartId="m04-map-infra" title="Mapa de cobertura territorial y centros propuestos" subtitle="Zonas · centros existentes/propuestos · brechas territoriales">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="text-[12px] font-semibold text-[#1C1B18]">Cobertura territorial y centros propuestos</p>
              <p className="text-[10px] text-[#A8A49C]">Zonas · fases activas · centros propuestos y existentes · brechas</p>
            </div>
            <div className="p-5">
              <div className="h-60 rounded-[10px] bg-gradient-to-br from-[#EAF3DE] to-[#D7E8C0] border border-[#D7E8C0] relative overflow-hidden">
                {/* Zone blobs */}
                {[
                  { label: 'Zona centro (ZM)', x: '48%', y: '50%', color: '#3B6D11', ring: '#D7E8C0', fase: 'F1 Completada' },
                  { label: 'Zona ZEO',         x: '65%', y: '35%', color: '#1A5FA8', ring: '#BDD7F5', fase: 'F2 En curso' },
                  { label: 'Zona Norte',       x: '55%', y: '20%', color: '#D4881E', ring: '#FDE68A', fase: 'F3 Actual' },
                  { label: 'Zona Sur',         x: '45%', y: '73%', color: '#8B6B4A', ring: '#E5D5C5', fase: 'F4 Programada' },
                  { label: 'Zona Poniente',    x: '22%', y: '45%', color: '#C0392B', ring: '#FCA5A5', fase: 'F5 Programada' },
                ].map(z => (
                  <div key={z.label} className="absolute flex flex-col items-center"
                    style={{ left: z.x, top: z.y, transform: 'translate(-50%,-50%)' }}>
                    <div className="w-9 h-9 rounded-full border-2 flex items-center justify-center text-white shadow-md"
                      style={{ background: z.color, borderColor: z.ring }}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="mt-1 bg-white/90 backdrop-blur rounded-[5px] border border-[#E8E4DC] px-1.5 py-0.5 shadow-sm text-center">
                      <p className="text-[8px] font-semibold text-[#1C1B18] leading-tight">{z.label}</p>
                      <p className="text-[7px]" style={{ color: z.color }}>{z.fase}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  ['#3B6D11','Zona centro (ZM)'],['#1A5FA8','Zona ZEO'],['#D4881E','Norte'],
                  ['#8B6B4A','Sur'],['#C0392B','Poniente'],
                  ['#E8E4DC','Zona sin cobertura'], ['#2D5A0D','Centro propuesto'], ['#1A4200','Centro existente'],
                ].map(([c,l]) => (
                  <div key={l} className="flex items-center gap-1 text-[8px]">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} />
                    <span className="text-[#6B6760]">{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ExpandableChart>

        {/* Portfolio */}
        <div className="space-y-2.5">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Portafolio recomendado de infraestructura</p>
          {(['P','M','G'] as const).map(tipo => {
            const c = CA_CONFIG[tipo]
            const labels: Record<string, { label: string; color: string; uso: string; funcion: string }> = {
              P: { label: 'Centro Pequeño', color: '#3B6D11', uso: 'Colonias y microrregiones', funcion: 'Recolección, pretratamiento y valorización inicial' },
              M: { label: 'Centro Mediano', color: '#1A5FA8', uso: 'Polos urbanos y corredores', funcion: 'Recuperación de materiales y valorización' },
              G: { label: 'Centro Grande',  color: '#8B6B4A', uso: 'Polígonos industriales o periféricos', funcion: 'Clasificación avanzada, tratamiento y valorización energética' },
            }
            const meta = labels[tipo]!
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
                    ['Uso recom.',   meta.uso],
                    ['CAPEX',        pxn(c.capexMXN)],
                    ['OPEX/mes',     pxn(c.opexMesMXN)],
                    ['Payback',      `${c.paybackMeses} meses`],
                  ].map(([k,v]) => (
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
      </div>

      {/* Phase deployment chart */}
      <ExpandableChart chartId="m04-phase-deploy" title="Despliegue de infraestructura por fase" subtitle="Centros activos · capacidad instalada · cobertura acumulada">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
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
                  <Bar yAxisId="l" dataKey="centros" name="Centros" fill="#3B6D11" radius={[4,4,0,0]} />
                  <Bar yAxisId="r" dataKey="cap"     name="Cap. t/día" fill="#1A5FA8" radius={[4,4,0,0]} opacity={0.7} />
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
                  <Bar dataKey="cobertura" name="Cobertura %" fill="#D4881E" radius={[4,4,0,0]} />
                  <Bar dataKey="capex"     name="CAPEX M MXN" fill="#8B6B4A" radius={[4,4,0,0]} opacity={0.7} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </ExpandableChart>

      {/* Center table */}
      <ExpandableChart chartId="m04-center-table" title="Centros propuestos y gates de habilitación" subtitle="Estado · uso de suelo · conectividad · permiso · prioridad">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0EDE5]">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Centros propuestos y gates de habilitación</p>
            <p className="text-[10px] text-[#A8A49C]">Un centro no puede ser operable sin cumplir los gates mínimos</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Centro','Zona','Tipo','Estado','Uso de suelo','Conectividad vial','Permiso','Prioridad'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {centersTable.map((c, i) => {
                  const prioColor = c.prioridad === 'Alta' ? 'bg-[#FDE8E8] text-[#B91C1C]' : c.prioridad === 'Media' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#F4F2ED] text-[#6B6760]'
                  const estadoColor = c.estado === 'En diseño' ? 'text-[#1A5FA8]' : c.estado === 'En gestión' ? 'text-[#D4881E]' : 'text-[#6B6760]'
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
            La brecha de <strong>{fmt.kgd(brecha)}</strong> implica que, sin nueva infraestructura, el municipio dependerá de traslados fuera de su territorio,
            con mayores costos, tiempos y emisiones. Instalar <strong>{FASES_CA.find(f => f.esOptimo)?.nCAs ?? 18} centros</strong> en el horizonte F3–F5
            permitiría capturar el 61% del potencial y crear 147 empleos directos e indirectos.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { label: 'Recomendación', value: 'Plan moderado F3–F5', color: '#3B6D11' },
              { label: 'Riesgo principal', value: 'Predios y permisos',    color: '#C0392B' },
              { label: 'Condición crítica', value: 'Operador contratado',  color: '#D4881E' },
              { label: 'Siguiente acción', value: 'Gestionar predios del CA principal', color: '#1A5FA8' },
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
  )
}

// ── Page 2 — Flujos y cierre de ciclo ────────────────────────────────────────

function Page2({ rsuDia }: { rsuDia: number }) {
  const [fuente, setFuente] = useState<FuenteId>('todos')
  const [año, setAño] = useState(3)

  const FUENTES: Array<{ id: FuenteId; label: string }> = [
    { id: 'todos', label: 'Todos' }, { id: 'residencial', label: 'Residencial' },
    { id: 'comercial', label: 'Comercial' }, { id: 'privado', label: 'Privado / Ind.' },
    { id: 'institucional', label: 'Institucional' },
  ]

  const circReal = 5.5 + año * 1.2
  const circPot  = 62 + año * 5
  const perdido  = rsuDia * (1 - circReal / 100)
  const oportunidad = perdido * 365 * 2400

  return (
    <div className="space-y-5">
      {/* Source filters + year slider */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          {FUENTES.map(f => (
            <button key={f.id} type="button" onClick={() => setFuente(f.id)}
              className={cn('px-3 py-1 rounded-full text-[10px] font-semibold transition-colors',
                fuente === f.id ? 'bg-[#3B6D11] text-white' : 'bg-[#F4F2ED] text-[#6B6760] hover:bg-[#E8E4DC]'
              )}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-[10px] text-[#A8A49C]">Explorar flujo en espacio-tiempo</span>
          <input type="range" min={1} max={5} value={año} onChange={e => setAño(Number(e.target.value))}
            className="w-28 accent-green-700" />
          <span className="text-[10px] font-semibold text-[#3B6D11] min-w-[50px]">
            Año {año} · {['F1','F2','F3','F4','F5'][año-1]}
          </span>
        </div>
      </div>

      {/* Circularity KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
          <p className="text-[9px] uppercase text-[#A8A49C] mb-1">% Circularidad real actual</p>
          <p className="text-[22px] font-bold text-[#3B6D11]">{circReal.toFixed(1)}%</p>
          <p className="text-[9px] text-[#A8A49C]">Valorizado / RSU generado</p>
        </div>
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
          <p className="text-[9px] uppercase text-[#A8A49C] mb-1">% Circularidad potencial</p>
          <p className="text-[22px] font-bold text-[#1A5FA8]">{Math.min(circPot, 95).toFixed(1)}%</p>
          <p className="text-[9px] text-[#A8A49C]">Si se cierran brechas infra/mercado</p>
        </div>
        <div className="rounded-[10px] border border-[#FCA5A5] bg-[#FFF5F5] p-3.5">
          <p className="text-[9px] uppercase text-[#A8A49C] mb-1">Recuperable perdido</p>
          <p className="text-[22px] font-bold text-[#C0392B]">{perdido.toFixed(1)} t/día</p>
          <p className="text-[9px] text-[#A8A49C]">Val. que hoy va a relleno</p>
        </div>
        <div className="rounded-[10px] border border-[#FDE68A] bg-[#FEF7E7] p-3.5">
          <p className="text-[9px] uppercase text-[#A8A49C] mb-1">Oportunidad anual</p>
          <p className="text-[22px] font-bold text-[#D4881E]">${(oportunidad / 1e6).toFixed(1)} M MXN</p>
          <p className="text-[9px] text-[#A8A49C]">Valor rec. potencial/año</p>
        </div>
      </div>

      {/* Sankey */}
      <ExpandableChart chartId="m04-sankey" title="Sankey dinámico — fuente → material → destino" subtitle="Flujos de residuos por año y por fuente generadora">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Sankey dinámico: fuente → material → destino</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">Verde = circularidad · rojo = relleno sanitario · Año {año} · {fuente === 'todos' ? 'Todas las fuentes' : fuente}</p>
          <SimpleSankey año={año} fuente={fuente} />
        </div>
      </ExpandableChart>

      {/* Flow by stream table */}
      <ExpandableChart chartId="m04-flows" title="Flujos por corriente de material" subtitle="t/día · destino · recuperable · acción sugerida">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0EDE5]">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Flujos por corriente</p>
            <p className="text-[10px] text-[#A8A49C]">La tabla convierte el Sankey en decisiones operativas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Corriente','t/día','Destino actual','Recuperable','Advertencia','Riesgo','Acción sugerida'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FLOW_BY_STREAM.map((f, i) => {
                  const riesgoColor = f.riesgo === 'Alta' ? 'bg-[#FDE8E8] text-[#B91C1C]' : f.riesgo === 'Media' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#F4F2ED] text-[#6B6760]'
                  return (
                    <tr key={f.corriente} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-3 py-2.5 font-semibold text-[#1C1B18]">{f.corriente}</td>
                      <td className="px-3 py-2.5 font-mono">{f.tdiaBase.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-[#6B6760]">{f.destino}</td>
                      <td className="px-3 py-2.5 font-mono text-[#3B6D11] font-semibold">{f.recuperable.toFixed(1)}</td>
                      <td className="px-3 py-2.5 text-[#6B6760] max-w-[160px] text-[9px]">{f.advertencia}</td>
                      <td className="px-3 py-2.5"><span className={cn('px-1.5 py-0.5 rounded font-semibold text-[9px]', riesgoColor)}>{f.riesgo}</span></td>
                      <td className="px-3 py-2.5 text-[9px] text-[#4A4740]">{f.accion}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ExpandableChart>

      {/* Priority actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PRIORITY_ACTIONS.map(a => {
          const prioColor = a.prioridad === 'Alta' ? 'bg-[#FDE8E8] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]'
          return (
            <div key={a.titulo} className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[11px] font-semibold text-[#1C1B18] leading-snug flex-1">{a.titulo}</p>
                <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', prioColor)}>{a.prioridad}</span>
              </div>
              <p className="text-[10px] text-[#6B6760] mb-2">{a.impacto}</p>
              <div className="flex gap-3 text-[9px]">
                <span className="text-[#A8A49C]">Resp: <span className="text-[#4A4740] font-medium">{a.resp}</span></span>
                <span className="text-[#A8A49C]">Módulo: <span className="text-[#3B6D11] font-medium">{a.modulo}</span></span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page 3 — Logística y operación ───────────────────────────────────────────

function Page3({ rsuDia, perRoutes }: { rsuDia: number; perRoutes: ReturnType<typeof generatePERRoutes> }) {
  const seasonData = MESES.map((m, i) => {
    const base = rsuDia * 30
    const factor = 1 + (ESTACIONALIDAD[i] ?? 0)
    return { mes: m, rsu: Math.round(base * factor), cap: Math.round(rsuDia * 30 * 0.61) }
  })

  return (
    <div className="space-y-5">
      {/* Route map + Logistics KPIs 2-col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Map */}
        <ExpandableChart chartId="m04-routes" title="Mapa de rutas y cobertura operativa" subtitle="Rutas orgánicas · reciclables · mixtas · zonas cubiertas">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0EDE5]">
              <p className="text-[12px] font-semibold text-[#1C1B18]">Mapa de rutas y cobertura operativa</p>
              <p className="text-[10px] text-[#A8A49C]">Rutas activas · colonias cubiertas · brechas críticas</p>
            </div>
            <div className="p-4">
              <div className="h-48 rounded-[10px] bg-gradient-to-br from-[#EBF3FB] to-[#DBEAFE] border border-[#BDD7F5] relative overflow-hidden flex items-end justify-between p-3">
                {/* Route line hints */}
                {[['22%','30%','75%','50%','#3B6D11','Orgánica'],['35%','60%','80%','30%','#1A5FA8','Reciclable'],['50%','20%','70%','70%','#D4881E','Mixta']].map(([x1,y1,x2,y2,c,n]) => (
                  <svg key={n} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                    <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c as string} strokeWidth="2" strokeDasharray="6,3" />
                  </svg>
                ))}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/90 backdrop-blur rounded-[8px] border border-[#BDD7F5] p-3 text-center shadow">
                    <p className="text-[11px] font-semibold text-[#1A5FA8]">Municipio</p>
                    <p className="text-[9px] text-[#6B6760]">Ver mapa en pantalla completa →</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
                {[
                  ['12', 'Rutas activas'], ['3× sem', 'Frecuencia semanal'],
                  ['80 rec.', 'Colonias cubiertas'], ['4', 'Brechas críticas'],
                ].map(([v, l]) => (
                  <div key={l} className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1.5">
                    <p className="font-bold text-[#1C1B18]">{v}</p>
                    <p className="text-[8px] text-[#A8A49C]">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ExpandableChart>

        {/* Logistics load */}
        <div className="space-y-2.5">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Carga logística y transporte</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Camiones requeridos', value: '18',          sub: 'para el horizonte', icon: Truck,       color: '#1A5FA8' },
              { label: 'Visitas mensuales',   value: '13.0',        sub: 'por ruta piloto',   icon: Clock,       color: '#3B6D11' },
              { label: 'Merma logística',     value: '18%',         sub: 'del vol. movilizado', icon: AlertTriangle, color: '#C0392B' },
              { label: 'Presión operativa',   value: 'Media-alta',  sub: 'en cond. actuales', icon: TrendingUp,  color: '#D4881E' },
            ].map(c => (
              <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
                <div className="flex items-center gap-1.5 mb-1"><c.icon className="w-3.5 h-3.5 shrink-0" style={{ color: c.color }} /><p className="text-[9px] uppercase text-[#A8A49C]">{c.label}</p></div>
                <p className="text-[20px] font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-[9px] text-[#A8A49C]">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trucks by material */}
      <ExpandableChart chartId="m04-trucks" title="Camiones requeridos por material" subtitle="Volumen · número de unidades · frecuencia · riesgo logístico">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0EDE5]">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Camiones requeridos por material (horizonte {5} años)</p>
            <p className="text-[10px] text-[#A8A49C]">Vol. t/día · unidades · frecuencia · riesgo · observación</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Material','Vol. t/día','Camiones','Frecuencia','Riesgo logístico','Observación'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRUCKS_BY_MATERIAL.map((t, i) => {
                  const rColor = t.riesgo === 'Alto' ? 'bg-[#FDE8E8] text-[#B91C1C]' : t.riesgo === 'Medio' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#D1FAE5] text-[#065F46]'
                  return (
                    <tr key={t.material} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-3 py-2.5 font-semibold text-[#1C1B18]">{t.material}</td>
                      <td className="px-3 py-2.5 font-mono">{t.volDia}</td>
                      <td className="px-3 py-2.5 font-bold text-[#1A5FA8] font-mono">{t.camiones}</td>
                      <td className="px-3 py-2.5 text-[#6B6760]">{t.frecuencia}</td>
                      <td className="px-3 py-2.5"><span className={cn('px-1.5 py-0.5 rounded font-semibold text-[9px]', rColor)}>{t.riesgo}</span></td>
                      <td className="px-3 py-2.5 text-[9px] text-[#6B6760]">{t.obs}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ExpandableChart>

      {/* Seasonality */}
      <ExpandableChart chartId="m04-seasonality" title="Estacionalidad y capacidad de servicio" subtitle="RSU mensual esperado vs. capacidad instalada (t/mes)">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Estacionalidad y capacidad de servicio</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">Mayo y diciembre presentan picos — la capacidad instalada no cubre la demanda en esos meses</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={seasonData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
              <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }}
                formatter={(v: number, n: string) => [`${v.toLocaleString()} t`, n === 'rsu' ? 'RSU mensual' : 'Cap. instalada']} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="rsu" name="RSU mensual (t)" fill="#1A5FA8" radius={[3,3,0,0]}>
                {seasonData.map((d, i) => (
                  <Cell key={i} fill={d.rsu > d.cap ? '#C0392B' : '#1A5FA8'} />
                ))}
              </Bar>
              <Line type="monotone" dataKey="cap" name="Cap. instalada" stroke="#3B6D11" strokeWidth={2} dot={false} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[9px] text-[#A8A49C] mt-2">Barras rojas = meses donde la demanda supera capacidad instalada</p>
        </div>
      </ExpandableChart>

      {/* PER routes */}
      <div className="space-y-3">
        <p className="text-[12px] font-semibold text-[#1C1B18]">PER — Presión, estado y respuesta por ruta crítica</p>
        {perRoutes.map(r => (
          <div key={r.id} className={cn('rounded-[10px] border p-4', r.estado_chip === 'alerta' ? 'border-[#FCA5A5] bg-[#FFF5F5]' : 'border-[#BDD7F5] bg-[#EBF3FB]')}>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] font-bold bg-[#1C2B15] text-white px-2 py-0.5 rounded">{r.id}</span>
              <span className="text-[11px] font-semibold text-[#1C1B18]">{r.material}</span>
              {r.estado_chip === 'alerta' && <AlertTriangle className="w-3.5 h-3.5 text-[#C0392B] ml-auto" />}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
              {[['Presión', r.presion, '#C0392B'], ['Estado', r.estado, '#1A5FA8'], ['Respuesta', r.respuesta, '#3B6D11']].map(([k, v, c]) => (
                <div key={k as string}>
                  <p className="font-bold uppercase tracking-wide text-[8px] mb-0.5" style={{ color: c as string }}>{k as string}</p>
                  <p className="text-[#4A4740] leading-snug">{v as string}</p>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-[#A8A49C] mt-2 pt-2 border-t border-current/10">{r.bitacora}</p>
          </div>
        ))}
      </div>

      {/* Bottlenecks */}
      <div className="space-y-2.5">
        <p className="text-[12px] font-semibold text-[#1C1B18]">Cuellos de botella detectados</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {BOTTLENECKS_LOG.map(b => {
            const gColor = b.gravedad === 'Alto' ? 'border-[#FCA5A5] bg-[#FFF5F5]' : 'border-[#FDE68A] bg-[#FEF7E7]'
            const tColor = b.gravedad === 'Alto' ? 'text-[#C0392B]' : 'text-[#D4881E]'
            return (
              <div key={b.zona} className={cn('rounded-[10px] border p-4', gColor)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-[11px] font-semibold text-[#1C1B18] leading-snug">{b.zona}</p>
                  <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', b.gravedad === 'Alto' ? 'bg-[#FDE8E8] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]')}>{b.gravedad}</span>
                </div>
                <p className="text-[9px] text-[#6B6760] mb-1">Causa: {b.causa}</p>
                <p className={cn('text-[9px] font-semibold mb-2', tColor)}>Impacto: {b.impacto}</p>
                <p className="text-[9px] text-[#4A4740]">→ {b.accion}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Page 4 — Habilitadores y costos ──────────────────────────────────────────

function Page4() {
  type SubTab = 'adoption' | 'capex'
  type CATipo = 'P' | 'M' | 'G'
  const [subTab, setSubTab] = useState<SubTab>('adoption')
  const [caTipo, setCaTipo] = useState<CATipo>('P')

  const ca = CA_CONFIG[caTipo]
  const opexList = OPEX_CONCEPTS[caTipo]
  const staffList = STAFF[caTipo]
  const prestFactor = 1.35
  const totalNomina = staffList.reduce((s, p) => s + p.cantidad * p.salario * prestFactor, 0)

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex gap-2">
        {([['adoption','Capacitación y adopción'],['capex','CAPEX / OPEX detallado']] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => setSubTab(id)}
            className={cn('px-4 py-2 rounded-[8px] text-[11px] font-semibold border transition-colors',
              subTab === id ? 'bg-[#1C2B15] text-white border-[#1C2B15]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]'
            )}>
            {label}
          </button>
        ))}
      </div>

      {subTab === 'adoption' && (
        <div className="space-y-5">
          {/* Adoption curve */}
          <ExpandableChart chartId="m04-adoption" title="Plan de formación y adopción por fase" subtitle="Adopción proyectada vs. meta · por año del programa">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Curva de adopción proyectada vs. meta</p>
                  <p className="text-[10px] text-[#A8A49C] mb-4">Sin capacitación activa la curva se cae — la adopción impulsa la captura</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={ADOPTION_CURVE} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                      <XAxis dataKey="año" tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="proyectado" name="Adopción proyectada %" fill="#3B6D11" radius={[4,4,0,0]} />
                      <Bar dataKey="meta"        name="Meta %" fill="#E8E4DC" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">KPIs de adopción</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      ['Participación mínima', '36%', '#3B6D11'],
                      ['Abandono 1er trim.',   '23%', '#C0392B'],
                      ['Meta año 3',           '70%', '#1A5FA8'],
                      ['Adopción inicial',     '23%', '#D4881E'],
                    ].map(([l, v, c]) => (
                      <div key={l as string} className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2">
                        <p className="text-[8px] uppercase text-[#A8A49C]">{l as string}</p>
                        <p className="text-[14px] font-bold" style={{ color: c as string }}>{v as string}</p>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[8px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-2.5">
                    <p className="text-[9px] text-[#3B5F23]">
                      La adopción inicial (23%) determina la velocidad de la rampa. Sin comunicación activa y formación por zona,
                      la captura no alcanza las metas proyectadas en el Módulo 1.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </ExpandableChart>

          {/* Training phases */}
          <div className="space-y-2.5">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Fases de formación y contenidos</p>
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
                <p className="text-[10px] text-[#3B6D11] font-semibold">✓ KPI de cierre: {f.kpi}</p>
              </div>
            ))}
          </div>

          {/* Cost assumptions */}
          <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-4">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-2">Supuestos y fuentes de costo</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {['ANIPAC','CEMPRE México','IMSS Ramo 37','CFE GDMTH'].map(s => (
                <span key={s} className="text-[9px] font-semibold bg-[#EBF3FB] text-[#1A5FA8] border border-[#BDD7F5] px-2 py-0.5 rounded">{s}</span>
              ))}
              {['Factor prest. 1.35x','Precios mar. 2026','Sin IVA'].map(s => (
                <span key={s} className="text-[9px] font-semibold bg-[#EAF3DE] text-[#3B6D11] border border-[#D7E8C0] px-2 py-0.5 rounded">{s}</span>
              ))}
            </div>
            <p className="text-[10px] text-[#6B6760]">
              Los costos y consumos están parametrizados por tamaño de centro y nivel de servicio.
              La expansión se sustenta en supuestos verificables e indicadores operativos vinculados al desempeño real.
            </p>
          </div>
        </div>
      )}

      {subTab === 'capex' && (
        <div className="space-y-5">
          {/* CA type selector */}
          <div className="flex items-center gap-3">
            <p className="text-[11px] text-[#6B6760]">Vista rápida CAPEX/OPEX</p>
            {(['P','M','G'] as const).map(t => (
              <button key={t} type="button" onClick={() => setCaTipo(t)}
                className={cn('px-3 py-1.5 rounded-[7px] text-[10px] font-semibold border transition-colors',
                  caTipo === t ? 'bg-[#3B6D11] text-white border-[#3B6D11]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]'
                )}>
                {t === 'P' ? 'Pequeño (5 t/día)' : t === 'M' ? 'Mediano (15 t/día)' : 'Grande (50 t/día)'}
              </button>
            ))}
            <span className="text-[9px] text-[#A8A49C] ml-2">Todas las cifras en MXN sin IVA</span>
          </div>

          {/* CAPEX/OPEX KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {[
              { label: 'Superficie', value: `${ca.superficieM2} m²`, color: '#1A5FA8' },
              { label: 'CAPEX total', value: pxn(ca.capexMXN), color: '#C0392B' },
              { label: 'OPEX mensual', value: pxn(ca.opexMesMXN), color: '#D4881E' },
              { label: 'Payback est.', value: `${ca.paybackMeses} meses`, color: '#3B6D11' },
              { label: 'Empleos/centro', value: String(ca.empleos), color: '#8B6B4A' },
            ].map(c => (
              <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
                <p className="text-[9px] uppercase text-[#A8A49C] mb-1">{c.label}</p>
                <p className="text-[20px] font-bold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>

          {/* OPEX table + Staff side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ExpandableChart chartId="m04-opex" title="OPEX mensual por concepto" subtitle="Sin costo de compra de MP">
              <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-[#F0EDE5]">
                  <p className="text-[11px] font-semibold text-[#1C1B18]">OPEX mensual (sin costo de compra de MP)</p>
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
                          <td className="px-4 py-2 text-right font-mono">{pxn(val)}</td>
                          <td className="px-4 py-2 text-right text-[#D4881E] font-semibold">{o.pct}%</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-[#1C2B15]">
                      <td className="px-4 py-2.5 font-bold text-white">OPEX TOTAL</td>
                      <td className="px-4 py-2.5 text-right font-bold text-white font-mono">{pxn(ca.opexMesMXN)}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-white">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ExpandableChart>

            <ExpandableChart chartId="m04-staff" title="Estructura de personal y catálogo base" subtitle="Salarios brutos · prestaciones 1.35x · total mensual">
              <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
                <div className="px-5 py-3 border-b border-[#F0EDE5]">
                  <p className="text-[11px] font-semibold text-[#1C1B18]">Estructura de personal y catálogo base</p>
                  <p className="text-[9px] text-[#A8A49C]">Prestaciones: factor 1.35x sobre salario bruto</p>
                </div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                      {['Puesto','#','Salario','Subtotal mensual'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((p, i) => {
                      const subtotal = p.cantidad * p.salario
                      return (
                        <tr key={p.puesto} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                          <td className="px-3 py-2 text-[#4A4740]">{p.puesto}</td>
                          <td className="px-3 py-2 font-mono font-bold text-[#1A5FA8]">{p.cantidad}</td>
                          <td className="px-3 py-2 font-mono">{pxn(p.salario)}</td>
                          <td className="px-3 py-2 font-mono">{pxn(subtotal)}</td>
                        </tr>
                      )
                    })}
                    <tr className="bg-[#1C2B15]">
                      <td className="px-3 py-2.5 font-bold text-white text-[9px]">Total mensual personal</td>
                      <td className="px-3 py-2.5 font-bold text-white font-mono">{staffList.reduce((s, p) => s + p.cantidad, 0)}</td>
                      <td className="px-3 py-2.5 text-[#A8A49C]">—</td>
                      <td className="px-3 py-2.5 font-bold text-white font-mono">{pxn(totalNomina)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </ExpandableChart>
          </div>

          {/* Equipment catalog */}
          <ExpandableChart chartId="m04-equipment" title="Catálogo de equipos" subtitle="Centro tipo — cantidad · costo unitario · kW · vida útil">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0EDE5]">
                <p className="text-[11px] font-semibold text-[#1C1B18]">Catálogo de equipos — Centro tipo {caTipo === 'P' ? 'Pequeño' : caTipo === 'M' ? 'Mediano' : 'Grande'}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                      {['Equipo','Cant.','Costo unit.','Total','kW','Vida útil'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {EQUIPMENT.map((e, i) => (
                      <tr key={e.equipo} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                        <td className="px-3 py-2 text-[#4A4740]">{e.equipo}</td>
                        <td className="px-3 py-2 font-mono font-bold text-center text-[#1A5FA8]">{e.cant}</td>
                        <td className="px-3 py-2 font-mono">{pxn(e.costoUnit)}</td>
                        <td className="px-3 py-2 font-mono font-semibold">{pxn(e.cant * e.costoUnit)}</td>
                        <td className="px-3 py-2 font-mono text-[#D4881E]">{e.kw > 0 ? e.kw : '—'}</td>
                        <td className="px-3 py-2 text-[#6B6760]">{e.vidaUtil} años</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </ExpandableChart>
        </div>
      )}

      {/* Executive reading */}
      <div className="rounded-[12px] border-2 border-[#3B6D11] bg-[#F4FAEC] px-6 py-5 flex items-start gap-4">
        <Leaf className="w-7 h-7 text-[#3B6D11] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[13px] font-bold text-[#3B6D11] mb-2">Lectura ejecutiva</p>
          <p className="text-[13px] text-[#3B5F23] leading-relaxed mb-3">
            Sin capacitación la curva de captura se cae; sin costos auditables la expansión no es financiable.
            Esta página reúne los habilitadores humanos, técnicos y financieros que convierten la infraestructura
            en un sistema operable, escalable y sostenible.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { label: 'Alerta adopción',  value: 'Abandono 23% en T1', color: '#C0392B' },
              { label: 'Alerta costos',    value: 'OPEX depende de nómina 52%', color: '#D4881E' },
              { label: 'Recomendación',   value: 'Capacitar en F1 antes de escalar', color: '#3B6D11' },
              { label: 'Acción siguiente', value: 'Aprobar estructura de personal', color: '#1A5FA8' },
            ].map(c => (
              <div key={c.label} className="rounded-[8px] border border-[#C4DFA0] bg-white px-2.5 py-2">
                <p className="text-[8px] uppercase text-[#A8A49C]">{c.label}</p>
                <p className="text-[10px] font-semibold" style={{ color: c.color }}>{c.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── DerramaEconomicaChart ─────────────────────────────────────────────────────
// All data derived from FASES_INVERSION — no hardcoded values.
// Indirect employment: BID/CEPAL 2.5× multiplier (waste & circular economy sector).
// Municipal savings proxy: annualized system EBITDA (avoided landfill disposal cost).

function DerramaEconomicaChart() {
  const data = FASES_INVERSION.map(f => ({
    fase:             `F${f.fase}`,
    faseLabel:        f.nombre,
    empleoDirecto:    f.empleosTotales,
    empleoIndirecto:  Math.round(f.empleosTotales * 2.5),
    inversionAcum:    +(f.capexTotalSistema / 1_000_000).toFixed(1),
    ahorrosMunicipio: +((f.ebitdaMesSistema * 12) / 1_000_000).toFixed(1),
    esOptimo:         f.nombre.includes('Madurez') || f.nombre.includes('Óptimo'),
  }))

  return (
    <div className="space-y-4">
      {/* KPI resumen al cierre (fase máxima) */}
      {(() => {
        const last = data[data.length - 1]
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Empleo directo (cierre)',   value: last.empleoDirecto.toLocaleString('es-MX'),   color: '#3B6D11', sub: 'personas en el sistema' },
              { label: 'Empleo indirecto estimado', value: last.empleoIndirecto.toLocaleString('es-MX'),  color: '#8DB87A', sub: 'multiplicador 2.5× BID/CEPAL' },
              { label: 'Inversión acumulada',       value: `$${last.inversionAcum}M MXN`,                 color: '#C0392B', sub: 'CAs + Recicladoras' },
              { label: 'Ahorros municipio / año',   value: `$${last.ahorrosMunicipio}M MXN`,              color: '#1A5FA8', sub: 'flujo EBITDA anual est.' },
            ].map(k => (
              <div key={k.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
                <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none mb-1">{k.label}</p>
                <p className="font-mono text-[17px] font-semibold" style={{ color: k.color }}>{k.value}</p>
                <p className="text-[9px] text-[#A8A49C] mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>
        )
      })()}

      {/* Multi-line / area chart */}
      <ExpandableChart chartId="m04-derrama-empleo" title="Empleo directo e indirecto por fase" subtitle="Personas creadas en el sistema de centros de acopio y recicladoras">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Creación de empleo por fase de despliegue</p>
          <p className="text-[10px] text-[#A8A49C] mb-3">Directo (sistema) · Indirecto (2.5× multiplicador BID/CEPAL)</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
              <XAxis dataKey="fase" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="emp" orientation="left" tick={{ fontSize: 10 }} tickFormatter={v => v.toLocaleString('es-MX')} label={{ value: 'Personas', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
              <Tooltip formatter={(v: number, name: string) => [v.toLocaleString('es-MX'), name]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine yAxisId="emp" x={data.find(d => d.esOptimo)?.fase} stroke="#3B6D11" strokeDasharray="4 2" label={{ value: '★ Fase óptima', position: 'top', style: { fontSize: 9, fill: '#3B6D11' } }} />
              <Area yAxisId="emp" type="monotone" dataKey="empleoIndirecto" name="Empleo indirecto" fill="#D7EFC5" stroke="#8DB87A" strokeWidth={2} strokeDasharray="4 2" />
              <Line yAxisId="emp" type="monotone" dataKey="empleoDirecto"   name="Empleo directo"   stroke="#3B6D11"  strokeWidth={2.5} dot={{ r: 4, fill: '#3B6D11' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </ExpandableChart>

      <ExpandableChart chartId="m04-derrama-financiera" title="Inversión acumulada y ahorros al municipio" subtitle="Millones de MXN por fase de despliegue">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Flujo de caja invertido y derrama al municipio</p>
          <p className="text-[10px] text-[#A8A49C] mb-3">Inversión acumulada (CAPEX CAs + Recicladoras) · Ahorros municipio (EBITDA anual est.)</p>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
              <XAxis dataKey="fase" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="fin" orientation="left" tick={{ fontSize: 10 }} tickFormatter={v => `$${v}M`} label={{ value: 'M MXN', angle: -90, position: 'insideLeft', style: { fontSize: 9 } }} />
              <Tooltip formatter={(v: number, name: string) => [`$${v}M MXN`, name]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine yAxisId="fin" x={data.find(d => d.esOptimo)?.fase} stroke="#3B6D11" strokeDasharray="4 2" label={{ value: '★ Fase óptima', position: 'top', style: { fontSize: 9, fill: '#3B6D11' } }} />
              <Area yAxisId="fin" type="monotone" dataKey="inversionAcum"    name="Inversión acumulada" fill="#FDDEDE" stroke="#C0392B" strokeWidth={2} fillOpacity={0.5} />
              <Area yAxisId="fin" type="monotone" dataKey="ahorrosMunicipio" name="Ahorros municipio"   fill="#DBE9FA" stroke="#1A5FA8" strokeWidth={2} fillOpacity={0.5} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="text-[9px] text-[#A8A49C] mt-2">
            Fuente datos: Centros_Acopio_v2.xlsx · Recicladoras_por_Giro.xlsx. Los valores son estimaciones del modelo — deben validarse con la tesorería municipal antes de compromisos presupuestales.
          </p>
        </div>
      </ExpandableChart>
    </div>
  )
}

// ── Page 5 — CAPEX · OPEX · TIR · Derrama Económica ─────────────────────────

function Page5() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-semibold mb-1">Página 5 de 5</p>
        <h3 className="font-serif text-[20px] text-[#1C1B18] leading-tight">
          CAPEX · OPEX · TIR · ROI · VAR y Derrama Económica
        </h3>
        <p className="text-[11px] text-[#6B6760] mt-1">
          Centros de acopio y recicladoras por giro · Sistema integrado por fase de escalamiento
        </p>
        <p className="text-[10px] text-[#A8A49C] mt-0.5">
          Datos verificados desde modelos financieros CFO. Precios referencia: mar 2026 (ANIPAC / CEMPRE México). Salarios: IMSS Rama 37, 2025.
        </p>
      </div>

      {/* Sección 1 — Tablas CAPEX/OPEX/TIR restauradas */}
      <CapexOpexBreakdown />

      {/* Separador */}
      <div className="border-t border-[#E8E4DC] pt-6">
        <h4 className="font-serif text-[17px] text-[#1C1B18] mb-1">Derrama Económica del Sistema</h4>
        <p className="text-[11px] text-[#6B6760] mb-4">
          Proyección de creación de empleo, inversión acumulada y ahorros al municipio por fase de despliegue.
        </p>
        <DerramaEconomicaChart />
      </div>
    </div>
  )
}

// ── PageNavFooter ─────────────────────────────────────────────────────────────

function PageNavFooter({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const labels = [
    'Infraestructura y capacidad',
    'Flujos y cierre de ciclo',
    'Logística y operación',
    'Habilitadores y costos',
    'CAPEX · OPEX · TIR · Derrama',
  ]
  const TOTAL = labels.length
  return (
    <div className="mt-8 pt-5 border-t border-[#E8E4DC] flex items-center justify-between gap-2 flex-wrap">
      <div className="flex gap-2">
        {page > 1 && (
          <button type="button" onClick={() => setPage(page - 1)}
            className="px-4 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] font-medium text-[#6B6760] hover:bg-[#F4F2ED] transition-colors">
            ← {labels[page - 2]}
          </button>
        )}
        {page < TOTAL && (
          <button type="button" onClick={() => setPage(page + 1)}
            className="px-4 py-2 rounded-[8px] bg-[#3B6D11] border border-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D] transition-colors">
            {labels[page]} →
          </button>
        )}
        {page === TOTAL && (
          <button type="button" className="px-4 py-2 rounded-[8px] bg-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D] transition-colors">
            Módulo 5 →
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" className="px-3 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED]">Exportar PDF</button>
        <button type="button" className="px-3 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED]">Guardar vista</button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function InfrastructureOperationsStack() {
  const { zmActiva, horizonte, presetTrayectoria, resultados, mixCAs, seleccionMunicipioCatalog } = useSimulatorStore()

  const [page, setPage] = useState(1)

  const trayectoria = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)?.label ?? presetTrayectoria
  const municipio   = seleccionMunicipioCatalog?.nombre ?? zmActiva

  // Dynamic tables — no hardcoded SLP/QRO references
  const centersTable = useMemo(() => generateCentersTable(mixCAs), [mixCAs])
  const perRoutes    = useMemo(() => generatePERRoutes(zmActiva.slice(0, 3).toUpperCase()), [zmActiva])
  const rsuDia      = resultados?.rsuTotalTonDia ?? 379.3

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

  const PAGE_TABS = [
    'Infraestructura y capacidad',
    'Flujos y cierre de ciclo',
    'Logística y operación',
    'Habilitadores y costos',
    'CAPEX · OPEX · TIR · Derrama',
  ]

  return (
    <div className="pb-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PAGE_TABS.map((label, i) => {
          const p = i + 1
          return (
            <button key={p} type="button" onClick={() => setPage(p)}
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

      {/* 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div>
          <DecisionCommitBar
            municipio={municipio} horizonte={horizonte}
            trayectoria={trayectoria} rsuDia={rsuDia}
            compact={page > 1}
          />
          <InfrastructureKpiRow
            rsuDia={rsuDia} capInstalada={capInstalada} brecha={brecha}
            empleos={empleos} centrosObj={targetCA} cobertura={cobertura}
          />
          {page === 1 && <Page1 rsuDia={rsuDia} capInstalada={capInstalada} brecha={brecha} centros={targetCA} centersTable={centersTable} />}
          {page === 2 && <Page2 rsuDia={rsuDia} />}
          {page === 3 && <Page3 rsuDia={rsuDia} perRoutes={perRoutes} />}
          {page === 4 && <Page4 />}
          {page === 5 && <Page5 />}
          <PageNavFooter page={page} setPage={setPage} />
        </div>
        <RightRail page={page} />
      </div>
    </div>
  )
}
