'use client'

import { getMunicipioMadurezVista } from '@/lib/municipioMadurezContexto'

/** Varios municipios en programa; las llamadas que requieren ancla municipal usan el primero seleccionado. */
export function AvisoMunicipioAncla({ ids }: { ids: string[] }) {
  if (ids.length <= 1) return null
  const ancla = ids[0] ?? '—'
  const etiqueta = getMunicipioMadurezVista(ancla)?.nombre
  return (
    <p className="text-[11px] leading-snug text-[#8A4A03]">
      Varios municipios en el programa: las consultas con una sola ancla municipal usan el
      ancla <span className="font-mono">{ancla}</span>
      {etiqueta ? (
        <>
          {' '}
          (<span className="font-medium">{etiqueta}</span>)
        </>
      ) : null}{' '}
      — vista parcial respecto al conjunto activo.
    </p>
  )
}
