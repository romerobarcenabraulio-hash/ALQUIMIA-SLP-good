'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import type { MacroGenerator, MacroImpactSummary, MacroTipo, DeclaracionGeneracionRSU } from '@/types'
import { computeMacroImpact, createMacroGenerator, getMacroGenerators, getDeclaracionesVoluntarias, updateMacroGenerator } from '@/lib/api'
import { useSimulatorStore } from '@/store/simulatorStore'

const TIPO_LABEL: Record<string, string> = {
  hotel: 'Hotel',
  estadio: 'Estadio',
  club_deportivo: 'Club deportivo',
  plaza_comercial: 'Plaza comercial',
  mercado_publico: 'Mercado publico',
  hospital: 'Hospital',
  universidad: 'Universidad',
  parque_industrial: 'Parque industrial',
  edificio_oficinas: 'Edificio oficinas',
  evento_masivo: 'Evento masivo',
}

const STATUS_COLOR: Record<string, string> = {
  verificado: 'bg-green-100 text-green-800',
  estimado: 'bg-yellow-100 text-yellow-800',
  manual: 'bg-orange-100 text-orange-800',
  pendiente_verificacion: 'bg-[#F0EDE5] text-[#6B6760]',
  inactivo: 'bg-[#F0EDE5] text-[#8A857C]',
  bloqueado: 'bg-red-100 text-red-800',
}

const MATERIALS = ['organico', 'papel', 'plastico', 'vidrio', 'aluminio', 'otros']

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('es-MX', { maximumFractionDigits: decimals })
}

function fmtMXN(n: number): string {
  if (n >= 1_000_000) return `$${fmt(n / 1_000_000, 2)} M`
  if (n >= 1_000) return `$${fmt(n / 1_000, 1)} K`
  return `$${fmt(n, 0)}`
}

function materialLine(summary: MacroImpactSummary | null): string {
  if (!summary) return 'Sin impacto calculado'
  return Object.entries(summary.volumen_por_material)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([mat, vol]) => `${mat}: ${fmt(vol, 1)} t/año`)
    .join(' · ')
}

