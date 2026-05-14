'use client'

import { BookOpenCheck } from 'lucide-react'
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
      className="rounded-[12px] border border-[#D7E8C0] bg-[#F6FAEF] p-4"
      aria-label={`Lectura ejecutiva: ${brief.title}`}
      data-testid={`module-editorial-brief-${moduleId}`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.06em] text-[#3B6D11]">Lectura ejecutiva del módulo</p>
          <h3 className="mt-1 font-serif text-[20px] text-[#1C1B18]">{brief.title}</h3>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#5A6347]">
            {brief.situacion_actual}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#D7E8C0] bg-white px-3 py-1 text-[10px] uppercase tracking-[0.06em] text-[#3B6D11]">
          <BookOpenCheck size={13} aria-hidden />
          Observación técnica
        </span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <EditorialCard label="Qué observamos" value={brief.observacion_alquimia} />
        <EditorialCard label="Qué decisión habilita" value={brief.criterio_decision} />
        <EditorialCard label="Qué falta verificar" value={brief.siguiente_accion} />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-[1fr_1fr]">
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

function EditorialCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-[8px] border border-[#D7E8C0] bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#8CAA7A]">{label}</p>
      <p className="mt-1 text-[12px] leading-relaxed text-[#1C1B18]">{value}</p>
    </article>
  )
}
