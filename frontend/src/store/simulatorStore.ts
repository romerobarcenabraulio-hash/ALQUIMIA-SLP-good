import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type {
  Audience,
  CircularityBaseline,
  CityContext,
  CoverageStatus,
  DecisionModule,
  EscenarioGuardado,
  MacroImpactSummary,
  MarketSummary,
  MunicipioMxApi,
  MunicipioProfile,
  OperationsSummary,
  PortalEntry,
  PropuestaSlotTupla,
  ReasoningGraph,
  ResultadosCalculados,
  SeleccionMunicipioCatalog,
  SimulatorState,
  SnapshotDatos,
} from '@/types'
import { AUDIENCE_TO_PORTAL } from '@/types'
import { PRECIOS_DEFAULTS, PRESETS_TRAYECTORIA, ZMS, alquimiaHideGdlFromUi } from '@/lib/constants'
import { OPEX_LOGISTICA_DEFAULTS, deriveCostoDisposicionPorTon, deriveDistanciaRelleno, deriveCapacidadRelleno, deriveMermaLogPct, deriveMixCasFromPoblacion } from '@/lib/financeLogisticsCalc'
import { calcular, calcularEscenarioSinPrograma } from '@/lib/calculator'
import { deriveMixCasFromHorizonte } from '@/lib/despliegueOperativoSeries'
import { getApiUrl, getCircularityBaseline, getCityContext, getPortalJourney, apiFetch, fetchResearchFindings } from '@/lib/api'
import { ORGANIGRAMA_DIAGNOSTICO_PERSIST_EMPTY } from '@/data/organigramaDiagnostico'
import { migrateSimulatorPersistedState, propuestaSlotsVacios } from '@/store/simulatorPersistMigrate'

const PRESET_PLAN_FIJADO = 'Realista' as const

/** Contrato blueprint 22_0: `localStorage['alquimia.audience']` es la clave literal de audiencia; `alquimia-simulator` sigue siendo el persist Zustand. En conflicto tras reload, gana esta clave y luego se rehidrata el journey. */
const AUDIENCE_LITERAL_KEY = 'alquimia.audience' as const

const VALID_AUDIENCES: readonly Audience[] = ['citizen', 'functionary', 'entrepreneur'] as const

function isValidAudience(value: unknown): value is Audience {
  return typeof value === 'string' && (VALID_AUDIENCES as readonly string[]).includes(value)
}

function readAudienceLiteralKey(): Audience | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(AUDIENCE_LITERAL_KEY)
    if (raw === null) return null
    const parsed: unknown = JSON.parse(raw)
    return isValidAudience(parsed) ? parsed : null
  } catch {
    return null
  }
}

function writeAudienceLiteralKey(audience: Audience | null) {
  if (typeof window === 'undefined') return
  try {
    if (audience === null) window.localStorage.removeItem(AUDIENCE_LITERAL_KEY)
    else window.localStorage.setItem(AUDIENCE_LITERAL_KEY, JSON.stringify(audience))
  } catch {
    /* quota / private mode */
  }
}

/** Callback pendiente para H-02 — no se serializa en persist. */
let agoraPlanConfirmCallback: (() => void) | null = null

function catalogRowToSeleccion(row: MunicipioMxApi): SeleccionMunicipioCatalog {
  return {
    claveInegi: row.clave_inegi,
    nombre: row.nombre,
    estadoNombre: row.estado,
    estadoId: row.estado_id,
    poblacion: row.poblacion,
    generacionRsuDia: row.generacion_rsu_dia,
    zmSimulatorId: row.zm_simulator_id,
    municipioSimulatorId: row.municipio_simulator_id,
    datosEstimados: row.datos_estimados,
  }
}

const PERSIST_VERSION = 2

interface SimulatorStore extends SimulatorState {
  resultados: ResultadosCalculados | null
  /** Contrafactual mismo estado pero captura 0% y sin CAs — para KPIs antes/después en UI. */
  resultadosSinPrograma: ResultadosCalculados | null
  propuestaSlots: PropuestaSlotTupla
  isCalculating: boolean
  generatingPlan: boolean
  generationProgress: number
  generationStep: string
  /** Q-010 H-02 — modal de confirmación antes de ÁGORA */
  agoraPlanConfirmOpen: boolean
  // Gate jurídico — seteado por DiagnosticoJuridico al cargar
  agoraLegalBloqueado: boolean
  // Fase 2.5: snapshot de trazabilidad de datos — se actualiza al cambiar ZM
  snapshotDatos: SnapshotDatos | null
  // Fase 5: resultado del marketplace — null hasta que el usuario ejecute precolocación
  marketSummary: MarketSummary | null
  // Fase 6: impacto de macrogeneradores — null hasta que se calcule
  macroImpactSummary: MacroImpactSummary | null
  // Fase 7: grafo causal generado por backend
  reasoningGraph: ReasoningGraph | null
  // Fase 8: cobertura nacional municipal
  municipioProfiles: MunicipioProfile[] | null
  coverageStatuses: CoverageStatus[] | null
  operationsSummary: OperationsSummary | null
  portalEntry: PortalEntry | null
  // Fase 22: audiencia obligatoria seleccionada por el gateway
  audience: Audience | null
  cityContext: CityContext | null
  circularityBaseline: CircularityBaseline | null
  portalJourney: DecisionModule[]
  portalJourneyLoading: boolean
  cityContextLoading: boolean
  circularityBaselineLoading: boolean
  /** Error al cargar journey (`/city/journey/steps`). */
  portalError: string | null
  /** Error al cargar contexto/baseline municipal — no debe ocultar el shell de módulos. */
  cityPortalError: string | null
  /** Módulo activo en `DecisionModuleShell` (no persistido; UI). */
  activeDecisionModuleId: string | null
  /** Índice de la propuesta que fue cargada más recientemente (0|1|2), null si ninguna. */
  propuestaActivaIdx: number | null
  /** Onboarding obligatorio cliente: territorio + PDF antes del simulador. */
  clientSetupComplete: boolean
  /** PDF del reglamento cargado para municipio activo (gate exportación). */
  municipioPdfHabilitado: boolean
  /** Hallazgos Investigador (noticias, reglamentos, programas) — no persistido. */
  researchFindings: Record<string, unknown> | null
  researchFindingsLoading: boolean

