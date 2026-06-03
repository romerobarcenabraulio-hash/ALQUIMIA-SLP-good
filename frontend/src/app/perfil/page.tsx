'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { AlertTriangle, CheckCircle2, Download, Settings, ShieldCheck, Upload, Users } from 'lucide-react'
import Link from 'next/link'
import { AppShell } from '@/components/layout/AppShell'
import { buildTemplateReadiness } from '@/lib/alquimiaTemplates'
import type { DocumentGap, TenantReceivedDocument } from '@/lib/tenantDiagnosticData'
import { documentLabel } from '@/lib/tenantDiagnosticData'
import { useTenantData } from '@/hooks/useTenantData'

function tenantIdFromStorage() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('alquimia.tenantId')
}

function stageLabel(status?: string) {
  if (status === 'official') return 'Oficial'
  if (status === 'preliminary_ready') return 'Validación avanzada'
  if (status === 'preparing') return 'Preparando diagnóstico'
  return 'Validación preliminar'
}

function ProfileMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-[#E8E4DC] bg-white px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">{label}</p>
      <p className="mt-1 text-[20px] font-semibold text-[#1C1B18]">{value}</p>
    </div>
  )
}

const PROFILE_PREFS_KEY = 'alquimia.profile.preferences'

interface ProfilePreferencesState {
  digest: 'weekly' | 'critical_only' | 'off'
  exportFormat: 'zip' | 'json'
  privacy: 'tenant_team' | 'founder_only'
}

const defaultProfilePreferences: ProfilePreferencesState = {
  digest: 'critical_only',
  exportFormat: 'zip',
  privacy: 'tenant_team',
}

function readProfilePreferences(): ProfilePreferencesState {
  if (typeof window === 'undefined') return defaultProfilePreferences
  try {
    const raw = localStorage.getItem(PROFILE_PREFS_KEY)
    if (!raw) return defaultProfilePreferences
    return { ...defaultProfilePreferences, ...JSON.parse(raw) } as ProfilePreferencesState
  } catch {
    return defaultProfilePreferences
  }
}

function ProfilePreferencesPanel() {
  const [preferences, setPreferences] = useState<ProfilePreferencesState>(defaultProfilePreferences)

  useEffect(() => {
    setPreferences(readProfilePreferences())
  }, [])

  function updatePreference<K extends keyof ProfilePreferencesState>(key: K, value: ProfilePreferencesState[K]) {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(next))
    }
  }

  return (
    <div className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
      <div className="flex items-center gap-2">
        <Settings size={16} className="text-[#3B6D11]" />
        <h2 className="text-[14px] font-semibold text-[#1C1B18]">Mis preferencias</h2>
      </div>
      <div className="mt-4 space-y-3">
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
          Digest
          <select
            value={preferences.digest}
            onChange={event => updatePreference('digest', event.target.value as ProfilePreferencesState['digest'])}
            className="mt-1 h-9 w-full border border-[#D8D2C5] bg-white px-3 text-[12px] normal-case tracking-normal text-[#1C1B18]"
          >
            <option value="critical_only">Solo críticos</option>
            <option value="weekly">Semanal</option>
            <option value="off">Apagado</option>
          </select>
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
          Exportación preferida
          <select
            value={preferences.exportFormat}
            onChange={event => updatePreference('exportFormat', event.target.value as ProfilePreferencesState['exportFormat'])}
            className="mt-1 h-9 w-full border border-[#D8D2C5] bg-white px-3 text-[12px] normal-case tracking-normal text-[#1C1B18]"
          >
            <option value="zip">ZIP preliminar</option>
            <option value="json">JSON técnico</option>
          </select>
        </label>
        <label className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
          Visibilidad
          <select
            value={preferences.privacy}
            onChange={event => updatePreference('privacy', event.target.value as ProfilePreferencesState['privacy'])}
            className="mt-1 h-9 w-full border border-[#D8D2C5] bg-white px-3 text-[12px] normal-case tracking-normal text-[#1C1B18]"
          >
            <option value="tenant_team">Equipo del tenant</option>
            <option value="founder_only">Founder only</option>
          </select>
        </label>
      </div>
    </div>
  )
}

