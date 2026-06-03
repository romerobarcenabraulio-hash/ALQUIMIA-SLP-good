'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import {
  SOCIAL_RISK_MATRIX_CONTENT_VERSION,
  SOCIAL_RISK_MATRIX_ITEMS,
} from '@/data/socialRiskMatrixContent'
import { loadAssumptionsState } from '@/lib/social/socialAssumptionsStorage'
import {
  isSocialContextExportUiEnabled,
  SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N,
} from '@/lib/social/pr5ExportConstants'
import { buildSocialBacklogElements } from '@/lib/social/buildSocialBacklogElements'
import { buildSocialHandoffMarkdown } from '@/lib/social/socialHandoffMarkdown'
import {
  PR5_BULK_EXPORT_BITACORA_RAZON_UNA_LINEA,
  PR5_HANDOFF_EXPORT_FORMAT,
  PR5_SOCIAL_HANDOFF_UI_FLOW_LINES,
} from '@/lib/social/pr5HandoffProductSpec'
import type { SocialAssumptionsLogProps } from '@/components/simulator/SocialAssumptionsLog'
import type { SocialBacklogElementoMinimo } from '@/types/socialBacklogHandoff'
import { cn } from '@/lib/utils'
import { Conclusion, MarginalNote, SectionLabel } from '@/components/editorial'

const GEO_LABEL: Record<SociodemographicDisplayBlock['geo_scope'], string> = {
  municipio_cve: 'Municipio (clave / CVE inequívoca)',
  zm_estadistica: 'Zona metropolitana (marco estadístico)',
}

export type SocialContextHandoffPanelProps = {
  block: SociodemographicDisplayBlock
  moduleAnchor: string
  persistence: SocialAssumptionsLogProps['persistence']
  _storageOverride?: Storage
  className?: string
}

type Snapshot = {
  markdown: string
  elementos: SocialBacklogElementoMinimo[]
  generadoIso: string
  assumptionTotal: number
  assumptionIncluded: number
}

