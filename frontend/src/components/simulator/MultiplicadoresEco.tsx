'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
function scrollToDecisionModules() {
  document.getElementById('decision-shell-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function MultiplicadoresEco() {
  const { resultados } = useSimulatorStore()
  const r = resultados

  const items = r ? [
    { label: 'Cadena de suministro',     value: r.cadenaProveedores,  fuente: 'S&P sector reciclaje', mult: '0.25x' },
    { label: 'Revenue fiscal',           value: r.revenueFiscal,      fuente: 'IMCO',                mult: '0.16x' },
    { label: 'Valor de propiedad',       value: r.valorPropiedad,     fuente: 'BBVA Research',        mult: '0.12x' },
    { label: 'Inversión privada atraída', value: r.inversionPrivada,  fuente: 'BID Economía Circular', mult: '1.40x' },
    { label: 'Ahorro salud pública',     value: r.ahorroSalud,        fuente: 'OMS-OPS LATAM',        mult: '$145/hab' },
    { label: 'Derrama salarial total',   value: r.derramaSalarial,    fuente: 'Deloitte LATAM',       mult: '1.8x' },
  ] : []

  return (
    <div>
      {/* KPI strip */}
      {r && (
        <div className="bg-gradient-to-r from-[#EAF3DE] to-[#EBF3FB] rounded-[14px] p-5 mb-6">
          <p className="text-[11px] uppercase tracking-wide text-[#3B6D11] mb-2">Derrama base por venta de materiales</p>
          <p className="font-mono text-[38px] text-[#3B6D11]">{fmt.mxnM(r.ingresosBrutos)}</p>
          <p className="text-[13px] text-[#6B6760]">sobre el horizonte del plan · solo valorización material, sin externalidades</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map(item => (
          <div key={item.label} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[12px] font-medium text-[#1C1B18]">{item.label}</p>
              <span className="text-[10px] text-[#A8A49C] font-mono">{item.mult}</span>
            </div>
            <p className="font-mono text-[20px] text-[#3B6D11]">{fmt.mxnK(item.value)}</p>
            <p className="text-[10px] text-[#A8A49C] mt-1">{item.fuente}</p>
          </div>
        ))}
      </div>

      {r && (
        <div className="mt-4 rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Escenario ampliado separado</p>
          <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760]">
            Las siguientes cifras son externalidades y multiplicadores de sensibilidad. No se suman a la derrama base como
            ingreso disponible del programa sin fuente o convenio adicional.
          </p>
        </div>
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
