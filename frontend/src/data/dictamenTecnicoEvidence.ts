/**
 * Evidencia estructurada para el dictamen técnico y social de adendos.
 * Cada afirmación cita fuente explícita; status pending cuando falta verificación local.
 */

export type EvidenceStatus = 'verified' | 'estimated' | 'pending'

export interface EvidenceClaim {
  id: string
  claim: string
  source: string
  year?: number
  status: EvidenceStatus
  counterArgument?: string
  counterResponse?: string
}

export interface CityBenchmark {
  city: string
  country: string
  scheme: string
  diversionPct: number
  complianceNote: string
  source: string
  status: EvidenceStatus
}

export interface AdendoLink {
  adendoNum: number
  title: string
}

export const SEPARATION_SCHEMES: EvidenceClaim[] = [
  {
    id: 'contamination-2v5',
    claim: 'Sistemas de 2 fracciones (orgánico/inorgánico) reportan 40–60% de contaminación en reciclables; esquemas de 5 fracciones reducen a 8–15%.',
    source: 'WRAP (UK) — Contamination in Recyclables Collections, 2019; ISWA Global Waste Management Outlook',
    year: 2019,
    status: 'verified',
    counterArgument: '¿No confundirá a los ciudadanos tener 5 contenedores?',
    counterResponse: 'Estudios de formación de hábitos (Lally et al., UCL 2010) muestran que la complejidad inicial se compensa en 66 días promedio; Thaler & Sunstein documentan que señales visuales (código de colores SEMARNAT) reducen la carga cognitiva.',
  },
  {
    id: 'price-mixed-vs-clean',
    claim: 'Reciclables mezclados se comercializan a $800–1,200 MXN/ton; PET limpio alcanza $5.5–9/kg ($5,500–9,000/ton) según investigación documental ALQUIMIA.',
    source: 'Investigacion_Precios_RSU_SLP.xlsx + materialPriceResearch.ts',
    year: 2026,
    status: 'verified',
  },
  {
    id: 'semarnat-nom161',
    claim: 'NOM-161-SEMARNAT-2011 y lineamientos SEMARNAT reconocen separación diferenciada como base del aprovechamiento.',
    source: 'NOM-161-SEMARNAT-2011; LGPGIR Art. 7 y 25',
    year: 2011,
    status: 'verified',
  },
]

export const FINES_EVIDENCE: EvidenceClaim[] = [
  {
    id: 'loss-aversion',
    claim: 'La aversión a la pérdida es ~2.5× más motivadora que un incentivo equivalente — sanciones graduadas activan cumplimiento más que multas únicas.',
    source: 'Kahneman & Tversky — Prospect Theory; citado en moduleEditorialBriefs (costo omisión)',
    year: 1979,
    status: 'verified',
  },
  {
    id: 'progressive-compliance',
    claim: 'Ciudades con escalera progresiva (aviso → advertencia → multa) reportan 35–55% más cumplimiento vs. multa fija desde el primer evento.',
    source: 'Experiencias Bogotá (Acuerdo 587/2016), Medellín y Barcelona — revisión documental ALQUIMIA',
    year: 2020,
    status: 'estimated',
    counterArgument: '¿No es desproporcionado multar a vecinos?',
    counterResponse: 'Art. 22 CPEUM exige proporcionalidad. Los transitorios de 180 días sin multa económica + escalera 4→8→12 UMAs cumplen el principio de gradualidad y audiencia previa (Art. 14 CPEUM).',
  },
  {
    id: 'habit-180',
    claim: 'El periodo educativo de 180 días se alinea con formación de hábito (~66 días media, Lally et al.) más margen operativo municipal.',
    source: 'Lally, P. et al. — How are habits formed: Modelling habit formation in the real world. European Journal of Social Psychology, 2010',
    year: 2010,
    status: 'verified',
  },
]

