'use client'

import { ReactNode, useEffect } from 'react'
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
import { useSimulatorStore } from '@/store/simulatorStore'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
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
  inspeccion_predios:       '5',
  market_traceability:      '5',
  scenarios_export:         '6',
  source_traceability:      '7',
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

function ModuleHeader({ module }: { module: DecisionModule }) {
  const blocked      = module.status === 'blocked'
  const num          = moduleNumber(module.module_id)
  const audienceSel  = useSimulatorStore(s => s.audience)

  return (
    <div className="border-b border-[#E8E4DC] bg-white px-6 py-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-[11px] text-[#A8A49C]">Módulo {num}</span>
        <ChevronRight size={11} className="text-[#C8C4BC]" />
        <span className="text-[11px] text-[#3B6D11] font-medium">{module.label}</span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-[26px] text-[#1C1B18] leading-tight">{module.label}</h2>
          {module.decision && (
            <p className="text-[13px] text-[#6B6760] mt-1 leading-relaxed max-w-2xl">{module.decision}</p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[10px] font-medium uppercase tracking-[0.06em]',
              blocked
                ? 'bg-amber-100 text-amber-900'
                : audienceSel === 'functionary'
                  ? 'bg-[#1A5FA8]/10 text-[#1A5FA8]'
                  : 'bg-[#EAF3DE] text-[#3B6D11]',
            )}
          >
            {blocked ? (
              <><Lock size={10} />Bloqueado</>
            ) : (
              <><CheckCircle2 size={10} />Disponible</>
            )}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E8E4DC] bg-white text-[11px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
          >
            <Share2 size={11} />
            Compartir
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] border border-[#E8E4DC] bg-white text-[11px] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
          >
            <Download size={11} />
            Exportar
          </button>
        </div>
      </div>
    </div>
  )
}

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

// ─── Right guidance panel ─────────────────────────────────────────────────────

function GuidancePanel({ module, moduleId }: { module: DecisionModule; moduleId: string }) {
  const lectura = getLecturaEjecutiva(moduleId)

  // Leer el brief editorial para obtener la narrativa metodológica del módulo activo
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

  return (
    <aside className="hidden xl:block w-[280px] shrink-0 border-l border-[#E8E4DC] bg-[#FDFCFA] overflow-y-auto">
      <div className="px-4 py-4 border-b border-[#E8E4DC]">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[#A8A49C] font-semibold flex items-center gap-1.5">
          <BookOpen size={11} />
          Consideraciones
        </p>
      </div>

      <div className="p-4 space-y-4 text-[11px]">
        {/* Prosa metodológica — explica qué muestran las gráficas y cómo se calculan */}
        {brief?.metodologia_editorial && (
          <div>
            <p className="text-[9px] uppercase tracking-[0.08em] text-[#8CAA7A] font-semibold mb-2">
              Cómo se calcula
            </p>
            <p className="text-[11px] leading-[1.6] text-[#5A6347]">
              {brief.metodologia_editorial}
            </p>
          </div>
        )}

        {/* Lectura ejecutiva — colapsada por default, solo para módulos con data */}
        {lectura && (
          <details className="rounded-[8px] border border-[#D7E8C0] overflow-hidden">
            <summary className="cursor-pointer bg-[#F6FAEF] px-3 py-2 text-[11px] font-medium text-[#3B6D11] select-none list-none flex items-center justify-between">
              <span>Lectura ejecutiva · {lectura.title}</span>
              <span className="text-[9px] text-[#8CAA7A]">▾</span>
            </summary>
            <div className="px-3 py-3 space-y-3 border-t border-[#D7E8C0] bg-white">
              {lectura.items.map(item => (
                <div key={item.header}>
                  <p className="text-[9px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: item.color }}>
                    {item.header}
                  </p>
                  <ul className="space-y-1">
                    {item.bullets.map(b => (
                      <li key={b} className="flex items-start gap-1.5 text-[10px] text-[#6B6760]">
                        <span className="shrink-0 mt-0.5" style={{ color: item.color }}>›</span>
                        <span className="leading-snug">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        )}

        {module.evidence && (
          <div className={brief?.metodologia_editorial ? 'pt-3 border-t border-[#E8E4DC]' : ''}>
            <p className="font-semibold text-[#1C1B18] mb-1.5">Qué sostiene el análisis</p>
            <p className="text-[#6B6760] leading-relaxed">{module.evidence}</p>
          </div>
        )}
        {module.next_action && (
          <div className="pt-3 border-t border-[#E8E4DC]">
            <p className="font-semibold text-[#1C1B18] mb-1.5">Siguiente paso</p>
            <p className="text-[#6B6760] leading-relaxed">{module.next_action}</p>
          </div>
        )}

        <div className="pt-3 border-t border-[#E8E4DC]">
          <p className="font-semibold text-[#1C1B18] mb-2">Condiciones de lectura</p>
          <ul className="space-y-1.5">
            {[
              'Proyecciones en precios corrientes (MXN)',
              'Los supuestos editables en Módulo 1 determinan estas trayectorias',
              'No constituye dictamen oficial ni garantía de resultado',
            ].map(item => (
              <li key={item} className="flex items-start gap-1.5 text-[#6B6760]">
                <span className="mt-1 w-1 h-1 rounded-full bg-[#A8A49C] shrink-0" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-3 border-t border-[#E8E4DC]">
          <p className="font-semibold text-[#1C1B18] mb-2 flex items-center gap-1.5">
            Nivel de confianza
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EAF3DE] text-[#3B6D11] font-mono text-[9px]">
              Alto
            </span>
          </p>
          <div className="bg-[#F4F2ED] rounded-[6px] px-3 py-2 text-[10px] text-[#6B6760] leading-snug">
            Basado en datos medidos y supuestos técnicos validados. Requiere revisión con autoridad competente antes de presentar en Cabildo.
          </div>
        </div>
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
          {/* Module header */}
          <ModuleHeader module={activeModule} />


          {/* Content area — flows naturally, page scrolls */}
          <div className="px-6 py-6" id="decision-shell-title">
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
        <GuidancePanel module={activeModule} moduleId={activeModule.module_id} />
      </div>
    </div>
  )
}
