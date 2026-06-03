/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ModuleEditorialBrief } from '@/components/simulator/ModuleEditorialBrief'
import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
import { getRailActionLabel } from '@/lib/editorialRailLabels'
import { SIMULATOR_STATE_DEFAULT, useSimulatorStore } from '@/store/simulatorStore'

const FUNCTIONARY_MODULES = [
  'city_baseline',
  'social_diagnostico',
  'organigrama_diagnostico',
  'evaluacion_socioeconomica',
  'ruta_critica',
  'oleadas_territoriales',
  'plan_educativo',
  'marco_legal',
  'plan_maestro',
  'infraestructura',
  'mercado_materiales',
  'inspeccion',
  'escenarios_financieros',
  'trazabilidad',
]

describe('ModuleEditorialBrief', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    useSimulatorStore.setState({
      ...SIMULATOR_STATE_DEFAULT,
      audience: 'functionary',
      zmActiva: 'SLP',
      municipiosActivos: ['slp'],
    })
  })

  it('renderiza resumen editorial para cada modulo funcionario', () => {
    for (const moduleId of FUNCTIONARY_MODULES) {
      const { unmount } = render(<ModuleEditorialBrief moduleId={moduleId} />)

      expect(screen.getByTestId(`module-editorial-brief-${moduleId}`)).toBeTruthy()
      expect(screen.getByText(/Contexto del módulo/)).toBeTruthy()
      expect(screen.getByText(/Qué muestra el análisis/)).toBeTruthy()
      expect(screen.getByText(/Qué decide el funcionario aquí/)).toBeTruthy()
      expect(screen.getByText(getRailActionLabel(moduleId))).toBeTruthy()

      unmount()
    }
  })

  it('no usa dictamen como salida visible en los briefs', () => {
    const renderedText = FUNCTIONARY_MODULES.map(moduleId => {
      const brief = getModuleEditorialBrief(moduleId, {
        territorio: 'San Luis Potosí',
        scope: 'municipio',
        municipio: null,
        municipiosCount: 1,
      })
      return JSON.stringify(brief)
    }).join(' ')

    expect(renderedText.toLowerCase()).not.toContain('dictamen')
    expect(renderedText.toLowerCase()).not.toContain('sanción firme')
    expect(renderedText.toLowerCase()).not.toContain('certificado')
  })

  it('marco juridico distingue municipio de ZM', () => {
    const single = getModuleEditorialBrief('marco_legal', {
      territorio: 'San Luis Potosí',
      scope: 'municipio',
      municipio: null,
      municipiosCount: 1,
    })
    const zm = getModuleEditorialBrief('marco_legal', {
      territorio: 'Zona Metropolitana de San Luis Potosí',
      scope: 'zm',
      municipio: null,
      municipiosCount: 4,
    })

    expect(single?.observacion_alquimia).toContain('municipio propio')
    expect(zm?.observacion_alquimia).toContain('cada municipio conserva reglamento')
  })

  it('inspeccion no presenta multa ni sancion firme como conclusion', () => {
    const brief = getModuleEditorialBrief('inspeccion', {
      territorio: 'San Luis Potosí',
      scope: 'municipio',
      municipio: null,
      municipiosCount: 1,
    })
    const text = JSON.stringify(brief).toLowerCase()

    expect(text).not.toContain('multa')
    expect(text).not.toContain('sanción firme')
    expect(text).toContain('evidencia')
  })

  it('escenarios separa derrama base, ahorro publico y externalidades', () => {
    const brief = getModuleEditorialBrief('escenarios_financieros', {
      territorio: 'San Luis Potosí',
      scope: 'municipio',
      municipio: null,
      municipiosCount: 1,
    })
    const text = JSON.stringify(brief).toLowerCase()

    expect(text).toContain('derrama base')
    expect(text).toContain('pago evitable')
    expect(text).toContain('externalidades')
  })

  it('modulos pyramid no usan jerga prohibida R3', () => {
    const pyramidModules = [
      'city_baseline',
      'social_diagnostico',
      'mapeo_actores',
      'organigrama_diagnostico',
      'marco_legal',
      'costo_omision',
      'escenarios_financieros',
      'riesgos_modelo',
      'expediente_cabildo',
    ]
    const forbidden = /contrafactual|operacionalizar|instrumento|habilitador|facilitador|implementación robusta/i
    for (const moduleId of pyramidModules) {
      const brief = getModuleEditorialBrief(moduleId, {
        territorio: 'San Luis Potosí',
        scope: 'municipio',
        municipio: null,
        municipiosCount: 1,
        metrics: {
          enterradoAnual: 26_600_000,
          capexTotal: 48_000_000,
          vivActivas: 254_000,
          costoOmisionTotalM: 2239,
          ahorroSaludProgramaM: 437,
          tir: 52.7,
          paybackMeses: 6,
          horizonte: 10,
        },
      })
      const text = JSON.stringify(brief)
      expect(text).not.toMatch(forbidden)
      expect(brief?.subtitulo_catchy).toBe('')
    }
  })

  it('bibliografia se presenta como matriz de trazabilidad', () => {
    const brief = getModuleEditorialBrief('trazabilidad', {
      territorio: 'San Luis Potosí',
      scope: 'municipio',
      municipio: null,
      municipiosCount: 1,
    })

    expect(brief?.situacion_actual).toContain('afirmación')
    expect(brief?.observacion_alquimia).toContain('matriz')
    expect(brief?.fuente_o_evidencia).toContain('Source Verification Matrix')
  })
})
