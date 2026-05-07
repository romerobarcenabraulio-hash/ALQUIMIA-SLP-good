import { CA_CONFIG, FASES_CA } from '@/lib/constants'

/** Ritmo de despliegue relativo al horizonte (solo visualización; §2.6 presets). */
const RITMO_PRESET: Record<string, number> = {
  'Plan SLP Original': 0.78,
  Conservador: 0.82,
  Realista: 1,
  Agresivo: 1.08,
  Acelerado: 1.2,
}

const RECICLADORAS_BASE = 3

/**
 * Cuántas filas de §2.4 se muestran al “cierre” del horizonte con el preset activo.
 */
export function fasesDespliegueVisibles(horizonte: number, presetTrayectoria: string): number {
  const h = Math.max(1, horizonte)
  const r = RITMO_PRESET[presetTrayectoria] ?? 1
  return Math.min(FASES_CA.length, Math.max(1, Math.round(h * r)))
}

/** Parsea etiquetas §2.4 tipo `5P+3M+0G`. */
export function parseMixPmG(mixLabel: string): { P: number; M: number; G: number } {
  const m = mixLabel.match(/(\d+)\s*P\s*\+\s*(\d+)\s*M\s*\+\s*(\d+)\s*G/i)
  if (!m) return { P: 3, M: 0, G: 0 }
  return { P: Number(m[1]), M: Number(m[2]), G: Number(m[3]) }
}

/** Mix de centros alineado al horizonte y preset de trayectoria (sin ajuste manual en UI). */
export function deriveMixCasFromHorizonte(
  horizonte: number,
  presetTrayectoria: string,
): { P: number; M: number; G: number } {
  const n = fasesDespliegueVisibles(horizonte, presetTrayectoria)
  const row = FASES_CA[n - 1]
  return parseMixPmG(row.mix)
}

export function empleosCaDesdeMix(mix: string): number {
  const m = mix.match(/(\d+)\s*P\s*\+\s*(\d+)\s*M\s*\+\s*(\d+)\s*G/i)
  if (!m) return 0
  const p = Number(m[1])
  const mid = Number(m[2])
  const g = Number(m[3])
  return p * CA_CONFIG.P.empleos + mid * CA_CONFIG.M.empleos + g * CA_CONFIG.G.empleos
}

/**
 * Recicladoras con offtake activo (acumulado por fase): base mínima + escala con cobertura e infraestaura.
 * Sin API ni inputs extra — coherente con narrativa S13 (varias zonas de recepción).
 */
export function recicladorasActivasModelo(coberturaPct: number, nCAs: number): number {
  const porCobertura = Math.min(6, Math.round(coberturaPct / 18))
  const porInfra = Math.min(4, Math.max(0, Math.round((nCAs - 3) / 7)))
  return RECICLADORAS_BASE + porCobertura + porInfra
}

export type PuntoDespliegueOperativo = {
  key: string
  fase: number
  faseNombre: string
  mesAcumulado: number
  caAcumulados: number
  recicladorasAcumuladas: number
  empleosDirectosCa: number
}

export function buildDespliegueOperativoSeries(
  horizonte: number,
  presetTrayectoria: string,
): PuntoDespliegueOperativo[] {
  const n = fasesDespliegueVisibles(horizonte, presetTrayectoria)
  const slice = FASES_CA.slice(0, n)
  const mesTotal = Math.max(12, horizonte * 12)
  return slice.map((f, i) => {
    const mesAcumulado = Math.round(((i + 1) / n) * mesTotal)
    return {
      key: `F${f.fase}`,
      fase: f.fase,
      faseNombre: f.nombre,
      mesAcumulado,
      caAcumulados: f.nCAs,
      recicladorasAcumuladas: recicladorasActivasModelo(f.coberturaPct, f.nCAs),
      empleosDirectosCa: empleosCaDesdeMix(f.mix),
    }
  })
}

/** Empleo formal directo al cierre del tramo mostrado: CAs (mix §2.4) + línea recicladoras del modelo (80). */
export function empleoFormalDirectoCierre(series: PuntoDespliegueOperativo[]): number {
  if (!series.length) return 0
  const last = series[series.length - 1]
  const EMPLEOS_RECIC_LINEA_MODELO = 80
  return last.empleosDirectosCa + EMPLEOS_RECIC_LINEA_MODELO
}
