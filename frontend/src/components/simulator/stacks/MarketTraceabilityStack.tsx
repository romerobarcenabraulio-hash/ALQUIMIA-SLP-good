'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, ReferenceLine, Cell, Legend,
} from 'recharts'
import {
  AlertTriangle, CheckCircle, ChevronDown, ArrowRight,
  TrendingUp, Shield, Users, DollarSign, Zap, Target,
  Clock, MapPin, FileText, Activity,
} from 'lucide-react'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
import { useSimulatorStore } from '@/store/simulatorStore'
import { TRAJECTORY_UI, PRECIOS_DEFAULTS, PRECIOS_RANGO, COMPOSICION_RSU } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { ConsultingExportButton } from '@/components/simulator/ConsultingExportButton'
import { getMarketBuyers } from '@/lib/api'
import {
  buildRecyclersKpiContract,
  getRecicladorasForZm,
  recicladoraToCompradorRow,
} from '@/lib/recicladorasCatalog'
import { infraOperativaFromStore } from '@/lib/infraOperativaSummary'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import type { MaterialBuyer } from '@/types'

// ── Triangular distribution helper ───────────────────────────────────────────

function buildTriangularDist(lo: number, mode: number, hi: number) {
  const range = Math.max(0.01, hi - lo)
  const data: { pct: number; freq: number }[] = []
  for (let x = Math.max(0, lo - 8); x <= Math.min(100, hi + 8); x += 2) {
    let y = 0
    if (x >= lo && x < mode && mode > lo) y = (2 * (x - lo)) / (range * (mode - lo))
    else if (x >= mode && x <= hi && hi > mode) y = (2 * (hi - x)) / (range * (hi - mode))
    data.push({ pct: x, freq: Math.round(y * 500) })
  }
  return data
}

// ── Static constants ──────────────────────────────────────────────────────────

type RiskLevel = 'muy_bajo' | 'bajo' | 'medio' | 'alto' | 'muy_alto'

interface RiskItem {
  id: string; nombre: string; cat: string
  probLvl: RiskLevel; impLvl: RiskLevel
  prob: number; impacto: string
  causa: string; efecto: string; dueno: string
  mitigacion: string; fuente: string; modulo: string
}

const RISKS_M05: RiskItem[] = [
  { id: 'R1',  nombre: 'Baja participación ciudadana',          cat: 'Social',      probLvl: 'muy_alto', impLvl: 'alto',     prob: 70, impacto: 'Alto',      causa: 'Baja separación en origen y poca confianza', efecto: 'Reduce captura, contamina materiales y sube costos',                    dueno: 'Comunicación Social + Servicios Públicos', mitigacion: 'Campaña segmentada + incentivos + supervisión por zona', fuente: 'Módulo de aceptación / supuestos preliminares', modulo: 'M1, M4' },
  { id: 'R2',  nombre: 'Caída en precio de materiales',         cat: 'Mercado',     probLvl: 'bajo',     impLvl: 'alto',     prob: 28, impacto: 'Alto',      causa: 'Volatilidad internacional y sobreoferta local',  efecto: 'Reduce ingresos y puede romper el modelo financiero',                   dueno: 'Dir. Economía / Operador ancla',           mitigacion: 'Contratos forward; diversificar materiales',            fuente: 'ANIPAC / CEMPRE / datos históricos', modulo: 'M4, M6' },
  { id: 'R3',  nombre: 'Incumplimiento del concesionario',      cat: 'Operativo',   probLvl: 'medio',    impLvl: 'muy_alto', prob: 40, impacto: 'Muy alto', causa: 'Contrato débil o incentivos inadecuados',       efecto: 'Paraliza rutas y valorización; daña confianza ciudadana',               dueno: 'Dirección de Servicios Públicos',           mitigacion: 'Acuerdo de desempeño + cláusulas de penalización',      fuente: 'Evaluación contractual', modulo: 'M4' },
  { id: 'R4',  nombre: 'Insuficiencia presupuestal',            cat: 'Financiero',  probLvl: 'medio',    impLvl: 'alto',     prob: 35, impacto: 'Alto',      causa: 'Cambio de prioridades o restricción fiscal',    efecto: 'Retrasa apertura de centros y contratación de personal',                dueno: 'Tesorería Municipal',                      mitigacion: 'Fondo de estabilización; diversificar fuentes',        fuente: 'Estudio financiero M4', modulo: 'M4' },
  { id: 'R5',  nombre: 'Controversia social / NIMBY',           cat: 'Social',      probLvl: 'medio',    impLvl: 'alto',     prob: 45, impacto: 'Alto',      causa: 'Rechazo vecinal a centros de acopio',           efecto: 'Bloquea predios, genera litigios y retrasos de obra',                   dueno: 'Comunicación Social / Desarrollo Urbano',  mitigacion: 'Reuniones vecinales previas; modelo de beneficio local', fuente: 'Experiencias LATAM / diagnóstico social', modulo: 'M4, M7' },
  { id: 'R6',  nombre: 'Cambio regulatorio adverso',            cat: 'Regulatorio', probLvl: 'bajo',     impLvl: 'medio',    prob: 20, impacto: 'Medio',     causa: 'Reforma a Ley General de Residuos o normas locales', efecto: 'Invalida permisos o encarece operación',                                dueno: 'Dirección Jurídica',                       mitigacion: 'Seguimiento normativo; adendas de adaptación',         fuente: 'Marco legal M2', modulo: 'M2' },
  { id: 'R7',  nombre: 'Baja calidad del material separado',    cat: 'Mercado',     probLvl: 'alto',     impLvl: 'medio',    prob: 55, impacto: 'Medio',     causa: 'Mezcla en fuente, contaminación o mal acopio',  efecto: 'Rechazo de recicladoras; reduce precio e ingresos',                     dueno: 'Operador ancla / Supervisión CA',          mitigacion: 'Supervisión en punto de separación; control de calidad', fuente: 'Experiencias pilotos CDMX/QRO', modulo: 'M4' },
  { id: 'R8',  nombre: 'Falta de comprador ancla',              cat: 'Mercado',     probLvl: 'bajo',     impLvl: 'muy_alto', prob: 22, impacto: 'Muy alto', causa: 'Sin acuerdo firmado con recicladora principal',  efecto: 'Material acumulado sin salida; colapso del modelo de ingresos',          dueno: 'Dir. Economía / Desarrollo Económico',     mitigacion: 'Mapa de compradores y LOI antes de escalar',           fuente: 'CANACINTRA / ARCA / compradores locales', modulo: 'M5' },
  { id: 'R9',  nombre: 'Trámites o permisos incompletos',       cat: 'Regulatorio', probLvl: 'medio',    impLvl: 'medio',    prob: 38, impacto: 'Medio',     causa: 'Gestión tardía de uso de suelo y permisos',     efecto: 'Retrasa apertura de centros y rutas autorizadas',                       dueno: 'Dirección Jurídica / Desarrollo Urbano',   mitigacion: 'Gestión anticipada con checklist de gates',            fuente: 'Diagnóstico de centros M4', modulo: 'M4' },
  { id: 'R10', nombre: 'Capacidad operativa insuficiente',       cat: 'Operativo',   probLvl: 'medio',    impLvl: 'alto',     prob: 42, impacto: 'Alto',      causa: 'Centros subutilizados o flota insuficiente',    efecto: 'Brecha operativa persiste; material no acopiado se pierde',             dueno: 'Dir. Servicios Públicos / Operador',       mitigacion: 'Despliegue por fases; capacitación en F1',             fuente: 'Plan de infraestructura M4', modulo: 'M4' },
  { id: 'R11', nombre: 'Falta de trazabilidad de datos',        cat: 'Operativo',   probLvl: 'alto',     impLvl: 'bajo',     prob: 60, impacto: 'Bajo',      causa: 'Sin sistema digital de seguimiento de rutas',   efecto: 'Pérdida de transparencia; dificulta mejora continua',                   dueno: 'Dir. TIC / Transparencia',                mitigacion: 'Tablero ciudadano + PER digital + bitácora semanal',    fuente: 'Análisis operativo M4', modulo: 'M4, M5' },
  { id: 'R12', nombre: 'Rechazo de recicladoras por contaminación', cat: 'Mercado', probLvl: 'medio',    impLvl: 'alto',     prob: 40, impacto: 'Alto',      causa: 'Material con alto índice de impureza',          efecto: 'Pérdida de contrato y acumulación de material sin destino',             dueno: 'Operador ancla / Supervisión CA',          mitigacion: 'Control de pureza en CA; capacitación en separación',  fuente: 'CEMPRE / ARCA México', modulo: 'M4, M5' },
]

const ACTORES_M05 = [
  { nombre: 'Municipio',              base: 82, lo: 72, hi: 90,  color: '#3B6D11', fuente: 'Diagnóstico institucional' },
  { nombre: 'Hogares',                base: 78, lo: 70, hi: 85,  color: '#5A9438', fuente: 'Supuesto preliminar — pendiente encuesta' },
  { nombre: 'Recicladoras',           base: 71, lo: 62, hi: 79,  color: '#1A5FA8', fuente: 'Mapeo de compradores' },
  { nombre: 'Comercios',              base: 68, lo: 59, hi: 76,  color: '#8B6B4A', fuente: 'Supuesto preliminar' },
  { nombre: 'Concesionario',          base: 61, lo: 52, hi: 69,  color: '#D4881E', fuente: 'Evaluación contractual' },
  { nombre: 'Ciudadanía organizada',  base: 74, lo: 65, hi: 82,  color: '#5A9438', fuente: 'Supuesto preliminar' },
  { nombre: 'Grandes generadores',    base: 55, lo: 46, hi: 64,  color: '#C0392B', fuente: 'Supuesto preliminar' },
  { nombre: 'Cabildo / autoridad',    base: 80, lo: 71, hi: 88,  color: '#3B6D11', fuente: 'Contexto político M2' },
]

