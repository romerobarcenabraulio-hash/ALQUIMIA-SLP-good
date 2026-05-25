'use client'

import { useState } from 'react'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import {
  SOCIAL_COPY_LEGAL_PRE_MERGE_CHECKLIST,
  SOCIAL_COPY_PERMITTED_QUALIFIED,
  SOCIAL_COPY_PROHIBITED_PUBLIC,
  SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER,
} from '@/lib/socialContextPlaceholder'
import { SOCIAL_PR2_DEFERRED_NOTES } from '@/lib/social/pr2DeferredScopeNotes'
import { SocialAssumptionsLog } from '@/components/simulator/SocialAssumptionsLog'
import { SocialOfficialStatsSection } from '@/components/simulator/SocialOfficialStatsSection'
import { SocialQuantitativeVizSection } from '@/components/simulator/SocialQuantitativeVizSection'
import { OfficialSourcesReadingDisclosure } from '@/components/simulator/OfficialSourcesReadingDisclosure'
import { SocialRiskMatrixCards } from '@/components/simulator/SocialRiskMatrixCards'
import { SocialContextHandoffPanel } from '@/components/simulator/SocialContextHandoffPanel'
import { SocialAceptacionEncuesta } from '@/components/simulator/SocialAceptacionEncuesta'
import { CapacitacionTab } from '@/components/simulator/CapacitacionTab'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'

export type SocialView = 'diagnostico' | 'encuesta' | 'educacion' | 'impacto'

export type SocialDemographicContextPanelProps = {
  block: SociodemographicDisplayBlock
  moduleAnchor: string
  className?: string
  assumptionsPersistence?: 'local' | 'session'
  /** Si se define, muestra una sola sección sin tabs (módulo sidebar dedicado). */
  view?: SocialView
}

const TABS: { id: SocialView; label: string }[] = [
  { id: 'diagnostico', label: 'Diagnóstico' },
  { id: 'encuesta',    label: 'Encuesta ciudadana' },
  { id: 'educacion',   label: 'Plan educativo' },
  { id: 'impacto',     label: 'Estudio de impacto' },
]

const GEO_LABEL: Record<SociodemographicDisplayBlock['geo_scope'], string> = {
  municipio_cve: 'Municipio (clave / CVE inequívoca)',
  zm_estadistica: 'Zona metropolitana (marco estadístico)',
}

const DATO_LABEL: Record<SociodemographicDisplayBlock['dato'], string> = {
  disponible:      'Dato disponible',
  proxy:           'Proxy / estimación declarada',
  manual_usuario:  'Captura manual del usuario',
  no_disponible:   'Sin dato integrado en esta versión',
}

