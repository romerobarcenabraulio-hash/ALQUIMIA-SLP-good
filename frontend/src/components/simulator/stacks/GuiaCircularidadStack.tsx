'use client'

import { useState, useMemo } from 'react'
import {
  BookOpen, ArrowRight, ChevronDown, Recycle, Building2,
  Users, TrendingUp, BarChart3, Scale, Shield, Target,
  CheckCircle2, MapPin, Truck, DollarSign, Leaf,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { getEtiquetaNarrativaCiudad } from '@/lib/municipioMadurezContexto'

const fmtN = (n: number) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: 1 }).format(n)
const fmtMxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

// ── Steps for Circularity — 5 etapas narrativas ─────────────────────────────

interface StepDef {
  num: number
  icon: typeof BookOpen
  tag: string
  title: string
  color: string
  bgColor: string
  borderColor: string
  modules: string[]
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
    num: 1, icon: MapPin, tag: 'ANALIZAR', title: '¿Cuál es el problema?',
    color: '#3B6D11', bgColor: '#EAF3DE', borderColor: '#C9DDB1',
    modules: ['M01 Línea Base', 'M02 Contexto Normativo', 'M03 Estudio Social'],
    body: (ctx) =>
      `Todo comienza con un dato simple y contundente: el municipio de ${ctx.municipio} genera aproximadamente ${fmtN(ctx.rsuTonDia)} toneladas de residuos sólidos urbanos al día. De esa cantidad, hoy se recupera menos del 6%. El resto — orgánicos, plásticos, papel, vidrio, metales — termina enterrado en el relleno sanitario, generando metano, contaminando suelos y desperdiciando millones de pesos en materiales que tienen valor de mercado.\n\nAntes de proponer soluciones, ALQUIMIA analiza tres frentes del problema: cuánto se genera y de qué tipo (la línea base técnica), qué dice el reglamento municipal vigente sobre separación y sanciones (el marco jurídico), y qué tan dispuesta está la ciudadanía a cambiar sus hábitos de manejo de residuos (el estudio social). Estos tres diagnósticos determinan el punto de partida real — no el teórico.`,
    learns: [
      'Cuántas toneladas genera tu municipio al día, desglosadas por tipo de material',
      'Qué porcentaje del reglamento actual cubre la separación en origen',
      'Cuál es el Índice de Preparación Ciudadana (IPC) — si la gente está lista para separar',
    ],
  },
  {
    num: 2, icon: Target, tag: 'DIAGNOSTICAR', title: '¿A dónde podemos llegar?',
    color: '#1A5FA8', bgColor: '#E8F0FA', borderColor: '#BDD7F5',
    modules: ['M04 Metas y Trayectorias', 'M05 Infraestructura', 'M06 Logística'],
    body: (ctx) =>
      `Con el diagnóstico claro, el siguiente paso es definir metas alcanzables. No metas de discurso político — metas con modelo matemático detrás. ALQUIMIA proyecta la curva de captura del programa año por año: cuántas toneladas se separan, cuántos centros de acopio se necesitan, cuántos camiones de recolección diferenciada se requieren y cómo se diseña la primera zona piloto.\n\nEl sistema calcula que con ${ctx.nCAs} centro(s) de acopio y un horizonte de ${ctx.horizonte} años, tu municipio puede alcanzar una tasa de captura del ${ctx.pctCaptura}%. Pero las metas solo existen si hay infraestructura para sostenerlas. Por eso en esta etapa se dimensiona toda la capacidad física: dónde se ubica cada centro, qué equipamiento necesita, cuántas rutas de recolección se abren y en qué colonias arranca el piloto.`,
    learns: [
      'La curva de captura año por año — de cuánto a cuánto se escala',
      'Cuántos centros de acopio se necesitan y de qué tamaño',
      'El diseño de la zona piloto: criterios, rutas y protocolo operativo',
    ],
  },
  {
    num: 3, icon: Scale, tag: 'PLANEAR', title: '¿Quién paga y quién opera?',
    color: '#D4881E', bgColor: '#FEF7E7', borderColor: '#F5DCA0',
    modules: ['M07 Mercado', 'M08 Riesgos', 'M09 Esquema de Concesión'],
    body: (ctx) =>
      `Aquí es donde la mayoría de los programas municipales se detienen. No porque la técnica falle, sino porque nadie contesta las tres preguntas que el cabildo realmente vota: ¿cuánto dinero entra al municipio?, ¿cuántos empleos se crean?, ¿y cuál industria local se beneficia?\n\nALQUIMIA responde con números diferenciados según quién opera: si el municipio administra directamente los centros de acopio, si un privado invierte a cambio de una concesión, o si se crea una asociación público-privada. Cada esquema distribuye diferente los ingresos, los riesgos y los empleos. El árbol de decisión integrado muestra que siempre existe un camino viable — incluso si el municipio no tiene presupuesto. Bajo el escenario actual, el programa proyecta ${fmtMxn(ctx.ingresosMunicipio)} anuales en ingresos al municipio y ${ctx.empleos} empleos directos.`,
    learns: [
      'Cómo se distribuyen los ingresos entre municipio y operador según el esquema seleccionado',
      'El análisis de riesgos: qué puede salir mal y cuánto afecta al programa',
      'El mercado de materiales: quién compra el PET, el papel, la composta y a qué precio',
    ],
  },
  {
    num: 4, icon: Truck, tag: 'EJECUTAR', title: '¿Cómo arrancamos?',
    color: '#7A1212', bgColor: '#FEF0F0', borderColor: '#F5C4C4',
    modules: ['M10 Escenarios y Exportación', 'M11 Inspección de Predios'],
    body: (_ctx) =>
      `Planear sin ejecutar es un archivo de PowerPoint. ALQUIMIA genera los instrumentos operativos para el arranque: la cotización exportable con todos los parámetros del programa, los escenarios financieros (base, optimista, adverso) con análisis de sensibilidad, y la estrategia de inspección y cumplimiento que hace que la separación no sea opcional.\n\nLa inspección no es punitiva — es un proceso escalonado: primero educación, después advertencia, y solo cuando hay incumplimiento repetido documentado se activa el proceso administrativo. Todo esto se apega al reglamento vigente y a los adendos que el propio programa genera. El objetivo no es multar — es que las personas separen y que la infraestructura reciba material de calidad.`,
    learns: [
      'Los escenarios financieros con Monte Carlo: qué pasa si todo sale bien, regular o mal',
      'El proceso de inspección escalonado: educación → advertencia → sanción documentada',
      'La cotización exportable que se presenta al cabildo o al concesionario',
    ],
  },
  {
    num: 5, icon: BarChart3, tag: 'MONITOREAR', title: '¿Cómo sabemos que funciona?',
    color: '#4A1C7A', bgColor: '#F5EFF9', borderColor: '#D8C4E8',
    modules: ['M12 Doble Materialidad', 'M13 Trazabilidad de Fuentes'],
    body: (ctx) =>
      `Un programa sin medición no es un programa — es una promesa electoral. ALQUIMIA convierte los resultados en el lenguaje que los financiadores entienden: GRI 306 (estándar global de reporte de residuos) y ESRS E5 (economía circular bajo la directiva europea que BANOBRAS está adoptando).\n\nCada número del simulador tiene una fuente verificable. Cada fórmula está documentada. Cuando el municipio registra datos reales de operación — toneladas pesadas, empleos verificados, ingresos cobrados — el sistema compara proyección contra realidad con un semáforo de desempeño. El programa proyecta evitar ${fmtN(ctx.co2e)} toneladas de CO₂ equivalente al año — una cifra que vale dinero en los mercados de créditos de carbono y que abre la puerta a financiamiento verde a tasas preferenciales.`,
    learns: [
      'El reporte GRI 306 con datos del simulador — listo para BANOBRAS o fondos internacionales',
      'La comparación proyectado vs. real: semáforo de desempeño del programa',
      'La cadena de trazabilidad de cada número: fórmula, fuente, estado de verificación',
    ],
  },
]

