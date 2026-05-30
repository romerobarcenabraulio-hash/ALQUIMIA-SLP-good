import { MetricConfidencePill } from '@/components/MetricConfidencePill'
import type { TenantMetric } from '@/lib/tenantDiagnosticData'

type Props = {
  metrics: TenantMetric[]
  blockedClaims?: string[]
}

export function ModuleEvidenceFooter({ metrics, blockedClaims = [] }: Props) {
  if (!metrics.length && !blockedClaims.length) return null

  return (
    <footer className="mt-5 border-t border-[#E8E4DC] pt-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_0.8fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase text-[#6B6760]">
            Evidencia usada por este módulo
          </p>
          <div className="mt-3 grid gap-2">
            {metrics.length ? metrics.map(metric => (
              <div key={metric.id} className="min-w-0 rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
                <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="min-w-0 max-w-[24ch] text-[12px] font-semibold text-[#1C1B18] sm:flex-1 sm:max-w-none">{metric.label}</p>
                  <MetricConfidencePill confidence={metric.confidence} />
                </div>
                <p className="mt-2 max-w-[32ch] break-words text-[11px] leading-5 text-[#6B6760] sm:max-w-none">
                  Fuente: {metric.source} · Fecha: {metric.source_date} · Método: {metric.method} · Alcance: {metric.territorial_scope}
                </p>
              </div>
            )) : (
              <p className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-3 text-[12px] text-[#6B6760]">
                Este módulo conserva su lugar en el índice. Falta evidencia local suficiente para mostrar cifras.
              </p>
            )}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase text-[#6B6760]">
            Claims bloqueados o condicionados
          </p>
          <ul className="mt-3 space-y-2">
            {(blockedClaims.length ? blockedClaims : ['No se publica conclusión municipal sin fuente, fecha, método y confianza.']).map(claim => (
              <li key={claim} className="rounded-[8px] border border-[#EBC0BA] bg-[#FBEAEA] p-3 text-[12px] leading-5 text-[#7A251F]">
                {claim}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
