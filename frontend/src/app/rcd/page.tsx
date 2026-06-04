'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, TrendingUp, Percent, DollarSign, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { FormInput } from '@/components/forms/FormInput'
import { FormButton } from '@/components/forms/FormButton'
import { getApiUrl } from '@/lib/api'

interface Fraccion {
  id: string
  codigo: string
  nombre: string
  categoria_principal: string
  reciclable: boolean
  recuperable: boolean
  precio_venta_recuperador_ton?: number
}

interface CompositionResult {
  ton_rcd_total: number
  ton_recuperables: number
  ton_reciclables: number
  ton_disposicion_final: number
  valor_economico_diario: number
  tasa_recuperacion_pct: number
  fracciones: Array<{
    fraccion_codigo: string
    pct: number
    ton_dia?: number
    recuperable: boolean
    reciclable: boolean
    valor_potencial_diario?: number
  }>
}

function RCDContent() {
  const [fracciones, setFracciones] = useState<Fraccion[]>([])
  const [tonDia, setTonDia] = useState('5.0')
  const [composicion, setComposicion] = useState<Record<string, string>>({})
  const [result, setResult] = useState<CompositionResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${getApiUrl()}/api/v1/rcd/fracciones`)
      .then(r => r.json())
      .then((data: Fraccion[]) => {
        setFracciones(data)
        // Initialize with equal distribution
        const initial: Record<string, string> = {}
        const pct = data.length > 0 ? (100 / data.length).toFixed(1) : '0'
        data.forEach(f => {
          initial[f.codigo] = pct
        })
        setComposicion(initial)
      })
      .catch(() => setError('Error cargando fracciones'))
      .finally(() => setLoading(false))
  }, [])

  const handleComposicionChange = (codigo: string, value: string) => {
    setComposicion(prev => ({ ...prev, [codigo]: value }))
  }

  async function handleAnalyze() {
    const tonNum = parseFloat(tonDia)
    if (isNaN(tonNum) || tonNum <= 0) {
      setError('Ingresa un valor válido de toneladas')
      return
    }

    const compObject: Record<string, number> = {}
    Object.entries(composicion).forEach(([codigo, pct]) => {
      const pctNum = parseFloat(pct)
      if (!isNaN(pctNum) && pctNum > 0) {
        compObject[codigo] = pctNum
      }
    })

    const total = Object.values(compObject).reduce((a, b) => a + b, 0)
    if (total <= 0 || Math.abs(total - 100) > 0.5) {
      setError(`La suma de porcentajes debe ser 100% (actual: ${total.toFixed(1)}%)`)
      return
    }

    setAnalyzing(true)
    setError('')

    try {
      const res = await fetch(`${getApiUrl()}/api/v1/rcd/analizar-composicion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toneladas_rcd_dia: tonNum,
          composicion: compObject,
        }),
      })
      if (!res.ok) throw new Error('Error en análisis')
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error en análisis')
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
      </div>
    )
  }

  const totalPct = Object.values(composicion).reduce((a, b) => a + parseFloat(b || 0), 0)
  const isValidComposition = Math.abs(totalPct - 100) < 0.1

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/hub"
          className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Análisis RCD</h1>
          <p className="text-[13px] text-[#6B6760]">Residuos de Construcción y Demolición — composición y recuperabilidad</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Input panel */}
        <div className="lg:col-span-1">
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5 space-y-4">
            <h2 className="text-[13px] font-semibold text-[#1C1B18]">Parámetros</h2>

            <FormInput
              label="Generación diaria RCD"
              type="number"
              step="0.1"
              min="0"
              value={tonDia}
              onChange={e => setTonDia(e.target.value)}
              hint="ton/día"
            />

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6B6760] mb-2">
                Composición de fracciones
              </p>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {fracciones.map(f => (
                  <div key={f.codigo} className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={composicion[f.codigo] || 0}
                      onChange={e => handleComposicionChange(f.codigo, e.target.value)}
                      className="flex-1 rounded-[6px] border border-[#E8E4DC] bg-white px-2 py-1 text-[11px] outline-none focus:border-[#3B6D11]"
                    />
                    <span className="text-[10px] font-semibold text-[#6B6760]">%</span>
                    <span className="text-[10px] text-[#A8A49C] w-16 text-right">{f.nombre.substring(0, 12)}…</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 rounded-[6px] bg-[#FAFAF8] px-2 py-1.5 text-[11px]">
                <p className={totalPct === 100 ? 'text-[#2D5409] font-semibold' : 'text-[#C0392B]'}>
                  Total: {totalPct.toFixed(1)}%
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-[8px] bg-[#FBEAEA] px-3 py-2 text-[10px] text-[#7B1F1F]">
                {error}
              </div>
            )}

            <FormButton
              fullWidth
              loading={analyzing}
              disabled={!isValidComposition || !tonDia}
              onClick={handleAnalyze}
            >
              Analizar composición
            </FormButton>
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2">
          {result ? (
            <div className="space-y-4">
              {/* Metrics cards */}
              <div className="grid gap-3 grid-cols-2">
                <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Percent size={14} className="text-[#3B6D11]" />
                    <span className="text-[10px] font-semibold text-[#8E8980]">Tasa recuperación</span>
                  </div>
                  <p className="text-[24px] font-bold text-[#3B6D11]">{result.tasa_recuperacion_pct}%</p>
                </div>

                <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-[#1A5FA8]" />
                    <span className="text-[10px] font-semibold text-[#8E8980]">Valor diario</span>
                  </div>
                  <p className="text-[24px] font-bold text-[#1A5FA8]">
                    ${result.valor_economico_diario.toLocaleString('es-MX')}
                  </p>
                </div>

                <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={14} className="text-[#2D5409]" />
                    <span className="text-[10px] font-semibold text-[#8E8980]">Recuperables</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#2D5409]">{result.ton_recuperables}</p>
                  <p className="text-[10px] text-[#A8A49C]">ton/día</p>
                </div>

                <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Trash2 size={14} className="text-[#C0392B]" />
                    <span className="text-[10px] font-semibold text-[#8E8980]">Disposición final</span>
                  </div>
                  <p className="text-[20px] font-bold text-[#C0392B]">{result.ton_disposicion_final}</p>
                  <p className="text-[10px] text-[#A8A49C]">ton/día</p>
                </div>
              </div>

              {/* Composition breakdown */}
              <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                <h3 className="text-[12px] font-semibold text-[#1C1B18] mb-3">Desglose por fracción</h3>
                <div className="space-y-2">
                  {result.fracciones.map(frac => {
                    const fracDef = fracciones.find(f => f.codigo === frac.fraccion_codigo)
                    return (
                      <div key={frac.fraccion_codigo} className="rounded-[8px] border border-[#F0EDE5] bg-[#FAFAF8] p-2.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-[11px] font-semibold text-[#1C1B18]">
                            {fracDef?.nombre || frac.fraccion_codigo}
                          </p>
                          <span className="text-[12px] font-bold text-[#3B6D11]">{frac.pct}%</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <div>
                            <p className="text-[#6B6760]">{frac.ton_dia} ton/día</p>
                            {frac.valor_potencial_diario && (
                              <p className="text-[#2D5409] font-semibold">
                                ${frac.valor_potencial_diario.toLocaleString('es-MX')}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {frac.recuperable && (
                              <span className="rounded-full bg-[#EAF3DE] px-1.5 py-0.5 text-[9px] font-semibold text-[#2D5409]">
                                Recuperable
                              </span>
                            )}
                            {frac.reciclable && (
                              <span className="rounded-full bg-[#E8F0FB] px-1.5 py-0.5 text-[9px] font-semibold text-[#1A5FA8]">
                                Reciclable
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <p className="text-[10px] text-[#A8A49C]">
                RCD Fracción · Sprint 40-42 · Análisis de composición y recuperabilidad
              </p>
            </div>
          ) : (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-12 text-center">
              <Trash2 size={32} className="mx-auto mb-3 text-[#A8A49C]" />
              <p className="text-[13px] font-semibold text-[#1C1B18]">Ingresa parámetros para analizar</p>
              <p className="mt-1 text-[12px] text-[#8E8980]">
                Define la generación diaria y composición de tus residuos de construcción.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function RCDPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <RCDContent />
      </Suspense>
    </AppShell>
  )
}
