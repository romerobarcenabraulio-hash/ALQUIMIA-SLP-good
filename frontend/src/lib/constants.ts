import type { ZonaMetropolitana, CAConfig, FaseCA, FaseInstitucional, PreciosMaterial, PresetTrayectoria } from '@/types'

// ─── Composición RSU (fija — §2.1) ──────────────────────────────────────────
export const COMPOSICION_RSU = {
  organico:  0.45,
  papel:     0.20,
  plastico:  0.15,
  vidrio:    0.05,
  aluminio:  0.025, // 5% metales × 50% Al  -- wait §2.1 says metales 5%, aluminio 70% of that
  otros:     0.10,
} as const

// Ajuste: metales 5% total, aluminio 70% = 3.5%; otros no-aluminio en "otros"
export const COMPOSICION_RSU_DETALLE = {
  organico:  { pct: 0.45, biodigestor: 0.30, composta: 0.70 },
  papel:     { pct: 0.20 },
  plastico:  { pct: 0.15, petPct: 0.50 },
  vidrio:    { pct: 0.05 },
  metales:   { pct: 0.05, aluminioPct: 0.70 },
  otros:     { pct: 0.10 },
} as const

// ─── Precios commodities (MXN/kg — §2.2) ─────────────────────────────────────
export const PRECIOS_DEFAULTS: PreciosMaterial = {
  pet:      5.50,
  hdpe:     8.50,
  papel:    2.50,
  vidrio:   2.30,
  aluminio: 15.10,
  organico: 0.30, // $300 MXN/ton (composta básica — corregido, era $1,100 incorrecto)
}

export const PRECIOS_RANGO = {
  pet:      { min: 3.00,  max: 12.00, step: 0.10, sigma: 1.20 },
  hdpe:     { min: 5.00,  max: 15.00, step: 0.10, sigma: 1.50 },
  papel:    { min: 0.70,  max: 5.00,  step: 0.10, sigma: 0.80 },
  vidrio:   { min: 0.90,  max: 5.00,  step: 0.10, sigma: 0.90 },
  aluminio: { min: 10.00, max: 40.00, step: 0.50, sigma: 3.50 },
  organico: { min: 0.30,  max: 3.00,  step: 0.10, sigma: 0.40 },
} as const

// ─── Configuración CAs (§2.3) ─────────────────────────────────────────────────
export const CA_CONFIG: Record<'P' | 'M' | 'G', CAConfig> = {
  P: {
    tipo: 'P', capTonDia: 5, superficieM2: 250, capexMXN: 726476,
    opexMesMXN: 110838, ingresoMesA3: 254389, ebitdaMesA3: 143551,
    tir: 109.5, paybackMeses: 6, empleos: 5,
    deudaEq: 0.50, tasaDeuda: 0.14, plazoDeuda: 4,
  },
  M: {
    tipo: 'M', capTonDia: 15, superficieM2: 750, capexMXN: 2528808,
    opexMesMXN: 320354, ingresoMesA3: 1023638, ebitdaMesA3: 703284,
    tir: 155.6, paybackMeses: 5, empleos: 14,
    deudaEq: 0.60, tasaDeuda: 0.135, plazoDeuda: 4,
  },
  G: {
    tipo: 'G', capTonDia: 50, superficieM2: 2000, capexMXN: 7131655,
    opexMesMXN: 787328, ingresoMesA3: 3496500, ebitdaMesA3: 2709172,
    tir: 212.0, paybackMeses: 7, empleos: 34,
    deudaEq: 0.70, tasaDeuda: 0.13, plazoDeuda: 5,
  },
}

