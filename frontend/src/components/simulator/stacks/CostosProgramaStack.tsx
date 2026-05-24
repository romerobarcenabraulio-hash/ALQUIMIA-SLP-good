'use client'

import { useEffect, useMemo } from 'react'
import { DollarSign, Users, Clock, TrendingUp, Truck } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CapexOpexBreakdown } from '@/components/simulator/CapexOpexBreakdown'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { buildLogisticsKpiFromStore } from '@/lib/buildLogisticsKpiFromStore'
import {
  buildFinanceKpiContract,
  computeOpexLogisticaAnual,
} from '@/lib/financeLogisticsCalc'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { FASES_INVERSION, CAPEX_CA, OPEX_CA } from '@/lib/capexOpexData'
import { CA_CONFIG } from '@/lib/constants'

const fmtMXN = (n: number) =>
  new Intl.NumberFormat('es-MX', {
    style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
  }).format(n)

const fmtN = (n: number) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n)

// Datos de fases estáticos derivados de FASES_INVERSION
const fasesData = FASES_INVERSION.map(f => ({
  name: `F${f.fase}`,
  label: f.nombre,
  capex: +(f.capexTotalSistema / 1_000_000).toFixed(1),
  empleos: f.empleosTotales,
  ebitdaK: +(f.ebitdaMesSistema / 1_000).toFixed(0),
}))

