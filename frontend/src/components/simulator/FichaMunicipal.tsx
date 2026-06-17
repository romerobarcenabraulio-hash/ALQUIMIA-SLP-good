'use client'

/**
 * Ficha municipal — procedencia enlazada por campo.
 * Patrón Minto/McKinsey: cifra protagonista → evidencia mínima → procedencia.
 * Sin fondos de color decorativos. WCAG 2.2 AA.
 */

import type { MunicipioProfile, CoverageStatus } from '@/types'
import { EditorialStatusLabel } from '@/components/editorial/EditorialStatusLabel'
import type { EditorialStatusTone } from '@/components/editorial/EditorialStatusLabel'
import { ExternalLink } from 'lucide-react'

// ── Utilidades ────────────────────────────────────────────────────────────────

function fmtNum(n: number | null | undefined, decimals = 0): string {
  if (n == null) return '—'
  return n.toLocaleString('es-MX', { maximumFractionDigits: decimals, minimumFractionDigits: decimals })
}

function statusTone(s: string): EditorialStatusTone {
  if (s === 'verificado') return 'success'
  if (s === 'localizado' || s === 'estimado') return 'caution'
  if (s === 'no_disponible' || s === 'bloqueado') return 'critical'
  return 'neutral'
}

function statusLabel(s: string): string {
  const MAP: Record<string, string> = {
    verificado: 'Verificado',
    localizado: 'Localizado',
    estimado: 'Estimado',
    no_disponible: 'Sin datos',
    bloqueado: 'Bloqueado',
  }
  return MAP[s] ?? s
}

// ── Subcomponente: fila de dato con procedencia ───────────────────────────────

interface DataRowProps {
  label: string
  value: string
  provenanceKey?: string
  provenance?: Record<string, unknown>
}

