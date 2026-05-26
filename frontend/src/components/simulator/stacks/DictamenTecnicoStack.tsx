'use client'

import { useMemo, useState } from 'react'
import {
  Scale, BookOpen, Users, FileCheck, Gavel, Globe, ChevronDown,
  AlertTriangle, CheckCircle2, ExternalLink,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ChartPanel } from '@/components/ui/ChartPanel'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'
import { MATERIAL_PRICE_RESEARCH } from '@/data/materialPriceResearch'
import {
  SEPARATION_SCHEMES,
  FINES_EVIDENCE,
  CONDOMINIUM_EVIDENCE,
  REGISTRATION_EVIDENCE,
  INTERNATIONAL_BENCHMARKS,
  ADENDO_JUSTIFICATION_MAP,
  estimateCaptureValueDelta,
  type EvidenceClaim,
  type EvidenceStatus,
} from '@/data/dictamenTecnicoEvidence'
import { cn, fmt } from '@/lib/utils'
import { ModuleBottomBar } from '@/components/simulator/ModuleBottomBar'
import { Conclusion, EditorialCallout, KpiAnchorGrid } from '@/components/editorial'

function StatusBadge({ status }: { status: EvidenceStatus }) {
  const styles = {
    verified: 'bg-[#EAF3DE] text-[#23470A] border-[#C9DDB1]',
    estimated: 'bg-[#FEF7E7] text-[#6B4800] border-[#F5DCA0]',
    pending: 'bg-[#F4F2ED] text-[#6B6760] border-[#E8E4DC]',
  }
  const labels = { verified: 'Verificado', estimated: 'Estimado', pending: 'Pendiente' }
  return (
    <span className={cn('text-[8px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border', styles[status])}>
      {labels[status]}
    </span>
  )
}

function EvidenceCard({ claim }: { claim: EvidenceClaim }) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] text-[#1C1B18] leading-relaxed">{claim.claim}</p>
        <StatusBadge status={claim.status} />
      </div>
      <p className="text-[9px] text-[#A8A49C]">
        {claim.source}{claim.year ? ` · ${claim.year}` : ''}
      </p>
      {claim.counterArgument && claim.counterResponse && (
        <details className="rounded-[8px] border border-[#D7E8C0] bg-[#F6FAEF] overflow-hidden">
          <summary className="cursor-pointer px-3 py-2 text-[10px] font-medium text-[#3B6D11] select-none list-none">
            Objeción anticipada: {claim.counterArgument}
          </summary>
          <p className="px-3 pb-3 text-[10px] text-[#4A4740] leading-relaxed border-t border-[#D7E8C0] pt-2">
            {claim.counterResponse}
          </p>
        </details>
      )}
    </div>
  )
}

type SectionId = 'fracciones' | 'multas' | 'condominios' | 'registro' | 'tecnica' | 'comparativo'

const SECTIONS: { id: SectionId; num: number; title: string; icon: typeof Scale; adendoNums: number[] }[] = [
  { id: 'fracciones', num: 1, title: '¿Por qué 5 fracciones y no 3?', icon: Scale, adendoNums: [1] },
  { id: 'multas', num: 2, title: '¿Por qué multas progresivas 4→8→12 UMA?', icon: Gavel, adendoNums: [5, 6] },
  { id: 'condominios', num: 3, title: '¿Por qué condominios primero?', icon: Users, adendoNums: [2, 3] },
  { id: 'registro', num: 4, title: '¿Por qué registro obligatorio?', icon: FileCheck, adendoNums: [4] },
  { id: 'tecnica', num: 5, title: 'Técnica normativa (adición vs. reforma)', icon: BookOpen, adendoNums: [1, 2, 3, 4, 5, 6] },
  { id: 'comparativo', num: 6, title: 'Evidencia internacional comparada', icon: Globe, adendoNums: [] },
]

