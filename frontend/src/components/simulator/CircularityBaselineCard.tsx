'use client'

import { useMemo } from 'react'
import { AlertTriangle, BookOpenCheck, Database, HelpCircle } from 'lucide-react'
import { getProgramPopulationShare } from '@/lib/zmPopulationScale'
import { useSimulatorStore } from '@/store/simulatorStore'

/** Texto institucional fijo — encaja con modelo 10.1 y con el enfoque LGPGIR de valorización y gestión integral (no es definición jurídica única). */
const CIRCULARIDAD_DEFINITION =
  'En ALQUIMIA, circularidad municipal del RSU es un número del 0% al 100% que sintetiza, de forma práctica para el simulador, cuánto del residuo sólido urbano modelado puede irse a rutas de aprovechamiento (por ejemplo separación en origen, reciclaje, compostaje), frente a lo que suele llegar sin recuperación apreciable. Marco general legal en México (LGPGIR): valorización y gestión integral como horizontes; este indicador no sustituye un inventario de campo oficial ni todas las métricas que puede exigir la norma aplicable municipio por municipio.'

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

  return (
    <section className="section" aria-labelledby="baseline-title">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">
        Punto de partida antes de tus metas
      </p>
      <h2 id="baseline-title" className="font-serif text-[24px] text-[#1C1B18] mb-2">
        Circularidad municipal del RSU (referencia inicial)
      </h2>

      <div className="mb-4 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] px-4 py-3">
        <p className="inline-flex items-start gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
          <BookOpenCheck size={14} className="mt-0.5 shrink-0 text-[#3B6D11]" aria-hidden="true" />
          Qué entendemos por circularidad aquí
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-[#1C1B18]">{CIRCULARIDAD_DEFINITION}</p>
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
            <div>
              <p className="text-[12px] text-[#6B6760]">{circularityBaseline.city_name}</p>
              <p
                className="mt-1 font-mono text-[34px] leading-none text-[#1C1B18]"
                aria-label={`Porcentaje de circularidad del modelo ${circularityBaseline.current_circularity_pct.toFixed(1)} por ciento`}
              >
                {circularityBaseline.current_circularity_pct.toFixed(1)}%
              </p>
              <p className="mt-3 text-[13px] leading-relaxed text-[#1C1B18]">
                <span className="font-semibold text-[#1C1B18]">Cómo leer este número: </span>
                {circularityBaseline.interpretation}
              </p>
            </div>

            <aside
              className="max-w-[min(100%,20rem)] rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-3 text-[12px] leading-snug text-amber-950"
              aria-labelledby="baseline-leyenda-alertas"
            >
              <p id="baseline-leyenda-alertas" className="sr-only">
                Leyenda del recuadro amarillo: significado estimado, no oficial e incertidumbre del modelo.
              </p>
              <div className="inline-flex items-center gap-1 font-semibold text-amber-900">
                <AlertTriangle size={14} aria-hidden="true" />
                Guía rápida (recuadro amarillo)
              </div>
              <dl className="mt-3 space-y-2">
                <div>
                  <dt className="inline font-semibold">Estimado: </dt>
                  <dd className="inline">
                    viene del modelo ALQUIMIA con datos públicos suplementarios, no es medición oficial de brigada ni padrón municipal de residuos.
                  </dd>
                </div>
                <div>
                  <dt className="inline font-semibold">No oficial: </dt>
                  <dd className="inline">
                    ningún ayuntamiento o autoridad federativa lo ha certificado desde esta pantalla; úsalo para preparar talleres,
                    ordenar prioridades internas y después sustituir con tu propia fuente.
                  </dd>
                </div>
                <div>
                  <dt className="flex items-start gap-1 font-semibold">
                    <HelpCircle size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                    Incertidumbre ±{circularityBaseline.uncertainty_pct_points.toFixed(1)} puntos (%):
                  </dt>
                  <dd className="mt-1 pl-0">
                    “pp” son puntos porcentuales: el margen vale para el mismo indicador entre 0% y 100%.
                    Con un valor central de {circularityBaseline.current_circularity_pct.toFixed(1)}% y ±
                    {circularityBaseline.uncertainty_pct_points.toFixed(1)}
                    pp el intervalo modelo razonable queda entre{' '}
                    <strong>
                      {rangeMin?.toFixed(1)}% y {rangeMax?.toFixed(1)}%
                    </strong>
                    — no garantiza ese rango estadístico en terreno real, marca incertidumbre del método usado aquí.
                  </dd>
                </div>
              </dl>
            </aside>
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
              <p className="mt-2 text-[11px] text-amber-900">{circularityBaseline.provenance.advertencia}</p>
            )}
          </div>

          <div className="mt-3 grid gap-2">
            {circularityBaseline.warnings.map(warning => (
              <p key={warning} className="rounded-[6px] bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                {warning}
              </p>
            ))}
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
