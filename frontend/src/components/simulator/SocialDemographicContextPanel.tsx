'use client'

import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import {
  SOCIAL_COPY_LEGAL_PRE_MERGE_CHECKLIST,
  SOCIAL_COPY_PERMITTED_QUALIFIED,
  SOCIAL_COPY_PROHIBITED_PUBLIC,
  SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER,
} from '@/lib/socialContextPlaceholder'
import { SOCIAL_PR2_DEFERRED_NOTES } from '@/lib/social/pr2DeferredScopeNotes'
import { SocialAssumptionsLog } from '@/components/simulator/SocialAssumptionsLog'
import { SocialContextExportPreviewSection } from '@/components/simulator/SocialContextExportPreviewSection'
import { SocialOfficialStatsSection } from '@/components/simulator/SocialOfficialStatsSection'
import { SocialQuantitativeVizSection } from '@/components/simulator/SocialQuantitativeVizSection'
import { OfficialSourcesReadingDisclosure } from '@/components/simulator/OfficialSourcesReadingDisclosure'
import { SocialRiskMatrixCards } from '@/components/simulator/SocialRiskMatrixCards'
import { SocialContextHandoffPanel } from '@/components/simulator/SocialContextHandoffPanel'
import { cn } from '@/lib/utils'

export type SocialDemographicContextPanelProps = {
  /** Declaración obligatoria de alcance y estado del dato (sin persistencia en PR1). */
  block: SociodemographicDisplayBlock
  /** Identificador estable para telemetría / E2E (p. ej. `municipal_context`). */
  moduleAnchor: string
  className?: string
  /** PR2 — bitácora de supuestos: localStorage vs sessionStorage. */
  assumptionsPersistence?: 'local' | 'session'
}

const GEO_LABEL: Record<SociodemographicDisplayBlock['geo_scope'], string> = {
  municipio_cve: 'Municipio (clave / CVE inequívoca)',
  zm_estadistica: 'Zona metropolitana (marco estadístico)',
}

const DATO_LABEL: Record<SociodemographicDisplayBlock['dato'], string> = {
  disponible: 'Dato disponible',
  proxy: 'Proxy / estimación declarada',
  manual_usuario: 'Captura manual del usuario',
  no_disponible: 'Sin dato integrado en esta versión',
}