export function CostosProgramaStack() {
  const mixCAs     = useSimulatorStore(s => s.mixCAs)
  const resultados = useSimulatorStore(s => s.resultados)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const cityContext = useSimulatorStore(s => s.cityContext)
  const capCamionTon = useSimulatorStore(s => s.capCamionTon)
  const costoCamionMesMxn = useSimulatorStore(s => s.costoCamionMesMxn)
  const costoVisitaMxn = useSimulatorStore(s => s.costoVisitaMxn)
  const costoContingenciaTonMxn = useSimulatorStore(s => s.costoContingenciaTonMxn)
  const rechazoPorMat = useSimulatorStore(s => s.rechazoPorMat)
  const seleccionMunicipioCatalog = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const setCostoCamionMesMxn = useSimulatorStore(s => s.setCostoCamionMesMxn)
  const setCostoVisitaMxn = useSimulatorStore(s => s.setCostoVisitaMxn)
  const setCostoContingenciaTonMxn = useSimulatorStore(s => s.setCostoContingenciaTonMxn)

  const municipioLabel = cityContext?.nombre ?? zmActiva
  const municipioId = municipiosActivos[0] ?? null
  const claveInegi = seleccionMunicipioCatalog?.claveInegi ?? null
  const totalCAs = mixCAs.P + mixCAs.M + mixCAs.G
  const hasM01 = (resultados?.rsuTotalTonDia ?? 0) > 0
  const hasM06 = totalCAs > 0
  const capexBloqueado = !hasM06

  const logisticsContract = useMemo(
    () =>
      buildLogisticsKpiFromStore({
        zmActiva,
        municipioLabel,
        municipioId,
        claveInegi,
        capCamionTon,
        mixCAs,
        resultados,
        rechazoPorMat,
        opexParams: { costoCamionMesMxn, costoVisitaMxn, costoContingenciaTonMxn },
      }),
    [zmActiva, municipioLabel, municipioId, claveInegi, capCamionTon, mixCAs, resultados, rechazoPorMat, costoCamionMesMxn, costoVisitaMxn, costoContingenciaTonMxn],
  )

  const opexLogistica = useMemo(
    () =>
      computeOpexLogisticaAnual(logisticsContract, {
        costoCamionMesMxn,
        costoVisitaMxn,
        costoContingenciaTonMxn,
      }),
    [logisticsContract, costoCamionMesMxn, costoVisitaMxn, costoContingenciaTonMxn],
  )

  const capexTotal = useMemo(
    () =>
      (mixCAs.P * CAPEX_CA.P.totalCAPEX) +
      (mixCAs.M * CAPEX_CA.M.totalCAPEX) +
      (mixCAs.G * CAPEX_CA.G.totalCAPEX),
    [mixCAs],
  )

  const opexMesTotal = useMemo(
    () =>
      (mixCAs.P * OPEX_CA.P.totalOPEXMes) +
      (mixCAs.M * OPEX_CA.M.totalOPEXMes) +
      (mixCAs.G * OPEX_CA.G.totalOPEXMes),
    [mixCAs],
  )

  const empleosTotal = useMemo(
    () =>
      (mixCAs.P * CA_CONFIG.P.empleos) +
      (mixCAs.M * CA_CONFIG.M.empleos) +
      (mixCAs.G * CA_CONFIG.G.empleos),
    [mixCAs],
  )

  const tir = resultados?.tir ?? null

  const opexMesTotalConLogistica = opexMesTotal + (opexLogistica?.opexLogisticaMensualMxn ?? 0)
  const opexAnualTotal = opexMesTotal * 12 + (opexLogistica?.opexLogisticaAnualMxn ?? 0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const financeKpi = buildFinanceKpiContract({
      municipioId,
      capexTotal,
      opexCentrosMensual: opexMesTotal,
      opexLogistica,
      tir,
      logistics: logisticsContract,
      hasM01,
      hasM06,
    })
    ;(window as unknown as { __ALQUIMIA_FINANCE_KPI__?: typeof financeKpi }).__ALQUIMIA_FINANCE_KPI__ =
      financeKpi
    if (logisticsContract) {
      ;(window as unknown as { __ALQUIMIA_LOGISTICS_KPI__?: typeof logisticsContract }).__ALQUIMIA_LOGISTICS_KPI__ =
        logisticsContract
    }
  }, [
    municipioId,
    capexTotal,
    opexMesTotal,
    opexLogistica,
    tir,
    logisticsContract,
    hasM01,
    hasM06,
  ])

  const gateAdvertencia =
    capexBloqueado
      ? 'CAPEX bloqueado — configure al menos un centro de acopio en M06 (Infraestructura) antes de usar costos en Cabildo.'
      : logisticsContract?.metadata?.advertencia_gate ?? null

  const kpis = [
    {
      icon: DollarSign,
      label: 'CAPEX TOTAL',
      value: capexBloqueado ? 'Bloqueado' : fmtMXN(capexTotal),
      sub: capexBloqueado ? 'Requiere M06' : `${mixCAs.P}P + ${mixCAs.M}M + ${mixCAs.G}G centros`,
      color: capexBloqueado ? '#C0392B' : '#2F6B1F',
    },
    {
      icon: Clock,
      label: 'OPEX MENSUAL',
      value: fmtMXN(opexMesTotalConLogistica),
      sub: opexLogistica
        ? `Centros ${fmtMXN(opexMesTotal)} + logística ${fmtMXN(opexLogistica.opexLogisticaMensualMxn)}`
        : `${fmtMXN(opexMesTotal * 12)}/año (solo centros)`,
      color: '#D98A1E',
    },
    {
      icon: Truck,
      label: 'OPEX LOGÍSTICO/AÑO',
      value: opexLogistica ? fmtMXN(opexLogistica.opexLogisticaAnualMxn) : '—',
      sub: logisticsContract
        ? `${logisticsContract.kpis_logisticos.total_camiones_requeridos} camiones · ESTIMADO_FASE_01`
        : 'Complete M01 + M08',
      color: '#4A1C7A',
    },
    {
      icon: Users,
      label: 'EMPLEOS DIRECTOS',
      value: String(empleosTotal),
      sub: 'Solo centros de acopio',
      color: '#1A5FA8',
    },
    {
      icon: TrendingUp,
      label: 'TIR PROYECTO',
      value: tir !== null ? `${fmtN(tir)}%` : '—',
      sub: tir !== null && tir > 20 ? 'Viable' : 'Ver M10 Escenarios',
      color: tir !== null && tir > 20 ? '#2F6B1F' : '#8A9286',
    },
  ]

  return (
    <div className="space-y-6">

      {gateAdvertencia && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
          {gateAdvertencia}
        </div>
      )}

      {!logisticsContract && hasM01 && (
        <div className="rounded-[10px] border border-[#E7E5DC] bg-[#FAFAF8] px-4 py-3 text-[12px] text-[#5F6B5F]">
          OPEX logístico pendiente — visite M08 Logística después de configurar M06 para dimensionar flota.
        </div>
      )}

      {/* S1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map(kpi => (
          <div
            key={kpi.label}
            className="bg-white border border-[#E7E5DC] rounded-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.03)] px-4 py-3 h-[88px] flex flex-col justify-center"
          >
            <div className="flex items-center gap-1.5">
              <kpi.icon size={12} style={{ color: kpi.color }} />
              <span className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#8A9286]">
                {kpi.label}
              </span>
            </div>
            <p className="text-[26px] font-semibold text-[#1F2933] leading-tight mt-1">
              {kpi.value}
            </p>
            <p className="text-[11px] text-[#5F6B5F]">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* S2: Lectura ejecutiva */}
      <div className="bg-[#F1F8EC] border border-[#C9DDB1] rounded-[14px] px-5 py-4">
        <p className="text-[14px] leading-relaxed text-[#1F2933]">
          {capexBloqueado ? (
            <>
              <strong>CAPEX no disponible</strong> — el mix de centros de acopio está en cero.
              Complete M06 (Infraestructura) para dimensionar inversión inicial antes de Cabildo.
            </>
          ) : (
            <>
              El programa requiere una inversión inicial de <strong>{fmtMXN(capexTotal)}</strong> y
              un costo operativo de <strong>{fmtMXN(opexMesTotalConLogistica)}/mes</strong>
              {opexLogistica ? (
                <> (centros + logística estimada desde M08)</>
              ) : (
                <> para operar centros de acopio</>
              )}{' '}
              — {totalCAs} centro{totalCAs !== 1 ? 's' : ''} de acopio,{' '}
              <strong>{empleosTotal} empleos directos</strong>.
              {opexAnualTotal > 0 && (
                <> OPEX anual total estimado: <strong>{fmtMXN(opexAnualTotal)}</strong>.</>
              )}
              {tir !== null && tir > 0
                ? ` La TIR proyectada de ${fmtN(tir)}% indica que el programa se recupera solo.`
                : ''}
              {' '}Los precios de equipamiento están verificados contra mercado mexicano (mayo 2026).
              Esta información permite al tesorero municipal evaluar la viabilidad presupuestal antes
              de sesión de cabildo.
            </>
          )}
        </p>
      </div>

      {opexLogistica && logisticsContract && (
        <div className="bg-white border border-[#E7E5DC] rounded-[14px] p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-serif text-[18px] font-semibold text-[#1F2933]">
              OPEX logístico (HERMES → KRONOS)
            </h3>
            <ProvenanceBadge
              tipo="estimado"
              confianza={opexLogistica.confianzaAplicada}
              fuente={opexLogistica.fuente}
              advertencia={opexLogistica.advertencia}
            />
          </div>
          {opexLogistica.advertencia && (
            <p className="text-[11px] text-amber-800">{opexLogistica.advertencia}</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
            <label className="block">
              <span className="text-[#6B6760]">Costo camión/mes (MXN)</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-[#E7E5DC] px-2 py-1"
                value={costoCamionMesMxn}
                onChange={e => setCostoCamionMesMxn(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-[#6B6760]">Costo visita (MXN)</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-[#E7E5DC] px-2 py-1"
                value={costoVisitaMxn}
                onChange={e => setCostoVisitaMxn(Number(e.target.value))}
              />
            </label>
            <label className="block">
              <span className="text-[#6B6760]">Contingencia (MXN/ton)</span>
              <input
                type="number"
                className="mt-1 w-full rounded border border-[#E7E5DC] px-2 py-1"
                value={costoContingenciaTonMxn}
                onChange={e => setCostoContingenciaTonMxn(Number(e.target.value))}
              />
            </label>
          </div>
          <table className="w-full text-left text-[12px]">
            <tbody>
              <tr className="border-b border-[#EDE9E3]">
                <td className="py-2 text-[#5F6B5F]">Flota ({logisticsContract.kpis_logisticos.total_camiones_requeridos} camiones)</td>
                <td className="py-2 text-right font-mono">{fmtMXN(opexLogistica.opexFlotaAnualMxn)}/año</td>
              </tr>
              <tr className="border-b border-[#EDE9E3]">
                <td className="py-2 text-[#5F6B5F]">Visitas ({logisticsContract.kpis_logisticos.visitas_mes_estimadas}/mes)</td>
                <td className="py-2 text-right font-mono">{fmtMXN(opexLogistica.opexVisitasAnualMxn)}/año</td>
              </tr>
              <tr className="border-b border-[#EDE9E3]">
                <td className="py-2 text-[#5F6B5F]">Contingencia (brecha {logisticsContract.kpis_logisticos.brecha_ton_dia.toFixed(1)} t/día)</td>
                <td className="py-2 text-right font-mono">{fmtMXN(opexLogistica.opexContingenciaAnualMxn)}/año</td>
              </tr>
              <tr>
                <td className="py-2 font-semibold text-[#1F2933]">Total OPEX logístico</td>
                <td className="py-2 text-right font-mono font-semibold">{fmtMXN(opexLogistica.opexLogisticaAnualMxn)}/año</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* S3: Gráfica protagonista — CAPEX por fase */}
      <ExpandableChart title="Inversión por fase" subtitle="CAPEX acumulado (M MXN) · 6 fases de escala">
        <ResponsiveContainer width="100%" height={320}>
            <BarChart data={fasesData} margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#5F6B5F' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#5F6B5F' }}
                tickFormatter={v => `$${v}M`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(value: number, name: string) => {
                  if (name === 'capex') return [`$${value}M MXN`, 'CAPEX total']
                  if (name === 'empleos') return [value, 'Empleos directos']
                  return [`$${value}K/mes`, 'EBITDA']
                }}
                labelFormatter={(label: string) => {
                  const f = fasesData.find(d => d.name === label)
                  return f ? `${label} — ${f.label}` : label
                }}
                contentStyle={{
                  fontSize: 12,
                  border: '1px solid #E8E4DC',
                  borderRadius: 8,
                  background: '#FDFCFA',
                }}
              />
              <Bar dataKey="capex" fill="#2F6B1F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ExpandableChart>

      <div className="mt-4 overflow-x-auto rounded-[14px] border border-[#E7E5DC] bg-white p-5">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F7F2]">
                <th className="px-3 py-2 text-[12px] font-semibold text-[#1F2933] rounded-tl-[8px]">Fase</th>
                <th className="px-3 py-2 text-[12px] font-semibold text-[#1F2933]">Mix CAs</th>
                <th className="px-3 py-2 text-[12px] font-semibold text-[#1F2933] text-right">CAPEX</th>
                <th className="px-3 py-2 text-[12px] font-semibold text-[#1F2933] text-right">t/día</th>
                <th className="px-3 py-2 text-[12px] font-semibold text-[#1F2933] text-right">Empleos</th>
                <th className="px-3 py-2 text-[12px] font-semibold text-[#1F2933] text-right rounded-tr-[8px]">EBITDA/mes</th>
              </tr>
            </thead>
            <tbody>
              {FASES_INVERSION.map((f, i) => (
                <tr
                  key={f.fase}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}
                >
                  <td className="px-3 py-2 text-[13px] text-[#1F2933] font-medium">
                    F{f.fase} {f.nombre}
                  </td>
                  <td className="px-3 py-2 text-[13px] text-[#5F6B5F] font-mono">{f.mixCAs}</td>
                  <td className="px-3 py-2 text-[13px] text-[#1F2933] text-right font-mono">
                    {fmtMXN(f.capexTotalSistema)}
                  </td>
                  <td className="px-3 py-2 text-[13px] text-[#1F2933] text-right">
                    {f.capTonDia}
                  </td>
                  <td className="px-3 py-2 text-[13px] text-[#1F2933] text-right">
                    {f.empleosTotales}
                  </td>
                  <td className="px-3 py-2 text-[13px] text-[#1F2933] text-right font-mono">
                    {fmtMXN(f.ebitdaMesSistema)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-[11px] text-[#8A9286]">
            Fuente: Centros_Acopio_v2.xlsx (modelo CFO ALQUIMIA). Precios verificados mayo 2026.
          </p>
      </div>

      {/* S4: Desglose detallado — CapexOpexBreakdown (componente existente con tabs P/M/G) */}
      {capexBloqueado ? (
        <div className="rounded-[14px] border border-red-200 bg-red-50 px-5 py-4 text-[13px] text-red-900">
          Desglose CAPEX/OPEX bloqueado hasta configurar centros de acopio en M06.
        </div>
      ) : (
        <CapexOpexBreakdown />
      )}

    </div>
  )
}
