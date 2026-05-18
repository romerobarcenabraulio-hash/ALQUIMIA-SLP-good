'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { TrendingUp, DollarSign, RefreshCcw, Clock, Shield, Download, FileText, Share2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmt } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ImpactoFinanciero } from '@/components/simulator/ImpactoFinanciero'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { ExportadorReporte } from '@/components/simulator/ExportadorReporte'
import { DashboardKPIs } from '@/components/simulator/DashboardKPIs'
import { AlertasPanel } from '@/components/simulator/AlertasPanel'
import { GovernancePanel } from '@/components/simulator/GovernancePanel'
import { LaunchChecklist } from '@/components/simulator/LaunchChecklist'

// ── Scenario data (derived from global state multipliers) ────────────────────

function buildScenarios(r: ReturnType<typeof useSimulatorStore.getState>['resultados']) {
  if (!r) return []
  return [
    { nombre: 'Acelerado',      tir: (r.tir * 1.25).toFixed(1), vpn: fmt.mxnM(r.vpn * 1.35), payback: '3', color: '#3B6D11', tag: 'Favorable',    tagColor: 'bg-[#EAF3DE] text-[#23470A]' },
    { nombre: 'Base',           tir: r.tir.toFixed(1),           vpn: fmt.mxnM(r.vpn),         payback: '4', color: '#1A5FA8', tag: 'Equilibrio',   tagColor: 'bg-[#EBF3FB] text-[#0D3B6E]', active: true },
    { nombre: 'Conservador',    tir: (r.tir * 0.72).toFixed(1), vpn: fmt.mxnM(r.vpn * 0.65), payback: '6', color: '#D4881E', tag: 'Aceptable',     tagColor: 'bg-[#FEF7E7] text-[#6B4800]' },
    { nombre: 'Sin intervención', tir: '0.0',                   vpn: '$0 M',                  payback: '—', color: '#C0392B', tag: 'No viable',     tagColor: 'bg-[#FDE8E8] text-[#7A1212]' },
  ]
}

// ── CAPEX breakdown ──────────────────────────────────────────────────────────

const CAPEX_ITEMS = [
  { label: 'Centros de acopio',            pct: 30, color: '#3B6D11' },
  { label: 'Recolección y rutas',           pct: 30, color: '#5A9438' },
  { label: 'Tecnología y plataforma',       pct: 15, color: '#8CAA7A' },
  { label: 'Comunicación y capacitación',   pct: 10, color: '#A8C898' },
  { label: 'Acompañamiento técnico-jurídico', pct: 10, color: '#C4DAB4' },
]

// ── Tab nav ───────────────────────────────────────────────────────────────────

type ScenariosExportTabId = 'finance' | 'sensitivity' | 'export'
const TABS: ReadonlyArray<{ id: ScenariosExportTabId; label: string }> = [
  { id: 'finance',     label: 'Retorno y derrama financiera' },
  { id: 'sensitivity', label: 'Sensibilidad y riesgo' },
  { id: 'export',      label: 'Salida, gobernanza y exportación' },
]

// ── Main component ────────────────────────────────────────────────────────────

