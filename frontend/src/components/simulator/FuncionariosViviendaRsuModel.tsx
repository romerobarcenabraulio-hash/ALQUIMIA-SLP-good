'use client'

import { Database, Info } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { PRECIOS_RANGO, RSU_SEMARNAT } from '@/lib/constants'
import { getInegiHousingDistribution } from '@/lib/viviendaInegi'
import { cn, fmt, MATERIAL_LABELS } from '@/lib/utils'
import type { PreciosMaterial } from '@/types'

const MATERIALS: Array<keyof PreciosMaterial> = ['pet', 'hdpe', 'papel', 'vidrio', 'aluminio', 'organico']

const MATERIAL_LABEL: Record<keyof PreciosMaterial, string> = {
  pet: 'PET',
  hdpe: 'HDPE',
  papel: 'Papel / carton',
  vidrio: MATERIAL_LABELS.vidrio,
  aluminio: MATERIAL_LABELS.aluminio,
  organico: 'Organico / composta',
}

export function FuncionariosViviendaRsuModel() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const setGenPercapita = useSimulatorStore(s => s.setGenPercapita)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const setHorizonte = useSimulatorStore(s => s.setHorizonte)
  const ocupantesPorViviendaEscenario = useSimulatorStore(s => s.ocupantesPorViviendaEscenario)
  const setOcupantesPorViviendaEscenario = useSimulatorStore(s => s.setOcupantesPorViviendaEscenario)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)
  const costoDisposicionActivo = useSimulatorStore(s => s.costoDisposicionActivo)
  const setCostoDisposicionActivo = useSimulatorStore(s => s.setCostoDisposicionActivo)
  const costoDisposicionPorTon = useSimulatorStore(s => s.costoDisposicionPorTon)
  const setCostoDisposicionPorTon = useSimulatorStore(s => s.setCostoDisposicionPorTon)
  const precios = useSimulatorStore(s => s.precios)
  const setPrecio = useSimulatorStore(s => s.setPrecio)
  const resultados = useSimulatorStore(s => s.resultados)

  const distribution = getInegiHousingDistribution(zmActiva, municipiosActivos)
  const ocupantesBase = distribution?.stateAvgOccupants2020 ?? 3.6
  const ocupantesEscenario = ocupantesPorViviendaEscenario ?? ocupantesBase
  const viviendasActivas = resultados?.vivActivas ?? distribution?.stateOccupiedDwellings2020 ?? 0
  const capturaBasePct = pctCapturaPorAño[Math.max(0, Math.min(horizonte - 1, pctCapturaPorAño.length - 1))] ?? 70
  const poblacionAplicada = resultados?.pobActiva ?? viviendasActivas * ocupantesEscenario
  const toneladasCapturadasDia = resultados
    ? Object.values(resultados.volCapturablePorMat).reduce((sum, value) => sum + value, 0)
    : 0

  return (
    <section
      className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden"
      data-testid="funcionarios-vivienda-rsu-model"
      aria-labelledby="funcionarios-vivienda-rsu-title"
    >
      {/* ── Header row ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[#E8E4DC] bg-[#FDFCFA]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-[#EAF3DE] flex items-center justify-center shrink-0">
            <Database size={14} className="text-[#3B6D11]" aria-hidden />
          </div>
          <div>
            <p id="funcionarios-vivienda-rsu-title" className="text-[12px] font-semibold text-[#1C1B18] leading-tight">
              Parámetros del modelo RSU
            </p>
            <p className="text-[10px] text-[#A8A49C] leading-tight">Supuestos editables · INEGI Censo 2020</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="font-mono text-[#3B6D11] font-medium">
            {resultados ? fmt.kgd(resultados.rsuTotalTonDia) : '—'}
          </span>
          <span className="text-[#A8A49C]">t/día</span>
          <span className="mx-1 text-[#E8E4DC]">|</span>
          <span className="font-mono text-[#D4881E] font-medium">
            {resultados ? fmt.co2(resultados.co2eEvitadasAnualTon) : '—'}
          </span>
          <span className="text-[#A8A49C]">CO₂e/año</span>
        </div>
      </div>

      {/* ── 3-column controls ────────────────────────────────────────── */}
      <div className="grid md:grid-cols-3 divide-x divide-[#F0EDE5]">

        {/* Col 1 · Composición RSU SEMARNAT — donut + leyenda */}
        <div className="px-5 py-4">
          <p className="text-[11px] font-medium text-[#6B6760] mb-3">Composición RSU · SEMARNAT</p>
          <div className="flex items-center gap-3">
            <div className="w-[88px] h-[88px] shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[...RSU_SEMARNAT]}
                    cx="50%" cy="50%"
                    innerRadius={24} outerRadius={40}
                    dataKey="pct"
                    strokeWidth={0}
                  >
                    {RSU_SEMARNAT.map(item => (
                      <Cell key={item.key} fill={item.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`${v.toFixed(0)}%`]}
                    contentStyle={{ fontSize: 10, padding: '2px 6px', borderRadius: 6 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-1.5 text-[10px] min-w-0">
              {RSU_SEMARNAT.map(item => (
                <div key={item.key} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                  <span className="text-[#6B6760] truncate flex-1">{item.name}</span>
                  <span className="font-mono shrink-0 font-medium" style={{ color: item.color }}>
                    {item.pct}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Col 2 · Gen per cápita + Horizonte + ocupantes */}
        <div className="px-5 py-4 space-y-4">
          {/* Gen per cápita — moved here from Col 1 */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="funcionario-gen-percapita" className="text-[11px] font-medium text-[#6B6760]">
                Generación per cápita
              </label>
              <span className="font-mono text-[13px] font-semibold text-[#3B6D11]">{genPercapita.toFixed(2)} kg/hab/d</span>
            </div>
            <input
              id="funcionario-gen-percapita"
              type="range" min={0.65} max={1.55} step={0.05} value={genPercapita}
              onChange={e => setGenPercapita(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-[#3B6D11]"
            />
          </div>
          <div>
            <p className="text-[11px] font-medium text-[#6B6760] mb-2">Horizonte del plan</p>
            <div className="flex gap-2">
              {[3, 4, 5, 6, 7].map(year => (
                <button
                  key={year} type="button" onClick={() => setHorizonte(year)}
                  className={cn(
                    'h-8 w-8 rounded-full border text-[12px] font-medium transition-colors',
                    horizonte === year ? 'border-[#3B6D11] bg-[#3B6D11] text-white' : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760] hover:border-[#3B6D11]/40',
                  )}
                  aria-pressed={horizonte === year}
                >{year}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label htmlFor="ocupantes-vivienda" className="text-[11px] font-medium text-[#6B6760]">
                Ocupantes / vivienda
              </label>
              <span className="font-mono text-[13px] font-semibold text-[#3B6D11]">{ocupantesEscenario.toFixed(1)}</span>
            </div>
            <input
              id="ocupantes-vivienda"
              type="range" min={1} max={6} step={0.1} value={ocupantesEscenario}
              onChange={e => setOcupantesPorViviendaEscenario(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-[#3B6D11]"
            />
            <p className="mt-1 text-[10px] text-[#A8A49C]">INEGI 2020: {ocupantesBase.toFixed(1)} promedio estatal</p>
          </div>
          <div className="rounded-[8px] bg-[#F8F6F1] px-3 py-2">
            <p className="text-[10px] text-[#A8A49C] mb-1">Captura global al horizonte</p>
            <p className="font-mono text-[14px] font-semibold text-[#1C1B18]">{capturaBasePct.toFixed(0)}%</p>
            <p className="text-[10px] text-[#6B6760]">{toneladasCapturadasDia.toFixed(1)} t/día · {fmt.num0(poblacionAplicada)} hab.</p>
          </div>
        </div>

        {/* Col 3 · Precios materiales + costo disposición */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Info size={13} className="text-[#D4881E]" aria-hidden />
              <p className="text-[11px] font-medium text-[#6B6760]">Precios por material</p>
            </div>
            <button
              type="button"
              onClick={() => setCostoDisposicionActivo(!costoDisposicionActivo)}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border font-medium transition-colors',
                costoDisposicionActivo ? 'border-[#3B6D11]/35 bg-[#EAF3DE] text-[#23470A]' : 'border-[#E8E4DC] bg-white text-[#A8A49C]',
              )}
              aria-pressed={costoDisposicionActivo}
            >
              {costoDisposicionActivo ? `$${costoDisposicionPorTon}/t` : 'Entierro excluido'}
            </button>
          </div>
          <div className="space-y-2">
            {MATERIALS.map(material => {
              const range = PRECIOS_RANGO[material]
              return (
                <div key={material}>
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`precio-${material}`} className="text-[10px] text-[#6B6760]">
                      {MATERIAL_LABEL[material]}
                    </label>
                    <span className="font-mono text-[11px] text-[#3B6D11] font-medium">${precios[material].toFixed(2)}/kg</span>
                  </div>
                  <input
                    id={`precio-${material}`}
                    type="range" min={range.min} max={range.max} step={range.step} value={precios[material]}
                    onChange={e => setPrecio(material, Number(e.target.value))}
                    className="mt-0.5 h-1.5 w-full cursor-pointer accent-[#3B6D11]"
                  />
                </div>
              )
            })}
          </div>
          {costoDisposicionActivo && (
            <div className="mt-3">
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="costo-disposicion-ton" className="text-[10px] text-[#6B6760]">$/tonelada enterrada</label>
                <span className="font-mono text-[11px] text-[#D4881E]">${costoDisposicionPorTon}/t</span>
              </div>
              <input
                id="costo-disposicion-ton"
                type="range" min={0} max={900} step={20} value={costoDisposicionPorTon}
                onChange={e => setCostoDisposicionPorTon(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-[#D4881E]"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

