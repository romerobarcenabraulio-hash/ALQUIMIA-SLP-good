'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_INSTITUCIONALES } from '@/lib/constants'
import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'
import { cn } from '@/lib/utils'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

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
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4.5 — Marco legal (vista ciudadana)</p>
        <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Leyes locales y programa de limpia</h2>
        <ScopeAnclaKicker className="mb-3" />
        <p className="text-[13px] text-[#6B6760] mb-6 max-w-2xl leading-relaxed">
          Cada municipio opera su propio reglamento de limpia. La zona metropolitana coordina —no sustituye al ayuntamiento.
          Lo que lees aquí resume el marco local en lenguaje claro.
        </p>
        <div className="mb-6 rounded-[10px] border border-[#D4881E]/30 bg-[#FEF7E7] p-4">
          <p className="text-[12px] font-medium text-[#1C1B18] mb-1">Vista educativa</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
            Esta pantalla orienta —no reemplaza el Periódico Oficial, la ventanilla municipal ni un parecer jurídico.
            Trámites y sanciones siguen el reglamento publicado de tu territorio.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-[11px] font-medium text-[#6B6760] mb-3">Etapas habituales de un programa municipal</p>
          <p className="mb-3 text-[12px] text-[#6B6760] leading-relaxed">
            Los equipos avanzan por fases parecidas a estas. La lista es guía conceptual —no un checklist legal.
          </p>
          <div className="flex flex-col gap-2">
            {FASES_INSTITUCIONALES.map(f => (
              <div
                key={f.fase}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-[10px] border',
                  f.bloqueante ? 'border-[#D4881E]/40 bg-[#FEF7E7]' : 'border-[#E8E4DC] bg-[#FDFCFA]',
                )}
              >
                <span
                  className={cn(
                    'font-mono text-[11px] px-2 py-0.5 rounded-full shrink-0',
                    f.bloqueante ? 'bg-[#D4881E] text-white' : 'bg-[#E2DED6] text-[#6B6760]',
                  )}
                >
                  F{f.fase}
                </span>
                <div>
                  <p className="text-[12px] font-medium text-[#1C1B18]">{f.nombre}</p>
                  <p className="text-[11px] text-[#6B6760]">{f.meses} · {f.gate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4.5 — Marco legal y reforma reglamentaria</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Reforma reglamentaria</h2>
      <ScopeAnclaKicker className="mb-3 max-w-2xl" />
      <p className="text-[13px] text-[#6B6760] mb-6 max-w-2xl">
        Esta vista produce expediente técnico de respaldo; no reemplaza el parecer de autoridad competente ni la aprobación formal de reformas. Es el mismo insumo que un equipo jurídico municipal puede usar para redactar la iniciativa y presentarla ante Cabildo.
      </p>
      <div className="mb-6 rounded-[12px] border border-[#E8E4DC] bg-[#F8F6F1] p-5">
        <p className="text-[11px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">Estado normativo actual</p>
        <p className={cn(
          'inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium mb-3',
          agoraLegalBloqueado ? 'bg-[#FEF7E7] text-[#8B5A00]' : 'bg-[#EAF3DE] text-[#3B6D11]'
        )}>
          {agoraLegalBloqueado ? 'En regularización jurídica' : 'Con validación jurídica base'}
        </p>
        <p className="text-[13px] leading-relaxed text-[#6B6760] mb-4">
          Aquí se contrasta el reglamento vigente con los adendos propuestos. Esta vista es informativa:
          no requiere validaciones manuales ni checklist de avance para continuar en el simulador.
        </p>
        <p className="text-[11px] font-medium text-[#6B6760] mb-2">Acciones requeridas por fase</p>
        <ul className="space-y-2 mb-4">
          {FASES_INSTITUCIONALES.map(f => (
            <li key={f.fase} className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2">
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
