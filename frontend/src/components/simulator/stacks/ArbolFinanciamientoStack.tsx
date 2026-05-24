'use client'

import { useState } from 'react'
import {
  CheckCircle, XCircle, ChevronDown, DollarSign, Clock, Shield, TrendingUp,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'

// ── Financing paths data ──────────────────────────────────────────────────────

type FinancingPath = {
  id: string
  label: string
  descripcion: string
  vehiculoLegal: string
  costCapitalPct: string
  tiempoMeses: string
  requiereCapex: boolean
  requiereConcesion: boolean
  requiereESG: boolean
  pros: string[]
  contras: string[]
  cuando: string
  color: string
  bgColor: string
  borderColor: string
}

const PATHS: FinancingPath[] = [
  {
    id: 'municipal',
    label: 'A — Municipal Directo',
    descripcion: 'El municipio financia 100% del CAPEX con recursos propios o deuda municipal directa. Opera el CA con personal de nómina municipal.',
    vehiculoLegal: 'Presupuesto municipal ordinario o deuda pública LGDF Art. 9',
    costCapitalPct: '8–12%',
    tiempoMeses: '3–6 meses',
    requiereCapex: true,
    requiereConcesion: false,
    requiereESG: false,
    pros: ['100% del ingreso va al municipio', 'Control total del activo', 'Sin procesos licitatorios prolongados'],
    contras: ['Requiere disponibilidad presupuestal', 'Riesgo operativo recae en el municipio', 'Sujeto a ciclos políticos'],
    cuando: 'Municipio con capacidad fiscal y tradición de operación de servicios públicos.',
    color: '#3B6D11', bgColor: '#EAF3DE', borderColor: '#C9DDB1',
  },
  {
    id: 'concesion',
    label: 'B — Concesión Privada',
    descripcion: 'Un operador privado financia el CAPEX a cambio del derecho de operar el CA durante 10–20 años. El municipio recibe una regalía por tonelada procesada.',
    vehiculoLegal: 'Contrato de concesión LAASSP / Ley de Concesiones estatal',
    costCapitalPct: '14–20% (TIR privada)',
    tiempoMeses: '12–18 meses (licitación)',
    requiereCapex: false,
    requiereConcesion: true,
    requiereESG: false,
    pros: ['Zero CAPEX municipal', 'Riesgo operativo al privado', 'Ingreso garantizado por contrato'],
    contras: ['Proceso licitatorio largo', 'Municipio cede parte del ingreso', 'Requiere supervisión continua'],
    cuando: 'Municipio sin presupuesto disponible pero con mercado de materiales activo que atrae operadores.',
    color: '#1A5FA8', bgColor: '#EBF3FB', borderColor: '#BDD7F5',
  },
  {
    id: 'app',
    label: 'C — Asociación Público-Privada (APP)',
    descripcion: 'El municipio y un socio privado co-invierten. El privado aporta CAPEX y tecnología; el municipio aporta el predio y la autorización. Ambos comparten ingresos y riesgos.',
    vehiculoLegal: 'LFPPP (Ley Federal de Proyectos y Asociaciones Público-Privadas)',
    costCapitalPct: '12–16%',
    tiempoMeses: '18–24 meses',
    requiereCapex: false,
    requiereConcesion: true,
    requiereESG: false,
    pros: ['Comparte riesgo con privado', 'Menor CAPEX municipal que Esquema A', 'Mayor alineación de incentivos que B'],
    contras: ['Proceso más complejo que A o B', 'Requiere capacidad de negociación del municipio', 'Marco jurídico federal robusto pero lento'],
    cuando: 'Municipio mediano con predio disponible pero sin CAPEX completo.',
    color: '#D4881E', bgColor: '#FEF7E7', borderColor: '#F5DCA0',
  },
  {
    id: 'fideicomiso',
    label: 'D — Fideicomiso Municipal',
    descripcion: 'Se crea un fideicomiso con los ingresos futuros del CA como patrimonio. El fideicomiso emite deuda respaldada por flujo futuro. El municipio no compromete su balance.',
    vehiculoLegal: 'Fideicomiso de infraestructura (FIBRA RSU) — Ley General de Títulos y Operaciones de Crédito',
    costCapitalPct: '10–14%',
    tiempoMeses: '6–12 meses',
    requiereCapex: false,
    requiereConcesion: false,
    requiereESG: false,
    pros: ['No afecta el balance municipal', 'Estructura de largo plazo', 'Puede recibir aportaciones federales'],
    contras: ['Requiere asesoría financiera especializada', 'Flujo futuro debe ser suficientemente previsible', 'Costo de estructuración 1–2% del monto'],
    cuando: 'Municipio con proyección de ingresos sólida pero sin disponibilidad de CAPEX inmediato.',
    color: '#8B6B4A', bgColor: '#FAF6F2', borderColor: '#E5D5C5',
  },
  {
    id: 'bid',
    label: 'E — Crédito BID / CAF',
    descripcion: 'Préstamo concesional de banco de desarrollo multilateral. Tasas por debajo de mercado. Requiere estudios de factibilidad y proceso de aprobación multilateral.',
    vehiculoLegal: 'Convenio de préstamo federal (requiere aval SHCP) — Ley de Disciplina Financiera',
    costCapitalPct: '5–8% (concesional)',
    tiempoMeses: '18–36 meses',
    requiereCapex: false,
    requiereConcesion: false,
    requiereESG: true,
    pros: ['Tasa más baja del mercado', 'Asistencia técnica incluida', 'Credencial de calidad internacional'],
    contras: ['Proceso largo y exigente', 'Requiere aval federal (SHCP)', 'Estándares ambientales y sociales estrictos'],
    cuando: 'Municipios metropolitanos o programas regionales de escala suficiente (>$50M MXN).',
    color: '#4A1C7A', bgColor: '#F5EFF9', borderColor: '#D8C4E8',
  },
  {
    id: 'verde',
    label: 'F — Deuda Verde BANOBRAS',
    descripcion: 'Línea de crédito verde del banco de desarrollo nacional. Específica para proyectos de economía circular, RSU y cambio climático. Requiere certificación ESG.',
    vehiculoLegal: 'Contrato de crédito simple BANOBRAS — Línea Economía Circular 2023',
    costCapitalPct: '7–10%',
    tiempoMeses: '8–14 meses',
    requiereCapex: false,
    requiereConcesion: false,
    requiereESG: true,
    pros: ['Tasas preferenciales vs. banca comercial', 'Proceso menos complejo que BID/CAF', 'Municipios de cualquier tamaño pueden aplicar'],
    contras: ['Requiere certificación GRI/SASB básica', 'Monto máximo por proyecto limitado', 'Requiere designar un Oficial de Sostenibilidad'],
    cuando: 'Municipio con voluntad política para reportar ESG y acceso a asesoría técnica básica.',
    color: '#1A5FA8', bgColor: '#EBF3FB', borderColor: '#BDD7F5',
  },
]

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

export function ArbolFinanciamientoStack() {
  const { resultados } = useSimulatorStore()
  const [selectedPath, setSelectedPath] = useState<string | null>(null)

  // Decision gate inputs
  const [tieneCapex, setTieneCapex] = useState<boolean | null>(null)
  const [tieneConcesion, setTieneConcesion] = useState<boolean | null>(null)
  const [requiereESG, setRequiereESG] = useState<boolean | null>(null)

  const capexTotal = resultados?.capexTotal ?? 5_200_000

  // Filter paths based on decision gates
  const recommendedPaths = PATHS.filter(p => {
    if (tieneCapex !== null && p.requiereCapex && !tieneCapex) return false
    if (tieneCapex !== null && !p.requiereCapex && tieneCapex) return false
    if (tieneConcesion !== null && p.requiereConcesion && !tieneConcesion) return false
    if (requiereESG !== null && p.requiereESG && !requiereESG) return false
    return true
  })

  const selected = PATHS.find(p => p.id === selectedPath)

  const fmt = (n: number) => `$${(n / 1_000_000).toFixed(1)}M MXN`

  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_288px] gap-6 items-start">
        <div className="space-y-5">

          {/* Context */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FAFAF8] px-5 py-4">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">¿Por qué importa elegir el vehículo correcto?</p>
            <p className="text-[12px] text-[#5A5750] leading-relaxed">
              El CAPEX requerido es de <strong>{fmt(capexTotal)}</strong>.
              La diferencia entre el camino más caro (banca comercial, ~22%) y el más barato (BID concesional, ~6%)
              puede representar hasta <strong>{fmt(capexTotal * 0.16 * 10)}</strong> en intereses a 10 años.
              Este módulo ayuda a identificar cuál camino es viable para el municipio antes de comprometer recursos.
            </p>
          </div>

          {/* Decision tree */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-4">Filtros de elegibilidad — Responde 3 preguntas</p>
            <div className="space-y-4">
              {/* Q1 */}
              <div className="rounded-[10px] border border-[#E8E4DC] p-4">
                <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">
                  1. ¿El municipio tiene presupuesto disponible para el CAPEX completo ({fmt(capexTotal)})?
                </p>
                <div className="flex gap-2">
                  {[{ v: true, label: 'Sí, tenemos presupuesto' }, { v: false, label: 'No, necesitamos financiar' }].map(opt => (
                    <button key={String(opt.v)} type="button"
                      onClick={() => setTieneCapex(opt.v)}
                      className={cn('flex items-center gap-2 px-4 py-2 rounded-[8px] border text-[11px] font-medium transition-colors',
                        tieneCapex === opt.v ? 'bg-[#1C2B15] text-white border-[#1C2B15]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]'
                      )}>
                      {tieneCapex === opt.v
                        ? <CheckCircle className="w-3.5 h-3.5" />
                        : <div className="w-3.5 h-3.5 rounded-full border border-[#A8A49C]" />
                      }
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="rounded-[10px] border border-[#E8E4DC] p-4">
                <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">
                  2. ¿Existe un operador privado dispuesto a operar el CA bajo contrato?
                </p>
                <div className="flex gap-2">
                  {[{ v: true, label: 'Sí, hay interés privado' }, { v: false, label: 'No, operaría el municipio' }].map(opt => (
                    <button key={String(opt.v)} type="button"
                      onClick={() => setTieneConcesion(opt.v)}
                      className={cn('flex items-center gap-2 px-4 py-2 rounded-[8px] border text-[11px] font-medium transition-colors',
                        tieneConcesion === opt.v ? 'bg-[#1C2B15] text-white border-[#1C2B15]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]'
                      )}>
                      {tieneConcesion === opt.v
                        ? <CheckCircle className="w-3.5 h-3.5" />
                        : <div className="w-3.5 h-3.5 rounded-full border border-[#A8A49C]" />
                      }
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div className="rounded-[10px] border border-[#E8E4DC] p-4">
                <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">
                  3. ¿El municipio puede comprometerse a reportar indicadores GRI/SASB básicos?
                </p>
                <div className="flex gap-2">
                  {[{ v: true, label: 'Sí, podemos reportar ESG' }, { v: false, label: 'No, sin capacidad ESG aún' }].map(opt => (
                    <button key={String(opt.v)} type="button"
                      onClick={() => setRequiereESG(opt.v)}
                      className={cn('flex items-center gap-2 px-4 py-2 rounded-[8px] border text-[11px] font-medium transition-colors',
                        requiereESG === opt.v ? 'bg-[#1C2B15] text-white border-[#1C2B15]' : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F4F2ED]'
                      )}>
                      {requiereESG === opt.v
                        ? <CheckCircle className="w-3.5 h-3.5" />
                        : <div className="w-3.5 h-3.5 rounded-full border border-[#A8A49C]" />
                      }
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Path cards */}
          <div>
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-3">
              {tieneCapex !== null || tieneConcesion !== null || requiereESG !== null
                ? `Caminos recomendados para tu perfil (${recommendedPaths.length} de ${PATHS.length})`
                : 'Los 6 caminos de financiamiento disponibles'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(recommendedPaths.length > 0 ? recommendedPaths : PATHS).map(p => (
                <button key={p.id} type="button"
                  onClick={() => setSelectedPath(p.id === selectedPath ? null : p.id)}
                  className={cn('text-left rounded-[10px] border p-4 transition-all hover:shadow-sm',
                    selectedPath === p.id ? 'ring-2' : ''
                  )}
                  style={{
                    borderColor: p.borderColor,
                    background: p.bgColor,
                    ...(selectedPath === p.id ? { outline: `2px solid ${p.color}` } : {}),
                  }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-[11px] font-bold" style={{ color: p.color }}>{p.label}</p>
                    <div className="flex gap-1.5 shrink-0">
                      <span className="text-[8px] border rounded px-1.5 py-0.5 font-mono" style={{ borderColor: p.borderColor, color: p.color }}>{p.costCapitalPct}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#6B6760] leading-snug mb-2">{p.descripcion}</p>
                  <div className="flex gap-3 text-[9px] text-[#A8A49C]">
                    <span><Clock className="inline w-2.5 h-2.5 mr-0.5" />{p.tiempoMeses}</span>
                    <span className="text-[#4A4740] font-mono text-[8px]">{p.vehiculoLegal.split(' — ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected path detail */}
          {selected && (
            <div className="rounded-[12px] border-2 p-5" style={{ borderColor: selected.borderColor, background: selected.bgColor }}>
              <p className="text-[14px] font-bold mb-3" style={{ color: selected.color }}>{selected.label} — Detalle</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                {[
                  { icon: DollarSign, label: 'Costo de capital', value: selected.costCapitalPct },
                  { icon: Clock, label: 'Tiempo de cierre', value: selected.tiempoMeses },
                  { icon: Shield, label: 'Vehículo legal', value: selected.vehiculoLegal.split(' — ')[0] },
                ].map(c => (
                  <div key={c.label} className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2.5">
                    <div className="flex items-center gap-1.5 mb-1"><c.icon className="w-3 h-3" style={{ color: selected.color }} /><p className="text-[8px] uppercase text-[#A8A49C]">{c.label}</p></div>
                    <p className="text-[12px] font-bold" style={{ color: selected.color }}>{c.value}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[9px] font-bold uppercase text-[#3B6D11] mb-1.5">Ventajas</p>
                  <ul className="space-y-1">
                    {selected.pros.map(p => (
                      <li key={p} className="flex items-start gap-1.5 text-[10px] text-[#4A4740]">
                        <CheckCircle className="w-3 h-3 text-[#3B6D11] shrink-0 mt-0.5" />{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase text-[#C0392B] mb-1.5">Consideraciones</p>
                  <ul className="space-y-1">
                    {selected.contras.map(c => (
                      <li key={c} className="flex items-start gap-1.5 text-[10px] text-[#4A4740]">
                        <XCircle className="w-3 h-3 text-[#C0392B] shrink-0 mt-0.5" />{c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t" style={{ borderColor: selected.borderColor }}>
                <p className="text-[10px] text-[#4A4740]"><TrendingUp className="inline w-3 h-3 mr-1" style={{ color: selected.color }} /><strong>Cuándo elegir este camino:</strong> {selected.cuando}</p>
              </div>
            </div>
          )}

          {/* Summary table */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0EDE5]">
              <p className="text-[11px] font-semibold text-[#1C1B18]">Comparativo de los 6 caminos</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    {['Camino', 'Costo capital', 'Tiempo', 'CAPEX municipal', 'Riesgo operativo', 'Requiere ESG'].map(h => (
                      <th key={h} className="text-left px-3 py-2.5 font-bold text-[#1C1B18] uppercase tracking-wide text-[9px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PATHS.map((p, i) => (
                    <tr key={p.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]', selectedPath === p.id && 'ring-1 ring-inset ring-[#3B6D11]')}>
                      <td className="px-3 py-2.5 font-semibold" style={{ color: p.color }}>{p.label}</td>
                      <td className="px-3 py-2.5 font-mono">{p.costCapitalPct}</td>
                      <td className="px-3 py-2.5 text-[#6B6760]">{p.tiempoMeses}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', p.requiereCapex ? 'bg-[#FDE8E8] text-[#B91C1C]' : 'bg-[#D1FAE5] text-[#065F46]')}>
                          {p.requiereCapex ? '100%' : 'Cero'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-semibold', p.requiereConcesion ? 'bg-[#EBF3FB] text-[#1A5FA8]' : 'bg-[#FEF3C7] text-[#92400E]')}>
                          {p.requiereConcesion ? 'Privado' : 'Municipal'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {p.requiereESG
                          ? <CheckCircle className="w-3.5 h-3.5 text-[#3B6D11]" />
                          : <span className="text-[#A8A49C]">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-[9px] uppercase tracking-[0.1em] text-[#A8A49C] font-bold">Contexto</p>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-[#EAF3DE] text-[#2D5A0D]">Referencia</span>
          </div>
          <RailSection title="La objeción más común" open>
            <p>"No tenemos presupuesto" — Este módulo demuestra que siempre existe un camino viable. La restricción no es el dinero, es el tiempo de estructuración.</p>
          </RailSection>
          <RailSection title="Módulos relacionados">
            <p>M13 Esquema Concesión: las opciones A/B/C/D de ese módulo se mapean directamente a estos caminos de financiamiento. M14 Retorno Financiero: el TIR determina qué esquemas son atractivos para el sector privado.</p>
          </RailSection>
          <RailSection title="Fuentes legales">
            <ul className="space-y-1">
              {['LAASSP — Licitaciones públicas', 'LFPPP — APPs federales', 'Ley de Disciplina Financiera — deuda municipal', 'BANOBRAS — Programa Economía Circular', 'BID Ciudades Sostenibles — criterios elegibilidad'].map(s => (
                <li key={s} className="flex items-start gap-1.5"><span className="mt-1 w-1 h-1 rounded-full bg-[#1A5FA8] shrink-0" />{s}</li>
              ))}
            </ul>
          </RailSection>
          <RailSection title="Condiciones de lectura">
            <p className="text-[9px] text-[#A8A49C]">Este módulo es orientativo. La estructuración financiera específica requiere asesoría jurídica y financiera especializada. Los plazos y costos son referencias de mercado 2025.</p>
          </RailSection>
        </div>
      </div>
    </div>
  )
}
