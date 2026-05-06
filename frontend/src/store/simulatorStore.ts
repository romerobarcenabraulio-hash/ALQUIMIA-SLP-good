import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import type { SimulatorState, ResultadosCalculados, EscenarioGuardado, SnapshotDatos, MarketSummary, MacroImpactSummary, ReasoningGraph, MunicipioProfile, CoverageStatus, OperationsSummary, PortalEntry, CityContext, CircularityBaseline, DecisionModule, Audience } from '@/types'
import { AUDIENCE_TO_PORTAL } from '@/types'
import { PRECIOS_DEFAULTS, PRESETS_TRAYECTORIA, ZMS } from '@/lib/constants'
import { calcular } from '@/lib/calculator'
import { getApiUrl, getCircularityBaseline, getCityContext, getPortalJourney, apiFetch } from '@/lib/api'

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

interface SimulatorStore extends SimulatorState {
  resultados: ResultadosCalculados | null
  escenarios: EscenarioGuardado[]
  isCalculating: boolean
  generatingPlan: boolean
  generationProgress: number
  generationStep: string
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
  portalError: string | null

  // Actions
  setPortalEntry:      (entry: PortalEntry) => Promise<void>
  setAudience:         (audience: Audience) => Promise<void>
  resetAudience:       () => void
  fetchCityPortalData: (cityId: string) => Promise<void>
  setZM:               (id: string) => void
  toggleMunicipio:     (id: string) => void
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
  setSubsidioFederal:  (v: number) => void
  setCreditoVerde:     (v: boolean) => void
  setGate:             (idx: number, val: boolean) => void
  setPrecioCarbonoEsc: (v: SimulatorState['precioCarbonoEsc']) => void
  setCapCamion:        (v: number) => void
  setMesInicio:        (v: number) => void
  recalcular:          () => void
  guardarEscenario:    (nombre: string) => void
  cargarEscenario:     (id: string) => void
  setGeneratingPlan:      (v: boolean, progress?: number, step?: string) => void
  setAgoraLegalBloqueado: (v: boolean) => void
  setSnapshotDatos:       (s: SnapshotDatos | null) => void
  fetchSnapshotDatos:     (zm: string) => Promise<void>
  setMarketSummary:       (s: MarketSummary | null) => void
  setMacroImpactSummary:  (s: MacroImpactSummary | null) => void
  setReasoningGraph:      (g: ReasoningGraph | null) => void
  setNationalCoverage:    (profiles: MunicipioProfile[] | null, coverage: CoverageStatus[] | null) => void
  setOperationsSummary:   (s: OperationsSummary | null) => void
}

const defaultState: SimulatorState = {
  zmActiva:          'SLP',
  municipiosActivos: ['slp', 'sol', 'csp', 'vip'],
  tiposVivienda:     ['vertical', 'casa', 'residencial'],
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
  wacc:              20,
  tipoCambio:        17.10,
  precioCarbonoEsc:  'voluntario',
  genPercapita:      0.90,
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
}

