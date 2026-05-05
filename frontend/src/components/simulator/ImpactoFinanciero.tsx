'use client'
import { useMemo } from 'react'
import { shallow } from 'zustand/shallow'
import { useSimulatorStore } from '@/store/simulatorStore'
import { monteCarlo, tornadoAnalysis } from '@/lib/calculator'
import { fmt } from '@/lib/utils'
import { WaterfallChart } from '@/components/charts/WaterfallChart'
import { MonteCarloCChart } from '@/components/charts/MonteCarloChart'
import { TornadoChart } from '@/components/charts/TornadoChart'
import { CashflowChart } from '@/components/charts/CashflowChart'
import { StressTest } from '@/components/charts/StressTest'
import { Slider } from '@/components/ui/Slider'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

export function ImpactoFinanciero() {
  const { resultados, wacc, setWacc, tipoCambio, setTipoCambio,
          precioCarbonoEsc, setPrecioCarbonoEsc, precios, setPrecio, horizonte,
          pctCapturaPorAño, mermaLogPct } = useSimulatorStore()
  const r = resultados
  const blocked = !useSimulatorStore.getState().gatesAprobados[0]

  const mcInputs = useSimulatorStore(
    s => ({
      precios: s.precios,
      pctCapturaPorAño: s.pctCapturaPorAño,
      mermaLogPct: s.mermaLogPct,
      horizonte: s.horizonte,
    }),
    shallow,
  )

  const tirDistribution = useMemo(
    () => monteCarlo(useSimulatorStore.getState(), 2000),
    [mcInputs],
  )

  const mcPercentiles = useMemo(() => {
    const len = tirDistribution.length
    if (!len) return null
    const q = (p: number) => tirDistribution[Math.min(len - 1, Math.floor(len * p))]
    return { p10: q(0.1), p50: q(0.5), p90: q(0.9) }
  }, [tirDistribution])

  const tornadoRows = useMemo(
    () => tornadoAnalysis(useSimulatorStore.getState()),
    [wacc, precios, pctCapturaPorAño, mermaLogPct],
  )

  return (
    <div className={blocked ? 'overlay-blocked' : ''}>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S14 — Impacto financiero</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Retorno e inversión</h2>

      {/* KPIs financieros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'TIR proyecto',   v: r ? `${r.tir.toFixed(1)}%`        : '—', c: 'text-[#3B6D11]' },
          { l: 'VPN (WACC)',     v: r ? fmt.mxnK(r.vpn)              : '—', c: 'text-[#3B6D11]' },
          { l: 'EBITDA/año',     v: r ? fmt.mxnK(r.ebitda / Math.max(1, useSimulatorStore.getState().horizonte)) : '—', c: '' },
          { l: 'Payback',        v: r ? `${r.paybackMeses.toFixed(0)} meses` : '—', c: '' },
        ].map(item => (
          <div key={item.l} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide mb-1">{item.l}</p>
            <p className={`font-mono text-[22px] font-medium ${item.c || 'text-[#1C1B18]'}`}>{item.v}</p>
          </div>
        ))}
      </div>

      {/* Controles financieros */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 mb-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-4">Parámetros financieros</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Slider label="WACC (%)" value={wacc} min={12} max={30} step={1} onChange={setWacc}
            formatValue={v => `${v}%`} source="Modelo CFO certificado" />
          <Slider label="Tipo de cambio MXN/USD" value={tipoCambio} min={14} max={22} step={0.10}
            onChange={setTipoCambio} formatValue={v => `$${v.toFixed(2)}`} source="Banxico API" />

          {/* Precios commodities */}
          <Slider label="Precio PET ($/kg)" value={precios.pet} min={3} max={12} step={0.10}
            onChange={v => setPrecio('pet', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source="Serper API" />
          <Slider label="Precio Aluminio ($/kg)" value={precios.aluminio} min={10} max={40} step={0.50}
            onChange={v => setPrecio('aluminio', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source="Serper API" />
          <Slider label="Precio Papel ($/kg)" value={precios.papel} min={0.70} max={5} step={0.10}
            onChange={v => setPrecio('papel', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source="Serper API" />
          <Slider label="Precio Vidrio ($/kg)" value={precios.vidrio} min={0.90} max={5} step={0.10}
            onChange={v => setPrecio('vidrio', v)} formatValue={v => `$${v.toFixed(2)}/kg`} source="Serper API" />
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
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Desglose de valor (Waterfall)</p>
        <WaterfallChart />
        {r && (
          <NarrativeBridge
            kicker="S22 · Lectura del Waterfall"
            variant={r.vpn >= 0 ? 'result' : 'warning'}
            summary={r.vpn >= 0
              ? `Los componentes positivos sostienen un VPN de ${fmt.mxnK(r.vpn)} con TIR ${r.tir.toFixed(1)}%. El proyecto crea valor con la WACC actual (${wacc}%).`
              : `El VPN proyectado es ${fmt.mxnK(r.vpn)} bajo WACC ${wacc}%. Revisa supuestos de ingresos o reduce CAPEX para regresar a creación de valor.`}
            evidence={[
              { label: 'TIR', value: `${r.tir.toFixed(1)}%` },
              { label: 'VPN', value: fmt.mxnK(r.vpn) },
              { label: 'WACC', value: `${wacc}%` },
              { label: 'Payback', value: `${r.paybackMeses.toFixed(0)} meses` },
            ]}
            source={{ fuente: 'Modelo financiero ALQUIMIA', unidad: 'MXN', incertidumbre: 'Sensible a precios commodities y volumen capturado.' }}
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
                : `El percentil 10 (${mcPercentiles.p10.toFixed(1)}%) cruza por debajo de la WACC (${wacc}%): revisa capturas de volumen o precios antes de comprometer CAPEX. `) +
              `Payback base ${r.paybackMeses.toFixed(0)} meses.`
            }
            evidence={[
              { label: 'Simulaciones', value: '2,000' },
              { label: 'TIR P10', value: `${mcPercentiles.p10.toFixed(1)}%` },
              { label: 'TIR mediana', value: `${mcPercentiles.p50.toFixed(1)}%` },
              { label: 'TIR P90', value: `${mcPercentiles.p90.toFixed(1)}%` },
            ]}
            source={{ fuente: 'Monte Carlo ALQUIMIA', incertidumbre: 'Perturbación ± en precios commodity y trayectoria de captura.' }}
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
            source={{ fuente: 'Sensibilidad ALQUIMIA', unidad: 'MXN', incertidumbre: '±20% por variable manteniendo el resto constante.' }}
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
            summary={`En el horizonte de ${horizonte} años el modelo acumula ingresos brutos de ${fmt.mxnK(r.ingresosBrutos)}, CAPEX ${fmt.mxnK(r.capexTotal)} y EBITDA total ${fmt.mxnK(r.ebitda)}. La forma del cashflow indica si el proyecto necesita refinanciamiento temprano o amortización lineal.`}
            evidence={[
              { label: 'Horizonte', value: `${horizonte} años` },
              { label: 'Ingresos brutos', value: fmt.mxnK(r.ingresosBrutos) },
              { label: 'CAPEX', value: fmt.mxnK(r.capexTotal) },
              { label: 'EBITDA acum.', value: fmt.mxnK(r.ebitda) },
            ]}
            source={{ fuente: 'Serie anual ALQUIMIA', unidad: 'MXN nominal', incertidumbre: 'Supuestos de trayectoria de captura y precios.' }}
            nextStep={{ label: 'Explora el stress adversarial' }}
          />
        )}
      </div>

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
            source={{ fuente: 'Stress grid ALQUIMIA', incertidumbre: 'Combinaciones discretas; no sustituye simulación completa.' }}
          />
        )}
      </div>
    </div>
  )
}
