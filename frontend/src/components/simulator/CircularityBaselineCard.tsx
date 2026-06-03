'use client'

import { useMemo } from 'react'
import { Database } from 'lucide-react'
import { getProgramPopulationShare } from '@/lib/zmPopulationScale'
import { getMunicipioMadurezVista } from '@/lib/municipioMadurezContexto'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'
import { SectionLabel } from '@/components/editorial/SectionLabel'
import { Conclusion } from '@/components/editorial/Conclusion'
import { MarginalNote } from '@/components/editorial/MarginalNote'

/** Definiciones separadas para evitar mezclar captura con circularidad real. */
const DEFINICION_CAPTURA =
  '% RSU capturado = (RSU capturado valorizable / RSU generado total) × 100. Mide cuánto del total generado se recupera y entra a ruta útil.'
const DEFINICION_CIRCULARIDAD =
  '% Circularidad real = (RSU valorizado real / RSU generado total) × 100. Mide cuánto regresa efectivamente a reciclaje, composta, biodigestión o reúso.'

export function CircularityBaselineCard() {
  const {
    circularityBaseline,
    circularityBaselineLoading,
    cityPortalError,
    zmActiva,
    municipiosActivos,
    cityContext,
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

  const municipioNombreEtiquetas = useMemo(() => {
    return municipiosActivos.map(id => {
      const ctxNombre = cityContext?.municipios?.find(m => m.municipio_id === id)?.nombre
      if (ctxNombre) return ctxNombre
      return getMunicipioMadurezVista(id)?.nombre ?? id.toUpperCase()
    })
  }, [cityContext?.municipios, municipiosActivos])

  const interpretationParaVista = useMemo(() => {
    if (!circularityBaseline) return ''
    const base = circularityBaseline.interpretation
    if (popShare >= 1 - 1e-9) return base
    const nombres = municipioNombreEtiquetas
    const rsuAct = circularityBaseline.rsu_total_ton_day_est * popShare
    const recAct = circularityBaseline.material_recovery_ton_day_est * popShare
    const etiquetaAlcance = nombres.length === 1 ? nombres[0]! : nombres.join(', ')
    return (
      `${base} ` +
      `Para el subprograma activo (${etiquetaAlcance}), el modelo escala ~${rsuAct.toLocaleString('es-MX', { maximumFractionDigits: 2 })} t/día ` +
      `de RSU generado y ~${recAct.toLocaleString('es-MX', { maximumFractionDigits: 2 })} t/día canalizados a rutas útiles, ` +
      `proporcionales a la población municipal seleccionada frente al total de la zona metropolitana.`
    )
  }, [circularityBaseline, municipioNombreEtiquetas, popShare])

  return (
    <section className="section" aria-labelledby="baseline-title">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">
        Punto de partida antes de tus metas
      </p>
      <h2 id="baseline-title" className="font-serif text-[24px] text-[#1C1B18] mb-2">
        Indicadores base del municipio: captura RSU y circularidad real
      </h2>
      <ScopeAnclaKicker className="mb-3" />

      <div className="mb-4 space-y-3">
        <SectionLabel>Definiciones operativas del tablero</SectionLabel>
        <Conclusion as="div" className="text-[15px] leading-relaxed">
          {DEFINICION_CAPTURA}
        </Conclusion>
        <Conclusion as="div" className="text-[15px] leading-relaxed">
          {DEFINICION_CIRCULARIDAD}
        </Conclusion>
      </div>

      {circularityBaselineLoading && (
        <MarginalNote>
          Calculamos la referencia de residuos para la ciudad seleccionada y cuánto confía el modelo en esa lectura inicial…
        </MarginalNote>
      )}

      {!circularityBaselineLoading && cityPortalError && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {cityPortalError}
        </div>
      )}

      {!circularityBaselineLoading && !cityPortalError && !circularityBaseline && (
        <MarginalNote>
          Primero elige ciudad o zona metropolitana de trabajo más abajo. Sin esa selección no mostramos referencia inicial ni metas siguientes para no inventar territorio ni cifras.
        </MarginalNote>
      )}

      {!circularityBaselineLoading && circularityBaseline && (
        <div className="space-y-6">
          {popShare < 1 - 1e-6 && (
            <MarginalNote>
              Vista <strong>sub-zona</strong>: los toneladas/día del baseline se muestran al {(popShare * 100).toFixed(1)}% del total ZM
              (población municipios activos / población ZM en plataforma). El porcentaje de circularidad del API sigue siendo referencia regional.
            </MarginalNote>
          )}
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="min-w-0 max-w-[min(100%,40rem)] flex-1 space-y-4">
              <p className="text-[12px] text-[#6B6760]">{circularityBaseline.city_name}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <AnchorFigure
                  figure={`${circularityBaseline.current_circularity_pct.toFixed(1)}%`}
                  context="Circularidad modelada"
                  figureClassName="text-[34px]"
                />
                <AnchorFigure
                  figure={pctCaptura != null ? `${pctCaptura.toFixed(1)}%` : '—'}
                  context="% RSU capturado (referencia)"
                  figureClassName="text-[26px] text-[#23470A]"
                />
              </div>
              <p className="text-[13px] leading-relaxed text-[#1C1B18]">
                <span className="font-semibold text-[#1C1B18]">Cómo leer este número: </span>
                {interpretationParaVista}
              </p>
              <MarginalNote prefix="Incertidumbre del modelo">
                ±{circularityBaseline.uncertainty_pct_points.toFixed(1)} puntos porcentuales sobre este indicador.
                Intervalo ilustrativo entre <strong>{rangeMin?.toFixed(1)}% y {rangeMax?.toFixed(1)}%</strong>
                {' '}
                (no garantiza ese rango en campo; marca incertidumbre metodológica declarada aquí).
              </MarginalNote>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <AnchorFigure
              figure={`${(circularityBaseline.rsu_total_ton_day_est * popShare).toLocaleString('es-MX', { maximumFractionDigits: 2 })} t/día`}
              context="RSU modelado · ámbito activo"
            />
            <AnchorFigure
              figure={`${(circularityBaseline.material_recovery_ton_day_est * popShare).toLocaleString('es-MX', { maximumFractionDigits: 2 })} t/día`}
              context="Fracción en rutas útiles · ámbito activo"
            />
            <AnchorFigure
              figure={`${Math.round(circularityBaseline.confidence * 100)} %`}
              context="Confianza del modelo sobre esta referencia"
            />
          </div>

          <div className="border-t border-[#E8E4DC] pt-4 space-y-2">
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1C1B18]">
              <Database size={14} aria-hidden="true" />
              Fuente y condición de la referencia
            </p>
            <MarginalNote>
              <strong className="text-[#1C1B18]">{circularityBaseline.provenance.fuente_nombre}</strong>
              {' — '}
              organismo etiquetado: {circularityBaseline.provenance.fuente_organismo}. Tipo de dato: estimación no certificada.
              Confianza declarada: {Math.round(circularityBaseline.provenance.confianza * 100)}%.
              {circularityBaseline.provenance.advertencia && (
                <> {circularityBaseline.provenance.advertencia}</>
              )}
            </MarginalNote>
          </div>

          <div className="space-y-2">
            <SectionLabel>Alcance jurídico y del residuo modelado</SectionLabel>
            <ul className="list-none space-y-2.5 text-[12px] leading-relaxed text-[#6B6760] [overflow-wrap:anywhere]">
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
