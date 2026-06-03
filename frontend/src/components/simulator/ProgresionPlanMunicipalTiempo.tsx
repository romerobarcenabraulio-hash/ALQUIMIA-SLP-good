'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import dynamic from 'next/dynamic'

const ProgresionPlanCharts = dynamic(
  () => import('@/components/simulator/ProgresionPlanCharts').then(m => ({ default: m.ProgresionPlanCharts })),
  { ssr: false, loading: () => <p className="mt-3 text-[12px] text-[#6B6760]">Cargando gráficas…</p> },
)
import { useSimulatorStore } from '@/store/simulatorStore'
import {
  buildHitosResumenRows,
  buildMunicipalPlanTimeSeries,
} from '@/lib/municipalPlanTimeSeries'
import { getHitosForZm } from '@/data/hitosTimeline'
import { mesEquivalenteBaselineEnPlan } from '@/lib/municipioMadurezContexto'
import { fmt } from '@/lib/utils'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { TraceRibbon } from '@/components/ui/TraceRibbon'
import { CORTE_UI } from '@/lib/progresionUiConstants'
import {
  Conclusion,
  KpiAnchorGrid,
  MarginalNote,
  SectionLabel,
} from '@/components/editorial'

function hitosTraceFuente(zmId: string, catalogLabel: string | null): string {
  if (catalogLabel) {
    return `ALQUIMIA · ${catalogLabel}`
  }
  return `ALQUIMIA · hitos ZM ${zmId} (catálogo territorial de referencia).`
}

function tooltipNum(v: unknown, digits: number): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '—'
}

