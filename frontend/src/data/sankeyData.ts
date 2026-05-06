/**
 * Q-021 · Sankey Flujo Residuos — catálogo PD&SA (ilustrativo, simulación ALQUIMIA).
 *
 * Estructura: 3 columnas
 *   Fuentes → Materiales → Destinos
 *
 * Keyframes temporales (años de programa): 0, 1, 3, 5
 * El slider 0→5 interpola linealmente (lerp) entre tramos:
 *   [0,1], [1,3], [3,5]
 *
 * Unidades: toneladas/día (t/día) coherente con el simulador municipal.
 * flowKind:
 *   - circular: valorización, reciclaje formal, preparación para aprovechamiento
 *   - relleno: disposición final / tiradero controlado
 */

export type SankeyColumn = 'fuente' | 'material' | 'destino'

/** Nodo lógico del diagrama (identificador estable entre años). */
export interface SankeyNode {
  id: string
  name: string
  column: SankeyColumn
}

/** Arco dirigido con metadatos para tooltip y color de link. */
export interface SankeyLink {
  source: string
  target: string
  value: number
  flowKind: 'circular' | 'relleno'
  description: string
}

/** Fotograma completo para un año de referencia del modelo. */
export interface SankeyYear {
  year: number
  links: SankeyLink[]
}

/** Nodos fijos (3 columnas). IDs en snake_case para enlaces. */
export const SANKEY_NODES: SankeyNode[] = [
  // Fuentes
  { id: 'dom', name: 'Residuo domiciliario', column: 'fuente' },
  { id: 'com', name: 'Comercio y servicios', column: 'fuente' },
  { id: 'gg', name: 'Grandes generadores', column: 'fuente' },
  // Materiales (fracciones agregadas)
  { id: 'hum', name: 'Orgánico / húmedo', column: 'material' },
  { id: 'rec', name: 'Reciclables', column: 'material' },
  { id: 'rej', name: 'Rechazo / no aprovechable', column: 'material' },
  // Destinos
  { id: 'val', name: 'Valorización / compostaje / digestión', column: 'destino' },
  { id: 'recic', name: 'Reciclaje formal', column: 'destino' },
  { id: 'rell', name: 'Relleno sanitario', column: 'destino' },
]

const DESC_FUENTE_MAT = {
  dom_hum: 'RSU domiciliario clasificado como fracción húmeda.',
  dom_rec: 'RSU domiciliario reciclable limpio.',
  dom_rej: 'RSU domiciliario rechazo mezclado.',
  com_hum: 'Comercio: restos y empaques húmedos.',
  com_rec: 'Comercio: reciclables (cartón, PET, etc.).',
  com_rej: 'Comercio: rechazo mezclado.',
  gg_hum: 'Grandes generadores: orgánicos de proceso.',
  gg_rec: 'Grandes generadores: reciclables comerciales.',
  gg_rej: 'Grandes generadores: rechazo industrial liviano RSU.',
} as const

const DESC_MAT_DEST = {
  hum_val: 'Orgánico enviado a compostaje / digestión / coprocesamiento.',
  hum_recic: 'Orgánico con trazabilidad a reciclador o tercero autorizado.',
  hum_rell: 'Orgánico sin ruta de aprovechamiento → disposición final.',
  rec_val: 'Reciclables hacia centro de acopio o prensa municipal.',
  rec_recic: 'Reciclables entregados a cadena formal de reciclaje.',
  rec_rell: 'Reciclables contaminados o residual → relleno.',
  rej_val: 'Rechazo con mínima valorización energética / RDF (si aplica).',
  rej_recic: 'Rechazo con recuperación marginal de metal/vidrio.',
  rej_rell: 'Rechazo → disposición final municipal.',
} as const

