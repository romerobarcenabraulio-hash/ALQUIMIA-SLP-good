/** PR1 sociodemografia: envelope tipado en `@/types/socialDemographicContext`; sin fetch dedicado hasta contrato backend. */
import type {
  PackageStatus,
  PerOperationsPlan,
  PerPlanRequest,
  PackageAsset,
  PackageManifest,
  MarketSummary,
  MaterialBuyer,
  MacroGenerator,
  MacroImpactSummary,
  ReasoningGraph,
  DecisionExplanation,
  MunicipioProfile,
  RsuFootprintMapResponse,
  CircularityHeatmapResponse,
  CoverageStatus,
  OperationsSummary,
  CityOption,
  CityContext,
  CircularityBaseline,
  DecisionModule,
  DomesticEducationResult,
  HouseholdEducationRequest,
  LegalGatedActionRequest,
  LegalGatedActionResponse,
  PortalEntry,
  TerritorialImplementationPlan,
  TerritorialPlanRequest,
  InfrastructurePlanRequest,
  InfrastructurePlanResponse,
  OrganizationalCircularityRequest,
  OrganizationalCircularityResponse,
  DiagnosticoCircularidadResponse,
  RoadmapMunicipalResponse,
  ExportResponse,
  DashboardResponse,
  ComparadorResponse,
  AlertasResponse,
  GovernanceResponse,
  LaunchChecklistResponse,
  GiroScian,
  DeclaracionGeneracionRSU,
  DeclaracionGeneracionRSUCreate,
  EstadoMxOption,
  InegiMunicipalSourceAudit,
  MunicipioMxApi,
  MunicipalLegalSourceManifest,
} from '@/types'
import type { AgoraPlanGenerateBody } from '@/lib/agoraPlanPayload'
import { withRequestId } from '@/lib/requestId'

export function getApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL
  if (configured && configured.trim()) return configured
  return 'http://localhost:8000'
}

/**
 * fetchWithRetry — maneja el cold-start de Render free tier (~30 s de wake-up).
 * Reintenta hasta 2 veces con timeout de 35 s por intento.
 * En el 2.º intento añade un jitter de 2 s para no saturar.
 */
async function fetchWithRetry(
  input: RequestInfo,
  init?: RequestInit,
  maxRetries = 2,
): Promise<Response> {
  let lastError: Error = new Error('Fetch failed')
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 35_000)
    try {
      const response = await fetch(input, withRequestId({ ...init, signal: controller.signal }))
      clearTimeout(timeoutId)
      return response
    } catch (err) {
      clearTimeout(timeoutId)
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries - 1) {
        // Jitter antes de reintentar — da tiempo al servidor de despertar
        await new Promise(r => setTimeout(r, 3_000 + attempt * 2_000))
      }
    }
  }
  throw new Error(`La API no responde tras ${maxRetries} intentos. ${lastError.message}. Si es la primera visita del día, espera 30 segundos y recarga.`)
}

export async function fetchAgoraPlanZip(body: AgoraPlanGenerateBody): Promise<{ blob: Blob; filename: string }> {
  const res = await fetchWithRetry(`${getApiUrl()}/api/v1/agora/generate-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let msg = `Error ${res.status}`
    try {
      const t = await res.text()
      if (t) {
        msg = t.slice(0, 800)
        try {
          const j = JSON.parse(t) as { detail?: unknown }
          if (typeof j.detail === 'string') msg = j.detail
        } catch {
          /* cuerpo no JSON */
        }
      }
    } catch {
      /* empty */
    }
    throw new Error(msg)
  }
  const blob = await res.blob()
  const cd = res.headers.get('Content-Disposition')
  const m = cd?.match(/filename="([^"]+)"/i)
  const filename = m?.[1] ?? 'alquimia_plan.zip'
  return { blob, filename }
}

export function triggerBrowserDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  try {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function backendFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  return fetch(input, withRequestId(init))
}

/** GET /legal/{municipio}/source-manifest — 404 si no hay reglamento en repositorio backend. */
export async function getLegalSourceManifest(municipioId: string): Promise<MunicipalLegalSourceManifest | null> {
  const mid = municipioId.trim().toLowerCase()
  const res = await backendFetch(`${getApiUrl()}/legal/${encodeURIComponent(mid)}/source-manifest`)
  if (res.status === 404) return null
  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const t = await res.text()
      const j = JSON.parse(t) as { detail?: unknown }
      if (typeof j.detail === 'string') detail = j.detail
    } catch {
      /* ignore */
    }
    throw new Error(`Manifiesto legal (${mid}): ${detail}`)
  }
  return res.json() as Promise<MunicipalLegalSourceManifest>
}

export { fetchWithRetry, fetchWithRetry as apiFetch }

function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('alquimia_token')
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Fase 10.1: entrada del portal y baseline por ciudad ────────────────────

export async function getCityOptions(): Promise<CityOption[]> {
  const res = await fetchWithRetry(`${getApiUrl()}/city/options`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Ciudades no disponibles: ${res.status}`)
  return res.json()
}

