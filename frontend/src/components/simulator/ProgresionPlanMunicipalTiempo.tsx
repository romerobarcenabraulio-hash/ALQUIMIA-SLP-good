'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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

function hitosTraceFuente(zmId: string, catalogLabel: string | null): string {
  if (catalogLabel) {
    return `ALQUIMIA · ${catalogLabel}`
  }
  return `ALQUIMIA · hitos ZM ${zmId} (catálogo territorial de referencia).`
}

export function ProgresionPlanMunicipalTiempo() {
  const state = useSimulatorStore(s => ({
    horizonte: s.horizonte,
    presetTrayectoria: s.presetTrayectoria,
    genPercapita: s.genPercapita,
  }))
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const hitosBundle = useMemo(() => getHitosForZm(zmActiva), [zmActiva])
  const resultados = useSimulatorStore(s => s.resultados)
  const resultadosSinPrograma = useSimulatorStore(s => s.resultadosSinPrograma)
  const baselinePct = useSimulatorStore(s => s.circularityBaseline?.current_circularity_pct)

  const serie = useMemo(() => {
    if (!resultados) return []
    return buildMunicipalPlanTimeSeries(
      useSimulatorStore.getState(),
      resultados,
      resultadosSinPrograma,
      { baselineCircularityPct: baselinePct },
    )
  }, [resultados, resultadosSinPrograma, baselinePct, zmActiva])

  const filasHitos = useMemo(
    () => buildHitosResumenRows(state.horizonte, hitosBundle.hitos),
    [state.horizonte, hitosBundle.hitos],
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

  useEffect(() => {
    if (totalMeses < 1) return
    setMesVista(prev => Math.min(Math.max(1, prev), totalMeses))
  }, [totalMeses])

  const instantanea = serie[mesVista - 1] ?? null

  const xTickStep = Math.max(1, Math.ceil(totalMeses / 8))

  if (!resultados || serie.length === 0) {
    return (
      <section className="rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-6 text-[12px] text-[#6B6760]">
        Calcula el plan municipal para ver la progresión temporal integrada.
      </section>
    )
  }

  return (
    <section className="space-y-8">
      <header>
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Plan municipal integral</p>
        <h2 className="font-serif text-[24px] text-[#1C1B18] mt-1">
          Progresión del Plan Municipal en el Tiempo
        </h2>
        <ScopeAnclaKicker className="mt-2" />
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760] max-w-3xl">
          Lectura ejecutiva: infraestructura, economía circular material y cobeneficios públicos en el mismo eje temporal.
          Las series se recalculan automáticamente con municipio, horizonte ({state.horizonte}a) y generación per cápita (
          {state.genPercapita.toFixed(2)} kg/hab/día). Trayectoria de captura: preset {state.presetTrayectoria}.
        </p>
      </header>

      <div className="rounded-[14px] border border-[#C8D9B8] bg-[#F4F9EF] p-4 space-y-3">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#2D5409]">Tiempo en el plan (lectura)</p>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-serif text-[18px] text-[#1C1B18]">
            Mes {mesVista} de {totalMeses}
            {instantanea && (
              <span className="ml-2 text-[13px] font-sans font-normal text-[#6B6760]">
                ({instantanea.etiqueta})
              </span>
            )}
          </p>
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
        <p className="text-[11px] leading-relaxed text-[#3D4F33]">
          Cada municipio tiene madurez distinta en separación y marco de limpia. La línea verde punteada en las gráficas marca el mes
          equivalente orientativo a la circularidad de referencia del API para esta ciudad (
          {baselinePct != null ? `${baselinePct.toFixed(1)}%` : 'sin dato'}
          → mes ~{mesMadurez.mes}). La línea oscura sigue el mes que eliges. Es supuesto de lectura, no calendario de cabildo.
        </p>
        {instantanea && (
          <dl className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-3 gap-y-2 border-t border-[#C8D9B8] pt-3 text-[11px]">
            <div>
              <dt className="text-[#5A6B52]">CAs acum.</dt>
              <dd className="font-mono text-[#1C1B18]">{instantanea.caAcumulados}</dd>
            </div>
            <div>
              <dt className="text-[#5A6B52]">Recicladoras</dt>
              <dd className="font-mono text-[#1C1B18]">{instantanea.recicladorasAcumuladas}</dd>
            </div>
            <div>
              <dt className="text-[#5A6B52]">Empleos formales</dt>
              <dd className="font-mono text-[#1C1B18]">{instantanea.empleosFormalesAcum.toFixed(0)}</dd>
            </div>
            <div>
              <dt className="text-[#5A6B52]">Derrama acum.</dt>
              <dd className="font-mono text-[#1C1B18]">{fmt.mxnM(instantanea.derramaAcumuladaMxN)}</dd>
            </div>
            <div>
              <dt className="text-[#5A6B52]">Tons captura / mes</dt>
              <dd className="font-mono text-[#1C1B18]">{instantanea.toneladasCapturadasMes.toFixed(1)} t</dd>
            </div>
            <div>
              <dt className="text-[#5A6B52]">CO₂e acum.</dt>
              <dd className="font-mono text-[#1C1B18]">{(instantanea.co2eEvitadasAcumTon / 1000).toFixed(2)} kt</dd>
            </div>
            <div>
              <dt className="text-[#5A6B52]">Circularidad comp.</dt>
              <dd className="font-mono text-[#1C1B18]">{instantanea.circularidadCompuestaPct.toFixed(1)}%</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Gráfica 1 */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Infraestructura y personas formales (acumulado)</p>
        <p className="text-[11px] text-[#6B6760] mt-0.5">
          CAs y recicladoras activas según catálogo operativo; empleos directos CA + línea reciclaje (80); recuperación de base
          escalada al horizonte.
        </p>
        <div className="h-[320px] w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis
                dataKey="mes"
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#A8A49C' }}
                tickFormatter={(v: number) => chartData.find(d => d.mes === v)?.etiqueta ?? String(v)}
                interval={Math.max(0, xTickStep - 1)}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number, name: string) => [value.toFixed(1), name]}
                labelFormatter={(m) => `Mes ${m} · ${chartData.find(d => d.mes === m)?.etiqueta ?? ''}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={mesMadurez.mes}
                stroke="#65a30d"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{ value: 'Madurez ref.', position: 'insideTopLeft', fill: '#4d7c0f', fontSize: 9 }}
              />
              <ReferenceLine
                x={mesVista}
                stroke="#1C1B18"
                strokeWidth={1.5}
                label={{ value: 'Consulta', position: 'insideTopRight', fill: '#1C1B18', fontSize: 9 }}
              />
              <Line yAxisId="left" type="monotone" dataKey="caAcumulados" name="Centros acopio" stroke="#2563eb" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="recicladorasAcumuladas" name="Recicladoras" stroke="#b45309" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="empleosFormalesAcum" name="Empleos formales" stroke="#3B6D11" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="pepenadoresFormalizadosAcum" name="Pepenadores formaliz." stroke="#7c3aed" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TraceRibbon
          hecho="Catálogo de despliegue CA y población/RSU activa según selección municipal."
          supuesto="Pepenadores: hitos escalados al horizonte y alineados al tope del motor municipal."
          fuente={`ALQUIMIA · FASES_CA + buildDespliegueOperativoSeries + ${hitosTraceFuente(zmActiva, hitosBundle.catalogLabel)}`}
          formula="Por mes m: mix visible = f(horizonte, Realista); pep_acum = min(pep_modelo, Σ hitos≤día(m)) con día ∝ m."
          corte={CORTE_UI}
          confianza="medio"
        />
      </div>

      {/* Gráfica 2 */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Economía y material</p>
        <p className="text-[11px] text-[#6B6760] mt-0.5">
          Derrama acumulada vía factor derrema/ingresos del motor; toneladas capturadas por mes; ingreso valorización; desvío modelado vs RSU total.
        </p>
        <div className="h-[320px] w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis
                dataKey="mes"
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#A8A49C' }}
                tickFormatter={(v: number) => chartData.find(d => d.mes === v)?.etiqueta ?? String(v)}
                interval={Math.max(0, xTickStep - 1)}
              />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Derrama base acum. (MXN M)' || name === 'Ingreso valoriz. (MXN M)') return [fmt.mxnM(value * 1e6), name]
                  if (name === 'Tons capturadas / mes') return [`${value.toFixed(1)} t`, name]
                  return [`${value.toFixed(1)}%`, name]
                }}
                labelFormatter={(m) => `Mes ${m} · ${chartData.find(d => d.mes === m)?.etiqueta ?? ''}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={mesMadurez.mes}
                stroke="#65a30d"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{ value: 'Madurez ref.', position: 'insideTopLeft', fill: '#4d7c0f', fontSize: 9 }}
              />
              <ReferenceLine
                x={mesVista}
                stroke="#1C1B18"
                strokeWidth={1.5}
                label={{ value: 'Consulta', position: 'insideTopRight', fill: '#1C1B18', fontSize: 9 }}
              />
              <Line yAxisId="left" type="monotone" dataKey="derramaM" name="Derrama base acum. (MXN M)" stroke="#0f766e" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="ingresoM" name="Ingreso valoriz. (MXN M)" stroke="#15803d" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="toneladasCapturadasMes" name="Tons capturadas / mes" stroke="#ca8a04" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="reduccionRellenoPct" name="Desvío vs RSU total (%)" stroke="#b91c1c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TraceRibbon
          hecho="Ingresos anuales del bloque `serieAnual` (precios modelo 2.2, 300 días operativos)."
          supuesto="Derrama base acumulada suma venta mensual de materiales separados; no incluye externalidades, salud ni efecto industrial ampliado."
          fuente="Motor `calculator.ts` (`ingresosBrutos`, `serieAnual.ingresos`, volúmenes por material y precios trazados)."
          formula="derrama_base_acum(m)+= ingreso_valorización_año(u)/12; desvío % ≈ vol_capturado / RSU_total."
          corte={CORTE_UI}
          confianza="medio"
        />
      </div>

      {/* Gráfica 3 — dos paneles (escalas heterogéneas) */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 space-y-4">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Impacto público y síntesis</p>
        <p className="text-[11px] text-[#6B6760]">
          CO₂e evitadas (acumulado por mes); ahorro en salud acumulado; cumplimiento normativo estimado e indicador compuesto de
          circularidad. También se muestra % RSU capturado como métrica separada para no mezclar términos. El deslizador superior fija
          el mes de consulta sobre el mismo eje que el resto del plan.
        </p>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis
                dataKey="mes"
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#A8A49C' }}
                tickFormatter={(v: number) => chartData.find(d => d.mes === v)?.etiqueta ?? String(v)}
                interval={Math.max(0, xTickStep - 1)}
              />
              <YAxis yAxisId="co2" tick={{ fontSize: 9, fill: '#A8A49C' }} label={{ value: 'kt CO₂e', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#8A857C' }} />
              <YAxis yAxisId="salud" orientation="right" tick={{ fontSize: 9, fill: '#A8A49C' }} label={{ value: 'MXN M', angle: 90, position: 'insideRight', fontSize: 9, fill: '#8A857C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number, name: string) =>
                  name === 'Ahorro salud acum.' ? [fmt.mxnM(value * 1e6), name] : [`${value.toFixed(2)} kt`, name]
                }
                labelFormatter={(m) => `Mes ${m} · ${chartData.find(d => d.mes === m)?.etiqueta ?? ''}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={mesMadurez.mes}
                stroke="#65a30d"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{ value: 'Madurez ref.', position: 'insideTopLeft', fill: '#4d7c0f', fontSize: 9 }}
              />
              <ReferenceLine
                x={mesVista}
                stroke="#1C1B18"
                strokeWidth={1.5}
                label={{ value: 'Consulta', position: 'insideTopRight', fill: '#1C1B18', fontSize: 9 }}
              />
              <Line yAxisId="co2" type="monotone" dataKey="co2eKt" name="CO₂e evitadas acum." stroke="#334155" dot={false} strokeWidth={2} />
              <Line yAxisId="salud" type="monotone" dataKey="ahorroSaludM" name="Ahorro salud acum." stroke="#ea580c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis
                dataKey="mes"
                allowDecimals={false}
                tick={{ fontSize: 9, fill: '#A8A49C' }}
                tickFormatter={(v: number) => chartData.find(d => d.mes === v)?.etiqueta ?? String(v)}
                interval={Math.max(0, xTickStep - 1)}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                labelFormatter={(m) => `Mes ${m} · ${chartData.find(d => d.mes === m)?.etiqueta ?? ''}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <ReferenceLine
                x={mesMadurez.mes}
                stroke="#65a30d"
                strokeDasharray="6 4"
                strokeWidth={1}
                label={{ value: 'Madurez ref.', position: 'insideTopLeft', fill: '#4d7c0f', fontSize: 9 }}
              />
              <ReferenceLine
                x={mesVista}
                stroke="#1C1B18"
                strokeWidth={1.5}
                label={{ value: 'Consulta', position: 'insideTopRight', fill: '#1C1B18', fontSize: 9 }}
              />
              <Line type="monotone" dataKey="cumplimientoNormativoPct" name="Cumplimiento normativo est." stroke="#0369a1" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="rsuCapturadoPct" name="% RSU capturado" stroke="#b45309" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="circularidadCompuestaPct" name="Circularidad compuesta" stroke="#3B6D11" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TraceRibbon
          hecho="CO₂e mensual proviene de `serieAnual[].co2e` del motor municipal; salud de `ahorroSalud` al cierre."
          supuesto="Acumulación lineal de salud en el tiempo; cumplimiento y circularidad compuesta son heurísticas de tablero (no acto administrativo)."
          fuente="`calculator.ts` + baseline de circularidad API (city context)."
          formula="%RSUcapturado=sample.pctCaptura; CO₂e_acum+=co2e(u)/12; salud_acum=(m/M)×ahorroSalud; compuesto=0,42·captura+0,28·desvío+…"
          corte={CORTE_UI}
          confianza="medio"
        />
      </div>

      {/* Tabla hitos */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 overflow-x-auto">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Resumen por hitos escalados al horizonte</p>
        <p className="text-[11px] text-[#6B6760] mt-0.5 mb-3">
          Fechas en meses relativos al plan; deltas del catálogo; columna de acumulados orientativa.
        </p>
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
