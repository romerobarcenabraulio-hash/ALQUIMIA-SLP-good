'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, TrendingUp, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface Generador {
  id: string
  nombre: string
  tipo: string
  municipio: string
  capacidad_generacion_ton_mes?: number
  materiales_generados?: string[]
  activo: boolean
}

interface ResidueRecord {
  id: string
  generador_id: string
  fecha_generacion: string
  cantidad_total_tons: number
  validado: boolean
  es_outlier: boolean
  confianza_pct: number
  created_at: string
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function ResidueRecordingContent() {
  const [generadores, setGeneradores] = useState<Generador[]>([])
  const [selectedGenerador, setSelectedGenerador] = useState<Generador | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [records, setRecords] = useState<ResidueRecord[]>([])

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    cantidad_total_tons: '',
    materiales: {} as Record<string, string>,
  })

  const tenantId = typeof window !== 'undefined'
    ? sessionStorage.getItem('alquimia_active_tenant_id') || ''
    : ''

  async function loadGeneradores() {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/generadores?activo=true`, {
        headers: authHdr(),
      })
      const data = await res.json()
      setGeneradores(data.generadores || [])
    } catch (e) {
      console.error('Error loading generadores:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadRecords(generadorId: string) {
    try {
      const res = await fetch(
        `${getApiUrl()}/api/v1/generadores/${generadorId}/residues?limit=30`,
        { headers: authHdr() }
      )
      const data = await res.json()
      setRecords(data.records || [])
    } catch (e) {
      console.error('Error loading records:', e)
    }
  }

  useEffect(() => {
    loadGeneradores()
  }, [tenantId])

  useEffect(() => {
    if (selectedGenerador) {
      loadRecords(selectedGenerador.id)
      initializeMaterials(selectedGenerador.materiales_generados || [])
    }
  }, [selectedGenerador])

  function initializeMaterials(materials: string[]) {
    const mats: Record<string, string> = {}
    materials.forEach(m => { mats[m] = '' })
    setFormData(prev => ({ ...prev, materiales: mats }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedGenerador) return

    setSaving(true)
    try {
      // Validate total
      const total = parseFloat(formData.cantidad_total_tons)
      if (isNaN(total) || total <= 0) {
        alert('Cantidad debe ser mayor a 0')
        setSaving(false)
        return
      }

      // Validate materials sum
      const suma = Object.values(formData.materiales).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
      const diferencia = Math.abs(suma - total) / total * 100
      if (diferencia > 10) {
        const proceed = confirm(
          `⚠️ La suma de materiales (${suma}) difiere ${diferencia.toFixed(1)}% del total (${total}).\n\n¿Continuar?`
        )
        if (!proceed) {
          setSaving(false)
          return
        }
      }

      const res = await fetch(
        `${getApiUrl()}/api/v1/generadores/${selectedGenerador.id}/residues`,
        {
          method: 'POST',
          headers: authHdr(),
          body: JSON.stringify({
            fecha_generacion: formData.fecha,
            cantidad_total_tons: total,
            materiales_json: Object.fromEntries(
              Object.entries(formData.materiales)
                .filter(([, v]) => v)
                .map(([k, v]) => [k, parseFloat(v)])
            ),
          }),
        }
      )

      if (res.ok) {
        setShowForm(false)
        setFormData({
          fecha: new Date().toISOString().split('T')[0],
          cantidad_total_tons: '',
          materiales: selectedGenerador.materiales_generados?.reduce((acc, m) => ({ ...acc, [m]: '' }), {}) || {},
        })
        loadRecords(selectedGenerador.id)
      }
    } catch (e) {
      console.error('Error saving:', e)
      alert('Error al guardar registro')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/hub" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Registro de Residuos</h1>
          <p className="text-[13px] text-[#6B6760]">Ingresa datos diarios de generación</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main area */}
        <div>
          {/* Generador selector */}
          {!selectedGenerador ? (
            <div>
              <h2 className="mb-3 text-[13px] font-semibold text-[#1C1B18]">Selecciona generador</h2>
              <div className="space-y-2">
                {generadores.map(g => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenerador(g)}
                    className="w-full rounded-[12px] border border-[#E8E4DC] bg-white p-4 text-left hover:border-[#3B6D11] transition-colors"
                  >
                    <p className="text-[13px] font-semibold text-[#1C1B18]">{g.nombre}</p>
                    <p className="text-[11px] text-[#6B6760]">{g.tipo} · {g.municipio}</p>
                  </button>
                ))}
                {generadores.length === 0 && (
                  <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-6 text-center">
                    <p className="text-[13px] text-[#8E8980]">Sin generadores registrados</p>
                    <Link href="/hub/generadores" className="text-[12px] text-[#3B6D11] hover:underline mt-2 inline-block">
                      Crear generador →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected generador header */}
              <div className="flex items-start justify-between rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                <div>
                  <p className="text-[13px] font-semibold text-[#1C1B18]">{selectedGenerador.nombre}</p>
                  <p className="text-[11px] text-[#6B6760]">{selectedGenerador.municipio}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedGenerador(null)
                    setShowForm(false)
                  }}
                  className="text-[12px] text-[#6B6760] hover:text-[#1C1B18] underline"
                >
                  Cambiar
                </button>
              </div>

              {/* Form */}
              {showForm && (
                <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                  <h2 className="mb-4 text-[13px] font-semibold text-[#1C1B18]">Nuevo Registro</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B6760] mb-1">Fecha</label>
                      <input
                        type="date"
                        value={formData.fecha}
                        onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
                      />
                    </div>

                    {/* Total quantity */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#6B6760] mb-1">Total (tons)</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={formData.cantidad_total_tons}
                        onChange={e => setFormData({ ...formData, cantidad_total_tons: e.target.value })}
                        placeholder="0.0"
                        className="w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
                      />
                    </div>

                    {/* Materials */}
                    {Object.keys(formData.materiales).length > 0 && (
                      <div>
                        <label className="block text-[11px] font-semibold text-[#6B6760] mb-2">Desglose de materiales</label>
                        <div className="space-y-2">
                          {Object.entries(formData.materiales).map(([material, value]) => (
                            <div key={material}>
                              <label className="text-[10px] text-[#6B6760]">{material} (tons)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                value={value}
                                onChange={e => setFormData({
                                  ...formData,
                                  materiales: { ...formData.materiales, [material]: e.target.value }
                                })}
                                className="w-full rounded-[8px] border border-[#E8E4DC] px-2 py-1.5 text-[11px] outline-none focus:border-[#3B6D11]"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={saving || !formData.cantidad_total_tons}
                        className="flex-1 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2d5409] transition-colors disabled:opacity-40"
                      >
                        {saving ? <Loader2 size={12} className="inline animate-spin mr-1" /> : ''}Guardar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] text-[#6B6760] hover:bg-[#F0EDE5] transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Add button or records list */}
              {!showForm && (
                <button
                  onClick={() => setShowForm(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-[8px] border border-[#3B6D11] bg-[#EAF3DE] px-3 py-2 text-[12px] font-semibold text-[#3B6D11] hover:bg-[#3B6D11] hover:text-white transition-colors"
                >
                  <Plus size={14} />
                  Nuevo Registro
                </button>
              )}

              {/* Records */}
              {records.length > 0 && (
                <div>
                  <h2 className="mb-3 text-[13px] font-semibold text-[#1C1B18]">Registros recientes</h2>
                  <div className="space-y-2">
                    {records.map(r => (
                      <div key={r.id} className="rounded-[8px] border border-[#E8E4DC] bg-white p-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-mono font-semibold text-[#3B6D11]">{r.cantidad_total_tons} tons</span>
                              {r.es_outlier && (
                                <span className="flex items-center gap-1 text-[10px] text-[#D97706] font-semibold">
                                  <AlertCircle size={10} /> Outlier
                                </span>
                              )}
                              {r.validado && (
                                <span className="flex items-center gap-1 text-[10px] text-[#3B6D11] font-semibold">
                                  <CheckCircle2 size={10} /> Validado
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-[#6B6760] mt-0.5">{r.fecha_generacion}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-[#6B6760]">Confianza</p>
                            <p className="text-[12px] font-bold text-[#3B6D11]">{r.confianza_pct}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        {selectedGenerador && (
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-3">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Capacidad</p>
              <p className="text-[16px] font-bold text-[#3B6D11]">{selectedGenerador.capacidad_generacion_ton_mes || '—'}</p>
              <p className="text-[10px] text-[#6B6760]">tons/mes</p>
            </div>

            {/* Latest record */}
            {records.length > 0 && (
              <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-3">
                <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Último registro</p>
                <p className="text-[14px] font-bold text-[#1C1B18]">{records[0].cantidad_total_tons}</p>
                <p className="text-[10px] text-[#6B6760]">{records[0].fecha_generacion}</p>
              </div>
            )}

            {/* Material types */}
            {selectedGenerador.materiales_generados && selectedGenerador.materiales_generados.length > 0 && (
              <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-3">
                <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Materiales</p>
                <div className="space-y-1">
                  {selectedGenerador.materiales_generados.map(m => (
                    <span key={m} className="block text-[10px] text-[#6B6760]">· {m}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ResidueRecordingPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <ResidueRecordingContent />
      </Suspense>
    </AppShell>
  )
}