/** Keyframes PD&SA: conservación de flujo verificada por capas (fuente→mat→dest). */
export const SANKEY_YEAR_KEYFRAMES: SankeyYear[] = [
  {
    year: 0,
    links: [
      // fuente → material
      { source: 'dom', target: 'hum', value: 3.2, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_hum },
      { source: 'dom', target: 'rec', value: 2.1, flowKind: 'circular', description: DESC_FUENTE_MAT.dom_rec },
      { source: 'dom', target: 'rej', value: 0.6, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_rej },
      { source: 'com', target: 'hum', value: 0.95, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_hum },
      { source: 'com', target: 'rec', value: 1.15, flowKind: 'circular', description: DESC_FUENTE_MAT.com_rec },
      { source: 'com', target: 'rej', value: 0.28, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_rej },
      { source: 'gg', target: 'hum', value: 1.35, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_hum },
      { source: 'gg', target: 'rec', value: 0.75, flowKind: 'circular', description: DESC_FUENTE_MAT.gg_rec },
      { source: 'gg', target: 'rej', value: 0.62, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_rej },
      // material → destino (sum in = sum out por nodo material)
      { source: 'hum', target: 'val', value: 0.65, flowKind: 'circular', description: DESC_MAT_DEST.hum_val },
      { source: 'hum', target: 'recic', value: 0.28, flowKind: 'circular', description: DESC_MAT_DEST.hum_recic },
      { source: 'hum', target: 'rell', value: 4.57, flowKind: 'relleno', description: DESC_MAT_DEST.hum_rell },
      { source: 'rec', target: 'val', value: 1.1, flowKind: 'circular', description: DESC_MAT_DEST.rec_val },
      { source: 'rec', target: 'recic', value: 2.05, flowKind: 'circular', description: DESC_MAT_DEST.rec_recic },
      { source: 'rec', target: 'rell', value: 0.85, flowKind: 'relleno', description: DESC_MAT_DEST.rec_rell },
      { source: 'rej', target: 'val', value: 0.04, flowKind: 'circular', description: DESC_MAT_DEST.rej_val },
      { source: 'rej', target: 'recic', value: 0.08, flowKind: 'circular', description: DESC_MAT_DEST.rej_recic },
      { source: 'rej', target: 'rell', value: 1.38, flowKind: 'relleno', description: DESC_MAT_DEST.rej_rell },
    ],
  },
  {
    year: 1,
    links: [
      { source: 'dom', target: 'hum', value: 3.1, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_hum },
      { source: 'dom', target: 'rec', value: 2.25, flowKind: 'circular', description: DESC_FUENTE_MAT.dom_rec },
      { source: 'dom', target: 'rej', value: 0.55, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_rej },
      { source: 'com', target: 'hum', value: 0.92, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_hum },
      { source: 'com', target: 'rec', value: 1.22, flowKind: 'circular', description: DESC_FUENTE_MAT.com_rec },
      { source: 'com', target: 'rej', value: 0.25, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_rej },
      { source: 'gg', target: 'hum', value: 1.32, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_hum },
      { source: 'gg', target: 'rec', value: 0.8, flowKind: 'circular', description: DESC_FUENTE_MAT.gg_rec },
      { source: 'gg', target: 'rej', value: 0.58, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_rej },
      { source: 'hum', target: 'val', value: 1.05, flowKind: 'circular', description: DESC_MAT_DEST.hum_val },
      { source: 'hum', target: 'recic', value: 0.45, flowKind: 'circular', description: DESC_MAT_DEST.hum_recic },
      { source: 'hum', target: 'rell', value: 3.84, flowKind: 'relleno', description: DESC_MAT_DEST.hum_rell },
      { source: 'rec', target: 'val', value: 1.45, flowKind: 'circular', description: DESC_MAT_DEST.rec_val },
      { source: 'rec', target: 'recic', value: 2.35, flowKind: 'circular', description: DESC_MAT_DEST.rec_recic },
      { source: 'rec', target: 'rell', value: 0.47, flowKind: 'relleno', description: DESC_MAT_DEST.rec_rell },
      { source: 'rej', target: 'val', value: 0.06, flowKind: 'circular', description: DESC_MAT_DEST.rej_val },
      { source: 'rej', target: 'recic', value: 0.1, flowKind: 'circular', description: DESC_MAT_DEST.rej_recic },
      { source: 'rej', target: 'rell', value: 1.26, flowKind: 'relleno', description: DESC_MAT_DEST.rej_rell },
    ],
  },
  {
    year: 3,
    links: [
      { source: 'dom', target: 'hum', value: 2.95, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_hum },
      { source: 'dom', target: 'rec', value: 2.45, flowKind: 'circular', description: DESC_FUENTE_MAT.dom_rec },
      { source: 'dom', target: 'rej', value: 0.48, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_rej },
      { source: 'com', target: 'hum', value: 0.88, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_hum },
      { source: 'com', target: 'rec', value: 1.3, flowKind: 'circular', description: DESC_FUENTE_MAT.com_rec },
      { source: 'com', target: 'rej', value: 0.2, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_rej },
      { source: 'gg', target: 'hum', value: 1.25, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_hum },
      { source: 'gg', target: 'rec', value: 0.88, flowKind: 'circular', description: DESC_FUENTE_MAT.gg_rec },
      { source: 'gg', target: 'rej', value: 0.52, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_rej },
      { source: 'hum', target: 'val', value: 1.85, flowKind: 'circular', description: DESC_MAT_DEST.hum_val },
      { source: 'hum', target: 'recic', value: 0.72, flowKind: 'circular', description: DESC_MAT_DEST.hum_recic },
      { source: 'hum', target: 'rell', value: 2.51, flowKind: 'relleno', description: DESC_MAT_DEST.hum_rell },
      { source: 'rec', target: 'val', value: 1.5, flowKind: 'circular', description: DESC_MAT_DEST.rec_val },
      { source: 'rec', target: 'recic', value: 2.65, flowKind: 'circular', description: DESC_MAT_DEST.rec_recic },
      { source: 'rec', target: 'rell', value: 0.48, flowKind: 'relleno', description: DESC_MAT_DEST.rec_rell },
      { source: 'rej', target: 'val', value: 0.1, flowKind: 'circular', description: DESC_MAT_DEST.rej_val },
      { source: 'rej', target: 'recic', value: 0.14, flowKind: 'circular', description: DESC_MAT_DEST.rej_recic },
      { source: 'rej', target: 'rell', value: 0.96, flowKind: 'relleno', description: DESC_MAT_DEST.rej_rell },
    ],
  },
  {
    year: 5,
    links: [
      { source: 'dom', target: 'hum', value: 2.8, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_hum },
      { source: 'dom', target: 'rec', value: 2.65, flowKind: 'circular', description: DESC_FUENTE_MAT.dom_rec },
      { source: 'dom', target: 'rej', value: 0.4, flowKind: 'relleno', description: DESC_FUENTE_MAT.dom_rej },
      { source: 'com', target: 'hum', value: 0.82, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_hum },
      { source: 'com', target: 'rec', value: 1.38, flowKind: 'circular', description: DESC_FUENTE_MAT.com_rec },
      { source: 'com', target: 'rej', value: 0.16, flowKind: 'relleno', description: DESC_FUENTE_MAT.com_rej },
      { source: 'gg', target: 'hum', value: 1.18, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_hum },
      { source: 'gg', target: 'rec', value: 0.95, flowKind: 'circular', description: DESC_FUENTE_MAT.gg_rec },
      { source: 'gg', target: 'rej', value: 0.45, flowKind: 'relleno', description: DESC_FUENTE_MAT.gg_rej },
      { source: 'hum', target: 'val', value: 2.45, flowKind: 'circular', description: DESC_MAT_DEST.hum_val },
      { source: 'hum', target: 'recic', value: 0.95, flowKind: 'circular', description: DESC_MAT_DEST.hum_recic },
      { source: 'hum', target: 'rell', value: 1.4, flowKind: 'relleno', description: DESC_MAT_DEST.hum_rell },
      { source: 'rec', target: 'val', value: 2.0, flowKind: 'circular', description: DESC_MAT_DEST.rec_val },
      { source: 'rec', target: 'recic', value: 2.78, flowKind: 'circular', description: DESC_MAT_DEST.rec_recic },
      { source: 'rec', target: 'rell', value: 0.2, flowKind: 'relleno', description: DESC_MAT_DEST.rec_rell },
      { source: 'rej', target: 'val', value: 0.12, flowKind: 'circular', description: DESC_MAT_DEST.rej_val },
      { source: 'rej', target: 'recic', value: 0.18, flowKind: 'circular', description: DESC_MAT_DEST.rej_recic },
      { source: 'rej', target: 'rell', value: 0.71, flowKind: 'relleno', description: DESC_MAT_DEST.rej_rell },
    ],
  },
]

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function linkKey(l: Pick<SankeyLink, 'source' | 'target'>): string {
  return `${l.source}→${l.target}`
}

