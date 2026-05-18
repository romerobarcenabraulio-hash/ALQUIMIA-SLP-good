'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { SIMULATION_BANNER_BODY, SIMULATION_BANNER_TITLE } from '@/lib/simulationDisclaimer'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { AudienceGateway } from '@/components/simulator/AudienceGateway'
import { CityFirstSelector } from '@/components/simulator/CityFirstSelector'
import { CircularityBaselineCard } from '@/components/simulator/CircularityBaselineCard'
import { DecisionModuleShell, ModuleNav } from '@/components/simulator/DecisionModuleShell'
import { PlanGlobalControlsBar } from '@/components/simulator/PlanGlobalControlsBar'
import { FuncionariosViviendaRsuModel } from '@/components/simulator/FuncionariosViviendaRsuModel'
import { PropuestasSimulatorBar } from '@/components/simulator/PropuestasSimulatorBar'
import { GenerarPlanModal } from '@/components/simulator/GenerarPlanModal'
import { GeneraPlanConfirmModal } from '@/components/simulator/GeneraPlanConfirmModal'
import { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import { isCircularityBaselineReadyForUi } from '@/lib/baselinePresentation'
import {
  aplicarSustitucionesTerritorio,
  getEtiquetaNarrativaCiudad,
} from '@/lib/municipioMadurezContexto'
import {
  enrichFunctionaryModules,
  SOURCE_TRACEABILITY_MODULE,
} from '@/lib/simulator/functionaryJourneyEnrichment'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { renderDecisionModule } from '@/app/simulator/renderDecisionModule'

function SimulatorSimulationRibbon() {
  const cityContext = useSimulatorStore(s => s.cityContext)
  const cityContextLoading = useSimulatorStore(s => s.cityContextLoading)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const territorioLectura = useMemo(
    () => getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva),
    [municipiosActivos, zmActiva],
  )
  return (
    <div className="sticky top-0 z-30 mx-auto max-w-[min(96rem,calc(100vw-1.5rem))] px-4 sm:px-6 lg:px-8 pt-4">
      <div
        role="region"
        aria-label={SIMULATION_BANNER_TITLE}
        className="rounded-[12px] border border-[#D4881E]/35 bg-[#FEF7E7] px-4 py-3 shadow-[0_2px_8px_rgba(28,27,24,0.06)]"
      >
        <p className="text-[12px] font-semibold text-[#1C1B18]">{SIMULATION_BANNER_TITLE}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#6B6760]">{SIMULATION_BANNER_BODY}</p>
        {municipiosActivos.length > 0 && (
          <p className="mt-2 text-[11px] font-medium text-[#5C5740]">
            Alcance de lectura en esta sesión: {territorioLectura}
            {zmActiva ? ` · ZM ${zmActiva}` : ''}
          </p>
        )}
        {(cityContextLoading || cityContext) && (
          <details className="mt-2 border-t border-[#D4881E]/20 pt-2">
            <summary className="cursor-pointer text-[11px] font-medium text-[#8B5A00] underline-offset-2 hover:underline">
              Detalle de la simulación
            </summary>
            <div className="mt-2 rounded-[8px] border border-[#E8E4DC]/80 bg-white/60 px-3 py-2 text-[11px] text-[#6B6760]">
              {cityContextLoading && (
                <p>Versión de referencia territorial: sincronizando con el servidor…</p>
              )}
              {!cityContextLoading && cityContext && (
                <>
                  <p>
                    Versión declarada del catálogo demográfico-territorial usada en esta sesión:{' '}
                    <span className="font-medium text-[#1C1B18]">{cityContext.catalog_simulation_epoch}</span>
                  </p>
                  <p className="mt-1 text-[10px] text-[#A8A49C]">
                    Identificador técnico de consistencia entre pantallas; no es acto oficial ni marca de autoridad.
                  </p>
                </>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

export default function SimulatorPage() {
  const recalcular = useSimulatorStore(s => s.recalcular)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const audience = useSimulatorStore(s => s.audience)
  const portalEntry = useSimulatorStore(s => s.portalEntry)
  const fetchCityPortalData = useSimulatorStore(s => s.fetchCityPortalData)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const circularityBaselineLoading = useSimulatorStore(s => s.circularityBaselineLoading)
  const portalJourney = useSimulatorStore(s => s.portalJourney)
  const portalJourneyLoading = useSimulatorStore(s => s.portalJourneyLoading)
  const portalError = useSimulatorStore(s => s.portalError)
  const cityPortalError = useSimulatorStore(s => s.cityPortalError)
  const activeDecisionModuleId = useSimulatorStore(s => s.activeDecisionModuleId)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)

  useEffect(() => { recalcular() }, [recalcular])
  useEffect(() => {
    if (!audience) return
    void fetchCityPortalData(zmActiva)
  }, [audience, fetchCityPortalData, zmActiva])

  const isOrganizationJourney = portalEntry === 'organization'
  const baselineValid = isCircularityBaselineReadyForUi(circularityBaseline, zmActiva)

  const portalJourneyWithTraceability = useMemo(() => {
    if (audience !== 'functionary') return portalJourney
    const enriched = enrichFunctionaryModules(portalJourney)
    if (enriched.some(m => m.module_id === SOURCE_TRACEABILITY_MODULE.module_id)) return enriched
    return [...enriched, SOURCE_TRACEABILITY_MODULE]
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

  if (!audience) {
    return (
      <div className="h-screen flex overflow-hidden" style={{ background: '#F4F2ED' }}>
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

  const showModuleNav = baselineValid && !portalJourneyLoading && filteredModules.length > 0

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#F4F2ED' }}>
      <Sidebar />

      {/* Module nav — sticky left panel, between app sidebar and content */}
      {showModuleNav && (
        <ModuleNav
          modules={filteredModules}
          activeId={activeModuleId ?? ''}
          onChange={setActiveModuleId}
          className="hidden xl:flex flex-col w-[230px] shrink-0 bg-[#F4F2ED] border-r border-[#E8E4DC] overflow-y-auto sticky top-0 h-screen"
        />
      )}

      {/* Right: header + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          <SimulatorSimulationRibbon />

          <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-[min(96rem,calc(100vw-1.5rem))] mx-auto w-full">
            <CityFirstSelector />
            {audience === 'citizen' && <PlanGlobalControlsBar />}
            <CircularityBaselineCard />

            {!baselineValid ? (
              <BaselineGateBlocked
                loading={circularityBaselineLoading}
                error={cityPortalError}
                cityId={zmActiva}
              />
            ) : (
              <div className="flex flex-col mt-4" style={{ height: 'calc(100vh - 14rem)' }}>
                {audience === 'functionary' && (
                  <div className="mb-4 space-y-3 shrink-0">
                    <PropuestasSimulatorBar />
                    {activeDecisionModuleId !== 'municipal_context' && <FuncionariosViviendaRsuModel />}
                  </div>
                )}
                <div className="flex-1 min-h-0 rounded-[12px] border border-[#E8E4DC] overflow-hidden shadow-[0_2px_12px_rgba(28,27,24,0.06)] flex flex-col">
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
                      })
                    }
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      <GeneraPlanConfirmModal />
      <GenerarPlanModal />
    </div>
  )
}

function BaselineGateBlocked({ loading, error, cityId }: { loading: boolean; error: string | null; cityId: string }) {
  const fetchCityPortalData = useSimulatorStore(s => s.fetchCityPortalData)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const etiquetaTerritorio = useMemo(
    () => getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva),
    [municipiosActivos, zmActiva],
  )

  const title = loading
    ? aplicarSustitucionesTerritorio('Cargando la referencia RSU de tu ciudad', etiquetaTerritorio)
    : error
      ? 'No pudimos obtener los datos de la ciudad'
      : 'Selecciona una ciudad para continuar'

  const nextAction = loading
    ? 'En un momento podrás seguir cuando terminen de cargarse fuente, confianza e incertidumbre.'
    : error
      ? 'Prueba otra ciudad o comprueba que el servicio de datos esté disponible.'
      : 'Elige una ciudad con una estimación RSU trazable; después podrás ver metas, módulos y el resto del simulador.'

  return (
    <section className="section" aria-labelledby="baseline-gate-title">
      <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-5">
        <h2 id="baseline-gate-title" className="font-serif text-[22px] text-[#1C1B18]">{title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-amber-900">
          Para <span className="font-medium">{cityId}</span> necesitamos una línea base de residuos sólidos urbana actual y verificable; hasta entonces no mostramos metas futuras ni el resto del recorrido del simulador.
        </p>
        {error && (
          <p className="mt-3 rounded-[6px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-800">
            {error}
          </p>
        )}
        <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Qué puedes hacer</p>
        <p className="mt-1 text-[12px] text-[#6B6760]">{nextAction}</p>
        {!loading && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => void fetchCityPortalData(zmActiva)}
              className="rounded-[8px] border border-[#3B6D11]/40 bg-white px-4 py-2 text-[12px] font-medium text-[#23470A] transition-colors hover:bg-[#EAF3DE]"
            >
              Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
