'use client'

import { useState, useMemo, type ReactNode } from 'react'
import {
  ArrowRight, ChevronDown, Recycle,
  BarChart3, Scale, Target,
  CheckCircle2, MapPin,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { NarrativaIntroBridge } from '@/components/simulator/NarrativeBridge'
import {
  CHAPTERS,
  FUNCTIONARY_MODULE_ORDER,
  moduleNumber,
  type ChapterDef,
} from '@/lib/chapterConfig'
import { M01_NEXT_ACTION } from '@/lib/editorialRailLabels'
import { CLIENT_FUNCTIONARY_MODULES } from '@/lib/simulator/clientModuleRegistry'

const fmtN = (n: number) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n)
const fmtMxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

const MODULE_COUNT = FUNCTIONARY_MODULE_ORDER.length
const CHAPTER_COUNT = CHAPTERS.length

interface StepModule {
  label: string
  id: string
}

interface NarrativeCtx {
  municipio: string
  rsuTonDia: number
  pctCaptura: number
  empleos: number
  ingresosMunicipio: number
  co2e: number
  horizonte: number
  nCAs: number
  tir: number
}

interface StepDef {
  num: number
  icon: LucideIcon
  tag: string
  title: string
  question: string
  color: string
  bgColor: string
  borderColor: string
  modules: StepModule[]
  body: (ctx: NarrativeCtx) => string
  learns: string[]
}

const CHAPTER_ICONS: Record<number, LucideIcon> = {
  1: MapPin,
  2: Target,
  3: Scale,
  4: BarChart3,
}

const CHAPTER_SUBQUESTIONS: Record<number, string> = {
  1: 'Entender el municipio antes de proponer soluciones',
  2: '¿Cuánta infraestructura, logística, personal y dinero se requiere?',
  3: 'Qué le presentamos al Cabildo para que vote',
  4: 'Cómo se opera y se demuestra que funciona',
}

const CHAPTER_NARRATIVES: Record<
  number,
  { body: (ctx: NarrativeCtx) => string; learns: string[] }
