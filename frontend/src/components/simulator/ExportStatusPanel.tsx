'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { CheckCircle2, AlertTriangle, Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ExportStatusPanel() {
  const resultados = useSimulatorStore(s => s.resultados)
  const snapshotDatos = useSimulatorStore(s => s.snapshotDatos)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)

  const checks = [
    { id: 'escenario', label: 'Escenario calculado', ok: !!resultados },
    { id: 'municipio', label: 'Municipio seleccionado', ok: municipiosActivos.length > 0 },
    { id: 'datos', label: 'Calidad de datos ≥ 60', ok: (snapshotDatos?.score_datos ?? 0) >= 60 },
    { id: 'bloqueos', label: 'Sin bloqueos AGORA', ok: !(snapshotDatos?.advertencias?.some(a => a.bloquea_agora)) },
  ]
  const ready = checks.filter(c => c.ok).length

  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3 mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Estado de exportación</p>
        <span className={cn(
          'text-[10px] font-bold px-2 py-0.5 rounded-full',
          ready === checks.length ? 'bg-[#EAF3DE] text-[#3B6D11]' : 'bg-[#FEF7E7] text-[#6B4800]',
        )}>
          {ready}/{checks.length} listos
        </span>
      </div>
      <ul className="space-y-1">
        {checks.map(c => {
          const Icon = c.ok ? CheckCircle2 : snapshotDatos && !c.ok ? AlertTriangle : Circle
          return (
            <li key={c.id} className="flex items-center gap-2 text-[10px] text-[#6B6760]">
              <Icon className={cn('w-3.5 h-3.5 shrink-0', c.ok ? 'text-[#3B6D11]' : 'text-[#D4881E]')} />
              {c.label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
