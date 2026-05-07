'use client'
import { useEffect, useRef } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { SIMULATION_BANNER_BODY, SIMULATION_BANNER_TITLE } from '@/lib/simulationDisclaimer'
import { Header } from '@/components/layout/Header'
import { AudienceGateway } from '@/components/simulator/AudienceGateway'
import { SectionHero } from '@/components/simulator/SectionHero'
import { FuentesDatos } from '@/components/simulator/FuentesDatos'
import { CityFirstSelector } from '@/components/simulator/CityFirstSelector'
import { CircularityBaselineCard } from '@/components/simulator/CircularityBaselineCard'
import { DecisionModuleShell } from '@/components/simulator/DecisionModuleShell'
import { MarcoLegal } from '@/components/simulator/MarcoLegal'
import { ComposicionRSU } from '@/components/simulator/ComposicionRSU'
import { EducacionCiudadana } from '@/components/simulator/EducacionCiudadana'
import { TipoVivienda } from '@/components/simulator/TipoVivienda'
import { HorizonteCircularidad } from '@/components/simulator/HorizonteCircularidad'
import { EditorTrayectoria } from '@/components/simulator/EditorTrayectoria'
import { ImplementacionEspacioTiempo } from '@/components/simulator/ImplementacionEspacioTiempo'
import { CentrosAcopio } from '@/components/simulator/CentrosAcopio'
import { Logistica } from '@/components/simulator/Logistica'
import { RecicladoarasSection } from '@/components/simulator/RecicladoarasSection'
import { ImpactoFinanciero } from '@/components/simulator/ImpactoFinanciero'
import { ImpactoAmbiental } from '@/components/simulator/ImpactoAmbiental'
import { MultiplicadoresEco } from '@/components/simulator/MultiplicadoresEco'
import { BenchmarkLATAM } from '@/components/simulator/BenchmarkLATAM'
import Macrogeneradores from '@/components/simulator/Macrogeneradores'
import { DeclaracionWizard } from '@/components/simulator/DeclaracionWizard'
import Precolocacion from '@/components/simulator/Precolocacion'
import ReasoningGraphPanel from '@/components/simulator/ReasoningGraphPanel'
import CoberturaNacional from '@/components/simulator/CoberturaNacional'
import { OperacionPERBitacora } from '@/components/simulator/OperacionPERBitacora'
import { AdvertenciasGateLegal } from '@/components/simulator/AdvertenciasGateLegal'
import { PortalEmpresarial } from '@/components/simulator/PortalEmpresarial'
import { FlujosResiduos } from '@/components/simulator/FlujosResiduos'
import { SankeyFlujoResiduos } from '@/components/simulator/SankeyFlujoResiduos'
import { HojaRuta } from '@/components/simulator/HojaRuta'
import { ExportadorReporte } from '@/components/simulator/ExportadorReporte'
import { DashboardKPIs } from '@/components/simulator/DashboardKPIs'
import { ComparadorEscenarios } from '@/components/simulator/ComparadorEscenarios'
import { AlertasPanel } from '@/components/simulator/AlertasPanel'
import { GovernancePanel } from '@/components/simulator/GovernancePanel'
import { InspeccionForm } from '@/components/simulator/InspeccionForm'
import { LaunchChecklist } from '@/components/simulator/LaunchChecklist'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { GenerarPlanModal } from '@/components/simulator/GenerarPlanModal'
import { GeneraPlanConfirmModal } from '@/components/simulator/GeneraPlanConfirmModal'
import { FloatingCTA } from '@/components/simulator/FloatingCTA'
import type { Audience, DecisionModule } from '@/types'
import { ContainersProvider } from '@/components/simulator/ContainersProvider'
import { isCircularityBaselineReadyForUi } from '@/lib/baselinePresentation'

