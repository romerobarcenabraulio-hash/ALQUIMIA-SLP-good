'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { CityBaselineStack } from '@/components/simulator/stacks/CityBaselineStack'
import { EducacionCiudadana } from '@/components/simulator/EducacionCiudadana'
import { DeclaracionWizard } from '@/components/simulator/DeclaracionWizard'
import { PortalEmpresarial } from '@/components/simulator/PortalEmpresarial'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { ScenariosExportStack } from '@/components/simulator/stacks/ScenariosExportStack'
import { ReferenciasCalculos } from '@/components/simulator/ReferenciasCalculos'
import { SocialDemographicContextPanel } from '@/components/simulator/SocialDemographicContextPanel'
import { MunicipalContextStack } from '@/components/simulator/stacks/MunicipalContextStack'
import { InfrastructureOperationsStack } from '@/components/simulator/stacks/InfrastructureOperationsStack'
import { MarketTraceabilityStack } from '@/components/simulator/stacks/MarketTraceabilityStack'
import { InspeccionStack } from '@/components/simulator/stacks/InspeccionStack'
import type { DecisionModule } from '@/types'
import type { DecisionModuleRenderContext } from '@/lib/simulator/decisionModuleRenderContext'
import { moduleNumber, resolveModuleId } from '@/lib/chapterConfig'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ImpactoAmbientalStack } from '@/components/simulator/stacks/ImpactoAmbientalStack'
import { AntecedentesMunicipalesStack } from '@/components/simulator/stacks/AntecedentesMunicipalesStack'
import { CapacidadInstitucionalStack } from '@/components/simulator/stacks/CapacidadInstitucionalStack'
import { EvaluacionSocioeconomicaStack } from '@/components/simulator/stacks/EvaluacionSocioeconomicaStack'
import { TeoriaCambioStack } from '@/components/simulator/stacks/TeoriaCambioStack'
import { PlanEducativoStack } from '@/components/simulator/stacks/PlanEducativoStack'
import { OrganigramaDiagnosticoStack } from '@/components/simulator/stacks/OrganigramaDiagnosticoStack'
import ProyectoVivoPortal from '@/components/simulator/ProyectoVivoPortal'

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

