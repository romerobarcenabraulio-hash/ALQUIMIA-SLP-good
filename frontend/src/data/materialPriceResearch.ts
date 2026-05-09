import type { PreciosMaterial } from '@/types'

export type PriceVerificationStatus = 'validado' | 'condicionado' | 'corregido' | 'manual'

export interface MaterialPriceResearch {
  material: keyof PreciosMaterial
  label: string
  min: number
  max: number
  median: number
  recommended: number
  previousAnchor?: number
  sourceCount: number
  status: PriceVerificationStatus
  verdict: string
  sourceSummary: string
  explanation: string
  sourceRefs: string[]
}

export const PRICE_RESEARCH_SOURCE_LABEL =
  'Investigacion_Precios_RSU_SLP.xlsx + Tabla_Maestra_Fuentes_CapituloSLP.docx'

export const MATERIAL_PRICE_RESEARCH: Record<keyof PreciosMaterial, MaterialPriceResearch> = {
  pet: {
    material: 'pet',
    label: 'PET',
    min: 3,
    max: 14,
    median: 5.5,
    recommended: 5.5,
    sourceCount: 10,
    status: 'validado',
    verdict: 'En el rango medio de la investigación documental.',
    sourceSummary: 'Capitulo San Luis, Recicladoras_por_Giro y referencias de mercado mexicano 2026.',
    explanation: 'Precio documental de escenario. Requiere cotización local antes de presupuesto; no se presenta como precio oficial.',
    sourceRefs: [
      'Investigacion_Precios_RSU_SLP.xlsx / Resumen Precios / PET',
      'CAPITULO SAN LUIS POTOSÍ.docx / tablas de valorización',
      'Recicladoras_por_Giro.xlsx / compradores y hojas por giro',
    ],
  },
  hdpe: {
    material: 'hdpe',
    label: 'HDPE',
    min: 5,
    max: 15,
    median: 8.5,
    recommended: 8.5,
    sourceCount: 4,
    status: 'condicionado',
    verdict: 'Parámetro de sensibilidad con soporte documental menor que PET y aluminio.',
    sourceSummary: 'Rango compatible con referencias nacionales; falta comprador ancla local documentado.',
    explanation: 'No es precio oficial ni cotización live; úsalo como sensibilidad hasta cerrar cotización local.',
    sourceRefs: [
      'Investigacion_Precios_RSU_SLP.xlsx / Observaciones / plásticos',
      'Tabla_Maestra_Fuentes_CapituloSLP.docx / precios de materiales',
    ],
  },
  papel: {
    material: 'papel',
    label: 'Papel / cartón',
    min: 0.7,
    max: 4,
    median: 2.5,
    recommended: 2.5,
    sourceCount: 9,
    status: 'condicionado',
    verdict: 'Ancla coincide con Caple; OCC tiene referencia más baja.',
    sourceSummary: 'Capitulo San Luis, Recicladoras_por_Giro y Supraciclaje; distinguir Caple de OCC.',
    explanation: 'El escenario debe documentar si el flujo es papel/cartón mezclado, Caple u OCC antes de presupuestar.',
    sourceRefs: [
      'Investigacion_Precios_RSU_SLP.xlsx / Resumen Precios / Papel-Cartón',
      'Recicladoras_por_Giro.xlsx / Papel y cartón',
      'Tabla_Maestra_Fuentes_CapituloSLP.docx / precios de materiales',
    ],
  },
  vidrio: {
    material: 'vidrio',
    label: 'Vidrio',
    min: 0.1,
    max: 5,
    median: 1,
    recommended: 1.3,
    previousAnchor: 2.3,
    sourceCount: 6,
    status: 'corregido',
    verdict: 'La ancla anterior $2.30/kg estaba sobre la mediana observada.',
    sourceSummary: 'Investigación de precios SLP: acopiadores y Supraciclaje sugieren rango operativo cercano a $0.50-$1.50/kg.',
    explanation: 'Ancla corregida a $1.30/kg como escenario conservador-alto documentado; requiere cotización local si se usa en presupuesto.',
    sourceRefs: [
      'Investigacion_Precios_RSU_SLP.xlsx / Resumen Precios / Vidrio',
      'Tabla_Maestra_Fuentes_CapituloSLP.docx / discrepancia vidrio $2.30 vs $1.30',
      'Recicladoras_por_Giro.xlsx / vidrio',
    ],
  },
  aluminio: {
    material: 'aluminio',
    label: 'Aluminio',
    min: 12,
    max: 30,
    median: 20,
    recommended: 15.1,
    sourceCount: 12,
    status: 'condicionado',
    verdict: 'Conservador frente a la mediana; existe discrepancia de unidad en una hoja anexa.',
    sourceSummary: 'Capitulo San Luis y hoja de aluminio; revisar unidad antes de usar valores extremos.',
    explanation: 'Mantiene ancla conservadora. La matriz marca revisión porque una referencia anexa parece tener error MXN/kg.',
    sourceRefs: [
      'Investigacion_Precios_RSU_SLP.xlsx / Resumen Precios / Aluminio',
      'Tabla_Maestra_Fuentes_CapituloSLP.docx / discrepancia unidad aluminio',
      'Recicladoras_por_Giro.xlsx / Aluminio',
    ],
  },
  organico: {
    material: 'organico',
    label: 'Orgánico / composta',
    min: 0.8,
    max: 2,
    median: 1,
    recommended: 1,
    sourceCount: 4,
    status: 'condicionado',
    verdict: 'Mercado local por confirmar; el simulador puede usar escenario conservador menor.',
    sourceSummary: 'Capitulo San Luis documenta composta a granel; falta contrato o comprador recurrente.',
    explanation: 'Si el valor se mantiene bajo, se interpreta como escenario conservador de aprovechamiento, no como precio de mercado certificado.',
    sourceRefs: [
      'Investigacion_Precios_RSU_SLP.xlsx / Resumen Precios / Orgánicos-Composta',
      'Tabla_Maestra_Fuentes_CapituloSLP.docx / composta',
    ],
  },
}

export function describeMaterialPriceReference(
  material: keyof PreciosMaterial,
  value: number,
): string {
  const research = MATERIAL_PRICE_RESEARCH[material]
  const tolerance = Math.max(0.35, research.recommended * 0.18)
  const nearRecommended = Math.abs(value - research.recommended) <= tolerance
  const rangeText = `$${research.min.toFixed(2)}-$${research.max.toFixed(2)}/kg`

  if (nearRecommended) {
    return `${research.sourceSummary}. ${research.verdict} Rango observado ${rangeText}. ${research.explanation}`
  }

  return `Precio manual del escenario. Referencia documental: ${research.sourceSummary}. Rango observado ${rangeText}. Documentar cotización local antes de presupuesto.`
}
