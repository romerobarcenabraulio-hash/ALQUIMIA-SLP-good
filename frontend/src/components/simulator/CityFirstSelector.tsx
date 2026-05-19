'use client'

import { useEffect, useMemo, useState } from 'react'
import { getEstadosMx, getInegiMunicipalSourceAudit, getMunicipiosMx } from '@/lib/api'
import { ZMS } from '@/lib/constants'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import type { EstadoMxOption, InegiMunicipalSourceAudit, MunicipioMxApi } from '@/types'
import { MunicipioMadurezBanner } from '@/components/simulator/MunicipioMadurezBanner'
import { ReglamentoCargaCiudadPanel } from '@/components/simulator/ReglamentoCargaCiudadPanel'

export function CityFirstSelector({ compact }: { compact?: boolean } = {}) {
  const {
    zmActiva,
    applyMunicipioCatalog,
    cityContextLoading,
    cityPortalError,
    municipiosActivos,
    seleccionMunicipioCatalog,
  } = useSimulatorStore()

  const [estados, setEstados] = useState<EstadoMxOption[]>([])
  const [estadoId, setEstadoId] = useState<string>('')
  const [municipiosApi, setMunicipiosApi] = useState<MunicipioMxApi[]>([])
  const [municipioPick, setMunicipioPick] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingEstado, setLoadingEstado] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inegiAudit, setInegiAudit] = useState<InegiMunicipalSourceAudit | null>(null)
  const [inegiAuditLoading, setInegiAuditLoading] = useState(false)
  const [inegiAuditError, setInegiAuditError] = useState<string | null>(null)
  const zm = useMemo(() => ZMS.find(z => z.id === zmActiva), [zmActiva])
  const lecturaTerritorio = useMemo(
    () => getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva),
    [municipiosActivos, zmActiva],
  )

  useEffect(() => {
    let active = true
    getEstadosMx()
      .then((eds) => {
        if (!active) return
        setEstados(eds)
        setError(null)
      })
      .catch(err => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Catálogo de entidades no disponible')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!estadoId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMunicipiosApi([])
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMunicipioPick('')
      return
    }
    let active = true
    setLoadingEstado(true)
    getMunicipiosMx(estadoId)
      .then(rows => {
        if (!active) return
        setMunicipiosApi(rows)
        setMunicipioPick('')
      })
      .catch(err => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Municipios no disponibles')
      })
      .finally(() => {
        if (active) setLoadingEstado(false)
      })
    return () => { active = false }
  }, [estadoId])

  const onSelectMunicipio = (cve: string) => {
    setMunicipioPick(cve)
    setInegiAudit(null)
    setInegiAuditError(null)
    const row = municipiosApi.find(m => m.clave_inegi === cve)
    if (row) {
      applyMunicipioCatalog(row)
      setInegiAuditLoading(true)
      getInegiMunicipalSourceAudit(row.clave_inegi)
        .then(audit => setInegiAudit(audit))
        .catch(err => setInegiAuditError(err instanceof Error ? err.message : 'Auditoría INEGI no disponible'))
        .finally(() => setInegiAuditLoading(false))
    }
  }

  const Tag = compact ? 'div' : 'section'
  const cityLoaded = compact && municipiosActivos.length > 0 && seleccionMunicipioCatalog

  return (
    <Tag className={compact ? 'py-2' : 'section'} aria-labelledby="city-first-title">
      {!compact && (
        <>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Ciudad primero</p>
          <h2 id="city-first-title" className="font-serif text-[24px] text-[#1C1B18] mb-4">Estado y municipio de trabajo</h2>
        </>
      )}

      {/* ── Compact read-only badge when city is already loaded ─────────── */}
      {cityLoaded && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA]">
          <span className="flex-1 text-[12px] text-[#1C1B18] font-medium truncate">
            {seleccionMunicipioCatalog!.nombre}
          </span>
          <span className="text-[11px] text-[#A8A49C] shrink-0">{zmActiva}</span>
          <span className="text-[9px] uppercase tracking-wide text-[#A8A49C] shrink-0">
            Módulo 1 para cambiar
          </span>
        </div>
      )}

      {/* ── Full selector panel (used in Module 1 non-compact context) ───── */}
      {!cityLoaded && (
        <>
          {loading && (
            <div className={cn('rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] text-[12px] text-[#6B6760]', compact ? 'px-3 py-2' : 'px-4 py-3')}>
              Cargando catálogo municipal…
            </div>
          )}

          {!loading && error && (
            <div className={cn('rounded-[8px] border border-red-200 bg-red-50 text-[12px] text-red-800', compact ? 'px-3 py-2' : 'px-4 py-3')}>
              {error}
            </div>
          )}

          {!loading && !error && estados.length > 0 && (
            <div className={cn('rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] space-y-3', compact ? 'px-3 py-3' : 'px-4 py-4')}>
              {!compact && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B6760]">
                  Catálogo INEGI Estado–Municipio
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <label className="flex-1 flex flex-col gap-1 text-[11px] text-[#6B6760]">
                  Estado
                  <select
                    value={estadoId}
                    onChange={e => setEstadoId(e.target.value)}
                    className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px] text-[#1C1B18]"
                  >
                    <option value="">Selecciona entidad</option>
                    {estados.map(e => (
                      <option key={e.estado_id} value={e.estado_id}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex-1 flex flex-col gap-1 text-[11px] text-[#6B6760]">
                  Municipio
                  <select
                    value={municipioPick}
                    disabled={!estadoId || loadingEstado}
                    onChange={e => onSelectMunicipio(e.target.value)}
                    className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px] text-[#1C1B18] disabled:opacity-50"
                  >
                    <option value="">{loadingEstado ? 'Cargando…' : !estadoId ? 'Primero el estado' : 'Selecciona municipio'}</option>
                    {municipiosApi.map(m => (
                      <option key={m.clave_inegi} value={m.clave_inegi}>
                        {m.nombre} · CVE {m.clave_inegi} · {m.poblacion.toLocaleString('es-MX')} hab.
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {seleccionMunicipioCatalog?.datosEstimados && (
                <p className="rounded-[6px] border border-amber-300/80 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
                  Datos estimados — en proceso de validación oficial
                </p>
              )}
              {/* INEGI audit — collapsed by default in compact mode */}
              {(inegiAuditLoading || inegiAudit || inegiAuditError) && (
                compact ? (
                  <details className="text-[11px]">
                    <summary className="cursor-pointer text-[#6B6760] hover:text-[#1C1B18]">Auditoría INEGI</summary>
                    <div className="mt-2">
                      <InegiSourceStatusCard audit={inegiAudit} loading={inegiAuditLoading} error={inegiAuditError} />
                    </div>
                  </details>
                ) : (
                  <InegiSourceStatusCard audit={inegiAudit} loading={inegiAuditLoading} error={inegiAuditError} />
                )
              )}
              {municipiosActivos.length > 0 && zm && seleccionMunicipioCatalog && (
                <div className="space-y-2 pt-2 border-t border-[#E8E4DC]/80">
                  {compact ? (
                    <p className="text-[11px] text-[#6B6760]">
                      <span className="font-medium text-[#1C1B18]">Alcance: </span>{lecturaTerritorio}
                    </p>
                  ) : (
                    <p className="text-[11px] leading-relaxed text-[#6B6760]">
                      <span className="font-semibold text-[#1C1B18]">Alcance de lectura: </span>
                      {lecturaTerritorio}
                      {' · '}
                      <span className="text-[#5A574E]">
                        Referencia territorial <span className="font-mono text-[11px]">{zmActiva}</span> sólo ordena población y modelo;
                        obligaciones legales y operativas siguen siendo municipales.
                      </span>
                    </p>
                  )}
                  {compact ? (
                    <details className="text-[11px]">
                      <summary className="cursor-pointer text-[#6B6760] hover:text-[#1C1B18] select-none">Contexto de madurez municipal</summary>
                      <div className="mt-1">
                        <MunicipioMadurezBanner municipiosActivos={municipiosActivos} />
                      </div>
                    </details>
                  ) : (
                    <MunicipioMadurezBanner municipiosActivos={municipiosActivos} />
                  )}
                </div>
              )}
              {municipiosActivos.length > 0 && !compact && (
                <div className="pt-3 border-t border-[#E8E4DC]/80">
                  <ReglamentoCargaCiudadPanel />
                </div>
              )}
            </div>
          )}

          {!loading && !error && estados.length === 0 && (
            <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#8A857C]">
              No hay entidades federativas cargadas desde el servidor. Revisa conectividad o contrato API.
            </div>
          )}
        </>
      )}

      {cityContextLoading && (
        <p className="mt-2 text-[12px] text-[#8A857C]">Cargando contexto de la ciudad...</p>
      )}

      {!cityContextLoading && cityPortalError && (
        <div className={cn('mt-2 rounded-[8px] border border-red-200 bg-red-50 text-[12px] text-red-800', compact ? 'px-3 py-2' : 'px-4 py-3')}>
          {cityPortalError}
        </div>
      )}
    </Tag>
  )
}

function InegiSourceStatusCard({
  audit,
  loading,
  error,
}: {
  audit: InegiMunicipalSourceAudit | null
  loading: boolean
  error: string | null
}) {
  if (loading) {
    return (
      <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3 text-[12px] text-[#6B6760]">
        Verificando fuente INEGI del municipio…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-3 text-[12px] text-red-800">
        {error}
      </div>
    )
  }

  if (!audit) return null

  const denueBlocked = audit.denue_status === 'blocked_missing_token'

  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#6B6760]">
            Auditoría INEGI · CVE {audit.clave_inegi}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
            Censo: {audit.census_source}. DENUE: {denueBlocked ? 'bloqueado por token faltante' : 'configurado, sin consulta automática'}.
          </p>
        </div>
        <span
          className={cn(
            'rounded-full border px-2 py-0.5 text-[10px] font-medium',
            denueBlocked
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-[#3B6D11]/30 bg-[#EAF3DE] text-[#23470A]',
          )}
        >
          {denueBlocked ? 'DENUE bloqueado' : 'DENUE configurado'}
        </span>
      </div>
      {audit.blockers.length > 0 && (
        <p className="mt-2 rounded-[6px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-950">
          {audit.blockers.join(' ')}
        </p>
      )}
      <p className="mt-2 text-[11px] leading-relaxed text-[#8C8880]">{audit.next_action}</p>
      <p className="mt-1 text-[10px] leading-relaxed text-[#A8A49C]">
        No se hizo consulta live: {audit.live_query_performed ? 'sí' : 'no'}. DENUE documenta establecimientos; vivienda y población siguen por Censo/tabulados INEGI.
      </p>
    </div>
  )
}
