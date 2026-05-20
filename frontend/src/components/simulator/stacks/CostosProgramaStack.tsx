'use client'

import { useMemo } from 'react'
import { DollarSign, Users, Clock, TrendingUp } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CapexOpexBreakdown } from '@/components/simulator/CapexOpexBreakdown'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
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
  const totalCAs = mixCAs.P + mixCAs.M + mixCAs.G

  const kpis = [
    {
      icon: DollarSign,
      label: 'CAPEX TOTAL',
      value: fmtMXN(capexTotal),
      sub: `${mixCAs.P}P + ${mixCAs.M}M + ${mixCAs.G}G centros`,
      color: '#2F6B1F',
    },
    {
      icon: Clock,
      label: 'OPEX MENSUAL',
      value: fmtMXN(opexMesTotal),
      sub: `${fmtMXN(opexMesTotal * 12)}/año`,
      color: '#D98A1E',
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

      {/* S1: KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <p className="text-[11px] uppercase tracking-[0.06em] font-semibold text-[#2F6B1F] mb-1">
          LECTURA EJECUTIVA
        </p>
        <p className="text-[14px] leading-relaxed text-[#1F2933]">
          El programa requiere una inversión inicial de <strong>{fmtMXN(capexTotal)}</strong> y
          un costo operativo de <strong>{fmtMXN(opexMesTotal)}/mes</strong> para operar{' '}
          {totalCAs} centro{totalCAs !== 1 ? 's' : ''} de acopio que generarán{' '}
          <strong>{empleosTotal} empleos directos</strong>.
          {tir !== null && tir > 0
            ? ` La TIR proyectada de ${fmtN(tir)}% indica que el programa se recupera solo.`
            : ''}
          {' '}Los precios de equipamiento están verificados contra mercado mexicano (mayo 2026).
          Esta información permite al tesorero municipal evaluar la viabilidad presupuestal antes
          de sesión de cabildo.
        </p>
      </div>

      {/* S3: Gráfica protagonista — CAPEX por fase */}
      <div className="bg-white border border-[#E7E5DC] rounded-[14px] p-5">
        <h3 className="font-serif text-[20px] font-semibold text-[#1F2933] mb-1">
          Inversión por fase de despliegue
        </h3>
        <p className="text-[13px] text-[#5F6B5F] mb-4">
          CAPEX acumulado del sistema (CAs + recicladoras) en millones MXN — 6 fases de escala
        </p>
        <ExpandableChart title="CAPEX acumulado por fase de despliegue">
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

        {/* Tabla resumen de fases */}
        <div className="mt-4 overflow-x-auto">
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
      </div>

      {/* S4: Desglose detallado — CapexOpexBreakdown (componente existente con tabs P/M/G) */}
      <CapexOpexBreakdown />

    </div>
  )
}
