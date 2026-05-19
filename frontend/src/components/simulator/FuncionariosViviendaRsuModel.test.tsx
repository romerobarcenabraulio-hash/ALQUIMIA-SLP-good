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

  it('renderiza el bloque institucional con hechos INEGI y sin porcentaje inventado por tipo', () => {
    render(<FuncionariosViviendaRsuModel />)

    expect(screen.getByTestId('funcionarios-vivienda-rsu-model')).toBeTruthy()
    expect(screen.getByTestId('rsu-zona-unica')).toBeTruthy()
    expect(screen.getByTestId('vivienda-accordion-shell')).toBeTruthy()
    expect(screen.getByText(/Parámetros del modelo RSU/)).toBeTruthy()
    expect(screen.getAllByText(/INEGI Censo 2020/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Población estatal 2020/)).toBeTruthy()
    expect(screen.getByText(/2,822,255/)).toBeTruthy()
    expect(screen.getByText(/774,658/)).toBeTruthy()
    expect(screen.getAllByText(/No contienen distribución casa\/departamento/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Bloqueo:/)).toBeTruthy()
    expect(screen.getByText(/Siguiente acción:/)).toBeTruthy()
    expect(screen.getAllByText(/Casa independiente/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Departamento en edificio/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Composición base del RSU/)).toBeTruthy()
    expect(screen.getByText(/Composición base del RSU/)).toBeTruthy()
    expect(screen.getByText(/No es medición de campo del municipio activo/i)).toBeTruthy()
    expect(screen.getByTestId('captura-global-summary')).toBeTruthy()
    expect(screen.getByText(/Captura global aplicada/)).toBeTruthy()
    expect(screen.getByText(/La composición por material queda fija/i)).toBeTruthy()
    expect(screen.getByText(/viviendas en edificio/i)).toBeTruthy()
    expect(screen.getByLabelText(/Departamentos/)).toBeTruthy()
    expect(screen.getByText(/Viviendas por porcentaje/)).toBeTruthy()
    expect(screen.getAllByText(/Casa independiente/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Ocupantes por vivienda/)).toBeTruthy()
    expect(screen.getAllByText(/Modelo operativo ALQUIMIA/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/no es porcentaje oficial INEGI/i).length).toBeGreaterThan(0)
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

  it('cambiar precio recalcula ingresos y muestra fuente documental sin inventar referencia territorial', () => {
    const before = useSimulatorStore.getState().resultados?.ingresosBrutos ?? 0
    render(<FuncionariosViviendaRsuModel />)

    fireEvent.change(screen.getByLabelText(/^PET$/), { target: { value: '7.8' } })

    const after = useSimulatorStore.getState().resultados?.ingresosBrutos ?? 0
    expect(after).toBeGreaterThan(before)
    expect(screen.getAllByText(/Investigacion_Precios_RSU_SLP/i).length).toBeGreaterThan(0)
    expect(screen.queryByText(/Capitulo San Luis/i)).toBeNull()
    expect(screen.queryByText(/referencia mercado reciclaje CDMX/)).toBeNull()
  })

  it('sliders de condominio y ocupantes recalculan RSU activo', () => {
    const before = useSimulatorStore.getState().resultados?.rsuTotalTonDia ?? 0
    render(<FuncionariosViviendaRsuModel />)

    fireEvent.change(screen.getByLabelText(/Ocupantes por vivienda/), { target: { value: '4.2' } })
    const afterOccupants = useSimulatorStore.getState().resultados?.rsuTotalTonDia ?? 0
    expect(afterOccupants).not.toBe(before)

    fireEvent.change(screen.getByLabelText(/viviendas en edificio/i), { target: { value: '80' } })
    const afterHousing = useSimulatorStore.getState().resultados?.rsuTotalTonDia ?? 0
    const afterHousingVertical = useSimulatorStore.getState().resultados?.rsuPorTipo.vertical ?? 0
    expect(afterHousing).not.toBe(afterOccupants)
    expect(afterHousingVertical).toBeGreaterThan(0)

    fireEvent.change(screen.getByLabelText(/Departamentos/), { target: { value: '20' } })
    const afterCondoSplit = useSimulatorStore.getState().resultados?.rsuPorTipo.vertical ?? 0
    expect(afterCondoSplit).toBeLessThan(afterHousingVertical)
  })

  it('costo por tonelada enterrada altera pago evitable sin mezclar OPEX', () => {
    render(<FuncionariosViviendaRsuModel />)

    expect(screen.getByText(/Pago evitable por entierro/)).toBeTruthy()
    expect(screen.queryByText(/OPEX \+/)).toBeNull()

    const initial = useSimulatorStore.getState().resultados?.ahorroDisposicion ?? 0
    fireEvent.change(screen.getByLabelText(/MXN por tonelada/), { target: { value: '640' } })
    const raised = useSimulatorStore.getState().resultados?.ahorroDisposicion ?? 0
    expect(raised).toBeGreaterThan(initial)

    fireEvent.click(screen.getByRole('button', { name: /Incluido|Excluido/ }))
    expect(useSimulatorStore.getState().resultados?.ahorroDisposicion).toBe(0)
  })

  it('mantiene mix fijo por material y la merma recalcula ingresos', () => {
    const { container } = render(<FuncionariosViviendaRsuModel />)
    const before = useSimulatorStore.getState().resultados?.ingresosBrutos ?? 0

    const mermaPet = container.querySelector<HTMLInputElement>('#merma-pet')
    expect(container.querySelector<HTMLInputElement>('#captura-pet')).toBeNull()
    expect(mermaPet).toBeTruthy()
    expect(screen.getAllByText(/Mix fijo/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/capturable/i).length).toBeGreaterThan(0)

    fireEvent.change(mermaPet!, { target: { value: '50' } })
    const afterMerma = useSimulatorStore.getState().resultados?.ingresosBrutos ?? 0
    expect(afterMerma).toBeLessThan(before)
  })

  it('sin datos INEGI municipal no oculta supuestos editables ni inventa porcentajes', () => {
    useSimulatorStore.setState({
      zmActiva: 'EXT',
      municipiosActivos: ['ext'],
      tiposVivienda: ['vertical', 'casa'],
    })
    useSimulatorStore.getState().recalcular()

    render(<FuncionariosViviendaRsuModel />)

    expect(screen.getAllByText(/Sin tabulado INEGI municipal/).length).toBe(1)
    expect(screen.getByText(/viviendas en edificio/i)).toBeTruthy()
    expect(screen.getByText(/Viviendas por porcentaje/)).toBeTruthy()
    expect(screen.getByTestId('captura-global-summary')).toBeTruthy()
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
