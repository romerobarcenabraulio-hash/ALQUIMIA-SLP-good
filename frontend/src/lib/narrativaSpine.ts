/**
 * narrativaSpine.ts
 * Pure TypeScript module — no React imports.
 * Generates transition narratives between simulator modules.
 */
import type { ResultadosCalculados } from '@/types'

export type ModuloId =
  | 'city_baseline'
  | 'municipal_context'
  | 'social_study'
  | 'future_goals'
  | 'infrastructure_operations'
  | 'logistica_operativa'
  | 'market_traceability'
  | 'risk_trends'
  | 'esquema_concesion'
  | 'scenarios_export'
  | 'inspeccion_predios'
  | 'doble_materialidad'
  | 'source_traceability'

export interface TransicionNarrativa {
  /** Short context label, e.g. "Siguiente análisis" */
  kicker: string
  /** Title of the next module */
  title: string
  /** 2-3 sentence narrative bridge with interpolated data */
  summary: string
  nextModuloId: ModuloId
}

// ── Formatting helpers (no React dependency) ──────────────────────────────────

const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const num = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })
const pct = (v: number) => `${num.format(v)}%`
const money = (v: number) => mxn.format(v)
const tons = (v: number) => `${num.format(v)} t`

// ── Transition map ────────────────────────────────────────────────────────────

/**
 * Generates a transition narrative from one module to the next.
 *
 * @param origen         - The ID of the current (source) module
 * @param resultados     - Calculated simulator results, or null if unavailable
 * @param municipioLabel - Display name for the municipality
 * @returns A `TransicionNarrativa` object, or `null` if no transition is defined for this origin
 */
