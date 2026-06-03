'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PlanChartFrame } from '@/components/charts/PlanChartFrame'
import { fmt } from '@/lib/utils'
import { TraceRibbon } from '@/components/ui/TraceRibbon'
import { CORTE_UI } from '@/lib/progresionUiConstants'
import { MarginalNote, SectionLabel } from '@/components/editorial'

export type ProgresionChartPoint = Record<string, unknown> & {
  mes: number
  etiqueta: string
}

export type ProgresionPlanChartsProps = {
  chartData: ProgresionChartPoint[]
  mesVista: number
  mesMadurez: { mes: number; pct: number }
  xTickStep: number
  zmActiva: string
  hitosTraceLabel: string
}

function tooltipNum(v: unknown, digits: number): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '—'
}

export function ProgresionPlanCharts({
  chartData,
  mesVista,
  mesMadurez,
  xTickStep,
  hitosTraceLabel,
}: ProgresionPlanChartsProps) {
  return (
    <>
      {/* Gráfica 1 */}
      <div className="border-t border-[#E8E4DC] pt-4">
        <SectionLabel>Infraestructura y personas formales (acumulado)</SectionLabel>
        <MarginalNote className="mb-3">
          CAs y recicladoras activas según catálogo operativo; empleos directos CA + línea reciclaje (80); recuperación de base
          escalada al horizonte.
        </MarginalNote>
        <PlanChartFrame height={320}>
          {(w, h) => (
            <LineChart width={w} height={h} data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                formatter={(value: number | string, name: string) => [tooltipNum(value, 1), name]}
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
          )}
        </PlanChartFrame>
        <TraceRibbon
          hecho="Catálogo de despliegue CA y población/RSU activa según selección municipal."
          supuesto="Pepenadores: hitos escalados al horizonte y alineados al tope del motor municipal."
          fuente={`ALQUIMIA · FASES_CA + buildDespliegueOperativoSeries + ${hitosTraceLabel}`}
          formula="Por mes m: mix visible = f(horizonte, Realista); pep_acum = min(pep_modelo, Σ hitos≤día(m)) con día ∝ m."
          corte={CORTE_UI}
          confianza="medio"
        />
      </div>

      {/* Gráfica 2 */}
      <div className="border-t border-[#E8E4DC] pt-4">
        <SectionLabel>Economía y material</SectionLabel>
        <MarginalNote className="mb-3">
          Derrama acumulada vía factor derrema/ingresos del motor; toneladas capturadas por mes; ingreso valorización; desvío modelado vs RSU total.
        </MarginalNote>
        <PlanChartFrame height={320}>
          {(w, h) => (
            <LineChart width={w} height={h} data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                formatter={(value: number | string, name: string) => {
                  const n = typeof value === 'number' ? value : Number.NaN
                  if (name === 'Derrama base acum. (MXN M)' || name === 'Ingreso valoriz. (MXN M)')
                    return [Number.isFinite(n) ? fmt.mxnM(n * 1e6) : '—', name]
                  if (name === 'Tons capturadas / mes') return [`${tooltipNum(value, 1)} t`, name]
                  return [`${tooltipNum(value, 1)}%`, name]
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
          )}
        </PlanChartFrame>
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
      <div className="border-t border-[#E8E4DC] pt-4 space-y-4">
        <div>
          <SectionLabel>Impacto público y síntesis</SectionLabel>
          <MarginalNote>
            CO₂e evitadas (acumulado por mes); ahorro en salud acumulado; cumplimiento normativo estimado e indicador compuesto de
            circularidad. También se muestra % RSU capturado como métrica separada para no mezclar términos. El deslizador superior fija
            el mes de consulta sobre el mismo eje que el resto del plan.
          </MarginalNote>
        </div>
        <PlanChartFrame height={220}>
          {(w, h) => (
            <LineChart width={w} height={h} data={chartData} margin={{ top: 8, right: 20, left: 4, bottom: 0 }}>
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
                formatter={(value: number | string, name: string) => {
                  const n = typeof value === 'number' ? value : Number.NaN
                  return name === 'Ahorro salud acum.'
                    ? [Number.isFinite(n) ? fmt.mxnM(n * 1e6) : '—', name]
                    : [`${tooltipNum(value, 2)} kt`, name]
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
              <Line yAxisId="co2" type="monotone" dataKey="co2eKt" name="CO₂e evitadas acum." stroke="#334155" dot={false} strokeWidth={2} />
              <Line yAxisId="salud" type="monotone" dataKey="ahorroSaludM" name="Ahorro salud acum." stroke="#ea580c" dot={false} strokeWidth={2} />
            </LineChart>
          )}
        </PlanChartFrame>
        <PlanChartFrame height={220}>
          {(w, h) => (
            <LineChart width={w} height={h} data={chartData} margin={{ top: 8, right: 16, left: 4, bottom: 0 }}>
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
                formatter={(value: number | string) => [`${tooltipNum(value, 1)}%`, '']}
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
          )}
        </PlanChartFrame>
        <TraceRibbon
          hecho="CO₂e mensual proviene de `serieAnual[].co2e` del motor municipal; salud de `ahorroSalud` al cierre."
          supuesto="Acumulación lineal de salud en el tiempo; cumplimiento y circularidad compuesta son heurísticas de tablero (no acto administrativo)."
          fuente="`calculator.ts` + baseline de circularidad API (city context)."
          formula="%RSUcapturado=sample.pctCaptura; CO₂e_acum+=co2e(u)/12; salud_acum=(m/M)×ahorroSalud; compuesto=0,42·captura+0,28·desvío+…"
          corte={CORTE_UI}
          confianza="medio"
        />
      </div>
    </>
  )
}
