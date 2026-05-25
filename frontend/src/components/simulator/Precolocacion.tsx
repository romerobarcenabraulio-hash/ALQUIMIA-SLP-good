'use client'

/**
 * Fase 5 — Precolocación de Materiales
 *
 * Muestra el plan de colocación por material y sus KPIs financieros
 * ajustados por riesgo de mercado real.
 *
 * Regla UI (Doctrina §7):
 *   Cada fila tiene impacto causal. El ingreso_ajustado ≠ ingreso_potencial
 *   cuando hay faltante — y esa diferencia se muestra explícitamente.
 *   No hay cards decorativas sin efecto causal.
 *
 * Flujo:
 *   SimulateResponse.vol_capturable_por_mat_ton_anio
 *     → placeMarket(zm, municipios, volumes)
 *     → MarketSummary → store.setMarketSummary
 *     → tabla causal + advertencias
 */

import { useState } from 'react'
import type { MarketSummary, PlacementPlan, RiesgoMercado, EstadoColocacion, ResultadosCalculados } from '@/types'
import { placeMarket } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

// ─── Utilidades visuales ──────────────────────────────────────────────────────

const RIESGO_COLOR: Record<RiesgoMercado, string> = {
  bajo:    'text-green-700 bg-green-50 border-green-200',
  medio:   'text-yellow-700 bg-yellow-50 border-yellow-200',
  alto:    'text-orange-700 bg-orange-50 border-orange-200',
  critico: 'text-red-700 bg-red-50 border-red-200',
}

const ESTADO_BADGE: Record<EstadoColocacion, { label: string; color: string }> = {
  colocado:              { label: 'Colocado',    color: 'bg-green-100 text-green-800' },
  parcial:               { label: 'Parcial',     color: 'bg-yellow-100 text-yellow-800' },
  sin_mercado:           { label: 'Sin mercado', color: 'bg-red-100 text-red-800' },
  requiere_verificacion: { label: 'Verificar',   color: 'bg-[#F0EDE5] text-[#6B6760]' },
}

const MATERIAL_LABEL: Record<string, string> = {
  organico: 'Orgánico',
  papel:    'Papel/Cartón',
  plastico: 'Plástico',
  vidrio:   'Vidrio',
  metales:  'Metales',
  pet:      'PET',
  aluminio: 'Aluminio',
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('es-MX', { maximumFractionDigits: decimals })
}

function fmtMXN(n: number): string {
  if (n >= 1_000_000) return `$${fmt(n / 1_000_000, 2)} M`
  if (n >= 1_000) return `$${fmt(n / 1_000, 1)} K`
  return `$${fmt(n, 0)}`
}

// ─── Row causal ───────────────────────────────────────────────────────────────

