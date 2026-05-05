'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ZMS } from '@/lib/constants'
import { fmt } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function SelectorZM() {
  const { zmActiva, setZM, municipiosActivos, toggleMunicipio } = useSimulatorStore()
  const zm = ZMS.find(z => z.id === zmActiva)!

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4 — Zona Metropolitana</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-4">Zona metropolitana · territorio coordinado</h2>
      <p className="text-[12px] text-[#6B6760] mb-6 max-w-2xl leading-relaxed">
        Aquí eliges la vista territorial de trabajo (ZM). Las cifras de población y generación son agregadas para la simulación;
        obligaciones legales, reglamentos y vías de sanción siguen siendo municipales — la ZM no es autoridad jurídica única ni sustituta del ayuntamiento.
      </p>
      {/* Selector ZMs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {ZMS.map(z => (
          <button
            key={z.id}
            onClick={() => setZM(z.id)}
            className={cn(
              'px-4 py-2 rounded-[8px] text-[13px] font-medium transition-colors border',
              zmActiva === z.id
                ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC] hover:bg-[#F0EDE5]'
            )}
          >
            {z.id} — {z.estado}
          </button>
        ))}
        <button className="px-4 py-2 rounded-[8px] text-[13px] text-[#A8A49C] border border-dashed border-[#E8E4DC]">
          + Otra ciudad (API CONAPO)
        </button>
      </div>

      {/* Info ZM activa */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Población',    v: fmt.num0(zm.totalPop) + ' hab' },
          { l: 'Viviendas',    v: fmt.num0(zm.totalViv) },
          { l: 'Gen/cápita',   v: `${zm.genKgDia} kg/hab/día` },
          { l: 'Crecimiento',  v: `${zm.crecPct}% anual` },
        ].map(item => (
          <div key={item.l} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[10px] p-3">
            <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide">{item.l}</p>
            <p className="font-mono text-[15px] text-[#1C1B18] mt-1">{item.v}</p>
          </div>
        ))}
      </div>

      {/* Checkboxes municipios */}
      <div>
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Municipios activos en el programa</p>
        <div className="flex flex-wrap gap-2">
          {zm.municipios.map(m => {
            const active = municipiosActivos.includes(m.id)
            return (
              <button
                key={m.id}
                onClick={() => toggleMunicipio(m.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] border transition-colors',
                  active
                    ? 'bg-[#EAF3DE] text-[#3B6D11] border-[#3B6D11]/30'
                    : 'bg-[#FDFCFA] text-[#A8A49C] border-[#E8E4DC]'
                )}
              >
                <span className={cn('w-2 h-2 rounded-full', active ? 'bg-[#3B6D11]' : 'bg-[#E2DED6]')} />
                {m.nombre}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
