'use client'

import { Fragment, useMemo, useState } from 'react'
import { getApiUrl, downloadExecutivePdf } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'
import { useSimulatorStore } from '@/store/simulatorStore'
import { EXPORT_SIMULATION_FOOTER_LINE } from '@/lib/simulationDisclaimer'
import { AvisoMunicipioAncla } from '@/components/simulator/AvisoMunicipioAncla'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import type { ExportResponse } from '@/types'
import { snapshotFuentesUsadas } from '@/lib/snapshotFuentes'

type ExportSection =
  | 'infraestructura'
  | 'macrogeneradores'
  | 'flujos'
  | 'roadmap'
  | 'portal_empresarial'

const SECTION_LABELS: Record<ExportSection, string> = {
  infraestructura: 'Infraestructura',
  macrogeneradores: 'Macrogeneradores',
  flujos: 'Flujos de residuos',
  roadmap: 'Hoja de ruta',
  portal_empresarial: 'Portal empresarial',
}

const CAUSAL = [
  'Selección de módulos',
  'Configuración de formato',
  'Previsualización de secciones',
  'Descarga / distribución',
]

export function ExportadorReporte() {
  const resultados = useSimulatorStore(s => s.resultados)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const snapshotDatos = useSimulatorStore(s => s.snapshotDatos)
  const seleccion = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipioId = municipiosActivos[0] ?? ''
  const [municipioNombre, setMunicipioNombre] = useState('San Luis Potosí')
  const [secciones, setSecciones] = useState<ExportSection[]>([])
  const [formato, setFormato] = useState<'pdf' | 'excel'>('pdf')
  const [incluirTrazabilidad, setIncluirTrazabilidad] = useState(true)
  const [incluirAdvertencias, setIncluirAdvertencias] = useState(true)
  const [loading, setLoading] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExportResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<object | null>(null)

  const isEmpty = !loading && !error && !result

  function toggleSection(section: ExportSection) {
    setSecciones(prev => (prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]))
  }

  async function run(payload: object) {
    setLoading(true)
    setError(null)
    try {
      const API_BASE = getApiUrl()
      const res = await fetch(`${API_BASE}/export/report`, withRequestId({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }))
      if (res.status === 403) {
        setResult(null)
        setError('Acceso restringido · se requiere rol técnico o superior para exportar reportes.')
        return
      }
      if (!res.ok) throw new Error(await res.text())
      const data = (await res.json()) as ExportResponse
      setResult(data)
    } catch (e) {
      setResult(null)
      setError(e instanceof Error ? e.message : 'Incidencia operativa al generar previsualización de exportación')
    } finally {
      setLoading(false)
    }
  }

  async function handleDownloadPdf() {
    if (!resultados) {
      setError('Complete la línea base y el modelo financiero antes de exportar PDF.')
      return
    }
    setPdfLoading(true)
    setError(null)
    try {
      const seccionTxt =
        sortedSections.length > 0
          ? sortedSections.map(s => SECTION_LABELS[s]).join(' · ')
          : 'Reporte ejecutivo integrado'
      await downloadExecutivePdf({
        zm: zmActiva,
        municipio_id: municipioId || zmActiva,
        municipio_nombre: municipioNombre || seleccion?.nombre || zmActiva,
        module_label: `Expediente cabildo — ${seccionTxt}`,
        resultados: {
          tir: resultados.tir,
          vpn: resultados.vpn,
          capex_total: resultados.capexTotal,
          payback_meses: resultados.paybackMeses,
          empleos_directos: resultados.empleosTotalesDirectos,
          co2e_evitadas_anual: resultados.co2eEvitadasAnualTon,
          ingresos_brutos: resultados.ingresosBrutos,
        },
        snapshot_datos: snapshotDatos
          ? {
              score_datos: snapshotDatos.score_datos,
              advertencias: snapshotDatos.advertencias?.map(a => a.advertencia) ?? [],
              fuentes_usadas: snapshotFuentesUsadas(snapshotDatos),
            }
          : null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo generar el PDF')
    } finally {
      setPdfLoading(false)
    }
  }

  async function handleExport() {
    const payload = {
      municipio_id: municipioId,
      municipio_nombre: municipioNombre,
      secciones,
      formato,
      incluir_trazabilidad: incluirTrazabilidad,
      incluir_advertencias: incluirAdvertencias,
    }
    setLastPayload(payload)
    await run(payload)
  }

  const sortedSections = useMemo(
    () => [...secciones].sort((a, b) => SECTION_LABELS[a].localeCompare(SECTION_LABELS[b])),
    [secciones],
  )

  return (
    <section
      id="sim-exportador-reporte"
      className="scroll-mt-28 space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5"
    >
      <h2 className="font-serif text-[24px] text-[#1C1B18]">
        Exportación de reporte ejecutivo · <span className="text-[#6B6860] text-[14px]">propuesta</span>
      </h2>

      <ScopeAnclaKicker className="mt-2" />
      <AvisoMunicipioAncla ids={municipiosActivos} />

      <div className="flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {CAUSAL.map((step, i, arr) => (
          <Fragment key={step}>
            <span className="bg-[#F0EDE5] rounded px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </Fragment>
        ))}
      </div>

      <div className="mb-6 rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4 space-y-3">
        <label className="block text-[13px] text-[#6B6860] mb-1">
          Municipio
          <input
            value={municipioNombre}
            onChange={e => setMunicipioNombre(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-[12px]"
          />
        </label>

        <div>
          <p className="text-[12px] font-semibold text-[#1C1B18]">Secciones</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {(Object.keys(SECTION_LABELS) as ExportSection[]).map(section => (
              <label key={section} className="inline-flex items-center gap-2 text-[13px] text-[#6B6860] mb-1">
                <input
                  type="checkbox"
                  checked={secciones.includes(section)}
                  onChange={() => toggleSection(section)}
                />
                {SECTION_LABELS[section]}
              </label>
            ))}
          </div>
          {sortedSections.length > 0 && (
            <p className="mt-2 text-[11px] text-[#6B6860]">
              Seleccionadas: {sortedSections.map(s => SECTION_LABELS[s]).join(', ')}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3 text-[13px] text-[#6B6860]">
          <label className="inline-flex items-center gap-2">
            <input type="radio" checked={formato === 'pdf'} onChange={() => setFormato('pdf')} />
            PDF
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="radio" checked={formato === 'excel'} onChange={() => setFormato('excel')} />
            Excel
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={incluirTrazabilidad} onChange={e => setIncluirTrazabilidad(e.target.checked)} />
            Incluir trazabilidad
          </label>
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" checked={incluirAdvertencias} onChange={e => setIncluirAdvertencias(e.target.checked)} />
            Incluir advertencias
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || secciones.length === 0}
            className="rounded-lg border border-[#E8E4DC] bg-white px-4 py-2 text-[12px] font-medium text-[#6B6760] disabled:opacity-50"
          >
            {loading ? 'Previsualizando…' : 'Previsualizar secciones'}
          </button>
          {formato === 'pdf' ? (
            <button
              type="button"
              onClick={() => void handleDownloadPdf()}
              disabled={pdfLoading || !resultados}
              className="rounded-lg bg-[#2D7A0A] px-4 py-2 text-[12px] font-medium text-white disabled:opacity-50"
            >
              {pdfLoading ? 'Generando PDF…' : 'Descargar PDF ejecutivo'}
            </button>
          ) : (
            <a
              href="/hub"
              className="rounded-lg bg-[#1A5FA8] px-4 py-2 text-[12px] font-medium text-white inline-flex items-center"
            >
              Abrir Hub — Excel CFO
            </a>
          )}
        </div>
        <p className="text-[11px] text-[#6B6860]">
          {EXPORT_SIMULATION_FOOTER_LINE} PDF en Times New Roman vía pipeline de consultoría ALQUIMIA.
        </p>
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4">
              <div className="h-3 bg-[#E8E4DC] rounded w-2/3" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-5/6" />
              <div className="mt-2 h-3 bg-[#E8E4DC] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="rounded-lg border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
          Selecciona al menos una sección para previsualizar el reporte.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
          <p className="font-semibold">Incidencia operativa</p>
          <p>{error}</p>
          {lastPayload && (
            <button
              type="button"
              onClick={() => run(lastPayload)}
              className="mt-2 rounded-lg border border-red-300 bg-white px-3 py-1 text-[12px]"
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {result?.status === 'blocked' && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-[12px] text-amber-900">
          {result.blockers.map(blocker => <p key={blocker}>{blocker}</p>)}
        </div>
      )}

      {result && result.status !== 'blocked' && (
        <div className="space-y-3">
          {result.secciones_exportadas.map(section => (
            <div key={section.nombre} className="rounded-lg border border-[#E8E4DC] bg-white p-4">
              <p className="text-[13px] font-bold text-[#1C1B18]">{section.titulo}</p>
              <p className="mt-1 text-[12px] text-[#6B6760]">{section.resumen}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(section.datos_clave).map(([k, v]) => (
                  <span key={k} className="rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-2 py-0.5 text-[11px] text-[#6B6760]">
                    {k}={v}
                  </span>
                ))}
              </div>
              {section.trazabilidad && (
                <div className="mt-2 rounded-lg border border-[#E8E4DC] bg-[#F5F3EE] p-2 text-[12px] text-[#6B6760]">
                  ƒ {section.trazabilidad}
                </div>
              )}
              {section.advertencias.length > 0 && (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[12px] text-amber-900">
                  {section.advertencias.map(w => <p key={w}>{w}</p>)}
                </div>
              )}
            </div>
          ))}

          <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-3 text-[12px] text-[#6B6760]">
            <p>Fecha: {result.metadata.fecha_generacion}</p>
            <p>Versión: {result.metadata.version}</p>
            <p>Total secciones: {result.metadata.total_secciones}</p>
          </div>

          <div className="rounded-lg border border-[#E8E4DC] bg-[#FFFDF9] p-3 text-[11px] italic text-[#6B6760]">
            {EXPORT_SIMULATION_FOOTER_LINE}
          </div>
        </div>
      )}
    </section>
  )
}
