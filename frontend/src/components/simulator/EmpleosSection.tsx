'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { EmpleosChart } from '@/components/charts/EmpleosChart'
import { ContextoModulo } from '@/components/ui/ContextoModulo'

export function EmpleosSection() {
  const { resultados } = useSimulatorStore()
  const r = resultados

  return (
    <div>
      <ContextoModulo
        variante="operativo"
        titulo="¿De dónde vienen estos empleos y cómo se calculan?"
        cuerpo="Los empleos directos provienen de dos fuentes: los operadores de centros de acopio (CA) —cuántas personas necesita cada CA según su tamaño P/M/G— y los trabajadores de recicladoras nuevas que se activan en cada fase. Los empleos indirectos son el múltiplo Deloitte LATAM (2.5x sobre directos). Los pepenadores formalizados son el porcentaje del total activo en la ZM que pasa de informalidad a contrato con IMSS según la fase del programa."
        puntos={[
          'CA Pequeño: 5 empleos directos · Mediano: 14 · Grande: 34.',
          'Multiplicador indirecto: 2.5x–3.5x sobre directos (PNUD México).',
          'Pepenadores activos estimados en la ZM: ~540 SLP, ~680 QRO, ~2,400 MTY (ENIGH 2022).',
          'La formalización no es automática: requiere convenio entre municipio y organización de recolectores.',
        ]}
        fuente="Empleos por CA: Bootstrap §2.3. Multiplicadores: Deloitte LATAM / PNUD México §2.8. Pepenadores: ENIGH 2022 estimado por ZM."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { l: 'Directos CAs',     v: r ? fmt.num0(r.empleosDirectosCAs)     : '—', c: 'text-[#3B6D11]' },
          { l: 'Directos recic.',  v: r ? fmt.num0(r.empleosDirectosRecic)    : '—', c: '' },
          { l: 'Indirectos',       v: r ? fmt.num0(r.empleosIndirectos)       : '—', c: '' },
          { l: 'Pepenadores form.',v: r ? fmt.num0(r.pepenadoresFormalizados) : '—', c: 'text-[#D4881E]' },
        ].map(item => (
          <div key={item.l} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[12px] p-4">
            <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide mb-1">{item.l}</p>
            <p className={`font-mono text-[20px] font-medium ${item.c || 'text-[#1C1B18]'}`}>{item.v}</p>
          </div>
        ))}
      </div>

      <EmpleosChart />

      {r && (
        <div className="mt-4 px-4 py-3 bg-[#EBF3FB] rounded-[10px] border-l-4 border-[#1A5FA8]">
          <p className="text-[13px] text-[#051D45] italic leading-relaxed">
            El programa generará {fmt.num0(r.empleosTotalesDirectos)} empleos directos y una derrama salarial
            de {fmt.mxnK(r.derramaSalarial)} anuales, con un multiplicador de 1.8x sobre la economía local.
          </p>
        </div>
      )}
    </div>
  )
}
