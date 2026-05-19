/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FuncionariosViviendaRsuModel } from '@/components/simulator/FuncionariosViviendaRsuModel'
import { ReferenciasCalculos } from '@/components/simulator/ReferenciasCalculos'
import { PRECIOS_DEFAULTS } from '@/lib/constants'
import { SIMULATOR_STATE_DEFAULT, useSimulatorStore } from '@/store/simulatorStore'

describe('FuncionariosViviendaRsuModel', () => {
  afterEach(() => cleanup())

  beforeEach(() => {
    useSimulatorStore.setState({
      ...SIMULATOR_STATE_DEFAULT,
      zmActiva: 'SLP',
      municipiosActivos: ['slp', 'sol', 'csp', 'vip'],
      tiposVivienda: ['vertical', 'casa'],
      precios: { ...PRECIOS_DEFAULTS },
      costoDisposicionActivo: true,
      costoDisposicionPorTon: 320,
      viviendaCondominioPct: 45,
      viviendaCondominioDepartamentoPct: 70,
      ocupantesPorViviendaEscenario: null,
      capturaPctPorMaterial: {},
      mermaPctPorMaterial: {},
      resultados: null,
      resultadosSinPrograma: null,
    })
    useSimulatorStore.getState().recalcular()
  })

  // FuncionariosViviendaRsuModel fue absorbido en CityBaselineStack.
  // El componente retorna null. Estos tests son mantenidos como skip hasta
  // que se migren a CityBaselineStack.test.tsx.
  it.skip('renderiza el bloque institucional (deprecated — migrado a CityBaselineStack)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getByTestId('funcionarios-vivienda-rsu-model')).toBeTruthy()
  })

  it.skip('cambiar generacion per capita recalcula RSU total (deprecated)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getByLabelText(/Generación RSU per cápita/)).toBeTruthy()
  })

  it.skip('activar o desactivar vivienda cambia RSU activo (deprecated)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getAllByRole('button', { name: /Casa independiente/i }).length).toBeGreaterThan(0)
  })

  it.skip('cambiar precio recalcula ingresos (deprecated)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getByLabelText(/^PET$/)).toBeTruthy()
  })

  it.skip('sliders de condominio y ocupantes (deprecated)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getByLabelText(/Ocupantes por vivienda/)).toBeTruthy()
  })

  it.skip('costo por tonelada enterrada (deprecated)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getByText(/Pago evitable por entierro/)).toBeTruthy()
  })

  it.skip('mix fijo por material y merma (deprecated)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getAllByText(/Mix fijo/).length).toBeGreaterThan(0)
  })

  it.skip('sin datos INEGI municipal (deprecated)', () => {
    render(<FuncionariosViviendaRsuModel />)
    expect(screen.getAllByText(/Sin tabulado INEGI municipal/).length).toBe(1)
  })

  it('renderiza anexo final con fórmulas y bibliografía de cálculos', () => {
    render(<ReferenciasCalculos />)

    expect(screen.getByTestId('referencias-calculos')).toBeTruthy()
    expect(screen.getByText(/Bibliografía y cálculos/)).toBeTruthy()
    expect(screen.getByText(/Matriz de trazabilidad de fuentes/)).toBeTruthy()
    expect(screen.getByText(/Población y territorio/)).toBeTruthy()
    expect(screen.getAllByText(/Precios de materiales/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Acción correctiva/)).toBeTruthy()
    expect(screen.getAllByText(/Investigacion_Precios_RSU_SLP/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Vidrio baja de \$2\.30\/kg a \$1\.30\/kg/i).length).toBeGreaterThan(0)
  })
})
