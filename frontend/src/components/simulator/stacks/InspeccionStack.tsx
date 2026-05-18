'use client'

import { useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Camera, FolderOpen, AlertTriangle, CheckCircle, Clock, Shield } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { InspeccionForm } from '@/components/simulator/InspeccionForm'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

type CheckItem = { label: string; done: boolean }

// ── Completeness gauge data ───────────────────────────────────────────────────

const COMPLETITUD_INIT = [
  { name: 'Completo',   value: 72, color: '#3B6D11' },
  { name: 'Parcial',    value: 18, color: '#D4881E' },
  { name: 'Pendiente',  value: 10, color: '#E8E4DC' },
]

const CHECKLIST_INIT: CheckItem[] = [
  { label: 'Predio identificado',      done: true  },
  { label: 'Coordenadas registradas',  done: true  },
  { label: 'Evidencia fotográfica',    done: true  },
  { label: 'Descripción del hallazgo', done: true  },
  { label: 'Artículo aplicable',       done: false },
  { label: 'Validación jurídica',      done: false },
]

// ── KPI static data ───────────────────────────────────────────────────────────

const KPIS = [
  { icon: FolderOpen,    label: 'Inspecciones abiertas',   value: '28',       sub: '5 en campo hoy',       color: '#1A5FA8' },
  { icon: Camera,        label: 'Evidencias cargadas',     value: '126',      sub: '+16 esta semana',       color: '#3B6D11' },
  { icon: AlertTriangle, label: 'Infracciones detectadas', value: '34',       sub: '12 con reincidencia',   color: '#C0392B' },
  { icon: FolderOpen,    label: 'Expedientes generados',   value: '21',       sub: '8 en revisión',         color: '#D4881E' },
  { icon: Shield,        label: 'Estado operativo',        value: 'Óptimo',   sub: 'Sin incidencias',       color: '#3B6D11' },
]

// ── EstadoExpediente panel ────────────────────────────────────────────────────

function EstadoExpediente() {
  const { municipiosActivos, seleccionMunicipioCatalog } = useSimulatorStore()
  const municipio = seleccionMunicipioCatalog?.nombre ?? municipiosActivos[0] ?? 'Sin municipio'

  const today = new Date()
  const dateStr = today.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
  const folio = `EXP-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-00001`

  const rows = [
    { label: 'Folio',                value: folio,        mono: true  },
    { label: 'Fecha y hora',         value: `${dateStr} · 10:35 a.m.`, mono: false },
    { label: 'Inspector responsable', value: 'Inspector activo',        mono: false },
    { label: 'Municipio',            value: municipio,    mono: false  },
    { label: 'Estatus',              value: 'Borrador',   badge: 'yellow' },
    { label: 'Evidencia mínima',     value: 'Cumplida (8/8)', badge: 'green' },
    { label: 'Validación jurídica',  value: 'Pendiente',  badge: 'gray' },
  ]

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Estado del expediente</p>
      <div className="space-y-2">
        {rows.map(row => (
          <div key={row.label} className="flex items-start justify-between gap-2">
            <span className="text-[10px] text-[#A8A49C] shrink-0">{row.label}</span>
            {'badge' in row && row.badge ? (
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                row.badge === 'green'  ? 'bg-[#EAF3DE] text-[#23470A]' :
                row.badge === 'yellow' ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                         'bg-[#F4F2ED] text-[#6B6760]',
              )}>
                {row.value}
              </span>
            ) : (
              <span className={cn('text-[10px] text-right text-[#1C1B18] font-medium', 'mono' in row && row.mono ? 'font-mono text-[9px]' : '')}>
                {row.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Completitud donut ─────────────────────────────────────────────────────────

function IndiceCompletitud({ checklist }: { checklist: CheckItem[] }) {
  const doneCount = checklist.filter(c => c.done).length
  const pct = Math.round((doneCount / checklist.length) * 100)

  const data = [
    { name: 'Completo',  value: pct,       color: '#3B6D11' },
    { name: 'Pendiente', value: 100 - pct, color: '#E8E4DC' },
  ]

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Índice de completitud</p>
      <div className="flex items-center gap-3 mb-3">
        <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={24} outerRadius={34} dataKey="value" strokeWidth={2} stroke="#fff">
                {data.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="font-mono text-[16px] font-bold text-[#3B6D11]">{pct}%</p>
          </div>
        </div>
        <div className="space-y-1.5 text-[10px]">
          {COMPLETITUD_INIT.map(item => (
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

// ── Checklist ─────────────────────────────────────────────────────────────────

function ChecklistMinimo({ items, onToggle }: { items: CheckItem[]; onToggle: (i: number) => void }) {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Checklist mínimo del expediente</p>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        {items.map((item, i) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onToggle(i)}
            className="flex items-center gap-1.5 text-left"
          >
            {item.done ? (
              <CheckCircle className="w-3.5 h-3.5 text-[#3B6D11] shrink-0" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-[#D4881E] shrink-0" />
            )}
            <span className={cn('text-[10px]', item.done ? 'text-[#3B5F23]' : 'text-[#A8A49C]')}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function InspeccionStack() {
  const [checklist, setChecklist] = useState<CheckItem[]>(CHECKLIST_INIT)

  function toggleCheck(i: number) {
    setChecklist(prev => prev.map((item, idx) => idx === i ? { ...item, done: !item.done } : item))
  }

  return (
    <div className="space-y-4 pb-6">

      {/* ── KPI strip ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {KPIS.map(({ icon: Icon, label, value, sub, color }) => (
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

      {/* ── Title ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-serif text-[22px] text-[#1C1B18]">Inspección de predios / estrategia administrativa</h2>
        <p className="text-[12px] text-[#6B6760]">Registro operativo para documentar infracciones, evidencia y acción administrativa.</p>
      </div>

      {/* ── Main layout: form + right sidebar ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4">

        {/* Form */}
        <div>
          <InspeccionForm />
        </div>

        {/* Right sidebar */}
        <div className="space-y-3 lg:mt-0">
          <EstadoExpediente />
          <IndiceCompletitud checklist={checklist} />
          <ChecklistMinimo items={checklist} onToggle={toggleCheck} />

          {/* Legal disclaimer */}
          <div className="rounded-[10px] border border-[#F5D98A] bg-[#FEF7E7] p-3 text-[10px] text-[#6B4800]">
            <p className="font-semibold mb-1">⚠ Nota importante</p>
            <p className="leading-relaxed">El expediente debe someterse al derecho de audiencia del presunto infractor antes de cualquier sanción. La validación jurídica es obligatoria.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