/** Entidades presentes en el catálogo territorial (CVE 2 dígitos). */
export async function getEstadosMx(): Promise<EstadoMxOption[]> {
  const res = await fetchWithRetry(`${getApiUrl()}/api/v1/cities/estados`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Estados no disponibles: ${res.status}`)
  return res.json()
}

/** Municipios; `estado_id` opcional (CVE entidad INEGI). */
export async function getMunicipiosMx(estadoId?: string): Promise<MunicipioMxApi[]> {
  const qs = estadoId ? `?estado_id=${encodeURIComponent(estadoId)}` : ''
  const res = await fetchWithRetry(`${getApiUrl()}/api/v1/cities${qs}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Catálogo municipal no disponible: ${res.status}`)
  return res.json()
}

export async function getInegiMunicipalSourceAudit(claveInegi: string): Promise<InegiMunicipalSourceAudit> {
  const res = await fetchWithRetry(`${getApiUrl()}/api/v1/cities/${encodeURIComponent(claveInegi)}/inegi-source`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Auditoría INEGI no disponible: ${res.status}`)
  return res.json()
}

export async function getCityContext(cityId: string): Promise<CityContext> {
  const res = await fetchWithRetry(`${getApiUrl()}/city/${cityId}/context`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Contexto de ciudad no disponible: ${res.status}`)
  return res.json()
}

export async function getCircularityBaseline(cityId: string): Promise<CircularityBaseline> {
  const res = await fetchWithRetry(`${getApiUrl()}/city/${cityId}/baseline`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Baseline de circularidad no disponible: ${res.status}`)
  const baseline: CircularityBaseline = await res.json()
  if (baseline.official_status !== 'estimated_not_official') {
    throw new Error('Baseline inválida: ALQUIMIA 10.1 solo acepta baseline estimada no oficial')
  }
  return baseline
}

export async function getPortalJourney(entry: PortalEntry): Promise<DecisionModule[]> {
  const params = new URLSearchParams({ entry })
  const res = await fetchWithRetry(`${getApiUrl()}/city/journey/steps?${params.toString()}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Journey no disponible: ${res.status}`)
  return res.json()
}

// ─── Fase 12.1: educación ciudadana y calculadora doméstica ────────────────

