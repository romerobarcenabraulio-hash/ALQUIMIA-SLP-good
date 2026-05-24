'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ExternalLink, History, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { AntecedenteEvento } from '@/lib/antecedentesTypes'

const TIPO_LABEL: Record<string, string> = {
  concesion: 'Concesión',
  programa: 'Programa',
  infraestructura: 'Infraestructura',
  norma: 'Norma',
  conflicto: 'Conflicto',
  campaña: 'Campaña',
  operador: 'Operador',
  contexto: 'Contexto',
  indicador: 'Indicador',
}

function TierBadge({ tier }: { tier: string }) {
  const colors =
    tier === 'T1'
      ? 'bg-[#EAF3DE] text-[#3B6D11]'
      : tier === 'T2'
        ? 'bg-[#E8F0FA] text-[#1A5FA8]'
        : 'bg-[#FEF7E7] text-[#8B5A00]'
  return (
    <span className={cn('rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase', colors)}>
      {tier}
    </span>
  )
}

function EventoRow({ e }: { e: AntecedenteEvento }) {
  const fuente = e.fuentes[0]
  return (
    <li className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
      <div className="flex flex-wrap items-center gap-2 mb-1.5">
        {e.anio && (
          <span className="font-mono text-[11px] font-semibold text-[#1C1B18]">{e.anio}</span>
        )}
        <span className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">
          {TIPO_LABEL[e.tipo] ?? e.tipo}
        </span>
        {fuente && <TierBadge tier={fuente.tier} />}
        {e.verificar && (
          <span className="text-[9px] font-medium text-[#D4881E]">VERIFICAR</span>
        )}
      </div>
      <p className="text-[12px] font-medium text-[#1C1B18] leading-snug">{e.titulo}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-[#6B6760]">{e.resumen}</p>
      {fuente?.url && (
        <a
          href={fuente.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[10px] text-[#1A5FA8] hover:underline"
        >
          Fuente <ExternalLink size={10} />
        </a>
      )}
    </li>
  )
}

export function AntecedentesReportajePanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const reportaje = useSimulatorStore(s => s.antecedentesReportaje)
  const loading = useSimulatorStore(s => s.antecedentesLoading)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const [open, setOpen] = useState(defaultOpen)

  const titulo = useMemo(() => {
    if (reportaje?.municipio_nombre) return reportaje.municipio_nombre
    if (municipiosActivos.length === 1) return municipiosActivos[0]
    return 'Municipio activo'
  }, [reportaje, municipiosActivos])

  if (!loading && !reportaje && municipiosActivos.length === 0) return null

  return (
    <div
      className="shrink-0 border-b border-[#C9DDB1]/60 bg-[#F4F9EE]"
      role="region"
      aria-label="Reportaje de antecedentes municipales"
      data-testid="antecedentes-reportaje-panel"
    >
      <button
        type="button"
        onClick={() => setOpen(p => !p)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-[#EAF3DE]/50 transition-colors"
      >
        {loading ? (
          <Loader2 size={14} className="text-[#3B6D11] animate-spin shrink-0" />
        ) : (
          <History size={14} className="text-[#3B6D11] shrink-0" />
        )}
        <span className="text-[11px] font-semibold text-[#3B6D11] flex-1 truncate">
          Antecedentes · {titulo}
          {reportaje && !loading && (
            <span className="font-normal text-[#6B6760]">
              {' '}
              · {reportaje.eventos.length} hitos · completitud{' '}
              {Math.round(reportaje.score_completitud * 100)}%
            </span>
          )}
        </span>
        {loading && (
          <span className="text-[10px] text-[#6B6760] shrink-0">Investigando…</span>
        )}
        <ChevronDown
          size={13}
          className={cn('text-[#3B6D11] transition-transform shrink-0', open && 'rotate-180')}
        />
      </button>

      {open && reportaje && !loading && (
        <div className="px-4 pb-4 space-y-3 border-t border-[#C9DDB1]/40 max-h-[420px] overflow-y-auto">
          <p className="text-[11px] leading-relaxed text-[#2C302A] pt-3">{reportaje.sintesis}</p>

          {reportaje.eventos.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-2">
                Línea de tiempo documentada
              </p>
              <ul className="space-y-2">
                {reportaje.eventos.map(e => (
                  <EventoRow key={e.evento_id} e={e} />
                ))}
              </ul>
            </div>
          )}

          {reportaje.lecciones.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">
                Lecciones para el diseño
              </p>
              <ul className="list-disc pl-4 space-y-1">
                {reportaje.lecciones.map(l => (
                  <li key={l} className="text-[11px] text-[#6B6760] leading-relaxed">
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {reportaje.advertencias.length > 0 && (
            <p className="text-[10px] text-[#8B5A00] leading-relaxed">
              {reportaje.advertencias.join(' · ')}
            </p>
          )}

          <p className="text-[9px] text-[#A8A49C]">
            Insumo ALQUIMIA · research automático al cambiar municipio · no acto de autoridad
          </p>
        </div>
      )}
    </div>
  )
}
