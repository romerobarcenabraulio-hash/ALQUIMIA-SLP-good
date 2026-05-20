'use client'

import { useState, useMemo } from 'react'
import {
  ArrowRight, ChevronDown, Recycle,
  BarChart3, Scale, Target,
  CheckCircle2, MapPin, DollarSign, Leaf,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'
import { NarrativaIntroBridge } from '@/components/simulator/NarrativeBridge'

const fmtN = (n: number) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n)
const fmtMxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

// ── Steps for Circularity — 5 etapas narrativas ─────────────────────────────

interface StepModule {
  label: string
  id: string
}

interface StepDef {
  num: number
  icon: typeof MapPin
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

const STEPS: StepDef[] = [
  {
    num: 1,
    icon: MapPin,
    tag: 'DIAGNÓSTICO',
    title: '¿Cuál es el punto de partida real?',
    question: 'Entender el municipio antes de proponer soluciones',
    color: '#3B6D11', bgColor: '#EAF3DE', borderColor: '#C9DDB1',
    modules: [
      { label: 'M01 Línea Base RSU',      id: 'city_baseline' },
      { label: 'M02 Estudio Social',       id: 'social_study' },
      { label: 'M03 Marco Legal',          id: 'municipal_context' },
      { label: 'M04 Costo de la Omisión', id: 'costo_omision' },
    ],
    body: (ctx) =>
      `Todo comienza con un dato simple y contundente: el municipio de ${ctx.municipio} genera aproximadamente ${fmtN(ctx.rsuTonDia)} toneladas de residuos sólidos urbanos al día. De esa cantidad, hoy se recupera menos del 6%. Primero entendemos cuánta basura hay y de qué tipo (M01 — línea base técnica con fuente SEMARNAT/INEGI), luego si la ciudadanía está dispuesta a separar (M02 — diagnóstico social con Índice de Preparación Ciudadana), y solo entonces evaluamos si el marco legal es suficiente para respaldar el programa (M03 — brechas normativas y adendos propuestos).\n\nM04 cierra el diagnóstico con la pregunta que ningún consultor hace: ¿cuánto cuesta NO actuar? El análisis contrafactual cuantifica el pasivo acumulado en 10 años: costo de disposición, daño sanitario, multas PROFEPA y la pérdida de elegibilidad para financiamiento verde.\n\nDiagnosticar la ley sin diagnosticar primero a la sociedad es legislar a ciegas. Este capítulo entrega el punto de partida defendible ante cabildo, financiadores y auditoría técnica.`,
    learns: [
      'Cuántas toneladas genera el municipio al día, desglosadas por tipo de material (fuente SEMARNAT)',
      'El Índice de Preparación Ciudadana (IPC): qué tan lista está la población para separar',
      'Qué artículos del reglamento actual cubren la separación y cuáles exigen reforma antes de sancionar',
      'El costo acumulado de no actuar en 10 años — pasivo ambiental, sanitario y financiero',
    ],
  },
  {
    num: 2,
    icon: Target,
    tag: 'PLANIFICACIÓN',
    title: '¿Qué necesitamos construir?',
    question: 'Cuánta infraestructura, logística, personal y dinero se requiere',
    color: '#1A5FA8', bgColor: '#E8F0FA', borderColor: '#BDD7F5',
    modules: [
      { label: 'M05 Metas y Trayectorias',   id: 'future_goals' },
      { label: 'M06 Infraestructura (CAs)',   id: 'infrastructure_operations' },
      { label: 'M07 Organigrama Operativo',   id: 'organigrama_programa' },
      { label: 'M08 Logística Operativa',     id: 'logistica_operativa' },
      { label: 'M09 Costos CAPEX / OPEX',     id: 'costos_programa' },
      { label: 'M10 Mercado de Materiales',   id: 'market_traceability' },
    ],
    body: (ctx) =>
      `Con el diagnóstico claro, se definen metas con modelo matemático detrás: la curva de captura año por año, cuántos centros de acopio se necesitan y de qué tamaño (M05–M06). M07 define quién hace qué: organigrama, matriz RACI y plantilla de personal por tipo de CA — la pieza que las consultoras olvidan y que el tesorero siempre pregunta. La logística determina rutas, zona piloto y protocolo PER (M08). El módulo de costos presenta la tabla ejecutiva completa: CAPEX y OPEX con desglose de equipos, personal y operación anual (M09). Finalmente, M10 muestra a quién se vende el material recuperado y a qué precio.\n\nSin costos no hay presupuesto. Sin organigrama no hay responsables. Sin mercado no hay ingresos. Este capítulo entrega el número que el director de finanzas pregunta antes de pedir nada más: ¿cuánto cuesta y quién lo opera?`,
    learns: [
      'La curva de captura año a año bajo 3 escenarios: ambicioso, moderado y conservador',
      'El organigrama del programa con roles, RACI y plantilla por tipo de CA (P/M/G)',
      'El CAPEX total del programa con desglose por equipos, personal y contingencia',
      'El mercado de compradores por fracción: PET, aluminio, papel, vidrio, composta',
    ],
  },
  {
    num: 3,
    icon: Scale,
    tag: 'MODELO',
    title: '¿Quién paga, quién opera y es viable?',
    question: 'Qué le presentamos al cabildo para que vote',
    color: '#D4881E', bgColor: '#FEF7E7', borderColor: '#F5DCA0',
    modules: [
      { label: 'M11 Esquema de Concesión',    id: 'esquema_concesion' },
      { label: 'M12 Escenarios Financieros',  id: 'scenarios_export' },
      { label: 'M13 Árbol de Financiamiento', id: 'arbol_financiamiento' },
      { label: 'M14 Riesgos del Modelo',      id: 'risk_trends' },
      { label: 'M15 Expediente Cabildo',      id: 'expediente_cabildo' },
    ],
    body: (ctx) =>
      `El cabildo no vota la técnica — vota el modelo de negocio. Aquí es donde la mayoría de los programas municipales se detienen: nadie contestó las tres preguntas que el cabildo realmente necesita. M11 responde quién opera y cómo se distribuyen los ingresos bajo cuatro esquemas: municipal directo, concesionado privado, APP o fideicomiso.\n\nM12 presenta los escenarios financieros (base, optimista, adverso) con análisis Monte Carlo y tornado de sensibilidad. Bajo el escenario base, el programa proyecta ${fmtMxn(ctx.ingresosMunicipio)} anuales al municipio y una TIR de ${fmtN(ctx.tir)}%. M13 va un paso más allá: el árbol de financiamiento mapea los 6 caminos reales para conseguir el capital — con criterios de elegibilidad y costo de capital de cada uno. M14 evalúa los riesgos del modelo completo. M15 consolida toda la documentación en el expediente listo para presentar ante el Cabildo.`,
    learns: [
      'Los 4 esquemas de concesión: quién pone el capital, quién opera y cómo se divide el ingreso',
      'Los escenarios P10/P50/P90 de TIR y VPN con distribución de probabilidad',
      'Los 6 caminos de financiamiento con criterios de elegibilidad y costo de capital',
      'Los 12 riesgos rankeados por probabilidad × impacto con su plan de mitigación',
    ],
  },
  {
    num: 4,
    icon: BarChart3,
    tag: 'CONTROL',
    title: '¿Cómo arrancamos y cómo medimos?',
    question: 'Ya aprobado el programa, cómo se opera y se demuestra que funciona',
    color: '#4A1C7A', bgColor: '#F5EFF9', borderColor: '#D8C4E8',
    modules: [
      { label: 'M16 Inspección y Cumplimiento', id: 'inspeccion_predios' },
      { label: 'M17 Monitoreo Real',             id: 'monitoreo_real' },
      { label: 'M18 Doble Materialidad / ESG',   id: 'doble_materialidad' },
      { label: 'M19 Trazabilidad de Fuentes',    id: 'source_traceability' },
    ],
    body: (ctx) =>
      `Un programa sin medición no es un programa — es una promesa electoral. M16 implementa la inspección escalonada: educación → advertencia → sanción documentada. No es punitiva; es el mecanismo que garantiza que la infraestructura reciba material de calidad.\n\nM17 compara proyección vs. realidad en un semáforo de desempeño. M18 convierte los resultados en el lenguaje de financiadores: GRI 306 (residuos) y ESRS E5 (economía circular), con reportes listos para BANOBRAS y fondos internacionales. El programa proyecta evitar ${fmtN(ctx.co2e)} t CO₂e/año — una cifra que vale dinero en mercados de carbono. M19 cierra el ciclo: cada número del simulador tiene fórmula, fuente y estado de verificación. Trazabilidad total.`,
    learns: [
      'El proceso de inspección escalonado alineado al reglamento municipal vigente',
      'El dashboard proyectado vs. real con semáforo de desempeño del programa',
      'El reporte GRI 306 / ESRS E5 con los KPIs del simulador — listo para fondos verdes',
    ],
  },
]

// ── Component ────────────────────────────────────────────────────────────────

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

