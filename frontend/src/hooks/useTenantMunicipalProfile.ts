'use client'

import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import {
  fetchTenantMunicipalProfile,
  tenantIdForMunicipio,
  type TenantMunicipalProfileResponse,
} from '@/lib/tenantMunicipalProfile'

export function useTenantMunicipalProfile() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const tenantId = useMemo(() => tenantIdForMunicipio(municipiosActivos), [municipiosActivos])
  const [data, setData] = useState<TenantMunicipalProfileResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchTenantMunicipalProfile(tenantId)
      .then(next => { if (!cancelled) setData(next) })
      .catch(exc => {
        if (!cancelled) {
          setData(null)
          setError(exc instanceof Error ? exc.message : 'No se pudo cargar perfil municipal')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenantId])

  return { tenantId, data, profile: data?.profile ?? null, loading, error }
}
