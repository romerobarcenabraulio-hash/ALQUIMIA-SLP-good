'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, Line, Legend,
} from 'recharts'
import {
  AlertTriangle, Truck, Clock, TrendingUp, ChevronDown, MapPin,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { ESTACIONALIDAD } from '@/lib/constants'
import { ExpandableChart } from '@/components/ui/ExpandableChart'

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const TRUCKS_BY_MATERIAL = [
  { material: 'Materia orgánica', volDia: 188.7, camiones: 9, frecuencia: 'Diaria', riesgo: 'Alto', obs: 'Perecible — no retrasar recolección' },
  { material: 'Papel / cartón', volDia: 60.5, camiones: 3, frecuencia: '3×/sem', riesgo: 'Medio', obs: 'Compactar para reducir viajes' },
  { material: 'Plásticos', volDia: 67.9, camiones: 3, frecuencia: '3×/sem', riesgo: 'Alto', obs: 'Alta densidad variable; revisar carga' },
  { material: 'Vidrio', volDia: 19.8, camiones: 1, frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Pesado — camión de bajo perfil' },
  { material: 'Metales', volDia: 6.7, camiones: 1, frecuencia: '1×/sem', riesgo: 'Bajo', obs: 'Alto valor por peso; prioritario' },
  { material: 'Otros', volDia: 36.1, camiones: 1, frecuencia: '2×/sem', riesgo: 'Bajo', obs: 'Consolidar con ruta de residuos mixtos' },
]

const BOTTLENECKS_LOG = [
  { zona: 'Zona sur con saturación', gravedad: 'Alto', causa: 'Carga superior a capacidad instalada', impacto: 'Retrasos y desbordamiento', accion: 'Desviar rutas al CA mediano de zona norte temporalmente' },
  { zona: 'Ruta de orgánicos incompleta', gravedad: 'Medio', causa: 'Pérdida de material orgánico fresco', impacto: 'Pérdida de valor compostal', accion: 'Completar ruta en colonias pendientes de cobertura' },
  { zona: 'Ventana de descarga insuficiente', gravedad: 'Medio', causa: 'Tiempo de descarga > ventana operativa', impacto: 'Tiempos muertos y filas', accion: 'Ampliar horario del CA principal a 6:00 am' },
]

function generatePERRoutes(municipioPrefix: string) {
  return [
    {
      id: `${municipioPrefix}-Z1`, material: 'Orgánicos', presion: 'Saturación en zona sur. Carga 110% de capacidad.',
      estado: 'Programada. Unidad RSU-01. Lun-Mié-Vie 07:00.',
      respuesta: 'Ajuste en frecuencia. Agregar 1 recorrido. Revisar bitácora semanal.',
      bitacora: 'Últimas visitas recientes', estado_chip: 'alerta' as const,
    },
    {
      id: `${municipioPrefix}-Z2`, material: 'Reciclables', presion: 'Ruta incompleta; 2 colonias fuera de cobertura.',
      estado: 'En operación. Unidad RSU-04. Mar-Jue 08:00.',
      respuesta: 'Monitoreo de precio. Monitoreo calidad de separación.',
      bitacora: 'Últimas visitas recientes', estado_chip: 'info' as const,
    },
  ]
}

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
  const { zmActiva, resultados } = useSimulatorStore()

  const rsuDia = resultados?.rsuTotalTonDia ?? 379.3
  const capInstalada = rsuDia * 0.61

  const perRoutes = useMemo(() => generatePERRoutes(zmActiva.slice(0, 3).toUpperCase()), [zmActiva])

  const seasonData = MESES.map((m, i) => {
    const base = rsuDia * 30
    const factor = 1 + (ESTACIONALIDAD[i] ?? 0)
    return { mes: m, rsu: Math.round(base * factor), cap: Math.round(rsuDia * 30 * 0.61) }
  })

  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div className="space-y-5">

          {/* Logistics KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: 'Camiones requeridos', value: '18', sub: 'para el horizonte', icon: Truck, color: '#1A5FA8' },
              { label: 'Visitas mensuales', value: '13.0', sub: 'por ruta piloto', icon: Clock, color: '#3B6D11' },
              { label: 'Merma logística', value: '18%', sub: 'del vol. movilizado', icon: AlertTriangle, color: '#C0392B' },
              { label: 'Presión operativa', value: 'Media-alta', sub: 'en cond. actuales', icon: TrendingUp, color: '#D4881E' },
            ].map(c => (
              <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
                <div className="flex items-center gap-1.5 mb-1"><c.icon className="w-3.5 h-3.5 shrink-0" style={{ color: c.color }} /><p className="text-[9px] uppercase text-[#A8A49C]">{c.label}</p></div>
                <p className="text-[20px] font-bold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-[9px] text-[#A8A49C]">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Map placeholder */}
          <ExpandableChart chartId="m08-routes" title="Mapa de rutas y cobertura operativa" subtitle="Rutas orgánicas · reciclables · mixtas · zonas cubiertas">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0EDE5]">
                <p className="text-[12px] font-semibold text-[#1C1B18]">Mapa de rutas y cobertura operativa</p>
                <p className="text-[10px] text-[#A8A49C]">Rutas activas · colonias cubiertas · brechas críticas</p>
              </div>
              <div className="p-4">
                <div className="h-48 rounded-[10px] bg-gradient-to-br from-[#EBF3FB] to-[#DBEAFE] border border-[#BDD7F5] relative overflow-hidden">
                  {[['22%', '30%', '75%', '50%', '#3B6D11', 'Orgánica'], ['35%', '60%', '80%', '30%', '#1A5FA8', 'Reciclable'], ['50%', '20%', '70%', '70%', '#D4881E', 'Mixta']].map(([x1, y1, x2, y2, c, n]) => (
                    <svg key={n} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }}>
                      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c as string} strokeWidth="2" strokeDasharray="6,3" />
                    </svg>
                  ))}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur rounded-[8px] border border-[#BDD7F5] p-3 text-center shadow">
                      <MapPin className="w-5 h-5 text-[#1A5FA8] mx-auto mb-1" />
                      <p className="text-[11px] font-semibold text-[#1A5FA8]">Municipio</p>
                      <p className="text-[11px] text-[#6B6760]">Rutas disponibles tras configurar centros de acopio en M06.</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-3 text-[10px]">
                  {[['12', 'Rutas activas'], ['3× sem', 'Frecuencia semanal'], ['80 rec.', 'Colonias cubiertas'], ['4', 'Brechas críticas']].map(([v, l]) => (
                    <div key={l} className="rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-1.5">
                      <p className="font-bold text-[#1C1B18]">{v}</p>
                      <p className="text-[10px] text-[#A8A49C]">{l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ExpandableChart>

          {/* Trucks table */}
          <ExpandableChart chartId="m08-trucks" title="Camiones requeridos por material" subtitle="Volumen · unidades · frecuencia · riesgo logístico">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F0EDE5]">
                <p className="text-[12px] font-semibold text-[#1C1B18]">Camiones requeridos por material</p>
                <p className="text-[10px] text-[#A8A49C]">Vol. t/día · unidades · frecuencia · riesgo · observación</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                      {['Material', 'Vol. t/día', 'Camiones', 'Frecuencia', 'Riesgo logístico', 'Observación'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[9px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TRUCKS_BY_MATERIAL.map((t, i) => {
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
              </div>
            </div>
          </ExpandableChart>

          {/* Seasonality chart */}
          <ExpandableChart chartId="m08-seasonality" title="Estacionalidad y capacidad de servicio" subtitle="RSU mensual esperado vs. capacidad instalada (t/mes)">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
              <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Estacionalidad y capacidad de servicio</p>
              <p className="text-[10px] text-[#A8A49C] mb-4">Mayo y diciembre presentan picos — la capacidad instalada no cubre la demanda en esos meses</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={seasonData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }}
                    formatter={(v: number, n: string) => [`${v.toLocaleString()} t`, n === 'rsu' ? 'RSU mensual' : 'Cap. instalada']} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="rsu" name="RSU mensual (t)" fill="#1A5FA8" radius={[3, 3, 0, 0]}>
                    {seasonData.map((d, i) => (
                      <Cell key={i} fill={d.rsu > d.cap ? '#C0392B' : '#1A5FA8'} />
                    ))}
                  </Bar>
                  <Line type="monotone" dataKey="cap" name="Cap. instalada" stroke="#3B6D11" strokeWidth={2} dot={false} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-[9px] text-[#A8A49C] mt-2">Barras rojas = meses donde la demanda supera capacidad instalada</p>
            </div>
          </ExpandableChart>

          {/* PER routes */}
          <div className="space-y-3">
            <p className="text-[12px] font-semibold text-[#1C1B18]">PER — Presión, estado y respuesta por ruta crítica</p>
            {perRoutes.map(r => (
              <div key={r.id} className={cn('rounded-[10px] border p-4', r.estado_chip === 'alerta' ? 'border-[#FCA5A5] bg-[#FFF5F5]' : 'border-[#BDD7F5] bg-[#EBF3FB]')}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-mono text-[10px] font-bold bg-[#1C2B15] text-white px-2 py-0.5 rounded">{r.id}</span>
                  <span className="text-[11px] font-semibold text-[#1C1B18]">{r.material}</span>
                  {r.estado_chip === 'alerta' && <AlertTriangle className="w-3.5 h-3.5 text-[#C0392B] ml-auto" />}
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

          {/* Bottlenecks */}
          <div className="space-y-2.5">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Cuellos de botella detectados</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {BOTTLENECKS_LOG.map(b => {
                const gColor = b.gravedad === 'Alto' ? 'border-[#FCA5A5] bg-[#FFF5F5]' : 'border-[#FDE68A] bg-[#FEF7E7]'
                const tColor = b.gravedad === 'Alto' ? 'text-[#C0392B]' : 'text-[#D4881E]'
                return (
                  <div key={b.zona} className={cn('rounded-[10px] border p-4', gColor)}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-[11px] font-semibold text-[#1C1B18] leading-snug">{b.zona}</p>
                      <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0', b.gravedad === 'Alto' ? 'bg-[#FDE8E8] text-[#B91C1C]' : 'bg-[#FEF3C7] text-[#92400E]')}>{b.gravedad}</span>
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
          <div className="rounded-[10px] border border-[#BDD7F5] bg-[#EBF3FB] px-4 py-3 text-[11px] text-[#1A5FA8]">
            <span className="font-semibold">Ver también:</span> La sensibilidad del <strong>VPN</strong> ante cambios en variables operativas se analiza en M13 · Retorno Financiero → Análisis de riesgo.
          </div>
        </div>

        {/* Right rail */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Consideraciones</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">Confianza 35%</span>
          </div>
          <RailSection title="Cómo se calcula" open>
            <p>Camiones basados en 12 t/camión/día. Factores de estacionalidad del modelo de generación. PER basado en bitácoras operativas del piloto.</p>
          </RailSection>
          <RailSection title="Decisión que habilita">
            <p>Dimensionar la flota y aprobar las rutas piloto antes de la primera fase de operación.</p>
          </RailSection>
          <RailSection title="Metodología">
            <p>Análisis logístico con supuesto de 12 t/camión/día. Estacionalidad del modelo de generación RSU (M01). PER con bitácoras operativas del piloto.</p>
          </RailSection>
          <RailSection title="Módulos relacionados">
            <p>M06: Infraestructura que estas rutas sirven. M07: Personal que opera las rutas. M11: Mercado que recibe el material.</p>
          </RailSection>
          <RailSection title="Qué verificar aún">
            <ul className="space-y-1">
              {['Topografía y restricciones de acceso en zonas específicas.', 'Capacidad real de las unidades de recolección existentes.'].map(v => (
                <li key={v} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#D4881E] shrink-0" />{v}</li>
              ))}
            </ul>
          </RailSection>
        </div>
      </div>
    </div>
  )
}
