'use client'

import { useMemo } from 'react'
import {
  Building2, ChevronRight, HelpCircle, Network, Users, AlertTriangle, ClipboardList,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { cn } from '@/lib/utils'
import {
  CADENA_CONTACTO_RSU,
  ORGANIGRAMA_MUNICIPAL_AS_IS,
  ORGANIGRAMA_CONCESIONARIO_AS_IS,
  VACIOS_ORGANIZACIONALES,
  CHECKLIST_CAMPO_ORG,
  VERIFICACION_LABEL,
  VERIFICACION_STYLE,
  cadenaContactoId,
  type VerificacionOrg,
} from '@/data/organigramaDiagnostico'

const VERIFICACION_OPTIONS: VerificacionOrg[] = ['confirmado', 'pendiente', 'desconocido', 'referencia']

function VerificacionChip({ v }: { v: VerificacionOrg }) {
  const s = VERIFICACION_STYLE[v]
  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-semibold"
      style={{ background: s.bg, color: s.text, borderColor: s.border }}
    >
      {VERIFICACION_LABEL[v]}
    </span>
  )
}

function OrgNodeCard({
  titulo,
  subtitulo,
  verificacion,
  pregunta,
  onVerificacionChange,
}: {
  titulo: string
  subtitulo: string
  verificacion: VerificacionOrg
  pregunta: string
  onVerificacionChange: (v: VerificacionOrg) => void
}) {
  return (
    <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-3.5">
      <div className="flex flex-wrap items-start justify-between gap-2 mb-1.5">
        <p className="text-[12px] font-semibold text-[#1C1B18]">{titulo}</p>
        <VerificacionChip v={verificacion} />
      </div>
      <p className="text-[10px] text-[#6B6760] mb-2">{subtitulo}</p>
      <p className="text-[10px] text-[#5A4A2A] flex items-start gap-1.5 mb-2">
        <HelpCircle className="w-3 h-3 shrink-0 mt-0.5 text-[#D4881E]" />
        {pregunta}
      </p>
      <label className="flex flex-col gap-1">
        <span className="text-[9px] uppercase tracking-[0.06em] font-semibold text-[#8A9286]">
          Estatus en campo
        </span>
        <select
          value={verificacion}
          onChange={e => onVerificacionChange(e.target.value as VerificacionOrg)}
          className="h-9 rounded-[8px] border border-[#E7E5DC] bg-[#FAFAF7] px-2 text-[11px] text-[#1F2933]"
          aria-label={`Verificación: ${titulo}`}
        >
          {VERIFICACION_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{VERIFICACION_LABEL[opt]}</option>
          ))}
        </select>
      </label>
    </div>
  )
}

