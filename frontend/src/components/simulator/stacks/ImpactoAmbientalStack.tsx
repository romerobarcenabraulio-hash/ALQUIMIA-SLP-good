'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { Conclusion } from '@/components/editorial/Conclusion'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'
import { MarginalNote } from '@/components/editorial/MarginalNote'
import { SectionLabel } from '@/components/editorial/SectionLabel'

export function ImpactoAmbientalStack() {
  const resultados = useSimulatorStore(s => s.resultados)
  const resultadosSinPrograma = useSimulatorStore(s => s.resultadosSinPrograma)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const r = resultados

  if (!r) {
    return (
      <p className="text-[12px] text-gray-600c border-b border-[0.5px] border-gray-200c pb-4">
        Configure el escenario en M01 para ver impactos ambientales y sanitarios.
      </p>
    )
  }

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
    <div className="space-y-6">
      <section>
        <SectionLabel>Impacto ambiental y sanitario</SectionLabel>
        <Conclusion className="mb-5">
          {`En ${horizonte} años el escenario evita ${fmt.co2(r.co2eEvitadasHorizonteTon)} CO₂e y ${r.pm25EvitadoTon.toFixed(1)} t de PM2.5 — el argumento solo es defendible si el factor del relleno local está acotado.`}
        </Conclusion>
        <KpiAnchorGrid items={kpis} columns={4} className="mb-2" />
      </section>

      <NarrativeBridge
        variant="bridge"
        summary={`Si el contrafactual sin programa supera ${fmt.kgd(resultadosSinPrograma?.rsuTotalTonDia ?? r.rsuTotalTonDia)} RSU/día, lleve estas cifras a M04 costo de omisión; si falta dato de relleno, baje confianza antes de anexar a informe oficial.`}
        evidence={[
          { label: 'CO₂e horizonte', value: fmt.co2(r.co2eEvitadasHorizonteTon) },
          { label: 'PM2.5 evitado', value: `${r.pm25EvitadoTon.toFixed(1)} t` },
          { label: 'IRA evitados', value: fmt.num0(r.casosIRAEvitados) },
          { label: 'Extensión relleno', value: `+${r.extensionRelleno.toFixed(1)} años` },
        ]}
        source={{
          fuente: 'OPS/INSP · INECC · calculator.ts — biogás informativo, no en ingresos base',
          incertidumbre: 'Factor de emisión del relleno y captura de biogás local.',
        }}
        nextStep={{ label: 'Abrir M04 — Costo de la omisión' }}
      />

      {resultadosSinPrograma && (
        <MarginalNote prefix="Contrafactual sin programa">
          {fmt.kgd(resultadosSinPrograma.rsuTotalTonDia)} RSU/día ·{' '}
          {fmt.mxnM(resultadosSinPrograma.ingresosBrutos / Math.max(1, horizonte))}/año ingresos no capturados
        </MarginalNote>
      )}

      <p className="text-[10px] text-gray-600c flex items-center gap-1">
        <ProvenanceBadge tipo="estimado" confianza={0.68} fuente="OPS/INSP · INECC · calculator.ts" />
        Biogás no incluido en ingresos base — requiere permiso CRE.
      </p>
    </div>
  )
}
