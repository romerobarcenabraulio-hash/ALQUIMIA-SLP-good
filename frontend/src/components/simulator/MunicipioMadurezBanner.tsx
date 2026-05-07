'use client'

import { getMadurezMensajeMultiAncla, getMunicipioMadurezVista } from '@/lib/municipioMadurezContexto'

type Props = { municipiosActivos: string[] }

/**
 * Refuerza postura DIA: madurez en circularidad y marco de limpia/aseo son municipio-específicas; el proyecto simulado no es genérico.
 */
export function MunicipioMadurezBanner({ municipiosActivos }: Props) {
  if (municipiosActivos.length === 0) return null

  if (municipiosActivos.length > 1) {
    return (
      <div
        className="mt-4 rounded-[8px] border border-[#C8D9B8] bg-[#F4F9EF] px-4 py-3"
        role="note"
        aria-label="Diferenciación por municipio"
      >
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2D5409]">
          Escenarios municipales distintos
        </p>
        <p className="mt-1 text-[12px] text-[#3D4F33] leading-relaxed">
          {getMadurezMensajeMultiAncla(municipiosActivos.length)} Los espejos de reglamento de aseo público y limpia viven en{' '}
          <code className="text-[10px] rounded bg-white/80 px-1 py-0.5">ADENDOS: LEGAL/pdfs/reglamentos/</code> — uno por
          municipio cuando el catálogo lo registra.
        </p>
      </div>
    )
  }

  const id = municipiosActivos[0] ?? ''
  const vista = getMunicipioMadurezVista(id)
  if (!vista) return null

  return (
    <div
      className="mt-4 rounded-[8px] border border-[#C8D9B8] bg-[#F4F9EF] px-4 py-3"
      role="note"
      aria-label={`Madurez y marco propio: ${vista.nombre}`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#2D5409]">
        Proyecto acotado a {vista.nombre}
      </p>
      <p className="mt-1 text-[12px] text-[#3D4F33] leading-relaxed">{vista.lineaOperativa}</p>
      <p className="mt-1 text-[12px] text-[#3D4F33] leading-relaxed">{vista.lineaNormativa}</p>
      <p className="mt-2 text-[11px] text-[#5A6B52] leading-relaxed">
        Madurez en separación, mercados de reciclaje y gobernanza ambiental difiere entre municipios; este paquete simulado no pretende ser plantilla reutilizable sin cambiar ancla, baseline y revisión en Marco Legal.
      </p>
    </div>
  )
}