function PendingDocumentQueue({
  tenantId,
  gaps,
  documents,
  onChanged,
}: {
  tenantId: string
  gaps: DocumentGap[]
  documents: TenantReceivedDocument[]
  onChanged: () => void
}) {
  const [selectedGap, setSelectedGap] = useState<DocumentGap | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pendingGaps = gaps.filter(gap => gap.status === 'pending' && !gap.marked_not_applicable)

  async function uploadDocument() {
    if (!selectedGap || !file) return
    setBusy(true)
    setError(null)
    setMessage(null)
    const form = new FormData()
    form.set('file', file)
    form.set('uploaded_by_user_id', 'profile_user')
    const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/documents/upload`, {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
      body: form,
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(typeof body.detail === 'string' ? body.detail : 'No se pudo subir el documento')
      return
    }
    setMessage('Documento recibido. ALQUIMIA lo procesará con fuente, alcance y límites visibles.')
    setSelectedGap(null)
    setFile(null)
    onChanged()
  }

  async function markNotApplicable(gap: DocumentGap) {
    setBusy(true)
    setError(null)
    setMessage(null)
    const res = await fetch(`/api/tenants/${encodeURIComponent(tenantId)}/document-gaps/${encodeURIComponent(gap.id)}/not-applicable`, {
      method: 'POST',
      headers: { 'x-tenant-id': tenantId },
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setError(typeof body.detail === 'string' ? body.detail : 'No se pudo marcar como no aplica')
      return
    }
    setMessage('Pendiente marcado como no aplicable sin borrar trazabilidad.')
    onChanged()
  }

  return (
    <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-[#3B6D11]" />
            <h2 className="text-[14px] font-semibold text-[#1C1B18]">Mis pendientes documentales</h2>
          </div>
          <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#6B6760]">
            Estos documentos alimentan el diagnóstico y los templates exportables. Subirlos aquí evita que la experiencia consultiva muestre operación interna.
          </p>
        </div>
        <span className="w-fit border border-[#D8D2C5] bg-white px-3 py-1 text-[12px] font-semibold text-[#3B3326]">
          {pendingGaps.length} pendientes
        </span>
      </div>

      {message && <p className="mt-4 border border-[#C9DDB1] bg-[#EAF3DE] px-3 py-2 text-[12px] text-[#2F5B0D]">{message}</p>}
      {error && <p className="mt-4 border border-[#EBC0BA] bg-[#FBEAEA] px-3 py-2 text-[12px] text-[#A8322A]">{error}</p>}

      <div className="mt-4 divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
        {pendingGaps.length ? pendingGaps.map(gap => (
          <div key={gap.id} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-[#1C1B18]">{gap.label}</p>
              <p className="mt-1 text-[12px] leading-5 text-[#6B6760]">
                {gap.reason} · Módulo {gap.module_id} · Prioridad {gap.priority}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => setSelectedGap(gap)}
                className="inline-flex h-9 items-center gap-2 bg-[#1C2B15] px-3 text-[12px] font-semibold text-white"
              >
                <Upload size={14} /> Subir
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void markNotApplicable(gap)}
                className="h-9 border border-[#D8D2C5] px-3 text-[12px] font-semibold text-[#3B3326]"
              >
                No aplica
              </button>
            </div>
          </div>
        )) : (
          <p className="py-5 text-[13px] text-[#6B6760]">No hay documentos pendientes para tu municipio.</p>
        )}
      </div>

      {documents.length > 0 && (
        <div className="mt-4 border border-[#E8E4DC] bg-white p-3">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Documentos integrados</p>
          <div className="mt-2 grid gap-2 md:grid-cols-2">
            {documents.map(document => (
              <p key={document.id} className="text-[11px] leading-5 text-[#6B6760]">
                {document.original_filename} · {documentLabel(document.document_type)} · {document.upload_status}
              </p>
            ))}
          </div>
        </div>
      )}

      {selectedGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-[560px] border border-[#E1DACE] bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Subir documento</p>
                <h3 className="mt-1 font-serif text-[24px] leading-tight text-[#1C1B18]">{selectedGap.label}</h3>
              </div>
              <button type="button" onClick={() => setSelectedGap(null)} className="text-[13px] font-semibold text-[#6B6760]">
                Cerrar
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <input
                type="file"
                accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png"
                onChange={event => setFile(event.target.files?.[0] ?? null)}
                className="w-full border border-[#D8D2C5] px-3 py-2 text-[13px]"
              />
              <p className="bg-[#F7F3EA] p-3 text-[12px] leading-5 text-[#5C574F]">
                La carga no publica claims automáticamente. El sistema la procesa y conserva trazabilidad para revisión humana.
              </p>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSelectedGap(null)} className="h-9 border border-[#D8D2C5] px-4 text-[13px]">
                Cancelar
              </button>
              <button
                type="button"
                disabled={!file || busy}
                onClick={() => void uploadDocument()}
                className="h-9 bg-[#1C2B15] px-4 text-[13px] font-semibold text-white disabled:opacity-50"
              >
                Subir y procesar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser()
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    setTenantId(tenantIdFromStorage())
  }, [])

  const tenantData = useTenantData(tenantId)
  const data = tenantData.data
  const templateReadiness = useMemo(() => data ? buildTemplateReadiness(data) : [], [data])
  const verifiedMetrics = data?.metrics.filter(metric => metric.status === 'verificado').length ?? 0
  const validationPct = data?.metrics.length ? Math.round((verifiedMetrics / data.metrics.length) * 100) : 0
  const readyModules = data?.document_index.filter(slot => slot.status === 'ready').length ?? 0
  const userName = user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? 'Funcionario municipal'
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? 'correo pendiente'
  const emailVerification = user?.primaryEmailAddress?.verification?.status ?? 'unverified'
  const pendingDocuments = data?.document_gaps.filter(gap => gap.status === 'pending' && !gap.marked_not_applicable).length ?? 0

  return (
    <AppShell>
      <div className="px-5 py-6 sm:px-8">
        <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-[#6B6760]">/perfil · funcionario</p>
            <h1 className="mt-2 font-serif text-[34px] leading-tight text-[#1C1B18]">Mi perfil ALQUIMIA</h1>
            <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#5C574F]">
              Avance, pendientes, exportaciones y equipo del municipio en una vista personal. La operación documental vive aquí, no dentro de la consultoría cliente.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={tenantId ? `/v?tenant_id=${encodeURIComponent(tenantId)}` : '/v'} className="inline-flex h-10 items-center justify-center bg-[#1C2B15] px-4 text-[13px] font-semibold text-white">
              Abrir consultoría
            </Link>
            <Link href="/onboarding/reglamento" className="inline-flex h-10 items-center justify-center border border-[#D8D2C5] px-4 text-[13px] font-semibold text-[#3B3326]">
              Subir reglamento
            </Link>
          </div>
        </div>

        {!tenantId ? (
          <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-[#8A5C05]" />
              <h2 className="text-[14px] font-semibold text-[#1C1B18]">Municipio no vinculado</h2>
            </div>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-[#5C574F]">
              Completa el onboarding para asociar tu cuenta con un expediente municipal antes de abrir pendientes o exportaciones.
            </p>
            <Link href="/onboarding/perfil" className="mt-4 inline-flex h-10 items-center bg-[#1C2B15] px-4 text-[13px] font-semibold text-white">
              Completar perfil territorial
            </Link>
          </section>
        ) : tenantData.loading || !isLoaded ? (
          <p className="text-[13px] text-[#6B6760]">Cargando perfil...</p>
        ) : tenantData.error ? (
          <section className="border border-[#EBC0BA] bg-[#FBEAEA] p-5 text-[#A8322A]">
            <p className="text-[13px] font-semibold">No se pudo cargar el perfil</p>
            <p className="mt-1 text-[12px]">{tenantData.error}</p>
          </section>
        ) : data ? (
          <div className="space-y-5">
            <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                <div>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Mi perfil personal</p>
                  <h2 className="mt-2 font-serif text-[28px] leading-tight text-[#1C1B18]">{userName}</h2>
                  <p className="mt-2 text-[13px] leading-6 text-[#5C574F]">
                    {data.municipality} · {data.state} · INEGI {data.clave_inegi ?? 'pendiente'}
                  </p>
                  <p className="mt-1 text-[12px] text-[#6B6760]">
                    Acceso institucional vinculado al tenant {data.tenant_id}. Los datos personales se administran desde Clerk y quedan sujetos a audit log.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <ProfileMetric label="Etapa" value={stageLabel(data.status)} />
                  <ProfileMetric label="Validación" value={`${validationPct}%`} />
                  <ProfileMetric label="Módulos" value={`${readyModules}/${data.document_index.length}`} />
                </div>
              </div>
            </section>

            <PendingDocumentQueue
              tenantId={tenantId}
              gaps={data.document_gaps}
              documents={data.tenant_documents}
              onChanged={tenantData.reload}
            />

            <section className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Download size={16} className="text-[#3B6D11]" />
                    <h2 className="text-[14px] font-semibold text-[#1C1B18]">Mis exportaciones y templates</h2>
                  </div>
                  <p className="mt-1 max-w-3xl text-[12px] leading-5 text-[#6B6760]">
                    Cada template recibe variables reales del tenant. Las variables pendientes deben venir de documento, cálculo trazable o captura validada.
                  </p>
                </div>
                <a
                  href={`/api/tenants/${encodeURIComponent(data.tenant_id)}/export-zip`}
                  className="inline-flex h-9 items-center justify-center bg-[#1C2B15] px-3 text-[12px] font-semibold text-white"
                >
                  Exportar ZIP preliminar
                </a>
              </div>
              <div className="mt-4 grid gap-3 xl:grid-cols-2">
                {templateReadiness.map(item => (
                  <div key={item.template.id} className="border border-[#E8E4DC] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#1C1B18]">{item.template.title}</p>
                        <p className="mt-1 text-[11px] text-[#6B6760]">{item.template.filename} · {item.template.stage}</p>
                      </div>
                      <span className={`shrink-0 border px-2 py-1 text-[11px] font-semibold ${item.pendingCount ? 'border-[#F5DCA0] bg-[#FEF7E7] text-[#8A5C05]' : 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'}`}>
                        {item.readyCount}/{item.totalCount}
                      </span>
                    </div>
                    <p className="mt-2 text-[12px] leading-5 text-[#5C574F]">{item.template.purpose}</p>
                    <div className="mt-3 grid gap-1">
                      {item.variables.slice(0, 6).map(variable => (
                        <p key={variable.variable} className="flex items-center gap-2 text-[11px] text-[#6B6760]">
                          {variable.status === 'ready'
                            ? <CheckCircle2 size={13} className="shrink-0 text-[#3B6D11]" />
                            : <AlertTriangle size={13} className="shrink-0 text-[#8A5C05]" />}
                          <span className="font-mono text-[#1C1B18]">[{variable.variable}]</span>
                          <span>{variable.valuePreview ?? variable.source}</span>
                        </p>
                      ))}
                      {item.variables.length > 6 && (
                        <p className="text-[11px] text-[#8E8980]">+ {item.variables.length - 6} variables adicionales</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid gap-5 xl:grid-cols-3">
              <div className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#3B6D11]" />
                  <h2 className="text-[14px] font-semibold text-[#1C1B18]">Mi equipo municipal</h2>
                </div>
                <dl className="mt-4 space-y-3 text-[12px]">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E8980]">Cuenta principal</dt>
                    <dd className="mt-1 break-all font-semibold text-[#1C1B18]">{userEmail}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E8980]">Tenant vinculado</dt>
                    <dd className="mt-1 break-all font-semibold text-[#1C1B18]">{data.tenant_id}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E8980]">Responsabilidad activa</dt>
                    <dd className="mt-1 font-semibold text-[#1C1B18]">{pendingDocuments} pendiente(s) documental(es)</dd>
                  </div>
                </dl>
              </div>
              <div className="border border-[#E1DACE] bg-[#FDFCFA] p-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#3B6D11]" />
                  <h2 className="text-[14px] font-semibold text-[#1C1B18]">Seguridad</h2>
                </div>
                <dl className="mt-4 space-y-3 text-[12px]">
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E8980]">Correo</dt>
                    <dd className={`mt-1 font-semibold ${emailVerification === 'verified' ? 'text-[#2F5B0D]' : 'text-[#8A5C05]'}`}>
                      {emailVerification === 'verified' ? 'Verificado' : 'Requiere verificación'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#8E8980]">Sesión</dt>
                    <dd className="mt-1 font-semibold text-[#1C1B18]">{isLoaded ? 'Activa' : 'Validando'}</dd>
                  </div>
                  <p className="border border-[#E8E4DC] bg-white p-3 text-[11px] leading-5 text-[#6B6760]">
                    Códigos, TOTP y recuperación se mantienen fuera de esta pantalla y se administran desde el proveedor de identidad.
                  </p>
                </dl>
              </div>
              <ProfilePreferencesPanel />
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}
