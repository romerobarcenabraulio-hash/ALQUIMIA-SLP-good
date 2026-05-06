'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  FileDown,
  Loader2,
  Search,
} from 'lucide-react'
import type { DeclaracionGeneracionRSU, GiroScian } from '@/types'
import {
  confirmarDeclaracionGeneracion,
  createDeclaracionGeneracion,
  fetchWithRetry,
  getScianFactors,
  perfilGeneracionPdfUrl,
} from '@/lib/api'
import { ZMS } from '@/lib/constants'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'

const MATERIAL_KEYS = ['organico', 'papel', 'plastico', 'vidrio', 'aluminio', 'otros'] as const

const FREQ_LABEL: Record<string, string> = {
  diaria: 'Recolección sugerida: diaria',
  '2x_semana': 'Recolección sugerida: 2× por semana',
  semanal: 'Recolección sugerida: semanal',
  quincenal: 'Recolección sugerida: quincenal',
}

function suggestFreq(tonAnio: number): DeclaracionGeneracionRSU['frecuencia_recoleccion_req'] {
  if (tonAnio >= 50) return 'diaria'
  if (tonAnio >= 15) return '2x_semana'
  if (tonAnio >= 5) return 'semanal'
  return 'quincenal'
}

function normalizePctSix(raw: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {}
  let s = 0
  for (const k of MATERIAL_KEYS) {
    const v = Math.max(0, Number(raw[k] ?? 0))
    base[k] = v
    s += v
  }
  if (s <= 0) {
    for (const k of MATERIAL_KEYS) base[k] = 100 / MATERIAL_KEYS.length
    s = 100
  }
  const out: Record<string, number> = {}
  for (const k of MATERIAL_KEYS) out[k] = (base[k] / s) * 100
  return out
}

function pctToFraction(pct: Record<string, number>): Record<string, number> {
  const s = MATERIAL_KEYS.reduce((a, k) => a + pct[k], 0) || 100
  const o: Record<string, number> = {}
  for (const k of MATERIAL_KEYS) o[k] = pct[k] / s
  return o
}