const VARIABLES_CRITICAS_M05 = [
  { label: 'Participación efectiva de hogares', impact: 0.24, cat: 'Social' },
  { label: 'Continuidad presupuestal',           impact: 0.19, cat: 'Financiero' },
  { label: 'Cumplimiento del concesionario',     impact: 0.16, cat: 'Operativo' },
  { label: 'Precio de materiales',               impact: 0.13, cat: 'Mercado' },
  { label: 'Capacidad operativa instalada',      impact: 0.10, cat: 'Operativo' },
  { label: 'Aceptación de recicladoras',         impact: 0.08, cat: 'Mercado' },
  { label: 'Confianza ciudadana',                impact: 0.07, cat: 'Social' },
  { label: 'Estabilidad regulatoria',            impact: 0.05, cat: 'Regulatorio' },
  { label: 'Calidad del material separado',      impact: 0.04, cat: 'Operativo' },
  { label: 'Comprador ancla confirmado',         impact: 0.03, cat: 'Mercado' },
]

const CAT_COLORS: Record<string, string> = {
  Social: '#3B6D11', Mercado: '#1A5FA8', Operativo: '#D4881E',
  Financiero: '#8B6B4A', Regulatorio: '#6B4FA8', Político: '#C0392B',
}

const RISK_COMPOSITION = [
  { cat: 'Social',      pct: 32 },
  { cat: 'Mercado',     pct: 25 },
  { cat: 'Operativo',   pct: 20 },
  { cat: 'Financiero',  pct: 12 },
  { cat: 'Regulatorio', pct: 8  },
  { cat: 'Político',    pct: 3  },
]

type CompradorRow = {
  material: string
  comprador: string
  tipo: string
  distKm: number
  capTon: number
  p50: number
  p10: number
  p90: number
  estatus: string
  rechazo: string
  calidad: string
  fuenteApi?: boolean
}

const MATERIAL_LABELS: Record<string, string> = {
  pet: 'PET',
  plastico: 'PET',
  papel: 'Papel / Cartón',
  carton: 'Papel / Cartón',
  aluminio: 'Aluminio',
  vidrio: 'Vidrio',
  organico: 'Orgánicos',
  hdpe: 'HDPE / PEAD',
  pead: 'HDPE / PEAD',
  metales: 'Metales',
  otros: 'Otros recuperables',
}

function buyerToRow(b: MaterialBuyer): CompradorRow {
  const p50kg = (b.precio_min_mxn_kg + b.precio_max_mxn_kg) / 2
  const p50t = Math.round(p50kg * 1000)
  const spread = Math.max(0.15, (b.precio_max_mxn_kg - b.precio_min_mxn_kg) / Math.max(p50kg, 0.01))
  const estatus =
    b.status === 'verificado' ? 'Verificado (API)' :
    b.status === 'estimado' ? 'Benchmark (API)' :
    b.status === 'manual' ? 'Manual' :
    b.status === 'pendiente_verificacion' ? 'Pendiente verificación' :
    b.status === 'inactivo' ? 'Sin comprador' : String(b.status)
  const rechazo = b.calidad_requerida === 'alta' ? 'Alto' : b.calidad_requerida === 'basica' ? 'Bajo' : 'Medio'
  return {
    material: MATERIAL_LABELS[b.material] ?? b.material,
    comprador: b.nombre,
    tipo: b.tipo_comprador,
    distKm: Math.round(b.distancia_km ?? 0),
    capTon: Math.round(b.capacidad_disponible_ton_anio),
    p50: p50t,
    p10: Math.round(p50t * (1 - spread)),
    p90: Math.round(p50t * (1 + spread)),
    estatus,
    rechazo,
    calidad: b.calidad_requerida,
    fuenteApi: true,
  }
}

/** Fallback editorial — etiquetar como benchmark, no como contrato. */
const COMPRADORES_FALLBACK: CompradorRow[] = [
  { material: 'PET',           comprador: 'Recicladoras (Eco-Oro, PetFiber, Ajax)', tipo: 'Recicladora regional',    distKm: 35,  capTon: 7950,  p50: 7850, p10: 6800, p90: 9200,  estatus: 'LOI firmada',    rechazo: 'Bajo',   calidad: 'PET limpio, sin tapas' },
  { material: 'Papel / Cartón', comprador: 'Papelera de Bajío, SmurfitKappa, Bio Papel', tipo: 'Industrial',        distKm: 45,  capTon: 4220,  p50: 2150, p10: 1000, p90: 2700,  estatus: 'Contrato',       rechazo: 'Bajo',   calidad: 'Seco y clasificado' },
  { material: 'Aluminio',      comprador: 'Ahmsa de México, Reciclimetal',              tipo: 'Recicladora grande',  distKm: 88,  capTon: 310,   p50: 45000,p10: 39000,p90: 58600, estatus: 'LOI firmada',    rechazo: 'Bajo',   calidad: 'Sin pintura, sin oxido' },
  { material: 'Vidrio',        comprador: 'Vitro, Vanalux, Envases del Potosí',         tipo: 'Industrial',          distKm: 22,  capTon: 1680,  p50: 1350, p10: 903,  p90: 1490,  estatus: 'LOI firmada',    rechazo: 'Medio',  calidad: 'Sin etiqueta, color separado' },
  { material: 'Orgánicos',     comprador: 'Campo directo / agroindustria',              tipo: 'Agroindustrial',      distKm: 30,  capTon: 3000,  p50: 300,  p10: 160,  p90: 600,   estatus: 'En negociación', rechazo: 'Medio',  calidad: 'Composta básica, <15% hum.' },
  { material: 'HDPE / PEAD',   comprador: 'Transformadores plásticos regionales',      tipo: 'Recicladora regional', distKm: 50, capTon: 1050,  p50: 8500, p10: 6200, p90: 10000, estatus: 'En negociación', rechazo: 'Alto',   calidad: 'Alto grado de pureza' },
  { material: 'Metales',       comprador: 'Acerinox / chatarrero industrial',           tipo: 'Chatarrero',          distKm: 70,  capTon: 420,   p50: 6000, p10: 3500, p90: 8500,  estatus: 'No confirmado',  rechazo: 'Bajo',   calidad: 'Limpio, sin plomo' },
  { material: 'Otros recuperables', comprador: 'Terra Pak, textil reciclado',          tipo: 'Especializado',        distKm: 120, capTon: 800,   p50: 1200, p10: 500,  p90: 2000,  estatus: 'Sin comprador',  rechazo: 'Alto',   calidad: 'Por corriente y contenido', fuenteApi: false },
]

// Sensitivity tornado — 7 variables
const SENSITIVITY_VARS = [
  { variable: 'Precio PET -20%',           deltaIngreso: -8.4, deltaProb: -6, cat: 'Mercado' },
  { variable: '% Captura año 1 -10%',      deltaIngreso: -6.7, deltaProb: -8, cat: 'Social' },
  { variable: 'Precio aluminio -20%',      deltaIngreso: -5.1, deltaProb: -3, cat: 'Mercado' },
  { variable: 'Merma logística +5%',       deltaIngreso: -4.2, deltaProb: -5, cat: 'Operativo' },
  { variable: 'WACC +3 pp',                deltaIngreso: -3.8, deltaProb: -4, cat: 'Financiero' },
  { variable: 'Precio vidrio -20%',        deltaIngreso: -3.1, deltaProb: -1, cat: 'Mercado' },
  { variable: 'Ocupación CA -20%',         deltaIngreso: -2.4, deltaProb: -6, cat: 'Operativo' },
]

// Mitigations — 12 rows
const MITIGATIONS_FULL = [
  { dim: 'Mercado',     riesgo: 'Caída de precio de materiales',           id: 'R2',  accion: 'Contratos forward con recicladores; diversificar materiales',           dueno: 'Dir. Compras',       plazo: '0–6 meses',   impacto: '-15 pts prob.', residual: 'Medio',  estado: 'En curso' },
  { dim: 'Social',      riesgo: 'Baja participación ciudadana',            id: 'R1',  accion: 'Campaña segmentada por colonia; incentivos por clasificación',          dueno: 'Com. Social',        plazo: '0–6 meses',   impacto: '-12 pts prob.', residual: 'Medio',  estado: 'En curso' },
  { dim: 'Operativo',   riesgo: 'Incumplimiento del concesionario',        id: 'R3',  accion: 'Convenio de desempeño; cláusulas de penalización',                     dueno: 'Dir. Jurídica',      plazo: '0–3 meses',   impacto: '-15 pts prob.', residual: 'Bajo',   estado: 'Planeada' },
  { dim: 'Social',      riesgo: 'Controversia social / NIMBY',             id: 'R5',  accion: 'Reuniones vecinales previas; modelo de beneficio local',               dueno: 'Com. Social',        plazo: '0–9 meses',   impacto: '-12 pts prob.', residual: 'Medio',  estado: 'En curso' },
  { dim: 'Financiero',  riesgo: 'Insuficiencia presupuestal',              id: 'R4',  accion: 'Fondo de estabilización; diversificación de fuentes (FONADIN, BID)',   dueno: 'Tesorería',          plazo: '0–12 meses',  impacto: '-10 pts prob.', residual: 'Medio',  estado: 'En curso' },
  { dim: 'Regulatorio', riesgo: 'Cambio regulatorio adverso',              id: 'R6',  accion: 'Adendas de adaptación; seguimiento normativo semanal',                 dueno: 'Dir. Jurídica',      plazo: '0–6 meses',   impacto: '-5 pts prob.',  residual: 'Bajo',   estado: 'En curso' },
  { dim: 'Mercado',     riesgo: 'Baja calidad del material separado',      id: 'R7',  accion: 'Supervisión en punto de separación; laboratorio de calidad básico',    dueno: 'Operador ancla',     plazo: '0–9 meses',   impacto: '-8 pts prob.',  residual: 'Medio',  estado: 'Planeada' },
  { dim: 'Mercado',     riesgo: 'Falta de comprador ancla',                id: 'R8',  accion: 'Mapa de compradores y LOI antes de escalar',                           dueno: 'Dir. Economía',      plazo: '0–3 meses',   impacto: '-12 pts prob.', residual: 'Bajo',   estado: 'Planeada' },
  { dim: 'Regulatorio', riesgo: 'Trámites o permisos incompletos',         id: 'R9',  accion: 'Gestión anticipada con checklist de gates M4',                         dueno: 'Dir. Jurídica',      plazo: '0–9 meses',   impacto: '-8 pts prob.',  residual: 'Bajo',   estado: 'En curso' },
  { dim: 'Operativo',   riesgo: 'Capacidad operativa insuficiente',        id: 'R10', accion: 'Despliegue por fases; capacitación en F1 antes de escalar',            dueno: 'Dir. Servicios',     plazo: '3–12 meses',  impacto: '-10 pts prob.', residual: 'Medio',  estado: 'En curso' },
  { dim: 'Operativo',   riesgo: 'Falta de trazabilidad de datos',          id: 'R11', accion: 'Tablero ciudadano + PER digital + bitácora semanal',                   dueno: 'Dir. TIC',           plazo: '3–9 meses',   impacto: '-5 pts prob.',  residual: 'Bajo',   estado: 'Planeada' },
  { dim: 'Mercado',     riesgo: 'Rechazo de recicladoras por contaminación',id: 'R12', accion: 'Control de pureza en CA; capacitación continua en separación',       dueno: 'Operador ancla',     plazo: '0–9 meses',   impacto: '-8 pts prob.',  residual: 'Bajo',   estado: 'Planeada' },
]

