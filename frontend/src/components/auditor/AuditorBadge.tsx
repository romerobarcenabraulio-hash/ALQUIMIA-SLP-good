'use client'

/**
 * AuditorBadge — visual indicator of data quality for any report or KPI.
 *
 * Score 0-100 based on average confidence of KPIs in the snapshot.
 * Color-coded: green (≥80), amber (60-79), red (<60).
 * Shows breakdown tooltip on hover.
 */

import { useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, ChevronDown } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type FuenteTipo = 'oficial' | 'certificado' | 'estimado' | 'manual' | 'no_disponible'

export interface ProvenanceItem {
  kpi_id: string
  kpi_label: string
  valor: unknown
  unidad: string
  tipo: FuenteTipo
  fuente_nombre: string
  fuente_organismo?: string
  fuente_url?: string | null
  fecha_dato?: string | null
  confianza: number
  advertencia?: string | null
}

export interface AuditorScore {
  score: number          // 0-100
  total_kpis: number
  kpis_oficiales: number
  kpis_estimados: number
  kpis_manuales: number
  kpis_no_disponibles: number
  warnings: string[]
  items?: ProvenanceItem[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_CONFIG: Record<FuenteTipo, { label: string; bg: string; text: string; dot: string }> = {
  oficial:       { label: 'Oficial',        bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]',  dot: '#3B6D11' },
  certificado:   { label: 'Certificado',    bg: 'bg-[#E8F0FD]', text: 'text-[#1C4B8F]',  dot: '#1C4B8F' },
  estimado:      { label: 'Estimado',       bg: 'bg-[#FEF7E7]', text: 'text-[#8B5A00]',  dot: '#D97706' },
  manual:        { label: 'Manual',         bg: 'bg-[#FFF4E5]', text: 'text-[#7C4C00]',  dot: '#EA580C' },
  no_disponible: { label: 'No disponible',  bg: 'bg-[#FEE2E2]', text: 'text-[#991B1B]',  dot: '#DC2626' },
}

export function buildAuditorScore(items: ProvenanceItem[]): AuditorScore {
  const warnings: string[] = []
  if (items.length === 0) return {
    score: 0, total_kpis: 0, kpis_oficiales: 0, kpis_estimados: 0,
    kpis_manuales: 0, kpis_no_disponibles: 0, warnings: ['Sin KPIs registrados'],
  }

  const scored = items.filter(i => i.valor !== null && i.valor !== undefined)
  const avg = scored.length > 0
    ? scored.reduce((s, i) => s + i.confianza, 0) / scored.length
    : 0

  const nd = items.filter(i => i.tipo === 'no_disponible').length
  const manual = items.filter(i => i.tipo === 'manual').length
  if (nd > 0) warnings.push(`${nd} KPI${nd > 1 ? 's' : ''} no disponible${nd > 1 ? 's' : ''}`)
  if (manual > 0) warnings.push(`${manual} KPI${manual > 1 ? 's' : ''} ingresado${manual > 1 ? 's' : ''} manualmente`)

  return {
    score: Math.round(avg * 100),
    total_kpis: items.length,
    kpis_oficiales: items.filter(i => i.tipo === 'oficial' || i.tipo === 'certificado').length,
    kpis_estimados: items.filter(i => i.tipo === 'estimado').length,
    kpis_manuales: manual,
    kpis_no_disponibles: nd,
    warnings,
    items,
  }
}

// ─── Components ───────────────────────────────────────────────────────────────

interface BadgeProps {
  score: AuditorScore
  showDetail?: boolean
  size?: 'sm' | 'md'
}

export function AuditorBadge({ score, showDetail = false, size = 'md' }: BadgeProps) {
  const [open, setOpen] = useState(false)

  const { color, Icon, label } =
    score.score >= 80
      ? { color: '#3B6D11', Icon: ShieldCheck, label: 'AUDITOR: Aprobado' }
      : score.score >= 60
      ? { color: '#D97706', Icon: ShieldAlert, label: 'AUDITOR: Advertencia' }
      : { color: '#DC2626', Icon: ShieldX,    label: 'AUDITOR: Revisión requerida' }

  const sm = size === 'sm'

  return (
    <div className="relative inline-block">
      <button
        onClick={() => showDetail && setOpen(o => !o)}
        className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-semibold transition-colors ${
          sm ? 'text-[10px]' : 'text-[11px]'
        }`}
        style={{ borderColor: color + '40', background: color + '10', color }}
        title={label}
      >
        <Icon size={sm ? 11 : 13} />
        {score.score}
        {showDetail && <ChevronDown size={sm ? 8 : 10} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />}
      </button>

      {open && showDetail && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-[#E8E4DC] bg-white shadow-lg overflow-hidden">
          <div className="border-b border-[#F0EDE6] px-4 py-3">
            <p className="text-[12px] font-semibold text-[#1C1B18]">{label}</p>
            <p className="text-[11px] text-[#6B6760]">Score de trazabilidad de datos</p>
          </div>
          <div className="grid grid-cols-2 gap-0 divide-x divide-y divide-[#F0EDE6] px-0">
            {[
              { label: 'Total KPIs', value: score.total_kpis },
              { label: 'Oficiales/Cert.', value: score.kpis_oficiales },
              { label: 'Estimados', value: score.kpis_estimados },
              { label: 'No disponibles', value: score.kpis_no_disponibles },
            ].map(item => (
              <div key={item.label} className="px-3 py-2 text-center">
                <p className="text-[11px] text-[#8E8980]">{item.label}</p>
                <p className="text-[16px] font-bold text-[#1C1B18]">{item.value}</p>
              </div>
            ))}
          </div>
          {score.warnings.length > 0 && (
            <div className="border-t border-[#F0EDE6] px-4 py-2">
              {score.warnings.map((w, i) => (
                <p key={i} className="text-[10px] text-amber-600">⚠ {w}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Inline provenance citation ───────────────────────────────────────────────

export function ProvenancePill({ tipo, fuente, confianza, advertencia }: {
  tipo: FuenteTipo
  fuente: string
  confianza?: number
  advertencia?: string | null
}) {
  const cfg = TIPO_CONFIG[tipo]
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${cfg.bg} ${cfg.text}`}
      title={advertencia ?? fuente}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
      {cfg.label}
      {confianza !== undefined && (
        <span className="opacity-70">· {Math.round(confianza * 100)}%</span>
      )}
    </span>
  )
}

// ─── Full provenance table ────────────────────────────────────────────────────

export function ProvenanceTable({ items }: { items: ProvenanceItem[] }) {
  if (items.length === 0) return (
    <p className="text-[12px] text-[#8E8980] italic">Sin datos de provenance registrados.</p>
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E8E4DC]">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="border-b border-[#F0EDE6] bg-[#FAFAF8]">
            <th className="px-3 py-2 text-left font-semibold text-[#6B6760]">KPI</th>
            <th className="px-3 py-2 text-left font-semibold text-[#6B6760]">Valor</th>
            <th className="px-3 py-2 text-left font-semibold text-[#6B6760]">Tipo</th>
            <th className="px-3 py-2 text-left font-semibold text-[#6B6760]">Fuente</th>
            <th className="px-3 py-2 text-left font-semibold text-[#6B6760]">Confianza</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EDE6]">
          {items.map(item => {
            const cfg = TIPO_CONFIG[item.tipo]
            return (
              <tr key={item.kpi_id} className="hover:bg-[#FAFAF8]">
                <td className="px-3 py-2 font-medium text-[#1C1B18]">{item.kpi_label}</td>
                <td className="px-3 py-2 text-[#3B3326]">
                  {item.valor !== null && item.valor !== undefined
                    ? `${item.valor} ${item.unidad}`
                    : <span className="text-[#DC2626]">N/D</span>}
                </td>
                <td className="px-3 py-2">
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </td>
                <td className="px-3 py-2 text-[#6B6760]">
                  {item.fuente_url ? (
                    <a href={item.fuente_url} target="_blank" rel="noopener" className="underline hover:text-[#3B6D11]">
                      {item.fuente_nombre}
                    </a>
                  ) : item.fuente_nombre}
                  {item.advertencia && (
                    <p className="mt-0.5 text-[9px] text-amber-600">{item.advertencia}</p>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#F0EDE6]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(item.confianza * 100)}%`,
                          background: item.confianza >= 0.8 ? '#3B6D11' : item.confianza >= 0.6 ? '#D97706' : '#DC2626',
                        }}
                      />
                    </div>
                    <span className="text-[#8E8980]">{Math.round(item.confianza * 100)}%</span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
