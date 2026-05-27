import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  resolveModuleStandards,
  STANDARDS_MODULE_COUNT,
  toModuleCode,
} from '@/lib/standardsMap'
import { FUNCTIONARY_MODULE_ORDER } from '@/lib/chapterConfig'

describe('standardsMap', () => {
  it('frontend/data está sincronizado con docs/architecture (fuente canónica)', () => {
    const docsPath = resolve(__dirname, '../../../docs/architecture/standards_map.json')
    const dataPath = resolve(__dirname, '../data/standards_map.json')
    expect(readFileSync(dataPath, 'utf8')).toBe(readFileSync(docsPath, 'utf8'))
  })
  it('publica 37 módulos activos en el mapa canónico', () => {
    expect(STANDARDS_MODULE_COUNT).toBe(37)
  })

  it('resuelve module_id canónico a registro M-code', () => {
    const m01 = resolveModuleStandards('city_baseline')
    expect(m01?.module_id).toBe('M01')
    expect(m01?.standards.some(s => s.code === 'GRI 306-1')).toBe(true)
  })

  it('M01 cita GRI 306:2020 y SASB IF-WM alineados con auditoría', () => {
    const m01 = resolveModuleStandards('city_baseline')!
    const codes = m01.standards.map(s => s.code)
    expect(codes).toContain('GRI 306-3')
    expect(codes).toContain('GRI 306-4')
    expect(codes).toContain('GRI 306-5')
    expect(codes).toContain('SASB IF-WM-000.D')
    expect(codes).not.toContain('SASB IF-WM-150a.1')
  })

  it('cubre guía M00 y todos los módulos del journey funcionario', () => {
    const guia = resolveModuleStandards('guia_circularidad')
    expect(guia?.status).toBe('no_aplica')

    for (const id of FUNCTIONARY_MODULE_ORDER) {
      const record = resolveModuleStandards(id)
      expect(record, `missing standards for ${id} (${toModuleCode(id)})`).not.toBeNull()
    }
  })

  it('no usa códigos genéricos prohibidos en entradas activas', () => {
    const forbidden = [/^(GRI 306|SASB|ISO 14001)$/, /^GRI 306[^-:]/]
    for (const mod of ['M01', 'M06', 'M08', 'M10', 'M14'] as const) {
      const record = resolveModuleStandards(mod)!
      for (const s of record.standards) {
        for (const pat of forbidden) {
          expect(s.code).not.toMatch(pat)
        }
        if (s.code.startsWith('ISO 14001')) {
          expect(s.code).toContain(':2015')
        }
        if (s.code.startsWith('SASB')) {
          expect(s.code).toMatch(/IF-WM/)
        }
      }
    }
  })

  it('devuelve null para módulo desconocido → footer muestra revisión', () => {
    expect(resolveModuleStandards('modulo_inexistente')).toBeNull()
  })
})
