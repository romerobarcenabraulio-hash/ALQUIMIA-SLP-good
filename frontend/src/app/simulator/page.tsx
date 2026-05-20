'use client'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { SIMULATION_BANNER_BODY, SIMULATION_BANNER_TITLE } from '@/lib/simulationDisclaimer'
import { cn } from '@/lib/utils'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { AudienceGateway } from '@/components/simulator/AudienceGateway'
import { DecisionModuleShell, ModuleNav } from '@/components/simulator/DecisionModuleShell'
import { PlanGlobalControlsBar } from '@/components/simulator/PlanGlobalControlsBar'
import { FuncionariosViviendaRsuModel } from '@/components/simulator/FuncionariosViviendaRsuModel'
import { PropuestasSimulatorBar } from '@/components/simulator/PropuestasSimulatorBar'
import { GenerarPlanModal } from '@/components/simulator/GenerarPlanModal'
import { GeneraPlanConfirmModal } from '@/components/simulator/GeneraPlanConfirmModal'
import { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import {
  enrichFunctionaryModules,
  SOURCE_TRACEABILITY_MODULE,
  SOCIAL_STUDY_MODULE,
  GUIA_CIRCULARIDAD_MODULE,
  LOGISTICA_MODULE,
  ESQUEMA_CONCESION_MODULE,
  DOBLE_MATERIALIDAD_MODULE,
  COSTOS_PROGRAMA_MODULE,
  MONITOREO_REAL_MODULE,
  COSTO_OMISION_MODULE,
  ORGANIGRAMA_MODULE,
  ARBOL_FINANCIAMIENTO_MODULE,
  EXPEDIENTE_CABILDO_MODULE,
} from '@/lib/simulator/functionaryJourneyEnrichment'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { renderDecisionModule } from '@/app/simulator/renderDecisionModule'

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
  const portalEntry = useSimulatorStore(s => s.portalEntry)
  const fetchCityPortalData = useSimulatorStore(s => s.fetchCityPortalData)
  const portalJourney = useSimulatorStore(s => s.portalJourney)
  const portalJourneyLoading = useSimulatorStore(s => s.portalJourneyLoading)
  const portalError = useSimulatorStore(s => s.portalError)
  const activeDecisionModuleId = useSimulatorStore(s => s.activeDecisionModuleId)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)

  useEffect(() => { recalcular() }, [recalcular])
  useEffect(() => {
    if (!audience) return
    void fetchCityPortalData(zmActiva)
  }, [audience, fetchCityPortalData, zmActiva])

  const isOrganizationJourney = portalEntry === 'organization'

  const portalJourneyWithTraceability = useMemo(() => {
    if (audience !== 'functionary') return portalJourney
    const enriched = enrichFunctionaryModules(portalJourney)

    // Inyectar módulos client-side que no vienen del backend
    let result = [...enriched]

    // guia_circularidad siempre como primer módulo (obligatorio)
    if (!result.some(m => m.module_id === 'guia_circularidad')) {
      result = [GUIA_CIRCULARIDAD_MODULE, ...result]
    }

    // social_study después de city_baseline (M01 → M02 social → M03 legal)
    if (!result.some(m => m.module_id === 'social_study')) {
      const idx = result.findIndex(m => m.module_id === 'city_baseline')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), SOCIAL_STUDY_MODULE, ...result.slice(idx + 1)]
        : [SOCIAL_STUDY_MODULE, ...result]
    }
    // costo_omision al final del Cap 1 — después de municipal_context (M04)
    if (!result.some(m => m.module_id === 'costo_omision')) {
      const idx = result.findIndex(m => m.module_id === 'municipal_context')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), COSTO_OMISION_MODULE, ...result.slice(idx + 1)]
        : [...result, COSTO_OMISION_MODULE]
    }
    // organigrama_programa después de infrastructure_operations (M07)
    if (!result.some(m => m.module_id === 'organigrama_programa')) {
      const idx = result.findIndex(m => m.module_id === 'infrastructure_operations')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), ORGANIGRAMA_MODULE, ...result.slice(idx + 1)]
        : [...result, ORGANIGRAMA_MODULE]
    }
    // logistica_operativa después de organigrama_programa (M08)
    if (!result.some(m => m.module_id === 'logistica_operativa')) {
      const idx = result.findIndex(m => m.module_id === 'organigrama_programa')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), LOGISTICA_MODULE, ...result.slice(idx + 1)]
        : [...result, LOGISTICA_MODULE]
    }
    // costos_programa después de logistica_operativa (M09)
    if (!result.some(m => m.module_id === 'costos_programa')) {
      const idx = result.findIndex(m => m.module_id === 'logistica_operativa')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), COSTOS_PROGRAMA_MODULE, ...result.slice(idx + 1)]
        : [...result, COSTOS_PROGRAMA_MODULE]
    }
    // esquema_concesion antes de scenarios_export (M11)
    if (!result.some(m => m.module_id === 'esquema_concesion')) {
      const idx = result.findIndex(m => m.module_id === 'scenarios_export')
      result = idx >= 0
        ? [...result.slice(0, idx), ESQUEMA_CONCESION_MODULE, ...result.slice(idx)]
        : [...result, ESQUEMA_CONCESION_MODULE]
    }
    // arbol_financiamiento después de scenarios_export (M13)
    if (!result.some(m => m.module_id === 'arbol_financiamiento')) {
      const idx = result.findIndex(m => m.module_id === 'scenarios_export')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), ARBOL_FINANCIAMIENTO_MODULE, ...result.slice(idx + 1)]
        : [...result, ARBOL_FINANCIAMIENTO_MODULE]
    }
    // expediente_cabildo al final del Cap 3 — después de risk_trends (M15)
    if (!result.some(m => m.module_id === 'expediente_cabildo')) {
      const idx = result.findIndex(m => m.module_id === 'risk_trends')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), EXPEDIENTE_CABILDO_MODULE, ...result.slice(idx + 1)]
        : [...result, EXPEDIENTE_CABILDO_MODULE]
    }
    // monitoreo_real después de inspeccion_predios (M17)
    if (!result.some(m => m.module_id === 'monitoreo_real')) {
      const idx = result.findIndex(m => m.module_id === 'inspeccion_predios')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), MONITOREO_REAL_MODULE, ...result.slice(idx + 1)]
        : [...result, MONITOREO_REAL_MODULE]
    }
    // doble_materialidad después de monitoreo_real (M18)
    if (!result.some(m => m.module_id === 'doble_materialidad')) {
      const idx = result.findIndex(m => m.module_id === 'monitoreo_real')
      result = idx >= 0
        ? [...result.slice(0, idx + 1), DOBLE_MATERIALIDAD_MODULE, ...result.slice(idx + 1)]
        : [...result, DOBLE_MATERIALIDAD_MODULE]
    }
    // source_traceability siempre al final (M19)
    if (!result.some(m => m.module_id === 'source_traceability')) {
      result = [...result, SOURCE_TRACEABILITY_MODULE]
    }
    return result
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

  const moduleNav = filteredModules.length > 0 && !portalJourneyLoading ? (
    <ModuleNav
      modules={filteredModules}
      activeId={activeModuleId ?? ''}
      onChange={setActiveModuleId}
      theme="dark"
    />
  ) : undefined

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#F4F2ED' }}>
      <Sidebar moduleSection={moduleNav} />

      {/* Right: header + compact ribbon + scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />

        {/* Compact disclaimer ribbon — always visible, outside scroll */}
        <SimulatorSimulationRibbon />

        {/* Scrollable content — full width, moderate padding */}
        <div className="flex-1 overflow-y-auto">
          <main className="px-4 sm:px-6 py-4 w-full">
            {audience === 'citizen' && <PlanGlobalControlsBar />}

            <div className="mt-3 space-y-3">
              {audience === 'functionary' && <PropuestasSimulatorBar />}
              <div className="rounded-[12px] border border-[#E8E4DC] overflow-hidden shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
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
              </div>
            </div>
          </main>
        </div>
      </div>

      <GeneraPlanConfirmModal />
      <GenerarPlanModal />
    </div>
  )
}