  // Actions
  setPortalEntry:      (entry: PortalEntry) => Promise<void>
  setAudience:         (audience: Audience) => Promise<void>
  resetAudience:       () => void
  completeClientSetup: () => void
  resetClientSetup:    () => void
  setMunicipioPdfHabilitado: (v: boolean) => void
  refreshResearchFindings: (opts?: { refresh?: boolean }) => Promise<void>
  fetchCityPortalData: (cityId: string) => Promise<void>
  setZM:               (id: string) => void
  applyMunicipioCatalog: (row: MunicipioMxApi) => void
  clearMunicipioSeleccion: () => void
  toggleMunicipio:     (id: string) => void
  setMunicipiosPrograma: (municipioIds: string[]) => void
  toggleTipoVivienda:  (tipo: 'vertical' | 'casa' | 'residencial') => void
  setHorizonte:        (n: number) => void
  setPreset:           (nombre: string) => void
  setPctCapturaAño:    (año: number, pct: number) => void
  setPrecio:           (mat: keyof SimulatorState['precios'], val: number) => void
  setMerma:            (v: number) => void
  setMixCA:            (tipo: 'P' | 'M' | 'G', n: number) => void
  setWacc:             (v: number) => void
  setTipoCambio:       (v: number) => void
  setGenPercapita:     (v: number) => void
  setCostoComSocial:   (v: number) => void
  setCostoDisposicionActivo: (v: boolean) => void
  setCostoDisposicionPorTon: (v: number) => void
  setCostoCamionMesMxn: (v: number) => void
  setCostoVisitaMxn: (v: number) => void
  setCostoContingenciaTonMxn: (v: number) => void
  setViviendaCondominioPct: (v: number) => void
  setViviendaNoCondominioPct: (v: number) => void
  setViviendaCondominioDepartamentoPct: (v: number) => void
  setOcupantesPorViviendaEscenario: (v: number | null) => void
  setCapturaMaterialPct: (mat: keyof SimulatorState['precios'], v: number) => void
  setMermaMaterialPct: (mat: keyof SimulatorState['precios'], v: number) => void
  setSubsidioFederal:  (v: number) => void
  setCreditoVerde:     (v: boolean) => void
  setGate:             (idx: number, val: boolean) => void
  setPrecioCarbonoEsc: (v: SimulatorState['precioCarbonoEsc']) => void
  setCapCamion:        (v: number) => void
  setMesInicio:        (v: number) => void
  recalcular:          () => void
  guardarPropuestaEnSlot: (slot: 0 | 1 | 2, nombre?: string) => void
  cargarPropuestaDesdeSlot: (slot: 0 | 1 | 2) => void
  limpiarPropuestaSlot: (slot: 0 | 1 | 2) => void
  guardarEscenario:    (nombre: string) => void
  cargarEscenario:     (id: string) => void
  setGeneratingPlan:      (v: boolean, progress?: number, step?: string) => void
  openAgoraPlanConfirm:   (onConfirm: () => void) => void
  confirmAgoraPlan:       () => void
  dismissAgoraPlanConfirm: () => void
  setAgoraLegalBloqueado: (v: boolean) => void
  setSnapshotDatos:       (s: SnapshotDatos | null) => void
  fetchSnapshotDatos:     (zm: string) => Promise<void>
  setMarketSummary:       (s: MarketSummary | null) => void
  setMacroImpactSummary:  (s: MacroImpactSummary | null) => void
  setReasoningGraph:      (g: ReasoningGraph | null) => void
  setNationalCoverage:    (profiles: MunicipioProfile[] | null, coverage: CoverageStatus[] | null) => void
  setOperationsSummary:   (s: OperationsSummary | null) => void
  setActiveDecisionModuleId: (moduleId: string | null) => void
  setPropuestaActivaIdx: (idx: number | null) => void

  // ── Cotización recomendada (motor ALQUIMIA) ────────────────────────────────
  cotizacionRecomendada: import('@/lib/recommendationEngine').CotizacionRecomendada | null
  generarCotizacion: () => void
  guardarCotizacionRemota: () => Promise<void>

  // ── Estudio social — encuesta de campo ────────────────────────────────────
  setCasaViaPublicaPct: (v: number) => void
  fetchEncuestaResultados: (municipioId: string) => Promise<void>

  // ── Esquema de concesión ──────────────────────────────────────────────────
  setEsquemaConcesion: (v: import('@/types').EsquemaConcesion) => void
  setPctCuotaConcesion: (v: number) => void
  setPctSocioPublico: (v: number) => void
  setArbolDecisionAnswer: (key: keyof import('@/types').ArbolDecisionAnswers, value: boolean | null) => void
  setFechaInicioPrograma: (v: string | null) => void
  setOrganigramaVerificacion: (nodoId: string, v: import('@/data/organigramaDiagnostico').VerificacionOrg) => void
  toggleOrganigramaChecklist: (itemId: string) => void
  setOrganigramaNotaCampo: (v: string) => void
}

