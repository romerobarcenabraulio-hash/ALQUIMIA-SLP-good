'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ['Diseño de Piloto', 'Rutas Calculadas', 'Operación PER', 'Cuellos de Botella']

const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const CRITERIOS = [
  { id: 'densidad',      label: 'Densidad habitacional (hogares/km²)',                 peso: 25 },
  { id: 'accesibilidad', label: 'Accesibilidad vial (ancho calle ≥ 4 m)',              peso: 20 },
  { id: 'actor',         label: 'Actor aliado presente (admin condo/líder colonia)',   peso: 25 },
  { id: 'composicion',   label: 'Composición RSU conocida (antecedente muestreo)',     peso: 15 },
  { id: 'politico',      label: 'Apoyo político (riesgo bajo de veto)',                peso: 15 },
]

// Estacionalidad mensual relativa (índice multiplicador sobre base)
const ESTACIONALIDAD_FACTORES = [
  1.15, 1.10, 0.92, 0.92, 1.00, 1.00, 1.15, 1.00, 1.00, 1.00, 1.00, 1.15,
]

// ── Component ─────────────────────────────────────────────────────────────────

export function LogisticaOperativaStack() {
  const { zmActiva, municipiosActivos, resultados } = useSimulatorStore()

  const [tab, setTab] = useState(1)
  const [scores, setScores] = useState<Record<string, number>>({
    densidad: 3, accesibilidad: 3, actor: 3, composicion: 3, politico: 3,
  })
  const [hogaresEnPiloto, setHogaresEnPiloto] = useState(1000)

  const municipio = municipiosActivos[0] ?? zmActiva

  // Weighted score
  const puntajeTotal = CRITERIOS.reduce(
    (acc, c) => acc + (scores[c.id] ?? 3) * c.peso / 100,
    0,
  )

  // Route calculations
  const nZonas = Math.ceil(hogaresEnPiloto / 400)
  const hogaresPerZona = Math.round(hogaresEnPiloto / nZonas)
  const kmPorRuta = +(hogaresPerZona * 0.15).toFixed(1)

  // Seasonal bottleneck data
  const rsuBase = resultados?.rsuTotalTonDia ?? 0
  const seasonalData = MESES_ABREV.map((mes, i) => {
    const factor = ESTACIONALIDAD_FACTORES[i] ?? 1
    const vol = Math.round(rsuBase * factor * 30)
    return { mes, vol, base: Math.round(rsuBase * 30) }
  })

  // Fleet capacity proxy (camiones × 12 t × 30 días)
  const camionesTotal = resultados?.camionesRequeridos
    ? Object.values(resultados.camionesRequeridos).reduce((a, b) => a + b, 0)
    : nZonas
  const fleetCapMes = camionesTotal * 12 * 30
  const hasPeakAlert = fleetCapMes > 0 && seasonalData.some(d => d.vol > fleetCapMes * 0.85)

  return (
    <div className="pb-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        {TABS.map((label, i) => {
          const p = i + 1
          return (
            <button key={p} type="button" onClick={() => setTab(p)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-[8px] text-[11px] font-semibold border transition-colors',
                tab === p
                  ? 'bg-[#1C2B15] text-white border-[#1C2B15]'
                  : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]',
              )}>
              <span className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold',
                tab === p ? 'bg-[#3B6D11]' : 'bg-[#E8E4DC] text-[#6B6760]',
              )}>{p}</span>
              <span className="hidden sm:block">{label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Tab 1: Diseño de Piloto ─────────────────────────────────────────── */}
      {tab === 1 && (
        <div className="space-y-5">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="font-serif text-[14px] font-semibold text-[#1C1B18]">Matriz de selección de zona piloto</p>
              <p className="text-[10px] text-[#A8A49C] mt-0.5">5 criterios ponderados · escala 1–5 · referencia GIZ/PSR 2012</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    {['Criterio', 'Peso', 'Calificación (1–5)', 'Puntaje'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-bold text-[#1C1B18] text-[10px] uppercase tracking-[0.06em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CRITERIOS.map((c, i) => {
                    const s = scores[c.id] ?? 3
                    const puntaje = (s * c.peso / 100).toFixed(2)
                    return (
                      <tr key={c.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                        <td className="px-4 py-2.5 text-[#1C1B18] font-medium">{c.label}</td>
                        <td className="px-4 py-2.5 font-mono text-[#D4881E] font-semibold">{c.peso}%</td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <input type="range" min={1} max={5} step={1} value={s}
                              onChange={e => setScores(prev => ({ ...prev, [c.id]: Number(e.target.value) }))}
                              className="w-28 accent-green-700" />
                            <span className="font-mono font-bold text-[#3B6D11] text-[12px]">{s}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 font-mono font-semibold text-[#1C1B18]">{puntaje}</td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[#1C2B15]">
                    <td colSpan={3} className="px-4 py-2.5 font-bold text-white text-[11px]">Puntaje total ponderado</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-white text-[14px]">{puntajeTotal.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* NarrativeBridge */}
          <div className={cn(
            'rounded-[10px] border px-5 py-4',
            puntajeTotal >= 3.5 ? 'border-[#C9DDB1] bg-[#EAF3DE]' : 'border-[#FDE68A] bg-[#FEF7E7]',
          )}>
            <p className="text-[12px] font-semibold mb-1" style={{ color: puntajeTotal >= 3.5 ? '#2D5A0D' : '#92400E' }}>
              {puntajeTotal >= 3.5 ? '✓ Zona apta para piloto' : '⚠ Zona con restricciones'}
            </p>
            <p className="text-[11px]" style={{ color: puntajeTotal >= 3.5 ? '#3B6D11' : '#D4881E' }}>
              {puntajeTotal >= 3.5
                ? 'Arranque recomendado: 500–2,000 hogares (referencia GIZ/PSR 2012).'
                : 'Resolver criterios críticos antes del arranque.'}
            </p>
          </div>

          {/* Hogares slider */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4 shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Tamaño del piloto</p>
            <div className="flex items-center gap-4 flex-wrap">
              <label className="text-[10px] text-[#6B6760]">Hogares en piloto</label>
              <input type="range" min={500} max={2000} step={100} value={hogaresEnPiloto}
                onChange={e => setHogaresEnPiloto(Number(e.target.value))}
                className="w-40 accent-green-700" />
              <span className="font-mono font-bold text-[#3B6D11] text-[14px]">{hogaresEnPiloto.toLocaleString('es-MX')}</span>
            </div>
            <p className="text-[9px] text-[#A8A49C] mt-2 uppercase tracking-[0.06em]">
              Rango 500–2,000 · medibilidad garantizada en 90 días (GIZ/PSR 2012)
            </p>
          </div>
        </div>
      )}

      {/* ── Tab 2: Rutas Calculadas ─────────────────────────────────────────── */}
      {tab === 2 && (
        <div className="space-y-5">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="font-serif text-[14px] font-semibold text-[#1C1B18]">Rutas calculadas — zona piloto</p>
              <p className="text-[10px] text-[#A8A49C] mt-0.5">
                {hogaresEnPiloto.toLocaleString('es-MX')} hogares · 400 hogares/ruta · ventana 06:00–10:00 · {municipio}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    {['Zona', 'Material', 'Frecuencia', 'Ventana', 'Hogares/zona', 'Km est./ruta'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase tracking-[0.06em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: nZonas }, (_, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-3 py-2.5 font-semibold text-[#1C1B18]">Zona {i + 1}</td>
                      <td className="px-3 py-2.5 text-[#6B6760]">Orgánicos + Valorizable</td>
                      <td className="px-3 py-2.5">
                        <span className="text-[#3B6D11] font-semibold">Org. 3×/sem</span>
                        <span className="text-[#A8A49C]"> · </span>
                        <span className="text-[#1A5FA8] font-semibold">Val. 2×/sem</span>
                      </td>
                      <td className="px-3 py-2.5 text-[#6B6760]">06:00–10:00</td>
                      <td className="px-3 py-2.5 font-mono">{hogaresPerZona}</td>
                      <td className="px-3 py-2.5 font-mono">{kmPorRuta} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-[#F0EDE5] bg-[#FAFAF8]">
              <div className="flex flex-wrap gap-5 text-[10px]">
                <span className="text-[#6B6760]">Zonas: <strong className="text-[#1C1B18]">{nZonas}</strong></span>
                <span className="text-[#6B6760]">Km/ruta: <strong className="text-[#1C1B18]">{kmPorRuta}</strong></span>
                <span className="text-[#6B6760]">Camiones est.: <strong className="text-[#1C1B18]">{camionesTotal}</strong></span>
                <span className="text-[#6B6760]">Fuente frecuencias: <strong className="text-[#1C1B18]">SEMARNAT Guía 2021</strong></span>
              </div>
            </div>
          </div>
          <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-4">
            <p className="text-[10px] font-semibold text-[#1C1B18] mb-1">Nota metodológica</p>
            <p className="text-[10px] text-[#6B6760]">
              Para optimización VRP real (Google OR-Tools / ArcGIS), este módulo genera los inputs estructurados que
              un especialista SIG puede usar. Factor de 0.15 km/hogar promedio urbano México.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab 3: Operación PER ────────────────────────────────────────────── */}
      {tab === 3 && (
        <div className="space-y-5">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="font-serif text-[14px] font-semibold text-[#1C1B18]">Calendario semanal de operación PER</p>
              <p className="text-[10px] text-[#A8A49C] mt-0.5">Presión · Estado · Respuesta — {municipio}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    {['Día', 'Turno mañana', 'Material recolectado', 'Protocolo inicio de semana'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase tracking-[0.06em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { dia: 'Lunes',     mat: 'Orgánicos',   proto: 'Verificación de unidades + registro bitácora inicial' },
                    { dia: 'Martes',    mat: 'Valorizable',  proto: '—' },
                    { dia: 'Miércoles', mat: 'Orgánicos',   proto: '—' },
                    { dia: 'Jueves',    mat: 'Valorizable',  proto: '—' },
                    { dia: 'Viernes',   mat: 'Orgánicos',   proto: 'Cierre semanal · revisión bitácora + reporte incidencias' },
                  ].map(({ dia, mat, proto }, i) => (
                    <tr key={dia} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                      <td className="px-4 py-2.5 font-semibold text-[#1C1B18]">{dia}</td>
                      <td className="px-4 py-2.5 text-[#6B6760]">Recolección diferenciada (ruta asignada)</td>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[9px] font-semibold',
                          mat === 'Orgánicos' ? 'bg-[#EAF3DE] text-[#2D5A0D]' : 'bg-[#EBF3FB] text-[#1A5FA8]',
                        )}>{mat}</span>
                      </td>
                      <td className="px-4 py-2.5 text-[#6B6760] text-[9px]">{proto}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-[10px] border border-[#C9DDB1] bg-[#EAF3DE] px-5 py-4">
            <p className="text-[10px] text-[#3B5F23]">
              Las colonias específicas se configuran en el sistema de gestión municipal.
              Este calendario aplica la estructura PER (Presión–Estado–Respuesta) del programa piloto
              de separación en origen — {municipio}.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab 4: Cuellos de Botella ───────────────────────────────────────── */}
      {tab === 4 && (
        <div className="space-y-5">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5 shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <p className="font-serif text-[14px] font-semibold text-[#1C1B18] mb-1">Estacionalidad de la demanda — RSU mensual (t)</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">
              Picos: Dic/Ene/Jul +15% · Bajos: Mar/Abr −8% · Base: {fmt.kgd(rsuBase)}
            </p>
            {rsuBase > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={seasonalData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F0EDE5" />
                  <XAxis dataKey="mes" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }}
                    formatter={(v: number) => [`${v.toLocaleString('es-MX')} t`, 'Vol. mensual']}
                  />
                  <Bar dataKey="vol" name="Vol. mensual (t)" radius={[3, 3, 0, 0]}>
                    {seasonalData.map((d, idx) => (
                      <Cell key={idx} fill={d.vol > d.base * 1.1 ? '#D4881E' : '#3B6D11'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-[10px] text-[#A8A49C]">
                Sin datos de cálculo activo — configure el escenario en el módulo principal.
              </div>
            )}
            <p className="text-[9px] text-[#A8A49C] mt-2 uppercase tracking-[0.06em]">
              Barras ámbar = meses con demanda &gt;10% sobre la base mensual
            </p>
          </div>

          {hasPeakAlert && (
            <div className="rounded-[10px] border border-[#FDE68A] bg-[#FEF7E7] px-5 py-4">
              <p className="text-[11px] font-semibold text-[#92400E] mb-1">
                ⚠ Demanda pico supera el 85% de la capacidad de flota estimada
              </p>
              <p className="text-[10px] text-[#D4881E]">
                Considerar: camiones adicionales · reducción de frecuencia · priorización de rutas críticas.
              </p>
            </div>
          )}

          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-4 shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Plan de contingencia</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  titulo: 'Camiones adicionales',
                  desc: 'Contrato de reserva con proveedor externo para meses pico (Dic/Ene/Jul).',
                  color: '#1A5FA8', bg: '#EBF3FB', border: '#BDD7F5',
                },
                {
                  titulo: 'Frecuencia reducida',
                  desc: 'Ajuste temporal a 2×/sem en rutas de menor prioridad durante picos estacionales.',
                  color: '#D4881E', bg: '#FEF7E7', border: '#FDE68A',
                },
                {
                  titulo: 'Priorización de rutas',
                  desc: 'Orgánicos mantienen frecuencia; valorizable puede diferirse hasta 1 día sin pérdida de calidad.',
                  color: '#3B6D11', bg: '#EAF3DE', border: '#C9DDB1',
                },
              ].map(item => (
                <div key={item.titulo} className="rounded-[10px] border px-4 py-3 text-[10px]"
                  style={{ borderColor: item.border, background: item.bg }}>
                  <p className="font-semibold mb-1" style={{ color: item.color }}>{item.titulo}</p>
                  <p className="text-[#6B6760] text-[9px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
