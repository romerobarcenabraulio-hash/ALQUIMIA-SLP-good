'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { buildResearchChecklist } from '@/lib/researchChecklist'
import { getInegiHousingDistribution } from '@/lib/viviendaInegi'
import { cn } from '@/lib/utils'

export function ResearchCompletenessBar() {
  const [open, setOpen] = useState(false)
  const resultados = useSimulatorStore(s => s.resultados)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const precios = useSimulatorStore(s => s.precios)
  const distribution = getInegiHousingDistribution(zmActiva, municipiosActivos)

  const checklist = useMemo(
    () => buildResearchChecklist({
      hasResultados: !!resultados,
      hasMunicipio: municipiosActivos.length > 0,
      hasPrecios: !!precios,
      hasDistribution: !!distribution,
    }),
    [resultados, municipiosActivos.length, precios, distribution],
  )

  const color = checklist.pctComplete >= 80 ? '#3B6D11' : checklist.pctComplete >= 55 ? '#D4881E' : '#C0392B'

  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[#FAFAF8] transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] font-semibold">
              Completitud de investigación
            </p>
            <span className="text-[11px] font-bold font-mono" style={{ color }}>{checklist.pctComplete}%</span>
          </div>
          <div className="h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${checklist.pctComplete}%`, background: color }} />
          </div>
          <p className="text-[9px] text-[#A8A49C] mt-1">
            {checklist.verifiedCount} verificados · {checklist.missingCount} pendientes
          </p>
        </div>
        <ChevronDown className={cn('w-4 h-4 text-[#A8A49C] shrink-0 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="px-4 pb-3 border-t border-[#F0EDE5] pt-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
          {checklist.items.map(item => (
            <div key={item.id} className="flex items-center gap-2 py-1">
              <span className={cn(
                'w-1.5 h-1.5 rounded-full shrink-0',
                item.status === 'verified' ? 'bg-[#3B6D11]' : item.status === 'estimated' ? 'bg-[#D4881E]' : 'bg-[#C0392B]',
              )} />
              <span className="text-[10px] text-[#4A4740] truncate">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
