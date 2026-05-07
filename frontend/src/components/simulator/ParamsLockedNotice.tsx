'use client'

/** Parametrización local desactivada: el simulador usa solo municipio, horizonte y gen. per cápita en la configuración inicial. */
export function ParamsLockedNotice() {
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-[#F8F6F1] px-4 py-3 text-[12px] leading-relaxed text-[#6B6760]">
      Parámetros definidos en configuración inicial del plan.
    </div>
  )
}
