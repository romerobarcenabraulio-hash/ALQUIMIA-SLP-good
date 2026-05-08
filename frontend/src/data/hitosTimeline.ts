/**
 * Catálogo de hitos espacio-tiempo (SLP referencia).
 * Simulación orientativa; no sustituye calendario oficial de cabildo.
 */

import { kpisAcumulados as kpisAcumuladosCore } from '@/lib/pertUtils'

export interface PertEstimate {
  optimistic_dias: number
  most_likely_dias: number
  pessimistic_dias: number
}

export interface KpiDeltaHito {
  /** Empleos directos adicionales atribuibles al hito (acumulable). */
  empleos_delta: number
  /** Integración formal de pepenadores / recicladores de base. */
  pepenadores_delta: number
  /** Puntos porcentuales de captura diferenciada acumulables (0–100 escala referencia). */
  captura_pct_pts: number
  /** Toneladas CO₂e evitadas acumuladas (orden de magnitud programa). */
  co2e_evitado_ton_delta: number
}

export interface Hito {
  id: string
  nombre_corto: string
  descripcion_ciudadano: string
  pert: PertEstimate
  kpis: KpiDeltaHito
  es_gate_clave: boolean
  es_pico_estacional: boolean
}

export interface KpisAcumulados {
  empleos: number
  pepenadores: number
  captura_pct: number
  co2e_evitado_ton: number
}

export function pert(optimistic_dias: number, most_likely_dias: number, pessimistic_dias: number): PertEstimate {
  return { optimistic_dias, most_likely_dias, pessimistic_dias }
}

export function kpi(partial: Partial<KpiDeltaHito> = {}): KpiDeltaHito {
  return {
    empleos_delta: partial.empleos_delta ?? 0,
    pepenadores_delta: partial.pepenadores_delta ?? 0,
    captura_pct_pts: partial.captura_pct_pts ?? 0,
    co2e_evitado_ton_delta: partial.co2e_evitado_ton_delta ?? 0,
  }
}

/** Horizonte visual: 36 meses × 30 días (referencia UI, no calendario civil exacto). */
export const HORIZONTE_DIAS_MESES_36 = 36 * 30

