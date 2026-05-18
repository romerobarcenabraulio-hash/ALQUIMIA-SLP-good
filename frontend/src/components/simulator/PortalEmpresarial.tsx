'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { getOrganizationalAssessment } from '@/lib/api'
import { getZmRecord } from '@/lib/zmPopulationScale'
import {
  CHECKLIST_REFERENCIA_POR_GIRO,
  GIRO_OPCIONES,
  etiquetaGiro,
  variablesDefaultGiro,
} from '@/lib/portalEmpresaBasico'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { TraceRibbon } from '@/components/ui/TraceRibbon'
import { CORTE_UI } from '@/lib/progresionUiConstants'
import type {
  Action30_60_90,
  OrganizationalCircularityRequest,
  OrganizationalCircularityResponse,
  OrganizationActivityType,
} from '@/types'

function plazoTexto(p: Action30_60_90['plazo']): string {
  switch (p) {
    case '30_dias':
      return '30 días'
    case '60_dias':
      return '60 días'
    case '90_dias':
      return '90 días'
    default:
      return p
  }
}

function accionesToStrings(actions: Action30_60_90[]): string[] {
  return actions.map(a => `${plazoTexto(a.plazo)} — ${a.accion}`)
}

function buildChecklistItems(
  giro: OrganizationActivityType,
  result: OrganizationalCircularityResponse | null,
): string[] {
  const fromApi = result ? accionesToStrings(result.acciones_30_60_90) : []
  const checklistReferencia = CHECKLIST_REFERENCIA_POR_GIRO[giro] ?? CHECKLIST_REFERENCIA_POR_GIRO.empresa
  const merged: string[] = []
  const seen = new Set<string>()
  for (const s of [...fromApi, ...checklistReferencia]) {
    const k = s.trim()
    if (!k || seen.has(k)) continue
    seen.add(k)
    merged.push(k)
    if (merged.length >= 8) break
  }
  return merged
}

function useTresKpisPlan() {
  const resultados = useSimulatorStore(s => s.resultados)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)

  return useMemo(() => {
    if (!resultados) {
      return {
        pctSeparacion: null as number | null,
        reduccionRellenoPct: null as number | null,
        ahorroMxn: null as number | null,
      }
    }
    const idx = Math.max(0, Math.min(pctCapturaPorAño.length - 1, horizonte - 1))
    const pctSeparacion = pctCapturaPorAño[idx] ?? pctCapturaPorAño[pctCapturaPorAño.length - 1] ?? 0
    const ultimo = resultados.serieAnual[resultados.serieAnual.length - 1]
    const volCaptDia = ultimo
      ? Object.values(ultimo.volTonDia).reduce((s, v) => s + (v ?? 0), 0)
      : 0
    const rsuDia = resultados.rsuTotalTonDia
    const reduccionRellenoPct =
      rsuDia > 0 ? Math.min(100, Math.max(0, Math.round((volCaptDia / rsuDia) * 100))) : 0
    const ahorroMxn = resultados.ahorroDisposicion
    return { pctSeparacion, reduccionRellenoPct, ahorroMxn }
  }, [resultados, horizonte, pctCapturaPorAño])
}

