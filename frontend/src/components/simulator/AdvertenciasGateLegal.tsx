'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, FileWarning, Info, RefreshCw } from 'lucide-react'
import { evaluateLegalGatedAction } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { LegalGatedActionRequest, LegalGatedActionResponse, LegalGatedActionType } from '@/types'
import { cn } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { FuenteReglamentoIcon } from '@/components/reglamento/FuenteReglamentoIcon'
import { AvisoMunicipioAncla } from '@/components/simulator/AvisoMunicipioAncla'

const ACTIONS: Array<{ key: LegalGatedActionType; label: string; chip: string; chipClass: string }> = [
  {
    key: 'educational_warning',
    label: 'Advertencia educativa',
    chip: 'Educativo · no sanción',
    chipClass: 'bg-[#F8F6F1] text-[#1C1B18] border-[#DAD3C7]',
  },
  {
    key: 'inspection',
    label: 'Inspección',
    chip: 'Inspección · registro',
    chipClass: 'bg-[#F0EDE5] text-[#6B6760] border-[#E8E4DC]',
  },
  {
    key: 'proposed_sanction',
    label: 'Sanción propuesta',
    chip: 'Sanción propuesta · no oficial',
    chipClass: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    key: 'due_process',
    label: 'Debido proceso',
    chip: 'Debido proceso · ruta',
    chipClass: 'bg-[#F0EDE5] text-[#6B6760] border-[#E8E4DC]',
  },
  {
    key: 'definitive_document',
    label: 'Documento definitivo',
    chip: 'Documento definitivo · no emitido por ALQUIMIA',
    chipClass: 'bg-red-50 text-red-900 border-red-200',
  },
]

