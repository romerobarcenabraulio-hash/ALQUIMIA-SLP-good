'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Line, Legend,
} from 'recharts'
import {
  AlertTriangle, Truck, Clock, TrendingUp, ChevronDown,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { ESTACIONALIDAD } from '@/lib/constants'
import {
  buildLogisticsKpiContract,
  computeBottlenecks,
  computeLogisticsConfidence,
  computeLogisticsKpis,
  computePerRoutes,
  computeSeasonData,
  computeTrucksByMaterial,
} from '@/lib/logisticsCalc'
import { infraOperativaFromStore } from '@/lib/infraOperativaSummary'
import { useMapCenter } from '@/hooks/useMapCenter'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
import { CHART_AXIS_TICK, CHART_GRID, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { buildRecyclersKpiContract } from '@/lib/recicladorasCatalog'
import { ResidentialRoutesPanel } from '@/components/simulator/ResidentialRoutesPanel'
import { EditorialCallout, EditorialStatusLabel, gravedadTone, MarginalNote } from '@/components/editorial'

const CentrosAcopioMap = dynamic(
  () => import('@/components/simulator/CentrosAcopioMap').then(m => m.CentrosAcopioMap),
  { ssr: false, loading: () => (
    <div className="flex h-48 items-center justify-center rounded-[10px] border border-dashed border-[#E8E4DC]">
      <p className="text-[11px] text-[#6B6760]">Cargando mapa…</p>
    </div>
  ) },
)

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function RailSection({ title, children, open: defaultOpen = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 text-left">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760] font-bold">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760] space-y-1">{children}</div>}
    </div>
  )
}

export function LogisticaOperativaStack() {
  const { zmActiva, resultados, mixCAs, cityContext, capCamionTon, municipiosActivos, rechazoPorMat, seleccionMunicipioCatalog } = useSimulatorStore()
  const municipioLabel = cityContext?.nombre ?? zmActiva
  const municipioId = municipiosActivos[0] ?? null
  const claveInegi = seleccionMunicipioCatalog?.claveInegi ?? null
  const { center: mapCenter, source: mapSource } = useMapCenter(zmActiva, cityContext?.nombre)

  const rsuDia = resultados?.rsuTotalTonDia ?? 0
  const hasResultados = rsuDia > 0 && !!resultados?.camionesRequeridos
  const infra = useMemo(() => infraOperativaFromStore(mixCAs, resultados), [mixCAs, resultados])
  const capInstalada = infra.capInstaladaTonDia

  const trucksByMaterial = useMemo(
    () => computeTrucksByMaterial(rsuDia, resultados ?? undefined),
    [rsuDia, resultados],
  )
  const logisticsKpis = useMemo(() => computeLogisticsKpis(trucksByMaterial), [trucksByMaterial])

  const seasonData = useMemo(
    () => computeSeasonData(rsuDia, capInstalada, MESES, ESTACIONALIDAD),
    [rsuDia, capInstalada],
  )

  const calculatedBottlenecks = useMemo(
    () => computeBottlenecks(infra, seasonData, trucksByMaterial),
    [infra, seasonData, trucksByMaterial],
  )

  const perRoutes = useMemo(
    () => computePerRoutes(trucksByMaterial, zmActiva),
    [trucksByMaterial, zmActiva],
  )

  const confianza = computeLogisticsConfidence({
    hasResultados,
    rsuDia,
    mapSource,
  })

  // Contrato KRONOS — disponible en window para agentes/diagnostics (no persiste)
  useEffect(() => {
    if (!hasResultados) return
    const contract = buildLogisticsKpiContract({
      zm: zmActiva,
      municipio: municipioLabel,
      municipio_id: municipioId,
      clave_inegi: claveInegi,
      capCamionTon,
      infra,
      trucks: trucksByMaterial,
      kpis: logisticsKpis,
      seasonData,
      hasResultados,
      hasM06: mixCAs.P + mixCAs.M + mixCAs.G > 0,
      rechazoPorMat,
    })
    ;(window as unknown as { __ALQUIMIA_LOGISTICS_KPI__?: typeof contract }).__ALQUIMIA_LOGISTICS_KPI__ = contract
    const recyclers = buildRecyclersKpiContract({
      zmId: zmActiva,
      municipioId,
      caAnchor: mapCenter ?? undefined,
    })
    ;(window as unknown as { __ALQUIMIA_RECYCLERS_KPI__?: typeof recyclers }).__ALQUIMIA_RECYCLERS_KPI__ = recyclers
  }, [zmActiva, municipioLabel, municipioId, claveInegi, capCamionTon, infra, trucksByMaterial, logisticsKpis, seasonData, hasResultados, mixCAs, rechazoPorMat, mapCenter])

  const mesesSaturacion = seasonData.filter(d => d.rsu > d.cap && d.cap > 0).map(d => d.mes)

  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div className="space-y-5">

          <EditorialCallout label="Rutas y cobertura operativa">
            {!hasResultados
              ? 'Complete M01 Baseline (RSU modelado) y M06 Infraestructura para dimensionar rutas y trazar en mapa.'
              : 'Use el panel de rutas por colonia para trazar recorridos. Centros propuestos en M06; progresión mes a mes en 05C Oleadas territoriales.'}
          </EditorialCallout>

          {/* Rutas residenciales por colonia — trazado + Cabildo */}
          <section className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="text-[13px] font-semibold text-[#1C1B18]">Programación de rutas por colonia</p>
              <p className="text-[11px] text-[#A8A49C] mt-0.5">Vertical · casa · tiempos · combustible · export Cabildo</p>
            </div>
            <div className="p-4">
              <ResidentialRoutesPanel
                municipioLabel={municipioLabel}
                rsuDia={rsuDia}
                hasResultados={hasResultados}
              />
            </div>
          </section>

          {/* Logistics KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Camiones requeridos', value: String(logisticsKpis.totalCamiones), sub: 'motor M01 + M06', icon: Truck, color: '#1A5FA8' },
              { label: 'Visitas mensuales', value: String(logisticsKpis.visitasMes), sub: 'est. operación', icon: Clock, color: '#3B6D11' },
              { label: 'Merma logística', value: `${logisticsKpis.mermaPct}%`, sub: 'del vol. movilizado', icon: AlertTriangle, color: '#C0392B' },
              { label: 'Presión operativa', value: logisticsKpis.presion, sub: 'según flota', icon: TrendingUp, color: '#D4881E' },
            ].map(c => (
              <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
                <div className="flex items-center gap-1.5 mb-1"><c.icon className="w-3.5 h-3.5 shrink-0" style={{ color: c.color }} /><p className="text-[9px] uppercase text-[#A8A49C]">{c.label}</p></div>
                <p className="text-[20px] font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-[9px] text-[#A8A49C]">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Map CAs + recicladoras */}
          <ExpandableChart chartId="m08-routes" title="Mapa de rutas y cobertura operativa" subtitle={`${municipioLabel} · rutas dimensionadas · brechas críticas`}>
              <div className="p-4">
                <CentrosAcopioMap showRecicladoras />
                <div className="flex flex-wrap gap-3 mt-3 items-center">
                  <div className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1.5 text-[12px]">
                    <p className="font-bold text-[#1C1B18]">{logisticsKpis.totalCamiones}</p>
                    <p className="text-[11px] text-[#A8A49C]">Camiones est. (M01+M06)</p>
                  </div>
                  <div className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1.5 text-[12px]">
                    <p className="font-bold text-[#1C1B18]">{infra.centrosActivos}</p>
                    <p className="text-[11px] text-[#A8A49C]">Centros activos</p>
                  </div>
                  <div className="rounded-[6px] border border-[#FDE8E8] bg-[#FEF7F7] px-2 py-1.5 text-[12px]">
                    <p className="font-bold text-[#C0392B]">{infra.brechaTonDia.toFixed(1)} t/d</p>
                    <p className="text-[11px] text-[#A8A49C]">Brecha vs capacidad</p>
                  </div>
                  <ProvenanceBadge
                    tipo={hasResultados ? 'estimado' : 'manual'}
                    confianza={confianza}
                    fuente={hasResultados ? 'resultados.camionesRequeridos + mixCAs' : 'mixCAs'}
                    advertencia={
                      !hasResultados
                        ? 'Complete M01 para dimensionar flota.'
                        : mapSource === 'fallback'
                          ? 'Mapa en coordenadas de respaldo — geocoding no disponible.'
                          : undefined
                    }
                  />
                </div>
              </div>
          </ExpandableChart>

          {/* Trucks table */}
          <ExpandableChart chartId="m08-trucks" title="Camiones requeridos por material" subtitle={`Vol. t/día · unidades · frecuencia · riesgo · observación · cap. ${capCamionTon} t/camión`}>
              <div className="overflow-x-auto">
                {trucksByMaterial.length === 0 ? (
                  <p className="px-5 py-8 text-[11px] text-[#A8A49C] text-center">Complete M01 para calcular flota por material.</p>
                ) : (
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                        {['Material', 'Vol. t/día', 'Camiones', 'Frecuencia', 'Riesgo logístico', 'Observación'].map(h => (
                          <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[9px]">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {trucksByMaterial.map((t, i) => {
                        const rColor = t.riesgo === 'Alto' ? 'bg-[#FDE8E8] text-[#B91C1C]' : t.riesgo === 'Medio' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#D1FAE5] text-[#065F46]'
                        return (
                          <tr key={t.material} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                            <td className="px-3 py-2.5 font-semibold text-[#1C1B18]">{t.material}</td>
                            <td className="px-3 py-2.5 font-mono">{t.volDia}</td>
                            <td className="px-3 py-2.5 font-bold text-[#1A5FA8] font-mono">{t.camiones}</td>
                            <td className="px-3 py-2.5 text-[#6B6760]">{t.frecuencia}</td>
                            <td className="px-3 py-2.5"><span className={cn('px-1.5 py-0.5 rounded font-semibold text-[9px]', rColor)}>{t.riesgo}</span></td>
                            <td className="px-3 py-2.5 text-[9px] text-[#6B6760]">{t.obs}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
          </ExpandableChart>

          {/* Seasonality chart */}
          <ExpandableChart
            chartId="m08-seasonality"
            title="Estacionalidad y capacidad de servicio"
            subtitle={mesesSaturacion.length > 0
              ? `Meses con demanda superior a capacidad: ${mesesSaturacion.join(', ')}`
              : 'RSU mensual esperado vs. capacidad instalada (t/mes)'}
          >
              <div className="px-6 py-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={seasonData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid {...CHART_GRID} />
                    <XAxis dataKey="mes" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                    <YAxis tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={CHART_TOOLTIP_STYLE}
                      formatter={(v: number, n: string) => [`${v.toLocaleString()} t`, n === 'rsu' ? 'RSU mensual' : 'Cap. instalada']}
                    />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                    <Bar dataKey="rsu" name="RSU mensual (t)" fill="#1A5FA8" radius={[3, 3, 0, 0]}>
                      {seasonData.map((d, i) => (
                        <Cell key={i} fill={d.rsu > d.cap && d.cap > 0 ? '#C0392B' : '#1A5FA8'} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="cap" name="Cap. instalada" stroke="#3B6D11" strokeWidth={2} dot={false} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[9px] text-[#A8A49C] mt-2">Barras rojas = meses donde la demanda supera capacidad instalada ({capInstalada.toFixed(1)} t/día)</p>
              </div>
          </ExpandableChart>

          {/* PER routes */}
          {perRoutes.length > 0 && (
            <div className="space-y-3">
              <p className="text-[12px] font-semibold text-[#1C1B18]">PER — Presión, estado y respuesta por ruta crítica</p>
              {perRoutes.map(r => (
                <div key={r.id} className="rounded-[10px] border border-[#E8E4DC] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="font-mono text-[10px] font-bold text-[#1C1B18]">{r.id}</span>
                    <span className="text-[11px] font-semibold text-[#1C1B18]">{r.material}</span>
                    {r.estado_chip === 'alerta' ? (
                      <EditorialStatusLabel tone="critical" className="ml-auto normal-case">
                        Alerta
                      </EditorialStatusLabel>
                    ) : (
                      <EditorialStatusLabel tone="info" className="ml-auto normal-case">
                        Normal
                      </EditorialStatusLabel>
                    )}
                    {r.estado_chip === 'alerta' && <AlertTriangle className="h-3.5 w-3.5 text-[#C0392B]" aria-hidden />}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[10px]">
                    {[['Presión', r.presion, '#C0392B'], ['Estado', r.estado, '#1A5FA8'], ['Respuesta', r.respuesta, '#3B6D11']].map(([k, v, c]) => (
                      <div key={k as string}>
                        <p className="font-bold uppercase tracking-wide text-[10px] mb-0.5" style={{ color: c as string }}>{k as string}</p>
                        <p className="text-[#4A4740] leading-snug">{v as string}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-[#A8A49C] mt-2 pt-2 border-t border-current/10">{r.bitacora}</p>
                </div>
              ))}
            </div>
          )}

          {/* Bottlenecks */}
          <div className="space-y-2.5">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Cuellos de botella detectados</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {calculatedBottlenecks.map(b => {
                const tColor = b.gravedad === 'Alto' ? 'text-[#C0392B]' : b.gravedad === 'Medio' ? 'text-[#D4881E]' : 'text-[#3B6D11]'
                return (
                  <div key={b.zona} className="rounded-[10px] border border-[#E8E4DC] p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-[11px] font-semibold text-[#1C1B18] leading-snug">{b.zona}</p>
                      <EditorialStatusLabel tone={gravedadTone(b.gravedad)} className="shrink-0 normal-case">
                        {b.gravedad}
                      </EditorialStatusLabel>
                    </div>
                    <p className="text-[9px] text-[#6B6760] mb-1">Causa: {b.causa}</p>
                    <p className={cn('text-[9px] font-semibold mb-2', tColor)}>Impacto: {b.impacto}</p>
                    <p className="text-[9px] text-[#4A4740]">→ {b.accion}</p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Cross-reference to VPN tornado */}
          <MarginalNote prefix="Ver también">
            La sensibilidad del <strong>VPN</strong> ante cambios en variables operativas se analiza en M13 · Retorno Financiero → Análisis de riesgo.
          </MarginalNote>
        </div>

        {/* Right rail */}
        <div className="border-t border-[#E8E4DC] pt-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Consideraciones</p>
            <span className={cn(
              'text-[9px] font-bold px-2 py-0.5 rounded',
              confianza >= 0.55 ? 'bg-[#EAF3DE] text-[#2D5A0D]' : 'bg-[#FEF3C7] text-[#92400E]',
            )}>
              Confianza {Math.round(confianza * 100)}%
            </span>
          </div>
          <RailSection title="Cómo se calcula" open>
            <p>Camiones desde <code>resultados.camionesRequeridos</code> del motor (M01), con capacidad de {capCamionTon} t/camión/día. Estacionalidad del modelo de generación RSU. PER y cuellos derivados del escenario activo — fase 0-1, sin bitácora de campo.</p>
          </RailSection>
          <RailSection title="Decisión que habilita">
            <p>Dimensionar la flota y aprobar las rutas piloto antes de la primera fase de operación.</p>
          </RailSection>
          <RailSection title="Metodología">
            <p>Dimensionamiento conceptual multi-municipio. KPIs publicables vía <code>window.__ALQUIMIA_LOGISTICS_KPI__</code> para KRONOS (Fase 0-1, estimado).</p>
          </RailSection>
          <RailSection title="Módulos relacionados">
            <p>M06: Infraestructura que estas rutas sirven. M07: Personal que opera las rutas. M10: Mercado que recibe el material.</p>
          </RailSection>
          <RailSection title="Qué verificar aún">
            <ul className="space-y-1">
              {['Topografía y restricciones de acceso en zonas específicas.', 'Capacidad real de las unidades de recolección existentes.', 'Coordenadas de CAs en M06 para rutas con Google Routes API.'].map(v => (
                <li key={v} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#D4881E] shrink-0" />{v}</li>
              ))}
            </ul>
          </RailSection>
        </div>
      </div>
    </div>
  )
}