export function OrganigramaDiagnosticoStack() {
  const {
    municipiosActivos,
    zmActiva,
    seleccionMunicipioCatalog,
    organigramaDiagnostico,
    setOrganigramaVerificacion,
    toggleOrganigramaChecklist,
    setOrganigramaNotaCampo,
  } = useSimulatorStore()
  const municipioLabel = seleccionMunicipioCatalog?.nombre ?? municipiosActivos[0] ?? 'municipio activo'

  const resolveVerificacion = (nodoId: string, fallback: VerificacionOrg): VerificacionOrg =>
    organigramaDiagnostico.verificaciones[nodoId] ?? fallback

  const stats = useMemo(() => {
    const all: { verificacion: VerificacionOrg }[] = [
      ...CADENA_CONTACTO_RSU.map(p => ({
        verificacion: resolveVerificacion(cadenaContactoId(p.orden), p.verificacion),
      })),
      ...ORGANIGRAMA_MUNICIPAL_AS_IS.map(n => ({
        verificacion: resolveVerificacion(n.id, n.verificacion),
      })),
      ...ORGANIGRAMA_CONCESIONARIO_AS_IS.map(n => ({
        verificacion: resolveVerificacion(n.id, n.verificacion),
      })),
    ]
    const counts = { confirmado: 0, pendiente: 0, desconocido: 0, referencia: 0 }
    for (const n of all) counts[n.verificacion]++
    const total = all.length
    const cubierto = counts.confirmado
    const checklistDone = CHECKLIST_CAMPO_ORG.filter(
      (_, i) => organigramaDiagnostico.checklistCompletado[`chk-${i}`],
    ).length
    return { ...counts, total, pctConfirmado: total ? Math.round((cubierto / total) * 100) : 0, checklistDone }
  }, [organigramaDiagnostico])

  return (
    <div className="space-y-5 pb-6">
      <ScopeAnclaKicker />

      <div className="rounded-[12px] border border-[#D7E8C0] bg-gradient-to-br from-[#F4FAEC] to-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.06em] text-[#5A9438] mb-1">M02D · Gobernanza operativa</p>
        <h2 className="font-serif text-[22px] text-[#1C1B18]">Organigrama actual — diagnóstico as-is</h2>
        <p className="mt-2 text-[13px] text-[#6B6760] leading-relaxed max-w-3xl">
          No asumimos que ya conocemos la organización de {municipioLabel} ni del concesionario de limpia.
          Este módulo mapea <strong>desde el primer contacto ciudadano hasta cabildo</strong>, con estatus
          de verificación explícito. El M07 (Planificación) diseña la estructura objetivo; aquí documentamos
          cómo está hoy.
        </p>
        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <ProvenanceBadge tipo="manual" confianza={0.35} fuente="Plantilla metodológica ALQUIMIA" advertencia="Validar organigrama y concesionario en campo antes de usar en cabildo." />
          <span className="text-[10px] text-[#A8A49C]">
            ZM {zmActiva} · {stats.pctConfirmado}% nodos confirmados · checklist {stats.checklistDone}/{CHECKLIST_CAMPO_ORG.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { icon: Users, label: 'Pasos cadena contacto', value: String(CADENA_CONTACTO_RSU.length), sub: 'Ciudadano → cabildo' },
          { icon: Building2, label: 'Nodos municipio', value: String(ORGANIGRAMA_MUNICIPAL_AS_IS.length), sub: 'Titularidades RSU' },
          { icon: Network, label: 'Nodos operador', value: String(ORGANIGRAMA_CONCESIONARIO_AS_IS.length), sub: 'Concesionario + interfaz' },
          { icon: AlertTriangle, label: 'Vacíos detectados', value: String(VACIOS_ORGANIZACIONALES.length), sub: 'Plantilla inicial' },
        ].map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-[#3B6D11]" strokeWidth={2} />
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
            </div>
            <p className="font-semibold text-[18px] text-[#1C1B18]">{value}</p>
            <p className="text-[9px] text-[#A8A49C]">{sub}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EDE5]">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Cadena de primer contacto a decisión</p>
          <p className="text-[10px] text-[#A8A49C] mt-0.5">Lo primero que encuentra el ciudadano y cómo escala hasta quien decide</p>
        </div>
        <ol className="divide-y divide-[#F0EDE5]">
          {CADENA_CONTACTO_RSU.map(paso => {
            const nodoId = cadenaContactoId(paso.orden)
            const v = resolveVerificacion(nodoId, paso.verificacion)
            return (
              <li key={paso.orden} className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#1C2B15] text-white flex items-center justify-center text-[11px] font-bold">
                  {paso.orden}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="text-[12px] font-semibold text-[#1C1B18]">{paso.quien}</p>
                    <VerificacionChip v={v} />
                  </div>
                  <p className="text-[10px] text-[#6B6760] mb-1"><span className="font-medium text-[#4A4740]">Rol:</span> {paso.rol}</p>
                  <p className="text-[10px] text-[#6B6760] mb-2"><span className="font-medium text-[#4A4740]">Canal:</span> {paso.canal}</p>
                  <p className="text-[10px] text-[#5A4A2A] flex items-start gap-1 mb-2">
                    <ChevronRight className="w-3 h-3 shrink-0 mt-0.5 text-[#3B6D11]" />
                    {paso.queResuelve}
                  </p>
                  <label className="flex flex-col gap-1 max-w-xs">
                    <span className="text-[9px] uppercase tracking-[0.06em] font-semibold text-[#8A9286]">Estatus en campo</span>
                    <select
                      value={v}
                      onChange={e => setOrganigramaVerificacion(nodoId, e.target.value as VerificacionOrg)}
                      className="h-9 rounded-[8px] border border-[#E7E5DC] bg-[#FAFAF7] px-2 text-[11px]"
                      aria-label={`Verificación paso ${paso.orden}`}
                    >
                      {VERIFICACION_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{VERIFICACION_LABEL[opt]}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </li>
            )
          })}
        </ol>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-[12px] border border-[#BDD7F5] bg-[#EBF3FB]/40 p-4 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#1A5FA8]">Gobierno municipal — RSU</p>
          {ORGANIGRAMA_MUNICIPAL_AS_IS.map(n => (
            <OrgNodeCard
              key={n.id}
              titulo={n.titulo}
              subtitulo={n.subtitulo}
              verificacion={resolveVerificacion(n.id, n.verificacion)}
              pregunta={n.preguntaCampo}
              onVerificacionChange={v => setOrganigramaVerificacion(n.id, v)}
            />
          ))}
        </section>
        <section className="rounded-[12px] border border-[#E5D5C5] bg-[#FAF6F2]/60 p-4 space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-[#8B6B4A]">Operador / concesionario — as-is</p>
          {ORGANIGRAMA_CONCESIONARIO_AS_IS.map(n => (
            <OrgNodeCard
              key={n.id}
              titulo={n.titulo}
              subtitulo={n.subtitulo}
              verificacion={resolveVerificacion(n.id, n.verificacion)}
              pregunta={n.preguntaCampo}
              onVerificacionChange={v => setOrganigramaVerificacion(n.id, v)}
            />
          ))}
        </section>
      </div>

      <section className="rounded-[12px] border border-[#F5DCA0] bg-[#FEF7E7]/50 p-5">
        <p className="text-[12px] font-semibold text-[#6B4800] mb-3">Vacíos, duplicidades e interfaces rotas (hipótesis de trabajo)</p>
        <div className="space-y-2">
          {VACIOS_ORGANIZACIONALES.map(v => (
            <div key={v.id} className="rounded-[8px] border border-[#F5DCA0] bg-white px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[9px] font-bold uppercase text-[#D4881E]">{v.tipo.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-[11px] text-[#1C1B18] font-medium">{v.descripcion}</p>
              <p className="text-[10px] text-[#6B6760] mt-1">Impacto: {v.impacto}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList className="w-4 h-4 text-[#3B6D11]" />
          <p className="text-[12px] font-semibold text-[#1C1B18]">Checklist de verificación en campo</p>
        </div>
        <ul className="space-y-2">
          {CHECKLIST_CAMPO_ORG.map((item, i) => {
            const chkId = `chk-${i}`
            const done = organigramaDiagnostico.checklistCompletado[chkId] ?? false
            return (
              <li key={chkId}>
                <label className="flex items-start gap-2.5 cursor-pointer text-[11px] text-[#4A4740] leading-relaxed">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggleOrganigramaChecklist(chkId)}
                    className="mt-1 shrink-0 rounded border-[#C9DDB1] text-[#2F6B1F]"
                  />
                  <span className={cn(done && 'text-[#5F6B5F] line-through decoration-[#C9DDB1]')}>{item}</span>
                </label>
              </li>
            )
          })}
        </ul>
        <label className="mt-4 block">
          <span className="text-[9px] uppercase tracking-[0.06em] font-semibold text-[#8A9286]">Notas de campo</span>
          <textarea
            value={organigramaDiagnostico.notaCampo}
            onChange={e => setOrganigramaNotaCampo(e.target.value)}
            rows={3}
            placeholder="Titulares confirmados, hallazgos de entrevistas, enlaces a organigramas PDF…"
            className="mt-1 w-full rounded-[10px] border border-[#E7E5DC] bg-[#FAFAF7] px-3 py-2 text-[12px] text-[#1F2933] resize-y min-h-[72px]"
          />
        </label>
        <p className={cn('mt-4 text-[10px] text-[#A8A49C] border-t border-[#F0EDE5] pt-3')}>
          Al completar este diagnóstico, continúe a M03 Capacidad institucional y M07 Organigrama objetivo en Planificación.
        </p>
      </section>
    </div>
  )
}
