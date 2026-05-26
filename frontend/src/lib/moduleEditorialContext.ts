'use client'

import { useMemo } from 'react'
import type { ModuleEditorialContext } from '@/data/moduleEditorialBriefs'
import {
  getEtiquetaNarrativaCiudad,
  getMunicipioMadurezVista,
} from '@/lib/municipioMadurezContexto'
import { buildPyramidEditorialMetrics } from '@/lib/pyramidEditorialMetrics'
import { useSimulatorStore } from '@/store/simulatorStore'

export function useModuleEditorialContext(): ModuleEditorialContext {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const resultados = useSimulatorStore(s => s.resultados)
  const costoDisposicionPorTon = useSimulatorStore(s => s.costoDisposicionPorTon)
  const horizonte = useSimulatorStore(s => s.horizonte)

  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const municipio = municipiosActivos.length === 1 ? getMunicipioMadurezVista(municipiosActivos[0] ?? '') : null
  const scope =
    municipiosActivos.length === 0 ? ('sin_municipio' as const) : municipiosActivos.length === 1 ? ('municipio' as const) : ('zm' as const)

  const metrics = useMemo(
    () =>
      buildPyramidEditorialMetrics({
        resultados,
        costoDisposicionPorTon,
        horizonte,
      }),
    [resultados, costoDisposicionPorTon, horizonte],
  )

  return {
    territorio,
    scope,
    municipio,
    municipiosCount: municipiosActivos.length,
    metrics,
  }
}
