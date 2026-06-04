'use client'

/**
 * JourneyPanel — validates → plans → executes → monitors.
 *
 * Shows the current stage of a tenant's institutional journey,
 * gates required per stage, and progress through the workflow.
 *
 * Reads tenant state from /api/admin/tenants/{id} and gate data
 * from the same endpoint. Admins can close gates; municipal staff see read-only.
 */

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Clock, XCircle, ChevronRight, Lock } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { getTokenPayload } from '@/lib/authSession'

// ─── Stage definitions ────────────────────────────────────────────────────────

export type JourneyStage = 'validation' | 'planning' | 'execution' | 'monitoring'

interface StageDef {
  id: JourneyStage
  label: string
  tagline: string
  color: string
  gates: GateDef[]
}

interface GateDef {
  id: string          // G1–G5
  label: string
  description: string
  stage: JourneyStage
}

const GATE_DEFS: GateDef[] = [
  {
    id: 'G1',
    label: 'Datos base verificados',
    description: 'Población, generación per cápita y composición RSU declarados con fuente oficial.',
    stage: 'validation',
  },
  {
    id: 'G2',
    label: 'Marco legal analizado',
    description: 'Reglamento de limpia vigente subido y diagnóstico jurídico completado.',
    stage: 'validation',
  },
  {
    id: 'G3',
    label: 'Escenario financiero aprobado',
    description: 'Al menos un escenario de simulación guardado y revisado por director.',
    stage: 'planning',
  },
  {
    id: 'G4',
    label: 'Plan Maestro generado',
    description: 'Propuesta de implementación exportada y aprobada por cabildo.',
    stage: 'planning',
  },
  {
    id: 'G5',
    label: 'Monitoreo activado',
    description: 'Primeros indicadores operativos registrados y ciclo ESG iniciado.',
    stage: 'execution',
  },
]

const STAGES: StageDef[] = [
  {
    id: 'validation',
    label: 'Validación',
    tagline: 'Línea base, marco legal y propuesta personalizada',
    color: '#3B6D11',
    gates: GATE_DEFS.filter(g => g.stage === 'validation'),
  },
  {
    id: 'planning',
    label: 'Planeación',
    tagline: 'Escenarios financieros, Plan Maestro y cabildo',
    color: '#1C4B8F',
    gates: GATE_DEFS.filter(g => g.stage === 'planning'),
  },
  {
    id: 'execution',
    label: 'Ejecución',
    tagline: 'Implementación piloto y convenios con empresas ancla',
    color: '#7B3F00',
    gates: GATE_DEFS.filter(g => g.stage === 'execution'),
  },
  {
    id: 'monitoring',
    label: 'Monitoreo',
    tagline: 'Reportes ESG trimestrales y actualización continua del ICM',
    color: '#5B21B6',
    gates: [],
  },
]

const STAGE_ORDER: JourneyStage[] = ['validation', 'planning', 'execution', 'monitoring']

// ─── Gate state from API ──────────────────────────────────────────────────────

interface GateState {
  gate_id: string
  status: 'no_iniciado' | 'pendiente' | 'aprobado' | 'rechazado'
  evidencia_label?: string | null
  decisor_humano?: string | null
  closed_at?: string | null
  notas?: string | null
}

function gateIcon(status: GateState['status']) {
  switch (status) {
    case 'aprobado':    return <CheckCircle2 size={16} className="text-[#3B6D11]" />
    case 'pendiente':   return <Clock size={16} className="text-amber-500" />
    case 'rechazado':   return <XCircle size={16} className="text-red-500" />
    default:            return <Circle size={16} className="text-[#C4BFB6]" />
  }
}

function stageIndex(s: JourneyStage): number {
  return STAGE_ORDER.indexOf(s)
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  tenantId: string
}

