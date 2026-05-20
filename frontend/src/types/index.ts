// ─── ZMs y Municipios ───────────────────────────────────────────────────────

export type MaterialKey = 'organico' | 'papel' | 'plastico' | 'vidrio' | 'aluminio' | 'otros'
export type TipoVivienda = 'vertical' | 'casa' | 'residencial'
export type TamañoCA    = 'P' | 'M' | 'G'
export type PrecioCarbonoEscenario = 'voluntario' | 'sce' | 'eu'
export type HouseholdPropertyType = 'casa' | 'edificio' | 'condominio' | 'residencial'
export type EducationStatus = 'ready' | 'blocked' | 'warning'
export type TerritorialPlanStatus = 'ready' | 'warning' | 'blocked'
export type TerritorialZoneStatus = 'propuesta' | 'condicionada' | 'bloqueada'
export type PerPlanStatus = 'ready' | 'warning' | 'blocked'
export type RouteOperationalStatus = 'programada' | 'en_observacion' | 'bloqueada'
export type LogEventType =
  | 'recoleccion'
  | 'incidencia_operativa'
  | 'mantenimiento_unidad'
  | 'comunicacion_vecinal'
  | 'evidencia_ruta'
export type LegalGatedActionType =
  | 'educational_warning'
  | 'inspection'
  | 'proposed_sanction'
  | 'due_process'
  | 'definitive_document'
export type LegalGatedActionStatus = 'ready' | 'warning' | 'blocked'
export type LegalGatedScope = 'municipio' | 'city_zm'
export type WasteScope = 'rsu_municipal' | 'regulado' | 'peligroso' | 'especial'

export interface Municipio {
  id:        string
  nombre:    string
  estado:    string
  pop:       number
  viv:       number
  ocu:       number
  genKgDia:  number
  crecPct:   number
}

export interface ZonaMetropolitana {
  id:          string
  nombre:      string
  estado:      string
  municipios:  Municipio[]
  totalPop:    number
  totalViv:    number
  ocu:         number
  genKgDia:    number
  crecPct:     number
  mixVivienda: { vertical: number; casa: number; residencial: number }
  costoTerrenoM2: number
  rellenoVidaUtil?: number
  pepenadoresActivos?: number
}

export interface ComposicionRSU {
  material:    MaterialKey
  pct:         number
  factorExtra?: string
}

export interface PreciosMaterial {
  pet:    number
  hdpe:   number
  papel:  number
  vidrio: number
  aluminio: number
  organico: number
}

export type MaterialValorizable = keyof PreciosMaterial

export interface FaseCA {
  fase:        number
  nombre:      string
  mix:         string
  nCAs:        number
  capTonDia:   number
  capexMXN:    number
  ebitdaMesK:  number
  coberturaPct: number
  esOptimo?:   boolean
}

export interface FaseInstitucional {
  fase:        number
  meses:       string
  nombre:      string
  gate:        string
  bloqueante?: boolean
}

export interface CAConfig {
  tipo:        TamañoCA
  capTonDia:   number
  superficieM2: number
  capexMXN:    number
  opexMesMXN:  number
  ingresoMesA3: number
  ebitdaMesA3: number
  tir:         number
  paybackMeses: number
  empleos:     number
  deudaEq:     number
  tasaDeuda:   number
  plazoDeuda:  number
}

// ─── Fase 13.1: infraestructura y centros de acopio ───────────────────────────

export interface CollectionCenterType {
  id: 'P' | 'M' | 'G'
  nombre: string
  capacidad_ton_dia: number
  superficie_m2: number
  capex_mxn: number
  opex_mensual_mxn: number
  empleos_directos: number
  materiales_aceptados: string[]
  fuente: string
  confianza: 'alta' | 'media' | 'estimada'
  warnings: string[]
}

export interface CollectionCenterSite {
  id: string
  municipio_id: string
  zona_id: string
  tipo_id: 'P' | 'M' | 'G'
  fase_inicio: number
  mes_inicio: number
  capacidad_ton_dia: number
  materiales_aceptados: string[]
  recicladoras_destino: string[]
  restricciones_suelo: string[]
  estado: 'propuesto' | 'validacion_suelo' | 'aprobado' | 'operando'
  lat?: number | null
  lng?: number | null
}

export interface CalculoBrechaPlan {
  formula: string
  fuente_capturable: string
  fuente_capacidad: string
  unidad: string
  explicacion: string
  incertidumbre: string
}

export interface InfrastructurePlanRequest {
  municipio_id: string
  zona_ids: string[]
  rsu_capturable_ton_dia: number
  horizonte_años: number
  mix_centros: Record<'P' | 'M' | 'G', number> | Record<string, number>
}

export interface InfrastructurePlanResponse {
  status: 'ready' | 'warning' | 'blocked'
  municipio_id?: string | null
  centros: CollectionCenterSite[]
  capacidad_instalada_ton_dia: number
  rsu_capturable_ton_dia: number
  brecha_ton_dia: number
  capacidad_por_material: Record<string, number>
  calculo_brecha: CalculoBrechaPlan
  warnings: string[]
  blockers: string[]
  next_action: string
}

// ─── Fase 12.1: educación ciudadana y calculadora doméstica ────────────────

export interface EducationDataSource {
  source_id: string
  name: string
  organization: string
  source_type: string
  unit: string
  confidence: number
  explanation: string
}

export interface CalculationAnnexItem {
  calculation_name: string
  formula: string
  inputs: Record<string, number | string>
  result: number
  unit: string
  source: EducationDataSource
  explanation: string
}

export interface HouseholdEducationRequest {
  property_type: HouseholdPropertyType
  household_members?: number | null
  days: number
  generation_kg_per_person_day?: number | null
  source?: EducationDataSource | null
}

export interface WasteSeparationCategory {
  key: string
  label: string
  examples: string[]
  container_guidance: string
  why_it_matters: string
  share_pct: number
  estimated_kg_period: number
  help_text: string
}

export interface HouseholdRecommendation {
  property_type: HouseholdPropertyType
  title: string
  what_to_separate: string[]
  where_to_place: string[]
  why: string
  not_legal_obligation: string
}

export interface DomesticEducationResult {
  status: EducationStatus
  property_type: HouseholdPropertyType
  household_members?: number | null
  days: number
  total_generation_kg?: number | null
  unit: string
  source?: EducationDataSource | null
  confidence: number
  categories: WasteSeparationCategory[]
  recommendation?: HouseholdRecommendation | null
  result_help_text: string
  chart_help_text: string
  calculation_annex: CalculationAnnexItem[]
  warnings: string[]
  blockers: string[]
  next_action: string
  residuos_scope: 'rsu_municipal_domestico'
}