export async function calculateDomesticEducation(
  payload: HouseholdEducationRequest,
): Promise<DomesticEducationResult> {
  const res = await backendFetch(`${getApiUrl()}/education/domestic-calculator`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Calculadora doméstica no disponible: ${res.status}`)
  return res.json()
}

export async function buildTerritorialPlan(
  payload: TerritorialPlanRequest,
): Promise<TerritorialImplementationPlan> {
  const res = await backendFetch(`${getApiUrl()}/implementation/territorial-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Ruta territorial no disponible: ${res.status}`)
  return res.json()
}

export async function buildPerOperationsPlan(
  payload: PerPlanRequest,
): Promise<PerOperationsPlan> {
  const res = await backendFetch(`${getApiUrl()}/operations/per-plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Plan PER no disponible: ${res.status}`)
  return res.json()
}

export async function evaluateLegalGatedAction(
  payload: LegalGatedActionRequest,
): Promise<LegalGatedActionResponse> {
  const res = await backendFetch(`${getApiUrl()}/operations/legal-gated-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Alcance legal operativo no disponible: ${res.status}`)
  return res.json()
}

export async function getInfrastructurePlan(
  payload: InfrastructurePlanRequest,
): Promise<InfrastructurePlanResponse> {
  const res = await backendFetch(`${getApiUrl()}/infrastructure/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Plan de infraestructura no disponible: ${res.status}`)
  return res.json()
}

export async function getOrganizationalAssessment(
  payload: OrganizationalCircularityRequest,
): Promise<OrganizationalCircularityResponse> {
  const res = await backendFetch(`${getApiUrl()}/organizations/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Evaluación organizacional no disponible: ${res.status}`)
  return res.json()
}

export async function diagnosisWasteFlows(payload: object): Promise<DiagnosticoCircularidadResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/waste-flows/diagnosis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function generateRoadmap(payload: object): Promise<RoadmapMunicipalResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/roadmap/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function exportReport(payload: object): Promise<ExportResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/export/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getDashboardSummary(payload: object): Promise<DashboardResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/dashboard/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function compareScenarios(payload: object): Promise<ComparadorResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function evaluateAlerts(payload: object): Promise<AlertasResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/alerts/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function evaluateGovernance(payload: object): Promise<GovernanceResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/governance/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getLaunchChecklist(): Promise<LaunchChecklistResponse> {
  const API_BASE = getApiUrl()
  const res = await backendFetch(`${API_BASE}/launch/checklist`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ─── Package endpoints (Fase 3C/3D) ──────────────────────────────────────────

/**
 * Consulta el estado de un job/paquete.
 * Retorna PackageStatus con package_id, checksum, n_documents si ya terminó.
 */
export async function getJobStatus(jobId: string): Promise<PackageStatus> {
  const res = await backendFetch(`${getApiUrl()}/generate/plan/${jobId}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (!res.ok) throw new Error(`Job no encontrado: ${res.status}`)
  const data = await res.json()
  return {
    job_id:        jobId,
    package_id:    data.package_id ?? jobId,   // Fase 3C usa job_id como package_id
    status:        data.status ?? 'unknown',
    progress:      data.progress,
    step:          data.step,
    checksum:      data.checksum,
    n_documents:   data.n_documents,
    n_defendibles: data.n_defendibles,
    n_bloqueados:  data.n_bloqueados,
    error:         data.error,
  }
}

/**
 * Retorna el manifest.json del paquete: fuentes, KPIs, warnings, score.
 */
export async function getPackageManifest(packageId: string): Promise<PackageManifest> {
  const res = await backendFetch(`${getApiUrl()}/generate/plan/${packageId}/manifest`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (!res.ok) throw new Error(`Manifest no disponible: ${res.status}`)
  return res.json()
}

/**
 * Lista los archivos descargables del paquete (metadata).
 */
export async function getPackageAssets(packageId: string): Promise<{
  package_id: string
  zm: string
  n_documents: number
  checksum: string | null
  assets: PackageAsset[]
}> {
  const res = await backendFetch(`${getApiUrl()}/generate/plan/${packageId}/assets`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (!res.ok) throw new Error(`Assets no disponibles: ${res.status}`)
  return res.json()
}

/**
 * Descarga el paquete ZIP base (Markdown + manifest) con autenticación.
 */
export async function downloadPackageZip(
  packageId: string,
  zm: string = 'ZM',
): Promise<void> {
  await _downloadZipFrom(
    `${getApiUrl()}/generate/plan/${packageId}/download`,
    `alquimia_${zm}_${packageId.slice(0, 8)}.zip`,
  )
}

/**
 * Descarga el paquete ZIP profesional (DOCX/XLSX/PDF + manifest + render_report).
 * Requiere haber ejecutado POST /render previamente.
 */
export async function downloadProfessionalZip(
  packageId: string,
  zm: string = 'ZM',
): Promise<void> {
  await _downloadZipFrom(
    `${getApiUrl()}/generate/plan/${packageId}/download-professional`,
    `alquimia_profesional_${zm}_${packageId.slice(0, 8)}.zip`,
  )
}

async function _downloadZipFrom(url: string, filename: string): Promise<void> {
  const res = await backendFetch(url, { headers: authHeaders() })
  if (!res.ok) throw new Error(`Descarga no disponible: ${res.status}`)
  const blob = await res.blob()
  const blobUrl = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href        = blobUrl
  a.download    = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

// ─── Fase 4: render profesional ───────────────────────────────────────────────

/**
 * Dispara el pipeline de exportación profesional (DOCX/XLSX/PDF).
 * resultados: KPIs del simulador para el XLSX financiero (opcional).
 */
export async function renderProfessionalPackage(
  packageId: string,
  resultados?: Record<string, unknown>,
): Promise<{
  ok: boolean
  qa_status: string
  n_rendered: number
  n_bloqueados: number
  has_docx: boolean
  has_xlsx: boolean
  has_pdf: boolean
  warnings: string[]
  errors: string[]
}> {
  const res = await backendFetch(`${getApiUrl()}/generate/plan/${packageId}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(resultados ? { resultados } : {}),
  })
  if (!res.ok) throw new Error(`Render falló: ${res.status}`)
  return res.json()
}

/**
 * Retorna el render_report.json del paquete profesional.
 */
export async function getRenderReport(packageId: string): Promise<Record<string, unknown> | null> {
  const res = await backendFetch(`${getApiUrl()}/generate/plan/${packageId}/render-report`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Render report no disponible: ${res.status}`)
  return res.json()
}

// ─── Fase 5: Marketplace / Precolocación ─────────────────────────────────────

/**
 * Lista compradores disponibles para un material.
 * ADVERTENCIA: todos son benchmark/estimados — ninguno es oficial sin verificación.
 */
export async function getMarketBuyers(
  material?: string,
  zm?: string,
): Promise<MaterialBuyer[]> {
  const params = new URLSearchParams()
  if (material) params.set('material', material)
  if (zm) params.set('zm', zm)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await backendFetch(`${getApiUrl()}/market/buyers${qs}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Buyers no disponibles: ${res.status}`)
  return res.json()
}

/**
 * Ejecuta el algoritmo de colocación para los volúmenes dados.
 * Retorna MarketSummary con ingresos ajustados, descuentos y advertencias.
 *
 * Si un material no tiene compradores, su ingreso_ajustado = 0.
 */
export async function placeMarket(
  zm: string,
  municipios: string[],
  volumes_ton_anio: Record<string, number>,
): Promise<MarketSummary> {
  const res = await backendFetch(`${getApiUrl()}/market/place`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ zm, municipios, volumes_ton_anio }),
  })
  if (!res.ok) throw new Error(`Colocación fallida: ${res.status}`)
  return res.json()
}

/**
 * Retorna el último MarketSummary calculado para la ZM.
 * Retorna null si no se ha ejecutado placeMarket para esa ZM.
 */
export async function getMarketSummary(zm: string): Promise<MarketSummary | null> {
  const res = await backendFetch(`${getApiUrl()}/market/summary/${zm}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Market summary no disponible: ${res.status}`)
  return res.json()
}

// ─── Fase 6: Macrogeneradores ───────────────────────────────────────────────

export async function getMacroGenerators(
  zm?: string,
  municipio?: string,
): Promise<MacroGenerator[]> {
  const params = new URLSearchParams()
  if (zm) params.set('zm', zm)
  if (municipio) params.set('municipio', municipio)
  const qs = params.toString() ? `?${params.toString()}` : ''
  const res = await backendFetch(`${getApiUrl()}/macros/generators${qs}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Macrogeneradores no disponibles: ${res.status}`)
  return res.json()
}

export async function computeMacroImpact(
  zm: string,
  municipios: string[],
  generators?: MacroGenerator[],
  includeRegistry = true,
): Promise<MacroImpactSummary> {
  const res = await backendFetch(`${getApiUrl()}/macros/impact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      zm,
      municipios,
      generators,
      include_registry: includeRegistry,
    }),
  })
  if (!res.ok) throw new Error(`Impacto de macrogeneradores fallido: ${res.status}`)
  return res.json()
}

export async function createMacroGenerator(generator: MacroGenerator): Promise<MacroGenerator> {
  const res = await backendFetch(`${getApiUrl()}/macros/generators`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(generator),
  })
  if (!res.ok) throw new Error(`Alta de macrogenerador fallida: ${res.status}`)
  return res.json()
}

export async function updateMacroGenerator(
  generatorId: string,
  updates: Partial<MacroGenerator>,
): Promise<MacroGenerator> {
  const res = await backendFetch(`${getApiUrl()}/macros/generators/${generatorId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })
  if (!res.ok) throw new Error(`Edición de macrogenerador fallida: ${res.status}`)
  return res.json()
}

// ─── Q-017 — Perfil de Generación Estimada RSU ───────────────────────────────

export async function getScianFactors(): Promise<GiroScian[]> {
  const res = await fetchWithRetry(`${getApiUrl()}/empresa/scian-factors`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Catálogo de giros no disponible: ${res.status}`)
  return res.json()
}

export async function createDeclaracionGeneracion(
  body: DeclaracionGeneracionRSUCreate,
): Promise<DeclaracionGeneracionRSU> {
  const res = await fetchWithRetry(`${getApiUrl()}/empresa/declaraciones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`No se pudo registrar el perfil: ${res.status}`)
  return res.json()
}

export async function confirmarDeclaracionGeneracion(
  declaracionId: string,
): Promise<DeclaracionGeneracionRSU> {
  const res = await fetchWithRetry(
    `${getApiUrl()}/empresa/declaraciones/${declaracionId}/confirmar`,
    { method: 'PATCH', headers: { 'Content-Type': 'application/json' } },
  )
  if (!res.ok) throw new Error(`No se pudo confirmar el perfil: ${res.status}`)
  return res.json()
}

export async function getDeclaracionesVoluntarias(
  municipioId: string,
): Promise<DeclaracionGeneracionRSU[]> {
  const params = new URLSearchParams({ municipio_id: municipioId })
  const res = await fetchWithRetry(`${getApiUrl()}/empresa/declaraciones?${params}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Declaraciones voluntarias no disponibles: ${res.status}`)
  return res.json()
}

export function perfilGeneracionPdfUrl(declaracionId: string): string {
  return `${getApiUrl()}/empresa/declaraciones/${declaracionId}/pdf`
}

// ─── Fase 7: ReasoningGraph ─────────────────────────────────────────────────

export async function createReasoningGraph(payload: Record<string, unknown>): Promise<ReasoningGraph> {
  const res = await backendFetch(`${getApiUrl()}/reasoning/graph`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`ReasoningGraph falló: ${res.status}`)
  return res.json()
}

export async function explainReasoning(
  graph: ReasoningGraph,
  pregunta: string,
): Promise<DecisionExplanation> {
  const res = await backendFetch(`${getApiUrl()}/reasoning/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ graph, pregunta }),
  })
  if (!res.ok) throw new Error(`Explicación causal falló: ${res.status}`)
  return res.json()
}

// ─── Fase 8: Expansion nacional ─────────────────────────────────────────────

export async function getNationalMunicipios(zm: string): Promise<MunicipioProfile[]> {
  const res = await backendFetch(`${getApiUrl()}/national/zm/${zm}/municipios`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Municipios nacionales no disponibles: ${res.status}`)
  return res.json()
}

export async function getNationalCoverage(zm: string): Promise<CoverageStatus[]> {
  const res = await backendFetch(`${getApiUrl()}/national/legal/zm/${zm}/coverage`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Coverage nacional no disponible: ${res.status}`)
  return res.json()
}

export async function getRsuFootprintMap(): Promise<RsuFootprintMapResponse> {
  const res = await backendFetch(`${getApiUrl()}/national/map/rsu-footprint`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Mapa RSU no disponible: ${res.status}`)
  return res.json()
}

export async function getCircularityHeatmap(zm: string): Promise<CircularityHeatmapResponse> {
  const res = await backendFetch(`${getApiUrl()}/national/map/zm/${encodeURIComponent(zm)}/circularity-heatmap`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Mapa circularidad no disponible: ${res.status}`)
  return res.json()
}

// ─── Fase 9: Operacion en campo ─────────────────────────────────────────────

export async function createPickupEvent(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await backendFetch(`${getApiUrl()}/operations/pickups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Pickup no registrado: ${res.status}`)
  return res.json()
}

export async function getOperationsSummary(municipioId: string): Promise<OperationsSummary> {
  const res = await backendFetch(`${getApiUrl()}/operations/summary/${municipioId}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Resumen operativo no disponible: ${res.status}`)
  return res.json()
}

// ─── Wave 1: Planning (Gantt / PERT / RACI) ─────────────────────────────────

export interface PlanningTask {
  task_id:          string
  nombre:           string
  descripcion:      string
  responsable:      string
  inicio_semana:    number
  duracion_semanas: number
  predecesoras:     string[]
  es_critica:       boolean
  costo_mxn:        number
  fuente_costo:     string
  holgura_semanas:  number
}

export interface GanttPlan {
  zm:               string
  municipio:        string
  scenario_id:      string
  tasks:            PlanningTask[]
  horizonte_semanas: number
  costo_total_mxn:  number
  generated_at:     string
  fuente_costos:    string
}

export interface PertNode {
  node_id:         string
  nombre:          string
  tiempo_esperado: number
  tiempo_temprano: number
  tiempo_tardio:   number
  holgura:         number
  es_critico:      boolean
}

export interface PertPlan {
  zm:                     string
  municipio:              string
  scenario_id:            string
  nodes:                  PertNode[]
  duracion_total_semanas: number
  generated_at:           string
}

export interface RACIRow {
  proceso:         string
  responsable:     string
  aprueba:         string
  consulta:        string[]
  informa:         string[]
  plazo_semanas:   number | null
  norma_aplicable: string | null
}

export interface RACIPlan {
  zm:           string
  municipio:    string
  scenario_id:  string
  filas:        RACIRow[]
  generated_at: string
}

export interface PlanningAllResponse {
  gantt: GanttPlan
  pert:  PertPlan
  raci:  RACIPlan
}

export interface PlanningRequest {
  municipio:         string
  zm:                string
  scenario_id:       string
  n_cas_pequeno:     number
  n_cas_mediano:     number
  n_cas_grande:      number
  capex_total_mxn:   number
  horizonte_semanas: number
}

export async function buildPlanningAll(payload: PlanningRequest): Promise<PlanningAllResponse> {
  const res = await backendFetch(`${getApiUrl()}/api/planning/all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Planning no disponible: ${res.status}`)
  return res.json()
}

// ─── Wave 1: Centros de Acopio ───────────────────────────────────────────────

export interface CentroAcopio {
  centro_id:      string
  nombre:         string
  tipo:           string
  direccion:      string
  municipio:      string
  estado:         string
  zm:             string | null
  lat:            number | null
  lon:            number | null
  materiales:     string[]
  precio_compra:  Record<string, number>
  telefono:       string | null
  horario:        string | null
  acepta_publico: boolean
  acepta_empresa: boolean
  fuente:         string
  verificado:     boolean
  score_confianza: number
}

export interface CentrosAcopioListResponse {
  total:   number
  centros: CentroAcopio[]
}

export async function getCentrosAcopio(params: {
  zm?: string
  municipio?: string
  material?: string
}): Promise<CentrosAcopioListResponse> {
  const query = new URLSearchParams()
  if (params.zm)        query.set('zm', params.zm)
  if (params.municipio) query.set('municipio', params.municipio)
  if (params.material)  query.set('material', params.material)
  const res = await backendFetch(`${getApiUrl()}/api/v1/centros-acopio/?${query.toString()}`)
  if (!res.ok) throw new Error(`Centros de acopio no disponibles: ${res.status}`)
  return res.json()
}

// ─── Proyecto Vivo ────────────────────────────────────────────────────────────

export interface ProyectoAlerta {
  tipo:       string
  severidad:  'info' | 'advertencia' | 'critico'
  titulo:     string
  descripcion: string
  accion:     string | null
}

export interface RiesgoPolitico {
  score:         number
  nivel:         'bajo' | 'medio' | 'alto' | 'desconocido'
  bloqueadores:  { nombre: string; cargo: string; preocupacion: string | null }[]
  campeones:     { nombre: string; cargo: string }[]
  total_actores: number
}

export interface ProyectoEstado {
  proyecto_id:               string
  municipio_id:              string
  zm:                        string
  estado:                    string
  negociacion:               string
  semanas_activo:            number
  semanas_objetivo:          number
  pct_avance:                number
  semanas_retraso_max:       number
  actividades_total:         number
  actividades_completadas:   number
  criticas_pendientes:       number
  semaforo:                  'verde' | 'amarillo' | 'rojo'
  proxima_accion_municipio:  string | null
  proxima_accion_alquimia:   string | null
  riesgo_politico:           RiesgoPolitico
  checkpoint_pendiente:      boolean
  campeon:                   { nombre: string | null; cargo: string | null; email: string | null }
  alertas:                   ProyectoAlerta[]
}

export interface FichaImpacto {
  municipio:           string
  periodo:             string
  semanas_activo:      number
  pct_avance:          number
  north_star: {
    ton_desviadas:       number | null
    tasa_desvio_pct:     number | null
    co2e_evitadas_ton:   number | null
    valor_capturado_mxn: number | null
    empleos_generados:   number | null
  }
  roi_pct:             number | null
  documentos_entregados: number
  vs_benchmark:        string | null
  logros_cabildo:      string[]
  proximos_pasos:      string[]
}

export interface StandardScore {
  nombre:                string
  codigo:                string
  score_pct:             number
  disclosures_cubiertos: number
  disclosures_total:     number
  observacion:           string
  gaps: {
    campo:       string
    label:       string
    descripcion: string
    prioridad:   string
    accion:      string
  }[]
}

export interface ReadinessReport {
  municipio_id:    string
  periodo:         string
  score_global:    number
  nivel:           string
  recomendaciones: string[]
  estandares: {
    gri306:  StandardScore
    sasb:    StandardScore
    iso9001: StandardScore
    ods:     StandardScore
  }
}

export async function getProyectoEstado(proyectoId: string): Promise<ProyectoEstado> {
  const res = await backendFetch(`${getApiUrl()}/api/v1/proyecto/${proyectoId}/estado`)
  if (!res.ok) throw new Error(`Proyecto no disponible: ${res.status}`)
  return res.json()
}

export async function getFichaImpacto(proyectoId: string, costoServicio = 0): Promise<FichaImpacto> {
  const res = await backendFetch(
    `${getApiUrl()}/api/v1/proyecto/${proyectoId}/ficha-impacto?costo_servicio=${costoServicio}`
  )
  if (!res.ok) throw new Error(`Ficha de impacto no disponible: ${res.status}`)
  return res.json()
}

export async function getReadiness(municipioId: string): Promise<ReadinessReport> {
  const res = await backendFetch(`${getApiUrl()}/api/v1/standards/readiness/${municipioId}`)
  if (!res.ok) throw new Error(`Readiness no disponible: ${res.status}`)
  return res.json()
}

export async function crearProyecto(payload: {
  municipio_id:    string
  zm:              string
  nombre_cliente:  string
  email_cliente?:  string
  negociacion?:    string
  horizonte_semanas?: number
  campeon_nombre?: string
  campeon_cargo?:  string
  campeon_email?:  string
}): Promise<{ proyecto_id: string; cliente_id: string; estado: string }> {
  const res = await backendFetch(`${getApiUrl()}/api/v1/proyecto/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error creando proyecto: ${res.status}`)
  return res.json()
}

export async function registrarImpacto(proyectoId: string, payload: {
  periodo:              string
  ton_rsu_generadas?:   number
  ton_rsu_desviadas?:   number
  co2e_evitadas_ton?:   number
  ingreso_materiales_mxn?: number
  ahorro_disposicion_mxn?: number
  empleos_generados?:   number
  fuente?:              string
}): Promise<{ impacto_id: string; tasa_desvio_pct: number | null }> {
  const res = await backendFetch(`${getApiUrl()}/api/v1/proyecto/${proyectoId}/impacto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Error registrando impacto: ${res.status}`)
  return res.json()
}
