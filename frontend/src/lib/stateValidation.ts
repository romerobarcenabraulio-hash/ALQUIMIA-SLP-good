/**
 * State Validation Framework
 * Ensures data integrity at save time and prevents corrupted states from spreading
 * Critical for production reliability
 */

import type { SimulatorState } from '@/types'

export type ValidationLevel = 'strict' | 'warn' | 'silent'

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  context?: Record<string, unknown>
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  fixedState?: Partial<SimulatorState>
}

/**
 * Core validation rules - ensures critical data integrity
 */
const VALIDATION_RULES = {
  horizonte: (value: unknown): ValidationError[] => {
    const errors: ValidationError[] = []

    if (typeof value !== 'number') {
      errors.push({
        field: 'horizonte',
        message: 'Horizonte must be a number',
        severity: 'error',
      })
      return errors
    }

    if (value < 1 || value > 50) {
      errors.push({
        field: 'horizonte',
        message: 'Horizonte must be between 1 and 50 years',
        severity: 'error',
      })
    }

    if (!Number.isInteger(value)) {
      errors.push({
        field: 'horizonte',
        message: 'Horizonte must be an integer',
        severity: 'warning',
      })
    }

    return errors
  },

  municipiosActivos: (value: unknown): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!Array.isArray(value)) {
      errors.push({
        field: 'municipiosActivos',
        message: 'Municipios activos must be an array',
        severity: 'error',
      })
      return errors
    }

    if (value.length === 0) {
      errors.push({
        field: 'municipiosActivos',
        message: 'At least one municipality must be selected',
        severity: 'error',
      })
    }

    if (value.length > 20) {
      errors.push({
        field: 'municipiosActivos',
        message: 'Maximum 20 municipalities can be selected',
        severity: 'error',
      })
    }

    value.forEach((m, i) => {
      if (typeof m !== 'string' || m.trim().length === 0) {
        errors.push({
          field: `municipiosActivos[${i}]`,
          message: 'Municipality must be a non-empty string',
          severity: 'error',
        })
      }
    })

    return errors
  },

  pctCapturaPorAño: (value: unknown, horizonte?: number): ValidationError[] => {
    const errors: ValidationError[] = []

    if (!Array.isArray(value)) {
      errors.push({
        field: 'pctCapturaPorAño',
        message: 'Capture percentages must be an array',
        severity: 'error',
      })
      return errors
    }

    value.forEach((pct, i) => {
      if (typeof pct !== 'number') {
        errors.push({
          field: `pctCapturaPorAño[${i}]`,
          message: 'Capture percentage must be a number',
          severity: 'error',
        })
        return
      }

      if (pct < 0 || pct > 100) {
        errors.push({
          field: `pctCapturaPorAño[${i}]`,
          message: 'Capture percentage must be between 0 and 100',
          severity: 'error',
          context: { value: pct, year: i },
        })
      }
    })

    if (horizonte && value.length !== horizonte) {
      errors.push({
        field: 'pctCapturaPorAño',
        message: `Expected ${horizonte} values (one per year), got ${value.length}`,
        severity: 'warning',
      })
    }

    return errors
  },

  precios: (value: unknown): ValidationError[] => {
    const errors: ValidationError[] = []

    if (value === null || value === undefined) {
      return errors // Optional field
    }

    if (typeof value !== 'object') {
      errors.push({
        field: 'precios',
        message: 'Material prices must be an object',
        severity: 'error',
      })
      return errors
    }

    const prices = value as Record<string, number>
    const validMaterials = ['pet', 'hdpe', 'papel', 'vidrio', 'aluminio', 'organico']

    Object.entries(prices).forEach(([material, price]) => {
      if (!validMaterials.includes(material)) {
        errors.push({
          field: `precios.${material}`,
          message: `Unknown material type: ${material}`,
          severity: 'warning',
        })
      }

      if (typeof price !== 'number' || price < 0) {
        errors.push({
          field: `precios.${material}`,
          message: 'Price must be a non-negative number',
          severity: 'error',
          context: { value: price },
        })
      }

      if (price > 1000000) {
        errors.push({
          field: `precios.${material}`,
          message: 'Price seems unusually high - check for decimal errors',
          severity: 'warning',
          context: { value: price },
        })
      }
    })

    return errors
  },


  moduleProgression: (value: unknown): ValidationError[] => {
    const errors: ValidationError[] = []

    if (typeof value !== 'object' || value === null) {
      return errors // Optional
    }

    const prog = value as Record<string, unknown>

    if (!('statusByModule' in prog)) {
      errors.push({
        field: 'moduleProgression.statusByModule',
        message: 'Module progression missing statusByModule',
        severity: 'error',
      })
    }

    if (!('completedModules' in prog)) {
      errors.push({
        field: 'moduleProgression.completedModules',
        message: 'Module progression missing completedModules',
        severity: 'error',
      })
    }

    return errors
  },
}

