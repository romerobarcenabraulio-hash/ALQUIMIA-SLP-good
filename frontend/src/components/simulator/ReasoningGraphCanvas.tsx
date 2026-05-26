'use client'

/**
 * Fase 22.4 — Grafo dirigido para el Reasoning Graph.
 *
 * Reemplaza el contador textual por un SVG con nodos posicionados en capas
 * (sources → cálculos → outputs). No usa libs adicionales: layout determinístico
 * en función de la métrica `kind` o, en su defecto, del orden recibido.
 */

import { useMemo } from 'react'
import type { ReasoningGraph } from '@/types'
import { MarginalNote } from '@/components/editorial/MarginalNote'

interface ReasoningGraphCanvasProps {
  graph: ReasoningGraph
  height?: number
}

interface PositionedNode {
  id: string
  label: string
  x: number
  y: number
  layer: number
}

const LAYER_LABELS: Record<number, string> = {
  0: 'Fuente',
  1: 'Cálculo',
  2: 'Resultado',
}

export function ReasoningGraphCanvas({ graph, height = 280 }: ReasoningGraphCanvasProps) {
  const positioned = useMemo(() => layoutGraph(graph), [graph])
  if (positioned.nodes.length === 0) {
    return (
      <MarginalNote className="text-center border border-dashed border-[#E8E4DC] px-4 py-6">
        Construye el grafo para ver nodos y relaciones causales.
      </MarginalNote>
    )
  }
  const { nodes, width } = positioned
  return (
    <div className="overflow-x-auto border-t border-[#E8E4DC] pt-4">
      <svg
        role="img"
        aria-label="Grafo causal del razonamiento"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: width }}
      >
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="10"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B6D11" />
          </marker>
        </defs>

        {graph.edges.map(edge => {
          const from = nodes.find(n => n.id === edge.from_node)
          const to = nodes.find(n => n.id === edge.to_node)
          if (!from || !to) return null
          return (
            <line
              key={edge.edge_id}
              x1={from.x + 32}
              y1={from.y}
              x2={to.x - 32}
              y2={to.y}
              stroke="#3B6D11"
              strokeOpacity={0.45}
              strokeWidth={1.4}
              markerEnd="url(#arrow)"
            />
          )
        })}

        {nodes.map(node => (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              x={-90}
              y={-22}
              width={180}
              height={44}
              rx={10}
              ry={10}
              fill={layerFill(node.layer)}
              stroke={layerStroke(node.layer)}
              strokeWidth={1.2}
            />
            <text
              x={0}
              y={-4}
              textAnchor="middle"
              fontSize={9}
              fill="#6B6760"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
            >
              {LAYER_LABELS[node.layer] ?? 'Nodo'}
            </text>
            <text
              x={0}
              y={12}
              textAnchor="middle"
              fontSize={11}
              fill="#1C1B18"
              fontFamily="ui-sans-serif, system-ui"
            >
              {truncate(node.label, 22)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

function layoutGraph(graph: ReasoningGraph): { nodes: PositionedNode[]; width: number } {
  // 0 = sin entradas (fuente), 2 = sin salidas (resultado), 1 = intermedio
  const incoming = new Map<string, number>()
  const outgoing = new Map<string, number>()
  for (const n of graph.nodes) {
    incoming.set(n.node_id, 0)
    outgoing.set(n.node_id, 0)
  }
  for (const e of graph.edges) {
    incoming.set(e.to_node, (incoming.get(e.to_node) ?? 0) + 1)
    outgoing.set(e.from_node, (outgoing.get(e.from_node) ?? 0) + 1)
  }
  const layered = graph.nodes.map(n => {
    const inc = incoming.get(n.node_id) ?? 0
    const out = outgoing.get(n.node_id) ?? 0
    const layer = inc === 0 ? 0 : out === 0 ? 2 : 1
    return { id: n.node_id, label: n.label, layer }
  })

  const layerColumns: Record<number, typeof layered> = { 0: [], 1: [], 2: [] }
  for (const n of layered) layerColumns[n.layer].push(n)

  const colWidth = 240
  const rowHeight = 60
  const padX = 110
  const padY = 40
  const positioned: PositionedNode[] = []
  for (const layer of [0, 1, 2]) {
    const items = layerColumns[layer]
    items.forEach((item, idx) => {
      positioned.push({
        ...item,
        x: padX + layer * colWidth,
        y: padY + idx * rowHeight + (layer === 1 ? rowHeight / 2 : 0),
      })
    })
  }
  const width = padX * 2 + 2 * colWidth
  return { nodes: positioned, width }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max - 1) + '…'
}

function layerFill(layer: number): string {
  if (layer === 0) return '#F2EEE5'
  if (layer === 2) return '#EAF3DE'
  return '#FDFCFA'
}

function layerStroke(layer: number): string {
  if (layer === 0) return '#A8A49C'
  if (layer === 2) return '#3B6D11'
  return '#E8E4DC'
}
