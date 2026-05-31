import { citationForMetric, metricCitationLabel } from '@/lib/citations'
import type { TenantMetric } from '@/lib/tenantDiagnosticData'

export function Citation({ metric, metrics }: { metric: TenantMetric; metrics: TenantMetric[] }) {
  const citation = citationForMetric(metric)
  if (!citation) {
    return (
      <span className="ml-1 align-super text-[10px] font-semibold text-[#A8322A]" title="Sin fuente suficiente; se marca como brecha o pendiente.">
        sin cita
      </span>
    )
  }

  const label = metricCitationLabel(metric, metrics)
  const title = `${citation.institution}. "${citation.title}". ${citation.year_or_date}. Consultado el ${citation.consulted_at}.`
  return (
    <sup
      className="ml-1 cursor-help rounded-full border border-[#D8D2C5] px-1 text-[10px] font-semibold text-[#5F584A]"
      title={title}
      aria-label={`Cita ${label}: ${title}`}
    >
      {label}
    </sup>
  )
}
