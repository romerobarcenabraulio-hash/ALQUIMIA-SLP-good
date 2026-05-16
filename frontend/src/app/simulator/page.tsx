'use client'
import { useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'
import { useSimulatorStore } from '@/store/simulatorStore'
import { SIMULATION_BANNER_BODY, SIMULATION_BANNER_TITLE } from '@/lib/simulationDisclaimer'
import { Header } from '@/components/layout/Header'
import { AudienceGateway } from '@/components/simulator/AudienceGateway'
import { SectionHero } from '@/components/simulator/SectionHero'
import { CityFirstSelector } from '@/components/simulator/CityFirstSelector'
import { CircularityBaselineCard } from '@/components/simulator/CircularityBaselineCard'
import { DecisionModuleShell } from '@/components/simulator/DecisionModuleShell'
import { MarcoLegal } from '@/components/simulator/MarcoLegal'
import { EducacionCiudadana } from '@/components/simulator/EducacionCiudadana'
import { CentrosAcopio } from '@/components/simulator/CentrosAcopio'
import { Logistica } from '@/components/simulator/Logistica'
import { ImpactoAmbiental } from '@/components/simulator/ImpactoAmbiental'
import { MultiplicadoresEco } from '@/components/simulator/MultiplicadoresEco'
import { DeclaracionWizard } from '@/components/simulator/DeclaracionWizard'
import CoberturaNacional from '@/components/simulator/CoberturaNacional'
import { OperacionPERBitacora } from '@/components/simulator/OperacionPERBitacora'
import { PortalEmpresarial } from '@/components/simulator/PortalEmpresarial'
import { FlujosResiduos } from '@/components/simulator/FlujosResiduos'
import { SankeyFlujoResiduos } from '@/components/simulator/SankeyFlujoResiduos'
import { HojaRuta } from '@/components/simulator/HojaRuta'
import { ExportadorReporte } from '@/components/simulator/ExportadorReporte'
import { DashboardKPIs } from '@/components/simulator/DashboardKPIs'
import { AlertasPanel } from '@/components/simulator/AlertasPanel'
import { GovernancePanel } from '@/components/simulator/GovernancePanel'
import { InspeccionForm } from '@/components/simulator/InspeccionForm'
import { LaunchChecklist } from '@/components/simulator/LaunchChecklist'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { GenerarPlanModal } from '@/components/simulator/GenerarPlanModal'
import { GeneraPlanConfirmModal } from '@/components/simulator/GeneraPlanConfirmModal'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { PlanGlobalControlsBar } from '@/components/simulator/PlanGlobalControlsBar'
import { FuncionariosViviendaRsuModel } from '@/components/simulator/FuncionariosViviendaRsuModel'
import { PropuestasSimulatorBar } from '@/components/simulator/PropuestasSimulatorBar'
import { ReferenciasCalculos } from '@/components/simulator/ReferenciasCalculos'
import { SocialDemographicContextPanel } from '@/components/simulator/SocialDemographicContextPanel'
import { ImpactoFinanciero } from '@/components/simulator/ImpactoFinanciero'
import { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import type { Audience, DecisionModule } from '@/types'
import { isCircularityBaselineReadyForUi } from '@/lib/baselinePresentation'
import {
  aplicarSustitucionesTerritorio,
  getEtiquetaNarrativaCiudad,
} from '@/lib/municipioMadurezContexto'

const FutureGoalsModule = dynamic(
  () =>
    import('@/components/simulator/FutureGoalsModule')
      .then(m => ({ default: m.FutureGoalsModule }))
      .catch(() => ({
        default: function FutureGoalsLoadFailed() {
          return (
            <p className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-[12px] text-red-800">
              No se pudo cargar el módulo Metas futuras. Recarga la página (Cmd+Shift+R) e inténtalo de nuevo.
            </p>
          )
        },
      })),
  { ssr: false, loading: () => <p className="text-[12px] text-[#6B6760]">Preparando Metas futuras…</p> },
)

const SOURCE_TRACEABILITY_MODULE: DecisionModule = {
  module_id: 'source_traceability',
  label: 'Bibliografía y cálculos',
  audience_mode: 'city_team',
  decision: 'Verificar qué afirmación sostiene cada número del simulador.',
  evidence: 'Matriz de trazabilidad de fuentes, fórmulas, estado de verificación y acción correctiva.',
  status: 'ready',
  next_action: 'Cerrar pendientes de fuente antes de usar el escenario como soporte público formal.',
}

const FUNCTIONARY_MODULE_LABELS: Record<string, Pick<DecisionModule, 'label' | 'decision' | 'evidence' | 'next_action'>> = {
  city_baseline: {
    label: 'Problema y resumen ejecutivo',
    decision: 'Entender el costo municipal, sanitario y económico de no separar antes de plantear metas.',
    evidence: 'RSU activo, salud pública, derrama por valorización y supuestos editables del escenario.',
    next_action: 'Ajustar vivienda, generación, precios y costo de disposición antes de revisar marco jurídico.',
  },
  municipal_context: {
    label: 'Contexto sociodemográfico y marco legal municipal',
    decision:
      'Integrar lectura sociodemográfica de referencia (KPIs con trazabilidad, sin acto jurídico) con el marco jurídico local: qué puede ejecutarse con reglamento vigente y qué requiere reforma.',
    evidence:
      'Panel de contexto social, indicadores versionados, diagnóstico legal por municipio y fuentes localizadas.',
    next_action:
      'Revisar alcance geográfico y advertencias antes de citar cifras; validar fuente municipal competente antes de sanciones o documentos oficiales.',
  },
  future_goals: {
    label: 'Metas futuras / Gantt-PERT',
    decision: 'Convertir metas de circularidad en ruta temporal, dependencias y brechas de capacidad.',
    evidence: 'Horizonte, curva de captura, calendario y dependencia territorial de implementación.',
    next_action: 'Confirmar compatibilidad entre metas, capacidad e infraestructura por trimestre.',
  },
  infrastructure_operations: {
    label: 'Infraestructura en espacio-tiempo',
    decision: 'Definir qué infraestructura se crea, dónde, cuándo y con qué capacidad operativa.',
    evidence: 'Zonas, rutas, centros de acopio, bitácora PER y flujo material conectado al territorio.',
    next_action: 'Validar responsables, rutas, evidencia operativa y capacidad instalada.',
  },
  inspeccion_predios: {
    label: 'Inspección de predios / estrategia administrativa',
    decision: 'Separar educación, visita técnica, evidencia e inspección sin presentar sanciones firmes.',
    evidence: 'Bitácora, actor responsable, predio/ruta y evidencia requerida por el flujo operativo.',
    next_action: 'Usar la evidencia para mejorar cumplimiento y preparar revisión jurídica municipal.',
  },
  scenarios_export: {
    label: 'Escenarios, derrama y salida',
    decision: 'Comparar derrama base, sensibilidad financiera y salida ejecutiva sin carácter oficial.',
    evidence: 'Monte Carlo, waterfall, tornado, KPIs, supuestos, exportables y advertencias de validación pendientes.',
    next_action: 'Revisar matriz de fuentes antes de presentar cifras en sesión pública.',
  },
}

function enrichFunctionaryModules(modules: DecisionModule[]) {
  return modules.map(module => {
    const copy = FUNCTIONARY_MODULE_LABELS[module.module_id]
    return copy ? { ...module, ...copy } : module
  })
}

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

  useEffect(() => { recalcular() }, [recalcular])
  // Fase 22: ya NO auto-seleccionamos audiencia. El gateway debe ser explícito.
  useEffect(() => {
    if (!audience) return
    void fetchCityPortalData(zmActiva)
  }, [audience, fetchCityPortalData, zmActiva])

  const isOrganizationJourney = portalEntry === 'organization'
  const baselineValid = isCircularityBaselineReadyForUi(circularityBaseline, zmActiva)
  const portalJourneyWithTraceability = useMemo(() => {
    if (audience !== 'functionary') return portalJourney
    const enriched = enrichFunctionaryModules(portalJourney)
    if (enriched.some(module => module.module_id === SOURCE_TRACEABILITY_MODULE.module_id)) return enriched
    return [...enriched, SOURCE_TRACEABILITY_MODULE]
  }, [audience, portalJourney])

  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const sociodemographicBlock = useMemo(
    () => buildSociodemographicScaffoldBlock(municipiosActivos),
    [municipiosActivos],
  )

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
    <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
      <Header />
      <div className="mx-auto w-full max-w-[min(96rem,calc(100vw-1.5rem))]">
        <SimulatorSimulationRibbon />
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-[min(96rem,calc(100vw-1.5rem))] mx-auto w-full">

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
            <>
              {audience === 'functionary' && (
                <>
                  <PropuestasSimulatorBar />
                  {activeDecisionModuleId !== 'municipal_context' && <FuncionariosViviendaRsuModel />}
                </>
              )}
              <DecisionModuleShell
                modules={portalJourneyWithTraceability}
                loading={portalJourneyLoading}
                error={portalError}
                audience={portalEntry}
                renderModule={module =>
                  renderDecisionModule(module, isOrganizationJourney, audience, sociodemographicBlock)
                }
              />
            </>
          )}

        </main>
      </div>

      <GeneraPlanConfirmModal />
      <GenerarPlanModal />
    </div>
  )
}