export function AdvertenciasGateLegal() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const [actionType, setActionType] = useState<LegalGatedActionType>('educational_warning')
  const [zmDemo, setZmDemo] = useState(false)
  const [legalValidadoDemo, setLegalValidadoDemo] = useState(false)
  const [result, setResult] = useState<LegalGatedActionResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const municipio = municipiosActivos[0] ?? 'slp'

  const payload: LegalGatedActionRequest = useMemo(() => ({
    action_type: actionType,
    municipio_id: zmDemo ? 'SLP' : municipio,
    geography_scope: zmDemo ? 'city_zm' : 'municipio',
    route_or_zone_id: 'Z1',
    evidence_ids: ['ev-operativa-1'],
    legal_source_municipio_id: municipio,
    legal_basis_article_id: 'Art. 11',
    waste_scope: 'rsu_municipal',
    legal_validation_status: legalValidadoDemo ? 'validado_externamente' : undefined,
    competent_validation_explicit: false,
  }), [actionType, municipio, zmDemo, legalValidadoDemo])

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    evaluateLegalGatedAction(payload)
      .then(data => {
        if (!cancelled) setResult(data)
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setResult(null)
          setError(err.message)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [payload])

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">S12.4 — Alcance legal educativo</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h2 className="font-serif text-[24px] text-[#1C1B18]">
              Advertencias, inspección y propuestas ·{' '}
              <span className="text-[#6B6760] text-[14px]">simulación propuesta</span>
            </h2>
            <FuenteReglamentoIcon municipioId={municipio} label="Abrir fuente primaria del reglamento aplicable al municipio activo" />
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
            Distingue orientación educativa, inspección, propuesta, ruta de debido proceso y documento oficial. ALQUIMIA analiza y propone; la autoridad competente conserva la emisión y validación formal.
          </p>
          <AvisoMunicipioAncla ids={municipiosActivos} />
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-4">
        {ACTIONS.map(action => (
          <button
            key={action.key}
            type="button"
            onClick={() => setActionType(action.key)}
            className={cn(
              'rounded-[8px] border px-3 py-3 text-left text-[12px]',
              actionType === action.key
                ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]'
                : 'border-[#E8E4DC] bg-white text-[#6B6760]',
            )}
          >
            <p>{action.label}</p>
            <span className={cn('mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', action.chipClass)}>
              {action.chip}
            </span>
          </button>
        ))}
      </div>

      <details className="rounded-[8px] border border-[#E8E4DC] bg-[#FAF8F4] p-3">
        <summary className="cursor-pointer text-[12px] font-semibold text-[#1C1B18]">
          Parámetros de alcance municipal · uso en capacitación
        </summary>
        <p className="mt-2 text-[11px] leading-relaxed text-[#8A857C]">
          Ajustan el alcance geográfico o el estado de revisión legal en la simulación. Son herramientas de estudio y mejora de política pública; no reemplazan criterio de autoridad competente ni un expediente real.
        </p>
        <div className="mt-3 space-y-2">
          <label className="flex items-start gap-2 text-[12px] text-[#6B6760]">
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              checked={zmDemo}
              onChange={event => setZmDemo(event.target.checked)}
            />
            <span>
              Activar caso de estudio: alcance metropolitano tratado como si fuera municipio para mostrar por qué debe separarse por municipio.
            </span>
          </label>
          <label className="flex items-start gap-2 text-[12px] text-[#6B6760]">
            <input
              type="checkbox"
              className="mt-0.5 shrink-0"
              checked={legalValidadoDemo}
              onChange={event => setLegalValidadoDemo(event.target.checked)}
            />
            <span>
              Activar caso de estudio: marco con validación legal externa declarada al revisar sanción propuesta.
            </span>
          </label>
        </div>
      </details>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !result && <EmptyState />}
      {!loading && !error && result?.status === 'blocked' && <BlockedState result={result} />}
      {!loading && !error && result && result.status !== 'blocked' && <ResultState result={result} />}
      {!loading && !error && result && (
        <NarrativeBridge
          variant={result.status === 'blocked' ? 'warning' : 'bridge'}
          audience="functionary"
          kicker="Alcance legal · narrativa"
          summary={`Evaluación ${actionType} en municipio ${municipio} (${zmDemo ? 'alcance metropolitano sintético' : 'ámbito municipio'}). Estado de alcance: ${result.status}.${result.blockers.length ? ` Restricciones activas: ${result.blockers.length}.` : ''} ${result.language_help_text || 'Sin texto auxiliar del servicio.'}`}
          evidence={[
            { label: 'Validación legal', value: String(result.due_process_gate.legal_validation_status) },
            { label: 'Advertencia educativa', value: result.due_process_gate.can_issue_educational_warning ? 'permitida' : 'no' },
            { label: 'Inspección', value: result.due_process_gate.can_register_inspection ? 'permitida' : 'no' },
            { label: 'Sanción propuesta', value: result.due_process_gate.can_propose_sanction ? 'permitida' : 'no' },
          ]}
          nextStep={{
            label: 'Acción institucional recomendada',
            helper: result.next_action,
          }}
        />
      )}
    </section>
  )
}

function LoadingState() {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" />
      Evaluando alcance legal municipal.
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      Selecciona una acción para evaluar educación, inspección o propuesta.
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
      <AlertTriangle className="mr-2 inline h-4 w-4" />
      {message}
    </div>
  )
}

function BlockedState({ result }: { result: LegalGatedActionResponse }) {
  return (
    <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">
        <AlertTriangle className="mr-2 inline h-4 w-4" />
        Alcance restringido por revisión municipal pendiente
      </p>
      {result.blockers.map(blocker => (
        <p key={blocker} className="mt-2 text-[12px] text-amber-800">{blocker}</p>
      ))}
      <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Acción siguiente</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{result.next_action}</p>
      {result.due_process_gate && (
        <GatePanel
          gate={result.due_process_gate}
          blockers={result.blockers}
          className="mt-4"
        />
      )}
    </div>
  )
}