// ─── Fase 12.2: implementación espacio-tiempo ──────────────────────────────

export interface ImplementationSource {
  source_id: string
  name: string
  organization: string
  source_type: string
  confidence: number
  explanation: string
}

export interface TerritorialCalculationAnnexItem {
  calculation_name: string
  formula: string
  inputs: Record<string, number | string>
  result: number
  unit: string
  source: ImplementationSource
  explanation: string
}

export interface TerritorialPlanRequest {
  city_id: string
  municipios: string[]
  horizon_years: number
  start_month: number
  current_capture_pct: number
  target_capture_pct: number
  rsu_total_ton_day: number
  available_capacity_ton_day: number
  source?: ImplementationSource | null
}

export interface PilotColony {
  name: string
  municipio_id: string
  official_status: 'propuesta_no_oficial'
  reason: string
}

export interface TerritorialZone {
  zone_id: string
  zone_number: number
  municipio_id: string
  colonias: PilotColony[]
  start_month: number
  end_month: number
  start_quarter: string
  phase_label: string
  target_capture_pct: number
  estimated_capture_ton_day: number
  status: TerritorialZoneStatus
  territorial_reason: string
  help_text: string
}

export interface TerritorialImplementationPlan {
  status: TerritorialPlanStatus
  city_id: string
  geography_scope: 'city_zm'
  legal_scope_note: string
  horizon_years: number
  start_month: number
  target_capture_pct: number
  rsu_scope: 'rsu_municipal'
  zones: TerritorialZone[]
  timeline_help_text: string
  decision_help_text: string
  calculation_annex: TerritorialCalculationAnnexItem[]
  source: ImplementationSource
  warnings: string[]
  blockers: string[]
  next_action: string
}

// ─── Fase 12.3: Operación PER y bitácora ───────────────────────────────────

export interface OperationEvidence {
  evidence_id: string
  evidence_type: string
  description: string
  captured_at: string
  captured_by: string
  source: string
}

export interface OperationDataSource {
  source_id: string
  name: string
  organization: string
  source_type: string
  confidence: number
  explanation: string
}

export interface PerCalculationAnnexItem {
  calculation_name: string
  formula: string
  inputs: Record<string, number | string>
  result: number
  unit: string
  source: OperationDataSource
  explanation: string
}

export interface PerRouteInput {
  route_id?: string | null
  municipio_id?: string | null
  zona_id?: string | null
  colonias: string[]
  frecuencia?: string | null
  frecuencia_por_semana: number
  camion_unidad?: string | null
  responsable?: string | null
  ventana_temporal?: string | null
  estado_operativo: RouteOperationalStatus
}

export interface LogEventInput {
  fecha: string
  event_type: LogEventType
  evidencia: OperationEvidence[]
  municipio_id?: string | null
  route_or_zone_id?: string | null
  actor_responsable?: string | null
  accion_siguiente?: string | null
}

export interface PerPlanRequest {
  city_id: string
  periodo_mes: string
  routes: PerRouteInput[]
  log_events: LogEventInput[]
  source?: OperationDataSource | null
}

export interface PerExplanation {
  presion: string
  estado: string
  respuesta: string
  human_explanation: string
}

export interface OperationalRoute {
  route_id: string
  municipio_id: string
  zona_id: string
  colonias: string[]
  frecuencia: string
  frecuencia_por_semana: number
  camion_unidad: string
  responsable: string
  ventana_temporal: string
  estado_operativo: RouteOperationalStatus
  per: PerExplanation
  help_text: string
}

export interface OperationalLogEvent {
  event_id: string
  fecha: string
  event_type: LogEventType
  evidencia: OperationEvidence[]
  municipio_id: string
  route_or_zone_id: string
  actor_responsable: string
  accion_siguiente: string
}

export interface PerOperationsPlan {
  status: PerPlanStatus
  city_id: string
  periodo_mes: string
  rsu_scope: 'rsu_municipal'
  routes: OperationalRoute[]
  log_events: OperationalLogEvent[]
  monthly_visits_estimate: number
  unit: string
  metric_help_text: string
  per_help_text: string
  calculation_annex: PerCalculationAnnexItem[]
  source: OperationDataSource
  warnings: string[]
  blockers: string[]
  next_action: string
}

// ─── Fase 12.4: advertencias educativas y alcance legal ─────────────────────

export interface EducationalWarning {
  warning_id: string
  municipio_id: string
  message: string
  creates_fine: boolean
  officiality: string
  next_action: string
}

export interface GatedInspectionRecord {
  inspection_id: string
  municipio_id: string
  route_or_zone_id: string
  evidence_ids: string[]
  creates_firm_sanction: boolean
  officiality: string
  next_action: string
}

export interface ProposedSanction {
  proposed_sanction_id: string
  municipio_id: string
  legal_basis_article_id: string
  evidence_ids: string[]
  status: string
  is_firm: boolean
  officiality: string
  next_action: string
}

export interface DueProcessGate {
  municipio_id: string
  legal_validation_status: LegalSourceValidationStatus
  legal_source_municipio_id?: string | null
  can_issue_educational_warning: boolean
  can_register_inspection: boolean
  can_propose_sanction: boolean
  can_create_definitive_document: boolean
  blockers: string[]
  next_action: string
}

export interface LegalGatedActionRequest {
  action_type: LegalGatedActionType
  municipio_id?: string | null
  geography_scope: LegalGatedScope
  route_or_zone_id?: string | null
  evidence_ids: string[]
  legal_source_municipio_id?: string | null
  legal_validation_status?: LegalSourceValidationStatus | null
  legal_basis_article_id?: string | null
  waste_scope: WasteScope
  competent_validation_explicit: boolean
}

export interface LegalGatedActionResponse {
  status: LegalGatedActionStatus
  action_type: LegalGatedActionType
  municipio_id?: string | null
  geography_scope: LegalGatedScope
  waste_scope: WasteScope
  educational_warning?: EducationalWarning | null
  inspection?: GatedInspectionRecord | null
  proposed_sanction?: ProposedSanction | null
  due_process_gate: DueProcessGate
  language_help_text: string
  warnings: string[]
  blockers: string[]
  next_action: string
}

// ─── Estado del simulador ────────────────────────────────────────────────────

export interface PresetTrayectoria {
  nombre:  string
  años:    number[]
}

export interface SimulatorState {
  // Selección geográfica
  zmActiva:          string
  municipiosActivos: string[]
  tiposVivienda:     TipoVivienda[]

