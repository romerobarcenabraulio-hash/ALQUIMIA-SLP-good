'use client'
import { useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { monteCarlo, tornadoAnalysis } from '@/lib/calculator'
import { fmt, cn } from '@/lib/utils'
import { WaterfallChart } from '@/components/charts/WaterfallChart'
import { MonteCarloCChart } from '@/components/charts/MonteCarloChart'
import { TornadoChart } from '@/components/charts/TornadoChart'
import { CashflowChart } from '@/components/charts/CashflowChart'
import { StressTest } from '@/components/charts/StressTest'
import { Slider } from '@/components/ui/Slider'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { ContextoModulo } from '@/components/ui/ContextoModulo'
import { describeMaterialPriceReference, PRICE_RESEARCH_SOURCE_LABEL } from '@/data/materialPriceResearch'
import type { AñoResultados } from '@/types'

// ── Monthly cost breakdown ────────────────────────────────────────────────────

const MESES_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'] as const

type MesDato = {
  label: string
  año: number
  mes: number
  capex: number
  opex: number
  ingreso: number
  fcf: number
  fcfAcumulado: number
  isBreakeven: boolean
}

function buildMensualData(serieAnual: AñoResultados[], maxAños: number): MesDato[] {
  const rows: MesDato[] = []
  let fcfAcum = 0
  let crossedZero = false

  for (const año of serieAnual.slice(0, maxAños)) {
    for (let mes = 0; mes < 12; mes++) {
      // CAPEX: front-loaded — 50% month 1, 30% month 2, 20% month 3
      let capexMes = 0
      if (año.capex > 0) {
        if (mes === 0) capexMes = año.capex * 0.50
        else if (mes === 1) capexMes = año.capex * 0.30
        else if (mes === 2) capexMes = año.capex * 0.20
      }
      const opexMes = año.opex / 12
      const ingresoMes = año.ingresos / 12
      const fcfMes = ingresoMes - opexMes - capexMes
      const prevAcum = fcfAcum
      fcfAcum += fcfMes

      const isBreakeven = !crossedZero && prevAcum < 0 && fcfAcum >= 0
      if (isBreakeven) crossedZero = true

      rows.push({
        label: `${MESES_ES[mes]} · Año ${año.año}`,
        año: año.año,
        mes,
        capex: capexMes,
        opex: opexMes,
        ingreso: ingresoMes,
        fcf: fcfMes,
        fcfAcumulado: fcfAcum,
        isBreakeven,
      })
    }
  }
  return rows
}

function MensualCostTable({ serieAnual }: { serieAnual: AñoResultados[] }) {
  const maxAños = Math.min(serieAnual.length, 3)
  const [showAll, setShowAll] = useState(false)
  const data = useMemo(() => buildMensualData(serieAnual, maxAños), [serieAnual, maxAños])
  const visibleRows = showAll ? data : data.slice(0, 12)

  function mxnK(v: number) {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`
    if (Math.abs(v) >= 1_000)     return `$${(v / 1_000).toFixed(0)}K`
    return `$${v.toFixed(0)}`
  }

  return (
    <div className="rounded-[10px] border border-[#E8E4DC] overflow-hidden">
      <div className="px-4 py-2.5 bg-[#FAFAF8] border-b border-[#F0EDE5] flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-[#1C1B18]">Flujo mensual de caja · primeros {maxAños} años</p>
          <p className="text-[9px] text-[#A8A49C] mt-0.5">CAPEX concentrado meses 1–3 · OPEX e ingreso distribuidos por mes · MXN nominales</p>
        </div>
        {data.length > 12 && (
          <button
            type="button"
            onClick={() => setShowAll(v => !v)}
            className="text-[10px] font-medium text-[#3B6D11] hover:underline shrink-0 ml-3"
          >
            {showAll ? `Mostrar solo Año 1` : `Ver ${maxAños} años`}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="bg-[#F4F2ED] border-b border-[#F0EDE5]">
              <th className="text-left px-3 py-2 font-semibold text-[#6B6760] whitespace-nowrap">Mes</th>
              <th className="text-right px-3 py-2 font-semibold text-[#3B6D11] whitespace-nowrap">Ingreso</th>
              <th className="text-right px-3 py-2 font-semibold text-[#C0392B] whitespace-nowrap">CAPEX</th>
              <th className="text-right px-3 py-2 font-semibold text-[#D4881E] whitespace-nowrap">OPEX</th>
              <th className="text-right px-3 py-2 font-semibold text-[#1C1B18] whitespace-nowrap">FCF mes</th>
              <th className="text-right px-3 py-2 font-semibold text-[#1A5FA8] whitespace-nowrap">FCF acum.</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <>
                {row.isBreakeven && (
                  <tr key={`break-${i}`} className="bg-[#EAF3DE]">
                    <td colSpan={6} className="px-3 py-1 text-[9px] font-semibold text-[#3B6D11] text-center">
                      ✓ Punto de equilibrio alcanzado
                    </td>
                  </tr>
                )}
                <tr
                  key={row.label}
                  className={cn(
                    'border-b border-[#F0EDE5] last:border-0',
                    row.mes === 0 && row.año > 1 && 'border-t-2 border-t-[#E8E4DC]',
                    row.fcf >= 0 ? 'bg-white' : 'bg-[#FEF7F7]',
                  )}
                >
                  <td className="px-3 py-1.5 text-[#4A4740] whitespace-nowrap font-medium">{row.label}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-[#3B6D11]">{mxnK(row.ingreso)}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-[#C0392B]">
                    {row.capex > 0 ? mxnK(row.capex) : <span className="text-[#E8E4DC]">—</span>}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[#D4881E]">{mxnK(row.opex)}</td>
                  <td className={cn('px-3 py-1.5 text-right font-mono font-semibold', row.fcf >= 0 ? 'text-[#3B6D11]' : 'text-[#C0392B]')}>
                    {mxnK(row.fcf)}
                  </td>
                  <td className={cn('px-3 py-1.5 text-right font-mono', row.fcfAcumulado >= 0 ? 'text-[#1A5FA8]' : 'text-[#A8A49C]')}>
                    {mxnK(row.fcfAcumulado)}
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ImpactoFinanciero() {
  const { resultados, wacc, setWacc, tipoCambio, setTipoCambio,
          precioCarbonoEsc, setPrecioCarbonoEsc, precios, setPrecio, horizonte,
          pctCapturaPorAño, mermaLogPct, zmActiva, municipiosActivos,
          costoDisposicionActivo, costoDisposicionPorTon } = useSimulatorStore()
  const r = resultados

  /* Linter: getState() no aparece en el grafo de deps; la lista fuerza recálculo al variar precios, trayectoria o ámbito municipal (Q-024). */
  /* eslint-disable react-hooks/exhaustive-deps */
  const tirDistribution = useMemo(
    () => monteCarlo(useSimulatorStore.getState(), 2000),
    [precios, pctCapturaPorAño, mermaLogPct, horizonte, zmActiva, municipiosActivos],
  )

  const tornadoRows = useMemo(
    () => tornadoAnalysis(useSimulatorStore.getState()),
    [wacc, precios, pctCapturaPorAño, mermaLogPct, zmActiva, municipiosActivos],
  )
  /* eslint-enable react-hooks/exhaustive-deps */

  const mcPercentiles = useMemo(() => {
    const len = tirDistribution.length
    if (!len) return null
    const q = (p: number) => tirDistribution[Math.min(len - 1, Math.floor(len * p))]
    return { p10: q(0.1), p50: q(0.5), p90: q(0.9) }
  }, [tirDistribution])

  return (
    <div>
      <details className="mb-4 text-[11px] rounded-[10px] border border-[#E8E4DC] overflow-hidden">
        <summary className="cursor-pointer px-4 py-2.5 text-[#6B6760] hover:text-[#1C1B18] hover:bg-[#FAFAF8] transition-colors select-none">
          Metodología del modelo financiero
        </summary>
        <div className="border-t border-[#F0EDE5]">
          <ContextoModulo
            variante="financiero"
            titulo="¿Cómo está construido el modelo financiero?"
            cuerpo={`El modelo calcula flujos de caja desde venta de materiales separados (precio × volumen capturable × días operativos), ahorro de disposición ${costoDisposicionActivo ? `con supuesto editable de ${fmt.mxn(costoDisposicionPorTon)}/ton enterrada evitada` : 'desactivado en este escenario'} e ingresos ambientales condicionados. Contra eso proyecta inversión inicial y costos operativos. EBITDA, VPN, TIR y payback son proyecciones del escenario, no garantías de retorno ni presupuesto aprobado.`}
            puntos={[
              'WACC base: 20% (Bootstrap §0). Ajustable con crédito verde BID/BM desde 6.5%.',
              'Monte Carlo: 2,000 simulaciones con variación ±20% en precios, captura y costos operativos.',
              'Stress test: 4 escenarios adversos (PET -40%, adopción lenta, bloqueo concesionario, costos operativos +20%).',
              'TIR proyecto CA-G: 212% · CA-M: 155.6% · CA-P: 109.5% (Modelo_BASED.xlsx, Año 3).',
              'Payback típico: 5-7 meses para CA en régimen. El payback del programa global depende de inversión inicial, contenedores y comunicación.',
            ]}
            fuente={`Modelo financiero: calculator.ts / Modelo_BASED.xlsx. Precios: ${PRICE_RESEARCH_SOURCE_LABEL}. Crédito carbono: VCS Market 2024 / SEMARNAT SCE.`}
            advertencia="Los resultados son proyecciones de modelo, no garantías de retorno. La TIR real depende de la adopción ciudadana, el comportamiento del concesionario y la pureza del material entregado."
          />
        </div>
      </details>

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'TIR del proyecto',   v: r ? `${r.tir.toFixed(1)}%`        : '—', c: 'text-[#3B6D11]' },
          { l: 'VPN — valor presente neto',     v: r ? fmt.mxnK(r.vpn)              : '—', c: 'text-[#3B6D11]' },
          { l: 'EBITDA promedio anual',     v: r ? fmt.mxnK(r.ebitda / Math.max(1, useSimulatorStore.getState().horizonte)) : '—', c: '' },
          { l: 'Recuperación — meses',        v: r ? `${r.paybackMeses.toFixed(0)} meses` : '—', c: '' },
        ].map(item => (
          <div key={item.l} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide mb-1">{item.l}</p>
            <p className={`font-mono text-[22px] font-medium ${item.c || 'text-[#1C1B18]'}`}>{item.v}</p>
          </div>
        ))}
      </div>

      {/* Controles financieros */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 mb-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-4">Supuestos del modelo financiero</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Slider label="WACC (%)" value={wacc} min={12} max={30} step={1} onChange={setWacc}
            formatValue={v => `${v}%`} source="Supuesto financiero editable; validar con tesorería o asesor financiero." />
          <Slider label="Tipo de cambio MXN/USD" value={tipoCambio} min={14} max={22} step={0.10}
            onChange={setTipoCambio} formatValue={v => `$${v.toFixed(2)}`} source="Banxico API" />

          {/* Precios commodities */}
          <Slider label="Precio PET ($/kg)" value={precios.pet} min={3} max={12} step={0.10}
            onChange={v => setPrecio('pet', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source={describeMaterialPriceReference('pet', precios.pet)} />
          <Slider label="Precio Aluminio ($/kg)" value={precios.aluminio} min={10} max={40} step={0.50}
            onChange={v => setPrecio('aluminio', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source={describeMaterialPriceReference('aluminio', precios.aluminio)} />
          <Slider label="Precio Papel ($/kg)" value={precios.papel} min={0.70} max={5} step={0.10}
            onChange={v => setPrecio('papel', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source={describeMaterialPriceReference('papel', precios.papel)} />
          <Slider label="Precio Vidrio ($/kg)" value={precios.vidrio} min={0.90} max={5} step={0.10}
            onChange={v => setPrecio('vidrio', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source={describeMaterialPriceReference('vidrio', precios.vidrio)} />
        </div>

        {/* Precio carbono */}
        <div className="mt-4">
          <p className="text-[12px] text-[#6B6760] mb-2">Mercado de carbono</p>
          <div className="flex gap-2">
            {[
              { id: 'voluntario' as const, label: 'Voluntario ($5 USD/t)' },
              { id: 'sce' as const,        label: 'SCE México ($10-20 USD/t)' },
              { id: 'eu' as const,         label: 'EU ETS ($60-90 USD/t)' },
            ].map(opt => (
              <button
                key={opt.id}
                onClick={() => setPrecioCarbonoEsc(opt.id)}
                className={`px-3 py-1.5 rounded-[6px] text-[11px] border transition-colors ${
                  precioCarbonoEsc === opt.id
                    ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                    : 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfica Waterfall */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Valor acumulado — venta base y escenario ampliado</p>
        <WaterfallChart />
        {r && (
          <NarrativeBridge
            kicker="S22 · Lectura del Waterfall"
            variant={r.vpn >= 0 ? 'result' : 'warning'}
            summary={r.vpn >= 0
              ? `Los componentes positivos sostienen un VPN de ${fmt.mxnK(r.vpn)} con TIR ${r.tir.toFixed(1)}%. El proyecto crea valor con la WACC actual (${wacc}%).`
              : `El VPN proyectado es ${fmt.mxnK(r.vpn)} bajo WACC ${wacc}%. Revisa supuestos de ingresos o reduce inversión inicial para regresar a creación de valor.`}
            evidence={[
              { label: 'TIR', value: `${r.tir.toFixed(1)}%` },
              { label: 'VPN', value: fmt.mxnK(r.vpn) },
              { label: 'WACC', value: `${wacc}%` },
              { label: 'Payback', value: `${r.paybackMeses.toFixed(0)} meses` },
            ]}
            source={{ fuente: 'Venta base = precio_material × volumen_capturado × (1−merma); EBITDA = venta base + supuestos habilitados − costos operativos de centros y rutas; VPN y TIR al WACC del escenario', unidad: 'MXN', incertidumbre: 'Sensible a precios de material, curva de captura y costo de disposición editable.' }}
            nextStep={{ label: 'Lee la sensibilidad (Tornado)' }}
          />
        )}
      </div>

      {/* Monte Carlo */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">
          Distribución Monte Carlo TIR · 2,000 simulaciones
        </p>
        <MonteCarloCChart />
        {r && mcPercentiles && (
          <NarrativeBridge
            kicker="S22 · Lectura del Monte Carlo"
            variant={mcPercentiles.p10 < wacc ? 'warning' : 'result'}
            summary={
              `En 2,000 corridas aleatorias, el TIR cae en el percentil 10 a ${mcPercentiles.p10.toFixed(1)}%, la mediana queda en ${mcPercentiles.p50.toFixed(1)}% y el percentil 90 llega a ${mcPercentiles.p90.toFixed(1)}%. ` +
              (mcPercentiles.p10 >= wacc
                ? `Incluso el tramo inferior (${mcPercentiles.p10.toFixed(1)}%) mantiene colchón sobre la WACC (${wacc}%). `
                : `El percentil 10 (${mcPercentiles.p10.toFixed(1)}%) cruza por debajo de la WACC (${wacc}%): revisa capturas de volumen o precios antes de comprometer inversión inicial. `) +
              `Payback base ${r.paybackMeses.toFixed(0)} meses.`
            }
            evidence={[
              { label: 'Simulaciones', value: '2,000' },
              { label: 'TIR P10', value: `${mcPercentiles.p10.toFixed(1)}%` },
              { label: 'TIR mediana', value: `${mcPercentiles.p50.toFixed(1)}%` },
              { label: 'TIR P90', value: `${mcPercentiles.p90.toFixed(1)}%` },
            ]}
            source={{ fuente: '2,000 corridas: precios y captura% perturbados con distribución normal ±σ; se reportan percentiles 10/50/90 del TIR resultante', incertidumbre: 'Perturbación ± en precios commodity y trayectoria de captura.' }}
            nextStep={{ label: 'Compara con Tornado de sensibilidad' }}
          />
        )}
      </div>

      {/* Tornado */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Análisis de sensibilidad ±20% en VPN</p>
        <div className="mb-5">
          <TornadoChart />
        </div>
        {tornadoRows.length > 0 && (
          <NarrativeBridge
            kicker="S22 · Lectura del Tornado"
            variant="bridge"
            summary={
              tornadoRows.length >= 2
                ? 'El tornado ordena factores por cuánto desplazan el VPN ante variaciones del 20%: suele bastar con vigilar un grupo reducido de palancas antes de afinar el resto. La gráfica y la rejilla de referencia recogen el ranking y las magnitudes; aquí el foco es la lectura ejecutiva del reparto de riesgo.'
                : 'El tornado muestra qué factor más mueve el VPN bajo choques del 20%; usa la gráfica y la rejilla para ver el orden y la escala del barrido. Prioriza acotar esa incertidumbre antes de ajustes menores en otros supuestos.'
            }
            evidence={[
              { label: 'Variable 1 · mayor rango', value: tornadoRows[0]?.label ?? '—' },
              { label: 'Rango VPN (1ª)', value: tornadoRows[0] ? fmt.mxnM(tornadoRows[0].range) : '—' },
              { label: 'Variable 2', value: tornadoRows[1]?.label ?? '—' },
              { label: 'Rango VPN (2ª)', value: tornadoRows[1] ? fmt.mxnM(tornadoRows[1].range) : '—' },
            ]}
            source={{ fuente: 'Cada variable varía ±20% independientemente; el VPN resultante menos el VPN base mide el desplazamiento; las variables se ordenan por magnitud de rango', unidad: 'MXN', incertidumbre: '±20% por variable manteniendo el resto constante.' }}
            nextStep={{ label: 'Revisa el cashflow proyectado' }}
          />
        )}
      </div>

      {/* Cashflow */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Flujo de caja acumulado · 3 escenarios</p>
        <CashflowChart />
        {r && (
          <NarrativeBridge
            kicker="S22 · Lectura del cashflow"
            variant="bridge"
            summary={`En ${horizonte} años el modelo acumula derrama bruta ${fmt.mxnK(r.ingresosBrutos)} —inversión inicial ${fmt.mxnK(r.capexTotal)} y EBITDA acumulado ${fmt.mxnK(r.ebitda)}. La forma del flujo dice si hace falta refinanciamiento temprano o si la captura sostiene la deuda.`}
            evidence={[
              { label: 'Horizonte', value: `${horizonte} años` },
              { label: 'Derrama económica estimada por venta de materiales', value: fmt.mxnK(r.ingresosBrutos) },
              { label: 'Inversión inicial', value: fmt.mxnK(r.capexTotal) },
              { label: 'EBITDA acumulado', value: fmt.mxnK(r.ebitda) },
            ]}
            source={{ fuente: 'Flujo anual = derrama_año − costos_operativos_año − inversión inicial en año cero; acumulado corrido con tipo de cambio y precios del escenario', unidad: 'MXN nominal', incertidumbre: 'Trayectoria de captura y plena cobertura de rutas.' }}
            nextStep={{ label: 'Explora el stress adversarial' }}
          />
        )}
      </div>

      {/* Monthly cashflow breakdown */}
      {r?.serieAnual && r.serieAnual.length > 0 && (
        <details className="mb-6 rounded-[12px] border border-[#E8E4DC] overflow-hidden">
          <summary className="cursor-pointer bg-[#F6FAEF] px-4 py-3 text-[11px] font-medium text-[#3B6D11] select-none list-none flex items-center justify-between hover:bg-[#EDF7E0] transition-colors">
            <span>Desglose mes a mes · CAPEX / OPEX / Ingreso / FCF</span>
            <span className="text-[9px] text-[#8CAA7A]">▾</span>
          </summary>
          <div className="p-4 border-t border-[#D7E8C0] bg-white">
            <p className="text-[11px] text-[#6B6760] mb-3 leading-snug">
              El primer año concentra la inversión en capital (CAPEX) en los meses de arranque, mientras el ingreso crece con la adopción ciudadana. Las filas en rojo indican meses con flujo negativo — esperable hasta alcanzar el punto de equilibrio.
            </p>
            <MensualCostTable serieAnual={r.serieAnual} />
          </div>
        </details>
      )}

      {/* Stress test */}
      <div>
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Grid de stress test</p>
        <StressTest />
        {r && (
          <NarrativeBridge
            kicker="S22 · Stress adversarial"
            variant={r.vpn >= 0 ? 'bridge' : 'warning'}
            summary={`La rejilla contrasta choques de volumen y precios respecto al caso base (VPN ${fmt.mxnK(r.vpn)}, TIR ${r.tir.toFixed(1)}%). Si la mayoría de celdas permanece verde, la estructura aguanta shocks coordinados; si predominan tonos adversos, prioriza contratos indexados o hedges simples.`}
            evidence={[
              { label: 'VPN base', value: fmt.mxnK(r.vpn) },
              { label: 'TIR base', value: `${r.tir.toFixed(1)}%` },
              { label: 'Payback', value: `${r.paybackMeses.toFixed(0)} meses` },
              { label: 'DSCR', value: `${r.dscr.toFixed(2)}×` },
            ]}
            source={{ fuente: 'Rejilla de combinaciones discretas: volumen de captura × precio promedio ponderado; cada celda recalcula VPN completo con el resto de parámetros fijos', incertidumbre: 'Combinaciones discretas; no sustituye simulación completa.' }}
          />
        )}
      </div>
    </div>
  )
}
