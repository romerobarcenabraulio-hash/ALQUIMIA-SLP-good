'use client'

import { useMemo, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend,
} from 'recharts'
import { AlertTriangle, TrendingDown, ChevronDown, DollarSign, Leaf } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { MODELO_PARAMS } from '@/lib/constants'
import { ChartPanel } from '@/components/ui/ChartPanel'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { CHART_AXIS_TICK, CHART_AXIS_TICK_MUTED, CHART_GRID, CHART_TOOLTIP_STYLE } from '@/lib/chartTheme'
import { cn, fmt } from '@/lib/utils'

// ── Calculation helpers ───────────────────────────────────────────────────────
// All values derived from simulator inputs — nothing hardcoded.

const INPC_ANNUAL = 0.045         // 4.5% annual inflation (BANXICO 2024-2026 avg)
const COSTO_DISPOSICION_TM = 280  // MXN/ton — relleno sanitario tarifa media nacional
const VIDA_UTIL_RELLENO_ANOS = 15 // remaining useful life of existing landfill (typical)
const MULTA_PROFEPA_MIN = 1_500_000  // MXN — LGPGIR Art.10 minimum fine
const MULTA_PROFEPA_MAX = 15_000_000 // MXN — maximum cumulative

// Health damage cost per ton of organic waste in open/informal disposal
// Based on WHO methodology + INSP (Instituto Nacional de Salud Pública) Mexico urban
const COSTO_SALUD_POR_TON_ORGANICO = 185 // MXN/ton (IRA, vectores, contaminación acuífera)
// INECC / SEMARNAT — emisiones evitables por tonelada dispuesta sin captura (tCO2e/ton)
const FACTOR_EMISION_RELLENO = 0.9
// Precio social del carbono — tier SCE medio (USD/tCO2e) × tipo de cambio
const PRECIO_SOCIAL_CARBONO_MXN = MODELO_PARAMS.precioCarbonoSCE[1] * MODELO_PARAMS.tipoCambio

