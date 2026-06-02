export type ClientSegment = 'politica_publica' | 'empresarial'

export interface ServiceOption {
  id: string
  label: string
  description: string
}

export interface SegmentBlock {
  label: string
  description: string
  services: ServiceOption[]
}

export const ONBOARDING_SEGMENTS: Record<ClientSegment, SegmentBlock> = {
  politica_publica: {
    label: 'Política pública',
    description: 'Gobierno municipal, estatal o dependencias de la administración pública.',
    services: [
      { id: 'reforma_rsu', label: 'Reforma integral RSU', description: 'Diagnóstico, reglamento y hoja de ruta municipal.' },
      { id: 'dictamen_tecnico', label: 'Dictamen técnico', description: 'Evidencia normativa y técnica para decisiones de gabinete.' },
      { id: 'simulador_economico', label: 'Escenarios financieros', description: 'Modelado de costos, ingresos y sensibilidad fiscal con supuestos trazables.' },
      { id: 'capacitacion_institucional', label: 'Capacitación institucional', description: 'Formación para equipos operativos y mandos medios.' },
      { id: 'consultoria_regulatoria', label: 'Consultoría regulatoria', description: 'Alineación normativa federal, estatal y municipal.' },
    ],
  },
  empresarial: {
    label: 'Sector empresarial',
    description: 'Empresas, cámaras, operadores privados y consultores corporativos.',
    services: [
      { id: 'consultoria_esg', label: 'Consultoría ESG', description: 'Cumplimiento ambiental y reportes de sostenibilidad.' },
      { id: 'cadena_valor_residuos', label: 'Cadena de valor de residuos', description: 'Reciclaje, logística inversa y economía circular.' },
      { id: 'due_diligence_ambiental', label: 'Due diligence ambiental', description: 'Evaluación de riesgos regulatorios y operativos.' },
      { id: 'capacitacion_corporativa', label: 'Capacitación corporativa', description: 'Programas para equipos comerciales y de operaciones.' },
      { id: 'analisis_viabilidad', label: 'Análisis de viabilidad', description: 'Business case para inversiones en gestión de residuos.' },
    ],
  },
}

const REGLAMENTO_SERVICES = new Set([
  'reforma_rsu',
  'dictamen_tecnico',
  'simulador_economico',
  'consultoria_regulatoria',
])

export function serviceRequiresReglamento(segment: ClientSegment, serviceId: string): boolean {
  if (segment !== 'politica_publica') return false
  return REGLAMENTO_SERVICES.has(serviceId)
}
