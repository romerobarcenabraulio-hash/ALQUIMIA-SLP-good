'use client'

import { useEffect, useState } from 'react'
import { BarChart3, Loader2, AlertCircle } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface SimulationStatsData {
  totalSimulations: number
  totalVersions: number
  totalOperations: number
  newestSimulation: {
    id: string
    name: string
    createdAt: string
  } | null
  mostRecentlyModified: {
    id: string
    name: string
    updatedAt: string
  } | null
}

interface SimulationStatsProps {
  tenantId?: string
  className?: string
}

export function SimulationStats({ tenantId, className }: SimulationStatsProps) {
  const [stats, setStats] = useState<SimulationStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
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

      const url = `${getApiUrl()}/simulations/stats/overview`
      const res = await fetch(url, { headers })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail ?? `Failed to load stats: HTTP ${res.status}`)
      }

      const data = await res.json()
      setStats(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={cn('rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-[#6B6760]" />
          <span className="ml-2 text-sm text-[#6B6760]">Loading statistics...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
        <div className="flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className={cn('rounded-lg border border-[#E8E4DC] bg-white p-5 space-y-4', className)}>
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-[#3B6D11]" />
        <h3 className="text-sm font-medium text-[#1C1B18]">Simulation Statistics</h3>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg bg-[#FDFCFA] border border-[#E8E4DC] p-3 text-center">
          <div className="text-2xl font-bold text-[#3B6D11]">{stats.totalSimulations}</div>
          <p className="text-xs text-[#6B6760] mt-1">Total Simulations</p>
        </div>
        <div className="rounded-lg bg-[#FDFCFA] border border-[#E8E4DC] p-3 text-center">
          <div className="text-2xl font-bold text-[#3B6D11]">{stats.totalVersions}</div>
          <p className="text-xs text-[#6B6760] mt-1">Versions</p>
        </div>
        <div className="rounded-lg bg-[#FDFCFA] border border-[#E8E4DC] p-3 text-center">
          <div className="text-2xl font-bold text-[#3B6D11]">{stats.totalOperations}</div>
          <p className="text-xs text-[#6B6760] mt-1">Operations</p>
        </div>
      </div>

      {stats.newestSimulation && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-xs font-medium text-green-700">Newest Simulation</p>
          <p className="text-xs text-green-600 mt-1">{stats.newestSimulation.name}</p>
          <p className="text-[10px] text-green-600 mt-0.5">
            {new Date(stats.newestSimulation.createdAt).toLocaleDateString()}
          </p>
        </div>
      )}

      {stats.mostRecentlyModified && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs font-medium text-blue-700">Most Recently Modified</p>
          <p className="text-xs text-blue-600 mt-1">{stats.mostRecentlyModified.name}</p>
          <p className="text-[10px] text-blue-600 mt-0.5">
            {new Date(stats.mostRecentlyModified.updatedAt).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  )
}
