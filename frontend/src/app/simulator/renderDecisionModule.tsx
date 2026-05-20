'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { CityBaselineStack } from '@/components/simulator/stacks/CityBaselineStack'
import { MarcoLegal } from '@/components/simulator/MarcoLegal'
import { EducacionCiudadana } from '@/components/simulator/EducacionCiudadana'
import { CentrosAcopio } from '@/components/simulator/CentrosAcopio'
import { Logistica } from '@/components/simulator/Logistica'
import { DeclaracionWizard } from '@/components/simulator/DeclaracionWizard'
import CoberturaNacional from '@/components/simulator/CoberturaNacional'
import { OperacionPERBitacora } from '@/components/simulator/OperacionPERBitacora'
import { PortalEmpresarial } from '@/components/simulator/PortalEmpresarial'
import { FlujosResiduos } from '@/components/simulator/FlujosResiduos'
import { SankeyFlujoResiduos } from '@/components/simulator/SankeyFlujoResiduos'
import { HojaRuta } from '@/components/simulator/HojaRuta'
import { InspeccionForm } from '@/components/simulator/InspeccionForm'
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

export function renderDecisionModule(ctx: DecisionModuleRenderContext): ReactNode {
  const { module, audience, isOrganizationJourney, sociodemographicBlock } = ctx

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
      return <GuiaCircularidadStack />
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
    case 'source_traceability':
      return <ReferenciasCalculos />
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
