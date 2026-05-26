'use client'
import { useMemo } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { EditorialTimeline, type TimelineMilestone } from '@/components/simulator/EditorialTimeline'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { aplicarSustitucionesTerritorio, getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { SectionLabel } from '@/components/editorial/SectionLabel'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'

const HITOS: Array<{ ciudad: string; año: number; evento: string; tone: 'neutral' | 'positive' | 'warning' }> = [
  { ciudad: 'Curitiba', año: 2000, evento: 'Programa Câmbio Verde iniciado', tone: 'neutral' },
  { ciudad: 'Bogotá',   año: 2010, evento: 'Recicladores incluidos en sistema formal', tone: 'neutral' },
  { ciudad: 'B. Aires', año: 2013, evento: 'Ley de Basura Cero · separación obligatoria', tone: 'warning' },
  { ciudad: 'Santiago', año: 2016, evento: 'Ley REP (Responsabilidad Extendida)', tone: 'neutral' },
  { ciudad: 'S. Paulo', año: 2019, evento: 'Política Nacional Residuos Sólidos implementada', tone: 'neutral' },
]

const PEER_BENCHMARK = [
  { ciudad: 'Bogotá',   año3Pct: 40, año5Pct: 100, empleo: 18000, co2Kton: 450 },
  { ciudad: 'B. Aires', año3Pct: 30, año5Pct: 75,  empleo: 12000, co2Kton: 310 },
  { ciudad: 'Curitiba', año3Pct: 65, año5Pct: 95,  empleo: 22000, co2Kton: 620 },
] as const

export function BenchmarkLATAM() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const horizon = useSimulatorStore(s => s.horizonte)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)

  const añoFinal = 2025 + horizon

  const milestones: TimelineMilestone[] = [
    ...HITOS.map(h => ({
      id: `${h.ciudad}-${h.año}`,
      label: `${h.ciudad} · ${h.año}`,
      title: h.evento,
      tone: h.tone,
    })),
    {
      id: 'tu-ciudad',
      label: `${zmActiva} · 2025`,
      title: 'Inicio de reforma reglamentaria',
      note: `Horizonte hasta ${añoFinal}: oportunidad de alcanzar tasas comparables a Bogotá o Curitiba.`,
      tone: 'positive',
    },
  ]

  const avgAño3 = PEER_BENCHMARK.reduce((s, p) => s + p.año3Pct, 0) / PEER_BENCHMARK.length
  const avgAño5 = PEER_BENCHMARK.reduce((s, p) => s + p.año5Pct, 0) / PEER_BENCHMARK.length
  const avgEmpleo = Math.round(PEER_BENCHMARK.reduce((s, p) => s + p.empleo, 0) / PEER_BENCHMARK.length)
  const avgCo2 = Math.round(PEER_BENCHMARK.reduce((s, p) => s + p.co2Kton, 0) / PEER_BENCHMARK.length)
  const curitiba = PEER_BENCHMARK.find(p => p.ciudad === 'Curitiba')!
  const localCircularityPct =
    circularityBaseline?.current_circularity_pct ?? pctCapturaPorAño[Math.min(pctCapturaPorAño.length - 1, Math.max(0, horizon - 1))] ?? 0
  const deltaVsAvgAño5 = localCircularityPct - avgAño5
  const deltaVsCuritibaAño5 = localCircularityPct - curitiba.año5Pct

  const tituloTimeline = useMemo(() => {
    const etiqueta = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
    return aplicarSustitucionesTerritorio('De Curitiba a tu ciudad', etiqueta)
  }, [municipiosActivos, zmActiva])

  return (
    <div>
      <h2 className="font-serif text-[24px] text-gray-900c mb-2">Contexto regional</h2>
      <p className="text-[14px] text-gray-600c mb-6 max-w-[620px]">
        Compara el plan de {zmActiva} con ciudades que lideraron la transición circular en América Latina.
      </p>

      <EditorialTimeline title={tituloTimeline} milestones={milestones} />

      <SectionLabel className="mt-8">Panel de referencia LATAM</SectionLabel>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
        {PEER_BENCHMARK.map(b => (
          <div key={b.ciudad} className="space-y-4 border-b border-[0.5px] border-gray-200c pb-6 md:border-0 md:pb-0">
            <p className="font-serif text-[18px] text-gray-900c">{b.ciudad}</p>
            <div className="grid grid-cols-2 gap-4">
              <AnchorFigure figure={`${b.año3Pct}%`} context="Circularidad año 3" />
              <AnchorFigure figure={`${b.año5Pct}%`} context="Circularidad año 5" />
              <AnchorFigure figure={`+${fmtK(b.empleo)}`} context="Empleo formal est." />
              <AnchorFigure figure={`${fmtK(b.co2Kton)} t`} context="CO₂e ref." />
            </div>
          </div>
        ))}
      </div>

      <NarrativeBridge
        variant="bridge"
        audience="entrepreneur"
        kicker="Benchmark · síntesis numérica"
        title={`${zmActiva} frente al panel LATAM`}
        summary={`Tu captura circular modelada (~${localCircularityPct.toFixed(1)}%${circularityBaseline ? ' · baseline' : ' · trayectoria año seleccionado'}) queda ${deltaVsAvgAño5 >= 0 ? 'por encima' : 'por debajo'} del promedio del panel (${avgAño5.toFixed(0)}% en año 5 de las tres ciudades: Bogotá, Buenos Aires, Curitiba). Frente a Curitiba (referencia ${curitiba.año5Pct}% año 5, ${curitiba.año3Pct}% año 3), la brecha es ${deltaVsCuritibaAño5 >= 0 ? '+' : ''}${deltaVsCuritibaAño5.toFixed(1)} puntos porcentuales. Promedio del panel: año 3 ${avgAño3.toFixed(0)}%, empleos formales estimados ~+${fmtK(avgEmpleo)}, CO₂e anual de referencia ~${fmtK(avgCo2)} kt.`}
        evidence={[
          { label: `${zmActiva} (modelo)`, value: `${localCircularityPct.toFixed(1)}%` },
          { label: 'Promedio año 5', value: `${avgAño5.toFixed(0)}%` },
          { label: 'Curitiba año 5', value: `${curitiba.año5Pct}%` },
          { label: 'Brecha vs prom.', value: `${deltaVsAvgAño5 >= 0 ? '+' : ''}${deltaVsAvgAño5.toFixed(1)} pp` },
        ]}
        nextStep={{
          label: 'Anclar en reporte de organización',
          helper: 'Lleva estas referencias al export y documenta supuestos de horizonte y fuente de la circularidad activa.',
        }}
      />
    </div>
  )
}

function fmtK(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return String(n)
}
