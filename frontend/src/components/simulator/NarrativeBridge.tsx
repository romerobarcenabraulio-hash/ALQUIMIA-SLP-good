'use client'

/**
 * Fase 22.3 — NarrativeBridge.
 *
 * Componente de "pegamento" entre cálculo y acción siguiente. Su `summary`
 * debe derivarse de datos reales del store o respuesta API; auditoría
 * rechaza copy estático.
 *
 * Navigator (datos, no tiles): al referir ZM vs municipio use
 * `traceabilityMunicipalVersusZmSummary` o copy equivalente derivado de IDs,
 * nunca implicar sanciones a nombre de la ZM única.
 */

import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { ArrowRight, Info, Sparkles, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getNarrativaIntro, resolveCitizenNarrativaContext } from '@/lib/narrativaIntro'
import {
  aplicarPlaceholdersTerritorio,
  getEtiquetaNarrativaCiudad,
} from '@/lib/municipioMadurezContexto'

export type NarrativeBridgeVariant = 'result' | 'warning' | 'bridge'

export interface NarrativeBridgeEvidence {
  label: string
  value: string
}

export interface NarrativeBridgeNextStep {
  label: string
  helper?: string
  href?: string
  onClick?: () => void
}

export interface NarrativeBridgeSource {
  fuente: string
  unidad?: string
  incertidumbre?: string
}

export interface NarrativeBridgeProps {
  kicker: string
  title?: string
  summary: string
  evidence?: NarrativeBridgeEvidence[]
  nextStep?: NarrativeBridgeNextStep
  variant?: NarrativeBridgeVariant
  source?: NarrativeBridgeSource
  audience?: 'citizen' | 'functionary' | 'entrepreneur'
  className?: string
  /**
   * Sustituye en `title` y `summary` marcadores como «tu ciudad» (y «tu municipio» si hay un solo municipio en programa).
   * Por defecto: activo cuando `audience === 'citizen'`.
   */
  personalizarTerritorioEnCopy?: boolean
}

const VARIANT_STYLES: Record<NarrativeBridgeVariant, { container: string; kicker: string; icon: ReactNode }> = {
  result: {
    container: 'border-[#C9DDB1] bg-[#F1F6E5]',
    kicker: 'text-[#23470A]',
    icon: <Sparkles className="h-4 w-4 text-[#3B6D11]" aria-hidden />,
  },
  warning: {
    container: 'border-amber-300 bg-amber-50',
    kicker: 'text-amber-900',
    icon: <TriangleAlert className="h-4 w-4 text-amber-700" aria-hidden />,
  },
  bridge: {
    container: 'border-[#E8E4DC] bg-[#FDFCFA]',
    kicker: 'text-[#A8A49C]',
    icon: <Info className="h-4 w-4 text-[#6B6760]" aria-hidden />,
  },
}

