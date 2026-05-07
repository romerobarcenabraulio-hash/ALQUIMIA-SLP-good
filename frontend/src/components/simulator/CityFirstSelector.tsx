'use client'

import { useEffect, useMemo, useState } from 'react'
import { MapPin } from 'lucide-react'
import { getCityOptions, getEstadosMx, getMunicipiosMx } from '@/lib/api'
import { ZMS } from '@/lib/constants'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import type { CityOption, EstadoMxOption, MunicipioContext, MunicipioMxApi } from '@/types'
import { MunicipioMadurezBanner } from '@/components/simulator/MunicipioMadurezBanner'

export function CityFirstSelector() {
  const {
    zmActiva,
    setZM,
    applyMunicipioCatalog,
    cityContext,
    cityContextLoading,
    portalError,
    municipiosActivos,
    setMunicipiosPrograma,
    seleccionMunicipioCatalog,
  } = useSimulatorStore()

  const [options, setOptions] = useState<CityOption[]>([])
  const [estados, setEstados] = useState<EstadoMxOption[]>([])
  const [estadoId, setEstadoId] = useState<string>('')
  const [municipiosApi, setMunicipiosApi] = useState<MunicipioMxApi[]>([])
  const [municipioPick, setMunicipioPick] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [loadingEstado, setLoadingEstado] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const zm = useMemo(() => ZMS.find(z => z.id === zmActiva), [zmActiva])

  const municipiosChips = useMemo((): MunicipioContext[] => {
    if (cityContext?.municipios?.length) return cityContext.municipios
    if (!zm) return []
    return zm.municipios.map(m => ({
      municipio_id: m.id,
      nombre: m.nombre,
      estado: zm.estado,
      legal_scope: 'municipio',
      jurisdiction_scope: 'Municipality',
    }))
  }, [cityContext, zm])

  const allZmSelected =
    zm != null &&
    municipiosActivos.length === zm.municipios.length &&
    zm.municipios.every(m => municipiosActivos.includes(m.id))

  useEffect(() => {
    let active = true
    Promise.all([getCityOptions(), getEstadosMx()])
      .then(([cities, eds]) => {
        if (!active) return
        setOptions(cities)
        setEstados(eds)
        setError(null)
      })
      .catch(err => {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Ciudades no disponibles')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!estadoId) {
      setMunicipiosApi([])
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
    const row = municipiosApi.find(m => m.clave_inegi === cve)
    if (row) applyMunicipioCatalog(row)
  }

  return (
    <section className="section" aria-labelledby="city-first-title">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Ciudad primero</p>
      <h2 id="city-first-title" className="font-serif text-[24px] text-[#1C1B18] mb-4">Estado y municipio de trabajo</h2>

      {loading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#6B6760]">
          Cargando catálogo municipal…
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && estados.length > 0 && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-4 space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B6760]">
            Selector INEGI (Q-009)
          </p>
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
        </div>
      )}

      {!loading && !error && options.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] uppercase tracking-[0.05em] text-[#A8A49C] mb-2">Acceso rápido por zona metropolitana</p>
          <div className="flex flex-wrap gap-2">
            {options.map(option => (
              <button
                key={option.city_id}
                type="button"
                onClick={() => setZM(option.city_id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[8px] border px-4 py-2 text-[13px] font-medium transition-colors',
                  zmActiva === option.city_id
                    ? 'border-[#3B6D11] bg-[#3B6D11] text-white'
                    : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760] hover:bg-[#F0EDE5]',
                )}
              >
                <MapPin size={15} aria-hidden="true" />
                {option.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && options.length === 0 && estados.length === 0 && (
        <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#8A857C]">
          No hay ciudades habilitadas en el contrato actual.
        </div>
      )}

      {!loading && !error && options.length > 0 && municipiosChips.length > 0 && zm && (
        <div className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B6760]">
            Ámbito del programa (Q-024)
          </p>
          <p className="mt-1 text-[12px] text-[#6B6760] leading-snug">
            Las toneladas y KPIs financieros se escalan a la población del subconjunto municipal elegido respecto al total de la ZM.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMunicipiosPrograma(zm.municipios.map(m => m.id))}
              className={cn(
                'rounded-[6px] border px-3 py-1.5 text-[11px] font-medium transition-colors',
                allZmSelected
                  ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]'
                  : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:bg-[#F0EDE5]',
              )}
            >
              ZM completa
            </button>
            {municipiosChips.map(municipio => {
              const alone =
                municipiosActivos.length === 1 && municipiosActivos[0] === municipio.municipio_id
              return (
                <button
                  key={municipio.municipio_id}
                  type="button"
                  onClick={() => setMunicipiosPrograma([municipio.municipio_id])}
                  className={cn(
                    'rounded-[6px] border px-3 py-1.5 text-[11px] text-left transition-colors max-w-[220px]',
                    alone
                      ? 'border-[#3B6D11] bg-[#3B6D11] text-white'
                      : 'border-[#E8E4DC] bg-white text-[#6B6760] hover:border-[#C8C2B8]',
                  )}
                >
                  <span className="font-medium">{municipio.nombre}</span>
                  <span className={cn('block text-[9px] mt-0.5', alone ? 'text-white/85' : 'text-[#A8A49C]')}>
                    Solo este municipio · obligaciones {municipio.legal_scope}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {zm && municipiosActivos.length > 0 && <MunicipioMadurezBanner municipiosActivos={municipiosActivos} />}

      {cityContextLoading && (
        <p className="mt-3 text-[12px] text-[#8A857C]">Cargando contexto de la ciudad...</p>
      )}

      {!cityContextLoading && portalError && (
        <div className="mt-3 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-800">
          {portalError}
        </div>
      )}
    </section>
  )
}
