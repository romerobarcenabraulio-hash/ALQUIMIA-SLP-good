'use client'

import Link from 'next/link'
import { AlertCircle, FileUp } from 'lucide-react'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'

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
    <div
      className="rounded-[12px] border border-[#D4881E]/40 bg-[#FEF7E7] px-5 py-4 mb-5"
      data-testid="municipio-data-awaiting-banner"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={18} className="mt-0.5 shrink-0 text-[#8B5A00]" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8B5A00]">
            Esperando datos del municipio · {moduleCode}
          </p>
          <p className="mt-2 text-[13px] leading-[1.75] text-[#5A4800]">
            {moduleLabel} se activa con pleno detalle cuando el municipio carga sus datos
            sociodemográficos o de campo. Mientras tanto, ALQUIMIA opera con supuestos
            transparentes — no oculta qué valor alimenta M14 ni el score de riesgo social.
          </p>
          <p className="mt-2 text-[12px] text-[#6B4800]">
            Estado actual: <strong>{DATO_LABEL[dato]}</strong>
          </p>
          {assumptions.length > 0 && (
            <ul className="mt-3 space-y-1.5 rounded-[8px] border border-[#F5DCA0]/60 bg-white/60 px-3 py-2">
              {assumptions.map(a => (
                <li key={a.label} className="flex justify-between gap-3 text-[11px] text-[#5A4800]">
                  <span>{a.label}</span>
                  <span className="font-mono font-medium text-[#1C1B18]">{a.value}</span>
                </li>
              ))}
            </ul>
          )}
          <Link
            href="/hub"
            className="mt-4 inline-flex items-center gap-2 rounded-[8px] border border-[#8B5A00]/30 bg-white px-3 py-2 text-[12px] font-medium text-[#8B5A00] hover:bg-[#FFFBF0] transition-colors"
          >
            <FileUp size={14} aria-hidden />
            {ctaLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
