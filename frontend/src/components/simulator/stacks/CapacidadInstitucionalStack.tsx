'use client'

import { DiagnosticoJuridico } from '@/components/simulator/DiagnosticoJuridico'
import { ReglamentoCargaCiudadPanel } from '@/components/simulator/ReglamentoCargaCiudadPanel'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_INSTITUCIONALES } from '@/lib/constants'

export function CapacidadInstitucionalStack() {
  const agoraLegalBloqueado = useSimulatorStore(s => s.agoraLegalBloqueado)
  const faseInstitucional = useSimulatorStore(s => s.faseInstitucional)
  const pasoNormativo = FASES_INSTITUCIONALES.find(f => f.fase === faseInstitucional)
    ?? FASES_INSTITUCIONALES[0]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-[#F4F2ED] border border-[#E8E4DC] px-3 py-1 text-[10px] font-medium text-[#4A4740]">
          Madurez P{pasoNormativo.fase} · {pasoNormativo.nombre}
        </span>
        <span className={agoraLegalBloqueado
          ? 'rounded-full bg-[#FDE8E8] border border-[#FCA5A5] px-3 py-1 text-[10px] font-semibold text-[#C0392B]'
          : 'rounded-full bg-[#EAF3DE] border border-[#C9DDB1] px-3 py-1 text-[10px] font-semibold text-[#3B6D11]'}>
          ÁGORA {agoraLegalBloqueado ? 'bloqueado' : 'habilitado'}
        </span>
      </div>
      <div id="panel-reglamento-ciudad">
        <ReglamentoCargaCiudadPanel />
      </div>
      <DiagnosticoJuridico />
    </div>
  )
}
