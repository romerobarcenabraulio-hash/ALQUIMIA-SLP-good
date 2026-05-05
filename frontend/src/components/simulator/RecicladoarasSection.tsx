'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { FlujosSankey, type SankeyNode, type SankeyLink } from '@/components/simulator/FlujosSankey'

const RECICLADORAS_SLP = [
  { nombre: 'IPSL', material: 'Papel/cartón', capacidad: '79,200 t/año', ciudad: 'SLP', tipo: 'existente' },
  { nombre: 'PetStar Acopio', material: 'PET', capacidad: '5,700 t/año', ciudad: 'SLP', tipo: 'existente' },
  { nombre: 'Vitro / Owens Illinois', material: 'Vidrio', capacidad: 'Amplia', ciudad: 'Regional', tipo: 'existente' },
  { nombre: 'Nueva recicladora PET', material: 'PET', capacidad: 'Por definir', ciudad: 'SLP', tipo: 'nueva' },
  { nombre: 'Nueva planta composta', material: 'Orgánicos', capacidad: 'Por definir', ciudad: 'SLP', tipo: 'nueva' },
]

export function RecicladoarasSection() {
  const { zmActiva, resultados } = useSimulatorStore()
  const blocked = !useSimulatorStore.getState().gatesAprobados[0]

  return (
    <div className={blocked ? 'overlay-blocked' : ''}>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S13 — Recicladoras</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Cadena de valor del reciclaje</h2>
      <p className="text-[13px] text-[#6B6760] mb-6">
        Las recicladoras existentes absorben los flujos sin CAPEX del programa.
        Nuevas plantas se activan conforme el volumen justifica la inversión privada.
      </p>

      {/* Lista recicladoras */}
      <div className="flex flex-col gap-2 mb-6">
        {RECICLADORAS_SLP.map(r => (
          <div key={r.nombre} className="flex items-center gap-4 bg-[#FDFCFA] border border-[#E8E4DC] rounded-[10px] px-4 py-3">
            <div className={`w-2 h-2 rounded-full ${r.tipo === 'existente' ? 'bg-[#8B6B4A]' : 'bg-[#3B6D11] animate-pulse'}`} />
            <div className="flex-1">
              <p className="text-[12px] font-medium text-[#1C1B18]">{r.nombre}</p>
              <p className="text-[11px] text-[#6B6760]">{r.material} · {r.ciudad}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-[11px] text-[#1C1B18]">{r.capacidad}</p>
              <p className="text-[9px] text-[#A8A49C]">{r.tipo === 'existente' ? 'Existente' : '★ Nueva'}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sankey real con datos del store */}
      <FlujosSankey
        title="Cadena de valor del reciclaje"
        nodes={buildSankeyNodes()}
        links={buildSankeyLinks(resultados?.volCapturablePorMat)}
      />

      <NarrativeBridge
        kicker="S22 · Lectura del Sankey"
        variant="result"
        summary={resultados
          ? `De ${fmt.kgd(resultados.rsuTotalTonDia)} t/día generadas, el flujo capturable se canaliza primero a centros de acopio y de ahí a recicladoras existentes (IPSL, PetStar, Vitro). Las plantas nuevas se justifican cuando una fracción supera la capacidad instalada.`
          : 'Cuando haya cálculo del simulador, aquí aparece la lectura del flujo y a qué recicladora se canaliza.'}
        evidence={resultados ? [
          { label: 'RSU total', value: fmt.kgd(resultados.rsuTotalTonDia) + ' t/día' },
          { label: 'Recicladoras existentes', value: '3' },
          { label: 'Nuevas justificadas por volumen', value: '2' },
          { label: 'ZM', value: zmActiva },
        ] : undefined}
        source={{ fuente: 'Catálogo recicladoras SLP + cálculo ALQUIMIA', incertidumbre: 'Capacidad regional de Vitro/Owens es estimada.' }}
        nextStep={{ label: 'Compara flujos por material' }}
      />
    </div>
  )
}

function buildSankeyNodes(): SankeyNode[] {
  return [
    { id: 'rsu', name: 'RSU generado' },
    { id: 'separacion', name: 'Separación en fuente' },
    { id: 'cas', name: 'Centros de Acopio' },
    { id: 'ipsl', name: 'IPSL · papel/cartón' },
    { id: 'petstar', name: 'PetStar · PET' },
    { id: 'vitro', name: 'Vitro · vidrio' },
    { id: 'composta', name: 'Planta composta (nueva)' },
    { id: 'pet_nueva', name: 'Recicladora PET (nueva)' },
    { id: 'producto', name: 'Producto final' },
  ]
}

function buildSankeyLinks(vol: Record<string, number> | undefined): SankeyLink[] {
  const v = vol ?? {}
  const total = Math.max(0.001, Object.values(v).reduce((s, x) => s + (x ?? 0), 0))
  return [
    { source: 'rsu', target: 'separacion', value: total },
    { source: 'separacion', target: 'cas', value: total * 0.85 },
    { source: 'cas', target: 'ipsl', value: (v.papel ?? 0) },
    { source: 'cas', target: 'petstar', value: (v.plastico ?? 0) * 0.6 },
    { source: 'cas', target: 'pet_nueva', value: (v.plastico ?? 0) * 0.4 },
    { source: 'cas', target: 'vitro', value: (v.vidrio ?? 0) },
    { source: 'cas', target: 'composta', value: (v.organico ?? 0) },
    { source: 'ipsl', target: 'producto', value: (v.papel ?? 0) * 0.95 },
    { source: 'petstar', target: 'producto', value: (v.plastico ?? 0) * 0.55 },
    { source: 'pet_nueva', target: 'producto', value: (v.plastico ?? 0) * 0.35 },
    { source: 'vitro', target: 'producto', value: (v.vidrio ?? 0) * 0.92 },
    { source: 'composta', target: 'producto', value: (v.organico ?? 0) * 0.7 },
  ].filter(link => link.value > 0)
}
