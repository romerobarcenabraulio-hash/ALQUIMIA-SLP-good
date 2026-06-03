'use client'

/**
 * ProyectoVivoPortal — Vista del proyecto para el campeón interno municipal.
 *
 * Diseño: clean, ejecutivo, orientado a acción.
 * Secciones:
 *   1. Semáforo + progreso global
 *   2. North Star metrics (toneladas, CO₂, valor)
 *   3. Alertas proactivas del consultor vivo
 *   4. Próximas acciones (municipio vs ALQUIMIA)
 *   5. Riesgo político (MapaActores)
 *   6. Standards Readiness radar
 *   7. Ficha de impacto para cabildo
 */

import React, { useEffect, useState, useCallback } from 'react'
import {
  getProyectoEstado,
  getFichaImpacto,
  getReadiness,
  type ProyectoEstado,
  type FichaImpacto,
  type ReadinessReport,
} from '@/lib/api'

// ── Color helpers ─────────────────────────────────────────────────────────────

const SEMAFORO_COLOR = {
  verde:    'bg-emerald-500',
  amarillo: 'bg-amber-400',
  rojo:     'bg-red-500',
}

const SEMAFORO_LABEL = {
  verde:    'En tiempo',
  amarillo: 'Atención requerida',
  rojo:     'Acción urgente',
}

const SEVERIDAD_BADGE = {
  info:         'bg-blue-50 text-blue-700 border-blue-200',
  advertencia:  'bg-amber-50 text-amber-700 border-amber-200',
  critico:      'bg-red-50 text-red-700 border-red-200',
}

