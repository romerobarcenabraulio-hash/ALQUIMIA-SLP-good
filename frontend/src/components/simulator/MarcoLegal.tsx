'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_INSTITUCIONALES } from '@/lib/constants'
import { ContadorOportunidad } from '@/components/charts/ContadorOportunidad'
import { DiagnosticoJuridico } from '@/components/simulator/DiagnosticoJuridico'
import { useReglamentoFuente } from '@/components/reglamento/ReglamentoModal'
import { cn } from '@/lib/utils'

export type MarcoLegalMode = 'citizen' | 'functionary'

const ROADMAP_ITEMS: { titulo: string; detalle: string }[] = [
  {
    titulo: 'Diagnóstico del reglamento de limpia vigente',
    detalle: 'Se contrasta el texto publicado con las obligaciones de separación y sanción que el programa necesita.',
  },
  {
    titulo: 'Identificación de brechas normativas',
    detalle: 'Se listan artículos ausentes u obsoletos que impiden cobrar o contratar con claridad.',
  },
  {
    titulo: 'Redacción de iniciativa de reforma',
    detalle: 'Se prepara la minuta para comisiones —no sustituye el dictamen interno del municipio.',
  },
  {
    titulo: 'Presentación ante Cabildo',
    detalle: 'Se anexan números de captura y derrama para defender la reforma en sesión.',
  },
  {
    titulo: 'Aprobación de reforma reglamentaria',
    detalle: 'El cabildo vota; aquí se marca el hito que destraba multas y concesiones.',
  },
  {
    titulo: 'Publicación en Periódico Oficial del Estado',
    detalle: 'La reforma entra en vigor para terceros —condición para actos ejecutables.',
  },
]

interface MarcoLegalProps {
  /** Vista ciudadana: solo educación; sin roadmap ni motor jurídico interactivo. */
  mode?: MarcoLegalMode
}

