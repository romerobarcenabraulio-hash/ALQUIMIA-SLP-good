'use client'

import { BookOpenCheck, BookOpenText } from 'lucide-react'
import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
import {
  getEtiquetaNarrativaCiudad,
  getMunicipioMadurezVista,
} from '@/lib/municipioMadurezContexto'
import { useSimulatorStore } from '@/store/simulatorStore'

export function ModuleEditorialBrief({ moduleId }: { moduleId: string }) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const municipio = municipiosActivos.length === 1 ? getMunicipioMadurezVista(municipiosActivos[0] ?? '') : null
  const scope = municipiosActivos.length === 0 ? 'sin_municipio' : municipiosActivos.length === 1 ? 'municipio' : 'zm'
  const brief = getModuleEditorialBrief(moduleId, {
    territorio,
    scope,
    municipio,
    municipiosCount: municipiosActivos.length,
  })

  if (!brief) return null

  return (
    <section
      className="rounded-[12px] border border-[#D7E8C0] bg-[#F6FAEF] p-4 lg:p-5"
      aria-label={`Lectura ejecutiva: ${brief.title}`}
      data-testid={`module-editorial-brief-${moduleId}`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#3B6D11]">Lectura ejecutiva del módulo</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex rounded-md border border-[#B9C8A6] bg-white/90 px-2 py-0.5 font-mono text-[10px] font-semibold tabular-nums text-[#2F5A0C]"
              title="Artículo de síntesis · contexto del módulo"
            >
              S1
            </span>
            <h3 className="font-serif text-[clamp(1.125rem,2vw,1.375rem)] text-[#1C1B18]">{brief.title}</h3>
          </div>
          <p className="mt-3 w-full max-w-none text-[13px] leading-relaxed text-[#5A6347] lg:text-[14px] lg:leading-[1.55]">
            {brief.situacion_actual}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-2 self-start rounded-full border border-[#D7E8C0] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#3B6D11]">
          <BookOpenCheck size={13} aria-hidden />
          Observación técnica
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <EditorialCard sectionId="S16" label="Qué observamos" value={brief.observacion_alquimia} density="compact" />
        <EditorialCard sectionId="S15" label="Qué decisión habilita" value={brief.criterio_decision} density="compact" />
      </div>

      <div className="mt-3">
        <EditorialCard label="Qué falta verificar" value={brief.siguiente_accion} density="comfortable" />
      </div>

      {brief.metodologia_editorial && (
        <div
          className="mt-4 border-t border-[#D7E8C0] pt-4"
          aria-label="Metodología y fuentes"
          data-testid={`editorial-metodologia-${moduleId}`}
        >
          <p className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.06em] text-[#6B8C4A]">
            <BookOpenText size={11} aria-hidden />
            Cómo se calcula · consideraciones metodológicas
          </p>
          <p className="text-[12px] leading-[1.65] text-[#4A5041] lg:text-[13px]">
            {brief.metodologia_editorial.como_se_calcula}
          </p>
        </div>
      )}

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[#D7E8C0] bg-white px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#8CAA7A]">Límite de interpretación</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#5A6347]">{brief.que_no_significa}</p>
        </div>
        <div className="rounded-[8px] border border-[#D7E8C0] bg-white px-3 py-3">
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#8CAA7A]">Fuente o evidencia</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#5A6347]">{brief.fuente_o_evidencia}</p>
        </div>
      </div>
    </section>
  )
}

function EditorialCard({
  sectionId,
  label,
  value,
  density,
}: {
  sectionId?: string
  label: string
  value: string
  density: 'compact' | 'comfortable'
}) {
  const body = density === 'compact' ? 'text-[11px] leading-snug' : 'text-[12px] leading-relaxed'
  return (
    <article className="rounded-[8px] border border-[#D7E8C0] bg-white px-3 py-2.5 md:px-3 md:py-3">
      <p className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.06em] text-[#8CAA7A]">
        {sectionId ? (
          <span className="font-mono text-[9px] font-semibold tabular-nums text-[#5A7D3A]">{sectionId}</span>
        ) : null}
        <span>{label}</span>
      </p>
      <p className={`mt-1.5 text-[#1C1B18] ${body}`}>{value}</p>
    </article>
  )
}
