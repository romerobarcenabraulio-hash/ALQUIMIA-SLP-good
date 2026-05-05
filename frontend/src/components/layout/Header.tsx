'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { Audience } from '@/types'

const AUDIENCE_LABEL: Record<Audience, string> = {
  citizen: 'Ciudadano',
  functionary: 'Funcionario público',
  entrepreneur: 'Empresario',
}

export function Header() {
  const pathname = usePathname()
  const { resultados, zmActiva, guardarEscenario } = useSimulatorStore()
  const audience = useSimulatorStore(s => s.audience)
  const resetAudience = useSimulatorStore(s => s.resetAudience)
  const hasInit = useRef(false)

  useEffect(() => {
    if (!hasInit.current) {
      useSimulatorStore.getState().recalcular()
      hasInit.current = true
    }
  }, [])

  const r = resultados

  return (
    <header className="sticky top-0 z-50 bg-[#FDFCFA]/95 backdrop-blur-sm border-b border-[#E8E4DC] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="font-serif text-[20px] text-[#3B6D11] font-semibold tracking-tight">ALQUIMIA</span>
          <span className="hidden sm:block text-[#E8E4DC]">|</span>
          <span className="hidden sm:block text-[12px] text-[#A8A49C] uppercase tracking-wide">{zmActiva}</span>
        </div>

        {/* KPIs resumen */}
        <div className="hidden lg:flex items-center gap-6">
          <KpiChip label="RSU" value={r ? fmt.kgd(r.rsuTotalTonDia) : '—'} />
          <KpiChip label="Ingreso/año" value={r ? fmt.mxnK(r.ingresosBrutos / (useSimulatorStore.getState().horizonte || 3)) : '—'} color="text-[#3B6D11]" />
          <KpiChip label="CO₂e/año" value={r ? fmt.co2(r.co2eEvitadasAnualTon) : '—'} color="text-[#1A5FA8]" />
          <KpiChip label="Empleos" value={r ? fmt.num0(r.empleosTotalesDirectos) : '—'} />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          {pathname === '/simulator' && audience && (
            <div
              className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#E8E4DC] bg-[#FDFCFA] px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] text-[#6B6760]"
              title="Fase 22 — audiencia activa"
            >
              <span className="max-w-[72px] sm:max-w-[140px] truncate">
                <span className="text-[#A8A49C]">Vista </span>
                <span className="font-semibold text-[#1C1B18]">{AUDIENCE_LABEL[audience]}</span>
              </span>
              <button
                type="button"
                onClick={resetAudience}
                className="shrink-0 font-medium text-[#3B6D11] hover:underline"
              >
                Cambiar
              </button>
            </div>
          )}
          <button
            onClick={() => guardarEscenario(`Escenario ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`)}
            className="hidden sm:block text-[12px] text-[#3B6D11] border border-[#3B6D11] px-3 py-1.5 rounded-[6px] hover:bg-[#EAF3DE] transition-colors"
          >
            Guardar escenario
          </button>
          <button className="btn-primary text-[12px] px-4 py-1.5">
            Exportar PDF
          </button>
        </div>
      </div>
    </header>
  )
}

function KpiChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-[10px] uppercase tracking-wide text-[#A8A49C]">{label}</span>
      <span className={`font-mono text-[13px] font-medium ${color ?? 'text-[#1C1B18]'}`}>{value}</span>
    </div>
  )
}
