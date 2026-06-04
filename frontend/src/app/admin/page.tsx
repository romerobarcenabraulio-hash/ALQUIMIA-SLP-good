'use client'

import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, CheckCircle2, FileCheck2, Landmark, Plus, RefreshCw, ScrollText, Search, ShieldCheck, Users, Lock } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'
import { AppShell } from '@/components/layout/AppShell'
import { ALQUIMIA_TEMPLATE_REGISTRY } from '@/lib/alquimiaTemplates'
import type { TemplateReadiness } from '@/lib/alquimiaTemplates'
import { getApiUrl } from '@/lib/api'
import type { MunicipalityPreparationStatus } from '@/lib/municipalityPreparation'

type TenantStage = 'validation' | 'planning' | 'execution' | 'expansion'
type TierComercial = 'diagnostico' | 'implementacion' | 'operacion_completa'
type AdminTenantTab = 'resumen' | 'documentos' | 'usuarios' | 'gates' | 'bibliografia' | 'exports' | 'auditoria'

const ADMIN_TENANT_TABS: Array<{ id: AdminTenantTab; label: string }> = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'documentos', label: 'Documentos' },
  { id: 'usuarios', label: 'Usuarios' },
  { id: 'gates', label: 'Gates' },
  { id: 'bibliografia', label: 'Bibliografía' },
  { id: 'exports', label: 'Exports' },
  { id: 'auditoria', label: 'Auditoría' },
]

interface TenantGate {
  gate_id: string
  status: string
  evidencia_url: string | null
  evidencia_label: string | null
  decisor_humano: string | null
  closed_at: string | null
}

interface TenantCapability {
  module_id: string
  active: boolean
  source: string
}

interface TenantAuditLog {
  id: string
  actor: string
  action: string
  payload: Record<string, unknown>
  created_at: string
}

interface AdminTenant {
  id: string
  nombre: string
  estado_mx: string
  municipio_id: string
  inegi_clave: string
  tier_comercial: TierComercial
  state: {
    current_stage: TenantStage
    transition_mode: string
    fecha_ingreso: string
    fecha_cambio_stage: string
  }
  gates: TenantGate[]
  capabilities: TenantCapability[]
  audit_log: TenantAuditLog[]
  municipal_profile?: {
    mode: string
    antecedentes: Record<string, unknown>
    mapa_social: Record<string, unknown>
    organigrama_servicio: Record<string, unknown>
    provenance_status: string
  }
  regulation_status?: string
  preparation_status?: MunicipalityPreparationStatus
  preparation_label?: string
  next_founder_action?: string
}

interface InegiState {
  estado_id: string
  estado_nombre: string
}

interface InegiMunicipality {
  clave_inegi: string
  nombre: string
  estado_id: string
  estado_nombre: string
  municipio_id: string
  zm: string
  datos_estimados: boolean
  source: string
}

interface AdminErpMunicipalityRow {
  clave_inegi: string
  municipio: string
  estado: string
  estado_id?: string
  municipio_id: string
  zm: string
  tenant_id?: string | null
  tenant_nombre?: string | null
  stage?: TenantStage | null
  tier?: TierComercial | null
  regulation_status: string
  users_count: number
  client_users_count: number
  admin_users_count: number
  primary_contact?: {
    email?: string | null
    nombre?: string | null
    organizacion?: string | null
    rol?: string | null
  } | null
  link_status: 'sin_tenant' | 'tenant_sin_usuario' | 'usuario_sin_tenant' | 'vinculado' | 'duplicado'
  duplicate_tenants_count: number
  preparation_status?: MunicipalityPreparationStatus
  preparation_label?: string
  next_founder_action?: string
}

interface TenantDocumentDraft {
  id: string
  document_type: string
  title: string
  status: string
  qa_status: string
  can_export_ok: boolean
  version: number
  blockers: Array<Record<string, unknown>>
  warnings: string[]
  updated_at: string
}

interface NousPattern {
  id: string
  pattern_layer: number
  pattern_status: string
  pattern_description_natural: string
  observations_count: number
  confidence_level: string
  statistical_significance: string | null
  published_to_clients: boolean
  founder_gate_status: string
}

interface NousA11Panel {
  feature_gated: boolean
  client_publication_enabled: boolean
  automatic_recalibration_enabled: boolean
  tabs: Record<string, {
    label: string
    patterns?: NousPattern[]
    published_to_clients?: NousPattern[]
    retired_or_rejected?: NousPattern[]
    metrics?: Record<string, number>
    report_status?: string
    summary?: string
  }>
}

interface EvidenceRecommendation {
  id: string
  tag: 'local' | 'comparable' | 'benchmark' | 'solo_contexto' | 'no_usable'
  confidence: 'high' | 'medium' | 'low' | 'blocked'
  supported_claim: string
  unsupported_claim: string
  explanation: string
  stage: TenantStage
  module_id: string
  score: { total: number }
  record: {
    title: string
    institution: string
    municipality: string
    territorial_scope: string
    method: string
    source_date: string
  }
}

interface StageEvidenceCoverage {
  stage: TenantStage
  label: string
  local_count: number
  comparable_count: number
  benchmark_count: number
  blocked_count: number
  recommendations: EvidenceRecommendation[]
}

interface TenantConsultingPackageApiResponse {
  export_manifest?: {
    template_readiness?: TemplateReadiness[]
  }
}

const documentTypes = [
  ['expediente_cabildo', 'Expediente Cabildo'],
  ['reforma_reglamentaria_3_articulos', 'Reforma reglamentaria'],
  ['acuerdo_cabildo', 'Acuerdo de Cabildo'],
  ['adenda_concesion', 'Adenda de concesión'],
  ['reporte_mensual_esg_gri_306', 'Reporte ESG / GRI 306'],
  ['oficio_estandar', 'Oficio estándar'],
] as const

const emptyForm = {
  nombre: '',
  estado_mx: '',
  municipio_id: '',
  inegi_clave: '',
  tier_comercial: 'diagnostico' as TierComercial,
}

const fallbackStates: InegiState[] = [
  ['01', 'Aguascalientes'], ['02', 'Baja California'], ['03', 'Baja California Sur'], ['04', 'Campeche'],
  ['05', 'Coahuila de Zaragoza'], ['06', 'Colima'], ['07', 'Chiapas'], ['08', 'Chihuahua'],
  ['09', 'Ciudad de México'], ['10', 'Durango'], ['11', 'Guanajuato'], ['12', 'Guerrero'],
  ['13', 'Hidalgo'], ['14', 'Jalisco'], ['15', 'México'], ['16', 'Michoacán de Ocampo'],
  ['17', 'Morelos'], ['18', 'Nayarit'], ['19', 'Nuevo León'], ['20', 'Oaxaca'],
  ['21', 'Puebla'], ['22', 'Querétaro'], ['23', 'Quintana Roo'], ['24', 'San Luis Potosí'],
  ['25', 'Sinaloa'], ['26', 'Sonora'], ['27', 'Tabasco'], ['28', 'Tamaulipas'],
  ['29', 'Tlaxcala'], ['30', 'Veracruz de Ignacio de la Llave'], ['31', 'Yucatán'], ['32', 'Zacatecas'],
].map(([estado_id, estado_nombre]) => ({ estado_id, estado_nombre }))

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('alquimia_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function statusClass(status: string) {
  if (status === 'cerrado') return 'bg-[#EAF3DE] text-[#2F5B0D] border-[#C9DDB1]'
  if (status === 'en_revision') return 'bg-[#FEF7E7] text-[#8A5C05] border-[#F5DCA0]'
  if (status === 'fallido') return 'bg-[#FBEAEA] text-[#A8322A] border-[#EBC0BA]'
  return 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC]'
}

