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
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { ReferenciasCalculos } from '@/components/simulator/ReferenciasCalculos'
import { SocialDemographicContextPanel } from '@/components/simulator/SocialDemographicContextPanel'
import { MunicipalContextStack } from '@/components/simulator/stacks/MunicipalContextStack'
import { InfrastructureOperationsStack } from '@/components/simulator/stacks/InfrastructureOperationsStack'
import { MarketTraceabilityStack } from '@/components/simulator/stacks/MarketTraceabilityStack'
import { InspeccionStack } from '@/components/simulator/stacks/InspeccionStack'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_CA } from '@/lib/constants'
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
    case 'city_baseline':
      return <CityBaselineStack />
    case 'municipal_context':
      return <MunicipalContextStack block={sociodemographicBlock} moduleAnchor={module.module_id} />
    case 'social_study':
      return <SocialDemographicContextPanel block={sociodemographicBlock} moduleAnchor={module.module_id} />
    case 'future_goals':
      return <FutureGoalsModule notice={<MetasPlanDerivadasNotice />} />
    case 'infrastructure_operations':
      return <InfrastructureOperationsStack />
    case 'market_traceability':
      return <MarketTraceabilityStack />
    case 'risk_trends':
      return <RiskTrendsPanel />
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

function MetasPlanDerivadasNotice() {
  const { resultados, horizonte, municipiosActivos, seleccionMunicipioCatalog } = useSimulatorStore()
  const r = resultados
  const municipioLabel = seleccionMunicipioCatalog?.nombre ?? municipiosActivos[0] ?? '—'

  return (
    <section className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { label: 'Municipio activo',       value: municipioLabel,                                               color: '#1C1B18' },
          { label: 'Horizonte del plan',      value: `${horizonte} años`,                                         color: '#3B6D11' },
          { label: 'Cobertura objetivo',      value: '90%',                                                       color: '#3B6D11' },
          { label: 'Empleo al cierre',        value: r ? `${r.empleosTotalesDirectos.toFixed(0)} puestos` : '—', color: '#5A4A2A' },
          { label: 'Derrama proyectada',      value: r ? `${(r.ingresosBrutos / 1e6).toFixed(1)} M MXN` : '—',  color: '#1A5FA8' },
        ].map(item => (
          <div key={item.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none mb-1">{item.label}</p>
            <p className="font-mono text-[13px] font-semibold" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Header card */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-1">Metas futuras / Gantt-PERT</p>
        <h2 className="font-serif text-[22px] text-[#1C1B18] mb-2">Trayectoria materializada automáticamente</h2>
        <ScopeAnclaKicker className="mb-3 text-[11px]" />
        <p className="text-[13px] leading-relaxed text-[#6B6760] mb-4">
          La ruta de captura anual, el despliegue de centros de acopio y los insumos financieros siguen el preset{' '}
          <span className="font-medium text-[#1C1B18]">Realista</span> del catálogo ALQUIMIA. Solo edita municipio,
          horizonte temporal y generación per cápita en los controles globales; el resto permanece en modo lectura operativa.
        </p>

        {/* Phase overview timeline */}
        <div className="border-t border-[#F0EDE5] pt-4">
          <p className="text-[10px] text-[#A8A49C] uppercase tracking-[0.06em] mb-3">Línea de tiempo de fases</p>
          <div className="flex flex-wrap gap-2">
            {FASES_CA.slice(0, 5).map((f, i) => {
              const colors = ['#C8E6A4', '#A5C97A', '#7DA84A', '#5A8C2C', '#3B6D11']
              return (
                <div key={f.fase} className="flex items-center gap-1.5 rounded-[7px] border border-[#E8E4DC] bg-white px-3 py-2 text-[10px]">
                  <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: colors[i] ?? '#3B6D11' }} />
                  <span className="font-semibold text-[#1C1B18]">F{f.fase}</span>
                  <span className="text-[#6B6760]">{f.nombre}</span>
                  <span className="font-mono text-[#A8A49C]">{f.coberturaPct}%</span>
                  {f.esOptimo && <span className="text-[#3B6D11] font-bold text-[9px]">★</span>}
                </div>
              )
            })}
          </div>
        </div>
      </div>
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
