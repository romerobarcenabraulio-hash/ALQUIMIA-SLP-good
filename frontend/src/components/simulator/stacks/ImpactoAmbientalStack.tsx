'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

export function ImpactoAmbientalStack() {
  const resultados = useSimulatorStore(s => s.resultados)
  const resultadosSinPrograma = useSimulatorStore(s => s.resultadosSinPrograma)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const r = resultados

  if (!r) {
    return (
      <p className="text-[12px] text-[#6B6760] rounded-[8px] border border-dashed border-[#E8E4DC] p-4">
        Configure el escenario en M01 para ver impactos ambientales y sanitarios.
      </p>
    )
  }

  const kpis = [
    { label: 'CO₂e acumulado', value: fmt.co2(r.co2eEvitadasHorizonteTon), color: '#1A5FA8' },
    { label: 'PM2.5 evitado', value: `${r.pm25EvitadoTon.toFixed(1)} t`, color: '#5A9438' },
    { label: 'Casos IRA evitados', value: fmt.num0(r.casosIRAEvitados), color: '#C0392B' },
    { label: 'Casos dengue evitados', value: fmt.num0(r.casosDengueEvitados), color: '#D4881E' },
    { label: 'AVAD evitados', value: r.avadEvitados.toFixed(0), color: '#C0392B' },
    { label: 'Biogás (informativo)', value: fmt.kwh(r.kwhBiogas), color: '#5A4A2A' },
    { label: 'Vida relleno extendida', value: `+${r.extensionRelleno.toFixed(1)} años`, color: '#3B6D11' },
    { label: 'Ingreso carbono', value: fmt.mxn(r.ingresoCarbono), color: '#4A1C7A' },
  ]

  return (
    <div className="space-y-5">

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(item => (
          <div key={item.label} className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3 text-center">
            <p className="font-mono text-[14px] font-semibold" style={{ color: item.color }}>{item.value}</p>
            <p className="text-[11px] text-[#A8A49C] mt-1">{item.label}</p>
          </div>
        ))}
      </div>

      <NarrativeBridge
        variant="bridge"
        summary={`Con ${fmt.co2(r.co2eEvitadasHorizonteTon)} CO₂e evitadas en ${horizonte} años y ${r.pm25EvitadoTon.toFixed(1)} t PM2.5, el argumento ambiental en ALQUIMIA solo es defendible si el factor de emisión del relleno local está acotado. Si el contrafactual sin programa supera ${fmt.kgd(resultadosSinPrograma?.rsuTotalTonDia ?? r.rsuTotalTonDia)} RSU/día, lleve estas cifras a M04 costo de omisión; si falta dato de relleno, baje confianza antes de anexar a informe oficial.`}
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
        <div className="rounded-[10px] bg-[#FEF7E7] border border-[#F5D98A] px-4 py-3 text-[12px] text-[#6B4800]">
          <strong>Sin programa (contrafactual):</strong>{' '}
          {fmt.kgd(resultadosSinPrograma.rsuTotalTonDia)} RSU/día ·{' '}
          {fmt.mxnM(resultadosSinPrograma.ingresosBrutos / Math.max(1, horizonte))}/año ingresos perdidos
        </div>
      )}

      <p className="text-[10px] text-[#6B6760] flex items-center gap-1">
        <ProvenanceBadge tipo="estimado" confianza={0.68} fuente="OPS/INSP · INECC · calculator.ts" />
        Biogás no incluido en ingresos base — requiere permiso CRE.
      </p>
    </div>
  )
}