export function SocialDemographicContextPanel({
  block,
  moduleAnchor,
  className,
  assumptionsPersistence = 'local',
}: SocialDemographicContextPanelProps) {
  const isEmptyPublic =
    block.dato === 'no_disponible' &&
    (block.fuente_declarada?.trim().length ?? 0) === 0

  return (
    <section
      data-testid="social-context-root"
      data-module-anchor={moduleAnchor}
      className={cn(
        'rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 shadow-[0_1px_0_rgba(28,27,24,0.03)]',
        className,
      )}
      aria-labelledby="social-demographic-context-title"
    >
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760]">Capa social / demografía</p>
      <h3 id="social-demographic-context-title" className="mt-1 font-serif text-[20px] text-[#1C1B18]">
        Marco de lectura sociodemográfica
      </h3>
      <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
        Cada indicador sociodemográfico debe declarar su{' '}
        <span className="font-medium text-[#1C1B18]">alcance geográfico inequívoco</span> y cómo llegó el dato. En esta versión
        el simulador no integra series demográficas externas: solo el andamiaje de estados y fuentes.{' '}
        <span className="font-medium text-[#1C1B18]">
          Municipio activo ≠ zona metropolitana
        </span>
        : no extrapolar a sanción, consulta ciudadana ni legitimación sin base documental por territorio.
      </p>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
          <dt className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">Alcance geográfico declarado</dt>
          <dd
            className="mt-1 text-[13px] font-medium text-[#1C1B18]"
            data-testid="social-context-geo-scope"
            data-geo-scope={block.geo_scope}
          >
            {GEO_LABEL[block.geo_scope]}
          </dd>
        </div>
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
          <dt className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">Estado del dato</dt>
          <dd
            className="mt-1 text-[13px] font-medium text-[#1C1B18]"
            data-testid="social-context-dato-estado"
            data-dato={block.dato}
          >
            {DATO_LABEL[block.dato]}
          </dd>
        </div>
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3 sm:col-span-2">
          <dt className="text-[10px] uppercase tracking-[0.06em] text-[#6B6760]">Fuente declarada</dt>
          <dd
            className="mt-1 text-[13px] text-[#1C1B18]"
            data-testid="social-context-fuente-declarada"
          >
            {block.fuente_declarada.trim().length > 0 ? block.fuente_declarada : '—'}
          </dd>
        </div>
      </dl>

      {isEmptyPublic && (
        <div
          data-testid="social-context-empty"
          className="mt-4 rounded-[8px] border border-dashed border-[#C8C2B8] bg-[#FAF8F4] px-3 py-3 text-[12px] text-[#6B6760]"
        >
          Estado vacío: no hay serie sociodemográfica enlazada a este bloque. Cuando exista contrato de API y fuentes aprobadas,
          aparecerá el detalle verificable sin mezclar municipio y ZM.
        </div>
      )}

      <div
        data-testid="social-context-disclaimer"
        className="mt-4 rounded-[8px] border border-[#D4881E]/25 bg-[#FEF7E7]/80 px-3 py-3 text-[11px] leading-relaxed text-[#5C5740]"
      >
        <p className="font-medium text-[#1C1B18]">Antes de KPIs o inferencias sociales (Auditoría ALQUIMIA)</p>
        <p className="mt-1" data-testid="social-context-disclaimer-body">
          {SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER}
        </p>
        <details className="mt-3 rounded-[6px] border border-[#E8E4DC] bg-white/90 px-2 py-2 text-[#6B6760]">
          <summary className="cursor-pointer select-none text-[11px] font-medium text-[#1C1B18]">
            Guía de redacción pública y revisión Legal
          </summary>
          <div className="mt-2 grid gap-3 sm:grid-cols-2 border-t border-[#F0EDE5] pt-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">Prohibido en copy</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px]">
                {SOCIAL_COPY_PROHIBITED_PUBLIC.map((line, i) => (
                  <li key={`prohibited-${i}`}>{line}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">Permitido con calificadores</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px]">
                {SOCIAL_COPY_PERMITTED_QUALIFIED.map((line, i) => (
                  <li key={`permitted-${i}`}>{line}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-2 border-t border-[#F0EDE5] pt-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#6B6760]">
              Checklist Legal antes de merge de textos
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[10px]">
              {SOCIAL_COPY_LEGAL_PRE_MERGE_CHECKLIST.map((line, i) => (
                <li key={`legal-${i}`}>{line}</li>
              ))}
            </ul>
          </div>
        </details>
      </div>

      <OfficialSourcesReadingDisclosure className="mt-4" variant="full" />

      <SocialOfficialStatsSection />

      <SocialQuantitativeVizSection />

      <SocialRiskMatrixCards />
      <SocialAssumptionsLog persistence={assumptionsPersistence} />

      <SocialContextHandoffPanel
        block={block}
        moduleAnchor={moduleAnchor}
        persistence={assumptionsPersistence}
      />

      <SocialContextExportPreviewSection
        block={block}
        moduleAnchor={moduleAnchor}
        persistence={assumptionsPersistence}
      />

      <details
        data-testid="social-context-deferred-scope"
        className="mt-6 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] text-[#6B6760]"
      >
        <summary className="cursor-pointer font-medium text-[#1C1B18]">Alcance diferido (PR3 / PR4)</summary>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          {SOCIAL_PR2_DEFERRED_NOTES.map((line, i) => (
            <li key={`defer-${i}`}>{line}</li>
          ))}
        </ul>
      </details>
    </section>
  )
}