const GuiaCircularidadStack = dynamic(
  () =>
    import('@/components/simulator/stacks/GuiaCircularidadStack').then(m => ({ default: m.GuiaCircularidadStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando la guía de circularidad…</p>,
  },
)

const ImplementacionEspacioTiempo = dynamic(
  () =>
    import('@/components/simulator/ImplementacionEspacioTiempo').then(m => ({
      default: m.ImplementacionEspacioTiempo,
    })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando oleadas territoriales…</p>,
  },
)

const ProgresionPlanMunicipalTiempo = dynamic(
  () =>
    import('@/components/simulator/ProgresionPlanMunicipalTiempo').then(m => ({
      default: m.ProgresionPlanMunicipalTiempo,
    })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando progresión mes a mes…</p>,
  },
)

const LogisticaOperativaStack = dynamic(
  () =>
    import('@/components/simulator/stacks/LogisticaOperativaStack').then(m => ({ default: m.LogisticaOperativaStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando logística operativa…</p>,
  },
)

const CostosProgramaStack = dynamic(
  () =>
    import('@/components/simulator/stacks/CostosProgramaStack').then(m => ({ default: m.CostosProgramaStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#5F6B5F]">Preparando costos del programa…</p>,
  },
)

const MonitoreoRealStack = dynamic(
  () =>
    import('@/components/simulator/stacks/MonitoreoRealStack').then(m => ({ default: m.MonitoreoRealStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#5F6B5F]">Preparando monitoreo…</p>,
  },
)

const EsquemaConcesionPanel = dynamic(
  () =>
    import('@/components/simulator/stacks/EsquemaConcesionStack').then(m => ({ default: m.EsquemaConcesionStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando esquema de concesión…</p>,
  },
)

const DobleMaterialidadStack = dynamic(
  () =>
    import('@/components/simulator/stacks/DobleMaterialidadStack').then(m => ({ default: m.DobleMaterialidadStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando análisis de doble materialidad…</p>,
  },
)

const OrganigramaStack = dynamic(
  () =>
    import('@/components/simulator/stacks/OrganigramaStack').then(m => ({ default: m.OrganigramaStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando organigrama del programa…</p>,
  },
)

const CostoOmisionStack = dynamic(
  () =>
    import('@/components/simulator/stacks/CostoOmisionStack').then(m => ({ default: m.CostoOmisionStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando análisis contrafactual…</p>,
  },
)

const ArbolFinanciamientoStack = dynamic(
  () =>
    import('@/components/simulator/stacks/ArbolFinanciamientoStack').then(m => ({ default: m.ArbolFinanciamientoStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando árbol de financiamiento…</p>,
  },
)

const ExpedienteCabildoStack = dynamic(
  () =>
    import('@/components/simulator/stacks/ExpedienteCabildoStack').then(m => ({ default: m.ExpedienteCabildoStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando expediente de Cabildo…</p>,
  },
)

const DictamenTecnicoStack = dynamic(
  () =>
    import('@/components/simulator/stacks/DictamenTecnicoStack').then(m => ({ default: m.DictamenTecnicoStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando dictamen técnico y social…</p>,
  },
)

const KronosRoadmapStack = dynamic(
  () =>
    import('@/components/simulator/stacks/KronosRoadmapStack').then(m => ({
      default: m.KronosRoadmapStack,
    })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando roadmap de implementación…</p>,
  },
)

const KronosEvmDashboardStack = dynamic(
  () =>
    import('@/components/simulator/stacks/KronosEvmDashboardStack').then(m => ({
      default: m.KronosEvmDashboardStack,
    })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando EVM dashboard…</p>,
  },
)

const KronosConciliacionStack = dynamic(
  () =>
    import('@/components/simulator/stacks/KronosConciliacionStack').then(m => ({
      default: m.KronosConciliacionStack,
    })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando conciliación…</p>,
  },
)

const KronosRiskDashboardStack = dynamic(
  () =>
    import('@/components/simulator/stacks/KronosRiskDashboardStack').then(m => ({
      default: m.KronosRiskDashboardStack,
    })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando registro de riesgos…</p>,
  },
)

const KronosGateStatusStack = dynamic(
  () =>
    import('@/components/simulator/stacks/KronosGateStatusStack').then(m => ({
      default: m.KronosGateStatusStack,
    })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando estado de gates…</p>,
  },
)

export function renderDecisionModule(ctx: DecisionModuleRenderContext): ReactNode {
  const { module, audience, isOrganizationJourney, sociodemographicBlock, onNavigate } = ctx

  if (isOrganizationJourney || audience === 'entrepreneur') {
    switch (module.module_id) {
      case 'organization_profile':
        return <DeclaracionWizard />
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

  if (audience === 'citizen') {
    switch (module.module_id) {
      case 'city_baseline':
        return <CityBaselineStack />
      case 'marco_legal':
        return <MunicipalContextStack block={sociodemographicBlock} moduleAnchor={module.module_id} view="diagnostico" />
      case 'citizen_inputs':
        return <EducacionCiudadana />
      case 'impact_finance':
        return <CityBaselineStack />
      default:
        return <ModuleEmpty module={module} />
    }
  }

  const moduleId = resolveModuleId(module.module_id)

  switch (moduleId) {
    case 'guia_circularidad':
      return <GuiaCircularidadStack onNavigate={onNavigate} />
    case 'antecedentes_municipales':
      return <AntecedentesMunicipalesStack />
    case 'city_baseline':
      return <CityBaselineStack />
    case 'impacto_ambiental':
      return <ImpactoAmbientalStack />
    case 'social_diagnostico':
      return <SocialDemographicContextPanel block={sociodemographicBlock} moduleAnchor={module.module_id} view="diagnostico" />
    case 'social_encuesta':
      return <SocialDemographicContextPanel block={sociodemographicBlock} moduleAnchor={module.module_id} view="encuesta" />
    case 'mapeo_actores':
      return <MapeoActoresBridge />
    case 'organigrama_diagnostico':
      return <OrganigramaDiagnosticoStack />
    case 'capacidad_institucional':
      return <CapacidadInstitucionalStack />
    case 'marco_legal':
      return <MunicipalContextStack block={sociodemographicBlock} moduleAnchor={module.module_id} view="diagnostico" />
    case 'cobertura_territorial':
      return <MunicipalContextStack block={sociodemographicBlock} moduleAnchor={module.module_id} view="cobertura" />
    case 'dictamen_tecnico':
      return <DictamenTecnicoStack />
    case 'costo_omision':
      return <CostoOmisionStack />
    case 'evaluacion_socioeconomica':
      return <EvaluacionSocioeconomicaStack />
    case 'teoria_cambio':
      return <TeoriaCambioStack />
    case 'roadmap_implementacion':
      return <KronosRoadmapStack />
    case 'plan_maestro':
      return <FutureGoalsModule notice={<M03Notice />} pageOnly={1} />
    case 'ruta_critica':
      return <FutureGoalsModule notice={<M03Notice />} pageOnly={2} />
    case 'oleadas_territoriales':
      return (
        <div className="space-y-10">
          <ImplementacionEspacioTiempo />
          <div className="border-t border-[#E8E4DC] pt-8">
            <ProgresionPlanMunicipalTiempo />
          </div>
        </div>
      )
    case 'infraestructura':
      return <InfrastructureOperationsStack />
    case 'organigrama':
      return <OrganigramaStack />
    case 'logistica':
      return <LogisticaOperativaStack />
    case 'plan_educativo':
      return <PlanEducativoStack />
    case 'costos_programa':
      return <CostosProgramaStack />
    case 'mercado_materiales':
      return <MarketTraceabilityStack pageOnly={2} />
    case 'esquema_concesion':
      return <EsquemaConcesionPanel />
    case 'arbol_financiamiento':
      return <ArbolFinanciamientoStack />
    case 'escenarios_financieros':
      return <ScenariosExportStack />
    case 'riesgos_modelo':
      return <MarketTraceabilityStack pageOnly={1} />
    case 'expediente_cabildo':
      return <ExpedienteCabildoStack />
    case 'inspeccion':
      return <InspeccionStack />
    case 'monitoreo_operativo':
      return <MonitoreoRealStack />
    case 'doble_materialidad':
      return <DobleMaterialidadStack />
    case 'trazabilidad':
      return (
        <div className="space-y-8">
          <ReferenciasCalculos />
          <CierreSimulador onNavigate={onNavigate} />
        </div>
      )
    case 'evm_dashboard':
      return <KronosEvmDashboardStack />
    case 'conciliacion_mensual':
      return <KronosConciliacionStack />
    case 'risk_dashboard':
      return <KronosRiskDashboardStack />
    case 'gate_status':
      return <KronosGateStatusStack />
    default:
      return <ModuleEmpty module={module} />
  }
}

function MapeoActoresBridge() {
  const { municipiosActivos, zmActiva } = useSimulatorStore()
  const munId = municipiosActivos[0] ?? zmActiva?.toLowerCase() ?? 'slp'
  return <ProyectoVivoPortal proyectoId={`sim-${munId}`} municipioId={munId} />
}

function M03Notice() {
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-1">
        Metas futuras · Gantt · PERT · RACI
      </p>
      <p className="text-[14px] font-semibold text-[#1C1B18] mb-1">
        Hoja de ruta de implementación municipal
      </p>
      <p className="text-[12px] leading-relaxed text-[#6B6760]">
        Despliegue secuenciado de centros de acopio, oleadas territoriales y responsables
        institucionales. Los plazos y costos se generan a partir del escenario activo
        en el simulador.
      </p>
    </div>
  )
}

function ModuleEmpty({ module }: { module: DecisionModule }) {
  return (
    <div className="rounded-[10px] border border-dashed border-[#E8E4DC] bg-[#FAFAF8] px-5 py-5">
      <p className="text-[13px] font-semibold text-[#1C1B18]">Módulo pendiente de conexión</p>
      <p className="mt-2 text-[12px] leading-relaxed text-[#6B6760]">
        Este paso del recorrido (<span className="font-mono text-[11px]">{module.module_id}</span>) aún no tiene
        herramienta activa en el simulador. Puede deberse a una audiencia distinta o a un módulo en despliegue.
      </p>
      <p className="mt-3 text-[11px] text-[#A8A49C]">Siguiente acción sugerida: {module.next_action}</p>
    </div>
  )
}

function CierreSimulador({ onNavigate }: { onNavigate?: (id: string) => void }) {
  return (
    <section
      className="rounded-[14px] border border-[#C9DDB1] bg-gradient-to-br from-[#1C2B15] to-[#2D4A1A] text-white p-8 text-center relative overflow-hidden"
      aria-label="Cierre del análisis"
    >
      <div className="absolute inset-0 opacity-5 flex items-center justify-center pointer-events-none select-none">
        <span className="font-serif text-[200px] leading-none">✓</span>
      </div>
      <div className="relative z-10">
        <span className="inline-block px-3 py-1 rounded-full bg-white/15 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#A8D78A] mb-4">
          Análisis completo · M{moduleNumber('trazabilidad')} de {moduleNumber('trazabilidad')}
        </span>
        <h2 className="font-serif text-[24px] font-bold mb-3">
          Has recorrido el argumento completo
        </h2>
        <p className="text-[14px] leading-[1.75] text-white/85 max-w-2xl mx-auto mb-6">
          Diagnóstico, planificación, modelo de negocio y control — los 4 capítulos del método consultivo están
          completos. Cada cifra de este análisis tiene fuente, fórmula y nivel de certeza documentados.
          El próximo paso es exportar el Informe Maestro y llevarlo a sesión de cabildo.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('expediente_cabildo')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-white text-[#1C2B15] text-[13px] font-semibold hover:bg-[#F1F8EC] transition-colors"
            >
              Exportar escenarios financieros →
            </button>
          )}
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('guia_circularidad')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] border border-white/30 text-white text-[13px] hover:bg-white/10 transition-colors"
            >
              Volver al inicio
            </button>
          )}
        </div>
        <p className="mt-5 text-[11px] text-white/50">
          Plataforma ALQUIMIA · Residuos Sólidos Urbanos · Análisis prospectivo — no dictamen oficial
        </p>
      </div>
    </section>
  )
}
