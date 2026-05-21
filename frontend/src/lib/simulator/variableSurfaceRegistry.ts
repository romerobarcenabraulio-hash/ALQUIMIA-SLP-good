/**
 * Registry: every ResultadosCalculados field → owning module_id.
 * Tests fail if calculator adds fields without updating this map.
 */

import type { ResultadosCalculados } from '@/types'

export type VariableSurfaceEntry = {
  ownerModuleId: string
  label: string
  alsoShownIn?: string[]
}

export const RESULTADOS_SURFACE_REGISTRY: Record<keyof ResultadosCalculados, VariableSurfaceEntry> = {
  pobActiva: { ownerModuleId: 'city_baseline', label: 'Población activa' },
  vivActivas: { ownerModuleId: 'city_baseline', label: 'Viviendas activas' },
  rsuTotalTonDia: { ownerModuleId: 'city_baseline', label: 'RSU total t/día' },
  rsuPorTipo: { ownerModuleId: 'city_baseline', label: 'RSU por tipo vivienda' },
  volCapturablePorMat: { ownerModuleId: 'infraestructura', label: 'Volumen capturable por material', alsoShownIn: ['city_baseline'] },
  camionesRequeridos: { ownerModuleId: 'logistica', label: 'Camiones requeridos por material' },
  ocupacionCAs: { ownerModuleId: 'infraestructura', label: 'Ocupación CAs %' },
  breakEvenCAP: { ownerModuleId: 'infraestructura', label: 'Break-even CA-P kg/día' },
  dscr: { ownerModuleId: 'escenarios_financieros', label: 'DSCR' },
  serieAnual: { ownerModuleId: 'escenarios_financieros', label: 'Serie anual financiera', alsoShownIn: ['plan_maestro'] },
  ingresosBrutos: { ownerModuleId: 'escenarios_financieros', label: 'Ingresos brutos horizonte' },
  capexTotal: { ownerModuleId: 'costos_programa', label: 'CAPEX total', alsoShownIn: ['evaluacion_socioeconomica'] },
  opexAnual: { ownerModuleId: 'costos_programa', label: 'OPEX anual' },
  ebitda: { ownerModuleId: 'escenarios_financieros', label: 'EBITDA' },
  margenEbitda: { ownerModuleId: 'escenarios_financieros', label: 'Margen EBITDA' },
  vpn: { ownerModuleId: 'escenarios_financieros', label: 'VPN' },
  tir: { ownerModuleId: 'escenarios_financieros', label: 'TIR' },
  tirEquity: { ownerModuleId: 'escenarios_financieros', label: 'TIR equity' },
  moic: { ownerModuleId: 'escenarios_financieros', label: 'MOIC' },
  paybackMeses: { ownerModuleId: 'escenarios_financieros', label: 'Payback meses' },
  paybackDescontado: { ownerModuleId: 'escenarios_financieros', label: 'Payback descontado' },
  ingresoCarbono: { ownerModuleId: 'impacto_ambiental', label: 'Ingreso carbono', alsoShownIn: ['costo_omision'] },
  ingresoBiogas: { ownerModuleId: 'impacto_ambiental', label: 'Potencial biogás (informativo CRE)' },
  ahorroDisposicion: { ownerModuleId: 'costo_omision', label: 'Ahorro disposición', alsoShownIn: ['escenarios_financieros'] },
  ingresosMunicipioOperativo: { ownerModuleId: 'esquema_concesion', label: 'Ingresos municipio operativos', alsoShownIn: ['evaluacion_socioeconomica'] },
  ingresosMunicipioFiscal: { ownerModuleId: 'evaluacion_socioeconomica', label: 'ISN + derechos municipales' },
  ingresosMunicipioTotal: { ownerModuleId: 'esquema_concesion', label: 'Ingresos municipio total', alsoShownIn: ['evaluacion_socioeconomica'] },
  derramaIndustrialPorSector: { ownerModuleId: 'esquema_concesion', label: 'Derrama por sector industrial' },
  empleosPorSector: { ownerModuleId: 'organigrama', label: 'Empleos por sector', alsoShownIn: ['evaluacion_socioeconomica'] },
  empleosDirectosCAs: { ownerModuleId: 'organigrama', label: 'Empleos directos CAs' },
  empleosDirectosRecic: { ownerModuleId: 'organigrama', label: 'Empleos recicladoras' },
  empleosTotalesDirectos: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Empleos directos totales' },
  empleosIndirectos: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Empleos indirectos' },
  pepenadoresFormalizados: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Pepenadores formalizados' },
  derramaSalarial: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Derrama salarial anual' },
  co2eEvitadasTon: { ownerModuleId: 'impacto_ambiental', label: 'CO₂e evitadas horizonte' },
  co2eEvitadasAnualTon: { ownerModuleId: 'impacto_ambiental', label: 'CO₂e evitadas anual' },
  co2eEvitadasHorizonteTon: { ownerModuleId: 'impacto_ambiental', label: 'CO₂e evitadas horizonte (alias)' },
  pm25EvitadoTon: { ownerModuleId: 'impacto_ambiental', label: 'PM2.5 evitado' },
  kwhBiogas: { ownerModuleId: 'impacto_ambiental', label: 'kWh biogás potencial' },
  extensionRelleno: { ownerModuleId: 'impacto_ambiental', label: 'Extensión vida relleno años' },
  casosIRAEvitados: { ownerModuleId: 'impacto_ambiental', label: 'Casos IRA evitados', alsoShownIn: ['evaluacion_socioeconomica'] },
  casosDengueEvitados: { ownerModuleId: 'impacto_ambiental', label: 'Casos dengue evitados', alsoShownIn: ['evaluacion_socioeconomica'] },
  avadEvitados: { ownerModuleId: 'impacto_ambiental', label: 'AVAD evitados' },
  ahorroSalud: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Ahorro salud MXN/año', alsoShownIn: ['costo_omision'] },
  cadenaProveedores: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Cadena proveedores' },
  revenueFiscal: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Revenue fiscal (legacy)' },
  valorPropiedad: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Valor propiedad' },
  inversionPrivada: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Inversión privada inducida' },
  derremaTotal: { ownerModuleId: 'evaluacion_socioeconomica', label: 'Derrama total' },
  scorePolitico: { ownerModuleId: 'mapeo_actores', label: 'Score político heurístico' },
  ratingESGDelta: { ownerModuleId: 'doble_materialidad', label: 'Rating ESG normalizado' },
  riskScores: { ownerModuleId: 'riesgos_modelo', label: 'Scores de riesgo' },
  monteCarloPercentiles: { ownerModuleId: 'escenarios_financieros', label: 'Percentiles Monte Carlo' },
  costoEducacionAnual: { ownerModuleId: 'plan_educativo', label: 'Costo educación ciudadana anual' },
}

export function getOwnerModule(field: keyof ResultadosCalculados): string {
  return RESULTADOS_SURFACE_REGISTRY[field].ownerModuleId
}

export const ALL_RESULTADOS_KEYS = Object.keys(RESULTADOS_SURFACE_REGISTRY) as (keyof ResultadosCalculados)[]
