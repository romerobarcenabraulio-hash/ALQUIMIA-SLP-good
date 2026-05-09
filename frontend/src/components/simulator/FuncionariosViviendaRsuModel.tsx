'use client'

import { Database, Info } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { PRECIOS_RANGO } from '@/lib/constants'
import {
  describeMaterialPriceReference,
  getInegiHousingDistribution,
  getOperationalHousingSegments,
} from '@/lib/viviendaInegi'
import { MATERIAL_PRICE_RESEARCH } from '@/data/materialPriceResearch'
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
  const tiposVivienda = useSimulatorStore(s => s.tiposVivienda)
  const toggleTipoVivienda = useSimulatorStore(s => s.toggleTipoVivienda)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const setGenPercapita = useSimulatorStore(s => s.setGenPercapita)
  const precios = useSimulatorStore(s => s.precios)
  const setPrecio = useSimulatorStore(s => s.setPrecio)
  const resultados = useSimulatorStore(s => s.resultados)

  const distribution = getInegiHousingDistribution(zmActiva, municipiosActivos)
  const operationalSegments = getOperationalHousingSegments(zmActiva, tiposVivienda)

  return (
    <section
      className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4"
      data-testid="funcionarios-vivienda-rsu-model"
      aria-labelledby="funcionarios-vivienda-rsu-title"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Modelo institucional · vivienda y RSU</p>
          <h2 id="funcionarios-vivienda-rsu-title" className="mt-1 font-serif text-[24px] text-[#1C1B18]">
            Distribución de vivienda, generación y costo público
          </h2>
          <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
            Ajusta generación per cápita, segmentos de vivienda y precios de materiales. El header y los módulos inferiores
            se recalculan con estos supuestos; no se presentan como estadística oficial ni presupuesto aprobado.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[999px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-1 text-[11px] text-[#3B6D11]">
          <Database size={13} aria-hidden />
          INEGI Censo 2020
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="RSU activo" value={resultados ? fmt.kgd(resultados.rsuTotalTonDia) : '—'} helper="t/día recalculadas" />
        <MetricCard label="Emisiones evitables" value={resultados ? fmt.co2(resultados.co2eEvitadasAnualTon) : '—'} helper="CO₂e/año del escenario" />
        <MetricCard label="Costo gobierno" value={resultados ? fmt.mxnM(resultados.opexAnual + resultados.ahorroDisposicion) : '—'} helper="OPEX + disposición anual" />
        <MetricCard label="Salud pública" value={resultados ? fmt.mxnM(resultados.ahorroSalud) : '—'} helper="ahorro/costo social estimado" />
      </div>

      <div className="mt-4 rounded-[10px] border border-[#E8E4DC] bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor="funcionario-gen-percapita" className="text-[12px] font-medium text-[#6B6760]">
            Generación RSU per cápita
          </label>
          <span className="font-mono text-[13px] font-medium text-[#3B6D11]">{genPercapita.toFixed(2)} kg/hab/día</span>
        </div>
        <input
          id="funcionario-gen-percapita"
          type="range"
          min={0.65}
          max={1.55}
          step={0.05}
          value={genPercapita}
          onChange={event => setGenPercapita(Number(event.target.value))}
          className="mt-3 h-2 w-full cursor-pointer accent-[#3B6D11]"
        />
        <p className="mt-1 text-[10px] text-[#A8A49C]">
          Fuente base SEMARNAT DBGIR; ajuste manual del escenario. Fórmula: población activa × kg/hab/día ÷ 1000.
        </p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.15fr]">
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Hechos vivienda INEGI</p>
          {!distribution ? (
            <div className="mt-3 rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
              Sin tabulado INEGI municipal de vivienda para esta selección. No se inventan porcentajes de casa/departamento.
            </div>
          ) : (
            <>
              <p className="mt-1 text-[12px] text-[#6B6760]">
                {distribution.geographyLabel}. {distribution.retrievedLabel}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <MiniFact label="Población estatal 2020" value={fmt.num0(distribution.statePopulation2020)} />
                <MiniFact label="Viviendas habitadas 2020" value={fmt.num0(distribution.stateOccupiedDwellings2020)} />
                <MiniFact label="Ocupantes/vivienda" value={distribution.stateAvgOccupants2020.toFixed(1)} />
              </div>
              <div className="mt-3 rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
                {distribution.note}
                <p className="mt-2 font-medium">Bloqueo: {distribution.blocker}</p>
                <p className="mt-1">Siguiente acción: {distribution.nextAction}</p>
              </div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Segmentos operativos ajustables</p>
              <div className="mt-2 flex flex-wrap gap-3">
                {operationalSegments.map(tipo => {
                  const active = tipo.active
                  return (
                    <button
                      key={tipo.key}
                      type="button"
                      onClick={() => toggleTipoVivienda(tipo.key)}
                      className={cn(
                        'min-w-[165px] rounded-[10px] border px-4 py-3 text-left transition-colors',
                        active
                          ? 'border-[#3B6D11]/35 bg-[#EAF3DE] text-[#23470A]'
                          : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#A8A49C]',
                      )}
                    >
                      <span className="block text-[12px] font-medium">{tipo.label}</span>
                      <span className="mt-1 block font-mono text-[16px]">{tipo.modelSharePct.toFixed(1)}%</span>
                      <span className="mt-1 block text-[10px] leading-relaxed">{tipo.helper}</span>
                      <span className="mt-1 block text-[10px] leading-relaxed">Factor operativo {tipo.factor.toFixed(2)}x</span>
                    </button>
                  )
                })}
              </div>
              <div className="mt-3 overflow-hidden rounded-[8px] border border-[#E8E4DC]">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#F8F6F1] text-[#8C8880]">
                    <tr>
                      <th className="px-3 py-2 font-medium">Segmento</th>
                      <th className="px-3 py-2 font-medium">Peso usado</th>
                      <th className="px-3 py-2 font-medium">Fuente del porcentaje</th>
                      <th className="px-3 py-2 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operationalSegments.map(tipo => (
                      <tr key={tipo.key} className="border-t border-[#F0EDE5]">
                        <td className="px-3 py-2 text-[#1C1B18]">{tipo.label}</td>
                        <td className="px-3 py-2 font-mono text-[#1C1B18]">{tipo.modelSharePct.toFixed(1)}%</td>
                        <td className="px-3 py-2 text-[#6B6760]">Modelo operativo ALQUIMIA; pendiente tabulado INEGI municipal</td>
                        <td className="px-3 py-2 text-[#6B6760]">{tipo.active ? 'Activo en escenario' : 'Excluido del escenario'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] px-3 py-2 text-[11px] leading-relaxed text-[#6B6760]">
                <p>{distribution.source}. {distribution.confidenceLabel}</p>
                <p className="mt-1">{distribution.note}</p>
              </div>
            </>
          )}
        </div>

        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
          <div className="flex items-start gap-2">
            <Info size={14} className="mt-0.5 text-[#D4881E]" aria-hidden />
            <div>
              <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Precios de residuos</p>
              <p className="mt-1 text-[12px] text-[#6B6760]">
                Cada precio recalcula ingresos y viabilidad. La fuente visible es documental; si falta cotización local,
                el valor queda como supuesto de escenario.
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {MATERIALS.map(material => {
              const range = PRECIOS_RANGO[material]
              return (
                <div key={material} className="rounded-[8px] border border-[#F0EDE5] bg-[#FDFCFA] px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-[12px] font-medium text-[#1C1B18]" htmlFor={`precio-${material}`}>
                      {MATERIAL_LABEL[material]}
                    </label>
                    <span className="font-mono text-[12px] text-[#3B6D11]">${precios[material].toFixed(2)}/kg</span>
                  </div>
                  <input
                    id={`precio-${material}`}
                    type="range"
                    min={range.min}
                    max={range.max}
                    step={range.step}
                    value={precios[material]}
                    onChange={event => setPrecio(material, Number(event.target.value))}
                    className="mt-2 h-2 w-full cursor-pointer accent-[#3B6D11]"
                  />
                  <p className="mt-1 text-[10px] leading-snug text-[#A8A49C]">
                    {describeMaterialPriceReference(material, precios[material])}
                  </p>
                  <p className="mt-1 text-[10px] leading-snug text-[#8C8880]">
                    Mediana investigada ${MATERIAL_PRICE_RESEARCH[material].median.toFixed(2)}/kg · ancla documental ${MATERIAL_PRICE_RESEARCH[material].recommended.toFixed(2)}/kg · {MATERIAL_PRICE_RESEARCH[material].sourceCount} referencias.
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-[#A8A49C]">
        Anexo de cálculo: RSU activo = suma de segmentos vivienda activos × generación per cápita; costo gobierno = OPEX anual
        del programa + disposición evitada modelada; salud = casos evitados y ahorro poblacional estimado por el motor ALQUIMIA.
      </p>
    </section>
  )
}

function MetricCard({ label, value, helper }: { label: string; value: string; helper: string }) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 font-mono text-[18px] text-[#1C1B18]">{value}</p>
      <p className="mt-1 text-[10px] text-[#8C8880]">{helper}</p>
    </div>
  )
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2">
      <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 font-mono text-[14px] text-[#1C1B18]">{value}</p>
    </div>
  )
}
