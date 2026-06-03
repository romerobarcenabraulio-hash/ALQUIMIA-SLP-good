'use client'

/**
 * Fase 22.4 — Sankey real con recharts.
 *
 * Reemplaza las "promesas Sankey" planas por un diagrama jerárquico
 * con grosor proporcional al flujo. Acepta `nodes` y `links` declarativos.
 */

import { ResponsiveContainer, Sankey, Tooltip } from 'recharts'
import { SectionLabel } from '@/components/editorial'

export interface SankeyNode {
  id: string
  name: string
}

export interface SankeyLink {
  source: string
  target: string
  value: number
}

interface FlujosSankeyProps {
  title?: string
  nodes: SankeyNode[]
  links: SankeyLink[]
  height?: number
}

export function FlujosSankey({ title, nodes, links, height = 280 }: FlujosSankeyProps) {
  // recharts.Sankey espera nodos como { name } y links como { source: index, target: index, value }
  const indexById = new Map(nodes.map((n, i) => [n.id, i]))
  const data = {
    nodes: nodes.map(n => ({ name: n.name })),
    links: links
      .filter(l => indexById.has(l.source) && indexById.has(l.target) && l.value > 0)
      .map(l => ({
        source: indexById.get(l.source)!,
        target: indexById.get(l.target)!,
        value: Number(l.value.toFixed(3)),
      })),
  }

  if (data.links.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-6 text-center text-[12px] text-[#6B6760]">
        Sin flujos suficientes para dibujar el diagrama Sankey. Configura mix y trayectoria primero.
      </div>
    )
  }

  return (
    <div className="border-t border-[#E8E4DC] pt-4">
      {title && <SectionLabel>{title}</SectionLabel>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <Sankey
            data={data}
            nodePadding={28}
            nodeWidth={14}
            margin={{ top: 12, right: 12, bottom: 12, left: 12 }}
            link={{ stroke: '#3B6D11', strokeOpacity: 0.18 }}
            node={{ fill: '#3B6D11', stroke: '#1C1B18' }}
          >
            <Tooltip
              formatter={(value: number) => [`${value.toFixed(2)} t/día`, 'Flujo']}
              contentStyle={{
                background: '#FDFCFA',
                border: '1px solid #E8E4DC',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