> = {
  1: {
    body: (ctx) =>
      `${ctx.municipio} genera aproximadamente ${fmtN(ctx.rsuTonDia)} toneladas de RSU al día; hoy se recupera menos del 6%. El Capítulo 1 recorre trece módulos: línea base e impacto ambiental (M01–M01B), diagnóstico social, encuesta de aceptación y mapeo de actores (M02–M02C), organigrama actual, capacidad institucional, marco legal con brechas normativas, cobertura territorial, dictamen técnico, costo de omisión, evaluación socioeconómica y teoría de cambio.\n\nLa secuencia importa: no conviene reformar el reglamento sin medir disposición ciudadana ni mapear quién opera el servicio hoy. Este capítulo entrega el punto de partida defendible ante Cabildo, financiadores y auditoría.`,
    learns: [
      'Generación diaria de RSU por material, con fuente SEMARNAT/INEGI',
      'Índice de Preparación Ciudadana y encuesta de aceptación por tipo de vivienda',
      'Brechas del reglamento vigente y dictamen técnico de la reforma',
      'Costo contrafactual de no actuar en 10 años y evaluación socioeconómica',
      'Teoría de cambio que conecta diagnóstico con planificación',
    ],
  },
  2: {
    body: (ctx) =>
      `Con el diagnóstico cerrado, nueve módulos definen la solución operativa: plan maestro con curva de captura, ruta crítica y oleadas territoriales; infraestructura de centros de acopio (${ctx.nCAs} CAs en el escenario activo), organigrama objetivo con RACI, logística y plan educativo; CAPEX/OPEX desglosado y mercado de materiales.\n\nSin costos no hay presupuesto. Sin organigrama no hay responsables. Sin mercado no hay ingresos. Este capítulo responde lo que el director de finanzas pregunta primero: cuánto cuesta, quién opera y a quién se vende el material recuperado.`,
    learns: [
      'Curva de captura bajo escenarios ambicioso, moderado y conservador',
      'Ruta crítica, oleadas territoriales y mix de centros de acopio P/M/G',
      'Organigrama del programa con roles, RACI y plantilla por tipo de CA',
      'CAPEX y OPEX con desglose de equipos, personal y contingencia',
      'Compradores y precios spot por fracción: PET, aluminio, papel, vidrio, composta',
    ],
  },
  3: {
    body: (ctx) =>
      `El Cabildo no vota la técnica: vota el modelo de negocio. Cinco módulos responden quién opera bajo cuatro esquemas (municipal, concesionado, APP, fideicomiso), presentan escenarios financieros con Monte Carlo — bajo el escenario base el municipio proyecta ${fmtMxn(ctx.ingresosMunicipio)} anuales y TIR ${fmtN(ctx.tir)}% —, mapean seis caminos de financiamiento, evalúan riesgos y consolidan el expediente para sesión de Cabildo.\n\nAquí se detienen muchos programas municipales: nadie contestó quién pone el capital, quién asume el riesgo operativo y cómo se reparte el ingreso.`,
    learns: [
      'Cuatro esquemas de concesión: capital, operación y reparto de ingresos',
      'Escenarios P10/P50/P90 de TIR y VPN con tornado de sensibilidad',
      'Seis caminos de financiamiento con elegibilidad y costo de capital',
      'Riesgos del modelo rankeados por probabilidad × impacto',
      'Expediente consolidado listo para presentación ante Cabildo',
    ],
  },
  4: {
    body: (ctx) =>
      `Ocho módulos cubren la operación y el reporteo: inspección escalonada (educación → advertencia → sanción), monitoreo proyectado vs. real, doble materialidad GRI 306 / ESRS E5, trazabilidad de fuentes, control presupuestal (EVM y conciliación mensual) y tableros de riesgo con gate de cierre.\n\nEl programa proyecta evitar ${fmtN(ctx.co2e)} t CO₂e/año — dato usable ante fondos verdes. Cada cifra del simulador lleva fórmula, fuente y estado de verificación.`,
    learns: [
      'Inspección alineada al reglamento municipal vigente',
      'Semáforo proyectado vs. real del desempeño operativo',
      'Reporte GRI 306 / ESRS E5 con KPIs del simulador',
      'Trazabilidad: fórmula, fuente y nivel de certeza por dato',
      'Control presupuestal EVM y conciliación mensual',
      'Tablero de riesgos y gate de cierre del expediente',
    ],
  },
}

function chapterModuleRange(ch: ChapterDef): string {
  const modulos = ch.modulos
  if (!modulos.length) return ''
  return `M${moduleNumber(modulos[0]!)} – M${moduleNumber(modulos[modulos.length - 1]!)}`
}

function moduleLabel(id: string): string {
  const num = moduleNumber(id)
  const name = CLIENT_FUNCTIONARY_MODULES[id]?.label ?? id
  return `M${num} ${name}`
}

function buildGuideSteps(): StepDef[] {
  return CHAPTERS.map(ch => {
    const narrative = CHAPTER_NARRATIVES[ch.num]!
    return {
      num: ch.num,
      icon: CHAPTER_ICONS[ch.num] ?? MapPin,
      tag: ch.label.toUpperCase(),
      title: ch.question,
      question: CHAPTER_SUBQUESTIONS[ch.num] ?? ch.question,
      color: ch.color,
      bgColor: ch.bgColor,
      borderColor: ch.borderColor,
      modules: ch.modulos.map(id => ({ id, label: moduleLabel(id) })),
      body: narrative.body,
      learns: narrative.learns,
    }
  })
}

const GUIDE_STEPS = buildGuideSteps()

function EditorialSection({
  title,
  children,
  accentColor,
  className,
}: {
  title: string
  children: ReactNode
  accentColor?: string
  className?: string
}) {
  return (
    <section
      className={cn('pl-5 border-l-[3px] py-1', className)}
      style={{ borderColor: accentColor ?? 'var(--surface-border)' }}
    >
      <p className="text-[14px] font-semibold text-gray-900c mb-3">{title}</p>
      {children}
    </section>
  )
}

interface GuiaCircularidadProps {
  onNavigate?: (moduleId: string) => void
}

