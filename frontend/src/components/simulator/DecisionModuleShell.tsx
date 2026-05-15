'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronRight, Lock } from 'lucide-react'
import { cn, fmt } from '@/lib/utils'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { audienceModeLabel } from '@/lib/audienceModeLabel'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { ModuleEditorialBrief } from '@/components/simulator/ModuleEditorialBrief'
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
  const activeModule = useMemo(
    () => filteredModules.find(module => module.module_id === activeModuleId) ?? filteredModules[0] ?? null,
    [activeModuleId, filteredModules],
  )

  const setActiveDecisionModuleId = useSimulatorStore(s => s.setActiveDecisionModuleId)

  useEffect(() => {
    setActiveDecisionModuleId(activeModule?.module_id ?? null)
    return () => {
      setActiveDecisionModuleId(null)
    }
  }, [activeModule?.module_id, setActiveDecisionModuleId])

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
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Tu recorrido · módulos de decisión</p>
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
          . Cada modulo abre una parte del expediente municipal: problema, contexto sociodemográfico, marco jurídico, ruta temporal, operación,
          estrategia administrativa, salida y matriz de fuentes.
        </p>
        <ScopeAnclaKicker className="mt-3 border-l-[3px] border-[#8CAA7A] pl-3" />
      </div>

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
        <div className="grid gap-4 xl:grid-cols-[minmax(240px,290px)_minmax(0,1fr)]">
          <nav aria-label="Modulos de decision" className="grid gap-2 self-start">
            {filteredModules.map(module => {
              const active = module.module_id === activeModule.module_id
              const blocked = module.status === 'blocked'
              return (
                <button
                  key={module.module_id}
                  type="button"
                  onClick={() => setActiveModuleId(module.module_id)}
                  aria-current={active ? 'true' : undefined}
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
                    <span className="text-[#A8A49C]">· {audienceModeLabel(module.audience_mode)}</span>
                  </span>
                </button>
              )
            })}
          </nav>

          <article className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 min-w-0 w-full max-w-none">
            <div className="sticky top-24 z-20 space-y-3 border-b border-[#E8E4DC]/80 bg-[#FDFCFA]/97 pb-3 backdrop-blur-md lg:top-28">
              <DecisionHeader module={activeModule} titleOnly={audienceSelected === 'functionary'} />
              {audienceSelected === 'functionary' && <ModuleEditorialBrief moduleId={activeModule.module_id} />}
            </div>
            {audienceSelected === 'functionary' && <FunctionaryKpiStrip />}
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

function DecisionHeader({ module, titleOnly = false }: { module: DecisionModule; titleOnly?: boolean }) {
  const blocked = module.status === 'blocked'
  const audienceSelected = useSimulatorStore(s => s.audience)
  const resultados = useSimulatorStore(s => s.resultados)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const showFunctionaryKpis = audienceSelected === 'functionary' && !titleOnly

  return (
    <header className="border-b border-[#E8E4DC] pb-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Que veo</p>
          <h2 className="mt-1 font-serif text-[24px] text-[#1C1B18]">{module.label}</h2>
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
      {audienceSelected === 'functionary' ? (
        showFunctionaryKpis && (
        <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <KpiBlock label="RSU generado diario" value={resultados ? fmt.kgd(resultados.rsuTotalTonDia) : '—'} helper="estimación de escenario" />
          <KpiBlock label="Derrama base/año" value={resultados ? fmt.mxnM(resultados.ingresosBrutos / Math.max(1, horizonte)) : '—'} helper="venta de material separado" />
          <KpiBlock label="CO₂e a evitar/año" value={resultados ? fmt.co2(resultados.co2eEvitadasAnualTon) : '—'} helper="factor ambiental trazado" />
          <KpiBlock label="Empleos directos" value={resultados ? fmt.num0(resultados.empleosTotalesDirectos) : '—'} helper="programa + reciclaje" />
        </div>
        )
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <InfoBlock label="Que decido" value={module.decision} />
          <InfoBlock label="Dato que sostiene" value={module.evidence} />
          <InfoBlock label="Que sigue" value={module.next_action} />
        </div>
      )}
    </header>
  )
}

function FunctionaryKpiStrip() {
  const resultados = useSimulatorStore(s => s.resultados)
  const horizonte = useSimulatorStore(s => s.horizonte)
  return (
    <div className="mb-4 mt-3 rounded-[10px] border border-[#E8E4DC] bg-white/90 px-3 py-3 shadow-[0_1px_0_rgba(28,27,24,0.04)]">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#8A857C]">Indicadores del escenario (referencia)</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiBlock label="RSU generado diario" value={resultados ? fmt.kgd(resultados.rsuTotalTonDia) : '—'} helper="estimación de escenario" />
        <KpiBlock label="Derrama base/año" value={resultados ? fmt.mxnM(resultados.ingresosBrutos / Math.max(1, horizonte)) : '—'} helper="venta de material separado" />
        <KpiBlock label="CO₂e a evitar/año" value={resultados ? fmt.co2(resultados.co2eEvitadasAnualTon) : '—'} helper="factor ambiental trazado" />
        <KpiBlock label="Empleos directos" value={resultados ? fmt.num0(resultados.empleosTotalesDirectos) : '—'} helper="programa + reciclaje" />
      </div>
    </div>
  )
}

function KpiBlock({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 font-mono text-[17px] leading-tight text-[#1C1B18]">{value}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-[#8C8880]">{helper}</p>
    </div>
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
