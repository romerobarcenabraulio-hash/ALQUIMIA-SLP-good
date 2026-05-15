'use client'

import { useCallback, useRef, useState } from 'react'
import type { QuantVizRow } from '@/lib/social/socialStatsQuantRows'
import { cn } from '@/lib/utils'

const ROW_PX = 30
const VIEWPORT_MAX = 360

type Props = {
  rows: QuantVizRow[]
  className?: string
}

export function SocialStatsDenseVirtualTable({ rows, className }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const virtual = rows.length > 20

  const onScroll = useCallback(() => {
    if (scrollRef.current) setScrollTop(scrollRef.current.scrollTop)
  }, [])

  const body = virtual ? (() => {
    const start = Math.floor(scrollTop / ROW_PX)
    const visible = Math.ceil(VIEWPORT_MAX / ROW_PX) + 3
    const end = Math.min(rows.length, start + visible)
    const slice = rows.slice(start, end)
    const paddingTop = start * ROW_PX
    const paddingBottom = (rows.length - end) * ROW_PX
    return { slice, paddingTop, paddingBottom }
  })() : { slice: rows, paddingTop: 0, paddingBottom: 0 }

  return (
    <div className={cn('rounded-[8px] border border-[#E8E4DC] bg-white', className)}>
      <table className="w-full border-collapse text-[10px]">
        <thead className="sticky top-0 z-[1] bg-[#FAFAF8] text-left text-[#6B6760]">
          <tr className="border-b border-[#E8E4DC]">
            <th className="px-2 py-1.5 font-medium">Serie</th>
            <th className="px-2 py-1.5 font-mono text-right">Valor</th>
            <th className="px-2 py-1.5">Unid.</th>
            <th className="px-2 py-1.5">Ámbito</th>
            <th className="px-2 py-1.5">Vintage</th>
            <th className="px-2 py-1.5">Fuente</th>
          </tr>
        </thead>
      </table>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className={cn(virtual && 'overflow-auto')}
        style={virtual ? { maxHeight: VIEWPORT_MAX } : undefined}
        data-testid="social-pr4-table-scroll"
        data-virtualized={virtual ? 'true' : 'false'}
      >
        <table className="w-full border-collapse text-[10px]">
          {virtual ? (
            <tbody>
              {body.paddingTop > 0 ? (
                <tr style={{ height: body.paddingTop }} aria-hidden>
                  <td colSpan={6} />
                </tr>
              ) : null}
              {body.slice.map((r, i) => (
                <QuantRow key={`${r.kind}-${i}-${r.kind === 'primary' ? r.indicatorId : r.derivativeId}`} row={r} />
              ))}
              {body.paddingBottom > 0 ? (
                <tr style={{ height: body.paddingBottom }} aria-hidden>
                  <td colSpan={6} />
                </tr>
              ) : null}
            </tbody>
          ) : (
            <tbody>
              {body.slice.map((r, i) => (
                <QuantRow key={`${r.kind}-${i}-${r.kind === 'primary' ? r.indicatorId : r.derivativeId}`} row={r} />
              ))}
            </tbody>
          )}
        </table>
      </div>
    </div>
  )
}

function fmtNum(n: number) {
  return new Intl.NumberFormat('es-MX', { maximumFractionDigits: 4 }).format(n)
}

function QuantRow({ row }: { row: QuantVizRow }) {
  if (row.kind === 'primary') {
    const has = row.value != null && row.meta
    return (
      <tr className="border-b border-[#F0EDE5] last:border-b-0" data-row-kind="primary">
        <td className="max-w-[140px] px-2 py-1 font-medium text-[#1C1B18]">{row.label}</td>
        <td className="px-2 py-1 text-right font-mono text-[#1C1B18]">
          {has ? fmtNum(row.value!) : '—'}
        </td>
        <td className="px-2 py-1 text-[#6B6760]">{row.unit}</td>
        <td className="px-2 py-1 text-[#5A6347]">{row.meta?.geoLevel ?? '—'}</td>
        <td className="px-2 py-1 text-[#6B6760]">{row.meta?.vintageLabel ?? '—'}</td>
        <td className="px-2 py-1 font-mono text-[#6B6760]">{row.meta?.sourceId ?? '—'}</td>
      </tr>
    )
  }

  const blocked = row.outcome.status === 'blocked'
  const showVal = row.value != null && row.outcome.status === 'ok'
  return (
    <tr
      className={cn('border-b border-[#F0EDE5] last:border-b-0', blocked && 'bg-amber-50/50')}
      data-row-kind="derivative"
      data-outcome={row.outcome.status}
    >
      <td className="max-w-[140px] px-2 py-1 font-medium text-[#1C1B18]">{row.label}</td>
      <td className="px-2 py-1 text-right font-mono text-[#1C1B18]">
        {showVal ? fmtNum(row.value!) : 'no disponible'}
      </td>
      <td className="px-2 py-1 text-[#6B6760]">{row.unit}</td>
      <td className="px-2 py-1 text-[#5A6347]">{row.meta?.geoLevel ?? '—'}</td>
      <td className="px-2 py-1 text-[#6B6760]">{row.meta?.vintageLabel ?? '—'}</td>
      <td className="px-2 py-1 font-mono text-[#6B6760]">{row.meta?.sourceId ?? '—'}</td>
    </tr>
  )
}
