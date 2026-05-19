'use client'

/**
 * CotizacionRecomendada — Panel de cotización óptima por municipio.
 *
 * Muestra la recomendación generada por el motor ALQUIMIA:
 *   - Fase recomendada, mix de CAs, recicladoras activadas
 *   - Resumen financiero (CAPEX, OPEX, TIR, payback, empleos)
 *   - Score de viabilidad (0–100) con semáforo
 *   - Justificación ejecutiva y supuestos clave
 *   - Botón "Guardar cotización" que persiste en backend
 *
 * Diseño: sigue la paleta ALQUIMIA. Sin bordes salvo en tablas.
 */

import { useEffect, useState } from 'react'
import {
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, Save,
  Building2, Factory, TrendingUp, Users, Leaf, Clock,
  ChevronDown, ChevronUp, Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { fmt } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'
import {
  colorScoreViabilidad,
  bgScoreViabilidad,
  labelClasificacion,
  type CotizacionRecomendada as TCotizacion,
} from '@/lib/recommendationEngine'

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtM(n: number) {
  return `$${(n / 1_000_000).toFixed(1)} M`
}

function ScoreArc({ score }: { score: number }) {
  const color = colorScoreViabilidad(score)
  const pct = score / 100
  // SVG arc: circunferencia 2π×45 = 282.7, desplazamiento = pct × 282.7
  const circ = 282.7
  const dash = pct * circ
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r="45" fill="none" stroke="#E8E4DC" strokeWidth="6" />
        <circle
          cx="48" cy="48" r="45" fill="none"
          stroke={color} strokeWidth="6"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="relative text-center">
        <p className="text-2xl font-bold font-mono" style={{ color }}>{score}</p>
        <p className="text-[9px] uppercase tracking-[0.06em] text-[#6B6760]">score</p>
      </div>
    </div>
  )
}

