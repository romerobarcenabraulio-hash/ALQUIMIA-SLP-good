import { CITATION_REGISTRY, type CitationRecord, type TenantMetric } from '@/lib/tenantDiagnosticData'

export function citationForMetric(metric: TenantMetric): CitationRecord | null {
  if (!metric.citation_id) return null
  return CITATION_REGISTRY[metric.citation_id] ?? null
}

export function formatBibliographyEntry(citation: CitationRecord): string {
  const parent = citation.parent_document ? ` ${citation.parent_document}.` : ''
  const url = citation.url ? ` ${citation.url}.` : ''
  return `${citation.institution}. "${citation.title}".${parent} ${citation.year_or_date}.${url} Consultado el ${citation.consulted_at}.`
}

export function buildBibliography(metrics: TenantMetric[]): string[] {
  const seen = new Set<string>()
  return metrics
    .map(citationForMetric)
    .filter((citation): citation is CitationRecord => Boolean(citation))
    .filter(citation => {
      if (seen.has(citation.id)) return false
      seen.add(citation.id)
      return true
    })
    .map(formatBibliographyEntry)
}

export function hasMinimumEvidence(metric: TenantMetric): boolean {
  return Boolean(metric.source && metric.source_date && metric.method && metric.confidence)
}

export function metricCitationLabel(metric: TenantMetric, metrics: TenantMetric[]): string {
  const citation = citationForMetric(metric)
  if (!citation) return 'sin cita'
  const ordered = metrics
    .map(item => citationForMetric(item))
    .filter((item): item is CitationRecord => Boolean(item))
  const ids = Array.from(new Set(ordered.map(item => item.id)))
  const index = ids.indexOf(citation.id)
  return index >= 0 ? String(index + 1) : 'sin cita'
}