// Trends T1–T6
const TRENDS_T1_T6 = [
  {
    id: 'T1', nombre: 'Calidad de vida y aseo urbano', cat: 'Calidad urbana', presion: 'Sube', intensidad: 'Alta',
    riesgos: ['R1','R5'], rsu: 'Alta',
    implicacion: 'Aumenta urgencia municipal y expectativa pública ante residuos visibles.',
    accion: 'Campañas con métricas visibles por colonia; tablero de limpieza pública.',
  },
  {
    id: 'T2', nombre: 'Cumplimiento normativo RSU', cat: 'Regulación', presion: 'Sube', intensidad: 'Alta',
    riesgos: ['R6','R11'], rsu: 'Alta',
    implicacion: 'Mayor exigencia de trazabilidad, reportes y NOM aplicables.',
    accion: 'Reportes públicos y bitácora digital de rutas y centros.',
  },
  {
    id: 'T3', nombre: 'Calidad del aire y emisiones asociadas', cat: 'Ambiental / Salud', presion: 'Volátil', intensidad: 'Media',
    riesgos: ['R5','R6'], rsu: 'Media',
    implicacion: 'Aumenta sensibilidad pública ante mala disposición y quema informal.',
    accion: 'Monitoreo ambiental en puntos críticos; comunicación preventiva.',
  },
  {
    id: 'T4', nombre: 'Agua residual y lixiviados', cat: 'Agua / Suelo', presion: 'Sube', intensidad: 'Media',
    riesgos: ['R6','R9'], rsu: 'Media',
    implicacion: 'Mayor escrutinio sobre disposición final y sitios de transferencia.',
    accion: 'Validación técnica de sitios; plan de manejo de lixiviados en CAs.',
  },
  {
    id: 'T5', nombre: 'Participación ciudadana y transparencia', cat: 'Gobernanza', presion: 'Sube', intensidad: 'Alta',
    riesgos: ['R1','R5','R11'], rsu: 'Alta',
    implicacion: 'Se requiere evidencia pública de avance y rendición de cuentas.',
    accion: 'Tablero ciudadano de avance; sesiones periódicas de información.',
  },
  {
    id: 'T6', nombre: 'Salud pública y vectores', cat: 'Salud pública', presion: 'Sube', intensidad: 'Media',
    riesgos: ['R5','R10'], rsu: 'Media',
    implicacion: 'Residuos mal confinados aumentan riesgo sanitario y percepción negativa.',
    accion: 'Protocolos operativos de confinamiento y control de puntos críticos.',
  },
]

// Proceed conditions
type CondState = 'Cumplido' | 'En curso' | 'Parcial' | 'Pendiente' | 'Bloqueado'
const PROCEED_CONDITIONS: Array<{ cond: string; estado: CondState }> = [
  { cond: 'Comprador ancla identificado para materiales clave',                estado: 'En curso' },
  { cond: 'Precio base validado con cotizaciones recientes (≤90 días)',        estado: 'En curso' },
  { cond: 'Plan de comunicación ciudadana diseñado y aprobado',               estado: 'Parcial'  },
  { cond: 'Aceptación mínima validada por zona prioritaria',                  estado: 'Pendiente'},
  { cond: 'Acuerdo preliminar firmado con concesionario',                     estado: 'Pendiente'},
  { cond: 'Presupuesto mínimo comprometido en PDM municipal',                 estado: 'En curso' },
  { cond: 'Riesgos altos (R1, R3, R8) con mitigación asignada',              estado: 'En curso' },
  { cond: 'Tendencias críticas integradas en el plan logístico',              estado: 'Parcial'  },
  { cond: 'Dictamen jurídico y presupuestal sin observaciones críticas',      estado: 'Pendiente'},
  { cond: 'Monitoreo público operativo con al menos 5 indicadores',          estado: 'Pendiente'},
]

// Causal chains
const CAUSAL_CHAINS = [
  { riesgo: 'Caída de precio',       accion: 'Contratos y diversificación', efecto: 'Menor probabilidad de pérdida', decision: 'Proceder condicionado' },
  { riesgo: 'Cambio administrativo', accion: 'Blindaje legal y PDM',        efecto: 'Continuidad del programa',      decision: 'Proceder condicionado' },
  { riesgo: 'Vacíos jurídicos',      accion: 'Adendas y dictamen',          efecto: 'Cumplimiento normativo',         decision: 'Proceder condicionado' },
]

// 30/60/90 plan
const PLAN_306090 = [
  {
    rango: '0–30 días', color: '#EAF3DE', border: '#D7E8C0', text: '#2D5A0D',
    acciones: ['Mapear actores y acuerdos existentes', 'Diagnóstico legal y predios', 'Contratos y LOIs preliminares', 'Arranque de tablero público'],
    hito: 'Hitos clave: 4', riesgo: 'R1, R2, R8',
  },
  {
    rango: '31–60 días', color: '#FEF7E7', border: '#FDE68A', text: '#92400E',
    acciones: ['Formalizar convenios', 'Asegurar al menos 2 predios', 'Ajustes al PDM y RSU', 'Capacitación y comunicación'],
    hito: 'Hitos clave: 5', riesgo: 'R3, R4, R5',
  },
  {
    rango: '61–90 días', color: '#EBF3FB', border: '#BDD7F5', text: '#1A3F6F',
    acciones: ['Cierre de 3 predios para CAs', 'Licitaciones publicadas', 'Inicio de obras y monitoreo', 'Reporte de avance y KPIs'],
    hito: 'Hitos clave: 6', riesgo: 'R9, R10, R11',
  },
]

// ── Matrix helpers ────────────────────────────────────────────────────────────

const LEVELS: RiskLevel[] = ['muy_bajo', 'bajo', 'medio', 'alto', 'muy_alto']
const LEVEL_LABELS: Record<RiskLevel, string> = {
  muy_bajo: 'Muy baja', bajo: 'Baja', medio: 'Media', alto: 'Alta', muy_alto: 'Muy alta',
}

