'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { Conclusion } from '@/components/editorial/Conclusion'
import { SectionLabel } from '@/components/editorial/SectionLabel'

type Variant = 'escenarios' | 'impacto'

/**
 * Bloque editorial maestro: aclara TIR base vs TIRs de estrés / escenarios.
 * Sin caja info — tipografía como jerarquía (M13).
 */
export function TirMultipleExplainer({ variant }: { variant: Variant }) {
  const { resultados, municipiosActivos, zmActiva } = useSimulatorStore()
  const r = resultados
  if (!r) return null

  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const tirBase = r.tir.toFixed(1)

  const lead =
    variant === 'escenarios'
      ? `En ${territorio}, la TIR base (${tirBase}%) es la cifra que Cabildo debe anclar; el resto del módulo prueba robustez, no contradice el modelo.`
      : `En ${territorio}, los indicadores superiores muestran TIR base ${tirBase}%: los escenarios C y D en la rejilla y Monte Carlo miden resistencia ante adversidad, no otra definición de rentabilidad.`

  const body =
    variant === 'escenarios' ? (
      <>
        Las barras acelerado, base, conservador y sin intervención exploran captura y precio respecto a ese caso.
        Monte Carlo, tornado y la rejilla —con escenarios <strong>C</strong> y <strong>D</strong>— recalculan ante choques
        operativos y de mercado.
      </>
    ) : (
      <>
        La rejilla simula bloqueo del concesionario (<strong>C</strong>) y OPEX +20% (<strong>D</strong>); A y B prueban
        precios y adopción lenta. El comparativo acelerado / base / conservador está en la sección de retorno por escenario.
      </>
    )

  return (
    <section className="mb-6">
      <SectionLabel>Varias TIR en este módulo</SectionLabel>
      <Conclusion className="mb-4">{lead}</Conclusion>
      <p className="font-sans text-[14px] leading-[1.55] text-gray-600c max-w-[620px]">{body}</p>
    </section>
  )
}
