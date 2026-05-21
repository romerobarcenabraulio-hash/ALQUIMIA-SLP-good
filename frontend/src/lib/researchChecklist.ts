/**
 * Checklist de completitud de investigación municipal (frontend).
 * Cada ítem es verificable contra datos del simulador o fuentes documentadas.
 */

export type ChecklistStatus = 'verified' | 'estimated' | 'missing'

export interface ResearchCheckItem {
  id: string
  category: 'legal' | 'environmental' | 'economic' | 'social' | 'infrastructure'
  label: string
  status: ChecklistStatus
  source?: string
}

export interface ResearchChecklistResult {
  items: ResearchCheckItem[]
  pctComplete: number
  missingCount: number
  verifiedCount: number
}

const BASE_ITEMS: Omit<ResearchCheckItem, 'status'>[] = [
  { id: 'reglamento-pdf', category: 'legal', label: 'Reglamento municipal localizado' },
  { id: 'adendos-borrador', category: 'legal', label: 'Adendos propuestos redactados' },
  { id: 'dictamen-tecnico', category: 'legal', label: 'Dictamen técnico y social (M03B)' },
  { id: 'rsu-composicion', category: 'environmental', label: 'Composición RSU calibrada' },
  { id: 'relleno-geo', category: 'environmental', label: 'Relleno sanitario georreferenciado' },
  { id: 'carbon-baseline', category: 'environmental', label: 'Línea base de emisiones' },
  { id: 'precios-material', category: 'economic', label: 'Precios de material documentados' },
  { id: 'costo-disposicion', category: 'economic', label: 'Costo de disposición validado' },
  { id: 'compradores', category: 'economic', label: 'Compradores / mercado identificados' },
  { id: 'censo-vivienda', category: 'social', label: 'Distribución vivienda (INEGI)' },
  { id: 'encuesta-ipc', category: 'social', label: 'Índice preparación ciudadana' },
  { id: 'ca-dimensionado', category: 'infrastructure', label: 'Centros de acopio dimensionados' },
  { id: 'rutas-logistica', category: 'infrastructure', label: 'Rutas logísticas calculadas' },
  { id: 'plantilla-operativa', category: 'infrastructure', label: 'Plantilla operativa definida' },
]

export function buildResearchChecklist(ctx: {
  hasResultados: boolean
  hasMunicipio: boolean
  hasPrecios: boolean
  hasDistribution: boolean
}): ResearchChecklistResult {
  const statusMap: Record<string, ChecklistStatus> = {
    'reglamento-pdf': ctx.hasMunicipio ? 'verified' : 'missing',
    'adendos-borrador': 'verified',
    'dictamen-tecnico': 'verified',
    'rsu-composicion': ctx.hasResultados ? 'verified' : 'estimated',
    'relleno-geo': ctx.hasMunicipio ? 'estimated' : 'missing',
    'carbon-baseline': ctx.hasResultados ? 'estimated' : 'missing',
    'precios-material': ctx.hasPrecios ? 'verified' : 'estimated',
    'costo-disposicion': ctx.hasResultados ? 'estimated' : 'missing',
    'compradores': 'estimated',
    'censo-vivienda': ctx.hasDistribution ? 'verified' : 'missing',
    'encuesta-ipc': 'estimated',
    'ca-dimensionado': ctx.hasResultados ? 'verified' : 'missing',
    'rutas-logistica': ctx.hasResultados ? 'estimated' : 'missing',
    'plantilla-operativa': ctx.hasResultados ? 'verified' : 'missing',
  }

  const items: ResearchCheckItem[] = BASE_ITEMS.map(item => ({
    ...item,
    status: statusMap[item.id] ?? 'missing',
    source: statusMap[item.id] === 'verified' ? 'Simulador / fuente documental' : undefined,
  }))

  const verifiedCount = items.filter(i => i.status === 'verified').length
  const estimatedCount = items.filter(i => i.status === 'estimated').length
  const missingCount = items.filter(i => i.status === 'missing').length
  const pctComplete = Math.round(((verifiedCount + estimatedCount * 0.5) / items.length) * 100)

  return { items, pctComplete, missingCount, verifiedCount }
}
