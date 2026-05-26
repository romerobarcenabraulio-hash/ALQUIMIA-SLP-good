'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import type { CoverageStatus, MunicipioProfile } from '@/types'
import { getNationalCoverage, getNationalMunicipios } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'

const MexicoRsuFootprintMap = dynamic(() => import('@/components/simulator/MexicoRsuFootprintMap'), {
  ssr: false,
  loading: () => (
    <p className="py-6 text-[13px] text-[#6B6760]">Preparando vista mapa RSU…</p>
  ),
})

const ZmCircularityHeatmapMap = dynamic(() => import('@/components/simulator/ZmCircularityHeatmapMap'), {
  ssr: false,
  loading: () => (
    <p className="py-6 text-[13px] text-[#6B6760]">Preparando mapa circularidad…</p>
  ),
})

const STATUS_COLOR: Record<string, string> = {
  verificado: 'bg-green-100 text-green-800',
  localizado: 'bg-[#EAF3DE] text-[#23470A]',
  estimado: 'bg-yellow-100 text-yellow-800',
  no_disponible: 'bg-[#F0EDE5] text-[#6B6760]',
  bloqueado: 'bg-red-100 text-red-800',
}

/** Color de bloque en el SVG esquemático (no cartográfico). */
const LEGAL_TILE: Record<string, string> = {
  verificado: '#3B6D11',
  localizado: '#8FA882',
  estimado: '#D4881E',
  no_disponible: '#DAD3C7',
  bloqueado: '#B91C1C',
}

function ZmCoverageSchematic({ coverage }: { coverage: CoverageStatus[] }) {
  const w = 360
  const h = 52
  const n = Math.max(1, coverage.length)
  const pad = 6
  const gap = 4
  const cell = (w - pad * 2 - gap * (n - 1)) / n

  return (
    <figure className="mt-3">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full max-w-md"
        role="img"
        aria-label="Esquema de municipios por estado legal en la ZM, sin carácter cartográfico oficial"
      >
        <text x={pad} y={14} fill="#6B6760" fontSize="10">
          Esquema ZM · orden de fila de cobertura
        </text>
        {coverage.map((c, i) => (
          <rect
            key={c.municipio_id}
            x={pad + i * (cell + gap)}
            y={22}
            width={cell}
            height={26}
            rx={5}
            fill={LEGAL_TILE[c.legal] ?? '#DAD3C7'}
          />
        ))}
      </svg>
      <figcaption className="text-[10px] text-[#8A857C] mt-1 max-w-md leading-snug">
        Bloques alineados al orden de la tabla de cobertura; son ilustrativos y no sustituyen cartografía ni límites oficiales.
      </figcaption>
    </figure>
  )
}

function aggregateCoverage(coverage: CoverageStatus[]) {
  const total = coverage.length
  const legalVerificado = coverage.filter(c => c.legal === 'verificado').length
  const legalEstimado = coverage.filter(c => c.legal === 'estimado').length
  const legalLocalizado = coverage.filter(c => c.legal === 'localizado').length
  const agoraBloqueados = coverage.filter(c => c.agora_bloqueado).length
  const stageLegalVerificado = coverage.filter(c => c.coverage_status === 'legal_verificado').length
  const pct = (k: number) => (total ? ((k / total) * 100).toFixed(0) : '0')
  return {
    total,
    legalVerificado,
    legalEstimado,
    legalLocalizado,
    agoraBloqueados,
    stageLegalVerificado,
    pct,
  }
}

