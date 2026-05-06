'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { adendos, CIUDADES_DISPONIBLES } from '@/data/adendos'

interface AdendoViewerProps {
  ciudadId?: string
  adendoId?: number
}

const TECNICA_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  Adicionar: { label: 'Adicionar', bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]' },
  Reformar:  { label: 'Reformar',  bg: 'bg-[#EBF3FB]', text: 'text-[#1A5FA8]' },
  Nuevo:     { label: 'Artículo nuevo', bg: 'bg-[#FEF7E7]', text: 'text-[#8B5A00]' },
}

const CIUDADES_CON_DATOS = ['slp', 'mty', 'qro']

export function AdendoViewer({ ciudadId = 'slp', adendoId = 1 }: AdendoViewerProps) {
  const [ciudadActiva, setCiudadActiva] = useState(ciudadId)
  const [adendoActivo, setAdendoActivo] = useState(adendoId)

  const adendo = adendos.find(a => a.id === adendoActivo)
  const ciudadData = adendo?.ciudades[ciudadActiva]
  const tecnadaBadge = adendo ? (TECNICA_BADGE[adendo.tecnica] ?? TECNICA_BADGE.Adicionar) : TECNICA_BADGE.Adicionar

  const textoEsNoExiste =
    ciudadData?.textoVigente?.startsWith('[NO EXISTE]') ||
    ciudadData?.textoVigente?.startsWith('[NO DISPONIBLE')

  return (
    <div className="flex flex-col rounded-[16px] border border-[#E8E4DC] bg-[#FDFCFA] overflow-hidden">

      {/* Banner fijo — siempre visible, no ocultable */}
      <div
        className="flex items-center gap-2 bg-[#FFFBEB] border-b border-[#FCD34D] px-4 py-2.5"
        role="alert"
        aria-live="polite"
      >
        <svg className="h-4 w-4 shrink-0 text-[#D97706]" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        <span className="text-[11px] font-medium text-[#92400E] uppercase tracking-wide">
          [BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos]
        </span>
      </div>

      {/* Selectores */}
      <div className="flex flex-wrap gap-3 px-4 py-3 border-b border-[#E8E4DC] bg-[#FAF8F5]">
        {/* Selector ciudad */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-[#A8A49C]">Ciudad</label>
          <div className="flex gap-1.5 flex-wrap">
            {CIUDADES_CON_DATOS.map(c => (
              <button
                key={c}
                onClick={() => setCiudadActiva(c)}
                className={cn(
                  'px-3 py-1 text-[11px] font-medium rounded-[6px] border transition-colors',
                  ciudadActiva === c
                    ? 'bg-[#1C1B18] text-white border-[#1C1B18]'
                    : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F0EDE5]'
                )}
              >
                {CIUDADES_DISPONIBLES[c] ?? c.toUpperCase()}
              </button>
            ))}
            {/* Ciudades sin PDF disponible aún */}
            {(['san_pedro', 'corregidora', 'el_marques'] as const).map(c => (
              <button
                key={c}
                disabled
                title="PDF pendiente de carga"
                className="px-3 py-1 text-[11px] rounded-[6px] border border-[#E8E4DC] text-[#C8C4BC] bg-[#F8F6F1] cursor-not-allowed"
              >
                {CIUDADES_DISPONIBLES[c]}
              </button>
            ))}
          </div>
        </div>

        {/* Selector adendo */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-[#A8A49C]">Adendo</label>
          <div className="flex gap-1.5 flex-wrap">
            {adendos.map(a => (
              <button
                key={a.id}
                onClick={() => setAdendoActivo(a.id)}
                className={cn(
                  'px-3 py-1 text-[11px] font-medium rounded-[6px] border transition-colors',
                  adendoActivo === a.id
                    ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                    : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F0EDE5]'
                )}
              >
                {a.id}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Título del adendo activo */}
      {adendo && (
        <div className="px-4 pt-3 pb-2 border-b border-[#E8E4DC]">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-serif text-[14px] text-[#1C1B18]">
              Adendo {adendo.id} — {adendo.titulo}
            </span>
            <span className={cn(
              'text-[10px] font-medium px-2 py-0.5 rounded-full',
              tecnadaBadge.bg, tecnadaBadge.text
            )}>
              {tecnadaBadge.label}
            </span>
            {!ciudadData?.pdfCargado && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FEF7E7] text-[#8B5A00] border border-[#FCD34D]">
                Artículos pendientes de verificación en PDF
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#6B6760] mt-1">
            {CIUDADES_DISPONIBLES[ciudadActiva] ?? ciudadActiva}
            {ciudadData ? ` · ${ciudadData.numeroArticulo} · ${ciudadData.anio}` : ' · ciudad no mapeada aún'}
          </p>
        </div>
      )}

      {/* Dos paneles */}
      <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-[#E8E4DC] flex-1">

        {/* Panel izquierdo — Reglamento vigente */}
        <div className="flex flex-col flex-1 min-w-0 p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#A8A49C] mb-2 shrink-0">
            📄 Reglamento vigente
          </p>

          {!ciudadData ? (
            <div className="flex-1 flex items-center justify-center py-8 text-center">
              <p className="text-[12px] text-[#A8A49C]">
                Esta ciudad no tiene datos disponibles para este adendo aún.
              </p>
            </div>
          ) : textoEsNoExiste ? (
            <div className="flex-1 bg-[#F8F6F1] rounded-[10px] p-4 flex flex-col gap-2">
              <p className="text-[12px] font-medium text-[#6B6760]">
                {ciudadData.textoVigente.startsWith('[NO EXISTE]')
                  ? 'Este artículo no existe en el reglamento vigente. Se creará como artículo nuevo mediante adición.'
                  : 'PDF del reglamento no disponible aún en REGLAMENTOS_BASE/. El texto vigente está pendiente de verificación.'}
              </p>
              <p className="text-[11px] text-[#A8A49C] mt-1">
                {ciudadData.textoVigente.replace(/^\[NO EXISTE\]\s*/, '').replace(/^\[NO DISPONIBLE.*?\]\s*/, '')}
              </p>
            </div>
          ) : (
            <div
              className="flex-1 overflow-y-auto rounded-[10px] bg-[#F8F6F1] p-3"
              style={{ maxHeight: '380px' }}
            >
              <pre className="text-[11px] text-[#3A3832] leading-relaxed whitespace-pre-wrap font-mono">
                {ciudadData.textoVigente}
              </pre>
            </div>
          )}

          {ciudadData && (
            <div className="mt-2 shrink-0">
              <p className="text-[10px] text-[#A8A49C]">
                {ciudadData.nombreReglamento} · {ciudadData.anio}
              </p>
            </div>
          )}
        </div>

        {/* Panel derecho — Adendo propuesto */}
        <div className="flex flex-col flex-1 min-w-0 p-4">
          <p className="text-[10px] uppercase tracking-widest text-[#A8A49C] mb-2 shrink-0">
            ✏️ Adendo propuesto
          </p>

          {adendo ? (
            <>
              <div
                className="flex-1 overflow-y-auto rounded-[10px] bg-[#EAF3DE]/50 border border-[#3B6D11]/20 p-3"
                style={{ maxHeight: '380px' }}
              >
                <pre className="text-[11px] text-[#1C1B18] leading-relaxed whitespace-pre-wrap font-sans">
                  {adendo.adendoPropuesto}
                </pre>
              </div>

              <div className="mt-3 shrink-0">
                <p className="text-[10px] text-[#A8A49C] uppercase tracking-wide mb-1">Efecto operativo</p>
                <p className="text-[11px] text-[#6B6760] leading-relaxed">
                  {adendo.efectoOperativo}
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center py-8">
              <p className="text-[12px] text-[#A8A49C]">Selecciona un adendo.</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#E8E4DC] bg-[#FAF8F5]">
        <p className="text-[10px] text-[#A8A49C]">
          trace: CLC-ADENDOS-Q013 · Fuente: ADENDOS: LEGAL/*.md · sprint 1 ·{' '}
          <span className="font-medium text-[#8B5A00]">[BORRADOR PARA REVISIÓN LEGAL]</span>
        </p>
      </div>
    </div>
  )
}
