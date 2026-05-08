'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt, cn } from '@/lib/utils'
import { Slider } from '@/components/ui/Slider'
import { ZMS } from '@/lib/constants'
import { getInegiHousingDistribution } from '@/lib/viviendaInegi'

const TIPOS = [
  { key: 'vertical' as const, label: 'Departamento en edificio', factor: 1.00 },
  { key: 'casa' as const,     label: 'Casa independiente',       factor: 0.95 },
]

export function TipoVivienda() {
  const { zmActiva, municipiosActivos, tiposVivienda, toggleTipoVivienda, genPercapita, setGenPercapita, resultados } = useSimulatorStore()
  const zm = ZMS.find(z => z.id === zmActiva)!
  const distribution = getInegiHousingDistribution(zmActiva, municipiosActivos)

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S7 — Tipo de vivienda</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-4">Segmentación por vivienda</h2>

      {/* Tipos activos */}
      <div className="flex gap-3 mb-6 flex-wrap">
        {TIPOS.map(t => {
          const active = tiposVivienda.includes(t.key)
          const inegiCategory = distribution?.categories.find(c => c.operationalType === t.key)
          const pct    = Math.round((inegiCategory?.pct ?? zm.mixVivienda[t.key]) * 100)
          return (
            <button
              key={t.key}
              onClick={() => toggleTipoVivienda(t.key)}
              className={cn(
                'flex flex-col items-start gap-1 px-4 py-3 rounded-[10px] border transition-all min-w-[120px]',
                active
                  ? 'bg-[#EAF3DE] border-[#3B6D11]/30 text-[#3B6D11]'
                  : 'bg-[#FDFCFA] border-[#E8E4DC] text-[#A8A49C]'
              )}
            >
              <span className="text-[12px] font-medium">{t.label}</span>
              <span className="font-mono text-[18px]">{pct}%</span>
              <span className="text-[10px]">INEGI · factor {t.factor}x</span>
            </button>
          )
        })}
      </div>
      <p className="mb-4 text-[10px] leading-relaxed text-[#A8A49C]">
        Fuente: INEGI Censo 2020 / tabulados de vivienda. No se muestra residencial como categoría INEGI literal.
      </p>

      {/* Slider generación per cápita */}
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-5 mb-6">
        <Slider
          label="Generación per cápita"
          value={genPercapita}
          min={0.70} max={1.50} step={0.05}
          unit=" kg/hab/día"
          source="SEMARNAT DBGIR 2022"
          onChange={setGenPercapita}
          formatValue={v => `${v.toFixed(2)} kg/hab/día`}
        />
      </div>

      {/* Tabla RSU por tipo */}
      {resultados && (
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[#E8E4DC]">
                <th className="text-left py-2 text-[#A8A49C] font-medium">Tipo</th>
                <th className="text-right py-2 text-[#A8A49C] font-medium font-mono">RSU t/día</th>
                <th className="text-right py-2 text-[#A8A49C] font-medium font-mono">Viviendas</th>
              </tr>
            </thead>
            <tbody>
              {TIPOS.map(t => {
                const rsu = resultados.rsuPorTipo[t.key]
                const inegiCategory = distribution?.categories.find(c => c.operationalType === t.key)
                const viv = Math.round(resultados.vivActivas * (inegiCategory?.pct ?? zm.mixVivienda[t.key]))
                const active = tiposVivienda.includes(t.key)
                return (
                  <tr key={t.key} className={cn('border-b border-[#F0EDE5]', !active && 'opacity-40')}>
                    <td className="py-2 text-[#1C1B18]">{t.label}</td>
                    <td className="py-2 text-right font-mono text-[#1C1B18]">{fmt.num(rsu)}</td>
                    <td className="py-2 text-right font-mono text-[#6B6760]">{fmt.num0(viv)}</td>
                  </tr>
                )
              })}
              <tr className="font-medium">
                <td className="py-2 text-[#1C1B18]">Total activo</td>
                <td className="py-2 text-right font-mono text-[#3B6D11]">{fmt.num(resultados.rsuTotalTonDia)}</td>
                <td className="py-2 text-right font-mono text-[#6B6760]">{fmt.num0(resultados.vivActivas)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
