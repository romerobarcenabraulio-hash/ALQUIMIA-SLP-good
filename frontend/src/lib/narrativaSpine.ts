/**
 * narrativaSpine.ts
 * Pure TypeScript module — no React imports.
 * Generates transition narratives between simulator modules.
 */
import type { ResultadosCalculados } from '@/types'
import { FUNCTIONARY_MODULE_ORDER, resolveModuleId } from '@/lib/chapterConfig'
import { CLIENT_FUNCTIONARY_MODULES } from '@/lib/simulator/clientModuleRegistry'

export type ModuloId = string

export interface TransicionNarrativa {
  kicker: string
  title: string
  summary: string
  nextModuloId: ModuloId
}

const JOURNEY_ORDER: string[] = ['guia_circularidad', ...FUNCTIONARY_MODULE_ORDER]

const mxn = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})
const num = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })
const pct = (v: number) => `${num.format(v)}%`
const money = (v: number) => mxn.format(v)
const tons = (v: number) => `${num.format(v)} t`

type TransitionDraft = Omit<TransicionNarrativa, 'nextModuloId'>

function nextInJourney(canonical: string): string | null {
  const idx = JOURNEY_ORDER.indexOf(canonical)
  if (idx < 0 || idx >= JOURNEY_ORDER.length - 1) return null
  return JOURNEY_ORDER[idx + 1] ?? null
}

function labelFor(id: string): string {
  return CLIENT_FUNCTIONARY_MODULES[id]?.label ?? id
}

function fallbackTransition(origen: string, destino: string, municipioLabel: string): TransitionDraft {
  const dest = CLIENT_FUNCTIONARY_MODULES[destino]
  return {
    kicker: 'Siguiente análisis',
    title: dest?.label ?? labelFor(destino),
    summary: dest?.decision
      ? `${labelFor(origen)} cierra un bloque del diagnóstico. ${dest.decision} — el paso que sigue en ${municipioLabel}.`
      : `Continúa el recorrido consultivo hacia ${labelFor(destino)}.`,
  }
}