export const HITOS_TIMELINE_SLP: Hito[] = [
  {
    id: 'h01',
    nombre_corto: 'Sala técnica',
    descripcion_ciudadano:
      'Se constituye la mesa de trabajo entre Servicios Municipales, salud y comunicación para acordar prioridades de limpia y residuos en tu colonia.',
    pert: pert(0, 14, 45),
    kpis: kpi({ empleos_delta: 2, pepenadores_delta: 0, captura_pct_pts: 0, co2e_evitado_ton_delta: 0 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h02',
    nombre_corto: 'Línea base',
    descripcion_ciudadano:
      'Se publica internamente cuánta basura genera el municipio y qué fracción se captura hoy, para medir avances sin dramatizar cifras.',
    pert: pert(20, 45, 90),
    kpis: kpi({ captura_pct_pts: 1, co2e_evitado_ton_delta: 120 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h03',
    nombre_corto: 'Reglamento al día',
    descripcion_ciudadano:
      'Cabildo conoce brechas del reglamento de limpia y agenda una reforma u homologación con el esquema de cinco fracciones.',
    // PERT ajustado: esperanza ≤ h05 y ambos activan en el acumulado hacia ~mes 4 (≈ día 120) con HORIZONTE_DIAS_MESES_36.
    pert: pert(50, 100, 200),
    kpis: kpi({ empleos_delta: 4, captura_pct_pts: 2 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
  {
    id: 'h04',
    nombre_corto: 'Comunidad informada',
    descripcion_ciudadano:
      'Campaña clara de qué va en cada bote; se evita el “todo al mismo saco” con material sencillo y puntos de aclaración.',
    pert: pert(30, 75, 120),
    kpis: kpi({ pepenadores_delta: 15, captura_pct_pts: 2, co2e_evitado_ton_delta: 200 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h05',
    nombre_corto: 'CA piloto',
    descripcion_ciudadano:
      'Primer centro de acopio visible con horario, reglas y personal capacitado; colonias piloto tienen dónde llevar reciclables limpios.',
    // Ajuste PERT: esperanza ≤ ~120 para reflejar efecto en KPIs hacia mes 4 (día 120); mantiene orden h03 < h05 < h06.
    pert: pert(70, 110, 190),
    kpis: kpi({ empleos_delta: 12, pepenadores_delta: 25, captura_pct_pts: 4, co2e_evitado_ton_delta: 450 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h06',
    nombre_corto: 'Rutas segregadas',
    descripcion_ciudadano:
      'Los camiones o rutas muestran en color o cartel qué fracción recogen; menos mezcla en la calle equivale a más valorización posterior.',
    pert: pert(120, 210, 300),
    kpis: kpi({ captura_pct_pts: 3, co2e_evitado_ton_delta: 380 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h07',
    nombre_corto: 'Auditoría oleada 1',
    descripcion_ciudadano:
      'Primer corte honesto: qué funcionó en colonia piloto, qué bloqueó la participación ciudadana y qué ajustar antes de escalar.',
    pert: pert(200, 270, 360),
    kpis: kpi({ empleos_delta: 3, captura_pct_pts: 2 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
  {
    id: 'h08',
    nombre_corto: 'Segunda colonia',
    descripcion_ciudadano:
      'Se replica el modelo con menos fricción porque ya hay ejemplo cercano y vecinos que explican la dinámica.',
    pert: pert(240, 330, 450),
    kpis: kpi({ pepenadores_delta: 30, captura_pct_pts: 3, co2e_evitado_ton_delta: 520 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h09',
    nombre_corto: 'Lluvias / temporada',
    descripcion_ciudadano:
      'Refuerzos de barrido y limpieza en puntos críticos en temporada de lluvias; menos arrastre de basura hacia barrancas.',
    pert: pert(300, 390, 480),
    kpis: kpi({ captura_pct_pts: 1, co2e_evitado_ton_delta: 210 }),
    es_gate_clave: false,
    es_pico_estacional: true,
  },
  {
    id: 'h10',
    nombre_corto: 'Pepenadores formales',
    descripcion_ciudadano:
      'Esquema de registro y espacios seguros para quien recupera materiales; se reconoce su rol sin confundirlo con trabajo informal en riesgo.',
    pert: pert(320, 420, 540),
    kpis: kpi({ empleos_delta: 8, pepenadores_delta: 60, captura_pct_pts: 5, co2e_evitado_ton_delta: 640 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h11',
    nombre_corto: 'Valorizadora',
    descripcion_ciudadano:
      'Contrato marco con planta o recuperador autorizado para salidas claras de cartón / PET seleccionados; trazabilidad básica de peso y destino declarado.',
    pert: pert(400, 510, 630),
    kpis: kpi({ empleos_delta: 6, captura_pct_pts: 3, co2e_evitado_ton_delta: 890 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h12',
    nombre_corto: 'Meta año 2',
    descripcion_ciudadano:
      'Cabildo revisa números de captura diferenciada y decide si aceitar la siguiente oleada de colonias con el mismo presupuesto ajustado.',
    pert: pert(480, 600, 720),
    kpis: kpi({ captura_pct_pts: 4, co2e_evitado_ton_delta: 720 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
  {
    id: 'h13',
    nombre_corto: 'Pico fin de año',
    descripcion_ciudadano:
      'Plan operativo visible para envases, voluminosos y organismos después de ferias locales; comunicación antes del pico.',
    pert: pert(600, 700, 800),
    kpis: kpi({ captura_pct_pts: 2, co2e_evitado_ton_delta: 540 }),
    es_gate_clave: false,
    es_pico_estacional: true,
  },
  {
    id: 'h14',
    nombre_corto: 'Equipo de campo',
    descripcion_ciudadano:
      'Balers, etiquetado de contenedores o mejoras físicas modestas que reducen costo por tonelada recolectada de manera diferenciada.',
    pert: pert(540, 660, 780),
    kpis: kpi({ empleos_delta: 10, captura_pct_pts: 3, co2e_evitado_ton_delta: 610 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h15',
    nombre_corto: 'Coordinación ZM',
    descripcion_ciudadano:
      'Acuerdos mínimos con municipios vecinos para no mover residuos de un lado al otro sin reglas; saneamiento de rutas metropolitanas declaradas.',
    pert: pert(620, 750, 900),
    kpis: kpi({ captura_pct_pts: 2, co2e_evitado_ton_delta: 400 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h16',
    nombre_corto: 'Contraloría ciudadana',
    descripcion_ciudadano:
      'Comité ciudadano revisa métricas abiertas (toneladas declaradas, quejas cerradas); transparencia sin prometer auditoría jurídica sustitutiva.',
    pert: pert(700, 830, 960),
    kpis: kpi({ empleos_delta: 2, captura_pct_pts: 2 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
  {
    id: 'h17',
    nombre_corto: 'Repunte captura',
    descripcion_ciudadano:
      'Oleada final enfocada en materiales que aún se fugan del sistema; menos improvisación en patios y relleno.',
    pert: pert(780, 930, 1020),
    kpis: kpi({ captura_pct_pts: 6, pepenadores_delta: 40, co2e_evitado_ton_delta: 1100 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'h18',
    nombre_corto: 'Cierre ciclo',
    descripcion_ciudadano:
      'Informe ejecutivo año 36: comparar contra año 0, decidir siguiente contrato operativo y dejar evidencia ordenada para nuevo cabildo.',
    pert: pert(900, 1020, 1080),
    kpis: kpi({ empleos_delta: 5, captura_pct_pts: 4, co2e_evitado_ton_delta: 480 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
]

/** Paquetes metropolitanos P1-4 — misma forma PERT; calendario por ZM sujeto a CLC / cabildo. */
export const HITOS_TIMELINE_MTY: Hito[] = [
  {
    id: 'mty-h01',
    nombre_corto: 'Convenio marco y fracciones',
    descripcion_ciudadano:
      'Alinear operación municipal con SIMEPRODE y el mínimo de fracciones acordado en la ZM; sin mezclar competencias locales.',
    pert: pert(25, 55, 95),
    kpis: kpi({ captura_pct_pts: 1, co2e_evitado_ton_delta: 80 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
  {
    id: 'mty-h02',
    nombre_corto: 'Línea base metropolitana',
    descripcion_ciudadano:
      'Cifras orientativas de generación y captura por municipio; lectura ejecutiva antes de fijar metas o inversión.',
    pert: pert(30, 60, 110),
    kpis: kpi({ empleos_delta: 3, captura_pct_pts: 1 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'mty-h03',
    nombre_corto: 'Rutas y transferencias',
    descripcion_ciudadano:
      'Coordinación de rutas y puntos de transferencia bajo reglas metropolitanas; trazabilidad básica entre municipios.',
    pert: pert(80, 140, 220),
    kpis: kpi({ pepenadores_delta: 20, captura_pct_pts: 2 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'mty-h04',
    nombre_corto: 'Auditoría oleada 1',
    descripcion_ciudadano:
      'Revisión de lo operado en territorio piloto: participación ciudadana, impurezas y cuellos de botella logísticos.',
    pert: pert(180, 260, 340),
    kpis: kpi({ captura_pct_pts: 2 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
]

export const HITOS_TIMELINE_QRO: Hito[] = [
  {
    id: 'qro-h01',
    nombre_corto: 'Mesa técnica estatal-municipal',
    descripcion_ciudadano:
      'Alineación con lineamientos estatales y tableros existentes; sin sustituir reglamentos municipales.',
    pert: pert(18, 40, 85),
    kpis: kpi({ empleos_delta: 2 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'qro-h02',
    nombre_corto: 'Homologación de fracciones',
    descripcion_ciudadano:
      'Extender el esquema de separación acordado en capital a municipios satélite con matices industriales.',
    pert: pert(45, 90, 160),
    kpis: kpi({ captura_pct_pts: 2, co2e_evitado_ton_delta: 150 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
  {
    id: 'qro-h03',
    nombre_corto: 'Centros de acopio escalonados',
    descripcion_ciudadano:
      'Despliegue progresivo de CAs con reglas claras de pureza y horarios; comunicación vecinal previa.',
    pert: pert(90, 150, 240),
    kpis: kpi({ empleos_delta: 10, pepenadores_delta: 18, captura_pct_pts: 3 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'qro-h04',
    nombre_corto: 'Corte de mitad de plan',
    descripcion_ciudadano:
      'Evaluación de captura y costos; decisión de segunda oleada con evidencia, no solo proyección.',
    pert: pert(200, 280, 380),
    kpis: kpi({ captura_pct_pts: 2 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
]

export const HITOS_TIMELINE_GDL: Hito[] = [
  {
    id: 'gdl-h01',
    nombre_corto: 'Ancla reglamentaria municipal',
    descripcion_ciudadano:
      'Confirmar instrumentos de limpia/RSU por municipio antes de fijar metropoli; Jalisco como marco general.',
    pert: pert(40, 85, 150),
    kpis: kpi({ captura_pct_pts: 1 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
  {
    id: 'gdl-h02',
    nombre_corto: 'Comunicación ciudadana',
    descripcion_ciudadano:
      'Campaña clara de qué va en cada fracción; evitar mensajes que contradigan el reglamento local.',
    pert: pert(35, 75, 130),
    kpis: kpi({ pepenadores_delta: 12, captura_pct_pts: 2 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'gdl-h03',
    nombre_corto: 'Infraestructura piloto',
    descripcion_ciudadano:
      'Primeros puntos de entrega segregada con reglas de operación visibles y personal capacitado.',
    pert: pert(100, 170, 260),
    kpis: kpi({ empleos_delta: 8, captura_pct_pts: 3, co2e_evitado_ton_delta: 320 }),
    es_gate_clave: false,
    es_pico_estacional: false,
  },
  {
    id: 'gdl-h04',
    nombre_corto: 'Coordinación ZM',
    descripcion_ciudadano:
      'Acuerdos mínimos entre municipios colindantes para no desplazar residuos sin reglas ni registro.',
    pert: pert(220, 300, 420),
    kpis: kpi({ captura_pct_pts: 2 }),
    es_gate_clave: true,
    es_pico_estacional: false,
  },
]

export function getHitosForZm(zmId: string): { hitos: Hito[]; catalogLabel: string | null } {
  const z = zmId.toUpperCase()
  if (z === 'MTY') return { hitos: HITOS_TIMELINE_MTY, catalogLabel: null }
  if (z === 'QRO') return { hitos: HITOS_TIMELINE_QRO, catalogLabel: null }
  if (z === 'GDL') return { hitos: HITOS_TIMELINE_GDL, catalogLabel: null }
  if (z === 'SLP') return { hitos: HITOS_TIMELINE_SLP, catalogLabel: null }
  return {
    hitos: HITOS_TIMELINE_SLP,
    catalogLabel: `Catálogo de despliegue SLP · escalado para ZM ${z}`,
  }
}

/** KPI acumulados en el día D según timeline de la ZM (referencia SLP si no hay catálogo propio). */
export function kpisAcumulados(dia_actual: number, empleo_base: number, zmId = 'SLP'): KpisAcumulados {
  const { hitos } = getHitosForZm(zmId)
  return kpisAcumuladosCore(hitos, dia_actual, empleo_base)
}
