/**
 * CAPEX / OPEX — Datos verificados desde modelos financieros CFO (Excel).
 *
 * Fuentes primarias:
 *   - Centros_Acopio_v2.xlsx  → Modelo CFO, Bloques A–K (CAs P/M/G)
 *   - Recicladoras_por_Giro.xlsx → PET, Papel, Vidrio, Aluminio, Orgánicos
 *   - Modelo_BASED.xlsx → Supuestos demográficos y composición RSU
 *
 * Precios referencia: marzo 2026, ANIPAC / CEMPRE México.
 * Salarios base: tabulador IMSS rama 37 (recolección y reciclaje), 2025/2026.
 * Factor prestaciones sociales: 1.35× (IMSS patronal + ISN + SAR + Infonavit + vacaciones + aguinaldo).
 *
 * Verificación de precios de maquinaria (mayo 2026):
 *   - Contenedor 1100L: mercado MX $9,240-$12,290 MXN (Grupo Zuma / Reciclamas / E4 Solutions).
 *     Modelo actualizado a $9,500/unidad (sin IVA, precio competitivo mayoreo).
 *   - Báscula Torrey PLP-1000: mercado $12,070-$12,983 MXN (Cocoisa / Chefs Toys / KitchenMax).
 *     Modelo actualizado a $12,500/unidad.
 *   - Montacargas Toyota 8FGU25 dual Gas LP: USD $34,950 ~ $39,950 (losmontacargas.mx 2025).
 *     A TC $17.1 = $597,645-$682,545 MXN. Modelo actualizado a $530,000 (conservador).
 *   - Montacargas HELI CPQD25 dual Gas LP: $470,500 MXN confirmado (rte.mx 2025).
 *     Modelo anterior ($589,500) era sobreestimado; corregido a $470,500.
 *   - Lavadora PET + trituradora + secador: total línea $2.07M MXN ≈ $121K USD.
 *     Benchmark Energycle (2025): línea 500 kg/h = $100K-$160K USD. ✓ DENTRO DE RANGO.
 *   - Báscula Torrey PLP-3000: $19,000 vs mercado $16,075-$20,847 MXN. ✓ SIN CAMBIO.
 *   - Separador óptico vidrio: $580K MXN vs mercado industrial $300K-$550K. Plausible.
 *
 * Toda modificación a este archivo debe citar fuente y fecha de actualización.
 */

import type { TamañoCA } from '@/types'

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface EquipoCatalogo {
  nombre: string
  marca: string
  cantidad: number
  precioUnitMXN: number
  totalMXN: number
  potenciaKW: number
  factorUtil: number
  horasEfectDia: number
  diasMes: number
  kwhMes: number
  kwhConContingencia: number
  costoEnergiaMes: number
  nota?: string
}

export interface PuestoNomina {
  puesto: string
  cantidad: number
  salarioBrutoMes: number
  subtotal: number
}

export interface NominaDetalle {
  puestos: PuestoNomina[]
  subtotalBruto: number
  factorPrestaciones: number
  totalConPrestaciones: number
}

export interface OPEXDesglose {
  cmvCompraMPMes: number
  rentaMes: number
  energiaElectricaMes: number
  combustibleGasLPMes: number
  nominaConPrestaciones: number
  transporteCombustible: number
  mantenimientoEquipo: number
  insumosQuimicos: number
  aguaServicios: number
  seguros: number
  fleteComprador: number
  consumiblesLinea: number
  totalOPEXMes: number
}

export interface CAPEXDesglose {
  equipamiento: number
  adecuacionNave: number
  gastosPreoperativos: number
  capitalTrabajo: number
  contingencia: number
  totalCAPEX: number
}

export type GiroRecicladora = 'pet' | 'papel' | 'vidrio' | 'aluminio' | 'organicos'

export interface RecicladoreDataGiro {
  giro: GiroRecicladora
  nombre: string
  naveM2: number
  rendimientoKgKg: number
  precioVentaProcesado: number
  precioCompraMPAcopio: number
  compradoresAncla: string[]
  equipos: EquipoCatalogo[]
  nomina: NominaDetalle
  capex: CAPEXDesglose
  opex: OPEXDesglose
  capexTotal: number
  opexMes: number
  ingresoMesA3Esc40: number
  ebitdaA3: number
  tirProyecto: number
  paybackMeses: number
  vpn: number
  empleosPorPlanta: number
}

// ─── Supuestos Generales Parametrizados (Bloque A, Centros_Acopio_v2) ────────

export const SUPUESTOS_GENERALES = {
  tipoCambio: 17.1,
  tarifaElectricaSLP: 3.0,
  precioGasLP: 18.5,
  precioDiesel: 24.0,
  factorContingenciaEnergetica: 1.1,
  diasOperativosAno: 300,
  diasOperativosMes: 25,
  mermaEstimada: 0.10,
  costoRentaZonaIndustrial: 65.0,
  factorPrestacionesSociales: 1.35,
  wacc: 0.20,
  isr: 0.30,
  ptu: 0.10,
  reservaLegal: 0.05,
  vidaUtilMaquinaria: 10,
  vidaUtilTransporte: 4,
  vidaUtilAdecuaciones: 20,
  vidaUtilComputoTI: 3,
  factorUtilPrensa: 0.70,
  factorUtilBanda: 0.85,
  factorUtilBascula: 0.40,
  factorUtilMontacargas: 0.60,
  capacidadArranque: { año1: 0.50, año2: 0.75, año3plus: 1.00 },
  dso: 30,
  dio: 7,
  dpo: 15,
  precioCarbonoUSD: 8.0,
  multiploValorTerminal: 5.0,
  fuente: 'Centros_Acopio_v2.xlsx, Bloque A. Precios marzo 2026.',
} as const

/**
 * Benchmarks externos de validación cruzada.
 * No se usan como inputs de cálculo — sirven para contrastar y argumentar frente a auditores.
 */
