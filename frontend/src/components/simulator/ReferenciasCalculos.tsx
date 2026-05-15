'use client'

import type React from 'react'
import { useMemo } from 'react'
import { BookOpenCheck, ClipboardCheck } from 'lucide-react'
import { SOURCE_VERIFICATION_MATRIX, SOURCE_VERIFICATION_STATUS_LABEL } from '@/data/sourceVerificationMatrix'
import type { SourceVerificationStatus } from '@/data/sourceVerificationMatrix'
import { FuentesDatos } from '@/components/simulator/FuentesDatos'
import { SocialContextExportPreviewSection } from '@/components/simulator/SocialContextExportPreviewSection'
import { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'

const STATUS_CLASS: Record<SourceVerificationStatus, string> = {
  verificado: 'border-[#3B6D11]/30 bg-[#EAF3DE] text-[#23470A]',
  condicionado: 'border-[#D4881E]/35 bg-[#FEF7E7] text-[#8B5A00]',
  corregido: 'border-[#1A5FA8]/25 bg-[#E7F0FA] text-[#1A5FA8]',
  pendiente: 'border-red-200 bg-red-50 text-red-800',
}

export function ReferenciasCalculos() {
  const resultados = useSimulatorStore(s => s.resultados)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const precios = useSimulatorStore(s => s.precios)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)

  const socialBlock = useMemo(
    () => buildSociodemographicScaffoldBlock(municipiosActivos),
    [municipiosActivos],
  )

  const counts = SOURCE_VERIFICATION_MATRIX.reduce<Record<SourceVerificationStatus, number>>(
    (acc, row) => ({ ...acc, [row.status]: acc[row.status] + 1 }),
    { verificado: 0, condicionado: 0, corregido: 0, pendiente: 0 },
  )

  return (
    <section className="section" aria-labelledby="referencias-calculos-title" data-testid="referencias-calculos">
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">
              Matriz de trazabilidad de fuentes
            </p>
            <h2 id="referencias-calculos-title" className="mt-1 font-serif text-[24px] text-[#1C1B18]">
              Bibliografía y cálculos
            </h2>
            <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
              Esta matriz no solo lista bibliografía: conecta cada afirmación del simulador con su fuente, su estado de
              verificación, la fórmula usada, la acción correctiva pendiente y el responsable de cierre.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-[999px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-1 text-[11px] text-[#3B6D11]">
            <BookOpenCheck size={13} aria-hidden />
            Source Verification Matrix
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          {(Object.keys(counts) as SourceVerificationStatus[]).map(status => (
            <div key={status} className={`rounded-[8px] border px-3 py-2 ${STATUS_CLASS[status]}`}>
              <p className="text-[10px] uppercase tracking-[0.06em] opacity-80">{SOURCE_VERIFICATION_STATUS_LABEL[status]}</p>
              <p className="mt-1 font-mono text-[18px]">{counts[status]}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3">
          <div className="flex items-start gap-2">
            <ClipboardCheck size={15} className="mt-0.5 text-[#3B6D11]" aria-hidden />
            <div className="text-[11px] leading-relaxed text-[#6B6760]">
              <p>
                Lectura actual: {resultados ? `${fmt.kgd(resultados.rsuTotalTonDia)} con ${genPercapita.toFixed(2)} kg/hab/día` : 'sin cálculo activo'}.
                Precios usados: PET ${precios.pet.toFixed(2)}, HDPE ${precios.hdpe.toFixed(2)}, papel ${precios.papel.toFixed(2)},
                vidrio ${precios.vidrio.toFixed(2)}, aluminio ${precios.aluminio.toFixed(2)}, orgánico ${precios.organico.toFixed(2)} MXN/kg.
              </p>
              <p className="mt-1">
                Baseline circularidad: {circularityBaseline ? `${circularityBaseline.current_circularity_pct.toFixed(1)}% con confianza ${Math.round(circularityBaseline.confidence * 100)}%` : 'pendiente de ciudad'}.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[10px] border border-[#E8E4DC] bg-white">
          <table className="min-w-[1180px] w-full border-collapse text-left text-[11px]">
            <thead className="bg-[#F8F6F1] text-[#6B6760]">
              <tr>
                <Th>Tema</Th>
                <Th>Afirmación</Th>
                <Th>Fuente</Th>
                <Th>URL / archivo</Th>
                <Th>Estado</Th>
                <Th>Fórmula</Th>
                <Th>Unidad</Th>
                <Th>Acción correctiva</Th>
                <Th>Responsable</Th>
              </tr>
            </thead>
            <tbody>
              {SOURCE_VERIFICATION_MATRIX.map(row => (
                <tr key={row.id} className="border-t border-[#F0EDE5] align-top">
                  <Td strong>{row.tema}</Td>
                  <Td>{row.afirmacion}</Td>
                  <Td>{row.fuente}</Td>
                  <Td mono>{row.urlOrPath}</Td>
                  <Td>
                    <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${STATUS_CLASS[row.status]}`}>
                      {SOURCE_VERIFICATION_STATUS_LABEL[row.status]}
                    </span>
                  </Td>
                  <Td mono>{row.formula}</Td>
                  <Td>{row.unidad}</Td>
                  <Td>{row.accionCorrectiva}</Td>
                  <Td>{row.responsable}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SocialContextExportPreviewSection
        block={socialBlock}
        moduleAnchor="source_traceability"
        persistence="local"
        className="mt-8"
      />

      <div className="mt-8 rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4" data-testid="fuentes-datos-bibliografia">
        <FuentesDatos variant="embedded" />
      </div>
    </section>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.06em]">{children}</th>
}

function Td({
  children,
  strong = false,
  mono = false,
}: {
  children: React.ReactNode
  strong?: boolean
  mono?: boolean
}) {
  return (
    <td
      className={[
        'px-3 py-3 leading-relaxed text-[#6B6760]',
        strong ? 'font-semibold text-[#1C1B18]' : '',
        mono ? 'font-mono text-[10px]' : '',
      ].join(' ')}
    >
      {children}
    </td>
  )
}
