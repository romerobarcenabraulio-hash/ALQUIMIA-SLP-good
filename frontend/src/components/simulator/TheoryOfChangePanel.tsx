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

const STEP_TITLES: Record<string, string> = {
  inputs:      '01 · Entradas',
  actividades: '02 · Actividades',
  outputs:     '03 · Productos',
  outcomes:    '04 · Resultados',
  impacto:     '05 · Impacto',
}

interface ToCColumn {
  id: string
  bg: string
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
        'flex-1 min-w-[180px] rounded-[10px] border p-4 flex flex-col gap-2.5',
        col.accent
          ? 'border-[#3B6D11]/40 shadow-[0_2px_12px_rgba(59,109,17,0.10)]'
          : 'border-[#C9DDB1]',
      )}
      style={{ background: col.bg }}
    >
      <p
        className={cn(
          'text-[12px] font-semibold leading-tight',
          col.accent ? 'text-[#3B6D11]' : 'text-[#1C1B18]',
        )}
      >
        {STEP_TITLES[col.id]}
      </p>
      <ul className="flex flex-col gap-1.5">
        {col.items.map((item, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <span className="mt-[5px] flex-shrink-0 w-1 h-1 rounded-full bg-[#3B6D11]/50" />
            <span className="text-[12px] text-[#4A4740] leading-snug">{item}</span>
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
  const r = resultados

  const rsuTotalTonDia  = r ? fmt.num(r.rsuTotalTonDia) : '—'
  const nCAs            = r ? `${(r.empleosDirectosCAs / 5).toFixed(0)}` : '—'
  const ipc             = zm ? '70' : '—'
  const nAdendos        = municipiosActivos.length * 3

  const volValorizable  = r ? fmt.num(r.rsuTotalTonDia * (pctCapturaPorAño[0] ?? 20) / 100) : '—'
  const empDir          = r ? fmt.num0(r.empleosTotalesDirectos) : '—'
  const volOrg          = r ? fmt.num(r.rsuTotalTonDia * 0.52 * (pctCapturaPorAño[0] ?? 20) / 100 * 0.35) : '—'
  const pctCapturaAño1  = pctCapturaPorAño[0] ?? 20
  const pctCapturaFinal = pctCapturaPorAño[Math.min(horizonte - 1, pctCapturaPorAño.length - 1)] ?? 70

  const ingresosMun    = r ? fmt.mxn(r.ingresosMunicipioTotal) : '—'
  const ebitda         = r ? fmt.mxn(r.ebitda) : '—'
  const ahorroDisp     = r ? fmt.mxn(r.ahorroDisposicion) : '—'
  const kwhBiogas      = r ? fmt.kwh(r.kwhBiogas) : '—'

  const co2e           = r ? fmt.co2(r.co2eEvitadasTon) : '—'
  const avad           = r ? fmt.num0(r.avadEvitados) : '—'
  const empleosTotales = r ? fmt.num0(r.empleosTotalesDirectos + r.empleosIndirectos) : '—'
  const extRelleno     = r ? fmt.num(Math.min(r.extensionRelleno, 15)) : '—'
  const nRutas = municipiosActivos.length

  const mixLabel = r
    ? (() => {
        const e = r.empleosTotalesDirectos
        const nEstimado = Math.max(1, Math.round(e / 5))
        return `~${nEstimado} CAs`
      })()
    : '—'

  const columns: ToCColumn[] = [
    {
      id: 'inputs', bg: COL_BG.inputs,
      items: [
        `RSU generado: ${rsuTotalTonDia} t/día`,
        `Capital institucional: ${nCAs} CA(s)`,
        `Marco jurídico: ${nAdendos} adendos`,
        `IPC ${ipc}% — benchmark SEMARNAT 2022`,
      ],
    },
    {
      id: 'actividades', bg: COL_BG.actividades,
      items: [
        'Separación en origen',
        `Recolección diferenciada · ${nRutas} rutas`,
        `Operación CA (${mixLabel})`,
        'Mercado: recicladoras y composta',
      ],
    },
    {
      id: 'outputs', bg: COL_BG.outputs,
      items: [
        `${volValorizable} t/día valorizadas`,
        `${empDir} empleos directos`,
        `Compost: ${volOrg} t/día`,
        `Captura ${pctCapturaAño1}% → ${pctCapturaFinal}%`,
      ],
    },
    {
      id: 'outcomes', bg: COL_BG.outcomes,
      items: [
        `Ingresos municipio: ${ingresosMun}/año`,
        `EBITDA: ${ebitda}/año`,
        `Ahorro disposición: ${ahorroDisp}/año`,
        `Biogás: ${kwhBiogas} equiv.`,
      ],
    },
    {
      id: 'impacto', bg: COL_BG.impacto, accent: true,
      items: [
        `${co2e} evitadas`,
        `${avad} AVAD evitados`,
        `${empleosTotales} empleos totales`,
        `Relleno +${extRelleno} años`,
      ],
    },
  ]

  function handleExportClick() {
    alert(
      'Captura de pantalla del sistema (⌘+Shift+4 en Mac · Win+Shift+S en Windows).',
    )
  }

  return (
    <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] shadow-[0_2px_12px_rgba(28,27,24,0.06)] overflow-hidden">
      <div className="flex justify-end px-4 pt-3">
        <button
          type="button"
          onClick={handleExportClick}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-[7px]',
            'text-[11px] font-medium text-[#3B6D11]',
            'border border-[#C9DDB1] bg-[#EAF3DE]',
            'hover:bg-[#d8edc8] transition-colors',
          )}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M7 1v8M3.5 5.5 7 9l3.5-3.5M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exportar imagen
        </button>
      </div>

      <div className="px-4 pb-4 pt-1">
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-2 items-stretch">
          {columns.map((col, idx) => (
            <div key={col.id} className="contents lg:flex lg:flex-row lg:items-stretch lg:gap-2">
              {idx > 0 && <Arrow />}
              <ToCCard col={col} />
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#B8B4AC] mt-3 text-right">
          Marco lógico BID · GIZ ToC
        </p>
      </div>
    </div>
  )
}
