'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { SOCIAL_STATS_BUNDLE_EMBEDDED } from '@/data/socialStats/embeddedBundle'
import type { SocialStatsBundle } from '@/types/socialOfficialStats'
import { resolveMunicipioCveForUi } from '@/lib/social/simulatorMunicipioCve'
import { getSocialStatsBundleSwR, getSocialStatsSourceMode } from '@/lib/social/socialStatsBundleCache'
import { buildQuantVizRows } from '@/lib/social/socialStatsQuantRows'
import { analyzePr4TerritorialMix } from '@/lib/social/pr4SeriesHomogeneity'
import { PR4_OUT_OF_SCOPE_ITEMS } from '@/lib/social/pr4OutOfScopeCopy'
import { SOCIAL_QUANT_VIZ_MAX_SERIES } from '@/data/socialStats/vizIndicators'
import { SocialStatsDenseVirtualTable } from '@/components/simulator/SocialStatsDenseVirtualTable'
import { SocialStatsLightBarChart } from '@/components/simulator/SocialStatsLightBarChart'
import { SocialPr4MetadataFooter } from '@/components/simulator/SocialPr4MetadataFooter'

export function SocialQuantitativeVizSection() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const catalog = useSimulatorStore(s => s.seleccionMunicipioCatalog)

  const [bundle, setBundle] = useState<SocialStatsBundle>(() => SOCIAL_STATS_BUNDLE_EMBEDDED)

  useEffect(() => {
    let cancelled = false
    void getSocialStatsBundleSwR().then(b => {
      if (!cancelled) setBundle(b)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const munId = municipiosActivos.length === 1 ? municipiosActivos[0] ?? null : null
  const catalogCve =
    catalog && munId && catalog.municipioSimulatorId === munId ? catalog.claveInegi : null

  const municipioCve = resolveMunicipioCveForUi({
    municipioSimulatorId: munId,
    catalogClaveInegi: catalogCve,
  })

  const ctx = useMemo(
    () => ({
      municipioCve,
      zmSimulatorId: zmActiva,
    }),
    [municipioCve, zmActiva],
  )

  const { rows, chartPoints } = useMemo(() => buildQuantVizRows(bundle, ctx), [bundle, ctx])
  const derivative = rows.find(r => r.kind === 'derivative')
  const territorialMix = useMemo(() => analyzePr4TerritorialMix(rows), [rows])

  const sourceMode = getSocialStatsSourceMode()

  return (
    <section
      data-testid="social-context-pr4-viz"
      data-source-mode={sourceMode}
      className="mt-6 border-t border-[#E8E4DC] pt-6"
      aria-label="Visualización cuantitativa ligera sociodemográfica (PR4)"
    >
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760]">PR4 · Cuantitativo ligero</p>
      <h4 className="mt-1 font-serif text-[18px] text-[#1C1B18]">
        Tabla y barras: cada serie con su propio tabulado territorial
      </h4>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
        Hasta {SOCIAL_QUANT_VIZ_MAX_SERIES} series en pantalla con columnas <strong>Ámbito</strong> y{' '}
        <strong>Vintage</strong> obligatorias. Los cocientes derivados sólo con lista blanca Auditor y sólo si numerador
        y denominador son homogéneos. Esta vista no asume que filas o barras compartan la misma geografía ni el mismo
        corte temporal si los metadatos difieren. Sin mapas coropléticos ni visualización 3D.
      </p>

      {territorialMix.hasMixedTabulationFrames ? (
        <div
          role="note"
          data-testid="social-pr4-nonhomogeneous-info"
          className="mt-4 rounded-[8px] border border-sky-300 bg-sky-50 px-3 py-2 text-[11px] leading-snug text-sky-950"
        >
          <strong className="font-semibold">Comparación no homogénea en pantalla:</strong> coexisten tabulados con distinto
          marco territorial o vintage (incluido municipio CVE frente a ZM estadística u otros ámbitos). Las cifras no son
          intercambiables ni sumables para decisión municipal; use cada serie según su fila y el pie de metadatos.
        </div>
      ) : null}

      {derivative?.kind === 'derivative' && derivative.outcome.status === 'blocked' ? (
        <div
          role="alert"
          data-testid="social-pr4-derivative-blocked"
          className="mt-4 rounded-[8px] border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-950"
        >
          {derivative.outcome.warning}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SocialStatsDenseVirtualTable rows={rows} />
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-2">
          <p className="mb-1 px-1 text-[10px] font-medium uppercase tracking-wide text-[#6B6760]">
            Barras (una por serie declarada)
          </p>
          <p className="mb-2 px-1 text-[10px] leading-snug text-[#6B6760]">
            Sin equivalencia territorial entre barras si Ámbito o Vintage difieren; no fusionar con el municipio modelado
            sin revisar metadatos.
          </p>
          <SocialStatsLightBarChart points={chartPoints} />
        </div>
      </div>

      <SocialPr4MetadataFooter rows={rows} className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-3" />

      <details
        data-testid="social-context-pr4-out-of-scope"
        className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#6B6760]"
      >
        <summary className="cursor-pointer font-medium text-[#1C1B18]">Fuera de alcance PR4</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {PR4_OUT_OF_SCOPE_ITEMS.map((line, i) => (
            <li key={`pr4oo-${i}`}>{line}</li>
          ))}
        </ul>
      </details>
    </section>
  )
}
