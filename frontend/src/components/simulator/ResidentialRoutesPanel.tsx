'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { AlertTriangle, Download, MapPin, Route, Save } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { useLogisticsRoutesStore } from '@/store/logisticsRoutesStore'
import { buildTerritorialPlan, getLogisticsDepot, getResidentialRoutes, saveResidentialRoute } from '@/lib/api'
import { useMapCenter } from '@/hooks/useMapCenter'
import {
  buildDraftRoutesFromTerritorialPlan,
  computeRouteTotals,
  type ResidentialRoutePlan,
} from '@/lib/residentialRouteTiming'
import { geocodeColoniaStop, planGoogleRoute } from '@/lib/logisticsRoutesApi'
import { decodePolyline } from '@/lib/polylineDecode'
import { buildCabildoLogisticaCsv, downloadCabildoLogisticaCsv } from '@/lib/exportCabildoLogistica'
import { ZMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { MapMarker, MapPolyline } from '@/components/maps/GoogleMapCanvas'

const GoogleMapCanvas = dynamic(
  () => import('@/components/maps/GoogleMapCanvas').then(m => m.GoogleMapCanvas),
  { ssr: false },
)

const ROUTE_COLORS = ['#1A5FA8', '#3B6D11', '#D4881E', '#7B3FA8', '#C0392B']

type Props = {
  municipioLabel: string
  rsuDia: number
  hasResultados: boolean
}

export function ResidentialRoutesPanel({ municipioLabel, rsuDia, hasResultados }: Props) {
  const {
    zmActiva, municipiosActivos, resultados, tiposVivienda, horizonte,
    pctCapturaPorAño, mixCAs, cityContext, seleccionMunicipioCatalog,
  } = useSimulatorStore()

  const {
    timingParams, selectedRouteId, setPlansForZm, updatePlan, setStopMinServicio,
    setSelectedRouteId, getPlans, setTimingParam,
  } = useLogisticsRoutesStore()

  const plans = getPlans(zmActiva)
  const selectedPlan = plans.find(p => p.route_id === selectedRouteId) ?? plans[0] ?? null

  const { center: mapCenter } = useMapCenter(zmActiva, cityContext?.nombre)
  const [loadingDraft, setLoadingDraft] = useState(false)
  const [tracing, setTracing] = useState(false)
  const [traceError, setTraceError] = useState<string | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [depotConfianza, setDepotConfianza] = useState<string | null>(null)

  const zm = ZMS.find(z => z.id === zmActiva)
  const mixVerticalPct = zm?.mixVivienda.vertical ?? 0.35
  const capInstalada =
    (mixCAs.P ?? 0) * 5 + (mixCAs.M ?? 0) * 15 + (mixCAs.G ?? 0) * 50

  const loadDraftRoutes = useCallback(async () => {
    if (!hasResultados || municipiosActivos.length === 0) return
    setLoadingDraft(true)
    setDraftError(null)
    try {
      const normalizedHorizon = horizonte <= 3 ? 3 : horizonte <= 5 ? 5 : 7
      const targetCapture = pctCapturaPorAño[Math.max(0, normalizedHorizon - 1)] ?? 70
      const territorial = await buildTerritorialPlan({
        city_id: zmActiva,
        municipios: municipiosActivos,
        horizon_years: normalizedHorizon,
        start_month: 1,
        current_capture_pct: 0,
        target_capture_pct: targetCapture,
        rsu_total_ton_day: rsuDia,
        available_capacity_ton_day: capInstalada,
      })
      const draft = buildDraftRoutesFromTerritorialPlan({
        plan: territorial,
        zmId: zmActiva,
        vivActivas: resultados?.vivActivas ?? 0,
        tiposVivienda,
        mixVerticalPct,
        timing: timingParams,
      })
      setPlansForZm(zmActiva, draft)
    } catch (e) {
      setDraftError(e instanceof Error ? e.message : 'No se pudo cargar colonias del plan territorial')
    } finally {
      setLoadingDraft(false)
    }
  }, [
    hasResultados, municipiosActivos, horizonte, pctCapturaPorAño, rsuDia, capInstalada,
    zmActiva, resultados?.vivActivas, tiposVivienda, mixVerticalPct, timingParams, setPlansForZm,
  ])

  useEffect(() => {
    if (plans.length === 0 && hasResultados && municipiosActivos.length > 0) {
      void loadDraftRoutes()
    }
  }, [plans.length, hasResultados, municipiosActivos.length, loadDraftRoutes])

  useEffect(() => {
    let cancelled = false
    getResidentialRoutes({ zm: zmActiva, traced_only: true })
      .then(({ routes }) => {
        if (cancelled || routes.length === 0 || plans.some(p => p.traced)) return
        const hydrated = routes.map(r => r as unknown as ResidentialRoutePlan)
        if (hydrated.length > 0) setPlansForZm(zmActiva, hydrated)
      })
      .catch(() => { /* offline — localStorage cache */ })
    return () => { cancelled = true }
  }, [zmActiva, plans, setPlansForZm])

  const traceSelectedRoute = useCallback(async () => {
    if (!selectedPlan) return
    setTracing(true)
    setTraceError(null)
    try {
      const geocodedStops = await Promise.all(selectedPlan.stops.map(geocodeColoniaStop))
      const claveInegi = seleccionMunicipioCatalog?.claveInegi
      const depotResolved = await getLogisticsDepot({
        clave_inegi: claveInegi ?? undefined,
        municipio_id: selectedPlan.stops[0]?.municipio_id ?? municipiosActivos[0] ?? 'slp',
        zm: zmActiva,
      })
      setDepotConfianza(depotResolved.confianza)
      const depotGeo = {
        lat: depotResolved.lat,
        lon: depotResolved.lon,
        label: depotResolved.label,
      }

      const routeResult = await planGoogleRoute({
        zm: zmActiva,
        municipio_id: selectedPlan.stops[0]?.municipio_id ?? municipiosActivos[0] ?? 'slp',
        depot: { lat: depotGeo.lat, lon: depotGeo.lon, label: depotGeo.label },
        stops: geocodedStops,
        returnToDepot: true,
      })

      if (!routeResult) throw new Error('Google Routes API no devolvió tramos')

      const totals = computeRouteTotals(
        geocodedStops,
        timingParams,
        routeResult.total_min,
        routeResult.total_km,
        selectedPlan.frecuencia_semana,
      )

      const updated: ResidentialRoutePlan = {
        ...selectedPlan,
        stops: geocodedStops,
        depot: { lat: depotGeo.lat, lon: depotGeo.lon, label: depotGeo.label },
        legs: routeResult.legs,
        traced: true,
        saved_at: new Date().toISOString(),
        source: 'google_routes',
        ...totals,
      }
      const persistPayload = {
        ...updated,
        clave_inegi: claveInegi ?? undefined,
        zm: zmActiva,
        municipio_id: selectedPlan.stops[0]?.municipio_id ?? municipiosActivos[0] ?? 'slp',
      }
      updatePlan(zmActiva, updated)

      try {
        await saveResidentialRoute(persistPayload as unknown as Record<string, unknown>)
      } catch {
        /* persistencia Neon opcional — localStorage sigue activo */
      }

      if (typeof window !== 'undefined') {
        const all = useLogisticsRoutesStore.getState().getPlans(zmActiva)
        ;(window as unknown as { __ALQUIMIA_RESIDENTIAL_ROUTES__?: typeof all }).__ALQUIMIA_RESIDENTIAL_ROUTES__ = all
      }
    } catch (e) {
      setTraceError(e instanceof Error ? e.message : 'Error al trazar ruta')
    } finally {
      setTracing(false)
    }
  }, [
    selectedPlan, municipioLabel, mapCenter, zmActiva, municipiosActivos, timingParams,
    updatePlan, seleccionMunicipioCatalog?.claveInegi,
  ])

  const mapMarkers = useMemo((): MapMarker[] => {
    if (!selectedPlan) return []
    const markers: MapMarker[] = []
    if (selectedPlan.depot) {
      markers.push({
        id: 'depot',
        lat: selectedPlan.depot.lat,
        lon: selectedPlan.depot.lon,
        title: selectedPlan.depot.label,
        color: depotConfianza === 'verificado' ? '#C0392B' : depotConfianza === 'candidato' ? '#D4881E' : '#3B6D11',
      })
    }
    selectedPlan.stops.forEach((s, i) => {
      if (s.lat == null || s.lon == null) return
      markers.push({
        id: `stop-${i}`,
        lat: s.lat,
        lon: s.lon,
        title: `${s.colonia} (${s.segment === 'vertical' ? 'Edificio' : 'Casa'}) · ${s.min_servicio} min`,
        color: s.segment === 'vertical' ? '#1A5FA8' : '#D4881E',
      })
    })
    return markers
  }, [selectedPlan])

  const mapPolylines = useMemo((): MapPolyline[] => {
    if (!selectedPlan?.traced) return []
    const idx = plans.findIndex(p => p.route_id === selectedPlan.route_id)
    const color = ROUTE_COLORS[idx % ROUTE_COLORS.length]!
    return selectedPlan.legs
      .filter(l => l.encoded_polyline)
      .map((l, i) => ({
        id: `leg-${i}`,
        path: decodePolyline(l.encoded_polyline!),
        color,
        strokeWeight: 5,
      }))
  }, [selectedPlan, plans])

  const exportCabildo = () => {
    const csv = buildCabildoLogisticaCsv({
      municipio: municipioLabel,
      zm: zmActiva,
      plans,
      timing: timingParams,
    })
    const slug = municipioLabel.replace(/\s+/g, '_').slice(0, 24)
    downloadCabildoLogisticaCsv(`Anexo_Logistica_Residencial_${slug}_${new Date().toISOString().slice(0, 10)}.csv`, csv)
  }

  const totalOpexMes = plans.reduce((s, p) => s + p.opex_mes_mxn, 0)

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-[#BDD7F5] bg-[#EBF3FB] px-4 py-3">
        <p className="text-[12px] font-semibold text-[#1A5FA8]">Programación de rutas residenciales (vertical + casa)</p>
        <p className="text-[10px] text-[#6B6760] mt-1">
          Colonias del plan territorial M05C · tiempos editables por concesionario · trazado Google Routes API · export Cabildo.
        </p>
      </div>

      {!hasResultados && (
        <p className="text-[11px] text-[#A8A49C]">Complete M01 para estimar viviendas por colonia.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={loadingDraft || !hasResultados}
          onClick={() => void loadDraftRoutes()}
          className="rounded-[8px] bg-[#1A5FA8] px-3 py-2 text-[11px] font-semibold text-white disabled:opacity-50"
        >
          {loadingDraft ? 'Cargando colonias…' : 'Cargar rutas desde oleadas territoriales'}
        </button>
        <button
          type="button"
          disabled={!selectedPlan || tracing}
          onClick={() => void traceSelectedRoute()}
          className="rounded-[8px] border border-[#1A5FA8] bg-white px-3 py-2 text-[11px] font-semibold text-[#1A5FA8] disabled:opacity-50 flex items-center gap-1.5"
        >
          <Route className="w-3.5 h-3.5" />
          {tracing ? 'Trazando ruta…' : 'Trazar ruta en mapa (Google Routes)'}
        </button>
        <button
          type="button"
          disabled={plans.length === 0}
          onClick={exportCabildo}
          className="rounded-[8px] border border-[#3B6D11] bg-[#EAF3DE] px-3 py-2 text-[11px] font-semibold text-[#2D5A0D] disabled:opacity-50 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          Export anexo Cabildo (CSV)
        </button>
      </div>

      {draftError && <p className="text-[11px] text-red-700">{draftError}</p>}
      {traceError && <p className="text-[11px] text-red-700">{traceError}</p>}
      {depotConfianza && (
        <p className="text-[10px] text-[#6B6760]">
          Depósito: <span className="font-semibold">{depotConfianza}</span>
          {depotConfianza === 'candidato' && ' — validar operador en campo'}
          {depotConfianza === 'fallback' && ' — sin datos geo; coordenadas aproximadas'}
        </p>
      )}

      {plans.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {plans.map((p, i) => (
              <button
                key={p.route_id}
                type="button"
                onClick={() => setSelectedRouteId(p.route_id)}
                className={cn(
                  'rounded-[8px] border px-3 py-1.5 text-[10px] font-semibold',
                  selectedPlan?.route_id === p.route_id
                    ? 'border-[#1A5FA8] bg-[#EBF3FB] text-[#1A5FA8]'
                    : 'border-[#E8E4DC] bg-white text-[#6B6760]',
                )}
              >
                <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ background: ROUTE_COLORS[i % ROUTE_COLORS.length] }} />
                {p.zona_label}
                {p.traced ? ' ✓' : ''}
              </button>
            ))}
          </div>

          {mapCenter && (
            <div className="rounded-[12px] border border-[#E8E4DC] overflow-hidden" style={{ height: 360 }}>
              <GoogleMapCanvas
                center={selectedPlan?.depot ?? mapCenter}
                zoom={12}
                height={360}
                markers={mapMarkers}
                polylines={mapPolylines}
              />
            </div>
          )}

          {selectedPlan && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: 'Min turno', value: `${selectedPlan.total_min_turno}`, warn: selectedPlan.excede_turno },
                { label: 'Km ruta', value: `${selectedPlan.total_km}` },
                { label: 'Litros/turno', value: `${selectedPlan.litros_turno}` },
                { label: 'OPEX mes ruta', value: `$${selectedPlan.opex_mes_mxn.toLocaleString('es-MX')}` },
              ].map(c => (
                <div key={c.label} className={cn('rounded-[8px] border p-2.5 text-[11px]', c.warn ? 'border-amber-300 bg-amber-50' : 'border-[#E8E4DC] bg-white')}>
                  <p className="text-[9px] uppercase text-[#A8A49C]">{c.label}</p>
                  <p className="font-bold text-[#1C1B18]">{c.value}</p>
                </div>
              ))}
            </div>
          )}

          {selectedPlan?.excede_turno && (
            <div className="flex items-start gap-2 rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Turno &gt; {timingParams.maxMinutosTurno} min — dividir ruta o ajustar tiempos con concesionario.
            </div>
          )}

          <div className="overflow-x-auto rounded-[12px] border border-[#E8E4DC] bg-white">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Colonia', 'Municipio', 'Tipo', 'Viviendas', 'Min servicio (editable)', 'Coordenadas'].map(h => (
                    <th key={h} className="text-left px-3 py-2 font-bold uppercase text-[9px] text-[#1C1B18]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedPlan?.stops.map((s, i) => (
                  <tr key={`${s.colonia}-${i}`} className={i % 2 ? 'bg-[#FAFAF8]' : 'bg-white'}>
                    <td className="px-3 py-2 font-semibold text-[#1C1B18]">
                      <MapPin className="inline w-3 h-3 text-[#1A5FA8] mr-1" />
                      {s.colonia}
                    </td>
                    <td className="px-3 py-2 text-[#6B6760]">{s.municipio_nombre}</td>
                    <td className="px-3 py-2">{s.segment === 'vertical' ? 'Edificio' : 'Casa'}</td>
                    <td className="px-3 py-2 font-mono">{s.viviendas_estimadas}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={1}
                        step={0.5}
                        value={s.min_servicio}
                        onChange={e => {
                          const v = parseFloat(e.target.value)
                          if (!selectedPlan || Number.isNaN(v)) return
                          setStopMinServicio(zmActiva, selectedPlan.route_id, s.colonia, v)
                        }}
                        className="w-20 rounded border border-[#E8E4DC] px-2 py-1 font-mono text-[10px]"
                        aria-label={`Minutos servicio ${s.colonia}`}
                      />
                    </td>
                    <td className="px-3 py-2 font-mono text-[9px] text-[#A8A49C]">
                      {s.lat != null ? `${s.lat.toFixed(4)}, ${s.lon!.toFixed(4)}` : 'Pendiente trazado'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[10px]">
            <label className="flex flex-col gap-1">
              <span className="text-[9px] uppercase text-[#A8A49C]">Min/vivienda vertical</span>
              <input type="number" step={0.05} value={timingParams.minPorViviendaVertical}
                onChange={e => setTimingParam('minPorViviendaVertical', parseFloat(e.target.value) || 0.55)}
                className="rounded border border-[#E8E4DC] px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] uppercase text-[#A8A49C]">Min/vivienda casa</span>
              <input type="number" step={0.05} value={timingParams.minPorViviendaCasa}
                onChange={e => setTimingParam('minPorViviendaCasa', parseFloat(e.target.value) || 0.95)}
                className="rounded border border-[#E8E4DC] px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] uppercase text-[#A8A49C]">L/km camión</span>
              <input type="number" step={0.01} value={timingParams.litrosPorKm}
                onChange={e => setTimingParam('litrosPorKm', parseFloat(e.target.value) || 0.38)}
                className="rounded border border-[#E8E4DC] px-2 py-1" />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[9px] uppercase text-[#A8A49C]">$/litro combustible</span>
              <input type="number" step={0.5} value={timingParams.costoCombustibleLitroMxn}
                onChange={e => setTimingParam('costoCombustibleLitroMxn', parseFloat(e.target.value) || 24.5)}
                className="rounded border border-[#E8E4DC] px-2 py-1" />
            </label>
          </div>

          <div className="flex items-center justify-between rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] px-4 py-3 text-[11px]">
            <span className="text-[#3B6D11] font-semibold">OPEX combustible total (todas las rutas)</span>
            <span className="font-bold text-[#1A4200]">${totalOpexMes.toLocaleString('es-MX')} MXN/mes</span>
          </div>

          {selectedPlan?.traced && (
            <p className="text-[9px] text-[#A8A49C] flex items-center gap-1">
              <Save className="w-3 h-3" />
              Ruta guardada {selectedPlan.saved_at ? new Date(selectedPlan.saved_at).toLocaleString('es-MX') : ''} · source: {selectedPlan.source}
            </p>
          )}
        </>
      )}
    </div>
  )
}
