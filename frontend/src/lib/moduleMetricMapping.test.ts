import { describe, expect, it } from 'vitest'
import { metricsForConsultingModule } from '@/lib/moduleMetricMapping'
import { tenantDiagnosticDataFor } from '@/lib/tenantDiagnosticData'

describe('moduleMetricMapping', () => {
  it('keeps M01 focused on RSU baseline evidence', () => {
    const metrics = tenantDiagnosticDataFor('municipio-demo').metrics
    const labels = metricsForConsultingModule('city_baseline', metrics).map(metric => metric.label)

    expect(labels).toContain('Generación RSU')
    expect(labels).toContain('Caracterización física local')
    expect(labels).toContain('Estudio de rutas y tiempos')
    expect(labels).not.toContain('Aceptación a pago por servicio')
  })

  it('does not leak baseline numbers into M13 when market evidence is absent', () => {
    const metrics = tenantDiagnosticDataFor('partial-city').metrics

    expect(metricsForConsultingModule('escenarios_financieros', metrics)).toEqual([])
  })

  it('keeps social metrics in M02 without showing them as financial scenario inputs', () => {
    const metrics = tenantDiagnosticDataFor('gap-city').metrics
    const socialLabels = metricsForConsultingModule('social_diagnostico', metrics).map(metric => metric.label)
    const scenarioLabels = metricsForConsultingModule('escenarios_financieros', metrics).map(metric => metric.label)

    expect(socialLabels).toContain('Aceptación a pago por servicio')
    expect(scenarioLabels).not.toContain('Aceptación a pago por servicio')
  })
})