function linkStatusLabel(status: AdminErpMunicipalityRow['link_status']) {
  if (status === 'vinculado') return 'Vinculado'
  if (status === 'tenant_sin_usuario') return 'Tenant sin usuario'
  if (status === 'usuario_sin_tenant') return 'Usuario sin tenant'
  if (status === 'duplicado') return 'Duplicado'
  return 'Sin tenant'
}

function linkStatusClass(status: AdminErpMunicipalityRow['link_status']) {
  if (status === 'vinculado') return 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'
  if (status === 'duplicado') return 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]'
  if (status === 'tenant_sin_usuario' || status === 'usuario_sin_tenant') return 'border-[#F5DCA0] bg-[#FEF7E7] text-[#8A5C05]'
  return 'border-[#E8E4DC] bg-white text-[#6B6760]'
}

function preparationStatusClass(status?: MunicipalityPreparationStatus) {
  if (status === 'en_cliente' || status === 'listo_para_cliente') return 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'
  if (status === 'bibliografia_minima' || status === 'reglamento_cargado') return 'border-[#F5DCA0] bg-[#FEF7E7] text-[#8A5C05]'
  if (status === 'reglamento_identificado') return 'border-[#D8D2C5] bg-white text-[#5C574F]'
  return 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]'
}

async function fetchAdminJson<T>(backendPath: string, localPath: string, headers: HeadersInit): Promise<T> {
  const backendUrl = `${getApiUrl()}${backendPath}`
  try {
    const backendRes = await fetch(backendUrl, { headers })
    const backendData = await backendRes.json().catch(() => ({}))
    if (backendRes.ok) return backendData as T
  } catch {
    // Fall back to the local Next route below.
  }
  const localRes = await fetch(localPath)
  const localData = await localRes.json().catch(() => ({}))
  if (!localRes.ok) throw new Error((localData as { detail?: string }).detail ?? `HTTP ${localRes.status}`)
  return localData as T
}

