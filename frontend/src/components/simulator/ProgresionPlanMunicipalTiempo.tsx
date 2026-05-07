'use client'

import { useMemo } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { fmt } from '@/lib/utils'

function TraceRibbon({
  hecho,
  supuesto,
  fuente,
  formula,
  corte,
  confianza,
}: {
  hecho: string
  supuesto: string
  fuente: string
  formula: string
  corte: string
  confianza: 'alto' | 'medio' | 'bajo'
}) {
  const confLabel = confianza === 'alto' ? 'Alto' : confianza === 'medio' ? 'Medio' : 'Bajo'
  return (
    <div className="mt-3 grid gap-2 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] p-3 text-[11px] leading-snug text-[#6B6760]">
      <p>
        <span className="font-semibold text-[#1C1B18]">Hecho verificado:</span> {hecho}
      </p>
      <p>
        <span className="font-semibold text-[#1C1B18]">Supuesto de simulación:</span> {supuesto}
      </p>
      <p>
        <span className="font-semibold text-[#1C1B18]">Fuente:</span> {fuente}
      </p>
      <p>
        <span className="font-semibold text-[#1C1B18]">Fórmula (resumen):</span> {formula}
      </p>
      <p className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-[#8A857C]">
        <span>Fecha de corte (referencia UI): {corte}</span>
        <span>Nivel de confianza: {confLabel}</span>
      </p>
    </div>
  )
}

const CORTE_UI = '2026-05-05'

export function ProgresionPlanMunicipalTiempo() {
  const state = useSimulatorStore(s => ({
    horizonte: s.horizonte,
    presetTrayectoria: s.presetTrayectoria,
    genPercapita: s.genPercapita,
  }))
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
  }, [resultados, resultadosSinPrograma, baselinePct])

  const filasHitos = useMemo(
    () => buildHitosResumenRows(state.horizonte),
    [state.horizonte],
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
        <p className="mt-2 text-[13px] leading-relaxed text-[#6B6760] max-w-3xl">
          Lectura ejecutiva: infraestructura, economía circular material y cobeneficios públicos en el mismo eje temporal.
          Las series se recalculan automáticamente con municipio, horizonte ({state.horizonte}a) y generación per cápita (
          {state.genPercapita.toFixed(2)} kg/hab/día). Trayectoria de captura: preset {state.presetTrayectoria}.
        </p>
      </header>

      {/* Gráfica 1 */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Infraestructura y personas formales (acumulado)</p>
        <p className="text-[11px] text-[#6B6760] mt-0.5">
          CAs y recicladoras activas (catálogo Bootstrap 2.4); empleos directos CA + línea reciclaje (80); pepenadores con Q-020
          escalado al horizonte.
        </p>
        <div className="h-[320px] w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 9, fill: '#A8A49C' }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number, name: string) => [value.toFixed(1), name]}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="caAcumulados" name="Centros acopio" stroke="#2563eb" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="recicladorasAcumuladas" name="Recicladoras" stroke="#b45309" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="empleosFormalesAcum" name="Empleos formales" stroke="#3B6D11" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="pepenadoresFormalizadosAcum" name="Pepenadores formaliz." stroke="#7c3aed" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TraceRibbon
          hecho="Catálogo de despliegue CA (Bootstrap 2.4) y población/RSU activa según selección municipal."
          supuesto="Pepenadores: hitos Q-020 escalados al horizonte y alineados al tope del motor municipal."
          fuente="ALQUIMIA · `FASES_CA` + `buildDespliegueOperativoSeries` + `HITOS_TIMELINE_SLP`."
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
              <XAxis dataKey="etiqueta" tick={{ fontSize: 9, fill: '#A8A49C' }} interval="preserveStartEnd" />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Derrama acum. (MXN M)' || name === 'Ingreso valoriz. (MXN M)') return [fmt.mxnM(value * 1e6), name]
                  if (name === 'Tons capturadas / mes') return [`${value.toFixed(1)} t`, name]
                  return [`${value.toFixed(1)}%`, name]
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="left" type="monotone" dataKey="derramaM" name="Derrama acum. (MXN M)" stroke="#0f766e" dot={false} strokeWidth={2} />
              <Line yAxisId="left" type="monotone" dataKey="ingresoM" name="Ingreso valoriz. (MXN M)" stroke="#15803d" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="toneladasCapturadasMes" name="Tons capturadas / mes" stroke="#ca8a04" dot={false} strokeWidth={2} />
              <Line yAxisId="right" type="monotone" dataKey="reduccionRellenoPct" name="Desvío vs RSU total (%)" stroke="#b91c1c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TraceRibbon
          hecho="Ingresos anuales del bloque `serieAnual` (precios modelo 2.2, 300 días operativos)."
          supuesto="Derrama acumulada acreta ingresos mensuales × (derremaTotal/ingresosBrutos) del cierre de horizonte."
          fuente="Motor `calculator.ts` (`derremaTotal`, `ingresos`, volúmenes por material)."
          formula="derrama_acum(m)+= ingreso_año(u)/12 × factor; desvío % ≈ vol_capturado / RSU_total."
          corte={CORTE_UI}
          confianza="medio"
        />
      </div>

      {/* Gráfica 3 — dos paneles (escalas heterogéneas) */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 space-y-4">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Impacto público y síntesis</p>
        <p className="text-[11px] text-[#6B6760]">
          CO₂e evitadas (acumulado por mes); ahorro en salud acumulado; cumplimiento normativo estimado e indicador compuesto de
          circularidad — sin controles adicionales; todo sigue al horizonte global.
        </p>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 9, fill: '#A8A49C' }} interval="preserveStartEnd" />
              <YAxis yAxisId="co2" tick={{ fontSize: 9, fill: '#A8A49C' }} label={{ value: 'kt CO₂e', angle: -90, position: 'insideLeft', fontSize: 9, fill: '#8A857C' }} />
              <YAxis yAxisId="salud" orientation="right" tick={{ fontSize: 9, fill: '#A8A49C' }} label={{ value: 'MXN M', angle: 90, position: 'insideRight', fontSize: 9, fill: '#8A857C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number, name: string) =>
                  name === 'Ahorro salud acum.' ? [fmt.mxnM(value * 1e6), name] : [`${value.toFixed(2)} kt`, name]
                }
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line yAxisId="co2" type="monotone" dataKey="co2eKt" name="CO₂e evitadas acum." stroke="#334155" dot={false} strokeWidth={2} />
              <Line yAxisId="salud" type="monotone" dataKey="ahorroSaludM" name="Ahorro salud acum." stroke="#ea580c" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="#E8E4DC" />
              <XAxis dataKey="etiqueta" tick={{ fontSize: 9, fill: '#A8A49C' }} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#A8A49C' }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #E8E4DC' }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="cumplimientoNormativoPct" name="Cumplimiento normativo est." stroke="#0369a1" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="circularidadCompuestaPct" name="Circularidad compuesta" stroke="#3B6D11" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <TraceRibbon
          hecho="CO₂e mensual proviene de `serieAnual[].co2e` del motor municipal; salud de `ahorroSalud` al cierre."
          supuesto="Acumulación lineal de salud en el tiempo; cumplimiento y circularidad compuesta son heurísticas de tablero (no acto administrativo)."
          fuente="`calculator.ts` + baseline de circularidad API (city context)."
          formula="CO₂e_acum += co2e(u)/12; salud_acum = (m/M)×ahorroSalud; compuesto = 0,42·captura + 0,28·desvío + …"
          corte={CORTE_UI}
          confianza="medio"
        />
      </div>

      {/* Tabla hitos */}
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 overflow-x-auto">
        <p className="text-[11px] font-semibold text-[#1C1B18]">Resumen por hitos (Q-020 escalado al horizonte)</p>
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
          hecho="Catálogo Q-020 publicado en `hitosTimeline.ts` con PERT en días."
          supuesto="Escala temporal: mes_hit = (E(PERT)/1080)×(horizonte×12), referencia 36 meses×30 días."
          fuente="ALQUIMIA · `HITOS_TIMELINE_SLP`, `HORIZONTE_DIAS_MESES_36`."
          formula="pertExpectedDays = (o+4m+p)/6; mes redondeado al ciclo municipal activo."
          corte={CORTE_UI}
          confianza="bajo"
        />
      </div>
    </section>
  )
}