  const municipio = useMemo(
    () => getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva),
    [municipiosActivos, zmActiva],
  )

  const ctx: NarrativeCtx = useMemo(() => ({
    municipio,
    rsuTonDia: resultados?.rsuTotalTonDia ?? 0,
    pctCaptura: pctCapturaPorAño[horizonte - 1] ?? 70,
    empleos: resultados?.empleosTotalesDirectos ?? 0,
    ingresosMunicipio: resultados?.ingresosMunicipioTotal ?? 0,
    co2e: resultados?.co2eEvitadasAnualTon ?? 0,
    horizonte,
    nCAs: (mixCAs.P ?? 0) + (mixCAs.M ?? 0) + (mixCAs.G ?? 0),
    tir: resultados?.tir ?? 0,
  }), [municipio, resultados, horizonte, pctCapturaPorAño, mixCAs])

  const [expandedStep, setExpandedStep] = useState<number | null>(1)

  return (
    <div className="space-y-8">
      {/* ── Hero / Intro ───────────────────────────────────────────────────── */}
      <section className="rounded-[14px] bg-gradient-to-br from-[#1C2B15] to-[#2D4A1A] text-white p-8 relative overflow-hidden">
        <div className="absolute top-4 right-4 opacity-10">
          <Recycle size={120} strokeWidth={0.8} />
        </div>
        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#A8D78A] font-semibold mb-3">
            Guía de lectura · ALQUIMIA Platform
          </p>
          <h1 className="font-serif text-[28px] leading-[1.2] font-bold mb-4">
            Steps for Circularity
          </h1>
          <p className="text-[15px] leading-[1.75] text-white/90 max-w-2xl">
            ALQUIMIA es una plataforma de consultoría automatizada para la gestión circular de
            residuos sólidos urbanos en municipios mexicanos. Lo que verás a continuación no es un
            dashboard genérico — es un argumento completo, construido paso a paso, que responde
            una sola pregunta:{' '}
            <strong className="text-white">
              ¿puede este municipio convertir su basura en valor económico, empleos y calidad de
              vida?
            </strong>
          </p>
          <div className="flex items-center gap-2 mt-5">
            <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
              16 módulos de análisis
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
              4 capítulos consultivos
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
              0 datos inventados
            </span>
          </div>
        </div>
      </section>

      {/* ── Intro por audiencia — NarrativaIntroBridge ───────────────────── */}
      <NarrativaIntroBridge />

      {/* ── El Problema ────────────────────────────────────────────────────── */}
      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-6">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold mb-2">
          El contexto
        </p>
        <h2 className="font-serif text-[20px] font-bold text-[#1C1B18] mb-4">
          ¿Por qué la basura es un problema de política pública?
        </h2>
        <div className="text-[13px] leading-[1.85] text-[#4A4740] space-y-4">
          <p>
            México genera más de <strong>120,000 toneladas de residuos sólidos urbanos al día</strong>.
            De ese total, menos del 6% se recicla formalmente. El resto se entierra en rellenos
            sanitarios que se agotan, en tiraderos a cielo abierto que contaminan acuíferos, o en
            cauces de ríos que terminan en el mar. El costo ambiental es medible en emisiones de
            metano (CH₄), en casos de enfermedades respiratorias y en pérdida de suelo productivo.
            El costo económico es un mercado de reciclaje de miles de millones de pesos al año que
            se deja en la mesa.
          </p>
          <p>
            Pero el problema no es técnico. Las tecnologías de separación, compostaje y
            valorización existen hace décadas. El problema es <strong>institucional</strong>: los
            municipios — que por mandato constitucional (Art. 115) son responsables del manejo de
            RSU — carecen de las herramientas de diagnóstico, planeación financiera y seguimiento
            operativo para diseñar programas que sobrevivan al cambio de administración.
          </p>
          <p>
            ALQUIMIA existe para resolver exactamente eso. No es una app de reciclaje para
            ciudadanos. Es el instrumento que un director de servicios públicos, un síndico
            municipal o un consultor privado necesitan para responder: <em>¿cuánto cuesta?,
            ¿cuánto genera?, ¿quién opera?, ¿cuántos empleos? y ¿cómo le demostramos al cabildo
            que es viable?</em>
          </p>
        </div>
      </section>

      {/* ── Cómo funciona el sistema ───────────────────────────────────────── */}
      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-6">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold mb-2">
          Cómo leer esta plataforma
        </p>
        <h2 className="font-serif text-[20px] font-bold text-[#1C1B18] mb-3">
          El sistema funciona como un consultor senior
        </h2>
        <p className="text-[13px] leading-[1.85] text-[#4A4740] mb-5">
          Cada módulo que verás después de esta guía sigue la misma lógica que un equipo de
          consultoría aplicaría en un proyecto real de residuos sólidos: primero se diagnostica,
          luego se planea, después se ejecuta y finalmente se mide. La diferencia es que aquí
          el análisis es instantáneo, transparente y reproducible — cada cifra muestra su
          fórmula, su fuente y su nivel de certeza.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          {[
            { icon: MapPin,     label: 'Diagnóstico',   sub: 'M01 – M04', desc: 'Entender el municipio',    color: '#3B6D11', firstId: 'city_baseline' },
            { icon: Target,     label: 'Planificación', sub: 'M05 – M10', desc: 'Diseñar la solución',      color: '#1A5FA8', firstId: 'future_goals' },
            { icon: Scale,      label: 'Modelo',        sub: 'M11 – M15', desc: 'Quién paga, quién opera',  color: '#D4881E', firstId: 'esquema_concesion' },
            { icon: BarChart3,  label: 'Control',       sub: 'M16 – M19', desc: 'Operar y demostrar',       color: '#4A1C7A', firstId: 'inspeccion_predios' },
          ].map(e => (
            <button
              key={e.label}
              type="button"
              onClick={() => onNavigate?.(e.firstId)}
              className={cn(
                'rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 text-center transition-all',
                onNavigate ? 'hover:border-[#C9DDB1] hover:bg-[#F1F8EC] hover:shadow-[0_2px_8px_rgba(59,109,17,0.08)] cursor-pointer' : 'cursor-default',
              )}
            >
              <e.icon size={22} className="mx-auto mb-2" style={{ color: e.color }} />
              <p className="text-[12px] font-bold text-[#1C1B18]">{e.label}</p>
              <p className="text-[10px] font-mono text-[#A8A49C] mb-1">{e.sub}</p>
              <p className="text-[11px] text-[#6B6760]">{e.desc}</p>
              {onNavigate && (
                <p className="text-[10px] text-[#3B6D11] mt-1.5 flex items-center justify-center gap-0.5">
                  Ir <ArrowRight size={9} />
                </p>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-[10px] bg-[#F4F2ED] px-4 py-3">
          <p className="text-[11px] text-[#6B6760] leading-[1.7]">
            <strong className="text-[#1C1B18]">Consejo de navegación:</strong> Cada módulo incluye
            una barra lateral con las consideraciones metodológicas — cómo se calcula, de dónde
            vienen los datos, por qué se usa ese enfoque y cuál supuesto mueve más el resultado.
            Si en algún momento dudas de un número, ahí está la explicación completa.
          </p>
        </div>
      </section>

      {/* ── Steps Accordion — 4 capítulos ──────────────────────────────────── */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold mb-3 px-1">
          4 capítulos consultivos · {municipio}
        </p>

        <div className="space-y-3">
          {STEPS.map(step => {
            const isOpen = expandedStep === step.num
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className={cn(
                  'rounded-[12px] border transition-all',
                  isOpen ? `bg-white shadow-[0_2px_12px_rgba(28,27,24,0.06)]` : 'bg-[#FDFCFA]',
                )}
                style={{ borderColor: isOpen ? step.borderColor : '#E8E4DC' }}
              >
                {/* Header */}
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
                    </div>
                    <p className="text-[14px] font-semibold text-[#1C1B18]">{step.title}</p>
                    <p className="text-[11px] text-[#8A9286] mt-0.5">{step.question}</p>
                  </div>
                  <ChevronDown
                    size={18}
                    className={cn(
                      'shrink-0 text-[#A8A49C] transition-transform',
                      isOpen && 'rotate-180',
                    )}
                  />
                </button>

                {/* Body */}
                {isOpen && (
                  <div className="px-5 pb-5 space-y-4">
                    {/* Narrative text */}
                    <div className="text-[13px] leading-[1.85] text-[#4A4740] whitespace-pre-line">
                      {step.body(ctx)}
                    </div>

                    {/* Modules covered — clickable when onNavigate provided */}
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

                    {/* What you'll learn */}
                    <div className="rounded-[10px] bg-[#FAFAF8] border border-[#F0EDE5] p-4">
                      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] font-semibold mb-2">
                        Lo que encontrarás en estos módulos
                      </p>
                      <ul className="space-y-1.5">
                        {step.learns.map((l, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px] text-[#4A4740]">
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
      </section>

      {/* ── Qué NO es ALQUIMIA ────────────────────────────────────────────── */}
      <section className="rounded-[12px] border border-[#FDE8E8] bg-[#FFF8F8] p-6">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#7A1212] font-semibold mb-2">
          Nota importante
        </p>
        <h2 className="font-serif text-[16px] font-bold text-[#1C1B18] mb-3">
          Lo que ALQUIMIA no es
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] text-[#4A4740]">
          {[
            { no: 'No es un dictamen oficial', si: 'Es un análisis prospectivo que requiere validación con el equipo jurídico y técnico del municipio.' },
            { no: 'No sustituye al consultor humano', si: 'Complementa al consultor con datos, fórmulas y escenarios que tomarían semanas calcular manualmente.' },
            { no: 'No inventa datos', si: 'Cada cifra tiene fuente documentada. Cuando no hay dato, se marca como supuesto editable con rango de incertidumbre.' },
            { no: 'No garantiza resultados', si: 'Proyecta escenarios. El resultado real depende de la ejecución, el compromiso político y la participación ciudadana.' },
          ].map(item => (
            <div key={item.no} className="rounded-[8px] bg-white p-3 border border-[#F5C4C4]/30">
              <p className="font-semibold text-[#7A1212] mb-1">✕ {item.no}</p>
              <p className="text-[#6B6760] leading-relaxed">{item.si}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mapa del Proyecto — ProjectMapView ──────────────────────────── */}
      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-6">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold mb-2">
          Mapa del proyecto
        </p>
        <h2 className="font-serif text-[18px] font-bold text-[#1C1B18] mb-4">
          Los 16 módulos, de un vistazo
        </h2>
        <div className="space-y-3">
          {STEPS.map((step, si) => (
            <div key={step.num} className="rounded-[10px] border border-[#E8E4DC] overflow-hidden">
              {/* Chapter header */}
              <div
                className="px-4 py-2.5 flex items-center gap-3"
                style={{ backgroundColor: step.bgColor }}
              >
                <step.icon size={14} style={{ color: step.color }} />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.08em]"
                  style={{ color: step.color }}
                >
                  Cap. {step.num} — {step.tag}
                </span>
                <span className="text-[11px] text-[#6B6760]">{step.question}</span>
              </div>
              {/* Module pills */}
              <div className="px-4 py-3 bg-white flex flex-wrap gap-2 items-center">
                {step.modules.map((m, mi) => (
                  <div key={m.id} className="flex items-center gap-1">
                    {mi > 0 && <span className="text-[#C8C4BC] text-[10px]">→</span>}
                    <button
                      type="button"
                      onClick={() => onNavigate?.(m.id)}
                      className={cn(
                        'text-[11px] px-2.5 py-1 rounded-full border font-medium transition-all',
                        onNavigate
                          ? 'hover:shadow-[0_1px_4px_rgba(0,0,0,0.1)] cursor-pointer'
                          : 'cursor-default',
                      )}
                      style={{
                        borderColor: step.borderColor,
                        backgroundColor: `${step.bgColor}80`,
                        color: step.color,
                      }}
                    >
                      {m.label}
                    </button>
                  </div>
                ))}
                {si < STEPS.length - 1 && (
                  <span className="ml-auto text-[10px] text-[#A8A49C] flex items-center gap-1">
                    continúa <ArrowRight size={10} />
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#8A9286]">
          Haz clic en cualquier módulo para ir directamente — o navega secuencialmente con los botones de abajo.
        </p>
      </section>

      {/* ── CTA Final ──────────────────────────────────────────────────────── */}
      <section className="rounded-[12px] border border-[#C9DDB1] bg-[#EAF3DE] p-6 text-center">
        <Leaf size={28} className="mx-auto mb-3 text-[#3B6D11]" />
        <h2 className="font-serif text-[18px] font-bold text-[#23470A] mb-2">
          Comienza el diagnóstico
        </h2>
        <p className="text-[13px] text-[#3B6D11] mb-4 max-w-lg mx-auto">
          Navega al siguiente módulo para explorar la línea base de {municipio}.
          El sistema ya tiene los datos cargados — solo necesitas leerlos e interpretarlos.
        </p>
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate('city_baseline')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#3B6D11] text-white text-[13px] font-semibold hover:bg-[#2D5409] transition-colors mx-auto"
          >
            <ArrowRight size={15} />
            Ir a M01 — Línea Base
          </button>
        ) : (
          <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-[#3B6D11]">
            <ArrowRight size={16} />
            <span>Siguiente: M01 — Línea Base y Resumen Ejecutivo</span>
          </div>
        )}
      </section>
    </div>
  )
}
