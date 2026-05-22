/** Cálculo dinámico de flota logística — fuente primaria: resultados del motor (calculator.ts). */

import type { MaterialKey, ResultadosCalculados } from '@/types'
import { CA_CONFIG } from '@/lib/constants'
import type { InfraOperativaSummary } from '@/lib/infraOperativaSummary'

const MAT_DISPLAY: Record<MaterialKey, string> = {
  organico: 'Materia orgánica',
  papel: 'Papel / cartón',
  plastico: 'Plásticos',
  vidrio: 'Vidrio',
  aluminio: 'Metales',
  otros: 'Otros',
}

const MAT_META: Record<MaterialKey, { frecuencia: string; riesgo: string; obs: string }> = {
  organico: { frecuencia: 'Diaria', riesgo: 'Alto', obs: 'Perecible — no retrasar recolección' },
  papel: { frecuencia: '3×/sem', riesgo: 'Medio', obs: 'Compactar para reducir viajes' },
  plastico: { frecuencia: '3×/sem', riesgo: 'Alto', obs: 'Alta densidad variable; revisar carga' },
  vidrio: { frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Pesado — camión de bajo perfil' },
  aluminio: { frecuencia: '1×/sem', riesgo: 'Bajo', obs: 'Alto valor por peso; prioritario' },
  otros: { frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Consolidar con ruta de residuos mixtos' },
}

const MATERIAL_KEYS: MaterialKey[] = ['organico', 'papel', 'plastico', 'vidrio', 'aluminio', 'otros']

export interface TruckRow {
  material: string
  volDia: number
  camiones: number
  frecuencia: string
  riesgo: string
  obs: string
}

export interface BottleneckRow {
  zona: string
  gravedad: 'Alto' | 'Medio' | 'Bajo'
  causa: string
  impacto: string
  accion: string
}

export interface PerRouteRow {
  id: string
  material: string
  presion: string
  estado: string
  respuesta: string
  bitacora: string
  estado_chip: 'alerta' | 'info'
}

export interface SeasonMonthRow {
  mes: string
  rsu: number
  cap: number
}

export interface LogisticsKpiContract {
  zm: string
  municipio: string
  municipio_id?: string | null
  timestamp_simulacion: string
  fase_producto: '0-1'
  fuente: 'dimensionamiento_conceptual'
  kpis_logisticos: {
    total_camiones_requeridos: number
    visitas_mes_estimadas: number
    merma_logistica_pct: number
    presion_operativa: string
    cap_instalada_ton_dia: number
    brecha_ton_dia: number
    centros_activos: number
    trucks_por_material: Record<string, { camiones: number; vol_dia_ton: number; riesgo: string }>
    estacionalidad_meses_saturacion: string[]
  }
  calidad: {
    confianza: number
    cap_camion_ton: number
    fuente_camiones: string
    advertencia: string
  }
  metadata?: {
    modulos_prerequisitos_ok: boolean
    advertencia_gate: string | null
  }
}

type ResultadosLogistica = Pick<ResultadosCalculados, 'camionesRequeridos' | 'volCapturablePorMat'>

export function computeTrucksByMaterial(
  rsuDia: number,
  fromResultados?: ResultadosLogistica | null,
): TruckRow[] {
  if (fromResultados?.camionesRequeridos && fromResultados?.volCapturablePorMat) {
    return MATERIAL_KEYS
      .filter(k =>
        (fromResultados.camionesRequeridos[k] ?? 0) > 0
        || (fromResultados.volCapturablePorMat[k] ?? 0) > 0,
      )
      .map(k => ({
        material: MAT_DISPLAY[k],
        volDia: Math.round((fromResultados.volCapturablePorMat[k] ?? 0) * 10) / 10,
        camiones: fromResultados.camionesRequeridos[k] ?? 0,
        ...MAT_META[k],
      }))
  }
  if (rsuDia <= 0) return []
  return []
}

export function computeLogisticsKpis(trucks: TruckRow[]) {
  const totalCamiones = trucks.reduce((s, t) => s + t.camiones, 0)
  const volMovilizado = trucks.reduce((s, t) => s + t.volDia, 0)
  const mermaPct = volMovilizado > 0
    ? Math.min(25, Math.max(8, Math.round(18 - (volMovilizado / Math.max(totalCamiones, 1)) * 0.5)))
    : 8
  return {
    totalCamiones,
    visitasMes: Math.round(totalCamiones * 22 * 10) / 10,
    mermaPct,
    presion: totalCamiones > 20 ? 'Alta' : totalCamiones > 12 ? 'Media-alta' : 'Media',
  }
}

export function computeSeasonData(
  rsuDia: number,
  capInstaladaTonDia: number,
  meses: string[],
  estacionalidad: readonly number[],
): SeasonMonthRow[] {
  return meses.map((mes, i) => {
    const base = rsuDia * 30
    const factor = 1 + (estacionalidad[i] ?? 0)
    const cap = capInstaladaTonDia * 30
    return { mes, rsu: Math.round(base * factor), cap: Math.round(cap) }
  })
}

export function computeBottlenecks(
  infra: InfraOperativaSummary,
  seasonData: SeasonMonthRow[],
  trucks: TruckRow[],
): BottleneckRow[] {
  const bns: BottleneckRow[] = []

  if (infra.brechaTonDia > 0) {
    const casNecesarios = Math.ceil(infra.brechaTonDia / CA_CONFIG.P.capTonDia)
    bns.push({
      zona: 'Brecha de capacidad instalada',
      gravedad: 'Alto',
      causa: `Demanda supera capacidad en ${infra.brechaTonDia.toFixed(1)} t/día`,
      impacto: 'Material sin procesar genera contingencia sanitaria',
      accion: `Agregar ${casNecesarios} CA-P o escalar CA existentes en M06`,
    })
  }

  const mesesSat = seasonData.filter(d => d.rsu > d.cap && d.cap > 0)
  if (mesesSat.length > 0) {
    bns.push({
      zona: `Saturación estacional (${mesesSat.map(d => d.mes).join(', ')})`,
      gravedad: 'Medio',
      causa: 'Picos de generación superan capacidad instalada',
      impacto: 'Desbordamiento temporal de centros de acopio',
      accion: 'Prever capacidad adicional de almacenamiento o rutas de contingencia',
    })
  }

  trucks
    .filter(t => t.riesgo === 'Alto')
    .forEach(t => {
      bns.push({
        zona: `Flota insuficiente — ${t.material}`,
        gravedad: 'Medio',
        causa: `${t.camiones} camiones requeridos · ${t.volDia} t/día`,
        impacto: 'Retrasos en recolección y pérdida de valor',
        accion: `Aumentar frecuencia (${t.frecuencia}) o agregar unidad dedicada`,
      })
    })

  if (bns.length === 0) {
    bns.push({
      zona: 'Sin cuellos detectados',
      gravedad: 'Bajo',
      causa: 'Capacidad suficiente para la demanda actual del escenario',
      impacto: 'Ninguno en fase de planeación',
      accion: 'Revisar al escalar operación o cambiar mix de CAs',
    })
  }

  return bns
}

export function computePerRoutes(trucks: TruckRow[], zmActiva: string): PerRouteRow[] {
  const prefix = zmActiva.slice(0, 3).toUpperCase()
  return trucks
    .filter(t => t.riesgo === 'Alto' || t.riesgo === 'Medio')
    .map(t => ({
      id: `${prefix}-${t.material.slice(0, 3).toUpperCase().replace(/\s/g, '')}`,
      material: t.material,
      presion: `${t.camiones} camiones requeridos · ${t.volDia} t/día · riesgo ${t.riesgo}`,
      estado: `Dimensionado para ${t.frecuencia} — pendiente asignación de unidades`,
      respuesta: t.obs,
      bitacora: 'Fase 0-1: estimación conceptual — sin bitácora operativa',
      estado_chip: t.riesgo === 'Alto' ? 'alerta' as const : 'info' as const,
    }))
}

/** Contrato de datos hacia KRONOS — dimensionamiento conceptual Fase 0-1. */
export function buildLogisticsKpiContract(params: {
  zm: string
  municipio: string
  municipio_id?: string | null
  capCamionTon: number
  infra: InfraOperativaSummary
  trucks: TruckRow[]
  kpis: ReturnType<typeof computeLogisticsKpis>
  seasonData: SeasonMonthRow[]
  hasResultados: boolean
  hasM06?: boolean
}): LogisticsKpiContract {
  const trucksPorMaterial: LogisticsKpiContract['kpis_logisticos']['trucks_por_material'] = {}
  for (const t of params.trucks) {
    const key = t.material.toLowerCase().replace(/\s+/g, '_').slice(0, 12)
    trucksPorMaterial[key] = { camiones: t.camiones, vol_dia_ton: t.volDia, riesgo: t.riesgo }
  }

  return {
    zm: params.zm,
    municipio: params.municipio,
    municipio_id: params.municipio_id ?? null,
    timestamp_simulacion: new Date().toISOString(),
    fase_producto: '0-1',
    fuente: 'dimensionamiento_conceptual',
    kpis_logisticos: {
      total_camiones_requeridos: params.kpis.totalCamiones,
      visitas_mes_estimadas: params.kpis.visitasMes,
      merma_logistica_pct: params.kpis.mermaPct,
      presion_operativa: params.kpis.presion,
      cap_instalada_ton_dia: params.infra.capInstaladaTonDia,
      brecha_ton_dia: params.infra.brechaTonDia,
      centros_activos: params.infra.centrosActivos,
      trucks_por_material: trucksPorMaterial,
      estacionalidad_meses_saturacion: params.seasonData
        .filter(d => d.rsu > d.cap && d.cap > 0)
        .map(d => d.mes),
    },
    calidad: {
      confianza: params.hasResultados ? 0.62 : 0.25,
      cap_camion_ton: params.capCamionTon,
      fuente_camiones: params.hasResultados
        ? 'resultados.camionesRequeridos'
        : 'pendiente — complete M01',
      advertencia: 'Dimensionamiento conceptual — sin validación de campo',
    },
    metadata: {
      modulos_prerequisitos_ok: params.hasResultados && (params.hasM06 ?? params.infra.centrosActivos > 0),
      advertencia_gate: !params.hasResultados
        ? 'Sin M01: complete línea base RSU'
        : (params.hasM06 === false || params.infra.centrosActivos === 0)
          ? 'Sin M06: configure centros de acopio'
          : params.infra.brechaTonDia > 0
            ? `Brecha ${params.infra.brechaTonDia.toFixed(1)} t/día — revisar M08`
            : null,
    },
  }
}

export function computeLogisticsConfidence(params: {
  hasResultados: boolean
  rsuDia: number
  mapSource: 'geocoding' | 'fallback' | null
}): number {
  let c = 0.2
  if (params.hasResultados && params.rsuDia > 0) c += 0.35
  if (params.mapSource === 'geocoding') c += 0.12
  if (params.mapSource === 'fallback') c += 0.05
  return Math.min(0.85, Math.round(c * 100) / 100)
}