  // Plan
  horizonte:         number
  presetTrayectoria: string
  pctCapturaPorAño:  number[]
  mesInicio:         number

  // Precios commodities
  precios:           PreciosMaterial

  // Operativos
  mermaLogPct:       number
  rechazoPorMat:     Record<MaterialKey, number>
  mixCAs:            Record<TamañoCA, number>
  capCamionTon:      number
  costoBasureroVivienda: number
  vidaUtilBasureros: number
  costoComSocial:    number
  subsidioFederal:   number
  creditoVerde:      boolean
  tasaCreditoVerde:  number
  plazoCreditoAños:  number
  costoDisposicionActivo: boolean
  costoDisposicionPorTon: number
  viviendaCondominioPct: number
  viviendaCondominioDepartamentoPct: number
  ocupantesPorViviendaEscenario: number | null
  capturaPctPorMaterial: Partial<Record<MaterialValorizable, number>>
  mermaPctPorMaterial: Partial<Record<MaterialValorizable, number>>

  // Financieros
  wacc:              number
  tipoCambio:        number
  precioCarbonoEsc:  PrecioCarbonoEscenario
  genPercapita:      number

  // Ambiental
  distanciaRelleno:  number
  capacidadRelleno:  number
  factorCapturaGas:  number
  temperaturaAnual:  number

  // Roadmap legislativo (gates)
  gatesAprobados:    boolean[]
  faseInstitucional: number

  // Fuente de datos
  fuenteDatos: {
    poblacion:    'api' | 'fallback'
    precios:      'api' | 'fallback'
    tipoCambio:   'api' | 'fallback'
    temperatura:  'api' | 'fallback'
    recicladoras: 'api' | 'fallback'
  }

  /** Selección explícita vía catálogo Estado→Municipio (Q-009); null si solo se usó ZM o chips legacy. */
  seleccionMunicipioCatalog: SeleccionMunicipioCatalog | null

  // ── Estudio social — campo y educación ciudadana ───────────────────────────
  /** % del total de viviendas no-condominio que están en calle pública (vs. privada/coto).
   *  Fuente: DONUE + INEGI Censo 2020 fracción municipal. Rango 0-100.
   *  Diferencia el costo educativo: casas VP requieren 3-5x más esfuerzo que condominios. */
  casaViaPublicaPct: number

  /** IPC real (0-100) proveniente de la encuesta de campo.
   *  null = sin datos de campo; se usa el benchmark SEMARNAT 2022 (70) como fallback. */
  indicePreparacionCiudadana: number | null

  /** IPC específico para el segmento de casas en vía pública (Hemisferio 2). */
  indexAceptacionVP: number | null

  /** Resultado completo de la última consulta al endpoint /survey/{municipio}/resultados. */
  encuestaResultados: EncuestaResultados | null
}

export interface SeleccionMunicipioCatalog {
  claveInegi: string
  nombre: string
  estadoNombre: string
  estadoId: string
  poblacion: number
  generacionRsuDia: number
  zmSimulatorId: string
  municipioSimulatorId: string
  datosEstimados: boolean
}

export interface MunicipioMxApi {
  clave_inegi: string
  nombre: string
  estado: string
  estado_id: string
  poblacion: number
  generacion_rsu_dia: number
  zm_simulator_id: string
  municipio_simulator_id: string
  datos_estimados: boolean
}

export interface EstadoMxOption {
  estado_id: string
  nombre: string
}

export interface InegiMunicipalSourceAudit {
  clave_inegi: string
  municipio: string
  estado_id: string
  estado: string
  census_source: string
  census_source_url: string
  census_status: 'xlsx_loaded' | 'catalog_only' | 'missing'
  denue_api_url: string
  denue_status: 'configured' | 'blocked_missing_token'
  live_query_performed: boolean
  warnings: string[]
  blockers: string[]
  next_action: string
}

// ─── Resultados calculados ───────────────────────────────────────────────────

/**
 * Scores de riesgo calculados dinámicamente.
 * Fuentes: SEMARNAT evaluaciones de programas RSU 2019-2024 (R_mercado);
 * LGPGIR DOF 19/01/2022 + matriz de vacios M02 (R_regulatorio);
 * heurística de mezcla CAs y tasa captura (R_operativo).
 * R_político = null — requiere conexión con Proyecto Vivo (backend).
 */
export interface RiskScores {
  r_mercado:     number       // 0-100 — función de tasa captura y volumen
  r_regulatorio: number       // 0-100 — función de vacíos jurídicos M02
  r_operativo:   number       // 0-100 — función de mezcla CAs y tasa captura
  r_politico:    null         // null — requiere Proyecto Vivo
  score_total:   number       // ponderado: 33%/44%/23% (R_político excluido)
}

/**
 * Percentiles del Monte Carlo triangular (distribución triangular, n=2 000 iteraciones).
 * Fuente metodológica: Al-Salem et al. (2024) — Risk Assessment of Waste Recycling Projects
 * Using Monte Carlo Simulation, Sustainability 16(3):1127. DOI: 10.3390/su16031127
 */
export interface MonteCarloPercentiles {
  p10: number   // TIR optimista (percentil 90 de la distribución de resultados negativos)
  p50: number   // TIR mediana
  p90: number   // TIR pesimista (percentil 10)
  bcr_p50: number  // Benefit-Cost Ratio en P50; benchmark Al-Salem 2024: 1.006 mínimo viable
}

export interface ResultadosCalculados {
  // Demográficos
  pobActiva:      number
  vivActivas:     number
  rsuTotalTonDia: number
  rsuPorTipo:     Record<TipoVivienda, number>

  // Operativos
  volCapturablePorMat: Record<MaterialKey, number>
  camionesRequeridos:  Record<MaterialKey, number>
  ocupacionCAs:        number
  breakEvenCAP:        number
  dscr:                number

  // Financieros por año
  serieAnual: AñoResultados[]

  // Totales del horizonte
  ingresosBrutos:      number
  capexTotal:          number
  opexAnual:           number
  ebitda:              number
  margenEbitda:        number
  vpn:                 number
  tir:                 number
  tirEquity:           number
  moic:                number
  paybackMeses:        number
  paybackDescontado:   number
  ingresoCarbono:      number
  ingresoBiogas:       number
  ahorroDisposicion:   number

  // Empleos
  empleosDirectosCAs:       number
  empleosDirectosRecic:     number   // recuperadores/pepenadores formalizables (Anaya-Palacios 2024)
  empleosTotalesDirectos:   number
  empleosIndirectos:        number
  pepenadoresFormalizados:  number
  derramaSalarial:          number   // IMSS 2025: $14,298/mes promedio tabulador residuos

