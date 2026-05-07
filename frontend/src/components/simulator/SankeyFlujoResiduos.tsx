'use client'

import { useMemo } from 'react'
import type { TooltipProps } from 'recharts'
import { Rectangle, ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import {
  computeSankeyKpis,
  interpolateSankeyLinks,
  SANKEY_NODES,
} from '@/data/sankeyData'
import { useSimulatorStore } from '@/store/simulatorStore'

type SankeyChartLink = {
  source: number
  target: number
  value: number
  description: string
  flowKind: 'circular' | 'relleno'
  targetId: string
  sourceId: string
}

interface CustomLinkPayload extends Record<string, unknown> {
  value?: number
  sourceId: string
  targetId: string
  description?: string
}

function CustomSankeyNode({
  x,
  y,
  width,
  height,
  index,
}: {
  x: number
  y: number
  width: number
  height: number
  index: number
}) {
  const col = SANKEY_NODES[index]?.column
  const fill =
    col === 'fuente' ? '#2563eb' : col === 'material' ? '#b45309' : '#3B6D11'
  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={fill}
      fillOpacity={0.88}
      stroke="#1C1B18"
      strokeWidth={1}
      radius={4}
    />
  )
}

function CustomSankeyLink(
  props: React.SVGProps<SVGPathElement> & {
    sourceX?: number
    sourceY?: number
    targetX?: number
    targetY?: number
    sourceControlX?: number
    targetControlX?: number
    linkWidth?: number
    payload?: CustomLinkPayload & { source?: unknown; target?: unknown }
  },
) {
  const {
    sourceX = 0,
    sourceY = 0,
    targetX = 0,
    targetY = 0,
    sourceControlX = 0,
    targetControlX = 0,
    linkWidth = 1,
    payload,
  } = props
  const tid = payload?.targetId
  const isDest = tid === 'val' || tid === 'recic' || tid === 'rell'
  const toRell = tid === 'rell'
  const stroke = !isDest ? '#64748b' : toRell ? '#b91c1c' : '#15803d'
  const strokeOpacity = !isDest ? 0.18 : toRell ? 0.38 : 0.32

  const d = `
          M${sourceX},${sourceY}
          C${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}
        `

  return (
    <path
      className="recharts-sankey-link"
      d={d}
      fill="none"
      stroke={stroke}
      strokeWidth={linkWidth}
      strokeOpacity={strokeOpacity}
    />
  )
}

function FlujoLinkTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const wrap = payload[0]?.payload as
    | { payload?: CustomLinkPayload & { value?: number } }
    | undefined
  const inner = wrap?.payload
  if (
    inner &&
    typeof inner.sourceId === 'string' &&
    typeof inner.targetId === 'string'
  ) {
    const v = Number(inner.value ?? 0)
    const desc = inner.description ?? ''
    return (
      <div
        className="max-w-[280px] rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2.5 shadow-sm"
        style={{ fontSize: 12 }}
      >
        <p className="font-mono text-[14px] font-semibold text-[#1C1B18]">
          {v.toFixed(2)} t/día
        </p>
        <p className="mt-1 text-[11px] leading-snug text-[#6B6760]">{desc}</p>
      </div>
    )
  }
  return null
}

export function SankeyFlujoResiduos() {
  const horizonte = useSimulatorStore(s => s.horizonte)
  const anioPropuesto = Math.max(1, Math.min(5, horizonte))
  const specLinks = useMemo(
    () => interpolateSankeyLinks(anioPropuesto),
    [anioPropuesto],
  )

  const kpis = useMemo(() => computeSankeyKpis(specLinks), [specLinks])

  const indexById = useMemo(
    () => new Map(SANKEY_NODES.map((n, i) => [n.id, i])),
    [],
  )

  const chartData = useMemo(() => {
    const nodes = SANKEY_NODES.map(n => ({ name: n.name }))
    const links: SankeyChartLink[] = specLinks
      .filter(
        l =>
          indexById.has(l.source) &&
          indexById.has(l.target) &&
          l.value > 0,
      )
      .map(l => ({
        source: indexById.get(l.source)!,
        target: indexById.get(l.target)!,
        value: Number(l.value.toFixed(4)),
        description: l.description,
        flowKind: l.flowKind,
        targetId: l.target,
        sourceId: l.source,
      }))
    return { nodes, links }
  }, [specLinks, indexById])

  if (chartData.links.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-6 text-center text-[12px] text-[#6B6760]">
        Sin flujos disponibles para el escenario propuesto.
      </div>
    )
  }

  return (
    <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C]">
        S15 — Flujo de residuos (modelo PD&amp;SA)
      </p>
      <h2 className="font-serif text-[22px] text-[#1C1B18] mt-1 mb-3">
        Sankey: fuentes → materiales → destinos
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        {[
          {
            l: 'Aprovechamiento (circular)',
            v: `${kpis.circularTdia.toFixed(2)} t/día`,
            c: 'text-[#15803d]',
          },
          {
            l: 'Disposición en relleno',
            v: `${kpis.rellenoTdia.toFixed(2)} t/día`,
            c: 'text-[#b91c1c]',
          },
          {
            l: 'Reducción relleno vs. año 0',
            v: `${kpis.reduccionRellenoPct.toFixed(1)}%`,
            c: 'text-[#3B6D11]',
          },
        ].map(item => (
          <div
            key={item.l}
            className="bg-white border border-[#E8E4DC] rounded-[12px] p-3.5"
          >
            <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide mb-1">
              {item.l}
            </p>
            <p className={`font-mono text-[20px] font-medium ${item.c}`}>
              {item.v}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-[#A8A49C] mb-4">
        Escenario propuesto · año {anioPropuesto} · separación en 5 fracciones activa — proyecciones estimadas, no datos oficiales
      </p>

      <div className="flex flex-wrap gap-4 justify-center text-[10px] text-[#6B6760] mb-2">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded bg-[#2563eb]" />
          Fuentes
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded bg-[#b45309]" />
          Materiales
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded bg-[#3B6D11]" />
          Destinos
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded bg-[#15803d]" />
          Flujo circular
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-1 rounded bg-[#b91c1c]" />
          Relleno
        </span>
      </div>

      <div style={{ width: '100%', height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={chartData}
            nodePadding={24}
            nodeWidth={16}
            linkCurvature={0.5}
            margin={{ top: 8, right: 16, bottom: 8, left: 16 }}
            node={CustomSankeyNode}
            link={<CustomSankeyLink />}
          >
            <Tooltip content={<FlujoLinkTooltip />} />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
