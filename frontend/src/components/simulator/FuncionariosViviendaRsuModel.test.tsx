/** @vitest-environment jsdom */
import { describe, expect, it, beforeEach, afterEach } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { FuncionariosViviendaRsuModel } from '@/components/simulator/FuncionariosViviendaRsuModel'
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
      resultados: null,
      resultadosSinPrograma: null,
    })
    useSimulatorStore.getState().recalcular()
  })

  it('renderiza el bloque institucional con fuente INEGI y sin residencial como categoria oficial', () => {
    render(<FuncionariosViviendaRsuModel />)

    expect(screen.getByTestId('funcionarios-vivienda-rsu-model')).toBeTruthy()
    expect(screen.getByText(/Distribución de vivienda, generación y costo público/)).toBeTruthy()
    expect(screen.getAllByText(/INEGI Censo 2020/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Casa independiente/)).toBeTruthy()
    expect(screen.getByText(/Departamento en edificio/)).toBeTruthy()
    expect(screen.queryByText(/Residencial/)).toBeNull()
  })

  it('cambiar generacion per capita recalcula RSU total', () => {
    const before = useSimulatorStore.getState().resultados?.rsuTotalTonDia ?? 0
    render(<FuncionariosViviendaRsuModel />)

    fireEvent.change(screen.getByLabelText(/Generación RSU per cápita/), { target: { value: '1.20' } })

    const after = useSimulatorStore.getState().resultados?.rsuTotalTonDia ?? 0
    expect(after).toBeGreaterThan(before)
  })

  it('activar o desactivar vivienda cambia RSU activo', () => {
    const before = useSimulatorStore.getState().resultados?.rsuTotalTonDia ?? 0
    render(<FuncionariosViviendaRsuModel />)

    fireEvent.click(screen.getAllByRole('button', { name: /Casa independiente/i })[0])

    const after = useSimulatorStore.getState().resultados?.rsuTotalTonDia ?? 0
    expect(after).toBeLessThan(before)
  })

  it('cambiar precio recalcula ingresos y muestra referencia territorial', () => {
    const before = useSimulatorStore.getState().resultados?.ingresosBrutos ?? 0
    render(<FuncionariosViviendaRsuModel />)

    fireEvent.change(screen.getByLabelText('PET'), { target: { value: '7.8' } })

    const after = useSimulatorStore.getState().resultados?.ingresosBrutos ?? 0
    expect(after).toBeGreaterThan(before)
    expect(screen.getAllByText(/referencia mercado reciclaje CDMX/).length).toBeGreaterThan(0)
  })

  it('sin datos INEGI muestra warning y no inventa porcentajes', () => {
    useSimulatorStore.setState({
      zmActiva: 'EXT',
      municipiosActivos: ['ext'],
      tiposVivienda: ['vertical', 'casa'],
    })
    useSimulatorStore.getState().recalcular()

    render(<FuncionariosViviendaRsuModel />)

    expect(screen.getAllByText(/Sin distribución INEGI cargada/).length).toBe(1)
  })
})