  // Ambiental
  co2eEvitadasTon:          number  // acumulado del horizonte completo (t CO2e)
  co2eEvitadasAnualTon:     number  // año final del horizonte — KPI principal para header/S15
  co2eEvitadasHorizonteTon: number  // alias explícito de co2eEvitadasTon
  pm25EvitadoTon:           number
  kwhBiogas:                number
  extensionRelleno:         number  // años, capped en 15

  // Salud
  casosIRAEvitados:    number
  casosDengueEvitados: number
  avadEvitados:        number
  ahorroSalud:         number

  // Económicos agregados
  cadenaProveedores:   number
  revenueFiscal:       number
  valorPropiedad:      number
  inversionPrivada:    number
  derremaTotal:        number
  scorePolitico:       number
  ratingESGDelta:      number

  // Riesgo y Monte Carlo (calculados bajo demanda; null si no disponibles)
  riskScores?:           RiskScores | null
  monteCarloPercentiles?: MonteCarloPercentiles | null

  // Educación ciudadana — costos derivados del IPC y brecha de adopción
  costoEducacionAnual?: number  // MXN/año — suma al OPEX; proporcional a brecha y % VP
}

// ─── Encuesta de aceptación ciudadana ─────────────────────────────────────────

export interface EncuestaResultados {
  municipio_id:       string
  n_total:            number
  n_condominio:       number
  n_privada:          number
  n_vp:               number
  ipc_global:         number   // 0-100
  ipc_hemisferio1:    number   // condominio + privada
  ipc_hemisferio2_vp: number   // casas en vía pública
  ipc_por_segmento:   Record<string, number>
  ultima_respuesta:   string | null
}

export interface AñoResultados {
  año:            number
  pctCaptura:     number
  volTonDia:      Record<MaterialKey, number>
  ingresos:       number
  capex:          number
  opex:           number
  ebitda:         number
  fcf:            number
  fcfAcumulado:   number
  empleosDirectos: number
  co2e:           number
}

// ─── Motor Jurídico Municipal — Fase 1.5 ────────────────────────────────────

export type CategoriaArticulo =
  | 'separacion_origen' | 'recoleccion_diferenciada' | 'disposicion_final'
  | 'pepenadores' | 'financiamiento' | 'sanciones'
  | 'participacion' | 'transparencia' | 'convenios'

export type EstadoArticulo =
  | 'presente_adecuado' | 'presente_obsoleto' | 'ausente' | 'conflicto'

export type Criticidad = 'alta' | 'media' | 'baja'

export type ReformEstrategia = 'A' | 'B' | 'C' | 'D'
export type LegalSourceIngestStatus = 'no_disponible' | 'localizado' | 'descargado'
export type LegalSourceValidationStatus =
  | 'no_disponible'
  | 'pendiente_validacion_juridica'
  | 'validado_externamente'
export type LegalOfficiality =
  | 'fuente_localizada_no_validada'
  | 'documento_descargado_no_validado'
  | 'validado_por_autoridad_competente'

export interface ArticuloMatriz {
  numero:          string
  titulo:          string
  categoria:       CategoriaArticulo
  estado:          EstadoArticulo
  criticidad:      Criticidad
  texto_actual?:   string
  texto_propuesto?: string
}

export interface MunicipalLegalSourceManifest {
  source_id: string
  municipio_id: string
  zm: string
  title: string
  official_url?: string | null
  download_url?: string | null
  retrieved_at: string
  ingest_status: LegalSourceIngestStatus
  validation_status: LegalSourceValidationStatus
  officiality: LegalOfficiality
  status_http?: number | null
  content_type?: string | null
  checksum_sha256?: string | null
  bytes_size?: number | null
  source_kind: string
  source_authority: string
  can_enable_education: boolean
  can_enable_simulation: boolean
  can_enable_sanctions: boolean
  can_generate_official_document: boolean
  warnings: string[]
  blockers: string[]
  next_action: string
}

export interface LegalDiagnostic {
  municipio_id:               string
  zm:                         string
  reglamento_nombre:          string
  reglamento_version:         string
  reglamento_fuente:          string
  fecha_diagnostico:          string
  articulos:                  ArticuloMatriz[]
  brecha_total:               number
  brecha_critica:             number
  tiene_separacion_origen:    boolean
  tiene_tarifa_diferenciada:  boolean
  tiene_figura_reciclador:    boolean
  tiene_sancion_ejecutable:   boolean
  score_legal:                number
  requiere_revision_juridica: boolean
  agora_bloqueado:            boolean
  legal_scope:                'municipio'
  jurisdiction_scope:         'Municipality'
  source_manifest:            MunicipalLegalSourceManifest
  legal_validation_status:    LegalSourceValidationStatus
  officiality:                LegalOfficiality
  can_enable_education:       boolean
  can_enable_simulation:      boolean
  can_enable_sanctions:       boolean
  can_generate_official_document: boolean
  sanctions_blocked_reason?:  string | null
  official_document_blocked_reason?: string | null
  next_action:                string
  legal_disclaimer:           string
  residuos_scope:             'rsu_municipal'
}

export interface ReformStrategyOutput {
  estrategia:      ReformEstrategia
  nombre:          string
  descripcion:     string
  plazo_meses:     number
  articulos_clave: string[]
  agora_bloqueado: boolean
  motivo_bloqueo?: string
}

export interface LegalStatusHub {
  municipio_id:     string
  municipio_nombre: string
  zm:               string
  jurisdiction_scope: 'Municipality'
  score_legal:      number
  estrategia:       ReformEstrategia
  plazo_meses:      number
  agora_bloqueado:  boolean
  brecha_critica:   number
  verificado:       boolean
}

// ─── Paquete Metropolitano (dos capas) ───────────────────────────────────────

export interface OleadaImplementacion {
  numero:      number
  nombre:      string
  municipios:  string[]   // municipio_ids
  descripcion: string
  mes_inicio:  number
  mes_fin:     number
}

export interface CoordinacionMetropolitana {
  zm:                         string
  convenio_marco_zm:          string  // "firmado" | "borrador" | "pendiente" | "no_existe"
  homologacion_fracciones:    string
  estandar_datos:             string
  interoperabilidad_rutas:    string
  infraestructura_compartida: string
  municipios_lider:           string[]
  municipios_bloqueados:      string[]
  oleadas:                    OleadaImplementacion[]
  nota:                       string
}

