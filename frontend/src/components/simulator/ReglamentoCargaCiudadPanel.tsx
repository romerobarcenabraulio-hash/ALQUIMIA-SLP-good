'use client'

import { useEffect, useMemo, useState } from 'react'
import { getApiUrl, getLegalSourceManifest } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import type { MunicipalLegalSourceManifest } from '@/types'

type RowState = {
  mid: string
  manifest: MunicipalLegalSourceManifest | null
  fetchError: string | null
}

function chipForRow(row: RowState): { label: string; className: string } {
  if (row.fetchError) {
    return { label: 'Error de consulta', className: 'border-red-300 bg-red-50 text-red-900' }
  }
  if (!row.manifest) {
    return { label: 'Sin catálogo legal', className: 'border-[#C0392B]/30 bg-[#FBEAEA] text-[#C0392B]' }
  }
  switch (row.manifest.ingest_status) {
    case 'no_disponible':
      return { label: 'Fuente no localizada', className: 'border-[#D4881E]/35 bg-[#FEF7E7] text-[#B8730F]' }
    case 'localizado':
      return { label: 'Localizado', className: 'border-[#1A5FA8]/25 bg-[#EBF3FB] text-[#1A5FA8]' }
    case 'descargado':
      return { label: 'Descargado', className: 'border-[#3B6D11]/30 bg-[#EAF3DE] text-[#23470A]' }
  }
}

export function ReglamentoCargaCiudadPanel() {
  const { municipiosActivos, zmActiva, seleccionMunicipioCatalog } = useSimulatorStore()
  const [rows, setRows] = useState<RowState[]>([])
  const [loading, setLoading] = useState(false)

  const depsKey = useMemo(() => [...municipiosActivos].sort().join('|'), [municipiosActivos])

  useEffect(() => {
    if (!depsKey) {
      setRows([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    const t = window.setTimeout(() => {
      void Promise.all(
        municipiosActivos.map(async (mid) => {
          try {
            const manifest = await getLegalSourceManifest(mid)
            return { mid, manifest, fetchError: null as string | null }
          }
          catch (e) {
            return {
              mid,
              manifest: null as MunicipalLegalSourceManifest | null,
              fetchError: e instanceof Error ? e.message : 'Error desconocido',
            }
          }
        }),
      )
        .then((list) => {
          if (!cancelled) setRows(list)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 400)
    return () => {
      cancelled = true
      window.clearTimeout(t)
    }
  }, [depsKey, municipiosActivos])

  const base = getApiUrl()

  return (
    <div id="panel-reglamento-ciudad" className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B6760]">
            Reglamento municipal · estado por ciudad activa
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-[#6B6760]">
            Referencia ZM{' '}
            <span className="font-mono text-[11px]">{zmActiva}</span>
            . Las etiquetas provienen de{' '}
            <span className="font-mono text-[10px]">GET /legal/{'{municipio}'}/source-manifest</span>
            {' '}(404 = sin registro en el repositorio backend).
          </p>
        </div>
        {loading && (
          <span className="text-[10px] text-[#A8A49C]">Consultando manifiestos…</span>
        )}
      </div>

      <div className="space-y-2">
        {rows.map((row) => {
          const chip = chipForRow(row)
          const etiqueta = seleccionMunicipioCatalog?.municipioSimulatorId === row.mid
            ? seleccionMunicipioCatalog.nombre
            : row.mid.toUpperCase()
          return (
            <div
              key={row.mid}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#EDE9E2] bg-[#FAF9F7] px-2 py-2"
            >
              <div className="min-w-0">
                <p className="text-[12px] font-medium text-[#1C1B18] truncate">{etiqueta}</p>
                <p className="font-mono text-[10px] text-[#A8A49C]">{row.mid}</p>
                {row.fetchError && (
                  <p className="mt-1 text-[10px] text-red-800">{row.fetchError}</p>
                )}
                {!row.fetchError && row.manifest?.next_action && (
                  <p className="mt-1 text-[10px] text-[#6B6760]">
                    <span className="font-medium text-[#1C1B18]">Siguiente paso (API): </span>
                    {row.manifest.next_action}
                  </p>
                )}
              </div>
              <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0', chip.className)}>
                {chip.label}
              </span>
            </div>
          )
        })}
      </div>

      <details className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-[#6B6760] outline-none hover:text-[#1C1B18]">
          Instrucciones para agentes (ingesta / alta de reglamento)
        </summary>
        <div className="mt-2 space-y-2 text-[11px] leading-relaxed text-[#6B6760] border-t border-[#EDE9E2] pt-2">
          <ol className="list-decimal pl-4 space-y-2">
            <li>
              <span className="font-medium text-[#1C1B18]">Alta administrativa del texto normativo: </span>
              <span className="font-mono text-[10px]">POST {base}/legal/{'{municipio}'}/reglamento</span>
              {' '}(rol admin). Persiste el registro base del reglamento en el repositorio legal interno.
            </li>
            <li>
              <span className="font-medium text-[#1C1B18]">Localización de fuente oficial y metadatos: </span>
              <span className="font-mono text-[10px]">POST {base}/legal/{'{municipio}'}/source-manifest</span>
              {' '}con cuerpo JSON acorde a{' '}
              <span className="font-mono text-[10px]">LegalSourceIngestRequest</span>
              {' '}(p. ej.{' '}
              <span className="font-mono text-[10px]">official_url</span>
              ,{' '}
              <span className="font-mono text-[10px]">title</span>
              ,{' '}
              <span className="font-mono text-[10px]">download_url</span>
              {' '}si aplica). Actualiza{' '}
              <span className="font-mono text-[10px]">ingest_status</span>
              {' '}(
              <span className="font-mono text-[10px]">no_disponible</span>
              {' → '}
              <span className="font-mono text-[10px]">localizado</span>
              {' / '}
              <span className="font-mono text-[10px]">descargado</span>
              ).
            </li>
            <li>
              <span className="font-medium text-[#1C1B18]">Catálogo en código: </span>
              revisar definición de municipios y artefactos en{' '}
              <span className="font-mono text-[10px]">backend/app/legal/repository.py</span>
              {' '}antes de esperar filas en{' '}
              <span className="font-mono text-[10px]">GET /legal/zm/{'{zm}'}/paquete</span>.
            </li>
          </ol>
          <p className="text-[10px] text-[#8A857C] pt-1">
            Meta de cobertura: extender de forma sistemática el inventario municipal en el repositorio legal para avanzar hacia
            cobertura nacional de fuentes localizadas y trazables, siempre con revisión institucional competente fuera de ALQUIMIA.
          </p>
        </div>
      </details>
    </div>
  )
}
