'use client'

import { ReactNode, useEffect, useRef } from 'react'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Lock,
  Share2,
  TrendingUp,
  Users,
  Wind,
  Zap,
} from 'lucide-react'
import { cn, fmt } from '@/lib/utils'
import { TRAJECTORY_HORIZON_HINTS, TRAJECTORY_UI } from '@/lib/constants'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ModuleEditorialBrief } from '@/components/simulator/ModuleEditorialBrief'
import { getChartBrief, getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
import { GlosarioTooltip } from '@/components/ui/GlosarioTooltip'
import { buscarTermino } from '@/data/glosario'
import type { ChartBrief, MetodologiaEditorial } from '@/data/moduleEditorialBriefs'
import { useChartSectionObserver } from '@/hooks/useChartSectionObserver'
import {
  getEtiquetaNarrativaCiudad,
  getMunicipioMadurezVista,
} from '@/lib/municipioMadurezContexto'
import type { DecisionModule, PortalEntry } from '@/types'

// ─── Module number mapping ────────────────────────────────────────────────────

const MODULE_NUMBERS: Record<string, string> = {
  city_baseline:            '1',
  municipal_context:        '2',
  citizen_inputs:           '2',
  impact_finance:           '3',
  future_goals:             '3',
  infrastructure_operations:'4',
  market_traceability:      '5',
  risk_trends:              '6',
  inspeccion_predios:       '7',
  scenarios_export:         '8',
  source_traceability:      '9',
  organization_profile:     '1',
  containers_provider:      '2',
  organization_report:      '3',
}

function moduleNumber(id: string): string {
  return MODULE_NUMBERS[id] ?? '·'
}

// ─── Top KPI strip ────────────────────────────────────────────────────────────

// ─── Left navigation ──────────────────────────────────────────────────────────

export function ModuleNav({
  modules,
  activeId,
  onChange,
  className,
  theme = 'light',
}: {
  modules: DecisionModule[]
  activeId: string
  onChange: (id: string) => void
  className?: string
  theme?: 'light' | 'dark'
}) {
  const isDark = theme === 'dark'
  return (
    <nav
      aria-label="Módulos de decisión"
      className={className ?? (isDark ? '' : 'bg-[#F4F2ED] border-r border-[#E8E4DC] w-[230px] shrink-0 overflow-y-auto')}
    >
      <div className={cn('px-3 py-3', isDark ? 'border-b border-[#2D4020]' : 'border-b border-[#E8E4DC]')}>
        <p className={cn('text-[9px] uppercase tracking-[0.1em] font-semibold px-1', isDark ? 'text-[#4A7A35]' : 'text-[#A8A49C]')}>
          Módulos de decisión
        </p>
      </div>
      <div className="py-1.5">
        {modules.map((m) => {
          const active  = m.module_id === activeId
          const blocked = m.status === 'blocked'
          const num     = moduleNumber(m.module_id)
          return (
            <button
              key={m.module_id}
              type="button"
              onClick={() => onChange(m.module_id)}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'w-full flex items-start gap-2.5 px-3 py-2 text-left transition-colors group',
                isDark
                  ? active
                    ? 'bg-[#2D4020] border-r-2 border-r-[#5A9438]'
                    : 'hover:bg-[#243320]'
                  : active
                    ? 'bg-[#EAF3DE] border-r-2 border-r-[#3B6D11]'
                    : 'hover:bg-[#ECEAE5]',
              )}
            >
              {/* Number badge */}
              <span
                className={cn(
                  'mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center font-mono text-[9px] font-semibold transition-colors',
                  isDark
                    ? active
                      ? 'bg-[#5A9438] text-white'
                      : blocked
                        ? 'bg-amber-700/60 text-amber-200'
                        : 'bg-[#2D4020] text-[#6A9A50] group-hover:bg-[#3A5028]'
                    : active
                      ? 'bg-[#3B6D11] text-white'
                      : blocked
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-[#D8D4CC] text-[#6B6760] group-hover:bg-[#C8C4BC]',
                )}
              >
                {blocked ? <Lock size={8} /> : num}
              </span>

              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'text-[11px] font-medium leading-snug',
                    isDark
                      ? active ? 'text-white' : 'text-[#8AAD78] group-hover:text-white'
                      : active ? 'text-[#1C1B18]' : 'text-[#4A4642]',
                  )}
                >
                  {m.label}
                </p>
                <p className={cn('text-[9px] mt-0.5 leading-tight', isDark ? 'text-[#4A7A35]' : 'text-[#A8A49C]')}>
                  {blocked ? 'Requiere acción' : m.audience_mode ?? 'Disponible'}
                </p>
              </div>

              {active && !blocked && (
                <ChevronRight size={12} className={cn('shrink-0 mt-1', isDark ? 'text-[#5A9438]' : 'text-[#3B6D11]')} />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

// ─── Mobile select ────────────────────────────────────────────────────────────

function MobileModuleSelect({
  modules,
  activeId,
  onChange,
}: {
  modules: DecisionModule[]
  activeId: string
  onChange: (id: string) => void
}) {
  return (
    <div className="xl:hidden border-b border-[#E8E4DC] bg-white px-4 py-3">
      <label htmlFor="module-select" className="block text-[10px] uppercase tracking-[0.07em] text-[#A8A49C] mb-1.5">
        Módulo activo
      </label>
      <select
        id="module-select"
        value={activeId}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] text-[#1C1B18] focus:border-[#3B6D11] focus:outline-none"
      >
        {modules.map(m => (
          <option key={m.module_id} value={m.module_id}>
            {moduleNumber(m.module_id)}. {m.label}
            {m.status === 'blocked' ? ' — requiere acción' : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Module header ────────────────────────────────────────────────────────────

// ─── Per-module lectura ejecutiva data ────────────────────────────────────────

type LecturaItem = { header: string; color: string; bullets: string[] }
type LecturaEjecutiva = { title: string; items: LecturaItem[] }

function getLecturaEjecutiva(moduleId: string): LecturaEjecutiva | null {
  if (moduleId === 'M04') {
    return {
      title: 'Infraestructura y operación',
      items: [
        {
          header: '¿Qué observamos?',
          color: '#C0392B',
          bullets: [
            'La capacidad actual cubre solo el 22% del potencial capturable de RSU.',
            'Déficit de centros de acopio para el volumen estimado en fases 3–5.',
            'La brecha de infraestructura limita captura y empleo formal.',
          ],
        },
        {
          header: '¿Qué decisión habilita?',
          color: '#3B6D11',
          bullets: [
            'Despliegue progresivo de centros de acopio y recicladoras por fase.',
            'Plan de sitios con demanda por zona y flujo para maximizar captura.',
            'Generación de empleo formal en corrientes de reciclaje.',
          ],
        },
        {
          header: '¿Qué falta verificar?',
          color: '#D4881E',
          bullets: [
            'Disponibilidad de predios, permisos y demanda por corriente.',
            'Logística municipal de recolección confirmada.',
          ],
        },
      ],
    }
  }
  return null
}

// ─── Module subtitle (catchy) ─────────────────────────────────────────────────

function ModuleContextHeader({
  module,
  moduleId,
}: {
  module: DecisionModule
  moduleId: string
}) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const municipio = municipiosActivos.length === 1 ? getMunicipioMadurezVista(municipiosActivos[0] ?? '') : null
  const scope =
    municipiosActivos.length === 0 ? ('sin_municipio' as const) : municipiosActivos.length === 1 ? ('municipio' as const) : ('zm' as const)
  const brief = getModuleEditorialBrief(moduleId, {
    territorio,
    scope,
    municipio,
    municipiosCount: municipiosActivos.length,
  })
  const num = moduleNumber(moduleId)
  const title = brief?.title ?? module.label
  const rsuEntry = buscarTermino('RSU')
  const conf = MODULE_CONFIDENCE[moduleId]
  const propuestaSlots = useSimulatorStore(s => s.propuestaSlots)
  const propuestaActivaIdx = useSimulatorStore(s => s.propuestaActivaIdx)
  const activePropuesta = propuestaActivaIdx !== null ? propuestaSlots[propuestaActivaIdx] : null

  // Dynamic subtitle data for city_baseline
  const horizonte = useSimulatorStore(s => s.horizonte)
  const presetTrayectoria = useSimulatorStore(s => s.presetTrayectoria)
  const horizonHint = TRAJECTORY_HORIZON_HINTS[horizonte] ?? TRAJECTORY_HORIZON_HINTS[10]
  const activeTrajectoryLabel = TRAJECTORY_UI.find(t => t.presetId === presetTrayectoria)?.label ?? presetTrayectoria
  const isRecommended = presetTrayectoria === horizonHint.presetId

  return (
    <header
      className="mb-5 pb-5 border-b border-[#E8E4DC]"
      data-testid="module-context-header"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[#A8A49C] font-semibold">
          Módulo {num} · {module.label}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {activePropuesta && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#D7E8C0] bg-[#F4FAEC] text-[9px] font-medium text-[#3B6D11]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />
              {activePropuesta.nombre}
            </span>
          )}
          {conf && (
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0"
              style={{ color: conf.color, background: conf.bg }}
              title={`Nivel de confianza del modelo: ${conf.label} (${conf.pct}% de inputs con fuente documentada)`}
            >
              {conf.label} · {conf.pct}%
            </span>
          )}
        </div>
      </div>
      <h2
        id="decision-shell-title"
        className="mt-2 font-serif text-[clamp(1.35rem,2.5vw,1.85rem)] font-medium text-[#1C1B18] leading-tight tracking-tight"
      >
        {title}
      </h2>

      {/* city_baseline: compact inline chip — territory is contextual metadata, not hero text */}
      {moduleId === 'city_baseline' && territorio ? (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6B6760] bg-[#F4F2ED] border border-[#E8E4DC] rounded-full px-2 py-0.5">
            {territorio}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6B6760] bg-[#F4F2ED] border border-[#E8E4DC] rounded-full px-2 py-0.5">
            {horizonte}a
          </span>
          <span className={cn(
            'inline-flex items-center gap-1 text-[10px] font-mono rounded-full px-2 py-0.5 border',
            isRecommended
              ? 'bg-[#EAF3DE] border-[#C4DFA0] text-[#23470A]'
              : 'bg-[#FEF7E7] border-[#F5D98A] text-[#6B4800]',
          )}>
            {activeTrajectoryLabel}{!isRecommended && ' ↑'}
          </span>
        </div>
      ) : (
        brief?.subtitulo_catchy && (
          <p className="mt-3 text-[15px] sm:text-[16px] font-medium text-[#2D5409] leading-snug max-w-3xl">
            {brief.subtitulo_catchy}
          </p>
        )
      )}

      {territorio && moduleId !== 'city_baseline' && (
        <p className="mt-2.5 text-[12px] text-[#6B6760]">
          Territorio de lectura:{' '}
          <span className="font-medium text-[#1C1B18]">{territorio}</span>
          {rsuEntry && (
            <span className="ml-2">
              ·{' '}
              <GlosarioTooltip termino={rsuEntry.termino} entry={rsuEntry}>
                RSU
              </GlosarioTooltip>
            </span>
          )}
        </p>
      )}
    </header>
  )
}

// ─── Metodología (módulo o gráfica en foco) ───────────────────────────────────

function MetodologiaSections({ meta }: { meta: MetodologiaEditorial }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-[9px] uppercase tracking-[0.08em] text-[#8CAA7A] font-semibold mb-1.5 flex items-center gap-1">
          <span>⟨f⟩</span> Cómo se calcula
        </p>
        <p className="text-[11px] leading-[1.65] text-[#5A6347]">{meta.como_se_calcula}</p>
      </div>
      <div className="pt-2.5 border-t border-[#EDE9E3]">
        <p className="text-[9px] uppercase tracking-[0.08em] text-[#7A9FC0] font-semibold mb-1.5 flex items-center gap-1">
          <span>◎</span> Origen de los datos
        </p>
        <p className="text-[11px] leading-[1.65] text-[#5A6060]">{meta.origen_datos}</p>
      </div>
      <div className="pt-2.5 border-t border-[#EDE9E3]">
        <p className="text-[9px] uppercase tracking-[0.08em] text-[#9A7AC0] font-semibold mb-1.5 flex items-center gap-1">
          <span>↗</span> Por qué este enfoque
        </p>
        <p className="text-[11px] leading-[1.65] text-[#5A5A70]">{meta.por_que_este_enfoque}</p>
      </div>
      <div className="pt-2.5 border-t border-[#F5DEB0]">
        <p className="text-[9px] uppercase tracking-[0.08em] text-[#C07A2A] font-semibold mb-1.5 flex items-center gap-1">
          <span>⚠</span> Supuesto crítico
        </p>
        <p className="text-[11px] leading-[1.65] text-[#6B5A2A] bg-[#FEF9EC] rounded-[6px] px-2.5 py-2">
          {meta.supuesto_critico}
        </p>
      </div>
    </div>
  )
}

function ChartReferences({ refs }: { refs: ChartBrief['referencias'] }) {
  if (!refs?.length) return null
  return (
    <div className="pt-2.5 border-t border-[#EDE9E3]">
      <p className="text-[9px] uppercase tracking-[0.08em] text-[#6B6760] font-semibold mb-1.5">Referencias</p>
      <ul className="space-y-1.5">
        {refs.map((ref) => (
          <li key={ref.clave} className="text-[10px] leading-snug text-[#6B6760]">
            <span className="font-mono text-[#3B6D11]">{ref.clave}</span>{' '}
            {ref.url ? (
              <a href={ref.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-[#3B6D11]">
                {ref.texto}
              </a>
            ) : (
              ref.texto
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ModuleMetodologiaMobile({
  moduleId,
  activeChartId,
}: {
  moduleId: string
  activeChartId: string | null
}) {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const municipio = municipiosActivos.length === 1 ? getMunicipioMadurezVista(municipiosActivos[0] ?? '') : null
  const scope = municipiosActivos.length === 0 ? 'sin_municipio' : municipiosActivos.length === 1 ? 'municipio' : 'zm'
  const brief = getModuleEditorialBrief(moduleId, {
    territorio,
    scope,
    municipio,
    municipiosCount: municipiosActivos.length,
  })
  const chartBrief = getChartBrief(brief, activeChartId)
  const metodologia = chartBrief?.metodologia ?? brief?.metodologia_editorial
  if (!metodologia) return null

  return (
    <details className="xl:hidden mb-5 rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] overflow-hidden">
      <summary className="cursor-pointer px-4 py-3 text-[12px] font-medium text-[#3B6D11] select-none list-none flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <BookOpen size={13} />
          Consideraciones y metodología
        </span>
        <span className="text-[9px] text-[#A8A49C]">▾</span>
      </summary>
      <div className="px-4 pb-4 border-t border-[#E8E4DC]">
        {chartBrief && (
          <p className="pt-3 text-[10px] text-[#3B6D11] font-medium leading-snug">
            En foco: {chartBrief.chart_label}
          </p>
        )}
        <div className="pt-3">
          <MetodologiaSections meta={metodologia} />
        </div>
        {chartBrief && <ChartReferences refs={chartBrief.referencias} />}
      </div>
    </details>
  )
}

// ─── Right guidance panel ─────────────────────────────────────────────────────

// ── Per-module confidence levels ─────────────────────────────────────────────
const MODULE_CONFIDENCE: Record<string, { label: string; pct: number; color: string; bg: string }> = {
  city_baseline:            { label: 'Medio',       pct: 55, color: '#D4881E', bg: '#FEF7E7' },
  municipal_context:        { label: 'Medio-alto',  pct: 65, color: '#D4881E', bg: '#FEF7E7' },
  future_goals:             { label: 'Medio',       pct: 50, color: '#D4881E', bg: '#FEF7E7' },
  infrastructure_operations:{ label: 'Medio',       pct: 55, color: '#D4881E', bg: '#FEF7E7' },
  market_traceability:      { label: 'Condicionado',pct: 40, color: '#A8A49C', bg: '#F4F2ED' },
  risk_trends:              { label: 'Medio-alto',  pct: 65, color: '#D4881E', bg: '#FEF7E7' },
  inspeccion_predios:       { label: 'Alto',        pct: 80, color: '#3B6D11', bg: '#EAF3DE' },
  scenarios_export:         { label: 'Medio',       pct: 55, color: '#D4881E', bg: '#FEF7E7' },
  source_traceability:      { label: 'Alto',        pct: 85, color: '#3B6D11', bg: '#EAF3DE' },
}

// Reusable <details> accordion with the standard green border style
function SidebarAccordion({ summary, children, defaultOpen = false }: { summary: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="rounded-[8px] border border-[#D7E8C0] overflow-hidden" open={defaultOpen || undefined}>
      <summary className="cursor-pointer bg-[#F6FAEF] px-3 py-2 text-[10px] font-medium text-[#3B6D11] select-none list-none flex items-center justify-between">
        <span>{summary}</span>
        <span className="text-[9px] text-[#8CAA7A]">▾</span>
      </summary>
      <div className="px-3 py-3 border-t border-[#D7E8C0] bg-white text-[10px]">
        {children}
      </div>
    </details>
  )
}

function GuidancePanel({
  module,
  moduleId,
  activeChartId,
}: {
  module: DecisionModule
  moduleId: string
  activeChartId: string | null
}) {
  const lectura = getLecturaEjecutiva(moduleId)

  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const propuestaSlots = useSimulatorStore(s => s.propuestaSlots)
  const propuestaActivaIdx = useSimulatorStore(s => s.propuestaActivaIdx)
  const territorio = getEtiquetaNarrativaCiudad(municipiosActivos, zmActiva)
  const municipio = municipiosActivos.length === 1 ? getMunicipioMadurezVista(municipiosActivos[0] ?? '') : null
  const scope = municipiosActivos.length === 0 ? 'sin_municipio' : municipiosActivos.length === 1 ? 'municipio' : 'zm'
  const brief = getModuleEditorialBrief(moduleId, {
    territorio,
    scope,
    municipio,
    municipiosCount: municipiosActivos.length,
  })
  const chartBrief = getChartBrief(brief, activeChartId)
  const metodologia = chartBrief?.metodologia ?? brief?.metodologia_editorial
  const conf = MODULE_CONFIDENCE[moduleId]

  const activePropuesta = propuestaActivaIdx !== null ? propuestaSlots[propuestaActivaIdx] : null

  return (
    <aside className="hidden xl:block w-[280px] shrink-0 border-l border-[#E8E4DC] bg-white overflow-y-auto">
      {/* ── Header — always visible ───────────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-[#E8E4DC]">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.1em] text-[#A8A49C] font-semibold flex items-center gap-1.5">
            <BookOpen size={11} />
            Consideraciones
          </p>
          {conf && (
            <span
              className="text-[8px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color: conf.color, background: conf.bg }}
            >
              {conf.pct}% confianza
            </span>
          )}
        </div>

        {/* Module summary — the only always-visible content */}
        {brief?.subtitulo_catchy && (
          <p className="mt-2 text-[11px] text-[#4A4642] leading-snug">{brief.subtitulo_catchy}</p>
        )}
        {!brief?.subtitulo_catchy && (
          <p className="mt-2 text-[11px] text-[#6B6760] leading-snug">{module.label}</p>
        )}

        {/* Active scenario badge */}
        {activePropuesta && (
          <div className="mt-2 flex items-center gap-1 text-[9px] text-[#3B6D11] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11] shrink-0" />
            Escenario activo: {activePropuesta.nombre}
          </div>
        )}

        {/* Chart in focus */}
        {chartBrief && (
          <p className="mt-1.5 text-[9px] text-[#3B6D11] font-medium leading-snug">
            En foco: {chartBrief.chart_label}
          </p>
        )}
      </div>

      {/* ── On-demand depth — all collapsed by default ───────────────────── */}
      <div className="p-3 space-y-2 text-[11px]">

        {/* M01 — Cadena del modelo */}
        {moduleId === 'city_baseline' && (
          <SidebarAccordion summary="Cadena del modelo">
            <p className="text-[9px] text-[#A8A49C] mb-2 leading-snug">Cómo cada supuesto fluye hacia los resultados finales</p>
            <div className="flex flex-wrap items-center gap-1">
              {([
                { label: 'Supuestos', desc: 'P1–P4', active: true },
                { label: 'Trayectoria', desc: 'M01', active: true },
                { label: 'Toneladas', desc: 'capturadas', active: false },
                { label: 'Impactos', desc: 'M01–M02', active: false },
                { label: 'Infraestr.', desc: 'M04', active: false },
                { label: 'Resultados', desc: 'M06', active: false },
              ]).map((step, i, arr) => (
                <span key={step.label} className="flex items-center gap-1">
                  <span className={cn(
                    'inline-flex flex-col items-center px-1.5 py-1 rounded-[5px] text-[8px] leading-tight',
                    step.active ? 'bg-[#EAF3DE] text-[#23470A]' : 'bg-[#F4F2ED] text-[#A8A49C]',
                  )}>
                    <span className="font-semibold">{step.label}</span>
                    <span className="opacity-70">{step.desc}</span>
                  </span>
                  {i < arr.length - 1 && <span className="text-[9px] text-[#C8C4BC]">→</span>}
                </span>
              ))}
            </div>
          </SidebarAccordion>
        )}

        {/* M01 — Qué sí / no se ajusta */}
        {moduleId === 'city_baseline' && (
          <SidebarAccordion summary="Qué sí / no se ajusta aquí">
            <div className="space-y-3">
              <div>
                <p className="text-[9px] font-semibold text-[#3B6D11] uppercase tracking-[0.06em] mb-1.5">Sí se ajusta</p>
                <ul className="space-y-1">
                  {['Municipio / zona metropolitana', 'Horizonte (3–15 años)', 'Generación per cápita (kg/hab·día)', 'Trayectoria de adopción (4 perfiles)', 'Vivienda, RSU, merma y precios por material'].map(item => (
                    <li key={item} className="flex items-start gap-1.5 text-[#3B5F23]">
                      <CheckCircle2 size={9} className="shrink-0 mt-0.5 text-[#5A9438]" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[9px] font-semibold text-[#A8A49C] uppercase tracking-[0.06em] mb-1.5">No se ajusta aquí</p>
                <ul className="space-y-1">
                  {['Composición base RSU (SEMARNAT · fija)', 'Factores de emisión CO₂e (IPCC AR6)', 'Supuestos macro (inflación, población)', 'Estructura de centros de acopio (M04)'].map(item => (
                    <li key={item} className="flex items-start gap-1.5 text-[#A8A49C]">
                      <Lock size={9} className="shrink-0 mt-0.5" />
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SidebarAccordion>
        )}

        {/* Metodología */}
        {metodologia && (
          <SidebarAccordion summary="Cómo se calcula">
            <MetodologiaSections meta={metodologia} />
          </SidebarAccordion>
        )}

        {/* Chart references */}
        {chartBrief?.referencias && chartBrief.referencias.length > 0 && (
          <SidebarAccordion summary={`Referencias · ${chartBrief.chart_label}`}>
            <ChartReferences refs={chartBrief.referencias} />
          </SidebarAccordion>
        )}

        {/* Lectura ejecutiva */}
        {lectura && (
          <SidebarAccordion summary={`Lectura ejecutiva · ${lectura.title}`}>
            <div className="space-y-3">
              {lectura.items.map(item => (
                <div key={item.header}>
                  <p className="text-[9px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: item.color }}>
                    {item.header}
                  </p>
                  <ul className="space-y-1">
                    {item.bullets.map(b => (
                      <li key={b} className="flex items-start gap-1.5">
                        <span className="shrink-0 mt-0.5" style={{ color: item.color }}>›</span>
                        <span className="leading-snug text-[#6B6760]">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </SidebarAccordion>
        )}

        {/* Contexto editorial — siempre abierto */}
        <SidebarAccordion summary="Consideraciones" defaultOpen={true}>
          <ModuleEditorialBrief moduleId={moduleId} suppressTitle />
        </SidebarAccordion>

        {/* Condiciones de lectura */}
        <SidebarAccordion summary="Condiciones de lectura">
          <ul className="space-y-1.5 text-[#6B6760]">
            {[
              'Proyecciones en precios corrientes (MXN)',
              'Los supuestos de M01 determinan todas las trayectorias',
              'No constituye dictamen oficial ni garantía de resultado',
            ].map(item => (
              <li key={item} className="flex items-start gap-1.5">
                <span className="mt-1 w-1 h-1 rounded-full bg-[#A8A49C] shrink-0" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </SidebarAccordion>

        {/* Nivel de confianza */}
        {conf && (
          <SidebarAccordion summary={`Nivel de confianza · ${conf.label}`}>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-[#E8E4DC] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${conf.pct}%`, background: conf.color }} />
                </div>
                <span className="font-mono text-[10px] font-semibold shrink-0" style={{ color: conf.color }}>{conf.pct}%</span>
              </div>
              <p className="text-[#6B6760] leading-snug">
                {conf.pct >= 70
                  ? 'Mayoría de inputs provienen de datos medidos (INEGI/SEMARNAT). Requiere validación con autoridad competente antes de Cabildo.'
                  : conf.pct >= 50
                  ? 'Mix de datos medidos y supuestos editoriales. Revisar fuentes antes de usar cifras en presentación pública.'
                  : 'Mayoría de inputs son supuestos editoriales. Contrastar con datos locales antes de tomar decisiones.'}
              </p>
            </div>
          </SidebarAccordion>
        )}
      </div>
    </aside>
  )
}

// ─── Bottom action bar ────────────────────────────────────────────────────────

function BottomBar({
  modules,
  activeId,
  onChange,
}: {
  modules: DecisionModule[]
  activeId: string
  onChange: (id: string) => void
}) {
  const idx  = modules.findIndex(m => m.module_id === activeId)
  const prev = modules[idx - 1] ?? null
  const next = modules[idx + 1] ?? null

  return (
    <div className="border-t border-[#E8E4DC] bg-white px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        {prev && (
          <button
            type="button"
            onClick={() => onChange(prev.module_id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#E8E4DC] bg-white text-[12px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
          >
            ← {prev.label}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] border border-[#E8E4DC] bg-white text-[12px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
        >
          <Download size={13} />
          Exportar borrador PDF
        </button>
        {next && (
          <button
            type="button"
            onClick={() => onChange(next.module_id)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#3B6D11] text-white text-[12px] font-medium hover:bg-[#2D5409] transition-colors"
          >
            {next.label} →
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Main shell ───────────────────────────────────────────────────────────────

interface DecisionModuleShellProps {
  /** Already-filtered modules for the current audience */
  modules: DecisionModule[]
  activeModule: DecisionModule | null
  onModuleChange: (id: string) => void
  loading: boolean
  error: string | null
  audience: PortalEntry | null
  renderModule: (module: DecisionModule) => ReactNode
}

export function DecisionModuleShell({
  modules,
  activeModule,
  onModuleChange,
  loading,
  error,
  renderModule,
}: DecisionModuleShellProps) {
  const audienceSelected = useSimulatorStore(s => s.audience)
  const setActiveDecisionModuleId = useSimulatorStore(s => s.setActiveDecisionModuleId)
  const contentRef = useRef<HTMLDivElement>(null)
  const activeChartId = useChartSectionObserver(contentRef, activeModule?.module_id ?? null)

  useEffect(() => {
    setActiveDecisionModuleId(activeModule?.module_id ?? null)
    return () => { setActiveDecisionModuleId(null) }
  }, [activeModule?.module_id, setActiveDecisionModuleId])

  // ── Loading / error / empty states ─────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-[#A8A49C]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#3B6D11] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-[13px]">Cargando módulos del journey…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-4 mt-6 rounded-[10px] border border-red-200 bg-red-50 px-5 py-4">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-red-800">
          <AlertTriangle size={15} />No se pudo cargar la navegación modular
        </p>
        <p className="mt-1 text-[12px] text-red-700">{error}</p>
      </div>
    )
  }

  if (!activeModule) {
    return (
      <div className="mx-4 mt-6 rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-5 py-4 text-[#6B6760] text-[13px]">
        Sin módulos disponibles para esta audiencia.
      </div>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col" aria-labelledby="decision-shell-title">
      {/* Mobile module selector */}
      {activeModule && (
        <MobileModuleSelect
          modules={modules}
          activeId={activeModule.module_id}
          onChange={onModuleChange}
        />
      )}

      {/* Two-column body: content | guidance */}
      <div className="flex">
        {/* Center content */}
        <div className="flex-1 flex flex-col min-w-0 bg-white border-l border-[#E8E4DC]">
          {/* Content area — flows naturally, page scrolls */}
          <div ref={contentRef} className="px-6 py-6">
            <ModuleContextHeader module={activeModule} moduleId={activeModule.module_id} />
            {activeModule.status === 'blocked' ? (
              <div className="rounded-[10px] border border-amber-300 bg-amber-50 p-5">
                <p className="flex items-center gap-2 text-[13px] font-semibold text-amber-900">
                  <AlertTriangle size={15} />
                  Módulo bloqueado
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-amber-800">
                  {activeModule.blocker ?? 'Este módulo requiere una condición previa.'}
                </p>
                <div className="mt-4 pt-3 border-t border-amber-200">
                  <p className="text-[11px] font-semibold text-amber-900">Siguiente acción</p>
                  <p className="mt-1 text-[11px] text-amber-800">{activeModule.next_action}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <ModuleMetodologiaMobile
                  moduleId={activeModule.module_id}
                  activeChartId={activeChartId}
                />
                {renderModule(activeModule)}
              </div>
            )}
          </div>

          {/* Bottom bar */}
          <BottomBar
            modules={modules}
            activeId={activeModule.module_id}
            onChange={onModuleChange}
          />
        </div>

        {/* Right guidance panel */}
        <GuidancePanel
          module={activeModule}
          moduleId={activeModule.module_id}
          activeChartId={activeChartId}
        />
      </div>
    </div>
  )
}
