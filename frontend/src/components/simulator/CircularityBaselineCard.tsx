'use client'

import { useMemo } from 'react'
import { BookOpenCheck, Database, HelpCircle } from 'lucide-react'
import { getProgramPopulationShare } from '@/lib/zmPopulationScale'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

/** Definiciones separadas para evitar mezclar captura con circularidad real. */
const DEFINICION_CAPTURA =
  '% RSU capturado = (RSU capturado valorizable / RSU generado total) × 100. Mide cuánto del total generado se recupera y entra a ruta útil.'
const DEFINICION_CIRCULARIDAD =
  '% Circularidad real = (RSU valorizado real / RSU generado total) × 100. Mide cuánto regresa efectivamente a reciclaje, composta, biodigestión o reúso.'

export function CircularityBaselineCard() {
  const {
    circularityBaseline,
    circularityBaselineLoading,
    portalError,
    zmActiva,
    municipiosActivos,
  } = useSimulatorStore()

  const popShare = useMemo(
    () => getProgramPopulationShare(zmActiva, municipiosActivos),
    [zmActiva, municipiosActivos],
  )

  const pct = circularityBaseline?.current_circularity_pct
  const uncertaintyPp = circularityBaseline?.uncertainty_pct_points
  const rangeMin = pct !== undefined && uncertaintyPp !== undefined ? Math.max(0, pct - uncertaintyPp) : null
  const rangeMax = pct !== undefined && uncertaintyPp !== undefined ? Math.min(100, pct + uncertaintyPp) : null
  const pctCaptura =
    circularityBaseline && circularityBaseline.rsu_total_ton_day_est > 0
      ? (circularityBaseline.material_recovery_ton_day_est / circularityBaseline.rsu_total_ton_day_est) * 100
      : null

  return (
    <section className="section" aria-labelledby="baseline-title">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">
        Punto de partida antes de tus metas
      </p>
      <h2 id="baseline-title" className="font-serif text-[24px] text-[#1C1B18] mb-2">
        Indicadores base del municipio: captura RSU y circularidad real
      </h2>
      <ScopeAnclaKicker className="mb-3" />

      <div className="mb-4 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] px-4 py-3">
        <p className="inline-flex items-start gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
          <BookOpenCheck size={14} className="mt-0.5 shrink-0 text-[#3B6D11]" aria-hidden="true" />
          Definiciones operativas del tablero
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#1C1B18]">{DEFINICION_CAPTURA}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#1C1B18]">{DEFINICION_CIRCULARIDAD}</p>
      </div>

      {circularityBaselineLoading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[13px] text-[#6B6760]">
          Calculamos la referencia de residuos para la ciudad seleccionada y cuánto confía el modelo en esa lectura inicial…
        </div>
      )}

      {!circularityBaselineLoading && portalError && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {portalError}
        </div>
      )}

      {!circularityBaselineLoading && !portalError && !circularityBaseline && (
        <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[13px] text-[#6B6760]">
          Primero elige ciudad o zona metropolitana de trabajo más abajo. Sin esa selección no mostramos referencia inicial ni metas siguientes para no inventar territorio ni cifras.
        </div>
      )}

      {!circularityBaselineLoading && circularityBaseline && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
          {popShare < 1 - 1e-6 && (
            <p className="mb-4 rounded-[6px] border border-amber-200 bg-amber-50/80 px-3 py-2 text-[11px] text-amber-950">
              Vista <strong>sub-zona</strong>: los toneladas/día del baseline se muestran al {(popShare * 100).toFixed(1)}% del total ZM
              (población municipios activos / población ZM en simulador). El porcentaje de circularidad del API sigue siendo referencia regional.
            </p>
          )}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 max-w-[min(100%,40rem)] flex-1">
              <p className="text-[12px] text-[#6B6760]">{circularityBaseline.city_name}</p>
              <div className="mt-1 flex flex-wrap items-end gap-5">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[#A8A49C]">Circularidad real estimada</p>
                  <p
                    className="font-mono text-[34px] leading-none text-[#1C1B18]"
                    aria-label={`Porcentaje de circularidad del modelo ${circularityBaseline.current_circularity_pct.toFixed(1)} por ciento`}
                  >
                    {circularityBaseline.current_circularity_pct.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.06em] text-[#A8A49C]">% RSU capturado (referencia)</p>
                  <p className="font-mono text-[26px] leading-none text-[#23470A]">
                    {pctCaptura != null ? `${pctCaptura.toFixed(1)}%` : '—'}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#1C1B18]">
                <span className="font-semibold text-[#1C1B18]">Cómo leer este número: </span>
                {circularityBaseline.interpretation}
              </p>
              <div
                className="mt-4 flex flex-wrap items-start gap-2 rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-2.5 text-[12px] leading-relaxed text-[#6B6760] [overflow-wrap:anywhere]"
                title="Margen declarado sobre el mismo indicador 0–100%"
              >
                <HelpCircle size={14} className="mt-0.5 shrink-0 text-[#3B6D11]" aria-hidden="true" />
                <p>
                  <span className="font-medium text-[#1C1B18]">Incertidumbre del modelo: </span>
                  ±{circularityBaseline.uncertainty_pct_points.toFixed(1)} puntos porcentuales sobre este indicador.
                  Intervalo ilustrativo entre <strong>{rangeMin?.toFixed(1)}% y {rangeMax?.toFixed(1)}%</strong>
                  {' '}
                  (no garantiza ese rango en campo; marca incertidumbre metodológica declarada aquí).
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric
              label="RSU modelado · ámbito activo"
              hint="Referencia ZM escalada al subconjunto municipal seleccionado (Q-024)."
              value={`${(circularityBaseline.rsu_total_ton_day_est * popShare).toLocaleString('es-MX', { maximumFractionDigits: 2 })} t/día`}
            />
            <Metric
              label="Fracción en rutas útiles · ámbito activo"
              hint="Escala lineal con el RSU activo."
              value={`${(circularityBaseline.material_recovery_ton_day_est * popShare).toLocaleString('es-MX', { maximumFractionDigits: 2 })} t/día`}
            />
            <Metric
              label="Confianza del modelo sobre esta referencia"
              hint="Sube si coinciden mejor los insumos públicos; revisa “Fuentes de datos” cuando esté bajo."
              value={`${Math.round(circularityBaseline.confidence * 100)} %`}
            />
          </div>

          <div className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] p-3">
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1C1B18]">
              <Database size={14} aria-hidden="true" />
              Fuente declarada por el modelo
            </p>
            <p className="mt-2 text-[12px] text-[#6B6760]">
              <strong className="text-[#1C1B18]">{circularityBaseline.provenance.fuente_nombre}</strong>
              {' — '}
              organismo etiquetado: {circularityBaseline.provenance.fuente_organismo}.
            </p>
            <p className="mt-1 text-[11px] text-[#6B6760]">
              Tipo de dato registrado:{' '}
              <span className="font-medium text-[#1C1B18]">estimación no certificada</span>{' '}
              (no es archivo de transparencia). La confianza declarada sobre esta entrada es del{' '}
              {Math.round(circularityBaseline.provenance.confianza * 100)}%.
            </p>
            {circularityBaseline.provenance.advertencia && (
              <p className="mt-2 text-[11px] leading-relaxed text-[#6B6760] [overflow-wrap:anywhere]">
                {circularityBaseline.provenance.advertencia}
              </p>
            )}
          </div>

          <div className="mt-4 rounded-[10px] border border-[#E8E4DC] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#A8A49C]">
              Alcance jurídico y del residuo modelado
            </p>
            <ul className="mt-2 list-none space-y-2.5 text-[12px] leading-relaxed text-[#6B6760] [overflow-wrap:anywhere]">
              {circularityBaseline.warnings.map(warning => (
                <li
                  key={warning}
                  className="relative pl-[0.875rem] before:absolute before:left-0 before:top-[0.55em] before:h-1 before:w-1 before:rounded-full before:bg-[#3B6D11] before:content-['']"
                >
                  {warning}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      {hint && <p className="mt-1 text-[10px] leading-snug text-[#8A857C]">{hint}</p>}
      <p className="mt-1 font-mono text-[16px] text-[#1C1B18]">{value}</p>
    </div>
  )
}