export const useSimulatorStore = create<SimulatorStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...defaultState,
        resultados: null,
        escenarios: [],
        isCalculating: false,
        generatingPlan: false,
        generationProgress: 0,
        generationStep: '',
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

        setPortalEntry: async (entry) => {
          set({ portalEntry: entry, portalJourney: [], portalJourneyLoading: true, portalError: null })
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
          set({ audience, portalEntry: entry, portalJourney: [], portalJourneyLoading: true, portalError: null })
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
          })
        },

        fetchCityPortalData: async (cityId) => {
          const requestedCity = cityId.toUpperCase()
          set({
            cityContext: null,
            circularityBaseline: null,
            cityContextLoading: true,
            circularityBaselineLoading: true,
            portalError: null,
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
            })
          } catch (err) {
            if (get().zmActiva.toUpperCase() !== requestedCity) return
            set({
              cityContextLoading: false,
              circularityBaselineLoading: false,
              portalError: err instanceof Error ? err.message : 'Datos de ciudad no disponibles',
            })
          }
        },

        setZM: (id) => {
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
          })
          get().recalcular()
          // Fase 2.5: fetch async del snapshot — hidrata genPercapita y tipoCambio
          // con valores verificados del registry cuando lleguen
          get().fetchSnapshotDatos(id)
          get().fetchCityPortalData(id)
        },

        toggleMunicipio: (id) => {
          const cur = get().municipiosActivos
          const next = cur.includes(id) ? cur.filter(m => m !== id) : [...cur, id]
          set({ municipiosActivos: next.length ? next : cur })
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
        setMixCA: (tipo, n) => { set({ mixCAs: { ...get().mixCAs, [tipo]: n } }); get().recalcular() },
        setWacc: (v) => { set({ wacc: v }); get().recalcular() },
        setTipoCambio: (v) => { set({ tipoCambio: v }); get().recalcular() },
        setGenPercapita: (v) => { set({ genPercapita: v }); get().recalcular() },
        setCostoComSocial: (v) => { set({ costoComSocial: v }); get().recalcular() },
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
          try {
            const r = calcular(state)
            set({ resultados: r })
          } catch (e) {
            console.error('Cálculo fallido', e)
          }
        },

        guardarEscenario: (nombre) => {
          const s = get()
          const esc: EscenarioGuardado = {
            id:   Date.now().toString(),
            nombre,
            zm:   s.zmActiva,
            fecha: new Date().toISOString(),
            inputs: {
              zmActiva: s.zmActiva, horizonte: s.horizonte, precios: { ...s.precios },
              pctCapturaPorAño: [...s.pctCapturaPorAño], mixCAs: { ...s.mixCAs },
            },
            // Fase 2.5: incluir snapshot en el escenario guardado para trazabilidad
            snapshotDatos: s.snapshotDatos ?? undefined,
            resultados: s.resultados ? {
              ingresosBrutos:           s.resultados.ingresosBrutos,
              ebitda:                   s.resultados.ebitda,
              tir:                      s.resultados.tir,
              vpn:                      s.resultados.vpn,
              // CO2e separado para evitar confusión anual vs horizonte
              co2eEvitadasAnualTon:     s.resultados.co2eEvitadasAnualTon,      // año final — KPI header
              co2eEvitadasHorizonteTon: s.resultados.co2eEvitadasHorizonteTon,  // acumulado horizonte
              co2eEvitadasTon:          s.resultados.co2eEvitadasTon,           // alias horizonte
              paybackMeses:             s.resultados.paybackMeses,
              empleosTotalesDirectos:   s.resultados.empleosTotalesDirectos,
            } : {},
          }
          set({ escenarios: [...s.escenarios, esc] })
        },

        cargarEscenario: (id) => {
          const esc = get().escenarios.find(e => e.id === id)
          if (esc?.inputs) {
            set({ ...(esc.inputs as Partial<SimulatorState>) })
            get().recalcular()
          }
        },

        setGeneratingPlan: (v, progress, step) => {
          set({ generatingPlan: v, generationProgress: progress ?? 0, generationStep: step ?? '' })
        },

        setAgoraLegalBloqueado: (v) => { set({ agoraLegalBloqueado: v }) },

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
           * Nunca lanza — errores se registran en consola.
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
          } catch (err) {
            // Error de red o backend no disponible — continúa con valores por defecto
            console.warn('[fetchSnapshotDatos] No disponible para', zm, err)
          }
        },
      }),
      { name: 'alquimia-simulator', partialize: (s) => ({ escenarios: s.escenarios, audience: s.audience }),
        onRehydrateStorage: () => (partial, error) => {
          if (error || typeof window === 'undefined') return
          const literal = readAudienceLiteralKey()
          if (literal) {
            queueMicrotask(() => { useSimulatorStore.setState({ audience: literal }) })
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