export function NarrativeBridge({
  kicker,
  title,
  summary,
  evidence,
  nextStep,
  variant = 'bridge',
  source,
  audience,
  className,
  personalizarTerritorioEnCopy,
}: NarrativeBridgeProps) {
  const styles = VARIANT_STYLES[variant]
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)

  const personalizar = personalizarTerritorioEnCopy ?? audience === 'citizen'
  const unSoloMunicipio = municipiosActivos.filter(Boolean).length === 1

  const { titleShown, summaryShown } = useMemo(() => {
    if (!personalizar) {
      return { titleShown: title, summaryShown: summary }
    }
    const etiqueta = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
    const opts = { unSoloMunicipioEnPrograma: unSoloMunicipio }
    return {
      titleShown: title ? aplicarPlaceholdersTerritorio(title, etiqueta, opts) : title,
      summaryShown: aplicarPlaceholdersTerritorio(summary, etiqueta, opts),
    }
  }, [personalizar, title, summary, municipiosActivos, zmActiva, unSoloMunicipio])

  return (
    <aside
      className={cn(
        'mt-4 rounded-[14px] border px-5 py-4 shadow-[0_1px_0_rgba(28,27,24,0.04)]',
        styles.container,
        className,
      )}
      role="note"
      data-audience={audience}
    >
      <div className="flex items-center gap-2">
        {styles.icon}
        <p className={cn('text-[10px] uppercase tracking-[0.14em]', styles.kicker)}>{kicker}</p>
      </div>
      {titleShown && (
        <h3 className="mt-2 font-serif text-[20px] leading-tight text-[#1C1B18]">{titleShown}</h3>
      )}
      {(() => {
        const parts = summaryShown.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
        if (parts.length <= 1) {
          return <p className="mt-2 text-[13px] leading-relaxed text-[#1C1B18]">{summaryShown}</p>
        }
        return (
          <div className="mt-2 space-y-3">
            {parts.map((part, i) => (
              <p key={i} className="text-[13px] leading-relaxed text-[#1C1B18]">
                {part}
              </p>
            ))}
          </div>
        )
      })()}

      {evidence && evidence.length > 0 && (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {evidence.slice(0, 4).map(item => (
            <div
              key={`${item.label}:${item.value}`}
              className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-2"
            >
              <dt className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{item.label}</dt>
              <dd className="mt-1 font-mono text-[14px] text-[#1C1B18]">{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {source && (
        <p className="mt-3 text-[11px] text-[#6B6760]">
          Fuente: {source.fuente}
          {source.unidad ? ` · Unidad: ${source.unidad}` : ''}
          {source.incertidumbre ? ` · Incertidumbre: ${source.incertidumbre}` : ''}
        </p>
      )}

      {nextStep && (nextStep.href || nextStep.onClick || nextStep.helper) && (
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-[#E8E4DC] pt-3">
          <span className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49C]">Acción siguiente</span>
          {nextStep.href ? (
            <a
              href={nextStep.href}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#3B6D11] hover:underline"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          ) : nextStep.onClick ? (
            <button
              type="button"
              onClick={nextStep.onClick}
              className="inline-flex items-center gap-2 text-[13px] font-medium text-[#3B6D11] hover:underline"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {nextStep.helper && (
            <span className="text-[12px] text-[#6B6760]">{nextStep.helper}</span>
          )}
        </div>
      )}
    </aside>
  )
}

const INTRO_CITIZEN_P2 =
  'Separar en origen arrima empleo formal —recolección diferenciada y operación de centros— y baja la factura municipal por tonelada enterrada. Menos residuo al relleno significa menos exposición sanitaria en colonias colindantes y menos subsidio encubierto al destino final.'

const INTRO_FUNCTIONARY_P1 =
  'Este recorrido entrega números defendibles: captura por fracción, derrama por valorización, VPN y TIR bajo supuestos explícitos. El diagnóstico jurídico —S4.6— aísla qué puede hacer hoy tu reglamento de limpia y qué exige reforma antes de multar o contratar.'
const INTRO_FUNCTIONARY_P2 =
  'Verás el roadmap reglamentario hasta Periódico Oficial, el plan de implementación por oleadas y los entregables tipo Cabildo. Nada se presenta como dictamen cerrado: cada cifra lleva trazabilidad para que Jurídico y Obras la defiendan en sesión.'

const INTRO_ENTREPRENEUR_P1 =
  'Aquí ordenas tu posición frente al RSU municipal: volúmenes esperables, precios de commodity que el modelo usa y el benchmark de tu giro frente a LATAM. El tablero cuantifica pasivo ambiental implícito —lo que deja de ir a relleno pasa a reporte de circularidad.'
const INTRO_ENTREPRENEUR_P2 =
  'La salida no es un PDF genérico: es argumentario para mesa con municipio o cabildo, con sensibilidad a captura y a plena cobertura. Si inviertes en infraestructura de acopio, ves cómo la concesión se paga y dónde revienta el escenario adverso.'

/** Intro al simulador por audiencia — tono técnico-político, dos párrafos.
 * Ciudadános: territorio y cifras desde `resolveCitizenNarrativaContext` (municipio único, subconjunto o ZM completa).
 */
export function NarrativaIntroBridge({ className }: { className?: string }) {
  const audience = useSimulatorStore(s => s.audience)
  const escenario = useSimulatorStore(s => s.presetTrayectoria)
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const seleccionMunicipioCatalog = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const mesInicio = useSimulatorStore(s => s.mesInicio)
  const snapshotDatos = useSimulatorStore(s => s.snapshotDatos)

  const narrativaCtx = useMemo(
    () => resolveCitizenNarrativaContext(useSimulatorStore.getState()),
    [zmActiva, municipiosActivos, seleccionMunicipioCatalog, genPercapita, mesInicio, snapshotDatos],
  )

  if (!audience) return null

  if (audience === 'citizen') {
    let p1: string
    if (narrativaCtx) {
      const t = getNarrativaIntro(
        narrativaCtx.municipioId,
        narrativaCtx.territorioNombre,
        narrativaCtx.poblacion,
        narrativaCtx.rsuDia,
        escenario,
        narrativaCtx.esEstimado,
        narrativaCtx.scope,
      )
      p1 =
        t ||
        'El programa municipal no avanza por falta de voluntad única —falta evidencia pública de que la separación paga y que el reglamento la respalda.'
    } else {
      p1 =
        'El problema no es solo recolectar más toneladas. Es decidir, con números, qué fracción del flujo se valoriza antes del relleno y quién en la cadena captura ese valor.'
    }
    return (
      <NarrativeBridge
        kicker="Lectura ciudadana"
        summary={`${p1}\n\n${INTRO_CITIZEN_P2}`}
        variant="bridge"
        audience="citizen"
        className={className}
      />
    )
  }

  if (audience === 'functionary') {
    return (
      <NarrativeBridge
        kicker="Lectura institucional"
        summary={`${INTRO_FUNCTIONARY_P1}\n\n${INTRO_FUNCTIONARY_P2}`}
        variant="bridge"
        audience="functionary"
        className={className}
      />
    )
  }

  if (audience === 'entrepreneur') {
    return (
      <NarrativeBridge
        kicker="Lectura empresarial"
        summary={`${INTRO_ENTREPRENEUR_P1}\n\n${INTRO_ENTREPRENEUR_P2}`}
        variant="bridge"
        audience="entrepreneur"
        className={className}
      />
    )
  }

  return null
}

/** Resumen derivado: ZM = coordinación agregada; efectos legales por municipio (`municipio_id`) según alcance Navigator en datos. */
export function traceabilityMunicipalVersusZmSummary(zmLabel: string, municipalIds: readonly string[]): string {
  const ids = municipalIds.length ? municipalIds.join(', ') : 'sin municipios activos'
  return (
    `ZM ${zmLabel}: vista territorial y de coordinación agregada. `
    + `Artículos, scores jurídicos y vías de sanción en esta simulación aplican por municipio (${ids}); `
    + 'la zona metropolitana no actúa como autoridad sancionatoria única.'
  )
}