export interface DiagnosticoMunicipal {
  municipio_id:     string
  municipio_nombre: string
  zm:               string
  diagnostic:       LegalDiagnostic
  strategy:         ReformStrategyOutput
}

export interface PaqueteMetropolitano {
  zm:                    string
  total_municipios:      number
  municipios_bloqueados: number
  score_legal_zm:        number
  paquete_municipal:     DiagnosticoMunicipal[]
  paquete_metropolitano: CoordinacionMetropolitana
}

// ─── Fase 2: DataProvenance — trazabilidad formal de datos ───────────────────

/** Jerarquía de confianza (descendente): oficial > certificado > estimado > manual > no_disponible */
export type FuenteTipo =
  | 'oficial'        // publicado por organismo autorizado, URL verificable
  | 'certificado'    // estudio técnico documentado, no live API
  | 'estimado'       // proyección o derivado de modelo
  | 'manual'         // ingresado por equipo sin fuente externa
  | 'no_disponible'  // no obtenible — nunca sustituir silenciosamente

export interface DataProvenance {
  tipo:               FuenteTipo
  fuente_nombre:      string
  fuente_organismo:   string
  fuente_url?:        string | null
  fecha_dato?:        string | null
  fecha_consulta?:    string | null
  confianza:          number   // 0.0-1.0
  advertencia?:       string | null
  requiere_clave_api: boolean
  error_detalle?:     string | null
}

export interface KPIConProvenance {
  kpi_id:    string
  kpi_label: string
  valor:     unknown   // puede ser number, string, objeto, o null
  unidad:    string
  provenance: DataProvenance
}

export interface AdvertenciaKPI {
  kpi_id:       string
  kpi_label:    string
  tipo:         FuenteTipo
  advertencia:  string
  bloquea_agora: boolean
}

export interface SnapshotDatos {
  zm:            string
  timestamp:     string
  kpis:          KPIConProvenance[]
  advertencias:  AdvertenciaKPI[]
  score_datos:   number   // 0-100
  bloquea_agora: boolean
}

// ─── Fase 10.1 — Entrada del portal y baseline RSU por ciudad ───────────────

export type PortalEntry = 'city_plan' | 'organization'
export type UserAudienceMode = 'citizen' | 'city_team' | 'organization'

// ─── Fase 22 — Identidad obligatoria (gateway de audiencia) ────────────────
export type Audience = 'citizen' | 'functionary' | 'entrepreneur'

export const AUDIENCE_TO_PORTAL: Record<Audience, PortalEntry> = {
  citizen: 'city_plan',
  functionary: 'city_plan',
  entrepreneur: 'organization',
}
export type DecisionModuleStatus = 'ready' | 'blocked'

export interface DecisionModule {
  module_id: string
  label: string
  audience_mode: UserAudienceMode
  decision: string
  evidence: string
  status: DecisionModuleStatus
  blocker?: string | null
  next_action: string
}

export interface MunicipioContext {
  municipio_id: string
  nombre: string
  estado: string
  legal_scope: 'municipio'
  jurisdiction_scope: 'Municipality'
}

export interface CityOption {
  city_id: string
  nombre: string
  estado_principal: string
  municipios: MunicipioContext[]
}

export interface CityContext extends CityOption {
  geography_scope: 'city_zm'
  jurisdiction_scope: 'MetropolitanZone'
  catalog_simulation_epoch: string
  legal_notice: string
  audience_mode: UserAudienceMode
  supported_entries: PortalEntry[]
}

export interface CircularityBaseline {
  city_id: string
  city_name: string
  rsu_scope: 'rsu_municipal'
  current_circularity_pct: number
  material_recovery_ton_day_est: number
  rsu_total_ton_day_est: number
  official_status: 'estimated_not_official'
  confidence: number
  uncertainty_pct_points: number
  provenance: DataProvenance
  warnings: string[]
  interpretation: string
}

export interface FuenteStatus {
  id:             string
  nombre:         string
  organismo:      string
  endpoint?:      string | null
  tipo_maximo:    FuenteTipo
  disponible:     boolean
  requiere_clave: boolean
  kpis_cubiertos: string[]
  advertencia?:   string | null
}

// ─── Fase 3C/3D — Paquete documental ÁGORA ──────────────────────────────────

export interface PackageStatus {
  job_id:        string
  package_id?:   string        // igual a job_id en Fase 3C
  status:        'pending' | 'running' | 'completed' | 'failed'
  progress?:     number
  step?:         string
  checksum?:     string        // SHA-256 del ZIP
  n_documents?:  number
  n_defendibles?: number
  n_bloqueados?: number
  error?:        string
}

export interface PackageAsset {
  asset_id:   string
  filename:   string
  mime_type:  string
  size_bytes: number
  checksum:   string
  status?:    string    // "ok" | "bloqueado" | "error"
  format?:    string    // "docx" | "xlsx" | "pdf" | "json" | "md"
  type?:      string    // "base" | "professional"
}

export interface PackageManifest {
  zm:               string
  municipios:       string[]
  files:            { filename: string; format: string }[]
  fuentes_usadas:   string[]
  kpis_incluidos:   string[]
  warnings_activos: string[]
  score_datos?:     number
  bundle_id?:       string
  version?:         string
}

// ─── Escenario guardado ──────────────────────────────────────────────────────

export interface EscenarioGuardado {
  id:           string
  nombre:       string
  zm:           string
  fecha:        string
  inputs:       Partial<SimulatorState>
  resultados:   Partial<ResultadosCalculados>
  snapshotDatos?: SnapshotDatos  // Fase 2.5: trazabilidad de datos al guardar
  /** CAPEX medio anualizado + OPEX anual según modelo; sólo lectura comparativa interna del simulador. */
  costoModeloPromedioAnualMxn?: number
}

// ─── Cotización Recomendada (motor ALQUIMIA) ──────────────────────────────────

/** Re-exportado desde recommendationEngine para uso en el store. */
export type { CotizacionRecomendada } from '@/lib/recommendationEngine'

/** Hasta 3 propuestas guardadas lado a lado (persist Zustand). */
export type PropuestaSlotIndex = 0 | 1 | 2

export type PropuestaSlotTupla = readonly [
  EscenarioGuardado | null,
  EscenarioGuardado | null,
  EscenarioGuardado | null,
]

// ─── Fase 5 — Marketplace / Precolocación ────────────────────────────────────

export type BuyerStatus =
  | 'verificado'
  | 'estimado'
  | 'manual'
  | 'pendiente_verificacion'
  | 'inactivo'

export type FuenteTipoMarket =
  | 'api'
  | 'registro_publico'
  | 'directorio_empresarial'
  | 'manual_usuario'
  | 'benchmark'
  | 'fallback'

