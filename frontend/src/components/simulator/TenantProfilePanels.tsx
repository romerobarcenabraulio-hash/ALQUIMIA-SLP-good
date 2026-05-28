'use client'

import { profileModeLabel, pendingText, type TenantMunicipalProfile } from '@/lib/tenantMunicipalProfile'

function sourceLabel(value: unknown): string {
  if (!value || typeof value !== 'object') return 'Fuente pendiente'
  const obj = value as Record<string, unknown>
  const fuente = obj.fuente
  if (fuente && typeof fuente === 'object') {
    const f = fuente as Record<string, unknown>
    return `${String(f.label ?? 'Fuente pendiente')} · ${String(f.status ?? 'pendiente_verificacion')}`
  }
  return String(obj.estado ?? obj.status ?? 'pendiente_verificacion')
}

export function TenantProfileStatus({ profile }: { profile: TenantMunicipalProfile | null }) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-center gap-x-4 gap-y-1 text-center text-[11px] text-[#6B6760]">
      <span className="text-[13px] font-semibold text-[#1C1B18]">{profileModeLabel(profile?.mode)}</span>
      <span className="text-[#8B5A00]">{profile?.provenance_status ?? 'pendiente_verificacion'}</span>
      <span>Nada estimado se presenta como oficial.</span>
    </div>
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
