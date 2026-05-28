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
import { MunicipioDataAwaitingBanner } from '@/components/simulator/MunicipioDataAwaitingBanner'
import { useSimulatorStore } from '@/store/simulatorStore'
import { moduleNumber } from '@/lib/chapterConfig'
import { cn } from '@/lib/utils'
import {
  Conclusion,
  EditorialCallout,
  KpiAnchorGrid,
  MarginalNote,
  SectionLabel,
} from '@/components/editorial'
import { useTenantMunicipalProfile } from '@/hooks/useTenantMunicipalProfile'
import { TenantProfileStatus } from '@/components/simulator/TenantProfilePanels'

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

const MODULE_TITLES: Record<string, { kicker: string; title: string }> = {
  social_diagnostico: {
    kicker: 'Diagnóstico demográfico · M02',
    title: 'Diagnóstico demográfico y vulnerabilidad',
  },
  social_encuesta: {
    kicker: 'Encuesta ciudadana · M02B',
    title: 'Encuesta de aceptación y preparación ciudadana',
  },
  mapeo_actores: {
    kicker: 'Actores políticos · M02C',
    title: 'Mapa de actores y legitimidad política',
  },
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
  const { profile } = useTenantMunicipalProfile()

  const isEmptyPublic =
    block.dato === 'no_disponible' &&
    (block.fuente_declarada?.trim().length ?? 0) === 0

  const headerMeta = MODULE_TITLES[moduleAnchor] ?? {
    kicker: `Contexto social · M${moduleNumber(moduleAnchor)}`,
    title: 'Estudio social y participación ciudadana',
  }

  const preliminaryAssumptions = [
    {
      label: 'IPC ciudadano (supuesto)',
      value:
        indicePreparacionCiudadana !== null
          ? `${indicePreparacionCiudadana.toFixed(0)}/100`
          : '70/100 benchmark SEMARNAT',
    },
    {
      label: 'Fuente declarada',
      value: block.fuente_declarada?.trim() || 'Sin archivo municipal',
    },
    {
      label: 'Alcance geográfico',
      value: GEO_LABEL[block.geo_scope],
    },
  ]

  return (
    <section
      data-testid="social-context-root"
      data-module-anchor={moduleAnchor}
      className={cn('space-y-4', className)}
      aria-labelledby="social-demographic-context-title"
    >
      <MunicipioDataAwaitingBanner
        moduleLabel={headerMeta.title}
        moduleCode={`M${moduleNumber(moduleAnchor)}`}
        dato={block.dato}
        assumptions={preliminaryAssumptions}
        ctaLabel={
          view === 'encuesta'
            ? 'Programar levantamiento de encuesta'
            : 'Cargar estudio sociodemográfico'
        }
      />
      <TenantProfileStatus profile={profile} />

      {/* Header */}
      <header className="mx-auto max-w-4xl text-center">
        <SectionLabel>{headerMeta.kicker}</SectionLabel>
        <h3 id="social-demographic-context-title" className="font-serif text-[26px] leading-tight text-[#1C1B18]">
          {headerMeta.title}
        </h3>
        <Conclusion className="mx-auto mb-6 max-w-3xl text-[18px] md:text-[20px]">
          El programa de separación en ALQUIMIA distingue{' '}
          <span className="font-medium text-[#1C1B18]">condominios y privadas</span> (Adendos 1–11)
          de <span className="font-medium text-[#1C1B18]">vía pública</span> (Adendo 12).
          {view === 'encuesta'
            ? ' La encuesta cierra la brecha entre benchmark y disposición real antes de fijar captura en M13.'
            : ' Este módulo documenta rezago y vulnerabilidad antes de comprometer oleadas territoriales.'}
          {' '}Los supuestos visibles aquí alimentan el score de riesgo social en M14.
        </Conclusion>
        <KpiAnchorGrid
          columns={3}
          className="mx-auto max-w-4xl text-left"
          items={[
            { label: 'Municipio', value: municipio?.nombre ?? '—' },
            {
              label: 'IPC ciudadano',
              value: indicePreparacionCiudadana !== null ? `${indicePreparacionCiudadana.toFixed(0)}/100` : 'Sin campo',
              figureClassName: cn(
                indicePreparacionCiudadana === null ? 'text-[#A8A49C]' :
                indicePreparacionCiudadana >= 70 ? 'text-[#3B6D11]' :
                indicePreparacionCiudadana >= 50 ? 'text-[#D4881E]' : 'text-[#C0392B]',
              ),
            },
            { label: 'Dato socio', value: DATO_LABEL[block.dato] },
          ]}
        />
      </header>

      {/* Tabs — ocultos cuando el módulo tiene view fijo */}
      {!view && (
      <div className="flex gap-4 border-b border-[#E8E4DC]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabActivo(tab.id)}
            className={cn(
              'flex-1 border-b-2 py-2 text-[11px] font-medium transition-colors',
              tabActivo === tab.id
                ? 'border-[#1C1B18] text-[#1C1B18]'
                : 'border-transparent text-[#6B6760] hover:text-[#1C1B18]',
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
          <KpiAnchorGrid
            columns={3}
            items={[
              {
                label: 'Alcance geográfico declarado',
                value: GEO_LABEL[block.geo_scope],
              },
              {
                label: 'Estado del dato',
                value: DATO_LABEL[block.dato],
              },
              {
                label: 'Fuente declarada',
                value: block.fuente_declarada.trim().length > 0 ? block.fuente_declarada : '—',
              },
            ]}
          />
          <div className="sr-only">
            <span data-testid="social-context-geo-scope">{GEO_LABEL[block.geo_scope]}</span>
            <span data-testid="social-context-dato-estado">{DATO_LABEL[block.dato]}</span>
            <span data-testid="social-context-fuente-declarada">
              {block.fuente_declarada.trim().length > 0 ? block.fuente_declarada : '—'}
            </span>
          </div>

          {isEmptyPublic && (
            <div
              data-testid="social-context-empty"
              className="border-l border-[#C8C2B8] pl-3 text-[12px] text-[#8B5A00]"
            >
              Estado vacío: no hay serie sociodemográfica enlazada a este bloque.
              Cuando exista contrato de API y fuentes aprobadas, aparecerá el detalle verificable.
            </div>
          )}

          <EditorialCallout
            data-testid="social-context-disclaimer"
            tone="caution"
            label="Antes de KPIs o inferencias sociales (Auditoría ALQUIMIA)"
          >
            <p data-testid="social-context-disclaimer-body">{SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER}</p>
            <details className="mt-3 border-t border-[#E8E4DC] pt-2 text-[#6B6760]" open>
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
          </EditorialCallout>

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
            className="border-t border-[#E8E4DC] pt-3 text-[11px] text-[#6B6760]"
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
          <section className="mx-auto max-w-4xl text-center">
            <SectionLabel>Documento para cabildo</SectionLabel>
            <h3 className="mb-2 font-serif text-[26px] leading-tight text-[#1C1B18]">Estudio de Impacto Social</h3>
            <Conclusion className="mx-auto mb-6 max-w-3xl text-[18px] md:text-[20px]">
              El Estudio de Impacto Social convierte los datos de la encuesta de campo
              en evidencia jurídico-política para justificar el Adendo 12 (casas en vía pública)
              y el Anexo B (Programa de Capacitación Ciudadana) ante cabildo.
            </Conclusion>
          </section>

          {/* Estructura del documento */}
          <div>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#A8A49C]">Estructura del documento</p>
            <div className="divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
              {[
                { sec: '§1', titulo: 'Contexto demográfico', desc: 'Población, vivienda por tipo, estratificación ENIGH, índices CONAPO/CONEVAL', estado: 'Disponible' },
                { sec: '§2', titulo: 'Análisis de brechas', desc: 'Gap entre cobertura normativa actual y universo real (Hemisferio 1 + 2)', estado: 'Disponible' },
                { sec: '§3', titulo: 'Resultados de encuesta', desc: `IPC global y segmentado por tipo de vivienda · ${indicePreparacionCiudadana !== null ? 'Dato real de campo' : 'Pendiente de campo'}`, estado: indicePreparacionCiudadana !== null ? 'Con datos reales' : 'Requiere encuesta' },
                { sec: '§4', titulo: 'Plan educativo ciudadano', desc: 'Estrategia segmentada H1 / H2, costos, ventana de implementación', estado: 'Disponible' },
                { sec: '§5', titulo: 'Recomendación de implementación', desc: 'Ventana óptima de lanzamiento, secuencia de adendos, actores clave', estado: 'Disponible' },
                { sec: '§6', titulo: 'Grandes Generadores', desc: 'Cláusula: comercios y hoteles son auto-responsables — LGPGIR Art. 42', estado: 'Disponible' },
                { sec: 'Ane. B', titulo: 'Programa de Capacitación Ciudadana', desc: 'Requerimiento LGPGIR Art. 10 — incluido en paquete de adendos', estado: 'Disponible' },
              ].map(item => (
                <div key={item.sec} className="flex items-start gap-3 py-3">
                  <span className="w-10 shrink-0 pt-0.5 font-mono text-[10px] font-bold text-[#3B6D11]">{item.sec}</span>
                  <div className="flex-1">
                    <p className="text-[11px] font-medium text-[#1C1B18]">{item.titulo}</p>
                    <p className="text-[10px] text-[#6B6760]">{item.desc}</p>
                  </div>
                  <span className={cn(
                    'shrink-0 text-[9px] font-semibold',
                    item.estado === 'Disponible' || item.estado === 'Con datos reales'
                      ? 'text-[#3B6D11]'
                      : 'text-[#D4881E]',
                  )}>
                    {item.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <MarginalNote prefix="Export de documento completo">
            El export a PDF del Estudio de Impacto Social está disponible desde el módulo de Escenarios y Export (M09),
            donde se integra con el paquete de cotización y los adendos para entrega a cabildo.
            Completa la encuesta de campo (Tab &quot;Encuesta ciudadana&quot;) para que §3 tenga datos reales.
          </MarginalNote>
        </div>
      )}
    </section>
  )
}
