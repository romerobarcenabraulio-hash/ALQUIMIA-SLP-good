'use client'

import { AlertTriangle, Building2, CheckCircle2, Landmark } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import type { PortalEntry } from '@/types'

const entries: Array<{
  id: PortalEntry
  label: string
  description: string
  icon: typeof Landmark
}> = [
  {
    id: 'city_plan',
    label: 'Ciudadania / plan de ciudad',
    description: 'Baseline RSU, municipios, metas y decisiones publicas trazables.',
    icon: Landmark,
  },
  {
    id: 'organization',
    label: 'Empresa / institucion',
    description: 'Circularidad organizacional sin mezclar RSU ordinario con residuos regulados.',
    icon: Building2,
  },
]

/**
 * Selector binario ciudad/plan vs organización (journey legacy).
 * @deprecated Fase 22 — El gateway de audiencia (`AudienceGateway`) define la entrada;
 * este componente queda solo para mantenimiento o rutas legacy.
 */
export function PortalEntrySelector() {
  const { portalEntry, setPortalEntry, portalJourney, portalError } = useSimulatorStore()

  return (
    <section className="section" aria-labelledby="portal-entry-title">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Fase 10.1 — Entrada del portal</p>
      <h2 id="portal-entry-title" className="font-serif text-[26px] text-[#1C1B18] mb-4">
        Elige desde donde entra el programa
      </h2>
      <div className="grid md:grid-cols-2 gap-3">
        {entries.map(entry => {
          const Icon = entry.icon
          const active = portalEntry === entry.id
          return (
            <button
              key={entry.id}
              type="button"
              onClick={() => { void setPortalEntry(entry.id) }}
              className={cn(
                'min-h-[112px] rounded-[8px] border p-4 text-left transition-colors',
                active
                  ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#1C1B18]'
                  : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760] hover:border-[#B9C8A6]'
              )}
            >
              <span className="flex items-center gap-2 text-[13px] font-semibold text-[#1C1B18]">
                <Icon size={17} aria-hidden="true" />
                {entry.label}
              </span>
              <span className="mt-2 block text-[12px] leading-relaxed">{entry.description}</span>
            </button>
          )
        })}
      </div>

      {portalError && (
        <div className="mt-3 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-800">
          {portalError}
        </div>
      )}

      <div className="mt-4 grid gap-2">
        {portalJourney.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#8A857C]">
            Selecciona una puerta para cargar el recorrido.
          </div>
        ) : portalJourney.map(module => {
          const blocked = module.status === 'blocked'
          return (
          <div
            key={module.module_id}
            className={cn(
              'rounded-[8px] border px-4 py-3',
              blocked
                ? 'border-amber-300 bg-amber-50'
                : 'border-[#E8E4DC] bg-[#FDFCFA]'
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[13px] font-semibold text-[#1C1B18]">{module.label}</p>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-[6px] bg-[#F0EDE5] px-2 py-1 text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">
                  {module.audience_mode}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[10px] uppercase tracking-[0.06em]',
                    blocked ? 'bg-amber-100 text-amber-900' : 'bg-[#EAF3DE] text-[#3B6D11]'
                  )}
                >
                  {blocked ? <AlertTriangle size={12} aria-hidden="true" /> : <CheckCircle2 size={12} aria-hidden="true" />}
                  {blocked ? 'Requiere acción' : 'Disponible'}
                </span>
              </div>
            </div>
            <p className="mt-1 text-[12px] text-[#6B6760]">{module.decision}</p>
            <p className="mt-1 text-[11px] text-[#8A857C]" title={module.evidence}>
              Dato que sostiene: {module.evidence}
            </p>
            {blocked && module.blocker && (
              <p className="mt-2 rounded-[6px] border border-amber-200 bg-white/70 px-3 py-2 text-[11px] text-amber-900">
                Bloqueo: {module.blocker}
              </p>
            )}
            <p className="mt-2 text-[11px] font-medium text-[#1C1B18]">Accion siguiente</p>
            <p className="mt-1 text-[11px] text-[#6B6760]">{module.next_action}</p>
          </div>
        )})}
      </div>
    </section>
  )
}