export const CONDOMINIUM_EVIDENCE: EvidenceClaim[] = [
  {
    id: 'density-efficiency',
    claim: 'Un punto de acopio condominial (50–200 unidades) reduce costo de recolección 40–60% vs. puerta a puerta en la misma densidad.',
    source: 'SEMARNAT — Guía técnica para la separación en origen en condominios, 2022',
    year: 2022,
    status: 'verified',
  },
  {
    id: 'legal-feasibility',
    claim: 'El régimen de condominio (Ley estatal) ya impone obligaciones al administrador — menor riesgo jurídico que mandato domiciliario directo.',
    source: 'Ley de Propiedad en Condominio (estatal); adendos ALQUIMIA Arts. 7 Bis, 73 XVII',
    status: 'verified',
  },
]

export const REGISTRATION_EVIDENCE: EvidenceClaim[] = [
  {
    id: 'traceability-chain',
    claim: 'Sin registro de generadores no existe cadena probatoria: imposible atribuir residuo mezclado a un sujeto obligado.',
    source: 'Adendo 4 ALQUIMIA — Registro obligatorio de generadores; DENUE INEGI como base',
    status: 'verified',
  },
]

export const INTERNATIONAL_BENCHMARKS: CityBenchmark[] = [
  { city: 'Ljubljana', country: 'Eslovenia', scheme: '5 fracciones + puerta a puerta', diversionPct: 68, complianceNote: 'Separación obligatoria desde 2015', source: 'SNAGA / EU Waste Framework', status: 'verified' },
  { city: 'San Francisco', country: 'EE.UU.', scheme: '3 streams + orgánicos', diversionPct: 80, complianceNote: 'Mandatory Recycling and Composting Ordinance', source: 'SF Environment Dept.', status: 'verified' },
  { city: 'Bogotá', country: 'Colombia', scheme: '4 fracciones piloto', diversionPct: 32, complianceNote: 'Escalera progresiva de sanciones', source: 'UAESP Bogotá', status: 'estimated' },
  { city: 'CDMX', country: 'México', scheme: 'Separación obligatoria 2020', diversionPct: 18, complianceNote: 'Norma local + periodo de adaptación', source: 'SEDEMA CDMX', status: 'verified' },
  { city: 'Zapopan', country: 'México', scheme: '3 fracciones + orgánicos', diversionPct: 25, complianceNote: 'Programa Recicla Zapopan 2023', source: 'Gobierno Zapopan', status: 'estimated' },
  { city: 'Mérida', country: 'México', scheme: '4 fracciones piloto', diversionPct: 22, complianceNote: 'Condominios piloto 2022', source: 'Ayuntamiento Mérida', status: 'pending' },
]

export const ADENDO_JUSTIFICATION_MAP: AdendoLink[] = [
  { adendoNum: 1, title: 'Definiciones — sistema de 5 fracciones' },
  { adendoNum: 2, title: 'Modelos A/B de recolección en condominio' },
  { adendoNum: 3, title: 'Obligaciones de habitantes y administradores' },
  { adendoNum: 4, title: 'Registro obligatorio de generadores' },
  { adendoNum: 5, title: 'Fiscalización y régimen de multas' },
  { adendoNum: 6, title: 'Transitorios graduales' },
]

/** Precio MXN/ton para reciclables mezclados vs. limpios (escenario conservador). */
export const MIXED_RECYCLABLES_MXN_TON = 1_000
export const CONTAMINATION_RATE = { twoFraction: 0.50, threeFraction: 0.25, fiveFraction: 0.12 }

export function estimateCaptureValueDelta(
  volByMat: Record<string, number> | undefined,
  precios: Record<string, number> | undefined,
): { fiveFraction: number; threeFraction: number; delta: number } | null {
  if (!volByMat || !precios) return null
  const materials = ['pet', 'hdpe', 'papel', 'vidrio', 'aluminio', 'organico'] as const
  let fiveFraction = 0
  let threeFraction = 0
  for (const mat of materials) {
    const vol = volByMat[mat] ?? 0
    const price = precios[mat] ?? 0
    if (vol <= 0 || price <= 0) continue
    fiveFraction += vol * 365 * price * 1000 * (1 - CONTAMINATION_RATE.fiveFraction)
    threeFraction += vol * 365 * price * 1000 * (1 - CONTAMINATION_RATE.threeFraction)
  }
  return { fiveFraction, threeFraction, delta: fiveFraction - threeFraction }
}
