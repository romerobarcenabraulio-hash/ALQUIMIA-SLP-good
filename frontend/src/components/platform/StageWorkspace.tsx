'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle, CheckCircle2, FileText, Gauge, GitBranch, RefreshCw, Search, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { DocumentGapBanner } from '@/components/DocumentGapBanner'
import { ConsultingPackagePanel } from '@/components/platform/ConsultingPackagePanel'
import {
  FounderViewModeSwitcher,
  readFounderViewMode,
  type FounderViewMode,
} from '@/components/platform/FounderViewModeSwitcher'
import type { CityConsultingContext, StageWorkspaceModule } from '@/lib/cityConsultingContext'
import type { ClientPlatformStage } from '@/lib/platformRouting'
import { PLATFORM_LABEL_BY_STAGE } from '@/lib/platformRouting'
import type { TenantDiagnosticData } from '@/lib/tenantDiagnosticData'
import { tenantMunicipalContextHeadersFromStorage } from '@/lib/tenantRuntimeMunicipalContext'

interface TenantOption {
  id: string
  nombre: string
  estado_mx?: string
  municipio_id?: string
  inegi_clave?: string
  stage?: string
  pendingDocumentCount?: number | null
  regulationStatus?: 'available' | 'missing' | 'unknown'
}

interface StageWorkspacePayload {
  tenant_id: string
  stage: ClientPlatformStage
  city_consulting_context: CityConsultingContext
}

const STAGE_COPY: Record<ClientPlatformStage, { eyebrow: string; title: string; body: string }> = {
  validation: {
    eyebrow: 'Validación',
    title: 'Diagnóstico municipal con evidencia trazable antes de decidir.',
    body: 'La plataforma ordena reglamento, fuentes, brechas y claims. Si falta reglamento, no emite plan; si faltan otros documentos, calcula hasta donde hay evidencia y deja el límite visible.',
  },
  planning: {
    eyebrow: 'Planeación',
    title: 'Escenarios, riesgos y hoja de ruta sin convertir supuestos en verdad municipal.',
    body: 'La plataforma usa el paquete consultivo para preparar escenarios cerrados, prioridades y brechas. Los pendientes condicionan alcance, confianza o cuantificación, no bloquean toda la planeación.',
  },
  execution: {
    eyebrow: 'Ejecución',
    title: 'Monitoreo de avance, deltas y evidencia nueva por etapa.',
    body: 'La plataforma conserva trazabilidad de eventos, documentos, claims y recomendaciones para comparar lo proyectado contra lo real sin mezclar municipio, ZM o benchmarks.',
  },
}

function tenantIdFromBrowser(searchParams: URLSearchParams): string | null {
  const fromQuery = searchParams.get('tenant_id') ?? searchParams.get('tenant')
  if (fromQuery) {
    localStorage.setItem('alquimia.tenantId', fromQuery)
    return fromQuery
  }
  return localStorage.getItem('alquimia.tenantId')
}

