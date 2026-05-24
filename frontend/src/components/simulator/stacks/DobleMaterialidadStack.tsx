'use client'

import { useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS = ['Doble Materialidad', 'GRI 306', 'Reporte Financiadores']

const MATERIALIDAD_TOPICS = [
  { label: 'Emisiones CH₄ rellenos',        impacto: 4.5, financiero: 3.0 },
  { label: 'Empleo local',                  impacto: 4.0, financiero: 1.5 },
  { label: 'Calidad agua/suelo lixiviados', impacto: 4.8, financiero: 2.5 },
  { label: 'Volatilidad precios mat.',       impacto: 2.0, financiero: 4.2 },
  { label: 'Resistencia ciudadana',         impacto: 3.0, financiero: 4.0 },
  { label: 'Extensión vida relleno',        impacto: 4.2, financiero: 3.5 },
]

// SVG canvas dimensions
const SVG_W = 380
const SVG_H = 280
const PAD = 44

function dotColor(impacto: number, financiero: number): string {
  if (impacto >= 3.5 && financiero >= 3.5) return '#C0392B'  // alta relevancia — rojo
  if (financiero >= 3.5) return '#D4881E'                     // financiero — ámbar
  if (impacto >= 3.5) return '#3B6D11'                        // impacto — verde
  return '#A8A49C'                                             // menor relevancia — gris
}

// ── Component ─────────────────────────────────────────────────────────────────

export function DobleMaterialidadStack() {
  const { zmActiva, municipiosActivos, resultados, pctCapturaPorAño } = useSimulatorStore()

  const [tab, setTab] = useState(1)

  const municipio = municipiosActivos[0] ?? zmActiva

  // ── GRI 306 calculations ──────────────────────────────────────────────────
  const rsuAnual = (resultados?.rsuTotalTonDia ?? 0) * 300
  const vol = resultados?.volCapturablePorMat
  const desviado4a = vol ? (vol.papel + vol.plastico + vol.vidrio + vol.aluminio) * 300 : 0
  const desviado4b = vol ? vol.organico * 300 * 0.35 : 0
  const disposicion = Math.max(0, rsuAnual - desviado4a - desviado4b)
  const tasaDesvio = rsuAnual > 0 ? (desviado4a + desviado4b) / rsuAnual * 100 : 0

  // ── KPI projections ───────────────────────────────────────────────────────
  const co2Anual = resultados?.co2eEvitadasAnualTon ?? 0
  const empleos = resultados?.empleosTotalesDirectos ?? 0
  const pctCaptura = pctCapturaPorAño[0] ?? 0
  const rsuHabDia = resultados?.pobActiva && resultados?.rsuTotalTonDia
    ? resultados.rsuTotalTonDia * 1000 / resultados.pobActiva
    : 0

  // ── Clipboard copy ────────────────────────────────────────────────────────
  const handleCopiar = () => {
    const fecha = new Date().toLocaleDateString('es-MX')
    const md = `# REPORTE DE SOSTENIBILIDAD — ${municipio.toUpperCase()}
Estándar: GRI 306: Residuos 2020 + ESRS E5 (Economía Circular)
Preparado por: Plataforma ALQUIMIA | Fecha: ${fecha}

## RESUMEN EJECUTIVO
El programa de separación en origen del municipio de ${municipio} proyecta desviar
${fmt.num(desviado4a + desviado4b)} toneladas/año del relleno sanitario hacia circuitos de valorización,
equivalente a una tasa de desvío del ${tasaDesvio.toFixed(1)}%, evitando ${fmt.num(co2Anual)} t CO₂e/año.

## INDICADORES GRI 306 (PROYECTADOS)
| Indicador | Valor | Unidad |
|---|---|---|
| 306-3 Residuos generados | ${fmt.num(rsuAnual)} | t/año |
| 306-4a Desviados a reciclaje | ${fmt.num(desviado4a)} | t/año |
| 306-4b A compostaje | ${fmt.num(desviado4b)} | t/año |
| 306-5 A disposición final | ${fmt.num(disposicion)} | t/año |
| Tasa de desvío | ${tasaDesvio.toFixed(1)}% | % |

## INDICADORES ESRS E5
- E5-4: Tasa de circularidad de residuos = ${tasaDesvio.toFixed(1)}%
- E5-5: Intensidad residuos/unidad económica = ${fmt.num(rsuHabDia)} kg/hab/día

_Fuente: Plataforma ALQUIMIA — datos proyectados del simulador. No representan mediciones reales._`
    navigator.clipboard.writeText(md).catch(() => {})
  }

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

      {/* ── Tab 1: Doble Materialidad ───────────────────────────────────────── */}
      {tab === 1 && (
        <div className="space-y-5">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-5 shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <p className="font-serif text-[14px] font-semibold text-[#1C1B18] mb-1">Matriz de Doble Materialidad</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">
              CSRD/ESRS E5 §10 — Impacto en ambiente (eje X) vs. Materialidad financiera (eje Y)
            </p>

            <div className="overflow-x-auto">
              <svg
                viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                className="w-full block mx-auto"
                style={{ maxWidth: SVG_W, height: SVG_H }}
              >
                {/* Quadrant fills */}
                <rect x={PAD} y={PAD} width={(SVG_W-PAD*2)/2} height={(SVG_H-PAD*2)/2} fill="#FDE8E8" opacity={0.35} />
                <rect x={PAD+(SVG_W-PAD*2)/2} y={PAD} width={(SVG_W-PAD*2)/2} height={(SVG_H-PAD*2)/2} fill="#FDE8E8" opacity={0.6} />
                <rect x={PAD} y={PAD+(SVG_H-PAD*2)/2} width={(SVG_W-PAD*2)/2} height={(SVG_H-PAD*2)/2} fill="#F4F2ED" opacity={0.5} />
                <rect x={PAD+(SVG_W-PAD*2)/2} y={PAD+(SVG_H-PAD*2)/2} width={(SVG_W-PAD*2)/2} height={(SVG_H-PAD*2)/2} fill="#EAF3DE" opacity={0.5} />

                {/* Grid lines + axis tick labels */}
                {[1, 2, 3, 4, 5].map(v => {
                  const xPos = PAD + ((v - 1) / 4) * (SVG_W - PAD * 2)
                  const yPos = PAD + ((5 - v) / 4) * (SVG_H - PAD * 2)
                  return (
                    <g key={v}>
                      <line x1={xPos} y1={PAD} x2={xPos} y2={SVG_H - PAD} stroke="#E8E4DC" strokeWidth={0.6} />
                      <line x1={PAD} y1={yPos} x2={SVG_W - PAD} y2={yPos} stroke="#E8E4DC" strokeWidth={0.6} />
                      <text x={xPos} y={SVG_H - PAD + 13} textAnchor="middle" fontSize={8} fill="#A8A49C">{v}</text>
                      <text x={PAD - 6} y={yPos + 3} textAnchor="end" fontSize={8} fill="#A8A49C">{v}</text>
                    </g>
                  )
                })}

                {/* Axis labels */}
                <text x={SVG_W / 2} y={SVG_H - 2} textAnchor="middle" fontSize={9} fill="#6B6760">Materialidad de impacto →</text>
                <text
                  x={10} y={SVG_H / 2}
                  textAnchor="middle" fontSize={9} fill="#6B6760"
                  transform={`rotate(-90, 10, ${SVG_H / 2})`}
                >Materialidad financiera →</text>

                {/* Quadrant labels */}
                <text x={PAD + (SVG_W-PAD*2)*0.25} y={PAD + 10} textAnchor="middle" fontSize={7} fill="#B91C1C" opacity={0.7}>Financiero</text>
                <text x={PAD + (SVG_W-PAD*2)*0.75} y={PAD + 10} textAnchor="middle" fontSize={7} fill="#B91C1C" fontWeight="bold">Alta relevancia</text>
                <text x={PAD + (SVG_W-PAD*2)*0.25} y={SVG_H - PAD - 4} textAnchor="middle" fontSize={7} fill="#6B6760">Menor</text>
                <text x={PAD + (SVG_W-PAD*2)*0.75} y={SVG_H - PAD - 4} textAnchor="middle" fontSize={7} fill="#3B6D11" fontWeight="bold">Impacto ambiental</text>

                {/* Topic dots */}
                {MATERIALIDAD_TOPICS.map((t, idx) => {
                  const cx = PAD + ((t.impacto - 1) / 4) * (SVG_W - PAD * 2)
                  const cy = PAD + ((5 - t.financiero) / 4) * (SVG_H - PAD * 2)
                  const color = dotColor(t.impacto, t.financiero)
                  const labelParts = t.label.split(' ')
                  return (
                    <g key={idx}>
                      <circle cx={cx} cy={cy} r={9} fill={color} opacity={0.85} />
                      <text x={cx} y={cy - 12} textAnchor="middle" fontSize={7} fill="#1C1B18" fontWeight="600">
                        {labelParts.slice(0, 2).join(' ')}
                      </text>
                      {labelParts.length > 2 && (
                        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={7} fill="#1C1B18">
                          {labelParts.slice(2).join(' ')}
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-3 justify-center">
              {[
                ['#C0392B', 'Alta relevancia (ambos ejes)'],
                ['#D4881E', 'Principalmente financiero'],
                ['#3B6D11', 'Principalmente impacto'],
                ['#A8A49C', 'Menor relevancia'],
              ].map(([c, l]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: c }} />
                  <span className="text-[9px] text-[#6B6760]">{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-3">
            <p className="text-[9px] text-[#A8A49C]">
              Metodología CSRD/ESRS E5 §10 — Doble Materialidad para Economía Circular.
              European Financial Reporting Advisory Group (EFRAG) 2023.
            </p>
          </div>
        </div>
      )}

      {/* ── Tab 2: GRI 306 ─────────────────────────────────────────────────── */}
      {tab === 2 && (
        <div className="space-y-5">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <div className="flex items-center gap-3">
                <p className="font-serif text-[14px] font-semibold text-[#1C1B18]">GRI 306: Residuos 2020</p>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#FEF3C7] text-[#92400E]">Proyectado</span>
              </div>
              <p className="text-[10px] text-[#A8A49C] mt-0.5">
                {municipio} · Año 1 del programa · {rsuAnual > 0 ? 'Datos del simulador' : 'Sin cálculo activo'}
              </p>
            </div>
            <table className="w-full text-[10px]">
              <thead>
                <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                  {['Indicador GRI 306', 'Valor proyectado', 'Unidad', 'Meta PNPGIR 2022-2024'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 font-bold text-[#1C1B18] text-[9px] uppercase tracking-[0.06em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { ind: '306-3: Residuos generados',      val: fmt.num(rsuAnual),        u: 't/año',  meta: '—' },
                  { ind: '306-4a: Desviados a reciclaje',  val: fmt.num(desviado4a),      u: 't/año',  meta: '—' },
                  { ind: '306-4b: A compostaje (0.35×org)',val: fmt.num(desviado4b),      u: 't/año',  meta: '—' },
                  { ind: '306-5: A disposición final',     val: fmt.num(disposicion),     u: 't/año',  meta: '—' },
                  { ind: 'Tasa de desvío',                 val: tasaDesvio.toFixed(1) + '%', u: '%',    meta: '≥ 30% año 3' },
                ].map((r, i) => (
                  <tr key={r.ind} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                    <td className="px-4 py-2.5 font-medium text-[#1C1B18]">{r.ind}</td>
                    <td className="px-4 py-2.5 font-mono font-semibold text-[#3B6D11]">{r.val}</td>
                    <td className="px-4 py-2.5 text-[#6B6760]">{r.u}</td>
                    <td className="px-4 py-2.5 text-[#D4881E] font-semibold">{r.meta}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-3">
            <p className="text-[9px] text-[#A8A49C]">
              GRI 306: Residuos 2020. Global Reporting Initiative. Factor compostaje 0.35 aplicado a fracción orgánica
              (PNPGIR 2022-2024, meta nacional ≥30% desvío en año 3).
            </p>
          </div>
        </div>
      )}

      {/* ── Tab 3: Reporte para Financiadores ──────────────────────────────── */}
      {tab === 3 && (
        <div className="space-y-5">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5 shadow-[0_2px_12px_rgba(28,27,24,0.06)]">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <p className="font-serif text-[14px] font-semibold text-[#1C1B18]">Borrador de reporte para financiadores</p>
              <button
                type="button"
                onClick={handleCopiar}
                className="px-3 py-1.5 rounded-[7px] border border-[#E8E4DC] text-[10px] font-semibold text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
              >
                Copiar como Markdown
              </button>
            </div>

            <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-5 font-mono text-[10px] text-[#1C1B18] leading-relaxed space-y-4">
              {/* Header */}
              <div>
                <p className="font-bold text-[12px] tracking-wide">REPORTE DE SOSTENIBILIDAD — {municipio.toUpperCase()}</p>
                <p className="text-[#6B6760]">Estándar: GRI 306: Residuos 2020 + ESRS E5 (Economía Circular)</p>
                <p className="text-[#6B6760]">Preparado por: Plataforma ALQUIMIA | Fecha: {new Date().toLocaleDateString('es-MX')}</p>
              </div>

              {/* Resumen */}
              <div>
                <p className="font-bold text-[#3B6D11] mb-1 tracking-wide">RESUMEN EJECUTIVO</p>
                <p className="text-[#4A4740] leading-relaxed">
                  El programa de separación en origen del municipio de <strong>{municipio}</strong> proyecta
                  desviar <strong>{fmt.num(desviado4a + desviado4b)} toneladas/año</strong> del relleno
                  sanitario hacia circuitos de valorización, equivalente a una tasa de desvío
                  del <strong>{tasaDesvio.toFixed(1)}%</strong>, evitando <strong>{fmt.num(co2Anual)} t CO₂e/año</strong>.
                </p>
              </div>

              {/* GRI 306 table */}
              <div>
                <p className="font-bold text-[#3B6D11] mb-2 tracking-wide">INDICADORES GRI 306 (PROYECTADOS)</p>
                <table className="w-full text-[9px]">
                  <tbody>
                    {[
                      ['306-3 Residuos generados',   fmt.num(rsuAnual),    't/año'],
                      ['306-4a Reciclaje',            fmt.num(desviado4a),  't/año'],
                      ['306-4b Compostaje',           fmt.num(desviado4b),  't/año'],
                      ['306-5 Disposición final',     fmt.num(disposicion), 't/año'],
                      ['Tasa de desvío',              tasaDesvio.toFixed(1) + '%', ''],
                    ].map(([k, v, u]) => (
                      <tr key={k} className="border-b border-[#F0EDE5] last:border-b-0">
                        <td className="py-1 pr-4 text-[#6B6760]">{k}</td>
                        <td className="py-1 pr-2 font-semibold text-[#1C1B18]">{v}</td>
                        <td className="py-1 text-[#A8A49C]">{u}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ESRS E5 */}
              <div>
                <p className="font-bold text-[#3B6D11] mb-1 tracking-wide">INDICADORES ESRS E5</p>
                <p className="text-[#4A4740]">
                  E5-4: Tasa de circularidad de residuos = <strong>{tasaDesvio.toFixed(1)}%</strong>
                </p>
                <p className="text-[#4A4740]">
                  E5-5: Intensidad residuos/unidad económica = <strong>{rsuHabDia > 0 ? fmt.num(rsuHabDia) : '—'}</strong> kg/hab/día
                </p>
              </div>

              {/* Disclaimer */}
              <p className="text-[9px] text-[#A8A49C] italic border-t border-[#F0EDE5] pt-3">
                Datos proyectados — no representan mediciones reales. Deben validarse con registros de campo
                antes de presentarse a financiadores. Módulo M14 disponible para datos medidos.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
