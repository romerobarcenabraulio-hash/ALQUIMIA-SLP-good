'use client'

import { useEffect, useState } from 'react'
import { DataPoint } from '@/types/dataPoint'
import { getApiUrl } from '@/lib/api'

interface UseDataPointsByModuleOptions {
  tenantId?: string
  enabled?: boolean
}

interface UseDataPointsByModuleReturn {
  data: DataPoint[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch DataPoints for a specific module
 * Returns array of DataPoints from backend
 */
export function useDataPointsByModule(
  moduleId: string,
  options: UseDataPointsByModuleOptions = {}
): UseDataPointsByModuleReturn {
  const { tenantId, enabled = true } = options

  const [data, setData] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchDataPoints = async () => {
    if (!enabled) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      // Build query string
      const params = new URLSearchParams()
      params.append('module_id', moduleId)
      if (tenantId) {
        params.append('tenant_id', tenantId)
      }

      const apiUrl = getApiUrl()
      const url = `${apiUrl}/api/data-points?${params.toString()}`

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch data points: ${response.statusText}`)
      }

      const json = await response.json()
      setData(json.data || [])
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      setData([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!enabled) {
      setData([])
      return
    }

    fetchDataPoints()
  }, [moduleId, tenantId, enabled])

  return {
    data,
    loading,
    error,
    refetch: fetchDataPoints,
  }
}

/**
 * Hook to fetch a single DataPoint by ID
 */
export function useDataPoint(dataPointId: string, enabled = true) {
  const [data, setData] = useState<DataPoint | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!enabled || !dataPointId) {
      return
    }

    const fetchDataPoint = async () => {
      try {
        setLoading(true)
        setError(null)

        const apiUrl = getApiUrl()
        const url = `${apiUrl}/api/data-points/${dataPointId}`

        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch data point: ${response.statusText}`)
        }

        const json = await response.json()
        setData(json.data)
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        setError(error)
        setData(null)
      } finally {
        setLoading(false)
      }
    }

    fetchDataPoint()
  }, [dataPointId, enabled])

  return { data, loading, error }
}
