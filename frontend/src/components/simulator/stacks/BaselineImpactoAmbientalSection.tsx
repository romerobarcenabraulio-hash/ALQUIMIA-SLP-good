'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'
import { MarginalNote } from '@/components/editorial/MarginalNote'
import { SectionLabel } from '@/components/editorial/SectionLabel'

/** Impacto ambiental/sanitario integrado en M01 — una sola rejilla, sin duplicar KPIs. */
export function BaselineImpactoAmbientalSection() {
  const resultados = useSimulatorStore(s => s.resultados)
  const resultadosSinPrograma = useSimulatorStore(s => s.resultadosSinPrograma)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const r = resultados

  if (!r) return null

  const rsuSinPrograma = resultadosSinPrograma?.rsuTotalTonDia ?? r.rsuTotalTonDia
  const kpis = [
    { label: 'CO₂e acumulado', value: fmt.co2(r.co2eEvitadasHorizonteTon) },
    { label: 'PM2.5 evitado', value: `${r.pm25EvitadoTon.toFixed(1)} t` },
    { label: 'Casos IRA evitados', value: fmt.num0(r.casosIRAEvitados) },
    { label: 'Extensión relleno', value: `+${r.extensionRelleno.toFixed(1)} años` },
    { label: 'Casos dengue evitados', value: fmt.num0(r.casosDengueEvitados) },
    { label: 'Biogás (informativo)', value: fmt.kwh(r.kwhBiogas) },
    { label: 'AVAD evitados', value: r.avadEvitados.toFixed(0) },
    { label: 'Ingreso carbono', value: fmt.mxn(r.ingresoCarbono) },
  ]

  return (
    <section
      className="pt-5 mt-5 border-t border-[0.5px] border-gray-200c"
      data-testid="m01-impacto-ambiental"
    >
      <SectionLabel>Impacto ambiental y sanitario</SectionLabel>
      <p className="font-serif text-[15px] leading-snug text-[#1C1B18] mb-4 max-w-[640px]">
        {`En ${horizonte} años el escenario evita ${fmt.co2(r.co2eEvitadasHorizonteTon)} CO₂e y ${r.pm25EvitadoTon.toFixed(1)} t de PM2.5 — defendible solo si el factor del relleno local está acotado.`}
      </p>
      <KpiAnchorGrid items={kpis} columns={4} className="mb-3" />
      {resultadosSinPrograma && (
        <MarginalNote prefix="Sin programa">
          {fmt.kgd(resultadosSinPrograma.rsuTotalTonDia)} RSU/día ·{' '}
          {fmt.mxnM(resultadosSinPrograma.ingresosBrutos / Math.max(1, horizonte))}/año ingresos no capturados
        </MarginalNote>
      )}
      <p className="mt-3 text-[12px] leading-relaxed text-gray-600c max-w-[640px]">
        {fmt.kgd(rsuSinPrograma)} RSU/día sin separar alimentan M04 costo de omisión — baje confianza antes de anexar a informe oficial si falta dato de relleno.
      </p>
      <p className="mt-2 text-[10px] text-gray-600c flex flex-wrap items-center gap-1">
        <ProvenanceBadge tipo="estimado" confianza={0.68} fuente="OPS/INSP · INECC · calculator.ts" />
        Biogás no incluido en ingresos base — requiere permiso CRE.
      </p>
    </section>
  )
}