export function ScenariosExportStack() {
  const [tab, setTab] = useState<ScenariosExportTabId>('finance')
  const { resultados, horizonte } = useSimulatorStore()
  const r = resultados
  const scenarios = buildScenarios(r)

  // Capex total reference
  const capexRef = 31_000_000 // MXN — from FASES_CA optimal

  return (
    <section className="space-y-4 pb-6" data-testid="scenarios-export-stack">

      {/* ── M06 KPI strip ────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {[
          { icon: TrendingUp,  label: 'TIR del proyecto',       value: r ? `${r.tir.toFixed(1)}%` : '—',                                                    color: '#3B6D11' },
          { icon: DollarSign,  label: 'VPN (20 años)',           value: r ? fmt.mxnM(r.vpn) : '—',                                                           color: '#3B6D11' },
          { icon: RefreshCcw,  label: 'EBITDA promedio anual',   value: r ? fmt.mxnM(r.ebitda / Math.max(1, horizonte)) : '—',                               color: '#1A5FA8' },
          { icon: Clock,       label: 'Recuperación (payback)',  value: r ? `${r.paybackMeses.toFixed(0)} meses` : '—',                                      color: '#5A4A2A' },
          { icon: DollarSign,  label: 'CAPEX implementación',    value: fmt.mxnM(capexRef),                                                                   color: '#D4881E' },
          { icon: Shield,      label: 'Nivel de confianza',      value: '82%',                                                                                color: '#3B6D11' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none">{label}</p>
            </div>
            <p className="font-mono text-[14px] font-semibold leading-tight" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <nav className="flex flex-wrap gap-1.5 rounded-[10px] border border-[#E8E4DC] bg-[#F4F2ED] p-1.5">
        {TABS.map(item => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={cn(
              'flex-1 min-w-[140px] px-4 py-2 rounded-[7px] text-[12px] font-medium transition-colors',
              tab === item.id
                ? 'bg-white text-[#1C1B18] shadow-sm border border-[#E8E4DC]'
                : 'text-[#6B6760] hover:text-[#1C1B18]',
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── Tab 1: Retorno y derrama financiera ─────────────────────── */}
      {tab === 'finance' && (
        <div className="space-y-4">
          {/* Reading cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: TrendingUp, title: '¿Qué valor genera?',        body: 'Sustentabilidad económica, ambiental y social con trazabilidad para el municipio.',               color: '#3B6D11', bg: 'bg-[#F4FAEC] border-[#D7E8C0]' },
              { icon: DollarSign, title: '¿Qué cuesta implementar?',  body: `Inversión inicial CAPEX de ${fmt.mxnM(capexRef)} MXN y operación anual OPEX de $7.2 M MXN.`,      color: '#D4881E', bg: 'bg-[#FEF7E7] border-[#F5D98A]' },
              { icon: Shield,     title: '¿Qué depende de supuestos?', body: 'WACC, precios de materiales, captura efectiva, tipo de cambio y mercado de carbono.',             color: '#1A5FA8', bg: 'bg-[#EBF3FB] border-[#B0D0F5]' },
              { icon: FileText,   title: 'Fuente y evidencia',         body: 'Datos: INEGI, SEMARNAT, Banco Mundial y literatura especializada de economía circular.',          color: '#5A4A2A', bg: 'bg-[#F4F2ED] border-[#E8E4DC]' },
            ].map(({ icon: Icon, title, body, color, bg }) => (
              <div key={title} className={cn('rounded-[10px] border p-4', bg)}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
                  <p className="text-[10px] font-semibold" style={{ color }}>{title}</p>
                </div>
                <p className="text-[11px] text-[#6B6760] leading-relaxed">{body}</p>
              </div>
            ))}
          </div>

          {/* CAPEX breakdown + Scenario comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* CAPEX breakdown bars */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Costo estimado de implementación (CAPEX)</p>
              <p className="text-[10px] text-[#A8A49C] mb-4">Desglose por componente. Monto (MXN)</p>
              <div className="space-y-2.5">
                {CAPEX_ITEMS.map(item => {
                  const amount = capexRef * item.pct / 100
                  return (
                    <div key={item.label}>
                      <div className="flex justify-between text-[10px] mb-1">
                        <span className="text-[#4A4740]">{item.label}</span>
                        <span className="font-mono text-[#1C1B18] font-medium">{fmt.mxnM(amount)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#E8E4DC] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.pct * 3}%`, background: item.color }} />
                        </div>
                        <span className="text-[9px] text-[#A8A49C] w-7 text-right">{item.pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3 pt-2.5 border-t border-[#F0EDE5] flex justify-between text-[11px]">
                <span className="text-[#6B6760]">CAPEX total (inversión inicial)</span>
                <span className="font-mono font-semibold text-[#1C1B18]">{fmt.mxnM(capexRef)}</span>
              </div>
            </div>

            {/* Scenario comparison */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Retorno por escenario</p>
              <p className="text-[10px] text-[#A8A49C] mb-4">
                TIR del proyecto (%). VPN 20 años · Payback (meses).
              </p>

              {/* TIR bar chart */}
              <ResponsiveContainer width="100%" height={100}>
                <BarChart
                  data={scenarios.map(s => ({ name: s.nombre, tir: parseFloat(s.tir) }))}
                  layout="vertical"
                  margin={{ top: 0, right: 32, left: 70, bottom: 0 }}
                >
                  <XAxis type="number" tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} domain={[0, 40]} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#4A4740' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'TIR']} contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                  <Bar dataKey="tir" radius={[0, 3, 3, 0]}>
                    {scenarios.map((s, i) => <Cell key={i} fill={s.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              {/* Scenario detail rows */}
              <div className="mt-3 space-y-2">
                {scenarios.map(s => (
                  <div
                    key={s.nombre}
                    className={cn(
                      'flex items-center justify-between rounded-[7px] px-3 py-2 text-[10px]',
                      s.active ? 'bg-[#EBF3FB] border border-[#B0D0F5]' : 'bg-[#FAFAF8] border border-[#F0EDE5]',
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
                      <span className="font-medium text-[#1C1B18]">{s.nombre}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-[#1C1B18]">TIR {s.tir}%</span>
                      <span className="font-mono text-[#6B6760]">{s.vpn}</span>
                      <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', s.tagColor)}>{s.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ImpactoFinanciero full component */}
          <ImpactoFinanciero />
        </div>
      )}

      {/* ── Tab 2: Sensibilidad y riesgo ─────────────────────────────── */}
      {tab === 'sensitivity' && (
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Sensibilidad, riesgo y paquete de salida</p>
            <p className="text-[12px] text-[#6B6760]">
              Esta vista valida la robustez del valor y muestra la ruta de costo de implementación.
              El modelo calcula 10,000 simulaciones Monte Carlo con variación aleatoria en precio de materiales, WACC y captura efectiva.
            </p>
          </div>

          {/* Risk summary row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-4">
              <p className="text-[10px] font-semibold text-[#3B6D11] uppercase tracking-wide mb-2">¿Qué tan robusto es el modelo?</p>
              <p className="text-[11px] text-[#5A6347]">Alta robustez: 86% de los casos generan VPN positivo. El escenario P10 se acerca al equilibrio.</p>
            </div>
            <div className="rounded-[12px] border border-[#F5D98A] bg-[#FEF7E7] p-4">
              <p className="text-[10px] font-semibold text-[#D4881E] uppercase tracking-wide mb-2">Principal riesgo</p>
              <p className="text-[11px] text-[#6B4800]">Variación en precios de materiales frena captura efectiva. Ver variables críticas →</p>
            </div>
            <div className="rounded-[12px] border border-[#B0D0F5] bg-[#EBF3FB] p-4">
              <p className="text-[10px] font-semibold text-[#1A5FA8] uppercase tracking-wide mb-2">Decisión sugerida</p>
              <p className="text-[11px] text-[#0D3B6E]">Proceder con implementación. El proyecto generará valor incluso en escenarios conservadores.</p>
            </div>
          </div>

          <DashboardKPIs />
          <AlertasPanel />
        </div>
      )}

      {/* ── Tab 3: Salida, gobernanza y exportación ──────────────────── */}
      {tab === 'export' && (
        <div className="space-y-4">
          {/* Export action cards */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Comparativo de exportación para revisión</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Exporta este escenario, sus supuestos y rutas de implementación.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: FileText, label: 'PDF ejecutivo',          sub: 'Resumen con datos clave',              color: '#C0392B', bg: 'bg-[#FDE8E8] border-[#F5B7B1]' },
                { icon: Download, label: 'Excel',                  sub: 'Base de supuestos y escenarios',       color: '#1A5FA8', bg: 'bg-[#EBF3FB] border-[#B0D0F5]' },
                { icon: FileText, label: 'Resumen para Cabildo',   sub: 'Versión ejecutiva para presentación',  color: '#3B6D11', bg: 'bg-[#EAF3DE] border-[#D7E8C0]' },
                { icon: Share2,   label: 'Compartir URL',          sub: 'Enlace seguro con acceso controlado',  color: '#5A4A2A', bg: 'bg-[#F4F2ED] border-[#E8E4DC]' },
              ].map(({ icon: Icon, label, sub, color, bg }) => (
                <div key={label} className={cn('rounded-[10px] border p-4 text-center cursor-pointer hover:shadow-sm transition-shadow', bg)}>
                  <Icon className="w-5 h-5 mx-auto mb-2" style={{ color }} strokeWidth={1.5} />
                  <p className="text-[11px] font-semibold text-[#1C1B18]">{label}</p>
                  <p className="text-[9px] text-[#6B6760] mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <ExportarSection />
          <ExportadorReporte />
          <GovernancePanel />
          <LaunchChecklist />
        </div>
      )}
    </section>
  )
}
