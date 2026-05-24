import type { LogisticsTimingParams, ResidentialRoutePlan } from '@/lib/residentialRouteTiming'

/** CSV editable para Cabildo y concesionario — tiempos por colonia y OPEX combustible. */
export function buildCabildoLogisticaCsv(params: {
  municipio: string
  zm: string
  plans: ResidentialRoutePlan[]
  timing: LogisticsTimingParams
}): string {
  const lines: string[] = []
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`

  lines.push('# ANEXO LOGÍSTICA RESIDENCIAL — ALQUIMIA Fase 0-1')
  lines.push(`# Municipio: ${params.municipio}`)
  lines.push(`# ZM: ${params.zm}`)
  lines.push(`# Generado: ${new Date().toISOString()}`)
  lines.push('# Editable: min_servicio_colonia, frecuencia_semana — recalcular OPEX en M08')
  lines.push('')

  lines.push([
    'ruta_id', 'zona', 'colonia', 'municipio', 'tipo_vivienda', 'viviendas_est',
    'min_servicio_colonia', 'frecuencia_semana', 'km_ruta', 'min_viaje', 'min_servicio_total',
    'min_turno', 'litros_turno', 'costo_combustible_mxn', 'opex_mes_mxn', 'trazada',
  ].map(esc).join(','))

  for (const plan of params.plans) {
    for (const stop of plan.stops) {
      lines.push([
        plan.route_id,
        plan.zona_label,
        stop.colonia,
        stop.municipio_nombre,
        stop.segment === 'vertical' ? 'Edificio/vertical' : 'Casa/colonia',
        stop.viviendas_estimadas,
        stop.min_servicio,
        plan.frecuencia_semana,
        plan.total_km,
        plan.total_min_viaje,
        plan.total_min_servicio,
        plan.total_min_turno,
        plan.litros_turno,
        plan.costo_combustible_turno_mxn,
        plan.opex_mes_mxn,
        plan.traced ? 'Sí' : 'No',
      ].map(esc).join(','))
    }
  }

  lines.push('')
  lines.push('# Parámetros globales (concesionario puede proponer ajustes ±20%)')
  lines.push([
    'parametro', 'valor', 'unidad',
  ].map(esc).join(','))
  for (const [k, v] of Object.entries(params.timing)) {
    lines.push([k, v, ''].map(esc).join(','))
  }

  return lines.join('\n')
}

export function downloadCabildoLogisticaCsv(filename: string, content: string) {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
