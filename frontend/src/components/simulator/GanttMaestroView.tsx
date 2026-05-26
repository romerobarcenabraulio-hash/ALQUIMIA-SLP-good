'use client'

import { useEffect, useState, useCallback } from 'react'
import { AlertTriangle, RefreshCw, CheckCircle2, Clock, Download, Calendar } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { buildPlanningAll, type GanttPlan, type PertPlan, type RACIPlan } from '@/lib/api'
import { cn } from '@/lib/utils'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'

type InnerTab = 'gantt' | 'pert' | 'raci'

export function GanttMaestroView() {
  const zm             = useSimulatorStore(s => s.zmActiva)
  const municipios     = useSimulatorStore(s => s.municipiosActivos)
  const resultados     = useSimulatorStore(s => s.resultados)
  const mixCAs         = useSimulatorStore(s => s.mixCAs)
  const horizonte      = useSimulatorStore(s => s.horizonte)

  const municipio  = municipios[0] ?? 'municipio'
  const capex      = (resultados?.capexTotal as number | undefined) ?? 1_500_000
  const scenarioId = `${zm}-${municipio}-${Date.now()}`

  const fechaInicioPrograma = useSimulatorStore(s => s.fechaInicioPrograma)
  const setFechaInicioPrograma = useSimulatorStore(s => s.setFechaInicioPrograma)

  const [tab, setTab]         = useState<InnerTab>('gantt')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [gantt, setGantt]     = useState<GanttPlan | null>(null)
  const [pert, setPert]       = useState<PertPlan | null>(null)
  const [raci, setRaci]       = useState<RACIPlan | null>(null)

  const exportarClickUp = useCallback(() => {
    if (!gantt) return
    // Generate ClickUp-compatible CSV
    const headers = ['Task Name', 'List', 'Assignee', 'Due Date', 'Start Date', 'Priority', 'Status', 'Description']
    const startDate = fechaInicioPrograma ? new Date(fechaInicioPrograma) : new Date()
    const addDays = (d: Date, days: number) => {
      const r = new Date(d); r.setDate(r.getDate() + days); return r
    }
    const fmtDate = (d: Date) =>
      `${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}/${d.getFullYear()}`

    const rows = gantt.tasks.map(t => {
      const taskStart = addDays(startDate, (t.inicio_semana - 1) * 7)
      const taskEnd   = addDays(taskStart, t.duracion_semanas * 7)
      return [
        t.nombre,
        'ALQUIMIA - Programa Municipal',
        t.responsable,
        fmtDate(taskEnd),
        fmtDate(taskStart),
        t.es_critica ? 'High' : 'Normal',
        'To Do',
        t.descripcion ?? '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `gantt-alquimia-${municipio}-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }, [gantt, fechaInicioPrograma, municipio])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    buildPlanningAll({
      municipio,
      zm: zm ?? 'SLP',
      scenario_id: scenarioId,
      n_cas_pequeno: mixCAs?.P ?? 1,
      n_cas_mediano: mixCAs?.M ?? 0,
      n_cas_grande:  mixCAs?.G ?? 0,
      capex_total_mxn: capex,
      horizonte_semanas: Math.min((horizonte ?? 3) * 52, 260),
    })
      .then(data => {
        if (cancelled) return
        setGantt(data.gantt)
        setPert(data.pert)
        setRaci(data.raci)
      })
      .catch(e => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error cargando plan')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipio, zm, capex])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-[10px] bg-[#F6FAEF] px-4 py-6 text-[12px] text-[#5A6347]">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Calculando Gantt · PERT · RACI para {municipio}…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-start gap-2 rounded-[10px] border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-800">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{error}</span>
      </div>
    )
  }

  if (!gantt) return null

  return (
    <div className="space-y-4">
      {/* Controles de fecha de inicio y exportación */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-[#3B6D11]" />
          <label className="text-[11px] font-medium text-[#6B6760]">Fecha de inicio del programa:</label>
          <input
            type="date"
            value={fechaInicioPrograma ?? ''}
            onChange={e => setFechaInicioPrograma(e.target.value || null)}
            className="text-[11px] border border-[#E8E4DC] rounded px-2 py-1 text-[#1C1B18] focus:outline-none focus:border-[#3B6D11]"
          />
        </div>
        {fechaInicioPrograma && gantt && (
          <div className="text-[11px] text-[#3B6D11] font-medium">
            Oleada operativa: ~{new Date(new Date(fechaInicioPrograma).getTime() + 18 * 7 * 24 * 3600 * 1000).toLocaleDateString('es-MX', { year:'numeric',month:'long',day:'numeric' })}
          </div>
        )}
        {gantt && (
          <button
            type="button"
            onClick={exportarClickUp}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#EAF3DE] border border-[#C9DDB1] text-[#3B6D11] text-[11px] font-semibold hover:bg-[#D4ECBD] transition-colors"
          >
            <Download size={12} />
            Exportar a ClickUp CSV
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <nav className="flex gap-1 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-1">
        {(['gantt', 'pert', 'raci'] as InnerTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 rounded-[6px] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition-colors',
              tab === t
                ? 'bg-[#3B6D11] text-white shadow-sm'
                : 'text-[#6B6760] hover:bg-[#EAF3DE] hover:text-[#23470A]',
            )}
          >
            {t === 'gantt' ? 'Gantt Maestro' : t === 'pert' ? 'Red PERT' : 'Matriz RACI'}
          </button>
        ))}
      </nav>

      {tab === 'gantt' && gantt && <GanttTable gantt={gantt} />}
      {tab === 'pert'  && pert  && <PertNetwork pert={pert} />}
      {tab === 'raci'  && raci  && <RACIMatrix raci={raci} />}
    </div>
  )
}

// ── Gantt Table ───────────────────────────────────────────────────────────────

function GanttTable({ gantt }: { gantt: GanttPlan }) {
  const maxSemana = Math.max(...gantt.tasks.map(t => t.inicio_semana + t.duracion_semanas - 1))
  const scale = Math.min(100 / maxSemana, 2)

  return (
    <div className="space-y-3">
      <KpiAnchorGrid
        columns={3}
        items={[
          { label: 'Duración total', value: `${maxSemana} sem.` },
          { label: 'Costo planificado', value: `$${(gantt.costo_total_mxn / 1_000_000).toFixed(1)}M` },
          {
            label: 'Tareas críticas',
            value: `${gantt.tasks.filter(t => t.es_critica).length} / ${gantt.tasks.length}`,
          },
        ]}
      />

      {/* Gantt bars */}
      <div className="overflow-x-auto rounded-[10px] border border-[#E8E4DC]">
        <table className="w-full min-w-[640px] text-[11px]">
          <thead>
            <tr className="border-b border-[#E8E4DC] bg-[#F8F6F1]">
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">Tarea</th>
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">Responsable</th>
              <th className="w-40 px-3 py-2 text-right font-semibold text-[#23470A]">Costo MXN</th>
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">Línea de tiempo</th>
            </tr>
          </thead>
          <tbody>
            {gantt.tasks.map(task => {
              const left = ((task.inicio_semana - 1) * scale).toFixed(1)
              const width = Math.max((task.duracion_semanas * scale), 3).toFixed(1)
              return (
                <tr
                  key={task.task_id}
                  className={cn(
                    'border-b border-[#F0EDE8]',
                    task.es_critica ? 'bg-[#FFF8F0]' : 'bg-white',
                  )}
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {task.es_critica && (
                        <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold text-orange-700">
                          ★ CRIT
                        </span>
                      )}
                      <span className={cn('leading-tight', task.es_critica && 'font-semibold text-[#8B4513]')}>
                        {task.nombre}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[#5A6347]">{task.responsable}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-[#23470A]">
                    {task.costo_mxn > 0 ? `$${Math.round(task.costo_mxn / 1000)}k` : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <div className="relative h-5 w-full min-w-[120px] rounded bg-[#F0EDE8]">
                      <div
                        className={cn(
                          'absolute top-1 h-3 rounded transition-all',
                          task.es_critica ? 'bg-orange-500' : 'bg-[#3B6D11]',
                        )}
                        style={{ left: `${left}%`, width: `${width}%`, maxWidth: '100%' }}
                        title={`Sem ${task.inicio_semana}–${task.inicio_semana + task.duracion_semanas - 1}`}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-[#8A857C]">
        Fuente costos: {gantt.fuente_costos} · Generado: {new Date(gantt.generated_at).toLocaleDateString('es-MX')}
      </p>
    </div>
  )
}

// ── PERT Network ──────────────────────────────────────────────────────────────

function PertNetwork({ pert }: { pert: PertPlan }) {
  const criticos = pert.nodes.filter(n => n.es_critico)
  const noEsCritico = pert.nodes.filter(n => !n.es_critico)

  return (
    <div className="space-y-3">
      <KpiAnchorGrid
        columns={2}
        items={[
          { label: 'Duración total', value: `${pert.duracion_total_semanas} sem.` },
          { label: 'Nodos críticos', value: `${criticos.length} / ${pert.nodes.length}` },
        ]}
      />

      <div className="rounded-[10px] border border-orange-200 bg-orange-50 p-3">
        <p className="mb-2 text-[11px] font-semibold text-orange-800">Ruta crítica — holgura = 0</p>
        <div className="flex flex-wrap gap-2">
          {criticos.map((n, i) => (
            <div key={n.node_id} className="flex items-center gap-1">
              <div className="rounded-[6px] border border-orange-300 bg-white px-2 py-1 text-[10px] font-medium text-orange-900">
                <span className="block font-bold">{n.node_id}</span>
                <span className="block truncate max-w-[100px]" title={n.nombre}>{n.nombre.slice(0, 20)}…</span>
                <span className="block text-orange-600">{n.tiempo_esperado}s</span>
              </div>
              {i < criticos.length - 1 && (
                <span className="text-[12px] text-orange-400">→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-[#E8E4DC]">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-[#E8E4DC] bg-[#F8F6F1]">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-right">ES</th>
              <th className="px-3 py-2 text-right">LS</th>
              <th className="px-3 py-2 text-right">Holgura</th>
              <th className="px-3 py-2 text-center">Crítico</th>
            </tr>
          </thead>
          <tbody>
            {pert.nodes.map(n => (
              <tr
                key={n.node_id}
                className={cn(
                  'border-b border-[#F0EDE8]',
                  n.es_critico ? 'bg-[#FFF8F0]' : 'bg-white',
                )}
              >
                <td className="px-3 py-1.5 font-mono font-semibold text-[#23470A]">{n.node_id}</td>
                <td className="px-3 py-1.5 text-[#1C1B18]">{n.nombre.slice(0, 40)}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{n.tiempo_temprano}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{n.tiempo_tardio}</td>
                <td className={cn(
                  'px-3 py-1.5 text-right tabular-nums font-medium',
                  n.holgura <= 0.01 ? 'text-orange-600' : 'text-[#5A6347]',
                )}>
                  {n.holgura.toFixed(1)}
                </td>
                <td className="px-3 py-1.5 text-center">
                  {n.es_critico
                    ? <span className="text-orange-500">★</span>
                    : <span className="text-[#C8C4BC]">○</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── RACI Matrix ───────────────────────────────────────────────────────────────

function RACIMatrix({ raci }: { raci: RACIPlan }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[11px]">
        {[
          { code: 'R', label: 'Responsable', color: 'bg-[#3B6D11] text-white' },
          { code: 'A', label: 'Aprueba',     color: 'bg-blue-600 text-white' },
          { code: 'C', label: 'Consulta',    color: 'bg-amber-500 text-white' },
          { code: 'I', label: 'Informa',     color: 'bg-[#8A857C] text-white' },
        ].map(({ code, label, color }) => (
          <div key={code} className="flex items-center gap-1">
            <span className={cn('rounded px-1.5 py-0.5 font-bold', color)}>{code}</span>
            <span className="text-[#6B6760]">{label}</span>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-[#E8E4DC]">
        <table className="w-full min-w-[640px] text-[11px]">
          <thead>
            <tr className="border-b border-[#E8E4DC] bg-[#F8F6F1]">
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">Proceso</th>
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">R — Responsable</th>
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">A — Aprueba</th>
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">C — Consulta</th>
              <th className="px-3 py-2 text-left font-semibold text-[#23470A]">I — Informa</th>
              <th className="px-3 py-2 text-right font-semibold text-[#23470A]">Plazo</th>
            </tr>
          </thead>
          <tbody>
            {raci.filas.map((fila, i) => (
              <tr key={i} className={cn('border-b border-[#F0EDE8]', i % 2 === 0 ? 'bg-white' : 'bg-[#FDFCFA]')}>
                <td className="px-3 py-2 font-medium text-[#1C1B18]">
                  {fila.proceso}
                  {fila.norma_aplicable && (
                    <span className="ml-1 text-[9px] text-[#8A857C]">({fila.norma_aplicable})</span>
                  )}
                </td>
                <td className="px-3 py-2">
                  <RaciChip code="R" label={fila.responsable} />
                </td>
                <td className="px-3 py-2">
                  <RaciChip code="A" label={fila.aprueba} />
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    {fila.consulta.map((c, j) => <RaciChip key={j} code="C" label={c} />)}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-col gap-0.5">
                    {fila.informa.map((inf, j) => <RaciChip key={j} code="I" label={inf} />)}
                  </div>
                </td>
                <td className="px-3 py-2 text-right text-[#6B6760]">
                  {fila.plazo_semanas != null ? `${fila.plazo_semanas}s` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-[#8A857C]">
        {raci.filas.length} procesos · {raci.municipio} · ÁGORA GOV ALQUIMIA
      </p>
    </div>
  )
}

function RaciChip({ code, label }: { code: string; label: string }) {
  const colors: Record<string, string> = {
    R: 'bg-[#EAF3DE] text-[#23470A] border-[#3B6D11]/30',
    A: 'bg-blue-50 text-blue-800 border-blue-200',
    C: 'bg-amber-50 text-amber-800 border-amber-200',
    I: 'bg-[#F8F6F1] text-[#6B6760] border-[#E8E4DC]',
  }
  return (
    <span className={cn('inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 text-[9px]', colors[code])}>
      <span className="font-bold">{code}</span>
      <span className="truncate max-w-[120px]" title={label}>{label}</span>
    </span>
  )
}

