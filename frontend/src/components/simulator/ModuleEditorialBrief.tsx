'use client'

import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
import { getRailActionLabel } from '@/lib/editorialRailLabels'
import { useModuleEditorialContext } from '@/lib/moduleEditorialContext'

export function ModuleEditorialBrief({
  moduleId,
  suppressTitle = false,
}: {
  moduleId: string
  suppressTitle?: boolean
}) {
  const briefCtx = useModuleEditorialContext()
  const brief = getModuleEditorialBrief(moduleId, briefCtx)

  if (!brief) return null

  const railLabel = getRailActionLabel(moduleId)

  return (
    <div
      className="space-y-0"
      aria-label={`Consideraciones del módulo: ${brief.title}`}
      data-testid={`module-editorial-brief-${moduleId}`}
    >
      {/* ── Situación actual ──────────────────────────────── */}
      {!suppressTitle && (
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#3B6D11]">
          {brief.title}
        </p>
      )}

      <div data-testid={`editorial-situacion-${moduleId}`}>
        <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#A8A49C] mb-1">
          Contexto del módulo
        </p>
        <p className="text-[12px] leading-[1.65] text-[#2C302A]">
          {brief.situacion_actual}
        </p>
      </div>

      {/* ── Observamos ────────────────────────────────────── */}
      <div className="pt-3 mt-3 border-t border-[#F0EDE5]">
        <div className="border-l-2 border-[#3B6D11] pl-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#5A8A3A] mb-1">
          Qué muestra el análisis
          </p>
          <p className="text-[12px] leading-[1.55] text-[#2C302A]">
            {brief.observacion_alquimia}
          </p>
        </div>
      </div>

      {/* ── Decisión que habilita ─────────────────────────── */}
      <div className="pt-3 mt-3 border-t border-[#F0EDE5]">
        <div className="border-l-2 border-[#1A5FA8] pl-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#1A5FA8] mb-1">
            Qué decide el funcionario aquí
          </p>
          <p className="text-[12px] leading-[1.55] text-[#2C302A]">
            {brief.criterio_decision}
          </p>
        </div>
      </div>

      {/* ── Qué falta verificar ───────────────────────────── */}
      <div className="pt-3 mt-3 border-t border-[#F0EDE5]">
        <div className="border-l-2 border-[#D4881E] pl-2.5">
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#D4881E] mb-1">
            {railLabel}
          </p>
          <p className="text-[12px] leading-[1.55] text-[#2C302A]">
            {brief.siguiente_accion}
          </p>
        </div>
      </div>

      {/* ── Metodología §1–§4 ─────────────────────────────── */}
      {brief.metodologia_editorial && (
        <div
          className="pt-3 mt-3 border-t border-[#F0EDE5] space-y-3"
          aria-label="Metodología y fuentes"
          data-testid={`editorial-metodologia-${moduleId}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#6B8C4A]">
            Metodología
          </p>

          <MetodologiaItem n={1} label="Cómo se calcula">
            {brief.metodologia_editorial.como_se_calcula}
          </MetodologiaItem>

          <MetodologiaItem n={2} label="Origen de los datos">
            {brief.metodologia_editorial.origen_datos}
          </MetodologiaItem>

          <MetodologiaItem n={3} label="Por qué este enfoque">
            {brief.metodologia_editorial.por_que_este_enfoque}
          </MetodologiaItem>

          <MetodologiaItem n={4} label="Supuesto crítico" accent>
            {brief.metodologia_editorial.supuesto_critico}
          </MetodologiaItem>
        </div>
      )}

      {/* ── Footer: límite + fuente ───────────────────────── */}
      <div className="pt-3 mt-3 border-t border-[#F0EDE5] space-y-2">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#A8A49C] mb-0.5">
            Límite de interpretación
          </p>
          <p className="text-[11px] leading-[1.5] text-[#6B6760]">
            {brief.que_no_significa}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.06em] text-[#A8A49C] mb-0.5">
            Fuente o evidencia
          </p>
          <p className="text-[11px] leading-[1.5] text-[#6B6760]">
            {brief.fuente_o_evidencia}
          </p>
        </div>
      </div>
    </div>
  )
}

function MetodologiaItem({
  n,
  label,
  accent = false,
  children,
}: {
  n: number
  label: string
  accent?: boolean
  children: string
}) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[#6B8C4A] mb-0.5">
        <span className="font-mono text-[9px] text-[#A8A49C] mr-1">§{n}</span>
        {label}
      </p>
      <p className={`text-[11px] leading-[1.55] ${accent ? 'text-[#2C302A] font-medium' : 'text-[#4A5041]'}`}>
        {children}
      </p>
    </div>
  )
}
