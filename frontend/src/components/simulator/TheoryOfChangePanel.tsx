'use client'

import { useSimulatorStore } from '@/store/simulatorStore'
import { ZMS } from '@/lib/constants'
import { cn, fmt } from '@/lib/utils'

const COL_BG = {
  inputs:      '#F4F2ED',
  actividades: '#FDFCFA',
  outputs:     '#EAF3DE',
  outcomes:    '#FDFCFA',
  impacto:     '#EAF3DE',
} as const

interface ToCColumn {
  id:    string
  label: string
  bg:    string
  accent?: boolean
  items: string[]
}

function Arrow() {
  return (
    <div className="hidden lg:flex items-center justify-center flex-shrink-0 text-[#C9DDB1]">
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
        <path d="M6 14h16M16 8l6 6-6 6" stroke="#3B6D11" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function ToCCard({ col }: { col: ToCColumn }) {
  return (
    <div
      className={cn(
        'flex-1 min-w-[180px] rounded-[10px] border p-4 flex flex-col gap-2',
        col.accent
          ? 'border-[#3B6D11]/40 shadow-[0_2px_12px_rgba(59,109,17,0.10)]'
          : 'border-[#C9DDB1]',
      )}
      style={{ background: col.bg }}
    >
      <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#6B6760]">
        {col.id === 'inputs'      && '01 · Inputs'}
        {col.id === 'actividades' && '02 · Actividades'}
        {col.id === 'outputs'     && '03 · Outputs'}
        {col.id === 'outcomes'    && '04 · Outcomes'}
        {col.id === 'impacto'     && '05 · Impacto'}
      </p>
      <h3
        className={cn(
          'font-serif text-[15px] leading-tight',
          col.accent ? 'text-[#3B6D11]' : 'text-[#1C1B18]',
        )}
      >
        {col.label}
      </h3>
      <ul className="mt-1 flex flex-col gap-1.5">
        {col.items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-[3px] flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[#3B6D11]/40" />
            <span className="text-[12px] text-[#1C1B18] leading-snug">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function TheoryOfChangePanel() {
  const resultados        = useSimulatorStore(s => s.resultados)
  const zmActiva          = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const horizonte         = useSimulatorStore(s => s.horizonte)
  const pctCapturaPorAño  = useSimulatorStore(s => s.pctCapturaPorAño)

  const zm = ZMS.find(z => z.id === zmActiva)

  // Derived values — fall back to dashes when resultados is not yet computed
  const r = resultados

  const rsuTotalTonDia  = r ? fmt.num(r.rsuTotalTonDia) : '—'
  const nCAs            = r ? `${(r.empleosDirectosCAs / 5).toFixed(0)}` : '—'   // rough proxy: 5 emp/CA-P
  const ipc             = zm ? '70' : '—'   // benchmark SEMARNAT 2022 unless field survey

  // Number of adendos: proxy from store — no direct field, use municipality count as heuristic
  const nAdendos        = municipiosActivos.length * 3

  // Outputs
  const volValorizable  = r ? fmt.num(r.rsuTotalTonDia * (pctCapturaPorAño[0] ?? 20) / 100) : '—'
  const empDir          = r ? fmt.num0(r.empleosTotalesDirectos) : '—'
  const volOrg          = r ? fmt.num(r.rsuTotalTonDia * 0.52 * (pctCapturaPorAño[0] ?? 20) / 100 * 0.35) : '—'
  const pctCapturaAño1  = pctCapturaPorAño[0] ?? 20
  const pctCapturaFinal = pctCapturaPorAño[Math.min(horizonte - 1, pctCapturaPorAño.length - 1)] ?? 70

  // Outcomes
  const ingresosMun    = r ? fmt.mxn(r.ingresosMunicipioTotal) : '—'
  const ebitda         = r ? fmt.mxn(r.ebitda) : '—'
  const ahorroDisp     = r ? fmt.mxn(r.ahorroDisposicion) : '—'
  const kwhBiogas      = r ? fmt.kwh(r.kwhBiogas) : '—'

  // Impacto
  const co2e           = r ? fmt.co2(r.co2eEvitadasTon) : '—'
  const avad           = r ? fmt.num0(r.avadEvitados) : '—'
  const empleosTotales = r ? fmt.num0(r.empleosTotalesDirectos + r.empleosIndirectos) : '—'
  const extRelleno     = r ? fmt.num(Math.min(r.extensionRelleno, 15)) : '—'

  // Routes heuristic: 1 route per municipio
  const nRutas = municipiosActivos.length

  // Mix CAs label
  const mixLabel = r
    ? (() => {
        const e = r.empleosTotalesDirectos
        const nEstimado = Math.max(1, Math.round(e / 5))
        return `~${nEstimado} CAs`
      })()
    : '—'

  const columns: ToCColumn[] = [
    {
      id: 'inputs', label: 'Inputs', bg: COL_BG.inputs,
      items: [
        `RSU generado: ${rsuTotalTonDia} t/día`,
        `Capital institucional: ${nCAs} CA(s) configurado(s)`,
        `Marco jurídico: ${nAdendos} adendos necesarios`,
        `Compromiso ciudadano: IPC ${ipc}% — benchmark SEMARNAT 2022`,
      ],
    },
    {
      id: 'actividades', label: 'Actividades', bg: COL_BG.actividades,
      items: [
        'Separación en origen por ciudadanos',
        `Recolección diferenciada ${nRutas} rutas`,
        `Operación del CA (${mixLabel})`,
        'Gestión de mercado (recicladoras, composta)',
      ],
    },
    {
      id: 'outputs', label: 'Outputs', bg: COL_BG.outputs,
      items: [
        `${volValorizable} t/día valorizadas`,
        `${empDir} empleos directos`,
        `Compost: ${volOrg} t/día`,
        `Tasa de captura: ${pctCapturaAño1}% → ${pctCapturaFinal}%`,
      ],
    },
    {
      id: 'outcomes', label: 'Outcomes', bg: COL_BG.outcomes,
      items: [
        `Ingresos municipio: MXN ${ingresosMun}/año`,
        `EBITDA programa: MXN ${ebitda}/año`,
        `Ahorro en disposición: MXN ${ahorroDisp}/año`,
        `Reducción CH₄: ${kwhBiogas} equiv.`,
      ],
    },
    {
      id: 'impacto', label: 'Impacto', bg: COL_BG.impacto, accent: true,
      items: [
        `${co2e} CO₂e evitadas`,
        `${avad} AVAD evitados (salud)`,
        `${empleosTotales} empleos totales`,
        `Extensión relleno: ${extRelleno} años`,
      ],
    },
  ]

  function handleExportClick() {
    alert(
      'Usa la función de captura de pantalla de tu sistema (⌘+Shift+4 en Mac / Win+Shift+S en Windows). El panel está optimizado para captura.',
    )
  }

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] shadow-[0_2px_12px_rgba(28,27,24,0.06)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-4 border-b border-[#E8E4DC]">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.12em] text-[#A8A49C] mb-0.5">
            Teoría del Cambio
          </p>
          <h2 className="font-serif text-[20px] text-[#1C1B18] leading-tight">
            Cadena de Resultados del Programa
          </h2>
        </div>
        <button
          onClick={handleExportClick}
          className={cn(
            'flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-[8px]',
            'text-[12px] font-medium text-[#3B6D11]',
            'border border-[#C9DDB1] bg-[#EAF3DE]',
            'hover:bg-[#d8edc8] transition-colors',
          )}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 1v8M3.5 5.5 7 9l3.5-3.5M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exportar como imagen
        </button>
      </div>

      {/* ToC flow */}
      <div className="p-5">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-2 items-stretch">
          {columns.map((col, idx) => (
            <div key={col.id} className="contents lg:flex lg:flex-row lg:items-stretch lg:gap-2">
              {idx > 0 && <Arrow />}
              <ToCCard col={col} />
            </div>
          ))}
        </div>
      </div>

      {/* Source note */}
      <div className="px-5 pb-4">
        <p className="text-[10px] text-[#A8A49C] leading-relaxed border-t border-[#E8E4DC] pt-3">
          Metodología: BID Marco Lógico de Proyectos 2019 · SEMARNAT Guía Técnica para Centros de Acopio 2022 · Teoría del Cambio — Centro de Aprendizaje GIZ 2020
        </p>
      </div>
    </div>
  )
}
