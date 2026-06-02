'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Citation } from '@/components/Citation'
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
import {
  PillarModulePanel,
  moduleDocumentStatus,
  moduleDocumentStatusLabel,
} from '@/components/platform/PillarModulePanel'
import { ConsultingPackagePanel } from '@/components/platform/ConsultingPackagePanel'
import {
  FounderViewModeSwitcher,
  readFounderViewMode,
  type FounderViewMode,
} from '@/components/platform/FounderViewModeSwitcher'
import { useTenantData } from '@/hooks/useTenantData'
import { getApiUrl } from '@/lib/api'
import { moduleMatches } from '@/lib/documentArchiveStore'
import { persistTenantMunicipalContext } from '@/lib/tenantRuntimeMunicipalContext'
import type { TenantDiagnosticData } from '@/lib/tenantDiagnosticData'
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

const FALLBACK_TENANTS = new Set(['municipio-demo', 'complete-city', 'partial-city', 'gap-city'])

interface TenantOption {
  id: string
  nombre: string
  estado_mx?: string
  municipio_id?: string
  inegi_clave?: string
  stage?: string
  gatesClosed?: number
  gatesTotal?: number
  pendingDocumentCount?: number | null
  receivedDocumentCount?: number | null
  pendingDocumentLabels?: string[]
  documentStatus?: 'ok' | 'pending' | 'unknown'
}

