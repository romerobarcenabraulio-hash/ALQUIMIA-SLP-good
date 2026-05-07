'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

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
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S16 — Multiplicadores económicos</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Derrama en la economía local</h2>
      <ScopeAnclaKicker className="mb-2" />
      <p className="text-[13px] text-[#6B6760] mb-6">
        Cada peso de ingreso del programa activa múltiplos de valor en la economía regional.
      </p>

      {/* KPI strip */}
      {r && (
        <div className="bg-gradient-to-r from-[#EAF3DE] to-[#EBF3FB] rounded-[14px] p-5 mb-6">
          <p className="text-[11px] uppercase tracking-wide text-[#3B6D11] mb-2">Derrama económica total</p>
          <p className="font-mono text-[38px] text-[#3B6D11]">{fmt.mxnM(r.derremaTotal)}</p>
          <p className="text-[13px] text-[#6B6760]">sobre el horizonte del plan · incluye ingresos + externalidades</p>
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
        <NarrativeBridge
          variant="bridge"
          audience="citizen"
          kicker="Derrama y bienestar local"
          summary={`El modelo suma unos ${fmt.mxnM(r.derremaTotal)} de actividad indirecta en el horizonte (cadena de compras, empleo formal estimado y ahorro en salud pública), sin usar indicadores de rentabilidad financiera para ciudadanía. El mayor aporte a salud pública estimado es ${fmt.mxnK(r.ahorroSalud)} y la derrama salarial total ${fmt.mxnK(r.derramaSalarial)}.`}
          evidence={[
            { label: 'Derrama total', value: fmt.mxnM(r.derremaTotal) },
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