function renderDecisionModule(
  module: DecisionModule,
  isOrganizationJourney: boolean,
  audience: Audience | null,
  sociodemographicBlock: ReturnType<typeof buildSociodemographicScaffoldBlock>,
) {
  // Empresario — journey organization
  if (isOrganizationJourney || audience === 'entrepreneur') {
    switch (module.module_id) {
      case 'organization_profile':
        return (
          <>
            <DeclaracionWizard />
          </>
        )
      case 'containers_provider':
        return (
          <section className="section rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-4">
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Logística y contenedores</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
              La ubicación de contenedores y rutas internas se resuelve con el checklist del módulo de plan por giro y con el
              borrador exportable; aquí no se abre un configurator adicional.
            </p>
          </section>
        )
      case 'market_traceability':
        return <PortalEmpresarial />
      case 'organization_report':
        return <ExportarSection />
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
          </>
        )
      case 'municipal_context':
        return (
          <>
            <SocialDemographicContextPanel block={sociodemographicBlock} moduleAnchor={module.module_id} />
            <MarcoLegal mode="citizen" />
            <CoberturaNacional />
          </>
        )
      case 'citizen_inputs':
        return (
          <>
            <EducacionCiudadana />
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
          <SectionHero />
          <div className="grid gap-5">
            <ImpactoAmbiental />
            <MultiplicadoresEco />
          </div>
        </div>
      )
    case 'municipal_context':
      return (
        <>
          <SocialDemographicContextPanel block={sociodemographicBlock} moduleAnchor={module.module_id} />
          <MarcoLegal mode="functionary" />
          <CoberturaNacional />
        </>
      )
    case 'future_goals':
      return <FutureGoalsModule notice={<MetasPlanDerivadasNotice />} />
    case 'infrastructure_operations':
      return (
        <>
          <CentrosAcopio />
          <Logistica />
          <OperacionPERBitacora />
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
          <ImpactoFinanciero />
          <ExportarSection />
          <ExportadorReporte />
          <DashboardKPIs />
          <AlertasPanel />
          <GovernancePanel />
          <LaunchChecklist />
        </>
      )
    case 'source_traceability':
      return <ReferenciasCalculos />
    default:
      return <ModuleEmpty module={module} />
  }
}

function MetasPlanDerivadasNotice() {
  return (
    <section className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">Metas del plan</p>
      <h2 className="font-serif text-[22px] text-[#1C1B18]">Trayectoria materializada automáticamente</h2>
      <ScopeAnclaKicker className="mt-2" />
      <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
        La ruta de captura anual, el despliegue de centros de acopio y los insumos financieros siguen el preset{' '}
        <span className="font-medium text-[#1C1B18]">Realista</span> del catálogo ALQUIMIA. Solo edita, en la franja global
        superior, municipio, horizonte temporal y generación per cápita; el resto del simulador permanece en modo lectura operativa.
      </p>
    </section>
  )
}

function ModuleEmpty({ module }: { module: DecisionModule }) {
  return (
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white px-4 py-4">
      <p className="text-[12px] font-semibold text-[#1C1B18]">Sin herramienta conectada para este paso del recorrido.</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{module.next_action}</p>
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
