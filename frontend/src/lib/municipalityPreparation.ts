import type { TenantDiagnosticData } from '@/lib/tenantDiagnosticData'

export type MunicipalityPreparationStatus =
  | 'sin_preparar'
  | 'reglamento_identificado'
  | 'reglamento_cargado'
  | 'bibliografia_minima'
  | 'listo_para_cliente'
  | 'en_cliente'

export interface MunicipalityPreparationSummary {
  status: MunicipalityPreparationStatus
  label: string
  nextAction: string
}

export const MUNICIPALITY_PREPARATION_LABELS: Record<MunicipalityPreparationStatus, string> = {
  sin_preparar: 'Sin preparar',
  reglamento_identificado: 'Reglamento identificado',
  reglamento_cargado: 'Reglamento cargado',
  bibliografia_minima: 'Bibliografía mínima',
  listo_para_cliente: 'Listo para cliente',
  en_cliente: 'En cliente',
}

function hasRegulation(data: TenantDiagnosticData) {
  const regulationGap = data.document_gaps.find(gap => gap.document_type === 'reglamento_limpia' && !gap.marked_not_applicable)
  const regulationDocument = data.tenant_documents.some(document => document.document_type === 'reglamento_limpia')
  return regulationDocument || !regulationGap || regulationGap.status !== 'pending'
}

function hasMinimumBibliography(data: TenantDiagnosticData) {
  const citedMetrics = data.metrics.filter(metric => Boolean(metric.citation_id))
  const usableMetrics = data.metrics.filter(metric =>
    metric.status === 'verificado'
    || metric.status === 'inferido'
    || Boolean(metric.formula)
    || Boolean(metric.derived_from?.length)
    || metric.value !== null,
  )
  return citedMetrics.length >= 2 && usableMetrics.length >= 2
}

function hasClientLinked(options?: { tenantLinked?: boolean; userLinked?: boolean }) {
  return Boolean(options?.tenantLinked && options?.userLinked)
}

export function buildMunicipalityPreparationSummary(
  data: TenantDiagnosticData | null,
  options: { tenantLinked?: boolean; userLinked?: boolean } = {},
): MunicipalityPreparationSummary {
  if (!data) {
    return {
      status: 'sin_preparar',
      label: MUNICIPALITY_PREPARATION_LABELS.sin_preparar,
      nextAction: 'Crear expediente preliminar desde catálogo INEGI.',
    }
  }
  if (hasClientLinked(options)) {
    return {
      status: 'en_cliente',
      label: MUNICIPALITY_PREPARATION_LABELS.en_cliente,
      nextAction: 'Operar tenant, usuarios, documentos, gates y exports desde admin.',
    }
  }
  const regulationReady = hasRegulation(data)
  const bibliographyReady = hasMinimumBibliography(data)
  if (regulationReady && bibliographyReady) {
    return {
      status: 'listo_para_cliente',
      label: MUNICIPALITY_PREPARATION_LABELS.listo_para_cliente,
      nextAction: 'Previsualizar como cliente y vincular usuario real.',
    }
  }
  if (bibliographyReady) {
    return {
      status: 'bibliografia_minima',
      label: MUNICIPALITY_PREPARATION_LABELS.bibliografia_minima,
      nextAction: 'Cargar o validar reglamento antes de emitir plan/declaratoria.',
    }
  }
  if (regulationReady) {
    return {
      status: 'reglamento_cargado',
      label: MUNICIPALITY_PREPARATION_LABELS.reglamento_cargado,
      nextAction: 'Cargar bibliografía mínima y evidencia comparable trazable.',
    }
  }
  const identified = data.document_gaps.some(gap => gap.document_type === 'reglamento_limpia')
  return {
    status: identified ? 'reglamento_identificado' : 'sin_preparar',
    label: identified ? MUNICIPALITY_PREPARATION_LABELS.reglamento_identificado : MUNICIPALITY_PREPARATION_LABELS.sin_preparar,
    nextAction: identified
      ? 'Subir reglamento identificado o marcar fuente oficial disponible.'
      : 'Identificar reglamento municipal o crear expediente preliminar.',
  }
}
