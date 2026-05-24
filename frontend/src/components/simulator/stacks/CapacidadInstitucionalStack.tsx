'use client'

import { DiagnosticoJuridico } from '@/components/simulator/DiagnosticoJuridico'
import { ReglamentoCargaCiudadPanel } from '@/components/simulator/ReglamentoCargaCiudadPanel'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { FASES_INSTITUCIONALES } from '@/lib/constants'

export function CapacidadInstitucionalStack() {
  const agoraLegalBloqueado = useSimulatorStore(s => s.agoraLegalBloqueado)
  const faseInstitucional = useSimulatorStore(s => s.faseInstitucional)
  const pasoNormativo = FASES_INSTITUCIONALES.find(f => f.fase === faseInstitucional)
    ?? FASES_INSTITUCIONALES[0]

  return (
    <div className="space-y-5">
      <ScopeAnclaKicker />
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">M03 · Institucional-normativo</p>
        <h2 className="font-serif text-[22px] text-[#1C1B18]">Capacidad institucional del municipio</h2>
        <p className="mt-2 text-[13px] text-[#6B6760] leading-relaxed">
          Antes de planificar quién opera, diagnosticamos qué capacidad real tiene el municipio hoy:
          marco jurídico habilitante, madurez institucional y bloqueos ÁGORA.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#F4F2ED] border border-[#E8E4DC] px-3 py-1 text-[10px] font-medium text-[#4A4740]">
            Madurez: P{pasoNormativo.fase} · {pasoNormativo.nombre}
          </span>
          <span className={agoraLegalBloqueado
            ? 'rounded-full bg-[#FDE8E8] border border-[#FCA5A5] px-3 py-1 text-[10px] font-semibold text-[#C0392B]'
            : 'rounded-full bg-[#EAF3DE] border border-[#C9DDB1] px-3 py-1 text-[10px] font-semibold text-[#3B6D11]'}>
            ÁGORA: {agoraLegalBloqueado ? 'Bloqueado — complete diagnóstico jurídico' : 'Habilitado'}
          </span>
        </div>
      </div>
      <div id="panel-reglamento-ciudad">
        <ReglamentoCargaCiudadPanel />
      </div>
      <DiagnosticoJuridico />
    </div>
  )
}
