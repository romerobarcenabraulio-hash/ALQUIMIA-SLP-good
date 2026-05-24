'use client'

import { useCallback, useEffect, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import {
  Camera, FolderOpen, AlertTriangle, CheckCircle, Clock,
  Shield, ChevronDown, MapPin, Wifi,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { InspeccionForm } from '@/components/simulator/InspeccionForm'
import { EXPEDIENTE_PDF_EVENT } from '@/components/simulator/ExpedientePDF'
import { getApiUrl } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  inspecciones_abiertas: number | null
  evidencias_cargadas:   number | null
  infracciones_detectadas: number | null
  expedientes_generados: number | null
  estado_operativo: string | null
  gps_precision_m: number | null
}

type CheckState = 'cumplido' | 'parcial' | 'pendiente' | 'no_aplica'

interface CheckItem {
  label: string
  estado: CheckState
  obligatorio: boolean
}

// ── RailSection ───────────────────────────────────────────────────────────────

function RailSection({ title, children, open: defaultOpen = false }: {
  title: string; children: React.ReactNode; open?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 text-left">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760] font-bold">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760] space-y-1.5">{children}</div>}
    </div>
  )
}

// ── EstadoExpediente ──────────────────────────────────────────────────────────
// All dynamic values; folio comes from backend only — never invented in frontend.