function SimulatorSimulationRibbon() {
  const cityContext = useSimulatorStore(s => s.cityContext)
  const cityContextLoading = useSimulatorStore(s => s.cityContextLoading)
  return (
    <div className="sticky top-0 z-30 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-4">
      <div
        role="region"
        aria-label={SIMULATION_BANNER_TITLE}
        className="rounded-[12px] border border-[#D4881E]/35 bg-[#FEF7E7] px-4 py-3 shadow-[0_2px_8px_rgba(28,27,24,0.06)]"
      >
        <p className="text-[12px] font-semibold text-[#1C1B18]">{SIMULATION_BANNER_TITLE}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#6B6760]">{SIMULATION_BANNER_BODY}</p>
        {cityContextLoading && (
          <p className="mt-2 font-mono text-[10px] text-[#8A857C]">Época catálogo (simulación): sincronizando…</p>
        )}
        {!cityContextLoading && cityContext && (
          <p className="mt-2 font-mono text-[10px] text-[#8A857C]" title="Contrato API">
            Época catálogo (simulación): {cityContext.catalog_simulation_epoch}
          </p>
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
  const interacciones = useRef(0)

  useEffect(() => { recalcular() }, [recalcular])
  // Fase 22: ya NO auto-seleccionamos audiencia. El gateway debe ser explícito.
  useEffect(() => {
    if (!audience) return
    void fetchCityPortalData(zmActiva)
  }, [audience, fetchCityPortalData, zmActiva])

  const onInteract = () => { interacciones.current++ }
  const isOrganizationJourney = portalEntry === 'organization'
  const baselineValid = isCircularityBaselineReadyForUi(circularityBaseline, zmActiva)

  // Fase 22.0 — Gateway obligatorio: sin audiencia no se carga ningún módulo.
  if (!audience) {
    return (
      <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
        <Header />
        <AudienceGateway />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#F8F6F1' }} onClickCapture={onInteract}>
      <Header />
      <div className="max-w-7xl mx-auto">
        <SimulatorSimulationRibbon />
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-5xl mx-auto">

          <CityFirstSelector />
          <CircularityBaselineCard />

          {!baselineValid ? (
            <BaselineGateBlocked
              loading={circularityBaselineLoading}
              error={portalError}
              cityId={zmActiva}
            />
          ) : (
            <DecisionModuleShell
              modules={portalJourney}
              loading={portalJourneyLoading}
              error={portalError}
              audience={portalEntry}
              renderModule={module => renderDecisionModule(module, isOrganizationJourney, audience)}
            />
          )}

        </main>
      </div>

      <GeneraPlanConfirmModal />
      <GenerarPlanModal />
      <FloatingCTA interaccionesRef={interacciones} />
    </div>
  )
}

function renderDecisionModule(
  module: DecisionModule,
  isOrganizationJourney: boolean,
  audience: Audience | null,
) {
  // Empresario — journey organization
  if (isOrganizationJourney || audience === 'entrepreneur') {
    switch (module.module_id) {
      case 'organization_profile':
        return (
          <>
            <DeclaracionWizard />
            <FuentesDatos />
            <Macrogeneradores />
          </>
        )
      case 'containers_provider':
        return <ContainersProvider />
      case 'market_traceability':
        return (
          <>
            <Precolocacion />
            <RecicladoarasSection />
            <BenchmarkLATAM />
            <ReasoningGraphPanel />
            <ImpactoFinanciero />
            <SankeyFlujoResiduos />
          </>
        )
      case 'organization_report':
        return (
          <>
            <ExportarSection />
            <ExportadorReporte />
            <DashboardKPIs />
          </>
        )
      default:
        return <ModuleEmpty module={module} />
    }
  }

  // Ciudadano — versión simplificada de city_plan
  if (audience === 'citizen') {
    switch (module.module_id) {
      case 'city_baseline':
        return (
          <>
            <SectionHero />
            <FuentesDatos />
          </>
        )
      case 'municipal_context':
        return (
          <>
            <MarcoLegal mode="citizen" />
            <CoberturaNacional />
          </>
        )
      case 'citizen_inputs':
        return (
          <>
            <EducacionCiudadana />
            <ComposicionRSU />
            <TipoVivienda />
          </>
        )
      case 'impact_finance':
        // Lite: solo lo que el ciudadano necesita ver
        return (
          <>
            <ImpactoAmbiental />
            <MultiplicadoresEco />
          </>
        )
      default:
        return <ModuleEmpty module={module} />
    }
  }

  // Funcionario — vista institucional completa de city_plan
  switch (module.module_id) {
    case 'city_baseline':
      return (
        <>
          <SectionHero />
          <FuentesDatos />
        </>
      )
    case 'municipal_context':
      return (
        <>
          <MarcoLegal mode="functionary" />
          <CoberturaNacional />
        </>
      )
    case 'future_goals':
      return (
        <>
          <HorizonteCircularidad />
          <EditorTrayectoria />
          <ImplementacionEspacioTiempo />
        </>
      )
    case 'infrastructure_operations':
      return (
        <>
          <CentrosAcopio />
          <Logistica />
          <OperacionPERBitacora />
          <AdvertenciasGateLegal />
          <PortalEmpresarial />
          <FlujosResiduos />
          <SankeyFlujoResiduos />
          <HojaRuta />
        </>
      )
    case 'inspeccion_predios':
      return <InspeccionForm />
    case 'scenarios_export':
      return (
        <>
          <ComparadorEscenarios />
          <ExportarSection />
          <ExportadorReporte />
          <DashboardKPIs />
          <AlertasPanel />
          <GovernancePanel />
          <LaunchChecklist />
        </>
      )
    default:
      return <ModuleEmpty module={module} />
  }
}

function ModuleEmpty({ module }: { module: DecisionModule }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white px-4 py-4">
      <p className="text-[12px] font-semibold text-[#1C1B18]">Modulo sin herramienta conectada</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{module.next_action}</p>
    </div>
  )
}

function BaselineGateBlocked({ loading, error, cityId }: { loading: boolean; error: string | null; cityId: string }) {
  const title = loading
    ? 'Cargando la referencia RSU de tu ciudad'
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
      </div>
    </section>
  )
}

