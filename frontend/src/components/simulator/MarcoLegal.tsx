'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_INSTITUCIONALES } from '@/lib/constants'
import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'
import { cn } from '@/lib/utils'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { EditorialCallout } from '@/components/editorial/EditorialCallout'
import { SectionLabel } from '@/components/editorial/SectionLabel'

export type MarcoLegalMode = 'citizen' | 'functionary'

interface MarcoLegalProps {
  /** Vista ciudadana: solo educación; sin roadmap ni motor jurídico interactivo. */
  mode?: MarcoLegalMode
}

export function MarcoLegal({ mode = 'functionary' }: MarcoLegalProps) {
  const { zmActiva, agoraLegalBloqueado } = useSimulatorStore()
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const { openReglamento } = useReglamentoFuente()
  const zmKey = zmActiva?.toLowerCase() ?? ''
  const munId = municipiosActivos[0] ?? (zmKey || 'mty')

  if (mode === 'citizen') {
    return (
      <div>
        <ScopeAnclaKicker className="mb-3" />

        <div className="mb-4 space-y-4">
          <SectionLabel>Fases del programa municipal</SectionLabel>
          <div className="flex flex-col gap-4">
            {FASES_INSTITUCIONALES.map(f =>
              f.bloqueante ? (
                <EditorialCallout key={f.fase} tone="caution" label={`F${f.fase} · ${f.nombre}`}>
                  <p>{f.meses} · {f.gate}</p>
                </EditorialCallout>
              ) : (
                <div key={f.fase} className="flex items-start gap-3 border-t border-[#E8E4DC] pt-4">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded-full shrink-0 bg-[#E2DED6] text-[#6B6760]">
                    F{f.fase}
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-[#1C1B18]">{f.nombre}</p>
                    <p className="text-[11px] text-[#6B6760]">{f.meses} · {f.gate}</p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <ScopeAnclaKicker className="mb-3 max-w-2xl" />
      <div className="mb-6 space-y-4">
        {agoraLegalBloqueado ? (
          <EditorialCallout tone="caution" label="En regularización jurídica">
            <p>Acciones requeridas por fase antes de habilitar sanciones y documentos oficiales.</p>
          </EditorialCallout>
        ) : (
          <p className="text-[12px] font-medium text-[#3B6D11]">Con validación jurídica base</p>
        )}
        <SectionLabel>Acciones requeridas por fase</SectionLabel>
        <ul className="space-y-0 mb-4">
          {FASES_INSTITUCIONALES.map(f => (
            <li key={f.fase} className="border-t border-[#E8E4DC] py-3">
              <p className="text-[12px] text-[#1C1B18]">
                <span className="font-mono text-[#6B6760]">F{f.fase}</span> · {f.nombre}
              </p>
              <p className="text-[11px] text-[#6B6760]">{f.meses} · {f.gate}</p>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={() => openReglamento(munId)}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2D5409] transition-colors"
        >
          Ver adendos jurídicos
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
