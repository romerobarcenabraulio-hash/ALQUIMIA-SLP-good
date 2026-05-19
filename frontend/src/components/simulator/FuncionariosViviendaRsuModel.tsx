'use client'

import type { ReactNode } from 'react'
import { Check, Database } from 'lucide-react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { PRECIOS_RANGO, RSU_SEMARNAT } from '@/lib/constants'
import {
  getInegiHousingDistribution,
  getOperationalHousingSegments,
} from '@/lib/viviendaInegi'
import { cn, fmt, MATERIAL_LABELS } from '@/lib/utils'
import { MATERIAL_PRICE_RESEARCH } from '@/data/materialPriceResearch'
import type { MaterialPriceResearch } from '@/data/materialPriceResearch'
import type { PreciosMaterial } from '@/types'

// ── Price range context helper ────────────────────────────────────────────────
function priceContext(value: number, r: MaterialPriceResearch) {
  if (value < r.min)
    return { label: `Por debajo del mínimo documentado ($${r.min}/kg) · ${r.verdict}`, cls: 'text-[#D4881E]', dot: 'bg-[#D4881E]' }
  if (value > r.max)
    return { label: `Por encima del máximo documentado ($${r.max}/kg) · ${r.verdict}`, cls: 'text-[#C0392B]', dot: 'bg-[#C0392B]' }
  return { label: `Rango bibliográfico: $${r.min}–$${r.max}/kg · Mediana $${r.median}/kg`, cls: 'text-[#3B6D11]', dot: 'bg-[#3B6D11]' }
}

const MATERIALS: Array<keyof PreciosMaterial> = ['pet', 'hdpe', 'papel', 'vidrio', 'aluminio', 'organico']

const MATERIAL_LABEL: Record<keyof PreciosMaterial, string> = {
  pet: 'PET',
  hdpe: 'HDPE',
  papel: 'Papel / cartón',
  vidrio: MATERIAL_LABELS.vidrio,
  aluminio: MATERIAL_LABELS.aluminio,
  organico: 'Orgánicos',
}

