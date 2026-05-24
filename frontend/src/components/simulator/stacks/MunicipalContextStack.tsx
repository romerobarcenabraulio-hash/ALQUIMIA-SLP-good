'use client'

import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts'
import { ExpandableChart } from '@/components/ui/ExpandableChart'
import {
  ChevronRight, Scale, Shield, AlertTriangle, CheckCircle, Lock,
  FileText, ChevronDown,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_INSTITUCIONALES } from '@/lib/constants'
import CoberturaNacional from '@/components/simulator/CoberturaNacional'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import { cn } from '@/lib/utils'
import { ModuleBottomBar } from '@/components/simulator/ModuleBottomBar'
import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'

// ── Types ─────────────────────────────────────────────────────────────────────

type AdendaItem = {
  id: string
  articulo: string
  descripcion: string
  prioridad: 'alta' | 'media' | 'baja'
  ambito: string
  impacto: string
}

// ── Adendo lifecycle workflow states ─────────────────────────────────────────

type AdendoEstado =
  | 'borrador'
  | 'en_revision_juridica'
  | 'agendado_cabildo'
  | 'aprobado'
  | 'publicado_gaceta'
  | 'vigente'

const ADENDO_ESTADOS: { id: AdendoEstado; label: string; desc: string }[] = [
  { id: 'borrador',            label: 'Borrador',           desc: 'Texto propuesto por el equipo técnico.' },
  { id: 'en_revision_juridica',label: 'Revisión jurídica',  desc: 'Síndico / asesor legal validan el texto.' },
  { id: 'agendado_cabildo',    label: 'Agendado en cabildo',desc: 'Punto de acuerdo en agenda oficial.' },
  { id: 'aprobado',            label: 'Aprobado',           desc: 'Votación favorable del cabildo.' },
  { id: 'publicado_gaceta',    label: 'Publicado en gaceta',desc: 'Publicación en gaceta oficial municipal.' },
  { id: 'vigente',             label: 'Vigente',            desc: 'Reglamento en vigor con fuerza legal plena.' },
]

type AdendoRecord = AdendaItem & { estado: AdendoEstado }

