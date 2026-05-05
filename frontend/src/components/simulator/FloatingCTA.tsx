'use client'
import { useState, useEffect, type RefObject } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'

export function FloatingCTA({ interaccionesRef }: { interaccionesRef: RefObject<number> }) {
  const [visible, setVisible] = useState(false)
  const setGeneratingPlan    = useSimulatorStore(s => s.setGeneratingPlan)
  const agoraLegalBloqueado  = useSimulatorStore(s => s.agoraLegalBloqueado)

  useEffect(() => {
    const interval = setInterval(() => {
      if ((interaccionesRef.current ?? 0) >= 3) {
        setVisible(true)
        clearInterval(interval)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [interaccionesRef])

  if (!visible) return null

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
      {/* Advertencia cuando el marco legal (ÁGORA) está bloqueado hasta verificar reglamento */}
      {agoraLegalBloqueado && (
        <div className="bg-[#F3EAF5] border border-[#7B3FA0]/30 rounded-[10px] px-3 py-2 max-w-[260px] shadow-md">
          <p className="text-[11px] text-[#7B3FA0] font-medium">🔒 Verificación del reglamento pendiente</p>
          <p className="text-[10px] text-[#6B6760] mt-0.5">
            Revisa la fuente del reglamento en S4.6 antes de generar el plan.
          </p>
        </div>
      )}

      <button
        onClick={() => {
          if (!agoraLegalBloqueado) {
            setGeneratingPlan(true, 0, 'Iniciando ALQUIMIA...')
          }
        }}
        disabled={agoraLegalBloqueado}
        title={agoraLegalBloqueado ? 'Reglamento sin verificar — completa la revisión en S4.6' : undefined}
        className={
          agoraLegalBloqueado
            ? 'bg-[#A8A49C] text-white text-[13px] font-medium px-5 py-3 rounded-[12px] shadow-lg cursor-not-allowed opacity-60 flex items-center gap-2'
            : 'bg-[#3B6D11] text-white text-[13px] font-medium px-5 py-3 rounded-[12px] shadow-lg hover:bg-[#2D5409] transition-all hover:-translate-y-0.5 flex items-center gap-2'
        }
      >
        {agoraLegalBloqueado
          ? <span className="text-[14px]">🔒</span>
          : <span className="w-2 h-2 rounded-full bg-[#F6C84B] animate-pulse" />
        }
        Genera mi plan de circularidad
      </button>
    </div>
  )
}
