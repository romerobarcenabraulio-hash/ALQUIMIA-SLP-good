'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import { SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER } from '@/lib/socialContextPlaceholder'
import { SOCIAL_RISK_MATRIX_ITEMS } from '@/data/socialRiskMatrixContent'
import { loadAssumptionsState } from '@/lib/social/socialAssumptionsStorage'
import type { SocialAssumptionsLogProps } from '@/components/simulator/SocialAssumptionsLog'
import {
  buildPr3IndicatorsMarkdownSection,
  buildSocialContextExportMarkdown,
} from '@/lib/social/buildSocialContextExportMarkdown'
import { isSocialContextExportUiEnabled, SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N } from '@/lib/social/pr5ExportConstants'
import { PR5_OUT_OF_SCOPE_ITEMS } from '@/lib/social/pr5OutOfScopeCopy'
import { SocialContextMarkdownPreview } from '@/components/simulator/SocialContextMarkdownPreview'
import type { SocialStatsBundle } from '@/types/socialOfficialStats'
import { SOCIAL_STATS_BUNDLE_EMBEDDED } from '@/data/socialStats/embeddedBundle'
import { getSocialStatsBundleSwR } from '@/lib/social/socialStatsBundleCache'
import { useSimulatorStore } from '@/store/simulatorStore'
import { resolveMunicipioCveForUi } from '@/lib/social/simulatorMunicipioCve'
import { cn } from '@/lib/utils'

export type SocialContextExportPreviewSectionProps = {
  block: SociodemographicDisplayBlock
  moduleAnchor: string
  persistence: SocialAssumptionsLogProps['persistence']
  _storageOverride?: Storage
  className?: string
}

export function SocialContextExportPreviewSection({
  block,
  moduleAnchor,
  persistence,
  _storageOverride,
  className,
}: SocialContextExportPreviewSectionProps) {
  const enabled = isSocialContextExportUiEnabled()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const [liveMsg, setLiveMsg] = useState('')
  const [logTick, setLogTick] = useState(0)
  const [bundle, setBundle] = useState<SocialStatsBundle>(() => SOCIAL_STATS_BUNDLE_EMBEDDED)

  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const catalog = useSimulatorStore(s => s.seleccionMunicipioCatalog)

  useEffect(() => {
    let cancelled = false
    void getSocialStatsBundleSwR().then(b => {
      if (!cancelled) setBundle(b)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fn = () => setLogTick(x => x + 1)
    window.addEventListener('alquimia-social-assumptions-changed', fn)
    return () => window.removeEventListener('alquimia-social-assumptions-changed', fn)
  }, [])

  const storage = useMemo(() => {
    if (_storageOverride) return _storageOverride
    if (typeof window === 'undefined') return null
    return persistence === 'session' ? window.sessionStorage : window.localStorage
  }, [persistence, _storageOverride])

  const assumptionEntries = useMemo(() => {
    if (!storage) return []
    return loadAssumptionsState(storage).entries
  }, [storage, logTick])

  const munId = municipiosActivos.length === 1 ? municipiosActivos[0] ?? null : null
  const catalogCve =
    catalog && munId && catalog.municipioSimulatorId === munId ? catalog.claveInegi : null
  const municipioCve = resolveMunicipioCveForUi({
    municipioSimulatorId: munId,
    catalogClaveInegi: catalogCve,
  })
  const ctx = useMemo(
    () => ({ municipioCve, zmSimulatorId: zmActiva }),
    [municipioCve, zmActiva],
  )

  const markdown = useMemo(() => {
    const pr3 = buildPr3IndicatorsMarkdownSection(bundle, ctx)
    return buildSocialContextExportMarkdown({
      block,
      disclaimerBody: SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER,
      riskItems: SOCIAL_RISK_MATRIX_ITEMS,
      assumptionEntries,
      bitacoraTailN: SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N,
      pr3MarkdownSection: pr3,
      generatedAtIso: new Date().toISOString(),
      moduleAnchor,
    })
  }, [block, assumptionEntries, bundle, ctx, moduleAnchor, logTick])

  const onCopy = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(markdown)
      }
      setLiveMsg('Resumen copiado al portapapeles en formato Markdown.')
      requestAnimationFrame(() => {
        headingRef.current?.focus()
      })
    } catch {
      setLiveMsg('No se pudo copiar. Use descargar .md o intente de nuevo.')
    }
  }, [markdown])

  const onDownload = useCallback(() => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `alquimia-contexto-social-${new Date().toISOString().slice(0, 10)}.md`
    a.rel = 'noopener'
    a.click()
    URL.revokeObjectURL(url)
    setLiveMsg('Archivo Markdown descargado.')
    requestAnimationFrame(() => {
      headingRef.current?.focus()
    })
  }, [markdown])

  if (!enabled) {
    return (
      <p
        data-testid="social-pr5-export-hidden"
        className="mt-6 border-t border-[#E8E4DC] pt-6 text-[11px] text-[#6B6760]"
      >
        Exportación de resumen desactivada en este entorno.
      </p>
    )
  }

  return (
    <section
      data-testid="social-context-pr5-export"
      className={cn('mt-6 border-t border-[#E8E4DC] pt-6', className)}
      aria-labelledby="social-pr5-export-title"
    >
      <div id="social-pr5-export-live" role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {liveMsg}
      </div>

      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760]">PR5 — Preview exportable</p>
      <h4
        ref={headingRef}
        id="social-pr5-export-title"
        tabIndex={-1}
        className="mt-1 scroll-mt-4 font-serif text-[18px] text-[#1C1B18] outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11]"
      >
        Resumen estático (Markdown)
      </h4>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
        Vista previa conforme a estructura Auditor: disclaimer, alcance, matriz cualitativa, bitácora (últimas{' '}
        {SOCIAL_CONTEXT_EXPORT_BITACORA_TAIL_N}) e indicadores PR3. Copiar o descargar .md; no envío automático.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void onCopy()}
          className="rounded-[8px] bg-[#1C1B18] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#3B6D11]"
          data-testid="social-pr5-copy-md"
          aria-label="Copiar resumen al portapapeles como Markdown"
        >
          Copiar Markdown
        </button>
        <button
          type="button"
          onClick={onDownload}
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-4 py-2 text-[12px] font-medium text-[#1C1B18] hover:bg-[#FAFAF8]"
          data-testid="social-pr5-download-md"
          aria-label="Descargar resumen como archivo Markdown"
        >
          Descargar .md
        </button>
      </div>

      <div className="mt-4" role="region" aria-label="Vista previa del resumen en Markdown">
        <p className="sr-only">
          Vista previa de expediente en Markdown con HTML sanitizado. Los encabezados dentro del panel son solo referencia
          visual; no sustituyen el orden de secciones del simulador ni constituyen acto administrativo.
        </p>
        <SocialContextMarkdownPreview markdown={markdown} />
      </div>

      <details
        data-testid="social-context-pr5-out-of-scope"
        className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#6B6760]"
      >
        <summary className="cursor-pointer font-medium text-[#1C1B18]">Fuera de alcance PR5</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {PR5_OUT_OF_SCOPE_ITEMS.map((line, i) => (
            <li key={`pr5oo-${i}`}>{line}</li>
          ))}
        </ul>
      </details>
    </section>
  )
}
