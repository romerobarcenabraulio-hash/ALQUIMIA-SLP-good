'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { EmpleosChart } from '@/components/charts/EmpleosChart'
import { ContextoModulo } from '@/components/ui/ContextoModulo'
import { Conclusion } from '@/components/editorial/Conclusion'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'

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

      <KpiAnchorGrid
        className="mb-6"
        items={[
          { label: 'Directos CAs', value: r ? fmt.num0(r.empleosDirectosCAs) : '—' },
          { label: 'Directos recic.', value: r ? fmt.num0(r.empleosDirectosRecic) : '—' },
          { label: 'Indirectos', value: r ? fmt.num0(r.empleosIndirectos) : '—' },
          { label: 'Pepenadores form.', value: r ? fmt.num0(r.pepenadoresFormalizados) : '—' },
        ]}
      />

      <EmpleosChart />

      {r && (
        <Conclusion className="mt-6 text-[18px]">
          {`El programa generará ${fmt.num0(r.empleosTotalesDirectos)} empleos directos y una derrama salarial de ${fmt.mxnK(r.derramaSalarial)} anuales, con un multiplicador de 1.8× sobre la economía local.`}
        </Conclusion>
      )}
    </div>
  )
}
