'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'
import { Conclusion } from '@/components/editorial/Conclusion'
import { MarginalNote } from '@/components/editorial/MarginalNote'
import { SectionLabel } from '@/components/editorial/SectionLabel'

function scrollToDecisionModules() {
  document.getElementById('decision-shell-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function MultiplicadoresEco() {
  const { resultados } = useSimulatorStore()
  const r = resultados

  const items = r ? [
    { label: 'Cadena de suministro', value: fmt.mxnK(r.cadenaProveedores), mult: '0.25×' },
    { label: 'Revenue fiscal', value: fmt.mxnK(r.revenueFiscal), mult: '0.16×' },
    { label: 'Valor de propiedad', value: fmt.mxnK(r.valorPropiedad), mult: '0.12×' },
    { label: 'Inversión privada atraída', value: fmt.mxnK(r.inversionPrivada), mult: '1.40×' },
    { label: 'Ahorro salud pública', value: fmt.mxnK(r.ahorroSalud), mult: '$145/hab' },
    { label: 'Derrama salarial total', value: fmt.mxnK(r.derramaSalarial), mult: '1.8×' },
  ] : []

  return (
    <div>
      {r && (
        <section className="mb-8">
          <SectionLabel>Derrama base por venta de materiales</SectionLabel>
          <AnchorFigure
            figure={fmt.mxnM(r.ingresosBrutos)}
            context="Sobre el horizonte del plan · solo valorización material, sin externalidades"
            figureClassName="text-green-600a"
          />
        </section>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {items.map(item => (
          <div key={item.label} className="border-b border-[0.5px] border-gray-200c pb-5">
            <AnchorFigure figure={item.value} context={`${item.label} · ${item.mult}`} />
            <MarginalNote className="mt-2 text-[11px]">
              Multiplicador de sensibilidad — no suma automática a ingreso operativo.
            </MarginalNote>
          </div>
        ))}
      </div>

      {r && (
        <Conclusion className="mt-8 text-[18px]">
          Las cifras siguientes son externalidades y multiplicadores de sensibilidad. No se suman a la derrama base
          como ingreso disponible del programa sin fuente o convenio adicional.
        </Conclusion>
      )}

      {r && (
        <NarrativeBridge
          variant="bridge"
          audience="citizen"
          kicker="Derrama y bienestar local"
          summary={`La derrama base del escenario es ${fmt.mxnM(r.ingresosBrutos)} por venta de material recuperado. Como escenario ampliado, el modelo muestra hasta ${fmt.mxnM(r.derremaTotal)} al sumar externalidades condicionadas como cadena de compras, empleo formal estimado y ahorro en salud pública. Esa suma ampliada requiere verificación adicional antes de presentarse como beneficio público.`}
          evidence={[
            { label: 'Derrama base', value: fmt.mxnM(r.ingresosBrutos) },
            { label: 'Ahorro salud', value: fmt.mxnK(r.ahorroSalud) },
            { label: 'Derrama salarial', value: fmt.mxnK(r.derramaSalarial) },
            { label: 'Empleos directos', value: `${fmt.num0(r.empleosTotalesDirectos)} puestos` },
          ]}
          nextStep={{
            label: 'Volver a módulos',
            onClick: scrollToDecisionModules,
            helper: 'Si quieres cambiar supuestos, entra otra vez al módulo de línea base o composición desde el menú lateral.',
          }}
        />
      )}
    </div>
  )
}