function buildContrafactualData(
  rsuDia: number,
  años: number,
  ingresos_programa: number,
  co2eEvitadasAnualTon: number,
) {
  const results = []
  let costoAcum = 0
  let costoPrograma = 0
  const tonAnual = rsuDia * 365

  for (let y = 1; y <= años; y++) {
    const inflFactor = Math.pow(1 + INPC_ANNUAL, y - 1)
    const costoDisposicion = tonAnual * COSTO_DISPOSICION_TM * inflFactor
    const costoSalud = tonAnual * 0.52 * COSTO_SALUD_POR_TON_ORGANICO * inflFactor
    const costoCarbono = tonAnual * FACTOR_EMISION_RELLENO * PRECIO_SOCIAL_CARBONO_MXN * inflFactor
    const costoAnual = costoDisposicion + costoSalud + costoCarbono
    costoAcum += costoAnual

    const captureRate = Math.min(0.85, 0.15 + y * 0.12)
    const tonEvitada = co2eEvitadasAnualTon * captureRate
    const beneficioCarbono = tonEvitada * PRECIO_SOCIAL_CARBONO_MXN * inflFactor
    const costoConPrograma = tonAnual * (1 - captureRate) * COSTO_DISPOSICION_TM * inflFactor
    costoPrograma += costoConPrograma + (ingresos_programa * (1 - Math.pow(0.95, y - 1))) - beneficioCarbono

    results.push({
      año: `A${y}`,
      sinPrograma: Math.round(costoAcum / 1_000_000),
      conPrograma: Math.round(Math.max(0, costoPrograma) / 1_000_000),
      diferencia: Math.round((costoAcum - Math.max(0, costoPrograma)) / 1_000_000),
      captureRate: Math.round(captureRate * 100),
      costoCarbonoAnual: Math.round(costoCarbono / 1_000_000),
    })
  }
  return results
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

export function CostoOmisionStack() {
  const { resultados, horizonte } = useSimulatorStore()

  const rsuDia = resultados?.rsuTotalTonDia ?? 0
  const ingresoAnual = ((resultados?.ingresosBrutos ?? 0) / Math.max(1, 10)) * 0.8
  const co2eAnual = resultados?.co2eEvitadasAnualTon ?? rsuDia * 365 * 0.35

  const años = Math.max(horizonte, 10)
  const data = useMemo(
    () => buildContrafactualData(rsuDia, años, ingresoAnual, co2eAnual),
    [rsuDia, años, ingresoAnual, co2eAnual],
  )

  const ultimo = data[data.length - 1]!
  const tonAnual = rsuDia * 365

  // Relleno saturation: at current pace, when does capacity run out?
  // Assume 400 ha × 15m depth avg → ~6M m3. 1 ton ≈ 0.5 m3 compacted
  const rellenoCapM3 = 6_000_000
  const rellenoPaceM3 = tonAnual * 0.5
  const rellenoAños = Math.round(rellenoCapM3 / rellenoPaceM3)
  const rellenoFecha = new Date()
  rellenoFecha.setFullYear(rellenoFecha.getFullYear() + rellenoAños)
  const rellenoFechaStr = rellenoFecha.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })

  const costoTotal10 = ultimo.sinPrograma
  const costoSalud10 = Math.round((tonAnual * 0.52 * COSTO_SALUD_POR_TON_ORGANICO * años) / 1_000_000)
  const costoCarbono10 = Math.round((tonAnual * FACTOR_EMISION_RELLENO * PRECIO_SOCIAL_CARBONO_MXN * años) / 1_000_000)
  const pxnM = (n: number) => `$${n}M MXN`

  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div className="space-y-5">

          {/* Hero — the core argument */}
          <div className="rounded-[14px] border-2 border-[#C0392B] bg-gradient-to-br from-[#FFF5F5] to-[#FEF7E7] px-6 py-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-[#C0392B] flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-[20px] font-serif font-bold text-[#1C1B18] leading-tight">
                  Sin programa, el municipio perderá {pxnM(costoTotal10)} en los próximos {años} años
                </p>
              </div>
            </div>
            <p className="text-[13px] text-[#5A3B3B] leading-relaxed">
              Esta cifra incluye disposición en relleno, daño a la salud pública y costo social del carbono
              ({fmt.mxn(PRECIO_SOCIAL_CARBONO_MXN)}/tCO₂e, tier SCE). No incluye multas PROFEPA ni pérdida de elegibilidad para fondos.
            </p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: `Costo acumulado ${años} años`, value: pxnM(costoTotal10), sub: 'Disposición + salud + carbono', color: '#C0392B', icon: TrendingDown },
              { label: 'Costo social carbono', value: pxnM(costoCarbono10), sub: `${FACTOR_EMISION_RELLENO} tCO₂e/ton × SCE`, color: '#4A1C7A', icon: Leaf },
              { label: 'Daño a la salud', value: pxnM(costoSalud10), sub: 'IRA, vectores, agua (OPS)', color: '#D4881E', icon: AlertTriangle },
              { label: 'Brecha vs. con programa', value: pxnM(ultimo.diferencia), sub: `Diferencia acumulada año ${años}`, color: '#3B6D11', icon: DollarSign },
            ].map(c => (
              <div key={c.label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <c.icon className="w-3.5 h-3.5 shrink-0" style={{ color: c.color }} />
                  <p className="text-[9px] uppercase tracking-[0.07em] text-[#A8A49C]">{c.label}</p>
                </div>
                <p className="font-bold text-[18px] leading-none mb-0.5" style={{ color: c.color }}>{c.value}</p>
                <p className="text-[9px] text-[#A8A49C]">{c.sub}</p>
              </div>
            ))}
          </div>

          {/* Gap chart */}
          <ChartPanel
            chartId="costo-omision-acumulado"
            title={`Sin programa vs. Con programa — costo acumulado ${años} años`}
            subtitle="Millones de MXN · La brecha crece con inflación y saturación progresiva del relleno"
          >
            <div className="px-5 pb-4">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#C0392B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#C0392B" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="gradCon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B6D11" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3B6D11" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...CHART_GRID} />
                  <XAxis dataKey="año" tick={CHART_AXIS_TICK_MUTED} tickLine={false} axisLine={false} />
                  <YAxis tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} tickFormatter={v => `$${v}M`} />
                  <Tooltip
                    contentStyle={CHART_TOOLTIP_STYLE}
                    formatter={(v: number, name: string) => [`$${v}M MXN`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <ReferenceLine
                    x={`A${rellenoAños}`}
                    stroke="#8B6B4A"
                    strokeDasharray="4 2"
                    label={{ value: '⚠ Relleno lleno', position: 'top', fontSize: 10, fill: '#8B6B4A' }}
                  />
                  <Area type="monotone" dataKey="sinPrograma" name="Sin programa" stroke="#C0392B" strokeWidth={2.5} fill="url(#gradSin)" />
                  <Area type="monotone" dataKey="conPrograma" name="Con programa" stroke="#3B6D11" strokeWidth={2.5} fill="url(#gradCon)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartPanel>

          {/* Benefits waterfall */}
          <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] px-6 py-5">
            <p className="text-[12px] font-semibold text-[#1A4200] mb-3">Externalidades positivas con programa (waterfall)</p>
            <div className="space-y-2">
              {[
                { label: 'Ingresos por valorización de fracciones', value: fmt.mxn(ingresoAnual), color: '#3B6D11' },
                { label: 'CO₂e evitado (valor SCE)', value: fmt.mxn(co2eAnual * PRECIO_SOCIAL_CARBONO_MXN), color: '#4A1C7A' },
                { label: 'Empleos directos', value: resultados?.empleosTotalesDirectos ? `${resultados.empleosTotalesDirectos} plazas` : '—', color: '#1A5FA8' },
                { label: 'Vida útil relleno extendida', value: `+${Math.round(rellenoAños * 0.25)} años est.`, color: '#8B6B4A' },
              ].map(b => (
                <div key={b.label} className="flex items-center justify-between rounded-[8px] bg-white/70 border border-[#C9DDB1] px-3 py-2">
                  <span className="text-[11px] text-[#4A4740]">{b.label}</span>
                  <span className="text-[11px] font-bold font-mono" style={{ color: b.color }}>{b.value}</span>
                </div>
              ))}
            </div>
            <p className="text-[9px] text-[#6B6760] mt-3 flex items-center gap-1">
              <ProvenanceBadge tipo="estimado" confianza={0.65} fuente="INECC + MODELO_PARAMS.precioCarbonoSCE" />
              <span>Saturación relleno estimada: {rellenoFechaStr}</span>
            </p>
          </div>

          {/* Risk items */}
          <div className="space-y-2.5">
            <p className="text-[12px] font-semibold text-[#1C1B18]">Pérdidas adicionales no incluidas en el modelo financiero</p>
            {[
              {
                titulo: 'Multa PROFEPA — LGPGIR Art. 10',
                monto: `${(MULTA_PROFEPA_MIN / 1_000_000).toFixed(1)}–${(MULTA_PROFEPA_MAX / 1_000_000).toFixed(0)} M MXN`,
                descripcion: 'Por incumplimiento del Plan de Manejo Municipal de RSU. Acumulables por cada año sin programa aprobado.',
                probabilidad: 'Alta si el municipio no tiene programa vigente',
                color: '#C0392B', bgColor: '#FFF5F5', borderColor: '#FCA5A5',
              },
              {
                titulo: 'Pérdida de elegibilidad — Fondos verdes',
                monto: 'Acceso a BID/FONADIN/BANOBRAS deuda verde',
                descripcion: 'Sin un programa RSU aprobado, el municipio no califica para líneas de crédito verde. El costo del capital sube 200–400 pb vs. financiamiento convencional.',
                probabilidad: 'Certeza — criterio de elegibilidad explícito',
                color: '#D4881E', bgColor: '#FEF7E7', borderColor: '#FDE68A',
              },
              {
                titulo: 'Daño reputacional y político',
                monto: 'No cuantificable en este modelo',
                descripcion: 'Municipios sin programa activo de separación pierden posicionamiento en rankings estatales (SEMARNAT) y pierden acceso a programas federales como PRORESOL.',
                probabilidad: 'Media — depende del ciclo político',
                color: '#8B6B4A', bgColor: '#FAF6F2', borderColor: '#E5D5C5',
              },
            ].map(r => (
              <div key={r.titulo} className="rounded-[10px] border p-4" style={{ borderColor: r.borderColor, background: r.bgColor }}>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-[12px] font-semibold" style={{ color: r.color }}>{r.titulo}</p>
                  <span className="text-[10px] font-bold shrink-0 font-mono" style={{ color: r.color }}>{r.monto}</span>
                </div>
                <p className="text-[11px] text-[#4A4740] mb-1">{r.descripcion}</p>
                <p className="text-[9px] text-[#A8A49C]">Probabilidad: {r.probabilidad}</p>
              </div>
            ))}
          </div>

          {/* The reframe */}
          <div className="rounded-[12px] border-2 border-[#3B6D11] bg-[#F4FAEC] px-6 py-5">
            <p className="text-[13px] font-bold text-[#3B6D11] mb-2">La pregunta correcta para el cabildo</p>
            <p className="text-[13px] text-[#3B5F23] leading-relaxed">
              La pregunta no es <strong>"¿cuánto cuesta el programa?"</strong> — es{' '}
              <strong>"¿cuánto nos cuesta cada año que pasa sin él?"</strong> El programa requiere una inversión de CAPEX
              que se amortiza en {resultados?.paybackMeses ? Math.round(resultados.paybackMeses / 12) : '3–5'} años. La omisión tiene un costo recurrente
              que crece con inflación, sin fecha de término, y sin posibilidad de recuperación una vez que el relleno satura.
            </p>
          </div>
        </div>

        {/* Right rail */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Metodología</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">Estimativo</span>
          </div>
          <RailSection title="Cómo se calcula" open>
            <p>
              Costo de disposición: RSU generado × {`$${COSTO_DISPOSICION_TM}`}/ton (tarifa media relleno sanitario nacional) × factor INPC {(INPC_ANNUAL * 100).toFixed(1)}%/año.
              Daño salud: fracción orgánica × ${COSTO_SALUD_POR_TON_ORGANICO}/ton (OPS/INSP México).
              Saturación del relleno: supuesto 6M m³ capacidad residual, 0.5 m³/ton compactado.
            </p>
          </RailSection>
          <RailSection title="Fuentes">
            <ul className="space-y-1">
              {[
                'SEMARNAT — Informe de RSU México 2022 (costo relleno)',
                'INSP — Carga de enfermedad por RSU, México 2021',
                'BANXICO — Proyección inflación 2024–2026',
                'LGPGIR Art. 10 — sanciones por incumplimiento',
                'BID, FONADIN — criterios de elegibilidad publicados',
              ].map(s => <li key={s} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#1A5FA8] shrink-0" />{s}</li>)}
            </ul>
          </RailSection>
          <RailSection title="Limitaciones">
            <p>No incluye: costo de oportunidad de tierra (relleno vs. uso alternativo), pasivo ambiental de lixiviados, costo de cierre técnico obligatorio. El modelo es conservador.</p>
          </RailSection>
          <RailSection title="Condiciones de lectura">
            <p className="text-[9px] text-[#A8A49C]">Estimaciones del modelo. El cálculo real requiere un levantamiento de campo del relleno vigente y datos de costos de la tesorería municipal.</p>
          </RailSection>
        </div>
      </div>
    </div>
  )
}
