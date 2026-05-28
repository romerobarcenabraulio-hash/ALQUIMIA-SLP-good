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
  serieAnual: { ownerModuleId: 'escenarios_financieros', label: 'Serie anual financiera', alsoShownIn: ['roadmap_implementacion'] },
  ingresosBrutos: { ownerModuleId: 'escenarios_financieros', label: 'Ingresos brutos horizonte' },
  capexTotal: { ownerModuleId: 'costos_programa', label: 'CAPEX total', alsoShownIn: ['costo_omision'] },
  opexAnual: { ownerModuleId: 'costos_programa', label: 'OPEX anual' },
  ebitda: { ownerModuleId: 'escenarios_financieros', label: 'EBITDA' },
  margenEbitda: { ownerModuleId: 'escenarios_financieros', label: 'Margen EBITDA' },
  vpn: { ownerModuleId: 'escenarios_financieros', label: 'VPN' },
  tir: { ownerModuleId: 'escenarios_financieros', label: 'TIR' },
  tirEquity: { ownerModuleId: 'escenarios_financieros', label: 'TIR equity' },
  moic: { ownerModuleId: 'escenarios_financieros', label: 'MOIC' },
  paybackMeses: { ownerModuleId: 'escenarios_financieros', label: 'Payback meses' },
  paybackDescontado: { ownerModuleId: 'escenarios_financieros', label: 'Payback descontado' },
  ingresoCarbono: { ownerModuleId: 'city_baseline', label: 'Ingreso carbono', alsoShownIn: ['costo_omision'] },
  ingresoBiogas: { ownerModuleId: 'city_baseline', label: 'Potencial biogás (informativo CRE)' },
  ahorroDisposicion: { ownerModuleId: 'costo_omision', label: 'Ahorro disposición', alsoShownIn: ['escenarios_financieros'] },
  ingresosMunicipioOperativo: { ownerModuleId: 'esquema_concesion', label: 'Ingresos municipio operativos', alsoShownIn: ['costo_omision'] },
  ingresosMunicipioFiscal: { ownerModuleId: 'costo_omision', label: 'ISN + derechos municipales' },
  ingresosMunicipioTotal: { ownerModuleId: 'esquema_concesion', label: 'Ingresos municipio total', alsoShownIn: ['costo_omision'] },
  derramaIndustrialPorSector: { ownerModuleId: 'esquema_concesion', label: 'Derrama por sector industrial' },
  empleosPorSector: { ownerModuleId: 'organigrama', label: 'Empleos por sector', alsoShownIn: ['costo_omision'] },
  empleosDirectosCAs: { ownerModuleId: 'organigrama', label: 'Empleos directos CAs' },
  empleosDirectosRecic: { ownerModuleId: 'organigrama', label: 'Empleos recicladoras' },
  empleosTotalesDirectos: { ownerModuleId: 'costo_omision', label: 'Empleos directos totales' },
  empleosIndirectos: { ownerModuleId: 'costo_omision', label: 'Empleos indirectos' },
  pepenadoresFormalizados: { ownerModuleId: 'costo_omision', label: 'Pepenadores formalizados' },
  derramaSalarial: { ownerModuleId: 'costo_omision', label: 'Derrama salarial anual' },
  co2eEvitadasTon: { ownerModuleId: 'city_baseline', label: 'CO₂e evitadas horizonte' },
  co2eEvitadasAnualTon: { ownerModuleId: 'city_baseline', label: 'CO₂e evitadas anual' },
  co2eEvitadasHorizonteTon: { ownerModuleId: 'city_baseline', label: 'CO₂e evitadas horizonte (alias)' },
  pm25EvitadoTon: { ownerModuleId: 'city_baseline', label: 'PM2.5 evitado' },
  kwhBiogas: { ownerModuleId: 'city_baseline', label: 'kWh biogás potencial' },
  extensionRelleno: { ownerModuleId: 'city_baseline', label: 'Extensión vida relleno años' },
  casosIRAEvitados: { ownerModuleId: 'city_baseline', label: 'Casos IRA evitados', alsoShownIn: ['costo_omision'] },
  casosDengueEvitados: { ownerModuleId: 'city_baseline', label: 'Casos dengue evitados', alsoShownIn: ['costo_omision'] },
  avadEvitados: { ownerModuleId: 'city_baseline', label: 'AVAD evitados' },
  ahorroSalud: { ownerModuleId: 'costo_omision', label: 'Ahorro salud MXN/año', alsoShownIn: ['costo_omision'] },
  cadenaProveedores: { ownerModuleId: 'costo_omision', label: 'Cadena proveedores' },
  revenueFiscal: { ownerModuleId: 'costo_omision', label: 'Revenue fiscal (legacy)' },
  valorPropiedad: { ownerModuleId: 'costo_omision', label: 'Valor propiedad' },
  inversionPrivada: { ownerModuleId: 'costo_omision', label: 'Inversión privada inducida' },
  derremaTotal: { ownerModuleId: 'costo_omision', label: 'Derrama total' },
  scorePolitico: { ownerModuleId: 'social_diagnostico', label: 'Score político heurístico' },
  ratingESGDelta: { ownerModuleId: 'doble_materialidad', label: 'Rating ESG normalizado' },
  riskScores: { ownerModuleId: 'riesgos_modelo', label: 'Scores de riesgo' },
  monteCarloPercentiles: { ownerModuleId: 'escenarios_financieros', label: 'Percentiles Monte Carlo' },
  costoEducacionAnual: { ownerModuleId: 'logistica', label: 'Costo educación ciudadana anual' },
}

export function getOwnerModule(field: keyof ResultadosCalculados): string {
  return RESULTADOS_SURFACE_REGISTRY[field].ownerModuleId
}

export const ALL_RESULTADOS_KEYS = Object.keys(RESULTADOS_SURFACE_REGISTRY) as (keyof ResultadosCalculados)[]