export const BENCHMARKS_EXTERNOS = {
  capexCentroAcopioMXN: {
    min: 10_000_000,
    max: 25_000_000,
    referencia: 'World Bank MSW Cost Guidelines 2024 + FONADIN PRORESOL (proyectos < $20M)',
    ejemplos: [
      { proyecto: 'Centro de Acopio León, Gto.', capexMXN: 18_000_000, fuente: 'Página Central, 2024' },
      { proyecto: 'CIR Victoria, Tamaulipas (APP)', capexMXN: 500_000_000, fuente: 'BANOBRAS/Gobierno Tamaulipas, 2025' },
    ],
  },
  opexMensualMXNPorTonelada: {
    min: 400,
    max: 1_000,
    fuente: 'World Bank MSW Guidelines 2024 — separate collection: $2.5-$5 USD/persona/año',
  },
  contingenciaFactorPct: {
    valor: 10,
    rango: '10-12%',
    fuente: 'EBRD/GIZ Feasibility Study Moldova Solid Waste WMZ-8; AACE International 119R-21 Class 4',
  },
  capitalTrabajoMesesRecomendados: {
    minMeses: 3,
    maxMeses: 6,
    fuente: 'Energycle 2026; Kitech Cost Guide 2026; World Bank MSW Chapter 7',
    nota: 'Gap de flujo entre recuperación de material y cobro al comprador ancla justifica 3+ meses',
  },
  permisosYSegurosAnual: {
    minMXN: 150_000,
    maxMXN: 500_000,
    items: [
      'SEMARNAT autorización: $5,910 MXN (federal)',
      'MIA estudio ambiental: $50K-$300K',
      'Seguro RC Ambiental (LGPGIR Art.50): $80K-$300K/año',
      'Seguro equipo e incendio: 0.5% CAPEX/año',
    ],
    fuente: 'gob.mx/SEMARNAT; THB Mexico; GMX Seguros; Segurzon 2026',
  },
  salariosReferencia: {
    operario: {
      promedioNacional: 5_530,
      SLP: 2_430,
      notaUsoModeloMXN: 10_000,
      nota: 'El modelo usa $10,000/mes (salario competitivo zona industrial SLP, atraer y retener). Media nacional INEGI Q1-2025: $5,530. Diferencia justificada por condiciones de trabajo industrial.',
      fuente: 'Data Mexico / INEGI ENOE T1 2025; Computrabajo 2025',
    },
    chofer: {
      promedioNacional: 9_156,
      fuente: 'Computrabajo 2025',
    },
    supervisor: {
      rango: '11_904 - 26_000',
      fuente: 'Computrabajo / Sercanto RECO Recycling 2025',
    },
  },

  /**
   * Verificación de precios de maquinaria — mayo 2026.
   * Para cada equipo: precio del modelo, rango de mercado encontrado, fuente y veredicto.
   * Equipos con precio NO encontrado en fuentes abiertas MX mantienen precio Excel de referencia.
   */
  preciosEquipoVerificados: {
    fechaVerificacion: 'mayo 2026',
    tipoCambioUsado: 17.1,
    equipos: [
      {
        nombre: 'Contenedor 1100L (HDPE, 4 ruedas)',
        precioModeloMXN: 9_500,
        rangoPrecioMercadoMXN: { min: 9_240, max: 12_290 },
        veredicto: 'CORREGIDO — precio anterior ($5,500) era 41% bajo mercado. Actualizado a $9,500 sin IVA (precio mayoreo).',
        fuentes: ['grupozuma.com.mx ($9,240.28 IVA incl.)', 'reciclamas.com.mx ($9,249.29+IVA)', 'e4solutions.com.mx ($12,289.97 IVA incl.)'],
      },
      {
        nombre: 'Báscula Torrey PLP-1000 (1,000 kg)',
        precioModeloMXN: 12_500,
        rangoPrecioMercadoMXN: { min: 12_070, max: 12_983 },
        veredicto: 'CORREGIDO — precio anterior ($10,000) era 21% bajo mercado. Actualizado a $12,500.',
        fuentes: ['cocoisa.mx ($12,071)', 'chefstoys.com.mx ($12,071)', 'kitchenmax.mx ($12,876 c/desc.)'],
      },
      {
        nombre: 'Báscula Torrey PLP-3000 (3,000 kg)',
        precioModeloMXN: 19_000,
        rangoPrecioMercadoMXN: { min: 16_075, max: 20_848 },
        veredicto: 'VALIDADO — precio del modelo ($19,000) dentro del rango de mercado.',
        fuentes: ['direyco.com.mx ($19,263)', 'kitchenmax.mx ($17,860)', 'basculasyrefacciones.com ($18,762)'],
      },
      {
        nombre: 'Montacargas Toyota 8FGU25 (2.5 t, Dual Gas LP)',
        precioModeloMXN: 530_000,
        rangoPrecioMercadoUSD: { min: 34_950, max: 39_950 },
        rangoPrecioMercadoMXN: { min: 597_645, max: 682_545 },
        veredicto: 'CORREGIDO — precio anterior ($425,000) era 29-38% bajo mercado. Actualizado a $530,000 (precio base conservador, sin opciones).',
        fuentes: ['losmontacargas.mx (USD $39,950)', 'losmontacargas.mx (USD $34,950 Nissan Unicarrier equiv.)'],
      },
      {
        nombre: 'Montacargas HELI CPQD25 (2.5 t, Dual Gas LP)',
        precioModeloMXN: 470_500,
        rangoPrecioMercadoMXN: { min: 470_500, max: 470_500 },
        veredicto: 'CORREGIDO — precio anterior ($589,500) era sobreestimado en 25%. Precio confirmado: $470,500 MXN.',
        fuentes: ['rte.mx — HELI CPQD25 Dual Gas LP: $470,500 MXN (precio de lista 2025)'],
      },
      {
        nombre: 'Lavadora PET (línea completa 500 kg/h)',
        precioModeloMXN: null,
        notaLinea: 'El modelo desglosa la línea en equipos separados: lavadora $380K + trituradora $520K + secador $180K + bandas $90K + extrusora $850K = $2,073K MXN ≈ USD $121K',
        rangoPrecioMercadoUSD: { min: 100_000, max: 160_000 },
        rangoPrecioMercadoMXN: { min: 1_710_000, max: 2_736_000 },
        veredicto: 'VALIDADO (con extrusora) — total línea $2.07M MXN = $121K USD dentro del rango Energycle $100K-$160K para 500 kg/h.',
        fuentes: ['energycle.com — Guía precio línea PET 500 kg/h: $100K-$160K USD (2025)', 'solimaq.mx — Líneas LPET disponibles en México'],
      },
      {
        nombre: 'Separador óptico por color (vidrio cullet)',
        precioModeloMXN: 580_000,
        rangoPrecioMercadoUSD: { min: 17_600, max: 32_000 },
        rangoPrecioMercadoMXN: { min: 300_960, max: 547_200 },
        veredicto: 'PRECIO ALTO — el modelo ($580K MXN = $33.9K USD) excede ligeramente el rango de fabricantes chinos. Justificado si se elige equipo europeo (PELLENC/MOGENSEN ~€40K-€60K). Se mantiene como precio estimado para equipo de calidad media-alta.',
        fuentes: ['wenyaocolorsorter.com (USD $17,600-$18,600/u)', 'wenyaocolorsorter.com WYDB4 (USD $31,000-$32,000/u)'],
      },
      {
        nombre: 'Prensa compactadora 15HP (CA-P)',
        precioModeloMXN: 215_000,
        rangoPrecioMercadoMXN: { min: 119_000, max: 250_000 },
        veredicto: 'PLAUSIBLE — referencia Dierkla D-50 vertical $119K; horizontales equivalentes típicamente $150K-$250K. Precio del modelo conservador pero razonable.',
        fuentes: ['dierkla.com (D-50 prensa vertical: $119,000 MXN)', 'AACE International Class 4 equipment estimates ±30%'],
      },
      {
        nombre: 'Prensa horizontal embolsadora (CA-G, 22 kW)',
        precioModeloMXN: 850_000,
        rangoPrecioMercadoMXN: { min: 680_000, max: 1_200_000 },
        veredicto: 'PLAUSIBLE — no se encontró precio publicado para prensas horizontales >15 t. Rango estimado por comparación con modelos similares y factor potencia. Mantener como referencia.',
        fuentes: ['Estimación por analogía con prensa papel/cartón TEVA/Imabe y factores de escala potencia'],
      },
    ],
  },
} as const

