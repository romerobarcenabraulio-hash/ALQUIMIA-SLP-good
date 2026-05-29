'use client'

import { useState } from 'react'
import { getApiUrl } from '@/lib/api'
import { profileModeLabel, pendingText, type TenantMunicipalProfile } from '@/lib/tenantMunicipalProfile'

function sourceLabel(value: unknown): string {
  if (!value || typeof value !== 'object') return 'missing_source'
  const obj = value as Record<string, unknown>
  const source = obj.source
  if (source && typeof source === 'object') {
    const s = source as Record<string, unknown>
    const rawStatus = String(obj.human_validation_state ?? obj.display_status ?? 'pendiente_validacion')
    const status = rawStatus === 'pending_source' ? 'missing_source' : String(obj.display_status ?? rawStatus)
    const confidence = String(obj.confidence ?? 'confianza_pendiente')
    return `${String(s.label ?? 'Fuente pendiente')} · ${confidence} · ${status}`
  }
  const fuente = obj.fuente
  if (fuente && typeof fuente === 'object') {
    const f = fuente as Record<string, unknown>
    return `${String(f.label ?? 'Fuente pendiente')} · ${String(f.status ?? 'pendiente_verificacion')}`
  }
  return String(obj.estado ?? obj.status ?? 'missing_source')
}

