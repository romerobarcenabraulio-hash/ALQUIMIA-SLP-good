import type { QuantVizRow } from '@/lib/social/socialStatsQuantRows'

type Props = {
  rows: QuantVizRow[]
  className?: string
}

/**
 * Pie de metadatos obligatorio (PR4): cada serie expone geoLevel, vintage y sourceId para lectura asistida.
 */
export function SocialPr4MetadataFooter({ rows, className }: Props) {
  return (
    <footer
      role="contentinfo"
      data-testid="social-pr4-metadata-footer"
      aria-label="Metadatos de series sociodemográficas (PR4)"
      className={className}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">
        Metadatos por serie (lectura obligatoria)
      </p>
      <dl className="mt-2 space-y-2 text-[10px] leading-snug text-[#6B6760]">
        {rows.map((r, idx) => {
          const title =
            r.kind === 'primary'
              ? `${r.indicatorId} · ${r.label}`
              : `${r.derivativeId} · ${r.label}`

          const meta =
            r.kind === 'primary'
              ? r.meta
              : r.outcome.status === 'ok'
                ? r.meta
                : null

          const extra =
            r.kind === 'derivative' && r.outcome.status === 'blocked' ? (
              <p className="mt-1 text-amber-900">{r.outcome.warning}</p>
            ) : r.kind === 'derivative' && r.outcome.status === 'no_whitelist' ? (
              <p className="mt-1">Derivados desactivados: lista blanca Auditor vacía.</p>
            ) : r.kind === 'derivative' && r.outcome.status === 'no_disponible' ? (
              <p className="mt-1">Derivado no disponible en este subconjunto.</p>
            ) : null

          return (
            <div key={`meta-${idx}-${title}`} className="rounded-[6px] border border-[#F0EDE5] bg-[#FAFAF8] px-2 py-1.5">
              <dt className="font-medium text-[#1C1B18]">{title}</dt>
              <dd className="mt-1">
                <span className="sr-only">Ámbito territorial según modelo PR3:</span>
                <span data-meta-field="geoLevel">{meta?.geoLevel ?? 'Sin dato integrado'}</span>
                <span aria-hidden className="mx-1 text-[#C8C2B8]">
                  |
                </span>
                <span className="sr-only">Vintage o cohorte:</span>
                <span data-meta-field="vintageLabel">{meta?.vintageLabel ?? '—'}</span>
                <span aria-hidden className="mx-1 text-[#C8C2B8]">
                  |
                </span>
                <span className="sr-only">Identificador de fuente:</span>
                <span data-meta-field="sourceId" className="font-mono">
                  {meta?.sourceId ?? '—'}
                </span>
              </dd>
              {extra}
            </div>
          )
        })}
      </dl>
    </footer>
  )
}
