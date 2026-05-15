'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import {
  SOCIAL_STATS_BUNDLE_EMBEDDED,
  SOCIAL_STATS_INDICATOR_ORDER,
} from '@/data/socialStats/embeddedBundle'
import type { SocialStatsBundle } from '@/types/socialOfficialStats'
import { OfficialStatCard } from '@/components/simulator/OfficialStatCard'
import { resolveMunicipioCveForUi } from '@/lib/social/simulatorMunicipioCve'
import { resolveOfficialStat } from '@/lib/social/socialStatsResolve'
import { getSocialStatsBundleSwR, getSocialStatsSourceMode } from '@/lib/social/socialStatsBundleCache'
import { PR3_OUT_OF_SCOPE_ITEMS } from '@/lib/social/pr3OutOfScopeCopy'

export function SocialOfficialStatsSection() {
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

  const requestedAmbitoLabel = useMemo(() => {
    if (municipioCve) return `Municipio CVE ${municipioCve}`
    if (municipiosActivos.length > 1) return `ZM ${zmActiva} (varios municipios activos — sin CVE único)`
    return 'Sin municipio único seleccionado'
  }, [municipioCve, municipiosActivos.length, zmActiva])

  const sourceMode = getSocialStatsSourceMode()

  return (
    <section
      data-testid="social-context-official-stats"
      data-source-mode={sourceMode}
      data-bundle-build={bundle.buildId}
      className="mt-6 border-t border-[#E8E4DC] pt-6"
      aria-label="Indicadores sociodemográficos — subconjunto oficial"
    >
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760]">PR3 · Indicadores (read-only)</p>
      <h4 className="mt-1 font-serif text-[18px] text-[#1C1B18]">Subconjunto sociodemográfico versionado</h4>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
        Dataset local con nombre versionado o fetch remoto según{' '}
        <span className="font-mono text-[11px]">NEXT_PUBLIC_SOCIAL_STATS_SOURCE</span>. Caché en memoria stale-while-revalidate;{' '}
        sin persistencia de valores por el usuario.
      </p>
      <p className="mt-1 font-mono text-[10px] text-[#6B6760]">
        buildId={bundle.buildId} · modo={sourceMode}
      </p>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {SOCIAL_STATS_INDICATOR_ORDER.map(indicatorId => {
          const resolved = resolveOfficialStat(bundle, indicatorId, {
            municipioCve,
            zmSimulatorId: zmActiva,
          })
          return (
            <OfficialStatCard
              key={`${indicatorId}-${resolved.availability}-${resolved.slice?.geoCode ?? 'na'}`}
              availability={resolved.availability}
              slice={resolved.slice}
              requestedAmbitoLabel={requestedAmbitoLabel}
            />
          )
        })}
      </div>

      <details
        data-testid="social-context-pr3-out-of-scope"
        className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#6B6760]"
      >
        <summary className="cursor-pointer font-medium text-[#1C1B18]">Fuera de alcance PR3</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {PR3_OUT_OF_SCOPE_ITEMS.map((line, i) => (
            <li key={`pr3oo-${i}`}>{line}</li>
          ))}
        </ul>
      </details>
    </section>
  )
}
