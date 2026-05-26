'use client'

import Link from 'next/link'
import { FileUp } from 'lucide-react'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import { EditorialCallout, KpiAnchorGrid } from '@/components/editorial'

const DATO_LABEL: Record<SociodemographicDisplayBlock['dato'], string> = {
  disponible: 'Dato municipal integrado',
  proxy: 'Proxy / estimación declarada',
  manual_usuario: 'Captura manual del usuario',
  no_disponible: 'Sin dato integrado — supuesto preliminar ALQUIMIA',
}

interface MunicipioDataAwaitingBannerProps {
  moduleLabel: string
  moduleCode: string
  /** Supuestos visibles mientras no hay estudio cargado */
  assumptions?: { label: string; value: string }[]
  dato?: SociodemographicDisplayBlock['dato']
  ctaLabel?: string
}

export function MunicipioDataAwaitingBanner({
  moduleLabel,
  moduleCode,
  assumptions = [],
  dato = 'no_disponible',
  ctaLabel = 'Cargar estudio sociodemográfico',
}: MunicipioDataAwaitingBannerProps) {
  if (dato === 'disponible') return null

  return (
    <div data-testid="municipio-data-awaiting-banner" className="mb-5">
      <EditorialCallout
        tone="caution"
        label={`Esperando datos del municipio · ${moduleCode}`}
      >
        {moduleLabel} se activa con pleno detalle cuando el municipio carga sus datos
        sociodemográficos o de campo. Mientras tanto, ALQUIMIA opera con supuestos
        transparentes — no oculta qué valor alimenta M14 ni el score de riesgo social.
        <span className="mt-2 block text-[13px]">
          Estado actual: <strong>{DATO_LABEL[dato]}</strong>
        </span>
      </EditorialCallout>
      {assumptions.length > 0 && (
        <KpiAnchorGrid
          className="mt-4"
          columns={assumptions.length >= 3 ? 3 : 2}
          items={assumptions.map(a => ({
            label: a.label,
            value: a.value,
            figureClassName: 'font-mono text-[20px]',
          }))}
        />
      )}
      <Link
        href="/hub"
        className="mt-4 inline-flex items-center gap-2 rounded-[8px] border border-[#8B5A00]/30 bg-white px-3 py-2 text-[12px] font-medium text-[#8B5A00] hover:bg-[#FFFBF0] transition-colors"
      >
        <FileUp size={14} aria-hidden />
        {ctaLabel}
      </Link>
    </div>
  )
}
