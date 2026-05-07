import { describe, expect, it } from 'vitest'
import {
  getNarrativaIntro,
  resolveCitizenNarrativaContext,
} from '@/lib/narrativaIntro'
import { SIMULATOR_STATE_DEFAULT } from '@/store/simulatorStore'

describe('Q-018 · narrativa ciudadana y territorio', () => {
  it('municipio único por chips (sin catálogo INEGI) usa nombre y población del municipio, no la ZM', () => {
    const state = {
      ...SIMULATOR_STATE_DEFAULT,
      zmActiva: 'SLP',
      municipiosActivos: ['sol'],
      seleccionMunicipioCatalog: null,
    }
    const ctx = resolveCitizenNarrativaContext(state)
    expect(ctx).not.toBeNull()
    expect(ctx!.scope).toBe('municipio')
    expect(ctx!.territorioNombre).toContain('Soledad')
    expect(ctx!.poblacion).toBe(323409)
    expect(ctx!.municipioId).toBe('sol')
  })

  it('ZM completa usa etiqueta metropolitana y población agregada', () => {
    const state = {
      ...SIMULATOR_STATE_DEFAULT,
      zmActiva: 'SLP',
      municipiosActivos: ['slp', 'sol', 'csp', 'vip'],
      seleccionMunicipioCatalog: null,
    }
    const ctx = resolveCitizenNarrativaContext(state)
    expect(ctx).not.toBeNull()
    expect(ctx!.scope).toBe('zm_completa')
    expect(ctx!.territorioNombre).toContain('San Luis Potosí')
    expect(ctx!.poblacion).toBeGreaterThan(323409)
  })

  it('getNarrativaIntro menciona el municipio cuando el alcance es municipio', () => {
    const text = getNarrativaIntro(
      'sol',
      'Soledad de Graciano Sánchez',
      323_409,
      320,
      'Realista',
      false,
      'municipio',
    )
    expect(text.length).toBeGreaterThan(40)
    expect(text.toLowerCase()).not.toContain('zona metropolitana')
  })

  it('getNarrativaIntro usa marco ZM cuando el alcance es zm_completa', () => {
    const text = getNarrativaIntro(
      'SLP',
      'ZM San Luis Potosí',
      1_243_980,
      1200,
      'Realista',
      false,
      'zm_completa',
    )
    expect(text.toLowerCase()).toContain('zona metropolitana')
  })
})
