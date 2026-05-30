'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TenantDiagnosticData } from '@/lib/tenantDiagnosticData'

export function useTenantData(tenantId: string | null) {
  const [data, setData] = useState<TenantDiagnosticData | null>(null)
  const [loading, setLoading] = useState(Boolean(tenantId))
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(() => {
    if (!tenantId) {
      setData(null)
      setLoading(false)
      return () => {}
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/tenants/${encodeURIComponent(tenantId)}/data`)
      .then(async response => {
        const body = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(body.detail ?? `HTTP ${response.status}`)
        return body as TenantDiagnosticData
      })
      .then(next => { if (!cancelled) setData(next) })
      .catch(exc => { if (!cancelled) setError(exc instanceof Error ? exc.message : 'No se pudo cargar tenant data') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [tenantId])

  useEffect(() => reload(), [reload])

  return { data, loading, error, reload }
}