// ─── Fases de despliegue CAs (§2.4) ──────────────────────────────────────────
export const FASES_CA: FaseCA[] = [
  { fase: 1, nombre: 'Piloto',         mix: '3P+0M+0G',  nCAs: 3,  capTonDia: 15,  capexMXN: 2180000,  ebitdaMesK: 430,  coberturaPct: 25 },
  { fase: 2, nombre: 'Arranque',       mix: '5P+1M+0G',  nCAs: 6,  capTonDia: 40,  capexMXN: 6160000,  ebitdaMesK: 1420, coberturaPct: 40 },
  { fase: 3, nombre: 'Expansión',      mix: '5P+3M+0G',  nCAs: 8,  capTonDia: 70,  capexMXN: 11220000, ebitdaMesK: 1830, coberturaPct: 60 },
  { fase: 4, nombre: 'Consolidación',  mix: '8P+4M+1G',  nCAs: 13, capTonDia: 130, capexMXN: 22000000, ebitdaMesK: 5920, coberturaPct: 80 },
  { fase: 5, nombre: 'Madurez ★',      mix: '10P+6M+2G', nCAs: 18, capTonDia: 230, capexMXN: 35500000, ebitdaMesK: 10350, coberturaPct: 90, esOptimo: true },
  { fase: 6, nombre: 'Sistema completo', mix: '20P+8M+3G', nCAs: 31, capTonDia: 370, capexMXN: 71900000, ebitdaMesK: 24900, coberturaPct: 100 },
]

// ─── Fases institucionales (§2.5) ─────────────────────────────────────────────
export const FASES_INSTITUCIONALES: FaseInstitucional[] = [
  { fase: 1, meses: '0–6',  nombre: 'Alineación institucional y jurídica', gate: '★ BLOQUEANTE: sin reforma aprobada', bloqueante: true },
  { fase: 2, meses: '4–9',  nombre: 'Negociación y pacto con concesionario', gate: 'Adenda al contrato' },
  { fase: 3, meses: '9–18', nombre: 'Despliegue de infraestructura', gate: 'Construcción CAs' },
  { fase: 4, meses: '18–24', nombre: 'Arranque y operación del piloto', gate: 'Validación KPIs' },
  { fase: 5, meses: '24–36', nombre: 'Evaluación y escalamiento', gate: 'Cobertura ZM completa' },
]

// ─── Presets de trayectoria (§2.6) ────────────────────────────────────────────
export const PRESETS_TRAYECTORIA: Record<string, PresetTrayectoria> = {
  'Plan SLP Original': { nombre: 'Plan SLP Original', años: [25, 60, 100, 0, 0] },
  'Conservador':       { nombre: 'Conservador',       años: [15, 35, 55, 80, 100] },
  'Realista':          { nombre: 'Realista',          años: [20, 45, 70, 90, 100] },
  'Agresivo':          { nombre: 'Agresivo',          años: [35, 65, 85, 95, 100] },
  'Acelerado':         { nombre: 'Acelerado',         años: [50, 80, 95, 100, 0] },
}

// ─── Estacionalidad mensual (§3.4) ────────────────────────────────────────────
export const ESTACIONALIDAD = [
  -0.08, -0.05, 0.02, 0.05, 0.08, 0.03,
   0.06,  0.07, 0.03, 0.05, 0.12, 0.18,
]

// ─── Parámetros OPEX (§3.5) ───────────────────────────────────────────────────
export const OPEX_PARAMS = {
  kwhMes:       { P: 800, M: 2400, G: 7200 },
  aguaM3Mes:    { P: 12, M: 35, G: 95 },
  precioKwh:    2.80,
  precioAguaM3: 18.50,
  salarioOperador:   9200,
  salarioChofer:     11500,
  salarioSupervisor: 14800,
  cuotaIMSS:         0.2168,
  rotacionAnual:     0.18,
  costoCapacitacion: 4500,
  dieselLKm:         0.35,
  precioDiesel:      24.0,
  mantenimientoCamion: 5500,
  vidaUtilCamion:    4,
  costoTerrenoM2: { MTY: 4200, SP: 8500, QRO: 2800, SLP: 1600, GDL: 3600, default: 2000 },
  superficieCA:   { P: 250, M: 750, G: 2000 },
  rentaMensPctValor: 0.006,
  comunicacionAnual: 600000,
  senaleticsCA:    18000,
  costoBasureroVertical:    180,
  costoBasureroCasa:        280,
  costoBasureroResidencial: 650,
  vidaUtilBasureros: 3,
  pctVivReqBasurero: 0.80,
} as const

// ─── Parámetros modelo (no sobreescribibles por API §0) ──────────────────────
export const MODELO_PARAMS = {
  wacc:       0.20,
  isr:        0.30,
  factorCH4:  234,
  gwpCH4:     27,
  rampaCAs:   { año1: 0.50, año2: 0.75, año3plus: 1.00 },
  multipVT:   5,
  petPorcentaje: 0.50,
  aluminioPorcentaje: 0.70,
  orgBiodigestor: 0.30,
  orgComposta: 0.70,
  tipoCambio: 17.10,
  precioCarbonoVol: 5,
  precioCarbonoSCE: [10, 20],
  precioCarbonoEU:  [60, 90],
  diasOperativos: 300,
  diasMes: 30,
} as const