export function TenantProfileStatus({ profile }: { profile: TenantMunicipalProfile | null }) {
  const runtime = profile?.automation?.runtime
  const discrepancies = runtime?.discrepancies ?? []
  const recommendations = runtime?.recommendations ?? []
  const openRecommendations = recommendations.filter(rec => rec.status === 'pending_human_decision')
  const nousSuggestions = profile?.automation?.nous_suggestions ?? []
  return (
    <div className="mb-6 space-y-3 text-center text-[11px] text-[#6B6760]">
      <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1">
        <span className="text-[13px] font-semibold text-[#1C1B18]">{profileModeLabel(profile?.mode)}</span>
        <span className="text-[#8B5A00]">{profile?.provenance_status ?? 'pendiente_verificacion'}</span>
        {profile?.automation?.preliminary_notice ? <span className="text-[#8B5A00]">{profile.automation.preliminary_notice}</span> : null}
        <span>Nada estimado se presenta como oficial.</span>
      </div>
      {(discrepancies.length > 0 || openRecommendations.length > 0) ? (
        <div className="mx-auto grid max-w-4xl gap-3 border-t border-[#E8E4DC] pt-3 text-left md:grid-cols-2">
          {discrepancies.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B5A00]">Discrepancia en revisión</p>
              <p className="mt-1 text-[12px] leading-snug text-[#1C1B18]">
                {String(discrepancies[0].field ?? 'dato del tenant')} difiere {String(discrepancies[0].delta_pct ?? 'N/D')}%.
              </p>
              <p className="mt-1 text-[11px] text-[#6B6760]">
                No es error definitivo; requiere aceptar dato cliente, conservar inferido o marcar revisión pendiente.
              </p>
            </div>
          ) : null}
          {openRecommendations.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#3B6D11]">Recomendación accionable</p>
              <p className="mt-1 text-[12px] leading-snug text-[#1C1B18]">
                {String(openRecommendations[0].legacy_number ?? openRecommendations[0].module_id)} · {String(openRecommendations[0].recommendation ?? '')}
              </p>
              <p className="mt-1 text-[11px] text-[#6B6760]">
                Acción humana pendiente: aceptar, rechazar o ajustar.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
      {nousSuggestions.length > 0 ? <NousSuggestionPanel suggestions={nousSuggestions} /> : null}
    </div>
  )
}

function authHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('alquimia_token')
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function tenantIdFromStorage(): string {
  if (typeof window === 'undefined') return 'slp-capital'
  return localStorage.getItem('alquimia.tenantId') || 'slp-capital'
}

function NousSuggestionPanel({
  suggestions,
}: {
  suggestions: NonNullable<NonNullable<TenantMunicipalProfile['automation']>['nous_suggestions']>
}) {
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const suggestion = suggestions[0]

  async function sendFeedback(action: 'accept' | 'adjust' | 'reject') {
    const payload = {
      action,
      role: 'cliente_municipal',
      rejection_reason: action === 'reject' ? note || 'Rechazo pendiente de detalle' : undefined,
      adjustment_note: action === 'adjust' ? note || 'Ajuste pendiente de detalle' : undefined,
    }
    const res = await fetch(`${getApiUrl()}/admin/tenants/${tenantIdFromStorage()}/nous/suggestions/${suggestion.suggestion_id}/feedback`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    })
    setStatus(res.ok ? `Feedback registrado: ${action}` : 'No se pudo registrar feedback de la sugerencia')
  }

  return (
    <section className="mx-auto max-w-4xl border-t border-[#E8E4DC] pt-4 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#3B6D11]">Sugerencia asistida aprobada</p>
      <p className="mt-2 font-serif text-[20px] leading-tight text-[#1C1B18]">{suggestion.conclusion}</p>
      <dl className="mt-3 grid gap-3 text-[11px] md:grid-cols-3">
        <div>
          <dt className="uppercase tracking-[0.06em] text-[#A8A49C]">Evidencia</dt>
          <dd className="mt-1 text-[#5A5750]">{suggestion.evidence_summary}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.06em] text-[#A8A49C]">N / confianza</dt>
          <dd className="mt-1 text-[#1C1B18]">{suggestion.observations_count} · {suggestion.confidence}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-[0.06em] text-[#A8A49C]">Límite</dt>
          <dd className="mt-1 text-[#8B5A00]">{suggestion.limitation}</dd>
        </div>
      </dl>
      <p className="mt-3 text-[12px] leading-relaxed text-[#1C1B18]">{suggestion.action_suggested}</p>
      <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
        <input
          value={note}
          onChange={event => setNote(event.target.value)}
          placeholder="Motivo si ajustas o rechazas"
          className="h-9 flex-1 border border-[#D8D1C4] bg-white px-3 text-[11px] text-[#1C1B18] outline-none"
        />
        <button type="button" onClick={() => void sendFeedback('accept')} className="h-9 border border-[#D8D1C4] px-3 text-[11px] font-semibold text-[#1C1B18]">Aceptar</button>
        <button type="button" onClick={() => void sendFeedback('adjust')} className="h-9 border border-[#D8D1C4] px-3 text-[11px] font-semibold text-[#1C1B18]">Ajustar</button>
        <button type="button" onClick={() => void sendFeedback('reject')} className="h-9 border border-[#EBC0BA] px-3 text-[11px] font-semibold text-[#A8322A]">Rechazar</button>
      </div>
      {status ? <p className="mt-2 text-[11px] text-[#6B6760]">{status}</p> : null}
    </section>
  )
}

function confidenceSummary(profile: TenantMunicipalProfile | null): Array<{ label: string; value: string }> {
  const demografia = (profile?.antecedentes?.demografia as Record<string, unknown> | undefined) ?? {}
  const population = demografia.poblacion as Record<string, unknown> | undefined
  const generation = demografia.generacion_kg_hab_dia as Record<string, unknown> | undefined
  const reglamento = profile?.antecedentes?.reglamento_de_limpia as Record<string, unknown> | undefined
  return [
    { label: 'Población', value: sourceLabel(population) },
    { label: 'Generación RSU', value: sourceLabel(generation) },
    { label: 'Reglamento', value: sourceLabel(reglamento) },
  ]
}

export function TenantFirstLoginSummary({
  profile,
  moduleLabel,
}: {
  profile: TenantMunicipalProfile | null
  moduleLabel: string
}) {
  const inference = profile?.automation?.inference ?? {}
  const status = String(inference.status ?? profile?.provenance_status ?? 'pending_human_validation')
  const pending = status === 'partial' || profile?.mode === 'carga_inicial'
  return (
    <section className="mx-auto mb-6 max-w-4xl border-b border-[#E8E4DC] pb-5 text-center">
      <TenantProfileStatus profile={profile} />
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A49C]">
        Primer login · {moduleLabel}
      </p>
      <p className="mx-auto mt-2 max-w-3xl font-serif text-[22px] leading-tight text-[#1C1B18]">
        El cliente entra con diagnóstico preliminar útil; cada cifra conserva fuente, confianza y validación humana pendiente.
      </p>
      <div className="mt-4 grid gap-x-6 gap-y-3 text-left md:grid-cols-3">
        {confidenceSummary(profile).map(item => (
          <div key={item.label}>
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{item.label}</p>
            <p className="mt-1 text-[11px] leading-snug text-[#5A5750]">{item.value}</p>
          </div>
        ))}
      </div>
      {pending ? (
        <p className="mt-4 text-[12px] leading-relaxed text-[#8B5A00]">
          Pendiente carga de datos del municipio: las fuentes faltantes quedan visibles y no se presentan como oficiales.
        </p>
      ) : null}
    </section>
  )
}

