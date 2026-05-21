/**
 * narrativaSpine.ts
 * Pure TypeScript module — no React imports.
 * Generates transition narratives between simulator modules.
 */
import type { ResultadosCalculados } from '@/types'

export type ModuloId =
  | 'guia_circularidad'
  | 'city_baseline'
  | 'social_study'
  | 'municipal_context'
  | 'costo_omision'
  | 'future_goals'
  | 'infrastructure_operations'
  | 'organigrama_programa'
  | 'logistica_operativa'
  | 'costos_programa'
  | 'market_traceability'
  | 'esquema_concesion'
  | 'scenarios_export'
  | 'arbol_financiamiento'
  | 'risk_trends'
  | 'expediente_cabildo'
  | 'inspeccion_predios'
  | 'monitoreo_real'
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

    case 'guia_circularidad':
      return {
        kicker:      'La guía orienta el primer análisis',
        title:       'Línea base territorial y RSU',
        summary:     `Ahora que entiendes la estructura de ALQUIMIA, el primer paso técnico es cuantificar el problema: cuántas toneladas genera ${municipioLabel}, de qué tipo, y cuánto se recupera hoy.`,
        nextModuloId: 'city_baseline',
      }

    case 'city_baseline': {
      const rsu    = resultados?.rsuTotalTonDia ?? null
      const rsuStr = rsu !== null ? `${tons(rsu)}/día de RSU` : 'una cantidad significativa de RSU diaria'
      return {
        kicker:      'El diagnóstico revela la estructura social',
        title:       'Diagnóstico social y aceptación ciudadana',
        summary:     `${municipioLabel} genera ${rsuStr}. Antes de diseñar el programa, es clave entender quién vive en el municipio, cuánto rezago social existe y cuánta disposición hay a separar — datos que determinan el ritmo de adopción real.`,
        nextModuloId: 'social_study',
      }
    }

    case 'social_study': {
      return {
        kicker:      'La sociedad informa el reglamento',
        title:       'Marco legal y brechas normativas',
        summary:     `Con el diagnóstico social completo, el siguiente paso es verificar qué puede ejecutarse hoy con el reglamento vigente y qué requiere reforma. El contexto legal municipal es el tablero de reglas del juego.`,
        nextModuloId: 'municipal_context',
      }
    }

    case 'municipal_context': {
      const horizonte = resultados?.serieAnual?.length ?? null
      const horizStr  = horizonte !== null ? `${horizonte} años` : 'el horizonte definido'
      return {
        kicker:      'El marco legal cuantifica la omisión',
        title:       'Costo de no actuar — contrafactual 10 años',
        summary:     `Antes de fijar metas, conviene cuantificar el pasivo de no implementar: costo acumulado de disposición, daño sanitario y pérdida de elegibilidad para financiamiento verde en ${horizStr}.`,
        nextModuloId: 'costo_omision',
      }
    }

    case 'costo_omision': {
      const horizonte = resultados?.serieAnual?.length ?? null
      const horizStr  = horizonte !== null ? `${horizonte} años` : 'el horizonte definido'
      return {
        kicker:      'El costo de la omisión habilita las metas',
        title:       'Metas y trayectorias de captura',
        summary:     `Con el diagnóstico completo — incluido el costo de no decidir — es posible fijar metas de captura viables. El horizonte de ${horizStr} define la velocidad de escala del programa.`,
        nextModuloId: 'future_goals',
      }
    }

    case 'future_goals': {
      const h = resultados?.serieAnual?.length ?? null
      const horizStr = h !== null ? String(h) : '—'
      const nCAsProxy = resultados?.ocupacionCAs
        ? Math.ceil(resultados.ocupacionCAs / 100)
        : null
      const nCAsStr = nCAsProxy !== null ? `${nCAsProxy} centro(s)` : 'los centros necesarios'
      const lastAño = resultados?.serieAnual?.[resultados.serieAnual.length - 1]
      const pctCap  = lastAño ? pct(lastAño.pctCaptura) : 'la meta definida'
      return {
        kicker:      'Las metas requieren infraestructura',
        title:       'Infraestructura y centros de acopio',
        summary:     `Una tasa de captura objetivo de ${pctCap} al año ${horizStr} requiere al menos ${nCAsStr} de acopio con capacidad suficiente. La selección del mix (P/M/G) afecta directamente el CAPEX inicial y la TIR del programa.`,
        nextModuloId: 'infrastructure_operations',
      }
    }

    case 'infrastructure_operations': {
      return {
        kicker:      'La infraestructura requiere gobierno operativo',
        title:       'Organigrama y estructura del programa',
        summary:     `Con los centros de acopio dimensionados, el siguiente paso es definir quién opera, quién responde y cuánto cuesta el personal. Sin organigrama claro, el cabildo no puede aprobar nómina ni responsables.`,
        nextModuloId: 'organigrama_programa',
      }
    }

    case 'organigrama_programa': {
      const h = resultados?.serieAnual?.length ?? null
      const horizStr = h !== null ? String(h) : '—'
      const hog = resultados?.vivActivas
        ? Math.round(resultados.vivActivas * 0.05)
        : null
      const hogStr = hog !== null ? `${num.format(hog)} hogares` : 'un grupo piloto de hogares'
      return {
        kicker:      'El organigrama habilita la logística',
        title:       'Logística operativa y diseño de piloto',
        summary:     `Con roles y plantilla definidos, el diseño de rutas y el piloto en ${hogStr} validan la operación antes de escalar al año ${horizStr}.`,
        nextModuloId: 'logistica_operativa',
      }
    }

    case 'logistica_operativa':
      return {
        kicker:      'Las rutas tienen un costo',
        title:       'Costos del programa — CAPEX y OPEX',
        summary:     `Con el diseño logístico definido, el siguiente paso es cuantificar exactamente cuánto cuesta construir y operar el sistema: equipos, personal, renta, energía y contingencia. Sin este número, no hay presupuesto que aprobar.`,
        nextModuloId: 'costos_programa',
      }

    case 'costos_programa':
      return {
        kicker:      'Los costos necesitan compradores',
        title:       'Mercado y trazabilidad de materiales',
        summary:     `Con la inversión cuantificada, el siguiente paso es verificar que existe demanda real para cada fracción de material. Sin mercado, el OPEX no se convierte en ingreso — y el programa no es sostenible.`,
        nextModuloId: 'market_traceability',
      }

    case 'market_traceability':
      return {
        kicker:      'El mercado informa el modelo de negocio',
        title:       'Esquema de concesión y árbol de decisión',
        summary:     `Con compradores identificados y precios verificados, el modelo de negocio puede estructurarse: quién opera, quién cobra y cómo se distribuyen los riesgos. Esa decisión es la pregunta real de la sesión de cabildo.`,
        nextModuloId: 'esquema_concesion',
      }

    case 'esquema_concesion': {
      const tirVal   = resultados?.tir   ?? null
      const vpnVal   = resultados?.vpn   ?? null
      const h        = resultados?.serieAnual?.length ?? null
      const tirStr   = tirVal  !== null ? pct(tirVal)   : '—'
      const vpnStr   = vpnVal  !== null ? money(vpnVal) : '—'
      const horizStr = h !== null ? `${h} años` : 'el horizonte definido'
      return {
        kicker:      'El esquema define el retorno',
        title:       'Escenarios financieros y exportación',
        summary:     `Con el esquema de concesión seleccionado, el simulador proyecta una TIR de ${tirStr} y un VPN de ${vpnStr} en el horizonte de ${horizStr}. El análisis de sensibilidad muestra el rango de resultados bajo distintos supuestos.`,
        nextModuloId: 'scenarios_export',
      }
    }

    case 'scenarios_export':
      return {
        kicker:      'El retorno define el camino de capital',
        title:       'Árbol de financiamiento — 6 caminos',
        summary:     `Con TIR y VPN calculados, el siguiente paso es identificar cómo se financia el CAPEX: municipal directo, concesión, APP, fideicomiso o crédito verde. La estructura de capital determina quién asume el riesgo.`,
        nextModuloId: 'arbol_financiamiento',
      }

    case 'arbol_financiamiento':
      return {
        kicker:      'El financiamiento tiene riesgos',
        title:       'Análisis de riesgos del modelo completo',
        summary:     `Con el camino de capital seleccionado, el análisis de riesgos cuantifica cuánto puede deteriorarse el escenario base — por volatilidad de precios, rotación política o bajo cumplimiento ciudadano.`,
        nextModuloId: 'risk_trends',
      }

    case 'risk_trends': {
      return {
        kicker:      'Los riesgos requieren expediente de cabildo',
        title:       'Expediente completo para Cabildo',
        summary:     `Con el modelo validado y los riesgos identificados, el expediente consolida gobernanza, checklist y documentos exportables para la sesión de cabildo.`,
        nextModuloId: 'expediente_cabildo',
      }
    }

    case 'expediente_cabildo': {
      return {
        kicker:      'Lo aprobado requiere cumplimiento',
        title:       'Inspección de predios y estrategia operativa',
        summary:     `El factor de riesgo más controlable es el cumplimiento ciudadano. La estrategia de inspección define el mecanismo que hace sostenible el programa en el tiempo.`,
        nextModuloId: 'inspeccion_predios',
      }
    }

    case 'inspeccion_predios':
      return {
        kicker:      'Lo ejecutado se mide',
        title:       'Monitoreo — proyectado vs. real',
        summary:     `Con el programa en operación, el siguiente paso es comparar lo que el simulador proyectó con lo que el campo mide. Las desviaciones tempranas son oportunidades de corrección — no evidencia de fracaso.`,
        nextModuloId: 'monitoreo_real',
      }

    case 'monitoreo_real': {
      const co2    = resultados?.co2eEvitadasAnualTon ?? null
      const co2Str = co2 !== null ? `${tons(co2)} CO₂e/año` : 'toneladas significativas de CO₂e/año'
      return {
        kicker:      'Lo medido se reporta',
        title:       'Doble materialidad y reporte ESG',
        summary:     `El programa evita ${co2Str}. El monitoreo genera los datos que BID, BANOBRAS y fondos climáticos requieren en formato GRI 306 y ESRS E5 para evaluar solicitudes de crédito verde.`,
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
