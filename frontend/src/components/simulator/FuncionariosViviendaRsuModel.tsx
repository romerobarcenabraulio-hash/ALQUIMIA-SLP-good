'use client'

import { Database, Info } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { COMPOSICION_RSU_DETALLE, PRECIOS_RANGO } from '@/lib/constants'
import {
  describeMaterialPriceReference,
  getInegiHousingDistribution,
  getOperationalHousingSegments,
} from '@/lib/viviendaInegi'
import { MATERIAL_PRICE_RESEARCH } from '@/data/materialPriceResearch'
import { cn, fmt, MATERIAL_COLORS, MATERIAL_LABELS } from '@/lib/utils'
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

const RSU_COMPOSITION = [
  {
    key: 'organico',
    label: MATERIAL_LABELS.organico,
    pct: COMPOSICION_RSU_DETALLE.organico.pct * 100,
    note: 'Fracción orgánica: restos de comida y jardín; es la principal fuente de metano si llega mezclada al relleno.',
    color: MATERIAL_COLORS.organico,
  },
  {
    key: 'papel',
    label: MATERIAL_LABELS.papel,
    pct: COMPOSICION_RSU_DETALLE.papel.pct * 100,
    note: 'Papel y cartón recuperable cuando llega seco y separado; el precio depende de pureza y comprador local.',
    color: MATERIAL_COLORS.papel,
  },
  {
    key: 'plastico',
    label: MATERIAL_LABELS.plastico,
    pct: COMPOSICION_RSU_DETALLE.plastico.pct * 100,
    note: 'Plásticos: el modelo separa PET/HDPE vía precios; no asume que todo plástico tiene el mismo valor.',
    color: MATERIAL_COLORS.plastico,
  },
  {
    key: 'vidrio',
    label: MATERIAL_LABELS.vidrio,
    pct: COMPOSICION_RSU_DETALLE.vidrio.pct * 100,
    note: 'Vidrio: alto peso y precio bajo; su viabilidad depende de logística y comprador documentado.',
    color: MATERIAL_COLORS.vidrio,
  },
  {
    key: 'metales',
    label: 'Metales',
    pct: COMPOSICION_RSU_DETALLE.metales.pct * 100,
    note: 'Metales: el aluminio es solo una parte; se valora con precio propio y merma editable.',
    color: MATERIAL_COLORS.aluminio,
  },
  {
    key: 'otros',
    label: MATERIAL_LABELS.otros,
    pct: COMPOSICION_RSU_DETALLE.otros.pct * 100,
    note: 'Rechazo: material sin valorización en este escenario; se mantiene como disposición final.',
    color: MATERIAL_COLORS.otros,
  },
]

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

  const materialMixRows = MATERIALS.map(material => {
    const grossTonDia = getMaterialGrossTonDia(material, resultados?.rsuTotalTonDia ?? 0)
    const capturableTonDia = getMaterialCapturableTonDia(material, resultados?.volCapturablePorMat ?? null)
    const mixPct = resultados && resultados.rsuTotalTonDia > 0 ? grossTonDia / resultados.rsuTotalTonDia * 100 : getMaterialReferencePct(material)
    return { material, grossTonDia, capturableTonDia, mixPct }
  })

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
            Ajusta generación per cápita, vivienda en condominio/no condominio, ocupantes por vivienda, precios de materiales
            y costo por tonelada dispuesta. El header y los módulos inferiores se recalculan con estos supuestos; no se
            presentan como estadística oficial ni presupuesto aprobado.
          </p>
          <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#1C1B18]">
            Lectura de captura: del 100% del RSU doméstico modelado, este horizonte usa una captura global de{' '}
            <strong>{capturaBasePct.toFixed(0)}%</strong>, aplicada a <strong>{fmt.num0(poblacionAplicada)}</strong> personas
            y equivalente a <strong>{toneladasCapturadasDia.toFixed(1)} t/día</strong> valorizables después de merma. El mix por
            material permanece fijo como referencia documental; lo editable por fracción es la merma operativa.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-[999px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-1 text-[11px] text-[#3B6D11]">
          <Database size={13} aria-hidden />
          INEGI Censo 2020
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <MetricCard label="RSU activo" value={resultados ? fmt.kgd(resultados.rsuTotalTonDia) : '—'} helper="t/día recalculadas" />
        <MetricCard label="Emisiones evitables" value={resultados ? fmt.co2(resultados.co2eEvitadasAnualTon) : '—'} helper="estimación modelo · CO₂e/año" />
        <MetricCard label="Pago evitable por entierro" value={resultados ? fmt.mxnM(pagoEvitableAnual) : '—'} helper={costoDisposicionActivo ? `captura × $${costoDisposicionPorTon}/t; sin costo operativo` : 'supuesto de comisión apagado'} />
        <MetricCard label="Salud pública" value={resultados ? fmt.mxnM(resultados.ahorroSalud) : '—'} helper="estimación modelo · PM2.5 e IRA" />
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.85fr]">
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
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
            Fuente: matriz Bibliografía y cálculos. Fórmula: población activa × kg/hab/día ÷ 1000; el slider es supuesto editable.
          </p>
          <div className="mt-4 rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-3" data-testid="rsu-composition-under-percapita">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Composición RSU de referencia</p>
                <h3 className="mt-1 font-serif text-[16px] text-[#1C1B18]">Qué representa cada tonelada modelada</h3>
              </div>
              <span className="rounded-full border border-[#E8E4DC] bg-white px-2.5 py-1 text-[10px] text-[#6B6760]">
                estimación_modelo · fuente en matriz
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#6B6760]">
              Estos porcentajes son una referencia documental para RSU municipal. No son medición oficial del municipio activo:
              sirven para explicar cómo se reparte el 100% del residuo antes de aplicar captura, merma y precio por material.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {RSU_COMPOSITION.map(item => (
                <div key={item.key} className="rounded-[8px] border border-[#EEEAE2] bg-white px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-[#1C1B18]">{item.label}</span>
                    <span className="font-mono text-[13px]" style={{ color: item.color }}>{item.pct.toFixed(item.pct % 1 ? 1 : 0)}%</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-[#E2DED6]">
                    <div className="h-full rounded-full" style={{ width: `${item.pct}%`, background: item.color }} />
                  </div>
                  <p className="mt-2 text-[10px] leading-snug text-[#8C8880]">{item.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-medium text-[#6B6760]">Horizonte del plan</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[3, 4, 5, 6, 7].map(year => (
              <button
                key={year}
                type="button"
                onClick={() => setHorizonte(year)}
                className={cn(
                  'h-9 w-9 rounded-full border text-[12px] transition-colors',
                  horizonte === year
                    ? 'border-[#3B6D11] bg-[#3B6D11] text-white'
                    : 'border-[#E8E4DC] bg-[#FDFCFA] text-[#6B6760]',
                )}
                aria-pressed={horizonte === year}
              >
                {year}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-[#A8A49C]">
            Control compacto: recalcula calendario, captura y ruta operativa. No es promesa de aprobación ni cronograma oficial.
          </p>
        </div>
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
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ScenarioSlider
              id="vivienda-condominio"
              label="Vivienda en propiedad de condominio"
              value={viviendaCondominioPct}
              suffix="%"
              min={0}
              max={100}
              step={5}
              onChange={setViviendaCondominioPct}
              helper="Supuesto operativo: vivienda vertical, condominios o conjuntos con administración común."
            />
            <ScenarioSlider
              id="vivienda-condominio-depto"
              label="Dentro de condominio: departamento"
              value={viviendaCondominioDepartamentoPct}
              suffix="%"
              min={0}
              max={100}
              step={5}
              onChange={setViviendaCondominioDepartamentoPct}
              helper={`El resto (${viviendaCondominioCasaPct.toFixed(0)}%) se modela como casa habitacion dentro de condominio.`}
            />
            <ScenarioSlider
              id="vivienda-no-condominio"
              label="Vivienda no sujeta a condominio"
              value={viviendaNoCondominioPct}
              suffix="%"
              min={0}
              max={100}
              step={5}
              onChange={setViviendaNoCondominioPct}
              helper="Complemento operativo: casa independiente o vivienda con entrega directa a calle."
            />
            <ScenarioSlider
              id="ocupantes-vivienda"
              label="Ocupantes por vivienda del escenario"
              value={ocupantesEscenario}
              suffix=""
              min={1}
              max={6}
              step={0.1}
              onChange={setOcupantesPorViviendaEscenario}
              helper={`INEGI 2020 estima ${ocupantesBase.toFixed(1)} ocupantes/vivienda; moverlo cambia población modelada y RSU.`}
            />
            <div className="rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] px-3 py-3 text-[11px] leading-relaxed text-[#6B6760]">
              <p className="font-medium text-[#1C1B18]">Viviendas por porcentaje</p>
              <p className="mt-1">Condominio: {fmt.num0(viviendasCondominio)} viviendas; de ellas {fmt.num0(viviendasCondoDepartamento)} deptos y {fmt.num0(viviendasCondoCasa)} casas.</p>
              <p className="mt-1">No condominio: {fmt.num0(viviendasNoCondominio)} viviendas modeladas.</p>
            </div>
            <div className="rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] px-3 py-3 text-[11px] leading-relaxed text-[#6B6760]">
              <p className="font-medium text-[#1C1B18]">Clasificación de cifra</p>
              <p className="mt-1">INEGI: fuente verificada para población, viviendas y ocupantes promedio. Condominio/no condominio: supuesto editable del escenario hasta contar con tabulado local específico.</p>
            </div>
          </div>
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

          <div className="mt-3 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] p-3" data-testid="captura-global-summary">
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">Captura global aplicada</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
              Del 100% del RSU modelado, se aplica <strong className="text-[#1C1B18]">{capturaBasePct.toFixed(0)}%</strong> de captura
              al horizonte actual: <strong className="text-[#1C1B18]">{toneladasCapturadasDia.toFixed(1)} t/día</strong> usadas para
              valorización después de mermas. La composición por material queda fija; cada material solo ajusta merma y precio.
            </p>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {MATERIALS.map(material => {
              const range = PRECIOS_RANGO[material]
              const mixRow = materialMixRows.find(row => row.material === material)
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
                  <div className="mt-3 grid gap-2 sm:grid-cols-[0.9fr_1.1fr]">
                    <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-2 py-2 text-[10px] leading-snug text-[#6B6760]">
                      <span className="block uppercase tracking-[0.06em] text-[#A8A49C]">Mix fijo</span>
                      <span className="mt-1 block font-mono text-[12px] text-[#1C1B18]">
                        {(mixRow?.mixPct ?? 0).toFixed(1)}% · {(mixRow?.grossTonDia ?? 0).toFixed(1)} t/día
                      </span>
                      <span className="mt-1 block text-[#8C8880]">Capturable: {(mixRow?.capturableTonDia ?? 0).toFixed(1)} t/día</span>
                    </div>
                    <CompactSlider
                      id={`merma-${material}`}
                      label="Merma"
                      value={mermaPctPorMaterial[material] ?? 10}
                      suffix="%"
                      min={0}
                      max={60}
                      step={5}
                      onChange={value => setMermaMaterialPct(material, value)}
                    />
                  </div>
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
          <div className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[12px] font-medium text-[#1C1B18]">Costo/comisión por tonelada enterrada</p>
                <p className="mt-1 text-[10px] leading-relaxed text-[#6B6760]">
              Supuesto de contrato o concesión por tonelada que termina enterrada. Si no hay contrato confirmado, puede apagarse
              para no mostrarlo como ahorro público.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCostoDisposicionActivo(!costoDisposicionActivo)}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] font-medium',
                  costoDisposicionActivo
                    ? 'border-[#3B6D11]/35 bg-[#EAF3DE] text-[#23470A]'
                    : 'border-[#E8E4DC] bg-white text-[#6B6760]',
                )}
                aria-pressed={costoDisposicionActivo}
              >
                {costoDisposicionActivo ? 'Incluido' : 'Excluido'}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <label htmlFor="costo-disposicion-ton" className="text-[11px] text-[#6B6760]">MXN por tonelada</label>
              <span className="font-mono text-[12px] text-[#3B6D11]">${costoDisposicionPorTon.toFixed(0)}/t</span>
            </div>
            <input
              id="costo-disposicion-ton"
              type="range"
              min={0}
              max={900}
              step={20}
              value={costoDisposicionPorTon}
              onChange={event => setCostoDisposicionPorTon(Number(event.target.value))}
              className="mt-2 h-2 w-full cursor-pointer accent-[#3B6D11]"
              disabled={!costoDisposicionActivo}
            />
            <p className="mt-2 text-[10px] leading-relaxed text-[#8C8880]">
              Cálculo: toneladas capturadas que dejarían de enterrarse × ${costoDisposicionPorTon.toFixed(0)}/t. Esto mide pago evitable
              por disposición, no costo operativo del programa ni presupuesto aprobado.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-[#A8A49C]">
        Anexo de cálculo: RSU activo = viviendas activas × ocupantes del escenario × generación per cápita; mezcla material =
        RSU activo × composición de referencia; captura global = mezcla material × {capturaBasePct.toFixed(0)}%; valorizable =
        captura global × (1 − merma); pago evitable = toneladas capturadas no enterradas × comisión por tonelada.
      </p>
    </section>
  )
}

function getMaterialReferencePct(material: keyof PreciosMaterial) {
  if (material === 'pet') return COMPOSICION_RSU_DETALLE.plastico.pct * COMPOSICION_RSU_DETALLE.plastico.petPct * 100
  if (material === 'hdpe') return COMPOSICION_RSU_DETALLE.plastico.pct * (1 - COMPOSICION_RSU_DETALLE.plastico.petPct) * 100
  if (material === 'papel') return COMPOSICION_RSU_DETALLE.papel.pct * 100
  if (material === 'vidrio') return COMPOSICION_RSU_DETALLE.vidrio.pct * 100
  if (material === 'aluminio') return COMPOSICION_RSU_DETALLE.metales.pct * COMPOSICION_RSU_DETALLE.metales.aluminioPct * 100
  return COMPOSICION_RSU_DETALLE.organico.pct * 100
}

function getMaterialGrossTonDia(material: keyof PreciosMaterial, rsuTotalTonDia: number) {
  return rsuTotalTonDia * getMaterialReferencePct(material) / 100
}

function getMaterialCapturableTonDia(
  material: keyof PreciosMaterial,
  volCapturablePorMat: Record<string, number> | null,
) {
  if (!volCapturablePorMat) return 0
  if (material === 'pet') return (volCapturablePorMat.plastico ?? 0) * COMPOSICION_RSU_DETALLE.plastico.petPct
  if (material === 'hdpe') return (volCapturablePorMat.plastico ?? 0) * (1 - COMPOSICION_RSU_DETALLE.plastico.petPct)
  if (material === 'papel') return volCapturablePorMat.papel ?? 0
  if (material === 'vidrio') return volCapturablePorMat.vidrio ?? 0
  if (material === 'aluminio') return volCapturablePorMat.aluminio ?? 0
  return volCapturablePorMat.organico ?? 0
}

function ScenarioSlider({
  id,
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
  helper,
}: {
  id: string
  label: string
  value: number
  suffix: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  helper: string
}) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-[11px] font-medium text-[#1C1B18]">{label}</label>
        <span className="font-mono text-[12px] text-[#3B6D11]">{value.toFixed(step < 1 ? 1 : 0)}{suffix}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="mt-2 h-2 w-full cursor-pointer accent-[#3B6D11]"
      />
      <p className="mt-1 text-[10px] leading-relaxed text-[#8C8880]">{helper}</p>
    </div>
  )
}

function CompactSlider({
  id,
  label,
  value,
  suffix,
  min,
  max,
  step,
  onChange,
}: {
  id: string
  label: string
  value: number
  suffix: string
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-[10px] text-[#6B6760]">{label}</label>
        <span className="font-mono text-[10px] text-[#3B6D11]">{value.toFixed(0)}{suffix}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={event => onChange(Number(event.target.value))}
        className="mt-1 h-1.5 w-full cursor-pointer accent-[#3B6D11]"
      />
    </div>
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