function KpiChip({
  icon: Icon, label, value, subvalue,
}: { icon: React.ElementType; label: string; value: string; subvalue?: string }) {
  return (
    <div className="flex flex-col gap-0.5 py-2">
      <div className="flex items-center gap-1.5 text-[#6B6760]">
        <Icon size={12} strokeWidth={1.5} />
        <span className="text-[10px] uppercase tracking-[0.06em]">{label}</span>
      </div>
      <p className="font-mono font-semibold text-[#1C1B18] text-sm leading-none">{value}</p>
      {subvalue && <p className="text-[10px] text-[#A8A49C]">{subvalue}</p>}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function CotizacionRecomendada() {
  const {
    cotizacionRecomendada,
    generarCotizacion,
    guardarCotizacionRemota,
    resultados,
  } = useSimulatorStore()

  const [showJustificacion, setShowJustificacion] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Generar cotización automáticamente cuando hay resultados
  useEffect(() => {
    if (resultados && !cotizacionRecomendada) {
      generarCotizacion()
    }
  }, [resultados, cotizacionRecomendada, generarCotizacion])

  const c: TCotizacion | null = cotizacionRecomendada

  if (!c) {
    return (
      <div className="flex items-center justify-center py-16 text-[#A8A49C]">
        <RefreshCw size={16} className="animate-spin mr-2" />
        Generando cotización…
      </div>
    )
  }

  async function handleGuardar() {
    setSaving(true)
    await guardarCotizacionRemota()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const bgViabilidad = bgScoreViabilidad(c.scoreViabilidad)
  const ClasifIcon =
    c.scoreViabilidad >= 70 ? CheckCircle2 :
    c.scoreViabilidad >= 50 ? AlertTriangle : XCircle

  return (
    <div className="space-y-6">

      {/* ── Cabecera ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760] mb-1">
            Cotización recomendada — {c.municipioNombre}
          </p>
          <h2 className="font-serif text-xl text-[#1C1B18]">
            Fase {c.faseRecomendada} — {c.faseNombre}
          </h2>
          <p className="text-sm text-[#6B6760] mt-0.5">
            {c.mixCAs.P}P · {c.mixCAs.M}M · {c.mixCAs.G}G centros de acopio
            {' · '}{c.capacidadCAs} ton/día de capacidad instalada
          </p>
        </div>

        {/* Score arco */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <ScoreArc score={c.scoreViabilidad} />
          <span className={cn('text-[10px] px-2 py-0.5 rounded-full border font-medium', bgViabilidad)}>
            <ClasifIcon size={9} className="inline mr-1 mb-0.5" />
            {labelClasificacion(c.clasificacionViabilidad)}
          </span>
        </div>
      </div>

      {/* ── Cobertura meta ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.06em] text-[#6B6760] mb-1">
          <span>Cobertura de la meta de captación ({c.pctCapturaMeta.toFixed(0)}%)</span>
          <span className="font-mono text-[#1C1B18]">{c.coberturaMetaPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-[#E8E4DC] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.min(100, c.coberturaMetaPct)}%`,
              backgroundColor: colorScoreViabilidad(c.scoreViabilidad),
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-[#A8A49C] mt-0.5">
          <span>Meta: {c.tonCapturaMeta.toFixed(1)} ton/día</span>
          <span>Capacidad: {c.capacidadCAs} ton/día</span>
        </div>
      </div>

      {/* ── KPIs financieros ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#E8E4DC] border border-[#E8E4DC] rounded-[10px] overflow-hidden">
        <div className="px-4">
          <KpiChip icon={Building2} label="CAPEX total" value={fmtM(c.resumen.capexTotalMXN)} subvalue="CAs + recicladoras" />
        </div>
        <div className="px-4">
          <KpiChip icon={TrendingUp} label="TIR est." value={`${c.resumen.tirEstimadaPct.toFixed(1)}%`} subvalue="promedio ponderado" />
        </div>
        <div className="px-4">
          <KpiChip icon={Clock} label="Payback" value={c.resumen.paybackMeses < 999 ? `${c.resumen.paybackMeses} meses` : 'N/A'} subvalue="retorno simple" />
        </div>
        <div className="px-4">
          <KpiChip icon={Users} label="Empleos directos" value={`${c.resumen.empleosDirectos}`} subvalue="CAs + recicladoras" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-[#E8E4DC] border border-[#E8E4DC] rounded-[10px] overflow-hidden">
        <div className="px-4">
          <KpiChip icon={Building2} label="OPEX mensual" value={fmtM(c.resumen.opexMesMXN)} subvalue="régimen año 3" />
        </div>
        <div className="px-4">
          <KpiChip icon={TrendingUp} label="EBITDA mensual" value={fmtM(c.resumen.ebitdaMesMXN)} subvalue="año 3 proyectado" />
        </div>
        <div className="px-4">
          <KpiChip icon={Leaf} label="CO₂e evitadas" value={`${c.resumen.co2eAnualTon.toFixed(0)} ton`} subvalue="por año" />
        </div>
      </div>

      {/* ── Recicladoras recomendadas ─────────────────────────────────────── */}
      {c.recicladoras.length > 0 ? (
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760] mb-2">
            Recicladoras activas ({c.recicladoras.length})
          </p>
          <div className="border border-[#E8E4DC] rounded-[10px] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F4F2ED]">
                  <th className="text-left px-3 py-2 text-[10px] uppercase tracking-[0.06em] text-[#6B6760] font-medium">Giro</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-[0.06em] text-[#6B6760] font-medium">CAPEX</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-[0.06em] text-[#6B6760] font-medium">TIR</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-[0.06em] text-[#6B6760] font-medium">Payback</th>
                  <th className="text-right px-3 py-2 text-[10px] uppercase tracking-[0.06em] text-[#6B6760] font-medium">Empleos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4DC]">
                {c.recicladoras.map((r) => (
                  <tr key={r.giro} className="hover:bg-[#FDFCFA]">
                    <td className="px-3 py-2">
                      <p className="font-medium text-[#1C1B18]">{r.nombre}</p>
                      <p className="text-[10px] text-[#A8A49C]">{r.justificacion}</p>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#1C1B18]">{fmtM(r.capexMXN)}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#3B6D11]">
                      {r.tirPct > 0 ? `${r.tirPct.toFixed(1)}%` : 'N/A'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#1C1B18]">
                      {r.paybackMeses < 999 ? `${r.paybackMeses} m` : '—'}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#1C1B18]">{r.empleos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-sm text-[#A8A49C] bg-[#F4F2ED] rounded-[10px] px-4 py-3 flex items-center gap-2">
          <Info size={14} />
          Sin recicladoras activas en esta fase (volumen o precios de materiales insuficientes para viabilidad).
        </div>
      )}

      {/* ── Justificación ─────────────────────────────────────────────────── */}
      <div className="border border-[#E8E4DC] rounded-[10px] overflow-hidden">
        <button
          onClick={() => setShowJustificacion(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-[#F4F2ED] hover:bg-[#ECEAE4] transition-colors text-left"
        >
          <span className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760] font-medium">
            Justificación ejecutiva y supuestos
          </span>
          {showJustificacion
            ? <ChevronUp size={14} className="text-[#6B6760]" />
            : <ChevronDown size={14} className="text-[#6B6760]" />}
        </button>

        {showJustificacion && (
          <div className="px-4 py-4 space-y-4">
            <p className="text-sm text-[#1C1B18] leading-relaxed">
              {c.justificacion.textoEjecutivo}
            </p>

            {c.justificacion.factoresFavorables.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#3B6D11] mb-1.5 flex items-center gap-1">
                  <CheckCircle2 size={11} /> Factores favorables
                </p>
                <ul className="space-y-1">
                  {c.justificacion.factoresFavorables.map((f, i) => (
                    <li key={i} className="text-xs text-[#1C1B18] flex gap-2">
                      <span className="text-[#3B6D11] mt-0.5">•</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {c.justificacion.restricciones.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#D4881E] mb-1.5 flex items-center gap-1">
                  <AlertTriangle size={11} /> Restricciones detectadas
                </p>
                <ul className="space-y-1">
                  {c.justificacion.restricciones.map((r, i) => (
                    <li key={i} className="text-xs text-[#1C1B18] flex gap-2">
                      <span className="text-[#D4881E] mt-0.5">▲</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760] mb-1.5">Supuestos clave</p>
              <ul className="space-y-1">
                {c.justificacion.supuestosClave.map((s, i) => (
                  <li key={i} className="text-[10px] text-[#6B6760] font-mono">{s}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* ── Botones de acción ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={() => generarCotizacion()}
          className="flex items-center gap-2 px-4 py-2 rounded-[8px] border border-[#E8E4DC] text-sm text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
        >
          <RefreshCw size={14} />
          Recalcular
        </button>

        <button
          onClick={handleGuardar}
          disabled={saving || saved}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-[8px] text-sm transition-colors',
            saved
              ? 'bg-[#EAF3DE] border border-[#A5C97A] text-[#23470A]'
              : 'bg-[#3B6D11] text-white hover:bg-[#2E5A0D]',
            (saving || saved) && 'opacity-70 cursor-default'
          )}
        >
          {saved
            ? <><CheckCircle2 size={14} /> Guardada</>
            : saving
              ? <><RefreshCw size={14} className="animate-spin" /> Guardando…</>
              : <><Save size={14} /> Guardar cotización</>
          }
        </button>

        <p className="text-[10px] text-[#A8A49C] ml-auto">
          Generada {new Date(c.generadoEn).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>

      {/* ── Disclaimer ────────────────────────────────────────────────────── */}
      <div className="border-t border-[#E8E4DC] pt-3">
        <p className="text-[10px] text-[#A8A49C] leading-relaxed">
          <span className="uppercase tracking-[0.06em] font-medium">Advertencia — </span>
          {c.disclaimer}
        </p>
      </div>

    </div>
  )
}
