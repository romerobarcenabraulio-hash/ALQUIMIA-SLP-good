'use client'

import type React from 'react'
import { BookOpenCheck, Database, FileText } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import {
  CA_CONFIG,
  COMPOSICION_RSU_DETALLE,
  FACTORES_EMISION,
  MODELO_PARAMS,
  MULTIPLICADORES,
  OPEX_PARAMS,
  PRECIOS_RANGO,
  ZMS,
} from '@/lib/constants'
import { getInegiHousingDistribution, INEGI_HOUSING_SOURCE } from '@/lib/viviendaInegi'
import { fmt } from '@/lib/utils'

type ReferenceRow = {
  tema: string
  calculo: string
  formula: string
  unidad: string
  fuente: string
  uso: string
}

const INTERNAL_DOC_BASE = 'ALQUIMIA-SLP / SLP ( contexto ) / DOCS'
const DELIVERY_DOC_BASE = 'ADENDOS: LEGAL/pdfs/contexto_slp_entrega'
const CAPITULO_SLP_DOC =
  `${INTERNAL_DOC_BASE}/CAPITULO SAN LUIS POTOSÍ.docx`
const RECICLADORAS_URL =
  'https://docs.google.com/spreadsheets/d/1fvSxwPwS1OKLhOMKFIgUguklD_ynKoqA/edit'
const RECICLADORAS_PDF_URL =
  'https://drive.google.com/file/d/1gqgv9cx1mmfLCRR9F_9WDdsYAW9rbS2g/view'
const MODELO_BASED_PDF_URL =
  'https://drive.google.com/file/d/1yxydr3_MF_qBefR-H2em9jjctJOF8lj3/view'
const ESTRATEGIA_VALORIZACION_URL =
  'https://drive.google.com/file/d/1ARZAZOVKVHwFV7yg4fcHuWmGlZSGnuRW/view'