export function TenantAntecedentesPanel({ profile }: { profile: TenantMunicipalProfile | null }) {
  const antecedentes = profile?.antecedentes ?? {}
  const cabildo = (antecedentes.cabildo as Record<string, unknown> | undefined) ?? {}
  const regidores = Array.isArray(cabildo.regidores) ? cabildo.regidores as Array<Record<string, unknown>> : []
  const sindicos = Array.isArray(cabildo.sindicos) ? cabildo.sindicos as Array<Record<string, unknown>> : []
  const comisiones = Array.isArray(cabildo.comisiones_permanentes) ? cabildo.comisiones_permanentes as Array<Record<string, unknown>> : []
  const summaryItems = [
    ['Presidente municipal', antecedentes.presidente_municipal],
    ['Sesión ordinaria', antecedentes.sesion_ordinaria],
    ['Reglamento de limpia', antecedentes.reglamento_de_limpia],
    ['Concesión actual', antecedentes.concesion_actual],
    ['Próximo proceso electoral', antecedentes.proximo_proceso_electoral],
  ] as const

  return (
    <section className="mx-auto max-w-5xl space-y-8 py-2">
      <TenantProfileStatus profile={profile} />
      <header className="mx-auto max-w-3xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A49C]">Expediente municipal</p>
        <h3 className="mt-2 font-serif text-[24px] leading-tight text-[#1C1B18]">
          El módulo opera con datos del tenant; lo no verificado permanece marcado como pendiente.
        </h3>
        <p className="mt-3 text-[13px] leading-[1.7] text-[#5A5750]">
          Cabildo, normativa, concesión y calendario electoral se leen del perfil municipal antes de alimentar diagnóstico, actores y autoridad.
        </p>
      </header>
      <div className="grid gap-x-8 gap-y-6 md:grid-cols-5">
        {summaryItems.map(([label, value]) => (
          <div key={label}>
            <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
            <p className="mt-1 text-[12px] leading-snug text-[#1C1B18]">{sourceLabel(value)}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-8 border-t border-[#E8E4DC] pt-6 md:grid-cols-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#1C1B18]">Síndicos</p>
          <ul className="space-y-1 text-[11px] text-[#6B6760]">
            {sindicos.length ? sindicos.map((item, idx) => <li key={idx}>{pendingText(item.cargo)} · {sourceLabel(item)}</li>) : <li>Pendiente carga de datos del municipio</li>}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#1C1B18]">Regidores</p>
          <ul className="max-h-40 space-y-1 overflow-auto text-[11px] text-[#6B6760]">
            {regidores.length ? regidores.map((item, idx) => <li key={idx}>{pendingText(item.cargo)} · {sourceLabel(item)}</li>) : <li>Pendiente carga de datos del municipio</li>}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#1C1B18]">Comisiones permanentes</p>
          <ul className="space-y-1 text-[11px] text-[#6B6760]">
            {comisiones.length ? comisiones.map((item, idx) => <li key={idx}>{pendingText(item.nombre)} · {sourceLabel(item)}</li>) : <li>Pendiente carga de datos del municipio</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}

export function TenantActorsPanel({ profile }: { profile: TenantMunicipalProfile | null }) {
  const actores = profile?.mapa_social?.actores ?? []
  return (
    <section className="mx-auto max-w-6xl py-2">
      <TenantProfileStatus profile={profile} />
      <header className="mx-auto mb-7 max-w-3xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A49C]">Mapa social del tenant</p>
        <p className="mt-2 font-serif text-[38px] leading-none text-[#1C1B18]">{actores.length}/15</p>
        <p className="mt-2 text-[13px] leading-[1.7] text-[#5A5750]">
          actores mínimos con influencia, postura, fecha y evidencia; ningún actor se traslada entre municipios.
        </p>
      </header>
      {actores.length === 0 ? (
        <p className="text-center text-[13px] text-[#8B5A00]">Pendiente carga de datos del municipio</p>
      ) : (
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
          {actores.map((actor, idx) => (
            <div key={String(actor.actor_id ?? idx)} className="border-t border-[#E8E4DC] pt-3">
              <p className="text-[13px] font-semibold text-[#1C1B18]">{pendingText(actor.nombre)}</p>
              <p className="mt-1 text-[11px] text-[#6B6760]">{pendingText(actor.tipo_actor)} · influencia {pendingText(actor.influencia)} · postura {pendingText(actor.postura)}</p>
              <p className="mt-1 text-[10px] text-[#A8A49C]">{pendingText(actor.evidencia_fuente)} · {pendingText(actor.fecha_actualizacion)}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export function TenantOrganigramaServicioPanel({ profile }: { profile: TenantMunicipalProfile | null }) {
  const org = profile?.organigrama_servicio ?? {}
  const roles = Array.isArray(org.roles_operativos) ? org.roles_operativos as Array<Record<string, unknown>> : []
  const turnos = Array.isArray(org.turnos) ? org.turnos as Array<Record<string, unknown>> : []
  const horarios = Array.isArray(org.horarios) ? org.horarios as Array<Record<string, unknown>> : []
  return (
    <section className="mx-auto max-w-5xl py-2">
      <TenantProfileStatus profile={profile} />
      <header className="mx-auto mb-7 max-w-3xl text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#A8A49C]">Organigrama operativo</p>
        <h3 className="mt-2 font-serif text-[24px] leading-tight text-[#1C1B18]">
          Roles, turnos y horarios se tratan como evidencia operativa, no como texto genérico.
        </h3>
      </header>
      <div className="grid gap-8 border-t border-[#E8E4DC] pt-6 md:grid-cols-3">
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#1C1B18]">Roles operativos</p>
          <ul className="space-y-1 text-[11px] text-[#6B6760]">
            {roles.length ? roles.map((role, idx) => <li key={idx}>{pendingText(role.rol)} · {pendingText(role.responsabilidad)}</li>) : <li>Pendiente carga de datos del municipio</li>}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#1C1B18]">Turnos</p>
          <ul className="space-y-1 text-[11px] text-[#6B6760]">
            {turnos.length ? turnos.map((turno, idx) => <li key={idx}>{pendingText(turno.nombre)} · {pendingText(turno.horario)}</li>) : <li>Pendiente carga de datos del municipio</li>}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[#1C1B18]">Horarios</p>
          <ul className="space-y-1 text-[11px] text-[#6B6760]">
            {horarios.length ? horarios.map((horario, idx) => <li key={idx}>{pendingText(horario.actividad)} · {pendingText(horario.horario)}</li>) : <li>Pendiente carga de datos del municipio</li>}
          </ul>
        </div>
      </div>
    </section>
  )
}