export default function AdminPage() {
  const { canAccessAdminPanel } = useRBAC()

  // Access control check
  if (!canAccessAdminPanel) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center max-w-md">
            <Lock className="mx-auto h-12 w-12 text-gray-400" />
            <h1 className="mt-4 text-xl font-semibold text-gray-900">Acceso denegado</h1>
            <p className="mt-2 text-sm text-gray-600">
              Solo los administradores pueden acceder al panel de administración
            </p>
          </div>
        </div>
      </AppShell>
    )
  }

  const [tenants, setTenants] = useState<AdminTenant[]>([])
  const [states, setStates] = useState<InegiState[]>(fallbackStates)
  const [municipalities, setMunicipalities] = useState<InegiMunicipality[]>([])
  const [erpRows, setErpRows] = useState<AdminErpMunicipalityRow[]>([])
  const [erpFilters, setErpFilters] = useState({
    q: '',
    estado_id: '',
    stage: '',
    tier: '',
    status: '',
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [evidence, setEvidence] = useState({
    gate_id: 'G1',
    evidencia_url: '',
    evidencia_label: '',
    decisor_humano: 'Founder',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState({
    antecedentes: '{}',
    mapa_social: '{"actores":[]}',
    organigrama_servicio: '{}',
    provenance_status: 'pendiente_verificacion',
  })
  const [documents, setDocuments] = useState<TenantDocumentDraft[]>([])
  const [documentType, setDocumentType] = useState<(typeof documentTypes)[number][0]>('expediente_cabildo')
  const [a11, setA11] = useState<NousA11Panel | null>(null)
  const [bibliographyStage, setBibliographyStage] = useState<TenantStage>('validation')
  const [bibliographyModule, setBibliographyModule] = useState('')
  const [evidenceRecommendations, setEvidenceRecommendations] = useState<EvidenceRecommendation[]>([])
  const [evidenceCoverage, setEvidenceCoverage] = useState<StageEvidenceCoverage[]>([])
  const [activeTenantTab, setActiveTenantTab] = useState<AdminTenantTab>('resumen')
  const [templateReadiness, setTemplateReadiness] = useState<TemplateReadiness[]>([])

  const selected = useMemo(
    () => tenants.find(t => t.id === selectedId) ?? tenants[0] ?? null,
    [selectedId, tenants],
  )

  const fallbackErpRows = useMemo<AdminErpMunicipalityRow[]>(() => tenants.map(tenant => ({
    clave_inegi: tenant.inegi_clave,
    municipio: tenant.nombre,
    estado: tenant.estado_mx,
    municipio_id: tenant.municipio_id,
    zm: '',
    tenant_id: tenant.id,
    tenant_nombre: tenant.nombre,
    stage: tenant.state.current_stage,
    tier: tenant.tier_comercial,
    regulation_status: 'unknown',
    users_count: 0,
    client_users_count: 0,
    admin_users_count: 0,
    primary_contact: null,
    link_status: 'tenant_sin_usuario' as const,
    duplicate_tenants_count: 1,
    preparation_status: tenant.preparation_status,
    preparation_label: tenant.preparation_label,
    next_founder_action: tenant.next_founder_action,
  })).filter(row => {
    const q = erpFilters.q.trim().toLowerCase()
    const matchesQ = !q || `${row.municipio} ${row.estado} ${row.clave_inegi} ${row.tenant_nombre}`.toLowerCase().includes(q)
    const matchesStage = !erpFilters.stage || row.stage === erpFilters.stage
    const matchesTier = !erpFilters.tier || row.tier === erpFilters.tier
    const matchesStatus = !erpFilters.status || row.link_status === erpFilters.status
    return matchesQ && matchesStage && matchesTier && matchesStatus
  }), [erpFilters.q, erpFilters.stage, erpFilters.status, erpFilters.tier, tenants])

  const visibleErpRows = erpRows.length ? erpRows : fallbackErpRows

  const selectedErpRow = useMemo(() => {
    if (!selected) return null
    return visibleErpRows.find(row => row.tenant_id === selected.id || row.clave_inegi === selected.inegi_clave) ?? null
  }, [selected, visibleErpRows])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const tenantId = params.get('tenant_id') ?? params.get('tenant')
    if (tenantId) setSelectedId(tenantId)
  }, [])

  useEffect(() => {
    const profile = selected?.municipal_profile
    if (!profile) return
    setProfileDraft({
      antecedentes: JSON.stringify(profile.antecedentes ?? {}, null, 2),
      mapa_social: JSON.stringify(profile.mapa_social ?? { actores: [] }, null, 2),
      organigrama_servicio: JSON.stringify(profile.organigrama_servicio ?? {}, null, 2),
      provenance_status: profile.provenance_status ?? 'pendiente_verificacion',
    })
  }, [selected?.id, selected?.municipal_profile])

  useEffect(() => {
    setActiveTenantTab('resumen')
  }, [selected?.id])

  useEffect(() => {
    if (!selected?.id) {
      setDocuments([])
      setTemplateReadiness([])
      return
    }
    void loadDocuments(selected.id)
    void loadTemplateReadiness(selected.id)
    void loadBibliographyPanel(selected.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id])

  async function loadTenants(nextSelectedId?: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/tenants')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      const next = data.tenants ?? []
      setTenants(next)
      if (nextSelectedId) setSelectedId(nextSelectedId)
      else if (!selectedId && next[0]) setSelectedId(next[0].id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo cargar tenants')
    } finally {
      setLoading(false)
    }
  }

  async function loadInegiStates() {
    try {
      const data = await fetchAdminJson<{ states?: InegiState[] }>('/admin/inegi/states', '/api/admin/inegi/states', authHeaders())
      if (Array.isArray(data.states)) setStates(data.states)
    } catch {
      setStates(fallbackStates)
    }
  }

  async function loadMunicipalitiesForState(estadoId = erpFilters.estado_id, query = erpFilters.q) {
    if (!estadoId) {
      setMunicipalities([])
      return
    }
    try {
      const params = new URLSearchParams({ estado_id: estadoId, limit: '120' })
      if (query.trim()) params.set('q', query.trim())
      const data = await fetchAdminJson<{ municipalities?: InegiMunicipality[] }>(
        `/admin/inegi/municipalities?${params.toString()}`,
        `/api/admin/inegi/municipalities?${params.toString()}`,
        authHeaders(),
      )
      setMunicipalities(data.municipalities ?? [])
    } catch {
      setMunicipalities([])
    }
  }

  async function loadErpRows() {
    try {
      const params = new URLSearchParams()
      Object.entries(erpFilters).forEach(([key, value]) => {
        if (value.trim()) params.set(key, value.trim())
      })
      const data = await fetchAdminJson<{ rows?: AdminErpMunicipalityRow[] }>(
        `/admin/erp/municipalities?${params.toString()}`,
        `/api/admin/erp/municipalities?${params.toString()}`,
        authHeaders(),
      )
      setErpRows(data.rows ?? [])
    } catch {
      setErpRows([])
    }
  }

  async function loadDocuments(tenantId: string) {
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants/${tenantId}/documents`, { headers: authHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setDocuments(data.a6_documentacion_generada ?? [])
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo cargar A6 Documentación generada')
    }
  }

  async function loadTemplateReadiness(tenantId: string) {
    try {
      const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/consulting-package`)
      const data = await res.json().catch(() => ({})) as TenantConsultingPackageApiResponse
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setTemplateReadiness(data.export_manifest?.template_readiness ?? [])
    } catch {
      setTemplateReadiness([])
    }
  }

  async function loadA11Panel() {
    try {
      const res = await fetch(`${getApiUrl()}/admin/nous/a11`, { headers: authHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setA11(data)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo cargar A11 aprendizaje')
    }
  }

  async function loadBibliographyPanel(tenantId = selected?.id) {
    if (!tenantId) return
    try {
      const params = new URLSearchParams({ tenant_id: tenantId, stage: bibliographyStage })
      if (bibliographyModule.trim()) params.set('module_id', bibliographyModule.trim())
      const [recommendationsRes, coverageRes] = await Promise.all([
        fetch(`${getApiUrl()}/admin/bibliography/recommendations?${params.toString()}`, { headers: authHeaders() }),
        fetch(`${getApiUrl()}/admin/bibliography/coverage?tenant_id=${encodeURIComponent(tenantId)}`, { headers: authHeaders() }),
      ])
      const recommendationsData = await recommendationsRes.json().catch(() => ({}))
      const coverageData = await coverageRes.json().catch(() => ({}))
      if (!recommendationsRes.ok) throw new Error(recommendationsData.detail ?? `HTTP ${recommendationsRes.status}`)
      if (!coverageRes.ok) throw new Error(coverageData.detail ?? `HTTP ${coverageRes.status}`)
      setEvidenceRecommendations(recommendationsData.recommendations ?? [])
      setEvidenceCoverage(coverageData.stage_evidence_map ?? [])
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo cargar bibliografía compatible')
    }
  }

  useEffect(() => {
    void loadTenants()
    void loadA11Panel()
    void loadInegiStates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void loadErpRows()
    void loadMunicipalitiesForState()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erpFilters.estado_id, erpFilters.stage, erpFilters.status, erpFilters.tier])

  useEffect(() => {
    if (selected?.id) void loadBibliographyPanel(selected.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bibliographyStage, bibliographyModule])

  async function createTenant() {
    setError(null)
    setMessage(null)
    const payload = { ...form, current_stage: 'validation' }
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setForm(emptyForm)
      setMessage(`Tenant creado: ${data.nombre}`)
      await loadTenants(data.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo crear tenant')
    }
  }

  function selectMunicipality(row: InegiMunicipality) {
    setForm(prev => ({
      ...prev,
      nombre: row.nombre,
      estado_mx: row.estado_nombre,
      municipio_id: row.municipio_id,
      inegi_clave: row.clave_inegi,
    }))
    setMessage(`Municipio seleccionado desde INEGI: ${row.nombre}`)
  }

  async function registerEvidence() {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/gates/${evidence.gate_id}/evidence`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(evidence),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`Evidencia registrada para ${evidence.gate_id}`)
      await loadTenants(data.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo registrar evidencia')
    }
  }

  async function closeGate() {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/gates/${evidence.gate_id}/close`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          evidencia_url: evidence.evidencia_url || undefined,
          evidencia_label: evidence.evidencia_label || undefined,
          decisor_humano: evidence.decisor_humano,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`${evidence.gate_id} cerrado manualmente`)
      await loadTenants(data.id)
      await loadA11Panel()
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo cerrar gate')
    }
  }

  async function generateDocumentDraft() {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/documents/drafts`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ document_type: documentType, notes: 'Generado desde A6 Plataforma 0' }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`Borrador generado: ${data.title} · ${data.qa_status}`)
      await loadDocuments(selected.id)
      await loadTenants(selected.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo generar borrador documental')
    }
  }

  async function runExportCheck(documentId: string) {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/documents/${documentId}/export-check`, {
        method: 'POST',
        headers: authHeaders(),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`Export-check: ${data.qa_status} · ok=${String(data.can_export_ok)}`)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo verificar export')
    }
  }

  async function reviewNousPattern(patternId: string, action: 'approve_internal' | 'reject' | 'postpone' | 'retire') {
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/nous/patterns/${patternId}/review`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ action, notes: `A11 ${action}` }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`Aprendizaje: ${data.pattern_status}`)
      await loadA11Panel()
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo revisar patrón de aprendizaje')
    }
  }

  async function withdrawNousPattern(patternId: string) {
    try {
      const res = await fetch(`${getApiUrl()}/admin/nous/patterns/${patternId}/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ action: 'retire', notes: 'Retiro manual desde A11' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail ?? 'No se pudo retirar sugerencia de aprendizaje')
      setMessage('Aprendizaje: sugerencia retirada de cliente')
      await loadA11Panel()
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo retirar sugerencia de aprendizaje')
    }
  }

  async function saveMunicipalProfile() {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const payload = {
        antecedentes: JSON.parse(profileDraft.antecedentes),
        mapa_social: JSON.parse(profileDraft.mapa_social),
        organigrama_servicio: JSON.parse(profileDraft.organigrama_servicio),
        provenance_status: profileDraft.provenance_status,
      }
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/municipal-profile`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`Perfil municipal actualizado: ${data.municipal_profile?.mode ?? 'carga_inicial'}`)
      await loadTenants(data.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo guardar perfil municipal')
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-[#8E8980]">/admin · Plataforma 0</p>
            <h1 className="font-serif text-[26px] text-[#1C1B18]">Gestor municipal</h1>
          </div>
          <button
            type="button"
            onClick={() => {
              void loadTenants()
              void loadErpRows()
              void loadMunicipalitiesForState()
            }}
            className="inline-flex h-9 items-center gap-2 border border-[#D8D1C4] bg-[#FDFCFA] px-3 text-[12px] font-medium text-[#1C1B18]"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {(message || error) && (
          <div className={`mb-4 border px-4 py-3 text-[12px] ${error ? 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]' : 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'}`}>
            {error ?? message}
          </div>
        )}

        <section className="mb-5 border border-[#E1DACE] bg-[#FDFCFA] px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Admin Operativo</p>
              <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#5C574F]">
                El founder prepara municipios, opera tenants y previsualiza la Vista Cliente sin mover documentos, gates ni IDs internos a `/v`.
              </p>
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="Zonas de administración">
              {[
                ['#admin-tabla-maestra', 'Tabla maestra'],
                ['#admin-preparacion', 'Preparación municipal'],
                ['#admin-operacion', 'Operación tenant'],
                ['#admin-previsualizacion', 'Previsualización'],
              ].map(([href, label]) => (
                <a key={href} href={href} className="border border-[#D8D1C4] bg-white px-3 py-2 text-[11px] font-semibold text-[#1C1B18]">
                  {label}
                </a>
              ))}
            </nav>
          </div>
        </section>

        <section id="admin-tabla-maestra" className="mb-5 scroll-mt-20 border border-[#E1DACE] bg-[#FDFCFA]">
          <div className="border-b border-[#E8E4DC] px-4 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Users size={16} className="text-[#3B6D11]" />
              <h2 className="text-[13px] font-semibold text-[#1C1B18]">Municipios, clientes y usuarios</h2>
            </div>
            <div className="grid gap-2 md:grid-cols-[minmax(180px,1fr)_150px_150px_150px_150px_auto]">
              <label className="relative block">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8980]" />
                <input
                  value={erpFilters.q}
                  onChange={event => setErpFilters(prev => ({ ...prev, q: event.target.value }))}
                  onKeyDown={event => {
                    if (event.key === 'Enter') {
                      void loadErpRows()
                      void loadMunicipalitiesForState()
                    }
                  }}
                  placeholder="Municipio, INEGI, cliente o usuario"
                  className="h-9 w-full border border-[#D8D1C4] bg-white pl-9 pr-3 text-[12px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
                />
              </label>
              <select
                value={erpFilters.estado_id}
                onChange={event => setErpFilters(prev => ({ ...prev, estado_id: event.target.value }))}
                className="h-9 border border-[#D8D1C4] bg-white px-2 text-[12px] text-[#1C1B18]"
              >
                <option value="">Todos los estados</option>
                {states.map(state => <option key={state.estado_id} value={state.estado_id}>{state.estado_nombre}</option>)}
              </select>
              <select
                value={erpFilters.stage}
                onChange={event => setErpFilters(prev => ({ ...prev, stage: event.target.value }))}
                className="h-9 border border-[#D8D1C4] bg-white px-2 text-[12px] text-[#1C1B18]"
              >
                <option value="">Todas las etapas</option>
                <option value="validation">Validación</option>
                <option value="planning">Planeación</option>
                <option value="execution">Ejecución</option>
              </select>
              <select
                value={erpFilters.tier}
                onChange={event => setErpFilters(prev => ({ ...prev, tier: event.target.value }))}
                className="h-9 border border-[#D8D1C4] bg-white px-2 text-[12px] text-[#1C1B18]"
              >
                <option value="">Todos los tiers</option>
                <option value="diagnostico">Diagnóstico</option>
                <option value="implementacion">Implementación</option>
                <option value="operacion_completa">Operación completa</option>
              </select>
              <select
                value={erpFilters.status}
                onChange={event => setErpFilters(prev => ({ ...prev, status: event.target.value }))}
                className="h-9 border border-[#D8D1C4] bg-white px-2 text-[12px] text-[#1C1B18]"
              >
                <option value="">Todos los vínculos</option>
                <option value="vinculado">Vinculado</option>
                <option value="tenant_sin_usuario">Tenant sin usuario</option>
                <option value="usuario_sin_tenant">Usuario sin tenant</option>
                <option value="sin_tenant">Sin tenant</option>
                <option value="duplicado">Duplicado</option>
              </select>
              <button
                type="button"
                onClick={() => {
                  void loadErpRows()
                  void loadMunicipalitiesForState()
                }}
                className="h-9 bg-[#1C1B18] px-4 text-[12px] font-semibold text-white"
              >
                Filtrar
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1260px] text-[12px]">
              <thead>
                <tr className="border-b border-[#E8E4DC] text-left text-[#6B6760]">
                  <th className="px-4 py-2 font-medium">Municipio</th>
                  <th className="px-3 py-2 font-medium">Tenant</th>
                  <th className="px-3 py-2 font-medium">Cliente / usuario</th>
                  <th className="px-3 py-2 font-medium">Etapa</th>
                  <th className="px-3 py-2 font-medium">Preparación</th>
                  <th className="px-3 py-2 font-medium">Próxima acción</th>
                  <th className="px-3 py-2 font-medium">Vínculo</th>
                  <th className="px-3 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleErpRows.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-6 text-[#8E8980]">Sin filas para los filtros actuales.</td></tr>
                ) : visibleErpRows.slice(0, 80).map(row => (
                  <tr key={`${row.clave_inegi}-${row.tenant_id ?? 'catalog'}`} className="border-b border-[#EEE8DE]">
                    <td className="px-4 py-3">
                      <strong className="block text-[#1C1B18]">{row.municipio}</strong>
                      <span className="text-[11px] text-[#8E8980]">{row.estado} · INEGI {row.clave_inegi} · municipio {row.municipio_id || '-'}</span>
                    </td>
                    <td className="px-3 py-3 text-[#6B6760]">{row.tenant_nombre ?? 'Pendiente de crear'}</td>
                    <td className="px-3 py-3">
                      <span className="block text-[#1C1B18]">{row.primary_contact?.email ?? 'Sin usuario vinculado'}</span>
                      <span className="text-[11px] text-[#8E8980]">{row.users_count} usuario(s) · {row.primary_contact?.organizacion ?? 'organización pendiente'}</span>
                    </td>
                    <td className="px-3 py-3 text-[#6B6760]">{row.stage ?? 'Sin etapa'} · {row.tier ?? 'sin tier'}</td>
                    <td className="px-3 py-3">
                      <span className={`border px-2 py-1 text-[11px] ${preparationStatusClass(row.preparation_status)}`}>
                        {row.preparation_label ?? 'Sin preparar'}
                      </span>
                      <span className="mt-1 block text-[10px] text-[#8E8980]">Reglamento: {row.regulation_status}</span>
                    </td>
                    <td className="max-w-[220px] px-3 py-3 text-[11px] leading-5 text-[#6B6760]">
                      {row.next_founder_action ?? 'Crear expediente preliminar o vincular tenant.'}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`border px-2 py-1 text-[11px] ${linkStatusClass(row.link_status)}`}>{linkStatusLabel(row.link_status)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.tenant_id ? (
                          <>
                            <button type="button" onClick={() => setSelectedId(row.tenant_id ?? null)} className="border border-[#D8D1C4] bg-white px-2 py-1 text-[11px] font-semibold text-[#1C1B18]">Abrir</button>
                            <a href={`/v?tenant_id=${encodeURIComponent(row.tenant_id)}&preview=client`} className="border border-[#D8D1C4] bg-white px-2 py-1 text-[11px] font-semibold text-[#1C1B18]">Previsualizar</a>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setForm(prev => ({
                              ...prev,
                              nombre: row.municipio,
                              estado_mx: row.estado,
                              municipio_id: row.municipio_id,
                              inegi_clave: row.clave_inegi,
                            }))}
                            className="border border-[#3B6D11] bg-white px-2 py-1 text-[11px] font-semibold text-[#2F5B0D]"
                          >
                            Preparar tenant
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section id="admin-preparacion" className="scroll-mt-20 border border-[#E1DACE] bg-[#FDFCFA] p-4">
              <div className="mb-4 flex items-center gap-2">
                <Plus size={16} className="text-[#3B6D11]" />
                <h2 className="text-[13px] font-semibold text-[#1C1B18]">Preparación municipal</h2>
              </div>
              <p className="mb-4 text-[11px] leading-5 text-[#6B6760]">
                Busca municipio por INEGI, crea expediente preliminar y prepara reglamento/bibliografía antes de vincular usuario real.
              </p>
              <div className="space-y-3">
                {[
                  ['nombre', 'Municipio'],
                  ['estado_mx', 'Estado'],
                  ['municipio_id', 'Municipio ID'],
                  ['inegi_clave', 'Clave INEGI'],
                ].map(([key, label]) => (
                  <label key={key} className="block text-[11px] font-medium text-[#6B6760]">
                    {label}
                    <input
                      value={form[key as keyof typeof form]}
                      onChange={event => setForm(prev => ({ ...prev, [key]: event.target.value }))}
                      className="mt-1 h-9 w-full border border-[#D8D1C4] bg-white px-3 text-[12px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
                    />
                  </label>
                ))}
                {municipalities.length > 0 && (
                  <div className="max-h-[220px] overflow-auto border border-[#E8E4DC] bg-white">
                    {municipalities.slice(0, 40).map(row => (
                      <button
                        key={row.clave_inegi}
                        type="button"
                        onClick={() => selectMunicipality(row)}
                        className="block w-full border-b border-[#EEE8DE] px-3 py-2 text-left hover:bg-[#F4F2ED]"
                      >
                        <span className="block text-[12px] font-semibold text-[#1C1B18]">{row.nombre}</span>
                        <span className="text-[10px] text-[#8E8980]">{row.estado_nombre} · INEGI {row.clave_inegi}</span>
                      </button>
                    ))}
                  </div>
                )}
                <label className="block text-[11px] font-medium text-[#6B6760]">
                  Tier comercial
                  <select
                    value={form.tier_comercial}
                    onChange={event => setForm(prev => ({ ...prev, tier_comercial: event.target.value as TierComercial }))}
                    className="mt-1 h-9 w-full border border-[#D8D1C4] bg-white px-3 text-[12px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
                  >
                    <option value="diagnostico">Diagnostico</option>
                    <option value="implementacion">Implementacion</option>
                    <option value="operacion_completa">Operacion completa</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void createTenant()}
                  disabled={!form.nombre || !form.estado_mx || !form.municipio_id || !form.inegi_clave}
                  className="h-9 w-full bg-[#3B6D11] text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#B9C8A7]"
                >
                  Crear expediente preliminar
                </button>
                <div className="border border-[#E8E4DC] bg-white p-3 text-[11px] leading-5 text-[#6B6760]">
                  <p className="font-semibold text-[#1C1B18]">Criterio de municipio preparado</p>
                  <p>Reglamento identificado o cargado, bibliografía mínima y diagnóstico preliminar sin invención.</p>
                </div>
              </div>
            </section>

            <section className="border border-[#E1DACE] bg-[#FDFCFA]">
              <div className="flex items-center justify-between border-b border-[#E8E4DC] px-4 py-3">
                <h2 className="text-[13px] font-semibold text-[#1C1B18]">Tenants</h2>
                <span className="text-[11px] text-[#8E8980]">{loading ? '...' : tenants.length}</span>
              </div>
              <div className="max-h-[420px] overflow-auto">
                {tenants.length === 0 ? (
                  <p className="px-4 py-6 text-[12px] text-[#8E8980]">Sin tenants registrados.</p>
                ) : tenants.map(tenant => (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedId(tenant.id)}
                    className={`block w-full border-b border-[#EEE8DE] px-4 py-3 text-left hover:bg-[#F4F2ED] ${selected?.id === tenant.id ? 'bg-[#EAF3DE]' : ''}`}
                  >
                    <span className="block text-[13px] font-semibold text-[#1C1B18]">{tenant.nombre}</span>
                    <span className="mt-1 block text-[11px] text-[#6B6760]">{tenant.state.current_stage} · {tenant.tier_comercial}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <main className="space-y-5">
            {!selected ? (
              <section className="border border-dashed border-[#D8D1C4] bg-[#FDFCFA] p-8 text-[13px] text-[#6B6760]">
                Crea o selecciona un tenant.
              </section>
            ) : (
              <>
                <section id="admin-operacion" className="scroll-mt-20 border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Landmark size={18} className="text-[#3B6D11]" />
                        <h2 className="text-[18px] font-semibold text-[#1C1B18]">{selected.nombre}</h2>
                      </div>
                      <p className="text-[12px] text-[#6B6760]">{selected.estado_mx} · {selected.municipio_id} · INEGI {selected.inegi_clave}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className={`border px-2 py-1 text-[11px] font-semibold ${preparationStatusClass(selected.preparation_status)}`}>
                          {selected.preparation_label ?? 'Sin preparar'}
                        </span>
                        <span className="border border-[#E8E4DC] bg-white px-2 py-1 text-[11px] text-[#6B6760]">
                          Reglamento: {selected.regulation_status ?? 'unknown'}
                        </span>
                      </div>
                      <p className="mt-2 max-w-2xl text-[12px] leading-5 text-[#6B6760]">
                        Próxima acción founder: {selected.next_founder_action ?? 'Preparar expediente municipal antes de abrir cliente.'}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[12px] md:min-w-[360px]">
                      <div className="border border-[#E8E4DC] bg-white px-3 py-2">
                        <span className="block text-[10px] uppercase text-[#8E8980]">Etapa</span>
                        <strong className="text-[#1C1B18]">{selected.state.current_stage}</strong>
                      </div>
                      <div className="border border-[#E8E4DC] bg-white px-3 py-2">
                        <span className="block text-[10px] uppercase text-[#8E8980]">Tier</span>
                        <strong className="text-[#1C1B18]">{selected.tier_comercial}</strong>
                      </div>
                    </div>
                  </div>
	                  <div className="mt-4 flex flex-wrap gap-2">
                    {([
                      ['/v', 'Previsualización cliente'],
                      ['/p', 'Planeación'],
                      ['/e', 'Ejecución'],
                    ] as const).map(([href, label]) => (
                      <a
                        key={href}
                        href={`${href}?tenant_id=${encodeURIComponent(selected.id)}${href === '/v' ? '&preview=client' : ''}`}
                        className="border border-[#D8D1C4] bg-white px-3 py-2 text-[12px] font-semibold text-[#1C1B18]"
                      >
                        {label}
                      </a>
                    ))}
                    <a
                      href={`/api/admin/tenants/${encodeURIComponent(selected.id)}/command-center?stage=${selected.state.current_stage === 'planning' || selected.state.current_stage === 'execution' ? selected.state.current_stage : 'validation'}`}
                      className="border border-[#D8D1C4] bg-white px-3 py-2 text-[12px] font-semibold text-[#1C1B18]"
                    >
                      JSON command center
                    </a>
                    <a
                      href="/api/admin/legacy/manifest"
                      className="border border-[#D8D1C4] bg-white px-3 py-2 text-[12px] font-semibold text-[#1C1B18]"
                    >
                      Manifest legacy
	                    </a>
	                  </div>
	                </section>

	                <nav className="flex flex-wrap gap-2 border border-[#E1DACE] bg-[#FDFCFA] p-3" aria-label="Pestañas del tenant">
	                  {ADMIN_TENANT_TABS.map(tab => (
	                    <button
	                      key={tab.id}
	                      type="button"
	                      onClick={() => setActiveTenantTab(tab.id)}
	                      aria-pressed={activeTenantTab === tab.id}
	                      className={
	                        activeTenantTab === tab.id
	                          ? 'bg-[#1C1B18] px-3 py-2 text-[12px] font-semibold text-white'
	                          : 'border border-[#D8D1C4] bg-white px-3 py-2 text-[12px] font-semibold text-[#1C1B18]'
	                      }
	                    >
	                      {tab.label}
	                    </button>
	                  ))}
	                </nav>

	                {activeTenantTab === 'resumen' && (
	                <section id="admin-previsualizacion" className="scroll-mt-20 border border-[#E1DACE] bg-[#FDFCFA] p-5">
	                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
	                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <FileCheck2 size={16} className="text-[#3B6D11]" />
                        <h2 className="text-[13px] font-semibold text-[#1C1B18]">Previsualización Cliente</h2>
                      </div>
                      <p className="max-w-3xl text-[12px] leading-5 text-[#6B6760]">
                        Abre la Vista Cliente limpia del municipio seleccionado. La ruta se fuerza con `preview=client`; no permite edición documental, gates ni calibración founder.
                      </p>
                    </div>
                    <a
                      href={`/v?tenant_id=${encodeURIComponent(selected.id)}&preview=client`}
                      className="inline-flex h-9 items-center justify-center bg-[#1C1B18] px-4 text-[12px] font-semibold text-white"
                    >
                      Ver como cliente
	                    </a>
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'documentos' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
	                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
	                    <div>
	                      <div className="mb-1 flex items-center gap-2">
	                        <FileCheck2 size={16} className="text-[#3B6D11]" />
	                        <h2 className="text-[13px] font-semibold text-[#1C1B18]">Documentos solicitados</h2>
	                      </div>
	                      <p className="max-w-3xl text-[12px] leading-5 text-[#6B6760]">
	                        La carga operativa vive en admin y `/perfil`; no se muestra como navegación cliente. Este tenant reporta reglamento {selected.regulation_status ?? 'unknown'} y preparación {selected.preparation_label ?? 'sin preparar'}.
	                      </p>
	                    </div>
	                    <a href="/perfil" className="inline-flex h-9 items-center justify-center border border-[#D8D1C4] bg-white px-3 text-[12px] font-semibold text-[#1C1B18]">
	                      Ver perfil cliente
	                    </a>
	                  </div>
	                  <div className="mt-4 border border-[#E8E4DC] bg-white p-3 text-[12px] leading-5 text-[#6B6760]">
	                    Próxima acción documental: {selected.next_founder_action ?? 'Revisar reglamento, documentos pendientes y bibliografía mínima.'}
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'usuarios' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
	                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
	                    <div>
	                      <div className="flex items-center gap-2">
	                        <Users size={16} className="text-[#3B6D11]" />
	                        <h2 className="text-[13px] font-semibold text-[#1C1B18]">Usuarios del tenant</h2>
	                      </div>
	                      <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#6B6760]">
	                        Lectura operativa desde la tabla maestra. No expone datos privados cross-tenant; si la API solo ofrece fallback local, el vínculo queda marcado como pendiente.
	                      </p>
	                    </div>
	                    <span className={`border px-2 py-1 text-[11px] font-semibold ${linkStatusClass(selectedErpRow?.link_status ?? 'tenant_sin_usuario')}`}>
	                      {linkStatusLabel(selectedErpRow?.link_status ?? 'tenant_sin_usuario')}
	                    </span>
	                  </div>
	                  <div className="mt-4 grid gap-3 md:grid-cols-4">
	                    <div className="border border-[#E8E4DC] bg-white p-3">
	                      <p className="text-[11px] font-semibold uppercase text-[#8E8980]">Tenant</p>
	                      <p className="mt-1 break-all text-[13px] font-semibold text-[#1C1B18]">{selected.id}</p>
	                    </div>
	                    <div className="border border-[#E8E4DC] bg-white p-3">
	                      <p className="text-[11px] font-semibold uppercase text-[#8E8980]">Primary user</p>
	                      <p className="mt-1 break-all text-[13px] font-semibold text-[#1C1B18]">{selectedErpRow?.primary_contact?.email ?? 'Sin usuario vinculado'}</p>
	                      <p className="mt-1 text-[11px] text-[#8E8980]">{selectedErpRow?.primary_contact?.organizacion ?? 'organización pendiente'}</p>
	                    </div>
	                    <div className="border border-[#E8E4DC] bg-white p-3">
	                      <p className="text-[11px] font-semibold uppercase text-[#8E8980]">Usuarios</p>
	                      <p className="mt-1 text-[13px] font-semibold text-[#1C1B18]">{selectedErpRow?.users_count ?? 0} total</p>
	                      <p className="mt-1 text-[11px] text-[#8E8980]">{selectedErpRow?.client_users_count ?? 0} cliente · {selectedErpRow?.admin_users_count ?? 0} interno</p>
	                    </div>
	                    <div className="border border-[#E8E4DC] bg-white p-3">
	                      <p className="text-[11px] font-semibold uppercase text-[#8E8980]">Acción founder</p>
	                      <p className="mt-1 text-[13px] font-semibold text-[#1C1B18]">
	                        {(selectedErpRow?.users_count ?? 0) > 0 ? 'Revisar permisos y actividad' : 'Vincular primary user'}
	                      </p>
	                      {selectedErpRow?.duplicate_tenants_count && selectedErpRow.duplicate_tenants_count > 1 ? (
	                        <p className="mt-1 text-[11px] font-semibold text-[#A8322A]">Duplicado: {selectedErpRow.duplicate_tenants_count} tenants</p>
	                      ) : null}
	                    </div>
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'gates' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#3B6D11]" />
                    <h2 className="text-[13px] font-semibold text-[#1C1B18]">Gates G1-G5</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-[12px]">
                      <thead>
                        <tr className="border-b border-[#E8E4DC] text-left text-[#6B6760]">
                          <th className="py-2 pr-3 font-medium">Gate</th>
                          <th className="py-2 pr-3 font-medium">Estado</th>
                          <th className="py-2 pr-3 font-medium">Evidencia</th>
                          <th className="py-2 pr-3 font-medium">Decisor</th>
                          <th className="py-2 pr-3 font-medium">Cierre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.gates.map(gate => (
                          <tr key={gate.gate_id} className="border-b border-[#EEE8DE]">
                            <td className="py-3 pr-3 font-semibold text-[#1C1B18]">{gate.gate_id}</td>
                            <td className="py-3 pr-3">
                              <span className={`border px-2 py-1 text-[11px] ${statusClass(gate.status)}`}>{gate.status}</span>
                            </td>
                            <td className="py-3 pr-3 text-[#6B6760]">{gate.evidencia_label ?? 'Pendiente'}</td>
                            <td className="py-3 pr-3 text-[#6B6760]">{gate.decisor_humano ?? 'Pendiente'}</td>
                            <td className="py-3 pr-3 text-[#8E8980]">{gate.closed_at ? new Date(gate.closed_at).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[90px_1fr_1fr_170px_auto_auto]">
                    <select
                      value={evidence.gate_id}
                      onChange={event => setEvidence(prev => ({ ...prev, gate_id: event.target.value }))}
                      className="h-9 border border-[#D8D1C4] bg-white px-2 text-[12px]"
                    >
                      {['G1', 'G2', 'G3', 'G4', 'G5'].map(g => <option key={g}>{g}</option>)}
                    </select>
                    <input
                      value={evidence.evidencia_label}
                      onChange={event => setEvidence(prev => ({ ...prev, evidencia_label: event.target.value }))}
                      placeholder="Etiqueta evidencia"
                      className="h-9 border border-[#D8D1C4] bg-white px-3 text-[12px]"
                    />
                    <input
                      value={evidence.evidencia_url}
                      onChange={event => setEvidence(prev => ({ ...prev, evidencia_url: event.target.value }))}
                      placeholder="URL o ruta de evidencia"
                      className="h-9 border border-[#D8D1C4] bg-white px-3 text-[12px]"
                    />
                    <input
                      value={evidence.decisor_humano}
                      onChange={event => setEvidence(prev => ({ ...prev, decisor_humano: event.target.value }))}
                      placeholder="Decisor"
                      className="h-9 border border-[#D8D1C4] bg-white px-3 text-[12px]"
                    />
                    <button type="button" onClick={() => void registerEvidence()} className="h-9 border border-[#3B6D11] px-3 text-[12px] font-semibold text-[#2F5B0D]">
                      Registrar
                    </button>
	                    <button type="button" onClick={() => void closeGate()} className="h-9 bg-[#1C1B18] px-3 text-[12px] font-semibold text-white">
	                      Cerrar
	                    </button>
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'resumen' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
	                  <div className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
	                    <div className="mb-4 flex items-center gap-2">
	                      <CheckCircle2 size={16} className="text-[#3B6D11]" />
                      <h2 className="text-[13px] font-semibold text-[#1C1B18]">Capabilities activas</h2>
                    </div>
                    <div className="grid max-h-[320px] gap-2 overflow-auto sm:grid-cols-2">
                      {selected.capabilities.map(cap => (
                        <div key={cap.module_id} className="border border-[#E8E4DC] bg-white px-3 py-2 text-[11px] text-[#1C1B18]">
                          <span className="font-mono">{cap.module_id}</span>
                          <span className="ml-2 text-[#8E8980]">{cap.source}</span>
                        </div>
	                      ))}
	                    </div>
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'auditoria' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
	                  <div className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
	                    <div className="mb-4 flex items-center gap-2">
	                      <FileCheck2 size={16} className="text-[#3B6D11]" />
                      <h2 className="text-[13px] font-semibold text-[#1C1B18]">Auditoria minima</h2>
                    </div>
                    <div className="max-h-[320px] space-y-2 overflow-auto">
                      {[...selected.audit_log].reverse().map(log => (
                        <div key={log.id} className="border border-[#E8E4DC] bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <strong className="text-[#1C1B18]">{log.action}</strong>
                            <span className="text-[#8E8980]">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#6B6760]">{log.actor}</p>
                        </div>
	                      ))}
	                    </div>
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'exports' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <ScrollText size={16} className="text-[#3B6D11]" />
                        <h2 className="text-[13px] font-semibold text-[#1C1B18]">A6 Documentación generada</h2>
                      </div>
                      <p className="text-[11px] text-[#6B6760]">
                        Borradores para revisión humana. Nunca se marcan como oficiales ni se exportan como ok con bloqueos.
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {ALQUIMIA_TEMPLATE_REGISTRY.map(template => {
                          const readiness = templateReadiness.find(item => item.template.id === template.id)
                          const readyCount = readiness?.readyCount ?? 0
                          const totalCount = readiness?.totalCount ?? template.variables.length
                          const pendingCount = readiness?.pendingCount ?? totalCount
                          const readyPct = totalCount ? Math.round((readyCount / totalCount) * 100) : 0
                          return (
                            <div key={template.id} className="border border-[#E8E4DC] bg-white p-2">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[10px] font-semibold text-[#1C1B18]">{template.filename}</p>
                                  <p className="mt-1 text-[10px] uppercase tracking-[0.06em] text-[#8E8980]">{template.stage}</p>
                                </div>
                                <span className={`border px-2 py-1 text-[10px] font-semibold ${pendingCount === 0 ? 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]' : 'border-[#F5DCA0] bg-[#FEF7E7] text-[#8A5C05]'}`}>
                                  {readyPct}%
                                </span>
                              </div>
                              <div className="mt-2 h-1.5 bg-[#EEE8DE]" aria-hidden="true">
                                <div className="h-full bg-[#3B6D11]" style={{ width: `${readyPct}%` }} />
                              </div>
                              <p className="mt-2 text-[10px] text-[#6B6760]">
                                {readyCount}/{totalCount} variables listas · {pendingCount} pendientes
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={documentType}
                        onChange={event => setDocumentType(event.target.value as typeof documentType)}
                        className="h-9 border border-[#D8D1C4] bg-white px-3 text-[12px] text-[#1C1B18]"
                      >
                        {documentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                      </select>
                      <button
                        type="button"
                        onClick={() => void generateDocumentDraft()}
                        className="h-9 bg-[#1C1B18] px-4 text-[12px] font-semibold text-white"
                      >
                        Generar borrador
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-[12px]">
                      <thead>
                        <tr className="border-b border-[#E8E4DC] text-left text-[#6B6760]">
                          <th className="py-2 pr-3 font-medium">Documento</th>
                          <th className="py-2 pr-3 font-medium">Estado</th>
                          <th className="py-2 pr-3 font-medium">QA</th>
                          <th className="py-2 pr-3 font-medium">Versión</th>
                          <th className="py-2 pr-3 font-medium">Bloqueos</th>
                          <th className="py-2 pr-3 font-medium">Acción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-[#8E8980]">Sin borradores generados para este tenant.</td>
                          </tr>
                        ) : documents.map(document => (
                          <tr key={document.id} className="border-b border-[#EEE8DE]">
                            <td className="py-3 pr-3">
                              <strong className="block text-[#1C1B18]">{document.title}</strong>
                              <span className="text-[11px] text-[#8E8980]">{document.document_type}</span>
                            </td>
                            <td className="py-3 pr-3 text-[#6B6760]">{document.status}</td>
                            <td className={`py-3 pr-3 font-semibold ${document.qa_status === 'blocked' ? 'text-[#A8322A]' : document.qa_status === 'ok' ? 'text-[#2F5B0D]' : 'text-[#8A5C05]'}`}>
                              {document.qa_status}
                            </td>
                            <td className="py-3 pr-3 text-[#6B6760]">v{document.version}</td>
                            <td className="py-3 pr-3 text-[#6B6760]">{document.blockers.length}</td>
                            <td className="py-3 pr-3">
                              <button
                                type="button"
                                onClick={() => void runExportCheck(document.id)}
                                className="h-8 border border-[#D8D1C4] px-3 text-[11px] font-semibold text-[#1C1B18]"
                              >
                                Export-check
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
	                    </table>
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'bibliografia' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <ScrollText size={16} className="text-[#3B6D11]" />
                        <h2 className="text-[13px] font-semibold text-[#1C1B18]">Bibliografía y evidencia comparable</h2>
                      </div>
                      <p className="text-[11px] leading-5 text-[#6B6760]">
                        Recomendador determinístico. No recalibra modelos, no usa LLM y no convierte benchmarks en estudio local.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <select
                        value={bibliographyStage}
                        onChange={event => setBibliographyStage(event.target.value as TenantStage)}
                        className="h-8 border border-[#D8D1C4] bg-white px-3 text-[11px] text-[#1C1B18]"
                      >
                        <option value="validation">Validación</option>
                        <option value="planning">Planeación</option>
                        <option value="execution">Ejecución</option>
                      </select>
                      <input
                        value={bibliographyModule}
                        onChange={event => setBibliographyModule(event.target.value)}
                        placeholder="Módulo, ej. M01"
                        className="h-8 w-[130px] border border-[#D8D1C4] bg-white px-3 text-[11px] text-[#1C1B18]"
                      />
                      <button
                        type="button"
                        onClick={() => void loadBibliographyPanel()}
                        className="h-8 border border-[#D8D1C4] px-3 text-[11px] font-semibold text-[#1C1B18]"
                      >
                        Actualizar
                      </button>
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-3">
                    {evidenceCoverage.map(item => (
                      <div key={item.stage} className="border border-[#E8E4DC] bg-white p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8E8980]">{item.label}</p>
                        <dl className="mt-2 grid grid-cols-4 gap-2 text-[11px]">
                          <div><dt className="text-[#8E8980]">Local</dt><dd className="font-semibold text-[#1C1B18]">{item.local_count}</dd></div>
                          <div><dt className="text-[#8E8980]">Comp.</dt><dd className="font-semibold text-[#1C1B18]">{item.comparable_count}</dd></div>
                          <div><dt className="text-[#8E8980]">Bench.</dt><dd className="font-semibold text-[#1C1B18]">{item.benchmark_count}</dd></div>
                          <div><dt className="text-[#8E8980]">No</dt><dd className="font-semibold text-[#A8322A]">{item.blocked_count}</dd></div>
                        </dl>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[860px] text-[12px]">
                      <thead>
                        <tr className="border-b border-[#E8E4DC] text-left text-[#6B6760]">
                          <th className="py-2 pr-3 font-medium">Fuente</th>
                          <th className="py-2 pr-3 font-medium">Uso</th>
                          <th className="py-2 pr-3 font-medium">Score</th>
                          <th className="py-2 pr-3 font-medium">Soporta</th>
                          <th className="py-2 pr-3 font-medium">No soporta</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evidenceRecommendations.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-5 text-[#8E8980]">Sin recomendaciones para los filtros actuales.</td>
                          </tr>
                        ) : evidenceRecommendations.slice(0, 10).map(item => (
                          <tr key={item.id} className="border-b border-[#EEE8DE]">
                            <td className="py-3 pr-3">
                              <span className="block font-semibold text-[#1C1B18]">{item.record.title}</span>
                              <span className="text-[11px] text-[#8E8980]">{item.record.institution} · {item.record.territorial_scope} · {item.record.source_date}</span>
                            </td>
                            <td className="py-3 pr-3 text-[#6B6760]">{item.tag}</td>
                            <td className="py-3 pr-3 font-mono text-[#1C1B18]">{item.score.total}</td>
                            <td className="py-3 pr-3 text-[#6B6760]">{item.supported_claim}</td>
                            <td className="py-3 pr-3 text-[#8C6A13]">{item.unsupported_claim}</td>
                          </tr>
                        ))}
                      </tbody>
	                    </table>
	                  </div>
	                </section>
	                )}

	                {activeTenantTab === 'auditoria' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <BrainCircuit size={16} className="text-[#3B6D11]" />
                        <h2 className="text-[13px] font-semibold text-[#1C1B18]">A11 Panel de aprendizaje</h2>
                      </div>
                      <p className="text-[11px] text-[#6B6760]">
                        Revisión interna. Sin publicación al cliente ni recalibración automática.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadA11Panel()}
                      className="h-8 border border-[#D8D1C4] px-3 text-[11px] font-semibold text-[#1C1B18]"
                    >
                      Actualizar A11
                    </button>
                  </div>
                  <div className="grid gap-3 xl:grid-cols-5">
                    {['A11.1', 'A11.2', 'A11.3', 'A11.4', 'A11.5'].map(tabId => {
                      const tab = a11?.tabs?.[tabId]
                      const patterns = tab?.patterns ?? []
                      return (
                        <div key={tabId} className="border border-[#E8E4DC] bg-white p-3">
                          <span className="text-[10px] font-semibold uppercase text-[#8E8980]">{tabId}</span>
                          <h3 className="mt-1 min-h-[32px] text-[12px] font-semibold text-[#1C1B18]">{tab?.label ?? 'Aprendizaje pendiente'}</h3>
                          {'metrics' in (tab ?? {}) ? (
                            <dl className="mt-3 space-y-1 text-[11px] text-[#6B6760]">
                              {Object.entries(tab?.metrics ?? {}).map(([key, value]) => (
                                <div key={key} className="flex justify-between gap-3">
                                  <dt>{key}</dt>
                                  <dd className="font-semibold text-[#1C1B18]">{value}</dd>
                                </div>
                              ))}
                            </dl>
                          ) : (
                            <p className="mt-3 text-[20px] font-semibold text-[#1C1B18]">{patterns.length}</p>
                          )}
                          {tab?.summary && <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">{tab.summary}</p>}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[760px] text-[12px]">
                      <thead>
                        <tr className="border-b border-[#E8E4DC] text-left text-[#6B6760]">
                          <th className="py-2 pr-3 font-medium">Patrón</th>
                          <th className="py-2 pr-3 font-medium">Capa</th>
                          <th className="py-2 pr-3 font-medium">N</th>
                          <th className="py-2 pr-3 font-medium">Confianza</th>
                          <th className="py-2 pr-3 font-medium">Estado</th>
                          <th className="py-2 pr-3 font-medium">Revisión</th>
                        </tr>
                      </thead>
                      <tbody>
                        {([...(a11?.tabs?.['A11.1']?.patterns ?? []), ...(a11?.tabs?.['A11.2']?.published_to_clients ?? [])]).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-5 text-[#8E8980]">Sin patrones pendientes. La plataforma sigue observando.</td>
                          </tr>
                        ) : ([...(a11?.tabs?.['A11.1']?.patterns ?? []), ...(a11?.tabs?.['A11.2']?.published_to_clients ?? [])]).map(pattern => (
                          <tr key={pattern.id} className="border-b border-[#EEE8DE]">
                            <td className="py-3 pr-3">
                              <span className="block max-w-[360px] text-[#1C1B18]">{pattern.pattern_description_natural}</span>
                              <span className="text-[11px] text-[#8E8980]">{pattern.statistical_significance ?? 'sin significancia publicable'}</span>
                            </td>
                            <td className="py-3 pr-3 text-[#6B6760]">{pattern.pattern_layer}</td>
                            <td className="py-3 pr-3 text-[#6B6760]">{pattern.observations_count}</td>
                            <td className="py-3 pr-3 text-[#6B6760]">{pattern.confidence_level}</td>
                            <td className="py-3 pr-3 text-[#6B6760]">{pattern.pattern_status}</td>
                            <td className="py-3 pr-3">
                              <div className="flex flex-wrap gap-2">
                                <button type="button" onClick={() => void reviewNousPattern(pattern.id, 'approve_internal')} className="h-8 border border-[#D8D1C4] px-2 text-[11px] text-[#1C1B18]">Aprobar interno</button>
                                <button type="button" onClick={() => void reviewNousPattern(pattern.id, 'postpone')} className="h-8 border border-[#D8D1C4] px-2 text-[11px] text-[#1C1B18]">Posponer</button>
                                <button type="button" onClick={() => void reviewNousPattern(pattern.id, 'reject')} className="h-8 border border-[#EBC0BA] px-2 text-[11px] text-[#A8322A]">Rechazar</button>
                                {pattern.published_to_clients ? (
                                  <button type="button" onClick={() => void withdrawNousPattern(pattern.id)} className="h-8 border border-[#EBC0BA] px-2 text-[11px] text-[#A8322A]">Retirar cliente</button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-3 text-[11px] text-[#6B6760]">
	                    Cliente: apagado hasta patrón aprobado, bias check, revisión fundadora y trazabilidad. No se muestra patrón estadístico crudo.
	                  </p>
	                </section>
	                )}

	                {activeTenantTab === 'resumen' && (
	                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="mb-4 flex flex-col gap-1">
                    <h2 className="text-[13px] font-semibold text-[#1C1B18]">Personalización municipal Fase 6</h2>
                    <p className="text-[11px] text-[#6B6760]">
                      Modo actual: {selected.municipal_profile?.mode ?? 'carga_inicial'} · todo campo sin fuente debe quedar como pendiente de verificación.
                    </p>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {[
                      ['antecedentes', 'tenant.antecedentes'],
                      ['mapa_social', 'tenant.mapa_social'],
                      ['organigrama_servicio', 'tenant.organigrama_servicio'],
                    ].map(([key, label]) => (
                      <label key={key} className="block text-[11px] font-medium text-[#6B6760]">
                        {label}
                        <textarea
                          value={profileDraft[key as keyof typeof profileDraft]}
                          onChange={event => setProfileDraft(prev => ({ ...prev, [key]: event.target.value }))}
                          rows={14}
                          spellCheck={false}
                          className="mt-1 w-full border border-[#D8D1C4] bg-white px-3 py-2 font-mono text-[11px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="block text-[11px] font-medium text-[#6B6760]">
                      Estado de provenance
                      <select
                        value={profileDraft.provenance_status}
                        onChange={event => setProfileDraft(prev => ({ ...prev, provenance_status: event.target.value }))}
                        className="mt-1 h-9 border border-[#D8D1C4] bg-white px-3 text-[12px] text-[#1C1B18]"
                      >
                        <option value="pendiente_verificacion">Pendiente verificación</option>
                        <option value="fuentes_cargadas">Fuentes cargadas</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveMunicipalProfile()}
                      className="h-9 bg-[#1C1B18] px-4 text-[12px] font-semibold text-white"
                    >
                      Guardar perfil municipal
	                    </button>
	                  </div>
	                </section>
	                )}
              </>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  )
}
