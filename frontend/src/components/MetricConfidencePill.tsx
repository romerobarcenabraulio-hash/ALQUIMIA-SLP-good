import type { MetricConfidence } from '@/lib/tenantDiagnosticData'

const labels: Record<MetricConfidence, string> = {
  verified_official: 'Verificado oficial',
  verified_secondary: 'Fuente secundaria',
  inferred_medium: 'Inferido',
  inferred_low: 'Inferido',
  pending_validation: 'Pendiente de validación',
  critical_gap: 'Brecha crítica',
}

const classes: Record<MetricConfidence, string> = {
  verified_official: 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]',
  verified_secondary: 'border-[#D8D2C5] bg-[#FDFCFA] text-[#4A4740]',
  inferred_medium: 'border-[#E1C98E] bg-[#FFF8E8] text-[#8A5C05]',
  inferred_low: 'border-[#E1C98E] bg-[#FFF8E8] text-[#8A5C05]',
  pending_validation: 'border-[#D8D2C5] bg-[#F4F2ED] text-[#6B6760]',
  critical_gap: 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]',
}

export function MetricConfidencePill({ confidence }: { confidence: MetricConfidence }) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${classes[confidence]}`}>
      {labels[confidence]}
    </span>
  )
}
