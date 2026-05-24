'use client'

import { useMemo, useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  VERIFICACION_LABEL,
  VERIFICACION_STYLE,
  type VerificacionOrg,
} from '@/data/organigramaDiagnostico'
import {
  RAMA_LABEL,
  RAMA_STYLE,
  buildOrganigramaTree,
  type OrganigramaTreeNode,
  type RamaOrganigrama,
} from '@/data/organigramaMunicipalCanon'

const VERIFICACION_OPTIONS: VerificacionOrg[] = ['confirmado', 'pendiente', 'desconocido', 'referencia']

function VerificacionChip({ v }: { v: VerificacionOrg }) {
  const s = VERIFICACION_STYLE[v]
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold shrink-0"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {VERIFICACION_LABEL[v]}
    </span>
  )
}

function NodeCard({
  node,
  verificacion,
  selected,
  onSelect,
  onVerificacionChange,
  compact,
}: {
  node: OrganigramaTreeNode
  verificacion: VerificacionOrg
  selected: boolean
  onSelect: () => void
  onVerificacionChange: (v: VerificacionOrg) => void
  compact?: boolean
}) {
  const style = RAMA_STYLE[node.rama]
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'text-left rounded-[10px] border-2 transition-all w-full max-w-[220px]',
        selected ? 'ring-2 ring-offset-1 ring-[#3B6D11] shadow-md' : 'hover:shadow-sm',
        compact ? 'p-2.5' : 'p-3.5',
      )}
      style={{
        borderColor: selected ? '#3B6D11' : style.border,
        background: style.bg,
      }}
      aria-pressed={selected}
      aria-label={`${node.titulo} — ${RAMA_LABEL[node.rama]}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-1 mb-1">
        <p className="text-[11px] font-bold leading-tight" style={{ color: style.text }}>
          {node.titulo}
        </p>
        {!node.esGrupo && <VerificacionChip v={verificacion} />}
      </div>
      {!compact && (
        <>
          <p className="text-[9px] text-[#6B6760] mb-1 leading-snug">{node.subtitulo}</p>
          <p className="text-[9px] font-medium text-[#4A4740]">{node.rolRsu}</p>
        </>
      )}
      {node.esGrupo && (
        <p className="text-[8px] uppercase tracking-[0.06em] text-[#A8A49C] mt-1">Rama · {node.children.length} niveles</p>
      )}
      {selected && !node.esGrupo && (
        <label
          className="mt-2 block text-left"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
        >
          <span className="text-[8px] uppercase tracking-[0.06em] font-semibold text-[#8A9286]">
            Estatus en campo
          </span>
          <select
            value={verificacion}
            onChange={e => onVerificacionChange(e.target.value as VerificacionOrg)}
            className="mt-1 h-8 w-full rounded-[6px] border border-[#E7E5DC] bg-white px-2 text-[10px] text-[#1F2933]"
            aria-label={`Verificación ${node.titulo}`}
          >
            {VERIFICACION_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{VERIFICACION_LABEL[opt]}</option>
            ))}
          </select>
        </label>
      )}
    </button>
  )
}

function TreeBranch({
  node,
  resolveVerificacion,
  selectedId,
  onSelect,
  onVerificacionChange,
  depth = 0,
}: {
  node: OrganigramaTreeNode
  resolveVerificacion: (id: string, fallback: VerificacionOrg) => VerificacionOrg
  selectedId: string | null
  onSelect: (id: string) => void
  onVerificacionChange: (id: string, v: VerificacionOrg) => void
  depth?: number
}) {
  const v = resolveVerificacion(node.id, node.verificacion)
  const hasChildren = node.children.length > 0

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={node}
        verificacion={v}
        selected={selectedId === node.id}
        onSelect={() => onSelect(node.id)}
        onVerificacionChange={nv => onVerificacionChange(node.id, nv)}
        compact={depth > 2 && hasChildren}
      />
      {hasChildren && (
        <>
          <div className="w-px h-4 bg-[#C9DDB1]" aria-hidden />
          {node.children.length === 1 ? (
            <TreeBranch
              node={node.children[0]!}
              resolveVerificacion={resolveVerificacion}
              selectedId={selectedId}
              onSelect={onSelect}
              onVerificacionChange={onVerificacionChange}
              depth={depth + 1}
            />
          ) : (
            <div className="relative flex flex-wrap justify-center gap-x-3 gap-y-4 pt-1">
              <div
                className="absolute top-0 left-[8%] right-[8%] h-px bg-[#C9DDB1]"
                aria-hidden
              />
              {node.children.map(child => (
                <div key={child.id} className="flex flex-col items-center pt-2">
                  <div className="w-px h-3 bg-[#C9DDB1] -mt-2 mb-1" aria-hidden />
                  <TreeBranch
                    node={child}
                    resolveVerificacion={resolveVerificacion}
                    selectedId={selectedId}
                    onSelect={onSelect}
                    onVerificacionChange={onVerificacionChange}
                    depth={depth + 1}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function RamaColumn({
  rama,
  nodes,
  resolveVerificacion,
  selectedId,
  onSelect,
  onVerificacionChange,
}: {
  rama: RamaOrganigrama
  nodes: OrganigramaTreeNode[]
  resolveVerificacion: (id: string, fallback: VerificacionOrg) => VerificacionOrg
  selectedId: string | null
  onSelect: (id: string) => void
  onVerificacionChange: (id: string, v: VerificacionOrg) => void
}) {
  const style = RAMA_STYLE[rama]
  return (
    <div className="flex-1 min-w-[240px] max-w-[360px]">
      <div
        className="rounded-t-[10px] px-3 py-2 text-center mb-3"
        style={{ background: style.header }}
      >
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white">
          {RAMA_LABEL[rama]}
        </p>
      </div>
      <div className="space-y-4">
        {nodes.map(node => (
          <TreeBranch
            key={node.id}
            node={node}
            resolveVerificacion={resolveVerificacion}
            selectedId={selectedId}
            onSelect={onSelect}
            onVerificacionChange={onVerificacionChange}
          />
        ))}
      </div>
    </div>
  )
}

export interface OrganigramaJerarquicoProps {
  resolveVerificacion: (id: string, fallback: VerificacionOrg) => VerificacionOrg
  onVerificacionChange: (id: string, v: VerificacionOrg) => void
}

export function OrganigramaJerarquico({
  resolveVerificacion,
  onVerificacionChange,
}: OrganigramaJerarquicoProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { root, ramas } = useMemo(() => {
    const tree = buildOrganigramaTree()
    const ayunt = tree[0] ?? null
    const children = ayunt?.children ?? []
    return {
      root: ayunt,
      ramas: {
        legislativo: children.filter(c => c.rama === 'legislativo'),
        ejecutivo: children.filter(c => c.rama === 'ejecutivo'),
        operador: children.filter(c => c.rama === 'operador'),
      },
    }
  }, [])

  const selectedNode = useMemo(() => {
    if (!selectedId) return null
    const walk = (n: OrganigramaTreeNode): OrganigramaTreeNode | null => {
      if (n.id === selectedId) return n
      for (const c of n.children) {
        const found = walk(c)
        if (found) return found
      }
      return null
    }
    if (!root) return null
    return walk(root)
  }, [selectedId, root])

  const interfazNodes = useMemo(() => {
    const flat: OrganigramaTreeNode[] = []
    const collect = (n: OrganigramaTreeNode) => {
      if (n.rama === 'interfaz') flat.push(n)
      n.children.forEach(collect)
    }
    if (root) collect(root)
    return flat
  }, [root])

  return (
    <div className="space-y-4">
      {/* Raíz — Ayuntamiento */}
      {root && (
        <div className="flex flex-col items-center">
          <div className="rounded-[12px] border-2 border-[#3B6D11] bg-[#1C2B15] px-6 py-3 text-center max-w-md">
            <p className="text-[10px] uppercase tracking-[0.1em] text-[#6EC247] mb-0.5">Art. 115 CPEUM</p>
            <p className="text-[14px] font-bold text-white">{root.titulo}</p>
            <p className="text-[10px] text-[#A8C898] mt-0.5">{root.subtitulo}</p>
          </div>
          <div className="w-px h-5 bg-[#3B6D11]" aria-hidden />
          <div className="w-[min(100%,720px)] h-px bg-[#C9DDB1]" aria-hidden />
        </div>
      )}

      {/* Tres ramas */}
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-wrap justify-center gap-6 min-w-[760px] px-2">
          <RamaColumn
            rama="legislativo"
            nodes={ramas.legislativo}
            resolveVerificacion={resolveVerificacion}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onVerificacionChange={onVerificacionChange}
          />
          <RamaColumn
            rama="ejecutivo"
            nodes={ramas.ejecutivo}
            resolveVerificacion={resolveVerificacion}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onVerificacionChange={onVerificacionChange}
          />
          <RamaColumn
            rama="operador"
            nodes={ramas.operador}
            resolveVerificacion={resolveVerificacion}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onVerificacionChange={onVerificacionChange}
          />
        </div>
      </div>

      {/* Interfaces contractuales */}
      {interfazNodes.length > 0 && (
        <div className="rounded-[12px] border border-[#F5DCA0] bg-[#FEF7E7]/40 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#D4881E] mb-3">
            Interfaces contractuales (ejecutivo ↔ operador)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {interfazNodes.map(node => (
              <NodeCard
                key={node.id}
                node={node}
                verificacion={resolveVerificacion(node.id, node.verificacion)}
                selected={selectedId === node.id}
                onSelect={() => setSelectedId(node.id)}
                onVerificacionChange={v => onVerificacionChange(node.id, v)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Panel detalle nodo seleccionado */}
      {selectedNode && !selectedNode.esGrupo && (
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
          <div className="flex flex-wrap items-start gap-2 mb-2">
            <p className="text-[13px] font-semibold text-[#1C1B18]">{selectedNode.titulo}</p>
            <VerificacionChip v={resolveVerificacion(selectedNode.id, selectedNode.verificacion)} />
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#F4F2ED] text-[#6B6760]">
              {RAMA_LABEL[selectedNode.rama]} · Nivel {selectedNode.nivel}
            </span>
          </div>
          <p className="text-[11px] text-[#6B6760] mb-2">{selectedNode.rolRsu}</p>
          {selectedNode.baseLegal && (
            <p className="text-[10px] text-[#1A5FA8] mb-2">Base legal: {selectedNode.baseLegal}</p>
          )}
          <p className="text-[10px] text-[#5A4A2A] flex items-start gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#D4881E]" />
            {selectedNode.preguntaCampo}
          </p>
        </div>
      )}

    </div>
  )
}
