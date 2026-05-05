'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import * as Switch from '@radix-ui/react-switch'
import { AlertTriangle, CheckCircle2, ChevronRight, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CitizenPreviewPanel } from '@/components/simulator/CitizenPreviewPanel'
import type { DecisionModule, PortalEntry } from '@/types'

interface DecisionModuleShellProps {
  modules: DecisionModule[]
  loading: boolean
  error: string | null
  audience: PortalEntry | null
  renderModule: (module: DecisionModule) => ReactNode
}

export function DecisionModuleShell({ modules, loading, error, audience, renderModule }: DecisionModuleShellProps) {
  // Fase 22.2 — el shell respeta el filtrado por audiencia (gateway).
  const audienceSelected = useSimulatorStore(s => s.audience)
  const visibleIds = audienceSelected ? AUDIENCE_MODULES[audienceSelected] : null
  const filteredModules = useMemo(
    () => (visibleIds ? modules.filter(m => visibleIds.includes(m.module_id)) : modules),
    [modules, visibleIds],
  )
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [citizenPreviewOpen, setCitizenPreviewOpen] = useState(false)
  const activeModule = useMemo(
    () => filteredModules.find(module => module.module_id === activeModuleId) ?? filteredModules[0] ?? null,
    [activeModuleId, filteredModules]
  )

  useEffect(() => {
    if (!filteredModules.length) {
      setActiveModuleId(null)
      return
    }
    if (!activeModuleId || !filteredModules.some(module => module.module_id === activeModuleId)) {
      setActiveModuleId(filteredModules[0].module_id)
    }
  }, [activeModuleId, filteredModules])

  return (
    <section className="section" aria-labelledby="decision-shell-title">
      <div className="mb-4">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Fase 10.2 — Navegacion modular</p>
        <h2 id="decision-shell-title" className="mt-2 font-serif text-[26px] text-[#1C1B18]">
          Modulos de decision
        </h2>
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
          Audiencia activa:{' '}
          {audienceSelected === 'citizen'
            ? 'Ciudadano · educacion y huella'
            : audienceSelected === 'functionary'
              ? 'Funcionario publico · decision institucional'
              : audienceSelected === 'entrepreneur'
                ? 'Empresario · viabilidad y mercado'
                : audience === 'organization'
                  ? 'Empresa / institucion (portal tecnico)'
                  : 'Ciudadania / plan de ciudad (portal tecnico)'}
          . Cada modulo resume decision, dato que sostiene la conclusion y siguiente paso recomendado.
        </p>
      </div>

      {audienceSelected === 'functionary' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3">
          <div className="min-w-[200px] flex-1">
            <p className="text-[12px] font-medium text-[#1C1B18]" id="citizen-preview-label">
              Referencia · vista ciudadana
            </p>
            <p className="text-[11px] text-[#6B6760]">
              Activa el mismo contenido educativo que ve el perfil ciudadano, sin salir del journey institucional.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="citizen-preview-switch" className="cursor-pointer text-[12px] text-[#1C1B18]">
              Ver vista ciudadana
            </label>
            <Switch.Root
              id="citizen-preview-switch"
              checked={citizenPreviewOpen}
              onCheckedChange={setCitizenPreviewOpen}
              className={cn(
                'relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                'bg-[#E2DED6] outline-none transition-colors',
                'data-[state=checked]:bg-[#3B6D11]',
                'focus-visible:ring-2 focus-visible:ring-[#3B6D11] focus-visible:ring-offset-2',
              )}
              aria-labelledby="citizen-preview-label"
            >
              <Switch.Thumb
                className={cn(
                  'pointer-events-none block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow-md ring-0 transition-transform',
                  'data-[state=checked]:translate-x-[22px]',
                )}
              />
            </Switch.Root>
          </div>
        </div>
      )}

      {audienceSelected === 'functionary' && citizenPreviewOpen && (
        <div
          role="region"
          aria-labelledby="citizen-preview-label"
          className="mb-4 rounded-[8px] border border-[#C9DDB1] bg-[#F1F6E5]/60 p-4"
        >
          <CitizenPreviewPanel />
        </div>
      )}

      {loading && (
        <ShellState title="Cargando modulos" detail="Obteniendo DecisionModule desde el contrato /city/journey/steps." />
      )}

      {!loading && error && (
        <ShellState title="No se pudo cargar la navegacion modular" detail={error} tone="error" />
      )}

      {!loading && !error && filteredModules.length === 0 && (
        <ShellState title="No hay modulos disponibles" detail="Selecciona una audiencia para cargar el journey modular." />
      )}

      {!loading && !error && activeModule && (
        <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <nav aria-label="Modulos de decision" className="grid gap-2 self-start">
            {filteredModules.map(module => {
              const active = module.module_id === activeModule.module_id
              const blocked = module.status === 'blocked'
              return (
                <button
                  key={module.module_id}
                  type="button"
                  onClick={() => setActiveModuleId(module.module_id)}
                  className={cn(
                    'rounded-[8px] border px-3 py-3 text-left transition-colors',
                    active
                      ? 'border-[#3B6D11] bg-[#EAF3DE]'
                      : 'border-[#E8E4DC] bg-[#FDFCFA] hover:border-[#B9C8A6]',
                    blocked && !active ? 'border-amber-200 bg-amber-50/70' : ''
                  )}
                >
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-[12px] font-semibold text-[#1C1B18]">{module.label}</span>
                    {blocked ? (
                      <Lock size={14} className="shrink-0 text-amber-800" aria-hidden="true" />
                    ) : (
                      <ChevronRight size={14} className="shrink-0 text-[#6B6760]" aria-hidden="true" />
                    )}
                  </span>
                  <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.06em] text-[#8A857C]">
                    {blocked ? (
                      <>
                        <Lock size={11} aria-hidden="true" />
                        Requiere acción
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={11} aria-hidden="true" className="text-[#3B6D11]" />
                        Disponible
                      </>
                    )}
                    <span className="text-[#A8A49C]">· {module.audience_mode}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          <article className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
            <DecisionHeader module={activeModule} />
            {activeModule.status === 'blocked' ? (
              <div className="mt-4 rounded-[8px] border border-amber-300 bg-amber-50 p-4">
                <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-amber-900">
                  <AlertTriangle size={15} aria-hidden="true" />
                  Modulo bloqueado
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-amber-900">
                  {activeModule.blocker ?? 'Este modulo requiere una condicion previa antes de mostrar herramientas operativas.'}
                </p>
                <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Siguiente accion</p>
                <p className="mt-1 text-[12px] text-[#6B6760]">{activeModule.next_action}</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-5">
                {renderModule(activeModule)}
              </div>
            )}
          </article>
        </div>
      )}
    </section>
  )
}

function DecisionHeader({ module }: { module: DecisionModule }) {
  const blocked = module.status === 'blocked'
  return (
    <header className="border-b border-[#E8E4DC] pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Que veo</p>
          <h3 className="mt-1 font-serif text-[24px] text-[#1C1B18]">{module.label}</h3>
        </div>
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
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <InfoBlock label="Que decido" value={module.decision} />
        <InfoBlock label="Dato que sostiene" value={module.evidence} />
        <InfoBlock label="Que sigue" value={module.next_action} />
      </div>
    </header>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[#1C1B18]">{value}</p>
    </div>
  )
}

function ShellState({ title, detail, tone = 'neutral' }: { title: string; detail: string; tone?: 'neutral' | 'error' }) {
  return (
    <div
      className={cn(
        'rounded-[8px] border px-4 py-4',
        tone === 'error'
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760]'
      )}
    >
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="mt-1 text-[12px] leading-relaxed">{detail}</p>
    </div>
  )
}