export type RiesgoMercado = 'bajo' | 'medio' | 'alto' | 'critico'

export type EstadoColocacion =
  | 'colocado'
  | 'parcial'
  | 'sin_mercado'
  | 'requiere_verificacion'

export interface MaterialBuyer {
  buyer_id:                      string
  nombre:                        string
  material:                      string
  estado:                        string
  municipio:                     string | null
  tipo_comprador:                string
  capacidad_ton_anio:            number
  capacidad_disponible_ton_anio: number
  precio_min_mxn_kg:             number
  precio_max_mxn_kg:             number
  calidad_requerida:             string
  distancia_km:                  number | null
  fuente:                        string
  fuente_tipo:                   FuenteTipoMarket
  confianza:                     number
  status:                        BuyerStatus
  last_verified_at:              string | null
}

export interface PlacementAllocation {
  buyer_id:                  string
  nombre_comprador:          string
  material:                  string
  volumen_asignado_ton_anio: number
  precio_mxn_kg:             number
  ingreso_estimado_mxn:      number
  calidad_requerida:         string
  fuente_tipo:               FuenteTipoMarket
  confianza:                 number
  riesgo:                    RiesgoMercado
}

export interface PlacementPlan {
  zm:                     string
  municipios:             string[]
  material:               string
  volumen_ton_anio:       number
  colocado_ton_anio:      number
  faltante_ton_anio:      number
  pct_colocado:           number
  precio_promedio_mxn_kg: number
  ingreso_potencial_mxn:  number
  ingreso_ajustado_mxn:   number
  descuento_aplicado_pct: number
  riesgo_mercado:         RiesgoMercado
  estado_colocacion:      EstadoColocacion
  allocations:            PlacementAllocation[]
  compradores_considerados: number
  advertencias:           string[]
  provenance:             Record<string, unknown>
}

export interface MarketSummary {
  zm:                       string
  total_volumen_ton_anio:   number
  total_colocado_ton_anio:  number
  total_faltante_ton_anio:  number
  pct_colocado_global:      number
  ingresos_potenciales_mxn: number
  ingresos_ajustados_mxn:   number
  descuento_por_riesgo_mxn: number
  planes_por_material:      Record<string, PlacementPlan>
  warnings:                 string[]
}

// ─── Fase 6 — Macrogeneradores ──────────────────────────────────────────────

export type MacroTipo =
  | 'hotel'
  | 'estadio'
  | 'club_deportivo'
  | 'plaza_comercial'
  | 'mercado_publico'
  | 'hospital'
  | 'universidad'
  | 'parque_industrial'
  | 'edificio_oficinas'
  | 'evento_masivo'

export type FuenteTipoMacro =
  | 'oficial'
  | 'directorio_publico'
  | 'dato_reportado'
  | 'manual_usuario'
  | 'benchmark_sectorial'
  | 'estimado_modelo'
  | 'fallback'

export type MacroStatus =
  | 'verificado'
  | 'estimado'
  | 'manual'
  | 'pendiente_verificacion'
  | 'inactivo'
  | 'bloqueado'

export type RiesgoOperativo = 'bajo' | 'medio' | 'alto' | 'critico'

export interface VariablesEspecificasTipo {
  datos: Record<string, string | number | boolean>
  tipo_referencia: string
  variables_faltantes: string[]
}

export interface CalculoVolumenMacro {
  formula: string
  fuente_factor: string
  unidad: string
  periodicidad: string
  razon: string
  incertidumbre_rango: [number, number]
  es_temporal: boolean
}

export interface MacroGenerator {
  generator_id: string
  nombre: string
  tipo: MacroTipo
  zm: string
  municipio: string | null
  ubicacion: string | null
  lat: number | null
  lon: number | null
  actividad_base: number | null
  unidad_actividad: string | null
  generacion_estimada_ton_dia: number
  composicion: Record<string, number>
  estacionalidad_mensual: number[]
  dias_operacion_anio: number
  separacion_actual_pct: number
  separacion_potencial_pct: number
  pureza_estimada_pct: number
  fuente: string
  fuente_tipo: FuenteTipoMacro
  confianza: number
  status: MacroStatus
  last_verified_at: string | null
  variables_tipo?: VariablesEspecificasTipo | null
  calculo_volumen?: CalculoVolumenMacro | null
  residuos_regulados_detectados?: string[]
  advertencia_residuos_regulados?: string
  excluir_del_conteo_domiciliario?: boolean
  es_temporal?: boolean
}

export interface MacroGeneratorPlan {
  generator_id: string
  acciones: string[]
  contenedores: Record<string, number>
  frecuencia_recoleccion: string
  ventana_horaria: string
  ruta_sugerida: string | null
  volumen_recuperable_ton_anio: number
  costo_logistico_mxn_anio: number
  ingreso_estimado_mxn_anio: number
  riesgo_operativo: RiesgoOperativo
  convenio_requerido: boolean
  advertencias: string[]
}

export interface MacroImpactSummary {
  zm: string
  municipios: string[]
  generators_count: number
  total_ton_dia: number
  total_ton_anio: number
  volumen_por_material: Record<string, number>
  impacto_camiones: Record<string, unknown>
  impacto_cas: Record<string, unknown>
  impacto_market: MarketSummary | null
  ingreso_incremental_mxn: number
  costo_incremental_mxn: number
  co2e_incremental_ton: number
  warnings: string[]
  provenance: Record<string, unknown>
  plans: MacroGeneratorPlan[]
  generators?: MacroGenerator[]
}

// ─── Q-017 — Perfil de Generación Estimada RSU (estimación voluntaria) ─────

export interface GiroScian {
  giro_codigo: string
  sector: string
  subsector: string
  descripcion: string
  factor_generacion_kg_por_unidad: number
  unidad_produccion: string
  composicion_tipica: Record<string, number>
  fuente: string
}

export type FrecuenciaRecoleccionDecl = 'diaria' | '2x_semana' | 'semanal' | 'quincenal'

export interface DeclaracionGeneracionRSU {
  declaracion_id: string
  empresa_nombre: string
  rfc: string | null
  municipio_id: string
  zm: string
  giro_scian: string
  produccion_anual: number
  unidad_produccion: string
  generacion_estimada: Record<string, number>
  generacion_total_ton_anio: number
  frecuencia_recoleccion_req: FrecuenciaRecoleccionDecl
  tiene_plan_manejo: boolean
  es_posible_gran_generador: boolean
  advertencia_gran_generador: string
  fuente_tipo: 'declaracion_voluntaria'
  disclaimer_voluntaria: string
  notas: string | null
  fecha_declaracion: string
  status: 'borrador' | 'confirmada'
  sector_catalogo?: string
  descripcion_giro?: string
}

