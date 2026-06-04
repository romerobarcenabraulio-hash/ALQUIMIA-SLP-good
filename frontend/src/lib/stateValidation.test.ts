import { describe, it, expect } from 'vitest'
import {
  validateState,
  validateBeforeSave,
  validateLoadedState,
  detectCorruption,
} from '@/lib/stateValidation'

describe('State Validation', () => {
  describe('horizonte validation', () => {
    it('accepts valid horizonte values', () => {
      const result = validateState({ horizonte: 10 }, 'strict')
      expect(result.isValid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('rejects invalid horizonte values', () => {
      const result = validateState({ horizonte: 100 }, 'strict')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'horizonte')).toBe(true)
    })

    it('rejects non-numeric horizonte', () => {
      const result = validateState({ horizonte: 'ten' as any }, 'strict')
      expect(result.isValid).toBe(false)
      expect(result.errors[0]?.message).toContain('must be a number')
    })
  })

  describe('municipiosActivos validation', () => {
    it('accepts valid municipality array', () => {
      const result = validateState({ municipiosActivos: ['slp-capital', 'aguascalientes'] }, 'strict')
      expect(result.isValid).toBe(true)
    })

    it('rejects empty municipality array', () => {
      const result = validateState({ municipiosActivos: [] }, 'strict')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'municipiosActivos')).toBe(true)
    })

    it('rejects too many municipalities', () => {
      const result = validateState({
        municipiosActivos: Array(25).fill('municipality'),
      }, 'strict')
      expect(result.isValid).toBe(false)
    })
  })

  describe('pctCapturaPorAño validation', () => {
    it('accepts valid capture percentages', () => {
      const result = validateState({
        pctCapturaPorAño: [10, 20, 30, 40, 50],
        horizonte: 5,
      }, 'strict')
      expect(result.isValid).toBe(true)
    })

    it('rejects percentages out of range', () => {
      const result = validateState({
        pctCapturaPorAño: [10, 150, 30],
      }, 'strict')
      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.field === 'pctCapturaPorAño[1]')).toBe(true)
    })

    it('rejects mismatched array length', () => {
      const result = validateState({
        pctCapturaPorAño: [10, 20, 30],
        horizonte: 5,
      }, 'strict')
      expect(result.warnings.length > 0).toBe(true)
    })
  })

  describe('preciosMaterial validation', () => {
    it('accepts valid material prices', () => {
      const result = validateState({
        preciosMaterial: {
          pet: 8.50,
          hdpe: 6.00,
          papel: 4.25,
          vidrio: 1.50,
        },
      }, 'strict')
      expect(result.isValid).toBe(true)
    })

    it('rejects negative prices', () => {
      const result = validateState({
        preciosMaterial: { pet: -5 },
      }, 'strict')
      expect(result.isValid).toBe(false)
    })

    it('warns on unusually high prices', () => {
      const result = validateState({
        preciosMaterial: { pet: 999999999 },
      }, 'strict')
      expect(result.warnings.length > 0).toBe(true)
    })
  })

  describe('validateBeforeSave', () => {
    it('prevents save with critical errors', () => {
      const result = validateBeforeSave({ horizonte: -5 })
      expect(result.valid).toBe(false)
    })

    it('allows save with valid state', () => {
      const result = validateBeforeSave({
        horizonte: 10,
        municipiosActivos: ['test'],
        pctCapturaPorAño: [10, 20, 30, 40, 50, 6, 7, 8, 9, 10],
      })
      expect(result.valid).toBe(true)
    })
  })

  describe('detectCorruption', () => {
    it('detects NaN values', () => {
      const corrupted = detectCorruption({ value: NaN })
      expect(corrupted.length > 0).toBe(true)
      expect(corrupted[0]?.message).toContain('NaN')
    })

    it('detects Infinity', () => {
      const corrupted = detectCorruption({ value: Infinity })
      expect(corrupted.length > 0).toBe(true)
    })

    it('detects negative values in forbidden fields', () => {
      const corrupted = detectCorruption({ horizonte: -1 })
      expect(corrupted.length > 0).toBe(true)
    })

    it('detects circular references', () => {
      const circular: any = { a: 1 }
      circular.self = circular
      const corrupted = detectCorruption(circular)
      expect(corrupted.length > 0).toBe(true)
    })

    it('passes clean state', () => {
      const clean = detectCorruption({
        horizonte: 10,
        municipiosActivos: ['test'],
      })
      expect(clean.length).toBe(0)
    })
  })
})