function EstadoExpediente({
  folioBackend, municipio, inspector, estatus, evidenciaMin, validJuridica,
}: {
  folioBackend: string | null
  municipio: string
  inspector: string | null
  estatus: string
  evidenciaMin: string
  validJuridica: string
}) {
  const ahora = new Date()
  const fechaStr = ahora.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const horaStr  = ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  function badgeFor(val: string) {
    if (val === 'Validado' || val === 'Cumplida') return 'green'
    if (val === 'Pendiente' || val === 'Borrador') return 'yellow'
    if (val === 'Rechazado') return 'red'
    return 'gray'
  }

  const rows: Array<{ label: string; value: string; mono?: boolean; badge?: string }> = [
    { label: 'Folio',                value: folioBackend ?? 'Pendiente — lo genera el backend', mono: true },
    { label: 'Fecha y hora',         value: `${fechaStr} · ${horaStr}` },
    { label: 'Inspector responsable',value: inspector ?? 'Sin asignar' },
    { label: 'Municipio',            value: municipio },
    { label: 'Estatus',              value: estatus,       badge: badgeFor(estatus) },
    { label: 'Evidencia mínima',     value: evidenciaMin,  badge: badgeFor(evidenciaMin) },
    { label: 'Validación jurídica',  value: validJuridica, badge: badgeFor(validJuridica) },
    { label: 'Última actualización', value: `${fechaStr} · ${horaStr}` },
  ]

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Estado del expediente</p>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex items-start justify-between gap-2">
            <span className="text-[10px] text-[#A8A49C] shrink-0">{row.label}</span>
            {row.badge ? (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium text-right',
                row.badge === 'green' ? 'bg-[#EAF3DE] text-[#23470A]' :
                row.badge === 'yellow' ? 'bg-[#FEF7E7] text-[#6B4800]' :
                row.badge === 'red' ? 'bg-[#FDE8E8] text-[#B91C1C]' :
                'bg-[#F4F2ED] text-[#6B6760]',
              )}>{row.value}</span>
            ) : (
              <span className={cn(
                'text-[10px] text-right text-[#1C1B18] font-medium break-all',
                row.mono ? 'font-mono text-[9px]' : '',
              )}>{row.value}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── IndiceCompletitud ─────────────────────────────────────────────────────────
// Derived from real checklist state — never hardcoded.

function IndiceCompletitud({ items }: { items: CheckItem[] }) {
  const cumplido  = items.filter(i => i.estado === 'cumplido').length
  const parcial   = items.filter(i => i.estado === 'parcial').length
  const pendiente = items.filter(i => i.estado === 'pendiente').length
  const total     = items.length

  const pctCumplido  = Math.round((cumplido  / total) * 100)
  const pctParcial   = Math.round((parcial   / total) * 100)
  const pctPendiente = Math.round((pendiente / total) * 100)

  const donutData = [
    { name: 'Completo',   value: pctCumplido,  color: '#3B6D11' },
    { name: 'Parcial',    value: pctParcial,   color: '#D4881E' },
    { name: 'Pendiente',  value: pctPendiente, color: '#E8E4DC' },
  ].filter(d => d.value > 0)

  const pct = pctCumplido

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Índice de completitud</p>
      <div className="flex items-center gap-3 mb-2">
        <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={donutData.length ? donutData : [{ name: 'Pendiente', value: 100, color: '#E8E4DC' }]}
                cx="50%" cy="50%" innerRadius={24} outerRadius={34} dataKey="value" strokeWidth={2} stroke="#fff">
                {(donutData.length ? donutData : [{ color: '#E8E4DC' }]).map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-[15px] font-bold text-[#3B6D11]">{pct}%</p>
          </div>
        </div>
        <div className="space-y-1.5 text-[10px]">
          {[
            { name: 'Completo',   value: pctCumplido,  color: '#3B6D11' },
            { name: 'Parcial',    value: pctParcial,   color: '#D4881E' },
            { name: 'Pendiente',  value: pctPendiente, color: '#E8E4DC' },
          ].map(item => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
              <span className="text-[#4A4740]">{item.name}</span>
              <span className="ml-auto font-mono font-medium" style={{ color: item.color }}>{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── ChecklistMinimo ───────────────────────────────────────────────────────────

function ChecklistMinimo({
  items,
  onCycle,
}: {
  items: CheckItem[]
  onCycle: (i: number) => void
}) {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Checklist mínimo del expediente</p>
      <div className="space-y-1.5">
        {items.map((item, i) => {
          const icon = item.estado === 'cumplido'
            ? <CheckCircle className="w-3.5 h-3.5 text-[#3B6D11] shrink-0" />
            : item.estado === 'parcial'
            ? <Clock className="w-3.5 h-3.5 text-[#D4881E] shrink-0" />
            : <MapPin className="w-3.5 h-3.5 text-[#A8A49C] shrink-0" />
          const textColor = item.estado === 'cumplido' ? 'text-[#3B5F23]'
            : item.estado === 'parcial' ? 'text-[#92400E]'
            : 'text-[#A8A49C]'
          return (
            <button key={item.label} type="button" onClick={() => onCycle(i)}
              className="w-full flex items-center gap-1.5 text-left hover:bg-[#FAFAF8] rounded-[6px] px-1 py-0.5 transition-colors">
              {icon}
              <span className={cn('text-[10px] flex-1', textColor)}>{item.label}</span>
              {item.obligatorio && <span className="text-[7px] text-[#C0392B] font-bold uppercase">Req.</span>}
            </button>
          )
        })}
      </div>
      <p className="text-[8px] text-[#A8A49C] mt-2 px-1">Toca para marcar progreso · Req. = obligatorio para enviar</p>
    </div>
  )
}

// ── RightEditorialRail ────────────────────────────────────────────────────────

function RightEditorialRail({ confidence }: { confidence: number }) {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Consideraciones</p>
        <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded',
          confidence >= 70 ? 'bg-[#EAF3DE] text-[#2D5A0D]' : confidence >= 50 ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#F4F2ED] text-[#6B6760]'
        )}>Nivel de confianza: {confidence >= 70 ? 'Alto' : confidence >= 50 ? 'Medio' : 'Bajo'}</span>
      </div>

      <RailSection title="Cómo se calcula" open>
        <p>El semáforo cruza situación observada, evidencia disponible, reglamento cargado en Módulo 2 y estatus del expediente.</p>
      </RailSection>
      <RailSection title="Consideraciones">
        <p>La inspección no sanciona por sí sola. Documenta evidencia, ordena el expediente y lo envía a revisión de la autoridad competente.</p>
      </RailSection>
      <RailSection title="Contexto del módulo">
        <p>La inspección debe empezar como evidencia ordenada: predio, situación observada, actor, fecha, hallazgo y acción siguiente.</p>
      </RailSection>
      <RailSection title="Observamos">
        <p>Una inspección útil no castiga por intuición; documenta hechos, distingue educación de visita técnica y deja trazabilidad para revisión municipal.</p>
      </RailSection>
      <RailSection title="Decisión que habilita">
        <p>Decidir qué casos ameritan educación, seguimiento, regularización administrativa o escalamiento a revisión competente.</p>
      </RailSection>
      <RailSection title="Qué verificar aún">
        <ul className="space-y-1">
          {['Completar evidencia mínima y validar el tratamiento administrativo con el área competente del municipio.',
            'Confirmar artículo del reglamento con equipo jurídico antes de generar expediente.',
            'Verificar coordenadas GPS si fueron editadas manualmente.',
          ].map(v => (
            <li key={v} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#D4881E] shrink-0" />{v}</li>
          ))}
        </ul>
      </RailSection>
      <RailSection title="Metodología">
        <p>El semáforo cruza situación observada, evidencia disponible, reglamento cargado en Módulo 2 y estatus del expediente.</p>
      </RailSection>
      <RailSection title="Condiciones de lectura">
        <p className="text-[9px] text-[#A8A49C]">Este módulo no equivale a determinación final, cobro, clausura ni acto definitivo. Todo hallazgo es orientativo hasta que sea validado por la autoridad competente.</p>
      </RailSection>
      <RailSection title="Nivel de confianza">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{
              width: `${confidence}%`,
              background: confidence >= 70 ? '#3B6D11' : confidence >= 50 ? '#D4881E' : '#A8A49C',
            }} />
          </div>
          <span className={cn('font-bold text-[11px]',
            confidence >= 70 ? 'text-[#3B6D11]' : confidence >= 50 ? 'text-[#D4881E]' : 'text-[#A8A49C]'
          )}>{confidence}%</span>
        </div>
        <p className="text-[9px] text-[#A8A49C]">Depende de completitud del expediente, evidencia, GPS, validación jurídica y datos municipales.</p>
      </RailSection>
    </div>
  )
}

// ── InspectionStepProgress ────────────────────────────────────────────────────

type StepState = 'pendiente' | 'en_progreso' | 'completado' | 'requiere_validacion'

interface Step {
  n: number; label: string; desc: string; state: StepState
}

function InspectionStepProgress({ steps }: { steps: Step[] }) {
  const stateColor = (s: StepState) =>
    s === 'completado'           ? 'bg-[#3B6D11] text-white border-[#3B6D11]' :
    s === 'en_progreso'          ? 'bg-[#1A5FA8] text-white border-[#1A5FA8]' :
    s === 'requiere_validacion'  ? 'bg-[#D4881E] text-white border-[#D4881E]' :
    'bg-[#E8E4DC] text-[#A8A49C] border-[#E8E4DC]'

  const cardColor = (s: StepState) =>
    s === 'completado'           ? 'border-[#D7E8C0] bg-[#F4FAEC]' :
    s === 'en_progreso'          ? 'border-[#BDD7F5] bg-[#EBF3FB]' :
    s === 'requiere_validacion'  ? 'border-[#FDE68A] bg-[#FEF7E7]' :
    'border-[#E8E4DC] bg-[#FAFAF8]'

  const stateLabel = (s: StepState) =>
    s === 'completado' ? 'Completado' : s === 'en_progreso' ? 'En progreso' :
    s === 'requiere_validacion' ? 'Req. validación' : 'Pendiente'

  return (
    <div className="grid grid-cols-5 gap-1.5">
      {steps.map((s, idx) => (
        <div key={s.n} className={cn('rounded-[8px] border p-2.5 text-center relative', cardColor(s.state))}>
          {idx < steps.length - 1 && (
            <div className="absolute right-[-7px] top-1/2 -translate-y-1/2 z-10 text-[#A8A49C] text-[8px] font-bold hidden sm:block">›</div>
          )}
          <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mx-auto mb-1 border', stateColor(s.state))}>{s.n}</div>
          <p className="text-[9px] font-semibold text-[#1C1B18] leading-snug">{s.label}</p>
          <p className="text-[7px] text-[#A8A49C] mt-0.5 leading-tight hidden sm:block">{s.desc}</p>
          <p className={cn('text-[7px] font-bold mt-0.5',
            s.state === 'completado' ? 'text-[#3B6D11]' :
            s.state === 'en_progreso' ? 'text-[#1A5FA8]' :
            s.state === 'requiere_validacion' ? 'text-[#D4881E]' : 'text-[#A8A49C]'
          )}>{stateLabel(s.state)}</p>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const CHECKLIST_INIT: CheckItem[] = [
  { label: 'Predio identificado',              estado: 'pendiente', obligatorio: true  },
  { label: 'Coordenadas registradas',          estado: 'pendiente', obligatorio: false },
  { label: 'Evidencia fotográfica',            estado: 'pendiente', obligatorio: true  },
  { label: 'Descripción del hallazgo',         estado: 'pendiente', obligatorio: true  },
  { label: 'Tipo de infracción seleccionado',  estado: 'pendiente', obligatorio: true  },
  { label: 'Inspector asignado',               estado: 'pendiente', obligatorio: true  },
  { label: 'Fecha y hora registrada',          estado: 'pendiente', obligatorio: true  },
  { label: 'Artículo aplicable o pendiente',   estado: 'pendiente', obligatorio: false },
  { label: 'Validación jurídica',              estado: 'pendiente', obligatorio: false },
  { label: 'PDF generado',                     estado: 'pendiente', obligatorio: false },
]

const STATES: CheckState[] = ['pendiente', 'parcial', 'cumplido', 'no_aplica']

export function InspeccionStack() {
  const { seleccionMunicipioCatalog, municipiosActivos } = useSimulatorStore()
  const municipio = seleccionMunicipioCatalog?.nombre ?? municipiosActivos[0] ?? 'Sin municipio seleccionado'

  // Checklist state — inspector marks manually as they fill the form
  const [checklist, setChecklist] = useState<CheckItem[]>(CHECKLIST_INIT)

  // KPIs from backend — never hardcoded; show null until loaded
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  // Expedition metadata from backend
  const [folioBackend] = useState<string | null>(null) // set when backend returns folio
  const [inspector]    = useState<string | null>(null)  // from session/auth
  const [estatus]      = useState('Borrador')
  const [gpsActivo]    = useState<boolean | null>(null) // browser GPS state

  // Cycle checklist item through states
  const cycleCheck = useCallback((idx: number) => {
    setChecklist(prev => prev.map((item, i) => {
      if (i !== idx) return item
      const cur = STATES.indexOf(item.estado)
      return { ...item, estado: STATES[(cur + 1) % STATES.length] }
    }))
  }, [])

  // Attempt to load dashboard stats from backend
  useEffect(() => {
    const municipioId = seleccionMunicipioCatalog?.claveInegi ?? municipiosActivos[0]
    if (!municipioId) { setStatsLoading(false); return }

    let cancelled = false
    ;(async () => {
      try {
        const url = `${getApiUrl()}/predios/dashboard/stats?municipio_id=${encodeURIComponent(municipioId)}`
        const res = await fetch(url, withRequestId({ method: 'GET' }))
        if (!cancelled && res.ok) {
          const data = await res.json() as DashboardStats
          setStats(data)
        }
      } catch {
        // Backend not available — stats stay null; UI shows "—"
      } finally {
        if (!cancelled) setStatsLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [seleccionMunicipioCatalog, municipiosActivos])

  // Derive completeness from checklist
  const cumplidos   = checklist.filter(c => c.estado === 'cumplido').length
  const obligPend   = checklist.filter(c => c.obligatorio && c.estado === 'pendiente').length
  const canSubmit   = obligPend === 0
  const confidence  = Math.round((cumplidos / checklist.length) * 100)

  // Step states derived from checklist
  const predioOk    = checklist[0]?.estado === 'cumplido'
  const registroOk  = checklist[3]?.estado === 'cumplido' && checklist[4]?.estado === 'cumplido'
  const evidenciaOk = checklist[2]?.estado === 'cumplido'
  const sancionOk   = checklist[7]?.estado === 'cumplido' || checklist[7]?.estado === 'parcial'
  const expOk       = checklist[8]?.estado === 'cumplido'

  const steps: Step[] = [
    { n: 1, label: 'Identificación', desc: 'Predio · dirección · GPS',        state: predioOk ? 'completado' : 'en_progreso' },
    { n: 2, label: 'Registro',       desc: 'Hallazgo · tipo · inspector',     state: registroOk ? 'completado' : predioOk ? 'en_progreso' : 'pendiente' },
    { n: 3, label: 'Evidencia',      desc: 'Fotos · docs · ubicación',        state: evidenciaOk ? 'completado' : 'pendiente' },
    { n: 4, label: 'Sanción',        desc: 'Escala · UMA · artículo',         state: sancionOk ? 'requiere_validacion' : 'pendiente' },
    { n: 5, label: 'Expediente',     desc: 'Folio · revisión jurídica · PDF', state: expOk ? 'completado' : 'pendiente' },
  ]

  // KPI display helper — never shows hardcoded values
  function kpiVal(v: number | null | undefined): string {
    if (statsLoading) return '…'
    if (v === null || v === undefined) return '—'
    return v.toLocaleString('es-MX')
  }

  const kpis = [
    { icon: FolderOpen,    label: 'Inspecciones abiertas',   value: kpiVal(stats?.inspecciones_abiertas),   sub: 'En campo — datos del sistema',    color: '#1A5FA8' },
    { icon: Camera,        label: 'Evidencias cargadas',     value: kpiVal(stats?.evidencias_cargadas),     sub: 'Cargadas en el sistema',           color: '#3B6D11' },
    { icon: AlertTriangle, label: 'Infracciones detectadas', value: kpiVal(stats?.infracciones_detectadas), sub: 'Registradas por inspector',        color: '#C0392B' },
    { icon: FolderOpen,    label: 'Expedientes generados',   value: kpiVal(stats?.expedientes_generados),   sub: 'Generados con folio backend',      color: '#D4881E' },
    { icon: Shield,        label: 'Estado operativo',        value: stats?.estado_operativo ?? (statsLoading ? '…' : 'Sin datos'), sub: 'Estado del sistema de inspección', color: '#3B6D11' },
    { icon: Wifi,          label: 'GPS / precisión',         value: stats?.gps_precision_m != null ? `±${stats.gps_precision_m}m` : gpsActivo === null ? '—' : gpsActivo ? 'Activo' : 'Inactivo',
      sub: 'Precisión del dispositivo', color: '#1A5FA8' },
  ]

  return (
    <div className="space-y-4 pb-6" id="m07-inspeccion-module">

      {/* ── KPI strip — all values from backend ─────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {kpis.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none">{label}</p>
            </div>
            <p className="font-mono text-[16px] font-semibold leading-tight" style={{ color }}>{value}</p>
            <p className="text-[9px] text-[#A8A49C] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {!stats && !statsLoading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-2.5 text-[10px] text-[#A8A49C] flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-[#D4881E] shrink-0" />
          KPIs del sistema no disponibles — el backend de estadísticas no respondió. Los valores mostrados como "—" son correctos; no se usan datos inventados.
        </div>
      )}

      {/* ── Module header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-semibold mb-1">Módulo 7 · Inspección de predios / estrategia administrativa</p>
          <h2 className="font-serif text-[22px] text-[#1C1B18] leading-tight">
            Inspección y predios: evidencia ordenada antes de la acción
          </h2>
          <p className="text-[12px] text-[#6B6760] mt-1">
            El predio que elegiste: ¿sirve o no? La evidencia ordenada antes de actuar.
          </p>
          <p className="text-[10px] text-[#A8A49C] mt-1">
            La inspección no sanciona por sí sola. Documenta evidencia, ordena el expediente y lo envía a revisión de la autoridad competente.
          </p>
        </div>
        <div className={cn(
          'flex items-center gap-2 rounded-[8px] border px-3 py-2',
          gpsActivo ? 'border-[#D7E8C0] bg-[#F4FAEC]' : 'border-[#E8E4DC] bg-[#FAFAF8]',
        )}>
          <div className={cn('w-2 h-2 rounded-full', gpsActivo ? 'bg-[#3B6D11] animate-pulse' : 'bg-[#A8A49C]')} />
          <div>
            <p className="text-[10px] font-semibold text-[#1A4200]">{gpsActivo === null ? 'GPS — sin datos' : gpsActivo ? 'GPS activo' : 'GPS inactivo'}</p>
            <p className="text-[9px] text-[#5A6347]">
              {stats?.gps_precision_m != null ? `Precisión ±${stats.gps_precision_m}m · EPSG:4326` : 'Precisión: sin datos del sistema'}
            </p>
          </div>
        </div>
      </div>

      {/* ── 5-step progress ────────────────────────────────────────────── */}
      <InspectionStepProgress steps={steps} />

      {/* ── Main layout: form + right column ───────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4 items-start">

        {/* Left: InspeccionForm (handles all API calls + form logic) */}
        <div>
          <InspeccionForm />
        </div>

        {/* Right: status, completeness, checklist, legal, rail */}
        <div className="space-y-3">
          <EstadoExpediente
            folioBackend={folioBackend}
            municipio={municipio}
            inspector={inspector}
            estatus={estatus}
            evidenciaMin={evidenciaOk ? 'Cumplida' : 'Pendiente'}
            validJuridica={checklist[8]?.estado === 'cumplido' ? 'Validado' : 'Pendiente'}
          />

          <IndiceCompletitud items={checklist} />

          <ChecklistMinimo items={checklist} onCycle={cycleCheck} />

          {/* Legal disclaimer */}
          <div className="rounded-[10px] border border-[#F5D98A] bg-[#FEF7E7] p-3 text-[10px] text-[#6B4800]">
            <p className="font-semibold mb-1">Nota legal obligatoria</p>
            <p className="leading-relaxed">
              El expediente debe someterse al derecho de audiencia del presunto infractor antes de cualquier sanción.
              La validación jurídica es obligatoria. Ningún dato en esta pantalla implica sanción definitiva.
            </p>
          </div>

          {/* Right editorial rail */}
          <RightEditorialRail confidence={confidence} />
        </div>
      </div>

      {/* ── Bottom action bar ──────────────────────────────────────────── */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {([
            { label: 'Guardar borrador',   sub: 'Guardar sin enviar',          color: '#3B6D11', bg: 'bg-[#EAF3DE] border-[#D7E8C0]', disabled: false },
            { label: 'Adjuntar evidencia', sub: 'Fotos, documentos, videos',   color: '#1A5FA8', bg: 'bg-[#EBF3FB] border-[#B0D0F5]', disabled: false },
            { label: 'Enviar expediente',  sub: 'Enviar a validación jurídica', color: canSubmit ? '#D4881E' : '#A8A49C', bg: canSubmit ? 'bg-[#FEF7E7] border-[#F5D98A]' : 'bg-[#F4F2ED] border-[#E8E4DC]', disabled: !canSubmit },
            { label: 'Generar PDF',        sub: 'Descargar acta de inspección', color: '#5A4A2A', bg: 'bg-[#F4F2ED] border-[#E8E4DC]', disabled: false },
          ] as const).map(btn => (
            <button
              key={btn.label}
              type="button"
              disabled={btn.disabled}
              onClick={
                btn.label === 'Generar PDF'
                  ? () => {
                      const target = document.getElementById('inspeccion-expediente-pdf')
                      if (target) {
                        window.dispatchEvent(new CustomEvent(EXPEDIENTE_PDF_EVENT))
                      } else {
                        document.getElementById('inspeccion-form-generar')?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'center',
                        })
                      }
                    }
                  : undefined
              }
              className={cn(
                'flex flex-col items-center gap-1 rounded-[10px] border px-3 py-3 text-center transition-shadow hover:shadow-sm',
                btn.bg,
                btn.disabled && 'opacity-40 cursor-not-allowed',
              )}
            >
              <p className="text-[11px] font-semibold" style={{ color: btn.color }}>{btn.label}</p>
              <p className="text-[9px] text-[#6B6760]">{btn.sub}</p>
            </button>
          ))}
        </div>
        {!canSubmit && (
          <p className="text-[9px] text-[#C0392B] mt-2 text-center">
            Expediente incompleto — completa los campos obligatorios (marcados Req.) antes de enviar a validación.
          </p>
        )}
      </div>
    </div>
  )
}
