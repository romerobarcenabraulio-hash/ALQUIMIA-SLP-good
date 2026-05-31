import { citationForMetric, hasMinimumEvidence } from '@/lib/citations'
import type { TenantMetric } from '@/lib/tenantDiagnosticData'

export type ComplianceLabel = 'referencia_metodologica' | 'cumplimiento_parcial' | 'cumplimiento_completo_bloqueado'

export interface PreExportAudit {
  label: ComplianceLabel
  canClaimFullCompliance: boolean
  canExportWithWarning: boolean
  missingCriticalCitations: string[]
  missingEvidence: string[]
  warnings: string[]
}

function metricName(metric: TenantMetric) {
  return metric.label || metric.id
}

export function auditMetricsForExport(metrics: TenantMetric[]): PreExportAudit {
  const missingEvidence = metrics
    .filter(metric => !hasMinimumEvidence(metric))
    .map(metricName)
  const missingCriticalCitations = metrics
    .filter(metric => metric.confidence !== 'critical_gap' && !citationForMetric(metric))
    .map(metricName)
  const criticalGaps = metrics
    .filter(metric => metric.confidence === 'critical_gap' || metric.status === 'brecha_critica')
    .map(metricName)

  const warnings = [
    ...missingEvidence.map(label => `${label}: falta fuente, fecha, método o confianza.`),
    ...missingCriticalCitations.map(label => `${label}: falta cita bibliográfica verificable.`),
    ...criticalGaps.map(label => `${label}: se conserva como brecha crítica, no como dato validado.`),
  ]

  if (missingEvidence.length || missingCriticalCitations.length) {
    return {
      label: 'cumplimiento_completo_bloqueado',
      canClaimFullCompliance: false,
      canExportWithWarning: true,
      missingCriticalCitations,
      missingEvidence,
      warnings,
    }
  }

  if (criticalGaps.length) {
    return {
      label: 'cumplimiento_parcial',
      canClaimFullCompliance: false,
      canExportWithWarning: true,
      missingCriticalCitations,
      missingEvidence,
      warnings,
    }
  }

  return {
    label: 'referencia_metodologica',
    canClaimFullCompliance: false,
    canExportWithWarning: true,
    missingCriticalCitations,
    missingEvidence,
    warnings: ['Los estándares se citan como referencia metodológica; no como certificación oficial.'],
  }
}
