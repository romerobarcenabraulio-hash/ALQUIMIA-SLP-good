'use client'

import { useEffect, useState } from 'react'
import { Activity, Loader2, AlertCircle } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface AuditLogEntry {
  id: string
  action: string
  actor_id: string
  success: boolean
  message: string
  timestamp: string
  details?: Record<string, unknown>
  duration_ms?: number
}

interface SimulationActivityLogProps {
  simulationId: string
  tenantId?: string
  className?: string
  maxEntries?: number
}

const ACTION_ICONS: Record<string, { bg: string; text: string; label: string }> = {
  simulation_saved: { bg: 'bg-green-100', text: 'text-green-700', label: '💾 Saved' },
  simulation_loaded: { bg: 'bg-blue-100', text: 'text-blue-700', label: '📂 Loaded' },
  simulation_restored: { bg: 'bg-purple-100', text: 'text-purple-700', label: '⏮️ Restored' },
  export_generated: { bg: 'bg-orange-100', text: 'text-orange-700', label: '📤 Exported' },
  import_processed: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: '📥 Imported' },
  error_occurred: { bg: 'bg-red-100', text: 'text-red-700', label: '⚠️ Error' },
}

export function SimulationActivityLog({
  simulationId,
  tenantId,
  className,
  maxEntries = 10,
}: SimulationActivityLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadActivityLog()
  }, [simulationId, maxEntries])

  const loadActivityLog = async () => {
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

      const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}/audit-logs?limit=${maxEntries}`
      const res = await fetch(url, { headers })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail ?? `Failed to load activity: HTTP ${res.status}`)
      }

      const data = await res.json()
      setLogs(data.logs || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load activity log')
    } finally {
      setLoading(false)
    }
  }

  const getActionInfo = (action: string) => {
    return ACTION_ICONS[action] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      label: action.replace(/_/g, ' '),
    }
  }

  if (loading) {
    return (
      <div className={cn('rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-[#6B6760]" />
          <span className="ml-2 text-sm text-[#6B6760]">Loading activity...</span>
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

  return (
    <div className={cn('space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-[#3B6D11]" />
        <h3 className="text-sm font-medium text-[#1C1B18]">Activity Log</h3>
      </div>

      {logs.length === 0 ? (
        <p className="text-xs text-[#6B6760] text-center py-6">
          Activity log will appear here as you use this simulation.
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.slice(0, maxEntries).map((log) => {
            const info = getActionInfo(log.action)
            const timestamp = new Date(log.timestamp)

            return (
              <div
                key={log.id}
                className="rounded-lg border border-[#E8E4DC] bg-white p-2.5 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('px-2 py-1 rounded-full text-[10px] font-medium', info.bg, info.text)}>
                        {info.label}
                      </span>
                      {log.duration_ms && (
                        <span className="text-[#8E8980]">{log.duration_ms}ms</span>
                      )}
                    </div>
                    <p className="text-[#6B6760]">{log.message}</p>
                    <p className="text-[#8E8980] mt-1">
                      {timestamp.toLocaleString()}
                    </p>
                  </div>
                  {!log.success && (
                    <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-1 rounded">
                      Failed
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-[10px] text-[#8E8980] border-t border-[#E8E4DC] pt-2 mt-2">
        Activity logs help you track changes and understand simulation history.
      </p>
    </div>
  )
}
