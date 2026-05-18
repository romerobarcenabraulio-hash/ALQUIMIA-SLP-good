'use client'

import dynamic from 'next/dynamic'
import type { ReactNode } from 'react'
import { SectionHero } from '@/components/simulator/SectionHero'
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
import { InspeccionForm } from '@/components/simulator/InspeccionForm'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { ScenariosExportStack } from '@/components/simulator/stacks/ScenariosExportStack'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { ReferenciasCalculos } from '@/components/simulator/ReferenciasCalculos'
import { SocialDemographicContextPanel } from '@/components/simulator/SocialDemographicContextPanel'
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
        return <SectionHero />
      case 'municipal_context':
        return (
          <>
            <SocialDemographicContextPanel block={sociodemographicBlock} moduleAnchor={module.module_id} />
            <MarcoLegal mode="citizen" />
            <CoberturaNacional />
          </>
        )
      case 'citizen_inputs':
        return <EducacionCiudadana />
      case 'impact_finance':
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
    case 'market_traceability':
      return <ReasoningGraphPanel />
    case 'inspeccion_predios':
      return <InspeccionForm />
    case 'scenarios_export':
      return <ScenariosExportStack />
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
