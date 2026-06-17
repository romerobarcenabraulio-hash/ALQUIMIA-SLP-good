'use client'

/**
 * Semáforo de cobertura municipal — accesible WCAG 2.2 AA.
 * Muestra color + texto + ícono; nunca solo color.
 * Diseño Minto/McKinsey: conclusión primero, sin cajas decorativas.
 */

import type { NationalSourceStatus } from '@/types'
import { cn } from '@/lib/utils'

// ── Mapeo semántico ───────────────────────────────────────────────────────────

type SemaforoTone = 'verde' | 'amarillo' | 'rojo' | 'gris'

const STATUS_TONE: Record<NationalSourceStatus, SemaforoTone> = {
  verificado:    'verde',
  localizado:    'amarillo',
  estimado:      'amarillo',
  no_disponible: 'rojo',
  bloqueado:     'rojo',
}

const STATUS_LABEL: Record<NationalSourceStatus, string> = {
  verificado:    'Verificado',
  localizado:    'Localizado',
  estimado:      'Estimado',
  no_disponible: 'Sin datos',
  bloqueado:     'Bloqueado',
}

const TONE_DOT: Record<SemaforoTone, string> = {
  verde:    'bg-[#3B6D11]',
  amarillo: 'bg-[#D4881E]',
  rojo:     'bg-[#C0392B]',
  gris:     'bg-[#A8A49C]',
}

const TONE_TEXT: Record<SemaforoTone, string> = {
  verde:    'text-[#23470A]',
  amarillo: 'text-[#6B4800]',
  rojo:     'text-[#B91C1C]',
  gris:     'text-[#6B6760]',
}

const TONE_BG: Record<SemaforoTone, string> = {
  verde:    'bg-[#EAF3DE]',
  amarillo: 'bg-[#FEF7E7]',
  rojo:     'bg-[#FEF2F2]',
  gris:     'bg-[#F4F2ED]',
}

// ── Componente atómico: celda de dimensión ────────────────────────────────────

interface DimCellProps {
  label: string
  status: NationalSourceStatus
}

function DimCell({ label, status }: DimCellProps) {
  const tone = STATUS_TONE[status]
  const text = STATUS_LABEL[status]
  return (
    <div className={cn('rounded-[6px] px-2 py-1.5 flex flex-col gap-0.5', TONE_BG[tone])}>
      <span className="text-[10px] font-medium text-[#6B6760] leading-none">{label}</span>
      <span
        className={cn('inline-flex items-center gap-1 text-[11px] font-semibold leading-snug', TONE_TEXT[tone])}
        aria-label={`${label}: ${text}`}
      >
        <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone])} aria-hidden />
        {text}
      </span>
    </div>
  )
}

// ── Semáforo de resumen ───────────────────────────────────────────────────────

interface SemaforoResumenProps {
  verde: number
  amarillo: number
  rojo: number
  total: number
}