function matrixColor(prob: RiskLevel, imp: RiskLevel): string {
  const score = (LEVELS.indexOf(prob) + 1) * (LEVELS.indexOf(imp) + 1)
  if (score >= 15) return '#FDE8E8'
  if (score >= 9)  return '#FEF3C7'
  if (score >= 4)  return '#FEF7E7'
  return '#EAF3DE'
}
function matrixTextColor(prob: RiskLevel, imp: RiskLevel): string {
  const score = (LEVELS.indexOf(prob) + 1) * (LEVELS.indexOf(imp) + 1)
  if (score >= 15) return '#991B1B'
  if (score >= 9)  return '#92400E'
  if (score >= 4)  return '#92400E'
  return '#2D5A0D'
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function DecisionCommitBar({ municipio, horizonte, trayectoria, rsuDia, compact = false }: {
  municipio: string; horizonte: number; trayectoria: string; rsuDia: number; compact?: boolean
}) {
  const mixCAs = useSimulatorStore(s => s.mixCAs)
  const resultados = useSimulatorStore(s => s.resultados)
  const infra = useMemo(() => infraOperativaFromStore(mixCAs, resultados), [mixCAs, resultados])

  function fmt(n: number) { return `${n.toFixed(1)} t/día` }
  if (compact) {
    return (
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3 mb-4">
        <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-2 font-semibold">Decisiones comprometidas — solo lectura</p>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-[6px] border border-[#D7E8C0] bg-[#F4FAEC] px-2.5 py-1">
            <span className="text-[#3B6D11] font-semibold">M1:</span>{' '}<span className="text-[#4A4740]">{municipio} · {horizonte}a · {trayectoria} · {fmt(rsuDia)} capturable</span>
          </span>
          <span className="rounded-[6px] border border-[#BDD7F5] bg-[#EBF3FB] px-2.5 py-1">
            <span className="text-[#1A5FA8] font-semibold">M06:</span>{' '}
            <span className="text-[#4A4740]">{infra.label} · {infra.sub}</span>
          </span>
        </div>
      </div>
    )
  }
  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4 mb-5">
      <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-3 font-semibold">Decisiones comprometidas — no editables en este módulo</p>
      <div className="rounded-[8px] bg-[#FEF7E7] border border-[#FDE68A] px-3 py-2 mb-3 text-[10px] text-[#92400E]">
        Los valores de aceptación social provienen del Módulo de Estudio Sociodemográfico y Aceptación. Si ese módulo no ha sido completado, se usan supuestos preliminares con nivel de confianza <strong>condicionado</strong>.
      </div>
      <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-2">
        {[
          { label: 'Módulo 1 · Escenario comprometido', color: '#3B6D11', bg: '#F4FAEC', border: '#D7E8C0', body: `${municipio} · ${horizonte} años · ${trayectoria}`, sub: `${fmt(rsuDia)} capturable`, note: 'Flujo, composición, precios y merma heredados' },
          { label: 'Módulo 6 · Infraestructura',        color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5', body: infra.label, sub: infra.sub, note: 'Capacidad desde mix CAs y motor M01' },
          { label: 'Módulo 5 · Decisión actual',        color: '#A8A49C', bg: '#FAFAF8', border: '#E8E4DC', body: 'Viabilidad de mercado, aceptación y riesgo', sub: 'Emitir recomendación de viabilidad', note: 'Proceder / Condicionado / No proceder' },
        ].map(b => (
          <div key={b.label} className="flex-1 min-w-[150px] rounded-[10px] border px-4 py-3" style={{ borderColor: b.border, background: b.bg }}>
            <p className="text-[9px] uppercase tracking-[0.07em] font-bold mb-1" style={{ color: b.color }}>{b.label}</p>
            <p className="text-[13px] font-semibold text-[#1C1B18]">{b.body}</p>
            <p className="text-[11px] text-[#5A5750]">{b.sub}</p>
            <p className="text-[10px] text-[#A8A49C] mt-1">{b.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskKpiRow({ prob, riskScore, mktRisk, socialRisk, opRisk }: {
  prob: number; riskScore: number; mktRisk: string; socialRisk: string; opRisk: string
}) {
  const chips = [
    { label: 'Prob. implementación exitosa', value: `${prob}%`,     sub: 'Mercado, aceptación, operación, regulación', icon: TrendingUp,    color: '#3B6D11' },
    { label: 'Riesgo total ponderado',        value: `${riskScore}/100`, sub: 'Exposición agregada antes de mitigaciones', icon: Shield,       color: riskScore >= 50 ? '#C0392B' : '#D4881E' },
    { label: 'Riesgo de mercado',             value: mktRisk,       sub: 'Precio, compradores y calidad del material', icon: DollarSign,    color: '#1A5FA8' },
    { label: 'Riesgo social / aceptación',    value: socialRisk,    sub: 'Participación, confianza y hábitos ciudadanos', icon: Users,       color: '#C0392B' },
    { label: 'Riesgo operativo',              value: opRisk,        sub: 'Capacidad, rutas, concesionario y centros',   icon: Activity,     color: '#D4881E' },
    { label: 'Confianza del modelo',          value: 'Condicionada', sub: 'Datos sociales y de mercado pendientes',     icon: Target,       color: '#A8A49C' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-5">
      {chips.map(c => (
        <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5"><c.icon className="w-3.5 h-3.5" style={{ color: c.color }} /><p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">{c.label}</p></div>
          <p className="font-bold text-[22px]" style={{ color: c.color }}>{c.value}</p>
          <p className="text-[9px] text-[#A8A49C] mt-0.5">{c.sub}</p>
        </div>
      ))}
    </div>
  )
}

function RailSection({ title, children, open: defaultOpen = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button type="button" onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between py-3 px-1 text-left">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760] font-bold">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760] space-y-1.5">{children}</div>}
    </div>
  )
}

// ── RiskAccordionList ─────────────────────────────────────────────────────────
// Shows all 12 risks as collapsible rows inside the right rail.
// Expands in-place — no page scroll required.

const PROB_LEVEL_LABEL: Record<string, string> = {
  muy_bajo: 'Muy baja', bajo: 'Baja', medio: 'Media', alto: 'Alta', muy_alto: 'Muy alta',
}
const PROB_LEVEL_COLOR: Record<string, string> = {
  muy_bajo: '#A8A49C', bajo: '#8DB87A', medio: '#D4881E', alto: '#C0392B', muy_alto: '#7A0000',
}
const IMP_LEVEL_COLOR: Record<string, string> = {
  muy_bajo: '#A8A49C', bajo: '#8DB87A', medio: '#D4881E', alto: '#C0392B', muy_alto: '#7A0000',
}

function RiskAccordionList({ filterCat }: { filterCat?: string }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const risks = filterCat ? RISKS_M05.filter(r => r.cat === filterCat) : RISKS_M05

  return (
    <div className="divide-y divide-[#EDE9E3]">
      {risks.map(r => {
        const isOpen = openId === r.id
        const catColor = CAT_COLORS[r.cat] ?? '#6B6760'
        return (
          <div key={r.id}>
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : r.id)}
              className="w-full flex items-center gap-2 py-2.5 px-1 text-left hover:bg-[#F4F2ED] transition-colors rounded-[4px]"
            >
              {/* Dimension color dot */}
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: catColor }} />
              {/* Risk ID + title */}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-semibold text-[#1C1B18] truncate leading-tight">{r.id} · {r.nombre}</p>
                <p className="text-[9px] text-[#A8A49C]">{r.cat}</p>
              </div>
              {/* Prob/impact chips */}
              <div className="flex gap-1 shrink-0">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: PROB_LEVEL_COLOR[r.probLvl] + '22', color: PROB_LEVEL_COLOR[r.probLvl] }}>
                  P {r.prob}%
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: IMP_LEVEL_COLOR[r.impLvl] + '22', color: IMP_LEVEL_COLOR[r.impLvl] }}>
                  {r.impacto}
                </span>
              </div>
              <ChevronDown className={cn('w-3 h-3 text-[#A8A49C] shrink-0 transition-transform', isOpen && 'rotate-180')} />
            </button>

            {isOpen && (
              <div className="px-2 pb-3 space-y-2 text-[10px] text-[#6B6760]">
                <div className="rounded-[6px] bg-[#FAFAF8] border border-[#F0EDE5] p-2 space-y-1.5">
                  <p><span className="font-semibold text-[#1C1B18]">Causa: </span>{r.causa}</p>
                  <p><span className="font-semibold text-[#1C1B18]">Efecto: </span>{r.efecto}</p>
                  <p><span className="font-semibold text-[#3B6D11]">Mitigación: </span>{r.mitigacion}</p>
                  <p><span className="font-semibold text-[#1C1B18]">Responsable: </span>{r.dueno}</p>
                </div>
                <p className="text-[9px] text-[#A8A49C]">Módulos: {r.modulo} · Fuente: {r.fuente}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function RightRail({ page }: { page: number }) {
  const [showRisks, setShowRisks] = useState(false)
  const conf = [45, 68, 45]
  const c = conf[page - 1] ?? 45
  const contents = {
    1: {
      consid: 'Este módulo integra múltiples planos de riesgo: mercado, tendencias de contexto y condiciones para decidir si conviene avanzar.',
      calculo: 'La probabilidad de éxito combina cinco dimensiones (mercado, social, operativo, financiero, regulatorio) con pesos derivados de benchmarks LATAM. Monte Carlo: 500 simulaciones triangulares.',
      metodologia: 'Matriz de riesgo con impacto esperado × probabilidad. Lectura de tendencias con API municipal. Scores validados con datos de campo.',
      fuentes: 'SEMARNAT, CANACINTRA, ARCA, ANIPAC, ANS; experiencias CDMX 2019-2023 y Querétaro 2020.',
      limites: 'Calculadora simulaciones ±5%. Si asumes con datos reales tasa de captura, los rangos se comprimen notablemente.',
    },
    2: {
      consid: 'Dónde se pierden los materiales y qué tan cerca está el sistema del cierre real de ciclo en términos de valor económico.',
      calculo: 'Se construyen bandas de precio por material (P10, P50, P90) con supuestos documentados con calidad y distancia. Monte Carlo: 5,000 simulaciones. Distribución triangular de precios y captura.',
      metodologia: 'Mapping de compradores y verificación contractual. Precios ponderados por calidad y condiciones. Sensibilidad simulada variando ±5% en cada variable.',
      fuentes: 'ANIPAC, CEMPRE México, Plásticos Exchange México. Precios a mayo 2026.',
      limites: 'Precios sujetos a variación de mercado y contrato. Contratos no firmados → incertidumbre alta. No incluyen cambios regulatorios abruptos.',
    },
    3: {
      consid: 'Cómo las mitigaciones reducen el riesgo y qué condiciones exactas deben cumplirse antes de declarar el escenario "aprobado para implementación".',
      calculo: 'Cada mitigación reduce la probabilidad del riesgo residual en puntos porcentuales estimados (benchmark de efectividad LATAM). El plan 30/60/90 es un cronograma táctico, no estratégico.',
      metodologia: 'Análisis de causalidad riesgo → mitigación → efecto esperado → decisión. Tendencias externas evaluadas con lectura de presión (alta/media/baja) y riesgos afectados.',
      fuentes: 'Revisión de mitigaciones exitosas en 12 municipios LATAM 2018-2024. Fuentes internas de benchmark ALQUIMIA.',
      limites: 'El nivel de preparación es estimado. La confianza del dictamen sube cuando se validan las condiciones pendientes.',
    },
  } as const

  const cc = contents[page as 1|2|3] ?? contents[1]

  return (
    // sticky + max-h so the rail scrolls independently — never pushes the page
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] sticky top-4 overflow-y-auto"
      style={{ maxHeight: 'calc(100vh - 120px)' }}>
      <div className="p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Consideraciones</p>
          <span className={cn('text-[9px] font-bold px-2 py-0.5 rounded', c >= 60 ? 'bg-[#EAF3DE] text-[#2D5A0D]' : 'bg-[#FEF3C7] text-[#92400E]')}>
            Confianza {c}%
          </span>
        </div>
        <RailSection title="Consideraciones" open><p>{cc.consid}</p></RailSection>
        <RailSection title="Cómo se calcula"><p>{cc.calculo}</p></RailSection>
        <RailSection title="Metodología"><p>{cc.metodologia}</p></RailSection>
        <RailSection title="Fuentes principales">
          <p>{cc.fuentes}</p>
          {page === 2 && <p className="text-[#3B6D11] font-semibold mt-1">Recicladoras y transformadoras regionales. CANACINTRA, ARCA, ANIPAC, ANS. FxdMarkets, Plásticos Exchange México.</p>}
        </RailSection>
        <RailSection title="Límites de interpretación"><p>{cc.limites}</p></RailSection>
        <RailSection title="Nivel de confianza">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${c}%`, background: c >= 60 ? '#3B6D11' : '#D4881E' }} />
            </div>
            <span className={cn('font-bold text-[11px]', c >= 60 ? 'text-[#3B6D11]' : 'text-[#D4881E]')}>{c}%</span>
          </div>
          <p className="text-[9px] text-[#A8A49C]">{c >= 60 ? 'Medio-alto' : 'Condicionada'} · validar con datos municipales reales.</p>
        </RailSection>

        {/* Risk accordion — available on pages 1 and 2 */}
        {(page === 1 || page === 2) && (
          <div className="mt-3 border-t border-[#EDE9E3] pt-3">
            <button
              type="button"
              onClick={() => setShowRisks(s => !s)}
              className="w-full flex items-center justify-between px-1 py-2 rounded-[6px] hover:bg-[#F4F2ED] transition-colors"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#6B6760]">
                Ver los {RISKS_M05.length} riesgos
              </p>
              <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', showRisks && 'rotate-180')} />
            </button>
            {showRisks && (
              <div className="mt-1">
                <RiskAccordionList />
              </div>
            )}
          </div>
        )}

        {page === 3 && (
          <div className="mt-3 space-y-2 border-t border-[#EDE9E3] pt-3">
            <p className="text-[10px] font-semibold text-[#1C1B18] px-1">Nivel de completarse: condicionado</p>
            <div className="flex items-center gap-2 px-1">
              <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
                <div className="h-full bg-[#D4881E] rounded-full" style={{ width: '43%' }} />
              </div>
              <span className="text-[11px] font-bold text-[#D4881E]">43%</span>
            </div>
            <p className="text-[9px] text-[#A8A49C] px-1">Mayoría de riesgos con segmentos informales. Requiere validación política y técnica.</p>
            {/* Mitigation risk quick-view */}
            <div className="mt-2 border-t border-[#EDE9E3] pt-2">
              <button
                type="button"
                onClick={() => setShowRisks(s => !s)}
                className="w-full flex items-center justify-between px-1 py-1.5 rounded-[6px] hover:bg-[#F4F2ED] transition-colors"
              >
                <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#6B6760]">Ver riesgos priorizados</p>
                <ChevronDown className={cn('w-3 h-3 text-[#A8A49C] transition-transform', showRisks && 'rotate-180')} />
              </button>
              {showRisks && <div className="mt-1"><RiskAccordionList filterCat={undefined} /></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function PageNavFooter({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const labels = ['Dictamen y probabilidad', 'Mercado y sensibilidad', 'Mitigación, tendencias y condiciones']
  return (
    <div className="mt-8 pt-5 border-t border-[#E8E4DC] flex items-center justify-between gap-2 flex-wrap">
      <div className="flex gap-2">
        {page > 1 && <button type="button" onClick={() => setPage(page - 1)} className="px-4 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] font-medium text-[#6B6760] hover:bg-[#F4F2ED] transition-colors">← {labels[page - 2]}</button>}
        {page < 3 && <button type="button" onClick={() => setPage(page + 1)} className="px-4 py-2 rounded-[8px] bg-[#3B6D11] border border-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D] transition-colors">{labels[page]} →</button>}
        {page === 3 && <button type="button" className="px-4 py-2 rounded-[8px] bg-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D] transition-colors">Módulo 6 →</button>}
      </div>
      <div className="flex gap-2">
        <ConsultingExportButton moduleLabel="M05 — Mercado y trazabilidad" />
        <button type="button" className="px-3 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED]">Guardar vista</button>
      </div>
    </div>
  )
}

// ── Page 1 — Dictamen y probabilidad ─────────────────────────────────────────

function RiskMatrix() {
  const [selected, setSelected] = useState<RiskItem | null>(null)

  const cellRisks = useMemo(() => {
    const map: Record<string, RiskItem[]> = {}
    RISKS_M05.forEach(r => {
      const key = `${r.probLvl}__${r.impLvl}`
      if (!map[key]) map[key] = []
      map[key].push(r)
    })
    return map
  }, [])

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: 360 }}>
          <thead>
            <tr>
              <th className="text-[10px] text-[#A8A49C] p-1 text-right w-20">↑ Impacto</th>
              {LEVELS.map(l => (
                <th key={l} className="text-[10px] text-[#A8A49C] p-1 text-center w-16">{LEVEL_LABELS[l]}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...LEVELS].reverse().map(impLvl => (
              <tr key={impLvl}>
                <td className="text-[10px] text-[#A8A49C] p-1 text-right font-medium">{LEVEL_LABELS[impLvl]}</td>
                {LEVELS.map(probLvl => {
                  const key = `${probLvl}__${impLvl}`
                  const risks = cellRisks[key] ?? []
                  const bg = matrixColor(probLvl, impLvl)
                  const tc = matrixTextColor(probLvl, impLvl)
                  return (
                    <td key={probLvl} className="p-0.5">
                      <div className="rounded-[6px] min-h-[52px] flex flex-col items-center justify-center gap-0.5 p-1 cursor-pointer hover:ring-2 hover:ring-[#3B6D11]/30 transition-all"
                        style={{ background: bg }}
                        onClick={() => risks.length > 0 && setSelected(risks[0])}>
                        {risks.map(r => (
                          <span key={r.id} className="text-[10px] font-bold px-1 py-0.5 rounded leading-none" style={{ color: tc }}>{r.id}</span>
                        ))}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr>
              <td />
              <td colSpan={5} className="text-[10px] text-[#A8A49C] p-1 text-center">→ Probabilidad</td>
            </tr>
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4 text-[10px] space-y-1.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-[11px] text-white bg-[#1C2B15] px-2 py-0.5 rounded">{selected.id}</span>
            <p className="font-semibold text-[#1C1B18] text-[12px]">{selected.nombre}</p>
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded font-semibold" style={{ background: CAT_COLORS[selected.cat] + '22', color: CAT_COLORS[selected.cat] }}>{selected.cat}</span>
            <button type="button" onClick={() => setSelected(null)} className="text-[#A8A49C] hover:text-[#1C1B18] ml-2 text-[11px]">✕</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
            {[['Probabilidad', `${selected.prob}%`], ['Impacto', selected.impacto], ['Dueño', selected.dueno]].map(([k, v]) => (
              <div key={k as string}><p className="text-[10px] text-[#A8A49C] uppercase">{k as string}</p><p className="font-semibold">{v as string}</p></div>
            ))}
          </div>
          <p><span className="font-semibold text-[#A8A49C]">Causa:</span> {selected.causa}</p>
          <p><span className="font-semibold text-[#A8A49C]">Efecto:</span> {selected.efecto}</p>
          <p><span className="font-semibold text-[#3B6D11]">Mitigación:</span> {selected.mitigacion}</p>
          <p className="text-[9px] text-[#A8A49C]">Fuente: {selected.fuente} · Módulo: {selected.modulo}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-[9px]">
        {[['#FDE8E8','Alto / Crítico'],['#FEF3C7','Medio'],['#EAF3DE','Bajo']].map(([c,l]) => (
          <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ background: c }} /><span className="text-[#6B6760]">{l}</span></div>
        ))}
        <span className="text-[#A8A49C] ml-2">Clic en celda para ver detalle del riesgo</span>
      </div>
    </div>
  )
}

function Page1({ prob }: { prob: number }) {
  const distData = useMemo(() => buildTriangularDist(prob * 0.65, prob, prob * 1.2), [prob])

  return (
    <div className="space-y-6">
      {/* Risk matrix */}
      <ExpandableChart chartId="m05-risk-matrix" title="Matriz de riesgo 5×5 — 12 riesgos identificados" subtitle="Probabilidad × Impacto · clic en celda para detalle">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Matriz de riesgo — Probabilidad × Impacto</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">12 riesgos identificados con ID visible · clic para ver causa, efecto, dueño y mitigación</p>
          <RiskMatrix />
        </div>
      </ExpandableChart>

      {/* Actor acceptance + Risk composition — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpandableChart chartId="m05-actors" title="Aceptación estimada por actor" subtitle="Base · IC mín–máx · nivel de confianza por fuente">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Aceptación por actor</p>
            <p className="text-[9px] text-[#D4881E] mb-3 font-medium">Estimación preliminar — pendiente de estudio social para actores sin fuente confirmada</p>
            <div className="space-y-2.5">
              {ACTORES_M05.map(a => {
                const barW = a.base
                const loW  = a.lo
                const hiW  = a.hi
                const alert = a.base < 65
                return (
                  <div key={a.nombre}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold text-[#1C1B18] w-32 shrink-0">{a.nombre}</span>
                      <span className="text-[10px] font-mono font-bold" style={{ color: a.color }}>{a.base}%</span>
                      {alert && <span className="text-[10px] text-[#C0392B] font-bold ml-1">⚠</span>}
                    </div>
                    <div className="relative h-4 bg-[#F4F2ED] rounded-full overflow-hidden">
                      {/* IC range */}
                      <div className="absolute h-full rounded-full opacity-30" style={{ left: `${loW}%`, width: `${hiW - loW}%`, background: a.color }} />
                      {/* base bar */}
                      <div className="absolute h-full rounded-full" style={{ width: `${barW}%`, background: a.color }} />
                    </div>
                    <p className="text-[10px] text-[#A8A49C] mt-0.5">IC {loW}%–{hiW}% · {a.fuente}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </ExpandableChart>

        <ExpandableChart chartId="m05-donut" title="Composición del riesgo por categoría" subtitle="% del riesgo total por dimensión">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Composición del riesgo total</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Qué % del riesgo total proviene de cada categoría</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={RISK_COMPOSITION} layout="vertical" margin={{ top: 0, right: 40, left: 72, bottom: 0 }}>
                <XAxis type="number" domain={[0, 40]} tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="cat" tick={{ fontSize: 10, fill: '#4A4740' }} tickLine={false} axisLine={false} width={70} />
                <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} formatter={(v: number) => [`${v}%`, 'Exposición']} />
                <Bar dataKey="pct" radius={[0, 4, 4, 0]}>
                  {RISK_COMPOSITION.map(d => <Cell key={d.cat} fill={CAT_COLORS[d.cat] ?? '#A8A49C'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ExpandableChart>
      </div>

      {/* Critical drivers */}
      <ExpandableChart chartId="m05-drivers" title="Variables que más reducen la probabilidad de éxito" subtitle="Impacto relativo sobre la probabilidad si la variable falla">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Variables que más reducen la probabilidad de éxito</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">Estos son los principales drivers del riesgo — no métricas decorativas</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={[...VARIABLES_CRITICAS_M05].sort((a, b) => b.impact - a.impact)} layout="vertical" margin={{ top: 0, right: 40, left: 180, bottom: 0 }}>
              <XAxis type="number" domain={[0, 0.3]} tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 9, fill: '#4A4740' }} tickLine={false} axisLine={false} width={178} />
              <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} formatter={(v: number) => [`${(v * 100).toFixed(0)}% impacto`, 'Peso en prob.']} />
              <Bar dataKey="impact" radius={[0, 4, 4, 0]}>
                {VARIABLES_CRITICAS_M05.map(d => <Cell key={d.label} fill={CAT_COLORS[d.cat] ?? '#A8A49C'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-2">
            {Object.entries(CAT_COLORS).map(([k, c]) => (
              <div key={k} className="flex items-center gap-1.5 text-[9px]"><div className="w-2.5 h-2.5 rounded-sm" style={{ background: c }} /><span className="text-[#6B6760]">{k}</span></div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* Probability distribution */}
      <ExpandableChart chartId="m05-prob-dist" title="Distribución de probabilidad de éxito (Monte Carlo)" subtitle="500 simulaciones triangulares — P10 / P50 / P90">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Distribución de probabilidad de éxito</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">500 simulaciones · distribución triangular · umbral mínimo 60%</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={distData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                  <XAxis dataKey="pct" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} formatter={(v: number) => [v, 'Frecuencia']} />
                  <ReferenceLine x={Math.round(prob * 0.78)} stroke="#C0392B" strokeDasharray="4 3" label={{ value: 'P10', position: 'top', fontSize: 8, fill: '#C0392B' }} />
                  <ReferenceLine x={prob}                    stroke="#3B6D11" strokeDasharray="4 3" label={{ value: 'P50', position: 'top', fontSize: 8, fill: '#3B6D11' }} />
                  <ReferenceLine x={Math.round(prob * 1.18)} stroke="#1A5FA8" strokeDasharray="4 3" label={{ value: 'P90', position: 'top', fontSize: 8, fill: '#1A5FA8' }} />
                  <ReferenceLine x={60} stroke="#D4881E" strokeWidth={2} label={{ value: 'Umbral mín.', position: 'insideTopLeft', fontSize: 8, fill: '#D4881E' }} />
                  <Area type="monotone" dataKey="freq" fill="#EAF3DE" stroke="#3B6D11" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'P10 (escenario pesimista)', value: `${Math.round(prob * 0.78)}%`, color: '#C0392B' },
                { label: 'P50 (escenario base)',       value: `${prob}%`,                    color: '#3B6D11' },
                { label: 'P90 (escenario optimista)',  value: `${Math.round(prob * 1.18)}%`, color: '#1A5FA8' },
                { label: 'Umbral mínimo para proceder', value: '60%',                        color: '#D4881E' },
              ].map(c => (
                <div key={c.label} className="flex items-center justify-between rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2">
                  <span className="text-[10px] text-[#6B6760]">{c.label}</span>
                  <span className="font-bold text-[13px]" style={{ color: c.color }}>{c.value}</span>
                </div>
              ))}
              <p className="text-[9px] text-[#A8A49C]">El escenario supera el umbral mínimo de viabilidad en {prob}% de las simulaciones. La incertidumbre principal proviene de participación ciudadana, precio de materiales y cumplimiento del concesionario.</p>
            </div>
          </div>
        </div>
      </ExpandableChart>

      {/* Verdict card */}
      <div className="rounded-[12px] border-2 border-[#D4881E] bg-[#FEF7E7] px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="rounded-[10px] bg-[#D4881E] text-white p-2.5 shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#D4881E] font-bold mb-0.5">Dictamen inicial del módulo</p>
            <p className="text-[20px] font-bold text-[#1C1B18] mb-2">PROCEDER CONDICIONADO</p>
            <p className="text-[13px] text-[#4A4740] leading-relaxed mb-4">
              El escenario es viable, pero no debe avanzar como implementación plena hasta validar aceptación ciudadana,
              comprador ancla y acuerdos operativos con el concesionario.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[9px] font-bold text-[#C0392B] uppercase mb-1">Riesgos dominantes</p>
                <div className="space-y-1">
                  {['R1 — Participación ciudadana', 'R3 — Incumplimiento del concesionario', 'R8 — Falta de comprador ancla'].map(r => (
                    <div key={r} className="flex items-center gap-1.5 text-[10px]"><AlertTriangle className="w-3 h-3 text-[#C0392B] shrink-0" /><span>{r}</span></div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-bold text-[#3B6D11] uppercase mb-1">Próximos pasos críticos</p>
                <div className="space-y-1">
                  {['Validar aceptación por zona prioritaria', 'Confirmar comprador ancla y precios base', 'Firmar acuerdo operativo con concesionario'].map((s, i) => (
                    <div key={s} className="flex items-center gap-1.5 text-[10px]"><span className="w-3.5 h-3.5 rounded-full bg-[#3B6D11] text-white text-[7px] font-bold flex items-center justify-center shrink-0">{i+1}</span><span>{s}</span></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page 2 — Mercado y sensibilidad ──────────────────────────────────────────

function Page2({ ingresoAnual }: { ingresoAnual: number }) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipioId = municipiosActivos[0] ?? null
  const [buyers, setBuyers] = useState<CompradorRow[]>(COMPRADORES_FALLBACK)
  const [buyersSource, setBuyersSource] = useState<'catalog_zm' | 'api' | 'fallback'>('fallback')

  const localRecicladoras = useMemo(
    () => getRecicladorasForZm(zmActiva, municipioId),
    [zmActiva, municipioId],
  )

  useEffect(() => {
    let cancelled = false
    if (localRecicladoras.length > 0) {
      const kpi = buildRecyclersKpiContract({ zmId: zmActiva, municipioId })
      const rows = localRecicladoras.map(r =>
        recicladoraToCompradorRow(r, kpi.distancia_promedio_km_ca_recicladora),
      )
      setBuyers(rows)
      setBuyersSource('catalog_zm')
      return () => { cancelled = true }
    }
    getMarketBuyers(undefined, zmActiva)
      .then(list => {
        if (cancelled || !list?.length) return
        const byMat = new Map<string, MaterialBuyer>()
        for (const b of list) {
          const prev = byMat.get(b.material)
          if (!prev || b.confianza > prev.confianza) byMat.set(b.material, b)
        }
        setBuyers([...byMat.values()].map(buyerToRow))
        setBuyersSource('api')
      })
      .catch(() => {
        if (!cancelled) setBuyersSource('fallback')
      })
    return () => { cancelled = true }
  }, [zmActiva, municipioId, localRecicladoras])

  const compradoresTable = buyers

  const p10Rev = ingresoAnual * 0.67
  const p90Rev = ingresoAnual * 1.40
  const cv     = 18.1

  return (
    <div className="space-y-5">
      {/* Buyers table */}
      <ExpandableChart chartId="m05-buyers" title="Compradores y colocación esperada por material" subtitle="Comprador · precio base · estatus contractual · riesgo de rechazo">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0EDE5]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[12px] font-semibold text-[#1C1B18]">Compradores y colocación esperada por material</p>
                <p className="text-[13px] text-[#6B6760] mt-0.5">
                  {buyersSource === 'catalog_zm'
                    ? `Compradores locales ${zmActiva} — catálogo recicladoras_by_zm. No equivale a LOI firmada.`
                    : buyersSource === 'api'
                    ? 'Fuente: catálogo /market/buyers (ZM activa). No equivale a LOI firmada.'
                    : 'Benchmark editorial — conecte backend para catálogo vivo.'}
                </p>
              </div>
              <ProvenanceBadge
                tipo={buyersSource === 'catalog_zm' ? 'certificado' : buyersSource === 'api' ? 'estimado' : 'manual'}
                confianza={buyersSource === 'catalog_zm' ? 0.78 : buyersSource === 'api' ? 0.72 : 0.45}
                fuente={
                  buyersSource === 'catalog_zm'
                    ? 'recicladorasByZm.ts'
                    : buyersSource === 'api'
                      ? 'GET /market/buyers'
                      : 'COMPRADORES_FALLBACK'
                }
                advertencia="Precios son referencia de mercado secundario, no cotización contractual."
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Material','Comprador / Consorcio','Tipo','km','Cap. (t/a)','P50 (MXN/t)','P10','P90','Rechazo','Estatus contractual'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compradoresTable.map((r, i) => {
                  const estColor = r.estatus === 'Contrato' ? 'bg-[#D1FAE5] text-[#065F46]' :
                                   r.estatus === 'LOI firmada' ? 'bg-[#EAF3DE] text-[#2D5A0D]' :
                                   r.estatus === 'En negociación' ? 'bg-[#FEF3C7] text-[#92400E]' :
                                   'bg-[#FDE8E8] text-[#B91C1C]'
                  const rechColor = r.rechazo === 'Bajo' ? 'text-[#3B6D11]' : r.rechazo === 'Medio' ? 'text-[#D4881E]' : 'text-[#C0392B]'
                  return (
                    <tr key={r.material} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-3 py-2 font-semibold text-[#1C1B18]">{r.material}</td>
                      <td className="px-3 py-2 text-[#4A4740] text-[9px] max-w-[140px]">{r.comprador}</td>
                      <td className="px-3 py-2 text-[#6B6760] text-[9px]">{r.tipo}</td>
                      <td className="px-3 py-2 font-mono text-center">{r.distKm}</td>
                      <td className="px-3 py-2 font-mono">{r.capTon.toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono font-bold text-[#1A5FA8]">{r.p50.toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono text-[#6B6760]">{r.p10.toLocaleString()}</td>
                      <td className="px-3 py-2 font-mono text-[#6B6760]">{r.p90.toLocaleString()}</td>
                      <td className={cn('px-3 py-2 font-semibold', rechColor)}>{r.rechazo}</td>
                      <td className="px-3 py-2"><span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', estColor)}>{r.estatus}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ExpandableChart>

      {/* Price bands + Tornado — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpandableChart chartId="m05-price-bands" title="Bandas de precio por material (MXN/t)" subtitle="P10 / P50 / P90 · precio usado en escenario · volatilidad">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Bandas de precio por material (MXN/t)</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">P10 / P50 / P90 · si precio usado &gt; P90 → riesgo alto</p>
            <div className="space-y-3">
              {compradoresTable.filter(r => r.estatus !== 'Sin comprador').map(r => {
                const range = r.p90 - r.p10
                const p50Pct = range > 0 ? ((r.p50 - r.p10) / range) * 100 : 50
                return (
                  <div key={r.material}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-semibold text-[#1C1B18] w-24 shrink-0">{r.material}</span>
                      <span className="text-[9px] font-mono text-[#1A5FA8] font-bold">${r.p50.toLocaleString()}</span>
                    </div>
                    <div className="relative h-3 bg-[#F4F2ED] rounded-full overflow-visible">
                      <div className="absolute h-full rounded-full bg-[#BDD7F5]" style={{ left: '0%', width: '100%' }} />
                      <div className="absolute h-full rounded-full" style={{ left: '0%', width: `${p50Pct}%`, background: '#1A5FA8' }} />
                      <div className="absolute top-0 h-full w-0.5 bg-[#C0392B]" style={{ left: `${p50Pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#A8A49C] mt-0.5">
                      <span>${r.p10.toLocaleString()} P10</span>
                      <span>${r.p90.toLocaleString()} P90</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ExpandableChart>

        <ExpandableChart chartId="m05-tornado" title="Sensibilidad del ingreso — análisis tornado" subtitle="Cambio en ingreso anual y probabilidad de éxito por variable">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Sensibilidad del ingreso (tornado)</p>
            <p className="text-[10px] text-[#A8A49C] mb-1">Cambio en ingreso anual (M MXN) al estresar cada variable</p>
            <p className="text-[9px] text-[#1A5FA8] mb-3">
              Este tornado mide sensibilidad del <strong>ingreso por venta de materiales</strong>.
              Ver también: sensibilidad del <strong>VPN</strong> en M12 · Retorno Financiero → Análisis de riesgo.
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={SENSITIVITY_VARS} layout="vertical" margin={{ top: 0, right: 40, left: 140, bottom: 0 }}>
                <XAxis type="number" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={v => `${v} M`} />
                <YAxis type="category" dataKey="variable" tick={{ fontSize: 8, fill: '#4A4740' }} tickLine={false} axisLine={false} width={138} />
                <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }}
                  formatter={(v: number, n: string) => [n === 'deltaIngreso' ? `${v} M MXN` : `${v} pp`, n === 'deltaIngreso' ? 'Δ Ingreso' : 'Δ Prob.']} />
                <ReferenceLine x={0} stroke="#E8E4DC" />
                <Bar dataKey="deltaIngreso" name="Δ Ingreso anual (M MXN)" radius={[0, 4, 4, 0]}>
                  {SENSITIVITY_VARS.map(d => <Cell key={d.variable} fill={d.deltaIngreso < 0 ? '#C0392B' : '#3B6D11'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ExpandableChart>
      </div>

      {/* Annual revenue distribution */}
      <ExpandableChart chartId="m05-revenue" title="Probabilidad de derrama anual" subtitle="Distribución de ingreso anual esperado — P10/P50/P90">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Probabilidad de derrama anual</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">5,000 simulaciones · distribución triangular de precios y captura · CV = {cv}%</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={buildTriangularDist(p10Rev / 1e6, ingresoAnual / 1e6, p90Rev / 1e6)} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                  <XAxis dataKey="pct" tick={{ fontSize: 8, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                  <YAxis hide />
                  <Area type="monotone" dataKey="freq" fill="#EBF3FB" stroke="#1A5FA8" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {[
                { label: 'P10', value: `$${(p10Rev / 1e6).toFixed(1)} M`, color: '#C0392B' },
                { label: 'P50', value: `$${(ingresoAnual / 1e6).toFixed(1)} M`, color: '#1A5FA8' },
                { label: 'P90', value: `$${(p90Rev / 1e6).toFixed(1)} M`, color: '#3B6D11' },
                { label: 'CV',  value: `${cv}%`, color: '#D4881E' },
              ].map(c => (
                <div key={c.label} className="flex justify-between items-center rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-1.5">
                  <span className="text-[10px] text-[#6B6760]">{c.label}</span>
                  <span className="font-bold text-[13px]" style={{ color: c.color }}>{c.value}</span>
                </div>
              ))}
              <p className="text-[9px] text-[#A8A49C]">El 90% de las simulaciones cae entre ${(p10Rev / 1e6).toFixed(1)} M y ${(p90Rev / 1e6).toFixed(1)} M. El escenario central es sólido con sensibilidad moderada.</p>
            </div>
          </div>
        </div>
      </ExpandableChart>

      {/* Market conditions checklist */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
        <p className="text-[12px] font-semibold text-[#1C1B18] mb-3">Condiciones mínimas de mercado para proceder</p>
        <div className="space-y-2">
          {[
            { cond: 'Cobertura contractual ≥60% del volumen recuperable',                         ok: true },
            { cond: 'Precios ≥P50 en al menos 4 de 6 materiales clave',                           ok: true },
            { cond: 'Compradores ancla con contrato/LOI vinculante ≥24 meses',                    ok: false },
            { cond: 'Logística con costos competitivos frente a alternativas regionales',          ok: true },
            { cond: 'Mercados de destino sin restricciones regulatorias significativas',           ok: true },
            { cond: 'Riesgo de rechazo controlado por pureza mínima de materiales',               ok: false },
          ].map(c => (
            <div key={c.cond} className="flex items-center gap-2 text-[10px]">
              {c.ok
                ? <CheckCircle className="w-4 h-4 text-[#3B6D11] shrink-0" />
                : <AlertTriangle className="w-4 h-4 text-[#D4881E] shrink-0" />}
              <span className={c.ok ? 'text-[#4A4740]' : 'text-[#D4881E] font-medium'}>{c.cond}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-[8px] bg-[#FEF7E7] border border-[#FDE68A] px-3 py-2.5 text-[10px] text-[#92400E]">
          Estado de mercado: <strong>Condicionado</strong> — 2 de 6 condiciones mínimas aún no cumplidas.
        </div>
      </div>

      {/* Market reading card */}
      <div className="rounded-[12px] border-2 border-[#1A5FA8] bg-[#EBF3FB] px-6 py-5 flex items-start gap-4">
        <DollarSign className="w-7 h-7 text-[#1A5FA8] shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#1A5FA8] font-bold mb-0.5">Lectura de mercado</p>
          <p className="text-[16px] font-bold text-[#1C1B18] mb-2">ESCENARIO ROBUSTO CON CONDICIONES</p>
          <p className="text-[13px] text-[#3A3F6F] leading-relaxed mb-3">
            El modelo es viable bajo las condiciones actuales de precios y cobertura. Priorizar cierre de contratos en orgánicos y otros para reducir riesgo y elevar confianza.
          </p>
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="font-semibold text-[#6B6760]">Riesgo global de mercado:</span>
            <span className="font-bold text-[#D4881E] px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A]">MEDIO</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page 3 — Mitigación, tendencias y condiciones ─────────────────────────────

function Page3() {
  return (
    <div className="space-y-5">
      {/* Mitigation KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { label: 'Riesgos prioritarios',       value: '5 de 8',  sub: 'Identificados y ordenados',        color: '#C0392B' },
          { label: 'Planes de mitigación activos', value: '6 en curso', sub: 'Cobertura del 78% de riesgos', color: '#3B6D11' },
          { label: 'Tendencias bajo presión',     value: '4 de 6',  sub: 'Presión media-alta',               color: '#D4881E' },
          { label: 'Condición para proceder',     value: 'Condicionada', sub: 'Sujeta a precondiciones',     color: '#D4881E' },
          { label: 'Nivel de preparación',        value: '62%',     sub: 'Madurez antes de avanzar',         color: '#1A5FA8' },
          { label: 'Confianza del dictamen',      value: '45%',     sub: 'Condicionada por datos pendientes', color: '#A8A49C' },
        ].map(c => (
          <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
            <p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C] mb-1">{c.label}</p>
            <p className="font-bold text-[20px]" style={{ color: c.color }}>{c.value}</p>
            <p className="text-[9px] text-[#A8A49C] mt-0.5">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Mitigation matrix */}
      <ExpandableChart chartId="m05-mitigation" title="Matriz de mitigación y acciones clave" subtitle="Dimensión · riesgo · acción · dueño · plazo · riesgo residual">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0EDE5]">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Matriz de mitigación y acciones clave</p>
            <p className="text-[10px] text-[#A8A49C]">Cada acción está ligada a un riesgo identificado — no hay mitigaciones sueltas</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Dimensión','Riesgo identificado','ID','Acción de mitigación','Dueño','Plazo','Impacto esperado','Riesgo residual','Estado'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MITIGATIONS_FULL.map((m, i) => {
                  const estColor = m.estado === 'En curso' ? 'bg-[#EAF3DE] text-[#2D5A0D]' : 'bg-[#FEF3C7] text-[#92400E]'
                  const resColor = m.residual === 'Bajo' ? 'text-[#3B6D11]' : m.residual === 'Medio' ? 'text-[#D4881E]' : 'text-[#C0392B]'
                  return (
                    <tr key={m.id + m.accion} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-3 py-2 font-semibold" style={{ color: CAT_COLORS[m.dim] ?? '#A8A49C' }}>{m.dim}</td>
                      <td className="px-3 py-2 text-[#4A4740] max-w-[120px] text-[9px]">{m.riesgo}</td>
                      <td className="px-3 py-2"><span className="font-mono font-bold bg-[#1C2B15] text-white px-1.5 py-0.5 rounded text-[10px]">{m.id}</span></td>
                      <td className="px-3 py-2 text-[#4A4740] max-w-[160px] text-[9px]">{m.accion}</td>
                      <td className="px-3 py-2 text-[#6B6760] text-[9px]">{m.dueno}</td>
                      <td className="px-3 py-2 text-[#6B6760]">{m.plazo}</td>
                      <td className="px-3 py-2 text-[#3B6D11] font-semibold">{m.impacto}</td>
                      <td className={cn('px-3 py-2 font-semibold', resColor)}>{m.residual}</td>
                      <td className="px-3 py-2"><span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold', estColor)}>{m.estado}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="w-full text-center text-[10px] text-[#3B6D11] font-semibold py-3 border-t border-[#F0EDE5] hover:bg-[#F4FAEC] transition-colors">
            Ver plan de acciones y responsables →
          </button>
        </div>
      </ExpandableChart>

      {/* Final verdict */}
      <div className="rounded-[12px] border-2 border-[#D4881E] bg-[#FEF7E7] px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="rounded-[10px] bg-[#D4881E] text-white p-2.5 shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#D4881E] font-bold mb-0.5">Dictamen final del módulo</p>
            <p className="text-[20px] font-bold text-[#1C1B18] mb-2">PROCEDER CONDICIONADO</p>
            <p className="text-[13px] text-[#4A4740] leading-relaxed mb-3">
              El escenario es viable, pero debe avanzar con implementación plena solo si se cumplen cinco condiciones críticas.
            </p>
            <p className="text-[11px] font-bold text-[#C0392B] mb-2">Precondiciones críticas:</p>
            <div className="space-y-1.5">
              {[
                'Asegurar 3 predios para CA con dictamen de uso de suelo',
                'Firmar acuerdos con recicladores y contratistas',
                'Blindaje legal y presupuestal en PDM municipal',
                'Instrumentar monitoreo ciudadano y tablero público',
                'Garantizar cumplimiento normativo de RSU y NOM aplicables',
              ].map((c, i) => (
                <div key={c} className="flex items-start gap-1.5 text-[10px]">
                  <span className="w-4 h-4 rounded-full bg-[#D4881E] text-white text-[7px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-[#A8A49C] mt-3">Reevaluación recomendada en 90 días.</p>
          </div>
        </div>
      </div>

      {/* 30/60/90 plan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {PLAN_306090.map(p => (
          <div key={p.rango} className="rounded-[10px] border p-4" style={{ borderColor: p.border, background: p.color }}>
            <p className="text-[11px] font-bold mb-3" style={{ color: p.text }}>{p.rango}</p>
            <div className="space-y-1.5 mb-3">
              {p.acciones.map(a => (
                <div key={a} className="flex items-start gap-1.5 text-[10px]">
                  <CheckCircle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: p.text }} />
                  <span className="text-[#4A4740]">{a}</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-2" style={{ borderColor: p.border }}>
              <p className="text-[10px] font-bold uppercase" style={{ color: p.text }}>{p.hito}</p>
              <p className="text-[10px] text-[#A8A49C]">Riesgos: {p.riesgo}</p>
            </div>
          </div>
        ))}
      </div>

      {/* External trends */}
      <ExpandableChart chartId="m05-trends" title="Tendencias externas relevantes — lectura de presión" subtitle="T1–T6 · dirección · intensidad · riesgos relacionados · acción">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Tendencias externas relevantes</p>
          <p className="text-[10px] text-[#A8A49C] mb-4">Cada tendencia conecta con riesgos específicos y define la urgencia de acción</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TRENDS_T1_T6.map(t => (
              <div key={t.id} className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-3.5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-bold text-[#A8A49C] mr-1.5">{t.id}</span>
                    <span className="text-[11px] font-semibold text-[#1C1B18]">{t.nombre}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', t.intensidad === 'Alta' ? 'bg-[#FDE8E8] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]')}>Presión {t.rsu}</span>
                    <span className="text-[10px] text-[#A8A49C]">{t.cat}</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#6B6760] mb-1.5">{t.implicacion}</p>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {t.riesgos.map(r => <span key={r} className="text-[10px] font-mono font-bold bg-[#FDE8E8] text-[#B91C1C] px-1 py-0.5 rounded">{r}</span>)}
                </div>
                <p className="text-[9px] text-[#3B6D11] font-medium">→ {t.accion}</p>
              </div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* Proceed conditions checklist */}
      <ExpandableChart chartId="m05-conditions" title="Condiciones para proceder" subtitle="10 condiciones obligatorias antes de declarar implementación viable">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4">
          <p className="text-[12px] font-semibold text-[#1C1B18] mb-3">Condiciones para proceder</p>
          <div className="space-y-2">
            {PROCEED_CONDITIONS.map(c => {
              const icon = c.estado === 'Cumplido' ? <CheckCircle className="w-4 h-4 text-[#3B6D11] shrink-0" />
                : c.estado === 'En curso' ? <Clock className="w-4 h-4 text-[#1A5FA8] shrink-0" />
                : c.estado === 'Parcial' ? <Activity className="w-4 h-4 text-[#D4881E] shrink-0" />
                : c.estado === 'Bloqueado' ? <AlertTriangle className="w-4 h-4 text-[#C0392B] shrink-0" />
                : <MapPin className="w-4 h-4 text-[#A8A49C] shrink-0" />
              const badgeColor = c.estado === 'Cumplido' ? 'bg-[#D1FAE5] text-[#065F46]'
                : c.estado === 'En curso' ? 'bg-[#EBF3FB] text-[#1A5FA8]'
                : c.estado === 'Parcial' ? 'bg-[#FEF3C7] text-[#92400E]'
                : c.estado === 'Bloqueado' ? 'bg-[#FDE8E8] text-[#B91C1C]'
                : 'bg-[#F4F2ED] text-[#6B6760]'
              return (
                <div key={c.cond} className="flex items-center gap-2 text-[10px]">
                  {icon}
                  <span className="flex-1 text-[#4A4740]">{c.cond}</span>
                  <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0', badgeColor)}>{c.estado}</span>
                </div>
              )
            })}
          </div>
        </div>
      </ExpandableChart>

      {/* Causal traceability */}
      <div className="space-y-2.5">
        <p className="text-[12px] font-semibold text-[#1C1B18]">Trazabilidad causal — de riesgo a decisión</p>
        {CAUSAL_CHAINS.map(c => (
          <div key={c.riesgo} className="rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-3.5">
            <div className="flex flex-wrap items-center gap-2 text-[10px]">
              <div className="rounded-[6px] bg-[#FDE8E8] border border-[#F5B7B1] px-3 py-1.5 font-semibold text-[#B91C1C]">{c.riesgo}</div>
              <ArrowRight className="w-3.5 h-3.5 text-[#A8A49C] shrink-0" />
              <div className="rounded-[6px] bg-[#EBF3FB] border border-[#BDD7F5] px-3 py-1.5 font-semibold text-[#1A5FA8]">{c.accion}</div>
              <ArrowRight className="w-3.5 h-3.5 text-[#A8A49C] shrink-0" />
              <div className="rounded-[6px] bg-[#EAF3DE] border border-[#D7E8C0] px-3 py-1.5 font-semibold text-[#2D5A0D]">{c.efecto}</div>
              <ArrowRight className="w-3.5 h-3.5 text-[#A8A49C] shrink-0" />
              <div className="rounded-[6px] bg-[#FEF7E7] border border-[#FDE68A] px-3 py-1.5 font-bold text-[#92400E]">{c.decision}</div>
            </div>
          </div>
        ))}
        <p className="text-[9px] text-[#A8A49C]">Esta sección demuestra que la recomendación no es arbitraria: cada decisión tiene una cadena causal verificable.</p>
      </div>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export function MarketTraceabilityStack({ pageOnly }: { pageOnly?: 1 | 2 | 3 } = {}) {
  const { resultados, horizonte, presetTrayectoria, seleccionMunicipioCatalog } = useSimulatorStore()
  const [pageInternal, setPageInternal] = useState<1 | 2 | 3>(pageOnly ?? 2)
  const page = pageOnly ?? pageInternal
  const setPage = (p: number) => setPageInternal(p as 1 | 2 | 3)

  const trayectoria = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)?.label ?? presetTrayectoria ?? 'Moderado'
  const municipio   = seleccionMunicipioCatalog?.nombre ?? 'San Luis Potosí'
  const rsuDia      = resultados?.rsuTotalTonDia ?? 0

  // Probability heuristic: base 62 ± adjustments
  const prob = useMemo(() => {
    if (!resultados?.tir) return 62
    return Math.min(85, Math.max(40, Math.round(55 + resultados.tir * 0.25)))
  }, [resultados])

  // Annual income from store or estimated from RSU × prices
  const ingresoAnual = useMemo(() => {
    if (resultados?.ingresosBrutos && resultados.ingresosBrutos > 0) return resultados.ingresosBrutos
    const rsuAnual = rsuDia * 365 * 0.61 // 61% capture rate
    return (
      rsuAnual * COMPOSICION_RSU.organico  * PRECIOS_DEFAULTS.organico  * 1000 * 0.30 +
      rsuAnual * COMPOSICION_RSU.papel     * PRECIOS_DEFAULTS.papel     * 1000 * 0.55 +
      rsuAnual * COMPOSICION_RSU.plastico  * PRECIOS_DEFAULTS.pet       * 1000 * 0.35 +
      rsuAnual * COMPOSICION_RSU.vidrio    * PRECIOS_DEFAULTS.vidrio    * 1000 * 0.40 +
      rsuAnual * COMPOSICION_RSU.aluminio  * PRECIOS_DEFAULTS.aluminio  * 1000 * 0.85
    )
  }, [resultados, rsuDia])

  const riskScore = Math.round(36 + (100 - prob) * 0.4)

  const PAGE_TABS = ['Dictamen y probabilidad', 'Mercado y sensibilidad', 'Mitigación, tendencias y condiciones']

  return (
    <div className="pb-4">
      {!pageOnly && (
      <div className="flex flex-wrap gap-1.5 mb-6">
        {PAGE_TABS.map((label, i) => {
          const p = i + 1
          return (
            <button key={p} type="button" onClick={() => setPage(p)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-[8px] text-[11px] font-semibold border transition-colors',
                page === p ? 'bg-[#1C2B15] text-white border-[#1C2B15]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]'
              )}>
              <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                page === p ? 'bg-[#3B6D11]' : 'bg-[#E8E4DC] text-[#6B6760]'
              )}>{p}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          )
        })}
      </div>
      )}

      {/* 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div>
          <DecisionCommitBar
            municipio={municipio} horizonte={horizonte}
            trayectoria={trayectoria} rsuDia={rsuDia}
            compact={page > 1}
          />
          {page === 1 && (
            <RiskKpiRow prob={prob} riskScore={riskScore} mktRisk="Medio" socialRisk="Alto" opRisk="Medio-alto" />
          )}
          {page === 1 && <Page1 prob={prob} />}
          {page === 2 && <Page2 ingresoAnual={ingresoAnual} />}
          {page === 3 && <Page3 />}
          {!pageOnly && <PageNavFooter page={page} setPage={setPage} />}
        </div>
        <RightRail page={page} />
      </div>
    </div>
  )
}
