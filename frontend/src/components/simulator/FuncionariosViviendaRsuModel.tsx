'use client'

import type { ReactNode } from 'react'
import { Check, Database, Lock } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { PRECIOS_RANGO } from '@/lib/constants'
import {
  getInegiHousingDistribution,
  getOperationalHousingSegments,
} from '@/lib/viviendaInegi'
import { cn, fmt, MATERIAL_LABELS } from '@/lib/utils'
import type { PreciosMaterial } from '@/types'

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
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <div>
            <dt className="text-[#A8A49C]">RSU</dt>
            <dd className="font-mono font-semibold text-[#3B6D11]">
              {resultados ? fmt.kgd(resultados.rsuTotalTonDia) : '—'} t/día
            </dd>
          </div>
          <div>
            <dt className="text-[#A8A49C]">Captura</dt>
            <dd className="font-mono font-semibold text-[#1C1B18]">{capturaBasePct.toFixed(0)}%</dd>
          </div>
          <div>
            <dt className="text-[#A8A49C]">Población</dt>
            <dd className="font-mono font-semibold text-[#4A4642]">{fmt.num0(poblacionAplicada)}</dd>
          </div>
          <div>
            <dt className="text-[#A8A49C]">Capturable</dt>
            <dd className="font-mono font-semibold text-[#3B6D11]">{toneladasCapturadasDia.toFixed(1)} t/d</dd>
          </div>
        </dl>
      </div>

      <div className="p-4 sm:p-5 space-y-3" data-testid="rsu-zona-unica">
        <div className="grid gap-3 lg:grid-cols-2">
          <MockupPanel
            number="1"
            title="Distribución de vivienda en condominio"
            testId="vivienda-accordion-shell"
          >
            {distribution ? (
              <div className="grid grid-cols-3 gap-2 mb-3">
                <KpiChip label="Población estatal 2020" value={fmt.num0(distribution.statePopulation2020)} />
                <KpiChip label="Viviendas habitadas 2020" value={fmt.num0(distribution.stateOccupiedDwellings2020)} />
                <KpiChip label="Ocupantes/viv." value={distribution.stateAvgOccupants2020.toFixed(1)} />
              </div>
            ) : (
              <p className="mb-3 text-[11px] text-amber-800 rounded-[8px] border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                Sin tabulado INEGI municipal de vivienda para esta selección.
              </p>
            )}

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
              <PercentSlider
                id="vivienda-edificio-depto"
                label="Departamentos"
                value={viviendaCondominioDepartamentoPct}
                onChange={setViviendaCondominioDepartamentoPct}
              />
              <PercentSlider
                id="vivienda-condominio-casa"
                label="Casas"
                value={viviendaCondominioCasaPct}
                onChange={v => setViviendaCondominioDepartamentoPct(100 - v)}
              />
              <div className="flex items-center justify-between rounded-[8px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-1.5">
                <span className="text-[11px] font-medium text-[#3B6D11]">Total condominio</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#23470A]">
                  <Check size={12} aria-hidden />
                  100%
                </span>
              </div>
              <PercentSlider
                id="vivienda-edificio-condominio"
                label="Vivienda en edificio (condominio / vertical)"
                value={viviendaCondominioPct}
                onChange={setViviendaCondominioPct}
              />
              <PercentSlider
                id="vivienda-casa-independiente"
                label="Vivienda en casa (no condominio)"
                value={viviendaNoCondominioPct}
                onChange={setViviendaNoCondominioPct}
              />
              <PercentSlider
                id="ocupantes-vivienda"
                label="Ocupantes por vivienda del escenario"
                value={ocupantesEscenario}
                min={1}
                max={6}
                step={0.1}
                suffix=""
                display={ocupantesEscenario.toFixed(1)}
                onChange={setOcupantesPorViviendaEscenario}
              />
            </div>

            <p className="sr-only">
              Viviendas por porcentaje: Condominio {fmt.num0(viviendasCondominio)}, departamentos{' '}
              {fmt.num0(viviendasCondoDepartamento)}, casas {fmt.num0(viviendasCondoCasa)}, no condominio{' '}
              {fmt.num0(viviendasNoCondominio)}. Modelo operativo ALQUIMIA; no es porcentaje oficial INEGI.
            </p>
          </MockupPanel>

          <MockupPanel number="2" title="Ajustar RSU">
            <p className="text-[11px] text-[#A8A49C] mb-3">2.1 Trayectoria de captura · preset en Módulo 3</p>
            <div className="space-y-3">
              <PercentSlider
                id="funcionario-gen-percapita"
                label="Generación RSU per cápita"
                value={genPercapita}
                min={0.65}
                max={1.55}
                step={0.05}
                suffix=" kg/hab/día"
                display={`${genPercapita.toFixed(2)}`}
                onChange={setGenPercapita}
              />
              <div>
                <p className="text-[11px] font-medium text-[#6B6760] mb-1.5">Horizonte del plan</p>
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
              <p className="sr-only">
                Captura global aplicada. La composición por material queda fija.{' '}
                {toneladasCapturadasDia.toFixed(1)} t/día capturables.
              </p>
            </div>
          </MockupPanel>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.4fr_0.6fr]">
          <MockupPanel number="2" title="Merma y precio por tipo de RSU" className="lg:col-span-1">
            <div className="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] gap-x-3 gap-y-2 items-center text-[10px] uppercase tracking-[0.05em] text-[#A8A49C] mb-1">
              <span>Material</span>
              <span className="text-center">Merma · mix fijo</span>
              <span className="text-right">Precio</span>
            </div>
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-0.5">
              {MATERIALS.map(material => {
                const range = PRECIOS_RANGO[material]
                return (
                  <div
                    key={material}
                    className="grid grid-cols-[minmax(0,1fr)_88px_minmax(0,1fr)] gap-x-3 gap-y-0.5 items-center"
                  >
                    <label htmlFor={`precio-${material}`} className="text-[11px] text-[#1C1B18] truncate">
                      {MATERIAL_LABEL[material]}
                    </label>
                    <div className="flex flex-col items-center gap-0.5">
                      <span className="font-mono text-[10px] text-[#3B6D11]">
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
                        className="h-1 w-full cursor-pointer accent-[#8CAA7A]"
                        aria-label={`Merma ${MATERIAL_LABEL[material]}`}
                      />
                    </div>
                    <div>
                      <span className="block text-right font-mono text-[10px] text-[#3B6D11] mb-0.5">
                        ${precios[material].toFixed(2)}/kg
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
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="sr-only">Mix fijo por material. Investigacion_Precios_RSU_SLP</p>
          </MockupPanel>

          <div
            className="flex flex-col justify-center rounded-[10px] border border-dashed border-[#D7E8C0] bg-[#F6FAEF] px-4 py-4"
            data-testid="rsu-composition-under-percapita"
          >
            <div className="flex items-start gap-2">
              <Lock size={16} className="text-[#8CAA7A] shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="text-[11px] font-semibold text-[#3B6D11]">3. Composición base del RSU</p>
                <p className="mt-1 text-[11px] text-[#6B6760]">Fija · no editable</p>
                <p className="mt-1 text-[10px] text-[#A8A49C]">Ver gráfica en Módulo 1</p>
              </div>
            </div>
            <p className="sr-only">
              Composición RSU de referencia. No son medición oficial del municipio activo.
            </p>
          </div>
        </div>

        <MockupPanel number="4" title="Costo / comisión por tonelada enterrada">
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

function MockupPanel({
  number,
  title,
  children,
  className,
  testId,
}: {
  number: string
  title: string
  children: ReactNode
  className?: string
  testId?: string
}) {
  return (
    <article
      className={cn('rounded-[10px] border border-[#E8E4DC] bg-white p-4', className)}
      data-testid={testId}
    >
      <h3 className="text-[13px] font-semibold text-[#1C1B18] leading-snug">
        <span className="font-mono text-[#3B6D11] mr-1">{number}.</span>
        {title}
      </h3>
      <div className="mt-3">{children}</div>
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
}) {
  const shown = display ?? `${value.toFixed(step < 1 ? 1 : 0)}${suffix}`
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
    </div>
  )
}
