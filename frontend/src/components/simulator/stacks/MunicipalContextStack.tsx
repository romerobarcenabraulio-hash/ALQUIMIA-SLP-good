'use client'

import { useState } from 'react'
import { ChevronRight, Scale, Shield, AlertTriangle, CheckCircle, Lock } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_INSTITUCIONALES } from '@/lib/constants'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { MarcoLegal } from '@/components/simulator/MarcoLegal'
import CoberturaNacional from '@/components/simulator/CoberturaNacional'
import { SocialDemographicContextPanel } from '@/components/simulator/SocialDemographicContextPanel'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import { cn } from '@/lib/utils'

// ── Static legal diagnostic per ZM ─────────────────────────────────────────

const LEGAL_BY_ZM: Record<string, {
  municipiosPrioritarios: number
  totalMunicipios: number
  vaciosJuridicos: number
  adendasPropuestas: number
  cobertura: number
  faseActual: string
  municipios: Array<{ nombre: string; separacion: string; recoleccion: string; sancionatoria: string; vacios: number; cobertura: number }>
  hallazgos: string[]
  acciones: string[]
}> = {
  SLP: {
    municipiosPrioritarios: 3, totalMunicipios: 9, vaciosJuridicos: 18, adendasPropuestas: 12, cobertura: 38, faseActual: 'Diagnóstico y reforma',
    municipios: [
      { nombre: 'SLP capital',  separacion: 'Parcial',         recoleccion: 'Parcial',         sancionatoria: 'Débil',  vacios: 3, cobertura: 55 },
      { nombre: 'Soledad',      separacion: 'No establecido',  recoleccion: 'No establecido',  sancionatoria: 'Débil',  vacios: 4, cobertura: 12 },
      { nombre: 'Cerro San P.', separacion: 'No establecido',  recoleccion: 'No establecido',  sancionatoria: 'Débil',  vacios: 5, cobertura: 0 },
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
  },
  MTY: {
    municipiosPrioritarios: 5, totalMunicipios: 18, vaciosJuridicos: 23, adendasPropuestas: 18, cobertura: 42, faseActual: 'Diagnóstico y reforma',
    municipios: [
      { nombre: 'Monterrey',      separacion: 'Establecido',  recoleccion: 'Establecido',  sancionatoria: 'Media',  vacios: 2, cobertura: 80 },
      { nombre: 'San Nicolás',    separacion: 'Parcial',      recoleccion: 'Parcial',      sancionatoria: 'Débil',  vacios: 4, cobertura: 50 },
      { nombre: 'Guadalupe',      separacion: 'Parcial',      recoleccion: 'Parcial',      sancionatoria: 'Débil',  vacios: 3, cobertura: 48 },
      { nombre: 'San Pedro',      separacion: 'Establecido',  recoleccion: 'Parcial',      sancionatoria: 'Media',  vacios: 2, cobertura: 66 },
      { nombre: 'Santa Catarina', separacion: 'No establecido', recoleccion: 'No establecido', sancionatoria: 'Débil', vacios: 6, cobertura: 0 },
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
  },
  QRO: {
    municipiosPrioritarios: 4, totalMunicipios: 6, vaciosJuridicos: 16, adendasPropuestas: 14, cobertura: 52, faseActual: 'Diagnóstico y reforma',
    municipios: [
      { nombre: 'Querétaro',    separacion: 'Establecido', recoleccion: 'Establecido', sancionatoria: 'Media', vacios: 2, cobertura: 80 },
      { nombre: 'Corregidora',  separacion: 'Parcial',     recoleccion: 'Parcial',     sancionatoria: 'Débil', vacios: 3, cobertura: 55 },
      { nombre: 'El Marqués',   separacion: 'Parcial',     recoleccion: 'Parcial',     sancionatoria: 'Básica', vacios: 2, cobertura: 56 },
      { nombre: 'San Juan',     separacion: 'Establecido', recoleccion: 'Parcial',     sancionatoria: 'Media', vacios: 3, cobertura: 50 },
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
  },
  GDL: {
    municipiosPrioritarios: 4, totalMunicipios: 9, vaciosJuridicos: 21, adendasPropuestas: 16, cobertura: 45, faseActual: 'Diagnóstico y reforma',
    municipios: [
      { nombre: 'Guadalajara', separacion: 'Establecido', recoleccion: 'Establecido', sancionatoria: 'Media', vacios: 2, cobertura: 75 },
      { nombre: 'Zapopan',     separacion: 'Parcial',     recoleccion: 'Parcial',     sancionatoria: 'Débil', vacios: 4, cobertura: 52 },
      { nombre: 'Tlaquepaque', separacion: 'Parcial',     recoleccion: 'No establecido', sancionatoria: 'Débil', vacios: 5, cobertura: 30 },
      { nombre: 'Tonalá',      separacion: 'No establecido', recoleccion: 'No establecido', sancionatoria: 'Débil', vacios: 6, cobertura: 10 },
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
  },
}

function getLegalData(zmActiva: string) {
  return LEGAL_BY_ZM[zmActiva] ?? LEGAL_BY_ZM['MTY']!
}

// ── Coverage color helpers ────────────────────────────────────────────────────

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

// ── Tab nav ───────────────────────────────────────────────────────────────────

type TabId = 'diagnostico' | 'cobertura'
const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'diagnostico', label: 'Diagnóstico y reforma' },
  { id: 'cobertura',   label: 'Cobertura territorial' },
]

// ── Main component ────────────────────────────────────────────────────────────

export function MunicipalContextStack({ block, moduleAnchor }: { block?: SociodemographicDisplayBlock; moduleAnchor?: string }) {
  const { zmActiva, audience } = useSimulatorStore()
  const [tab, setTab] = useState<TabId>('diagnostico')
  const legal = getLegalData(zmActiva)

  return (
    <div className="space-y-4 pb-6">

      {/* ── M02 KPI strip ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {[
          { icon: Scale,        label: 'Municipios con diagnóstico', value: `${legal.municipiosPrioritarios} / ${legal.totalMunicipios}`, sub: 'con diagnóstico legal', color: '#1A5FA8' },
          { icon: AlertTriangle, label: 'Vacíos jurídicos',           value: legal.vaciosJuridicos.toString(),                            sub: 'en reglamentos vigentes', color: '#D4881E' },
          { icon: Scale,        label: 'Adendas propuestas',          value: legal.adendasPropuestas.toString(),                         sub: 'artículos o fracciones', color: '#3B6D11' },
          { icon: Shield,       label: 'Fase actual',                 value: legal.faseActual,                                            sub: '',                       color: '#5A4A2A' },
          { icon: CheckCircle,  label: 'Cobertura normativa',         value: `${legal.cobertura}%`,                                       sub: `obj. 85%`,               color: '#3B6D11' },
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

      {/* ── Tab navigation ─────────────────────────────────────────────── */}
      <nav className="flex gap-1.5 rounded-[10px] border border-[#E8E4DC] bg-[#F4F2ED] p-1.5">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
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

      {/* ── Tab 1: Diagnóstico y reforma ───────────────────────────────── */}
      {tab === 'diagnostico' && (
        <div className="space-y-4">
          <ScopeAnclaKicker className="text-[11px]" />

          {/* Reading panels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Executive reading */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-[#FDE8E8] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-3 h-3 text-[#C0392B]" />
                </div>
                <p className="text-[11px] font-semibold text-[#1C1B18]">Lectura ejecutiva del módulo</p>
              </div>

              <div className="mb-3">
                <p className="text-[10px] font-semibold text-[#C0392B] mb-2 uppercase tracking-wide">¿Qué está mal jurídicamente?</p>
                <ul className="space-y-1.5">
                  {[
                    'Reglamentos desactualizados o sin base técnica.',
                    'Falta de obligaciones claras para separación en origen.',
                    'Ausencia de esquemas de trazabilidad y sanciones.',
                    'Débil corresponsabilidad del generador y del servicio.',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-[#6B6760]">
                      <span className="text-[#C0392B] mt-0.5 shrink-0">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#F0EDE5] pt-3">
                <p className="text-[10px] font-semibold text-[#3B6D11] mb-2 uppercase tracking-wide">¿Qué buscamos arreglar?</p>
                <ul className="space-y-1.5">
                  {[
                    'Alinear el reglamento con la Ley General y estatal.',
                    'Incorporar separación, recolección diferenciada y trazabilidad.',
                    'Establecer obligaciones, incentivos y sanciones proporcionales.',
                    'Fortalecer la corresponsabilidad de todos los actores.',
                  ].map(item => (
                    <li key={item} className="flex items-start gap-2 text-[11px] text-[#5A6347]">
                      <span className="text-[#3B6D11] mt-0.5 shrink-0">›</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Technical reading */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-full bg-[#EAF3DE] flex items-center justify-center shrink-0">
                  <Scale className="w-3 h-3 text-[#3B6D11]" />
                </div>
                <p className="text-[11px] font-semibold text-[#1C1B18]">Lectura técnica</p>
              </div>

              <div className="space-y-3 text-[11px]">
                <div>
                  <p className="font-semibold text-[#1C1B18] mb-1">Base legal</p>
                  <p className="text-[#6B6760] leading-relaxed">
                    LGPGIR, Ley Ambiental del Estado vigente, Ley de Mejora Regulatoria Estatal y Reglamento municipal vigente.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#1C1B18] mb-1">Alcance</p>
                  <p className="text-[#6B6760] leading-relaxed">
                    Reforma al reglamento de limpia y gestión de residuos para incorporar principios de economía circular: obligaciones
                    específicas, trazabilidad, sanciones e instrumentos de corresponsabilidad.
                  </p>
                </div>
                <div className="rounded-[8px] bg-[#FEF7E7] border border-[#F5D98A] px-3 py-2.5">
                  <p className="font-semibold text-[#6B4800] mb-1">Validación requerida</p>
                  <p className="text-[#6B6760]">
                    No sustituye dictamen legal definitivo; requiere validación del área jurídica municipal.
                  </p>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[#A8A49C]">Nivel de confianza</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-[#E8E4DC] rounded-full">
                      <div className="h-full rounded-full bg-[#3B6D11]" style={{ width: '65%' }} />
                    </div>
                    <span className="font-medium text-[#3B6D11]">65%</span>
                    <span className="text-[#A8A49C]">Medio-alto</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reform roadmap F1-F5 */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
            <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Ruta de reforma normativa</p>
            <p className="text-[10px] text-[#A8A49C] mb-4">Fases propuestas para actualizar el marco jurídico municipal.</p>

            <div className="flex flex-wrap gap-2 lg:gap-0 lg:flex-nowrap">
              {FASES_INSTITUCIONALES.map((f, idx) => (
                <div key={f.fase} className="flex items-stretch lg:flex-1">
                  <div
                    className={cn(
                      'flex-1 rounded-[10px] border p-3',
                      f.bloqueante
                        ? 'border-[#D4881E]/50 bg-[#FEF7E7]'
                        : 'border-[#E8E4DC] bg-[#FAFAF8]',
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded font-mono',
                        f.bloqueante ? 'bg-[#D4881E] text-white' : 'bg-[#3B6D11] text-white',
                      )}>
                        F{f.fase}
                      </span>
                      {f.bloqueante && (
                        <Lock className="w-2.5 h-2.5 text-[#D4881E]" />
                      )}
                    </div>
                    <p className="text-[10px] font-semibold text-[#1C1B18] leading-snug">{f.nombre}</p>
                    <p className="text-[9px] text-[#A8A49C] mt-1">{f.meses} meses</p>
                    <p className="text-[9px] text-[#6B6760] mt-0.5 leading-snug">{f.gate}</p>
                  </div>
                  {idx < FASES_INSTITUCIONALES.length - 1 && (
                    <div className="hidden lg:flex items-center px-1">
                      <ChevronRight className="w-3 h-3 text-[#A8A49C]" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Municipal coverage diagnostic table */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F0EDE5]">
              <p className="text-[12px] font-semibold text-[#1C1B18]">Diagnóstico regulatorio por municipio</p>
              <p className="text-[10px] text-[#A8A49C]">Componentes de elementos clave del marco jurídico actual.</p>
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
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px]',
                            m.separacion === 'Establecido' ? 'bg-[#EAF3DE] text-[#23470A]' :
                            m.separacion === 'Parcial'     ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                            'bg-[#F0EDE5] text-[#A8A49C]',
                          )}>
                            {m.separacion}
                          </span>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px]',
                            m.recoleccion === 'Establecido' ? 'bg-[#EAF3DE] text-[#23470A]' :
                            m.recoleccion === 'Parcial'     ? 'bg-[#FEF7E7] text-[#6B4800]' :
                                                             'bg-[#F0EDE5] text-[#A8A49C]',
                          )}>
                            {m.recoleccion}
                          </span>
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

          {/* Coverage gauge + MarcoLegal full */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
              <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Cobertura normativa actual vs. objetivo</p>
              <div className="flex items-center gap-4 mb-3">
                <div className="relative" style={{ width: 88, height: 88 }}>
                  <svg viewBox="0 0 88 88" className="w-full h-full -rotate-90">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="#E8E4DC" strokeWidth="10" />
                    <circle
                      cx="44" cy="44" r="36" fill="none"
                      stroke="#3B6D11" strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 36 * legal.cobertura / 100} ${2 * Math.PI * 36}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center rotate-0">
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

            {/* Hallazgos + Acciones */}
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

          {/* Marco legal component */}
          <MarcoLegal mode={audience === 'citizen' ? 'citizen' : 'functionary'} />
        </div>
      )}

      {/* ── Tab 2: Cobertura territorial ───────────────────────────────── */}
      {tab === 'cobertura' && (
        <div className="space-y-4">
          {block && (
            <SocialDemographicContextPanel block={block} moduleAnchor={moduleAnchor ?? 'municipal_context'} />
          )}
          <CoberturaNacional />
        </div>
      )}
    </div>
  )
}
