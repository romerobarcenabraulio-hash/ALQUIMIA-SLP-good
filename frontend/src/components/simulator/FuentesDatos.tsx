'use client'
/**
 * FuentesDatos — panel S2 del simulador.
 *
 * Muestra el estado REAL de cada fuente de datos consultando
 * GET /data/fuentes (no simula con Math.random()).
 *
 * Reglas:
 *   - Nunca reportar una fuente como "En vivo" si no fue verificada.
 *   - El tipo_maximo de cada fuente viene del backend; lo mostramos tal cual.
 *   - Si el endpoint /data/fuentes falla, mostramos error honesto — nunca
 *     inventamos estados de fuentes.
 */
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { getApiUrl } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'
import { fmt } from '@/lib/utils'
import type { FuenteStatus, FuenteTipo } from '@/types'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

// ─── Helpers de presentación ──────────────────────────────────────────────────

function tipoLabel(tipo: FuenteTipo): string {
  switch (tipo) {
    case 'oficial':       return 'En vivo'
    case 'certificado':   return 'Certificado'
    case 'estimado':      return 'Estimado'
    case 'manual':        return 'Manual'
    case 'no_disponible': return 'Sin dato'
  }
}

function disponibleLabel(fuente: FuenteStatus): string {
  if (!fuente.disponible) return 'Requiere clave API'
  if (fuente.tipo_maximo === 'oficial') return 'API disponible'
  if (fuente.tipo_maximo === 'certificado') return 'Datos offline'
  return 'Disponible'
}

// Dot color based on actual availability and tier
function dotColor(fuente: FuenteStatus): string {
  if (!fuente.disponible)            return 'bg-red-400'
  if (fuente.tipo_maximo === 'oficial')      return 'bg-green-500'
  if (fuente.tipo_maximo === 'certificado')  return 'bg-green-400'
  if (fuente.tipo_maximo === 'estimado')     return 'bg-yellow-400'
  return 'bg-orange-400'
}

// ─── Componente principal ─────────────────────────────────────────────────────

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; fuentes: FuenteStatus[] }
  | { status: 'error'; mensaje: string }

export function FuentesDatos({ variant = 'full' }: { variant?: 'full' | 'embedded' }) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const [state, setState] = useState<FetchState>({ status: 'idle' })
  const embedded = variant === 'embedded'

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ status: 'loading' })
    fetch(`${getApiUrl()}/data/fuentes`, withRequestId())
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data: FuenteStatus[] = await res.json()
        setState({ status: 'ok', fuentes: data })
      })
      .catch(err => {
        setState({
          status: 'error',
          mensaje: `No se pudo conectar con el backend: ${err instanceof Error ? err.message : String(err)}`,
        })
      })
  }, [zmActiva])

  return (
    <div data-variant={variant}>
      {embedded ? (
        <h3 className="font-serif text-[20px] text-[#1C1B18] mb-2">Fuentes consultadas</h3>
      ) : (
        <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Bibliografía y cálculos</h2>
      )}
      {!embedded && <ScopeAnclaKicker className="mb-2" />}
      <p className="text-[13px] text-[#6B6760] mb-1">
        Tier de confianza por fuente oficial o estimada.
      </p>
      <p className={embedded ? 'text-[11px] text-[#A8A49C] mb-4' : 'text-[11px] text-[#A8A49C] mb-6'}>
        ✓ Oficial — API verificada en esta sesión &nbsp;|&nbsp;
        ✓ Certificado — publicación oficial offline &nbsp;|&nbsp;
        ~ Estimado — modelo o proyección
      </p>

      {/* Estado de carga */}
      {state.status === 'loading' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border-t border-[#E8E4DC] pt-4 animate-pulse">
              <div className="h-3 bg-[#E8E4DC] rounded w-2/3 mb-2" />
              <div className="h-2 bg-[#E8E4DC] rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Error honesto — nunca simular en este caso */}
      {state.status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-[12px] p-4">
          <p className="text-[13px] font-medium text-red-800 mb-1">
            ✗ No se pudo obtener el estado de las fuentes
          </p>
          <p className="text-[12px] text-red-600">{state.mensaje}</p>
          <p className="text-[11px] text-red-500 mt-2">
            Los cálculos del simulador no se detienen por esto, pero no es posible
            verificar de qué fuentes provienen los datos en este momento.
          </p>
        </div>
      )}

      {/* Lista de fuentes reales */}
      {state.status === 'ok' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {state.fuentes.map(fuente => (
            <div
              key={fuente.id}
              className="border-t border-[#E8E4DC] pt-4"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 mt-0.5 ${dotColor(fuente)}`}
                    aria-hidden="true"
                  />
                  <p className="text-[12px] font-medium text-[#1C1B18] leading-snug">
                    {fuente.nombre.split('—')[0].trim()}
                  </p>
                </div>
                <ProvenanceBadge
                  tipo={fuente.tipo_maximo}
                  compact
                  className="flex-shrink-0"
                />
              </div>

              {/* Organismo */}
              <p className="text-[11px] text-[#6B6760] mb-1">
                {fuente.organismo}
              </p>

              {/* Disponibilidad */}
              <p className={[
                'text-[10px] font-medium',
                fuente.disponible ? 'text-green-700' : 'text-orange-700',
              ].join(' ')}>
                {disponibleLabel(fuente)}
              </p>

              {/* Endpoint */}
              {fuente.endpoint && (
                <p className="text-[9px] text-[#A8A49C] mt-1 font-mono truncate">
                  {fuente.endpoint}
                </p>
              )}

              {/* KPIs cubiertos */}
              <div className="flex flex-wrap gap-1 mt-2">
                {fuente.kpis_cubiertos.map(kpi => (
                  <span
                    key={kpi}
                    className="text-[9px] bg-[#F0EDE8] text-[#6B6760] px-1.5 py-0.5 rounded"
                  >
                    {kpi.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>

              {/* Advertencia si la requiere */}
              {fuente.advertencia && (
                <p className="text-[10px] text-yellow-700 mt-2 border-t border-[#E8E4DC] pt-2">
                  ⚠ {fuente.advertencia}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nota pie de página */}
      <p className="text-[10px] text-[#A8A49C] mt-4">
        La trazabilidad de datos es auditada por el motor backend en cada simulación.
        Ningún KPI se presenta como oficial sin fuente verificable en la sesión actual.
      </p>
    </div>
  )
}
