'use client'

import { useState, useEffect } from 'react'
import { BarChart3, Users, FileText, TrendingUp, Loader2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface DashboardStats {
  total_tenants: number
  by_stage: {
    validation: number
    planning: number
    execution: number
    expansion: number
  }
  avg_usuarios: number
  total_documents: number
  ready_for_expansion: number
}

function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'blue',
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend?: string
  color?: 'blue' | 'green' | 'amber' | 'purple'
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-100 text-blue-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  }

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    amber: 'text-amber-600',
    purple: 'text-purple-600',
  }

  return (
    <div className={cn('rounded-lg border p-4', colorClasses[color])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          {trend && <p className="mt-1 text-xs opacity-70">{trend}</p>}
        </div>
        <Icon className={cn('h-6 w-6', iconColorClasses[color])} />
      </div>
    </div>
  )
}

function StageBreakdown({ stages }: { stages: Record<string, number> }) {
  const total = Object.values(stages).reduce((a, b) => a + b, 0)

  const stageLabels = {
    validation: { label: 'Validación', color: 'bg-blue-100 text-blue-700' },
    planning: { label: 'Planeación', color: 'bg-yellow-100 text-yellow-700' },
    execution: { label: 'Ejecución', color: 'bg-green-100 text-green-700' },
    expansion: { label: 'Expansión', color: 'bg-purple-100 text-purple-700' },
  }

  return (
    <div className="rounded-lg border border-[#E8E4DC] p-4">
      <h3 className="mb-4 text-sm font-semibold text-[#1C1B18]">Distribución por etapa</h3>
      <div className="space-y-3">
        {Object.entries(stages).map(([stage, count]) => {
          const percentage = total > 0 ? Math.round((count / total) * 100) : 0
          const stageInfo = stageLabels[stage as keyof typeof stageLabels]

          return (
            <div key={stage}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="font-medium text-[#6B6760]">{stageInfo.label}</span>
                <span className="font-semibold text-[#1C1B18]">
                  {count} ({percentage}%)
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#E8E4DC] overflow-hidden">
                <div
                  className={cn('h-full transition-all', stageInfo.color)}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const response = await fetch(`${getApiUrl()}/admin/api/admin/stats`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to load stats: HTTP ${response.status}`)
      }

      const data = await response.json()
      setStats(data)
    } catch (e) {
      console.error('Failed to load stats:', e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-[#6B6760]" />
        <span className="ml-2 text-sm text-[#6B6760]">Cargando estadísticas...</span>
      </div>
    )
  }

  if (!stats) {
    return <div className="text-center text-sm text-[#6B6760]">No se pudieron cargar las estadísticas</div>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Total de municipios"
          value={stats.total_tenants}
          icon={BarChart3}
          color="blue"
        />
        <StatCard
          label="Usuarios promedio"
          value={stats.avg_usuarios}
          icon={Users}
          color="green"
          trend="por municipio"
        />
        <StatCard
          label="Documentos subidos"
          value={stats.total_documents}
          icon={FileText}
          color="amber"
        />
        <StatCard
          label="Listos para expansión"
          value={stats.ready_for_expansion}
          icon={TrendingUp}
          color="purple"
          trend="30+ días en ejecución"
        />
      </div>

      <StageBreakdown stages={stats.by_stage} />
    </div>
  )
}