/**
 * Comprehensive state validation
 */
export function validateState(state: Partial<SimulatorState>, level: ValidationLevel = 'strict'): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validate each field
  if ('horizonte' in state && state.horizonte !== undefined) {
    const errs = VALIDATION_RULES.horizonte(state.horizonte)
    errs.forEach(e => (e.severity === 'error' ? errors : warnings).push(e))
  }

  if ('municipiosActivos' in state && state.municipiosActivos !== undefined) {
    const errs = VALIDATION_RULES.municipiosActivos(state.municipiosActivos)
    errs.forEach(e => (e.severity === 'error' ? errors : warnings).push(e))
  }

  if ('pctCapturaPorAño' in state && state.pctCapturaPorAño !== undefined) {
    const errs = VALIDATION_RULES.pctCapturaPorAño(state.pctCapturaPorAño, state.horizonte)
    errs.forEach(e => (e.severity === 'error' ? errors : warnings).push(e))
  }

  if ('precios' in state && state.precios !== undefined) {
    const errs = VALIDATION_RULES.precios(state.precios)
    errs.forEach((e) => (e.severity === 'error' ? errors : warnings).push(e))
  }

  if ('moduleProgression' in state && state.moduleProgression !== undefined) {
    const errs = VALIDATION_RULES.moduleProgression(state.moduleProgression)
    errs.forEach(e => (e.severity === 'error' ? errors : warnings).push(e))
  }

  // Determine validity based on level
  let isValid = errors.length === 0
  if (level === 'warn') {
    isValid = errors.length === 0
  } else if (level === 'silent') {
    isValid = true // Always valid, just log issues
  }

  return {
    isValid,
    errors,
    warnings,
  }
}

/**
 * Validate before save - prevents corrupted data from persisting
 */
export function validateBeforeSave(state: Partial<SimulatorState>): { valid: boolean; errors: ValidationError[] } {
  const result = validateState(state, 'strict')

  if (!result.isValid) {
    console.error('[Validation] Save validation failed:', result.errors)
  }

  if (result.warnings.length > 0) {
    console.warn('[Validation] Warnings during save:', result.warnings)
  }

  return {
    valid: result.isValid,
    errors: result.errors,
  }
}

/**
 * Validate loaded state - ensures integrity on restore
 */
export function validateLoadedState(state: Record<string, unknown>): { valid: boolean; errors: ValidationError[] } {
  const result = validateState(state as Partial<SimulatorState>, 'warn')

  if (!result.isValid) {
    console.error('[Validation] Loaded state has critical errors:', result.errors)
  }

  if (result.warnings.length > 0) {
    console.warn('[Validation] Loaded state has warnings:', result.warnings)
  }

  return {
    valid: result.isValid,
    errors: result.errors.concat(result.warnings),
  }
}

/**
 * Check for common data corruption patterns
 */
export function detectCorruption(state: Record<string, unknown>): ValidationError[] {
  const issues: ValidationError[] = []

  // NaN values
  Object.entries(state).forEach(([key, value]) => {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      issues.push({
        field: key,
        message: `Field contains NaN or Infinity: ${value}`,
        severity: 'error',
      })
    }
  })

  // Negative values that shouldn't be
  const nonnegativeFields = ['horizonte', 'pctCapturaPorAño']
  nonnegativeFields.forEach(field => {
    if (field in state) {
      const value = state[field]
      if (typeof value === 'number' && value < 0) {
        issues.push({
          field,
          message: `Field should not be negative: ${value}`,
          severity: 'error',
        })
      }
    }
  })

  // Circular references would be caught at JSON.stringify time
  try {
    JSON.stringify(state)
  } catch (e) {
    issues.push({
      field: 'root',
      message: 'State contains circular references or non-serializable data',
      severity: 'error',
    })
  }

  return issues
}
