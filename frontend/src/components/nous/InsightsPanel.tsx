'use client'

import { useEffect, useState } from 'react'
import { Loader2, Lightbulb, TrendingUp, AlertTriangle, CheckCircle, X } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

interface Insight {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  recomendacion: string
  confianza: number
  impacto_potencial?: string
  created_at: string
}

const TIPO_CONFIG: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  recovery_potential: { icon: <TrendingUp size={14} />, bg: 'bg-[#EAF3DE]', color: 'text-[#2D5409]' },
  cost_optimization: { icon: <CheckCircle size={14} />, bg: 'bg-[#E8F0FB]', color: 'text-[#1A5FA8]' },
  compliance_risk: { icon: <AlertTriangle size={14} />, bg: 'bg-[#FEF7E7]', color: 'text-[#8A4F08]' },
  operational_efficiency: { icon: <Lightbulb size={14} />, bg: 'bg-[#F3EDFB]', color: 'text-[#5B2C8A]' },
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export function InsightsPanel({ tenantId }: { tenantId: string }) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${getApiUrl()}/api/v1/nous/insights/${tenantId}`, { headers: authHdr() })
      .then(r => r.json())
      .then((d: { total: number; insights: Insight[] }) => setInsights(d.insights))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [tenantId])

  async function dismiss(id: string) {
    setDismissing(id)
    try {
      await fetch(`${getApiUrl()}/api/v1/nous/${id}/descartar`, {
        method: 'PATCH',
        headers: authHdr(),
      })
      setInsights(prev => prev.filter(i => i.id !== id))
    } finally {
      setDismissing(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={16} className="animate-spin text-[#A8A49C]" />
      </div>
    )
  }

  if (insights.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {insights.map(insight => {
        const cfg = TIPO_CONFIG[insight.tipo] || { icon: <Lightbulb size={14} />, bg: 'bg-[#F0EDE5]', color: 'text-[#6B6760]' }
        const impactColor = insight.impacto_potencial === 'alto'
          ? 'bg-[#C0392B]/10 text-[#C0392B]'
          : insight.impacto_potencial === 'medio'
            ? 'bg-[#D4881E]/10 text-[#D4881E]'
            : 'bg-[#3B6D11]/10 text-[#3B6D11]'

        return (
          <div key={insight.id} className={`rounded-[10px] border border-[#E8E4DC] p-3 space-y-1.5 ${cfg.bg}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 flex-1">
                <span className={`mt-0.5 shrink-0 ${cfg.color}`}>{cfg.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[#1C1B18]">{insight.titulo}</p>
                  <p className="text-[11px] text-[#6B6760] leading-snug mt-0.5">{insight.descripcion}</p>
                </div>
              </div>
              <button
                onClick={() => dismiss(insight.id)}
                disabled={dismissing === insight.id}
                className="shrink-0 text-[#A8A49C] hover:text-[#1C1B18] disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${impactColor}`}>
                {insight.impacto_potencial || 'normal'} impacto
              </span>
              <span className="text-[10px] text-[#8E8980]">
                Confianza: {Math.round(insight.confianza * 100)}%
              </span>
            </div>

            <p className="text-[10px] text-[#6B6760] italic pt-0.5">
              💡 {insight.recomendacion}
            </p>
          </div>
        )
      })}
    </div>
  )
}