function ResultState({ result }: { result: LegalGatedActionResponse }) {
  return (
    <div className="space-y-4">
      {result.warnings.map(warning => (
        <div key={warning} className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          <AlertTriangle className="mr-2 inline h-4 w-4" />
          {warning}
        </div>
      ))}
      <div className="rounded-[8px] border border-[#DAD3C7] bg-white p-4">
        <p className="text-[12px] font-semibold text-[#1C1B18]">
          <Info className="mr-2 inline h-4 w-4" />
          Lenguaje y alcance
        </p>
        <p className="mt-2 text-[12px] text-[#6B6760]">{result.language_help_text}</p>
        <p className="mt-2 text-[12px] text-[#6B6760]">Alcance: {result.waste_scope} · {result.geography_scope}</p>
      </div>

      {result.educational_warning && (
        <ActionCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          title="Advertencia educativa"
          lines={[
            result.educational_warning.message,
            `Genera multa: ${result.educational_warning.creates_fine ? 'sí' : 'no'}`,
            `Oficialidad: ${result.educational_warning.officiality}`,
            result.educational_warning.next_action,
          ]}
        />
      )}
      {result.inspection && (
        <ActionCard
          icon={<FileWarning className="h-4 w-4" />}
          title="Inspección operativa"
          lines={[
            `Ruta/zona: ${result.inspection.route_or_zone_id}`,
            `Sanción firme: ${result.inspection.creates_firm_sanction ? 'sí' : 'no'}`,
            `Oficialidad: ${result.inspection.officiality}`,
            result.inspection.next_action,
          ]}
        />
      )}
      {result.proposed_sanction && (
        <ActionCard
          icon={<FileWarning className="h-4 w-4" />}
          title="Sanción propuesta"
          lines={[
            `Artículo: ${result.proposed_sanction.legal_basis_article_id}`,
            `Firme: ${result.proposed_sanction.is_firm ? 'sí' : 'no'}`,
            `Oficialidad: ${result.proposed_sanction.officiality}`,
            result.proposed_sanction.next_action,
          ]}
        />
      )}
      {result.due_process_gate && (
        <GatePanel
          gate={result.due_process_gate}
          blockers={result.blockers}
        />
      )}
    </div>
  )
}

function ActionCard({ icon, title, lines }: { icon: ReactNode; title: string; lines: string[] }) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
      <p className="text-[13px] font-semibold text-[#1C1B18]">{icon} <span className="ml-2">{title}</span></p>
      <div className="mt-2 space-y-1 text-[12px] text-[#6B6760]">
        {lines.map(line => <p key={line}>{line}</p>)}
      </div>
    </div>
  )
}

function GatePanel({
  gate,
  blockers,
  className,
}: {
  gate: LegalGatedActionResponse['due_process_gate']
  blockers?: string[]
  className?: string
}) {
  return (
    <div className={cn('rounded-[8px] border border-[#DAD3C7] bg-white p-4', className)}>
      <p className="text-[13px] font-semibold text-[#1C1B18]">Alcance de debido proceso</p>
      <div className="mt-2 space-y-1 text-[12px] text-[#6B6760]">
        <p>Municipio: {gate.municipio_id || '—'}</p>
        <p>Validación legal: {gate.legal_validation_status}</p>
        <p>Puede emitir advertencia educativa: {gate.can_issue_educational_warning ? 'sí' : 'no'}</p>
        <p>Puede registrar inspección: {gate.can_register_inspection ? 'sí' : 'no'}</p>
        <p>Puede elaborar propuesta sancionatoria: {gate.can_propose_sanction ? 'sí' : 'no'}</p>
        <p>Puede emitir documento definitivo desde ALQUIMIA: {gate.can_create_definitive_document ? 'sí' : 'no'}</p>
        {blockers && blockers.length > 0 && (
          <div className="mt-2">
            <p className="font-semibold text-[#1C1B18]">Restricciones de alcance:</p>
            {blockers.map(blocker => (
              <p key={blocker}>{blocker}</p>
            ))}
          </div>
        )}
      </div>
      <p className="mt-2 text-[12px] text-[#6B6760]">{gate.next_action}</p>
    </div>
  )
}
