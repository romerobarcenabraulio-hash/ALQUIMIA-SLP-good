'use client'
import { useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ZMS, alquimiaHideGdlFromUi, GDL_ZM_SELECTOR_FOOTNOTE } from '@/lib/constants'
import { fmt } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function SelectorZM() {
  const [gdlBlockedOpen, setGdlBlockedOpen] = useState(false)
  const { zmActiva, setZM, municipiosActivos, toggleMunicipio } = useSimulatorStore()
  const zm = ZMS.find(z => z.id === zmActiva)!

  // Población y viviendas reactivas: suman solo los municipios activos
  const muniActivos = zm.municipios.filter(m => municipiosActivos.includes(m.id))
  const allActive = muniActivos.length === zm.municipios.length
  const popActiva = allActive ? zm.totalPop : (muniActivos.reduce((s, m) => s + m.pop, 0) || zm.totalPop)
  const vivActivas = allActive ? zm.totalViv : (muniActivos.reduce((s, m) => s + m.viv, 0) || zm.totalViv)

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
            onClick={() => {
              if (z.id === 'GDL' && !alquimiaHideGdlFromUi()) {
                setGdlBlockedOpen(true)
                return
              }
              setZM(z.id)
            }}
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

      {/* Info ZM activa — valores reactivos según municipios seleccionados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Población activa', v: fmt.num0(popActiva) + ' hab', dim: !allActive },
          { l: 'Viviendas activas', v: fmt.num0(vivActivas), dim: !allActive },
          { l: 'Gen/cápita',        v: `${zm.genKgDia} kg/hab/día`, dim: false },
          { l: 'Crecimiento',       v: `${zm.crecPct}% anual`, dim: false },
        ].map(item => (
          <div key={item.l} className={cn('bg-[#FDFCFA] border rounded-[10px] p-3 transition-colors', item.dim ? 'border-amber-300' : 'border-[#E8E4DC]')}>
            <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide">{item.l}</p>
            <p className={cn('font-mono text-[15px] mt-1', item.dim ? 'text-amber-800' : 'text-[#1C1B18]')}>{item.v}</p>
            {item.dim && <p className="text-[9px] text-amber-600 mt-0.5">parcial · {muniActivos.length}/{zm.municipios.length} mun.</p>}
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

      {alquimiaHideGdlFromUi() && (
        <p className="mt-4 text-[11px] leading-relaxed text-[#A8A49C] max-w-2xl">{GDL_ZM_SELECTOR_FOOTNOTE}</p>
      )}

      <Dialog open={gdlBlockedOpen} onOpenChange={setGdlBlockedOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ZM Guadalajara</DialogTitle>
            <DialogDescription>
              Reglamentos municipales no cargados — ZM bloqueada para demo hasta anclar fuentes oficiales.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