export function FuncionariosViviendaRsuModel() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const tiposVivienda = useSimulatorStore(s => s.tiposVivienda)
  const toggleTipoVivienda = useSimulatorStore(s => s.toggleTipoVivienda)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const setGenPercapita = useSimulatorStore(s => s.setGenPercapita)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const setHorizonte = useSimulatorStore(s => s.setHorizonte)
  const viviendaCondominioPct = useSimulatorStore(s => s.viviendaCondominioPct)
  const setViviendaCondominioPct = useSimulatorStore(s => s.setViviendaCondominioPct)
  const setViviendaNoCondominioPct = useSimulatorStore(s => s.setViviendaNoCondominioPct)
  const viviendaCondominioDepartamentoPct = useSimulatorStore(s => s.viviendaCondominioDepartamentoPct)
  const setViviendaCondominioDepartamentoPct = useSimulatorStore(s => s.setViviendaCondominioDepartamentoPct)
  const ocupantesPorViviendaEscenario = useSimulatorStore(s => s.ocupantesPorViviendaEscenario)
  const setOcupantesPorViviendaEscenario = useSimulatorStore(s => s.setOcupantesPorViviendaEscenario)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)
  const mermaPctPorMaterial = useSimulatorStore(s => s.mermaPctPorMaterial)
  const setMermaMaterialPct = useSimulatorStore(s => s.setMermaMaterialPct)
  const costoDisposicionActivo = useSimulatorStore(s => s.costoDisposicionActivo)
  const setCostoDisposicionActivo = useSimulatorStore(s => s.setCostoDisposicionActivo)
  const costoDisposicionPorTon = useSimulatorStore(s => s.costoDisposicionPorTon)
  const setCostoDisposicionPorTon = useSimulatorStore(s => s.setCostoDisposicionPorTon)
  const precios = useSimulatorStore(s => s.precios)
  const setPrecio = useSimulatorStore(s => s.setPrecio)
  const resultados = useSimulatorStore(s => s.resultados)

  const distribution = getInegiHousingDistribution(zmActiva, municipiosActivos)
  const operationalSegments = getOperationalHousingSegments(zmActiva, tiposVivienda)
  const ocupantesBase = distribution?.stateAvgOccupants2020 ?? 3.6
  const ocupantesEscenario = ocupantesPorViviendaEscenario ?? ocupantesBase
  const viviendaNoCondominioPct = 100 - viviendaCondominioPct
  const viviendaCondominioCasaPct = 100 - viviendaCondominioDepartamentoPct
  const viviendasActivas = resultados?.vivActivas ?? distribution?.stateOccupiedDwellings2020 ?? 0
  const viviendasCondominio = viviendasActivas * viviendaCondominioPct / 100
  const viviendasCondoDepartamento = viviendasCondominio * viviendaCondominioDepartamentoPct / 100
  const viviendasCondoCasa = viviendasCondominio - viviendasCondoDepartamento
  const viviendasNoCondominio = viviendasActivas * viviendaNoCondominioPct / 100
  const capturaBasePct = pctCapturaPorAño[Math.max(0, Math.min(horizonte - 1, pctCapturaPorAño.length - 1))] ?? 70
  const pagoEvitableAnual = resultados ? resultados.ahorroDisposicion / Math.max(1, horizonte) : 0
  const poblacionAplicada = resultados?.pobActiva ?? viviendasActivas * ocupantesEscenario
  const toneladasCapturadasDia = resultados
    ? Object.values(resultados.volCapturablePorMat).reduce((sum, value) => sum + value, 0)
    : 0

  return (
    <section
      className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] overflow-hidden"
      data-testid="funcionarios-vivienda-rsu-model"
      aria-labelledby="funcionarios-vivienda-rsu-title"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-[#E8E4DC] bg-white sm:px-5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-[7px] bg-[#EAF3DE] flex items-center justify-center shrink-0">
            <Database size={14} className="text-[#3B6D11]" aria-hidden />
          </div>
          <div>
            <p id="funcionarios-vivienda-rsu-title" className="text-[12px] font-semibold text-[#1C1B18]">
              Parámetros del modelo RSU
            </p>
            <p className="text-[10px] text-[#A8A49C]">INEGI Censo 2020</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-3" data-testid="rsu-zona-unica">
        <div className="grid gap-3 lg:grid-cols-3">
          <MockupPanel
            number="1"
            title="Distribución de vivienda en condominio"
            sourceTag="INEGI Censo 2020 + supuesto editorial"
            testId="vivienda-accordion-shell"
          >
            {/* INEGI-sourced totals — read only */}
            {distribution ? (
              <div className="grid grid-cols-3 gap-2 mb-2">
                <KpiChip label="Población estatal 2020" value={fmt.num0(distribution.statePopulation2020)} />
                <KpiChip label="Viviendas habitadas 2020" value={fmt.num0(distribution.stateOccupiedDwellings2020)} />
                <KpiChip label="Ocupantes/viv. base" value={distribution.stateAvgOccupants2020.toFixed(1)} />
              </div>
            ) : (
              <p className="mb-2 text-[11px] text-amber-800 rounded-[8px] border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                Sin tabulado INEGI municipal de vivienda para esta selección.
              </p>
            )}

            {/* INEGI data gap disclosure */}
            <details className="mb-3 rounded-[7px] border border-[#E8E4DC] overflow-hidden text-[9px]">
              <summary className="cursor-pointer px-2.5 py-1.5 text-[#A8A49C] select-none list-none flex items-center gap-1.5 hover:bg-[#FAFAF8]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4881E] shrink-0" />
                Distribución casa/departamento por municipio · dato pendiente
              </summary>
              <div className="px-2.5 py-2 border-t border-[#F0EDE5] text-[#6B6760] leading-snug">
                El tabulado de clase de vivienda por municipio (Vivienda_01.xlsx, INEGI) no está cargado. Los porcentajes condominio/independiente son supuesto editorial basado en mix urbano ZM, no medición oficial.
              </div>
            </details>

            {distribution && (
              <p className="sr-only">
                {distribution.confidenceLabel} Bloqueo: {distribution.blocker} Siguiente acción:{' '}
                {distribution.nextAction} {distribution.note}
              </p>
            )}

            <div className="flex flex-wrap gap-1.5 mb-3">
              {operationalSegments.map(tipo => (
                <button
                  key={tipo.key}
                  type="button"
                  onClick={() => toggleTipoVivienda(tipo.key)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors',
                    tipo.active
                      ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]'
                      : 'border-[#E8E4DC] bg-white text-[#A8A49C]',
                  )}
                >
                  {tipo.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {/* % total en condominio/edificio — editorial assumption, INEGI no desglosa */}
              <PercentSlider
                id="vivienda-edificio-condominio"
                label="% viviendas en edificio / condominio"
                value={viviendaCondominioPct}
                min={10}
                max={60}
                step={5}
                onChange={setViviendaCondominioPct}
                confidence="bibliography"
                source="CONAVI Necesidades de Vivienda 2030 · mix urbano ZM México"
              />
              {/* Derived read-only counterpart */}
              <div className="flex items-center justify-between rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-1.5">
                <span className="text-[11px] text-[#6B6760]">Casa independiente (derivado)</span>
                <span className="font-mono text-[11px] font-semibold text-[#4A4642]">{viviendaNoCondominioPct.toFixed(0)}%</span>
              </div>

              <div className="pt-1 border-t border-[#F0EDE5]">
                <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-2">
                  Desglose interno · solo viviendas en condominio
                </p>
                {/* Internal split: INEGI does not break apartments vs houses within condominium */}
                <PercentSlider
                  id="vivienda-edificio-depto"
                  label="Departamentos (dentro de condominio)"
                  value={viviendaCondominioDepartamentoPct}
                  onChange={setViviendaCondominioDepartamentoPct}
                  confidence="assumption"
                  source="Desglose estimado · INEGI no desglosa tipo dentro de condominio"
                />
                <div className="flex items-center justify-between rounded-[8px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-1.5 mt-2">
                  <span className="text-[11px] text-[#6B6760]">Casas en condominio (derivado)</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#23470A]">
                    <Check size={12} aria-hidden />
                    {viviendaCondominioCasaPct.toFixed(0)}%
                  </span>
                </div>
              </div>

              <PercentSlider
                id="ocupantes-vivienda"
                label="Ocupantes por vivienda (escenario)"
                value={ocupantesEscenario}
                min={1}
                max={6}
                step={0.1}
                suffix=""
                display={ocupantesEscenario.toFixed(1)}
                onChange={setOcupantesPorViviendaEscenario}
                confidence="inegi"
                source={`INEGI Censo 2020 base: ${ocupantesBase.toFixed(1)} ocup./viv. · ajustable`}
              />
            </div>

            <p className="sr-only">
              Viviendas por porcentaje: Condominio {fmt.num0(viviendasCondominio)}, departamentos{' '}
              {fmt.num0(viviendasCondoDepartamento)}, casas {fmt.num0(viviendasCondoCasa)}, no condominio{' '}
              {fmt.num0(viviendasNoCondominio)}. Modelo operativo ALQUIMIA; no es porcentaje oficial INEGI.
            </p>
          </MockupPanel>

          <MockupPanel
            number="2"
            title="Ajustar RSU"
            sourceTag="SEMARNAT BDE + investigación de campo ALQUIMIA"
          >
            <div className="space-y-4">
              {/* 2.1 Generación + horizonte */}
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] font-semibold">
                  2.1 Generación y horizonte
                </p>
                <PercentSlider
                  id="funcionario-gen-percapita"
                  label="Generación RSU per cápita"
                  value={genPercapita}
                  min={0.65}
                  max={1.55}
                  step={0.05}
                  suffix=" kg/hab·día"
                  display={`${genPercapita.toFixed(2)}`}
                  onChange={setGenPercapita}
                  confidence="bibliography"
                  source="SEMARNAT BDE 2022 · rango nacional 0.65–1.55 kg/hab/día"
                />
                <div>
                  <p className="text-[11px] font-medium text-[#6B6760] mb-1.5">Horizonte del plan (años)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[3, 4, 5, 6, 7].map(year => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => setHorizonte(year)}
                        className={cn(
                          'h-8 min-w-[2rem] rounded-full border px-2.5 text-[12px] font-medium',
                          horizonte === year
                            ? 'border-[#3B6D11] bg-[#3B6D11] text-white'
                            : 'border-[#E8E4DC] bg-white text-[#6B6760]',
                        )}
                        aria-pressed={horizonte === year}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
                <div
                  className="flex items-center justify-between rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2"
                  data-testid="captura-global-summary"
                >
                  <span className="text-[11px] text-[#6B6760]">2.2 Tasa de aprovechamiento global</span>
                  <span className="font-mono text-[14px] font-semibold text-[#3B6D11]">
                    {capturaBasePct.toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* 2.3 + 2.4 Merma y precio — misma familia de variables RSU */}
              <div className="pt-3 border-t border-[#F0EDE5]">
                <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] font-semibold mb-2">
                  2.3 Merma · 2.4 Precio por tipo de RSU
                </p>
                <div className="grid grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] gap-x-2 gap-y-1.5 items-center text-[9px] uppercase tracking-[0.05em] text-[#A8A49C] mb-1">
                  <span>Material</span>
                  <span className="text-center">Merma</span>
                  <span className="text-right">Precio/kg</span>
                </div>
                <div className="space-y-2">
                  {MATERIALS.map(material => {
                    const range = PRECIOS_RANGO[material]
                    const research = MATERIAL_PRICE_RESEARCH[material]
                    return (
                      <div key={material}>
                        <div className="grid grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] gap-x-2 items-center">
                          <span className="text-[11px] text-[#1C1B18] truncate font-medium">
                            {MATERIAL_LABEL[material]}
                          </span>
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="font-mono text-[10px] text-[#D4881E]">
                              {(mermaPctPorMaterial[material] ?? 10).toFixed(0)}%
                            </span>
                            <input
                              id={`merma-${material}`}
                              type="range"
                              min={0}
                              max={60}
                              step={5}
                              value={mermaPctPorMaterial[material] ?? 10}
                              onChange={e => setMermaMaterialPct(material, Number(e.target.value))}
                              className="h-1 w-full cursor-pointer accent-[#D4881E]"
                              aria-label={`Merma ${MATERIAL_LABEL[material]}`}
                            />
                          </div>
                          <div>
                            <span className="block text-right font-mono text-[10px] text-[#3B6D11] mb-0.5">
                              ${precios[material].toFixed(2)}
                            </span>
                            <input
                              id={`precio-${material}`}
                              type="range"
                              min={range.min}
                              max={range.max}
                              step={range.step}
                              value={precios[material]}
                              onChange={e => setPrecio(material, Number(e.target.value))}
                              className="h-1 w-full cursor-pointer accent-[#3B6D11]"
                              aria-label={MATERIAL_LABEL[material]}
                            />
                          </div>
                        </div>
                        {research && (() => {
                          const ctx = priceContext(precios[material], research)
                          return (
                            <p className={cn('mt-0.5 text-[8px] leading-tight truncate', ctx.cls)} title={research.explanation}>
                              <span className={cn('w-1.5 h-1.5 rounded-full inline-block mr-1 align-middle', ctx.dot)} />
                              {ctx.label}
                            </p>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
                <p className="sr-only">Mix fijo por material. {MATERIAL_PRICE_RESEARCH.pet.sourceRefs[0]}</p>
              </div>

              <p className="sr-only">
                Captura global aplicada. La composición por material queda fija.{' '}
                {toneladasCapturadasDia.toFixed(1)} t/día capturables.
              </p>
            </div>
          </MockupPanel>

          {/* Panel 3 — Composición base del RSU · fija no editable */}
          <MockupPanel
            number="3"
            title="Composición base del RSU"
            sourceTag="SEMARNAT BDE 2022 · fija"
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="flex items-center gap-1 text-[9px] text-[#A8A49C] rounded border border-[#E8E4DC] bg-[#F4F2ED] px-1.5 py-0.5">
                No editable
              </span>
              <span className="text-[9px] text-[#A8A49C]">Referencia nacional · ciudades medias</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="shrink-0" style={{ width: 100, height: 100 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[...RSU_SEMARNAT]} cx="50%" cy="50%" innerRadius={26} outerRadius={46} dataKey="pct" strokeWidth={2} stroke="#fff">
                      {RSU_SEMARNAT.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v}%`, '']} contentStyle={{ fontSize: 10, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-0.5">
                {RSU_SEMARNAT.map(item => (
                  <div key={item.key} className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-[2px] shrink-0" style={{ background: item.color }} />
                      <span className="text-[9px] text-[#4A4740] leading-tight">{item.name}</span>
                    </div>
                    <span className="font-mono text-[10px] font-medium text-[#1C1B18]">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-2 flex items-center gap-1 text-[9px] text-[#3B6D11]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />
              No es medición de campo del municipio activo
            </p>
          </MockupPanel>
        </div>

        <MockupPanel
          number="4"
          title="Costo / comisión por tonelada enterrada"
          sourceTag="Supuesto · ref: tarifas Finanzas municipales SLP 2023"
        >
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setCostoDisposicionActivo(!costoDisposicionActivo)}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-medium shrink-0',
                costoDisposicionActivo
                  ? 'border-[#3B6D11]/35 bg-[#EAF3DE] text-[#23470A]'
                  : 'border-[#E8E4DC] bg-white text-[#6B6760]',
              )}
              aria-pressed={costoDisposicionActivo}
            >
              {costoDisposicionActivo ? 'Incluido' : 'Excluido'}
            </button>
            {costoDisposicionActivo && (
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <label htmlFor="costo-disposicion-ton" className="text-[11px] text-[#6B6760]">
                    MXN por tonelada
                  </label>
                  <span className="font-mono text-[13px] font-semibold text-[#D4881E]">
                    ${costoDisposicionPorTon.toFixed(0)}/t
                  </span>
                </div>
                <input
                  id="costo-disposicion-ton"
                  type="range"
                  min={0}
                  max={900}
                  step={20}
                  value={costoDisposicionPorTon}
                  onChange={e => setCostoDisposicionPorTon(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-[#D4881E]"
                />
              </div>
            )}
            <span className="text-[11px] font-mono text-[#6B6760] ml-auto">
              Pago evitable por entierro: {resultados ? fmt.mxnM(pagoEvitableAnual) : '—'}
            </span>
          </div>
          <p className="sr-only">sin costo operativo</p>
        </MockupPanel>
      </div>
    </section>
  )
}

// Confidence levels: inegi = measured data, bibliography = published reference, assumption = editorial
type SourceConfidence = 'inegi' | 'bibliography' | 'assumption'

const CONFIDENCE_STYLE: Record<SourceConfidence, { dot: string; text: string; label: string }> = {
  inegi:       { dot: 'bg-[#3B6D11]',  text: 'text-[#3B6D11]',  label: 'INEGI' },
  bibliography:{ dot: 'bg-[#D4881E]',  text: 'text-[#D4881E]',  label: 'Bibliografía' },
  assumption:  { dot: 'bg-[#A8A49C]',  text: 'text-[#6B6760]',  label: 'Supuesto editorial' },
}

function MockupPanel({
  number,
  title,
  sourceTag,
  children,
  className,
  testId,
}: {
  number: string
  title: string
  sourceTag?: string
  children: ReactNode
  className?: string
  testId?: string
}) {
  return (
    <article
      className={cn('rounded-[10px] border border-[#E8E4DC] bg-white p-4', className)}
      data-testid={testId}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-[13px] font-semibold text-[#1C1B18] leading-snug">
          <span className="font-mono text-[#3B6D11] mr-1">{number}.</span>
          {title}
        </h3>
        {sourceTag && (
          <span className="shrink-0 text-[8px] uppercase tracking-[0.06em] text-[#A8A49C] border border-[#E8E4DC] rounded-full px-2 py-0.5 leading-tight">
            {sourceTag}
          </span>
        )}
      </div>
      {children}
    </article>
  )
}

function KpiChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-2 py-1.5 text-center">
      <p className="text-[8px] uppercase tracking-[0.04em] text-[#A8A49C] leading-tight">{label}</p>
      <p className="mt-0.5 font-mono text-[12px] font-semibold text-[#1C1B18]">{value}</p>
    </div>
  )
}

function PercentSlider({
  id,
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 5,
  suffix = '%',
  display,
  source,
  confidence = 'assumption',
}: {
  id: string
  label: string
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  step?: number
  suffix?: string
  display?: string
  source?: string
  confidence?: SourceConfidence
}) {
  const shown = display ?? `${value.toFixed(step < 1 ? 1 : 0)}${suffix}`
  const cs = CONFIDENCE_STYLE[confidence]
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1">
        <label htmlFor={id} className="text-[11px] font-medium text-[#1C1B18] leading-snug">
          {label}
        </label>
        <span className="font-mono text-[12px] font-semibold text-[#3B6D11] shrink-0">{shown}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer accent-[#3B6D11]"
      />
      {source && (
        <p className={cn('mt-1 flex items-center gap-1 text-[9px] leading-snug', cs.text)}>
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cs.dot)} />
          <span>{cs.label} · {source}</span>
        </p>
      )}
    </div>
  )
}
