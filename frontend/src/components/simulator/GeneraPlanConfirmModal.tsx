'use client'

import { AlertTriangle } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { GENERA_PLAN_MODAL_DISCLAIMER } from '@/lib/simulationDisclaimer'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Q-010 — Confirmación explícita antes de lanzar el pipeline ÁGORA (H-02).
 * Cerrar el modal o cancelar no ejecuta el callback registrado.
 */
export function GeneraPlanConfirmModal() {
  const open = useSimulatorStore(s => s.agoraPlanConfirmOpen)
  const confirmAgoraPlan = useSimulatorStore(s => s.confirmAgoraPlan)
  const dismissAgoraPlanConfirm = useSimulatorStore(s => s.dismissAgoraPlanConfirm)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismissAgoraPlanConfirm()
      }}
    >
      <DialogContent className="md:max-w-lg md:h-auto max-h-[min(90vh,640px)] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FEF7E7] text-[#D4881E]"
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" strokeWidth={2.25} />
            </span>
            <div className="min-w-0">
              <DialogTitle className="text-left">Simulación — confirma antes de continuar</DialogTitle>
              <DialogDescription className="text-left pt-2">
                {GENERA_PLAN_MODAL_DISCLAIMER}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2">
          <button
            type="button"
            onClick={() => dismissAgoraPlanConfirm()}
            className="w-full rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-2.5 text-[13px] font-medium text-[#6B6760] hover:bg-[#F0EDE5] sm:w-auto"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => confirmAgoraPlan()}
            className="w-full rounded-[10px] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#2D5409] sm:w-auto"
          >
            Entendido — continuar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