function PlanRow({ material, plan }: { material: string; plan: PlacementPlan }) {
  const badge = ESTADO_BADGE[plan.estado_colocacion]
  const riesgoColor = RIESGO_COLOR[plan.riesgo_mercado]
  const delta = plan.ingreso_ajustado_mxn - plan.ingreso_potencial_mxn

  return (
    <tr className="border-b border-[#F0EDE5] hover:bg-[#FAF8F4] transition-colors">
      {/* Material */}
      <td className="py-3 px-4 font-medium text-[#1C1B18] text-sm">
        {MATERIAL_LABEL[material] ?? material}
      </td>

      {/* Vol. anual */}
      <td className="py-3 px-4 text-right text-sm text-[#6B6760]">
        {fmt(plan.volumen_ton_anio, 1)} t
      </td>

      {/* Colocado */}
      <td className="py-3 px-4 text-right text-sm">
        <span className={plan.colocado_ton_anio > 0 ? 'text-green-700' : 'text-red-600'}>
          {fmt(plan.colocado_ton_anio, 1)} t
        </span>
      </td>

      {/* Faltante */}
      <td className="py-3 px-4 text-right text-sm">
        <span className={plan.faltante_ton_anio > 0 ? 'text-orange-600 font-medium' : 'text-[#A8A49C]'}>
          {plan.faltante_ton_anio > 0 ? `${fmt(plan.faltante_ton_anio, 1)} t` : '—'}
        </span>
      </td>

      {/* Precio prom */}
      <td className="py-3 px-4 text-right text-sm text-[#6B6760]">
        {plan.precio_promedio_mxn_kg > 0 ? `$${fmt(plan.precio_promedio_mxn_kg, 2)}/kg` : '—'}
      </td>

      {/* Ingreso potencial */}
      <td className="py-3 px-4 text-right text-sm text-[#6B6760]">
        {fmtMXN(plan.ingreso_potencial_mxn)}
      </td>

      {/* Ingreso ajustado — el dato que importa */}
      <td className="py-3 px-4 text-right text-sm font-semibold">
        <div className={plan.ingreso_ajustado_mxn < plan.ingreso_potencial_mxn
          ? 'text-orange-700' : 'text-green-700'}>
          {fmtMXN(plan.ingreso_ajustado_mxn)}
        </div>
        {delta < -1000 && (
          <div className="text-xs text-red-500 font-normal">
            {fmtMXN(delta)} ({fmt(plan.descuento_aplicado_pct, 1)}% desc.)
          </div>
        )}
      </td>

      {/* Riesgo */}
      <td className="py-3 px-4 text-center">
        <span className={`inline-block text-xs px-2 py-0.5 rounded border font-medium ${riesgoColor}`}>
          {plan.riesgo_mercado}
        </span>
      </td>

      {/* Estado */}
      <td className="py-3 px-4 text-center">
        <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${badge.color}`}>
          {badge.label}
        </span>
      </td>
    </tr>
  )
}

function PrecolocacionNarrative({
  marketSummary,
  horizonte,
  resultados,
}: {
  marketSummary: MarketSummary
  horizonte: number
  resultados: ResultadosCalculados | null
}) {
  const mats = Object.entries(marketSummary.planes_por_material)
  const enRiesgo = mats.filter(([, p]) => p.riesgo_mercado === 'alto' || p.riesgo_mercado === 'critico').length
  const faltanteTotal = marketSummary.total_faltante_ton_anio
  const gapVsSim =
    resultados && resultados.ingresosBrutos > 0
      ? marketSummary.ingresos_ajustados_mxn - resultados.ingresosBrutos / Math.max(1, horizonte)
      : null

  return (
    <NarrativeBridge
      variant="result"
      audience="entrepreneur"
      kicker="Mercado · ventana de oportunidad"
      title="Lectura de la colocación causal"
      summary={`${marketSummary.zm}: ${marketSummary.pct_colocado_global.toFixed(1)}% colocado global con ${fmtMXN(marketSummary.ingresos_ajustados_mxn)} de ingreso ajustado (Año 1) frente a ${fmtMXN(marketSummary.ingresos_potenciales_mxn)} potencial; el descuento por riesgo acumula ${fmtMXN(marketSummary.descuento_por_riesgo_mxn)}. Hay ${faltanteTotal.toFixed(1)} t/año sin colocar y ${enRiesgo} material(es) en riesgo alto o crítico.${gapVsSim !== null ? ` La brecha vs. ingreso bruto del simulador (promedio anual del horizonte ${horizonte}a) es ${fmtMXN(gapVsSim)}.` : ''}`}
      evidence={[
        { label: '% colocado', value: `${marketSummary.pct_colocado_global.toFixed(1)}%` },
        { label: 'Ingreso ajustado', value: `${fmtMXN(marketSummary.ingresos_ajustados_mxn)}/año` },
        { label: 'Faltante total', value: `${faltanteTotal.toFixed(1)} t/año` },
        { label: 'Riesgo MXN', value: fmtMXN(marketSummary.descuento_por_riesgo_mxn) },
      ]}
      nextStep={{
        label: 'Contrastar con comparador LATAM',
        helper: 'Usa el benchmark regional y el grafo causal para anclar ofertas y due diligence.',
      }}
    />
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Precolocacion() {
  const zmActiva         = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const horizonte        = useSimulatorStore(s => s.horizonte)
  const resultados       = useSimulatorStore(s => s.resultados)
  const marketSummary    = useSimulatorStore(s => s.marketSummary)
  const setMarketSummary = useSimulatorStore(s => s.setMarketSummary)

  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const volCapturable = resultados?.volCapturablePorMat as Record<string, number> | undefined

  const hasVolumes = volCapturable && Object.keys(volCapturable).length > 0

  async function handlePlace() {
    if (!volCapturable) return
    setLoading(true)
    setError(null)
    try {
      const summary = await placeMarket(zmActiva, municipiosActivos, volCapturable)
      setMarketSummary(summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al calcular colocación')
    } finally {
      setLoading(false)
    }
  }

  // Sin resultados de simulación → no hay qué colocar
  if (!resultados || !hasVolumes) {
    return (
      <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6">
        <h3 className="text-base font-semibold text-[#1C1B18] mb-2">
          Precolocación de Materiales
        </h3>
        <p className="text-sm text-[#6B6760]">
          Ejecuta la simulación primero para obtener los volúmenes capturables por material.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="mt-1 font-serif text-[22px] text-[#1C1B18]">
            Precolocación de materiales · {zmActiva}
          </h3>
          <p className="mt-1 text-[12px] text-[#6B6760]">
            Compradores estimados/benchmark. Ninguno es oferta oficial sin verificación contractual.
          </p>
        </div>
        <button
          onClick={handlePlace}
          disabled={loading}
          className="shrink-0 rounded-full border border-[#1C1B18] bg-[#1C1B18] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B6D11] hover:border-[#3B6D11] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Calculando…' : marketSummary ? 'Recalcular colocación' : 'Calcular colocación'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Volúmenes disponibles (pre-colocación) */}
      {!marketSummary && (
        <div className="rounded-lg bg-[#FAF8F4] border border-[#E8E4DC] p-4">
          <p className="text-xs font-medium text-[#6B6760] mb-2 uppercase tracking-wide">
            Volúmenes capturables Año 1
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(volCapturable).map(([mat, vol]) => (
              <div key={mat} className="text-center">
                <div className="text-sm font-semibold text-[#1C1B18]">
                  {fmt(vol, 1)} t
                </div>
                <div className="text-xs text-[#8A857C]">
                  {MATERIAL_LABEL[mat] ?? mat}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla causal de colocación */}
      {marketSummary && (
        <>
          {/* KPIs globales */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-center">
              <div className="text-xs text-[#8A857C] mb-1">Colocado global</div>
              <div className="text-lg font-bold text-[#1C1B18]">
                {fmt(marketSummary.pct_colocado_global, 1)}%
              </div>
            </div>
            <div className="rounded-lg bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-center">
              <div className="text-xs text-[#8A857C] mb-1">Ingreso potencial</div>
              <div className="text-lg font-bold text-[#6B6760]">
                {fmtMXN(marketSummary.ingresos_potenciales_mxn)}
              </div>
            </div>
            <div className="rounded-lg bg-[#EAF3DE] border border-[#C9DDB1] p-3 text-center">
              <div className="text-xs text-[#23470A] mb-1">Ingreso ajustado</div>
              <div className="text-lg font-bold text-[#1C1B18]">
                {fmtMXN(marketSummary.ingresos_ajustados_mxn)}
              </div>
            </div>
            <div className="rounded-lg bg-orange-50 border border-orange-200 p-3 text-center">
              <div className="text-xs text-orange-600 mb-1">Descuento por riesgo</div>
              <div className="text-lg font-bold text-orange-700">
                {fmtMXN(marketSummary.descuento_por_riesgo_mxn)}
              </div>
            </div>
          </div>

          {/* Tabla por material */}
          <div className="overflow-x-auto rounded-lg border border-[#E8E4DC]">
            <table className="min-w-full text-sm">
              <thead className="bg-[#FAF8F4] border-b border-[#E8E4DC]">
                <tr>
                  <th className="py-2.5 px-4 text-left text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Material</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Vol. anual</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Colocado</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Faltante</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Precio prom.</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Potencial</th>
                  <th className="py-2.5 px-4 text-right text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Ajustado</th>
                  <th className="py-2.5 px-4 text-center text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Riesgo</th>
                  <th className="py-2.5 px-4 text-center text-xs font-semibold text-[#6B6760] uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EDE5]">
                {Object.entries(marketSummary.planes_por_material).map(([mat, plan]) => (
                  <PlanRow key={mat} material={mat} plan={plan} />
                ))}
              </tbody>
            </table>
          </div>

          {/* Advertencias */}
          {marketSummary.warnings.length > 0 && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-1">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                Advertencias de honestidad
              </p>
              {marketSummary.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-700">
                  • {w}
                </p>
              ))}
            </div>
          )}

          {/* Delta vs ingreso del simulador */}
          {resultados?.ingresosBrutos !== undefined &&
            marketSummary.ingresos_ajustados_mxn > 0 && (
            <div className="rounded-lg bg-[#F8F6F1] border border-[#DAD3C7] p-4 text-sm text-[#1C1B18]">
              <span className="font-semibold">Diferencia vs. simulador: </span>
              El ingreso bruto del simulador es{' '}
              {fmtMXN(resultados.ingresosBrutos / Math.max(1, horizonte))}/año
              {' '}(sin comprador específico) vs. {fmtMXN(marketSummary.ingresos_ajustados_mxn)}/año
              {' '}ajustado por mercado real (Año 1). Esta diferencia refleja capacidad de
              colocación y descuentos por riesgo —{' '}
              <span className="font-medium">no es un error, es la realidad del mercado.</span>
            </div>
          )}

          <PrecolocacionNarrative marketSummary={marketSummary} horizonte={horizonte} resultados={resultados} />
        </>
      )}
    </div>
  )
}
