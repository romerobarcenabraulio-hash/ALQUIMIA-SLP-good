'use client'

/**
 * NarrativeBridge — pegamento cálculo → acción.
 * Layout consulting-editorial (sin cajas de color); delega en componentes editorial/.
 */

import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getNarrativaIntro, resolveCitizenNarrativaContext } from '@/lib/narrativaIntro'
import {
  aplicarSustitucionesTerritorio,
  getEtiquetaNarrativaCiudad,
} from '@/lib/municipioMadurezContexto'
import { Conclusion } from '@/components/editorial/Conclusion'
import { AnchorFigure } from '@/components/editorial/AnchorFigure'
import { SectionLabel } from '@/components/editorial/SectionLabel'
import { MarginalNote } from '@/components/editorial/MarginalNote'
import { editorial } from '@/components/editorial/editorialStyles'
import { MetricSourceTraceLink } from '@/components/credibility'

export type NarrativeBridgeVariant = 'result' | 'warning' | 'bridge'

export interface NarrativeBridgeEvidence {
  label: string
  value: string
  /** Abre M19 con traza de fuente y estándar */
  traceKey?: string
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
  kicker?: string
  title?: string
  summary: string
  evidence?: NarrativeBridgeEvidence[]
  nextStep?: NarrativeBridgeNextStep
  variant?: NarrativeBridgeVariant
  source?: NarrativeBridgeSource
  audience?: 'citizen' | 'functionary' | 'entrepreneur'
  className?: string
  personalizarTerritorioEnCopy?: boolean
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
      titleShown: title ? aplicarSustitucionesTerritorio(title, etiqueta, opts) : title,
      summaryShown: aplicarSustitucionesTerritorio(summary, etiqueta, opts),
    }
  }, [personalizar, title, summary, municipiosActivos, zmActiva, unSoloMunicipio])

  const showKicker =
    kicker &&
    !/^S\d+\s*[·—-]/i.test(kicker.trim()) &&
    !/^Lectura\b/i.test(kicker.trim())

  const tone = variant === 'warning' ? 'caution' : 'default'
  const parts = summaryShown.split(/\n\n+/).map(p => p.trim()).filter(Boolean)

  return (
    <section
      className={cn('mt-5', className)}
      role="note"
      data-audience={audience}
      data-variant={variant}
    >
      {showKicker && <SectionLabel>{kicker}</SectionLabel>}

      {titleShown && (
        <h3 className="font-serif text-[20px] leading-tight text-gray-900c mb-3">{titleShown}</h3>
      )}

      {parts.length <= 1 ? (
        <Conclusion tone={tone} className={showKicker || titleShown ? 'mt-0' : undefined}>
          {summaryShown}
        </Conclusion>
      ) : (
        <div className="space-y-5">
          {parts.map((part, i) => (
            <Conclusion key={i} tone={tone} className="mb-0">
              {part}
            </Conclusion>
          ))}
        </div>
      )}

      {evidence && evidence.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6 mt-6">
          {evidence.slice(0, 4).map(item => (
            <AnchorFigure
              key={`${item.label}:${item.value}`}
              figure={
                item.traceKey ? (
                  <MetricSourceTraceLink traceKey={item.traceKey} className="font-serif text-[28px]">
                    {item.value}
                  </MetricSourceTraceLink>
                ) : (
                  item.value
                )
              }
              context={item.label}
            />
          ))}
        </div>
      )}

      {source && (
        <MarginalNote prefix="Fuente" className="mt-4">
          {source.fuente}
          {source.unidad ? ` · Unidad: ${source.unidad}` : ''}
          {source.incertidumbre ? ` · Incertidumbre: ${source.incertidumbre}` : ''}
        </MarginalNote>
      )}

      {nextStep && (nextStep.href || nextStep.onClick || nextStep.helper) && (
        <div className={cn('mt-4 flex flex-wrap items-center gap-3', editorial.divider, 'pt-4')}>
          {nextStep.href ? (
            <a
              href={nextStep.href}
              className="inline-flex min-h-[44px] items-center gap-2 text-[13px] font-medium text-green-600a hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B6D11] rounded-[4px]"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          ) : nextStep.onClick ? (
            <button
              type="button"
              onClick={nextStep.onClick}
              className="inline-flex min-h-[44px] items-center gap-2 text-[13px] font-medium text-green-600a hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B6D11] rounded-[4px]"
            >
              {nextStep.label}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
          {nextStep.helper && (
            <span className="text-[12px] text-gray-600c">{nextStep.helper}</span>
          )}
        </div>
      )}
    </section>
  )
}

const INTRO_CITIZEN_P2 =
  'Separar en origen arrima empleo formal —recolección diferenciada y operación de centros— y baja la factura municipal por tonelada enterrada. Menos residuo al relleno significa menos exposición sanitaria en colonias colindantes y menos subsidio encubierto al destino final.'

const INTRO_FUNCTIONARY_P1 =
  'Este recorrido entrega números defendibles: captura por fracción, derrama por valorización, VPN y TIR bajo supuestos explícitos. El módulo M03B · Marco legal aísla qué puede hacer hoy su reglamento de limpia y qué exige reforma antes de multar o contratar.'
const INTRO_FUNCTIONARY_P2 =
  'Verás el roadmap reglamentario hasta Periódico Oficial, el plan de implementación por oleadas y los entregables tipo Cabildo. Nada se presenta como dictamen cerrado: cada cifra lleva trazabilidad para que Jurídico y Obras la defiendan en sesión.'

const INTRO_ENTREPRENEUR_P1 =
  'Aquí ordenas tu posición frente al RSU municipal: volúmenes esperables, precios de commodity que el modelo usa y el benchmark de tu giro frente a LATAM. El tablero cuantifica pasivo ambiental implícito —lo que deja de ir a relleno pasa a reporte de circularidad.'
const INTRO_ENTREPRENEUR_P2 =
  'La salida no es un PDF genérico: es argumentario para mesa con municipio o cabildo, con sensibilidad a captura y a plena cobertura. Si inviertes en infraestructura de acopio, ves cómo la concesión se paga y dónde revienta el escenario adverso.'

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

  const kicker =
    audience === 'citizen'
      ? 'Lectura ciudadana'
      : audience === 'functionary'
        ? 'Lectura institucional'
        : 'Lectura empresarial'

  let summary: string
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
    summary = `${p1}\n\n${INTRO_CITIZEN_P2}`
  } else if (audience === 'functionary') {
    summary = `${INTRO_FUNCTIONARY_P1}\n\n${INTRO_FUNCTIONARY_P2}`
  } else {
    summary = `${INTRO_ENTREPRENEUR_P1}\n\n${INTRO_ENTREPRENEUR_P2}`
  }

  return (
    <NarrativeBridge
      kicker={kicker}
      summary={summary}
      variant="bridge"
      audience={audience}
      className={className}
    />
  )
}

export function traceabilityMunicipalVersusZmSummary(zmLabel: string, municipalIds: readonly string[]): string {
  const ids = municipalIds.length ? municipalIds.join(', ') : 'sin municipios activos'
  return (
    `ZM ${zmLabel}: vista territorial y de coordinación agregada. `
    + `Artículos, scores jurídicos y vías de sanción en esta simulación aplican por municipio (${ids}); `
    + 'la zona metropolitana no actúa como autoridad sancionatoria única.'
  )
}