export function DictamenTecnicoStack() {
  const { zmActiva, municipiosActivos, resultados } = useSimulatorStore()
  const { openReglamento } = useReglamentoFuente()
  const [openSection, setOpenSection] = useState<SectionId | null>('fracciones')

  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const munId = municipiosActivos[0] ?? (zmActiva?.toLowerCase() ?? 'mty')

  const precios = useMemo(() => {
    const p: Record<string, number> = {}
    for (const [k, v] of Object.entries(MATERIAL_PRICE_RESEARCH)) {
      p[k] = v.recommended
    }
    return p
  }, [])

  const captureDelta = useMemo(
    () => estimateCaptureValueDelta(resultados?.volCapturablePorMat as Record<string, number> | undefined, precios),
    [resultados?.volCapturablePorMat, precios],
  )

  const coberturaActual = 42
  const coberturaObjetivo = 85

  return (
    <div className="space-y-5 pb-6">
      {/* Acciones — título y lectura en DecisionModuleShell */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openReglamento(munId)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#3B6D11] text-white text-[11px] font-semibold hover:bg-[#2D5A0D] transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Ver adendos propuestos
        </button>
        <button
          type="button"
          onClick={() => setOpenSection('comparativo')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#E8E4DC] bg-white text-[11px] font-medium text-[#6B6760] hover:border-[#3B6D11]/30 transition-colors"
        >
          Evidencia internacional
        </button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { label: 'Secciones de evidencia', value: '6', sub: 'técnica + social' },
          { label: 'Adendos fundamentados', value: String(ADENDO_JUSTIFICATION_MAP.length), sub: 'vinculados por ID' },
          { label: 'Cobertura normativa', value: `${coberturaActual}% → ${coberturaObjetivo}%`, sub: 'antes / después reforma' },
          {
            label: 'Valor adicional 5 vs. 3 fracc.',
            value: captureDelta ? fmt.mxn(captureDelta.delta) : '—',
            sub: captureDelta ? 'MXN/año (escenario activo)' : 'requiere escenario calculado',
          },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-1">{label}</p>
            <p className="font-semibold text-[13px] text-[#1C1B18] leading-tight">{value}</p>
            <p className="text-[9px] text-[#A8A49C] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* City-specific capture argument */}
      {captureDelta && (
        <ChartPanel
          chartId="dictamen-captura-5v3"
          title="Valor de captura: 5 fracciones vs. 3"
          subtitle={`Escenario activo · ${territorio}`}
        >
          <div className="px-5 pb-5 space-y-4">
            <Conclusion as="div" className="text-[16px] md:text-[17px]">
              Para <strong>{territorio}</strong>, la separación en 5 fracciones capturaría aproximadamente{' '}
              <strong>{fmt.mxn(captureDelta.fiveFraction)} MXN/año</strong> en valor de materiales, vs.{' '}
              <strong>{fmt.mxn(captureDelta.threeFraction)} MXN/año</strong> con 3 fracciones — una diferencia de{' '}
              <strong className="text-[#3B6D11]">{fmt.mxn(captureDelta.delta)} MXN/año</strong> atribuible
              principalmente a menor contaminación en el stream reciclable.
            </Conclusion>
            <KpiAnchorGrid
              columns={2}
              items={[
                { label: '5 fracciones · contaminación ~12%', value: fmt.mxn(captureDelta.fiveFraction) },
                { label: '3 fracciones · contaminación ~25%', value: fmt.mxn(captureDelta.threeFraction), figureClassName: 'text-amber-800' },
              ]}
            />
          </div>
        </ChartPanel>
      )}

      {!captureDelta && (
        <EditorialCallout tone="caution" label="Escenario requerido">
          Calcule un escenario en M01 para ver el argumento económico específico de 5 vs. 3 fracciones para su municipio.
        </EditorialCallout>
      )}

      {/* Evidence sections accordion */}
      <div className="space-y-2">
        {SECTIONS.map(section => {
          const Icon = section.icon
          const isOpen = openSection === section.id
          return (
            <div key={section.id} className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : section.id)}
                className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-[#FAFAF8] transition-colors"
              >
                <span className="w-7 h-7 rounded-full bg-[#3B6D11] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                  {section.num}
                </span>
                <Icon className="w-4 h-4 text-[#3B6D11] shrink-0" />
                <span className="flex-1 text-[12px] font-semibold text-[#1C1B18]">{section.title}</span>
                {section.adendoNums.length > 0 && (
                  <span className="text-[9px] text-[#A8A49C] hidden sm:inline">
                    Adendos {section.adendoNums.join(', ')}
                  </span>
                )}
                <ChevronDown className={cn('w-4 h-4 text-[#A8A49C] transition-transform', isOpen && 'rotate-180')} />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 border-t border-[#F0EDE5] pt-4 space-y-3">
                  {section.id === 'fracciones' && SEPARATION_SCHEMES.map(c => <EvidenceCard key={c.id} claim={c} />)}
                  {section.id === 'multas' && FINES_EVIDENCE.map(c => <EvidenceCard key={c.id} claim={c} />)}
                  {section.id === 'condominios' && CONDOMINIUM_EVIDENCE.map(c => <EvidenceCard key={c.id} claim={c} />)}
                  {section.id === 'registro' && REGISTRATION_EVIDENCE.map(c => <EvidenceCard key={c.id} claim={c} />)}

                  {section.id === 'tecnica' && (
                    <div className="space-y-3">
                      <p className="text-[11px] text-[#6B6760] leading-relaxed">
                        La técnica de <strong>adición de fracciones</strong> (vs. reforma integral) minimiza riesgo de
                        impugnación: no modifica artículos existentes sino que inserta obligaciones nuevas con numeración
                        propia. Cobertura normativa proyectada: {coberturaActual}% → {coberturaObjetivo}%.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ADENDO_JUSTIFICATION_MAP.map(a => (
                          <div key={a.adendoNum} className="flex items-start gap-2 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-3">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#3B6D11] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-[10px] font-semibold text-[#3B6D11]">Adendo {a.adendoNum}</p>
                              <p className="text-[10px] text-[#4A4740]">{a.title}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {section.id === 'comparativo' && (
                    <ChartPanel
                      chartId="dictamen-benchmarks"
                      title="Benchmarks internacionales"
                      subtitle="Esquemas de separación y desvío"
                    >
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px]">
                          <thead>
                            <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                              <th className="text-left px-3 py-2 font-semibold">Ciudad</th>
                              <th className="text-left px-3 py-2 font-semibold">Esquema</th>
                              <th className="text-right px-3 py-2 font-semibold">Desvío</th>
                              <th className="text-left px-3 py-2 font-semibold">Nota</th>
                              <th className="text-center px-3 py-2 font-semibold">Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {INTERNATIONAL_BENCHMARKS.map((b, i) => (
                              <tr key={b.city} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]')}>
                                <td className="px-3 py-2 font-medium">{b.city}, {b.country}</td>
                                <td className="px-3 py-2 text-[#6B6760]">{b.scheme}</td>
                                <td className="px-3 py-2 text-right font-mono">{b.diversionPct}%</td>
                                <td className="px-3 py-2 text-[#6B6760]">{b.complianceNote}</td>
                                <td className="px-3 py-2 text-center"><StatusBadge status={b.status} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </ChartPanel>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legal technique before/after */}
      <div className="rounded-[12px] border border-[#D7E8C0] bg-[#EAF3DE] px-5 py-4">
        <p className="text-[12px] font-semibold text-[#1A4200] mb-2">Conclusión para Cabildo</p>
        <p className="text-[11px] text-[#3B5F23] leading-relaxed">
          La reforma propuesta no es opinión de consultor: es traducción operativa del LGPGIR y NOM-161 con evidencia
          de ciudades comparables, economía del material verificable y diseño proporcional de sanciones. El dictamen
          técnico de la Dirección de Ecología debe anexarse al punto de acuerdo antes de la votación.
        </p>
      </div>

      <ModuleBottomBar onExportar={() => openReglamento(munId)} />
    </div>
  )
}