export function GuiaCircularidadStack({ onNavigate }: GuiaCircularidadProps = {}) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const resultados = useSimulatorStore(s => s.resultados)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)
  const mixCAs = useSimulatorStore(s => s.mixCAs)

  const municipioNarrativa = useMemo(() => {
    if (municipiosActivos.length === 1) {
      return getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
    }
    return 'Un municipio mexicano'
  }, [municipiosActivos, zmActiva])

  const ctx: NarrativeCtx = useMemo(() => ({
    municipio: municipioNarrativa,
    rsuTonDia: resultados?.rsuTotalTonDia ?? 0,
    pctCaptura: pctCapturaPorAño[horizonte - 1] ?? 70,
    empleos: resultados?.empleosTotalesDirectos ?? 0,
    ingresosMunicipio: resultados?.ingresosMunicipioTotal ?? 0,
    co2e: resultados?.co2eEvitadasAnualTon ?? 0,
    horizonte,
    nCAs: (mixCAs.P ?? 0) + (mixCAs.M ?? 0) + (mixCAs.G ?? 0),
    tir: resultados?.tir ?? 0,
  }), [municipioNarrativa, resultados, horizonte, pctCapturaPorAño, mixCAs])

  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  const chapterCards = useMemo(
    () =>
      CHAPTERS.map(ch => ({
        icon: CHAPTER_ICONS[ch.num] ?? MapPin,
        label: ch.label,
        sub: chapterModuleRange(ch),
        desc: CHAPTER_SUBQUESTIONS[ch.num] ?? ch.question,
        color: ch.color,
        firstId: ch.firstModuleId,
      })),
    [],
  )

  return (
    <div className="space-y-10">
      <section className="-mx-6 bg-gradient-to-br from-[#1C2B15] to-[#2D4A1A] text-white px-6 py-7 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-10">
          <Recycle size={120} strokeWidth={0.8} />
        </div>
        <div className="relative z-10 max-w-3xl">
          <h1 className="text-[22px] leading-[1.25] font-bold mb-3">
            Pasos hacia la circularidad
          </h1>
          <p className="text-[14px] leading-[1.7] text-white/90 max-w-2xl">
            Guía de lectura del simulador — {MODULE_COUNT} módulos en {CHAPTER_COUNT} capítulos.
            Pregunta central: ¿puede{' '}
            {municipiosActivos.length === 1 ? municipioNarrativa : 'un municipio mexicano'}{' '}
            convertir RSU en valor económico, empleos y calidad de vida?
          </p>
        </div>
      </section>

      <NarrativaIntroBridge />

      <EditorialSection
        title="¿Por qué el RSU es un problema de política pública?"
        accentColor="#3B6D11"
      >
        <div className="text-[13px] leading-[1.85] text-gray-600c space-y-4">
          <p>
            México genera más de <strong>120,000 toneladas de RSU al día</strong>. Menos del 6% se
            recicla formalmente. El resto va a rellenos saturados, tiraderos abiertos o cauces que
            terminan en el mar.
          </p>
          <p>
            Las tecnologías de separación existen desde hace décadas. El cuello de botella es{' '}
            <strong>institucional</strong>: los municipios — responsables del RSU (Art. 115) —
            carecen de diagnóstico, planeación financiera y seguimiento operativo integrados.
          </p>
        </div>
      </EditorialSection>

      <EditorialSection
        title="Cómo leer el simulador por capítulos"
        accentColor="#1A5FA8"
      >
        <p className="text-[13px] leading-[1.75] text-gray-600c mb-5">
          {MODULE_COUNT} módulos en cuatro capítulos. Cada cifra muestra fórmula, fuente y certeza.
          Metodología en el panel derecho (icono del libro).
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {chapterCards.map(e => (
            <button
              key={e.label}
              type="button"
              onClick={() => onNavigate?.(e.firstId)}
              className={cn(
                'rounded-[10px] bg-surface-muted p-4 text-center transition-all',
                onNavigate
                  ? 'hover:bg-green-50a hover:shadow-sm cursor-pointer'
                  : 'cursor-default',
              )}
            >
              <e.icon size={22} className="mx-auto mb-2" style={{ color: e.color }} />
              <p className="text-[12px] font-bold text-gray-900c">{e.label}</p>
              <p className="text-[10px] font-mono text-gray-400c mb-1">{e.sub}</p>
              <p className="text-[11px] text-gray-600c">{e.desc}</p>
              {onNavigate && (
                <p className="text-[10px] text-green-500a mt-1.5 flex items-center justify-center gap-0.5">
                  Ir <ArrowRight size={9} />
                </p>
              )}
            </button>
          ))}
        </div>
      </EditorialSection>

      <div className="space-y-3">
          {GUIDE_STEPS.map(step => {
            const isOpen = expandedStep === step.num
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className={cn(
                  'rounded-[12px] transition-all border-l-[3px]',
                  isOpen ? 'bg-surface-base shadow-sm' : 'bg-surface-base hover:bg-surface-muted',
                )}
                style={{ borderLeftColor: step.color }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedStep(isOpen ? null : step.num)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: step.bgColor }}
                  >
                    <Icon size={18} style={{ color: step.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className="text-[9px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded"
                        style={{ backgroundColor: step.bgColor, color: step.color }}
                      >
                        Cap. {step.num} · {step.tag}
                      </span>
                      <span className="text-[9px] text-gray-400c font-mono">
                        {step.modules.length} módulos
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-gray-900c">{step.title}</p>
                    <p className="text-[11px] text-gray-400c mt-0.5">{step.question}</p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      'shrink-0 text-gray-400c transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 space-y-4">
                    <div className="text-[13px] leading-[1.85] text-gray-600c whitespace-pre-line">
                      {step.body(ctx)}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {step.modules.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => onNavigate?.(m.id)}
                          className={cn(
                            'text-[10px] font-mono font-semibold px-2 py-0.5 rounded border flex items-center gap-1 transition-opacity',
                            onNavigate ? 'hover:opacity-80 cursor-pointer' : 'cursor-default',
                          )}
                          style={{
                            borderColor: step.borderColor,
                            backgroundColor: step.bgColor,
                            color: step.color,
                          }}
                        >
                          {m.label}
                          {onNavigate && <ArrowRight size={8} />}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-[10px] bg-surface-muted p-4">
                      <ul className="space-y-1.5">
                        {step.learns.map((l, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-gray-600c">
                            <CheckCircle2 size={13} className="shrink-0 mt-0.5" style={{ color: step.color }} />
                            <span>{l}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
      </div>

      <section className="pl-5 border-l-[3px] border-red-500a/40 py-1">
        <p className="text-[14px] font-semibold text-gray-900c mb-3">Lo que ALQUIMIA no es</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-gray-600c">
          {[
            { no: 'No es un dictamen oficial', si: 'Requiere validación del equipo jurídico y técnico del municipio.' },
            { no: 'No sustituye al consultor humano', si: 'Acelera cálculos y escenarios que tomarían semanas en hoja de cálculo.' },
            { no: 'No inventa datos', si: 'Cada cifra tiene fuente. Sin dato, el supuesto queda editable con rango de incertidumbre.' },
            { no: 'No garantiza resultados', si: 'Proyecta escenarios; el resultado real depende de ejecución y voluntad política.' },
          ].map(item => (
            <div key={item.no} className="rounded-[8px] bg-surface-muted p-3">
              <p className="font-semibold text-red-500a mb-1">✕ {item.no}</p>
              <p className="text-gray-600c leading-relaxed">{item.si}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] bg-green-50a p-5 text-center border-l-[3px] border-green-500a">
        <p className="text-[13px] text-green-600a mb-4 max-w-lg mx-auto">
          {M01_NEXT_ACTION.replace('Abrir ', 'Abra ')} — línea base de{' '}
          {municipiosActivos.length === 1 ? municipioNarrativa : 'su municipio'}.
        </p>
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('city_baseline')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-green-500a text-white text-[13px] font-semibold hover:bg-green-600a transition-colors mx-auto"
          >
            <ArrowRight size={15} />
            {M01_NEXT_ACTION}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-green-500a">
            <ArrowRight size={16} />
            <span>Siguiente: {M01_NEXT_ACTION.replace('Abrir ', '')}</span>
          </div>
        )}
      </section>
    </div>
  )
}