export function MarcoLegal({ mode = 'functionary' }: MarcoLegalProps) {
  const { gatesAprobados, setGate, zmActiva } = useSimulatorStore()
  const { openReglamento } = useReglamentoFuente()
  const munId = zmActiva?.toLowerCase() ?? 'mty'

  if (mode === 'citizen') {
    return (
      <div>
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4.5 — Marco legal (vista ciudadana)</p>
        <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Leyes locales y programa de limpia</h2>
        <p className="text-[13px] text-[#6B6760] mb-6 max-w-2xl leading-relaxed">
          Cada municipio opera su propio reglamento de limpia. La zona metropolitana coordina —no sustituye al ayuntamiento.
          Lo que lees aquí resume el marco local en lenguaje claro.
        </p>
        <div className="mb-6 rounded-[10px] border border-[#D4881E]/30 bg-[#FEF7E7] p-4">
          <p className="text-[12px] font-medium text-[#1C1B18] mb-1">Vista educativa</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
            Esta pantalla orienta —no reemplaza el Periódico Oficial, la ventanilla municipal ni un parecer jurídico.
            Trámites y sanciones siguen el reglamento publicado de tu territorio.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-[11px] font-medium text-[#6B6760] mb-3">Etapas habituales de un programa municipal</p>
          <p className="mb-3 text-[12px] text-[#6B6760] leading-relaxed">
            Los equipos avanzan por fases parecidas a estas. La lista es guía conceptual —no un checklist legal.
          </p>
          <div className="flex flex-col gap-2">
            {FASES_INSTITUCIONALES.map(f => (
              <div
                key={f.fase}
                className={cn(
                  'flex items-start gap-3 px-4 py-3 rounded-[10px] border',
                  f.bloqueante ? 'border-[#D4881E]/40 bg-[#FEF7E7]' : 'border-[#E8E4DC] bg-[#FDFCFA]',
                )}
              >
                <span
                  className={cn(
                    'font-mono text-[11px] px-2 py-0.5 rounded-full shrink-0',
                    f.bloqueante ? 'bg-[#D4881E] text-white' : 'bg-[#E2DED6] text-[#6B6760]',
                  )}
                >
                  F{f.fase}
                </span>
                <div>
                  <p className="text-[12px] font-medium text-[#1C1B18]">{f.nombre}</p>
                  <p className="text-[11px] text-[#6B6760]">{f.meses} meses · {f.gate}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4.5 — Marco legal y reforma reglamentaria</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Reforma reglamentaria</h2>
      <p className="text-[13px] text-[#6B6760] mb-6 max-w-2xl">
        ALQUIMIA no emite dictamen legal ni aprueba reformas. Lo que genera es el expediente técnico de respaldo — el mismo que un equipo jurídico municipal necesita para redactar la iniciativa y presentarla ante Cabildo.
      </p>
      <div className="mb-6 rounded-[10px] border border-[#E8E4DC] bg-[#F8F6F1] p-4 flex items-start justify-between gap-4">
        <p className="text-[13px] leading-relaxed text-[#6B6760] flex-1">
          Aquí se contrastan los adendos propuestos con el reglamento vigente. No son ley —son borrador técnico para que el cabildo discuta con números en la mesa.
        </p>
        <button
          type="button"
          onClick={() => openReglamento(munId)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2D5409] transition-colors"
        >
          Ver adendos propuestos
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* Roadmap interactivo */}
      <div className="flex flex-col gap-2 mb-6">
        {ROADMAP_ITEMS.map((item, i) => {
          const checked = gatesAprobados[i] ?? false
          const prev    = i === 0 || (gatesAprobados[i - 1] ?? false)
          return (
            <button
              key={i}
              type="button"
              onClick={() => prev && setGate(i, !checked)}
              disabled={!prev}
              className={cn(
                'flex items-start gap-3 text-left px-4 py-3 rounded-[10px] border transition-all',
                checked
                  ? 'bg-[#EAF3DE] border-[#3B6D11]/30 text-[#3B6D11]'
                  : prev
                    ? 'bg-[#FDFCFA] border-[#E8E4DC] text-[#6B6760] hover:bg-[#F0EDE5]'
                    : 'bg-[#FDFCFA] border-[#E8E4DC] text-[#A8A49C] opacity-60 cursor-not-allowed'
              )}
            >
              <span className={cn(
                'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5',
                checked ? 'bg-[#3B6D11] border-[#3B6D11]' : 'border-[#E2DED6]'
              )}>
                {checked && <span className="text-white text-[10px]">✓</span>}
                {!checked && !prev && <span className="text-[#E2DED6] text-[10px]">🔒</span>}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13px] text-[#1C1B18]">{item.titulo}</span>
                <span className="mt-1 block text-[12px] leading-snug text-[#6B6760]">{item.detalle}</span>
              </span>
              {i === 4 && <span className="text-[10px] text-[#D4881E] font-medium shrink-0 self-center">★ GATE CLAVE</span>}
            </button>
          )
        })}
      </div>

      {/* Fases institucionales */}
      <div className="mb-6">
        <p className="text-[11px] font-medium text-[#6B6760] mb-3">Fases institucionales del programa</p>
        <div className="flex flex-col gap-2">
          {FASES_INSTITUCIONALES.map(f => (
            <div key={f.fase} className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-[10px] border',
              f.bloqueante ? 'border-[#D4881E]/40 bg-[#FEF7E7]' : 'border-[#E8E4DC] bg-[#FDFCFA]'
            )}>
              <span className={cn(
                'font-mono text-[11px] px-2 py-0.5 rounded-full shrink-0',
                f.bloqueante ? 'bg-[#D4881E] text-white' : 'bg-[#E2DED6] text-[#6B6760]'
              )}>F{f.fase}</span>
              <div>
                <p className="text-[12px] font-medium text-[#1C1B18]">{f.nombre}</p>
                <p className="text-[11px] text-[#6B6760]">{f.meses} meses · {f.gate}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Vía 2: Certificación de Circularidad ─────────────────────── */}
      <div className="border-t border-[#E8E4DC] pt-6 mt-6 mb-6">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#1A5FA8] mb-3">Vía paralela — Certificación de Circularidad</p>
        <h3 className="font-serif text-[18px] text-[#1C1B18] mb-2">Cédula de Idoneidad: operar antes de que la reforma sea ley</h3>
        <p className="text-[13px] text-[#6B6760] mb-4 max-w-2xl leading-relaxed">
          No es necesario esperar la aprobación del Cabildo para iniciar. Los edificios,
          condominios y privadas pueden adoptar la separación de forma voluntaria y obtener
          la <strong className="text-[#1C1B18]">Cédula de Idoneidad ALQUIMIA</strong> —el
          certificado técnico que acredita que el inmueble cumple con infraestructura,
          capacitación y operación para separación en cinco fracciones.
          Cuando la reforma llega, la mayoría ya está operando; la curva de adopción no parte de cero.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              tipo: 'Cédula — Edificios y condominios',
              color: '#1A5FA8',
              bg: '#EBF3FB',
              items: [
                'Auditoría de contenedores, chutes y zonas de acopio',
                'Revisión del programa de separación por piso',
                'Evaluación de capacitación a residentes y conserjes',
                'Verificación de convenio activo con recicladora o CA',
              ],
            },
            {
              tipo: 'Cédula — Residencial y privadas',
              color: '#1D9E75',
              bg: '#E5F5EF',
              items: [
                'Auditoría de infraestructura en áreas comunes',
                'Revisión del programa de recolección interna',
                'Evaluación de adopción por hogar (muestra representativa)',
                'Verificación de contrato de recolección diferenciada vigente',
              ],
            },
          ].map(cert => (
            <div key={cert.tipo} className="rounded-[12px] border px-4 py-4" style={{ borderColor: cert.color + '30', background: cert.bg + '30' }}>
              <p className="text-[12px] font-medium mb-2" style={{ color: cert.color }}>{cert.tipo}</p>
              <ul className="space-y-1.5">
                {cert.items.map(it => (
                  <li key={it} className="flex items-start gap-2 text-[11px] text-[#6B6760]">
                    <span className="shrink-0 mt-0.5" style={{ color: cert.color }}>·</span>
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-[#A8A49C] mt-3 leading-relaxed">
          La Cédula es un instrumento técnico de ALQUIMIA. No es acto de autoridad hasta que
          el municipio la reconozca vía el Art. 27 Bis propuesto. En fase piloto, acredita
          cumplimiento operativo y sirve como antecedente para la reforma reglamentaria.
        </p>
      </div>

      {/* ── Motor Jurídico Municipal ─────────────────────────────────── */}
      <div className="border-t border-[#E8E4DC] pt-6 mt-6">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S4.6 — Diagnóstico jurídico del reglamento</p>
        <h3 className="font-serif text-[18px] text-[#1C1B18] mb-4">Estado normativo del municipio</h3>
        <DiagnosticoJuridico />
      </div>

      {/* Contador oportunidad perdida */}
      <ContadorOportunidad />
    </div>
  )
}