export function ProgresionPlanMunicipalTiempo() {
  const recalcular = useSimulatorStore(s => s.recalcular)
  const { horizonte, presetTrayectoria, genPercapita } = useSimulatorStore(
    useShallow(s => ({
      horizonte: s.horizonte,
      presetTrayectoria: s.presetTrayectoria,
      genPercapita: s.genPercapita,
    })),
  )
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const hitosBundle = useMemo(() => getHitosForZm(zmActiva), [zmActiva])
  const resultados = useSimulatorStore(s => s.resultados)
  const resultadosSinPrograma = useSimulatorStore(s => s.resultadosSinPrograma)
  const baselinePct = useSimulatorStore(s => s.circularityBaseline?.current_circularity_pct)

  const bootstrapped = useRef(false)
  useEffect(() => {
    if (bootstrapped.current) return
    if (!useSimulatorStore.getState().resultados) {
      bootstrapped.current = true
      recalcular()
    }
  }, [recalcular])

  const serie = useMemo(() => {
    if (!resultados) return []
    return buildMunicipalPlanTimeSeries(
      useSimulatorStore.getState(),
      resultados,
      resultadosSinPrograma,
      { baselineCircularityPct: baselinePct },
    )
  }, [resultados, resultadosSinPrograma, baselinePct, zmActiva, horizonte, genPercapita, presetTrayectoria])

  const filasHitos = useMemo(
    () => buildHitosResumenRows(horizonte, hitosBundle.hitos),
    [horizonte, hitosBundle.hitos],
  )

  const chartData = useMemo(
    () =>
      serie.map(p => ({
        ...p,
        derramaM: p.derramaAcumuladaMxN / 1e6,
        ingresoM: p.ingresoValorizacionMesMxN / 1e6,
        co2eKt: p.co2eEvitadasAcumTon / 1000,
        ahorroSaludM: p.ahorroSaludAcumMxN / 1e6,
      })),
    [serie],
  )

  const totalMeses = serie.length
  const mesMadurez = useMemo(
    () => mesEquivalenteBaselineEnPlan(baselinePct, totalMeses),
    [baselinePct, totalMeses],
  )

  const [mesVista, setMesVista] = useState(1)
  const [showCharts, setShowCharts] = useState(true)


  useEffect(() => {
    if (totalMeses < 1) return
    setMesVista(prev => Math.min(Math.max(1, prev), totalMeses))
  }, [totalMeses])

  const instantanea = serie[mesVista - 1] ?? null

  const xTickStep = Math.max(1, Math.ceil(totalMeses / 8))

  if (!resultados || serie.length === 0) {
    return (
      <section
        className="border border-dashed border-[#E8E4DC] px-4 py-6 text-[12px] text-[#6B6760]"
        data-testid="progresion-plan-empty"
      >
        <Conclusion className="text-[17px] mb-2">Progresión temporal no disponible aún</Conclusion>
        <MarginalNote>
          Confirma municipio activo y baseline cargado arriba; el motor recalcula al entrar. Si persiste, ajusta horizonte o
          generación per cápita en el panel RSU.
        </MarginalNote>
        <button
          type="button"
          onClick={() => recalcular()}
          className="mt-3 rounded-[6px] border border-[#3B6D11] px-3 py-1.5 text-[12px] font-medium text-[#23470A] hover:bg-[#EAF3DE]"
        >
          Recalcular escenario
        </button>
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <header>
        <h2 className="font-serif text-[24px] text-[#1C1B18]">
          Progresión del Plan Municipal en el Tiempo
        </h2>
        <ScopeAnclaKicker className="mt-2" />
        <MarginalNote className="max-w-3xl">
          Infraestructura, economía circular y cobeneficios en el mismo eje temporal — horizonte {horizonte}a,
          generación {Number(genPercapita ?? 0).toFixed(2)} kg/hab/día, trayectoria {presetTrayectoria}.
        </MarginalNote>
      </header>

      <section className="space-y-3 border-t border-[#E8E4DC] pt-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Conclusion className="text-[18px] md:text-[19px] mb-0">
            Mes {mesVista} de {totalMeses}
            {instantanea && (
              <span className="ml-2 text-[13px] font-sans font-normal text-[#6B6760]">
                ({instantanea.etiqueta})
              </span>
            )}
          </Conclusion>
          <button
            type="button"
            onClick={() => setMesVista(mesMadurez.mes)}
            className="rounded-[8px] border border-[#3B6D11]/40 bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#23470A] hover:bg-[#EAF3DE] transition-colors"
          >
            Ir a mes madurez baseline (~{mesMadurez.mes})
          </button>
        </div>
        <input
          type="range"
          min={1}
          max={totalMeses}
          value={mesVista}
          onChange={e => setMesVista(Number(e.target.value))}
          className="w-full h-2 accent-[#3B6D11] cursor-pointer"
          aria-label={`Mes del plan: ${mesVista} de ${totalMeses}`}
        />
        <MarginalNote>
          Cada municipio tiene madurez distinta en separación y marco de limpia. La línea verde punteada en las gráficas marca el mes
          equivalente orientativo a la circularidad de referencia del API para esta ciudad (
          {baselinePct != null ? `${baselinePct.toFixed(1)}%` : 'sin dato'}
          → mes ~{mesMadurez.mes}). La línea oscura sigue el mes que eliges. Es supuesto de lectura, no calendario de cabildo.
        </MarginalNote>
        {instantanea && (
          <KpiAnchorGrid
            columns={4}
            className="border-t border-[#E8E4DC] pt-3"
            items={[
              { label: 'CAs acum.', value: String(instantanea.caAcumulados) },
              { label: 'Recicladoras', value: String(instantanea.recicladorasAcumuladas) },
              { label: 'Empleos formales', value: instantanea.empleosFormalesAcum.toFixed(0) },
              { label: 'Derrama acum.', value: fmt.mxnM(instantanea.derramaAcumuladaMxN) },
              { label: 'Tons captura / mes', value: `${instantanea.toneladasCapturadasMes.toFixed(1)} t` },
              { label: 'CO₂e acum.', value: `${(instantanea.co2eEvitadasAcumTon / 1000).toFixed(2)} kt` },
              { label: 'Circularidad comp.', value: `${instantanea.circularidadCompuestaPct.toFixed(1)}%` },
            ]}
          />
        )}
      </section>

      <section className="border-t border-[#E8E4DC] pt-4">
        <SectionLabel>Gráficas interactivas (opcional)</SectionLabel>
        <MarginalNote className="mb-3">
          Las curvas usan Recharts en un bloque aparte para no tumbar la pestaña del navegador. La tabla de hitos y el deslizador de mes
          funcionan sin cargar este bloque.
        </MarginalNote>
        {!showCharts ? (
          <button
            type="button"
            onClick={() => setShowCharts(true)}
            className="mt-3 rounded-[8px] border border-[#3B6D11]/50 bg-white px-3 py-2 text-[12px] font-medium text-[#23470A] hover:bg-[#EAF3DE]"
            data-testid="progresion-load-charts"
          >
            Cargar gráficas de progresión
          </button>
        ) : (
          <ProgresionPlanCharts
            chartData={chartData}
            mesVista={mesVista}
            mesMadurez={mesMadurez}
            xTickStep={xTickStep}
            zmActiva={zmActiva}
            hitosTraceLabel={hitosTraceFuente(zmActiva, hitosBundle.catalogLabel)}
          />
        )}
      </section>

      {/* Tabla hitos */}
      <div className="border-t border-[#E8E4DC] pt-4 overflow-x-auto">
        <SectionLabel>Resumen por hitos escalados al horizonte</SectionLabel>
        <MarginalNote className="mb-3">
          Fechas en meses relativos al plan; deltas del catálogo; columna de acumulados orientativa.
        </MarginalNote>
        <table className="w-full min-w-[640px] text-left text-[11px]">
          <thead>
            <tr className="border-b border-[#E8E4DC] text-[#A8A49C]">
              <th className="py-2 pr-2 font-medium">Hito</th>
              <th className="py-2 pr-2 font-medium">Fecha estimada</th>
              <th className="py-2 pr-2 font-medium">Variable clave</th>
              <th className="py-2 pr-2 font-medium">Delta del periodo</th>
              <th className="py-2 font-medium">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {filasHitos.map(row => (
              <tr key={row.id} className="border-b border-[#F0EDE5] align-top">
                <td className="py-2 pr-2 text-[#1C1B18] font-medium">{row.hito}</td>
                <td className="py-2 pr-2 text-[#6B6760]">{row.etiquetaTemporal}</td>
                <td className="py-2 pr-2 text-[#6B6760]">{row.variableClave}</td>
                <td className="py-2 pr-2 text-[#6B6760]">{row.deltaPeriodo}</td>
                <td className="py-2 text-[#6B6760] font-mono text-[10px]">{row.acumuladoNota}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <TraceRibbon
          hecho="Catálogo de hitos con PERT en días (`hitosTimeline.ts`), versión activa según ZM."
          supuesto="Escala temporal: mes_hit = (E(PERT)/1080)×(horizonte×12), referencia 36 meses×30 días."
          fuente={`${hitosTraceFuente(zmActiva, hitosBundle.catalogLabel)} · HORIZONTE_DIAS_MESES_36.`}
          formula="pertExpectedDays = (o+4m+p)/6; mes redondeado al ciclo municipal activo."
          corte={CORTE_UI}
          confianza="bajo"
        />
      </div>
    </section>
  )
}