// ── Component ────────────────────────────────────────────────────────────────

export function GuiaCircularidadStack() {
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
              13 módulos de análisis
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
              4 etapas narrativas
            </span>
            <span className="px-3 py-1 rounded-full bg-white/15 text-[11px] font-semibold">
              0 datos inventados
            </span>
          </div>
        </div>
      </section>

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
            { icon: MapPin,     label: 'Diagnóstico', sub: 'M01 – M03', desc: 'Entender el municipio', color: '#3B6D11' },
            { icon: Target,     label: 'Planeación',  sub: 'M04 – M08', desc: 'Diseñar la solución',   color: '#1A5FA8' },
            { icon: DollarSign, label: 'Ejecución',   sub: 'M09 – M11', desc: 'Financiar y operar',    color: '#D4881E' },
            { icon: BarChart3,  label: 'Monitoreo',   sub: 'M12 – M13', desc: 'Medir y reportar',      color: '#4A1C7A' },
          ].map(e => (
            <div key={e.label} className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 text-center">
              <e.icon size={22} className="mx-auto mb-2" style={{ color: e.color }} />
              <p className="text-[12px] font-bold text-[#1C1B18]">{e.label}</p>
              <p className="text-[10px] font-mono text-[#A8A49C] mb-1">{e.sub}</p>
              <p className="text-[11px] text-[#6B6760]">{e.desc}</p>
            </div>
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

      {/* ── Steps Accordion ────────────────────────────────────────────────── */}
      <section>
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-semibold mb-3 px-1">
          5 pasos hacia la circularidad · {municipio}
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
                        Paso {step.num} · {step.tag}
                      </span>
                    </div>
                    <p className="text-[14px] font-semibold text-[#1C1B18]">{step.title}</p>
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

                    {/* Modules covered */}
                    <div className="flex flex-wrap gap-1.5">
                      {step.modules.map(m => (
                        <span
                          key={m}
                          className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border"
                          style={{
                            borderColor: step.borderColor,
                            backgroundColor: step.bgColor,
                            color: step.color,
                          }}
                        >
                          {m}
                        </span>
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
        <div className="flex items-center justify-center gap-2 text-[12px] font-semibold text-[#3B6D11]">
          <ArrowRight size={16} />
          <span>Siguiente: M01 — Línea Base y Resumen Ejecutivo</span>
        </div>
      </section>
    </div>
  )
}
