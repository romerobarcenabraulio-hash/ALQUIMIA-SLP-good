'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, FileCheck2, Landmark, Plus, RefreshCw, ShieldCheck } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

type TenantStage = 'validation' | 'planning' | 'execution' | 'expansion'
type TierComercial = 'diagnostico' | 'implementacion' | 'operacion_completa'

interface TenantGate {
  gate_id: string
  status: string
  evidencia_url: string | null
  evidencia_label: string | null
  decisor_humano: string | null
  closed_at: string | null
}

interface TenantCapability {
  module_id: string
  active: boolean
  source: string
}

interface TenantAuditLog {
  id: string
  actor: string
  action: string
  payload: Record<string, unknown>
  created_at: string
}

interface AdminTenant {
  id: string
  nombre: string
  estado_mx: string
  municipio_id: string
  inegi_clave: string
  tier_comercial: TierComercial
  state: {
    current_stage: TenantStage
    transition_mode: string
    fecha_ingreso: string
    fecha_cambio_stage: string
  }
  gates: TenantGate[]
  capabilities: TenantCapability[]
  audit_log: TenantAuditLog[]
  municipal_profile?: {
    mode: string
    antecedentes: Record<string, unknown>
    mapa_social: Record<string, unknown>
    organigrama_servicio: Record<string, unknown>
    provenance_status: string
  }
}

const emptyForm = {
  nombre: '',
  estado_mx: '',
  municipio_id: '',
  inegi_clave: '',
  tier_comercial: 'diagnostico' as TierComercial,
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('alquimia_token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

function statusClass(status: string) {
  if (status === 'cerrado') return 'bg-[#EAF3DE] text-[#2F5B0D] border-[#C9DDB1]'
  if (status === 'en_revision') return 'bg-[#FEF7E7] text-[#8A5C05] border-[#F5DCA0]'
  if (status === 'fallido') return 'bg-[#FBEAEA] text-[#A8322A] border-[#EBC0BA]'
  return 'bg-[#FDFCFA] text-[#6B6760] border-[#E8E4DC]'
}

function sourceLabelFrom(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const source = (value as Record<string, unknown>).fuente
  if (!source || typeof source !== 'object') return ''
  return String((source as Record<string, unknown>).label ?? '')
}

function pendingSource(label: string) {
  return {
    valor: null,
    estado: 'pendiente_verificacion',
    fuente: {
      label: label || 'Pendiente carga de datos del municipio',
      status: 'pendiente_verificacion',
      fecha: new Date().toISOString().slice(0, 10),
    },
  }
}

function linesFromItems(items: unknown, fields: string[]) {
  if (!Array.isArray(items)) return ''
  return items.map(item => {
    const row = item && typeof item === 'object' ? item as Record<string, unknown> : {}
    return fields.map(field => String(row[field] ?? '')).join(' | ')
  }).join('\n')
}

function itemsFromLines(value: string, fields: string[], fallback: Record<string, unknown> = {}) {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|').map(part => part.trim())
      return fields.reduce<Record<string, unknown>>((acc, field, idx) => {
        acc[field] = parts[idx] || fallback[field] || 'pendiente_verificacion'
        return acc
      }, { ...fallback })
    })
}

