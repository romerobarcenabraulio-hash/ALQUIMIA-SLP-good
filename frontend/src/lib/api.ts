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
  MunicipioMxApi,
} from '@/types'
import type { AgoraPlanGenerateBody } from '@/lib/agoraPlanPayload'

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
      const response = await fetch(input, { ...init, signal: controller.signal })
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

/** Q-009 — entidades presentes en el catálogo semilla (CVE 2 dígitos). */
export async function getEstadosMx(): Promise<EstadoMxOption[]> {
  const res = await fetchWithRetry(`${getApiUrl()}/api/v1/cities/estados`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Estados no disponibles: ${res.status}`)
  return res.json()
}

/** Q-009 — municipios; `estado_id` opcional (CVE entidad INEGI). */
export async function getMunicipiosMx(estadoId?: string): Promise<MunicipioMxApi[]> {
  const qs = estadoId ? `?estado_id=${encodeURIComponent(estadoId)}` : ''
  const res = await fetchWithRetry(`${getApiUrl()}/api/v1/cities${qs}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Catálogo municipal no disponible: ${res.status}`)
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
  const res = await fetch(`${getApiUrl()}/education/domestic-calculator`, {
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
  const res = await fetch(`${getApiUrl()}/implementation/territorial-plan`, {
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
  const res = await fetch(`${getApiUrl()}/operations/per-plan`, {
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
  const res = await fetch(`${getApiUrl()}/operations/legal-gated-action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Gate legal operativo no disponible: ${res.status}`)
  return res.json()
}

export async function getInfrastructurePlan(
  payload: InfrastructurePlanRequest,
): Promise<InfrastructurePlanResponse> {
  const res = await fetch(`${getApiUrl()}/infrastructure/plan`, {
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
  const res = await fetch(`${getApiUrl()}/organizations/assessment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Evaluación organizacional no disponible: ${res.status}`)
  return res.json()
}

export async function diagnosisWasteFlows(payload: object): Promise<DiagnosticoCircularidadResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/waste-flows/diagnosis`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function generateRoadmap(payload: object): Promise<RoadmapMunicipalResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/roadmap/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function exportReport(payload: object): Promise<ExportResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/export/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getDashboardSummary(payload: object): Promise<DashboardResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/dashboard/summary`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function compareScenarios(payload: object): Promise<ComparadorResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/scenarios/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function evaluateAlerts(payload: object): Promise<AlertasResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/alerts/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function evaluateGovernance(payload: object): Promise<GovernanceResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/governance/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export async function getLaunchChecklist(): Promise<LaunchChecklistResponse> {
  const API_BASE = getApiUrl()
  const res = await fetch(`${API_BASE}/launch/checklist`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

// ─── Package endpoints (Fase 3C/3D) ──────────────────────────────────────────

/**
 * Consulta el estado de un job/paquete.
 * Retorna PackageStatus con package_id, checksum, n_documents si ya terminó.
 */
export async function getJobStatus(jobId: string): Promise<PackageStatus> {
  const res = await fetch(`${getApiUrl()}/generate/plan/${jobId}`, {
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
  const res = await fetch(`${getApiUrl()}/generate/plan/${packageId}/manifest`, {
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
  const res = await fetch(`${getApiUrl()}/generate/plan/${packageId}/assets`, {
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
  const res = await fetch(url, { headers: authHeaders() })
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
  const res = await fetch(`${getApiUrl()}/generate/plan/${packageId}/render`, {
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
  const res = await fetch(`${getApiUrl()}/generate/plan/${packageId}/render-report`, {
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
  const res = await fetch(`${getApiUrl()}/market/buyers${qs}`, {
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
  const res = await fetch(`${getApiUrl()}/market/place`, {
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
  const res = await fetch(`${getApiUrl()}/market/summary/${zm}`, {
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
  const res = await fetch(`${getApiUrl()}/macros/generators${qs}`, {
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
  const res = await fetch(`${getApiUrl()}/macros/impact`, {
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
  const res = await fetch(`${getApiUrl()}/macros/generators`, {
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
  const res = await fetch(`${getApiUrl()}/macros/generators/${generatorId}`, {
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
  const res = await fetch(`${getApiUrl()}/reasoning/graph`, {
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
  const res = await fetch(`${getApiUrl()}/reasoning/explain`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ graph, pregunta }),
  })
  if (!res.ok) throw new Error(`Explicación causal falló: ${res.status}`)
  return res.json()
}

// ─── Fase 8: Expansion nacional ─────────────────────────────────────────────

export async function getNationalMunicipios(zm: string): Promise<MunicipioProfile[]> {
  const res = await fetch(`${getApiUrl()}/national/zm/${zm}/municipios`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Municipios nacionales no disponibles: ${res.status}`)
  return res.json()
}

export async function getNationalCoverage(zm: string): Promise<CoverageStatus[]> {
  const res = await fetch(`${getApiUrl()}/national/legal/zm/${zm}/coverage`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Coverage nacional no disponible: ${res.status}`)
  return res.json()
}

export async function getRsuFootprintMap(): Promise<RsuFootprintMapResponse> {
  const res = await fetch(`${getApiUrl()}/national/map/rsu-footprint`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Mapa RSU no disponible: ${res.status}`)
  return res.json()
}

export async function getCircularityHeatmap(zm: string): Promise<CircularityHeatmapResponse> {
  const res = await fetch(`${getApiUrl()}/national/map/zm/${encodeURIComponent(zm)}/circularity-heatmap`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Mapa circularidad no disponible: ${res.status}`)
  return res.json()
}

// ─── Fase 9: Operacion en campo ─────────────────────────────────────────────

export async function createPickupEvent(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${getApiUrl()}/operations/pickups`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Pickup no registrado: ${res.status}`)
  return res.json()
}

export async function getOperationsSummary(municipioId: string): Promise<OperationsSummary> {
  const res = await fetch(`${getApiUrl()}/operations/summary/${municipioId}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`Resumen operativo no disponible: ${res.status}`)
  return res.json()
}
