'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'

type Variant = 'escenarios' | 'impacto'

/**
 * Bloque editorial maestro: aclara TIR base vs TIRs de estrés / escenarios.
 * Copy territorialmente neutro — usa el municipio o ZM activos en el simulador.
 */
export function TirMultipleExplainer({ variant }: { variant: Variant }) {
  const { resultados, municipiosActivos, zmActiva } = useSimulatorStore()
  const r = resultados
  if (!r) return null

  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const tirBase = r.tir.toFixed(1)

  const cuerpoEscenarios = (
    <>
      Miden cosas distintas del mismo programa en <strong>{territorio}</strong>. La{' '}
      <strong>TIR base ({tirBase}%)</strong> es el rendimiento del caso central del modelo y responde la
      pregunta corta sobre rentabilidad. Las barras acelerado, base, conservador y sin intervención
      (debajo) exploran variación de captura y precio respecto a ese caso. Más adelante en este módulo,
      Monte Carlo, tornado y la rejilla de estrés —con escenarios <strong>C</strong> y <strong>D</strong>—
      recalculan resultados ante adversidad operativa y de mercado. Para Cabildo, la cifra de referencia
      es la TIR base; las demás miden robustez, no contradicen el modelo.
    </>
  )

  const cuerpoImpacto = (
    <>
      Miden cosas distintas del mismo programa en <strong>{territorio}</strong>. La{' '}
      <strong>TIR base ({tirBase}%)</strong> en los indicadores superiores es el caso central. Los
      escenarios de estrés <strong>C</strong> (12 meses adicionales de bloqueo del concesionario) y{' '}
      <strong>D</strong> (costos operativos +20%) en la rejilla simulan condiciones adversas; A y B
      prueban precios de materiales y adopción más lenta. El comparativo acelerado / base / conservador
      está en la sección de retorno por escenario del mismo módulo. Para Cabildo, ancle la decisión en
      la TIR base; use las otras como prueba de resistencia del proyecto en este territorio.
    </>
  )

  return (
    <div className="rounded-[12px] border border-[#B0D0F5] bg-[#EBF3FB] px-4 py-3.5 text-[11px] text-[#0D3B7A] leading-relaxed">
      <p className="font-semibold text-[#1A5FA8] mb-1.5">Varias TIR en este módulo — no son inconsistentes</p>
      <p>{variant === 'escenarios' ? cuerpoEscenarios : cuerpoImpacto}</p>
    </div>
  )
}
