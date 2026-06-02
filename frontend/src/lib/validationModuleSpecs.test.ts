import { describe, expect, it } from 'vitest'
import {
  EXECUTION_MODULE_ORDER,
  OPERATIONAL_MODULE_SPECS,
  PLANNING_MODULE_ORDER,
  VALIDATION_MODULE_ORDER,
  VALIDATION_MODULE_SPECS,
  modulesForStage,
  validationModuleSpecFor,
} from './validationModuleSpecs'

describe('validation module operational specs', () => {
  it('assigns modules to validation, planning and execution without dropping M05-M12 or M16-M21', () => {
    expect(modulesForStage('validation')).toEqual([...VALIDATION_MODULE_ORDER])
    expect(modulesForStage('planning')).toEqual([...PLANNING_MODULE_ORDER])
    expect(modulesForStage('execution')).toEqual([...EXECUTION_MODULE_ORDER])
  })

  it('requires sections, completion criterion and claim guardrails for every operational module', () => {
    const moduleIds = [...VALIDATION_MODULE_ORDER, ...PLANNING_MODULE_ORDER, ...EXECUTION_MODULE_ORDER]
    expect(Object.keys(OPERATIONAL_MODULE_SPECS).sort()).toEqual([...moduleIds].sort())
    for (const moduleId of moduleIds) {
      const spec = validationModuleSpecFor(moduleId)
      expect(spec, moduleId).toBeTruthy()
      expect(spec?.sections.length, moduleId).toBeGreaterThan(0)
      expect(spec?.completionCriterion, moduleId).toBeTruthy()
      expect(spec?.visualization, moduleId).toBeTruthy()
      expect(spec?.blockedClaims.length, moduleId).toBeGreaterThan(0)
    }
  })

  it('keeps planning and execution modules on shell-compatible specs', () => {
    expect(validationModuleSpecFor('mercado_materiales')?.stage).toBe('planning')
    expect(validationModuleSpecFor('mercado_materiales')?.blockedClaims.join(' ')).toContain('Precio oficial')
    expect(validationModuleSpecFor('risk_dashboard')?.stage).toBe('execution')
    expect(validationModuleSpecFor('risk_dashboard')?.blockedClaims.join(' ')).toContain('Gate cerrado automáticamente')
  })

  it('keeps calculation as valid only when explicitly labelled and scoped', () => {
    const m01 = VALIDATION_MODULE_SPECS.city_baseline
    const generation = m01.sections.find(section => section.id === 'generation')
    expect(generation?.allowedOrigins).toContain('calculated')
    expect(generation?.allowedScopes).toContain('benchmark')
    expect(m01.blockedClaims.join(' ')).toContain('dato oficial')
  })

  it('keeps M13 client-facing wording away from TIR/VPN headline promises', () => {
    const m13 = VALIDATION_MODULE_SPECS.escenarios_financieros
    expect(m13.subtitle).toBe('Captura, costos y sensibilidad · M13')
    expect(`${m13.title} ${m13.subtitle}`).not.toMatch(/TIR|VPN|Monte Carlo/i)
    expect(m13.blockedClaims.join(' ')).toContain('TIR/VPN')
  })

  it('makes M15 a claim-evidence module instead of a plain compiler', () => {
    const m15 = VALIDATION_MODULE_SPECS.expediente_cabildo
    expect(m15.visualization).toContain('Matriz evidencia por claim')
    expect(m15.sections[0].requiredFields).toContain('Claim')
    expect(m15.blockedClaims.join(' ')).toContain('Claim sin ledger')
  })
})
