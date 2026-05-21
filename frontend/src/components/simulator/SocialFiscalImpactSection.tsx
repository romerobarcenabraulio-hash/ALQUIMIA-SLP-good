'use client'

import { useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { EntidadKey } from '@/data/stateFiscalBaselines'
import { fmt } from '@/lib/utils'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import {
  computeSocialFiscalImpact,
  type EscenarioFiscal,
} from '@/lib/social/socialFiscalImpact'
import { cn } from '@/lib/utils'

const ESTADO_BY_ZM: Record<string, EntidadKey> = {
  SLP: 'San Luis Potosí',
  MTY: 'Nuevo León',
  QRO: 'Querétaro',
}

export function SocialFiscalImpactSection() {
  const resultados = useSimulatorStore(s => s.resultados)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipio = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const [escenario, setEscenario] = useState<EscenarioFiscal>('base')

  const estado: EntidadKey =
    (municipio?.estadoNombre as EntidadKey | undefined) ??
    ESTADO_BY_ZM[zmActiva] ??
    'San Luis Potosí'

  const impact = useMemo(() => {
    if (!resultados) return null
    return computeSocialFiscalImpact({
      resultados,
      estado,
      municipioGeoCode: municipio?.claveInegi,
      escenario,
    })
  }, [resultados, estado, municipio?.claveInegi, escenario])

  if (!resultados || !impact) {
    return (
      <div className="rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FAFAF8] p-5 text-[12px] text-[#6B6760]">
        Ajusta el escenario en M01 para calcular la evaluación socioeconómica.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['conservador', 'base', 'optimista'] as const).map(e => (
          <button
            key={e}
            type="button"
            onClick={() => setEscenario(e)}
            className={cn(
              'rounded-full px-3 py-1 text-[10px] font-semibold capitalize border',
              escenario === e
                ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                : 'bg-white text-[#6B6760] border-[#E8E4DC]',
            )}
          >
            {e}
          </button>
        ))}
      </div>

      {impact.scopeWarning && (
        <div className="rounded-[8px] border border-[#D4881E]/30 bg-[#FEF7E7] px-3 py-2 text-[11px] text-[#6B4800]">
          {impact.scopeWarning}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Empleos efectivos', value: fmt.num0(impact.empleosEfectivos) },
          { label: 'Personas beneficiadas', value: fmt.num0(impact.personasBeneficiadas) },
          { label: '↓ Pobreza municipal', value: `${impact.reduccionPobrezaMunPp.toFixed(2)} pp` },
          { label: '↓ Pobreza estatal', value: `${impact.reduccionPobrezaEstPp.toFixed(3)} pp` },
        ].map(k => (
          <div key={k.label} className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3">
            <p className="text-[9px] uppercase tracking-wide text-[#A8A49C]">{k.label}</p>
            <p className="text-[18px] font-semibold text-[#1C1B18] font-mono mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] px-5 py-4">
        <p className="text-[12px] font-semibold text-[#1A4200] mb-3">Waterfall — alivio fiscal estatal equivalente</p>
        <div className="space-y-2">
          {impact.waterfall.map(row => (
            <div key={row.id} className="flex items-center justify-between rounded-[8px] bg-white/80 border border-[#C9DDB1] px-3 py-2">
              <span className="text-[11px] text-[#4A4740]">{row.label}</span>
              <span className="text-[11px] font-bold font-mono text-[#3B6D11]">{fmt.mxn(row.montoAnualMxn)}/año</span>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-[8px] bg-[#3B6D11] px-3 py-2 text-white">
            <span className="text-[11px] font-semibold">Total alivio fiscal anual</span>
            <span className="text-[12px] font-bold font-mono">{fmt.mxn(impact.alivioFiscalAnualMxn)}/año</span>
          </div>
        </div>
        <p className="text-[11px] text-[#5A6347] mt-3">
          Equivalente sobre stock de deuda estatal:{' '}
          <strong>{impact.equivalenteReduccionDeudaPct.toFixed(3)}%</strong> anual
          (no es pago directo de principal).
        </p>
        <p className="text-[9px] text-[#6B6760] mt-2 flex items-center gap-1">
          <ProvenanceBadge tipo="estimado" confianza={0.62} fuente="CONEVAL 2022 · SHCP · calculator.ts" />
        </p>
      </div>

      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4 text-[11px] text-[#6B6760] leading-relaxed">
        <p className="font-medium text-[#1C1B18] mb-1">Etiquetado honesto</p>
        Personas con ingreso adicional sobre línea de pobreza — no certifica salida de pobreza multidimensional CONEVAL.
        Indirectos ponderados al 60%. Cap de salida: 15% del stock de pobreza municipal.
      </div>
    </div>
  )
}
