'use client'

import type { ReactNode } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { ZMS } from '@/lib/constants'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import type { FuenteTipo, ResultadosCalculados } from '@/types'

function KpiCompareRow({
  sinProgramaLabel,
  deltaLabel,
}: {
  sinProgramaLabel: string | null
  deltaLabel: string | null
}) {
  const onlyArrow = sinProgramaLabel == null && deltaLabel == null
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-1">
      {sinProgramaLabel != null && (
        <span className="text-[10px] text-[#A8A49C]">Sin programa: {sinProgramaLabel}</span>
      )}
      {!onlyArrow && (
        <span className="text-[10px] font-medium text-[#3B6D11]">
          ↑ {deltaLabel ?? 'vs. escenario sin programa'}
        </span>
      )}
      {onlyArrow && (
        <span className="text-[10px] font-medium text-[#3B6D11]">↑ vs. escenario sin programa</span>
      )}
    </div>
  )
}

function compareRsu(r: ResultadosCalculados, b: ResultadosCalculados | null) {
  if (!b) return { sinProgramaLabel: null as string | null, deltaLabel: null as string | null }
  const same = Math.abs(r.rsuTotalTonDia - b.rsuTotalTonDia) < 1e-6
  if (same) return { sinProgramaLabel: null, deltaLabel: null }
  return { sinProgramaLabel: fmt.kgd(b.rsuTotalTonDia), deltaLabel: null }
}

function compareIngreso(r: ResultadosCalculados, b: ResultadosCalculados | null, horizonte: number) {
  if (!b) return { sinProgramaLabel: null as string | null, deltaLabel: null as string | null }
  const p = r.ingresosBrutos / Math.max(1, horizonte)
  const bs = b.ingresosBrutos / Math.max(1, horizonte)
  const sinProgramaLabel = fmt.mxnM(bs)
  const denom = Math.max(bs, 1e-9)
  const relGain = (p - bs) / denom
  if (p <= bs * 1.002 || relGain <= 0.008) return { sinProgramaLabel, deltaLabel: null }
  const pct = relGain * 100
  const deltaLabel = `+${pct < 10 ? pct.toFixed(1) : Math.round(pct)}%`
  return { sinProgramaLabel, deltaLabel }
}

function compareCo2(r: ResultadosCalculados, b: ResultadosCalculados | null) {
  if (!b) return { sinProgramaLabel: null as string | null, deltaLabel: null as string | null }
  const p = r.co2eEvitadasAnualTon
  const bs = b.co2eEvitadasAnualTon
  const sinProgramaLabel = `${(bs / 1000).toFixed(0)}K t`
  if (p <= bs + 0.05) return { sinProgramaLabel, deltaLabel: null }
  const d = p - bs
  const deltaLabel =
    d >= 1000 ? `+${(d / 1000).toFixed(1)}K t` : `+${Math.max(1, Math.round(d))} t`
  return { sinProgramaLabel, deltaLabel }
}

function compareEmpleos(r: ResultadosCalculados, b: ResultadosCalculados | null) {
  if (!b) return { sinProgramaLabel: null as string | null, deltaLabel: null as string | null }
  const p = r.empleosTotalesDirectos
  const bs = b.empleosTotalesDirectos
  const sinProgramaLabel = fmt.num0(bs)
  if (p <= bs + 0.5) return { sinProgramaLabel, deltaLabel: null }
  return { sinProgramaLabel, deltaLabel: `+${Math.round(p - bs)} empleos` }
}