const NIVEL_COLOR: Record<string, string> = {
  incipiente:    'text-red-600',
  en_desarrollo: 'text-amber-600',
  avanzado:      'text-emerald-600',
  listo:         'text-emerald-700 font-bold',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressRing({ pct }: { pct: number }) {
  const r = 54
  const circ = 2 * Math.PI * r
  const stroke = circ - (pct / 100) * circ
  return (
    <div className="relative inline-flex items-center justify-center w-32 h-32">
      <svg className="rotate-[-90deg]" width={128} height={128}>
        <circle cx={64} cy={64} r={r} stroke="#e5e7eb" strokeWidth={10} fill="none" />
        <circle
          cx={64} cy={64} r={r}
          stroke="#10b981" strokeWidth={10} fill="none"
          strokeDasharray={circ}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-2xl font-bold text-gray-800">{pct.toFixed(0)}%</span>
    </div>
  )
}

function StatCard({ label, value, sub, color = 'text-gray-800' }: {
  label: string; value: string | null; sub?: string; color?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  )
}

function AlertaBadge({ alerta }: { alerta: ProyectoEstado['alertas'][0] }) {
  const cls = SEVERIDAD_BADGE[alerta.severidad] || SEVERIDAD_BADGE.info
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-lg">
          {alerta.severidad === 'critico' ? '🔴' : alerta.severidad === 'advertencia' ? '🟡' : '🔵'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{alerta.titulo}</p>
          <p className="text-xs mt-0.5 opacity-80">{alerta.descripcion}</p>
          {alerta.accion && (
            <p className="text-xs mt-1.5 font-medium opacity-90">
              → {alerta.accion}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function ReadinessBar({ score, codigo }: { label: string; score: number; codigo: string }) {
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-xs text-gray-500 font-medium shrink-0">{codigo}</div>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 text-right text-xs font-bold" style={{ color }}>
        {score.toFixed(0)}%
      </div>
    </div>
  )
}

function ActorPill({ actor, tipo }: {
  actor: { nombre: string; cargo: string }; tipo: 'campeon' | 'bloqueador'
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${
      tipo === 'campeon'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-red-50 text-red-700 border-red-200'
    }`}>
      <span>{tipo === 'campeon' ? '★' : '⚠'}</span>
      <span>{actor.nombre}</span>
      <span className="opacity-60">· {actor.cargo}</span>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface Props {
  proyectoId: string
  municipioId: string
}

export default function ProyectoVivoPortal({ proyectoId, municipioId }: Props) {
  const [estado, setEstado] = useState<ProyectoEstado | null>(null)
  const [ficha, setFicha] = useState<FichaImpacto | null>(null)
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'estado' | 'impacto' | 'standards'>('estado')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [est, read] = await Promise.all([
        getProyectoEstado(proyectoId),
        getReadiness(municipioId),
      ])
      setEstado(est)
      setReadiness(read)
      // Ficha de impacto es opcional — puede fallar si no hay datos
      try {
        const fich = await getFichaImpacto(proyectoId)
        setFicha(fich)
      } catch {
        // sin datos aún — no bloquea la vista
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [proyectoId, municipioId])

  useEffect(() => { load() }, [load])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500">Cargando estado del proyecto…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-8 max-w-md text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800 mb-2">No se pudo cargar el proyecto</h2>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  if (!estado) return null

  const semColor = SEMAFORO_COLOR[estado.semaforo] || 'bg-gray-400'
  const critAlertas = estado.alertas.filter(a => a.severidad === 'critico')
  const otrasAlertas = estado.alertas.filter(a => a.severidad !== 'critico')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
              A
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-800">ALQUIMIA · Proyecto Vivo</h1>
              <p className="text-xs text-gray-400">{estado.municipio_id} · {estado.zm}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${semColor}`} />
            <span className="text-xs font-medium text-gray-600">
              {SEMAFORO_LABEL[estado.semaforo]}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* ── Semáforo + progreso ── */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <ProgressRing pct={estado.pct_avance} />
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Semanas activo"  value={String(estado.semanas_activo)} sub={`de ${estado.semanas_objetivo}`} />
              <StatCard label="Actividades"     value={`${estado.actividades_completadas}/${estado.actividades_total}`} sub="completadas" />
              <StatCard
                label="Retraso máx."
                value={estado.semanas_retraso_max > 0 ? `${estado.semanas_retraso_max}sem` : 'Sin retraso'}
                color={estado.semanas_retraso_max > 2 ? 'text-red-600' : 'text-gray-800'}
              />
              <StatCard
                label="Riesgo político"
                value={estado.riesgo_politico.nivel.charAt(0).toUpperCase() + estado.riesgo_politico.nivel.slice(1)}
                color={
                  estado.riesgo_politico.nivel === 'alto' ? 'text-red-600'
                  : estado.riesgo_politico.nivel === 'medio' ? 'text-amber-600'
                  : 'text-emerald-600'
                }
              />
            </div>
          </div>
          {/* Campeón */}
          {estado.campeon.nombre && (
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs text-gray-500">
              <span className="text-emerald-600 font-medium">Campeón interno:</span>
              <span>{estado.campeon.nombre}</span>
              {estado.campeon.cargo && <span className="opacity-60">· {estado.campeon.cargo}</span>}
            </div>
          )}
        </section>

        {/* ── Tabs ── */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {(['estado', 'impacto', 'standards'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all capitalize ${
                activeTab === tab
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'estado' ? 'Estado & Alertas'
               : tab === 'impacto' ? 'Impacto Real'
               : 'Estándares'}
            </button>
          ))}
        </div>

        {/* ── Tab: Estado & Alertas ── */}
        {activeTab === 'estado' && (
          <div className="space-y-5">
            {/* Checkpoint de costos */}
            {estado.checkpoint_pendiente && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="font-semibold text-amber-800 text-sm">Checkpoint de costos pendiente</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Los documentos no pueden avanzar a status &ldquo;defendible&rdquo; hasta que confirme los supuestos financieros.
                  </p>
                </div>
              </div>
            )}

            {/* Alertas críticas */}
            {critAlertas.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wider">Acciones urgentes</h3>
                {critAlertas.map((a, i) => <AlertaBadge key={i} alerta={a} />)}
              </div>
            )}

            {/* Próximas acciones */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Próximas acciones</h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-xs text-blue-500 font-semibold mb-1">Tu tarea (municipio)</p>
                  <p className="text-sm text-blue-800 font-medium">
                    {estado.proxima_accion_municipio || 'Sin pendientes por ahora 🎉'}
                  </p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <p className="text-xs text-emerald-500 font-semibold mb-1">ALQUIMIA trabaja en</p>
                  <p className="text-sm text-emerald-800 font-medium">
                    {estado.proxima_accion_alquimia || 'Sin pendientes'}
                  </p>
                </div>
              </div>
            </div>

            {/* Mapa de actores */}
            {(estado.riesgo_politico.bloqueadores.length > 0 || estado.riesgo_politico.campeones.length > 0) && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Mapa de actores</h3>
                <div className="flex flex-wrap gap-2">
                  {estado.riesgo_politico.campeones.map((a, i) => (
                    <ActorPill key={`c-${i}`} actor={a} tipo="campeon" />
                  ))}
                  {estado.riesgo_politico.bloqueadores.map((a, i) => (
                    <ActorPill key={`b-${i}`} actor={a} tipo="bloqueador" />
                  ))}
                </div>
                {estado.riesgo_politico.nivel === 'alto' && (
                  <p className="text-xs text-red-600 mt-2">
                    Riesgo político alto — se recomienda reunión de alineación con actores clave antes de avanzar a siguiente fase.
                  </p>
                )}
              </div>
            )}

            {/* Otras alertas */}
            {otrasAlertas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Notificaciones</h3>
                {otrasAlertas.map((a, i) => <AlertaBadge key={i} alerta={a} />)}
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Impacto Real ── */}
        {activeTab === 'impacto' && (
          <div className="space-y-5">
            {ficha ? (
              <>
                {/* North Star */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard
                    label="Toneladas desviadas"
                    value={ficha.north_star.ton_desviadas ? `${ficha.north_star.ton_desviadas.toLocaleString('es-MX')} t` : null}
                    color="text-emerald-700"
                  />
                  <StatCard
                    label="Tasa de desvío"
                    value={ficha.north_star.tasa_desvio_pct ? `${ficha.north_star.tasa_desvio_pct.toFixed(1)}%` : null}
                    color={
                      (ficha.north_star.tasa_desvio_pct ?? 0) >= 30 ? 'text-emerald-600'
                      : (ficha.north_star.tasa_desvio_pct ?? 0) >= 15 ? 'text-amber-600'
                      : 'text-red-600'
                    }
                  />
                  <StatCard
                    label="CO₂e evitadas"
                    value={ficha.north_star.co2e_evitadas_ton ? `${ficha.north_star.co2e_evitadas_ton.toLocaleString('es-MX')} t` : null}
                    color="text-blue-600"
                  />
                  <StatCard
                    label="Valor capturado"
                    value={ficha.north_star.valor_capturado_mxn
                      ? `$${(ficha.north_star.valor_capturado_mxn / 1_000_000).toFixed(2)}M`
                      : null}
                    color="text-purple-600"
                  />
                </div>

                {/* ROI + benchmark */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  {ficha.roi_pct !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-32">ROI del servicio</span>
                      <span className={`text-lg font-bold ${ficha.roi_pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {ficha.roi_pct >= 0 ? '+' : ''}{ficha.roi_pct.toFixed(1)}%
                      </span>
                    </div>
                  )}
                  {ficha.vs_benchmark && (
                    <div className="flex items-start gap-3">
                      <span className="text-xs text-gray-400 w-32 shrink-0">vs benchmark ZM</span>
                      <span className="text-sm text-gray-700">{ficha.vs_benchmark}</span>
                    </div>
                  )}
                  {ficha.north_star.empleos_generados !== null && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-32">Empleos generados</span>
                      <span className="text-lg font-bold text-gray-800">{ficha.north_star.empleos_generados}</span>
                    </div>
                  )}
                </div>

                {/* Logros para cabildo */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Logros para presentar en cabildo</h3>
                  <ul className="space-y-2">
                    {ficha.logros_cabildo.map((l, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-emerald-500 mt-0.5">✓</span>
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Próximos pasos */}
                {ficha.proximos_pasos.length > 0 && (
                  <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 space-y-2">
                    <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wider">Próximos pasos</h3>
                    {ficha.proximos_pasos.map((p, i) => (
                      <p key={i} className="text-sm text-blue-700">→ {p}</p>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <p className="text-3xl mb-3">📊</p>
                <p className="text-sm text-gray-500 mb-1">Los datos de impacto real aún no están disponibles.</p>
                <p className="text-xs text-gray-400">
                  Se registran cuando el municipio reporta datos de pesaje o ventas de materiales.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Tab: Estándares ── */}
        {activeTab === 'standards' && readiness && (
          <div className="space-y-5">
            {/* Score global */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Score Global de Cumplimiento</h3>
                  <p className="text-xs text-gray-400 mt-0.5">GRI · SASB · ISO 9001 · ODS</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-gray-800">{readiness.score_global.toFixed(0)}%</p>
                  <p className={`text-xs font-semibold capitalize ${NIVEL_COLOR[readiness.nivel] || 'text-gray-600'}`}>
                    {readiness.nivel.replace('_', ' ')}
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <ReadinessBar label={readiness.estandares.gri306.nombre} score={readiness.estandares.gri306.score_pct} codigo="GRI 306:2020" />
                <ReadinessBar label={readiness.estandares.sasb.nombre}   score={readiness.estandares.sasb.score_pct}   codigo="SASB IF-WM-420a" />
                <ReadinessBar label={readiness.estandares.iso9001.nombre} score={readiness.estandares.iso9001.score_pct} codigo="ISO 9001" />
                <ReadinessBar label={readiness.estandares.ods.nombre}    score={readiness.estandares.ods.score_pct}    codigo="ODS" />
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-5 space-y-2">
              <h3 className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Recomendaciones ALQUIMIA</h3>
              {readiness.recomendaciones.map((r, i) => (
                <p key={i} className="text-sm text-emerald-800">→ {r}</p>
              ))}
            </div>

            {/* Gaps por estándar */}
            {Object.entries(readiness.estandares).map(([key, std]) =>
              std.gaps.length > 0 ? (
                <div key={key} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700">{std.nombre}</h3>
                    <span className="text-xs text-gray-400">{std.disclosures_cubiertos}/{std.disclosures_total} cubiertos</span>
                  </div>
                  <p className="text-xs text-gray-500 italic">{std.observacion}</p>
                  <div className="space-y-2">
                    {std.gaps.slice(0, 3).map((g, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            g.prioridad === 'alta' ? 'bg-red-100 text-red-700'
                            : g.prioridad === 'media' ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>{g.prioridad}</span>
                          <span className="text-xs font-medium text-gray-700">{g.label}</span>
                        </div>
                        <p className="text-xs text-gray-500">{g.descripcion}</p>
                        <p className="text-xs text-emerald-600 mt-1 font-medium">→ {g.accion}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null
            )}
          </div>
        )}

      </main>

      {/* ── Footer ── */}
      <footer className="max-w-5xl mx-auto px-4 py-6 mt-4">
        <p className="text-center text-xs text-gray-300">
          ALQUIMIA · Portal del proyecto · Datos actualizados en tiempo real · {new Date().toLocaleDateString('es-MX')}
        </p>
      </footer>
    </div>
  )
}
