/**
 * Contexto de madurez / diferenciación municipal (DIA + Navigator).
 * Refuerza que cada municipio es un escenario propio: norma, supuestos del motor y proyecto simulado no son intercambiables.
 */
import { ZMS } from '@/lib/constants'
import { reglamentoFuentePorMunicipio, tienePdfLocalEmbebible } from '@/data/reglamentos'

export interface MunicipioMadurezVista {
  municipio_id: string
  nombre: string
  zmNombre: string
  kgHabDia: number
  poblacionRef: number
  lineaNormativa: string
  lineaOperativa: string
}

function ubicarMunicipio(municipioId: string) {
  const id = municipioId.toLowerCase()
  for (const zm of ZMS) {
    const m = zm.municipios.find(x => x.id === id)
    if (m) return { zm, m }
  }
  return null
}

/** Una línea sobre el inventario de reglamentos (`public/reglamentos/` — solo PDFs en línea). */
function lineaCatálogoNormativa(municipioId: string): string {
  const reg = reglamentoFuentePorMunicipio(municipioId)
  if (!reg) {
    return 'Este municipio aún no tiene fila propia en el catálogo de reglamentos del simulador; Marco Legal y validación competente definen qué instrumento aplica.'
  }
  if (tienePdfLocalEmbebible(reg)) {
    return 'Catálogo: PDF municipal disponible en línea para lectura y adendos propuestos por agentes ALQUIMIA; la vigencia reconocible ante terceros sigue siendo la publicación oficial enlazada.'
  }
  switch (reg.estado_verificacion) {
    case 'vigente':
      return 'Catálogo: anclaje marcado como vigente para trabajo consultivo — la versión reconocible ante terceros sigue siendo la publicación oficial enlazada.'
    case 'en_revision':
      return 'Catálogo: hay referencia oficial para revisión interna; pendiente PDF en `public/reglamentos/`. La vigencia y el título exacto deben confirmarse en fuente oficial antes de cualquier acto de autoridad.'
    case 'no_localizado':
      return 'Catálogo: anclaje normativo pendiente (sin PDF municipal en línea); el simulador no asume que el ayuntamiento comparte el mismo “piso” normativo que un vecino metropolitano.'
    default:
      return 'Estado normativo en catálogo sin clasificar; tratar como pendiente de verificación.'
  }
}

/**
 * Texto operativo-modelo: separa escenarios por generación per cápita y población de referencia INEGI en constants.
 */
function lineaOperativa(kgHabDia: number, poblacion: number, zmNombre: string): string {
  return `El motor usa ${kgHabDia} kg/hab·día y ${poblacion.toLocaleString('es-MX')} habitantes de referencia para este ayuntamiento dentro de ${zmNombre}; otro municipio, aunque comparta ZM, altera toneladas, ingresos evitados y cobertura de CAs.`
}

export function getMunicipioMadurezVista(municipioId: string): MunicipioMadurezVista | null {
  const hit = ubicarMunicipio(municipioId)
  if (!hit) return null
  const { zm, m } = hit
  return {
    municipio_id: m.id,
    nombre: m.nombre,
    zmNombre: zm.nombre,
    kgHabDia: m.genKgDia,
    poblacionRef: m.pop,
    lineaNormativa: lineaCatálogoNormativa(m.id),
    lineaOperativa: lineaOperativa(m.genKgDia, m.pop, zm.nombre),
  }
}

/** Resumen cuando el programa incluye varios municipios: cada ancla es un escenario distinto. */
export function getMadurezMensajeMultiAncla(cantidad: number): string {
  return `Programa con ${cantidad} municipios: cada uno conserva reglamento propio, población y kg/hab·día distintos en el modelo — las piezas técnicas y legales no se copian de un ayuntamiento a otro sin revalidar ancla y fuente primaria.`
}

/** Texto único para pies de sección / kickers: coherente en todo el simulador. */
export function getScopeAnclaLine(ids: string[]): string {
  if (ids.length === 0) {
    return 'Alcance municipal: define municipios en Ciudad primero.'
  }
  const vista0 = getMunicipioMadurezVista(ids[0] ?? '')
  const nombreAncla = vista0?.nombre ?? ids[0] ?? ''
  if (ids.length === 1) {
    return `Ámbito modelado: ${nombreAncla} (único municipio en programa).`
  }
  return `Programa con ${ids.length} municipios; en llamadas que piden una sola ancla municipal la referencia técnica es ${nombreAncla}.`
}

/**
 * Punto orientativo en el calendario del plan (mes 1…N) según circularidad de referencia del municipio.
 * Supuesto explícito: mayor baseline implica trayectoria institucional más avanzada vs. el mismo plan de referencia.
 * No es dato de campo; solo alinea lectura temporal entre municipios con madurez distinta.
 */
export function mesEquivalenteBaselineEnPlan(
  baselineCircularityPct: number | undefined,
  totalMeses: number,
): { mes: number; pct: number } {
  const n = Math.max(1, Math.floor(totalMeses))
  const pct = Math.min(100, Math.max(0, baselineCircularityPct ?? 0))
  const fracc = pct / 100
  const mes = 1 + Math.round(fracc * (n - 1) * 0.7)
  return { mes: Math.min(n, Math.max(1, mes)), pct }
}

/** Nombre legible para narrativa: municipio único, nombre de ZM si el programa es multi-ancla, o ZM aún sin chips municipales. */
export function getEtiquetaNarrativaCiudad(municipioIds: string[], zmActivaId: string): string {
  const ids = municipioIds.filter(Boolean)
  const zm = ZMS.find(z => z.id === zmActivaId)
  if (ids.length === 0) return zm?.nombre ?? 'tu ciudad'
  if (ids.length === 1) {
    const v = getMunicipioMadurezVista(ids[0] ?? '')
    return v?.nombre ?? ids[0] ?? zm?.nombre ?? 'tu ciudad'
  }
  return zm?.nombre ?? 'tu zona metropolitana'
}

export type AplicarTerritorioOpts = {
  /** Sustituye "tu municipio" (cualquier mayúsculas) solo cuando el programa tiene un solo municipio. */
  unSoloMunicipioEnPrograma?: boolean
}

/**
 * Sustituye marcadores genéricos en copy ciudadano.
 * - `tu ciudad`
 * - opcionalmente `tu municipio` si `unSoloMunicipioEnPrograma`
 */
export function aplicarSustitucionesTerritorio(
  text: string,
  etiqueta: string,
  opts?: AplicarTerritorioOpts,
): string {
  if (!text) return text
  if (etiqueta === 'tu ciudad' || etiqueta === 'tu zona metropolitana') return text

  let out = text.replace(/tu ciudad/giu, etiqueta)
  if (opts?.unSoloMunicipioEnPrograma) {
    out = out.replace(/\btu municipio\b/giu, etiqueta)
  }
  return out
}