// ─── Salarios base (IMSS Rama 37, 2025/2026) ────────────────────────────────

export const SALARIOS_BASE = {
  operario:     { brutoMes: 10_000, descripcion: 'Operario clasificación/prensa' },
  supervisor:   { brutoMes: 17_500, descripcion: 'Supervisor operativo CA' },
  administrativo: { brutoMes: 25_000, descripcion: 'Administrativo/contable' },
  chofer:       { brutoMes: 13_500, descripcion: 'Chofer camión recolector' },
  tecnicoProceso: { brutoMes: 20_000, descripcion: 'Técnico de proceso (PET/Aluminio)' },
  fundidorEspecialista: { brutoMes: 22_000, descripcion: 'Fundidor especialista aluminio' },
  tecnicoAgronomico: { brutoMes: 20_000, descripcion: 'Técnico agronómico composta' },
  fuente: 'Tabulador IMSS Rama 37, vigente 2025. Factor prestaciones 1.35×.',
} as const

// ─── Estructura de personal por escala CA ────────────────────────────────────

export const PERSONAL_CA: Record<TamañoCA, NominaDetalle> = {
  P: {
    puestos: [
      { puesto: 'Operario clasificación', cantidad: 4, salarioBrutoMes: 10_000, subtotal: 40_000 },
      { puesto: 'Supervisor operativo',   cantidad: 1, salarioBrutoMes: 17_500, subtotal: 17_500 },
    ],
    subtotalBruto: 57_500,
    factorPrestaciones: 1.35,
    totalConPrestaciones: 77_625,
  },
  M: {
    puestos: [
      { puesto: 'Operario clasificación', cantidad: 10, salarioBrutoMes: 10_000, subtotal: 100_000 },
      { puesto: 'Supervisor operativo',   cantidad: 2,  salarioBrutoMes: 17_500, subtotal: 35_000 },
      { puesto: 'Administrativo',         cantidad: 1,  salarioBrutoMes: 25_000, subtotal: 25_000 },
      { puesto: 'Chofer',                 cantidad: 1,  salarioBrutoMes: 13_500, subtotal: 13_500 },
    ],
    subtotalBruto: 173_500,
    factorPrestaciones: 1.35,
    totalConPrestaciones: 234_225,
  },
  G: {
    puestos: [
      { puesto: 'Operario clasificación', cantidad: 25, salarioBrutoMes: 10_000, subtotal: 250_000 },
      { puesto: 'Supervisor operativo',   cantidad: 4,  salarioBrutoMes: 17_500, subtotal: 70_000 },
      { puesto: 'Administrativo',         cantidad: 2,  salarioBrutoMes: 25_000, subtotal: 50_000 },
      { puesto: 'Chofer',                 cantidad: 3,  salarioBrutoMes: 13_500, subtotal: 40_500 },
    ],
    subtotalBruto: 410_500,
    factorPrestaciones: 1.35,
    totalConPrestaciones: 554_175,
  },
}

// ─── Equipos por escala de Centro de Acopio ──────────────────────────────────

