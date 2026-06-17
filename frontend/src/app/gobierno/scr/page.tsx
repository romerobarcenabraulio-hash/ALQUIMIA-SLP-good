'use client'

/**
 * ALQ-12 · SCR — Sistema de Cobertura RSU Nacional
 * Dashboard: mapa huella · semáforo honesto · ficha municipal · tablero estándares.
 * Patrón Minto/McKinsey: conclusión primero. WCAG 2.2 AA.
 */

import { useEffect, useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import type { MunicipioProfile, CoverageStatus } from '@/types'
import { getNationalMunicipios, getNationalCoverage } from '@/lib/api'
import { SemaforoCoberturaHonesto } from '@/components/simulator/SemaforoCoberturaHonesto'
import type { CoberturaRow } from '@/components/simulator/SemaforoCoberturaHonesto'
import { FichaMunicipal } from '@/components/simulator/FichaMunicipal'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'

const MexicoRsuFootprintMap = dynamic(
  () => import('@/components/simulator/MexicoRsuFootprintMap'),
  {
    ssr: false,
    loading: () => <p className="py-6 text-[13px] text-[#6B6760]">Preparando mapa RSU…</p>,
  },
)

// ── Constantes ────────────────────────────────────────────────────────────────

const ZM_OPTIONS = ['SLP', 'MTY', 'QRO', 'GDL', 'EXT'] as const

// ── Tablero de estándares ─────────────────────────────────────────────────────

interface TableroCoberturaEstandaresProps {
  profiles: MunicipioProfile[]
  coverageMap: Map<string, CoverageStatus>
}

const ETAPAS_LABEL: Record<string, string> = {
  no_iniciado:          'Sin iniciar',
  datos_basicos:        'Datos básicos',
  datos_certificados:   'Datos certificados',
  legal_localizado:     'Legal localizado',
  legal_verificado:     'Legal verificado',
  contrato_identificado:'Contrato ID',
  operacion_modelada:   'Operación modelada',
  documentos_borrador:  'Docs. borrador',
  documentos_defendibles:'Docs. defendibles',
  implementacion_activa:'Implementación activa',
}

const ETAPAS_ORDER = Object.keys(ETAPAS_LABEL)

function TableroCoberturaEstandares({ profiles, coverageMap }: TableroCoberturaEstandaresProps) {
  if (profiles.length === 0) return null

  const etapaCounts: Record<string, number> = {}
  for (const p of profiles) {
    etapaCounts[p.coverage_status] = (etapaCounts[p.coverage_status] ?? 0) + 1
  }

  return (
    <section aria-labelledby="scr-tablero-heading" className="space-y-3">
      <h2 id="scr-tablero-heading" className="text-[13px] font-semibold text-[#1C1B18]">
        Tablero de estándares — etapa SCR por municipio
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-[#E8E4DC]">
              <th scope="col" className="text-left py-1.5 pr-4 text-[10px] text-[#6B6760] font-semibold uppercase tracking-[0.05em]">
                Municipio
              </th>
              {ETAPAS_ORDER.map(e => (
                <th key={e} scope="col" className="py-1.5 px-1 text-center text-[9px] text-[#6B6760] font-medium whitespace-nowrap">
                  {ETAPAS_LABEL[e]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map(p => {
              const etapaIdx = ETAPAS_ORDER.indexOf(p.coverage_status)
              return (
                <tr key={p.municipio_id} className="border-b border-[#F4F2ED] hover:bg-[#F4F2ED]">
                  <td className="py-1.5 pr-4 font-medium text-[#1C1B18] whitespace-nowrap">{p.nombre}</td>
                  {ETAPAS_ORDER.map((e, i) => {
                    const reached = i <= etapaIdx
                    return (
                      <td key={e} className="py-1.5 px-1 text-center">
                        {reached ? (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full bg-[#3B6D11]"
                            aria-label={`${ETAPAS_LABEL[e]}: alcanzado`}
                          />
                        ) : (
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full bg-[#E8E4DC]"
                            aria-label={`${ETAPAS_LABEL[e]}: pendiente`}
                          />
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#E8E4DC]">
              <td className="py-1.5 pr-4 text-[10px] text-[#6B6760]">Total</td>
              {ETAPAS_ORDER.map(e => (
                <td key={e} className="py-1.5 px-1 text-center text-[10px] font-semibold text-[#1C1B18]">
                  {etapaCounts[e] ?? 0}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[10px] text-[#8A857C]">
        Punto verde = etapa alcanzada · punto gris = etapa pendiente. Las etapas son acumulativas.
      </p>
    </section>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────

export default function ScrPage() {
  const [zm, setZm] = useState<string>('SLP')
  const [profiles, setProfiles] = useState<MunicipioProfile[]>([])
  const [coverages, setCoverages] = useState<CoverageStatus[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  async function load(zmId: string) {
    setLoading(true)
    setError(null)
    setSelectedId(null)
    try {
      const [p, c] = await Promise.all([
        getNationalMunicipios(zmId),
        getNationalCoverage(zmId),
      ])
      setProfiles(p)
      setCoverages(c)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar datos de cobertura')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(zm) }, [zm])

  const coverageMap = useMemo(
    () => new Map(coverages.map(c => [c.municipio_id, c])),
    [coverages],
  )

  const profileMap = useMemo(
    () => new Map(profiles.map(p => [p.municipio_id, p])),
    [profiles],
  )

  const rows: CoberturaRow[] = useMemo(
    () => coverages.map(c => ({
      municipio_id: c.municipio_id,
      nombre: profileMap.get(c.municipio_id)?.nombre ?? c.municipio_id,
      demografia: c.demografia,
      rsu: c.rsu,
      legal: c.legal,
      contrato: c.contrato,
      presupuesto: c.presupuesto,
      operacion: c.operacion,
      bloqueos: c.bloqueos,
      siguiente_accion: c.siguiente_accion,
      agora_bloqueado: c.agora_bloqueado,
    })),
    [coverages, profileMap],
  )

  const totalRsu = useMemo(
    () => profiles.reduce((s, p) => s + (p.rsu_ton_dia ?? 0), 0),
    [profiles],
  )

  const selectedProfile = selectedId ? profileMap.get(selectedId) : null
  const selectedCoverage = selectedId ? coverageMap.get(selectedId) : null

  return (
    <div className="min-h-screen" style={{ background: '#F4F2ED' }}>
      <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">

        {/* Encabezado */}
        <header className="space-y-1">
          <p className="text-[10px] font-semibold text-[#6B6760] uppercase tracking-[0.08em]">
            Diagnóstico Nacional · SCR
          </p>
          <h1 className="text-[22px] font-bold text-[#1C1B18] leading-snug">
            Sistema de Cobertura RSU
          </h1>
          <p className="text-[13px] text-[#6B6760] max-w-prose">
            Mapa de huella · semáforo honesto · ficha municipal con procedencia · tablero de estándares.
          </p>
        </header>

        {/* Selector ZM + botón */}
        <div className="flex items-center gap-3 flex-wrap">
          <label htmlFor="zm-select" className="text-[11px] font-medium text-[#6B6760]">
            Zona Metropolitana:
          </label>
          <select
            id="zm-select"
            value={zm}
            onChange={e => setZm(e.target.value)}
            className="rounded-[6px] border border-[#D4C9B8] bg-white px-3 py-1.5 text-[12px] text-[#1C1B18] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11]"
          >
            {ZM_OPTIONS.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          <button
            onClick={() => load(zm)}
            disabled={loading}
            className="inline-flex min-h-[44px] items-center rounded-full border border-[#1C1B18] bg-[#1C1B18] px-4 text-[12px] font-medium text-white transition-colors hover:bg-[#3B6D11] hover:border-[#3B6D11] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B6D11]"
          >
            {loading ? 'Cargando…' : 'Actualizar'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
            {error}
          </div>
        )}

        {/* KPI resumen */}
        {profiles.length > 0 && (
          <KpiAnchorGrid
            columns={4}
            items={[
              { label: 'Municipios cargados', value: String(profiles.length) },
              { label: 'RSU total', value: `${totalRsu.toFixed(1)} ton/día` },
              { label: 'Con cobertura', value: String(coverages.length) },
              {
                label: 'Con bloqueo',
                value: String(coverages.filter(c => c.agora_bloqueado).length),
                figureClassName: coverages.some(c => c.agora_bloqueado) ? 'text-[#B91C1C]' : undefined,
              },
            ]}
          />
        )}

        {/* Mapa de huella nacional */}
        <section aria-labelledby="scr-mapa-heading" className="space-y-3">
          <h2 id="scr-mapa-heading" className="text-[13px] font-semibold text-[#1C1B18]">
            Mapa de huella RSU
          </h2>
          <MexicoRsuFootprintMap />
        </section>

        {/* Semáforo de cobertura */}
        <SemaforoCoberturaHonesto
          rows={rows}
          onSelect={setSelectedId}
          selectedId={selectedId}
        />

        {/* Ficha municipal — se muestra al seleccionar */}
        {selectedProfile && (
          <FichaMunicipal
            profile={selectedProfile}
            coverage={selectedCoverage ?? undefined}
            onClose={() => setSelectedId(null)}
          />
        )}

        {/* Tablero de estándares */}
        <TableroCoberturaEstandares profiles={profiles} coverageMap={coverageMap} />

        {/* Nota metodológica */}
        <footer className="border-t border-[#E8E4DC] pt-4">
          <p className="text-[10px] text-[#8A857C] leading-relaxed max-w-prose">
            SCR — Sistema de Cobertura RSU · datos de referencia INEGI MGN 2022 + fuentes estatales.
            Los valores estimados o localizados requieren verificación documental antes de usarse en propuestas de inversión.
            Procedencia enlazada por campo en cada ficha municipal.
          </p>
        </footer>

      </div>
    </div>
  )
}