function tenantIdFromBrowser(searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get('tenant_id') ?? searchParams.get('tenant')
  if (fromQuery) {
    localStorage.setItem('alquimia.tenantId', fromQuery)
    return fromQuery
  }
  return localStorage.getItem('alquimia.tenantId')
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('alquimia_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchTenantOptions(): Promise<TenantOption[]> {
  const res = await fetch(`${getApiUrl()}/admin/tenants`, { headers: authHeaders() })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Tenants HTTP ${res.status}`)
  const tenants = Array.isArray(data.tenants) ? data.tenants : []
  const baseOptions = tenants.map((tenant: Record<string, unknown>) => {
    const gates = Array.isArray(tenant.gates) ? tenant.gates : []
    const gatesClosed = gates.filter(gate => (
      gate
      && typeof gate === 'object'
      && (gate as Record<string, unknown>).status === 'cerrado'
    )).length
    return {
      id: String(tenant.id ?? ''),
      nombre: String(tenant.nombre ?? tenant.id ?? 'Tenant sin nombre'),
      estado_mx: typeof tenant.estado_mx === 'string' ? tenant.estado_mx : undefined,
      municipio_id: typeof tenant.municipio_id === 'string' ? tenant.municipio_id : undefined,
      inegi_clave: typeof tenant.inegi_clave === 'string' ? tenant.inegi_clave : undefined,
      stage:
        tenant.state && typeof tenant.state === 'object'
          ? String((tenant.state as Record<string, unknown>).current_stage ?? '')
          : undefined,
      gatesClosed,
      gatesTotal: gates.length,
      documentStatus: 'unknown' as const,
      pendingDocumentCount: null,
      receivedDocumentCount: null,
      pendingDocumentLabels: [],
    }
  }).filter((tenant: TenantOption) => tenant.id)

  return Promise.all(baseOptions.map(async (tenant: TenantOption) => {
    try {
      const dataRes = await fetch(`/api/tenants/${encodeURIComponent(tenant.id)}/data`, {
        headers: { 'x-tenant-id': tenant.id },
      })
      const tenantData = await dataRes.json().catch(() => ({}))
      if (!dataRes.ok) throw new Error(typeof tenantData.detail === 'string' ? tenantData.detail : `Tenant data HTTP ${dataRes.status}`)
      const gaps: unknown[] = Array.isArray(tenantData.document_gaps) ? tenantData.document_gaps : []
      const pendingGaps = gaps.filter((gap: unknown) => (
        gap
        && typeof gap === 'object'
        && (gap as Record<string, unknown>).status === 'pending'
        && (gap as Record<string, unknown>).marked_not_applicable !== true
      ))
      const documents = Array.isArray(tenantData.tenant_documents) ? tenantData.tenant_documents : []
      return {
        ...tenant,
        pendingDocumentCount: pendingGaps.length,
        receivedDocumentCount: documents.length,
        pendingDocumentLabels: pendingGaps
          .map((gap: unknown) => String((gap as Record<string, unknown>).label ?? 'Documento pendiente'))
          .slice(0, 3),
        documentStatus: pendingGaps.length ? 'pending' as const : 'ok' as const,
      }
    } catch {
      return tenant
    }
  }))
}

export function TenantSelectionPanel({
  tenants,
  loading,
  error,
  onSelect,
}: {
  tenants: TenantOption[]
  loading: boolean
  error: string | null
  onSelect: (tenantId: string) => void
}) {
  const [filter, setFilter] = useState('')
  const [manualTenantId, setManualTenantId] = useState('')
  const normalized = filter.trim().toLowerCase()
  const visibleTenants = tenants.filter(tenant => {
    if (!normalized) return true
    return [tenant.nombre, tenant.estado_mx, tenant.municipio_id, tenant.inegi_clave, tenant.id]
      .filter(Boolean)
      .some(value => String(value).toLowerCase().includes(normalized))
  })

  return (
    <section className="mx-4 mt-6 max-w-5xl border-t border-[#D8D2C5] pt-6 sm:mx-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
        Selección de ciudad
      </p>
      <h1 className="mt-2 max-w-3xl font-serif text-[32px] leading-tight text-[#1C1B18]">
        Elige el municipio que quieres analizar.
      </h1>
      <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#4A4740]">
        La plataforma necesita un tenant activo para separar municipio, zona metropolitana, documentos, gates y evidencia. Como admin, esta pantalla debe servir como filtro de trabajo, no como error técnico.
      </p>
      <p className="mt-2 max-w-3xl text-[12px] leading-6 text-[#6B6760]">
        Usa la vista Interna para revisar requests, gates y cargas pendientes; cambia a Cliente para confirmar qué verá el municipio sin herramientas de calibración.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="sr-only">Filtrar ciudad o tenant</span>
          <input
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filtrar por ciudad, estado, INEGI o tenant_id"
            className="h-11 w-full border border-[#D8D2C5] bg-white px-3 text-[13px] text-[#1C1B18] outline-none focus:border-[#8AA66F]"
          />
        </label>
        <a
          href="/admin"
          className="inline-flex h-11 items-center justify-center border border-[#D8D2C5] px-4 text-[13px] font-semibold text-[#3B3326]"
        >
          Gestionar tenants
        </a>
      </div>

      {error && (
        <div className="mt-4 border-l-4 border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 text-[12px] leading-5 text-[#765814]">
          No se pudo cargar el índice admin de tenants: {error}. Puedes entrar manualmente si conoces el tenant_id o gestionarlo desde backoffice.
        </div>
      )}

      <div className="mt-5">
        {loading ? (
          <p className="text-[13px] text-[#6B6760]">Cargando ciudades disponibles...</p>
        ) : visibleTenants.length ? (
          <div className="divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
            {visibleTenants.map(tenant => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => onSelect(tenant.id)}
                className="grid w-full gap-1 py-3 text-left hover:bg-[#FAFAF8] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <span>
                  <span className="block text-[14px] font-semibold text-[#1C1B18]">{tenant.nombre}</span>
                  <span className="mt-1 block text-[12px] text-[#6B6760]">
                    {[tenant.estado_mx, tenant.municipio_id, tenant.inegi_clave].filter(Boolean).join(' · ') || tenant.id}
                  </span>
                  <span className="mt-1 block text-[11px] text-[#8C6A13]">
                    {tenant.documentStatus === 'unknown'
                      ? 'Documentos: pendiente de revisar'
                      : tenant.pendingDocumentCount
                        ? `Faltan ${tenant.pendingDocumentCount} documentos: ${tenant.pendingDocumentLabels?.join(', ')}`
                        : `Documentos base sin brechas pendientes · recibidos ${tenant.receivedDocumentCount ?? 0}`}
                  </span>
                </span>
                <span className="flex flex-col items-start gap-1 sm:items-end">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#3B6D11]">
                    {tenant.stage ?? 'validation'}
                  </span>
                  <span className="text-[11px] text-[#6B6760]">
                    Gates {tenant.gatesClosed ?? 0}/{tenant.gatesTotal ?? 0}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-[#6B6760]">No hay tenants visibles para este filtro.</p>
        )}
      </div>

      <div className="mt-6 border-t border-[#E8E4DC] pt-4">
        <p className="text-[12px] font-semibold text-[#1C1B18]">Entrar con tenant_id manual</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={manualTenantId}
            onChange={event => setManualTenantId(event.target.value)}
            placeholder="tenant_id"
            className="h-10 flex-1 border border-[#D8D2C5] bg-white px-3 text-[13px] text-[#1C1B18] outline-none focus:border-[#8AA66F]"
          />
          <button
            type="button"
            disabled={!manualTenantId.trim()}
            onClick={() => onSelect(manualTenantId.trim())}
            className="h-10 bg-[#1C2B15] px-4 text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#B8B1A5]"
          >
            Abrir análisis
          </button>
        </div>
      </div>
    </section>
  )
}

function SandboxModulePlaceholder({ module, tenantData }: { module: PlatformModule | null; tenantData: TenantDiagnosticData | null }) {
  const gaps = tenantData?.document_gaps.filter(gap => moduleMatches(gap.module_id, module?.module_id ?? '')) ?? []
  return (
    <section className="mx-4 mt-5 sm:mx-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
        Estructura de modulo
      </p>
      <h2 className="mt-2 font-serif text-[26px] leading-tight text-[#1C1B18]">
        {module?.label ?? 'Modulo pendiente'}
      </h2>
      <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#5C574F]">
        En Municipio Demo no se renderizan graficas, diagnósticos ni textos normativos precargados. La pantalla conserva el índice y muestra los documentos necesarios para activar análisis real.
      </p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {(gaps.length ? gaps : tenantData?.document_gaps.slice(0, 4) ?? []).map(gap => (
          <div key={gap.id} className="rounded-[8px] border border-[#D7B56D] bg-[#FFF9EA] p-3">
            <p className="text-[12px] font-semibold text-[#1C1B18]">{gap.label}</p>
            <p className="mt-1 text-[12px] leading-5 text-[#5C574F]">{gap.reason}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export function StageReadinessNotice({
  stage,
  clientPreview,
}: {
  stage: ClientPlatformStage
  clientPreview: boolean
}) {
  if (stage === 'validation') return null
  const label = stage === 'planning' ? 'Planeación' : 'Ejecución'
  return (
    <section className="mx-4 mt-5 border-l-4 border-[#D7B56D] bg-[#FFF9EA] px-4 py-4 sm:mx-6 sm:px-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#765814]">
        {label} condicionada
      </p>
      <h2 className="mt-1 font-serif text-[24px] leading-tight text-[#1C1B18]">
        Esta etapa no se abre como decisión automática.
      </h2>
      <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#5C574F]">
        La plataforma puede preparar estructura, brechas y ruta de trabajo, pero el avance a {label.toLowerCase()} requiere revisión humana, evidencia mínima y gates institucionales. Los módulos heredados quedan fuera de la vista cliente.
      </p>
      {clientPreview && (
        <p className="mt-3 text-[12px] font-semibold text-[#765814]">
          Vista cliente: solo se muestra lectura condicionada; no se exponen herramientas internas de calibración.
        </p>
      )}
    </section>
  )
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
  const [needsTenantSelection, setNeedsTenantSelection] = useState(false)
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([])
  const [tenantOptionsLoading, setTenantOptionsLoading] = useState(false)
  const [tenantOptionsError, setTenantOptionsError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<FounderViewMode>('admin')
  const tenantData = useTenantData(tenantId)
  const shellNavRef = useRef<{
    navigateModule: (id: string) => void
    openChapterCover: (chapterFirstModuleId: string) => void
  } | null>(null)

  useEffect(() => { recalcular() }, [recalcular])

  useEffect(() => {
    setViewMode(readFounderViewMode())
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent<{ mode?: FounderViewMode }>).detail
      setViewMode(detail?.mode === 'client' ? 'client' : 'admin')
    }
    window.addEventListener('alquimia:view-mode-change', onChange)
    return () => window.removeEventListener('alquimia:view-mode-change', onChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoadingTenant(true)
        setAccessError(null)
        try {
          const tenantId = tenantIdFromBrowser(searchParams)
          if (!tenantId) {
            if (!cancelled) {
              setTenantId(null)
              setTenantState(null)
              setRegistry(null)
              setNeedsTenantSelection(true)
            }
            return
          }
          if (!cancelled) setNeedsTenantSelection(false)
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
        if (resolvedState.municipal_context) {
          persistTenantMunicipalContext(resolvedState.municipal_context)
        }

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

  useEffect(() => {
    if (!needsTenantSelection) return
    let cancelled = false
    async function loadTenantOptions() {
      setTenantOptionsLoading(true)
      setTenantOptionsError(null)
      try {
        const options = await fetchTenantOptions()
        if (!cancelled) setTenantOptions(options)
      } catch (exc) {
        if (!cancelled) {
          setTenantOptions([])
          setTenantOptionsError(exc instanceof Error ? exc.message : 'No se pudo cargar tenants')
        }
      } finally {
        if (!cancelled) setTenantOptionsLoading(false)
      }
    }
    void loadTenantOptions()
    return () => { cancelled = true }
  }, [needsTenantSelection])

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
      const requestedModule = searchParams.get('module')
      if (requestedModule && platformModules.some(module => module.module_id === requestedModule)) return requestedModule
      if (prev && platformModules.some(module => module.module_id === prev)) return prev
      return platformModules[0]?.module_id ?? null
    })
  }, [platformModules, searchParams])

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
  const moduleStatusById = useMemo(() => {
    const data = tenantData.data
    if (!data) return undefined
    return Object.fromEntries(
      platformModules
        .filter(module => module.module_id !== 'guia_circularidad')
        .map(module => [
          module.module_id,
          moduleDocumentStatusLabel(moduleDocumentStatus(module.module_id, data)),
        ]),
    )
  }, [platformModules, tenantData.data])
  const clientPreview = viewMode === 'client'
  const sandboxDemo = tenantId === 'municipio-demo'

  function openTenant(nextTenantId: string) {
    const cleanTenantId = nextTenantId.trim()
    if (!cleanTenantId) return
    localStorage.setItem('alquimia.tenantId', cleanTenantId)
    router.replace(`${pathname}?tenant_id=${encodeURIComponent(cleanTenantId)}`)
  }

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
      moduleStatusById={moduleStatusById}
      theme="dark"
    />
  ) : undefined

  return (
    <div className="h-screen flex overflow-hidden bg-surface-base">
      <Sidebar moduleSection={moduleNav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        <div className="border-b border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <PlatformStageBadge stage={badgeStage} />
              <p className="min-w-0 max-w-[30ch] break-words text-[12px] leading-5 text-[#6B6760] sm:max-w-full">
                {tenantData.data?.municipality ?? `Tenant ${tenantState?.tenant_id ?? 'sin seleccionar'}`} · diagnóstico inicial con fuente, método y confianza
              </p>
              {clientPreview && (
                <span className="rounded-[6px] border border-[#D8D2C5] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
                  Vista cliente
                </span>
              )}
            </div>
            <FounderViewModeSwitcher />
          </div>
        </div>
        {sandboxDemo && (
          <div className="border-b border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 sm:px-6">
            <p className="text-[12px] font-semibold leading-5 text-[#765814]">
              Sandbox founder · estructura vacia para demostrar navegacion. No contiene datos reales ni estimados.
            </p>
          </div>
        )}

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          {accessError ? (
            <div className="m-6 border border-[#EBC0BA] bg-[#FBEAEA] px-5 py-4 text-[#A8322A]">
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <AlertTriangle size={15} /> Acceso denegado
              </p>
              <p className="mt-2 text-[12px] leading-relaxed">{accessError}</p>
            </div>
          ) : needsTenantSelection ? (
            <TenantSelectionPanel
              tenants={tenantOptions}
              loading={tenantOptionsLoading}
              error={tenantOptionsError}
              onSelect={openTenant}
            />
          ) : (
            <>
              {tenantData.data && (
                <section className="mx-4 mt-6 max-w-full overflow-hidden sm:mx-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Diagnóstico inicial preparado</p>
                      <h1 className="mt-1 max-w-[14ch] break-words font-serif text-[28px] leading-tight text-[#1C1B18] sm:max-w-full sm:text-[30px]">
                        {tenantData.data.municipality}
                      </h1>
                      <p className="mt-2 max-w-[31ch] text-[13px] leading-6 text-[#6B6760] sm:max-w-3xl">
                        Algunos datos requieren validación. Municipio y zona metropolitana se mantienen separados.
                      </p>
                    </div>
                    {!clientPreview && (
                      <a
                        href={`/api/tenants/${encodeURIComponent(tenantData.data.tenant_id)}/export-zip`}
                        className="rounded-[8px] bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white"
                      >
                        Exportar ZIP preliminar
                      </a>
                    )}
                  </div>
                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {tenantData.data.metrics.map(metric => (
                      <article key={metric.id} className="min-w-0 rounded-[8px] border border-[#E8E4DC] bg-white p-4">
                        <div className="flex flex-col items-start gap-2 sm:flex-row sm:justify-between">
                          <p className="min-w-0 max-w-[24ch] text-[13px] font-semibold text-[#1C1B18] sm:flex-1 sm:max-w-none">{metric.label}</p>
                          <MetricConfidencePill confidence={metric.confidence} />
                        </div>
                        <p className="mt-3 text-[24px] font-semibold text-[#1C1B18]">
                          {metric.value ?? 'Brecha crítica'} <span className="text-[13px] font-normal text-[#6B6760]">{metric.unit}</span>
                          <Citation metric={metric} metrics={tenantData.data?.metrics ?? []} />
                        </p>
                        <p className="mt-3 max-w-[32ch] break-words text-[11px] leading-5 text-[#6B6760] sm:max-w-none">
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
              {tenantData.data && (
                <ConsultingPackagePanel
                  tenantData={tenantData.data}
                  showTechnicalPanel={!clientPreview}
                />
              )}
              <StageReadinessNotice stage={platformStage} clientPreview={clientPreview} />
              {tenantData.data && !clientPreview && (
                <section className="mx-4 mt-5 max-w-full border-t border-[#D8D2C5] pt-5 sm:mx-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Siguiente paso humano</p>
                      <h2 className="mt-1 font-serif text-[24px] leading-tight text-[#1C1B18]">
                        Tu diagnóstico inicial está listo.
                      </h2>
                      <p className="mt-2 text-[13px] leading-6 text-[#5C574F]">
                        El siguiente paso es revisarlo con el equipo ALQUIMIA, validar datos críticos y definir si el municipio puede avanzar a una ruta de implementación.
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href="mailto:contacto@alquimiaplatform.com?subject=Revisión%20de%20diagnóstico%20inicial"
                        className="rounded-[8px] bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white"
                      >
                        Agendar revisión
                      </a>
                      <button
                        type="button"
                        className="rounded-[8px] border border-[#D8D2C5] px-4 py-2 text-[13px] font-semibold text-[#3B3326]"
                      >
                        Seguir explorando
                      </button>
                    </div>
                  </div>
                </section>
              )}
              <PillarModulePanel module={activeModule} tenantData={tenantData.data ?? null} />
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
                  sandboxDemo || clientPreview
                    ? <SandboxModulePlaceholder module={module} tenantData={tenantData.data ?? null} />
                    : renderDecisionModule({
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