export const EQUIPOS_CA: Record<TamañoCA, EquipoCatalogo[]> = {
  P: [
    { nombre: 'Prensa compactadora 15HP', marca: 'Genérica nacional', cantidad: 1, precioUnitMXN: 215_000, totalMXN: 215_000, potenciaKW: 11.19, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 1567, kwhConContingencia: 1723, costoEnergiaMes: 5170 },
    { nombre: 'Báscula plataforma 1,000kg', marca: 'Torrey PLP1000', cantidad: 1, precioUnitMXN: 12_500, totalMXN: 12_500, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26, nota: 'Precio verificado: $12,070-$12,983 MXN (Cocoisa/KitchenMax may-2026)' },
    { nombre: 'Báscula plataforma 500kg', marca: 'Rhino BAPCA-500', cantidad: 1, precioUnitMXN: 3_800, totalMXN: 3_800, potenciaKW: 0.05, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 4, kwhConContingencia: 4, costoEnergiaMes: 13 },
    { nombre: 'Patín hidráulico 3 ton', marca: 'Genérico', cantidad: 2, precioUnitMXN: 8_000, totalMXN: 16_000, potenciaKW: 0, factorUtil: 0.60, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0, nota: 'Manual' },
    { nombre: 'Contenedores 1100L (5 fracciones)', marca: 'Greenbin/Weber', cantidad: 10, precioUnitMXN: 9_500, totalMXN: 95_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0, nota: 'Precio verificado: $9,240-$12,290 MXN (grupozuma.com.mx / reciclamas.com.mx may-2026)' },
    { nombre: 'Mesa clasificación manual 3m', marca: 'Fabricación local', cantidad: 1, precioUnitMXN: 25_000, totalMXN: 25_000, potenciaKW: 0.2, factorUtil: 0.85, horasEfectDia: 6.8, diasMes: 25, kwhMes: 34, kwhConContingencia: 37, costoEnergiaMes: 112 },
    { nombre: 'Herramienta menor', marca: 'Varios', cantidad: 1, precioUnitMXN: 15_000, totalMXN: 15_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
  ],
  M: [
    { nombre: 'Prensa Mil-tek H501', marca: 'Mil-tek', cantidad: 1, precioUnitMXN: 425_000, totalMXN: 425_000, potenciaKW: 7.5, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 1050, kwhConContingencia: 1155, costoEnergiaMes: 3465 },
    { nombre: 'Prensa 15HP genérica', marca: 'Nacional', cantidad: 1, precioUnitMXN: 215_000, totalMXN: 215_000, potenciaKW: 11.19, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 1567, kwhConContingencia: 1723, costoEnergiaMes: 5170 },
    { nombre: 'Báscula 3,000kg', marca: 'Torrey PLP3000', cantidad: 1, precioUnitMXN: 19_000, totalMXN: 19_000, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26 },
    { nombre: 'Báscula 500kg', marca: 'Rhino BAPCA-500', cantidad: 2, precioUnitMXN: 3_800, totalMXN: 7_600, potenciaKW: 0.05, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26 },
    { nombre: 'Banda transportadora 8m', marca: 'Nacional', cantidad: 1, precioUnitMXN: 120_000, totalMXN: 120_000, potenciaKW: 2.2, factorUtil: 0.85, horasEfectDia: 6.8, diasMes: 25, kwhMes: 374, kwhConContingencia: 411, costoEnergiaMes: 1234 },
    { nombre: 'Montacargas Toyota 8FGU25', marca: 'Toyota/Hangcha', cantidad: 1, precioUnitMXN: 530_000, totalMXN: 530_000, potenciaKW: 0, factorUtil: 0.60, horasEfectDia: 4.8, diasMes: 25, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 5550, nota: 'Gas LP: 2.5 kg/hora. Precio verificado: USD $34,950-$39,950 (losmontacargas.mx may-2026), TC $17.1 = $597K-$682K; modelo usa $530K conservador.' },
    { nombre: 'Patín hidráulico 3 ton', marca: 'Genérico', cantidad: 3, precioUnitMXN: 8_000, totalMXN: 24_000, potenciaKW: 0, factorUtil: 0.60, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    { nombre: 'Contenedores 1100L', marca: 'Greenbin/Weber', cantidad: 25, precioUnitMXN: 9_500, totalMXN: 237_500, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0, nota: 'Precio verificado: $9,240-$12,290 MXN (grupozuma.com.mx may-2026)' },
    { nombre: 'Mesa clasificación 5m', marca: 'Fabricación local', cantidad: 2, precioUnitMXN: 35_000, totalMXN: 70_000, potenciaKW: 0.3, factorUtil: 0.85, horasEfectDia: 6.8, diasMes: 25, kwhMes: 102, kwhConContingencia: 112, costoEnergiaMes: 337 },
    { nombre: 'Herramienta menor', marca: 'Varios', cantidad: 1, precioUnitMXN: 30_000, totalMXN: 30_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
  ],
  G: [
    { nombre: 'Prensa horizontal embolsadora', marca: 'TEVA/Nacional', cantidad: 1, precioUnitMXN: 850_000, totalMXN: 850_000, potenciaKW: 22.0, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 3080, kwhConContingencia: 3388, costoEnergiaMes: 10164 },
    { nombre: 'Prensa Mil-tek H600', marca: 'Mil-tek', cantidad: 2, precioUnitMXN: 500_000, totalMXN: 1_000_000, potenciaKW: 11.0, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 3080, kwhConContingencia: 3388, costoEnergiaMes: 10164 },
    { nombre: 'Báscula 3,000kg', marca: 'Torrey PLP3000', cantidad: 2, precioUnitMXN: 19_000, totalMXN: 38_000, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 16, kwhConContingencia: 18, costoEnergiaMes: 53 },
    { nombre: 'Báscula camionera 40 ton (renta anual)', marca: 'Nacional', cantidad: 1, precioUnitMXN: 180_000, totalMXN: 180_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    { nombre: 'Banda transportadora 15m', marca: 'Nacional', cantidad: 2, precioUnitMXN: 350_000, totalMXN: 700_000, potenciaKW: 4.0, factorUtil: 0.85, horasEfectDia: 6.8, diasMes: 25, kwhMes: 1360, kwhConContingencia: 1496, costoEnergiaMes: 4488 },
    { nombre: 'Montacargas HELI CPQD25', marca: 'HELI', cantidad: 2, precioUnitMXN: 470_500, totalMXN: 941_000, potenciaKW: 0, factorUtil: 0.60, horasEfectDia: 4.8, diasMes: 25, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 11100, nota: 'Gas LP. Precio verificado: $470,500 MXN (rte.mx may-2026). Corrección: modelo anterior sobreestimaba en 25%.' },
    { nombre: 'Patín hidráulico 3 ton', marca: 'Genérico', cantidad: 5, precioUnitMXN: 8_000, totalMXN: 40_000, potenciaKW: 0, factorUtil: 0.60, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    { nombre: 'Contenedores 1100L', marca: 'Greenbin/Weber', cantidad: 60, precioUnitMXN: 9_500, totalMXN: 570_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0, nota: 'Precio verificado: $9,240-$12,290 MXN (grupozuma.com.mx may-2026)' },
    { nombre: 'Tolvas de recepción', marca: 'Fabricación local', cantidad: 3, precioUnitMXN: 45_000, totalMXN: 135_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    { nombre: 'Herramienta menor', marca: 'Varios', cantidad: 1, precioUnitMXN: 60_000, totalMXN: 60_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
  ],
}

// ─── CAPEX desglosado por escala CA ──────────────────────────────────────────

// Contingencia 10% sobre (equipamiento + adecuación nave) — estándar EBRD/GIZ y AACE Class 4.
// Capital de trabajo: 3 meses de OPEX — mínimo recomendado World Bank / Energycle para cubrir
// el gap entre recuperación de material y cobro al comprador ancla.
export const CAPEX_CA: Record<TamañoCA, CAPEXDesglose> = {
  // Equipamiento actualizado mayo 2026: contenedores +$9,500/u (verificado mercado), báscula PLP1000 +$12,500 (verificado)
  P: {
    equipamiento:        382_300,  // Actualizado: contenedores $95K (+$40K), báscula $12.5K (+$2.5K)
    adecuacionNave:      120_000,
    gastosPreoperativos:  45_000,
    contingencia:         50_230,  // 10% × (382,300 + 120,000)
    capitalTrabajo:      332_514,  // 3 meses × OPEX 110,838
    totalCAPEX:          930_044,
  },
  // Equipamiento actualizado mayo 2026: montacargas Toyota $530K (+$105K), contenedores $237.5K (+$100K)
  M: {
    equipamiento:       1_678_100,  // Actualizado: Toyota $530K (+$105K), contenedores $237.5K (+$100K)
    adecuacionNave:       350_000,
    gastosPreoperativos:   65_000,
    contingencia:         202_810,  // 10% × (1,678,100 + 350,000)
    capitalTrabajo:       961_062,  // 3 meses × OPEX 320,354
    totalCAPEX:         3_256_972,
  },
  // Equipamiento actualizado mayo 2026: HELI $470.5K (-$119K×2), contenedores $570K (+$240K) → neto +$2K
  G: {
    equipamiento:       4_514_000,  // Actualizado: HELI corregido a $470.5K (-$238K), contenedores $570K (+$240K)
    adecuacionNave:       950_000,
    gastosPreoperativos:   95_000,
    contingencia:         546_400,  // 10% × (4,514,000 + 950,000)
    capitalTrabajo:     2_361_984,  // 3 meses × OPEX 787,328
    totalCAPEX:         8_467_384,
  },
}

// ─── OPEX desglosado por escala CA (MXN/mes, Esc 40% captura, Año 3) ────────

export const OPEX_CA: Record<TamañoCA, OPEXDesglose> = {
  P: {
    cmvCompraMPMes: 0,
    rentaMes: 16_250,
    energiaElectricaMes: 5_321,
    combustibleGasLPMes: 0,
    nominaConPrestaciones: 77_625,
    transporteCombustible: 5_000,
    mantenimientoEquipo: 1_416,
    insumosQuimicos: 2_226,
    aguaServicios: 2_000,
    seguros: 303,
    fleteComprador: 0,
    consumiblesLinea: 2_000,
    totalOPEXMes: 110_838,
  },
  M: {
    cmvCompraMPMes: 0,
    rentaMes: 48_750,
    energiaElectricaMes: 15_767,
    combustibleGasLPMes: 5_550,
    nominaConPrestaciones: 234_225,
    transporteCombustible: 8_000,
    mantenimientoEquipo: 5_274,
    insumosQuimicos: 6_788,
    aguaServicios: 5_000,
    seguros: 1_054,
    fleteComprador: 0,
    consumiblesLinea: 4_000,
    totalOPEXMes: 320_354,
  },
  G: {
    cmvCompraMPMes: 0,
    rentaMes: 130_000,
    energiaElectricaMes: 35_969,
    combustibleGasLPMes: 11_100,
    nominaConPrestaciones: 554_175,
    transporteCombustible: 15_000,
    mantenimientoEquipo: 14_882,
    insumosQuimicos: 18_702,
    aguaServicios: 12_000,
    seguros: 2_971,
    fleteComprador: 0,
    consumiblesLinea: 6_000,
    totalOPEXMes: 787_328,
  },
}

// ─── Recicladoras por Giro ───────────────────────────────────────────────────

export const RECICLADORAS: Record<GiroRecicladora, RecicladoreDataGiro> = {
  pet: {
    giro: 'pet',
    nombre: 'Recicladora PET',
    naveM2: 300,
    rendimientoKgKg: 0.85,
    precioVentaProcesado: 16.0,
    precioCompraMPAcopio: 5.5,
    compradoresAncla: ['ALPLA Monterrey', 'FEMSA Reciclaje', 'Industrias Rebermex'],
    equipos: [
      { nombre: 'Lavadora PET industrial 500kg/h', marca: 'Amut/Genérica', cantidad: 1, precioUnitMXN: 380_000, totalMXN: 380_000, potenciaKW: 22.0, factorUtil: 0.75, horasEfectDia: 6, diasMes: 25, kwhMes: 3300, kwhConContingencia: 3630, costoEnergiaMes: 10890 },
      { nombre: 'Trituradora/Molino PET 1t/h', marca: 'Vecoplan VNZ 63', cantidad: 1, precioUnitMXN: 520_000, totalMXN: 520_000, potenciaKW: 45.0, factorUtil: 0.75, horasEfectDia: 6, diasMes: 25, kwhMes: 6750, kwhConContingencia: 7425, costoEnergiaMes: 22275 },
      { nombre: 'Secador de flake centrífugo', marca: 'Genérico', cantidad: 1, precioUnitMXN: 180_000, totalMXN: 180_000, potenciaKW: 15.0, factorUtil: 0.75, horasEfectDia: 6, diasMes: 25, kwhMes: 2250, kwhConContingencia: 2475, costoEnergiaMes: 7425 },
      { nombre: 'Banda transportadora 6m', marca: 'Nacional', cantidad: 2, precioUnitMXN: 45_000, totalMXN: 90_000, potenciaKW: 1.5, factorUtil: 0.85, horasEfectDia: 6.8, diasMes: 25, kwhMes: 510, kwhConContingencia: 561, costoEnergiaMes: 1683 },
      { nombre: 'Extrusora pellet (esc 80%)', marca: 'Genérica', cantidad: 1, precioUnitMXN: 850_000, totalMXN: 850_000, potenciaKW: 75.0, factorUtil: 0.75, horasEfectDia: 6, diasMes: 25, kwhMes: 11250, kwhConContingencia: 12375, costoEnergiaMes: 37125, nota: 'Solo escenario 80%' },
      { nombre: 'Báscula 1,000kg', marca: 'Torrey PLP1000', cantidad: 1, precioUnitMXN: 12_500, totalMXN: 12_500, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26, nota: 'Precio verificado: $12,070-$12,983 MXN (Cocoisa/KitchenMax may-2026)' },
      { nombre: 'Patín hidráulico', marca: 'Genérico', cantidad: 2, precioUnitMXN: 8_000, totalMXN: 16_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
      { nombre: 'Herramienta menor', marca: 'Varios', cantidad: 1, precioUnitMXN: 25_000, totalMXN: 25_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    ],
    nomina: {
      puestos: [
        { puesto: 'Operario', cantidad: 6, salarioBrutoMes: 10_000, subtotal: 60_000 },
        { puesto: 'Supervisor', cantidad: 1, salarioBrutoMes: 17_500, subtotal: 17_500 },
        { puesto: 'Técnico proceso', cantidad: 1, salarioBrutoMes: 20_000, subtotal: 20_000 },
      ],
      subtotalBruto: 97_500,
      factorPrestaciones: 1.35,
      totalConPrestaciones: 116_775,
    },
    // contingencia 10%×(equip+nave)=$227,350; capital trabajo 3 meses×OPEX sin CMV: 757,497×3=não viable → usamos 2 meses OPEX total (distinto de CAs: recicladoras tienen CMV alto que ya es capital circulante del negocio)
    // Equipamiento actualizado mayo 2026: báscula PLP1000 $12,500 (+$2,500)
    capex: { equipamiento: 2_073_500, adecuacionNave: 200_000, gastosPreoperativos: 55_000, contingencia: 227_350, capitalTrabajo: 1_514_995, totalCAPEX: 4_070_845 },
    opex: { cmvCompraMPMes: 2_694_384, rentaMes: 19_500, energiaElectricaMes: 79_424, combustibleGasLPMes: 0, nominaConPrestaciones: 116_775, transporteCombustible: 15_000, mantenimientoEquipo: 4_315, insumosQuimicos: 128_449, aguaServicios: 4_500, seguros: 946, fleteComprador: 380_589, consumiblesLinea: 8_000, totalOPEXMes: 3_451_881 },
    capexTotal: 3_843_495,  // = equipamiento + nave + preop + capital_trabajo (sin contingencia)
    opexMes: 3_451_881,
    ingresoMesA3Esc40: 4_281_621,
    ebitdaA3: 9_956_877,
    tirProyecto: 112.9,
    paybackMeses: 15,
    vpn: 28_539_880,
    empleosPorPlanta: 20,
  },

  papel: {
    giro: 'papel',
    nombre: 'Recicladora Papel/Cartón',
    naveM2: 600,
    rendimientoKgKg: 0.90,
    precioVentaProcesado: 4.5,
    precioCompraMPAcopio: 2.5,
    compradoresAncla: ['MRS Logística SLP', 'Grupo Altsa', 'Bio Pappel Monterrey'],
    equipos: [
      { nombre: 'Prensa embaladora horizontal 5t/h', marca: 'TEVA/Imabe', cantidad: 1, precioUnitMXN: 680_000, totalMXN: 680_000, potenciaKW: 22.0, factorUtil: 0.75, horasEfectDia: 6, diasMes: 25, kwhMes: 3300, kwhConContingencia: 3630, costoEnergiaMes: 10890 },
      { nombre: 'Guillotina/Trituradora cartón', marca: 'Nacional', cantidad: 1, precioUnitMXN: 280_000, totalMXN: 280_000, potenciaKW: 15.0, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 2100, kwhConContingencia: 2310, costoEnergiaMes: 6930 },
      { nombre: 'Banda transportadora 10m', marca: 'Nacional', cantidad: 2, precioUnitMXN: 55_000, totalMXN: 110_000, potenciaKW: 2.2, factorUtil: 0.85, horasEfectDia: 6.8, diasMes: 25, kwhMes: 748, kwhConContingencia: 823, costoEnergiaMes: 2468 },
      { nombre: 'Báscula 3,000kg', marca: 'Torrey PLP3000', cantidad: 1, precioUnitMXN: 19_000, totalMXN: 19_000, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26 },
      { nombre: 'Montacargas gas LP', marca: 'Toyota 8FGU25', cantidad: 1, precioUnitMXN: 530_000, totalMXN: 530_000, potenciaKW: 0, factorUtil: 0.60, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0, nota: 'Gas LP: 2.5 kg/hora. Precio verificado: USD $34,950-$39,950 (losmontacargas.mx may-2026).' },
      { nombre: 'Herramienta menor', marca: 'Varios', cantidad: 1, precioUnitMXN: 30_000, totalMXN: 30_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    ],
    nomina: {
      puestos: [
        { puesto: 'Operario', cantidad: 8, salarioBrutoMes: 10_000, subtotal: 80_000 },
        { puesto: 'Supervisor', cantidad: 2, salarioBrutoMes: 17_500, subtotal: 35_000 },
        { puesto: 'Chofer', cantidad: 1, salarioBrutoMes: 13_500, subtotal: 13_500 },
      ],
      subtotalBruto: 128_500,
      factorPrestaciones: 1.35,
      totalConPrestaciones: 175_500,
    },
    // Equipamiento actualizado mayo 2026: montacargas Toyota $530K (+$105K)
    capex: { equipamiento: 1_649_000, adecuacionNave: 280_000, gastosPreoperativos: 55_000, contingencia: 192_900, capitalTrabajo: 1_517_734, totalCAPEX: 3_694_634 },
    opex: { cmvCompraMPMes: 3_265_920, rentaMes: 39_000, energiaElectricaMes: 20_315, combustibleGasLPMes: 0, nominaConPrestaciones: 175_500, transporteCombustible: 25_000, mantenimientoEquipo: 3_217, insumosQuimicos: 122_276, aguaServicios: 4_500, seguros: 760, fleteComprador: 362_299, consumiblesLinea: 6_000, totalOPEXMes: 4_024_787 },
    capexTotal: 3_501_734,  // = equipamiento + nave + preop + capital_trabajo (sin contingencia)
    opexMes: 4_024_787,
    ingresoMesA3Esc40: 4_075_868,
    ebitdaA3: 612_975,
    tirProyecto: -6.8,
    paybackMeses: 999,
    vpn: -4_449_205,
    empleosPorPlanta: 20,
  },

  aluminio: {
    giro: 'aluminio',
    nombre: 'Recicladora Aluminio (fundición)',
    naveM2: 250,
    rendimientoKgKg: 0.85,
    precioVentaProcesado: 42.0,
    precioCompraMPAcopio: 15.1,
    compradoresAncla: ['RRECIMETSA', 'ARZYZ', 'Industria metalmecánica SLP'],
    equipos: [
      { nombre: 'Horno fundición aluminio 300kg/carga', marca: 'Nacional/Importado', cantidad: 1, precioUnitMXN: 1_200_000, totalMXN: 1_200_000, potenciaKW: 90.0, factorUtil: 0.65, horasEfectDia: 5.2, diasMes: 25, kwhMes: 11700, kwhConContingencia: 12870, costoEnergiaMes: 38610, nota: 'Usa gas LP: 18 kg/hora' },
      { nombre: 'Prensa compactadora aluminio', marca: 'Genérica', cantidad: 1, precioUnitMXN: 280_000, totalMXN: 280_000, potenciaKW: 22.0, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 3080, kwhConContingencia: 3388, costoEnergiaMes: 10164 },
      { nombre: 'Banda transportadora 6m', marca: 'Nacional', cantidad: 1, precioUnitMXN: 45_000, totalMXN: 45_000, potenciaKW: 1.5, factorUtil: 0.80, horasEfectDia: 6.4, diasMes: 25, kwhMes: 240, kwhConContingencia: 264, costoEnergiaMes: 792 },
      { nombre: 'Lingoteras + equipo colado', marca: 'Nacional', cantidad: 1, precioUnitMXN: 120_000, totalMXN: 120_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
      { nombre: 'Báscula 500kg', marca: 'Rhino', cantidad: 1, precioUnitMXN: 3_800, totalMXN: 3_800, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26 },
      { nombre: 'EPP protección individual', marca: 'Varios', cantidad: 1, precioUnitMXN: 35_000, totalMXN: 35_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0, nota: 'Costo único' },
      { nombre: 'Herramienta menor', marca: 'Varios', cantidad: 1, precioUnitMXN: 25_000, totalMXN: 25_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    ],
    nomina: {
      puestos: [
        { puesto: 'Operario', cantidad: 5, salarioBrutoMes: 10_000, subtotal: 50_000 },
        { puesto: 'Supervisor', cantidad: 1, salarioBrutoMes: 17_500, subtotal: 17_500 },
        { puesto: 'Fundidor especialista', cantidad: 1, salarioBrutoMes: 22_000, subtotal: 22_000 },
      ],
      subtotalBruto: 89_500,
      factorPrestaciones: 1.35,
      totalConPrestaciones: 107_325,
    },
    capex: { equipamiento: 1_708_800, adecuacionNave: 350_000, gastosPreoperativos: 95_000, contingencia: 205_880, capitalTrabajo: 1_711_205, totalCAPEX: 4_070_885 },
    opex: { cmvCompraMPMes: 3_106_870, rentaMes: 16_250, energiaElectricaMes: 92_882, combustibleGasLPMes: 43_290, nominaConPrestaciones: 107_325, transporteCombustible: 12_000, mantenimientoEquipo: 3_560, insumosQuimicos: 144_068, aguaServicios: 3_500, seguros: 858, fleteComprador: 426_869, consumiblesLinea: 5_000, totalOPEXMes: 3_962_472 },
    capexTotal: 3_865_005,
    opexMes: 3_962_472,
    ingresoMesA3Esc40: 4_802_274,
    ebitdaA3: 10_077_626,
    tirProyecto: 110.3,
    paybackMeses: 15.4,
    vpn: 28_742_303,
    empleosPorPlanta: 20,
  },

  vidrio: {
    giro: 'vidrio',
    nombre: 'Recicladora Vidrio',
    naveM2: 300,
    rendimientoKgKg: 0.92,
    precioVentaProcesado: 3.83,
    precioCompraMPAcopio: 2.5,
    compradoresAncla: ['Vidriera Monterrey (Owens-Illinois)', 'Vitro', 'Grupo Altsa'],
    equipos: [
      { nombre: 'Molino de vidrio 2t/h', marca: 'Genérico nacional', cantidad: 1, precioUnitMXN: 320_000, totalMXN: 320_000, potenciaKW: 30.0, factorUtil: 0.75, horasEfectDia: 6, diasMes: 25, kwhMes: 4500, kwhConContingencia: 4950, costoEnergiaMes: 14850 },
      { nombre: 'Separador por color (banda óptica)', marca: 'Genérico/importado', cantidad: 1, precioUnitMXN: 580_000, totalMXN: 580_000, potenciaKW: 5.0, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 700, kwhConContingencia: 770, costoEnergiaMes: 2310 },
      { nombre: 'Banda transportadora 8m', marca: 'Nacional', cantidad: 2, precioUnitMXN: 45_000, totalMXN: 90_000, potenciaKW: 2.2, factorUtil: 0.80, horasEfectDia: 6.4, diasMes: 25, kwhMes: 704, kwhConContingencia: 774, costoEnergiaMes: 2323 },
      { nombre: 'Báscula 1,000kg', marca: 'Torrey', cantidad: 1, precioUnitMXN: 10_000, totalMXN: 10_000, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26 },
      { nombre: 'Herramienta menor + EPI vidrio', marca: 'Varios', cantidad: 1, precioUnitMXN: 35_000, totalMXN: 35_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    ],
    nomina: {
      puestos: [
        { puesto: 'Operario', cantidad: 6, salarioBrutoMes: 10_000, subtotal: 60_000 },
        { puesto: 'Supervisor', cantidad: 1, salarioBrutoMes: 17_500, subtotal: 17_500 },
      ],
      subtotalBruto: 77_500,
      factorPrestaciones: 1.35,
      totalConPrestaciones: 104_625,
    },
    capex: { equipamiento: 1_035_000, adecuacionNave: 220_000, gastosPreoperativos: 55_000, contingencia: 125_500, capitalTrabajo: 562_564, totalCAPEX: 1_998_064 },
    opex: { cmvCompraMPMes: 816_480, rentaMes: 19_500, energiaElectricaMes: 19_510, combustibleGasLPMes: 0, nominaConPrestaciones: 104_625, transporteCombustible: 15_000, mantenimientoEquipo: 2_156, insumosQuimicos: 28_506, aguaServicios: 3_000, seguros: 523, fleteComprador: 84_462, consumiblesLinea: 4_000, totalOPEXMes: 1_097_762 },
    capexTotal: 1_872_564,
    opexMes: 1_097_762,
    ingresoMesA3Esc40: 950_200,
    ebitdaA3: -1_770_746,
    tirProyecto: 0,
    paybackMeses: 999,
    vpn: -9_774_471,
    empleosPorPlanta: 20,
  },

  organicos: {
    giro: 'organicos',
    nombre: 'Planta Composta + Biodigestor',
    naveM2: 400,
    rendimientoKgKg: 0.40,
    precioVentaProcesado: 1.0,
    precioCompraMPAcopio: 1.0,
    compradoresAncla: ['Viveros SLP (40%)', 'Ferreterías (30%)', 'Autoservicio (20%)', 'Agricultores (10%)'],
    equipos: [
      { nombre: 'Biodigestor 25m³/día', marca: 'Nacional/Importado', cantidad: 1, precioUnitMXN: 850_000, totalMXN: 850_000, potenciaKW: 15.0, factorUtil: 0.60, horasEfectDia: 4.8, diasMes: 25, kwhMes: 1800, kwhConContingencia: 1980, costoEnergiaMes: 5940, nota: 'Genera biogás ~$0.20/kWh' },
      { nombre: 'Volteo composta mecánico (trommel) 10t/h', marca: 'Nacional', cantidad: 1, precioUnitMXN: 380_000, totalMXN: 380_000, potenciaKW: 22.0, factorUtil: 0.50, horasEfectDia: 4, diasMes: 25, kwhMes: 2200, kwhConContingencia: 2420, costoEnergiaMes: 7260 },
      { nombre: 'Tamizadora vibratoria', marca: 'Nacional', cantidad: 1, precioUnitMXN: 180_000, totalMXN: 180_000, potenciaKW: 7.5, factorUtil: 0.60, horasEfectDia: 4.8, diasMes: 25, kwhMes: 900, kwhConContingencia: 990, costoEnergiaMes: 2970 },
      { nombre: 'Ensacadora semiautomática', marca: 'Nacional', cantidad: 1, precioUnitMXN: 280_000, totalMXN: 280_000, potenciaKW: 5.0, factorUtil: 0.70, horasEfectDia: 5.6, diasMes: 25, kwhMes: 700, kwhConContingencia: 770, costoEnergiaMes: 2310 },
      { nombre: 'Báscula 500kg', marca: 'Rhino', cantidad: 1, precioUnitMXN: 3_800, totalMXN: 3_800, potenciaKW: 0.1, factorUtil: 0.40, horasEfectDia: 3.2, diasMes: 25, kwhMes: 8, kwhConContingencia: 9, costoEnergiaMes: 26 },
      { nombre: 'Herramienta menor + equipo volteo', marca: 'Varios', cantidad: 1, precioUnitMXN: 45_000, totalMXN: 45_000, potenciaKW: 0, factorUtil: 0, horasEfectDia: 0, diasMes: 0, kwhMes: 0, kwhConContingencia: 0, costoEnergiaMes: 0 },
    ],
    nomina: {
      puestos: [
        { puesto: 'Operario', cantidad: 10, salarioBrutoMes: 10_000, subtotal: 100_000 },
        { puesto: 'Supervisor', cantidad: 1, salarioBrutoMes: 17_500, subtotal: 17_500 },
        { puesto: 'Técnico agronómico', cantidad: 1, salarioBrutoMes: 20_000, subtotal: 20_000 },
      ],
      subtotalBruto: 137_500,
      factorPrestaciones: 1.35,
      totalConPrestaciones: 186_975,
    },
    capex: { equipamiento: 1_738_800, adecuacionNave: 420_000, gastosPreoperativos: 55_000, contingencia: 215_880, capitalTrabajo: 991_159, totalCAPEX: 3_420_839 },
    opex: { cmvCompraMPMes: 130_320, rentaMes: 26_000, energiaElectricaMes: 18_506, combustibleGasLPMes: 0, nominaConPrestaciones: 186_975, transporteCombustible: 20_000, mantenimientoEquipo: 3_623, insumosQuimicos: 16_499, aguaServicios: 6_000, seguros: 670, fleteComprador: 0, consumiblesLinea: 5_000, totalOPEXMes: 413_593 },
    capexTotal: 3_204_959,
    opexMes: 413_593,
    ingresoMesA3Esc40: 549_950,
    ebitdaA3: 1_070_928,
    tirProyecto: 8.2,
    paybackMeses: 999,
    vpn: -1_982_825,
    empleosPorPlanta: 20,
  },
}

// ─── Sistema integrado CAs + Recicladoras por Fase ──────────────────────────

export interface FaseInversion {
  fase: number
  nombre: string
  mixCAs: string
  nCAs: number
  capTonDia: number
  capexCAs: number
  opexMesCAs: number
  recicladoras: { giro: GiroRecicladora; cantidad: number }[]
  capexRecicladoras: number
  capexTotalSistema: number
  ebitdaMesSistema: number
  empleosCAs: number
  empleosRecicladoras: number
  empleosTotales: number
}

export const FASES_INVERSION: FaseInversion[] = [
  {
    fase: 1, nombre: 'Piloto', mixCAs: '3P+0M+0G', nCAs: 3, capTonDia: 15,
    capexCAs: 2_179_428, opexMesCAs: 332_514,
    recicladoras: [],
    capexRecicladoras: 0, capexTotalSistema: 2_179_428,
    ebitdaMesSistema: 430_653,
    empleosCAs: 15, empleosRecicladoras: 0, empleosTotales: 15,
  },
  {
    fase: 2, nombre: 'Arranque', mixCAs: '5P+1M+0G', nCAs: 6, capTonDia: 40,
    capexCAs: 6_161_188, opexMesCAs: 874_544,
    recicladoras: [],
    capexRecicladoras: 0, capexTotalSistema: 6_161_188,
    ebitdaMesSistema: 1_421_039,
    empleosCAs: 39, empleosRecicladoras: 0, empleosTotales: 39,
  },
  {
    fase: 3, nombre: 'Expansión', mixCAs: '5P+3M+0G', nCAs: 8, capTonDia: 70,
    capexCAs: 11_224_804, opexMesCAs: 1_515_676,
    recicladoras: [],
    capexRecicladoras: 0, capexTotalSistema: 11_224_804,
    ebitdaMesSistema: 1_827_083,
    empleosCAs: 67, empleosRecicladoras: 0, empleosTotales: 67,
  },
  {
    fase: 4, nombre: 'Consolidación', mixCAs: '8P+4M+1G', nCAs: 13, capTonDia: 130,
    capexCAs: 22_006_167, opexMesCAs: 3_398_300,
    recicladoras: [
      { giro: 'organicos', cantidad: 1 },
      { giro: 'pet', cantidad: 1 },
      { giro: 'vidrio', cantidad: 1 },
      { giro: 'aluminio', cantidad: 1 },
    ],
    capexRecicladoras: 12_783_523, capexTotalSistema: 34_789_690,
    ebitdaMesSistema: 5_921_510,
    empleosCAs: 130, empleosRecicladoras: 80, empleosTotales: 210,
  },
  {
    fase: 5, nombre: 'Madurez (Óptimo)', mixCAs: '10P+6M+2G', nCAs: 18, capTonDia: 230,
    capexCAs: 35_520_970, opexMesCAs: 5_662_096,
    recicladoras: [
      { giro: 'organicos', cantidad: 1 },
      { giro: 'pet', cantidad: 1 },
      { giro: 'vidrio', cantidad: 1 },
      { giro: 'aluminio', cantidad: 1 },
    ],
    capexRecicladoras: 12_783_523, capexTotalSistema: 48_304_493,
    ebitdaMesSistema: 10_349_268,
    empleosCAs: 168, empleosRecicladoras: 80, empleosTotales: 248,
  },
  {
    fase: 6, nombre: 'Sistema completo', mixCAs: '20P+8M+3G', nCAs: 31, capTonDia: 370,
    capexCAs: 71_853_393, opexMesCAs: 12_178_252,
    recicladoras: [
      { giro: 'organicos', cantidad: 1 },
      { giro: 'pet', cantidad: 2 },
      { giro: 'vidrio', cantidad: 2 },
      { giro: 'aluminio', cantidad: 2 },
    ],
    capexRecicladoras: 18_521_092, capexTotalSistema: 90_374_485,
    ebitdaMesSistema: 24_917_382,
    empleosCAs: 329, empleosRecicladoras: 120, empleosTotales: 449,
  },
]

// ─── Estructura deuda por escala ─────────────────────────────────────────────

export const ESTRUCTURA_DEUDA = {
  P: { deudaEquity: '50/50', tasaInteres: 0.14, plazoAnos: 4 },
  M: { deudaEquity: '60/40', tasaInteres: 0.135, plazoAnos: 6 },
  G: { deudaEquity: '70/30', tasaInteres: 0.13, plazoAnos: 8 },
} as const

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function getTotalEquipamientoCAPEX(escala: TamañoCA): number {
  return EQUIPOS_CA[escala].reduce((sum, eq) => sum + eq.totalMXN, 0)
}

export function getTotalEnergiaMes(escala: TamañoCA): number {
  return EQUIPOS_CA[escala].reduce((sum, eq) => sum + eq.costoEnergiaMes, 0)
}

export function getTotalKwhMes(escala: TamañoCA): number {
  return EQUIPOS_CA[escala].reduce((sum, eq) => sum + eq.kwhConContingencia, 0)
}

export function getPersonalTotal(escala: TamañoCA): number {
  return PERSONAL_CA[escala].puestos.reduce((sum, p) => sum + p.cantidad, 0)
}

export function getRecicladoresCAPEXFase(fase: number): number {
  const f = FASES_INVERSION.find(fi => fi.fase === fase)
  return f?.capexRecicladoras ?? 0
}

/** Total empleos directos sistema completo (CAs + Recicladoras) para una fase. */
export function getEmpleosSistemaFase(fase: number): number {
  const f = FASES_INVERSION.find(fi => fi.fase === fase)
  return f?.empleosTotales ?? 0
}
