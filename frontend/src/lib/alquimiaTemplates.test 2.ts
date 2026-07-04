import { describe, expect, it } from 'vitest'
import { ALQUIMIA_TEMPLATE_REGISTRY, buildTemplateReadiness } from './alquimiaTemplates'
import { tenantDiagnosticDataFor } from './tenantDiagnosticData'

describe('alquimia template registry', () => {
  it('keeps exported document templates and critical placeholders registered', () => {
    const expediente = ALQUIMIA_TEMPLATE_REGISTRY.find(template => template.id === 'expediente_diagnostico_cabildo')

    expect(ALQUIMIA_TEMPLATE_REGISTRY).toHaveLength(7)
    expect(expediente?.filename).toBe('V01_EXPEDIENTE_DIAGNOSTICO_CABILDO.docx')
    expect(expediente?.variables).toContain('MUNICIPIO')
    expect(expediente?.variables).toContain('POBLACION')
    expect(expediente?.variables).toContain('GENERACION_TOTAL')
    expect(expediente?.variables).toContain('FECHA_REGLAMENTO_VIGENTE')
  })

  it('marks tenant-derived variables ready and unsupported variables pending', () => {
    const readiness = buildTemplateReadiness(tenantDiagnosticDataFor('municipio-demo'))
    const expediente = readiness.find(item => item.template.id === 'expediente_diagnostico_cabildo')

    expect(expediente?.variables.find(item => item.variable === 'MUNICIPIO')).toMatchObject({
      status: 'ready',
      valuePreview: 'San Luis Potosí',
    })
    expect(expediente?.variables.find(item => item.variable === 'POBLACION')).toMatchObject({
      status: 'ready',
      valuePreview: '911908 hab.',
    })
    expect(expediente?.variables.find(item => item.variable === 'FECHA_REGLAMENTO_VIGENTE')).toMatchObject({
      status: 'pending',
    })
  })
})
