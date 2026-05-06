'use client'

/**
 * Q-024: varios municipios en programa; las llamadas que envían un solo municipio_id usan el primero como ancla.
 */
export function AvisoMunicipioAncla({ ids }: { ids: string[] }) {
  if (ids.length <= 1) return null
  const ancla = ids[0] ?? '—'
  return (
    <p className="text-[11px] leading-snug text-[#8A4A03]">
      Varios municipios en el programa: las consultas con un solo <span className="font-mono">municipio_id</span> usan el
      ancla <span className="font-mono">{ancla}</span> (vista parcial respecto al conjunto activo).
    </p>
  )
}