export function generarTransicion(
  origen: ModuloId,
  resultados: ResultadosCalculados | null,
  municipioLabel: string,
): TransicionNarrativa | null {
  switch (origen) {

    case 'city_baseline': {
      const rsu     = resultados?.rsuTotalTonDia ?? null
      const captura = resultados?.serieAnual?.[0]
        ? null  // not directly available as pctCapturaActual — use generic fallback
        : null
      const rsuStr  = rsu !== null ? `${tons(rsu)}/día de RSU` : 'una cantidad significativa de RSU diaria'
      const pctStr  = captura !== null ? pct(captura) : 'un porcentaje limitado'
      void pctStr  // kept for future enrichment
      return {
        kicker:      'El diagnóstico apunta al reglamento',
        title:       'Marco legal y contexto normativo',
        summary:     `El municipio de ${municipioLabel} genera ${rsuStr}. Con la captura actual todavía por debajo de su potencial, el volumen restante termina en el relleno sanitario. Antes de definir metas operativas, el reglamento de limpia vigente determina qué puede ejecutarse hoy sin reforma.`,
        nextModuloId: 'municipal_context',
      }
    }

    case 'municipal_context':
      return {
        kicker:      'El reglamento necesita ciudadanos listos',
        title:       'Estudio social y aceptación ciudadana',
        summary:     `El marco jurídico define las obligaciones — la aceptación ciudadana determina si se cumplen. El IPC inicial del municipio orienta cuánto esfuerzo educativo previo se necesita antes del primer arranque operativo.`,
        nextModuloId: 'social_study',
      }

    case 'social_study': {
      const horizonte = resultados?.serieAnual?.length ?? null
      const horizStr  = horizonte !== null ? `${horizonte} años` : 'el horizonte definido'
      return {
        kicker:      'La sociedad informa las metas',
        title:       'Metas y trayectorias',
        summary:     `Con el diagnóstico territorial y social completo, es posible fijar metas de captura que sean técnicamente viables y socialmente alcanzables. El horizonte de ${horizStr} define la velocidad de escala del programa.`,
        nextModuloId: 'future_goals',
      }
    }

    case 'future_goals': {
      const h = resultados?.serieAnual?.length ?? null
      const horizStr = h !== null ? String(h) : '—'
      // Estimate CAs from occupancy proxy — use generic if not available
      const nCAsProxy = resultados?.ocupacionCAs
        ? Math.ceil(resultados.ocupacionCAs / 100)
        : null
      const nCAsStr = nCAsProxy !== null ? `${nCAsProxy} centro(s)` : 'los centros necesarios'
      // pctCaptura: take last year of serieAnual if present
      const lastAño = resultados?.serieAnual?.[resultados.serieAnual.length - 1]
      const pctCap  = lastAño ? pct(lastAño.pctCaptura) : 'la meta definida'
      return {
        kicker:      'Las metas requieren infraestructura',
        title:       'Infraestructura de centros de acopio',
        summary:     `Una tasa de captura objetivo de ${pctCap} al año ${horizStr} requiere al menos ${nCAsStr} de acopio con capacidad suficiente. La selección del mix (P/M/G) afecta directamente el CAPEX inicial y la TIR del programa.`,
        nextModuloId: 'infrastructure_operations',
      }
    }

    case 'infrastructure_operations': {
      const h = resultados?.serieAnual?.length ?? null
      const horizStr = h !== null ? String(h) : '—'
      const nCAsProxy = resultados?.ocupacionCAs
        ? Math.ceil(resultados.ocupacionCAs / 100)
        : null
      const nCAsStr = nCAsProxy !== null ? String(nCAsProxy) : 'los'
      // hogaresRecomendados: rough pilot estimate from vivActivas
      const hog = resultados?.vivActivas
        ? Math.round(resultados.vivActivas * 0.05)
        : null
      const hogStr = hog !== null ? `${num.format(hog)} hogares` : 'un grupo piloto de hogares'
      return {
        kicker:      'La infraestructura necesita rutas',
        title:       'Logística operativa y diseño de piloto',
        summary:     `Con ${nCAsStr} centros de acopio definidos, el diseño de las rutas de recolección diferenciada determina si la infraestructura opera a capacidad óptima. Un piloto bien diseñado en ${hogStr} permite validar el modelo antes de escalar al año ${horizStr}.`,
        nextModuloId: 'logistica_operativa',
      }
    }

    case 'logistica_operativa':
      return {
        kicker:      'Las rutas llegan a un mercado',
        title:       'Mercado y trazabilidad de materiales',
        summary:     `El material separado en origen solo genera valor si existe un comprador. La trazabilidad de cada fracción — desde la ruta hasta la recicladora o compostera — es el eslabón que convierte el OPEX en ingreso.`,
        nextModuloId: 'market_traceability',
      }

    case 'market_traceability':
      return {
        kicker:      'El mercado tiene riesgos',
        title:       'Análisis de riesgos y tendencias',
        summary:     `Los precios de materiales son volátiles y los actores políticos tienen intereses divergentes. El análisis de riesgos cuantifica cuánto puede deteriorarse el escenario base antes de que el programa deje de ser viable.`,
        nextModuloId: 'risk_trends',
      }

    case 'risk_trends': {
      const ingTotal = resultados?.ingresosMunicipioTotal ?? null
      const ingStr   = ingTotal !== null ? `${money(ingTotal)} MXN anuales` : 'ingresos significativos'
      return {
        kicker:      'Los riesgos informan quién debe operar',
        title:       'Esquema de concesión y modelo de negocio',
        summary:     `La distribución de riesgos operativos entre municipio y privado no es solo una decisión técnica — es la pregunta central de la sesión de cabildo. ${municipioLabel} tiene acceso a ${ingStr} bajo el esquema recomendado.`,
        nextModuloId: 'esquema_concesion',
      }
    }

    case 'esquema_concesion': {
      const tirVal  = resultados?.tir   ?? null
      const vpnVal  = resultados?.vpn   ?? null
      const h       = resultados?.serieAnual?.length ?? null
      const tirStr  = tirVal  !== null ? pct(tirVal)    : '—'
      const vpnStr  = vpnVal  !== null ? money(vpnVal)  : '—'
      const horizStr = h !== null ? `${h} años` : 'el horizonte definido'
      return {
        kicker:      'El esquema define el retorno',
        title:       'Escenarios financieros y exportación',
        summary:     `Con el esquema de concesión seleccionado, el simulador proyecta una TIR de ${tirStr} y un VPN de ${vpnStr} MXN en el horizonte de ${horizStr}. El análisis de sensibilidad muestra el rango de resultados bajo distintos supuestos.`,
        nextModuloId: 'scenarios_export',
      }
    }

    case 'scenarios_export':
      return {
        kicker:      'El programa requiere cumplimiento',
        title:       'Inspección de predios y estrategia operativa',
        summary:     `La viabilidad financiera del programa depende de que los generadores obligados separen efectivamente. La estrategia de inspección y seguimiento define el mecanismo de cumplimiento que hace sostenible el programa en el tiempo.`,
        nextModuloId: 'inspeccion_predios',
      }

    case 'inspeccion_predios': {
      const co2 = resultados?.co2eEvitadasAnualTon ?? null
      const co2Str = co2 !== null ? `${tons(co2)} CO₂e/año` : 'toneladas significativas de CO₂e/año'
      return {
        kicker:      'La operación genera reportabilidad',
        title:       'Doble materialidad y reporte ESG',
        summary:     `El programa evita ${co2Str} — una cifra que BID, BANOBRAS y fondos climáticos requieren en formato GRI 306 y ESRS E5 para evaluar solicitudes de crédito verde.`,
        nextModuloId: 'doble_materialidad',
      }
    }

    case 'doble_materialidad':
      return {
        kicker:      'El reporte descansa en fuentes',
        title:       'Bibliografía y trazabilidad de cálculos',
        summary:     `Cada número del análisis — desde la generación RSU hasta la TIR — tiene una fuente verificable. La matriz de trazabilidad permite que el equipo jurídico y técnico del municipio defienda cualquier cifra ante cabildo o auditoría.`,
        nextModuloId: 'source_traceability',
      }

    case 'source_traceability':
      return null

    default:
      return null
  }
}