export function SocialContextHandoffPanel({
  block,
  moduleAnchor,
  persistence,
  _storageOverride,
  className,
}: SocialContextHandoffPanelProps) {
  const enabled = isSocialContextExportUiEnabled()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const [liveMsg, setLiveMsg] = useState('')
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)

  const storage = useMemo(() => {
    if (_storageOverride) return _storageOverride
    if (typeof window === 'undefined') return null
    return persistence === 'session' ? window.sessionStorage : window.localStorage
  }, [persistence, _storageOverride])

  const onGenerate = useCallback(() => {
    if (!storage) {
      setLiveMsg('Almacenamiento no disponible en este entorno.')
      return
    }
    const entries = loadAssumptionsState(storage).entries
    const tail = entries.slice(Math.max(0, entries.length - SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N))
    const elementos = buildSocialBacklogElements(SOCIAL_RISK_MATRIX_ITEMS, tail, moduleAnchor)
    const generadoIso = new Date().toISOString()
    const markdown = buildSocialHandoffMarkdown(
      elementos,
      {
        generado_iso: generadoIso,
        module_anchor: moduleAnchor,
        alcance_geo_declarado: GEO_LABEL[block.geo_scope],
        catalog_simulation_epoch: SOCIAL_RISK_MATRIX_CONTENT_VERSION,
      },
      {
        bitacora: { total: entries.length, included: tail.length },
      },
    )
    setSnapshot({
      markdown,
      elementos,
      generadoIso,
      assumptionTotal: entries.length,
      assumptionIncluded: tail.length,
    })
    setLiveMsg('Previsualización generada. Revise la tabla y use copiar Markdown si corresponde.')
    requestAnimationFrame(() => {
      titleRef.current?.focus()
    })
  }, [storage, block.geo_scope, moduleAnchor])

  const onCopy = useCallback(async () => {
    if (!snapshot?.markdown) return
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(snapshot.markdown)
        setLiveMsg('Markdown copiado al portapapeles.')
      } else {
        throw new Error('clipboard')
      }
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = snapshot.markdown
        ta.setAttribute('aria-hidden', 'true')
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        setLiveMsg('Markdown copiado al portapapeles (método alternativo).')
      } catch {
        setLiveMsg('No se pudo copiar. Seleccione el texto del área Markdown abajo.')
      }
    }
    requestAnimationFrame(() => {
      titleRef.current?.focus()
    })
  }, [snapshot?.markdown])

  if (!enabled) {
    return (
      <p
        data-testid="social-context-handoff-hidden"
        className={cn('mt-6 border-t border-[#E8E4DC] pt-6 text-[11px] text-[#6B6760]', className)}
      >
        Handoff PR5 desactivado en este entorno.
      </p>
    )
  }

  return (
    <section
      data-testid="social-context-handoff-root"
      className={cn('mt-6 border-t border-[#E8E4DC] pt-6', className)}
      aria-labelledby="social-context-handoff-title"
    >
      <div id="social-context-handoff-live" role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMsg}
      </div>

      <SectionLabel>Handoff de backlog (PR5)</SectionLabel>
      <h4
        ref={titleRef}
        id="social-context-handoff-title"
        tabIndex={-1}
        className="mt-1 scroll-mt-4 font-serif text-[18px] text-[#1C1B18] outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11]"
      >
        Artefacto reproducible ({PR5_HANDOFF_EXPORT_FORMAT})
      </h4>
      <Conclusion as="div" className="mt-2 text-[14px] md:text-[15px] max-w-3xl">
        Elementos mínimos para actas o sistemas externos sin CRM integrado: título, origen de capa, severidad interna en texto,
        responsable opcional vacío y ancla interna. Un solo formato de salida en PR5: Markdown.
      </Conclusion>
      <MarginalNote className="max-w-3xl">
        <span className="font-medium text-[#1C1B18]">Export masivo del histórico completo de bitácora:</span>{' '}
        {PR5_BULK_EXPORT_BITACORA_RAZON_UNA_LINEA}
      </MarginalNote>

      <details className="mt-3 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#6B6760]">
        <summary className="cursor-pointer font-medium text-[#1C1B18]">Flujo de producto (12 pasos)</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          {PR5_SOCIAL_HANDOFF_UI_FLOW_LINES.map((line, i) => (
            <li key={`flow-${i}`}>{line}</li>
          ))}
        </ol>
      </details>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={!storage}
          data-testid="social-context-handoff-generate"
          className="rounded-[8px] bg-[#1C1B18] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#3B6D11] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Generar previsualización
        </button>
        <button
          type="button"
          onClick={() => void onCopy()}
          disabled={!snapshot}
          data-testid="social-context-handoff-copy-md"
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-4 py-2 text-[12px] font-medium text-[#1C1B18] hover:bg-[#FAFAF8] disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Copiar Markdown del handoff al portapapeles"
        >
          Copiar Markdown al portapapeles
        </button>
      </div>

      {snapshot && (
        <div
          className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-white p-3 text-[#1C1B18]"
          role="region"
          aria-label="Previsualización accesible del handoff"
        >
          <h5 className="text-[13px] font-semibold text-[#1C1B18]">Metadatos del snapshot</h5>
          <dl className="mt-2 grid gap-2 text-[12px] sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-[#6B6760]">Generado (ISO)</dt>
              <dd className="mt-0.5 font-mono text-[11px]">{snapshot.generadoIso}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wide text-[#6B6760]">Ancla módulo</dt>
              <dd className="mt-0.5 font-mono text-[11px]">{moduleAnchor}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-wide text-[#6B6760]">Alcance geográfico declarado</dt>
              <dd className="mt-0.5">{GEO_LABEL[block.geo_scope]}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-[10px] uppercase tracking-wide text-[#6B6760]">Bitácora en snapshot</dt>
              <dd className="mt-0.5 text-[#6B6760]">
                {snapshot.assumptionIncluded} de {snapshot.assumptionTotal} entradas locales (últimas{' '}
                {SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N} como máximo).
              </dd>
            </div>
          </dl>

          <h5 className="mt-4 text-[13px] font-semibold text-[#1C1B18]">Elementos backlog (tabla)</h5>
          <div className="mt-2 overflow-x-auto">
            <table
              data-testid="social-context-handoff-preview-table"
              className="w-full min-w-[32rem] border-collapse border border-[#E8E4DC] text-left text-[12px]"
            >
              <caption className="caption-bottom pt-2 text-left text-[11px] leading-snug text-[#5C5740]">
                Resumen cualitativo acotado:{' '}
                {snapshot.elementos.length} filas (riesgos versionados más supuestos recientes). Destinado a exportación Markdown,
                no a tabla dinámica infinita.
              </caption>
              <thead className="bg-[#FDFCFA]">
                <tr>
                  <th scope="col" className="border border-[#E8E4DC] px-2 py-2 font-semibold text-[#1C1B18]">
                    Título
                  </th>
                  <th scope="col" className="border border-[#E8E4DC] px-2 py-2 font-semibold text-[#1C1B18]">
                    Origen capa
                  </th>
                  <th scope="col" className="border border-[#E8E4DC] px-2 py-2 font-semibold text-[#1C1B18]">
                    Severidad interna
                  </th>
                  <th scope="col" className="border border-[#E8E4DC] px-2 py-2 font-semibold text-[#1C1B18]">
                    Responsable (opc.)
                  </th>
                  <th scope="col" className="border border-[#E8E4DC] px-2 py-2 font-semibold text-[#1C1B18]">
                    Ancla interna
                  </th>
                </tr>
              </thead>
              <tbody>
                {snapshot.elementos.map((row, idx) => (
                  <tr key={`${row.enlace_interno_anchor}-${idx}`} className="odd:bg-white even:bg-[#FAFAF8]/80">
                    <td className="border border-[#E8E4DC] px-2 py-2 text-[#1C1B18]">{row.titulo}</td>
                    <td className="border border-[#E8E4DC] px-2 py-2 font-mono text-[11px] text-[#1C1B18]">
                      {row.origen_capa}
                    </td>
                    <td className="border border-[#E8E4DC] px-2 py-2 text-[#1C1B18]">{row.severidad_interna}</td>
                    <td className="border border-[#E8E4DC] px-2 py-2 text-[#6B6760]">
                      {row.responsable_propuesto_opcional.trim() || '—'}
                    </td>
                    <td className="border border-[#E8E4DC] px-2 py-2 font-mono text-[10px] text-[#3B6D11]">
                      {row.enlace_interno_anchor}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h5 className="mt-4 text-[13px] font-semibold text-[#1C1B18]">Markdown generado (solo lectura)</h5>
          <label className="mt-1 block text-[10px] uppercase tracking-wide text-[#6B6760]" htmlFor="social-context-handoff-md-field">
            Mismo contenido que copia el botón; seleccionable si el portapapeles falla.
          </label>
          <textarea
            id="social-context-handoff-md-field"
            readOnly
            data-testid="social-context-handoff-md-textarea"
            value={snapshot.markdown}
            rows={14}
            className="mt-1 w-full resize-y rounded-[8px] border border-[#E8E4DC] bg-[#1C1B08]/5 px-2 py-2 font-mono text-[11px] leading-relaxed text-[#1C1B18]"
          />
        </div>
      )}
    </section>
  )
}
