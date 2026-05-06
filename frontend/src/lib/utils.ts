import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 })
const MXN_K = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 1, notation: 'compact', compactDisplay: 'short' })
const NUM = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 })
const NUM0 = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })
const PCT = new Intl.NumberFormat('es-MX', { style: 'percent', maximumFractionDigits: 1 })

export const fmt = {
  mxn:   (v: number) => MXN.format(v),
  mxnK:  (v: number) => MXN_K.format(v),
  mxnM:  (v: number) => `$${(v / 1_000_000).toFixed(1)}M`,
  num:   (v: number) => NUM.format(v),
  num0:  (v: number) => NUM0.format(v),
  pct:   (v: number) => PCT.format(v / 100),
  ton:   (v: number) => `${NUM.format(v)} t`,
  kgd:   (v: number) => `${NUM.format(v)} t/día`,
  kwh:   (v: number) => `${NUM0.format(v)} kWh`,
  co2:   (v: number) => `${NUM0.format(v)} tCO₂e`,
  emp:   (v: number) => `${NUM0.format(v)} empleos`,
}

export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }
}

export const MESES = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
]

export const MATERIAL_COLORS: Record<string, string> = {
  organico:  '#639922',
  papel:     '#D4881E',
  plastico:  '#1A5FA8',
  vidrio:    '#1D9E75',
  aluminio:  '#8B6B4A',
  otros:     '#A8A49C',
  pet:       '#1A5FA8',
  hdpe:      '#2779c4',
}

export const MATERIAL_LABELS: Record<string, string> = {
  organico:  'Materia orgánica',
  papel:     'Papel / cartón',
  plastico:  'Plásticos',
  vidrio:    'Vidrio',
  aluminio:  'Aluminio',
  otros:     'Otros',
}

/** Lee `detail` de respuestas RFC 7807 / FastAPI (`string` | `object[]` | …) para mostrar al usuario. */
export function formatFastApiDetail(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback
  const raw = (body as { detail?: unknown }).detail
  if (raw == null) return fallback
  if (typeof raw === 'string') return raw
  if (Array.isArray(raw)) {
    const parts = raw.map((item) => {
      if (item && typeof item === 'object') {
        const o = item as Record<string, unknown>
        if (typeof o.msg === 'string') return o.msg
      }
      try {
        return JSON.stringify(item)
      } catch {
        return String(item)
      }
    })
    return parts.filter(Boolean).join(' · ') || fallback
  }
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw)
    } catch {
      return fallback
    }
  }
  return String(raw)
}