const defaultState: SimulatorState = {
  zmActiva:          'SLP',
  municipiosActivos: ['slp', 'sol', 'csp', 'vip'],
  tiposVivienda:     ['vertical', 'casa'],
  horizonte:         3,
  presetTrayectoria: 'Realista',
  pctCapturaPorAño:  [20, 45, 70, 90, 100],
  mesInicio:         1,
  precios:           { ...PRECIOS_DEFAULTS },
  mermaLogPct:       10,
  rechazoPorMat: { organico: 5, papel: 8, plastico: 10, vidrio: 8, aluminio: 5, otros: 20 },
  mixCAs:            { P: 3, M: 0, G: 0 },
  capCamionTon:      12,
  costoBasureroVivienda: 180,
  vidaUtilBasureros: 3,
  costoComSocial:    600000,
  subsidioFederal:   0,
  creditoVerde:      false,
  tasaCreditoVerde:  6.5,
  plazoCreditoAños:  7,
  costoDisposicionActivo: true,
  costoDisposicionPorTon: 320,
  viviendaCondominioPct: 45,
  viviendaCondominioDepartamentoPct: 70,
  ocupantesPorViviendaEscenario: null,
  capturaPctPorMaterial: {},
  mermaPctPorMaterial: {},
  wacc:              20,
  tipoCambio:        17.10,
  precioCarbonoEsc:  'voluntario',
  genPercapita:      0.90,
  costoCamionMesMxn: OPEX_LOGISTICA_DEFAULTS.costoCamionMesMxn,
  costoVisitaMxn: OPEX_LOGISTICA_DEFAULTS.costoVisitaMxn,
  costoContingenciaTonMxn: OPEX_LOGISTICA_DEFAULTS.costoContingenciaTonMxn,
  distanciaRelleno:  25,
  capacidadRelleno:  12,
  factorCapturaGas:  65,
  temperaturaAnual:  18,
  gatesAprobados:    [false, false, false, false, false, false],
  faseInstitucional: 1,
  fuenteDatos: {
    poblacion: 'fallback', precios: 'fallback',
    tipoCambio: 'fallback', temperatura: 'fallback', recicladoras: 'fallback',
  },
  seleccionMunicipioCatalog: null,
  clientSetupComplete: false,
  casaViaPublicaPct: 70,           // % de no-condominio en calle pública; estimado DONUE/INEGI como fallback
  indicePreparacionCiudadana: null, // null = sin encuesta de campo; usa benchmark SEMARNAT 2022 (70)
  indexAceptacionVP: null,
  encuestaResultados: null,
  // Esquema de concesión / modelo de negocio
  esquemaConcesion: 'A',           // Default: Municipal Directo
  pctCuotaConcesion: 10,           // 10% cuota concesión (esquemas B/C)
  pctSocioPublico: 50,             // 50% para socio público en APP (esquema C)
  arbolDecisionAnswers: {
    tienepresupuesto: null,
    existeConcesionario: null,
    aceptaRenegociar: null,
  },
  fechaInicioPrograma: null,
  organigramaDiagnostico: { ...ORGANIGRAMA_DIAGNOSTICO_PERSIST_EMPTY },
}

/** Plantilla de estado inicial (tests Q-024 y fixtures). */
export const SIMULATOR_STATE_DEFAULT: SimulatorState = defaultState