function ProvenanceLink({ href }: { href: string }) {
  const isUrl = href.startsWith('http') || href.startsWith('/')
  if (!isUrl) {
    return <span className="text-[10px] text-[#6B6760]">{href}</span>
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-0.5 text-[10px] text-[#1A5FA8] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#1A5FA8]"
      aria-label={`Fuente: ${href}`}
    >
      Fuente
      <ExternalLink size={9} aria-hidden />
    </a>
  )
}

function resolveProvenanceHref(src: unknown): string | null {
  if (typeof src === 'string') return src
  if (src !== null && typeof src === 'object' && 'url' in src) {
    const url = (src as { url: unknown }).url
    if (typeof url === 'string') return url
  }
  return null
}

function DataRow({ label, value, provenanceKey, provenance }: DataRowProps) {
  const src = provenanceKey && provenance ? provenance[provenanceKey] : undefined
  const href = resolveProvenanceHref(src)
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5 border-b border-[#E8E4DC] last:border-0">
      <span className="text-[11px] text-[#6B6760] shrink-0">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-[#1C1B18] tabular-nums">{value}</span>
        {href !== null && <ProvenanceLink href={href} />}
      </span>
    </div>
  )
}

// ── Props públicas ────────────────────────────────────────────────────────────

export interface FichaMunicipalProps {
  profile: MunicipioProfile
  coverage?: CoverageStatus
  onClose?: () => void
}

export function FichaMunicipal({ profile, coverage, onClose }: FichaMunicipalProps) {
  const prov = profile.data_provenance ?? {}

  return (
    <article
      aria-labelledby="ficha-mun-heading"
      className="rounded-[10px] border border-[#E8E4DC] bg-white p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 id="ficha-mun-heading" className="text-[15px] font-bold text-[#1C1B18] leading-snug">
            {profile.nombre}
          </h3>
          <p className="text-[11px] text-[#6B6760] mt-0.5">
            {profile.estado} · ZM {profile.zm_id}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Cerrar ficha"
            className="shrink-0 text-[11px] text-[#6B6760] hover:text-[#1C1B18] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3B6D11] px-2 py-0.5 rounded"
          >
            Cerrar
          </button>
        )}
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-0.5">
          <p className="text-[10px] text-[#6B6760] uppercase tracking-[0.05em]">Población</p>
          <p className="text-[18px] font-bold text-[#1C1B18] tabular-nums leading-none">
            {profile.poblacion != null ? fmtNum(profile.poblacion) : '—'}
          </p>
          <p className="text-[9px] text-[#8A857C]">hab.</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-[#6B6760] uppercase tracking-[0.05em]">RSU generado</p>
          <p className="text-[18px] font-bold text-[#1C1B18] tabular-nums leading-none">
            {fmtNum(profile.rsu_ton_dia, 1)}
          </p>
          <p className="text-[9px] text-[#8A857C]">ton/día</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] text-[#6B6760] uppercase tracking-[0.05em]">Per cápita</p>
          <p className="text-[18px] font-bold text-[#1C1B18] tabular-nums leading-none">
            {fmtNum(profile.gen_per_capita, 3)}
          </p>
          <p className="text-[9px] text-[#8A857C]">kg/hab/día</p>
        </div>
      </div>

      {/* Etapa de cobertura */}
      <div>
        <p className="text-[10px] text-[#6B6760] uppercase tracking-[0.05em] mb-1">Etapa SCR</p>
        <span className="text-[12px] font-semibold text-[#1C1B18]">
          {profile.coverage_status.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Datos con procedencia */}
      <div>
        <p className="text-[10px] text-[#6B6760] uppercase tracking-[0.05em] mb-2">Datos · procedencia</p>
        <div>
          <DataRow label="Presupuesto" value={profile.presupuesto_mxn != null ? `$${fmtNum(profile.presupuesto_mxn)} MXN` : '—'} provenanceKey="presupuesto" provenance={prov} />
          <DataRow label="Concesión" value={statusLabel(profile.concesion_status)} provenanceKey="concesion" provenance={prov} />
          <DataRow label="Dependencia" value={profile.dependencia_responsable ?? '—'} provenanceKey="dependencia" provenance={prov} />
          <DataRow label="Viviendas" value={fmtNum(profile.viviendas)} provenanceKey="viviendas" provenance={prov} />
        </div>
      </div>

      {/* Cobertura por dimensión */}
      {coverage && (
        <div>
          <p className="text-[10px] text-[#6B6760] uppercase tracking-[0.05em] mb-2">Estado por dimensión</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {(
              [
                ['Demografía',   coverage.demografia],
                ['RSU',          coverage.rsu],
                ['Legal',        coverage.legal],
                ['Contrato',     coverage.contrato],
                ['Presupuesto',  coverage.presupuesto],
                ['Operación',    coverage.operacion],
                ['Documentos',   coverage.documentos],
              ] as [string, string][]
            ).map(([dim, st]) => (
              <div key={dim} className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#6B6760]">{dim}</span>
                <EditorialStatusLabel tone={statusTone(st)}>{statusLabel(st)}</EditorialStatusLabel>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Siguiente acción */}
      {coverage?.siguiente_accion && (
        <div className="rounded-[6px] bg-[#F4F2ED] px-3 py-2">
          <p className="text-[10px] text-[#6B6760] uppercase tracking-[0.05em] mb-0.5">Siguiente acción</p>
          <p className="text-[12px] text-[#1C1B18]">{coverage.siguiente_accion}</p>
        </div>
      )}

      {/* Bloqueos */}
      {coverage?.bloqueos && coverage.bloqueos.length > 0 && (
        <div className="rounded-[6px] bg-[#FEF2F2] border border-[#FECACA] px-3 py-2">
          <p className="text-[10px] font-semibold text-[#B91C1C] uppercase tracking-[0.05em] mb-1">Bloqueos activos</p>
          <ul className="space-y-0.5">
            {coverage.bloqueos.map((b, i) => (
              <li key={i} className="text-[11px] text-[#B91C1C]">· {b}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
