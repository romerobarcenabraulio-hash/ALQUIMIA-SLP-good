'use client'

import { useEffect, useState, useMemo } from 'react'
import { Clock, RotateCcw, Eye, Loader2, AlertCircle } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface VersionInfo {
  id: string
  versionNumber: number
  createdAt: string
  createdBy: string
  checkpointName?: string
}

interface SimulationVersionTimelineProps {
  simulationId: string
  tenantId?: string
  onVersionSelected?: (versionId: string, versionNumber: number) => void
  className?: string
}

export function SimulationVersionTimeline({
  simulationId,
  tenantId,
  onVersionSelected,
  className,
}: SimulationVersionTimelineProps) {
  const [versions, setVersions] = useState<VersionInfo[]>([])
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    loadVersions()
  }, [simulationId])

  const loadVersions = async () => {
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

      const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}/versions`
      const res = await fetch(url, { headers })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail ?? `Failed to load versions: HTTP ${res.status}`)
      }

      const data = await res.json()
      setVersions(data.versions || [])

      // Select the latest version by default
      if (data.versions && data.versions.length > 0) {
        setSelectedVersion(data.versions[0].versionNumber)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const restoreVersion = async (versionId: string, versionNumber: number) => {
    setRestoring(true)
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

      const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}/restore/${versionId}`
      const res = await fetch(url, {
        method: 'POST',
        headers,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail ?? `Failed to restore version: HTTP ${res.status}`)
      }

      // Reload versions after restore
      await loadVersions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to restore version')
    } finally {
      setRestoring(false)
    }
  }

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => b.versionNumber - a.versionNumber)
  }, [versions])

  if (loading) {
    return (
      <div className={cn('rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-[#6B6760]" />
          <span className="ml-2 text-sm text-[#6B6760]">Loading version history...</span>
        </div>
      </div>
    )
  }

  if (sortedVersions.length === 0) {
    return (
      <div className={cn('rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
        <p className="text-sm text-[#6B6760]">No version history available yet.</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-4 w-4 text-[#3B6D11]" />
        <h3 className="text-sm font-medium text-[#1C1B18]">Version History</h3>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {sortedVersions.map((version, index) => {
          const createdDate = new Date(version.createdAt)
          const isLatest = index === 0
          const isSelected = selectedVersion === version.versionNumber

          return (
            <div
              key={version.id}
              className={cn(
                'rounded-lg border p-3 transition-all cursor-pointer',
                isSelected
                  ? 'bg-white border-[#3B6D11] shadow-sm'
                  : 'bg-white border-[#E8E4DC] hover:border-[#3B6D11]',
              )}
              onClick={() => {
                setSelectedVersion(version.versionNumber)
                onVersionSelected?.(version.id, version.versionNumber)
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-[#1C1B18]">
                      v{version.versionNumber}
                    </span>
                    {isLatest && (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700">
                        Latest
                      </span>
                    )}
                    {version.checkpointName && (
                      <span className="text-xs text-[#6B6760] italic">
                        {version.checkpointName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8E8980]">
                    {createdDate.toLocaleString()}
                  </p>
                  <p className="text-xs text-[#6B6760] mt-1">
                    By {version.createdBy}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    void restoreVersion(version.id, version.versionNumber)
                  }}
                  disabled={restoring || isLatest}
                  title={isLatest ? 'This is the current version' : 'Restore to this version'}
                  className={cn(
                    'p-1.5 rounded-lg transition-colors flex-shrink-0',
                    isLatest
                      ? 'bg-[#F0EDE5] text-[#8A857C] cursor-not-allowed'
                      : 'bg-[#EAF3DE] text-[#3B6D11] hover:bg-[#D5E8C1]',
                  )}
                >
                  {restoring ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-[#8E8980] border-t border-[#E8E4DC] pt-2 mt-2">
        Showing {sortedVersions.length} version{sortedVersions.length !== 1 ? 's' : ''}.
        Click on a version to view details or restore it.
      </p>
    </div>
  )
}
