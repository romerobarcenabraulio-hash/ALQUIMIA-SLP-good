'use client'

import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'
import { getCityOptions } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import type { CityOption } from '@/types'

export function CityFirstSelector() {
  const { zmActiva, setZM, cityContext, cityContextLoading, portalError } = useSimulatorStore()
  const [options, setOptions] = useState<CityOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    getCityOptions()
      .then(data => {
        if (!active) return
        setOptions(data)
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

  return (
    <section className="section" aria-labelledby="city-first-title">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Ciudad primero</p>
      <h2 id="city-first-title" className="font-serif text-[24px] text-[#1C1B18] mb-4">Selecciona ciudad/ZM de trabajo</h2>

      {loading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#6B6760]">
          Cargando ciudades disponibles...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && options.length === 0 && (
        <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#8A857C]">
          No hay ciudades habilitadas en el contrato actual.
        </div>
      )}

      {!loading && !error && options.length > 0 && (
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
                  : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760] hover:bg-[#F0EDE5]'
              )}
            >
              <MapPin size={15} aria-hidden="true" />
              {option.nombre}
            </button>
          ))}
        </div>
      )}

      {cityContextLoading && (
        <p className="mt-3 text-[12px] text-[#8A857C]">Hidratando CityContext e invalidando baseline anterior...</p>
      )}

      {!cityContextLoading && cityContext && (
        <div className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
          <p className="text-[12px] font-semibold text-[#1C1B18]">{cityContext.nombre}</p>
          <p className="mt-1 text-[12px] text-[#6B6760]">{cityContext.legal_notice}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {cityContext.municipios.map(municipio => (
              <span key={municipio.municipio_id} className="rounded-[6px] bg-[#F0EDE5] px-2 py-1 text-[11px] text-[#6B6760]">
                {municipio.nombre} · legal por {municipio.legal_scope}
              </span>
            ))}
          </div>
        </div>
      )}

      {!cityContextLoading && portalError && (
        <div className="mt-3 rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-800">
          {portalError}
        </div>
      )}
    </section>
  )
}