async function fetchTenantOptions(stage: ClientPlatformStage): Promise<TenantOption[]> {
  const res = await fetch(`/api/admin/tenants?stage=${encodeURIComponent(stage)}`)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Tenants HTTP ${res.status}`)
  const tenants = Array.isArray(data.tenants) ? data.tenants : []

  return Promise.all(tenants.map(async (tenant: Record<string, unknown>) => {
    const id = String(tenant.id ?? '')
    const option: TenantOption = {
      id,
      nombre: String(tenant.nombre ?? id ?? 'Tenant sin nombre'),
      estado_mx: typeof tenant.estado_mx === 'string' ? tenant.estado_mx : undefined,
      municipio_id: typeof tenant.municipio_id === 'string' ? tenant.municipio_id : undefined,
      inegi_clave: typeof tenant.inegi_clave === 'string' ? tenant.inegi_clave : undefined,
      stage: tenant.state && typeof tenant.state === 'object'
        ? String((tenant.state as Record<string, unknown>).current_stage ?? stage)
        : stage,
      pendingDocumentCount: null,
      regulationStatus: 'unknown',
    }
    if (!id) return option

    try {
      const workspaceRes = await fetch(`/api/tenants/${encodeURIComponent(id)}/stage-workspace?stage=${stage}`, {
        headers: { 'x-tenant-id': id },
      })
      const payload = await workspaceRes.json().catch(() => ({})) as Partial<StageWorkspacePayload>
      if (!workspaceRes.ok || !payload.city_consulting_context) return option
      return {
        ...option,
        pendingDocumentCount: payload.city_consulting_context.evidence_gaps.length,
        regulationStatus: payload.city_consulting_context.regulation.status,
      }
    } catch {
      return option
    }
  })).then(options => options.filter(option => option.id))
}

function statusTone(status: StageWorkspaceModule['status']) {
  if (status === 'ready') return 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'
  if (status === 'blocked') return 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]'
  return 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]'
}

function statusLabel(status: StageWorkspaceModule['status']) {
  if (status === 'ready') return 'Listo'
  if (status === 'blocked') return 'Bloqueado'
  return 'Condicionado'
}

function TenantSelector({
  tenants,
  loading,
  error,
  stage,
  onSelect,
}: {
  tenants: TenantOption[]
  loading: boolean
  error: string | null
  stage: ClientPlatformStage
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
    <section className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6B6760]">
        Admin · filtro de ciudad
      </p>
      <h1 className="mt-3 max-w-4xl font-serif text-[34px] leading-tight text-[#1C1B18] sm:text-[42px]">
        Selecciona el municipio para abrir {PLATFORM_LABEL_BY_STAGE[stage].toLowerCase()}.
      </h1>
      <p className="mt-4 max-w-3xl text-[14px] leading-7 text-[#4A4740]">
        Esta pantalla sustituye el error por una mesa de trabajo: ciudad, reglamento, documentos faltantes y etapa. Cliente sólo debe entrar con su tenant; admin puede elegir.
      </p>

      <div className="mt-6 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="relative block">
          <Search size={15} className="absolute left-3 top-3 text-[#8C8880]" />
          <span className="sr-only">Filtrar ciudad</span>
          <input
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filtrar por ciudad, estado, INEGI o tenant_id"
            className="h-11 w-full border border-[#D8D2C5] bg-white pl-9 pr-3 text-[13px] text-[#1C1B18] outline-none focus:border-[#8AA66F]"
          />
        </label>
        <a
          href="/admin"
          className="inline-flex h-11 items-center justify-center border border-[#D8D2C5] px-4 text-[13px] font-semibold text-[#3B3326]"
        >
          Abrir command center
        </a>
      </div>

      {error && (
        <div className="mt-4 border-l-4 border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 text-[12px] leading-5 text-[#765814]">
          No se pudo cargar el índice admin: {error}. Puedes abrir manualmente si conoces el tenant_id.
        </div>
      )}

      <div className="mt-6 border-y border-[#E8E4DC]">
        {loading ? (
          <p className="py-6 text-[13px] text-[#6B6760]">Cargando ciudades...</p>
        ) : visibleTenants.length ? (
          visibleTenants.map(tenant => (
            <button
              key={tenant.id}
              type="button"
              onClick={() => onSelect(tenant.id)}
              className="grid w-full gap-2 border-b border-[#E8E4DC] py-4 text-left last:border-b-0 hover:bg-[#FAFAF8] md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
            >
              <span>
                <span className="block text-[15px] font-semibold text-[#1C1B18]">{tenant.nombre}</span>
                <span className="mt-1 block text-[12px] text-[#6B6760]">
                  {[tenant.estado_mx, tenant.municipio_id, tenant.inegi_clave].filter(Boolean).join(' · ') || tenant.id}
                </span>
              </span>
              <span className="flex flex-wrap gap-2 md:justify-end">
                <span className={`border px-2 py-1 text-[11px] font-semibold ${tenant.regulationStatus === 'available' ? 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]' : tenant.regulationStatus === 'missing' ? 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]' : 'border-[#D8D2C5] bg-white text-[#6B6760]'}`}>
                  Reglamento {tenant.regulationStatus === 'available' ? 'listo' : tenant.regulationStatus === 'missing' ? 'faltante' : 'sin revisar'}
                </span>
                <span className="border border-[#D8D2C5] bg-white px-2 py-1 text-[11px] font-semibold text-[#6B6760]">
                  Brechas {tenant.pendingDocumentCount ?? '...'}
                </span>
              </span>
            </button>
          ))
        ) : (
          <p className="py-6 text-[13px] text-[#6B6760]">No hay ciudades visibles para este filtro.</p>
        )}
      </div>

      <div className="mt-6 max-w-2xl border-t border-[#E8E4DC] pt-4">
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
            Abrir
          </button>
        </div>
      </div>
    </section>
  )
}

function EvidenceKernelPanel({ context }: { context: CityConsultingContext }) {
  const visible = context.evidence_kernel.slice(0, 5)
  return (
    <section className="border-t border-[#D8D2C5] pt-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
        Evidence Kernel
      </p>
      <div className="mt-3 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
        {visible.map(record => (
          <div key={record.id} className="grid gap-2 py-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <p className="text-[13px] font-semibold text-[#1C1B18]">{record.claim}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#6B6760]">
                Fuente: {record.source} · Fecha: {record.source_date} · Método: {record.method} · Alcance: {record.territorial_scope}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <span className={`border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${record.can_render_as_claim ? 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]' : 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]'}`}>
                {record.can_render_as_claim ? 'Afirmable' : 'No afirmar'}
              </span>
              <span className="border border-[#D8D2C5] bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
                {record.confidence}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function ModuleRail({
  modules,
  activeModuleId,
  onChange,
}: {
  modules: StageWorkspaceModule[]
  activeModuleId: string
  onChange: (moduleId: string) => void
}) {
  return (
    <div className="space-y-1 p-3">
      <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9E9A91]">
        Módulos
      </p>
      {modules.map(module => (
        <button
          key={module.module_id}
          type="button"
          onClick={() => onChange(module.module_id)}
          className={`block w-full px-2 py-2 text-left text-[12px] leading-5 ${activeModuleId === module.module_id ? 'bg-[#F4F2ED] font-semibold text-[#1C1B18]' : 'text-[#5C574F] hover:bg-[#FAFAF8]'}`}
        >
          <span className="block">{module.module_id}</span>
          <span className="block">{module.label}</span>
        </button>
      ))}
    </div>
  )
}

export function StageWorkspace({ platformStage }: { platformStage: ClientPlatformStage }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [tenantOptions, setTenantOptions] = useState<TenantOption[]>([])
  const [tenantOptionsLoading, setTenantOptionsLoading] = useState(false)
  const [tenantOptionsError, setTenantOptionsError] = useState<string | null>(null)
  const [tenantData, setTenantData] = useState<TenantDiagnosticData | null>(null)
  const [context, setContext] = useState<CityConsultingContext | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<FounderViewMode>('admin')
  const [activeModuleId, setActiveModuleId] = useState<string>('')

  const clientPreview = viewMode === 'client'
  const copy = STAGE_COPY[platformStage]

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
    const resolvedTenantId = tenantIdFromBrowser(searchParams)
    setTenantId(resolvedTenantId)
  }, [searchParams])

  const loadTenantOptions = useCallback(async () => {
    setTenantOptionsLoading(true)
    setTenantOptionsError(null)
    try {
      setTenantOptions(await fetchTenantOptions(platformStage))
    } catch (exc) {
      setTenantOptions([])
      setTenantOptionsError(exc instanceof Error ? exc.message : 'No se pudo cargar tenants')
    } finally {
      setTenantOptionsLoading(false)
    }
  }, [platformStage])

  useEffect(() => {
    if (!tenantId) void loadTenantOptions()
  }, [loadTenantOptions, tenantId])

  const reloadWorkspace = useCallback(() => {
    if (!tenantId) return
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/tenants/${encodeURIComponent(tenantId)}/data`, {
        headers: { 'x-tenant-id': tenantId, ...tenantMunicipalContextHeadersFromStorage() },
      }),
      fetch(`/api/tenants/${encodeURIComponent(tenantId)}/stage-workspace?stage=${platformStage}`, {
        headers: { 'x-tenant-id': tenantId, ...tenantMunicipalContextHeadersFromStorage() },
      }),
    ])
      .then(async ([dataRes, workspaceRes]) => {
        const dataBody = await dataRes.json().catch(() => ({}))
        const workspaceBody = await workspaceRes.json().catch(() => ({}))
        if (!dataRes.ok) throw new Error(dataBody.detail ?? `Tenant data HTTP ${dataRes.status}`)
        if (!workspaceRes.ok) throw new Error(workspaceBody.detail ?? `Stage workspace HTTP ${workspaceRes.status}`)
        return {
          tenantData: dataBody as TenantDiagnosticData,
          context: (workspaceBody as StageWorkspacePayload).city_consulting_context,
        }
      })
      .then(next => {
        if (cancelled) return
        setTenantData(next.tenantData)
        setContext(next.context)
        setActiveModuleId(prev => (
          prev && next.context.stage_workspace.visible_modules.some(module => module.module_id === prev)
            ? prev
            : next.context.stage_workspace.visible_modules[0]?.module_id ?? ''
        ))
      })
      .catch(exc => {
        if (!cancelled) setError(exc instanceof Error ? exc.message : 'No se pudo cargar workspace')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [platformStage, tenantId])

  useEffect(() => reloadWorkspace(), [reloadWorkspace])

  function openTenant(nextTenantId: string) {
    const cleanTenantId = nextTenantId.trim()
    if (!cleanTenantId) return
    localStorage.setItem('alquimia.tenantId', cleanTenantId)
    router.replace(`${pathname}?tenant_id=${encodeURIComponent(cleanTenantId)}`)
  }

  const activeModule = useMemo(
    () => context?.stage_workspace.visible_modules.find(module => module.module_id === activeModuleId)
      ?? context?.stage_workspace.visible_modules[0]
      ?? null,
    [activeModuleId, context?.stage_workspace.visible_modules],
  )

  const moduleRail = context ? (
    <ModuleRail
      modules={context.stage_workspace.visible_modules}
      activeModuleId={activeModule?.module_id ?? ''}
      onChange={setActiveModuleId}
    />
  ) : undefined

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F7F3]">
      <Sidebar moduleSection={moduleRail} />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <div className="border-b border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <span className="border border-[#C9DDB1] bg-[#EAF3DE] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2F5B0D]">
                {PLATFORM_LABEL_BY_STAGE[platformStage]}
              </span>
              <p className="text-[12px] leading-5 text-[#6B6760]">
                {context ? `${context.municipality}, ${context.state}` : 'Tenant sin seleccionar'}
              </p>
              {clientPreview && (
                <span className="border border-[#D8D2C5] px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
                  Vista cliente
                </span>
              )}
            </div>
            <FounderViewModeSwitcher />
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          {!tenantId ? (
            <TenantSelector
              tenants={tenantOptions}
              loading={tenantOptionsLoading}
              error={tenantOptionsError}
              stage={platformStage}
              onSelect={openTenant}
            />
          ) : error ? (
            <section className="m-6 border border-[#EBC0BA] bg-[#FBEAEA] px-5 py-4 text-[#A8322A]">
              <p className="flex items-center gap-2 text-[13px] font-semibold">
                <AlertTriangle size={15} /> No se pudo abrir el workspace
              </p>
              <p className="mt-2 text-[12px] leading-relaxed">{error}</p>
              <button
                type="button"
                onClick={() => reloadWorkspace()}
                className="mt-3 inline-flex items-center gap-2 border border-[#EBC0BA] bg-white px-3 py-2 text-[12px] font-semibold text-[#A8322A]"
              >
                <RefreshCw size={14} /> Reintentar
              </button>
            </section>
          ) : loading && !context ? (
            <section className="mx-auto max-w-5xl px-5 py-10 text-[13px] text-[#6B6760]">
              Preparando contexto de ciudad...
            </section>
          ) : context && tenantData ? (
            <div className="mx-auto w-full max-w-7xl px-5 py-7 sm:px-8">
              <section className="grid gap-6 border-b border-[#D8D2C5] pb-7 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6B6760]">{copy.eyebrow}</p>
                  <h1 className="mt-3 max-w-4xl font-serif text-[36px] leading-tight text-[#1C1B18] sm:text-[46px]">
                    {copy.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-[15px] leading-8 text-[#4A4740]">{copy.body}</p>
                  <p className="mt-3 max-w-3xl text-[12px] leading-6 text-[#6B6760]">
                    Municipio, ZM, estado y benchmark se mantienen separados. Nada estimado se muestra como oficial.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: ShieldCheck, label: 'Reglamento', value: context.regulation.status === 'available' ? 'Disponible' : 'Faltante', tone: context.regulation.status === 'available' ? 'ok' : 'bad' },
                    { icon: FileText, label: 'Brechas', value: String(context.evidence_gaps.length), tone: context.evidence_gaps.length ? 'warn' : 'ok' },
                    { icon: Gauge, label: 'Escenarios', value: `${context.package_summary.quantified_scenario_count}/${context.package_summary.scenario_count}`, tone: context.package_summary.quantified_scenario_count ? 'ok' : 'warn' },
                    { icon: GitBranch, label: 'Claims', value: String(context.package_summary.affirmable_claim_count), tone: context.package_summary.affirmable_claim_count ? 'ok' : 'warn' },
                  ].map(item => {
                    const Icon = item.icon
                    return (
                      <div key={item.label} className="border border-[#E8E4DC] bg-[#FDFCFA] p-4">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={item.tone === 'bad' ? 'text-[#A8322A]' : item.tone === 'warn' ? 'text-[#8C6A13]' : 'text-[#3B6D11]'} />
                          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">{item.label}</p>
                        </div>
                        <p className="mt-3 font-serif text-[28px] leading-none text-[#1C1B18]">{item.value}</p>
                      </div>
                    )
                  })}
                </div>
              </section>

              {!clientPreview && (
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={`/admin?tenant_id=${encodeURIComponent(context.tenant_id)}`}
                    className="inline-flex items-center gap-2 bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white"
                  >
                    <ShieldCheck size={14} /> Abrir admin
                  </a>
                  <a
                    href={`/api/tenants/${encodeURIComponent(context.tenant_id)}/export-zip`}
                    className="inline-flex items-center gap-2 border border-[#D8D2C5] px-4 py-2 text-[13px] font-semibold text-[#3B3326]"
                  >
                    <FileText size={14} /> Exportar ZIP preliminar
                  </a>
                </div>
              )}

              {tenantData && (
                <DocumentGapBanner
                  tenantId={tenantData.tenant_id}
                  moduleId={activeModule?.module_id ?? null}
                  gaps={tenantData.document_gaps}
                  documents={tenantData.tenant_documents}
                  onChanged={reloadWorkspace}
                />
              )}

              <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(360px,1.1fr)]">
                <div className="border-t border-[#D8D2C5] pt-5">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
                    Módulo activo
                  </p>
                  {activeModule ? (
                    <div className="mt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`border px-2 py-1 text-[11px] font-semibold ${statusTone(activeModule.status)}`}>
                          {statusLabel(activeModule.status)}
                        </span>
                        <span className="border border-[#D8D2C5] bg-white px-2 py-1 text-[11px] font-semibold text-[#6B6760]">
                          {activeModule.module_id}
                        </span>
                      </div>
                      <h2 className="mt-3 font-serif text-[30px] leading-tight text-[#1C1B18]">{activeModule.label}</h2>
                      <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[#4A4740]">{activeModule.conclusion}</p>
                      {activeModule.evidence_gap_ids.length > 0 && (
                        <div className="mt-4 border-l-4 border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 text-[12px] leading-5 text-[#765814]">
                          Este módulo tiene {activeModule.evidence_gap_ids.length} brecha(s). Se puede planear, pero no declarar como verdad municipal lo que no esté soportado.
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-[13px] text-[#6B6760]">Sin módulos para esta etapa.</p>
                  )}
                </div>
                <EvidenceKernelPanel context={context} />
              </section>

              <ConsultingPackagePanel tenantData={tenantData} showTechnicalPanel={!clientPreview} />

              <section className="mt-2 border-t border-[#D8D2C5] pt-5">
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Eventos operativos</p>
                <div className="mt-3 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
                  {context.operational_events.map(event => (
                    <div key={`${event.action}-${event.created_at}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-[12px]">
                      <span className="font-semibold text-[#1C1B18]">{event.action.replaceAll('_', ' ')}</span>
                      <span className="text-[#6B6760]">{event.result} · {new Date(event.created_at).toLocaleString('es-MX')}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  )
}
