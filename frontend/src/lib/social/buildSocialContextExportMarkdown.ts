/**
 * PR5 — Resumen estático Markdown (estructura Auditor + bloques existentes).
 * Seguridad: texto de usuario va en bloques fencing; no se inyecta HTML crudo en el string generado.
 */
import type { SocialRiskMatrixItem } from '@/data/socialRiskMatrixContent'
import { SOCIAL_RISK_MATRIX_CONTENT_VERSION } from '@/data/socialRiskMatrixContent'
import { SOCIAL_STATS_INDICATOR_ORDER } from '@/data/socialStats/embeddedBundle'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import type { SocialAssumptionLogEntry } from '@/types/socialAssumptionsLog'
import type { SocialStatsBundle } from '@/types/socialOfficialStats'
import { resolveOfficialStat, type StatResolutionContext } from '@/lib/social/socialStatsResolve'
import { SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N } from '@/lib/social/pr5ExportConstants'

const GEO_LABEL: Record<SociodemographicDisplayBlock['geo_scope'], string> = {
  municipio_cve: 'Municipio (clave / CVE inequívoca)',
  zm_estadistica: 'Zona metropolitana (marco estadístico)',
}

const DATO_LABEL: Record<SociodemographicDisplayBlock['dato'], string> = {
  disponible: 'Dato disponible',
  proxy: 'Proxy / estimación declarada',
  manual_usuario: 'Captura manual del usuario',
  no_disponible: 'Sin dato integrado en esta versión',
}

/** Evita cierre accidental de fence Markdown en contenido libre. */
export function fenceUserMultiline(text: string): string {
  const t = text.replace(/\r\n/g, '\n')
  return ['```text', t.replace(/\n```/g, '\n\\`\\`\\`'), '```'].join('\n')
}

export function buildPr3IndicatorsMarkdownSection(
  bundle: SocialStatsBundle,
  ctx: StatResolutionContext,
): string | null {
  const lines: string[] = []
  for (const indicatorId of SOCIAL_STATS_INDICATOR_ORDER) {
    const r = resolveOfficialStat(bundle, indicatorId, ctx)
    const s = r.slice
    if (!s) {
      lines.push(`- **${indicatorId}**: _sin fila en subconjunto actual_ · disponibilidad: \`${r.availability}\``)
      continue
    }
    lines.push(
      `- **${indicatorId}** — ${s.label}: **${s.value}** ${s.unit} · ámbito \`${s.geoLevel}\` · vintage \`${s.vintageLabel}\` · fuente \`${s.sourceId}\` · etiqueta geo: ${s.geoLabel}`,
    )
    if (r.availability === 'disponible_otro_ambito') {
      lines.push(`  - _Nota_: valor de otro ámbito territorial respecto al CVE solicitado (PR3).`)
    }
  }
  if (lines.length === 0) return null
  return ['## Indicadores sociodemográficos (PR3 · metadatos)', '', ...lines].join('\n')
}

export type BuildSocialContextExportMarkdownParams = {
  block: SociodemographicDisplayBlock
  /** Cuerpo disclaimer (p. ej. `SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER`). */
  disclaimerBody: string
  riskItems: readonly SocialRiskMatrixItem[]
  assumptionEntries: readonly SocialAssumptionLogEntry[]
  bitacoraTailN?: number
  pr3MarkdownSection: string | null
  /** ISO / etiqueta legible para auditoría. */
  generatedAtIso: string
  moduleAnchor?: string
}

export function buildSocialContextExportMarkdown(params: BuildSocialContextExportMarkdownParams): string {
  const n = params.bitacoraTailN ?? SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N
  const tail = params.assumptionEntries.slice(Math.max(0, params.assumptionEntries.length - n))

  const matrixLines = params.riskItems.map(item => {
    const url =
      item.fuente.estado === 'url_estable' && item.fuente.url?.trim()
        ? item.fuente.url.trim()
        : null
    const fuente = url ? `estable · ${item.fuente.etiqueta} · ${url}` : `pendiente · ${item.fuente.etiqueta}`
    return [
      `#### Ficha · \`${item.id}\``,
      `> **${item.titulo.replace(/\s+/g, ' ').trim()}**`,
      `- **id**: \`${item.id}\``,
      `- **ámbito (etiqueta)**: ${item.ambito_etiqueta}`,
      `- **fuente**: ${fuente}`,
      '',
      fenceUserMultiline(item.descripcion),
      '',
    ].join('\n')
  })

  const bitacoraLines =
    tail.length === 0
      ? ['_Sin entradas en la ventana exportada._']
      : tail.map((e, i) => {
          const header = `${i + 1}. ${e.timestamp}${e.origen ? ` · ${e.origen}` : ''}${e.manual ? ' · manual' : ''}`
          return [header, fenceUserMultiline(e.texto), ''].join('\n')
        })

  const pr3Parts =
    params.pr3MarkdownSection && params.pr3MarkdownSection.trim().length > 0
      ? ['', params.pr3MarkdownSection.trim(), '']
      : ['', '## Indicadores sociodemográficos (PR3 · metadatos)', '', '_Sin bloque PR3 generado._', '']

  const parts = [
    '# Resumen contexto social (PR5 — preview estático)',
    '',
    `> **Generado**: ${params.generatedAtIso} · documento no firmado · no sustituye acto administrativo ni envío institucional.`,
    params.moduleAnchor ? `> **Ancla módulo**: \`${params.moduleAnchor}\`` : null,
    '',
    '## Alcance y estado declarado',
    '',
    `- **Alcance geográfico (\`geo_scope\`)**: \`${params.block.geo_scope}\` — ${GEO_LABEL[params.block.geo_scope]}`,
    `- **Estado del dato (\`dato\`)**: \`${params.block.dato}\` — ${DATO_LABEL[params.block.dato]}`,
    `- **Fuente declarada (texto libre)**: `,
    '',
    fenceUserMultiline(params.block.fuente_declarada.trim() || '—'),
    '',
    '## Disclaimer (Auditoría ALQUIMIA)',
    '',
    fenceUserMultiline(params.disclaimerBody),
    '',
    `## Matriz cualitativa de riesgos (snapshot · versión ${SOCIAL_RISK_MATRIX_CONTENT_VERSION})`,
    '',
    ...matrixLines,
    `## Bitácora de supuestos (últimas ${n} entradas, orden cronológico)`,
    '',
    ...bitacoraLines,
    ...pr3Parts,
    '---',
    '',
    '*Fin del preview PR5. No enviar email ni webhooks desde esta capa; no persistencia backend.*',
  ]

  return parts.filter(Boolean).join('\n')
}
