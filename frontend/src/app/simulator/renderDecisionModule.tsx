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

const ReasoningGraphPanel = dynamic(
  () => import('@/components/simulator/ReasoningGraphPanel'),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Cargando panel de causalidad…</p>,
  },
)

const RiskTrendsPanel = dynamic(
  () =>
    import('@/components/simulator/RiskTrendsPanel').then(m => ({ default: m.RiskTrendsPanel })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando riesgos y tendencias…</p>,
  },
)

const GuiaCircularidadStack = dynamic(
  () =>
    import('@/components/simulator/stacks/GuiaCircularidadStack').then(m => ({ default: m.GuiaCircularidadStack })),
  {
    ssr: false,
    loading: () => <p className="text-[12px] text-[#6B6760]">Preparando la guía de circularidad…</p>,
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
      case 'municipal_context':
        return <MunicipalContextStack block={sociodemographicBlock} moduleAnchor={module.module_id} />
      case 'citizen_inputs':
        return <EducacionCiudadana />
      case 'impact_finance':
        return <CityBaselineStack />
      default:
        return <ModuleEmpty module={module} />
    }
  }

  switch (module.module_id) {
    case 'guia_circularidad':
      return <GuiaCircularidadStack onNavigate={onNavigate} />
    case 'city_baseline':
      return <CityBaselineStack />
    case 'municipal_context':
      return <MunicipalContextStack block={sociodemographicBlock} moduleAnchor={module.module_id} />
    case 'social_study':
      return <SocialDemographicContextPanel block={sociodemographicBlock} moduleAnchor={module.module_id} />
    case 'future_goals':
      return <FutureGoalsModule notice={<M03Notice />} />
    case 'infrastructure_operations':
      return <InfrastructureOperationsStack />
    case 'market_traceability':
      return <MarketTraceabilityStack />
    case 'risk_trends':
      return <RiskTrendsPanel />
    case 'logistica_operativa':
      return <LogisticaOperativaStack />
    case 'costos_programa':
      return <CostosProgramaStack />
    case 'monitoreo_real':
      return <MonitoreoRealStack />
    case 'esquema_concesion':
      return <EsquemaConcesionPanel />
    case 'doble_materialidad':
      return <DobleMaterialidadStack />
    case 'inspeccion_predios':
      return <InspeccionStack />
    case 'scenarios_export':
      return <ScenariosExportStack />
    case 'organigrama_programa':
      return <OrganigramaStack />
    case 'costo_omision':
      return <CostoOmisionStack />
    case 'arbol_financiamiento':
      return <ArbolFinanciamientoStack />
    case 'expediente_cabildo':
      return <ExpedienteCabildoStack />
    case 'source_traceability':
      return (
        <div className="space-y-8">
          <ReferenciasCalculos />
          <CierreSimulador onNavigate={onNavigate} />
        </div>
      )
    default:
      return <ModuleEmpty module={module} />
  }
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
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white px-4 py-4">
      <p className="text-[12px] font-semibold text-[#1C1B18]">Sin herramienta conectada para este paso del recorrido.</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{module.next_action}</p>
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
          Análisis completo · M15 de 15
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
              onClick={() => onNavigate('scenarios_export')}
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
          ALQUIMIA Platform · Residuos Sólidos Urbanos · Análisis prospectivo — no dictamen oficial
        </p>
      </div>
    </section>
  )
}