export function ReferenciasCalculos() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const genPercapita = useSimulatorStore(s => s.genPercapita)
  const precios = useSimulatorStore(s => s.precios)
  const resultados = useSimulatorStore(s => s.resultados)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const snapshotDatos = useSimulatorStore(s => s.snapshotDatos)

  const zm = ZMS.find(z => z.id === zmActiva) ?? ZMS[0]
  const vivienda = getInegiHousingDistribution(zmActiva, municipiosActivos)
  const territorio = municipiosActivos.length === 1
    ? zm.municipios.find(m => m.id === municipiosActivos[0])?.nombre ?? municipiosActivos[0]?.toUpperCase()
    : zm.nombre

  const rows: ReferenceRow[] = [
    {
      tema: 'Población y territorio',
      calculo: 'Población activa del escenario',
      formula: 'Municipios seleccionados -> suma poblacional; si hay municipio catálogo, se usa su población explícita.',
      unidad: 'habitantes',
      fuente: snapshotDatos?.kpis?.find(k => k.kpi_id === 'poblacion_total')?.provenance?.fuente_nombre
        ?? 'INEGI Censo de Población y Vivienda 2020 / catálogo municipal ALQUIMIA',
      uso: resultados ? `${fmt.num0(resultados.pobActiva)} habitantes para ${territorio}` : 'Pendiente de cálculo',
    },
    {
      tema: 'Generación RSU',
      calculo: 'RSU doméstico municipal o ZM',
      formula: 'población activa x kg/hab/día x factor mensual / 1000',
      unidad: 't/día',
      fuente: `${INEGI_HOUSING_SOURCE}; SEMARNAT DBGIR 2020 para generación per cápita; ${CAPITULO_SLP_DOC}, Anexo 3; ${INTERNAL_DOC_BASE}/Modelo_BASED.xlsx`,
      uso: resultados ? `${fmt.num(resultados.rsuTotalTonDia)} t/día con ${genPercapita.toFixed(2)} kg/hab/día` : 'Pendiente de cálculo',
    },
    {
      tema: 'Vivienda INEGI',
      calculo: 'Segmentos activos del modelo habitacional',
      formula: 'RSU por tipo = RSU base x participación de vivienda x factor operativo del tipo',
      unidad: '% y viviendas',
      fuente: vivienda
        ? `${vivienda.source}; ${vivienda.confidenceLabel}`
        : `${INEGI_HOUSING_SOURCE} - sin distribución cargada para este territorio`,
      uso: vivienda
        ? vivienda.categories.length
          ? vivienda.categories.map(c => `${c.label} ${Math.round(c.pct * 100)}%`).join(', ')
          : `El XLSX valida ${fmt.num0(vivienda.stateOccupiedDwellings2020)} viviendas habitadas estatales y ${vivienda.stateAvgOccupants2020.toFixed(1)} ocupantes/vivienda; no valida porcentajes casa/departamento.`
        : 'No se inventan porcentajes de vivienda',
    },
    {
      tema: 'Composición RSU',
      calculo: 'Fracciones materialmente recuperables',
      formula: 'RSU activo x composición x captura anual x merma logística x pureza material',
      unidad: 't/día por material',
      fuente: `${CAPITULO_SLP_DOC}, Tabla 2 y Anexo 3: composición atribuida a SEMARNAT 2020; ${INTERNAL_DOC_BASE}/Modelo_BASED.xlsx; ${DELIVERY_DOC_BASE}/99_ Modelo_BASED.pdf (${MODELO_BASED_PDF_URL})`,
      uso: `Orgánico ${Math.round(COMPOSICION_RSU_DETALLE.organico.pct * 100)}%, papel ${Math.round(COMPOSICION_RSU_DETALLE.papel.pct * 100)}%, plástico ${Math.round(COMPOSICION_RSU_DETALLE.plastico.pct * 100)}%, vidrio ${Math.round(COMPOSICION_RSU_DETALLE.vidrio.pct * 100)}%, metales ${Math.round(COMPOSICION_RSU_DETALLE.metales.pct * 100)}%`,
    },
    {
      tema: 'Precios de materiales',
      calculo: 'Ingresos por valorización',
      formula: 't/día capturable x precio MXN/kg x 1000 x días operativos',
      unidad: 'MXN/año',
      fuente: `${CAPITULO_SLP_DOC}, Tabla 1 y Tabla 3; ${INTERNAL_DOC_BASE}/Recicladoras_por_Giro.xlsx, Matriz_Compradores y hojas por giro (${RECICLADORAS_URL}); PDF espejo ${RECICLADORAS_PDF_URL}. No se usan precios QRO/MTY/CDMX como sustento.`,
      uso: `PET $${precios.pet}/kg, HDPE $${precios.hdpe}/kg, papel $${precios.papel}/kg, vidrio $${precios.vidrio}/kg, aluminio $${precios.aluminio}/kg, orgánico $${precios.organico}/kg`,
    },
    {
      tema: 'Rangos de precio',
      calculo: 'Control de sensibilidad por material',
      formula: 'slider limitado por mínimo, máximo y paso declarados por material',
      unidad: 'MXN/kg',
      fuente: 'Rangos de sensibilidad del modelo para probar escenarios; el Capítulo SLP indica precios de referencia marzo 2026 sujetos a revisión trimestral con ANIPAC, CEMPRE México y cotizaciones directas de compradores ancla. Si no hay cotización local, no se presenta como precio verdadero.',
      uso: `PET ${rangeText('pet')}; HDPE ${rangeText('hdpe')} (sin fuente cerrada propia en el capítulo); papel ${rangeText('papel')}; vidrio ${rangeText('vidrio')} (conciliar $2.30 capítulo vs anexos); aluminio ${rangeText('aluminio')}; orgánico ${rangeText('organico')} (mercado local por confirmar)`,
    },
    {
      tema: 'Centros de acopio',
      calculo: 'CAPEX, OPEX, capacidad y empleos por CA',
      formula: 'mix CA-P/M/G x parámetros unitarios del catálogo operativo',
      unidad: 'MXN, t/día, empleos',
      fuente: `${INTERNAL_DOC_BASE}/Centros_Acopio_v2.xlsx; ${DELIVERY_DOC_BASE}/99_ Centros_Acopio_v2.pdf`,
      uso: `CA-P ${CA_CONFIG.P.capTonDia} t/día, CA-M ${CA_CONFIG.M.capTonDia} t/día, CA-G ${CA_CONFIG.G.capTonDia} t/día`,
    },
    {
      tema: 'OPEX y logística',
      calculo: 'Costo operativo anual de centros, rutas y comunicación social',
      formula: 'OPEX CA mensual x 12 + camiones requeridos x diésel/mantenimiento + comunicación social si aplica',
      unidad: 'MXN/año',
      fuente: `${INTERNAL_DOC_BASE}/Gantt_RSUSLP.xlsx; ${INTERNAL_DOC_BASE}/Estrategia_Valorizacion_RSU_SLP.docx; parámetros OPEX en constants.ts`,
      uso: resultados ? `${fmt.mxnM(resultados.opexAnual)} de OPEX anual del año final` : 'Pendiente de cálculo',
    },
    {
      tema: 'Disposición final evitada',
      calculo: 'Ahorro por toneladas desviadas de relleno',
      formula: 'volumen desviado en el horizonte x $320 MXN/t',
      unidad: 'MXN/horizonte',
      fuente: `${DELIVERY_DOC_BASE}/00001_CAPITULO SAN LUIS POTOSÍ.pdf; ${CAPITULO_SLP_DOC} documenta ahorro municipal $52-94M/año y exige actualizar tarifa vigente de disposición final; el $/t debe validarse con contrato municipal.`,
      uso: resultados ? fmt.mxnM(resultados.ahorroDisposicion) : 'Pendiente de cálculo',
    },
    {
      tema: 'Emisiones evitadas',
      calculo: 'CO₂e por reciclaje y orgánico aprovechado',
      formula: 'material recuperado x factor de emisión; orgánico biodigestor x CH₄ x densidad x GWP',
      unidad: 'tCO₂e/año',
      fuente: `${CAPITULO_SLP_DOC}: sección ambiental y bibliografía IPCC AR6 / INECC 2024; factores operativos en constants.ts: papel ${FACTORES_EMISION.papel}, plástico ${FACTORES_EMISION.plastico}, vidrio ${FACTORES_EMISION.vidrio}, aluminio ${FACTORES_EMISION.aluminio}; CH4 ${MODELO_PARAMS.factorCH4}, GWP ${MODELO_PARAMS.gwpCH4}`,
      uso: resultados ? `${fmt.co2(resultados.co2eEvitadasAnualTon)} en año final` : 'Pendiente de cálculo',
    },
    {
      tema: 'Salud pública',
      calculo: 'Ahorro social por PM2.5, IRA, dengue y exposición poblacional',
      formula: 'PM2.5 evitado x tasa IRA x costo caso + orgánico evitado x tasa dengue x costo caso + población x $145 x 20%',
      unidad: 'MXN/horizonte',
      fuente: `${CAPITULO_SLP_DOC}; bibliografía ambiental/sanitaria del capítulo; multiplicador salud ${MULTIPLICADORES.ahorroSaludHabAño} MXN/hab/año en constants.ts. Es estimación de política pública, no dictamen sanitario.`,
      uso: resultados ? `${fmt.mxnM(resultados.ahorroSalud)}; ${fmt.num0(resultados.casosIRAEvitados)} casos IRA estimados evitados` : 'Pendiente de cálculo',
    },
    {
      tema: 'Bibliografía base del capítulo',
      calculo: 'Sustento documental transversal',
      formula: 'Referencia cualitativa -> dato usado -> fórmula del simulador -> validación local cuando aplique',
      unidad: 'documentos y URL',
      fuente: `${CAPITULO_SLP_DOC}; Estrategia_Valorizacion_RSU_SLP ${ESTRATEGIA_VALORIZACION_URL}; Recicladoras_por_Giro ${RECICLADORAS_URL}; Modelo_BASED ${MODELO_BASED_PDF_URL}; bibliografía: INEGI 2020/2023, SEMARNAT DBGIR 2017/2020/2022, IPCC AR6, INECC 2024, NOM-083-SEMARNAT-2003.`,
      uso: 'La fuente externa sostiene el fenómeno; el modelo ALQUIMIA solo transforma ese dato en cálculo trazable.',
    },
    {
      tema: 'Línea base circularidad',
      calculo: 'Circularidad real estimada y RSU capturado de referencia',
      formula: 'material recuperado estimado / RSU total estimado',
      unidad: '% y t/día',
      fuente: circularityBaseline
        ? `${circularityBaseline.provenance.fuente_nombre}; ${circularityBaseline.provenance.fuente_organismo}`
        : 'Baseline no disponible',
      uso: circularityBaseline
        ? `${circularityBaseline.current_circularity_pct.toFixed(1)}% con confianza ${Math.round(circularityBaseline.confidence * 100)}%`
        : 'Bloqueado hasta elegir ciudad',
    },
  ]

  return (
    <section className="section" aria-labelledby="referencias-calculos-title" data-testid="referencias-calculos">
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">
              Anexo vivo de trazabilidad
            </p>
            <h2 id="referencias-calculos-title" className="mt-1 font-serif text-[24px] text-[#1C1B18]">
              Referencias que justifican los cálculos
            </h2>
            <p className="mt-2 max-w-3xl text-[12px] leading-relaxed text-[#6B6760]">
              Esta tabla resume qué dato sostiene cada número del simulador. Cuando un precio, costo o efecto no tiene
              cotización local verificable, se marca como supuesto de escenario y no como dato oficial.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-[999px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-1 text-[11px] text-[#3B6D11]">
            <BookOpenCheck size={13} aria-hidden />
            Bibliografía y fórmulas
          </div>
        </div>

        <div className="mt-4 overflow-x-auto rounded-[10px] border border-[#E8E4DC] bg-white">
          <table className="min-w-[980px] w-full border-collapse text-left text-[11px]">
            <thead className="bg-[#F8F6F1] text-[#6B6760]">
              <tr>
                <Th>Tema</Th>
                <Th>Cálculo</Th>
                <Th>Fórmula</Th>
                <Th>Unidad</Th>
                <Th>Fuente / bibliografía</Th>
                <Th>Lectura actual</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={`${row.tema}-${row.calculo}`} className="border-t border-[#F0EDE5] align-top">
                  <Td strong>{row.tema}</Td>
                  <Td>{row.calculo}</Td>
                  <Td mono>{row.formula}</Td>
                  <Td>{row.unidad}</Td>
                  <Td>{row.fuente}</Td>
                  <Td>{row.uso}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Note icon={<Database size={14} aria-hidden />} title="Fuentes oficiales y de contexto">
            INEGI y fuentes municipales sostienen población, vivienda y territorio. Los documentos de San Luis se usan como
            contexto metodológico y no sustituyen fuentes oficiales de otro municipio.
          </Note>
          <Note icon={<FileText size={14} aria-hidden />} title="Uso correcto">
            Esta tabla es anexo de simulación. No convierte precios, costos, salud, emisiones ni referencias legales en dato
            oficial, dictamen, presupuesto aprobado o documento municipal definitivo.
          </Note>
        </div>
      </div>
    </section>
  )
}

function rangeText(material: keyof typeof PRECIOS_RANGO): string {
  const r = PRECIOS_RANGO[material]
  return `$${r.min}-${r.max}/kg`
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.06em]">{children}</th>
}

function Td({
  children,
  strong = false,
  mono = false,
}: {
  children: React.ReactNode
  strong?: boolean
  mono?: boolean
}) {
  return (
    <td
      className={[
        'max-w-[260px] px-3 py-2 leading-relaxed text-[#6B6760] [overflow-wrap:anywhere]',
        strong ? 'font-semibold text-[#1C1B18]' : '',
        mono ? 'font-mono text-[10px]' : '',
      ].join(' ')}
    >
      {children}
    </td>
  )
}

function Note({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3 text-[12px] leading-relaxed text-[#6B6760]">
      <p className="inline-flex items-center gap-2 font-semibold text-[#1C1B18]">
        {icon}
        {title}
      </p>
      <p className="mt-1">{children}</p>
    </div>
  )
}