export interface DeclaracionGeneracionRSUCreate {
  empresa_nombre: string
  rfc?: string | null
  municipio_id: string
  zm: string
  giro_scian: string
  produccion_anual: number
  composicion_materiales?: Record<string, number> | null
  frecuencia_recoleccion_req?: FrecuenciaRecoleccionDecl | null
  tiene_plan_manejo?: boolean
  notas?: string | null
}

// ─── Fase 13.3: portal empresarial e institucional ───────────────────────────

export type OrganizationActivityType =
  | 'hotel'
  | 'hospital'
  | 'empresa'
  | 'industria_ligera'
  | 'universidad'
  | 'club_deportivo'
  | 'estadio'
  | 'centro_comercial'
  | 'zona_turistica'
  | 'espacio_publico'

export interface WasteStreamProfile {
  material: string
  estimacion_ton_dia: number
  es_rsu: boolean
  requiere_proveedor_autorizado: boolean
  norma_aplicable?: string | null
  advertencia: string
}

export interface ContainerPlacementPlan {
  zona_interna: string
  tipo_contenedor: string
  cantidad: number
  frecuencia_recoleccion: string
  nota: string
}

export interface Action30_60_90 {
  plazo: '30_dias' | '60_dias' | '90_dias'
  accion: string
  responsable: string
  recursos_requeridos: string
  impacto_esperado: string
}

export interface CalculoGeneracionOrg {
  formula: string
  fuente_factor: string
  unidad: string
  incertidumbre_rango: [number, number]
  explicacion: string
}

export interface OrganizationalCircularityRequest {
  organization_id: string
  tipo_actividad: OrganizationActivityType
  municipio_id: string
  nombre: string
  empleados: number
  variables: Record<string, string | number | boolean>
}

export interface OrganizationalCircularityResponse {
  status: 'ready' | 'warning' | 'blocked'
  organization_id: string
  tipo_actividad: OrganizationActivityType
  municipio_id: string
  waste_streams: WasteStreamProfile[]
  container_plan: ContainerPlacementPlan[]
  acciones_30_60_90: Action30_60_90[]
  residuos_no_rsu_detectados: string[]
  advertencia_residuos_no_rsu: string
  proveedor_ambiental_requerido: boolean
  calculo_generacion: CalculoGeneracionOrg
  blockers: string[]
  warnings: string[]
  next_action: string
}

// ─── Fase 13.4: flujos de residuos y cierre de ciclo ────────────────────────

export interface FlujoCorriente {
  nombre: string
  toneladas_dia: number
  destino: string
  porcentaje_del_total: number
  es_recuperable: boolean
  advertencia?: string
}

export interface BrechaCircularidad {
  toneladas_recuperables_perdidas: number
  porcentaje_recuperable_no_capturado: number
  oportunidad_ingreso_estimado_mxn: number
  formula: string
  fuente_factor: string
}

export interface DiagnosticoCircularidadResponse {
  status: string
  blockers: string[]
  flujos: FlujoCorriente[]
  brecha: BrechaCircularidad
  tasa_circularidad_actual_pct: number
  tasa_circularidad_potencial_pct: number
  acciones_prioritarias: string[]
  advertencias: string[]
}

// ─── Fase 13.5: hoja de ruta ejecutiva municipal ────────────────────────────

export interface AccionEjecutiva {
  horizonte: string
  titulo: string
  descripcion: string
  responsable_sugerido: string
  kpi_exito: string
  fuente_diagnostico: string
  prioridad: string
  costo_estimado_mxn?: number
}

export interface RoadmapMunicipalResponse {
  status: string
  blockers: string[]
  acciones: AccionEjecutiva[]
  resumen_ejecutivo: string
  kpi_meta_90_dias: Record<string, string>
  advertencias: string[]
}

// ─── Fase 13.6: exportación y reporte ejecutivo ─────────────────────────────

export interface SeccionExportada {
  nombre: string
  titulo: string
  resumen: string
  datos_clave: Record<string, string>
  advertencias: string[]
  trazabilidad?: string
}

export interface ExportResponse {
  status: string
  blockers: string[]
  municipio_id: string
  formato: string
  secciones_exportadas: SeccionExportada[]
  metadata: Record<string, string>
}

// ─── Fase 13.7: dashboard de indicadores ────────────────────────────────────

export interface KPIIndicador {
  clave: string
  titulo: string
  valor_actual: number
  unidad: string
  meta_90_dias: number
  tendencia: string
  fuente: string
  formula: string
  alerta?: string
}

export interface ResumenEjecutivoDashboard {
  municipio_id: string
  total_residuos_ton_dia: number
  tasa_circularidad_pct: number
  brecha_infraestructura_ton_dia: number
  num_macrogeneradores: number
  num_centros_acopio: number
  estado_legal: string
  score_circularidad: number
}

export interface DashboardResponse {
  status: string
  blockers: string[]
  resumen: ResumenEjecutivoDashboard
  kpis: KPIIndicador[]
  advertencias: string[]
}

// ─── Fase 13.8: comparador de escenarios ────────────────────────────────────

export interface EscenarioResultado {
  nombre: string
  score_circularidad: number
  tasa_circularidad_pct: number
  brecha_ton_dia: number
  kpi_resumen: Record<string, string>
  es_ganador: boolean
  diferencia_vs_base: Record<string, number>
}

export interface ComparadorResponse {
  status: string
  blockers: string[]
  municipio_id: string
  escenarios: EscenarioResultado[]
  escenario_ganador: string
  resumen_comparativo: string
  advertencias: string[]
}

// ─── Fase 13.9: alertas y notificaciones inteligentes ───────────────────────

export interface Alerta {
  tipo: string
  nivel: string
  titulo: string
  mensaje: string
  accion_sugerida: string
  modulo_origen: string
}

export interface AlertasResponse {
  status: string
  blockers: string[]
  municipio_id: string
  alertas: Alerta[]
  total_criticas: number
  total_alertas: number
  resumen: string
}

// ─── Fase 20: gobernanza, calidad y riesgo ──────────────────────────────────

export interface MetricaCalidad {
  nombre: string
  valor_actual: number
  umbral_minimo: number
  unidad: string
  cumple: boolean
  fuente: string
}

export interface RiesgoIdentificado {
  id: string
  descripcion: string
  nivel: string
  modulo_origen: string
  mitigacion: string
  estado: string
}