function AdendoWorkflowPanel({ adendas }: { adendas: AdendaItem[] }) {
  const [registros, setRegistros] = useState<AdendoRecord[]>(
    adendas.slice(0, 4).map(a => ({ ...a, estado: 'borrador' as AdendoEstado }))
  )

  const todasAprobadas = registros.length > 0 && registros.every(r =>
    ['aprobado', 'publicado_gaceta', 'vigente'].includes(r.estado)
  )

  function avanzarEstado(id: string) {
    setRegistros(prev => prev.map(r => {
      if (r.id !== id) return r
      const idx = ADENDO_ESTADOS.findIndex(e => e.id === r.estado)
      const next = ADENDO_ESTADOS[idx + 1]
      return next ? { ...r, estado: next.id } : r
    }))
  }

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
      <div className="px-5 py-3 border-b border-[#F0EDE5] flex items-start justify-between gap-3">
        <div>
          <p className="text-[12px] font-semibold text-[#1C1B18]">Ciclo de vida de adendos prioritarios</p>
          <p className="text-[10px] text-[#A8A49C] mt-0.5">
            Seguimiento del estado legislativo · 6 etapas hasta vigencia plena
          </p>
        </div>
        {todasAprobadas ? (
          <span className="shrink-0 text-[9px] font-semibold bg-[#EAF3DE] text-[#23470A] border border-[#C9DDB1] rounded px-2 py-0.5">
            ✓ Todos aprobados
          </span>
        ) : (
          <span className="shrink-0 text-[9px] font-semibold bg-[#FEF7E7] text-[#6B4800] border border-[#F5DCA0] rounded px-2 py-0.5">
            En proceso
          </span>
        )}
      </div>

      {/* Etapa pipeline indicator */}
      <div className="px-5 pt-3 pb-2 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {ADENDO_ESTADOS.map((e, i) => (
            <div key={e.id} className="flex items-center gap-1">
              {i > 0 && <span className="text-[#C8C4BC] text-[9px]">→</span>}
              <span className="text-[9px] font-medium text-[#A8A49C] uppercase tracking-[0.06em] px-1.5 py-0.5 rounded bg-[#F4F2ED]">
                {e.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {!todasAprobadas && (
        <div className="mx-5 mb-3 rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[11px] text-amber-800 font-medium">
            ⚠ Gate de Ejecución bloqueado — los adendos del programa deben alcanzar estado &quot;Aprobado&quot; antes de iniciar la etapa de Ejecución (M09-M11).
          </p>
        </div>
      )}

      <div className="divide-y divide-[#F0EDE5]">
        {registros.map(r => {
          const etapaIdx = ADENDO_ESTADOS.findIndex(e => e.id === r.estado)
          const isVigente = r.estado === 'vigente'
          return (
            <div key={r.id} className="px-5 py-3 flex items-center gap-3">
              <span className="font-mono text-[10px] font-semibold text-[#3B6D11] shrink-0 w-20">{r.articulo}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#4A4740] truncate">{r.descripcion}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  {ADENDO_ESTADOS.map((e, i) => (
                    <span
                      key={e.id}
                      className={cn(
                        'w-2 h-2 rounded-full',
                        i <= etapaIdx
                          ? isVigente ? 'bg-[#3B6D11]' : 'bg-[#6FA832]'
                          : 'bg-[#E8E4DC]',
                      )}
                      title={e.label}
                    />
                  ))}
                  <span className="ml-1 text-[10px] text-[#6B6760]">
                    {ADENDO_ESTADOS[etapaIdx]?.label}
                  </span>
                </div>
              </div>
              {!isVigente && (
                <button
                  type="button"
                  onClick={() => avanzarEstado(r.id)}
                  className="shrink-0 text-[10px] font-medium text-[#3B6D11] hover:text-[#2D5A0D] border border-[#C9DDB1] rounded px-2 py-1 transition-colors"
                >
                  Avanzar →
                </button>
              )}
              {isVigente && <CheckCircle size={14} className="shrink-0 text-[#3B6D11]" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Static legal diagnostic per ZM ──────────────────────────────────────────

const LEGAL_BY_ZM: Record<string, {
  municipiosPrioritarios: number
  totalMunicipios: number
  vaciosJuridicos: number
  adendasPropuestas: number
  cobertura: number
  etapaReforma: string
  municipios: Array<{ nombre: string; separacion: string; recoleccion: string; sancionatoria: string; vacios: number; cobertura: number }>
  hallazgos: string[]
  acciones: string[]
  adendas: AdendaItem[]
  lecturaEjecutiva: string
}> = {
  SLP: {
    municipiosPrioritarios: 3, totalMunicipios: 9, vaciosJuridicos: 18, adendasPropuestas: 12, cobertura: 38, etapaReforma: 'Diagnóstico y reforma',
    lecturaEjecutiva: 'El marco legal municipal muestra avances relevantes, pero aún presenta vacíos que frenan la implementación efectiva del programa de circularidad. Hoy, el 72% de los municipios tiene vacíos en la separación en origen y solo el 12% cuenta con coberturas normativas completas en elementos clave.\n\nLa regulación actual habilita principios generales de gestión de residuos y facultades operativas básicas; sin embargo, limita la imposición de obligaciones específicas, la recuperación de costos y la coordinación interinstitucional. Reformar es clave para consolidar capacidades jurídicas, dar certeza a los operadores y diseñar incentivos que aseguren sostenibilidad técnica y financiera.',
    municipios: [
      { nombre: 'SLP capital',  separacion: 'Parcial',         recoleccion: 'Parcial',         sancionatoria: 'Débil',  vacios: 3, cobertura: 55 },
      { nombre: 'Soledad',      separacion: 'No establecido',  recoleccion: 'No establecido',  sancionatoria: 'Débil',  vacios: 4, cobertura: 12 },
      { nombre: 'Cerro San P.', separacion: 'No establecido',  recoleccion: 'No establecido',  sancionatoria: 'Débil',  vacios: 5, cobertura: 0 },
      { nombre: 'Mexquitic',    separacion: 'Parcial',         recoleccion: 'No establecido',  sancionatoria: 'Débil',  vacios: 6, cobertura: 26 },
    ],
    hallazgos: [
      '72% de municipios presentan vacíos en separación en origen.',
      'La base sancionatoria es insuficiente en el 88% del ámbito.',
      'Solo 1 municipio tiene reglamento con separación diferenciada.',
    ],
    acciones: [
      'Impulsar ordenanzas base alineadas a la reforma.',
      'Establecer ordenanzas marco metropolitanas.',
      'Fortalecer capacidades y acompañamiento jurídico-técnico.',
    ],
    adendas: [
      { id: 'SLP-A01', articulo: 'Art. 10 Bis',     descripcion: 'Obligatoriedad de separación en origen para generadores domiciliarios.',          prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'SLP-A02', articulo: 'Art. 17 Frac. III', descripcion: 'Incorporar trazabilidad por ruta de recolección diferenciada.',                 prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'SLP-A03', articulo: 'Art. 22',          descripcion: 'Establecer sanciones escalonadas por incumplimiento de separación.',              prioridad: 'alta',  ambito: 'Sancionatorio', impacto: 'Alto' },
      { id: 'SLP-A04', articulo: 'Art. 25',          descripcion: 'Definir roles del operador privado y responsabilidad municipal en puntos limpios.', prioridad: 'media', ambito: 'Institucional', impacto: 'Medio' },
      { id: 'SLP-A05', articulo: 'Art. 28 Bis',      descripcion: 'Protocolo de reporte de avance hacia metas de economía circular LGPGIR.',        prioridad: 'media', ambito: 'Institucional', impacto: 'Medio' },
      { id: 'SLP-A06', articulo: 'Art. 31',          descripcion: 'Incentivos fiscales para generadores que acrediten separación verificable.',       prioridad: 'baja',  ambito: 'Financiero',    impacto: 'Bajo' },
    ],
  },
  MTY: {
    municipiosPrioritarios: 5, totalMunicipios: 18, vaciosJuridicos: 23, adendasPropuestas: 18, cobertura: 42, etapaReforma: 'Diagnóstico y reforma',
    lecturaEjecutiva: 'La Zona Metropolitana de Monterrey presenta el mayor número de vacíos jurídicos en la región norte, con 23 elementos sin cobertura normativa suficiente. La heterogeneidad entre municipios —desde Monterrey con 80% de cobertura hasta Santa Catarina sin cobertura— hace imposible escalar el programa sin una reforma marco metropolitana.\n\nLa regulación actual otorga facultades para operar el servicio de limpia, pero carece de los instrumentos de separación diferenciada, trazabilidad y sanciones proporcionales que exige una estrategia de circularidad formal. Reformar no es un trámite administrativo: es la condición para que el programa sea sostenible, financiable y legalmente defendible.',
    municipios: [
      { nombre: 'Monterrey',      separacion: 'Establecido',    recoleccion: 'Establecido',    sancionatoria: 'Media',  vacios: 2, cobertura: 80 },
      { nombre: 'San Nicolás',    separacion: 'Parcial',        recoleccion: 'Parcial',        sancionatoria: 'Débil',  vacios: 4, cobertura: 50 },
      { nombre: 'Guadalupe',      separacion: 'Parcial',        recoleccion: 'Parcial',        sancionatoria: 'Débil',  vacios: 3, cobertura: 48 },
      { nombre: 'San Pedro',      separacion: 'Establecido',    recoleccion: 'Parcial',        sancionatoria: 'Media',  vacios: 2, cobertura: 66 },
      { nombre: 'Santa Catarina', separacion: 'No establecido', recoleccion: 'No establecido', sancionatoria: 'Débil',  vacios: 6, cobertura: 0 },
    ],
    hallazgos: [
      'Solo 5 municipios cuentan con cobertura legal completa alineada a la reforma propuesta.',
      'El 72% presenta vacíos en separación en origen.',
      'Los municipios en la periferia concentran el 80% de la población sin cobertura.',
    ],
    acciones: [
      'Impulsar ordenanzas base alineadas a la reforma.',
      'Establecer ordenanzas marco metropolitanas.',
      'Homologar indicadores y sistema de reporte.',
      'Fortalecer capacidades y acompañamiento jurídico-técnico.',
    ],
    adendas: [
      { id: 'MTY-A01', articulo: 'Art. 10',          descripcion: 'Obligaciones explícitas de separación en origen para todos los generadores.',    prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'MTY-A02', articulo: 'Art. 18 Bis',       descripcion: 'Integración de centros de acopio en la red oficial de servicio de limpia.',    prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'MTY-A03', articulo: 'Art. 25',           descripcion: 'Sanciones por disposición inadecuada de residuos valorizables.',                prioridad: 'alta',  ambito: 'Sancionatorio', impacto: 'Alto' },
      { id: 'MTY-A04', articulo: 'Art. 29',           descripcion: 'Convenios de corresponsabilidad con sector privado y recicladores.',           prioridad: 'media', ambito: 'Institucional', impacto: 'Medio' },
      { id: 'MTY-A05', articulo: 'Art. 33 Frac. II',  descripcion: 'Homologación de criterios entre municipios metropolitanos.',                   prioridad: 'media', ambito: 'Institucional', impacto: 'Medio' },
    ],
  },
  QRO: {
    municipiosPrioritarios: 4, totalMunicipios: 6, vaciosJuridicos: 16, adendasPropuestas: 14, cobertura: 52, etapaReforma: 'Diagnóstico y reforma',
    lecturaEjecutiva: 'Querétaro cuenta con la mejor posición normativa de las zonas analizadas, con una cobertura del 52% y una base legal estatal que facilita la reforma coordinada. Sin embargo, la ausencia de diferenciación de fracciones en el municipio central y los vacíos de trazabilidad limitan la capacidad operativa del programa.\n\nEl marco estatal ofrece una ventana estratégica para impulsar una reforma reglamentaria coordinada a nivel ZM sin necesidad de modificaciones legislativas mayores. La prioridad es armonizar los instrumentos de separación diferenciada, trazabilidad y corresponsabilidad del generador, aprovechando la solidez institucional existente.',
    municipios: [
      { nombre: 'Querétaro',    separacion: 'Establecido', recoleccion: 'Establecido', sancionatoria: 'Media',  vacios: 2, cobertura: 80 },
      { nombre: 'Corregidora',  separacion: 'Parcial',     recoleccion: 'Parcial',     sancionatoria: 'Débil',  vacios: 3, cobertura: 55 },
      { nombre: 'El Marqués',   separacion: 'Parcial',     recoleccion: 'Parcial',     sancionatoria: 'Básica', vacios: 2, cobertura: 56 },
      { nombre: 'San Juan',     separacion: 'Establecido', recoleccion: 'Parcial',     sancionatoria: 'Media',  vacios: 3, cobertura: 50 },
    ],
    hallazgos: [
      'El municipio central tiene cobertura media-alta pero sin diferenciación de fracciones.',
      'Vacíos de trazabilidad y responsabilidad del generador en todos los municipios.',
      'El marco estatal ofrece base para impulsar reforma coordinada.',
    ],
    acciones: [
      'Reforma reglamentaria coordinada a nivel ZM.',
      'Adendos de separación diferenciada en origen.',
      'Establecer esquema de sanciones y registro de generadores.',
    ],
    adendas: [
      { id: 'QRO-A01', articulo: 'Art. 9 Bis', descripcion: 'Obligación de separación en 4 fracciones para todos los generadores.',           prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'QRO-A02', articulo: 'Art. 14',    descripcion: 'Trazabilidad de residuos valorizables desde origen hasta disposición final.',    prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'QRO-A03', articulo: 'Art. 21',    descripcion: 'Registro de recicladores y empresas de valorización en el padrón municipal.',    prioridad: 'alta',  ambito: 'Institucional', impacto: 'Alto' },
      { id: 'QRO-A04', articulo: 'Art. 27',    descripcion: 'Corresponsabilidad y metas anuales para grandes generadores.',                   prioridad: 'media', ambito: 'Institucional', impacto: 'Medio' },
    ],
  },
  GDL: {
    municipiosPrioritarios: 4, totalMunicipios: 9, vaciosJuridicos: 21, adendasPropuestas: 16, cobertura: 45, etapaReforma: 'Diagnóstico y reforma',
    lecturaEjecutiva: 'La Zona Metropolitana de Guadalajara enfrenta una alta heterogeneidad normativa: Guadalajara lidera con 75% de cobertura, pero los municipios periféricos como Tonalá operan prácticamente sin marco regulatorio para la circularidad. Esta brecha impide las economías de escala que el programa requiere para ser financieramente viable.\n\nEl marco estatal jaliscience ofrece una base legislativa sólida para impulsar una reforma coordinada a nivel ZM. La prioridad es establecer una ordenanza marco metropolitana que homologue obligaciones de separación diferenciada, base sancionatoria y criterios de trazabilidad, sin depender de que cada municipio reforme su reglamento de forma independiente.',
    municipios: [
      { nombre: 'Guadalajara', separacion: 'Establecido',    recoleccion: 'Establecido',    sancionatoria: 'Media',  vacios: 2, cobertura: 75 },
      { nombre: 'Zapopan',     separacion: 'Parcial',        recoleccion: 'Parcial',        sancionatoria: 'Débil',  vacios: 4, cobertura: 52 },
      { nombre: 'Tlaquepaque', separacion: 'Parcial',        recoleccion: 'No establecido', sancionatoria: 'Débil',  vacios: 5, cobertura: 30 },
      { nombre: 'Tonalá',      separacion: 'No establecido', recoleccion: 'No establecido', sancionatoria: 'Débil',  vacios: 6, cobertura: 10 },
    ],
    hallazgos: [
      'Guadalajara lidera en cobertura pero no exige separación en 5 fracciones.',
      'Alta heterogeneidad entre municipios limita economías de escala.',
      'El marco estatal jaliscience ofrece base para reforma coordinada ZM.',
    ],
    acciones: [
      'Reforma reglamentaria ordenanza-marco a nivel ZM.',
      'Alineación con el plan maestro de residuos de la capital.',
      'Fortalecer la base sancionatoria en municipios periféricos.',
    ],
    adendas: [
      { id: 'GDL-A01', articulo: 'Art. 11',     descripcion: 'Separación obligatoria en 5 fracciones en ZM Guadalajara.',                     prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'GDL-A02', articulo: 'Art. 19 Bis', descripcion: 'Recolección diferenciada con horarios y rutas definidos por colonia.',          prioridad: 'alta',  ambito: 'Operativo',     impacto: 'Alto' },
      { id: 'GDL-A03', articulo: 'Art. 24',     descripcion: 'Sanciones progresivas para municipios que incumplan metas metropolitanas.',     prioridad: 'alta',  ambito: 'Sancionatorio', impacto: 'Alto' },
      { id: 'GDL-A04', articulo: 'Art. 30',     descripcion: 'Instrumentos económicos: bonos de reciclaje y tarifas diferenciadas.',         prioridad: 'baja',  ambito: 'Financiero',    impacto: 'Bajo' },
    ],
  },
}

function getLegalData(zmActiva: string) {
  return LEGAL_BY_ZM[zmActiva] ?? LEGAL_BY_ZM['MTY']!
}

// ── Coverage helpers ──────────────────────────────────────────────────────────

function coverageColor(pct: number) {
  if (pct >= 70) return { bg: 'bg-[#EAF3DE]', text: 'text-[#23470A]', label: 'Cobertura completa' }
  if (pct >= 40) return { bg: 'bg-[#FEF7E7]', text: 'text-[#6B4800]', label: 'Cobertura parcial' }
  return { bg: 'bg-[#FDE8E8]', text: 'text-[#7A1212]', label: 'Sin cobertura' }
}

function CoverageBar({ pct, label }: { pct: number; label: string }) {
  const { bg, text } = coverageColor(pct)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#E8E4DC] rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-[#3B6D11]" style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded', bg, text)}>{label}</span>
      <span className="font-mono text-[10px] text-[#1C1B18] w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── Analytical blocks data ────────────────────────────────────────────────────

const ANALYTICAL_BLOCKS = [
  {
    title: 'Qué habilita hoy',
    icon: CheckCircle,
    color: '#3B6D11',
    borderColor: 'border-[#D7E8C0]',
    bg: 'bg-[#F4FAEC]',
    iconBg: 'bg-[#D7E8C0]',
    items: [
      'Facultades para prestar el servicio público de limpia y manejo de residuos.',
      'Instrumentos para campañas de separación y educación ambiental.',
      'Posibilidad de coordinación con actores públicos y privados.',
      'Facultades básicas de operación municipal en materia de residuos.',
    ],
  },
  {
    title: 'Qué frena hoy',
    icon: AlertTriangle,
    color: '#C0392B',
    borderColor: 'border-[#F5C4C4]',
    bg: 'bg-[#FDE8E8]',
    iconBg: 'bg-[#F5C4C4]',
    items: [
      'Falta de obligaciones claras sobre separación en origen y segregación.',
      'Ausencia de mecanismos de recuperación de costos e incentivos.',
      'Debilidad en sanciones y ejecución administrativa.',
      'Baja articulación entre norma, operación y trazabilidad.',
    ],
  },
  {
    title: 'Qué debe verificarse',
    icon: Scale,
    color: '#1A5FA8',
    borderColor: 'border-[#BDD7F5]',
    bg: 'bg-[#EBF3FB]',
    iconBg: 'bg-[#BDD7F5]',
    items: [
      'Compatibilidad con la Ley General para la Prevención y Gestión de los Residuos.',
      'Atribuciones para imponer obligaciones y medidas de control.',
      'Armonización con normas estatales y federales.',
      'Viabilidad jurídica de la coordinación con concesionarios u operadores.',
    ],
  },
  {
    title: 'Límite de interpretación',
    icon: Lock,
    color: '#D4881E',
    borderColor: 'border-[#F5D98A]',
    bg: 'bg-[#FEF7E7]',
    iconBg: 'bg-[#F5D98A]',
    items: [
      'La interpretación extensiva de facultades puede generar riesgos de impugnación y nulidad.',
      'La certeza jurídica debe ser expresa, proporcional y con sustento técnico.',
      'Algunos elementos requieren reforma explícita y no pueden resolverse por interpretación administrativa.',
    ],
  },
]

// ── Tab type ──────────────────────────────────────────────────────────────────

type TabId = 'diagnostico' | 'cobertura'

// ── Main component ────────────────────────────────────────────────────────────

export function MunicipalContextStack({
  block,
  moduleAnchor,
  view,
}: {
  block?: SociodemographicDisplayBlock
  moduleAnchor?: string
  view?: TabId
}) {
  const { zmActiva, municipiosActivos } = useSimulatorStore()
  const { openReglamento } = useReglamentoFuente()
  const [tabInternal, setTabInternal] = useState<TabId>('diagnostico')
  const tab = view ?? tabInternal
  const [adendaExpandida, setAdendaExpandida] = useState(false)
  const [rutaNormativaOpen, setRutaNormativaOpen] = useState(false)
  const legalIsFallback = !LEGAL_BY_ZM[zmActiva]
  const legal = getLegalData(zmActiva)
  const zmKey = zmActiva?.toLowerCase() ?? ''
  const munId = municipiosActivos[0] ?? (zmKey || 'mty')

  const altasPriority = legal.adendas.filter(a => a.prioridad === 'alta')
  const otrasAdendas = legal.adendas.filter(a => a.prioridad !== 'alta')
  const adendaMostradas = adendaExpandida ? legal.adendas : altasPriority

  return (
    <div className="space-y-4 pb-6">

      {legalIsFallback && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-amber-900">Datos de referencia (Monterrey)</p>
            <p className="text-[10px] text-amber-800 mt-0.5 leading-relaxed">
              No hay diagnóstico legal específico para esta zona metropolitana. Se muestra el marco de referencia MTY
              hasta cargar el reglamento local. Seleccione su municipio para datos específicos.
            </p>
          </div>
        </div>
      )}

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { icon: Scale,         label: 'Municipios con diagnóstico', value: `${legal.municipiosPrioritarios} / ${legal.totalMunicipios}`, sub: '33% del total',            color: '#1A5FA8' },
          { icon: AlertTriangle, label: 'Vacíos jurídicos',           value: legal.vaciosJuridicos.toString(),                             sub: 'en reglamentos vigentes', color: '#D4881E' },
          { icon: FileText,      label: 'Adendos propuestos',         value: legal.adendasPropuestas.toString(),                           sub: 'artículos o fracciones',  color: '#3B6D11' },
          { icon: Shield,        label: 'Etapa de reforma',           value: legal.etapaReforma,                                           sub: 'Paso 2 de 5 normativos',   color: '#5A4A2A' },
          { icon: CheckCircle,   label: 'Cobertura normativa',        value: `${legal.cobertura}%`,                                        sub: 'Objetivo 2025: 85%',       color: '#3B6D11' },
        ].map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 shrink-0" style={{ color }} strokeWidth={2} />
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] leading-none">{label}</p>
            </div>
            <p className="font-semibold text-[14px] leading-tight" style={{ color }}>{value}</p>
            {sub && <p className="text-[9px] text-[#A8A49C] mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* ── Tab navigation — oculto con view fijo ───────────────────────────── */}
      {!view && (
      <nav className="flex gap-1.5 rounded-[10px] border border-[#E8E4DC] bg-[#F4F2ED] p-1.5">
        {([
          { id: 'diagnostico' as TabId, label: 'Diagnóstico y reforma' },
          { id: 'cobertura'   as TabId, label: 'Cobertura territorial' },
        ]).map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTabInternal(t.id)}
            className={cn(
              'flex-1 px-4 py-2 rounded-[7px] text-[12px] font-medium transition-colors',
              tab === t.id
                ? 'bg-white text-[#1C1B18] shadow-sm border border-[#E8E4DC]'
                : 'text-[#6B6760] hover:text-[#1C1B18]',
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>
      )}

      {/* ══ TAB 1: Diagnóstico y reforma ═══════════════════════════════════════ */}
      {tab === 'diagnostico' && (
        <div className="space-y-5">

          {/* A. Lectura ejecutiva del módulo */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />
              Lectura ejecutiva del módulo
            </p>
            <div className="flex items-start gap-5">
              <div className="flex-1 min-w-0">
                {legal.lecturaEjecutiva.split('\n\n').map((párrafo, i) => (
                  <p key={i} className={cn('text-[13px] leading-relaxed text-[#4A4740]', i > 0 && 'mt-3')}>
                    {párrafo}
                  </p>
                ))}
              </div>
              {/* Decorative legal icon */}
              <div className="shrink-0 hidden md:flex w-16 h-16 rounded-[12px] bg-[#F4FAEC] border border-[#D7E8C0] items-center justify-center">
                <Scale className="w-8 h-8 text-[#3B6D11]" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* B. 4 analytical blocks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {ANALYTICAL_BLOCKS.map(block => {
              const Icon = block.icon
              return (
                <div key={block.title} className={cn('rounded-[12px] border p-4', block.borderColor, block.bg)}>
                  <div className={cn('w-7 h-7 rounded-[8px] flex items-center justify-center mb-3', block.iconBg)}>
                    <Icon className="w-4 h-4" style={{ color: block.color }} strokeWidth={2} />
                  </div>
                  <p className="text-[12px] font-semibold mb-2.5" style={{ color: block.color }}>{block.title}</p>
                  <ul className="space-y-1.5">
                    {block.items.map(item => (
                      <li key={item} className="text-[11px] text-[#4A4740] leading-snug flex items-start gap-1.5">
                        <span className="mt-1 shrink-0 w-1 h-1 rounded-full inline-block" style={{ background: block.color }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>

          {/* C. Ruta de reforma normativa */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <button
              type="button"
              onClick={() => setRutaNormativaOpen(o => !o)}
              className="w-full flex items-start justify-between gap-3 text-left"
            >
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-0.5">Ruta de reforma normativa</p>
                <p className="text-[13px] font-semibold text-[#1C1B18] mb-1">Pasos normativos de la reforma</p>
                <p className="text-[11px] text-[#6B6760] max-w-2xl leading-relaxed">
                  Secuencia jurídica — no el calendario de implementación, que se arma en Planificación (Cap. 2).
                </p>
              </div>
              <ChevronDown
                size={16}
                className={cn('text-[#A8A49C] shrink-0 mt-1 transition-transform', rutaNormativaOpen && 'rotate-180')}
              />
            </button>

            {rutaNormativaOpen && (
              <>
                <p className="text-[11px] text-[#6B6760] mb-4 max-w-2xl mt-3">
                  La reforma jurídica no debe verse como una lista aislada de cambios, sino como una secuencia que alinea facultades, operadores e infraestructura antes de comprometer fechas operativas.
                </p>

                <div className="flex flex-wrap gap-2 lg:gap-0 lg:flex-nowrap">
                  {FASES_INSTITUCIONALES.map((f, idx) => (
                    <div key={f.fase} className="flex items-stretch lg:flex-1">
                      <div className={cn(
                        'flex-1 rounded-[10px] border p-3',
                        f.bloqueante ? 'border-[#D4881E]/50 bg-[#FEF7E7]' : 'border-[#E8E4DC] bg-[#FAFAF8]',
                      )}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={cn(
                            'text-[9px] font-bold px-1.5 py-0.5 rounded font-mono',
                            f.bloqueante ? 'bg-[#D4881E] text-white' : 'bg-[#3B6D11] text-white',
                          )}>
                            P{f.fase}
                          </span>
                          {f.bloqueante && <Lock className="w-2.5 h-2.5 text-[#D4881E]" />}
                        </div>
                        <p className="text-[10px] font-semibold text-[#1C1B18] leading-snug">{f.nombre}</p>
                        <p className="text-[9px] text-[#A8A49C] mt-1">{f.meses} meses</p>
                        <p className="text-[9px] text-[#6B6760] mt-0.5 leading-snug">Hito: {f.gate}</p>
                      </div>
                      {idx < FASES_INSTITUCIONALES.length - 1 && (
                        <div className="hidden lg:flex items-center px-1">
                          <ChevronRight className="w-3 h-3 text-[#A8A49C]" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* D. Ver adendos jurídicos CTA */}
            <div className="mt-4 pt-4 border-t border-[#F0EDE5] flex items-center justify-between gap-3">
              <p className="text-[11px] text-[#6B6760]">
                Los adendos propuestos traducen esta ruta en modificaciones concretas al reglamento vigente.
              </p>
              <button
                type="button"
                onClick={() => openReglamento(munId)}
                className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-[8px] bg-[#3B6D11] text-white text-[12px] font-semibold hover:bg-[#2D5A0D] transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                Abrir comparativa legal
              </button>
            </div>
          </div>

          {/* E. Tabla de adendos propuestos */}
          <div id="m02-adendas-section" className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-3 border-b border-[#F0EDE5] flex items-start justify-between gap-3">
              <div>
                <p className="text-[12px] font-semibold text-[#1C1B18]">Adendos propuestos al reglamento</p>
                <p className="text-[10px] text-[#A8A49C] mt-0.5">
                  {legal.adendasPropuestas} modificaciones identificadas para alcanzar cobertura normativa · ordenadas por prioridad
                </p>
              </div>
              <span className="shrink-0 text-[9px] font-semibold bg-[#FDE8E8] text-[#7A1212] border border-[#F5C4C4] rounded px-2 py-0.5">
                {altasPriority.length} de alta prioridad
              </span>
              <button
                type="button"
                onClick={() => openReglamento(munId)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-[7px] border border-[#3B6D11]/30 bg-[#F4FAEC] text-[10px] font-semibold text-[#3B6D11] hover:bg-[#EAF3DE] transition-colors"
              >
                <FileText className="w-3 h-3" />
                Reglamento y adendos
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Prioridad</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Artículo / Fracción</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Descripción de la modificación</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-[#1C1B18]">Ámbito</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-[#1C1B18]">Impacto esperado</th>
                    <th className="text-center px-2 py-2.5 text-[#A8A49C]"></th>
                  </tr>
                </thead>
                <tbody>
                  {adendaMostradas.map((a, i) => (
                    <tr key={a.id} className={cn(i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]', 'hover:bg-[#F4FAEC] transition-colors')}>
                      <td className="px-4 py-2.5">
                        <span className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold',
                          a.prioridad === 'alta'  ? 'bg-[#FDE8E8] text-[#7A1212]' :
                          a.prioridad === 'media' ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                    'bg-[#F0EDE5] text-[#6B6760]',
                        )}>
                          {a.prioridad.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[10px] font-semibold text-[#3B6D11] whitespace-nowrap">{a.articulo}</td>
                      <td className="px-3 py-2.5 text-[#4A4740] max-w-xs">{a.descripcion}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-[10px] text-[#6B6760] bg-[#F4F2ED] border border-[#E8E4DC] rounded px-1.5 py-0.5">{a.ambito}</span>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded',
                          a.impacto === 'Alto'  ? 'bg-[#EAF3DE] text-[#23470A]' :
                          a.impacto === 'Medio' ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                  'bg-[#F0EDE5] text-[#6B6760]',
                        )}>{a.impacto}</span>
                      </td>
                      <td className="px-2 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => openReglamento(munId)}
                          title="Abrir comparativa vigente vs. propuesto"
                          className="text-[10px] font-medium text-[#3B6D11] hover:text-[#2D5A0D] px-2 py-0.5 rounded hover:bg-[#EAF3DE] transition-colors"
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {otrasAdendas.length > 0 && (
              <div className="px-5 py-3 border-t border-[#F0EDE5] bg-[#FAFAF8]">
                <button
                  type="button"
                  onClick={() => setAdendaExpandida(p => !p)}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-[#3B6D11] hover:text-[#2D5A0D] transition-colors"
                >
                  <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', adendaExpandida && 'rotate-180')} />
                  {adendaExpandida
                    ? 'Mostrar solo prioridad alta'
                    : `Ver ${otrasAdendas.length} adendos adicionales de prioridad media y baja`}
                </button>
              </div>
            )}
          </div>

          {/* F. Panel de estados del adendo — ciclo de vida legislativo */}
          <AdendoWorkflowPanel adendas={altasPriority} />

          {/* Coverage gauge + hallazgos + acciones */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Gauge */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Cobertura normativa actual vs. objetivo</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
                  <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="#E8E4DC" strokeWidth="10" />
                    <circle
                      cx="44" cy="44" r="36" fill="none"
                      stroke="#3B6D11" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 36 * legal.cobertura / 100} ${2 * Math.PI * 36}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <p className="font-mono text-[18px] font-bold text-[#3B6D11]">{legal.cobertura}%</p>
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-[#A8A49C]">Cobertura actual</span>
                      <span className="font-medium text-[#3B6D11]">{legal.cobertura}%</span>
                    </div>
                    <div className="h-1.5 bg-[#E8E4DC] rounded-full">
                      <div className="h-full rounded-full bg-[#3B6D11]" style={{ width: `${legal.cobertura}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-[#A8A49C]">Objetivo 2025</span>
                      <span className="font-medium text-[#1C1B18]">85%</span>
                    </div>
                    <div className="h-1.5 bg-[#E8E4DC] rounded-full">
                      <div className="h-full rounded-full bg-[#A8C898]" style={{ width: '85%' }} />
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-[#A8A49C]">% de municipios con regulación completa en elementos clave.</p>
            </div>

            {/* Hallazgos + acciones */}
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Hallazgos territoriales</p>
                <ul className="space-y-2">
                  {legal.hallazgos.map(h => (
                    <li key={h} className="flex items-start gap-2 text-[11px] text-[#6B6760]">
                      <AlertTriangle className="w-3 h-3 text-[#D4881E] mt-0.5 shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-4">
                <p className="text-[11px] font-semibold text-[#3B6D11] mb-3">Acción regulatoria sugerida</p>
                <ul className="space-y-2">
                  {legal.acciones.map(a => (
                    <li key={a} className="flex items-start gap-2 text-[11px] text-[#3B5F23]">
                      <CheckCircle className="w-3 h-3 text-[#3B6D11] mt-0.5 shrink-0" />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Regulatory diagnostic table */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="text-[12px] font-semibold text-[#1C1B18]">Diagnóstico regulatorio por municipio</p>
              <p className="text-[10px] text-[#A8A49C]">Componentes clave del marco jurídico actual.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-[#FAFAF8] border-b border-[#F0EDE5]">
                    <th className="text-left px-4 py-2.5 font-semibold text-[#1C1B18]">Municipio</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Separación en origen</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Recolección diferenciada</th>
                    <th className="text-left px-3 py-2.5 font-semibold text-[#1C1B18]">Base sancionatoria</th>
                    <th className="text-center px-3 py-2.5 font-semibold text-[#1C1B18]">Vacíos</th>
                    <th className="px-4 py-2.5 font-semibold text-[#1C1B18]">Cobertura</th>
                  </tr>
                </thead>
                <tbody>
                  {legal.municipios.map((m, i) => {
                    const cov = coverageColor(m.cobertura)
                    return (
                      <tr key={m.nombre} className={i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]'}>
                        <td className="px-4 py-2.5 font-medium text-[#1C1B18]">{m.nombre}</td>
                        <td className="px-3 py-2.5">
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px]',
                            m.separacion === 'Establecido' ? 'bg-[#EAF3DE] text-[#23470A]' :
                            m.separacion === 'Parcial'     ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                            'bg-[#F0EDE5] text-[#A8A49C]',
                          )}>{m.separacion}</span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={cn('px-1.5 py-0.5 rounded text-[10px]',
                            m.recoleccion === 'Establecido' ? 'bg-[#EAF3DE] text-[#23470A]' :
                            m.recoleccion === 'Parcial'     ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                             'bg-[#F0EDE5] text-[#A8A49C]',
                          )}>{m.recoleccion}</span>
                        </td>
                        <td className="px-3 py-2.5 text-[#6B6760]">{m.sancionatoria}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#FEF7E7] text-[#D4881E] font-mono text-[10px] font-bold">
                            {m.vacios}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <CoverageBar pct={m.cobertura} label={cov.label} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ══ TAB 2: Cobertura territorial ═══════════════════════════════════════ */}
      {tab === 'cobertura' && (
        <div className="space-y-4">

          {/* MAP — elemento central de la página, per mockup MODUO 2 PAG 2 */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <p className="text-[12px] font-semibold text-[#1C1B18]">Cobertura legal territorial</p>
                <p className="text-[10px] text-[#A8A49C]">Lectura territorial de la regulación vigente · ZM seleccionada</p>
              </div>
              <span className="text-[9px] bg-[#EBF3FB] border border-[#B0D0F5] text-[#0D3B7A] rounded px-2 py-0.5 font-medium shrink-0">Mapa de cobertura</span>
            </div>
            <CoberturaNacional />
          </div>

          {/* Hallazgos + Acciones */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Hallazgos territoriales</p>
              <ul className="space-y-2.5">
                {legal.hallazgos.map(h => (
                  <li key={h} className="flex items-start gap-2 text-[11px] text-[#6B6760]">
                    <AlertTriangle className="w-3 h-3 text-[#D4881E] mt-0.5 shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F4FAEC] p-4">
              <p className="text-[11px] font-semibold text-[#3B6D11] mb-3">Acción regulatoria sugerida</p>
              <ul className="space-y-2.5">
                {legal.acciones.map(a => (
                  <li key={a} className="flex items-start gap-2 text-[11px] text-[#3B5F23]">
                    <CheckCircle className="w-3 h-3 text-[#3B6D11] mt-0.5 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Coverage bars — secondary, below map */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[12px] font-semibold text-[#1C1B18] mb-1">Diagnóstico regulatorio por municipio</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">% de cobertura actual · objetivo 85% · ordenado de mayor a menor</p>
            <ExpandableChart
              chartId="m02-cobertura-normativa"
              title="Cobertura normativa por municipio"
              subtitle="% de cobertura actual · objetivo 85%"
            >
              <ResponsiveContainer width="100%" height={Math.max(100, legal.municipios.length * 32)}>
                <BarChart
                  data={[...legal.municipios].sort((a, b) => b.cobertura - a.cobertura)}
                  layout="vertical"
                  margin={{ top: 0, right: 48, left: 96, bottom: 0 }}
                >
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 9, fill: '#A8A49C' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="nombre" tick={{ fontSize: 10, fill: '#4A4740' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Cobertura']} contentStyle={{ fontSize: 11, border: '1px solid #E8E4DC', borderRadius: 6 }} />
                  <ReferenceLine x={85} stroke="#D4881E" strokeDasharray="4 2" label={{ value: 'Obj. 85%', position: 'right', fontSize: 9, fill: '#D4881E' }} />
                  <Bar dataKey="cobertura" radius={[0, 4, 4, 0]}>
                    {[...legal.municipios].sort((a, b) => b.cobertura - a.cobertura).map(m => (
                      <Cell key={m.nombre} fill={m.cobertura >= 70 ? '#3B6D11' : m.cobertura >= 40 ? '#D4881E' : '#C0392B'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ExpandableChart>
            <div className="flex gap-4 mt-3 text-[10px]">
              {[['#3B6D11', 'Cobertura completa (≥70%)'], ['#D4881E', 'Cobertura parcial (40-69%)'], ['#C0392B', 'Sin cobertura (<40%)']].map(([color, label]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                  <span className="text-[#6B6760]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-4 text-[12px] text-[#6B6760]">
            <p className="font-medium text-[#1C1B18] mb-1">Contexto social</p>
            <p>El diagnóstico demográfico y la encuesta ciudadana viven en los módulos M02, M02B y M02C del rubro Social — no se duplican aquí.</p>
          </div>
        </div>
      )}

      {/* ── Bottom action bar ─────────────────────────────────────────────────── */}
      {!view && <ModuleBottomBar onProfundizar={() => setTabInternal('cobertura')} />}

    </div>
  )
}