export function PortalEmpresarial() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const resultados = useSimulatorStore(s => s.resultados)
  const municipioId = municipiosActivos[0] ?? ''

  const [giro, setGiro] = useState<OrganizationActivityType>('empresa')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<OrganizationalCircularityResponse | null>(null)
  const [lastPayload, setLastPayload] = useState<OrganizationalCircularityRequest | null>(null)

  const kpis = useTresKpisPlan()

  const payload = useMemo((): OrganizationalCircularityRequest | null => {
    if (!municipioId || !resultados) return null
    const zm = getZmRecord(zmActiva)
    const mun = zm.municipios.find(m => m.id === municipioId)
    const nombreRaw = mun?.nombre ?? zm.nombre.replace(/^ZM\s+/i, '').trim()
    const nombre = nombreRaw || `Municipio ${municipioId}`
    const empleados = Math.max(40, Math.round(resultados.empleosTotalesDirectos || 120))
    return {
      organization_id: `plan-global-${municipioId}`,
      tipo_actividad: giro,
      municipio_id: municipioId,
      nombre,
      empleados,
      variables: variablesDefaultGiro(giro),
    }
  }, [municipioId, resultados, zmActiva, giro])

  const payloadKey = useMemo(() => (payload ? JSON.stringify(payload) : ''), [payload])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setResult(null)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    const p = payload
    if (!p) return
    let active = true
    setLoading(true)
    setLastPayload(p)
    void getOrganizationalAssessment(p)
      .then(data => {
        if (!active) return
        setResult(data)
        setError(null)
      })
      .catch(err => {
        if (!active) return
        setResult(null)
        setError(err instanceof Error ? err.message : 'Incidencia operativa al evaluar circularidad organizacional')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [payloadKey, payload])

  async function runAssessment(p: OrganizationalCircularityRequest) {
    setLoading(true)
    setError(null)
    setLastPayload(p)
    try {
      const data = await getOrganizationalAssessment(p)
      setResult(data)
    } catch (err) {
      setResult(null)
      setError(err instanceof Error ? err.message : 'Incidencia operativa al evaluar circularidad organizacional')
    } finally {
      setLoading(false)
    }
  }

  const checklistItems = useMemo(() => buildChecklistItems(giro, result), [giro, result])

  const isEmpty = !loading && !error && !result && payload === null

  return (
    <section className="space-y-5 rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5 shadow-[0_1px_0_rgba(28,27,24,0.03)]">
      <header>
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C]">Empresa · plan operativo básico</p>
        <h2 className="mt-1 font-serif text-[24px] text-[#1C1B18]">Plan por giro (vista resumida)</h2>
        <ScopeAnclaKicker className="mt-2" />
        <p className="mt-2 text-[12px] leading-relaxed text-[#6B6760]">
          Lectura accionable alineada al escenario municipal; sin tableros analíticos extendidos.
        </p>
        <p className="mt-3 text-[10px] leading-snug text-[#8A857C]">
          Módulo básico de transición. Plataforma empresarial avanzada se desarrolla aparte.
        </p>
      </header>

      <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-3">
        <label htmlFor="empresa-giro" className="text-[11px] font-medium uppercase tracking-[0.06em] text-[#A8A49C]">
          Giro seleccionado
        </label>
        <select
          id="empresa-giro"
          value={giro}
          onChange={e => setGiro(e.target.value as OrganizationActivityType)}
          className="mt-2 w-full max-w-md rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] text-[#1C1B18]"
        >
          {GIRO_OPCIONES.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-[11px] text-[#8A857C]">
          Municipio de anclaje: <span className="font-mono text-[#6B6760]">{municipioId || '—'}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label="% separación objetivo (plan)"
          value={kpis.pctSeparacion != null ? `${Math.round(kpis.pctSeparacion)}%` : '—'}
          hint="Último año del horizonte en el simulador."
          formula="pct_captura_por_año[horizonte]"
        />
        <KpiTile
          label="Reducción a relleno (modelo)"
          value={kpis.reduccionRellenoPct != null ? `${kpis.reduccionRellenoPct}%` : '—'}
          hint="Captura modelada vs. generación diaria RSU."
          formula="captura_modelada / RSU_total"
        />
        <KpiTile
          label="Ahorro estimado disposición"
          value={kpis.ahorroMxn != null ? fmt.mxnM(kpis.ahorroMxn) : '—'}
          hint="Suma del escenario (simulación)."
          formula="ton_desviadas * costo_disposición_evitable"
        />
      </div>

      <TraceRibbon
        hecho="El plan empresarial se ancla al municipio activo y al escenario RSU municipal vigente en el simulador."
        supuesto="La organización adopta el mismo horizonte y metas del plan municipal, ajustadas por giro y generación declarada."
        fuente="ALQUIMIA · simulador municipal, baseline RSU y evaluación organizacional conectada."
        formula="KPIs empresariales = escenario municipal + variables por giro + checklist de acciones 30/60/90."
        corte={CORTE_UI}
        confianza="medio"
      />

      {!loading && error && lastPayload && (
        <button
          type="button"
          onClick={() => void runAssessment(lastPayload)}
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-4 py-2 text-[12px] text-[#1C1B18]"
        >
          Reintentar evaluación
        </button>
      )}

      {loading && <LoadingState />}
      {isEmpty && <EmptyState />}
      {!loading && error && !isEmpty && <ErrorState message={error ?? ''} />}
      {!loading && result?.status === 'blocked' && <BlockedState result={result} />}
      {!loading && result && result.status !== 'blocked' && (
        <ReadyBasico
          giro={giro}
          checklistItems={checklistItems}
          warnings={result.warnings}
          proveedor={result.proveedor_ambiental_requerido}
        />
      )}

      <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-4 py-4">
        <p className="text-[12px] font-medium text-[#1C1B18]">Siguiente paso</p>
        <p className="mt-1 text-[11px] text-[#6B6760]">
          El borrador descargable incluye anexos del simulador municipal. Avance al módulo de exportación o use el vínculo
          directo.
        </p>
        <a
          href="#sim-export-empresa-plan"
          className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#1C1B18] bg-[#1C1B18] px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#3B6D11] hover:border-[#3B6D11]"
        >
          <Download className="h-4 w-4" aria-hidden />
          Descargar plan por giro (borrador operativo)
        </a>
      </div>

      <p className="text-[10px] text-[#A8A49C]">
        Módulo básico de transición. Plataforma empresarial avanzada se desarrolla aparte.
      </p>
    </section>
  )
}

function KpiTile({ label, value, hint, formula }: { label: string; value: string; hint: string; formula: string }) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-3" title={formula}>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 font-mono text-[20px] font-semibold text-[#1C1B18]">{value}</p>
      <p className="mt-1 text-[10px] leading-snug text-[#8A857C]">{hint}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-3 rounded-[10px] border border-[#E8E4DC] bg-[#FAF8F4] px-4 py-4 text-[13px] text-[#6B6760]"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#C8C2B8] border-t-[#3B6D11]" aria-hidden />
      <span>
        Generando lectura operativa para <span className="font-medium text-[#1C1B18]">giro</span> seleccionado…
      </span>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[10px] border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      Completa el simulador principal (municipio y resultados RSU) para enlazar este plan por giro.
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return <div className="rounded-[10px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">{message}</div>
}

function BlockedState({ result }: { result: OrganizationalCircularityResponse }) {
  return (
    <div className="rounded-[10px] border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">Evaluación bloqueada</p>
      {result.blockers.map(b => (
        <p key={b} className="mt-1 text-[12px] text-amber-800">
          {b}
        </p>
      ))}
      <p className="mt-2 text-[12px] text-[#6B6760]">{result.next_action}</p>
    </div>
  )
}

function ReadyBasico({
  giro,
  checklistItems,
  warnings,
  proveedor,
}: {
  giro: OrganizationActivityType
  checklistItems: string[]
  warnings: string[]
  proveedor: boolean
}) {
  const [done, setDone] = useState<Record<number, boolean>>({})

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <div className="rounded-[10px] border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
          {warnings.map(w => (
            <p key={w}>{w}</p>
          ))}
        </div>
      )}

      {proveedor && (
        <div className="rounded-[10px] border border-amber-300 bg-amber-50 p-3 text-[12px] text-amber-900">
          Puede requerirse proveedor ambiental autorizado para corrientes no RSU. Validar con el municipio.
        </div>
      )}

      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[12px] font-semibold text-[#1C1B18]">
          Checklist operativo · <span className="font-normal text-[#6B6760]">{etiquetaGiro(giro)}</span>
        </p>
        <p className="mt-1 text-[11px] text-[#8A857C]">Marca avance local (no se guarda en servidor).</p>
        <ul className="mt-3 space-y-2">
          {checklistItems.map((texto, i) => (
            <li key={`${i}-${texto.slice(0, 24)}`}>
              <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-[#1C1B18]">
                <input
                  type="checkbox"
                  checked={Boolean(done[i])}
                  onChange={e => setDone(d => ({ ...d, [i]: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C8C2B8] text-[#3B6D11] accent-[#3B6D11]"
                />
                <span>{texto}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
