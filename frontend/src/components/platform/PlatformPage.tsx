'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { DecisionModuleShell, ModuleNav } from '@/components/simulator/DecisionModuleShell'
import { GeneraPlanConfirmModal } from '@/components/simulator/GeneraPlanConfirmModal'
import { GenerarPlanModal } from '@/components/simulator/GenerarPlanModal'
import { PlatformStageBadge } from '@/components/platform/PlatformStageBadge'
import { renderDecisionModule } from '@/app/simulator/renderDecisionModule'
import { useSimulatorStore } from '@/store/simulatorStore'
import { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import { enrichFunctionaryModules } from '@/lib/simulator/functionaryJourneyEnrichment'
import { buildFunctionaryJourney } from '@/lib/simulator/clientModuleRegistry'
import { assertTenantPlatformAccess, fetchTenantState } from '@/lib/tenantStateClient'
import { MetricConfidencePill } from '@/components/MetricConfidencePill'
import { Watermark } from '@/components/Watermark'
import { DocumentGapBanner } from '@/components/DocumentGapBanner'
import { useTenantData } from '@/hooks/useTenantData'
import {
  filterModulesForPlatform,
  PLATFORM_LABEL_BY_STAGE,
  platformPathForStage,
  readOnlyModuleIds,
  type CapabilityRegistry,
  type ClientPlatformStage,
  type PlatformModule,
  type TenantStatePayload,
} from '@/lib/platformRouting'

const FALLBACK_TENANTS = new Set(['complete-city', 'partial-city', 'gap-city'])

function tenantIdFromBrowser(searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get('tenant_id') ?? searchParams.get('tenant')
  if (fromQuery) {
    localStorage.setItem('alquimia.tenantId', fromQuery)
    return fromQuery
  }
  return localStorage.getItem('alquimia.tenantId')
}

export function PlatformPage({ platformStage }: { platformStage: ClientPlatformStage }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const recalcular = useSimulatorStore(s => s.recalcular)
  const portalJourney = useSimulatorStore(s => s.portalJourney)
  const portalJourneyLoading = useSimulatorStore(s => s.portalJourneyLoading)
  const portalError = useSimulatorStore(s => s.portalError)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const portalEntry = useSimulatorStore(s => s.portalEntry)

  const [tenantState, setTenantState] = useState<TenantStatePayload | null>(null)
  const [registry, setRegistry] = useState<CapabilityRegistry | null>(null)
  const [accessError, setAccessError] = useState<string | null>(null)
  const [loadingTenant, setLoadingTenant] = useState(true)
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const tenantData = useTenantData(tenantId)
  const shellNavRef = useRef<{
    navigateModule: (id: string) => void
    openChapterCover: (chapterFirstModuleId: string) => void
  } | null>(null)

  useEffect(() => { recalcular() }, [recalcular])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingTenant(true)
      setAccessError(null)
      try {
        const tenantId = tenantIdFromBrowser(searchParams)
        if (!tenantId) throw new Error('No hay tenant activo. Abre la plataforma con ?tenant_id=<id>.')
        if (!cancelled) setTenantId(tenantId)

        const [stateData, registryRes, accessResult] = await Promise.allSettled([
          fetchTenantState(tenantId),
          fetch('/api/capability-registry'),
          assertTenantPlatformAccess(tenantId, platformStage),
        ])
        if (registryRes.status === 'rejected') throw registryRes.reason
        const registryResponse = registryRes.value
        const registryData = await registryResponse.json().catch(() => ({}))
        if (!registryResponse.ok) throw new Error(registryData.detail ?? `Registry HTTP ${registryResponse.status}`)

        const fallbackState: TenantStatePayload | null =
          stateData.status === 'rejected' && FALLBACK_TENANTS.has(tenantId)
            ? {
                tenant_id: tenantId,
                state: { current_stage: platformStage, transition_mode: 'mvp_fixture' },
                capabilities: (registryData as CapabilityRegistry).modules.map(module => ({
                  module_id: module.module_id,
                  active: true,
                  source: 'mvp_fixture',
                })),
              }
            : null

        if (stateData.status === 'rejected' && !fallbackState) throw stateData.reason
        const resolvedState = fallbackState ?? (stateData.status === 'fulfilled' ? stateData.value : null)
        if (!resolvedState) throw new Error('No se pudo resolver tenant_state')

        if (accessResult.status === 'rejected') {
          if (fallbackState) {
            if (!cancelled) {
              setTenantState(fallbackState)
              setRegistry(registryData as CapabilityRegistry)
            }
            return
          }
          const currentPath = platformPathForStage(resolvedState.state.current_stage)
          if (currentPath !== pathname) {
            router.replace(`${currentPath}?tenant_id=${tenantId}`)
            return
          }
          throw accessResult.reason
        }

        const canonicalPath = platformPathForStage(resolvedState.state.current_stage)
        if (canonicalPath !== pathname) {
          router.replace(`${canonicalPath}?tenant_id=${tenantId}`)
          return
        }

        if (!cancelled) {
          setTenantState(resolvedState)
          setRegistry(registryData as CapabilityRegistry)
        }
      } catch (exc) {
        if (!cancelled) setAccessError(exc instanceof Error ? exc.message : 'Acceso denegado')
      } finally {
        if (!cancelled) setLoadingTenant(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [pathname, platformStage, router, searchParams])

  const allModules = useMemo(
    () => buildFunctionaryJourney(enrichFunctionaryModules(portalJourney)),
    [portalJourney],
  )

  const platformModules: PlatformModule[] = useMemo(() => {
    if (!registry || !tenantState) return []
    return filterModulesForPlatform(allModules, registry, tenantState, platformStage)
  }, [allModules, platformStage, registry, tenantState])

  const readOnlyIds = useMemo(() => readOnlyModuleIds(platformModules), [platformModules])
  const visibleIds = useMemo(
    () => new Set(platformModules.map(module => module.module_id)),
    [platformModules],
  )
  const badgeStage: ClientPlatformStage =
    !tenantState
      ? platformStage
      : tenantState.state.current_stage === 'planning'
      ? 'planning'
      : tenantState.state.current_stage === 'execution' || tenantState.state.current_stage === 'expansion'
        ? 'execution'
        : 'validation'

  const sociodemographicBlock = useMemo(
    () => buildSociodemographicScaffoldBlock(municipiosActivos),
    [municipiosActivos],
  )

  useEffect(() => {
    if (!platformModules.length) { setActiveModuleId(null); return }
    setActiveModuleId(prev => {
      if (prev && platformModules.some(module => module.module_id === prev)) return prev
      return platformModules[0]?.module_id ?? null
    })
  }, [platformModules])

  const activeModule = useMemo(
    () => platformModules.find(module => module.module_id === activeModuleId) ?? platformModules[0] ?? null,
    [activeModuleId, platformModules],
  )
  const validationPct = useMemo(() => {
    const metrics = tenantData.data?.metrics ?? []
    if (!metrics.length) return 0
    const verified = metrics.filter(metric => metric.status === 'verificado').length
    return Math.round((verified / metrics.length) * 100)
  }, [tenantData.data?.metrics])

  const moduleNav = platformModules.length > 0 && !portalJourneyLoading ? (
    <ModuleNav
      modules={platformModules}
      activeId={activeModuleId ?? ''}
      onChange={id => {
        if (shellNavRef.current) shellNavRef.current.navigateModule(id)
        else setActiveModuleId(id)
      }}
      onOpenChapterCover={anchor => shellNavRef.current?.openChapterCover(anchor)}
      readOnlyModuleIds={readOnlyIds}
      platformLabel={PLATFORM_LABEL_BY_STAGE[platformStage]}
      theme="dark"
    />
  ) : undefined

  return (
    <div className="h-screen flex overflow-hidden bg-surface-base">
      <Sidebar moduleSection={moduleNav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="border-b border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-3">
            <PlatformStageBadge stage={badgeStage} />
            <p className="text-[12px] text-[#6B6760]">
              {tenantData.data?.municipality ?? `Tenant ${tenantState?.tenant_id ?? 'sin seleccionar'}`} · diagnóstico inicial con fuente, método y confianza
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {accessError ? (
            <div className="m-6 border border-[#EBC0BA] bg-[#FBEAEA] px-5 py-4 text-[#A8322A]">
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <AlertTriangle size={15} /> Acceso denegado
              </p>
              <p className="mt-2 text-[12px] leading-relaxed">{accessError}</p>
            </div>
          ) : (
            <>
              {tenantData.data && (
                <section className="mx-6 mt-6 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Diagnóstico inicial preparado</p>
                      <h1 className="mt-1 font-serif text-[30px] leading-tight text-[#1C1B18]">
                        {tenantData.data.municipality}
                      </h1>
                      <p className="mt-2 text-[13px] text-[#6B6760]">
                        Algunos datos requieren validación. Municipio y zona metropolitana se mantienen separados.
                      </p>
                    </div>
                    <a
                      href={`/api/tenants/${encodeURIComponent(tenantData.data.tenant_id)}/export-zip`}
                      className="rounded-[8px] bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white"
                    >
                      Exportar ZIP preliminar
                    </a>
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {tenantData.data.metrics.map(metric => (
                      <article key={metric.id} className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[13px] font-semibold text-[#1C1B18]">{metric.label}</p>
                          <MetricConfidencePill confidence={metric.confidence} />
                        </div>
                        <p className="mt-3 text-[24px] font-semibold text-[#1C1B18]">
                          {metric.value ?? 'Brecha crítica'} <span className="text-[13px] font-normal text-[#6B6760]">{metric.unit}</span>
                        </p>
                        <p className="mt-3 text-[11px] leading-5 text-[#6B6760]">
                          Fuente: {metric.source} · Fecha: {metric.source_date} · Método: {metric.method} · Alcance: {metric.territorial_scope}
                        </p>
                      </article>
                    ))}
                  </div>
                </section>
              )}
              {tenantData.data && (
                <DocumentGapBanner
                  tenantId={tenantData.data.tenant_id}
                  moduleId={activeModule?.module_id ?? null}
                  gaps={tenantData.data.document_gaps}
                  documents={tenantData.data.tenant_documents}
                  onChanged={tenantData.reload}
                />
              )}
              <DecisionModuleShell
                modules={platformModules}
                activeModule={activeModule}
                onModuleChange={setActiveModuleId}
                bindNavigation={api => { shellNavRef.current = api }}
                loading={loadingTenant || portalJourneyLoading}
                error={portalError ?? tenantData.error}
                audience={portalEntry}
                readOnlyModuleIds={readOnlyIds}
                chapterVisibleModuleIds={visibleIds}
                renderModule={(module, { navigateModule }) =>
                  renderDecisionModule({
                    module,
                    audience: 'functionary',
                    isOrganizationJourney: false,
                    sociodemographicBlock,
                    onNavigate: navigateModule,
                  })
                }
              />
              {tenantData.data && (
                <Watermark
                  version={tenantData.data.version}
                  date={tenantData.data.generated_at}
                  status={tenantData.data.status}
                  validationPct={validationPct}
                />
              )}
            </>
          )}
        </div>
      </div>
      <GeneraPlanConfirmModal />
      <GenerarPlanModal />
    </div>
  )
}