export interface DoDItem {
  criterio: string
  cumplido: boolean
  evidencia: string
}

export interface GovernanceResponse {
  status: string
  municipio_id: string
  score_gobernanza: number
  metricas: MetricaCalidad[]
  riesgos: RiesgoIdentificado[]
  dod: DoDItem[]
  resumen: string
  blockers: string[]
}

// ─── Fase 21: checklist de lanzamiento reproducible ─────────────────────────

export interface ChecklistItem {
  id: string
  categoria: string
  descripcion: string
  comando_verificacion: string
  estado: string
  detalle: string
}

export interface LaunchChecklistResponse {
  status: string
  score_lanzamiento: number
  items: ChecklistItem[]
  blockers: string[]
  resumen: string
  version: string
}

// ─── Fase 7 — ReasoningGraph ────────────────────────────────────────────────

export type CausalNodeType =
  | 'input'
  | 'source'
  | 'assumption'
  | 'formula'
  | 'kpi'
  | 'risk'
  | 'decision'
  | 'document'
  | 'action'
  | 'warning'

export type CausalEdgeRelation =
  | 'uses'
  | 'calculates'
  | 'increases'
  | 'decreases'
  | 'blocks'
  | 'enables'
  | 'warns'
  | 'documents'
  | 'recommends'
  | 'depends_on'

export interface CausalNode {
  node_id: string
  type: CausalNodeType
  label: string
  value: unknown
  unit: string | null
  source_id: string | null
  source_type: string | null
  confidence: number | null
  status: string
  metadata: Record<string, unknown>
}

export interface CausalEdge {
  edge_id: string
  from_node: string
  to_node: string
  relation: CausalEdgeRelation
  formula: string | null
  direction: string | null
  weight: number
  explanation: string
}

export interface ReasoningGraph {
  scenario_id: string
  zm: string
  municipios: string[]
  nodes: CausalNode[]
  edges: CausalEdge[]
  warnings: string[]
  generated_at: string
}

export interface DecisionExplanation {
  decision_id: string
  pregunta: string
  respuesta_corta: string
  evidencia: string[]
  calculos: string[]
  riesgos: string[]
  documentos_afectados: string[]
  siguiente_accion: string
  graph_node_ids: string[]
}

// ─── Fase 8 — Expansion nacional legal ──────────────────────────────────────

export type NationalSourceStatus =
  | 'no_disponible'
  | 'estimado'
  | 'localizado'
  | 'verificado'
  | 'bloqueado'

export type CoverageStage =
  | 'no_iniciado'
  | 'datos_basicos'
  | 'datos_certificados'
  | 'legal_localizado'
  | 'legal_verificado'
  | 'contrato_identificado'
  | 'operacion_modelada'
  | 'documentos_borrador'
  | 'documentos_defendibles'
  | 'implementacion_activa'

export interface MunicipioProfile {
  municipio_id: string
  clave_inegi: string
  nombre: string
  estado: string
  zm_id: string
  poblacion: number | null
  viviendas: number | null
  rsu_ton_dia: number | null
  gen_per_capita: number | null
  presupuesto_mxn: number | null
  dependencia_responsable: string | null
  concesion_status: NationalSourceStatus
  coverage_status: CoverageStage
  data_provenance: Record<string, unknown>
  /** Centroide WGS84 aproximado para visualización (no límite oficial). */
  lat?: number | null
  lng?: number | null
  /** t CO2e/día orden de magnitud (gestión/disposición simplificada). */
  co2e_disposal_ton_dia?: number | null
}

export interface RsuFootprintMapFeature {
  municipio_id: string
  nombre: string
  estado: string
  zm_id: string
  poblacion: number
  gen_per_capita_kg_dia: number
  rsu_ton_dia: number
  co2e_disposal_ton_dia: number
  lat: number
  lng: number
}

export interface RsuFootprintMapResponse {
  catalog_simulation_epoch: string
  feature_count: number
  features: RsuFootprintMapFeature[]
  methodology_summary: string
  disclaimer: string
}

/** Q-025 envelope + GeoJSON FeatureCollection (EPSG:4326). */
export interface CircularityHeatmapResponse {
  catalog_simulation_epoch: string
  zm_id: string
  version_mgn: string | null
  geometry_storage_crs: string
  metric_calculation_crs_note: string
  geometry_source: string
  geometry_note: string
  jurisdiction_scope: string
  disclaimer: string
  methodology_summary: string
  feature_count: number
  geojson: {
    type: 'FeatureCollection'
    features: Array<{
      type: 'Feature'
      geometry: { type: string; coordinates: number[][][] }
      properties: Record<string, unknown>
    }>
  }
  /** 'proxy' | 'mgn_ageb' | 'mgn_manzana' */
  data_quality?: string
  /** Texto explicativo para el badge UI */
  data_quality_nota?: string
}

export interface CoverageStatus {
  municipio_id: string
  demografia: NationalSourceStatus
  rsu: NationalSourceStatus
  legal: NationalSourceStatus
  contrato: NationalSourceStatus
  presupuesto: NationalSourceStatus
  operacion: NationalSourceStatus
  documentos: NationalSourceStatus
  bloqueos: string[]
  siguiente_accion: string
  coverage_status: CoverageStage
  agora_bloqueado: boolean
}

// ─── Fase 9 — Operacion en campo ────────────────────────────────────────────

export interface OperationsSummary {
  municipio_id: string
  total_pickups: number
  toneladas_recuperadas: number
  pureza_promedio_pct: number
  contaminacion_promedio_pct: number
  inspecciones: number
  violaciones_validas: number
  advertencias_educativas: number
  incentivos: number
  reincidencias: Record<string, number>
  warnings: string[]
}

// ─── Q-013 — Adendos reglamentarios (multi-ciudad) ──────────────────────────

export type TecnicaNormativa = 'Adicionar' | 'Reformar' | 'Nuevo'

export interface AdendoCiudadData {
  nombreReglamento: string
  anio: number
  numeroArticulo: string
  textoVigente: string
  pdfCargado: boolean
  /**
   * Texto del adendo propuesto adaptado al lenguaje y autoridad locales de la ciudad.
   * Si no existe, se usa `AdendoData.adendoPropuesto` (genérico, redactado base SLP)
   * y se muestra un aviso de adaptación pendiente.
   */
  adendoPropuesto?: string
}

export interface AdendoData {
  id: number
  titulo: string
  tecnica: TecnicaNormativa
  ciudades: Record<string, AdendoCiudadData>
  adendoPropuesto: string
  efectoOperativo: string
  estadoBorrador: true
}
