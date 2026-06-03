'use client'

import { useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { AlertTriangle, Lock } from 'lucide-react'
import { Citation } from '@/components/Citation'
import { InstitutionalHeader } from '@/components/layout/InstitutionalHeader'
import { Sidebar } from '@/components/layout/Sidebar'
import { PlatformStageBadge } from '@/components/platform/PlatformStageBadge'
import { assertTenantPlatformAccess, fetchTenantState } from '@/lib/tenantStateClient'
import { MetricConfidencePill } from '@/components/MetricConfidencePill'
import { Watermark } from '@/components/Watermark'
import { DocumentGapBanner } from '@/components/DocumentGapBanner'
import { ConsultingPackagePanel } from '@/components/platform/ConsultingPackagePanel'
import {
  FounderViewModeSwitcher,
  isFounderOrAdmin,
  readFounderViewMode,
  type FounderViewMode,
} from '@/components/platform/FounderViewModeSwitcher'
import { useTenantData } from '@/hooks/useTenantData'
import { getApiUrl } from '@/lib/api'
import { buildConsultingInputRegistry } from '@/lib/consultingInputRegistry'
import { CHAPTERS, moduleNumber } from '@/lib/chapterConfig'
import { moduleSubtitle, moduleTitle } from '@/lib/moduleTitles'
import { persistTenantMunicipalContext } from '@/lib/tenantRuntimeMunicipalContext'
import { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import { renderDecisionModule } from '@/app/simulator/renderDecisionModule'
import {
  PLATFORM_MODULE_GROUPS,
  childModulesForGroup,
  groupedModulesForClientStage,
  isPlatformModuleGroup,
  visibleModuleNumber,
} from '@/lib/platformModuleGroups'
import type { TenantDiagnosticData } from '@/lib/tenantDiagnosticData'
import {
  filterModulesForPlatform,
  PLATFORM_LABEL_BY_STAGE,
  platformPathForStage,
  readOnlyModuleIds,
  type CapabilityRegistry,
  type CapabilityModule,
  type ClientPlatformStage,
  type PlatformModule,
  type TenantStatePayload,
} from '@/lib/platformRouting'
import type { DecisionModule } from '@/types'

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

function proposalValidationAllowsPlanning(tenantId: string, stage: ClientPlatformStage): boolean {
  if (typeof window === 'undefined' || stage !== 'planning') return false
  return Boolean(localStorage.getItem(`alquimia.proposalValidated.${tenantId}`))
}

function authorizedFounderViewMode(canUseInternalView: boolean, requestedMode: FounderViewMode): FounderViewMode {
  return canUseInternalView ? requestedMode : 'client'
}

async function fetchTenantOptions(): Promise<TenantOption[]> {
  let data: Record<string, unknown> = {}
  try {
    const backendRes = await fetch(`${getApiUrl()}/admin/tenants`, { headers: authHeaders() })
    data = await backendRes.json().catch(() => ({}))
    if (!backendRes.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Expedientes HTTP ${backendRes.status}`)
  } catch {
    const localRes = await fetch('/api/admin/tenants')
    data = await localRes.json().catch(() => ({}))
    if (!localRes.ok) throw new Error(typeof data.detail === 'string' ? data.detail : `Expedientes HTTP ${localRes.status}`)
  }
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
      nombre: String(tenant.nombre ?? tenant.id ?? 'Municipio sin nombre'),
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

const MODULE_DECISION_COPY: Record<string, Pick<DecisionModule, 'decision' | 'evidence' | 'next_action'>> = {
  guia_circularidad: {
    decision: 'Entender cómo leer la consultoría, qué puede afirmarse y qué queda condicionado por evidencia.',
    evidence: 'Metodología, jerarquía de datos, citas, brechas y revisión humana.',
    next_action: 'Completar lectura inicial y abrir antecedentes municipales.',
  },
  antecedentes_municipales: {
    decision: 'Construir el contexto institucional del municipio antes de cuantificar RSU.',
    evidence: 'PMD, datos INEGI, reglamento disponible, documentos cargados y bibliografía comparable.',
    next_action: 'Completar documentos base y pasar a línea base RSU.',
  },
  city_baseline: {
    decision: 'Establecer la línea base de RSU con datos locales o cálculos trazables.',
    evidence: 'Población, generación, caracterización, fuente, método, confianza y límites de uso.',
    next_action: 'Resolver brechas críticas antes de usar cifras en escenarios.',
  },
  social_diagnostico: {
    decision: 'Medir aceptación, actores y riesgos sociales sin inventar percepción ciudadana.',
    evidence: 'Encuesta aprobada, bibliografía comparable, censo social o brecha explícita.',
    next_action: 'Preparar encuesta o campaña aprobada por el cliente si falta dato local.',
  },
  capacidad_institucional: {
    decision: 'Evaluar si el municipio tiene capacidad operativa, humana y presupuestal para ejecutar.',
    evidence: 'Organigrama, presupuesto, cuenta pública, área responsable y documentos institucionales.',
    next_action: 'Marcar capacidades faltantes y responsables humanos.',
  },
  marco_legal: {
    decision: 'Determinar qué permite el reglamento y qué requiere reforma o acuerdo humano.',
    evidence: 'Reglamento vigente, artículos citables, alcance municipal y revisión jurídica humana.',
    next_action: 'Cargar reglamento si falta; sin reglamento no se emite declaratoria formal.',
  },
  costo_omision: {
    decision: 'Cuantificar el costo de no actuar sólo con datos trazables o supuestos declarados.',
    evidence: 'Línea base, disposición, costos, externalidades y metodología visible.',
    next_action: 'Separar cálculo preliminar de afirmación oficial.',
  },
  roadmap_implementacion: {
    decision: 'Traducir diagnóstico en ruta por fases con gates humanos.',
    evidence: 'Brechas, dependencias, responsables, secuencia y documentos faltantes.',
    next_action: 'Cerrar G1 humano antes de abrir planeación contractual.',
  },
  infraestructura: {
    decision: 'Dimensionar centros, rutas y capacidad física según evidencia disponible.',
    evidence: 'Auditoría, rutas, centros de acopio, macrogeneradores y cobertura operativa.',
    next_action: 'Validar datos locales antes de presupuestar inversión.',
  },
  organigrama: {
    decision: 'Definir quién opera, quién valida y quién responde institucionalmente.',
    evidence: 'Organigrama, RACI, áreas municipales y usuarios vinculados.',
    next_action: 'Asignar responsables antes de cerrar módulos operativos.',
  },
  logistica: {
    decision: 'Planear rutas, ventanas y comunicación sin confundir estimación con operación real.',
    evidence: 'Rutas, PER, cobertura, encuesta y evidencia de campo.',
    next_action: 'Levantar estudio operativo si la ruta local falta.',
  },
  costos_programa: {
    decision: 'Separar CAPEX, OPEX y supuestos financieros con linaje completo.',
    evidence: 'Cotizaciones, presupuestos, precios ponderados y fórmula de cálculo.',
    next_action: 'Cargar cotizaciones locales o dejar escenario como preliminar.',
  },
  mercado_materiales: {
    decision: 'Validar compradores y mix de precios por calidad de material.',
    evidence: 'Compradores, precios locales/comparables, merma, logística y castigo por calidad.',
    next_action: 'Confirmar offtake antes de afirmar ingreso.',
  },
  esquema_concesion: {
    decision: 'Evaluar vehículo operativo sin sustituir decisión política o contractual.',
    evidence: 'Reglamento, riesgos, actores, costos y alternativas de operación.',
    next_action: 'Preparar opciones para revisión humana.',
  },
  arbol_financiamiento: {
    decision: 'Seleccionar ruta financiera defendible según evidencia y capacidad municipal.',
    evidence: 'Presupuesto, concesión, APP, fideicomiso, deuda o fondos con supuestos explícitos.',
    next_action: 'Validar con tesorería y jurídico.',
  },
  escenarios_financieros: {
    decision: 'Mostrar escenarios cerrados, no sliders libres para cliente.',
    evidence: 'Motor de precios, mix de materiales, captura estimada y sensibilidad.',
    next_action: 'Revisar supuestos como admin/founder y exportar límites.',
  },
  riesgos_modelo: {
    decision: 'Identificar riesgos técnicos, sociales, legales, financieros y de impugnación.',
    evidence: 'Matriz riesgo-impacto, brechas, claims bloqueados y mitigaciones.',
    next_action: 'Resolver riesgos críticos antes de Cabildo.',
  },
  expediente_cabildo: {
    decision: 'Preparar expediente preliminar sin publicar claims no defendibles.',
    evidence: 'Claims, citas, bibliografía, documentos, brechas y revisión humana.',
    next_action: 'Cerrar módulos previos antes de consolidar M15.',
  },
  inspeccion: {
    decision: 'Preparar monitoreo e inspección sólo después de gates de ejecución.',
    evidence: 'Reglamento, debido proceso, bitácora y responsables humanos.',
    next_action: 'Mantener bloqueado en validación si no existe G2.',
  },
  monitoreo_operativo: {
    decision: 'Comparar ejecución real contra lo planeado sin recalibrar opacamente.',
    evidence: 'Eventos operativos, deltas, reportes y fuente temporal.',
    next_action: 'Abrir sólo con etapa de ejecución activa.',
  },
  doble_materialidad: {
    decision: 'Reportar impactos con límites de evidencia y estándares aplicables.',
    evidence: 'Indicadores, metodología, fuente y alcance territorial.',
    next_action: 'Evitar reporte público sin trazabilidad completa.',
  },
  trazabilidad: {
    decision: 'Auditar cada claim, cálculo y fuente usada en el paquete.',
    evidence: 'Claim ledger, citas, metodología y estado humano.',
    next_action: 'Bloquear export si falta fuente o método.',
  },
  evm_dashboard: {
    decision: 'Monitorear avance presupuestal y operativo contra plan aprobado.',
    evidence: 'Eventos, presupuesto, ruta crítica y variaciones.',
    next_action: 'Usar sólo en ejecución con plan aprobado.',
  },
  risk_dashboard: {
    decision: 'Monitorear riesgos vivos y gates sin automatizar decisiones humanas.',
    evidence: 'Deltas, alertas, auditoría y revisión trimestral.',
    next_action: 'Escalar riesgos críticos al responsable humano.',
  },
}

function platformModuleFromCapability(module: CapabilityModule): DecisionModule {
  const copy = MODULE_DECISION_COPY[module.module_id] ?? {
    decision: 'Ordenar evidencia, brechas y decisiones humanas del módulo.',
    evidence: 'Documentos, fuentes, metodología, confianza y límites de uso.',
    next_action: 'Completar evidencia mínima o mantener brecha visible.',
  }
  return {
    module_id: module.module_id,
    label: moduleTitle(module.module_id, module.name),
    audience_mode: 'city_team',
    status: 'ready',
    nav_subtitle: module.legacy_number ?? moduleSubtitle(module.module_id),
    ...copy,
  }
}

function buildPlatformModuleCatalog(registry: CapabilityRegistry): DecisionModule[] {
  return registry.modules
    .slice()
    .sort((a, b) => {
      const orderA = typeof (a as CapabilityModule & { order?: number }).order === 'number' ? (a as CapabilityModule & { order: number }).order : 999
      const orderB = typeof (b as CapabilityModule & { order?: number }).order === 'number' ? (b as CapabilityModule & { order: number }).order : 999
      return orderA - orderB
    })
    .map(platformModuleFromCapability)
}

function PlatformModuleNav({
  modules,
  activeId,
  onChange,
  readOnlyModuleIds,
  platformLabel,
  moduleStatusById,
}: {
  modules: PlatformModule[]
  activeId: string
  onChange: (id: string) => void
  readOnlyModuleIds?: ReadonlySet<string>
  platformLabel?: string
  moduleStatusById?: Record<string, string>
}) {
  const modulesById = useMemo(
    () => Object.fromEntries(modules.map(module => [module.module_id, module])),
    [modules],
  )
  const groupedModules = modules.filter(module => isPlatformModuleGroup(module.module_id))
  const guide = modulesById.guia_circularidad
  const chapterGroups = CHAPTERS.map(chapter => {
    const chapterModules = chapter.modulos
      .map(id => modulesById[id])
      .filter(Boolean) as PlatformModule[]
    return { chapter, modules: chapterModules }
  }).filter(group => group.modules.length)

  return (
    <nav aria-label="Módulos de consultoría" className="text-[#8AAD78]">
      <div className="border-b border-[#2D4020] px-3 py-3">
        <p className="px-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#6A9A50]">
          Índice consultivo
        </p>
        <div className="mt-2 rounded-[6px] bg-[#243320] px-2 py-1.5 text-[9px] leading-snug text-[#8AAD78]">
          <span className="font-semibold uppercase tracking-wide">{platformLabel}</span>
          <span className="block text-[#6A9A50]">mismos módulos, evidencia local y brechas visibles</span>
        </div>
      </div>

      <div className="py-1.5">
        {groupedModules.length > 0 ? (
          groupedModules.map(module => (
            <PlatformModuleNavItem
              key={module.module_id}
              module={module}
              active={activeId === module.module_id}
              onChange={onChange}
              readOnly={readOnlyModuleIds?.has(module.module_id) ?? false}
              statusLabel={moduleStatusById?.[module.module_id]}
            />
          ))
        ) : guide && (
          <PlatformModuleNavItem
            module={guide}
            active={activeId === guide.module_id}
            onChange={onChange}
            readOnly={readOnlyModuleIds?.has(guide.module_id) ?? false}
            statusLabel={moduleStatusById?.[guide.module_id]}
          />
        )}
        {groupedModules.length === 0 && chapterGroups.map(({ chapter, modules }) => {
          const activeChapter = modules.some(module => module.module_id === activeId)
          return (
            <div key={chapter.num} className="border-t border-[#2D4020]">
              <div className="flex items-start gap-2 px-3 pb-1 pt-3">
                <span
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold"
                  style={{
                    background: activeChapter ? chapter.color : '#2D4020',
                    color: activeChapter ? '#fff' : '#6A9A50',
                  }}
                >
                  {chapter.num}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[10px] font-semibold uppercase tracking-[0.08em] ${activeChapter ? 'text-white' : 'text-[#CFE5C0]'}`}>
                    {chapter.label}
                  </span>
                  <span className="block text-[9px] leading-tight text-[#6A9A50]">
                    {chapter.question}
                  </span>
                </span>
              </div>
              <div className="pb-1">
                {modules.map(module => (
                  <PlatformModuleNavItem
                    key={module.module_id}
                    module={module}
                    active={module.module_id === activeId}
                    onChange={onChange}
                    readOnly={readOnlyModuleIds?.has(module.module_id) ?? false}
                    statusLabel={moduleStatusById?.[module.module_id]}
                    indent
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </nav>
  )
}

function PlatformModuleNavItem({
  module,
  active,
  onChange,
  readOnly,
  statusLabel,
  indent = false,
}: {
  module: PlatformModule
  active: boolean
  onChange: (id: string) => void
  readOnly: boolean
  statusLabel?: string
  indent?: boolean
}) {
  const blocked = statusLabel === 'Brecha documental'
  return (
    <button
      type="button"
      onClick={() => onChange(module.module_id)}
      className={`flex w-full items-start gap-2 border-l-2 px-3 py-2 text-left transition-colors ${
        active
          ? 'border-[#EAF3DE] bg-[#FDFCFA] text-[#1C1B18]'
          : 'border-transparent text-[#8AAD78] hover:bg-[#243320] hover:text-[#CFE5C0]'
      } ${indent ? 'pl-5' : ''}`}
      title={readOnly ? 'Lectura condicionada por etapa' : module.label}
    >
      <span className={`mt-0.5 flex h-5 w-7 shrink-0 items-center justify-center border text-[9px] font-semibold ${
        active ? 'border-[#D8D2C5] text-[#3B6D11]' : 'border-[#2D4020] text-[#6A9A50]'
      }`}>
        {visibleModuleNumber(module.module_id, moduleNumber(module.module_id))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold leading-tight">
          {moduleTitle(module.module_id, module.label)}
        </span>
        <span className={`mt-1 block text-[9px] leading-tight ${active ? 'text-[#6B6760]' : 'text-[#6A9A50]'}`}>
          {blocked ? 'Requiere documento' : statusLabel ?? moduleSubtitle(module.module_id, module.nav_subtitle)}
        </span>
      </span>
      {readOnly ? <Lock size={12} className="mt-1 shrink-0" /> : blocked ? <AlertTriangle size={12} className="mt-1 shrink-0" /> : null}
    </button>
  )
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
        La plataforma necesita un expediente municipal activo para separar municipio, zona metropolitana, documentos, gates y evidencia. Como admin, esta pantalla debe servir como filtro de trabajo, no como error técnico.
      </p>
      <p className="mt-2 max-w-3xl text-[12px] leading-6 text-[#6B6760]">
        Usa la vista Interna para revisar requests, gates y cargas pendientes; cambia a Cliente para confirmar qué verá el municipio sin herramientas de calibración.
      </p>

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
        <label className="block">
          <span className="sr-only">Filtrar ciudad o expediente</span>
          <input
            value={filter}
            onChange={event => setFilter(event.target.value)}
            placeholder="Filtrar por ciudad, estado, clave INEGI o expediente"
            className="h-11 w-full border border-[#D8D2C5] bg-white px-3 text-[13px] text-[#1C1B18] outline-none focus:border-[#8AA66F]"
          />
        </label>
        <a
          href="/admin"
          className="inline-flex h-11 items-center justify-center border border-[#D8D2C5] px-4 text-[13px] font-semibold text-[#3B3326]"
        >
          Gestionar municipios
        </a>
      </div>

      {error && (
        <div className="mt-4 border-l-4 border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 text-[12px] leading-5 text-[#765814]">
          No se pudo cargar el índice admin de municipios: {error}. Puedes entrar manualmente con el identificador interno si ya lo tienes o gestionarlo desde backoffice.
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
          <p className="text-[13px] text-[#6B6760]">No hay municipios visibles para este filtro.</p>
        )}
      </div>

      <div className="mt-6 border-t border-[#E8E4DC] pt-4">
        <p className="text-[12px] font-semibold text-[#1C1B18]">Entrar con identificador interno</p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            value={manualTenantId}
            onChange={event => setManualTenantId(event.target.value)}
            placeholder="expediente interno"
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

function ClientTenantMissingPanel() {
  return (
    <section className="mx-4 mt-6 max-w-4xl border-t border-[#D8D2C5] pt-6 sm:mx-6">
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
        Expediente municipal
      </p>
      <h1 className="mt-2 max-w-3xl font-serif text-[32px] leading-tight text-[#1C1B18]">
        Necesitamos vincular tu municipio para abrir la consultoría.
      </h1>
      <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#4A4740]">
        Entra desde tu perfil o completa el onboarding para asociar tu municipio, reglamento y equipo responsable. La experiencia consultiva se abre cuando existe un expediente municipal activo.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href="/perfil"
          className="inline-flex h-10 items-center justify-center bg-[#1C2B15] px-4 text-[13px] font-semibold text-white"
        >
          Ir a perfil
        </a>
        <a
          href="/onboarding/reglamento"
          className="inline-flex h-10 items-center justify-center border border-[#D8D2C5] px-4 text-[13px] font-semibold text-[#3B3326]"
        >
          Completar onboarding
        </a>
      </div>
    </section>
  )
}

function PlatformModuleWorkspace({
  module,
  tenantData,
  moduleCatalog,
  onNavigateModule,
  onValidateProposal,
}: {
  module: PlatformModule | null
  tenantData: TenantDiagnosticData | null
  moduleCatalog: PlatformModule[]
  onNavigateModule?: (moduleId: string) => void
  onValidateProposal?: () => void
}) {
  if (!module) return null
  const sociodemographicBlock = buildSociodemographicScaffoldBlock(
    tenantData?.municipio_id ? [tenantData.municipio_id] : [],
  )
  const group = isPlatformModuleGroup(module.module_id) ? PLATFORM_MODULE_GROUPS[module.module_id] : null
  const childModules = group ? childModulesForGroup(group.module_id, moduleCatalog) : [module]

  return (
    <section className="mx-4 mt-5 max-w-full overflow-hidden border-t border-[#D8D2C5] pt-5 sm:mx-6">
      {group && (
        <div className="mb-6 border-b border-[#D8D2C5] pb-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
            M{group.visible_number} · {group.nav_subtitle}
          </p>
          <h2 className="mt-2 font-serif text-[34px] leading-tight text-[#1C1B18]">
            {group.label}
          </h2>
          <p className="mt-3 max-w-4xl text-[14px] leading-7 text-[#4A4740]">
            {group.decision}
          </p>
          <p className="mt-2 max-w-4xl text-[12px] leading-6 text-[#6B6760]">
            Evidencia: {group.evidence}
          </p>
          <div className="mt-4 border-l-4 border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 text-[12px] leading-6 text-[#765814]">
            La plataforma puede calcular con bibliografía y fuentes comparables, pero cada cifra debe mostrar fuente, método, alcance y confianza. Benchmark, ZM y bibliografía comparable no sustituyen estudio local.
          </div>
          {group.module_id === 'validation_propuesta' && onValidateProposal && (
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onValidateProposal}
                className="w-fit bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white"
              >
                Validar propuesta y continuar a planeación
              </button>
              <p className="max-w-3xl text-[11px] leading-5 text-[#6B6760]">
                Esta validación habilita la planeación contractual de trabajo. No aprueba política pública, no cierra gates humanos y no sustituye revisión competente.
              </p>
            </div>
          )}
        </div>
      )}
      <div className="space-y-8">
        {childModules.map(childModule => (
          <div key={childModule.module_id} className="border-b border-[#E8E4DC] pb-8 last:border-b-0">
            {group && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="border border-[#D8D2C5] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3B6D11]">
                  M{visibleModuleNumber(childModule.module_id, moduleNumber(childModule.module_id))}
                </span>
                <span className="text-[12px] font-semibold text-[#1C1B18]">
                  {moduleTitle(childModule.module_id, childModule.label)}
                </span>
                <span className="text-[11px] text-[#6B6760]">
                  {moduleSubtitle(childModule.module_id, childModule.nav_subtitle)}
                </span>
              </div>
            )}
            {renderDecisionModule({
              module: childModule,
              audience: 'functionary',
              isOrganizationJourney: false,
              sociodemographicBlock,
              onNavigate: onNavigateModule,
            })}
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
        La plataforma puede preparar estructura, brechas y ruta de trabajo, pero el avance a {label.toLowerCase()} requiere revisión humana, evidencia mínima y gates institucionales. Las herramientas se muestran con límites y sin controles libres en vista cliente.
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
  const { user, isLoaded: userLoaded } = useUser()
  const userEmails = useMemo(
    () => user?.emailAddresses.map(item => item.emailAddress) ?? [],
    [user?.emailAddresses],
  )
  const canUseInternalView = useMemo(
    () => isFounderOrAdmin(user?.publicMetadata as Record<string, unknown> | undefined, user?.primaryEmailAddress?.emailAddress, userEmails),
    [user?.primaryEmailAddress?.emailAddress, user?.publicMetadata, userEmails],
  )

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
  const [viewMode, setViewMode] = useState<FounderViewMode>('client')
  const tenantData = useTenantData(tenantId)

  useEffect(() => {
    if (!userLoaded) return
    setViewMode(authorizedFounderViewMode(canUseInternalView, readFounderViewMode()))
    const onChange = (event: Event) => {
      if (!canUseInternalView) {
        setViewMode('client')
        return
      }
      const detail = (event as CustomEvent<{ mode?: FounderViewMode }>).detail
      setViewMode(detail?.mode === 'client' ? 'client' : 'admin')
    }
    window.addEventListener('alquimia:view-mode-change', onChange)
    return () => window.removeEventListener('alquimia:view-mode-change', onChange)
  }, [canUseInternalView, userLoaded])

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
        if (!resolvedState) throw new Error('No se pudo resolver el expediente municipal')
        const localProposalValidated = proposalValidationAllowsPlanning(tenantId, platformStage)
        const effectiveState: TenantStatePayload =
          localProposalValidated && resolvedState.state.current_stage === 'validation'
            ? {
                ...resolvedState,
                state: {
                  ...resolvedState.state,
                  current_stage: 'planning',
                  transition_mode: 'client_proposal_validated',
                },
              }
            : resolvedState
        if (resolvedState.municipal_context) {
          persistTenantMunicipalContext(resolvedState.municipal_context)
        }

        if (accessResult.status === 'rejected') {
          if (localProposalValidated) {
            if (!cancelled) {
              setTenantState(effectiveState)
              setRegistry(registryData as CapabilityRegistry)
            }
            return
          }
          if (fallbackState) {
            if (!cancelled) {
              setTenantState(fallbackState)
              setRegistry(registryData as CapabilityRegistry)
            }
            return
          }
          const currentPath = platformPathForStage(effectiveState.state.current_stage)
          if (currentPath !== pathname) {
            router.replace(`${currentPath}?tenant_id=${tenantId}`)
            return
          }
          throw accessResult.reason
        }

        const canonicalPath = platformPathForStage(effectiveState.state.current_stage)
        if (canonicalPath !== pathname) {
          router.replace(`${canonicalPath}?tenant_id=${tenantId}`)
          return
        }

        if (!cancelled) {
          setTenantState(effectiveState)
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
    if (!canUseInternalView) {
      setTenantOptions([])
      setTenantOptionsError(null)
      setTenantOptionsLoading(false)
      return
    }
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
          setTenantOptionsError(exc instanceof Error ? exc.message : 'No se pudo cargar municipios')
        }
      } finally {
        if (!cancelled) setTenantOptionsLoading(false)
      }
    }
    void loadTenantOptions()
    return () => { cancelled = true }
  }, [canUseInternalView, needsTenantSelection])

  const allModules = useMemo(
    () => registry ? buildPlatformModuleCatalog(registry) : [],
    [registry],
  )
  const platformModuleCatalog: PlatformModule[] = useMemo(
    () => allModules.map(module => ({ ...module, platform_readonly: false })),
    [allModules],
  )

  const platformModules: PlatformModule[] = useMemo(() => {
    if (!registry || !tenantState) return []
    return filterModulesForPlatform(allModules, registry, tenantState, platformStage)
  }, [allModules, platformStage, registry, tenantState])

  const adminClientPreview = canUseInternalView && searchParams.get('preview') === 'client'
  const clientPreview = viewMode === 'client' || adminClientPreview
  const visiblePlatformModules = useMemo(
    () => clientPreview ? groupedModulesForClientStage(platformStage) : platformModules,
    [clientPreview, platformModules, platformStage],
  )
  const readOnlyIds = useMemo(() => readOnlyModuleIds(visiblePlatformModules), [visiblePlatformModules])
  const badgeStage: ClientPlatformStage =
    !tenantState
      ? platformStage
      : tenantState.state.current_stage === 'planning'
      ? 'planning'
      : tenantState.state.current_stage === 'execution' || tenantState.state.current_stage === 'expansion'
        ? 'execution'
        : 'validation'

  useEffect(() => {
    if (!visiblePlatformModules.length) { setActiveModuleId(null); return }
    setActiveModuleId(prev => {
      const requestedModule = searchParams.get('module')
      if (requestedModule && visiblePlatformModules.some(module => module.module_id === requestedModule)) return requestedModule
      if (prev && visiblePlatformModules.some(module => module.module_id === prev)) return prev
      return visiblePlatformModules[0]?.module_id ?? null
    })
  }, [visiblePlatformModules, searchParams])

  const activeModule = useMemo(
    () => visiblePlatformModules.find(module => module.module_id === activeModuleId) ?? visiblePlatformModules[0] ?? null,
    [activeModuleId, visiblePlatformModules],
  )
  const validationPct = useMemo(() => {
    const metrics = tenantData.data?.metrics ?? []
    if (!metrics.length) return 0
    const verified = metrics.filter(metric => metric.status === 'verificado').length
    return Math.round((verified / metrics.length) * 100)
  }, [tenantData.data?.metrics])
  const platformPlanEmission = useMemo(() => {
    if (!tenantData.data) return null
    const registry = buildConsultingInputRegistry(tenantData.data)
    return {
      canEmitPlan: registry.legal_ready,
      blockedByReglamento: !registry.legal_ready,
      reglamentoGap: tenantData.data.document_gaps.find(gap =>
        gap.document_type === 'reglamento_limpia'
        && gap.status === 'pending'
        && !gap.marked_not_applicable
      ) ?? null,
    }
  }, [tenantData.data])
  const moduleStatusById = useMemo(() => {
    if (clientPreview) {
      return Object.fromEntries(
        visiblePlatformModules
          .filter(module => module.module_id !== 'guia_circularidad')
          .map(module => [module.module_id, moduleSubtitle(module.module_id, module.nav_subtitle)]),
      )
    }
    const gaps = tenantData.data?.document_gaps ?? []
    return Object.fromEntries(
      visiblePlatformModules
        .filter(module => module.module_id !== 'guia_circularidad')
        .map(module => {
          const hasGap = gaps.some(gap =>
            gap.status === 'pending'
            && !gap.marked_not_applicable
            && (
              gap.module_id === module.module_id
              || gap.module_id === null
              || (isPlatformModuleGroup(module.module_id)
                && PLATFORM_MODULE_GROUPS[module.module_id].child_module_ids.includes(gap.module_id ?? ''))
            )
          )
          return [module.module_id, hasGap ? 'Brecha documental' : moduleSubtitle(module.module_id, module.nav_subtitle)]
        }),
    )
  }, [clientPreview, visiblePlatformModules, tenantData.data?.document_gaps])

  function openTenant(nextTenantId: string) {
    const cleanTenantId = nextTenantId.trim()
    if (!cleanTenantId) return
    localStorage.setItem('alquimia.tenantId', cleanTenantId)
    router.replace(`${pathname}?tenant_id=${encodeURIComponent(cleanTenantId)}`)
  }

  function validateProposalAndOpenPlanning() {
    if (!tenantId) return
    try {
      localStorage.setItem(`alquimia.proposalValidated.${tenantId}`, new Date().toISOString())
      window.dispatchEvent(new CustomEvent('alquimia:proposal-validated', {
        detail: { tenant_id: tenantId, from_stage: 'validation', to_stage: 'planning' },
      }))
    } catch {
      /* local audit is best-effort; backend transition remains human-controlled */
    }
    router.push(`/p?tenant_id=${encodeURIComponent(tenantId)}`)
  }

  const moduleNav = visiblePlatformModules.length > 0 ? (
    <PlatformModuleNav
      modules={visiblePlatformModules}
      activeId={activeModuleId ?? ''}
      onChange={setActiveModuleId}
      readOnlyModuleIds={readOnlyIds}
      platformLabel={PLATFORM_LABEL_BY_STAGE[platformStage]}
      moduleStatusById={moduleStatusById}
    />
  ) : undefined

  return (
    <div className="h-screen flex overflow-hidden bg-surface-base">
      <Sidebar moduleSection={moduleNav} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <InstitutionalHeader label="Diagnóstico municipal" />
        <div className="border-b border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <PlatformStageBadge stage={badgeStage} />
              <p className="min-w-0 max-w-[30ch] break-words text-[12px] leading-5 text-[#6B6760] sm:max-w-full">
                {tenantData.data?.municipality ?? `Municipio ${tenantState?.municipal_context?.municipality ?? 'sin seleccionar'}`} · diagnóstico inicial con fuente, método y confianza
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
        {tenantId === 'municipio-demo' && (
          <div className="border-b border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 sm:px-6">
            <p className="text-[12px] font-semibold leading-5 text-[#765814]">
              Demo bibliográfico · San Luis Potosí usa fuentes públicas y cálculos trazables. No sustituye revisión humana ni estudios locales faltantes.
            </p>
          </div>
        )}
        {adminClientPreview && (
          <div className="border-b border-[#D7B56D] bg-[#FFF9EA] px-4 py-3 sm:px-6">
            <p className="text-[12px] font-semibold leading-5 text-[#765814]">
              Previsualización cliente · modo interno de solo lectura. Los uploads, gates, tenant IDs y readiness admin permanecen fuera de esta vista.
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
          ) : needsTenantSelection && canUseInternalView ? (
            <TenantSelectionPanel
              tenants={tenantOptions}
              loading={tenantOptionsLoading}
              error={tenantOptionsError}
              onSelect={openTenant}
            />
          ) : needsTenantSelection ? (
            <ClientTenantMissingPanel />
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
                    {!clientPreview && platformPlanEmission?.canEmitPlan && (
                      <a
                        href={`/api/tenants/${encodeURIComponent(tenantData.data.tenant_id)}/export-zip`}
                        className="rounded-[8px] bg-[#1C2B15] px-4 py-2 text-[13px] font-semibold text-white"
                      >
                        Exportar ZIP preliminar
                      </a>
                    )}
                    {!clientPreview && platformPlanEmission?.blockedByReglamento && (
                      <button
                        type="button"
                        onClick={() => setActiveModuleId('marco_legal')}
                        className="rounded-[8px] border border-[#EBC0BA] bg-[#FBEAEA] px-4 py-2 text-[13px] font-semibold text-[#A8322A]"
                        title={platformPlanEmission.reglamentoGap?.reason ?? 'Falta reglamento vigente'}
                      >
                        Cargar reglamento para emitir plan
                      </button>
                    )}
                  </div>
                  <div className="mt-5 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
                    {tenantData.data.metrics.slice(0, 3).map(metric => (
                      <div key={metric.id} className="grid gap-3 py-3 lg:grid-cols-[minmax(0,1fr)_180px] lg:items-center">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-[#1C1B18]">{metric.label}</p>
                          <p className="mt-1 max-w-4xl break-words text-[11px] leading-5 text-[#6B6760]">
                            Fuente: {metric.source} · Fecha: {metric.source_date} · Método: {metric.method} · Alcance: {metric.territorial_scope}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <MetricConfidencePill confidence={metric.confidence} />
                          <span className="text-[13px] font-semibold text-[#1C1B18]">
                            {metric.value ?? 'Brecha crítica'} <span className="font-normal text-[#6B6760]">{metric.unit}</span>
                            <Citation metric={metric} metrics={tenantData.data?.metrics ?? []} />
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {tenantData.data && !clientPreview && (
                <DocumentGapBanner
                  tenantId={tenantData.data.tenant_id}
                  moduleId={isPlatformModuleGroup(activeModule?.module_id) ? null : activeModule?.module_id ?? null}
                  gaps={tenantData.data.document_gaps}
                  documents={tenantData.data.tenant_documents}
                  onChanged={tenantData.reload}
                />
              )}
              {!clientPreview && <StageReadinessNotice stage={platformStage} clientPreview={clientPreview} />}
              {tenantData.data && !clientPreview && (
                <section className="mx-4 mt-5 max-w-full border-y border-[#D8D2C5] py-4 sm:mx-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-3xl">
                      <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Siguiente paso humano</p>
                      <h2 className="mt-1 font-serif text-[24px] leading-tight text-[#1C1B18]">
                        {platformPlanEmission?.canEmitPlan
                          ? 'Tu diagnóstico inicial está listo.'
                          : 'Falta reglamento para emitir plan.'}
                      </h2>
                      <p className="mt-2 text-[13px] leading-6 text-[#5C574F]">
                        {platformPlanEmission?.canEmitPlan
                          ? 'El siguiente paso es revisarlo con el equipo ALQUIMIA, validar datos críticos y definir si el municipio puede avanzar a una ruta de implementación.'
                          : 'La plataforma puede ordenar diagnóstico y brechas, pero no debe emitir plan/declaratoria formal hasta cargar y cotejar el reglamento vigente.'}
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
                        onClick={() => platformPlanEmission?.blockedByReglamento ? setActiveModuleId('marco_legal') : undefined}
                        className="rounded-[8px] border border-[#D8D2C5] px-4 py-2 text-[13px] font-semibold text-[#3B3326]"
                      >
                        {platformPlanEmission?.blockedByReglamento ? 'Ir a marco legal' : 'Seguir explorando'}
                      </button>
                    </div>
                  </div>
                </section>
              )}
              <PlatformModuleWorkspace
                module={activeModule}
                tenantData={tenantData.data ?? null}
                moduleCatalog={platformModuleCatalog}
                onNavigateModule={setActiveModuleId}
                onValidateProposal={clientPreview && platformStage === 'validation' ? validateProposalAndOpenPlanning : undefined}
              />
              {tenantData.data && (
                <ConsultingPackagePanel
                  tenantData={tenantData.data}
                  showTechnicalPanel={!clientPreview}
                />
              )}
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
    </div>
  )
}