/** Interpola links entre keyframes 0–1–3–5 para `year` continuo en [0,5]. */
export function interpolateSankeyLinks(year: number): SankeyLink[] {
  const y = Math.min(5, Math.max(0, year))
  const frames = SANKEY_YEAR_KEYFRAMES
  let a: SankeyYear
  let b: SankeyYear
  let localT: number

  if (y <= 1) {
    a = frames[0]
    b = frames[1]
    localT = y
  } else if (y <= 3) {
    a = frames[1]
    b = frames[2]
    localT = (y - 1) / 2
  } else {
    a = frames[2]
    b = frames[3]
    localT = (y - 3) / 2
  }

  const mapA = new Map(a.links.map(l => [linkKey(l), l]))
  const mapB = new Map(b.links.map(l => [linkKey(l), l]))
  const keys = new Set([...mapA.keys(), ...mapB.keys()])
  const out: SankeyLink[] = []

  for (const key of keys) {
    const la = mapA.get(key)
    const lb = mapB.get(key)
    if (!la && !lb) continue
    const base = la ?? lb!
    const va = la?.value ?? lb?.value ?? 0
    const vb = lb?.value ?? la?.value ?? 0
    const desc = la?.description ?? lb?.description ?? ''
    const flowKind = la?.flowKind ?? lb?.flowKind ?? 'circular'
    out.push({
      source: base.source,
      target: base.target,
      value: Number(lerp(va, vb, localT).toFixed(4)),
      flowKind,
      description: desc,
    })
  }

  return out.filter(l => l.value > 0.0001)
}

const DESTINO_IDS = new Set(['val', 'recic', 'rell'])

/** KPI agregados a partir de links interpolados (solo arcos material→destino). */
export function computeSankeyKpis(links: SankeyLink[]): {
  circularTdia: number
  rellenoTdia: number
  reduccionRellenoPct: number
  baselineRelleno: number
} {
  let circular = 0
  let relleno = 0
  for (const l of links) {
    if (!DESTINO_IDS.has(l.target)) continue
    if (l.target === 'rell') relleno += l.value
    else circular += l.value
  }

  let baselineRelleno = 0
  for (const l of SANKEY_YEAR_KEYFRAMES[0].links) {
    if (!DESTINO_IDS.has(l.target)) continue
    if (l.target === 'rell') baselineRelleno += l.value
  }

  const reduccionRellenoPct =
    baselineRelleno > 0 ? ((baselineRelleno - relleno) / baselineRelleno) * 100 : 0

  return {
    circularTdia: Number(circular.toFixed(3)),
    rellenoTdia: Number(relleno.toFixed(3)),
    reduccionRellenoPct: Number(reduccionRellenoPct.toFixed(1)),
    baselineRelleno: Number(baselineRelleno.toFixed(3)),
  }
}
