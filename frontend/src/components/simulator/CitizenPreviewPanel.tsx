'use client'

import { EducacionCiudadana } from '@/components/simulator/EducacionCiudadana'
import { ComposicionRSU } from '@/components/simulator/ComposicionRSU'
import { TipoVivienda } from '@/components/simulator/TipoVivienda'

/** Panel de referencia: mismos bloques que el journey ciudadano (evita duplicar page.tsx). */
export function CitizenPreviewPanel() {
  return (
    <div className="space-y-5">
      <EducacionCiudadana />
      <ComposicionRSU />
      <TipoVivienda />
    </div>
  )
}