export default function Macrogeneradores() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const macroImpactSummary = useSimulatorStore(s => s.macroImpactSummary)
  const setMacroImpactSummary = useSimulatorStore(s => s.setMacroImpactSummary)

  const [generators, setGenerators] = useState<MacroGenerator[]>([])
  const [disabledIds, setDisabledIds] = useState<Set<string>>(new Set())
  const [loadingList, setLoadingList] = useState(false)
  const [calculating, setCalculating] = useState(false)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualName, setManualName] = useState('')
  const [manualTipo, setManualTipo] = useState<MacroTipo>('hotel')
  const [manualTonDia, setManualTonDia] = useState(1)
  const [showForm, setShowForm] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draft, setDraft] = useState<MacroGenerator | null>(null)
  const [voluntarias, setVoluntarias] = useState<DeclaracionGeneracionRSU[]>([])
  const [voluntariasLoading, setVoluntariasLoading] = useState(false)
  const [voluntariasErr, setVoluntariasErr] = useState<string | null>(null)
  const [voluntariasTick, setVoluntariasTick] = useState(0)
  const municipioActivo = municipiosActivos[0] ?? null
  const blocked = !municipioActivo

  useEffect(() => {
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingList(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    getMacroGenerators(zmActiva)
      .then(items => {
        if (!alive) return
        setGenerators(items)
        setDisabledIds(new Set())
        setMacroImpactSummary(null)
      })
      .catch(e => {
        if (alive) setError(e instanceof Error ? e.message : 'Incidencia operativa al cargar macrogeneradores')
      })
      .finally(() => {
        if (alive) setLoadingList(false)
      })
    return () => { alive = false }
  }, [zmActiva, setMacroImpactSummary])

  useEffect(() => {
    const mid = municipiosActivos[0]
    if (!mid) {
      queueMicrotask(() => {
        setVoluntarias([])
        setVoluntariasLoading(false)
        setVoluntariasErr(null)
      })
      return undefined
    }
    let alive = true
    queueMicrotask(() => {
      if (!alive) return
      setVoluntariasLoading(true)
      setVoluntariasErr(null)
    })
    getDeclaracionesVoluntarias(mid)
      .then(rows => {
        if (alive) setVoluntarias(rows)
      })
      .catch(() => {
        if (alive) {
          setVoluntariasErr('No se pudieron cargar las estimaciones voluntarias.')
          setVoluntarias([])
        }
      })
      .finally(() => {
        if (alive) setVoluntariasLoading(false)
      })
    return () => {
      alive = false
    }
  }, [municipiosActivos, voluntariasTick])

  useEffect(() => {
    const onRefresh = () => setVoluntariasTick(t => t + 1)
    window.addEventListener('alq-refresh-voluntarias', onRefresh)
    return () => window.removeEventListener('alq-refresh-voluntarias', onRefresh)
  }, [])

  const activeGenerators = useMemo(
    () => generators.filter(g => !disabledIds.has(g.generator_id)),
    [generators, disabledIds],
  )

  const compositionTotal = draft
    ? Object.values(draft.composicion).reduce((sum, v) => sum + Number(v || 0), 0)
    : 0
  const compositionOk = Math.abs(compositionTotal - 1) <= 0.03

  function toggle(generatorId: string) {
    setDisabledIds(prev => {
      const next = new Set(prev)
      if (next.has(generatorId)) next.delete(generatorId)
      else next.add(generatorId)
      return next
    })
  }

  function selectForEdit(generator: MacroGenerator) {
    setSelectedId(generator.generator_id)
    setDraft(JSON.parse(JSON.stringify(generator)) as MacroGenerator)
  }

  function updateDraftMaterial(material: string, value: number) {
    if (!draft) return
    setDraft({
      ...draft,
      composicion: { ...draft.composicion, [material]: value },
    })
  }

  function updateSeasonalityAll(value: number) {
    if (!draft) return
    setDraft({ ...draft, estacionalidad_mensual: Array(12).fill(value) })
  }

  async function handleSaveDraft() {
    if (!draft || !selectedId || !compositionOk) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateMacroGenerator(selectedId, {
        generacion_estimada_ton_dia: draft.generacion_estimada_ton_dia,
        composicion: draft.composicion,
        estacionalidad_mensual: draft.estacionalidad_mensual,
        dias_operacion_anio: draft.dias_operacion_anio,
        separacion_potencial_pct: draft.separacion_potencial_pct,
        pureza_estimada_pct: draft.pureza_estimada_pct,
        status: draft.status,
      })
      setGenerators(prev => prev.map(g => g.generator_id === selectedId ? updated : g))
      setDraft(updated)
      setMacroImpactSummary(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incidencia operativa al guardar macrogenerador')
    } finally {
      setSaving(false)
    }
  }

  async function handleImpact() {
    if (blocked) {
      setError('Selecciona un municipio para calcular impacto de macrogeneradores.')
      return
    }
    setCalculating(true)
    setError(null)
    try {
      const summary = await computeMacroImpact(
        zmActiva,
        municipiosActivos,
        activeGenerators,
        false,
      )
      setMacroImpactSummary(summary)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incidencia operativa al calcular impacto macro')
    } finally {
      setCalculating(false)
    }
  }

  async function handleCreateManual() {
    const municipio = municipiosActivos[0] ?? null
    if (!manualName.trim() || !municipio) return
    setCreating(true)
    setError(null)
    try {
      const generator: MacroGenerator = {
        generator_id: `${zmActiva}-MANUAL-${Date.now()}`,
        nombre: manualName.trim(),
        tipo: manualTipo,
        zm: zmActiva,
        municipio,
        ubicacion: null,
        lat: null,
        lon: null,
        actividad_base: null,
        unidad_actividad: 'captura_manual',
        generacion_estimada_ton_dia: manualTonDia,
        composicion: {
          organico: 0.35,
          papel: 0.15,
          plastico: 0.25,
          vidrio: 0.08,
          aluminio: 0.04,
          otros: 0.13,
        },
        estacionalidad_mensual: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        dias_operacion_anio: 300,
        separacion_actual_pct: 0,
        separacion_potencial_pct: 55,
        pureza_estimada_pct: 75,
        fuente: 'Captura manual de usuario; requiere verificacion documental.',
        fuente_tipo: 'manual_usuario',
        confianza: 0.35,
        status: 'manual',
        last_verified_at: null,
      }
      const created = await createMacroGenerator(generator)
      setGenerators(prev => [...prev, created])
      setManualName('')
      setMacroImpactSummary(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Incidencia operativa al crear macrogenerador')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h3 className="mt-1 font-serif text-[22px] text-[#1C1B18]">
            Grandes fuentes RSU · {zmActiva}
          </h3>
          <p className="mt-1 text-[12px] text-[#6B6760]">
            Impacto incremental con fuente, confianza, logística y marketplace declarados.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
            {['Generador', 'Estimación por tipo', 'Impacto incremental', 'Logística / rutas', 'Mercado / recicladoras'].map((step, i, arr) => (
              <Fragment key={step}>
                <span className="bg-[#F0EDE5] rounded px-2 py-0.5">{step}</span>
                {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
              </Fragment>
            ))}
          </div>
        </div>
        <button
          onClick={handleImpact}
          disabled={calculating || loadingList || activeGenerators.length === 0}
          className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {calculating ? 'Calculando...' : macroImpactSummary ? 'Recalcular impacto' : 'Calcular impacto'}
        </button>
      </div>

      {blocked && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Selecciona un municipio activo para evitar bloqueos en el cálculo municipal.
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-[#F0EDE5] rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-[#FAF8F4] text-xs text-[#8A857C]">
            <tr>
              <th className="text-left py-2 px-3 font-medium">Activo</th>
              <th className="text-left py-2 px-3 font-medium">Generador</th>
              <th className="text-left py-2 px-3 font-medium">Tipo</th>
              <th className="text-right py-2 px-3 font-medium">t/dia</th>
              <th className="text-left py-2 px-3 font-medium">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {loadingList && Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="animate-pulse border-b border-[#F0EDE5]">
                {Array.from({ length: 5 }).map((__, j) => (
                  <td key={j} className="py-3 px-3">
                    <div className="h-3 bg-[#E8E4DC] rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
            {!loadingList && generators.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 px-3 text-center">
                  <p className="text-[13px] text-[#6B6760]">Sin macrogeneradores registrados.</p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="mt-3 text-[12px] text-[#3B6D11] underline underline-offset-2"
                  >
                    Agregar primer generador
                  </button>
                </td>
              </tr>
            )}
            {!loadingList && generators.map(g => {
              const disabled = disabledIds.has(g.generator_id)
              return (
                <tr key={g.generator_id} className="border-t border-[#F0EDE5]">
                  <td className="py-3 px-3">
                    <input
                      type="checkbox"
                      checked={!disabled}
                      onChange={() => toggle(g.generator_id)}
                      className="h-4 w-4 rounded border-[#DAD3C7]"
                    />
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-medium text-[#1C1B18]">{g.nombre}</div>
                    <div className="text-xs text-[#8A857C]">{g.municipio ?? 'sin municipio'} · {g.ubicacion ?? 'sin ubicacion'}</div>
                  </td>
                  <td className="py-3 px-3 text-[#6B6760]">{TIPO_LABEL[g.tipo] ?? g.tipo}</td>
                  <td className="py-3 px-3 text-right font-mono text-[#1C1B18]">{fmt(g.generacion_estimada_ton_dia, 1)}</td>
                  <td className="py-3 px-3">
                    <span className={`inline-block text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLOR[g.status] ?? 'bg-[#F0EDE5] text-[#6B6760]'}`}>
                      {g.status}
                    </span>
                    <div className="text-xs text-[#8A857C] mt-1">{g.fuente_tipo} · {fmt(g.confianza * 100, 0)}%</div>
                    <button
                      onClick={() => selectForEdit(g)}
                      className="mt-2 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {macroImpactSummary && (
        <ImpactPanel summary={macroImpactSummary} />
      )}

      {draft && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-emerald-900">Edición avanzada</p>
              <p className="text-xs text-emerald-800">{draft.nombre}</p>
            </div>
            <button
              onClick={handleSaveDraft}
              disabled={saving || !compositionOk}
              className="rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <label className="block text-[13px] text-[#6B6860] mb-1">
              t/dia
              <input
                type="number"
                min={0}
                step={0.1}
                value={draft.generacion_estimada_ton_dia}
                onChange={e => setDraft({ ...draft, generacion_estimada_ton_dia: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-[13px] text-[#6B6860] mb-1">
              dias/año
              <input
                type="number"
                min={0}
                max={366}
                value={draft.dias_operacion_anio}
                onChange={e => setDraft({ ...draft, dias_operacion_anio: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-[13px] text-[#6B6860] mb-1">
              sep. potencial %
              <input
                type="number"
                min={0}
                max={100}
                value={draft.separacion_potencial_pct}
                onChange={e => setDraft({ ...draft, separacion_potencial_pct: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-2 py-1.5 text-sm"
              />
            </label>
            <label className="block text-[13px] text-[#6B6860] mb-1">
              estacionalidad
              <input
                type="number"
                min={0}
                step={0.05}
                value={draft.estacionalidad_mensual[0] ?? 1}
                onChange={e => updateSeasonalityAll(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-2 py-1.5 text-sm"
              />
            </label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#6B6760]">Composición</p>
              <p className={`text-xs font-medium ${compositionOk ? 'text-emerald-700' : 'text-red-700'}`}>
                suma {fmt(compositionTotal * 100, 1)}%
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {MATERIALS.map(material => (
                <label key={material} className="block text-[13px] text-[#6B6860] mb-1">
                  {material}
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={draft.composicion[material] ?? 0}
                    onChange={e => updateDraftMaterial(material, Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-2 py-1.5 text-sm"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-3">
          <p className="text-xs font-medium text-[#6B6760] mb-2">Alta manual controlada</p>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_120px_auto] gap-2">
            <input
              value={manualName}
              onChange={e => setManualName(e.target.value)}
              placeholder="Nombre del generador"
              className="rounded-lg border border-[#DAD3C7] px-3 py-2 text-sm"
            />
            <select
              value={manualTipo}
              onChange={e => setManualTipo(e.target.value as MacroTipo)}
              className="rounded-lg border border-[#DAD3C7] px-3 py-2 text-sm"
            >
              {Object.entries(TIPO_LABEL).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <input
              type="number"
              min={0}
              step={0.1}
              value={manualTonDia}
              onChange={e => setManualTonDia(Number(e.target.value))}
              className="rounded-lg border border-[#DAD3C7] px-3 py-2 text-sm"
            />
            <button
              onClick={handleCreateManual}
              disabled={creating || !manualName.trim() || !municipiosActivos.length}
              className="rounded-lg bg-[#1C1B18] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {creating ? 'Agregando...' : 'Agregar'}
            </button>
          </div>
          <p className="text-xs text-[#8A857C] mt-2">
            El alta manual entra con confianza 35%, status manual y advertencia de verificacion.
          </p>
        </div>
      )}

      <section className="rounded-lg border border-[#E8E4DC] bg-white p-4 space-y-3">
        <h4 className="text-[13px] font-semibold text-[#1C1B18]">Generadores declarados voluntariamente</h4>
        {voluntariasErr && (
          <p className="text-[12px] text-amber-800">{voluntariasErr}</p>
        )}
        {voluntariasLoading && <p className="text-[12px] text-[#6B6760]">Cargando…</p>}
        {!voluntariasLoading && !voluntariasErr && voluntarias.length === 0 && (
          <p className="text-[12px] text-[#A8A49C]">Sin declaraciones voluntarias registradas en este municipio.</p>
        )}
        {!voluntariasLoading && voluntarias.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[11px] text-[#8A857C] border-b border-[#F0EDE5]">
                  <th className="py-2 pr-2">Empresa</th>
                  <th className="py-2 pr-2">Giro</th>
                  <th className="py-2 pr-2 text-right">Total ton/año</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {voluntarias.map(d => (
                  <tr key={d.declaracion_id} className="border-b border-[#F0EDE5]">
                    <td className="py-2 pr-2 font-medium text-[#1C1B18]">{d.empresa_nombre}</td>
                    <td className="py-2 pr-2 text-[#6B6760]">
                      <span className="font-mono text-[11px] text-[#3B6D11]">{d.giro_scian}</span>{' '}
                      {d.descripcion_giro ?? ''}
                    </td>
                    <td className="py-2 pr-2 text-right font-mono">{d.generacion_total_ton_anio.toFixed(3)}</td>
                    <td className="py-2">
                      <span className="inline-block text-xs px-2 py-0.5 rounded font-medium bg-orange-100 text-orange-800">
                        declaración voluntaria
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {macroImpactSummary && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-center">
              <div className="text-xs text-[#8A857C] mb-1">Generadores</div>
              <div className="text-lg font-bold text-[#1C1B18]">{macroImpactSummary.generators_count}</div>
            </div>
            <div className="rounded-lg bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-center">
              <div className="text-xs text-[#8A857C] mb-1">RSU incremental</div>
              <div className="text-lg font-bold text-[#1C1B18]">{fmt(macroImpactSummary.total_ton_anio, 1)} t/año</div>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
              <div className="text-xs text-emerald-700 mb-1">Ingreso ajustado</div>
              <div className="text-lg font-bold text-emerald-800">{fmtMXN(macroImpactSummary.ingreso_incremental_mxn)}</div>
            </div>
            <div className="rounded-lg bg-[#EAF3DE] border border-[#C9DDB1] p-3 text-center">
              <div className="text-xs text-[#23470A] mb-1">CO2e incremental</div>
              <div className="text-lg font-bold text-[#1C1B18]">{fmt(macroImpactSummary.co2e_incremental_ton, 1)} t</div>
            </div>
          </div>

          <div className="rounded-lg bg-[#FAF8F4] border border-[#E8E4DC] p-3 text-sm text-[#6B6760]">
            {materialLine(macroImpactSummary)}
          </div>

          {macroImpactSummary.warnings.length > 0 && (
            <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
              <p className="text-xs font-medium text-yellow-800 mb-1">Advertencias</p>
              <ul className="text-xs text-yellow-800 space-y-1">
                {macroImpactSummary.warnings.slice(0, 4).map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ImpactPanel({ summary }: { summary: MacroImpactSummary }) {
  const generators = summary.generators ?? []
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.05em] text-[#8A857C]">Impacto calculado</p>
          <p className="text-sm text-[#6B6760]">Volumen por material: {materialLine(summary)}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs text-[#6B6760]">
          <div className="rounded border border-[#E8E4DC] bg-white px-2 py-2">
            <p className="text-[11px] text-[#8A857C]">Generadores</p>
            <p className="text-sm font-semibold text-[#1C1B18]">{summary.generators_count}</p>
          </div>
          <div className="rounded border border-[#E8E4DC] bg-white px-2 py-2">
            <p className="text-[11px] text-[#8A857C]">RSU incremental</p>
            <p className="text-sm font-semibold text-[#1C1B18]">{fmt(summary.total_ton_anio, 1)} t/año</p>
          </div>
          <div className="rounded border border-emerald-200 bg-emerald-50 px-2 py-2">
            <p className="text-[11px] text-emerald-700">Ingreso ajustado</p>
            <p className="text-sm font-semibold text-emerald-800">{fmtMXN(summary.ingreso_incremental_mxn)}</p>
          </div>
          <div className="rounded border border-[#E8E4DC] bg-[#EAF3DE] px-2 py-2">
            <p className="text-[11px] text-[#23470A]">CO2e incremental</p>
            <p className="text-sm font-semibold text-[#1C1B18]">{fmt(summary.co2e_incremental_ton, 1)} t</p>
          </div>
        </div>
      </div>

      {summary.warnings.length > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2">
          <p className="text-[11px] font-semibold text-amber-800">Advertencias</p>
          <ul className="mt-1 text-xs text-amber-800 space-y-1">
            {summary.warnings.slice(0, 5).map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      {generators.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {generators.map(g => <GeneratorCard key={g.generator_id} generator={g} />)}
        </div>
      ) : (
        <div className="text-xs text-[#8A857C]">No hay generadores con cálculo visible.</div>
      )}
    </div>
  )
}

function GeneratorCard({ generator }: { generator: MacroGenerator }) {
  const calc = generator.calculo_volumen
  const faltantes = generator.variables_tipo?.variables_faltantes ?? []
  const regulados = generator.residuos_regulados_detectados ?? []
  return (
    <div className="rounded-lg border border-[#E8E4DC] bg-white p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1C1B18]">{generator.nombre}</p>
          <p className="text-[11px] text-[#8A857C]">{TIPO_LABEL[generator.tipo] ?? generator.tipo}</p>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          <Badge label={generator.es_temporal ? 'TEMPORAL' : 'PERMANENTE'} tone={generator.es_temporal ? 'amber' : 'emerald'} />
          {generator.excluir_del_conteo_domiciliario && (
            <Badge label="No suma RSU domiciliario" tone="gray" />
          )}
        </div>
      </div>

      <div className="text-xs text-[#6B6760]">
        <p>Generación estimada: <span className="font-mono text-[#1C1B18]">{fmt(generator.generacion_estimada_ton_dia, 2)} t/día</span></p>
        <p>Días/año: {generator.dias_operacion_anio}</p>
      </div>

      {calc && <CalculationPanel calc={calc} />}

      {faltantes.length > 0 && (
        <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-semibold">Variables faltantes</p>
          <ul className="list-disc list-inside">
            {faltantes.map(v => <li key={v}>{v}</li>)}
          </ul>
        </div>
      )}

      {regulados.length > 0 && (
        <div className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <p className="font-semibold">Residuos regulados detectados</p>
          <p>{generator.advertencia_residuos_regulados ?? 'Residuos regulados requieren proveedor autorizado.'}</p>
        </div>
      )}
    </div>
  )
}

function CalculationPanel({ calc }: { calc: MacroGenerator['calculo_volumen'] }) {
  if (!calc) return null
  return (
    <details className="rounded border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2 text-xs text-[#6B6760]">
      <summary className="cursor-pointer font-semibold text-[#1C1B18]">Cómo se calculó este volumen</summary>
      <p>Fórmula: {calc.formula}</p>
      <p>Fuente: {calc.fuente_factor}</p>
      <p>Unidad: {calc.unidad} · Periodicidad: {calc.periodicidad}</p>
      <p>Razón: {calc.razon}</p>
      <p>Incertidumbre: entre {calc.incertidumbre_rango[0]} y {calc.incertidumbre_rango[1]} ton/día</p>
      <p>Temporalidad: {calc.es_temporal ? 'Temporal' : 'Permanente'}</p>
    </details>
  )
}

function Badge({ label, tone }: { label: string; tone: 'amber' | 'emerald' | 'gray' }) {
  const map = {
    amber: 'bg-amber-100 text-amber-900 border border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
    gray: 'bg-[#F0EDE5] text-[#6B6760] border border-[#E8E4DC]',
  } as const
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] rounded ${map[tone]}`}>
      {label}
    </span>
  )
}
