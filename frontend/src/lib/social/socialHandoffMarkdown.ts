import type { SocialBacklogElementoMinimo } from '@/types/socialBacklogHandoff'

export type SocialHandoffMarkdownMeta = {
  /** Ej. epoch del catálogo territorial de la sesión. */
  catalog_simulation_epoch?: string
  alcance_geo_declarado: string
  module_anchor: string
  generado_iso: string
}

export type SocialHandoffMarkdownOptions = {
  /** Totales de bitácora para nota explícita de recorte (PR5: sin volcado masivo). */
  bitacora?: { total: number; included: number }
}

function escapeCell(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

/**
 * Un solo artefacto Markdown (PR5): encabezados + tabla pequeña exportable por lectores de pantalla.
 */
export function buildSocialHandoffMarkdown(
  elementos: SocialBacklogElementoMinimo[],
  meta: SocialHandoffMarkdownMeta,
  options?: SocialHandoffMarkdownOptions,
): string {
  const lines: string[] = []
  lines.push('# Handoff capa social — ALQUIMIA (PR5)')
  lines.push('')
  lines.push('## Metadatos del snapshot')
  lines.push('')
  lines.push(`- **Generado (ISO):** ${meta.generado_iso}`)
  lines.push(`- **Ancla módulo:** \`${meta.module_anchor}\``)
  lines.push(`- **Alcance geográfico declarado en UI:** ${meta.alcance_geo_declarado}`)
  if (meta.catalog_simulation_epoch?.trim()) {
    lines.push(`- **Catálogo simulación (epoch):** ${meta.catalog_simulation_epoch.trim()}`)
  }
  if (options?.bitacora && options.bitacora.total > options.bitacora.included) {
    lines.push(
      `- **Bitácora:** ${options.bitacora.total} entradas en almacenamiento local del navegador; este snapshot incluye las últimas **${options.bitacora.included}** (PR5: sin volcado masivo del histórico).`,
    )
  }
  lines.push('')
  lines.push('## Resumen cualitativo')
  lines.push('')
  lines.push(
    'Tabla **acotada**: solo filas derivadas de fichas de riesgo versionadas y entradas actuales de bitácora en esta sesión del navegador. No incluye histórico masivo ni integración CRM.',
  )
  lines.push('')
  lines.push('## Elementos backlog (mínimo)')
  lines.push('')
  lines.push(
    '| Título | Origen capa | Severidad interna | Responsable (opc.) | Ancla interna |',
  )
  lines.push(
    '| --- | --- | --- | --- | --- |',
  )
  for (const e of elementos) {
    lines.push(
      `| ${escapeCell(e.titulo)} | ${e.origen_capa} | ${e.severidad_interna} | ${escapeCell(e.responsable_propuesto_opcional || '—')} | \`${escapeCell(e.enlace_interno_anchor)}\` |`,
    )
  }
  lines.push('')
  lines.push('---')
  lines.push('')
  lines.push('*Documento expositivo. Requiere validación competente antes de comunicación pública formal.*')
  return lines.join('\n')
}