export function SocialDemographicContextPanel({
  block,
  moduleAnchor,
  className,
  assumptionsPersistence = 'local',
  view,
}: SocialDemographicContextPanelProps) {
  const [tabActivoInternal, setTabActivo] = useState<SocialView>('diagnostico')
  const tabActivo = view ?? tabActivoInternal
  const indicePreparacionCiudadana = useSimulatorStore(s =>
    (s as typeof s & { indicePreparacionCiudadana?: number | null }).indicePreparacionCiudadana ?? null
  )
  const municipio = useSimulatorStore(s => s.seleccionMunicipioCatalog)

  const isEmptyPublic =
    block.dato === 'no_disponible' &&
    (block.fuente_declarada?.trim().length ?? 0) === 0

  return (
    <section
      data-testid="social-context-root"
      data-module-anchor={moduleAnchor}
      className={cn('space-y-4', className)}
      aria-labelledby="social-demographic-context-title"
    >
      {/* Header */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">Módulo Social · M06</p>
        <h3 id="social-demographic-context-title" className="font-serif text-[20px] text-[#1C1B18]">
          Estudio Social y Educación Ciudadana
        </h3>
        <p className="mt-2 text-[12px] leading-relaxed text-[#6B6760]">
          El programa de separación tiene dos hemisferios: <span className="font-medium text-[#1C1B18]">condominios y privadas</span> (Adendos 1-11)
          y <span className="font-medium text-[#1C1B18]">casas en vía pública</span> (Adendo 12, en desarrollo).
          Este módulo genera la evidencia social para justificar políticamente ambos ante cabildo.
          Los datos de campo capturados aquí alimentan el módulo de riesgos del escenario.
        </p>

        {/* Indicadores rápidos */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">Municipio</p>
            <p className="text-[12px] font-medium text-[#1C1B18] truncate">{municipio?.nombre ?? '—'}</p>
          </div>
          <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">IPC ciudadano</p>
            <p className={cn(
              'text-[12px] font-bold',
              indicePreparacionCiudadana === null ? 'text-[#A8A49C]' :
              indicePreparacionCiudadana >= 70 ? 'text-[#3B6D11]' :
              indicePreparacionCiudadana >= 50 ? 'text-[#D4881E]' : 'text-[#C0392B]',
            )}>
              {indicePreparacionCiudadana !== null ? `${indicePreparacionCiudadana.toFixed(0)}/100` : 'Sin campo'}
            </p>
          </div>
          <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2">
            <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">Dato socio</p>
            <p className="text-[12px] font-medium text-[#1C1B18]">{DATO_LABEL[block.dato]}</p>
          </div>
        </div>
      </div>

      {/* Tabs — ocultos cuando el módulo tiene view fijo */}
      {!view && (
      <div className="flex gap-1 rounded-[10px] bg-[#F0EDE5] p-1">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActivo(tab.id)}
            className={cn(
              'flex-1 rounded-[8px] py-1.5 text-[11px] font-medium transition-all',
              tabActivo === tab.id
                ? 'bg-white text-[#1C1B18] shadow-sm'
                : 'text-[#6B6760] hover:text-[#1C1B18]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      )}

      {/* Tab: Diagnóstico */}
      {tabActivo === 'diagnostico' && (
        <div className="space-y-4">
          {/* Alcance geográfico y estado del dato */}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
              <dt className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">Alcance geográfico declarado</dt>
              <dd className="mt-1 text-[13px] font-medium text-[#1C1B18]" data-testid="social-context-geo-scope">
                {GEO_LABEL[block.geo_scope]}
              </dd>
            </div>
            <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
              <dt className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">Estado del dato</dt>
              <dd className="mt-1 text-[13px] font-medium text-[#1C1B18]" data-testid="social-context-dato-estado">
                {DATO_LABEL[block.dato]}
              </dd>
            </div>
            <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3 sm:col-span-2 xl:col-span-1">
              <dt className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">Fuente declarada</dt>
              <dd className="mt-1 text-[13px] text-[#1C1B18]" data-testid="social-context-fuente-declarada">
                {block.fuente_declarada.trim().length > 0 ? block.fuente_declarada : '—'}
              </dd>
            </div>
          </div>

          {isEmptyPublic && (
            <div
              data-testid="social-context-empty"
              className="rounded-[8px] border border-dashed border-[#C8C2B8] bg-[#FAF8F4] px-3 py-3 text-[12px] text-[#6B6760]"
            >
              Estado vacío: no hay serie sociodemográfica enlazada a este bloque.
              Cuando exista contrato de API y fuentes aprobadas, aparecerá el detalle verificable.
            </div>
          )}

          <div
            data-testid="social-context-disclaimer"
            className="rounded-[8px] border border-[#D4881E]/25 bg-[#FEF7E7]/80 px-3 py-3 text-[11px] leading-relaxed text-[#5C5740]"
          >
            <p className="font-medium text-[#1C1B18]">Antes de KPIs o inferencias sociales (Auditoría ALQUIMIA)</p>
            <p className="mt-1" data-testid="social-context-disclaimer-body">{SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER}</p>
            <details className="mt-3 rounded-[6px] border border-[#E8E4DC] bg-white/90 px-2 py-2 text-[#6B6760]" open>
              <summary className="cursor-pointer select-none text-[11px] font-medium text-[#1C1B18]">
                Guía de redacción pública y revisión Legal
              </summary>
              <div className="mt-2 grid gap-3 sm:grid-cols-2 border-t border-[#F0EDE5] pt-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">Prohibido en copy</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px]">
                    {SOCIAL_COPY_PROHIBITED_PUBLIC.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">Permitido con calificadores</p>
                  <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px]">
                    {SOCIAL_COPY_PERMITTED_QUALIFIED.map((line, i) => <li key={i}>{line}</li>)}
                  </ul>
                </div>
              </div>
              <div className="mt-2 border-t border-[#F0EDE5] pt-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">Checklist Legal antes de merge</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px]">
                  {SOCIAL_COPY_LEGAL_PRE_MERGE_CHECKLIST.map((line, i) => <li key={i}>{line}</li>)}
                </ul>
              </div>
            </details>
          </div>

          <OfficialSourcesReadingDisclosure variant="full" />
          <SocialOfficialStatsSection />
          <SocialQuantitativeVizSection />
          <SocialRiskMatrixCards />
          <SocialAssumptionsLog persistence={assumptionsPersistence} />
          <SocialContextHandoffPanel
            block={block}
            moduleAnchor={moduleAnchor}
            persistence={assumptionsPersistence}
          />
          <details
            data-testid="social-context-deferred-scope"
            className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#6B6760]"
          >
            <summary className="cursor-pointer font-medium text-[#1C1B18]">Alcance diferido (PR3 / PR4)</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {SOCIAL_PR2_DEFERRED_NOTES.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </details>
        </div>
      )}

      {/* Tab: Encuesta ciudadana */}
      {tabActivo === 'encuesta' && (
        <SocialAceptacionEncuesta />
      )}

      {/* Tab: Plan educativo */}
      {tabActivo === 'educacion' && (
        <CapacitacionTab />
      )}

      {/* Tab: Estudio de impacto */}
      {tabActivo === 'impacto' && (
        <div className="space-y-4">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">Documento para cabildo</p>
            <h3 className="font-serif text-[18px] text-[#1C1B18] mb-2">Estudio de Impacto Social</h3>
            <p className="text-[12px] text-[#6B6760] leading-relaxed">
              El Estudio de Impacto Social es el documento que convierte los datos de la encuesta de campo
              en evidencia jurídico-política para justificar el Adendo 12 (casas en vía pública)
              y el Anexo B (Programa de Capacitación Ciudadana) ante cabildo.
            </p>
          </div>

          {/* Estructura del documento */}
          <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Estructura del documento</p>
            <div className="space-y-2">
              {[
                { sec: '§1', titulo: 'Contexto demográfico', desc: 'Población, vivienda por tipo, estratificación ENIGH, índices CONAPO/CONEVAL', estado: 'Disponible' },
                { sec: '§2', titulo: 'Análisis de brechas', desc: 'Gap entre cobertura normativa actual y universo real (Hemisferio 1 + 2)', estado: 'Disponible' },
                { sec: '§3', titulo: 'Resultados de encuesta', desc: `IPC global y segmentado por tipo de vivienda · ${indicePreparacionCiudadana !== null ? 'Dato real de campo' : 'Pendiente de campo'}`, estado: indicePreparacionCiudadana !== null ? 'Con datos reales' : 'Requiere encuesta' },
                { sec: '§4', titulo: 'Plan educativo ciudadano', desc: 'Estrategia segmentada H1 / H2, costos, ventana de implementación', estado: 'Disponible' },
                { sec: '§5', titulo: 'Recomendación de implementación', desc: 'Ventana óptima de lanzamiento, secuencia de adendos, actores clave', estado: 'Disponible' },
                { sec: '§6', titulo: 'Grandes Generadores', desc: 'Cláusula: comercios y hoteles son auto-responsables — LGPGIR Art. 42', estado: 'Disponible' },
                { sec: 'Ane. B', titulo: 'Programa de Capacitación Ciudadana', desc: 'Requerimiento LGPGIR Art. 10 — incluido en paquete de adendos', estado: 'Disponible' },
              ].map(item => (
                <div key={item.sec} className="flex items-start gap-3 p-2 rounded-[6px] bg-[#F7F5F0]">
                  <span className="font-mono text-[10px] font-bold text-[#3B6D11] w-10 shrink-0 pt-0.5">{item.sec}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-[#1C1B18]">{item.titulo}</p>
                    <p className="text-[10px] text-[#6B6760]">{item.desc}</p>
                  </div>
                  <span className={cn(
                    'text-[9px] font-medium rounded-full px-2 py-0.5 shrink-0',
                    item.estado === 'Disponible' || item.estado === 'Con datos reales'
                      ? 'bg-[#F4FAEC] text-[#3B6D11] border border-[#D7E8C0]'
                      : 'bg-[#FEF7E7] text-[#D4881E] border border-[#D4881E]/30',
                  )}>
                    {item.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-4 text-[12px] text-[#6B6760]">
            <p className="font-medium text-[#1C1B18] mb-1">Export de documento completo</p>
            <p className="leading-relaxed">
              El export a PDF del Estudio de Impacto Social está disponible desde el módulo de Escenarios y Export (M09),
              donde se integra con el paquete de cotización y los adendos para entrega a cabildo.
              Completa la encuesta de campo (Tab "Encuesta ciudadana") para que §3 tenga datos reales.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