export default function CoberturaNacional() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const profiles = useSimulatorStore(s => s.municipioProfiles)
  const coverage = useSimulatorStore(s => s.coverageStatuses)
  const simAudience = useSimulatorStore(s => s.audience)
  const setNationalCoverage = useSimulatorStore(s => s.setNationalCoverage)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const byMunicipio = new Map<string, MunicipioProfile>((profiles ?? []).map(p => [p.municipio_id, p]))

  const agg = useMemo(() => (coverage?.length ? aggregateCoverage(coverage) : null), [coverage])

  async function loadCoverage() {
    setLoading(true)
    setError(null)
    try {
      const [p, c] = await Promise.all([
        getNationalMunicipios(zmActiva),
        getNationalCoverage(zmActiva),
      ])
      setNationalCoverage(p, c)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando cobertura nacional')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">
          Cobertura legal · {zmActiva}
        </p>
        <button
          onClick={loadCoverage}
          disabled={loading}
          className="shrink-0 rounded-full border border-[#1C1B18] bg-[#1C1B18] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B6D11] hover:border-[#3B6D11] disabled:opacity-50"
        >
          {loading ? 'Cargando…' : coverage ? 'Actualizar cobertura' : 'Cargar cobertura'}
        </button>
      </div>

      <MexicoRsuFootprintMap />

      <ZmCircularityHeatmapMap zmId={zmActiva} />

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {coverage && agg && (
        <>
          <ZmCoverageSchematic coverage={coverage} />
          <KpiAnchorGrid
            columns={4}
            items={[
              { label: 'Municipios', value: String(agg.total) },
              {
                label: 'Legal verificado',
                value: `${agg.legalVerificado} (${agg.pct(agg.legalVerificado)}%)`,
                figureClassName: 'text-[#3B6D11]',
              },
              {
                label: 'Legal estimado',
                value: `${agg.legalEstimado} (${agg.pct(agg.legalEstimado)}%)`,
                figureClassName: 'text-amber-900',
              },
              {
                label: 'AGORA bloqueado',
                value: String(agg.agoraBloqueados),
                figureClassName: 'text-red-800',
              },
            ]}
          />
        </>
      )}

      {coverage && agg && (
        <NarrativeBridge
          variant="bridge"
          audience={
            simAudience === 'functionary'
              ? 'functionary'
              : simAudience === 'entrepreneur'
                ? 'entrepreneur'
                : 'citizen'
          }
          kicker="Cobertura · lectura conjunta"
          summary={`${zmActiva} reporta ${agg.total} filas municipales: ${agg.legalVerificado} con marco legal verificado (${agg.pct(agg.legalVerificado)}%), ${agg.legalEstimado} aún en estimación (${agg.pct(agg.legalEstimado)}%) y ${agg.legalLocalizado} localizados. Etapa «legal verificado» en el staging: ${agg.stageLegalVerificado}/${agg.total}. ${agg.agoraBloqueados > 0 ? `${agg.agoraBloqueados} municipio(s) mantienen bloqueo AGORA hasta saneamiento jurídico.` : 'Sin bloqueo AGORA en los registros cargados.'}`}
          evidence={[
            { label: 'Verificado', value: `${agg.legalVerificado} · ${agg.pct(agg.legalVerificado)}%` },
            { label: 'Estimado', value: `${agg.legalEstimado} · ${agg.pct(agg.legalEstimado)}%` },
            { label: 'Localizado', value: `${agg.legalLocalizado} mun.` },
            { label: 'Bloqueo AGORA', value: String(agg.agoraBloqueados) },
          ]}
          nextStep={{
            label: 'Continuar en marco legal',
            helper: 'Complementa con el módulo de contexto municipal y valida la siguiente acción por fila en la tabla.',
          }}
        />
      )}

      {coverage && (
        <div className="overflow-x-auto border border-[#F0EDE5] rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-[#FAF8F4] text-xs text-[#8A857C]">
              <tr>
                <th className="text-left py-2 px-3 font-medium">Municipio</th>
                <th className="text-right py-2 px-3 font-medium whitespace-nowrap">Población ~</th>
                <th className="text-right py-2 px-3 font-medium whitespace-nowrap">RSU t/día ~</th>
                <th className="text-right py-2 px-3 font-medium whitespace-nowrap">CO₂e t/día ~</th>
                <th className="text-left py-2 px-3 font-medium">Legal</th>
                <th className="text-left py-2 px-3 font-medium">Presupuesto</th>
                <th className="text-left py-2 px-3 font-medium">Documentos</th>
                <th className="text-left py-2 px-3 font-medium">Siguiente accion</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map(c => {
                const profile = byMunicipio.get(c.municipio_id)
                return (
                  <tr key={c.municipio_id} className="border-t border-[#F0EDE5]">
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#1C1B18]">{profile?.nombre ?? c.municipio_id}</div>
                      <div className="text-xs text-[#8A857C]">{profile?.clave_inegi ?? 'INEGI N/D'} · {c.coverage_status}</div>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-[#1C1B18]">
                      {profile?.poblacion != null ? profile.poblacion.toLocaleString('es-MX') : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-[#1C1B18]">
                      {profile?.rsu_ton_dia != null
                        ? profile.rsu_ton_dia.toLocaleString('es-MX', { maximumFractionDigits: 1 })
                        : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-xs text-[#1C1B18]">
                      {profile?.co2e_disposal_ton_dia != null
                        ? profile.co2e_disposal_ton_dia.toFixed(3)
                        : '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.legal] ?? STATUS_COLOR.no_disponible}`}>
                        {c.legal}
                      </span>
                      {c.agora_bloqueado && <div className="mt-1 text-xs text-red-700">bloquea AGORA juridico</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.presupuesto] ?? STATUS_COLOR.no_disponible}`}>
                        {c.presupuesto}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[c.documentos] ?? STATUS_COLOR.no_disponible}`}>
                        {c.documentos}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs text-[#6B6760] max-w-xs">
                      {c.siguiente_accion}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {!coverage && (
        <div className="rounded-lg bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-sm text-[#6B6760]">
          Carga la cobertura para ver qué municipios pueden documentarse y cuáles deben bloquearse o degradarse.
        </div>
      )}
    </div>
  )
}
