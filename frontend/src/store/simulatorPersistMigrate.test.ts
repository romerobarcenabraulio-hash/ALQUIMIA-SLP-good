import { describe, expect, it } from 'vitest'
import {
  migrateSimulatorPersistedState,
  normalizaPropuestaSlots,
  propuestaSlotsVacios,
} from '@/store/simulatorPersistMigrate'

describe('migrateSimulatorPersistedState', () => {
  it('desplaza legado escenarios[:3] a propuestaSlots y conserva audiencia', () => {
    const e1 = { id: '1', nombre: 'a', zm: 'SLP', fecha: '', inputs: {}, snapshotDatos: undefined, costoModeloPromedioAnualMxn: 1, resultados: {} }
    const e2 = { id: '2', nombre: 'b', zm: 'SLP', fecha: '', inputs: {}, snapshotDatos: undefined, costoModeloPromedioAnualMxn: 2, resultados: {} }
    const e3 = { id: '3', nombre: 'c', zm: 'SLP', fecha: '', inputs: {}, snapshotDatos: undefined, costoModeloPromedioAnualMxn: 3, resultados: {} }
    const e4 = { id: '4', nombre: 'd', zm: 'SLP', fecha: '', inputs: {}, snapshotDatos: undefined, costoModeloPromedioAnualMxn: 4, resultados: {} }

    const m = migrateSimulatorPersistedState({
      audience: 'functionary',
      escenarios: [e1, e2, e3, e4],
    })

    expect(m.audience).toBe('functionary')
    expect(m.propuestaSlots[0]?.id).toBe('1')
    expect(m.propuestaSlots[1]?.nombre).toBe('b')
    expect(m.propuestaSlots[2]?.nombre).toBe('c')
  })

  it('des-envuelve { state } de Zustand persist antes de migrar', () => {
    const e = { id: 'x', nombre: 'solo', zm: 'SLP', fecha: '', inputs: {}, snapshotDatos: undefined, resultados: {} }
    const m = migrateSimulatorPersistedState({ state: { escenarios: [e], audience: null } })

    expect(m.propuestaSlots[0]?.nombre).toBe('solo')
    expect(m.propuestaSlots[1]).toBeNull()
  })

  it('si ya hay propuestaSlots válidos, no toca escenarios legado', () => {
    const a = { id: 'a', nombre: 'slot', zm: '', fecha: '', inputs: {}, snapshotDatos: undefined, resultados: {} }
    const junk = [{ id: 'old', nombre: 'ignore', zm: '', fecha: '', inputs: {}, snapshotDatos: undefined, resultados: {} }]

    const m = migrateSimulatorPersistedState({
      propuestaSlots: [null, a, null],
      escenarios: junk,
    })

    expect(m.propuestaSlots[1]?.nombre).toBe('slot')
    expect(m.propuestaSlots[0]).toBeNull()
  })

  it('malformado produce tres huecos vacíos', () => {
    const m = migrateSimulatorPersistedState(null)
    expect(m.propuestaSlots).toEqual(propuestaSlotsVacios())
  })

  it('normaliza propuestaSlots a longitud tres', () => {
    expect(normalizaPropuestaSlots([1, 2])).toEqual(propuestaSlotsVacios())
    expect(normalizaPropuestaSlots([null, null, null])).toEqual(propuestaSlotsVacios())
  })
})
