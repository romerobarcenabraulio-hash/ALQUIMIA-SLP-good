'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { EditorialTimeline, type TimelineMilestone } from '@/components/simulator/EditorialTimeline'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

const HITOS: Array<{ ciudad: string; año: number; evento: string; tone: 'neutral' | 'positive' | 'warning' }> = [
  { ciudad: 'Curitiba', año: 2000, evento: 'Programa Câmbio Verde iniciado', tone: 'neutral' },
  { ciudad: 'Bogotá',   año: 2010, evento: 'Recicladores incluidos en sistema formal', tone: 'neutral' },
  { ciudad: 'B. Aires', año: 2013, evento: 'Ley de Basura Cero · separación obligatoria', tone: 'warning' },
  { ciudad: 'Santiago', año: 2016, evento: 'Ley REP (Responsabilidad Extendida)', tone: 'neutral' },
  { ciudad: 'S. Paulo', año: 2019, evento: 'Política Nacional Residuos Sólidos implementada', tone: 'neutral' },
]

/** Valores numéricos para comparar con `zmActiva` (grid y NarrativeBridge). */
const PEER_BENCHMARK = [
  { ciudad: 'Bogotá',   año3Pct: 40, año5Pct: 100, empleo: 18000, co2Kton: 450 },
  { ciudad: 'B. Aires', año3Pct: 30, año5Pct: 75,  empleo: 12000, co2Kton: 310 },
  { ciudad: 'Curitiba', año3Pct: 65, año5Pct: 95,  empleo: 22000, co2Kton: 620 },
] as const

export function BenchmarkLATAM() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
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

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S18 — Benchmark LATAM</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Contexto regional</h2>
      <p className="text-[13px] text-[#6B6760] mb-6">
        Compara el plan de {zmActiva} con ciudades que lideraron la transición circular en América Latina.
      </p>

      <EditorialTimeline
        kicker="S22 · Línea de tiempo regional"
        title="De Curitiba a tu ciudad"
        milestones={milestones}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
        {PEER_BENCHMARK.map(b => (
          <div key={b.ciudad} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <p className="text-[13px] font-medium text-[#1C1B18] mb-2">{b.ciudad}</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              {[
                ['Año 3', `${b.año3Pct}%`],
                ['Año 5', `${b.año5Pct}%`],
                ['Empleo', `+${fmtK(b.empleo)}`],
                ['CO₂e', `${fmtK(b.co2Kton)} t`],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <p className="text-[9px] text-[#A8A49C]">{k}</p>
                  <p className="font-mono text-[11px] text-[#1C1B18]">{v}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <NarrativeBridge
        variant="bridge"
        audience="entrepreneur"
        kicker="Benchmark · síntesis numérica"
        title={`${zmActiva} frente al panel LATAM`}
        summary={`Tu captura circular modelada (~${localCircularityPct.toFixed(1)}%${circularityBaseline ? ' · baseline' : ' · trayectoria año seleccionado'}) queda ${deltaVsAvgAño5 >= 0 ? 'por encima' : 'por debajo'} del promedio del grid (${avgAño5.toFixed(0)}% en año 5 de las tres ciudades: Bogotá, Buenos Aires, Curitiba). Frente a Curitiba (referencia ${curitiba.año5Pct}% año 5, ${curitiba.año3Pct}% año 3), la brecha es ${deltaVsCuritibaAño5 >= 0 ? '+' : ''}${deltaVsCuritibaAño5.toFixed(1)} puntos porcentuales. Promedio del panel: año 3 ${avgAño3.toFixed(0)}%, empleos formales estimados ~+${fmtK(avgEmpleo)}, CO₂e anual de referencia ~${fmtK(avgCo2)} kt.`}
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
