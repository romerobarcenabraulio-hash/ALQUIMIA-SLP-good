'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { EmpleosChart } from '@/components/charts/EmpleosChart'

export function EmpleosSection() {
  const { resultados } = useSimulatorStore()
  const r = resultados

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S12 — Empleos e impacto social</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Motor de empleo formal</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Directos CAs',     v: r ? fmt.num0(r.empleosDirectosCAs)     : '—', c: 'text-[#3B6D11]' },
          { l: 'Directos recic.',  v: r ? fmt.num0(r.empleosDirectosRecic)    : '—', c: '' },
          { l: 'Indirectos',       v: r ? fmt.num0(r.empleosIndirectos)       : '—', c: '' },
          { l: 'Pepenadores form.',v: r ? fmt.num0(r.pepenadoresFormalizados) : '—', c: 'text-[#D4881E]' },
        ].map(item => (
          <div key={item.l} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide mb-1">{item.l}</p>
            <p className={`font-mono text-[20px] font-medium ${item.c || 'text-[#1C1B18]'}`}>{item.v}</p>
          </div>
        ))}
      </div>

      <EmpleosChart />

      {r && (
        <div className="mt-4 px-4 py-3 bg-[#EBF3FB] rounded-[10px] border-l-4 border-[#1A5FA8]">
          <p className="text-[13px] text-[#051D45] italic leading-relaxed">
            El programa generará {fmt.num0(r.empleosTotalesDirectos)} empleos directos y una derrama salarial
            de {fmt.mxnK(r.derramaSalarial)} anuales, con un multiplicador de 1.8x sobre la economía local.
          </p>
        </div>
      )}
    </div>
  )
}
