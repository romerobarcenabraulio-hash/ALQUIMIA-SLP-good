'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Loader2, AlertCircle, X } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Difference {
  field: string
  oldValue: unknown
  newValue: unknown
  changed: boolean
}

interface VersionComparisonProps {
  simulationId: string
  version1Id: string
  version1Number: number
  version2Id: string
  version2Number: number
  tenantId?: string
  onClose?: () => void
}

export function VersionComparison({
  simulationId,
  version1Id,
  version1Number,
  version2Id,
  version2Number,
  tenantId,
  onClose,
}: VersionComparisonProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [differences, setDifferences] = useState<Difference[]>([])

  useEffect(() => {
    loadComparison()
  }, [simulationId, version1Id, version2Id])

  const loadComparison = async () => {
    setLoading(true)
    setError(null)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}/compare/${version1Id}/with/${version2Id}`
      const res = await fetch(url, { headers })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail ?? `Failed to load comparison: HTTP ${res.status}`)
      }

      const data = await res.json()
      setDifferences(data.differences || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load comparison')
    } finally {
      setLoading(false)
    }
  }

  const formatValue = (val: unknown): string => {
    if (val === null || val === undefined) return '(empty)'
    if (typeof val === 'object') return JSON.stringify(val).substring(0, 100) + (JSON.stringify(val).length > 100 ? '...' : '')
    return String(val)
  }

  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#1C1B18]">Version Comparison</h3>
          <span className="text-xs text-[#6B6760] bg-[#FDFCFA] px-2 py-1 rounded">
            v{version1Number}
            <ArrowRight className="inline h-3 w-3 mx-1" />
            v{version2Number}
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F4F2ED] rounded-lg transition-colors"
          >
            <X className="h-4 w-4 text-[#6B6760]" />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#6B6760]" />
          <span className="ml-2 text-sm text-[#6B6760]">Loading comparison...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && differences.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-[#6B6760]">
            No differences between these versions
          </p>
        </div>
      )}

      {!loading && !error && differences.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <p className="text-xs text-[#6B6760] font-medium">
            {differences.length} field{differences.length !== 1 ? 's' : ''} changed
          </p>

          {differences.map((diff, index) => (
            <div
              key={`${diff.field}-${index}`}
              className="rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-3"
            >
              <p className="text-xs font-semibold text-[#1C1B18] mb-2">
                {diff.field}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-red-50 border border-red-200 rounded p-2">
                  <p className="text-red-700 font-medium mb-1">Before (v{version1Number})</p>
                  <p className="text-red-600 font-mono text-[11px] break-words">
                    {formatValue(diff.oldValue)}
                  </p>
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-2">
                  <p className="text-green-700 font-medium mb-1">After (v{version2Number})</p>
                  <p className="text-green-600 font-mono text-[11px] break-words">
                    {formatValue(diff.newValue)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
