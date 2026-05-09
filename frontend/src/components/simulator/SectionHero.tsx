'use client'

import type { ReactNode } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { ZMS } from '@/lib/constants'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { getMadurezMensajeMultiAncla, getMunicipioMadurezVista, getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import type { FuenteTipo, ResultadosCalculados } from '@/types'
import { getMunicipalNarrative } from '@/data/municipalNarratives'

const GENTILICIO_POR_TERRITORIO: Record<string, string> = {
  SLP: 'potosinos',
  MTY: 'regiomontanos',
  QRO: 'queretanos',
  GDL: 'jaliscienses',
  slp: 'potosinos',
  sol: 'soledenses',
  csp: 'cerreños',
  vip: 'villenses',
  mty: 'regiomontanos',
  spg: 'sampetreños',
  snl: 'nicolaítas',
  gua: 'guadalupenses',
  apo: 'apodaquenses',
  sca: 'santacatarinenses',
  gar: 'garcianos',
  esc: 'escobedenses',
  jua: 'juarenses',
  qro: 'queretanos',
  cor: 'corregidorenses',
  mar: 'marquesanos',
  hui: 'huimilpenses',
  gdl: 'tapatíos',
  zap: 'zapopanos',
  tla: 'tlaquepaquenses',
}

function gentilicioLectura(zmActiva: string, municipiosActivos: string[], territorio: string): string {
  if (municipiosActivos.length === 1) {
    return GENTILICIO_POR_TERRITORIO[municipiosActivos[0] ?? ''] ?? `habitantes de ${territorio}`
  }
  return GENTILICIO_POR_TERRITORIO[zmActiva] ?? `habitantes de ${territorio}`
}

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
  const { resultados, resultadosSinPrograma, zmActiva, snapshotDatos, horizonte, municipiosActivos, genPercapita } = useSimulatorStore()
  const zm = ZMS.find(z => z.id === zmActiva)
  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const gentilicio = gentilicioLectura(zmActiva, municipiosActivos, territorio)
  const rsuDia = resultados?.rsuTotalTonDia ?? 0
  const rsuAnual = rsuDia * 365
  const costoPublicoAnual = resultados ? resultados.opexAnual + resultados.ahorroDisposicion : 0
  const saludPublicaAnual = resultados?.ahorroSalud ?? 0
  const narrative = getMunicipalNarrative(zmActiva, municipiosActivos)

  // Provenance de los KPIs del header — viene del snapshot cuando disponible
  const pobKpi  = snapshotDatos?.kpis.find(k => k.kpi_id === 'poblacion_total')
  const genKpi  = snapshotDatos?.kpis.find(k => k.kpi_id === 'gen_percapita_kg_dia')
  const madurezUnMunicipio =
    municipiosActivos.length === 1 ? getMunicipioMadurezVista(municipiosActivos[0] ?? '') : null

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
      <h1 className="font-serif text-[38px] leading-[1.05] tracking-[-0.02em] text-[#1C1B18] mb-4 max-w-3xl">
        ¿Sabes cuánto le cuesta a{' '}
        <span className="text-[#3B6D11]">{territorio}</span>{' '}
        no separar sus residuos?
      </h1>
      <div className="max-w-3xl space-y-4 text-[15px] leading-relaxed text-[#6B6760] mb-5">
        <p>
          A veces el problema parece absurdo de tan cotidiano: una bolsa mezclada sale de la casa, desaparece de la vista
          y se vuelve costo municipal, presión sanitaria y trabajo más pesado para quienes recuperan materiales.
          Separar no resuelve todo, pero cambia el punto de partida.
        </p>
        <p>
          Actualmente, en <strong className="font-medium text-[#1C1B18]">{territorio}</strong>, el modelo estima que si una persona genera{' '}
          <strong className="font-mono text-[#1C1B18]">{genPercapita.toFixed(2)} kg/día</strong> de RSU municipal,
          los {gentilicio} del ámbito activo generan alrededor de{' '}
          <strong className="font-mono text-[#1C1B18]">{rsuDia > 0 ? fmt.kgd(rsuDia) : '—'}</strong>, es decir{' '}
          <strong className="font-mono text-[#1C1B18]">{rsuAnual > 0 ? `${fmt.num0(rsuAnual)} t/año` : '—'}</strong>.
          Esta lectura se limita a residuos sólidos urbanos del escenario municipal; no modela residuos peligrosos,
          especiales ni regulados.
        </p>
        {resultados && (
          <p>
            Bajo este escenario, la operación y disposición asociadas representan cerca de{' '}
            <strong className="font-mono text-[#1C1B18]">{fmt.mxnM(costoPublicoAnual)}</strong> al año para el gobierno local,
            mientras que la mejora del manejo puede reflejar hasta{' '}
            <strong className="font-mono text-[#1C1B18]">{fmt.mxnM(saludPublicaAnual)}</strong> de ahorro social estimado en salud.
            Son cifras de simulación: sirven para decidir, ajustar supuestos y abrir una conversación pública responsable.
          </p>
        )}
        <p>
          El municipio debe prestar servicios como seguridad, agua, energía urbana y recolección de residuos; cuando no tiene
          infraestructura suficiente, contrata o concesiona parte del servicio y todo termina en rutas, patios de transferencia
          y disposición final. En medio están los recolectores de base: si hogares, oficinas, hoteles y comercios separan desde
          el origen, su trabajo se vuelve más seguro, más digno y menos laborioso.
        </p>
      </div>
      {madurezUnMunicipio && (
        <p className="text-[12px] text-[#5A6347] max-w-3xl mb-6 leading-relaxed border-l-[3px] border-[#8CAA7A] pl-3">
          Cada municipio es un escenario distinto: reglamento de aseo/limpia, supuestos de generación (kg/hab·día) y madurez en
          circularidad no se transfieren mecánicamente entre ayuntamientos. El ancla activa es{' '}
          <strong className="font-medium text-[#2D5409]">{madurezUnMunicipio.nombre}</strong>.
        </p>
      )}
      <div className="mb-6 max-w-3xl rounded-[10px] border border-[#D7E8C0] bg-[#F4FAEC] px-4 py-3">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#3B6D11]">Lectura municipal</p>
        <h2 className="mt-1 font-serif text-[18px] text-[#1C1B18]">{narrative.title}</h2>
        <p className="mt-2 text-[12px] leading-relaxed text-[#5A6347]">{narrative.body}</p>
        <p className="mt-2 text-[11px] font-medium text-[#3B6D11]">{narrative.maturity}</p>
      </div>
      {municipiosActivos.length > 1 && (
        <p className="text-[12px] text-[#5A6347] max-w-2xl mb-6 leading-relaxed border-l-[3px] border-[#8CAA7A] pl-3">
          {getMadurezMensajeMultiAncla(municipiosActivos.length)}
        </p>
      )}
      {municipiosActivos.length === 0 && (
        <p className="text-[12px] text-[#8A857C] max-w-2xl mb-6 leading-relaxed">
          Define el municipio o conjunto municipal en “Ciudad primero” para anclar reglamento y parámetros; hasta entonces los KPIs son de ZM agregada.
        </p>
      )}

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