function buildRichTransition(
  origen: string,
  resultados: ResultadosCalculados | null,
  municipioLabel: string,
): TransitionDraft | null {
  const nextId = nextInJourney(origen)
  if (!nextId) return null

  switch (origen) {
    case 'guia_circularidad':
      return {
        kicker: 'La guía orienta el primer análisis',
        title: labelFor(nextId),
        summary: `Ahora que entiendes la estructura de ALQUIMIA, el primer paso técnico es cuantificar el problema: cuántas toneladas genera ${municipioLabel}, de qué tipo, y cuánto se recupera hoy.`,
      }
    case 'city_baseline': {
      const rsu = resultados?.rsuTotalTonDia ?? null
      const rsuStr = rsu !== null ? `${tons(rsu)}/día de RSU` : 'una cantidad significativa de RSU diaria'
      return {
        kicker: 'La línea base cuantifica el daño ambiental',
        title: labelFor(nextId),
        summary: `${municipioLabel} genera ${rsuStr}. El siguiente paso traduce esa carga en PM2.5, biogás, relleno y daño sanitario evitable.`,
      }
    }
    case 'impacto_ambiental':
      return {
        kicker: 'El impacto ambiental exige lectura social',
        title: labelFor(nextId),
        summary: `Con el daño ambiental cuantificado, el programa debe entender quién vive en ${municipioLabel}, cuánto rezago social existe y qué tan preparada está la ciudad para separar.`,
      }
    case 'social_diagnostico':
      return {
        kicker: 'El diagnóstico social pide validación de campo',
        title: labelFor(nextId),
        summary: 'La brecha demográfica se cierra con datos reales de disposición ciudadana: IPC por tipo de vivienda y preparación para separar.',
      }
    case 'social_encuesta':
      return {
        kicker: 'La ciudadanía define la política',
        title: labelFor(nextId),
        summary: 'Con la encuesta interpretada, el siguiente paso es mapear aliados, bloqueadores y ventanas políticas que habilitan o frenan la reforma.',
      }
    case 'mapeo_actores':
      return {
        kicker: 'Los actores exigen mapeo organizacional',
        title: labelFor(nextId),
        summary: 'Con el mapa político claro, hay que documentar humildemente cómo opera hoy el gobierno y el concesionario — sin asumir que ya lo conocemos.',
      }
    case 'organigrama_diagnostico':
      return {
        kicker: 'La organización actual informa la capacidad institucional',
        title: labelFor(nextId),
        summary: 'Con la cadena de contacto y organigrama as-is levantados, el siguiente paso es medir capacidad real: presupuesto, plantilla y bloqueos jurídicos.',
      }
    case 'capacidad_institucional':
      return {
        kicker: 'La capacidad institucional define el marco legal',
        title: labelFor(nextId),
        summary: 'Antes de comprometer esquemas de concesión, conviene verificar qué puede ejecutarse con el reglamento vigente y qué requiere reforma.',
      }
    case 'marco_legal':
      return {
        kicker: 'El marco legal exige cobertura territorial',
        title: labelFor(nextId),
        summary: `Los adendos propuestos deben leerse junto con la cobertura normativa de ${municipioLabel} frente a municipios vecinos de la ZM.`,
      }
    case 'cobertura_territorial':
      return {
        kicker: 'La cobertura territorial exige dictamen',
        title: labelFor(nextId),
        summary: 'Los vacíos metropolitanos deben sustentarse con evidencia técnica y social antes de Cabildo: fracciones, multas graduadas y delimitación de alcance territorial.',
      }
    case 'dictamen_tecnico': {
      const horizonte = resultados?.serieAnual?.length ?? null
      const horizStr = horizonte !== null ? `${horizonte} años` : 'el horizonte definido'
      return {
        kicker: 'La evidencia cuantifica la omisión',
        title: labelFor(nextId),
        summary: `Con la reforma fundamentada, el siguiente paso es cuantificar el pasivo de no implementar en ${horizStr}: disposición, daño sanitario y elegibilidad verde.`,
      }
    }
    case 'costo_omision':
      return {
        kicker: 'El costo de la omisión habilita la evaluación fiscal-social',
        title: labelFor(nextId),
        summary: 'El contrafactual abre la conversación de presupuesto; ahora hay que traducir empleos, pobreza y deuda estatal en beneficios fiscales trazables.',
      }
    case 'evaluacion_socioeconomica': {
      const horizonte = resultados?.serieAnual?.length ?? null
      const horizStr = horizonte !== null ? `${horizonte} años` : 'el horizonte definido'
      return {
        kicker: 'La evaluación socioeconómica cierra el diagnóstico',
        title: labelFor(nextId),
        summary: `Con el argumento fiscal-social armado, la teoría de cambio muestra cómo inputs, actividades y outcomes convergen en ${horizStr}.`,
      }
    }
    case 'teoria_cambio': {
      const h = resultados?.serieAnual?.length ?? null
      const horizStr = h !== null ? String(h) : '—'
      const lastAño = resultados?.serieAnual?.[resultados.serieAnual.length - 1]
      const pctCap = lastAño ? pct(lastAño.pctCaptura) : 'la meta definida'
      return {
        kicker: 'Diagnóstico cerrado · abre Planificación',
        title: labelFor(nextId),
        summary: `Con la teoría de cambio armada y una meta de captura de ${pctCap} al año ${horizStr}, el siguiente paso es el roadmap G1–G5: fases institucionales, actividades y gates antes del detalle operativo.`,
      }
    }
    case 'roadmap_implementacion':
      return {
        kicker: 'El roadmap traduce la teoría en fases',
        title: labelFor(nextId),
        summary: 'Las 5 fases institucionales (G1–G5) agrupan actividades T01–T15, prerequisitos y riesgos. Confirma la fase actual antes del plan maestro detallado.',
      }
    case 'plan_maestro':
      return {
        kicker: 'Las metas requieren ruta crítica',
        title: labelFor(nextId),
        summary: 'El calendario maestro debe traducirse en dependencias PERT-RACI y semanas críticas antes de secuenciar oleadas territoriales.',
      }
    case 'ruta_critica':
      return {
        kicker: 'La ruta crítica habilita oleadas',
        title: labelFor(nextId),
        summary: 'Con hitos y responsables definidos, el despliegue territorial puede secuenciarse por colonias y fases sin sobrecargar logística.',
      }
    case 'oleadas_territoriales': {
      const nCAsProxy = resultados?.ocupacionCAs ? Math.ceil(resultados.ocupacionCAs / 100) : null
      const nCAsStr = nCAsProxy !== null ? `${nCAsProxy} centro(s)` : 'los centros necesarios'
      return {
        kicker: 'Las oleadas requieren infraestructura',
        title: labelFor(nextId),
        summary: `El mapa de avance exige al menos ${nCAsStr} de acopio con capacidad suficiente. El mix P/M/G define CAPEX y TIR.`,
      }
    }
    case 'infraestructura':
      return {
        kicker: 'La infraestructura requiere gobierno operativo',
        title: labelFor(nextId),
        summary: 'Con los centros dimensionados, el siguiente paso es definir quién opera, quién responde y cuánto cuesta el personal.',
      }
    case 'organigrama': {
      const hog = resultados?.vivActivas ? Math.round(resultados.vivActivas * 0.05) : null
      const hogStr = hog !== null ? `${num.format(hog)} hogares` : 'un grupo piloto de hogares'
      return {
        kicker: 'El organigrama habilita la logística',
        title: labelFor(nextId),
        summary: `Con roles y plantilla definidos, el diseño de rutas y el piloto en ${hogStr} validan la operación antes de escalar.`,
      }
    }
    case 'logistica':
      return {
        kicker: 'La logística exige educación previa',
        title: labelFor(nextId),
        summary: 'Las rutas y el piloto solo funcionan si la ciudadanía recibe capacitación y comunicación antes del arranque.',
      }
    case 'plan_educativo':
      return {
        kicker: 'La educación tiene costo explícito',
        title: labelFor(nextId),
        summary: 'Con la ventana educativa alineada a la oleada 1, el siguiente paso es cuantificar CAPEX y OPEX del programa completo.',
      }
    case 'costos_programa':
      return {
        kicker: 'Los costos necesitan compradores',
        title: labelFor(nextId),
        summary: 'Con la inversión cuantificada, hay que verificar demanda real para cada fracción de material antes del esquema de concesión.',
      }
    case 'mercado_materiales':
      return {
        kicker: 'El mercado informa el modelo de negocio',
        title: labelFor(nextId),
        summary: 'Con compradores y precios verificados, el modelo puede estructurarse: quién opera, quién cobra y cómo se distribuyen los riesgos.',
      }
    case 'esquema_concesion': {
      const tirVal = resultados?.tir ?? null
      const vpnVal = resultados?.vpn ?? null
      const h = resultados?.serieAnual?.length ?? null
      const tirStr = tirVal !== null ? pct(tirVal) : '—'
      const vpnStr = vpnVal !== null ? money(vpnVal) : '—'
      const horizStr = h !== null ? `${h} años` : 'el horizonte definido'
      return {
        kicker: 'El esquema define el camino de capital',
        title: labelFor(nextId),
        summary: `Con el operador definido, conviene mapear los seis caminos de financiamiento antes de cerrar TIR ${tirStr} y VPN ${vpnStr} en ${horizStr}.`,
      }
    }
    case 'arbol_financiamiento':
      return {
        kicker: 'El financiamiento exige escenarios',
        title: labelFor(nextId),
        summary: 'Con el vehículo de capital preseleccionado, TIR, VPN, Monte Carlo y tornado muestran el rango de resultados bajo distintos supuestos.',
      }
    case 'escenarios_financieros':
      return {
        kicker: 'Los escenarios tienen riesgos',
        title: labelFor(nextId),
        summary: 'El retorno nominal no basta: hay que cuantificar cuánto puede deteriorarse el escenario base por mercado, política u operación.',
      }
    case 'riesgos_modelo':
      return {
        kicker: 'Los riesgos requieren expediente de cabildo',
        title: labelFor(nextId),
        summary: 'Con el modelo validado y los riesgos identificados, el expediente consolida gobernanza, checklist y documentos exportables.',
      }
    case 'expediente_cabildo':
      return {
        kicker: 'Lo aprobado requiere cumplimiento',
        title: labelFor(nextId),
        summary: 'El factor de riesgo más controlable es el cumplimiento ciudadano. La estrategia de inspección define el mecanismo sostenible.',
      }
    case 'inspeccion':
      return {
        kicker: 'Lo ejecutado se mide',
        title: labelFor(nextId),
        summary: 'Con el programa en operación, hay que comparar lo proyectado con lo que el campo mide para corregir desviaciones tempranas.',
      }
    case 'monitoreo_operativo': {
      const co2 = resultados?.co2eEvitadasAnualTon ?? null
      const co2Str = co2 !== null ? `${tons(co2)} CO₂e/año` : 'toneladas significativas de CO₂e/año'
      return {
        kicker: 'Lo medido se reporta',
        title: labelFor(nextId),
        summary: `El programa evita ${co2Str}. El monitoreo genera los datos que financiadores verdes requieren en formato GRI 306 y ESRS E5.`,
      }
    }
    case 'doble_materialidad':
      return {
        kicker: 'El reporte descansa en fuentes',
        title: labelFor(nextId),
        summary: 'Cada número del análisis — desde RSU hasta TIR — tiene fuente verificable en la matriz de trazabilidad.',
      }
    case 'trazabilidad':
      return null
    default:
      return null
  }
}

export function generarTransicion(
  origen: ModuloId,
  resultados: ResultadosCalculados | null,
  municipioLabel: string,
): TransicionNarrativa | null {
  const canonical = resolveModuleId(origen)
  const nextId = nextInJourney(canonical)
  if (!nextId) return null

  const rich = buildRichTransition(canonical, resultados, municipioLabel)
  const draft = rich ?? fallbackTransition(canonical, nextId, municipioLabel)

  return {
    ...draft,
    nextModuloId: nextId,
  }
}