// ─── Multiplicadores económicos (§2.8) ───────────────────────────────────────
export const MULTIPLICADORES = {
  empleoFormalLocal:  1.8,
  empleoIndirecto:    [2.5, 3.5],
  cadenaProveedores:  0.25,
  valorPropiedad:     0.12,
  revenueFiscal:      0.16,
  inversionPrivada:   1.40,
  ahorroSaludHabAño:  145,
  carbonCredVolUSD:   5,
  carbonCredSCEUSD:   15,
  carbonCredEUUSD:    75,
} as const

// ─── ZMs (Fase A — en memoria, §4.1) ─────────────────────────────────────────
export const ZMS_ALL: ZonaMetropolitana[] = [
  {
    id: 'SLP', nombre: 'ZM San Luis Potosí', estado: 'San Luis Potosí',
    municipios: [
      { id: 'slp', nombre: 'San Luis Potosí', estado: 'SLP', pop: 912871, viv: 164000, ocu: 3.6, genKgDia: 0.90, crecPct: 1.2 },
      { id: 'sol', nombre: 'Soledad de Graciano Sánchez', estado: 'SLP', pop: 323409, viv: 58000, ocu: 3.6, genKgDia: 0.90, crecPct: 1.2 },
      { id: 'csp', nombre: 'Cerro de San Pedro', estado: 'SLP', pop: 4278, viv: 1000, ocu: 3.6, genKgDia: 0.85, crecPct: 0.8 },
      { id: 'vip', nombre: 'Villa de Pozos', estado: 'SLP', pop: 3422, viv: 1000, ocu: 3.6, genKgDia: 0.85, crecPct: 1.0 },
    ],
    totalPop: 1243980, totalViv: 224000, ocu: 3.6, genKgDia: 0.90, crecPct: 1.2,
    mixVivienda: { vertical: 0.50, casa: 0.30, residencial: 0.20 },
    costoTerrenoM2: 1600, rellenoVidaUtil: 12, pepenadoresActivos: 540,
  },
  {
    id: 'MTY', nombre: 'ZM Monterrey', estado: 'Nuevo León',
    municipios: [
      { id: 'mty', nombre: 'Monterrey', estado: 'NL', pop: 1142994, viv: 230000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'spg', nombre: 'San Pedro Garza García', estado: 'NL', pop: 163148, viv: 48000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'snl', nombre: 'San Nicolás de los Garza', estado: 'NL', pop: 430143, viv: 120000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'gua', nombre: 'Guadalupe', estado: 'NL', pop: 686165, viv: 150000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'apo', nombre: 'Apodaca', estado: 'NL', pop: 643854, viv: 130000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'sca', nombre: 'Santa Catarina', estado: 'NL', pop: 322928, viv: 80000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'gar', nombre: 'García', estado: 'NL', pop: 278240, viv: 60000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'esc', nombre: 'General Escobedo', estado: 'NL', pop: 436030, viv: 38000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
      { id: 'jua', nombre: 'Juárez', estado: 'NL', pop: 276669, viv: 34000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8 },
    ],
    totalPop: 5341171, totalViv: 890000, ocu: 3.5, genKgDia: 1.05, crecPct: 1.8,
    mixVivienda: { vertical: 0.55, casa: 0.30, residencial: 0.15 },
    costoTerrenoM2: 4200, rellenoVidaUtil: 8, pepenadoresActivos: 2400,
  },
  {
    id: 'QRO', nombre: 'ZM Querétaro', estado: 'Querétaro',
    municipios: [
      { id: 'qro', nombre: 'Querétaro', estado: 'QRO', pop: 1_049_777, viv: 200000, ocu: 3.4, genKgDia: 0.95, crecPct: 2.1 },
      { id: 'cor', nombre: 'Corregidora', estado: 'QRO', pop: 193_000, viv: 32000, ocu: 3.4, genKgDia: 0.95, crecPct: 2.1 },
      { id: 'mar', nombre: 'El Marqués', estado: 'QRO', pop: 168_000, viv: 24000, ocu: 3.4, genKgDia: 0.95, crecPct: 2.1 },
      { id: 'hui', nombre: 'Huimilpan', estado: 'QRO', pop: 34306, viv: 4000, ocu: 3.4, genKgDia: 0.90, crecPct: 2.1 },
    ],
    totalPop: 1444083, totalViv: 260000, ocu: 3.4, genKgDia: 0.95, crecPct: 2.1,
    mixVivienda: { vertical: 0.65, casa: 0.20, residencial: 0.15 },
    costoTerrenoM2: 2800, pepenadoresActivos: 680,
  },
  {
    id: 'GDL', nombre: 'ZM Guadalajara', estado: 'Jalisco',
    municipios: [
      { id: 'gdl', nombre: 'Guadalajara', estado: 'JAL', pop: 1_385_600, viv: 280_000, ocu: 3.5, genKgDia: 0.688, crecPct: 1.5 },
      { id: 'zap', nombre: 'Zapopan', estado: 'JAL', pop: 1_062_000, viv: 215_000, ocu: 3.5, genKgDia: 0.688, crecPct: 1.5 },
      { id: 'tla', nombre: 'San Pedro Tlaquepaque', estado: 'JAL', pop: 650_000, viv: 132_000, ocu: 3.5, genKgDia: 0.688, crecPct: 1.5 },
    ],
    totalPop: 3_097_600, totalViv: 627_000, ocu: 3.5, genKgDia: 0.688, crecPct: 1.5,
    mixVivienda: { vertical: 0.58, casa: 0.25, residencial: 0.17 },
    costoTerrenoM2: 3600, rellenoVidaUtil: 10, pepenadoresActivos: 2100,
  },
]

export function alquimiaHideGdlFromUi(): boolean {
  return process.env.NEXT_PUBLIC_ALQUIMIA_HIDE_GDL === '1'
}

/** Nota de selector cuando GDL se oculta vía `NEXT_PUBLIC_ALQUIMIA_HIDE_GDL`. */
export const GDL_ZM_SELECTOR_FOOTNOTE =
  'ZM Guadalajara estará disponible cuando se carguen los reglamentos municipales.'

export const ZMS: ZonaMetropolitana[] = alquimiaHideGdlFromUi()
  ? ZMS_ALL.filter(z => z.id !== 'GDL')
  : ZMS_ALL

/** INEGI Censo 2020 — población municipal de referencia (Q-024). `mxq` no está en el conjunto ZM simulado `vip`. */
export const POBLACION_INEGI2020_SLPM: Record<string, number> = {
  slp: 912871,
  sol: 323409,
  csp: 4278,
  vip: 3422,
  mxq: 5644,
}

// ─── KPIs operativos por fase (§3.3) ─────────────────────────────────────────
export const KPIS_POR_FASE = [
  { kpi: 'Pureza material (%)',    f1: 60, f2: 72, f3: 80, f4: 87, f5: 92 },
  { kpi: 'Rechazo impureza (%)',   f1: 40, f2: 28, f3: 20, f4: 13, f5: 8 },
  { kpi: 'Ocupación CAs (%)',      f1: 72, f2: 78, f3: 84, f4: 88, f5: 91 },
  { kpi: 'Tiempo ciclo (min/ton)', f1: 52, f2: 44, f3: 38, f4: 33, f5: 29 },
  { kpi: 'DSCR',                   f1: 1.4, f2: 1.8, f3: 2.1, f4: 2.5, f5: 2.9 },
  { kpi: 'Break-even CA-P (kg/d)', f1: 1850, f2: 1620, f3: 1450, f4: 1310, f5: 1190 },
  { kpi: 'NPS ciudadanos',         f1: 31, f2: 44, f3: 58, f4: 67, f5: 74 },
  { kpi: 'Quejas/mes',             f1: 85, f2: 52, f3: 28, f4: 14, f5: 6 },
  { kpi: 'Pepenadores formal. (%)',f1: 15, f2: 35, f3: 55, f4: 75, f5: 90 },
]

// ─── Factores emisión (kgCO2e/kg material virgen) ─────────────────────────────
export const FACTORES_EMISION = {
  papel:    1.29,
  plastico: 2.53,
  vidrio:   0.85,
  aluminio: 11.89,
  organico: 0.30, // CH4 factor
} as const
