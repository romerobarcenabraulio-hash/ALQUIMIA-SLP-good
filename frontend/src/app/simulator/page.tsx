'use client'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { SIMULATION_BANNER_BODY, SIMULATION_BANNER_TITLE } from '@/lib/simulationDisclaimer'
import { cn } from '@/lib/utils'
import { isPlatformDeveloper } from '@/lib/authSession'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { ClientOnboardingGate } from '@/components/onboarding/ClientOnboardingGate'
import { AudienceGateway } from '@/components/simulator/AudienceGateway'
import { DecisionModuleShell, ModuleNav } from '@/components/simulator/DecisionModuleShell'
import { PlanGlobalControlsBar } from '@/components/simulator/PlanGlobalControlsBar'
import { FuncionariosViviendaRsuModel } from '@/components/simulator/FuncionariosViviendaRsuModel'
import { GenerarPlanModal } from '@/components/simulator/GenerarPlanModal'
import { GeneraPlanConfirmModal } from '@/components/simulator/GeneraPlanConfirmModal'
import { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { enrichFunctionaryModules } from '@/lib/simulator/functionaryJourneyEnrichment'
import { buildFunctionaryJourney } from '@/lib/simulator/clientModuleRegistry'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { renderDecisionModule } from '@/app/simulator/renderDecisionModule'
import { AntecedentesReportajePanel } from '@/components/simulator/AntecedentesReportajePanel'

function SimulatorSimulationRibbon() {
  const [open, setOpen] = useState(false)
  const cityContext = useSimulatorStore(s => s.cityContext)
  const cityContextLoading = useSimulatorStore(s => s.cityContextLoading)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const territorioLectura = useMemo(
    () => getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva),
    [municipiosActivos, zmActiva],
  )
  return (
    <div className="shrink-0 border-b border-[#D4881E]/25 bg-[#FEF7E7]" role="region" aria-label={SIMULATION_BANNER_TITLE}>
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-[#FEF0D0]/50 transition-colors"
      >
        <Info size={13} className="text-[#D4881E] shrink-0" />
        <span className="text-[11px] font-medium text-[#8B5A00] flex-1 truncate">
          {SIMULATION_BANNER_TITLE}
          {territorioLectura ? ` · ${territorioLectura}` : ''}
        </span>
        <ChevronDown size={13} className={cn('text-[#D4881E] transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-3 space-y-1.5 border-t border-[#D4881E]/15">
          <p className="text-[11px] leading-relaxed text-[#6B6760] pt-2">{SIMULATION_BANNER_BODY}</p>
          {(cityContextLoading || cityContext) && (
            <div className="rounded-[6px] border border-[#E8E4DC]/80 bg-white/60 px-3 py-2 text-[11px] text-[#6B6760]">
              {cityContextLoading && <p>Versión de referencia territorial: sincronizando…</p>}
              {!cityContextLoading && cityContext && (
                <p>Versión catálogo: <span className="font-medium text-[#1C1B18]">{cityContext.catalog_simulation_epoch}</span></p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function SimulatorPage() {
  const recalcular = useSimulatorStore(s => s.recalcular)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const audience = useSimulatorStore(s => s.audience)
  const clientSetupComplete = useSimulatorStore(s => s.clientSetupComplete)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    setSessionReady(true)
  }, [])
  const portalEntry = useSimulatorStore(s => s.portalEntry)
  const fetchCityPortalData = useSimulatorStore(s => s.fetchCityPortalData)
  const portalJourney = useSimulatorStore(s => s.portalJourney)
  const portalJourneyLoading = useSimulatorStore(s => s.portalJourneyLoading)
  const portalError = useSimulatorStore(s => s.portalError)
  const activeDecisionModuleId = useSimulatorStore(s => s.activeDecisionModuleId)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const refreshAntecedentesReportaje = useSimulatorStore(s => s.refreshAntecedentesReportaje)
  const antecedentesForMunicipioId = useSimulatorStore(s => s.antecedentesForMunicipioId)
  const activeMunicipioId = municipiosActivos[0] ?? null

  useEffect(() => { recalcular() }, [recalcular])
  useEffect(() => {
    if (!audience) return
    void fetchCityPortalData(zmActiva)
  }, [audience, fetchCityPortalData, zmActiva])

  /** Respaldo: dispara reportaje si el municipio activo cambió sin pasar por applyMunicipioCatalog. */
  useEffect(() => {
    if (!activeMunicipioId) return
    if (antecedentesForMunicipioId === activeMunicipioId) return
    void refreshAntecedentesReportaje({ refresh: true })
  }, [activeMunicipioId, antecedentesForMunicipioId, refreshAntecedentesReportaje])

  const isOrganizationJourney = portalEntry === 'organization'

  const portalJourneyWithTraceability = useMemo(() => {
    if (audience !== 'functionary') return portalJourney
    return buildFunctionaryJourney(enrichFunctionaryModules(portalJourney))
  }, [audience, portalJourney])

  // ── Module nav state (lifted from DecisionModuleShell) ──────────────────────
  const visibleIds = audience ? AUDIENCE_MODULES[audience] : null
  const filteredModules = useMemo(
    () => (visibleIds ? portalJourneyWithTraceability.filter(m => visibleIds.includes(m.module_id)) : portalJourneyWithTraceability),
    [portalJourneyWithTraceability, visibleIds],
  )

  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  useEffect(() => {
    if (!filteredModules.length) { setActiveModuleId(null); return }
    setActiveModuleId(prev => {
      if (!prev || !filteredModules.some(m => m.module_id === prev)) return filteredModules[0].module_id
      return prev
    })
  }, [filteredModules])

  const activeModule = useMemo(
    () => filteredModules.find(m => m.module_id === activeModuleId) ?? filteredModules[0] ?? null,
    [activeModuleId, filteredModules],
  )

  const sociodemographicBlock = useMemo(
    () => buildSociodemographicScaffoldBlock(municipiosActivos),
    [municipiosActivos],
  )

  const needsClientOnboarding =
    sessionReady && !isPlatformDeveloper() && !clientSetupComplete

  if (needsClientOnboarding) {
    return (
      <div className="h-screen flex flex-col overflow-hidden bg-surface-base">
        <Header />
        <div className="flex-1 overflow-y-auto">
          <ClientOnboardingGate />
        </div>
      </div>
    )
  }

  if (!audience) {
    return (
      <div className="h-screen flex overflow-hidden bg-surface-base">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <Header />
          <div className="flex-1 overflow-y-auto">
            <AudienceGateway />
          </div>
        </div>
      </div>
    )
  }

  const moduleNav = filteredModules.length > 0 && !portalJourneyLoading ? (
    <ModuleNav
      modules={filteredModules}
      activeId={activeModuleId ?? ''}
      onChange={setActiveModuleId}
      theme="dark"
    />
  ) : undefined

  return (
    <div className="h-screen flex overflow-hidden bg-surface-base">
      <Sidebar moduleSection={moduleNav} />

      {/* Right: header + compact ribbon + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Compact disclaimer ribbon — always visible, outside scroll */}
        <SimulatorSimulationRibbon />

        {/* Reportaje antecedentes — se regenera automáticamente al cambiar municipio */}
        <AntecedentesReportajePanel />

        {/* Scrollable content — full width, moderate padding */}
        <div className="flex-1 overflow-y-auto">
          <main className="w-full">
            {audience === 'citizen' && (
              <div className="px-4 sm:px-6 pt-4">
                <PlanGlobalControlsBar />
              </div>
            )}

            <DecisionModuleShell
              modules={filteredModules}
              activeModule={activeModule}
              onModuleChange={setActiveModuleId}
              loading={portalJourneyLoading}
              error={portalError}
              audience={portalEntry}
              renderModule={module =>
                renderDecisionModule({
                  module,
                  audience,
                  isOrganizationJourney,
                  sociodemographicBlock,
                  onNavigate: setActiveModuleId,
                })
              }
            />
          </main>
        </div>
      </div>

      <GeneraPlanConfirmModal />
      <GenerarPlanModal />
    </div>
  )
}