export function JourneyPanel({ tenantId }: Props) {
  const [currentStage, setCurrentStage] = useState<JourneyStage>('validation')
  const [gates, setGates] = useState<GateState[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<JourneyStage>('validation')

  const payload = getTokenPayload()
  const isAdmin = payload?.rol === 'admin' || payload?.rol === 'analista'

  function authHdr(): HeadersInit {
    const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
    return t ? { Authorization: `Bearer ${t}` } : {}
  }

  useEffect(() => {
    if (!tenantId) { setLoading(false); return }
    fetch(`${getApiUrl()}/api/admin/tenants/${tenantId}`, { headers: authHdr() })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setCurrentStage((data.state?.current_stage ?? 'validation') as JourneyStage)
        setGates(data.gates ?? [])
        setExpanded((data.state?.current_stage ?? 'validation') as JourneyStage)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-4 border-[#3B6D11] border-t-transparent" />
      </div>
    )
  }

  const currentIdx = stageIndex(currentStage)

  return (
    <div className="rounded-xl border border-[#E8E4DC] bg-white overflow-hidden">
      {/* Progress bar */}
      <div className="flex border-b border-[#F0EDE6]">
        {STAGES.map((stage, i) => {
          const idx = stageIndex(stage.id)
          const done = idx < currentIdx
          const active = stage.id === currentStage
          const locked = idx > currentIdx
          return (
            <button
              key={stage.id}
              onClick={() => setExpanded(expanded === stage.id ? currentStage : stage.id)}
              className={`flex flex-1 flex-col items-center gap-0.5 px-2 py-3 text-center transition-colors ${
                active ? 'bg-[#F2FAF0]' : locked ? 'opacity-40' : 'hover:bg-[#FAFAF8]'
              }`}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: done || active ? stage.color : '#D8D1C4' }}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className="text-[11px] font-semibold"
                style={{ color: active ? stage.color : done ? '#6B6760' : '#A8A49C' }}
              >
                {stage.label}
              </span>
              {active && (
                <span className="text-[9px] uppercase tracking-wide text-[#8E8980]">Etapa actual</span>
              )}
              {locked && <Lock size={8} className="text-[#C4BFB6]" />}
            </button>
          )
        })}
      </div>

      {/* Expanded stage detail */}
      {STAGES.map(stage => {
        if (expanded !== stage.id) return null
        const stageGates = stage.gates.map(gd => {
          const state = gates.find(g => g.gate_id === gd.id)
          return { ...gd, state }
        })
        const allApproved = stageGates.every(g => g.state?.status === 'aprobado')
        return (
          <div key={stage.id} className="px-5 py-4">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[#1C1B18]">{stage.label}</p>
                <p className="text-[11px] text-[#6B6760]">{stage.tagline}</p>
              </div>
              {allApproved && stageGates.length > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-[#EAF3DE] px-2 py-0.5 text-[10px] font-semibold text-[#3B6D11]">
                  <CheckCircle2 size={10} />
                  Completo
                </span>
              )}
            </div>

            {stageGates.length === 0 ? (
              <p className="text-[12px] text-[#8E8980] italic">
                {stage.id === 'monitoring'
                  ? 'Monitoreo continuo activo. Reportes ESG trimestrales en curso.'
                  : 'Sin gates configurados para esta etapa.'}
              </p>
            ) : (
              <div className="space-y-2">
                {stageGates.map(g => (
                  <div
                    key={g.id}
                    className="flex items-start gap-3 rounded-lg border border-[#F0EDE6] bg-[#FAFAF8] px-3 py-2.5"
                  >
                    <span className="mt-0.5 shrink-0">
                      {gateIcon(g.state?.status ?? 'no_iniciado')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold text-[#1C1B18]">{g.label}</p>
                      <p className="text-[11px] text-[#6B6760]">{g.description}</p>
                      {g.state?.evidencia_label && (
                        <p className="mt-1 text-[10px] text-[#8E8980]">
                          Evidencia: {g.state.evidencia_label}
                          {g.state.decisor_humano && ` · por ${g.state.decisor_humano}`}
                        </p>
                      )}
                      {g.state?.notas && (
                        <p className="mt-1 text-[10px] text-amber-600">{g.state.notas}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded bg-[#F0EDE6] px-1.5 py-0.5 text-[9px] font-bold text-[#8E8980]">
                      {g.id}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isAdmin && stage.id === currentStage && (
              <div className="mt-3 border-t border-[#F0EDE6] pt-3">
                <p className="text-[10px] uppercase tracking-wide text-[#9E9B96]">
                  Administración de gates disponible en panel de admin
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Compact status chip for header/sidebar ───────────────────────────────────

export function JourneyStageChip({ stage }: { stage: JourneyStage }) {
  const def = STAGES.find(s => s.id === stage)
  if (!def) return null
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold text-white"
      style={{ background: def.color }}
    >
      <ChevronRight size={10} />
      {def.label}
    </span>
  )
}