export function SectionHero() {
  const audience = useSimulatorStore(s => s.audience)
  const { resultados, resultadosSinPrograma, zmActiva, snapshotDatos, horizonte } = useSimulatorStore()
  const zm = ZMS.find(z => z.id === zmActiva)

  // Provenance de los KPIs del header — viene del snapshot cuando disponible
  const pobKpi  = snapshotDatos?.kpis.find(k => k.kpi_id === 'poblacion_total')
  const genKpi  = snapshotDatos?.kpis.find(k => k.kpi_id === 'gen_percapita_kg_dia')

  return (
    <div>
      {audience === 'citizen' ? (
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">
          Vista ciudadana · análisis orientativo
        </p>
      ) : (
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">
          S1 — Plataforma de circularidad municipal
        </p>
      )}
      <h1 className="font-serif text-[38px] leading-[1.05] tracking-[-0.02em] text-[#1C1B18] mb-4 max-w-2xl">
        Transforma los residuos de{' '}
        <span className="text-[#3B6D11]">{zm?.nombre ?? 'tu ciudad'}</span>{' '}
        en un motor económico
      </h1>
      <p className="text-[15px] text-[#6B6760] max-w-2xl mb-8 leading-relaxed">
        El simulador ALQUIMIA calcula en tiempo real el impacto financiero, ambiental y social
        de un programa de valorización de RSU. Configura tu escenario, observa los números cambiar
        y avanza módulo a módulo en un paquete de trabajo consultivo: la profundidad de la entrega
        depende de los módulos y validaciones que completes.
      </p>

      {/* Métricas globales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricGlobal
          label="RSU generado diario"
          value={resultados ? fmt.kgd(resultados.rsuTotalTonDia) : '—'}
          sub={`${resultados?.pobActiva?.toLocaleString('es-MX') ?? zm?.totalPop?.toLocaleString('es-MX') ?? '—'} hab activos`}
          // RSU depende de población (INEGI) + gen per cápita (SEMARNAT)
          provenance={pobKpi?.provenance.tipo ?? genKpi?.provenance.tipo}
          provenanceFuente={pobKpi ? `${pobKpi.provenance.fuente_nombre} + SEMARNAT` : undefined}
          compare={
            resultados ? (
              <KpiCompareRow {...compareRsu(resultados, resultadosSinPrograma)} />
            ) : undefined
          }
        />
        <MetricGlobal
          label="Ingreso potencial/año"
          value={resultados ? fmt.mxnM(resultados.ingresosBrutos / Math.max(1, horizonte)) : '—'}
          sub="a plena cobertura"
          color="text-[#3B6D11]"
          compare={
            resultados ? (
              <KpiCompareRow {...compareIngreso(resultados, resultadosSinPrograma, horizonte)} />
            ) : undefined
          }
        />
        <MetricGlobal
          label="CO₂e a evitar/año"
          value={resultados ? `${(resultados.co2eEvitadasAnualTon / 1000).toFixed(0)}K t` : '—'}
          sub="tCO₂e — año final"
          color="text-[#1A5FA8]"
          // CO2e depende de gen per cápita (SEMARNAT)
          provenance={genKpi?.provenance.tipo}
          provenanceFuente={genKpi?.provenance.fuente_nombre}
          compare={
            resultados ? (
              <KpiCompareRow {...compareCo2(resultados, resultadosSinPrograma)} />
            ) : undefined
          }
        />
        <MetricGlobal
          label="Empleos directos"
          value={resultados ? fmt.num0(resultados.empleosTotalesDirectos) : '—'}
          sub="en el programa"
          compare={
            resultados ? (
              <KpiCompareRow {...compareEmpleos(resultados, resultadosSinPrograma)} />
            ) : undefined
          }
        />
      </div>

      {/* Advertencias de datos cuando hay baja confianza */}
      {snapshotDatos?.advertencias.some(a => a.bloquea_agora) && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-[10px] px-4 py-3">
          <p className="text-[12px] font-medium text-red-800">
            ⚠ Datos con calidad insuficiente para ÁGORA — revisa la sección Fuentes de Datos
          </p>
        </div>
      )}
    </div>
  )
}

interface MetricGlobalProps {
  label:            string
  value:            string
  sub:              string
  color?:           string
  provenance?:      FuenteTipo
  provenanceFuente?: string
  compare?:         ReactNode
}

function MetricGlobal({ label, value, sub, color, provenance, provenanceFuente, compare }: MetricGlobalProps) {
  return (
    <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-4 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-wide text-[#A8A49C]">{label}</p>
        {provenance && (
          <ProvenanceBadge
            tipo={provenance}
            fuente={provenanceFuente}
            compact
          />
        )}
      </div>
      <p className={`font-mono text-[22px] font-medium ${color ?? 'text-[#1C1B18]'}`}>{value}</p>
      <p className="text-[11px] text-[#A8A49C] mt-0.5">{sub}</p>
      {compare}
    </div>
  )
}