export default function AdminPage() {
  const [tenants, setTenants] = useState<AdminTenant[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [evidence, setEvidence] = useState({
    gate_id: 'G1',
    evidencia_url: '',
    evidencia_label: '',
    decisor_humano: 'Founder',
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [profileDraft, setProfileDraft] = useState({
    antecedentes: '{}',
    mapa_social: '{"actores":[]}',
    organigrama_servicio: '{}',
    provenance_status: 'pendiente_verificacion',
  })

  const selected = useMemo(
    () => tenants.find(t => t.id === selectedId) ?? tenants[0] ?? null,
    [selectedId, tenants],
  )

  useEffect(() => {
    const profile = selected?.municipal_profile
    if (!profile) return
    setProfileDraft({
      antecedentes: JSON.stringify(profile.antecedentes ?? {}, null, 2),
      mapa_social: JSON.stringify(profile.mapa_social ?? { actores: [] }, null, 2),
      organigrama_servicio: JSON.stringify(profile.organigrama_servicio ?? {}, null, 2),
      provenance_status: profile.provenance_status ?? 'pendiente_verificacion',
    })
  }, [selected?.id, selected?.municipal_profile])

  async function loadTenants(nextSelectedId?: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants`, { headers: authHeaders() })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      const next = data.tenants ?? []
      setTenants(next)
      if (nextSelectedId) setSelectedId(nextSelectedId)
      else if (!selectedId && next[0]) setSelectedId(next[0].id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo cargar tenants')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTenants()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function createTenant() {
    setError(null)
    setMessage(null)
    const payload = { ...form, current_stage: 'validation' }
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setForm(emptyForm)
      setMessage(`Tenant creado: ${data.nombre}`)
      await loadTenants(data.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo crear tenant')
    }
  }

  async function registerEvidence() {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/gates/${evidence.gate_id}/evidence`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(evidence),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`Evidencia registrada para ${evidence.gate_id}`)
      await loadTenants(data.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo registrar evidencia')
    }
  }

  async function closeGate() {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/gates/${evidence.gate_id}/close`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          evidencia_url: evidence.evidencia_url || undefined,
          evidencia_label: evidence.evidencia_label || undefined,
          decisor_humano: evidence.decisor_humano,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`${evidence.gate_id} cerrado manualmente`)
      await loadTenants(data.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo cerrar gate')
    }
  }

  async function saveMunicipalProfile() {
    if (!selected) return
    setError(null)
    setMessage(null)
    try {
      const payload = {
        antecedentes: JSON.parse(profileDraft.antecedentes),
        mapa_social: JSON.parse(profileDraft.mapa_social),
        organigrama_servicio: JSON.parse(profileDraft.organigrama_servicio),
        provenance_status: profileDraft.provenance_status,
      }
      const res = await fetch(`${getApiUrl()}/admin/tenants/${selected.id}/municipal-profile`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? `HTTP ${res.status}`)
      setMessage(`Perfil municipal actualizado: ${data.municipal_profile?.mode ?? 'carga_inicial'}`)
      await loadTenants(data.id)
    } catch (exc) {
      setError(exc instanceof Error ? exc.message : 'No se pudo guardar perfil municipal')
    }
  }

  function parseProfileDraft(key: 'antecedentes' | 'mapa_social' | 'organigrama_servicio') {
    try {
      return JSON.parse(profileDraft[key]) as Record<string, unknown>
    } catch {
      return {}
    }
  }

  function updateProfileDraft(
    key: 'antecedentes' | 'mapa_social' | 'organigrama_servicio',
    updater: (draft: Record<string, unknown>) => Record<string, unknown>,
  ) {
    const next = updater(parseProfileDraft(key))
    setProfileDraft(prev => ({ ...prev, [key]: JSON.stringify(next, null, 2) }))
  }

  function updateAntecedenteSource(key: string, label: string) {
    updateProfileDraft('antecedentes', draft => ({ ...draft, [key]: pendingSource(label) }))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="mb-1 text-[10px] uppercase tracking-[0.08em] text-[#8E8980]">/admin · Plataforma 0</p>
            <h1 className="font-serif text-[26px] text-[#1C1B18]">Backoffice de tenants</h1>
          </div>
          <button
            type="button"
            onClick={() => void loadTenants()}
            className="inline-flex h-9 items-center gap-2 border border-[#D8D1C4] bg-[#FDFCFA] px-3 text-[12px] font-medium text-[#1C1B18]"
          >
            <RefreshCw size={14} /> Actualizar
          </button>
        </div>

        {(message || error) && (
          <div className={`mb-4 border px-4 py-3 text-[12px] ${error ? 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]' : 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'}`}>
            {error ?? message}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="space-y-5">
            <section className="border border-[#E1DACE] bg-[#FDFCFA] p-4">
              <div className="mb-4 flex items-center gap-2">
                <Plus size={16} className="text-[#3B6D11]" />
                <h2 className="text-[13px] font-semibold text-[#1C1B18]">Nuevo tenant</h2>
              </div>
              <div className="space-y-3">
                {[
                  ['nombre', 'Municipio'],
                  ['estado_mx', 'Estado'],
                  ['municipio_id', 'Municipio ID'],
                  ['inegi_clave', 'Clave INEGI'],
                ].map(([key, label]) => (
                  <label key={key} className="block text-[11px] font-medium text-[#6B6760]">
                    {label}
                    <input
                      value={form[key as keyof typeof form]}
                      onChange={event => setForm(prev => ({ ...prev, [key]: event.target.value }))}
                      className="mt-1 h-9 w-full border border-[#D8D1C4] bg-white px-3 text-[12px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
                    />
                  </label>
                ))}
                <label className="block text-[11px] font-medium text-[#6B6760]">
                  Tier comercial
                  <select
                    value={form.tier_comercial}
                    onChange={event => setForm(prev => ({ ...prev, tier_comercial: event.target.value as TierComercial }))}
                    className="mt-1 h-9 w-full border border-[#D8D1C4] bg-white px-3 text-[12px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
                  >
                    <option value="diagnostico">Diagnostico</option>
                    <option value="implementacion">Implementacion</option>
                    <option value="operacion_completa">Operacion completa</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => void createTenant()}
                  disabled={!form.nombre || !form.estado_mx || !form.municipio_id || !form.inegi_clave}
                  className="h-9 w-full bg-[#3B6D11] text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#B9C8A7]"
                >
                  Crear en validation
                </button>
              </div>
            </section>

            <section className="border border-[#E1DACE] bg-[#FDFCFA]">
              <div className="flex items-center justify-between border-b border-[#E8E4DC] px-4 py-3">
                <h2 className="text-[13px] font-semibold text-[#1C1B18]">Tenants</h2>
                <span className="text-[11px] text-[#8E8980]">{loading ? '...' : tenants.length}</span>
              </div>
              <div className="max-h-[420px] overflow-auto">
                {tenants.length === 0 ? (
                  <p className="px-4 py-6 text-[12px] text-[#8E8980]">Sin tenants registrados.</p>
                ) : tenants.map(tenant => (
                  <button
                    key={tenant.id}
                    type="button"
                    onClick={() => setSelectedId(tenant.id)}
                    className={`block w-full border-b border-[#EEE8DE] px-4 py-3 text-left hover:bg-[#F4F2ED] ${selected?.id === tenant.id ? 'bg-[#EAF3DE]' : ''}`}
                  >
                    <span className="block text-[13px] font-semibold text-[#1C1B18]">{tenant.nombre}</span>
                    <span className="mt-1 block text-[11px] text-[#6B6760]">{tenant.state.current_stage} · {tenant.tier_comercial}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <main className="space-y-5">
            {!selected ? (
              <section className="border border-dashed border-[#D8D1C4] bg-[#FDFCFA] p-8 text-[13px] text-[#6B6760]">
                Crea o selecciona un tenant.
              </section>
            ) : (
              <>
                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <Landmark size={18} className="text-[#3B6D11]" />
                        <h2 className="text-[18px] font-semibold text-[#1C1B18]">{selected.nombre}</h2>
                      </div>
                      <p className="text-[12px] text-[#6B6760]">{selected.estado_mx} · {selected.municipio_id} · INEGI {selected.inegi_clave}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-[12px] md:min-w-[360px]">
                      <div className="border border-[#E8E4DC] bg-white px-3 py-2">
                        <span className="block text-[10px] uppercase text-[#8E8980]">Etapa</span>
                        <strong className="text-[#1C1B18]">{selected.state.current_stage}</strong>
                      </div>
                      <div className="border border-[#E8E4DC] bg-white px-3 py-2">
                        <span className="block text-[10px] uppercase text-[#8E8980]">Tier</span>
                        <strong className="text-[#1C1B18]">{selected.tier_comercial}</strong>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-[#3B6D11]" />
                    <h2 className="text-[13px] font-semibold text-[#1C1B18]">Gates G1-G5</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[720px] text-[12px]">
                      <thead>
                        <tr className="border-b border-[#E8E4DC] text-left text-[#6B6760]">
                          <th className="py-2 pr-3 font-medium">Gate</th>
                          <th className="py-2 pr-3 font-medium">Estado</th>
                          <th className="py-2 pr-3 font-medium">Evidencia</th>
                          <th className="py-2 pr-3 font-medium">Decisor</th>
                          <th className="py-2 pr-3 font-medium">Cierre</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selected.gates.map(gate => (
                          <tr key={gate.gate_id} className="border-b border-[#EEE8DE]">
                            <td className="py-3 pr-3 font-semibold text-[#1C1B18]">{gate.gate_id}</td>
                            <td className="py-3 pr-3">
                              <span className={`border px-2 py-1 text-[11px] ${statusClass(gate.status)}`}>{gate.status}</span>
                            </td>
                            <td className="py-3 pr-3 text-[#6B6760]">{gate.evidencia_label ?? 'Pendiente'}</td>
                            <td className="py-3 pr-3 text-[#6B6760]">{gate.decisor_humano ?? 'Pendiente'}</td>
                            <td className="py-3 pr-3 text-[#8E8980]">{gate.closed_at ? new Date(gate.closed_at).toLocaleString() : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-[90px_1fr_1fr_170px_auto_auto]">
                    <select
                      value={evidence.gate_id}
                      onChange={event => setEvidence(prev => ({ ...prev, gate_id: event.target.value }))}
                      className="h-9 border border-[#D8D1C4] bg-white px-2 text-[12px]"
                    >
                      {['G1', 'G2', 'G3', 'G4', 'G5'].map(g => <option key={g}>{g}</option>)}
                    </select>
                    <input
                      value={evidence.evidencia_label}
                      onChange={event => setEvidence(prev => ({ ...prev, evidencia_label: event.target.value }))}
                      placeholder="Etiqueta evidencia"
                      className="h-9 border border-[#D8D1C4] bg-white px-3 text-[12px]"
                    />
                    <input
                      value={evidence.evidencia_url}
                      onChange={event => setEvidence(prev => ({ ...prev, evidencia_url: event.target.value }))}
                      placeholder="URL o ruta de evidencia"
                      className="h-9 border border-[#D8D1C4] bg-white px-3 text-[12px]"
                    />
                    <input
                      value={evidence.decisor_humano}
                      onChange={event => setEvidence(prev => ({ ...prev, decisor_humano: event.target.value }))}
                      placeholder="Decisor"
                      className="h-9 border border-[#D8D1C4] bg-white px-3 text-[12px]"
                    />
                    <button type="button" onClick={() => void registerEvidence()} className="h-9 border border-[#3B6D11] px-3 text-[12px] font-semibold text-[#2F5B0D]">
                      Registrar
                    </button>
                    <button type="button" onClick={() => void closeGate()} className="h-9 bg-[#1C1B18] px-3 text-[12px] font-semibold text-white">
                      Cerrar
                    </button>
                  </div>
                </section>

                <section className="grid gap-5 xl:grid-cols-2">
                  <div className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <CheckCircle2 size={16} className="text-[#3B6D11]" />
                      <h2 className="text-[13px] font-semibold text-[#1C1B18]">Capabilities activas</h2>
                    </div>
                    <div className="grid max-h-[320px] gap-2 overflow-auto sm:grid-cols-2">
                      {selected.capabilities.map(cap => (
                        <div key={cap.module_id} className="border border-[#E8E4DC] bg-white px-3 py-2 text-[11px] text-[#1C1B18]">
                          <span className="font-mono">{cap.module_id}</span>
                          <span className="ml-2 text-[#8E8980]">{cap.source}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <FileCheck2 size={16} className="text-[#3B6D11]" />
                      <h2 className="text-[13px] font-semibold text-[#1C1B18]">Auditoria minima</h2>
                    </div>
                    <div className="max-h-[320px] space-y-2 overflow-auto">
                      {[...selected.audit_log].reverse().map(log => (
                        <div key={log.id} className="border border-[#E8E4DC] bg-white px-3 py-2">
                          <div className="flex items-center justify-between gap-3 text-[11px]">
                            <strong className="text-[#1C1B18]">{log.action}</strong>
                            <span className="text-[#8E8980]">{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                          <p className="mt-1 text-[11px] text-[#6B6760]">{log.actor}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                  <div className="mb-4 flex flex-col gap-1">
                    <h2 className="text-[13px] font-semibold text-[#1C1B18]">Personalización municipal Fase 6</h2>
                    <p className="text-[11px] text-[#6B6760]">
                      Modo actual: {selected.municipal_profile?.mode ?? 'carga_inicial'} · todo campo sin fuente debe quedar como pendiente de verificación.
                    </p>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    {[
                      ['antecedentes', 'tenant.antecedentes'],
                      ['mapa_social', 'tenant.mapa_social'],
                      ['organigrama_servicio', 'tenant.organigrama_servicio'],
                    ].map(([key, label]) => (
                      <label key={key} className="block text-[11px] font-medium text-[#6B6760]">
                        {label}
                        <textarea
                          value={profileDraft[key as keyof typeof profileDraft]}
                          onChange={event => setProfileDraft(prev => ({ ...prev, [key]: event.target.value }))}
                          rows={14}
                          spellCheck={false}
                          className="mt-1 w-full border border-[#D8D1C4] bg-white px-3 py-2 font-mono text-[11px] text-[#1C1B18] outline-none focus:border-[#3B6D11]"
                        />
                      </label>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-end gap-3">
                    <label className="block text-[11px] font-medium text-[#6B6760]">
                      Estado de provenance
                      <select
                        value={profileDraft.provenance_status}
                        onChange={event => setProfileDraft(prev => ({ ...prev, provenance_status: event.target.value }))}
                        className="mt-1 h-9 border border-[#D8D1C4] bg-white px-3 text-[12px] text-[#1C1B18]"
                      >
                        <option value="pendiente_verificacion">Pendiente verificación</option>
                        <option value="fuentes_cargadas">Fuentes cargadas</option>
                      </select>
                    </label>
                    <button
                      type="button"
                      onClick={() => void saveMunicipalProfile()}
                      className="h-9 bg-[#1C1B18] px-4 text-[12px] font-semibold text-white"
                    >
                      Guardar perfil municipal
                    </button>
                  </div>
                </section>
              </>
            )}
          </main>
        </div>
      </div>
    </AppShell>
  )
}
