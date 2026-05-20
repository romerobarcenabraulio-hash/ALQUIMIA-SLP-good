'use client'

import { useState, useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts'
import {
  AlertTriangle, CheckCircle, Clock, DollarSign,
  Shield, TrendingUp, MapPin, Lock, ChevronDown,
  ChevronRight, ArrowRight, Zap, Users, FileText, Target,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'
import { TRAJECTORY_UI } from '@/lib/constants'
import { ExpandableChart } from '@/components/ui/ExpandableChart'

// ── Legal summary per ZM ──────────────────────────────────────────────────────

const LEGAL_SUMMARY: Record<string, { vacios: number; adendas: number; fase: string }> = {
  SLP: { vacios: 18, adendas: 12, fase: 'Diagnóstico y reforma' },
  MTY: { vacios: 23, adendas: 18, fase: 'Diagnóstico y reforma' },
  QRO: { vacios: 16, adendas: 14, fase: 'Diagnóstico y reforma' },
  GDL: { vacios: 21, adendas: 16, fase: 'Diagnóstico y reforma' },
}
const legalFor = (zm: string) => LEGAL_SUMMARY[zm] ?? LEGAL_SUMMARY['SLP']!

// ── Phases ────────────────────────────────────────────────────────────────────

const M03_PHASES = [
  {
    n: 1, label: 'Preparación y diagnóstico', semanas: 4, color: '#1A5FA8',
    entregables: ['Línea base y metas', 'Análisis de brechas', 'Alcance y priorización'],
    gate: 'Diagnóstico aprobado',
    dep: 'Sin prerrequisito',
  },
  {
    n: 2, label: 'Alineación jurídica e institucional', semanas: 6, color: '#3B6D11',
    entregables: ['Reforma y vacíos legales', 'Marco institucional', 'Gobernanza y convenios'],
    gate: 'Marco validado',
    dep: 'Fase 1 completa · M2 validado',
  },
  {
    n: 3, label: 'Diseño técnico y presupuestal', semanas: 7, color: '#8B6B4A',
    entregables: ['Ingeniería conceptual', 'Modelo operativo', 'Presupuesto y viabilidad'],
    gate: 'Diseño aprobado',
    dep: 'Fase 2 completa',
  },
  {
    n: 4, label: 'Contratación, permisos y predios', semanas: 8, color: '#D4881E',
    entregables: ['Permisos y MIA', 'Predios y servidumbres', 'Contratación de operador'],
    gate: 'Listo para construir',
    dep: 'Fase 3 · Marco legal',
  },
  {
    n: 5, label: 'Piloto territorial', semanas: 6, color: '#C0392B',
    entregables: ['Implementación piloto', 'Puesta en marcha', 'Ajustes operativos'],
    gate: 'Piloto validado',
    dep: 'Fase 4 completa · Oleada 1',
  },
  {
    n: 6, label: 'Escalamiento y monitoreo', semanas: 0, color: '#2D5A0D',
    entregables: ['Expansión territorial', 'Monitoreo de KPIs', 'Mejora continua'],
    gate: 'Escalamiento autorizado',
    dep: 'Piloto validado · Gates 1–5',
  },
]

// ── PERT data ─────────────────────────────────────────────────────────────────

const NODE_W = 128
const NODE_H = 60
const COL_GAP = 56
const ROW_GAP = 20
const COL_W = NODE_W + COL_GAP
const ROW_H = NODE_H + ROW_GAP

type PertNode = {
  id: string; label: string; row: number; col: number
  critico: boolean; holgura: number; depende: string
  responsable: string; impacto: string
}

const PERT_NODES: PertNode[] = [
  { id: 'T01', label: 'Diagnóstico territorial', row: 0, col: 0, critico: true,  holgura: 0,  depende: '—',        responsable: 'Catastro Municipal',            impacto: '+14 días' },
  { id: 'T02', label: 'Diagnóstico legal',        row: 1, col: 0, critico: false, holgura: 4,  depende: '—',        responsable: 'Dirección Jurídica',            impacto: '+8 días' },
  { id: 'T03', label: 'Proceso licitatorio',      row: 0, col: 1, critico: true,  holgura: 0,  depende: 'T01',      responsable: 'Dirección Obras Públicas',      impacto: '+18 días' },
  { id: 'T04', label: 'Gestión de permisos amb.', row: 1, col: 1, critico: false, holgura: 6,  depende: 'T02',      responsable: 'Dirección Medio Ambiente',      impacto: '+20 días' },
  { id: 'T05', label: 'Liberación de predios',    row: 2, col: 1, critico: false, holgura: 3,  depende: 'T01',      responsable: 'Catastro Municipal',            impacto: '+12 días' },
  { id: 'T06', label: 'Adquisición de flota',     row: 0, col: 2, critico: true,  holgura: 0,  depende: 'T03',      responsable: 'Comité de Adquisiciones',       impacto: '+12 días' },
  { id: 'T07', label: 'Diseño técnico de CAs',    row: 1, col: 2, critico: false, holgura: 5,  depende: 'T04,T05',  responsable: 'Dirección Obras Públicas',      impacto: '+10 días' },
  { id: 'T08', label: 'Contratación de operador', row: 2, col: 2, critico: false, holgura: 2,  depende: 'T03',      responsable: 'Tesorería',                     impacto: '+16 días' },
  { id: 'T09', label: 'Operación de CAs',         row: 0, col: 3, critico: true,  holgura: 0,  depende: 'T06',      responsable: 'Operador de CA',                impacto: '+16 días' },
  { id: 'T10', label: 'Construcción de CAs',      row: 1, col: 3, critico: false, holgura: 4,  depende: 'T07',      responsable: 'Dirección Obras Públicas',      impacto: '+14 días' },
  { id: 'T11', label: 'Capacitación ciudadana',   row: 2, col: 3, critico: false, holgura: 8,  depende: 'T08',      responsable: 'Comunicación Social',           impacto: '+6 días' },
  { id: 'T12', label: 'Planta de pretratamiento', row: 0, col: 4, critico: true,  holgura: 0,  depende: 'T09',      responsable: 'Dirección Medio Ambiente',      impacto: '+20 días' },
  { id: 'T13', label: 'Integración recicladores', row: 1, col: 4, critico: false, holgura: 3,  depende: 'T10',      responsable: 'Dirección de Economía',         impacto: '+8 días' },
  { id: 'T14', label: 'Arranque oficial',          row: 0, col: 5, critico: true,  holgura: 0,  depende: 'T12',      responsable: 'Presidencia Municipal',         impacto: '+15 días' },
  { id: 'T15', label: 'Primeras ventas mat.',      row: 0, col: 6, critico: true,  holgura: 0,  depende: 'T14',      responsable: 'Dirección Servicios Públicos',  impacto: '+10 días' },
]

type PertEdge = { from: string; to: string; critico: boolean; tipo?: 'fuerte' | 'debil' | 'opcional' }

const PERT_EDGES: PertEdge[] = [
  { from: 'T01', to: 'T03', critico: true,  tipo: 'fuerte' },
  { from: 'T01', to: 'T05', critico: false, tipo: 'fuerte' },
  { from: 'T02', to: 'T04', critico: false, tipo: 'fuerte' },
  { from: 'T03', to: 'T06', critico: true,  tipo: 'fuerte' },
  { from: 'T03', to: 'T08', critico: false, tipo: 'fuerte' },
  { from: 'T04', to: 'T07', critico: false, tipo: 'fuerte' },
  { from: 'T05', to: 'T07', critico: false, tipo: 'fuerte' },
  { from: 'T06', to: 'T09', critico: true,  tipo: 'fuerte' },
  { from: 'T07', to: 'T10', critico: false, tipo: 'fuerte' },
  { from: 'T08', to: 'T11', critico: false, tipo: 'fuerte' },
  { from: 'T09', to: 'T12', critico: true,  tipo: 'fuerte' },
  { from: 'T10', to: 'T13', critico: false, tipo: 'fuerte' },
  { from: 'T11', to: 'T14', critico: false, tipo: 'debil' },
  { from: 'T12', to: 'T14', critico: true,  tipo: 'fuerte' },
  { from: 'T14', to: 'T15', critico: true,  tipo: 'fuerte' },
]

// Node center positions
function nodePos(n: PertNode) {
  return {
    x: n.col * COL_W,
    y: n.row * ROW_H,
    cx: n.col * COL_W + NODE_W / 2,
    cy: n.row * ROW_H + NODE_H / 2,
    ex: n.col * COL_W + NODE_W,  // exit right
    ey: n.row * ROW_H + NODE_H / 2,
    ix: n.col * COL_W,            // entry left
    iy: n.row * ROW_H + NODE_H / 2,
  }
}

const PERT_NODE_MAP = Object.fromEntries(PERT_NODES.map(n => [n.id, n]))
const SVG_PAD = 16
const SVG_W = Math.max(...PERT_NODES.map(n => n.col)) * COL_W + NODE_W + SVG_PAD * 2
const SVG_H = Math.max(...PERT_NODES.map(n => n.row)) * ROW_H + NODE_H + SVG_PAD * 2

// Build bezier path for edge
function edgePath(from: PertNode, to: PertNode): string {
  const s = nodePos(from)
  const t = nodePos(to)
  const sx = s.ex + SVG_PAD
  const sy = s.ey
  const tx = t.ix + SVG_PAD
  const ty = t.iy
  const dx = Math.abs(tx - sx) * 0.45
  return `M ${sx} ${sy} C ${sx + dx} ${sy} ${tx - dx} ${ty} ${tx} ${ty}`
}

// ── PERT Diagram component ────────────────────────────────────────────────────

function PertDiagram({ compact = false, selectedId, onSelect }:
  { compact?: boolean; selectedId?: string; onSelect?: (id: string) => void }) {
  const scale = compact ? 0.72 : 1
  const w = SVG_W * scale
  const h = SVG_H * scale

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <svg
        width={w} height={h}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{ minWidth: compact ? 500 : 700, display: 'block' }}
      >
        <defs>
          {/* arrowhead markers */}
          <marker id="arrow-critico" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#2D5A0D" />
          </marker>
          <marker id="arrow-normal" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#9CA3AF" />
          </marker>
          <marker id="arrow-debil" markerWidth="10" markerHeight="7"
            refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#D4881E" />
          </marker>
        </defs>

        {/* Edges */}
        {PERT_EDGES.map(e => {
          const fromNode = PERT_NODE_MAP[e.from]
          const toNode = PERT_NODE_MAP[e.to]
          if (!fromNode || !toNode) return null
          const d = edgePath(fromNode, toNode)
          const color = e.critico ? '#2D5A0D' : e.tipo === 'debil' ? '#D4881E' : '#9CA3AF'
          const marker = e.critico ? 'url(#arrow-critico)' : e.tipo === 'debil' ? 'url(#arrow-debil)' : 'url(#arrow-normal)'
          return (
            <path
              key={`${e.from}-${e.to}`}
              d={d}
              fill="none"
              stroke={color}
              strokeWidth={e.critico ? 2.5 : 1.5}
              strokeDasharray={e.tipo === 'opcional' ? '6,4' : undefined}
              markerEnd={marker}
              opacity={e.critico ? 1 : 0.7}
            />
          )
        })}

        {/* Nodes */}
        {PERT_NODES.map(n => {
          const { x, y } = nodePos(n)
          const nx = x + SVG_PAD
          const ny = y + SVG_PAD
          const isSel = selectedId === n.id
          const fill = n.critico ? '#EAF3DE' : '#F9FAFB'
          const stroke = n.critico ? '#2D5A0D' : isSel ? '#1A5FA8' : '#D1D5DB'
          const sw = isSel ? 2.5 : n.critico ? 2 : 1.5
          return (
            <g
              key={n.id}
              onClick={() => onSelect?.(n.id)}
              style={{ cursor: onSelect ? 'pointer' : 'default' }}
            >
              <rect x={nx} y={ny} width={NODE_W} height={NODE_H}
                rx={8} ry={8}
                fill={fill} stroke={stroke} strokeWidth={sw}
              />
              {/* ID badge */}
              <rect x={nx + 6} y={ny + 6} width={32} height={16}
                rx={4} ry={4}
                fill={n.critico ? '#2D5A0D' : '#E5E7EB'}
              />
              <text x={nx + 22} y={ny + 18}
                textAnchor="middle" fontSize={9} fontWeight="700" fontFamily="monospace"
                fill={n.critico ? '#fff' : '#6B7280'}
              >{n.id}</text>
              {/* holgura chip */}
              {n.holgura === 0 && (
                <>
                  <rect x={nx + NODE_W - 28} y={ny + 6} width={22} height={14}
                    rx={4} fill="#FDE8E8" />
                  <text x={nx + NODE_W - 17} y={ny + 17}
                    textAnchor="middle" fontSize={8} fontWeight="600" fill="#B91C1C">H=0</text>
                </>
              )}
              {/* Label */}
              {(() => {
                const words = n.label.split(' ')
                const mid = Math.ceil(words.length / 2)
                const l1 = words.slice(0, mid).join(' ')
                const l2 = words.slice(mid).join(' ')
                return (
                  <>
                    <text x={nx + NODE_W / 2} y={ny + 32}
                      textAnchor="middle" fontSize={10} fontWeight="600"
                      fill={n.critico ? '#1A3B07' : '#374151'}
                    >{l1}</text>
                    <text x={nx + NODE_W / 2} y={ny + 46}
                      textAnchor="middle" fontSize={10} fontWeight="600"
                      fill={n.critico ? '#1A3B07' : '#374151'}
                    >{l2}</text>
                  </>
                )
              })()}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── PERT summary (9 nodes linear, Page 1) ────────────────────────────────────

const PERT_SUMMARY = [
  { id: 'P1', label: 'Diagnóstico',            m2: false, critico: true },
  { id: 'P2', label: 'Marco jurídico\nvalidado', m2: true, critico: true },
  { id: 'P3', label: 'Presupuesto\naprobado',   m2: false, critico: true },
  { id: 'P4', label: 'Predios y\npermisos',     m2: false, critico: false },
  { id: 'P5', label: 'Contratación',            m2: false, critico: true },
  { id: 'P6', label: 'Infraestructura',          m2: false, critico: true },
  { id: 'P7', label: 'Piloto\noperativo',        m2: false, critico: true },
  { id: 'P8', label: 'Evaluación',              m2: false, critico: false },
  { id: 'P9', label: 'Escalamiento',            m2: false, critico: true },
]

function PertSummaryDiagram() {
  const NW = 100
  const NH = 56
  const GAP = 48
  const STEP = NW + GAP
  const SVG_SW = PERT_SUMMARY.length * STEP - GAP + 32
  const SVG_SH = NH + 32

  return (
    <div className="overflow-x-auto">
      <svg width={SVG_SW} height={SVG_SH} viewBox={`0 0 ${SVG_SW} ${SVG_SH}`}
        style={{ minWidth: 700, display: 'block' }}>
        <defs>
          <marker id="sarrow-c" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 9 3, 0 6" fill="#2D5A0D" />
          </marker>
          <marker id="sarrow-n" markerWidth="9" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 9 3, 0 6" fill="#9CA3AF" />
          </marker>
        </defs>
        {/* Arrows */}
        {PERT_SUMMARY.map((n, i) => {
          if (i === PERT_SUMMARY.length - 1) return null
          const sx = 16 + i * STEP + NW
          const tx = 16 + (i + 1) * STEP
          const cy = 16 + NH / 2
          const critico = n.critico && PERT_SUMMARY[i + 1]!.critico
          return (
            <line key={n.id} x1={sx} y1={cy} x2={tx} y2={cy}
              stroke={critico ? '#2D5A0D' : '#9CA3AF'}
              strokeWidth={critico ? 2.5 : 1.5}
              markerEnd={critico ? 'url(#sarrow-c)' : 'url(#sarrow-n)'}
            />
          )
        })}
        {/* Nodes */}
        {PERT_SUMMARY.map((n, i) => {
          const x = 16 + i * STEP
          const y = 16
          const lines = n.label.split('\n')
          return (
            <g key={n.id}>
              <rect x={x} y={y} width={NW} height={NH} rx={8}
                fill={n.m2 ? '#EBF3FB' : n.critico ? '#EAF3DE' : '#F9FAFB'}
                stroke={n.m2 ? '#1A5FA8' : n.critico ? '#2D5A0D' : '#D1D5DB'}
                strokeWidth={n.critico || n.m2 ? 2 : 1.5}
              />
              <text x={x + NW / 2} y={y + 14}
                textAnchor="middle" fontSize={8} fontWeight="700" fontFamily="monospace"
                fill={n.m2 ? '#1A5FA8' : n.critico ? '#1A3B07' : '#6B7280'}
              >{n.id}</text>
              {lines.map((l, li) => (
                <text key={li} x={x + NW / 2}
                  y={lines.length === 1 ? y + 36 : y + 28 + li * 14}
                  textAnchor="middle" fontSize={9.5} fontWeight="600"
                  fill={n.m2 ? '#1A4A8A' : n.critico ? '#1A3B07' : '#374151'}
                >{l}</text>
              ))}
              {n.m2 && (
                <text x={x + NW / 2} y={y + NH - 6}
                  textAnchor="middle" fontSize={7.5} fill="#1A5FA8" fontWeight="600">← M2</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ── Gantt data ────────────────────────────────────────────────────────────────

const GANTT_MASTER = [
  { linea: 'Jurídico / institucional', inicio: 0,  fin: 10, color: '#1A5FA8' },
  { linea: 'Infraestructura',           inicio: 8,  fin: 31, color: '#3B6D11' },
  { linea: 'Operación y logística',     inicio: 20, fin: 37, color: '#5A9438' },
  { linea: 'Comunicación ciudadana',    inicio: 4,  fin: 37, color: '#D4881E' },
  { linea: 'Datos y monitoreo',         inicio: 6,  fin: 37, color: '#8B6B4A' },
  { linea: 'Finanzas y presupuesto',    inicio: 2,  fin: 16, color: '#C0392B' },
  { linea: 'Gobernanza y coordinación', inicio: 0,  fin: 37, color: '#6B6760' },
]

type GanttFilter = 'todo' | 'critico' | 'juridico' | 'infraestructura' | 'operacion' | 'comunicacion' | 'presupuesto' | 'gobernanza'

const GANTT_DETAIL = [
  { id: 'G01', linea: 'juridico',        actividad: 'Diagnóstico legal municipal',           inicio: 1,  fin: 4,  critico: false, estado: 'completado'   as const },
  { id: 'G02', linea: 'juridico',        actividad: 'Reforma reglamentaria',                 inicio: 3,  fin: 10, critico: true,  estado: 'en_ejecucion' as const },
  { id: 'G03', linea: 'juridico',        actividad: 'Convenios institucionales',              inicio: 8,  fin: 12, critico: false, estado: 'programado'   as const },
  { id: 'G04', linea: 'infraestructura', actividad: 'Diseño técnico CAs',                    inicio: 8,  fin: 14, critico: false, estado: 'programado'   as const },
  { id: 'G05', linea: 'infraestructura', actividad: 'Licitación y contratación de obra',     inicio: 12, fin: 20, critico: true,  estado: 'pendiente'    as const },
  { id: 'G06', linea: 'infraestructura', actividad: 'Construcción centros de acopio',        inicio: 20, fin: 30, critico: true,  estado: 'pendiente'    as const },
  { id: 'G07', linea: 'infraestructura', actividad: 'Adquisición de flota',                  inicio: 14, fin: 22, critico: true,  estado: 'pendiente'    as const },
  { id: 'G08', linea: 'operacion',       actividad: 'Diseño de rutas de recolección',        inicio: 16, fin: 22, critico: false, estado: 'pendiente'    as const },
  { id: 'G09', linea: 'operacion',       actividad: 'Piloto de separación en origen',        inicio: 24, fin: 30, critico: true,  estado: 'pendiente'    as const },
  { id: 'G10', linea: 'operacion',       actividad: 'Arranque oficial del programa',         inicio: 30, fin: 37, critico: true,  estado: 'pendiente'    as const },
  { id: 'G11', linea: 'comunicacion',    actividad: 'Estrategia de comunicación',            inicio: 4,  fin: 10, critico: false, estado: 'completado'   as const },
  { id: 'G12', linea: 'comunicacion',    actividad: 'Campaña ciudadana de separación',       inicio: 18, fin: 37, critico: false, estado: 'pendiente'    as const },
  { id: 'G13', linea: 'presupuesto',     actividad: 'Gestión de recursos y ministraciones',  inicio: 2,  fin: 8,  critico: true,  estado: 'en_ejecucion' as const },
  { id: 'G14', linea: 'presupuesto',     actividad: 'Contratación operador ancla',           inicio: 10, fin: 16, critico: true,  estado: 'pendiente'    as const },
]

// ── RACI ──────────────────────────────────────────────────────────────────────

const RACI_ACTORS = [
  'Presidencia', 'Obras Públicas', 'Servicios Públicos',
  'Medio Ambiente', 'Contraloría', 'Tesorería', 'Concesionario', 'Recicladoras',
]
const RACI_ACTIVITIES = [
  { actividad: 'Diagnóstico territorial',     vals: ['A','C','R','C','I','I','I','C'] },
  { actividad: 'Reforma reglamentaria',       vals: ['A','C','C','R','C','I','C','I'] },
  { actividad: 'Proceso licitatorio',         vals: ['A','R','C','C','A','C','I','I'] },
  { actividad: 'Operación de CAs',            vals: ['I','C','A','R','I','I','R','C'] },
  { actividad: 'Planta de pretratamiento',    vals: ['A','R','C','R','C','I','C','I'] },
  { actividad: 'Primeras ventas reciclables', vals: ['I','I','A','C','I','I','R','R'] },
]

// ── Bottlenecks ───────────────────────────────────────────────────────────────

const BOTTLENECKS = [
  { riesgo: 'Retraso en proceso licitatorio',         prob: 0.55, impacto: 4, efecto: '+16 días', mitigacion: 'Bases tipo preaprobadas y validación anticipada con contraloría' },
  { riesgo: 'Demora en liberación presupuestal',      prob: 0.40, impacto: 3, efecto: '+12 días', mitigacion: 'Calendario de ministraciones y alertas automáticas' },
  { riesgo: 'Disponibilidad de proveedores de flota', prob: 0.35, impacto: 3, efecto: '+10 días', mitigacion: 'Precalificación y contratos marco con flota alternativa' },
  { riesgo: 'Trámites ambientales (permisos/MIA)',    prob: 0.45, impacto: 4, efecto: '+20 días', mitigacion: 'Gestión temprana con SEMARNAT/SEDARH antes de licitación' },
  { riesgo: 'Aceptación social en operación de CA',  prob: 0.30, impacto: 2, efecto: '+6 días',  mitigacion: 'Comunicación previa y comités comunitarios por zona' },
]

// ── Waves ─────────────────────────────────────────────────────────────────────

const WAVES = [
  {
    nombre: 'Oleada 1 · Poniente', estado: 'En curso', color: '#3B6D11', bg: '#EAF3DE', border: '#D7E8C0',
    zonas: 4, mesInicio: 1, mesFin: 12,
    capturaObj: '12,800 t', gate: 'Predios validados', riesgo: 'Disponibilidad de predios y permisos',
    responsable: 'Dir. Servicios Públicos', accion: 'Confirmar liberación de predios Zona Poniente',
  },
  {
    nombre: 'Oleada 2 · Centro', estado: 'Siguiente', color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5',
    zonas: 3, mesInicio: 10, mesFin: 22,
    capturaObj: '9,600 t', gate: 'Operador contratado', riesgo: 'Gestión de rutas y operador ancla',
    responsable: 'Dir. Economía Circular', accion: 'Iniciar proceso de contratación de operador',
  },
  {
    nombre: 'Oleada 3 · Norte', estado: 'Planeada', color: '#8B6B4A', bg: '#F5EDE3', border: '#E5D5C5',
    zonas: 3, mesInicio: 18, mesFin: 34,
    capturaObj: '8,200 t', gate: 'Infraestructura Poniente completa', riesgo: 'Infraestructura complementaria',
    responsable: 'Dir. Obras Públicas', accion: 'Diseño técnico y presupuesto Zona Norte',
  },
  {
    nombre: 'Oleada 4 · Sur', estado: 'Planeada', color: '#6B6760', bg: '#F4F2ED', border: '#E8E4DC',
    zonas: 2, mesInicio: 28, mesFin: 44,
    capturaObj: '5,400 t', gate: 'Evaluación de piloto Oleadas 1–3', riesgo: 'Coordinación intermunicipal ZM',
    responsable: 'Coordinación ZM', accion: 'Convenio de colaboración intermunicipal',
  },
]

// ── Gates ─────────────────────────────────────────────────────────────────────

const GATES_DATA: Array<{ label: string; estado: 'cumplido' | 'en_curso' | 'pendiente' | 'bloqueado'; critico: boolean; alerta?: string }> = [
  { label: 'Validación jurídica del reglamento',  estado: 'cumplido',  critico: true },
  { label: 'Presupuesto aprobado y ministrado',   estado: 'cumplido',  critico: true },
  { label: 'Predios liberados sin litigio',        estado: 'en_curso',  critico: true, alerta: 'Predios Zona Norte con proceso legal pendiente.' },
  { label: 'Operador contratado y con fianza',    estado: 'en_curso',  critico: true, alerta: 'Licitación en proceso — resolución esperada en 30 días.' },
  { label: 'Rutas logísticas definidas y piloto', estado: 'cumplido',  critico: false },
  { label: 'Comunicación ciudadana activa',        estado: 'en_curso',  critico: false },
  { label: 'Plataforma de monitoreo y datos',      estado: 'pendiente', critico: false },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function mean(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0 }

// ── DecisionCommitBar ─────────────────────────────────────────────────────────

function DecisionCommitBar({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  vacios, adendas, faseLegal, compact = false,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number
  vacios: number; adendas: number; faseLegal: string
  compact?: boolean
}) {
  if (compact) {
    return (
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3 mb-4">
        <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-2 font-semibold">
          Decisiones comprometidas heredadas — solo lectura
        </p>
        <div className="flex flex-wrap gap-2 text-[10px]">
          <span className="rounded-[6px] border border-[#D7E8C0] bg-[#F4FAEC] px-2.5 py-1">
            <span className="text-[#3B6D11] font-semibold">M1:</span>{' '}
            <span className="text-[#4A4740]">{municipio} · {horizonte}a · {trayectoria} · RSU {fmt.kgd(rsuDia)}</span>
          </span>
          <ChevronRight className="w-3 h-3 text-[#A8A49C] self-center shrink-0" />
          <span className="rounded-[6px] border border-[#BDD7F5] bg-[#EBF3FB] px-2.5 py-1">
            <span className="text-[#1A5FA8] font-semibold">M2:</span>{' '}
            <span className="text-[#4A4740]">{faseLegal} · {vacios} vacíos · {adendas} adendos</span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] p-4 mb-5">
      <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-3 font-semibold">
        Decisiones comprometidas — no editables en este módulo
      </p>
      <div className="flex flex-wrap lg:flex-nowrap items-stretch gap-2">
        {/* M1 */}
        <div className="flex-1 min-w-[180px] rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#3B6D11] font-bold mb-1.5">Módulo 1 · Escenario y trayectoria</p>
          <p className="text-[13px] font-semibold text-[#1C1B18] leading-snug">{municipio}</p>
          <p className="text-[11px] text-[#5A5750] mt-0.5">{horizonte} años · {trayectoria}</p>
          <div className="flex gap-3 mt-1.5">
            <div>
              <p className="text-[8px] uppercase text-[#A8A49C]">Captura final</p>
              <p className="text-[11px] font-semibold text-[#3B6D11]">{capturaFinal}%</p>
            </div>
            <div>
              <p className="text-[8px] uppercase text-[#A8A49C]">RSU objetivo</p>
              <p className="text-[11px] font-semibold text-[#3B6D11]">{fmt.kgd(rsuDia)}</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center">
          <ArrowRight className="w-5 h-5 text-[#A8A49C] shrink-0" />
        </div>

        {/* M2 */}
        <div className="flex-1 min-w-[180px] rounded-[10px] border border-[#BDD7F5] bg-[#EBF3FB] px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#1A5FA8] font-bold mb-1.5">Módulo 2 · Condición jurídica</p>
          <p className="text-[13px] font-semibold text-[#1C1B18] leading-snug">{faseLegal}</p>
          <p className="text-[11px] text-[#5A5750] mt-0.5">Reforma requerida antes de contratación</p>
          <div className="flex gap-3 mt-1.5">
            <div>
              <p className="text-[8px] uppercase text-[#A8A49C]">Vacíos jurídicos</p>
              <p className="text-[11px] font-semibold text-[#1A5FA8]">{vacios}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase text-[#A8A49C]">Adendos propuestos</p>
              <p className="text-[11px] font-semibold text-[#1A5FA8]">{adendas}</p>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center">
          <ArrowRight className="w-5 h-5 text-[#A8A49C] shrink-0" />
        </div>

        {/* M3 */}
        <div className="flex-1 min-w-[180px] rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-3">
          <p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C] font-bold mb-1.5">Módulo 3 · Decisión logística actual</p>
          <p className="text-[13px] font-semibold text-[#1C1B18] leading-snug">Definir ruta crítica y calendario</p>
          <p className="text-[11px] text-[#5A5750] mt-0.5">Fases · actividades · responsables · gates</p>
        </div>
      </div>
    </div>
  )
}

// ── PlanningKpi ───────────────────────────────────────────────────────────────

function PlanningKpi({
  icon: Icon, label, value, sub, color = '#1C1B18', alert = false,
}: {
  icon: React.ElementType; label: string; value: string
  sub?: string; color?: string; alert?: boolean
}) {
  return (
    <div className={cn(
      'rounded-[10px] border bg-white p-3.5',
      alert ? 'border-[#F5C4C4]' : 'border-[#E8E4DC]',
    )}>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: alert ? '#C0392B' : color }} strokeWidth={2} />
        <p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">{label}</p>
      </div>
      <p className="font-bold text-[16px] leading-none mb-0.5" style={{ color: alert ? '#C0392B' : color }}>{value}</p>
      {sub && <p className="text-[9px] text-[#A8A49C]">{sub}</p>}
    </div>
  )
}

// ── RailSection ───────────────────────────────────────────────────────────────

function RailSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 text-left">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760] font-bold">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760] space-y-1">{children}</div>}
    </div>
  )
}

// ── RaciChip ──────────────────────────────────────────────────────────────────

function RaciChip({ val }: { val: string }) {
  const styles: Record<string, string> = {
    R: 'bg-[#D1FAE5] text-[#065F46] border border-[#6EE7B7]',
    A: 'bg-[#DBEAFE] text-[#1E40AF] border border-[#93C5FD]',
    C: 'bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]',
    I: 'bg-[#F3F4F6] text-[#6B7280] border border-[#E5E7EB]',
  }
  return (
    <span className={cn('inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold', styles[val] ?? styles['I'])}>
      {val}
    </span>
  )
}

// ── Page 1 ────────────────────────────────────────────────────────────────────

function Page1({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  vacios, adendas, faseLegal, capexTotal, totalSemanas,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number
  vacios: number; adendas: number; faseLegal: string
  capexTotal: number; totalSemanas: number
}) {
  return (
    <div className="space-y-6">
      <DecisionCommitBar
        municipio={municipio} horizonte={horizonte} trayectoria={trayectoria}
        capturaFinal={capturaFinal} rsuDia={rsuDia}
        vacios={vacios} adendas={adendas} faseLegal={faseLegal}
      />

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <PlanningKpi icon={Clock}          label="Duración total"        value={`${totalSemanas} sem`}    sub="del plan operativo"      color="#1A5FA8" />
        <PlanningKpi icon={TrendingUp}     label="Fases principales"     value="6"                         sub="fases de implementación" />
        <PlanningKpi icon={AlertTriangle}  label="Actividades críticas"  value="7 / 15"                    sub="sin holgura"              alert />
        <PlanningKpi icon={DollarSign}     label="Costo planificado"     value={fmt.mxnM(capexTotal)}       sub="CAPEX total estimado"    color="#3B6D11" />
        <PlanningKpi icon={Shield}         label="Dependencias críticas" value="12"                         sub="nodos PERT ruta crítica" />
        <PlanningKpi icon={Target}         label="Confianza cronograma"  value="72%"                        sub="supuestos validados"     color="#D4881E" />
      </div>

      {/* Executive reading */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-[#3B6D11] shrink-0" />
          <p className="text-[10px] uppercase tracking-[0.09em] text-[#6B6760] font-bold">Lectura ejecutiva del plan</p>
        </div>
        <p className="text-[14px] leading-relaxed text-[#3D3B36] mb-3 font-medium">
          Este módulo convierte el escenario comprometido en una ruta operativa integral. Integra actividades
          jurídicas, técnicas, financieras, operativas y sociales para identificar qué debe ocurrir primero,
          qué depende de qué, quién decide y qué riesgos pueden retrasar la implementación.
        </p>
        <p className="text-[13px] leading-relaxed text-[#6B6760]">
          La planeación aquí es una traducción ejecutiva del escenario: convierte toneladas, capturas, costos
          y condiciones jurídicas en fases, actividades, responsables y gates de decisión. No se trata de
          calendarizar tareas — se trata de asegurar que el programa no llegue a infraestructura sin permisos,
          a operación sin responsables, ni a metas sin capacidad instalada.
        </p>
      </div>

      {/* Phase timeline */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
        <p className="text-[13px] font-semibold text-[#1C1B18] mb-1">Fases maestras del plan de implementación</p>
        <p className="text-[11px] text-[#A8A49C] mb-5">
          Secuencia operativa obligatoria — {M03_PHASES.filter(f => f.semanas > 0).reduce((s, f) => s + f.semanas, 0)} semanas de preparación + escalamiento continuo
        </p>
        <div className="space-y-0">
          {M03_PHASES.map((f, i) => (
            <div key={f.n} className="flex items-stretch gap-0">
              {/* connector line */}
              <div className="flex flex-col items-center mr-4 shrink-0">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ background: f.color }}>
                  {f.n}
                </div>
                {i < M03_PHASES.length - 1 && (
                  <div className="w-0.5 flex-1 mt-1 mb-1" style={{ background: f.color, opacity: 0.35 }} />
                )}
              </div>
              {/* content */}
              <div className={cn('flex-1 pb-5', i === M03_PHASES.length - 1 && 'pb-0')}>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-[13px] font-semibold text-[#1C1B18]">{f.label}</p>
                  {f.semanas > 0
                    ? <span className="text-[10px] text-[#A8A49C] bg-[#F4F2ED] px-2 py-0.5 rounded-full">{f.semanas} sem</span>
                    : <span className="text-[10px] text-[#A8A49C] bg-[#F4F2ED] px-2 py-0.5 rounded-full">continuo</span>
                  }
                </div>
                <p className="text-[10px] text-[#A8A49C] mb-2">Dep: {f.dep}</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {f.entregables.map(e => (
                    <span key={e} className="text-[10px] text-[#4A4740] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-0.5 rounded-full">{e}</span>
                  ))}
                </div>
                <p className="text-[10px] font-semibold text-[#3B6D11]">
                  ✓ Gate {f.n}: {f.gate}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PERT summary */}
      <ExpandableChart chartId="m03-pert-summary" title="PERT resumido — secuencia lógica del plan" subtitle="Flujo principal · flechas = dependencia obligatoria">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[13px] font-semibold text-[#1C1B18] mb-1">PERT resumido — secuencia lógica</p>
          <p className="text-[11px] text-[#A8A49C] mb-4">
            Flujo principal de dependencias · nodo en azul requiere validación jurídica del Módulo 2
          </p>
          <PertSummaryDiagram />
          <div className="flex gap-4 mt-3 flex-wrap text-[10px]">
            {[['#2D5A0D','Ruta crítica'],['#1A5FA8','Depende de M2'],['#9CA3AF','Dependencia fuerte']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5">
                <div className="w-3.5 h-3.5 rounded-sm border-2" style={{ borderColor: c, background: `${c}22` }} />
                <span className="text-[#6B6760]">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* Gantt master */}
      <ExpandableChart chartId="m03-gantt-master" title="Gantt maestro — líneas de trabajo" subtitle="7 líneas de trabajo · escala en semanas">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[13px] font-semibold text-[#1C1B18] mb-1">Gantt maestro — 7 líneas de trabajo</p>
          <p className="text-[11px] text-[#A8A49C] mb-5">Escala temporal en semanas · horizonte {totalSemanas} sem</p>
          {/* week ticks header */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-44 shrink-0" />
            <div className="flex-1 flex justify-between">
              {[0, Math.round(totalSemanas * 0.25), Math.round(totalSemanas * 0.5), Math.round(totalSemanas * 0.75), totalSemanas].map(w => (
                <span key={w} className="text-[9px] text-[#A8A49C] font-mono">S{w}</span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {GANTT_MASTER.map(g => {
              const left = (g.inicio / totalSemanas) * 100
              const width = ((g.fin - g.inicio) / totalSemanas) * 100
              return (
                <div key={g.linea} className="flex items-center gap-3">
                  <p className="w-44 shrink-0 text-[11px] text-[#4A4740] text-right leading-tight">{g.linea}</p>
                  <div className="flex-1 h-6 bg-[#F4F2ED] rounded-md relative overflow-hidden">
                    {/* grid lines */}
                    {[0.25, 0.5, 0.75].map(p => (
                      <div key={p} className="absolute top-0 bottom-0 w-px bg-[#E8E4DC]" style={{ left: `${p * 100}%` }} />
                    ))}
                    <div
                      className="absolute top-0.5 bottom-0.5 rounded-sm flex items-center justify-end pr-1.5 transition-all"
                      style={{ left: `${left}%`, width: `${width}%`, background: g.color }}
                    >
                      <span className="text-[9px] text-white font-mono font-semibold">{g.fin - g.inicio}s</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {GANTT_MASTER.map(g => (
              <div key={g.linea} className="flex items-center gap-1.5 text-[9px]">
                <div className="w-3 h-3 rounded-sm" style={{ background: g.color }} />
                <span className="text-[#6B6760]">{g.linea}</span>
              </div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* Recommendation card */}
      <div className="rounded-[12px] border-2 border-[#3B6D11] bg-[#F4FAEC] px-6 py-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#3B6D11] flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-[#3B6D11] mb-1">Recomendación del motor de planeación</p>
            <p className="text-[13px] text-[#3B5F23] leading-relaxed mb-4">
              El motor recomienda mantener un <strong>plan moderado de implementación</strong>. La ruta es viable
              si permisos, predios y contratación se cierran antes de iniciar infraestructura. El riesgo principal
              es el retraso en el proceso licitatorio, que puede comprometer la fecha del piloto.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
              {[
                { label: 'Tiempo total',       value: `${totalSemanas} sem`,     color: '#1A5FA8' },
                { label: 'Costo total',         value: fmt.mxnM(capexTotal),       color: '#3B6D11' },
                { label: 'Riesgo principal',   value: 'Licitatorio',              color: '#C0392B' },
                { label: 'Cap. institucional', value: 'Adecuada',                 color: '#D4881E' },
                { label: 'Confianza',          value: '72%',                      color: '#A8A49C' },
              ].map(c => (
                <div key={c.label} className="rounded-[8px] border border-[#C4DFA0] bg-white px-2.5 py-2">
                  <p className="text-[8px] uppercase tracking-[0.05em] text-[#A8A49C] mb-0.5">{c.label}</p>
                  <p className="text-[12px] font-semibold" style={{ color: c.color }}>{c.value}</p>
                </div>
              ))}
            </div>
            <div className="rounded-[8px] border border-[#B8D99A] bg-[#EAF3DE] px-3 py-2">
              <p className="text-[11px] text-[#3B5F23] font-semibold mb-1">Condición crítica · siguiente acción</p>
              <p className="text-[11px] text-[#3B5F23]">
                Iniciar gestión de permisos ambientales en paralelo con el proceso licitatorio.
                No esperar a que la licitación cierre para tramitar MIA — un retraso de 2 semanas puede costar +20 días en la ruta crítica.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page 2 ────────────────────────────────────────────────────────────────────

function Page2({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  vacios, adendas, faseLegal, totalSemanas,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number
  vacios: number; adendas: number; faseLegal: string
  totalSemanas: number
}) {
  const [ganttFilter, setGanttFilter] = useState<GanttFilter>('todo')
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  const criticalNodes = PERT_NODES.filter(n => n.critico)
  const avgHolgura = Math.round(mean(PERT_NODES.map(n => n.holgura)))
  const noHolgura = PERT_NODES.filter(n => n.holgura === 0).length

  const selectedNodeData = selectedNode ? PERT_NODE_MAP[selectedNode] : null

  const GANTT_FILTERS: Array<{ id: GanttFilter; label: string }> = [
    { id: 'todo', label: 'Todo' },
    { id: 'critico', label: 'Ruta crítica' },
    { id: 'juridico', label: 'Jurídico' },
    { id: 'infraestructura', label: 'Infraestructura' },
    { id: 'operacion', label: 'Operación' },
    { id: 'comunicacion', label: 'Comunicación' },
    { id: 'presupuesto', label: 'Presupuesto' },
  ]

  const filteredGantt = ganttFilter === 'todo' ? GANTT_DETAIL
    : ganttFilter === 'critico' ? GANTT_DETAIL.filter(g => g.critico)
    : GANTT_DETAIL.filter(g => g.linea === ganttFilter)

  return (
    <div className="space-y-6">
      <DecisionCommitBar
        municipio={municipio} horizonte={horizonte} trayectoria={trayectoria}
        capturaFinal={capturaFinal} rsuDia={rsuDia}
        vacios={vacios} adendas={adendas} faseLegal={faseLegal}
        compact
      />

      {/* KPI control */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <PlanningKpi icon={AlertTriangle}  label="Nodos críticos"      value={`${criticalNodes.length} / ${PERT_NODES.length}`} alert />
        <PlanningKpi icon={Clock}          label="Holgura promedio"    value={`${avgHolgura}d`}   sub="media de la red PERT" />
        <PlanningKpi icon={Zap}            label="Sin holgura"         value={String(noHolgura)}   sub="actividades críticas"  color="#D4881E" />
        <PlanningKpi icon={Lock}           label="Bloqueos jurídicos"  value={String(vacios)}      sub="vacíos sin resolver"   color="#1A5FA8" />
        <PlanningKpi icon={DollarSign}     label="Bloqueos pres."      value="2"                   sub="sin ministración" />
        <PlanningKpi icon={Shield}         label="Riesgo de retraso"   value="Medio"               sub="+23 días estimados"    color="#D4881E" />
      </div>

      {/* PERT full network */}
      <ExpandableChart chartId="m03-pert-full" title="A) Red PERT — dependencias y ruta crítica" subtitle="T01–T15 · flechas = dependencia obligatoria · verde = ruta crítica">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <p className="text-[13px] font-semibold text-[#1C1B18] mb-1">A) Red PERT — dependencias y ruta crítica</p>
          <p className="text-[11px] text-[#A8A49C] mb-2">
            Verde = ruta crítica · gris = dependencia fuerte · naranja = dependencia débil · hacer clic en nodo para ver detalle
          </p>
          <div className="flex gap-4 mb-4">
            <PertDiagram compact selectedId={selectedNode ?? undefined} onSelect={id => setSelectedNode(id === selectedNode ? null : id)} />
            {selectedNodeData && (
              <div className="w-56 shrink-0 rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-3 self-start">
                <p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C] font-bold mb-2">Detalle del nodo</p>
                <span className={cn('text-[10px] font-mono font-bold px-1.5 py-0.5 rounded mb-1 inline-block',
                  selectedNodeData.critico ? 'bg-[#2D5A0D] text-white' : 'bg-[#F4F2ED] text-[#6B6760]'
                )}>{selectedNodeData.id}</span>
                <p className="text-[11px] font-semibold text-[#1C1B18] mt-1 mb-2">{selectedNodeData.label}</p>
                {[
                  ['Depende de', selectedNodeData.depende],
                  ['Responsable', selectedNodeData.responsable],
                  ['Holgura', `${selectedNodeData.holgura} días`],
                  ['Impacto si retrasa', selectedNodeData.impacto],
                ].map(([k, v]) => (
                  <div key={k} className="mb-1.5">
                    <p className="text-[8px] uppercase text-[#A8A49C]">{k}</p>
                    <p className={cn('text-[10px] text-[#4A4740]',
                      k === 'Holgura' && selectedNodeData.holgura === 0 && 'text-[#C0392B] font-semibold'
                    )}>{v as string}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-[10px]">
            {[
              { c: '#2D5A0D', stroke: 2.5, label: 'Ruta crítica', dash: false },
              { c: '#9CA3AF', stroke: 1.5, label: 'Dependencia fuerte', dash: false },
              { c: '#D4881E', stroke: 1.5, label: 'Dependencia débil', dash: false },
            ].map(({ c, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-sm border-2" style={{ borderColor: c, background: `${c}22` }} />
                <span className="text-[#6B6760]">{label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm bg-[#FDE8E8] border border-[#FCA5A5] flex items-center justify-center">
                <span className="text-[7px] font-bold text-[#B91C1C]">H=0</span>
              </div>
              <span className="text-[#6B6760]">Sin holgura (crítico)</span>
            </div>
          </div>
        </div>
      </ExpandableChart>

      {/* Critical path table */}
      <ExpandableChart chartId="m03-critical-table" title="B) Tabla de ruta crítica" subtitle="Actividades con holgura 0 · responsable · impacto si se retrasa">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EDE5]">
            <p className="text-[13px] font-semibold text-[#1C1B18]">B) Tabla de ruta crítica</p>
            <p className="text-[11px] text-[#A8A49C]">Actividades sin holgura · IDs coinciden con los nodos del PERT</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['ID','Actividad','Depende de','Responsable','Holgura','Impacto si retrasa','Estado'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#1C1B18] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERT_NODES.filter(n => n.critico).map((n, i) => (
                  <tr key={n.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]', 'hover:bg-[#EAF3DE] transition-colors')}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-[10px] font-bold bg-[#2D5A0D] text-white px-1.5 py-0.5 rounded">{n.id}</span>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-[#4A4740] max-w-[180px]">{n.label}</td>
                    <td className="px-4 py-3 font-mono text-[10px] text-[#A8A49C]">{n.depende}</td>
                    <td className="px-4 py-3 text-[11px] text-[#6B6760]">{n.responsable}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="bg-[#FDE8E8] text-[#B91C1C] text-[9px] font-bold font-mono px-1.5 py-0.5 rounded">{n.holgura}d</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] font-semibold text-[#C0392B]">Alto {n.impacto}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#EAF3DE] text-[#2D5A0D]">Crítica</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ExpandableChart>

      {/* Gantt detailed */}
      <ExpandableChart chartId="m03-gantt-detail" title="C) Gantt detallado por líneas de trabajo" subtitle="Filtrar por tipo · barras alineadas a escala temporal">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EDE5]">
            <p className="text-[13px] font-semibold text-[#1C1B18]">C) Gantt detallado por líneas de trabajo</p>
            <p className="text-[11px] text-[#A8A49C]">Ruta crítica resaltada · filtrar por tipo de actividad</p>
          </div>
          <div className="px-6 py-3 flex flex-wrap gap-1.5 border-b border-[#F0EDE5]">
            {GANTT_FILTERS.map(f => (
              <button key={f.id} type="button" onClick={() => setGanttFilter(f.id)}
                className={cn(
                  'px-3 py-1 rounded-full text-[10px] font-medium transition-colors',
                  ganttFilter === f.id ? 'bg-[#3B6D11] text-white' : 'bg-[#F4F2ED] text-[#6B6760] hover:bg-[#E8E4DC]',
                )}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="px-6 py-4 space-y-2.5">
            {/* week ticks */}
            <div className="flex items-center gap-3">
              <div className="w-48 shrink-0" />
              <div className="flex-1 flex justify-between">
                {[0, Math.round(totalSemanas * 0.25), Math.round(totalSemanas * 0.5), Math.round(totalSemanas * 0.75), totalSemanas].map(w => (
                  <span key={w} className="text-[8px] text-[#A8A49C] font-mono">S{w}</span>
                ))}
              </div>
            </div>
            {filteredGantt.map(g => {
              const left = ((g.inicio - 1) / totalSemanas) * 100
              const width = ((g.fin - g.inicio + 1) / totalSemanas) * 100
              const barColor = g.critico ? '#2D5A0D'
                : g.estado === 'completado' ? '#A8A49C'
                : g.estado === 'en_ejecucion' ? '#1A5FA8'
                : '#CBD5E1'
              const estadoLabel = g.estado === 'completado' ? 'Completado'
                : g.estado === 'en_ejecucion' ? 'En ejecución'
                : g.estado === 'programado' ? 'Programado' : 'Pendiente'
              return (
                <div key={g.id} className="flex items-center gap-3">
                  <div className="w-48 shrink-0 flex items-center gap-1.5">
                    {g.critico && <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A0D] shrink-0" />}
                    <p className="text-[10px] text-[#4A4740] leading-tight truncate">{g.actividad}</p>
                  </div>
                  <div className="flex-1 h-5 bg-[#F4F2ED] rounded relative overflow-hidden">
                    {[0.25, 0.5, 0.75].map(p => (
                      <div key={p} className="absolute top-0 bottom-0 w-px bg-[#E8E4DC]" style={{ left: `${p * 100}%` }} />
                    ))}
                    <div className="absolute top-0.5 bottom-0.5 rounded-sm transition-all"
                      style={{ left: `${left}%`, width: `${Math.max(width, 1.5)}%`, background: barColor }} />
                  </div>
                  <span className={cn('shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded',
                    g.estado === 'completado' ? 'bg-[#F4F2ED] text-[#A8A49C]'
                    : g.estado === 'en_ejecucion' ? 'bg-[#EBF3FB] text-[#1A5FA8]'
                    : g.critico ? 'bg-[#FDE8E8] text-[#B91C1C]'
                    : 'bg-[#F4F2ED] text-[#6B6760]'
                  )}>{estadoLabel}</span>
                </div>
              )
            })}
          </div>
          <div className="px-6 pb-4 flex gap-4 flex-wrap">
            {[['#2D5A0D','Ruta crítica'],['#1A5FA8','En ejecución'],['#A8A49C','Completado'],['#CBD5E1','Pendiente']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1.5 text-[9px] text-[#6B6760]">
                <div className="w-3 h-2.5 rounded-sm" style={{ background: c }} />
                {l}
              </div>
            ))}
          </div>
        </div>
      </ExpandableChart>

      {/* RACI */}
      <ExpandableChart chartId="m03-raci" title="D) Matriz RACI — gobernanza por actividad crítica" subtitle="R=Responsable · A=Aprueba · C=Consulta · I=Informa">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EDE5]">
            <p className="text-[13px] font-semibold text-[#1C1B18]">D) Matriz RACI — gobernanza por actividad crítica</p>
            <p className="text-[11px] text-[#A8A49C]">La claridad de gobernanza evita cuellos de botella y acelera decisiones críticas</p>
          </div>
          <div className="overflow-x-auto p-6">
            <table className="text-[11px]">
              <thead>
                <tr>
                  <th className="text-left pb-3 pr-6 font-semibold text-[#1C1B18] min-w-[180px]">Actividad</th>
                  {RACI_ACTORS.map(a => (
                    <th key={a} className="pb-3 px-2 text-center font-medium text-[#6B6760] min-w-[68px]">
                      <span className="text-[9px] leading-tight block">{a}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {RACI_ACTIVITIES.map((row, i) => (
                  <tr key={row.actividad} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="py-2 pr-6 text-[11px] text-[#4A4740]">{row.actividad}</td>
                    {row.vals.map((v, j) => (
                      <td key={j} className="py-2 px-2 text-center"><RaciChip val={v} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap gap-3 mt-4">
              {[['R','Responsable','#D1FAE5','#065F46'],['A','Aprueba','#DBEAFE','#1E40AF'],['C','Consulta','#FEF3C7','#92400E'],['I','Informa','#F3F4F6','#6B7280']].map(([v,l,bg,color]) => (
                <div key={v} className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold border" style={{ background: bg, color }}>
                    {v}
                  </span>
                  <span className="text-[10px] text-[#6B6760]">{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ExpandableChart>

      {/* Bottlenecks */}
      <ExpandableChart chartId="m03-bottlenecks" title="E) Riesgos y cuellos de botella de calendario" subtitle="Probabilidad × impacto · efecto en días · mitigación">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-[#F0EDE5]">
            <p className="text-[13px] font-semibold text-[#1C1B18]">E) Riesgos y cuellos de botella de calendario</p>
            <p className="text-[11px] text-[#A8A49C]">Cada riesgo tiene efecto en ruta crítica y mitigación específica</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Riesgo / cuello de botella','Prob.','Impacto','Ponderado','Efecto est.','Mitigación sugerida'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[10px] font-bold text-[#1C1B18] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BOTTLENECKS.map((b, i) => {
                  const pond = (b.prob * b.impacto).toFixed(2)
                  const high = parseFloat(pond) >= 1.5
                  return (
                    <tr key={b.riesgo} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-4 py-3 text-[11px] text-[#4A4740] max-w-[220px]">{b.riesgo}</td>
                      <td className="px-4 py-3 text-[11px] font-mono text-center">{b.prob}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="bg-[#FEF3C7] text-[#92400E] text-[10px] font-bold px-1.5 py-0.5 rounded">{b.impacto}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={cn('text-[11px] font-bold', high ? 'text-[#C0392B]' : 'text-[#D4881E]')}>{pond}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('text-[11px] font-semibold', high ? 'text-[#C0392B]' : 'text-[#D4881E]')}>{b.efecto}</span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-[#6B6760]">{b.mitigacion}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </ExpandableChart>

      {/* Decision card */}
      <div className="rounded-[12px] border-2 border-[#3B6D11] bg-[#F4FAEC] px-6 py-5 flex items-start gap-4">
        <CheckCircle className="w-7 h-7 text-[#3B6D11] shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold text-[#3B6D11] mb-2">Decisión sugerida por el motor</p>
          <p className="text-[13px] text-[#3B5F23] leading-relaxed mb-3">
            Priorizar el desbloqueo de actividades críticas sin holgura (T01, T03, T06, T09, T12, T14, T15)
            y resolver bloqueos jurídico-presupuestales antes de iniciar infraestructura.
          </p>
          <ul className="space-y-1.5 mb-4">
            {[
              'Desbloquear licitación con bases tipo preaprobadas por contraloría.',
              'Asegurar ministración presupuestal para adquisición de flota.',
              'Gestionar permisos ambientales en paralelo, no en serie.',
              'Formalizar responsables únicos para cada actividad de ruta crítica.',
            ].map(a => (
              <li key={a} className="flex items-start gap-2 text-[11px] text-[#3B5F23]">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />
                {a}
              </li>
            ))}
          </ul>
          <button type="button" className="px-5 py-2 bg-[#3B6D11] text-white text-[12px] font-semibold rounded-[8px] hover:bg-[#2D5A0D] transition-colors">
            Ir a plan de acción →
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page 3 ────────────────────────────────────────────────────────────────────

function Page3({
  municipio, horizonte, trayectoria, capturaFinal, rsuDia,
  faseLegal, genPercapita, capexTotal, empleosMeta, co2Meta,
  derraMeta, serieAnual, mixCentros,
}: {
  municipio: string; horizonte: number; trayectoria: string
  capturaFinal: number; rsuDia: number; faseLegal: string
  genPercapita: number; capexTotal: number
  empleosMeta: number; co2Meta: number; derraMeta: number
  serieAnual: Array<{ año: number; ingresos: number; co2e: number; empleosDirectos: number; pctCaptura: number }>
  mixCentros: number
}) {
  const [chartWindow, setChartWindow] = useState<1 | 3 | 5 | 10>(10)
  const totalMeses = horizonte * 12
  const gatesCumplidos = GATES_DATA.filter(g => g.estado === 'cumplido').length

  const progData = useMemo(() => {
    let cumIngresos = 0, cumCo2 = 0
    return serieAnual.slice(0, chartWindow).map(a => {
      cumIngresos += a.ingresos
      cumCo2 += a.co2e
      return {
        año: `A${a.año}`,
        empleos: a.empleosDirectos,
        co2Acum: Math.round(cumCo2 / 1000),
        derrAcum: Math.round(cumIngresos / 1_000_000),
        captura: Math.round(a.pctCaptura),
      }
    })
  }, [serieAnual, chartWindow])

  return (
    <div className="space-y-6">
      {/* Inherited decisions */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-4">
        <p className="text-[9px] uppercase tracking-[0.12em] text-[#A8A49C] mb-3 font-bold">
          Decisiones comprometidas heredadas — solo lectura
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Escenario',          value: trayectoria },
            { label: 'Horizonte',          value: `${horizonte} años` },
            { label: 'Gen. per cápita',    value: `${genPercapita.toFixed(2)} kg/hab/día` },
            { label: 'Captura final',      value: `${capturaFinal}%` },
            { label: 'Marco jurídico',     value: faseLegal },
            { label: 'Responsable inst.',  value: 'Dir. Economía Circular' },
          ].map(c => (
            <div key={c.label} className="rounded-[7px] border border-[#E8E4DC] bg-white px-3 py-2">
              <p className="text-[8px] uppercase tracking-[0.05em] text-[#A8A49C]">{c.label}</p>
              <p className="text-[11px] font-semibold text-[#1C1B18]">{c.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress timeline */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-[13px] font-semibold text-[#1C1B18]">Lectura del plan comprometido</p>
          <span className="text-[10px] text-[#A8A49C]">Estado actual del programa vs. metas del horizonte</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-2 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#3B6D11]" style={{ width: `${Math.min((9 / Math.max(totalMeses, 1)) * 100, 100)}%` }} />
          </div>
          <span className="text-[11px] font-mono font-semibold text-[#3B6D11] shrink-0">Mes 9 de {totalMeses}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {[
            { label: 'Fase activa',    curr: 'Instalación',  meta: 'Oleada 1',  icon: TrendingUp },
            { label: 'Captura acum.',  curr: '2,689 t',       meta: `${Math.round(empleosMeta * 30)} t`,    icon: Target },
            { label: 'Centros activos', curr: '12',           meta: `${mixCentros}`,                        icon: MapPin },
            { label: 'Empleos gen.',   curr: String(Math.min(147, empleosMeta)), meta: String(empleosMeta),  icon: Users },
            { label: 'CO₂ evitado',   curr: `${(co2Meta * 0.025 / 1000).toFixed(1)} kt`, meta: `${(co2Meta / 1000).toFixed(0)} kt`, icon: Shield },
            { label: 'Derrama acum.', curr: `$${(derraMeta * 0.028 / 1_000_000).toFixed(1)} M`, meta: fmt.mxnM(derraMeta), icon: DollarSign },
            { label: 'Mes plan.',      curr: 'Mes 9',        meta: `de ${totalMeses}`,                       icon: Clock },
          ].map(c => (
            <div key={c.label} className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <c.icon className="w-3 h-3 text-[#A8A49C]" />
                <p className="text-[8px] uppercase tracking-[0.05em] text-[#A8A49C]">{c.label}</p>
              </div>
              <p className="text-[13px] font-bold text-[#1C1B18] font-mono leading-none">{c.curr}</p>
              <p className="text-[8px] text-[#A8A49C] mt-0.5">Meta: {c.meta}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Waves */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ExpandableChart chartId="m03-map" title="Mapa territorial de despliegue" subtitle="Estado del programa por zona — fases de cobertura">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="text-[12px] font-semibold text-[#1C1B18]">Mapa territorial de despliegue</p>
              <p className="text-[10px] text-[#A8A49C]">Estado del programa por zona · fases de cobertura</p>
            </div>
            <div className="p-5">
              <div className="h-52 rounded-[10px] bg-gradient-to-br from-[#EAF3DE] to-[#D7E8C0] border border-[#D7E8C0] flex items-center justify-center relative overflow-hidden">
                {/* Zone markers */}
                {[
                  { label: 'Poniente', x: '20%', y: '40%', fase: 'En curso', color: '#3B6D11' },
                  { label: 'Centro',   x: '50%', y: '50%', fase: 'Siguiente', color: '#1A5FA8' },
                  { label: 'Norte',    x: '55%', y: '25%', fase: 'Planeada',  color: '#D4881E' },
                  { label: 'Sur',      x: '45%', y: '70%', fase: 'Planeada',  color: '#A8A49C' },
                ].map(z => (
                  <div key={z.label} className="absolute flex flex-col items-center"
                    style={{ left: z.x, top: z.y, transform: 'translate(-50%,-50%)' }}>
                    <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold shadow-md"
                      style={{ background: z.color }}>
                      <MapPin className="w-3.5 h-3.5" />
                    </div>
                    <div className="mt-1 bg-white rounded-[5px] border border-[#E8E4DC] px-1.5 py-0.5 shadow-sm">
                      <p className="text-[8px] font-semibold text-[#1C1B18]">{z.label}</p>
                      <p className="text-[7px]" style={{ color: z.color }}>{z.fase}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  ['#F4F2ED','#A8A49C','Sin iniciar'],
                  ['#EBF3FB','#1A5FA8','Diagnóstico'],
                  ['#FEF3C7','#D4881E','Permisos'],
                  ['#D1FAE5','#3B6D11','Instalación'],
                  ['#FDE8E8','#C0392B','Piloto'],
                  ['#2D5A0D','#fff','Escala plena'],
                ].map(([bg, color, label]) => (
                  <div key={label} className="flex items-center gap-1 text-[9px]">
                    <div className="w-3 h-3 rounded-sm border" style={{ background: bg, borderColor: color }} />
                    <span className="text-[#6B6760]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ExpandableChart>

        {/* Waves */}
        <div className="space-y-2.5">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Oleadas territoriales</p>
          {WAVES.map(w => (
            <div key={w.nombre} className="rounded-[10px] border p-3.5" style={{ borderColor: w.border, background: w.bg }}>
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-[11px] font-semibold" style={{ color: w.color }}>{w.nombre}</p>
                <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full border text-white shrink-0"
                  style={{ background: w.color, borderColor: w.color }}>
                  {w.estado}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <div><span className="text-[#A8A49C]">Zonas:</span> <span className="font-medium text-[#1C1B18]">{w.zonas}</span></div>
                <div><span className="text-[#A8A49C]">Duración:</span> <span className="font-medium text-[#1C1B18]">M{w.mesInicio}–M{w.mesFin}</span></div>
                <div><span className="text-[#A8A49C]">Captura obj.:</span> <span className="font-medium text-[#1C1B18]">{w.capturaObj}</span></div>
                <div><span className="text-[#A8A49C]">Gate:</span> <span className="font-medium text-[#1C1B18]">{w.gate}</span></div>
              </div>
              <div className="mt-2 pt-2 border-t flex gap-2" style={{ borderColor: w.border }}>
                <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" style={{ color: w.color }} />
                <p className="text-[9px]" style={{ color: w.color }}>Riesgo: {w.riesgo}</p>
              </div>
              <p className="text-[9px] text-[#6B6760] mt-1.5">Siguiente: {w.accion}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Progression chart */}
      <ExpandableChart chartId="m03-progression" title="Progresión acumulada — contra meta del plan" subtitle="Empleos, CO₂ evitado, derrama y captura por año">
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
          <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
            <div>
              <p className="text-[13px] font-semibold text-[#1C1B18]">Progresión acumulada — contra meta del plan</p>
              <p className="text-[10px] text-[#A8A49C]">Estos filtros cambian la ventana de lectura — no modifican el escenario comprometido del Módulo 1</p>
            </div>
            <div className="flex gap-1">
              {([1, 3, 5, 10] as const).map(w => (
                <button key={w} type="button" onClick={() => setChartWindow(w)}
                  className={cn('px-2.5 py-1 rounded text-[10px] font-semibold transition-colors',
                    chartWindow === w ? 'bg-[#3B6D11] text-white' : 'bg-[#F4F2ED] text-[#6B6760] hover:bg-[#E8E4DC]'
                  )}>
                  {w}a
                </button>
              ))}
            </div>
          </div>
          {progData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={progData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                <XAxis dataKey="año" tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 8, background: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="empleos"  stroke="#1A5FA8" fill="#EBF3FB" strokeWidth={2} name="Empleos directos" />
                <Area type="monotone" dataKey="co2Acum"  stroke="#3B6D11" fill="#EAF3DE" strokeWidth={2} name="CO₂ evit. kt acum." />
                <Area type="monotone" dataKey="derrAcum" stroke="#D4881E" fill="#FEF3C7" strokeWidth={2} name="Derrama acum. M MXN" />
                <Area type="monotone" dataKey="captura"  stroke="#8B6B4A" fill="#F5EDE3" strokeWidth={2} name="Captura %" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center">
              <p className="text-[12px] text-[#A8A49C]">Selecciona un municipio en Módulo 1 para ver la progresión.</p>
            </div>
          )}
        </div>
      </ExpandableChart>

      {/* Gates + Interdependency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Gates */}
        <ExpandableChart chartId="m03-gates" title="Gates para avanzar de fase" subtitle="Condiciones indispensables · estado actual">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[13px] font-semibold text-[#1C1B18]">Gates para avanzar de fase</p>
                <p className="text-[11px] text-[#A8A49C]">Condiciones indispensables · no avanzar sin cumplirlos</p>
              </div>
              <span className={cn('text-[13px] font-bold px-2.5 py-1 rounded-[8px]',
                gatesCumplidos >= 5 ? 'bg-[#EAF3DE] text-[#2D5A0D]' : 'bg-[#FEF3C7] text-[#92400E]'
              )}>
                {gatesCumplidos} / {GATES_DATA.length}
              </span>
            </div>
            <div className="space-y-2">
              {GATES_DATA.map(g => {
                const stateMap = {
                  cumplido:  { icon: <CheckCircle className="w-4 h-4 text-[#3B6D11] shrink-0" />, cls: 'border-[#D1FAE5] bg-[#F0FDF4]', label: 'Cumplido', lc: 'text-[#3B6D11]' },
                  en_curso:  { icon: <Clock className="w-4 h-4 text-[#D4881E] shrink-0" />,         cls: 'border-[#FDE68A] bg-[#FFF7ED]', label: 'En curso',  lc: 'text-[#D4881E]' },
                  pendiente: { icon: <AlertTriangle className="w-4 h-4 text-[#A8A49C] shrink-0" />,  cls: 'border-[#E8E4DC] bg-[#F9FAFB]', label: 'Pendiente', lc: 'text-[#A8A49C]' },
                  bloqueado: { icon: <Lock className="w-4 h-4 text-[#C0392B] shrink-0" />,           cls: 'border-[#FCA5A5] bg-[#FFF5F5]', label: 'Bloqueado', lc: 'text-[#C0392B]' },
                }
                const s = stateMap[g.estado]
                return (
                  <div key={g.label}>
                    <div className={cn('flex items-center gap-2.5 rounded-[8px] border px-3 py-2.5', s.cls)}>
                      {s.icon}
                      <span className="flex-1 text-[11px] text-[#4A4740]">{g.label}</span>
                      <span className={cn('text-[9px] font-bold', s.lc)}>{s.label}</span>
                    </div>
                    {g.alerta && g.estado !== 'cumplido' && (
                      <div className="ml-7 mt-1 flex items-start gap-1.5 text-[9px] text-[#D4881E]">
                        <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                        <span>{g.alerta}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </ExpandableChart>

        {/* Interdependency */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <p className="text-[13px] font-semibold text-[#1C1B18] mb-1">Interdependencia con otros módulos</p>
          <p className="text-[11px] text-[#A8A49C] mb-4">Este plan se construye sobre decisiones ya validadas en módulos anteriores</p>
          <div className="space-y-2.5">
            {[
              { m: 'M1', label: 'Escenario y trayectoria',       desc: 'Define la meta, el ritmo y el volumen de captura que este plan debe alcanzar.', color: '#3B6D11', bg: '#F4FAEC', border: '#D7E8C0' },
              { m: 'M2', label: 'Marco jurídico e institucional', desc: 'Define reglas, permisos y roles que este plan debe respetar para poder ejecutarse.', color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5' },
              { m: 'M3', label: 'Operatividad del despliegue',    desc: 'Gantt, ruta crítica, responsables y madurez operativa — este módulo.', color: '#6B6760', bg: '#F4F2ED', border: '#E8E4DC' },
              { m: 'M4', label: 'Infraestructura',                desc: 'Convierte la ruta en centros de acopio, rutas y operación física en campo.', color: '#8B6B4A', bg: '#F5EDE3', border: '#E5D5C5' },
            ].map(c => (
              <div key={c.m} className="flex items-start gap-3 rounded-[8px] border p-3" style={{ borderColor: c.border, background: c.bg }}>
                <span className="text-[10px] font-bold px-2 py-1 rounded font-mono text-white shrink-0" style={{ background: c.color }}>{c.m}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold mb-0.5" style={{ color: c.color }}>{c.label}</p>
                  <p className="text-[10px] text-[#6B6760]">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Right rail ────────────────────────────────────────────────────────────────

function RightRail({ page, vacios }: { page: number; vacios: number }) {
  const content = page === 1 ? {
    calcula: 'Duraciones de fase son estimaciones basadas en la complejidad típica de cada etapa. El Gantt usa las semanas como unidad base y refleja solapamiento real entre líneas de trabajo.',
    contexto: 'Módulo 3 convierte el escenario aprobado en una ruta operativa integral con secuencia lógica, responsables y calendar. No sustituye la gestión de proyecto — orienta las decisiones que la anteceden.',
    supuestos: [
      'Permisos ambientales dentro de los plazos meta.',
      'Predios disponibles sin litigio activo.',
      'Financiamiento aprobado antes de licitación.',
      'Capacidad institucional constante durante el horizonte.',
      'Reforma legal del Módulo 2 completada antes de Fase 4.',
    ],
    verifica: [
      'No iniciar infraestructura sin permisos cerrados.',
      'No licitar sin presupuesto aprobado y disponible.',
      'No escalar sin piloto validado con resultados.',
    ],
    confianza: { pct: 72, texto: 'Medio · la confianza sube al cerrar vacíos jurídicos y confirmar predios.' },
  } : page === 2 ? {
    calcula: `Ruta crítica = secuencia sin holgura que fija la duración mínima del plan. Holgura = tiempo extra disponible antes de afectar el fin del proyecto. ${vacios} vacíos jurídicos identificados como bloqueo M2.`,
    contexto: 'La ruta crítica traduce la planeación en responsabilidades concretas. Cada nodo sin holgura es un punto de control que requiere decisión activa — no gestión pasiva.',
    supuestos: [
      'Duración de actividades estimada en semanas laborales.',
      'Recursos humanos y materiales disponibles según calendario.',
      'Proveedores clave preidentificados.',
      'Aprobaciones institucionales en plazos normales.',
    ],
    verifica: [
      'IDs coinciden entre PERT, tabla y Gantt.',
      'Cada actividad crítica tiene R y A en RACI.',
      'Mitigación de riesgos con > 1.5 ponderado.',
    ],
    confianza: { pct: 72, texto: 'Medio · mejora al resolver bloqueos licitatorios y jurídicos.' },
  } : {
    calcula: 'Progresión acumulada calculada desde resultados.serieAnual del store. Metas de centros, empleos, CO₂ y derrama son los resultados finales del horizonte del Módulo 1.',
    contexto: 'La progresión territorial traduce el modelo en oleadas, fases y madurez operativa. Los valores actuales (Mes 9) son representativos del estado del programa, no del modelo.',
    supuestos: [
      'Capacidad instalada crece por oleadas.',
      'Rutas y operador definidos antes de escalar.',
      'Monitoreo continuo para ajuste adaptativo.',
      'Gates cumplidos antes de iniciar siguiente oleada.',
    ],
    verifica: [
      'Ritmo de despliegue vs. lo planeado en Módulo 1.',
      'Cumplimiento de gates por fase antes de escalar.',
      'Generación de valor público y CO₂ evitado acumulado.',
    ],
    confianza: { pct: 72, texto: 'Medio · mejora al validar gates de predios y operador.' },
  }

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
      <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold mb-3 px-1">Consideraciones del módulo</p>
      <RailSection title="Cómo se calcula" defaultOpen>
        <p>{content.calcula}</p>
      </RailSection>
      <RailSection title="Contexto del módulo">
        <p>{content.contexto}</p>
      </RailSection>
      <RailSection title="Supuestos clave">
        <ul className="space-y-1.5">
          {content.supuestos.map(s => (
            <li key={s} className="flex items-start gap-1.5">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-[#3B6D11] shrink-0" />
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </RailSection>
      <RailSection title="Qué verifica el plan">
        <ul className="space-y-1.5">
          {content.verifica.map(v => (
            <li key={v} className="flex items-start gap-1.5">
              <CheckCircle className="w-3 h-3 text-[#3B6D11] shrink-0 mt-0.5" />
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </RailSection>
      <RailSection title="Nivel de confianza">
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-[#D4881E]" style={{ width: `${content.confianza.pct}%` }} />
          </div>
          <span className="font-bold text-[#D4881E]">{content.confianza.pct}%</span>
        </div>
        <p className="text-[9px] text-[#A8A49C]">{content.confianza.texto}</p>
      </RailSection>
      <RailSection title="Qué está fijo vs. editable">
        <div className="space-y-1.5">
          <div>
            <p className="text-[9px] font-semibold text-[#C0392B] mb-0.5">Solo lectura en M3:</p>
            <p className="text-[9px]">Horizonte · municipio · trayectoria · RSU · precios · composición</p>
          </div>
          <div>
            <p className="text-[9px] font-semibold text-[#3B6D11] mb-0.5">Editable en M3:</p>
            <p className="text-[9px]">Fases · actividades · responsables · duraciones · RACI · gates · oleadas</p>
          </div>
        </div>
      </RailSection>
      <RailSection title="Interdependencias del programa">
        <div className="space-y-1.5">
          {[['M1','Escenario y trayectoria'],['M2','Marco jurídico'],['M3','Planeación logística (aquí)'],['M4','Infraestructura física'],['M6','Financiero'],['M7','Riesgos'],['M8','Seguimiento']].map(([m, l]) => (
            <div key={m} className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold bg-[#F4F2ED] text-[#6B6760] px-1.5 py-0.5 rounded">{m}</span>
              <span className="text-[9px] text-[#6B6760] flex-1">{l}</span>
              {m === 'M3' && <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />}
            </div>
          ))}
        </div>
      </RailSection>
    </div>
  )
}

// ── Page nav footer ───────────────────────────────────────────────────────────

function PageNavFooter({ page, setPage }: { page: number; setPage: (p: number) => void }) {
  const labels = ['Plan maestro', 'Ruta crítica y responsables', 'Oleadas territoriales']
  return (
    <div className="mt-8 pt-5 border-t border-[#E8E4DC] flex items-center justify-between gap-2 flex-wrap">
      <div className="flex gap-2">
        {page > 1 && (
          <button type="button" onClick={() => setPage(page - 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] font-medium text-[#6B6760] hover:bg-[#F4F2ED] transition-colors">
            ← Pág. {page - 1}: {labels[page - 2]}
          </button>
        )}
        {page < 3 && (
          <button type="button" onClick={() => setPage(page + 1)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#3B6D11] bg-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D] transition-colors">
            Pág. {page + 1}: {labels[page]} →
          </button>
        )}
        {page === 3 && (
          <button type="button" className="px-4 py-2 rounded-[8px] bg-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D] transition-colors">
            Módulo 4: Infraestructura →
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" className="px-3 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors">
          Exportar borrador PDF
        </button>
        <button type="button" className="px-3 py-2 rounded-[8px] border border-[#E8E4DC] text-[11px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors">
          Guardar vista
        </button>
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export function FutureGoalsModule({ notice }: { notice?: React.ReactNode }) {
  const {
    zmActiva, horizonte, presetTrayectoria, pctCapturaPorAño,
    resultados, genPercapita, mixCAs, seleccionMunicipioCatalog,
  } = useSimulatorStore()

  const [page, setPage] = useState(1)

  const trayectoria = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)?.label ?? presetTrayectoria
  const capturaFinal = Math.round(pctCapturaPorAño[Math.min(horizonte - 1, pctCapturaPorAño.length - 1)] ?? pctCapturaPorAño.at(-1) ?? 65)
  const rsuDia = resultados?.rsuTotalTonDia ?? 0
  const capexTotal = resultados?.capexTotal ?? 0
  const totalSemanas = Math.min(horizonte * 52, 260)
  const municipio = seleccionMunicipioCatalog?.nombre ?? zmActiva
  const legal = legalFor(zmActiva)
  const empleosMeta = resultados?.empleosTotalesDirectos ?? 0
  const co2Meta = resultados?.co2eEvitadasTon ?? 0
  const derraMeta = resultados?.ingresosBrutos ?? 0
  const serieAnual = resultados?.serieAnual ?? []
  const mixCentros = mixCAs.P + mixCAs.M + mixCAs.G

  const PAGE_LABELS = ['Plan maestro y visión logística', 'Ruta crítica, dependencias y responsables', 'Oleadas territoriales y progresión']

  const sharedProps = {
    municipio, horizonte, trayectoria, capturaFinal, rsuDia,
    vacios: legal.vacios, adendas: legal.adendas, faseLegal: legal.fase,
  }

  return (
    <div className="pb-4">
      {/* Page tab navigation */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {[1, 2, 3].map(p => (
          <button key={p} type="button" onClick={() => setPage(p)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-[8px] text-[11px] font-semibold transition-colors border',
              page === p
                ? 'bg-[#1C2B15] text-white border-[#1C2B15]'
                : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]',
            )}>
            <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold',
              page === p ? 'bg-[#3B6D11]' : 'bg-[#E8E4DC] text-[#6B6760]'
            )}>{p}</span>
            <span className="hidden sm:block">{['Plan maestro', 'Ruta crítica', 'Oleadas'][p - 1]}</span>
          </button>
        ))}
        <span className="ml-1 text-[10px] text-[#A8A49C] hidden md:block">— {PAGE_LABELS[page - 1]}</span>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div>
          {page === 1 && (
            <Page1 {...sharedProps} capexTotal={capexTotal} totalSemanas={totalSemanas} />
          )}
          {page === 2 && (
            <Page2 {...sharedProps} totalSemanas={totalSemanas} />
          )}
          {page === 3 && (
            <Page3
              {...sharedProps}
              genPercapita={genPercapita} capexTotal={capexTotal}
              empleosMeta={empleosMeta} co2Meta={co2Meta}
              derraMeta={derraMeta} serieAnual={serieAnual}
              mixCentros={mixCentros}
            />
          )}
          <PageNavFooter page={page} setPage={setPage} />
        </div>
        <RightRail page={page} vacios={legal.vacios} />
      </div>
    </div>
  )
}