export function DeclaracionWizard() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const municipioId = municipiosActivos[0] ?? ''

  const zm = useMemo(() => ZMS.find(z => z.id === zmActiva), [zmActiva])
  const municipioNombre = useMemo(() => {
    const m = zm?.municipios.find(x => x.id === municipioId)
    return m?.nombre ?? (municipioId !== '' ? municipioId : '(sin municipio)')
  }, [zm, municipioId])

  const [step, setStep] = useState(0)
  const [factors, setFactors] = useState<GiroScian[]>([])
  const [loadFactors, setLoadFactors] = useState(true)
  const [factorErr, setFactorErr] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<GiroScian | null>(null)
  const [empresaNombre, setEmpresaNombre] = useState('')
  const [rfc, setRfc] = useState('')
  const [produccion, setProduccion] = useState<number>(1000)
  const [pctMat, setPctMat] = useState<Record<string, number>>(() =>
    normalizePctSix({ organico: 45, papel: 20, plastico: 15, vidrio: 5, aluminio: 2.5, otros: 12.5 }),
  )
  const [tienePlan, setTienePlan] = useState(false)
  const [notas, setNotas] = useState('')
  const [declaracion, setDeclaracion] = useState<DeclaracionGeneracionRSU | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    let ok = true
    getScianFactors()
      .then(rows => {
        if (!ok) return
        setFactors(rows)
        setFactorErr(null)
      })
      .catch(() => {
        if (ok) setFactorErr('No se pudo cargar el catálogo de giros. Intenta de nuevo.')
      })
      .finally(() => {
        if (ok) setLoadFactors(false)
      })
    return () => {
      ok = false
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return factors
    return factors.filter(
      g =>
        g.descripcion.toLowerCase().includes(q) ||
        g.sector.toLowerCase().includes(q) ||
        g.giro_codigo.includes(q),
    )
  }, [factors, search])

  const fractions = useMemo(() => pctToFraction(pctMat), [pctMat])

  const preview = useMemo(() => {
    if (!selected || produccion <= 0) return null
    const totalKg = produccion * selected.factor_generacion_kg_por_unidad
    const gen: Record<string, number> = {}
    for (const k of MATERIAL_KEYS) {
      gen[k] = (totalKg * fractions[k]) / 1000
    }
    const totalTon = Object.values(gen).reduce((a, b) => a + b, 0)
    return { gen, totalTon, freq: suggestFreq(totalTon) }
  }, [selected, produccion, fractions])

  const updatePct = useCallback((key: string, v: number) => {
    setPctMat(prev => normalizePctSix({ ...prev, [key]: v }))
  }, [])

  const pctSum = MATERIAL_KEYS.reduce((a, k) => a + pctMat[k], 0)

  async function submitBorrador() {
    if (!selected || !municipioId || !empresaNombre.trim()) return
    setBusy(true)
    setErr(null)
    try {
      const comp = pctToFraction(pctMat)
      const created = await createDeclaracionGeneracion({
        empresa_nombre: empresaNombre.trim(),
        rfc: rfc.trim() || null,
        municipio_id: municipioId,
        zm: zmActiva,
        giro_scian: selected.giro_codigo,
        produccion_anual: produccion,
        composicion_materiales: comp,
        frecuencia_recoleccion_req: preview?.freq ?? undefined,
        tiene_plan_manejo: tienePlan,
        notas: notas.trim() || null,
      })
      setDeclaracion(created)
      setConfirmed(created.status === 'confirmada')
      setStep(3)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error al enviar el perfil.')
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmar() {
    if (!declaracion) return
    setBusy(true)
    setErr(null)
    try {
      const u = await confirmarDeclaracionGeneracion(declaracion.declaracion_id)
      setDeclaracion(u)
      setConfirmed(true)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('alq-refresh-voluntarias'))
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'No se pudo confirmar.')
    } finally {
      setBusy(false)
    }
  }

  async function handlePdf() {
    if (!declaracion) return
    setBusy(true)
    setErr(null)
    try {
      const url = perfilGeneracionPdfUrl(declaracion.declaracion_id)
      const res = await fetchWithRetry(url, { method: 'GET' })
      if (!res.ok) throw new Error(`PDF no disponible (${res.status})`)
      const blob = await res.blob()
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `perfil_generacion_rsu_${declaracion.declaracion_id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(a.href)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Descarga fallida.')
    } finally {
      setBusy(false)
    }
  }

  const canNext1 = empresaNombre.trim().length > 0 && selected !== null
  const canNext2 = produccion > 0 && Math.abs(pctSum - 100) <= 0.5

  return (
    <div className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-4">
      <div className="flex items-start gap-3">
        <Building2 className="h-6 w-6 text-[#3B6D11] shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#A8A49C]">Q-017 · Estimación voluntaria</p>
          <h3 className="mt-1 font-serif text-[20px] text-[#1C1B18]">Perfil de Generación Estimada RSU</h3>
          <p className="mt-1 text-[12px] text-[#6B6760] max-w-2xl leading-relaxed">
            Flujo orientativo para cuantificar RSU no peligroso por giro. Los factores son ilustrativos;
            sustituye con datos propios cuando los tengas.
          </p>
        </div>
      </div>

      <ol className="flex flex-wrap gap-2 text-[11px] text-[#6B6760]">
        {['Identificación', 'Producción', 'Revisión', 'Descarga'].map((label, i) => (
          <li
            key={label}
            className={cn(
              'rounded-full px-3 py-1 border',
              step === i ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#23470A]' : 'border-[#E8E4DC] bg-white',
            )}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {factorErr && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{factorErr}</div>
      )}
      {err && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{err}</div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <label className="block text-[13px]">
            <span className="text-[#6B6760]">Nombre de la organización</span>
            <input
              value={empresaNombre}
              onChange={e => setEmpresaNombre(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-3 py-2 text-sm"
              placeholder="Ej. Mi negocio S.A. de C.V."
            />
          </label>
          <label className="block text-[13px]">
            <span className="text-[#6B6760]">RFC (opcional)</span>
            <input
              value={rfc}
              onChange={e => setRfc(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-3 py-2 text-sm"
            />
          </label>
          <div>
            <span className="text-[13px] text-[#6B6760]">Municipio activo (simulador)</span>
            <div className="mt-1 rounded-lg border border-[#E8E4DC] bg-[#FAF8F4] px-3 py-2 text-sm text-[#1C1B18]">
              {municipioNombre} <span className="text-[#A8A49C]">({municipioId || '—'})</span>
            </div>
          </div>

          <div>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#A8A49C]" aria-hidden />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar giro por nombre o código…"
                className="w-full rounded-lg border border-[#DAD3C7] pl-9 pr-3 py-2 text-sm"
              />
            </div>
            {loadFactors ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-[#6B6760]">
                <Loader2 className="h-4 w-4 animate-spin" /> Cargando catálogo…
              </p>
            ) : (
              <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-[#E8E4DC] divide-y divide-[#F0EDE5]">
                {filtered.map(g => (
                  <li key={g.giro_codigo}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(g)
                        setPctMat(
                          normalizePctSix(
                            Object.fromEntries(
                              MATERIAL_KEYS.map(k => [
                                k,
                                (g.composicion_tipica[k] ?? 0) * 100,
                              ]),
                            ),
                          ),
                        )
                      }}
                      className={cn(
                        'w-full text-left px-3 py-2 text-sm hover:bg-[#F5F2EC] transition-colors',
                        selected?.giro_codigo === g.giro_codigo && 'bg-[#EAF3DE]',
                      )}
                    >
                      <span className="font-mono text-xs text-[#3B6D11]">{g.giro_codigo}</span>{' '}
                      {g.descripcion}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selected && (
            <p className="text-[13px] text-[#6B6760]">
              Factor base (referencia):{' '}
              <strong className="text-[#1C1B18]">{selected.factor_generacion_kg_por_unidad}</strong> kg RSU por{' '}
              <strong className="text-[#1C1B18]">{selected.unidad_produccion}</strong>
              <span className="block text-[11px] text-[#A8A49C] mt-1">Fuente: {selected.fuente}</span>
            </p>
          )}

          <button
            type="button"
            disabled={!canNext1 || !municipioId}
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Continuar <ChevronRight className="h-4 w-4" />
          </button>
          {!municipioId && (
            <p className="text-xs text-amber-800">Selecciona un municipio en el simulador para continuar.</p>
          )}
        </div>
      )}

      {step === 1 && selected && (
        <div className="space-y-4">
          <label className="block text-[13px]">
            <span className="text-[#6B6760]">
              Producción anual ({selected.unidad_produccion})
            </span>
            <input
              type="number"
              min={0.0001}
              step="any"
              value={produccion}
              onChange={e => setProduccion(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-3 py-2 text-sm"
            />
          </label>

          <div>
            <p className="text-[13px] font-medium text-[#1C1B18] mb-2">Participación por material (% — suma {pctSum.toFixed(1)}%)</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MATERIAL_KEYS.map(k => (
                <label key={k} className="text-[12px] text-[#6B6760]">
                  {k}
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={Math.round(pctMat[k] * 10) / 10}
                    onChange={e => updatePct(k, Number(e.target.value))}
                    className="mt-1 w-full rounded border border-[#DAD3C7] px-2 py-1 text-sm"
                  />
                </label>
              ))}
            </div>
            {Math.abs(pctSum - 100) > 0.5 && (
              <p className="text-xs text-amber-800 mt-2">Ajusta porcentajes para acercarte a 100%.</p>
            )}
          </div>

          {preview && (
            <div className="rounded-lg border border-[#E8E4DC] overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF8F4] text-xs text-[#8A857C]">
                  <tr>
                    <th className="text-left py-2 px-3">Material</th>
                    <th className="text-right py-2 px-3">t/año (estimado)</th>
                  </tr>
                </thead>
                <tbody>
                  {MATERIAL_KEYS.map(k => (
                    <tr key={k} className="border-t border-[#F0EDE5]">
                      <td className="py-2 px-3">{k}</td>
                      <td className="py-2 px-3 text-right font-mono">{preview.gen[k].toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="px-3 py-2 bg-[#F5F2EC] text-sm">
                Total estimado: <strong>{preview.totalTon.toFixed(3)}</strong> ton/año
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(0)} className="rounded-lg border border-[#DAD3C7] px-4 py-2 text-sm">
              Atrás
            </button>
            <button
              type="button"
              disabled={!canNext2}
              onClick={() => setStep(2)}
              className="rounded-lg bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              Revisar
            </button>
          </div>
        </div>
      )}

      {step === 2 && selected && preview && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-[#F0EDE5] px-3 py-1 text-[11px] text-[#6B6760]">
              {FREQ_LABEL[preview.freq]}
            </span>
          </div>

          <div className="space-y-1">
            {MATERIAL_KEYS.map(k => {
              const p = preview.totalTon > 0 ? (preview.gen[k] / preview.totalTon) * 100 : 0
              return (
                <div key={k}>
                  <div className="flex justify-between text-xs text-[#6B6760]">
                    <span>{k}</span>
                    <span>{preview.gen[k].toFixed(3)} t/año</span>
                  </div>
                  <div className="h-2 rounded bg-[#E8E4DC] overflow-hidden">
                    <div className="h-full bg-[#3B6D11]" style={{ width: `${Math.min(100, p)}%` }} />
                  </div>
                </div>
              )
            })}
          </div>

          {preview.totalTon > 10 && (
            <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
              <p>
                Tu volumen estimado podría sujetarte a obligaciones COA SEMARNAT. Consulta a un especialista en
                residuos de manejo especial.
              </p>
            </div>
          )}

          <label className="flex items-center gap-2 text-[13px] text-[#6B6760] cursor-pointer">
            <input
              type="checkbox"
              checked={tienePlan}
              onChange={e => setTienePlan(e.target.checked)}
              className="rounded border-[#DAD3C7]"
            />
            ¿Cuenta con plan de manejo? (voluntario)
          </label>

          <label className="block text-[13px]">
            <span className="text-[#6B6760]">Notas internas (opcional)</span>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#DAD3C7] px-3 py-2 text-sm"
            />
          </label>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-[#DAD3C7] px-4 py-2 text-sm">
              Atrás
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitBorrador()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generar borrador y continuar
            </button>
          </div>
        </div>
      )}

      {step === 3 && declaracion && (
        <div className="space-y-4">
          <p className="text-sm text-[#6B6760]">
            Perfil registrado como borrador. Confírmalo para que aparezca en la lista municipal y descarga el PDF.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy || confirmed}
              onClick={() => void handleConfirmar()}
              className="rounded-lg bg-[#1C1B18] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {confirmed ? 'Perfil confirmado' : busy ? 'Procesando…' : 'Confirmar perfil'}
            </button>
            <button
              type="button"
              disabled={busy || !confirmed}
              onClick={() => void handlePdf()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#3B6D11] px-4 py-2 text-sm font-medium text-[#3B6D11] disabled:opacity-50"
            >
              <FileDown className="h-4 w-4" />
              Descargar PDF
            </button>
          </div>
          <p className="text-[11px] text-[#A8A49C] leading-relaxed">{declaracion.disclaimer_voluntaria}</p>
          <button type="button" onClick={() => setStep(0)} className="text-xs text-[#3B6D11] underline">
            Iniciar otro perfil
          </button>
        </div>
      )}
    </div>
  )
}
