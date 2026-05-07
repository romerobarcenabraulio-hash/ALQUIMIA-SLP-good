'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_INSTITUCIONALES } from '@/lib/constants'
import { ContadorOportunidad } from '@/components/charts/ContadorOportunidad'
import { DiagnosticoJuridico } from '@/components/simulator/DiagnosticoJuridico'
import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'
import { cn } from '@/lib/utils'

export type MarcoLegalMode = 'citizen' | 'functionary'

const ROADMAP_ITEMS = [
  'Diagnóstico del reglamento de limpia vigente',
  'Identificación de brechas normativas',
  'Redacción de iniciativa de reforma',
  'Presentación ante Cabildo',
  'Aprobación de reforma reglamentaria',
  'Publicación en Periódico Oficial del Estado',
]

interface MarcoLegalProps {
  /** Vista ciudadana: solo educación; sin roadmap ni motor jurídico interactivo. */
  mode?: MarcoLegalMode
}

export function MarcoLegal({ mode = 'functionary' }: MarcoLegalProps) {
  const { gatesAprobados, setGate, zmActiva } = useSimulatorStore()
  const { openReglamento } = useReglamentoFuente()
  const munId = zmActiva?.toLowerCase() ?? 'mty'

  if (mode === 'citizen') {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4.5 — Marco legal (vista ciudadana)</p>
        <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Leyes locales y programa de limpia</h2>
        <p className="text-[13px] text-[#6B6760] mb-6 max-w-2xl leading-relaxed">
          En cada municipio aplican reglamentos y programas distintos. Aquí ves, en lenguaje sencillo, cómo suele
          encajar la limpieza y los residuos en el marco local y por qué la zona metropolitana coordina pero no
          sustituye al ayuntamiento.
        </p>
        <div className="mb-6 rounded-[10px] border border-[#D4881E]/30 bg-[#FEF7E7] p-4">
          <p className="text-[12px] font-medium text-[#1C1B18] mb-1">Solo para aprender</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
            Esta pantalla es informativa. No reemplaza al reglamento publicado, ni a orientación del ayuntamiento,
            ni a asesoría legal. Si necesitas trámites o multas, acude a las ventanillas y fuentes oficiales de tu municipio.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-[11px] font-medium text-[#6B6760] mb-3">Etapas habituales de un programa municipal</p>
          <p className="mb-3 text-[12px] text-[#6B6760] leading-relaxed">
            Los equipos locales suelen avanzar por fases parecidas a estas; son una guía conceptual, no una lista
            que debas marcar en la app.
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
                  <p className="text-[11px] text-[#6B6760]">{f.meses} meses · {f.gate}</p>
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
      <p className="text-[13px] text-[#6B6760] mb-6 max-w-2xl">
        ALQUIMIA distingue simulación, propuesta expositiva, dictamen y documento oficial. La plataforma
        no emite dictamen legal ni aprueba reformas; cada avance debe validarse por municipio y por
        autoridad competente.
      </p>
      <div className="mb-6 rounded-[10px] border border-[#E8E4DC] bg-[#F8F6F1] p-4 flex items-start justify-between gap-4">
        <p className="text-[13px] leading-relaxed text-[#6B6760] flex-1">
          Aquí se ve el desarrollo de los nuevos adendos que se proponen. No son los oficiales,
          pero ayudan a contrastar cómo está actualmente la ley y cómo la cambiaremos.
        </p>
        <button
          type="button"
          onClick={() => openReglamento(munId)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2D5409] transition-colors"
        >
          Ver adendos propuestos
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* Roadmap interactivo */}
      <div className="flex flex-col gap-2 mb-6">
        {ROADMAP_ITEMS.map((item, i) => {
          const checked = gatesAprobados[i] ?? false
          const prev    = i === 0 || (gatesAprobados[i - 1] ?? false)
          return (
            <button
              key={i}
              type="button"
              onClick={() => prev && setGate(i, !checked)}
              disabled={!prev}
              className={cn(
                'flex items-center gap-3 text-left px-4 py-3 rounded-[10px] border transition-all',
                checked
                  ? 'bg-[#EAF3DE] border-[#3B6D11]/30 text-[#3B6D11]'
                  : prev
                    ? 'bg-[#FDFCFA] border-[#E8E4DC] text-[#6B6760] hover:bg-[#F0EDE5]'
                    : 'bg-[#FDFCFA] border-[#E8E4DC] text-[#A8A49C] opacity-60 cursor-not-allowed'
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                checked ? 'bg-[#3B6D11] border-[#3B6D11]' : 'border-[#E2DED6]'
              )}>
                {checked && <span className="text-white text-[10px]">✓</span>}
                {!checked && !prev && <span className="text-[#E2DED6] text-[10px]">🔒</span>}
              </span>
              <span className="text-[13px] flex-1 min-w-0">{item}</span>
              {i === 4 && <span className="text-[10px] text-[#D4881E] font-medium shrink-0">★ GATE CLAVE</span>}
            </button>
          )
        })}
      </div>

      {/* Fases institucionales */}
      <div className="mb-6">
        <p className="text-[11px] font-medium text-[#6B6760] mb-3">Fases institucionales del programa</p>
        <div className="flex flex-col gap-2">
          {FASES_INSTITUCIONALES.map(f => (
            <div key={f.fase} className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-[10px] border',
              f.bloqueante ? 'border-[#D4881E]/40 bg-[#FEF7E7]' : 'border-[#E8E4DC] bg-[#FDFCFA]'
            )}>
              <span className={cn(
                'font-mono text-[11px] px-2 py-0.5 rounded-full shrink-0',
                f.bloqueante ? 'bg-[#D4881E] text-white' : 'bg-[#E2DED6] text-[#6B6760]'
              )}>F{f.fase}</span>
              <div>
                <p className="text-[12px] font-medium text-[#1C1B18]">{f.nombre}</p>
                <p className="text-[11px] text-[#6B6760]">{f.meses} meses · {f.gate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Motor Jurídico Municipal ─────────────────────────────────── */}
      <div className="border-t border-[#E8E4DC] pt-6 mt-6">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4.6 — Diagnóstico jurídico del reglamento</p>
        <h3 className="font-serif text-[18px] text-[#1C1B18] mb-4">Estado normativo del municipio</h3>
        <DiagnosticoJuridico />
      </div>

      {/* Contador oportunidad perdida */}
      <ContadorOportunidad />
    </div>
  )
}