function SemaforoResumen({ verde, amarillo, rojo, total }: SemaforoResumenProps) {
  const pct = (n: number) => total ? Math.round((n / total) * 100) : 0
  return (
    <div className="flex items-center gap-4 flex-wrap" role="group" aria-label="Resumen semáforo de cobertura">
      <span
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#23470A]"
        title={`${verde} municipio(s) con datos verificados`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#3B6D11]" aria-hidden />
        VERDE · {verde} ({pct(verde)}%)
      </span>
      <span
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#6B4800]"
        title={`${amarillo} municipio(s) con datos estimados o localizados`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#D4881E]" aria-hidden />
        AMARILLO · {amarillo} ({pct(amarillo)}%)
      </span>
      <span
        className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#B91C1C]"
        title={`${rojo} municipio(s) sin datos o bloqueados`}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-[#C0392B]" aria-hidden />
        ROJO · {rojo} ({pct(rojo)}%)
      </span>
    </div>
  )
}

// ── Props públicas ────────────────────────────────────────────────────────────

export interface CoberturaRow {
  municipio_id: string
  nombre: string
  demografia: NationalSourceStatus
  rsu: NationalSourceStatus
  legal: NationalSourceStatus
  contrato: NationalSourceStatus
  presupuesto: NationalSourceStatus
  operacion: NationalSourceStatus
  bloqueos: string[]
  siguiente_accion: string
  agora_bloqueado: boolean
}

interface Props {
  rows: CoberturaRow[]
  onSelect?: (municipio_id: string) => void
  selectedId?: string | null
}

function municipioTone(row: CoberturaRow): SemaforoTone {
  const statuses = [row.demografia, row.rsu, row.legal, row.contrato, row.presupuesto, row.operacion]
  if (statuses.some(s => s === 'bloqueado' || s === 'no_disponible')) return 'rojo'
  if (statuses.some(s => s === 'estimado' || s === 'localizado')) return 'amarillo'
  if (statuses.every(s => s === 'verificado')) return 'verde'
  return 'gris'
}

export function SemaforoCoberturaHonesto({ rows, onSelect, selectedId }: Props) {
  const verde    = rows.filter(r => municipioTone(r) === 'verde').length
  const amarillo = rows.filter(r => municipioTone(r) === 'amarillo').length
  const rojo     = rows.filter(r => municipioTone(r) === 'rojo').length

  return (
    <section aria-labelledby="scr-semaforo-heading" className="space-y-4">
      <h2 id="scr-semaforo-heading" className="text-[13px] font-semibold text-[#1C1B18]">
        Semáforo de cobertura
      </h2>

      <SemaforoResumen verde={verde} amarillo={amarillo} rojo={rojo} total={rows.length} />

      <p className="text-[11px] text-[#6B6760] leading-snug max-w-prose">
        Verde = todos los campos verificados · Amarillo = uno o más estimados/localizados · Rojo = campo sin datos o bloqueado.
        El color siempre acompaña una etiqueta de texto para cumplir WCAG 2.2 AA.
      </p>

      {rows.length === 0 ? (
        <p className="text-[12px] text-[#8A857C]">Sin datos de cobertura cargados.</p>
      ) : (
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[11px] border-separate border-spacing-y-[3px]" role="grid">
            <thead>
              <tr className="text-[10px] font-semibold text-[#6B6760] uppercase tracking-[0.05em]">
                <th scope="col" className="text-left pl-2 pb-1">Municipio</th>
                <th scope="col" className="text-left pb-1">Estado</th>
                <th scope="col" className="text-left pb-1">Demog.</th>
                <th scope="col" className="text-left pb-1">RSU</th>
                <th scope="col" className="text-left pb-1">Legal</th>
                <th scope="col" className="text-left pb-1">Contrato</th>
                <th scope="col" className="text-left pb-1">Ppto.</th>
                <th scope="col" className="text-left pb-1">Operac.</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const tone = municipioTone(row)
                const isSelected = selectedId === row.municipio_id
                return (
                  <tr
                    key={row.municipio_id}
                    onClick={() => onSelect?.(row.municipio_id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect?.(row.municipio_id) }}
                    role={onSelect ? 'button' : 'row'}
                    tabIndex={onSelect ? 0 : undefined}
                    aria-selected={isSelected}
                    aria-label={`${row.nombre} — semáforo ${tone}`}
                    className={cn(
                      'rounded-[6px] transition-colors',
                      onSelect && 'cursor-pointer hover:bg-[#F4F2ED] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3B6D11]',
                      isSelected && 'ring-1 ring-[#3B6D11]',
                    )}
                  >
                    <td className="pl-2 pr-3 py-1.5 font-medium text-[#1C1B18] whitespace-nowrap">
                      <span className={cn('mr-1.5 inline-block h-2 w-2 rounded-full', TONE_DOT[tone])} aria-hidden />
                      {row.nombre}
                      {row.agora_bloqueado && (
                        <span className="ml-1 text-[9px] font-semibold text-[#B91C1C]" aria-label="Bloqueado">⛔</span>
                      )}
                    </td>
                    <td className="pr-3 py-1.5 text-[#6B6760]">{tone.toUpperCase()}</td>
                    <td className="pr-2 py-1.5"><DimCell label="" status={row.demografia} /></td>
                    <td className="pr-2 py-1.5"><DimCell label="" status={row.rsu} /></td>
                    <td className="pr-2 py-1.5"><DimCell label="" status={row.legal} /></td>
                    <td className="pr-2 py-1.5"><DimCell label="" status={row.contrato} /></td>
                    <td className="pr-2 py-1.5"><DimCell label="" status={row.presupuesto} /></td>
                    <td className="pr-2 py-1.5"><DimCell label="" status={row.operacion} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