export const useSimulatorStore = create<SimulatorStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,
        resultados: null,
        resultadosSinPrograma: null,
        propuestaSlots: propuestaSlotsVacios(),
        isCalculating: false,
        generatingPlan: false,
        generationProgress: 0,
        generationStep: '',
        agoraPlanConfirmOpen: false,
        agoraLegalBloqueado: true,  // default bloqueado hasta que DiagnosticoJuridico confirme
        snapshotDatos: null,
        marketSummary: null,        // Fase 5: null hasta ejecutar precolocación
        macroImpactSummary: null,   // Fase 6: null hasta ejecutar impacto macro
        reasoningGraph: null,       // Fase 7: null hasta generar grafo
        municipioProfiles: null,
        coverageStatuses: null,
        operationsSummary: null,
        portalEntry: null,
        audience: null,
        cityContext: null,
        circularityBaseline: null,
        portalJourney: [],
        portalJourneyLoading: false,
        cityContextLoading: false,
        circularityBaselineLoading: false,
        portalError: null,
        cityPortalError: null,
        activeDecisionModuleId: null,
        propuestaActivaIdx: null,
        clientSetupComplete: false,
        municipioPdfHabilitado: false,
        researchFindings: null,
        researchFindingsLoading: false,

        completeClientSetup: () => {
          set({ clientSetupComplete: true })
        },

        resetClientSetup: () => {
          set({ clientSetupComplete: false, municipioPdfHabilitado: false, researchFindings: null })
        },

        setMunicipioPdfHabilitado: (v) => { set({ municipioPdfHabilitado: v }) },

        refreshResearchFindings: async (opts) => {
          const st = get()
          const mid = st.municipiosActivos[0]
          if (!mid) {
            set({ researchFindings: null })
            return
          }
          const sel = st.seleccionMunicipioCatalog
          set({ researchFindingsLoading: true })
          try {
            const data = await fetchResearchFindings({
              municipio_id: mid,
              zm_id: st.zmActiva,
              municipio_nombre: sel?.nombre ?? mid,
              estado: sel?.estadoNombre ?? '',
              refresh: opts?.refresh ?? false,
            })
            set({ researchFindings: data })
          } catch {
            set({ researchFindings: null })
          } finally {
            set({ researchFindingsLoading: false })
          }
        },

        setActiveDecisionModuleId: moduleId => {
          set({ activeDecisionModuleId: moduleId })
        },
        setPropuestaActivaIdx: idx => {
          set({ propuestaActivaIdx: idx })
        },

        setPortalEntry: async (entry) => {
          set({
            portalEntry: entry,
            portalJourney: [],
            portalJourneyLoading: true,
            portalError: null,
            cityPortalError: null,
            activeDecisionModuleId: null,
          })
          try {
            const journey = await getPortalJourney(entry)
            if (get().portalEntry === entry) set({ portalJourney: journey, portalJourneyLoading: false })
          } catch (err) {
            set({
              portalJourneyLoading: false,
              portalError: err instanceof Error ? err.message : 'Journey no disponible',
            })
          }
        },

        // Fase 22 — selección obligatoria de audiencia.
        // Mapea la audiencia a un PortalEntry backend (sin tocar contratos en 22.x).
        // Limpia el journey activo y vuelve a cargarlo con la nueva audiencia.
        setAudience: async (audience) => {
          writeAudienceLiteralKey(audience)
          const entry = AUDIENCE_TO_PORTAL[audience]
          set({
            audience,
            portalEntry: entry,
            portalJourney: [],
            portalJourneyLoading: true,
            portalError: null,
            cityPortalError: null,
            activeDecisionModuleId: null,
          })
          try {
            const journey = await getPortalJourney(entry)
            if (get().audience === audience) {
              set({ portalJourney: journey, portalJourneyLoading: false })
            }
          } catch (err) {
            set({
              portalJourneyLoading: false,
              portalError: err instanceof Error ? err.message : 'Journey no disponible',
            })
          }
        },

        resetAudience: () => {
          writeAudienceLiteralKey(null)
          set({
            audience: null,
            portalEntry: null,
            portalJourney: [],
            portalJourneyLoading: false,
            portalError: null,
            cityPortalError: null,
            activeDecisionModuleId: null,
          })
        },

        fetchCityPortalData: async (cityId) => {
          const requestedCity = cityId.toUpperCase()
          if (get().zmActiva.toUpperCase() !== requestedCity) return
          set({
            cityContextLoading: true,
            circularityBaselineLoading: true,
            cityPortalError: null,
          })
          try {
            const [context, baseline] = await Promise.all([
              getCityContext(requestedCity),
              getCircularityBaseline(requestedCity),
            ])
            if (get().zmActiva.toUpperCase() !== requestedCity) return
            set({
              cityContext: context,
              circularityBaseline: baseline,
              cityContextLoading: false,
              circularityBaselineLoading: false,
              cityPortalError: null,
            })
          } catch (err) {
            if (get().zmActiva.toUpperCase() !== requestedCity) return
            set({
              cityContextLoading: false,
              circularityBaselineLoading: false,
              cityPortalError: err instanceof Error ? err.message : 'Datos de ciudad no disponibles',
            })
          }
        },

        setZM: (id) => {
          if (alquimiaHideGdlFromUi() && id === 'GDL') {
            return
          }
          const zm = ZMS.find(z => z.id === id)
          // Bug 0 fix: reset COMPLETO de todos los parámetros dependientes de ZM
          // en una sola transacción antes de recalcular — evita renders con datos parciales
          set({
            zmActiva:          id,
            municipiosActivos: zm?.municipios.map(m => m.id) ?? [],
            genPercapita:      zm?.genKgDia ?? 0.90,
            // Resetear trayectoria al preset Realista para la nueva ZM
            presetTrayectoria: 'Realista',
            pctCapturaPorAño:  [...(PRESETS_TRAYECTORIA['Realista']?.años ?? [20, 45, 70, 90, 100])],
            // Resetear mix de CAs al piloto por defecto
            mixCAs:            { P: 3, M: 0, G: 0 },
            // Fase 2.5: invalidar snapshot anterior al cambiar ZM
            snapshotDatos:     null,
            // Fase 5: invalidar marketSummary al cambiar ZM
            marketSummary:     null,
            macroImpactSummary: null,
            reasoningGraph:     null,
            municipioProfiles:  null,
            coverageStatuses:   null,
            operationsSummary:   null,
            cityContext:         null,
            circularityBaseline: null,
            cityContextLoading:  true,
            circularityBaselineLoading: true,
            portalError:         null,
            cityPortalError:     null,
            seleccionMunicipioCatalog: null,
          })
          get().recalcular()
          // Fase 2.5: fetch async del snapshot — hidrata genPercapita y tipoCambio
          // con valores verificados del registry cuando lleguen
          get().fetchSnapshotDatos(id)
          get().fetchCityPortalData(id)
        },

        applyMunicipioCatalog: (row) => {
          const zmId = row.zm_simulator_id
          const mid = row.municipio_simulator_id
          const genKg =
            row.poblacion > 0 ? (row.generacion_rsu_dia * 1000) / row.poblacion : 0.688
          const sel = catalogRowToSeleccion(row)
          const mixSugerido = deriveMixCasFromPoblacion(row.poblacion)
          const costoDisp = deriveCostoDisposicionPorTon(row.poblacion)
          const distRelleno = deriveDistanciaRelleno(row.poblacion)
          const capRelleno = deriveCapacidadRelleno(row.poblacion, row.generacion_rsu_dia)
          const mermaLog = deriveMermaLogPct(row.poblacion)
          const knownZm = ZMS.find(z => z.id.toUpperCase() === zmId.toUpperCase())
          if (knownZm) {
            if (get().zmActiva.toUpperCase() !== zmId.toUpperCase()) {
              get().setZM(zmId)
            }
          } else {
            set({
              zmActiva: zmId,
              snapshotDatos: null,
              marketSummary: null,
              macroImpactSummary: null,
              reasoningGraph: null,
              cityContext: null,
              circularityBaseline: null,
            })
          }
          set({
            municipiosActivos: [mid],
            genPercapita: genKg,
            seleccionMunicipioCatalog: sel,
            mixCAs: mixSugerido,
            costoDisposicionPorTon: costoDisp,
            viviendaCondominioPct: row.poblacion > 500_000 ? 55 : row.poblacion > 150_000 ? 45 : 30,
            distanciaRelleno: distRelleno,
            capacidadRelleno: capRelleno,
            mermaLogPct: mermaLog,
            municipioPdfHabilitado: false,
            agoraLegalBloqueado: true,
            researchFindings: null,
          })
          get().recalcular()
          void get().refreshResearchFindings()
          if (knownZm) {
            get().fetchSnapshotDatos(zmId)
            get().fetchCityPortalData(zmId)
          }
        },

        clearMunicipioSeleccion: () => {
          const zm = ZMS.find(z => z.id === get().zmActiva)
          if (!zm) {
            set({ seleccionMunicipioCatalog: null })
            return
          }
          set({
            seleccionMunicipioCatalog: null,
            municipiosActivos: zm.municipios.map(m => m.id),
            genPercapita: zm.genKgDia,
          })
          get().recalcular()
        },

        toggleMunicipio: (id) => {
          const cur = get().municipiosActivos
          const next = cur.includes(id) ? cur.filter(m => m !== id) : [...cur, id]
          set({ municipiosActivos: next.length ? next : cur })
          get().recalcular()
        },

        setMunicipiosPrograma: (municipioIds) => {
          const zm = ZMS.find(z => z.id === get().zmActiva)
          if (!zm) return
          const allowed = new Set(zm.municipios.map(m => m.id))
          const filtered = municipioIds.filter(mid => allowed.has(mid))
          const next = filtered.length ? filtered : zm.municipios.map(m => m.id)
          const sel = get().seleccionMunicipioCatalog
          const keepSel = Boolean(
            sel && next.length === 1 && next[0] === sel.municipioSimulatorId,
          )
          const clearingCatalog = Boolean(sel) && !keepSel
          set({
            municipiosActivos: next,
            ...(keepSel
              ? {}
              : { seleccionMunicipioCatalog: null }),
            ...(clearingCatalog ? { genPercapita: zm.genKgDia } : {}),
          })
          get().recalcular()
        },

        toggleTipoVivienda: (tipo) => {
          const cur = get().tiposVivienda
          const next = cur.includes(tipo) ? cur.filter(t => t !== tipo) : [...cur, tipo]
          set({ tiposVivienda: next.length ? next : cur })
          get().recalcular()
        },

        setHorizonte: (n) => { set({ horizonte: n }); get().recalcular() },

        setPreset: (nombre) => {
          const preset = PRESETS_TRAYECTORIA[nombre]
          if (preset) set({ presetTrayectoria: nombre, pctCapturaPorAño: [...preset.años] })
          get().recalcular()
        },

        setPctCapturaAño: (año, pct) => {
          const cur = [...get().pctCapturaPorAño]
          cur[año] = pct
          set({ pctCapturaPorAño: cur, presetTrayectoria: 'Personalizado' })
          get().recalcular()
        },

        setPrecio: (mat, val) => {
          set({ precios: { ...get().precios, [mat]: val } })
          get().recalcular()
        },

        setMerma: (v) => { set({ mermaLogPct: v }); get().recalcular() },
        /** El mix §2.4 se deriva del horizonte y preset en `recalcular`; ignoramos ajustes manuales legacy. */
        setMixCA: (_tipo, _n) => {
          get().recalcular()
        },
        setWacc: (v) => { set({ wacc: v }); get().recalcular() },
        setTipoCambio: (v) => { set({ tipoCambio: v }); get().recalcular() },
        setGenPercapita: (v) => { set({ genPercapita: v }); get().recalcular() },
        setCostoComSocial: (v) => { set({ costoComSocial: v }); get().recalcular() },
        setCostoDisposicionActivo: (v) => { set({ costoDisposicionActivo: v }); get().recalcular() },
        setCostoDisposicionPorTon: (v) => { set({ costoDisposicionPorTon: v }); get().recalcular() },
        setCostoCamionMesMxn: (v) => { set({ costoCamionMesMxn: Math.max(0, v) }) },
        setCostoVisitaMxn: (v) => { set({ costoVisitaMxn: Math.max(0, v) }) },
        setCostoContingenciaTonMxn: (v) => { set({ costoContingenciaTonMxn: Math.max(0, v) }) },
        setViviendaCondominioPct: (v) => {
          set({ viviendaCondominioPct: Math.min(100, Math.max(0, v)) })
          get().recalcular()
        },
        setViviendaNoCondominioPct: (v) => {
          set({ viviendaCondominioPct: 100 - Math.min(100, Math.max(0, v)) })
          get().recalcular()
        },
        setViviendaCondominioDepartamentoPct: (v) => {
          set({ viviendaCondominioDepartamentoPct: Math.min(100, Math.max(0, v)) })
          get().recalcular()
        },
        setOcupantesPorViviendaEscenario: (v) => {
          set({ ocupantesPorViviendaEscenario: v === null ? null : Math.min(6, Math.max(1, v)) })
          get().recalcular()
        },
        setCapturaMaterialPct: (mat, v) => {
          set({ capturaPctPorMaterial: { ...get().capturaPctPorMaterial, [mat]: Math.min(100, Math.max(0, v)) } })
          get().recalcular()
        },
        setMermaMaterialPct: (mat, v) => {
          set({ mermaPctPorMaterial: { ...get().mermaPctPorMaterial, [mat]: Math.min(95, Math.max(0, v)) } })
          get().recalcular()
        },
        setSubsidioFederal: (v) => { set({ subsidioFederal: v }); get().recalcular() },
        setCreditoVerde: (v) => { set({ creditoVerde: v }); get().recalcular() },
        setCapCamion: (v) => { set({ capCamionTon: v }); get().recalcular() },
        setMesInicio: (v) => { set({ mesInicio: v }); get().recalcular() },
        setPrecioCarbonoEsc: (v) => { set({ precioCarbonoEsc: v }); get().recalcular() },

        setGate: (idx, val) => {
          const cur = [...get().gatesAprobados]
          cur[idx] = val
          set({ gatesAprobados: cur })
        },

        recalcular: () => {
          const state = get()
          const preset = PRESETS_TRAYECTORIA[PRESET_PLAN_FIJADO]
          const años = preset?.años ?? [20, 45, 70, 90, 100]
          const h = Math.max(1, state.horizonte)
          const pctCapturaPorAño = Array.from(
            { length: h },
            (_, i) => años[Math.min(i, años.length - 1)] ?? 70,
          )
          const mixCAs = deriveMixCasFromHorizonte(state.horizonte, PRESET_PLAN_FIJADO)
          const merged = {
            ...state,
            mixCAs,
            presetTrayectoria: PRESET_PLAN_FIJADO,
            pctCapturaPorAño,
          }
          try {
            const r = calcular(merged)
            const sinProg = calcularEscenarioSinPrograma(merged)
            set({
              resultados: r,
              resultadosSinPrograma: sinProg,
              mixCAs,
              presetTrayectoria: PRESET_PLAN_FIJADO,
              pctCapturaPorAño,
            })
          } catch (e) {
            console.error('Cálculo fallido', e)
          }
        },

        guardarPropuestaEnSlot: (slot, nombreOpcional) => {
          const s = get()
          const r = s.resultados
          const horizonteGuardado = Math.max(1, s.horizonte)
          let costoModeloPromedioAnualMxn: number | undefined
          if (r) {
            costoModeloPromedioAnualMxn = (r.capexTotal ?? 0) / horizonteGuardado + (r.opexAnual ?? 0)
          }
          const nombre =
            nombreOpcional ??
            `${horizonteGuardado}a · ${new Date().toLocaleString('es-MX', {
              hour: '2-digit',
              minute: '2-digit',
              day: '2-digit',
              month: 'short',
            })}`
          const esc: EscenarioGuardado = {
            id: `${Date.now()}-${slot}`,
            nombre,
            zm: s.zmActiva,
            fecha: new Date().toISOString(),
            inputs: {
              zmActiva: s.zmActiva,
              horizonte: s.horizonte,
              genPercapita: s.genPercapita,
              precios: { ...s.precios },
              pctCapturaPorAño: [...s.pctCapturaPorAño],
              mixCAs: { ...s.mixCAs },
              tiposVivienda: [...s.tiposVivienda],
              presetTrayectoria: s.presetTrayectoria,
              mermaLogPct: s.mermaLogPct,
              costoDisposicionActivo: s.costoDisposicionActivo,
              costoDisposicionPorTon: s.costoDisposicionPorTon,
              viviendaCondominioPct: s.viviendaCondominioPct,
              viviendaCondominioDepartamentoPct: s.viviendaCondominioDepartamentoPct,
              ocupantesPorViviendaEscenario: s.ocupantesPorViviendaEscenario,
              capturaPctPorMaterial: { ...s.capturaPctPorMaterial },
              mermaPctPorMaterial: { ...s.mermaPctPorMaterial },
              rechazoPorMat: { ...s.rechazoPorMat },
              municipiosActivos: [...s.municipiosActivos],
              seleccionMunicipioCatalog: s.seleccionMunicipioCatalog,
            },
            snapshotDatos: s.snapshotDatos ?? undefined,
            costoModeloPromedioAnualMxn,
            resultados: r
              ? {
                  ingresosBrutos: s.resultados!.ingresosBrutos,
                  ebitda: s.resultados!.ebitda,
                  tir: s.resultados!.tir,
                  vpn: s.resultados!.vpn,
                  co2eEvitadasAnualTon: s.resultados!.co2eEvitadasAnualTon,
                  co2eEvitadasHorizonteTon: s.resultados!.co2eEvitadasHorizonteTon,
                  co2eEvitadasTon: s.resultados!.co2eEvitadasTon,
                  paybackMeses: s.resultados!.paybackMeses,
                  empleosTotalesDirectos: s.resultados!.empleosTotalesDirectos,
                  opexAnual: s.resultados!.opexAnual,
                  capexTotal: s.resultados!.capexTotal,
                }
              : {},
          }
          const next = [...get().propuestaSlots] as [EscenarioGuardado | null, EscenarioGuardado | null, EscenarioGuardado | null]
          next[slot] = esc
          set({ propuestaSlots: next })
        },

        cargarPropuestaDesdeSlot: (slot) => {
          const esc = get().propuestaSlots[slot]
          if (!esc?.inputs) return
          const inc = esc.inputs as Partial<SimulatorState>
          set({
            ...inc,
            municipiosActivos: Array.isArray(inc.municipiosActivos)
              ? [...inc.municipiosActivos]
              : get().municipiosActivos,
            tiposVivienda: Array.isArray(inc.tiposVivienda) ? [...inc.tiposVivienda] : get().tiposVivienda,
            pctCapturaPorAño: Array.isArray(inc.pctCapturaPorAño)
              ? [...inc.pctCapturaPorAño]
              : get().pctCapturaPorAño,
            precios: inc.precios ? { ...inc.precios } : get().precios,
            propuestaActivaIdx: slot,
          })
          get().recalcular()
        },

        limpiarPropuestaSlot: (slot) => {
          const next = [...get().propuestaSlots] as [EscenarioGuardado | null, EscenarioGuardado | null, EscenarioGuardado | null]
          next[slot] = null
          set({ propuestaSlots: next })
        },

        guardarEscenario: (nombre) => {
          get().guardarPropuestaEnSlot(0, nombre)
        },

        cargarEscenario: (id) => {
          const idx = get().propuestaSlots.findIndex(p => p?.id === id)
          if (idx >= 0) get().cargarPropuestaDesdeSlot(idx as 0 | 1 | 2)
        },

        setGeneratingPlan: (v, progress, step) => {
          set({ generatingPlan: v, generationProgress: progress ?? 0, generationStep: step ?? '' })
        },

        openAgoraPlanConfirm: (onConfirm) => {
          agoraPlanConfirmCallback = onConfirm
          set({ agoraPlanConfirmOpen: true })
        },
        confirmAgoraPlan: () => {
          const cb = agoraPlanConfirmCallback
          agoraPlanConfirmCallback = null
          set({ agoraPlanConfirmOpen: false })
          cb?.()
        },
        dismissAgoraPlanConfirm: () => {
          agoraPlanConfirmCallback = null
          set({ agoraPlanConfirmOpen: false })
        },

        setAgoraLegalBloqueado: (v) => { set({ agoraLegalBloqueado: v }) },

        // ── Cotización recomendada ─────────────────────────────────────────────
        cotizacionRecomendada: null,

        generarCotizacion: () => {
          const state = get()
          const resultados = state.resultados
          if (!resultados) return
          import('@/lib/recommendationEngine').then(({ generarCotizacion }) => {
            const cotizacion = generarCotizacion(state, resultados)
            set({ cotizacionRecomendada: cotizacion })
          })
        },

        guardarCotizacionRemota: async () => {
          const { cotizacionRecomendada } = get()
          if (!cotizacionRecomendada) return
          try {
            const apiUrl = getApiUrl()
            const c = cotizacionRecomendada
            const body = {
              id:                      c.id,
              version:                 c.version,
              generado_por:            c.generadoPor,
              municipio_id:            c.municipioId,
              municipio_nombre:        c.municipioNombre,
              zm:                      c.zm,
              poblacion:               c.poblacion,
              generacion_rsu_ton_dia:  c.rsuTotalTonDia,
              pct_captura_meta:        c.pctCapturaMeta,
              ton_captura_meta:        c.tonCapturaMeta,
              horizonte_anos:          c.horizonteAnos,
              precios_json:            c.precios,
              fase_recomendada:        c.faseRecomendada,
              fase_nombre:             c.faseNombre,
              mix_cas:                 c.mixCAs,
              capacidad_ton_dia:       c.capacidadCAs,
              cobertura_meta_pct:      c.coberturaMetaPct,
              recicladoras:            c.recicladoras.map(r => ({
                giro: r.giro, nombre: r.nombre, justificacion: r.justificacion,
                capex_mxn: r.capexMXN, opex_mes_mxn: r.opexMesMXN,
                tir_pct: r.tirPct, payback_meses: r.paybackMeses, empleos: r.empleos,
              })),
              resumen: {
                capex_total_mxn:  c.resumen.capexTotalMXN,
                opex_mes_mxn:     c.resumen.opexMesMXN,
                ebitda_mes_mxn:   c.resumen.ebitdaMesMXN,
                empleos_directos: c.resumen.empleosDirectos,
                co2e_anual_ton:   c.resumen.co2eAnualTon,
                tir_estimada_pct: c.resumen.tirEstimadaPct,
                payback_meses:    c.resumen.paybackMeses,
              },
              score_viabilidad:        c.scoreViabilidad,
              clasificacion_viabilidad: c.clasificacionViabilidad,
              justificacion: {
                texto_ejecutivo:    c.justificacion.textoEjecutivo,
                factores_favorables: c.justificacion.factoresFavorables,
                restricciones:      c.justificacion.restricciones,
                supuestos_clave:    c.justificacion.supuestosClave,
              },
              resultado_completo_json: c,
            }
            await apiFetch(`${apiUrl}/api/v1/cotizaciones/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body),
            })
          } catch {
            // Fallo silencioso — cotización generada localmente siempre disponible
          }
        },

        setCasaViaPublicaPct: (v) => {
          set({ casaViaPublicaPct: Math.max(0, Math.min(100, v)) })
          get().recalcular()
        },

        setEsquemaConcesion: (v) => {
          set({ esquemaConcesion: v })
          get().recalcular()
        },
        setPctCuotaConcesion: (v) => {
          set({ pctCuotaConcesion: Math.max(1, Math.min(50, v)) })
          get().recalcular()
        },
        setPctSocioPublico: (v) => {
          set({ pctSocioPublico: Math.max(10, Math.min(90, v)) })
          get().recalcular()
        },
        setArbolDecisionAnswer: (key, value) => {
          set(s => ({ arbolDecisionAnswers: { ...s.arbolDecisionAnswers, [key]: value } }))
        },
        setFechaInicioPrograma: (v) => {
          set({ fechaInicioPrograma: v })
        },

        setOrganigramaVerificacion: (nodoId, v) => {
          set(state => ({
            organigramaDiagnostico: {
              ...state.organigramaDiagnostico,
              verificaciones: { ...state.organigramaDiagnostico.verificaciones, [nodoId]: v },
            },
          }))
        },
        toggleOrganigramaChecklist: (itemId) => {
          set(state => {
            const prev = state.organigramaDiagnostico.checklistCompletado[itemId] ?? false
            return {
              organigramaDiagnostico: {
                ...state.organigramaDiagnostico,
                checklistCompletado: {
                  ...state.organigramaDiagnostico.checklistCompletado,
                  [itemId]: !prev,
                },
              },
            }
          })
        },
        setOrganigramaNotaCampo: (v) => {
          set(state => ({
            organigramaDiagnostico: { ...state.organigramaDiagnostico, notaCampo: v },
          }))
        },

        fetchEncuestaResultados: async (municipioId) => {
          try {
            const apiUrl = getApiUrl()
            const res = await apiFetch(`${apiUrl}/api/v1/survey/${encodeURIComponent(municipioId)}/resultados`)
            if (!res.ok) return
            const data = await res.json()
            if (data.n_total === 0) return   // sin respuestas aún — mantener benchmark
            set({
              encuestaResultados: data,
              indicePreparacionCiudadana: data.ipc_global ?? null,
              indexAceptacionVP: data.ipc_hemisferio2_vp ?? null,
            })
          } catch {
            // Fallo silencioso — se usa benchmark SEMARNAT 2022 (70) como fallback
          }
        },

        setSnapshotDatos: (s) => { set({ snapshotDatos: s }) },
        setMarketSummary: (s) => { set({ marketSummary: s }) },
        setMacroImpactSummary: (s) => { set({ macroImpactSummary: s }) },
        setReasoningGraph: (g) => { set({ reasoningGraph: g }) },
        setNationalCoverage: (profiles, coverage) => {
          set({ municipioProfiles: profiles, coverageStatuses: coverage })
        },
        setOperationsSummary: (s) => { set({ operationsSummary: s }) },

        fetchSnapshotDatos: async (zm) => {
          /**
           * Fase 2.5: obtiene el snapshot de datos del registry para la ZM.
           * Si Banxico responde con tipo=oficial → actualiza tipoCambio en el store.
           * Si SEMARNAT responde con certificado → actualiza genPercapita si no fue
           * modificado manualmente por el usuario.
           * Nunca lanza — si el snapshot falla se mantienen valores por defecto.
           */
          try {
            const apiUrl = getApiUrl()
            const res = await apiFetch(`${apiUrl}/data/${zm}/snapshot`)
            if (!res.ok) return
            const snapshot: SnapshotDatos = await res.json()
            set({ snapshotDatos: snapshot })

            // Hidratar tipo de cambio si Banxico respondió con alta confianza
            const tcKpi = snapshot.kpis.find(k => k.kpi_id === 'tipo_cambio_mxn_usd')
            if (tcKpi && tcKpi.provenance.tipo === 'oficial' && typeof tcKpi.valor === 'number') {
              set({ tipoCambio: tcKpi.valor })
            }

            // Hidratar gen per cápita si SEMARNAT tiene valor certificado y el usuario
            // no lo modificó manualmente (está en el valor por defecto de la ZM)
            const genKpi = snapshot.kpis.find(k => k.kpi_id === 'gen_percapita_kg_dia')
            const zmObj  = ZMS.find(z => z.id === zm)
            const curGen = get().genPercapita
            const isDefault = !zmObj || curGen === zmObj.genKgDia
            if (
              genKpi && isDefault &&
              (genKpi.provenance.tipo === 'certificado' || genKpi.provenance.tipo === 'oficial') &&
              typeof genKpi.valor === 'number'
            ) {
              set({ genPercapita: genKpi.valor })
            }

            get().recalcular()
          } catch {
            // Red o backend no disponible — continúa con valores por defecto
          }
        },
      }),
      {
        name: 'alquimia-simulator',
        version: PERSIST_VERSION,
        migrate: (persisted, _fromVersion) => migrateSimulatorPersistedState(persisted),
        partialize: (s) => ({
          audience: s.audience,
          propuestaSlots: s.propuestaSlots,
          organigramaDiagnostico: s.organigramaDiagnostico,
          clientSetupComplete: s.clientSetupComplete,
          zmActiva: s.zmActiva,
          municipiosActivos: s.municipiosActivos,
          seleccionMunicipioCatalog: s.seleccionMunicipioCatalog,
        }),
        onRehydrateStorage: () => (partial, error) => {
          if (error || typeof window === 'undefined') return
          const literal = readAudienceLiteralKey()
          if (literal) {
            queueMicrotask(() => {
              useSimulatorStore.setState({ audience: literal })
            })
            return
          }
          const fromPersist =
            partial && typeof partial === 'object' && partial !== null && 'audience' in partial
              ? (partial as { audience: Audience | null }).audience
              : null
          if (fromPersist) writeAudienceLiteralKey(fromPersist)
        },
      }
    )
  )
)
