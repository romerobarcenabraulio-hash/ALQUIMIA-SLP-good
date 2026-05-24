'use client'

import { useMemo } from 'react'
import {
  Building2, ChevronRight, Network, Users, AlertTriangle, ClipboardList, Scale,
} from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { OrganigramaJerarquico } from '@/components/simulator/OrganigramaJerarquico'
import { ProvenanceBadge } from '@/components/ui/ProvenanceBadge'
import { cn } from '@/lib/utils'
import {
  CADENA_CONTACTO_RSU,
  VACIOS_ORGANIZACIONALES,
  CHECKLIST_CAMPO_ORG,
  VERIFICACION_LABEL,
  VERIFICACION_STYLE,
  cadenaContactoId,
  type VerificacionOrg,
} from '@/data/organigramaDiagnostico'
import {
  ORGANIGRAMA_MUNICIPAL_JERARQUICO,
  flattenOrganigramaNodes,
} from '@/data/organigramaMunicipalCanon'

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

export function OrganigramaDiagnosticoStack() {
  const {
    municipiosActivos,
    organigramaDiagnostico,
    setOrganigramaVerificacion,
    toggleOrganigramaChecklist,
    setOrganigramaNotaCampo,
  } = useSimulatorStore()

  const resolveVerificacion = (nodoId: string, fallback: VerificacionOrg): VerificacionOrg =>
    organigramaDiagnostico.verificaciones[nodoId] ?? fallback

  const nodosJerarquicos = useMemo(
    () => flattenOrganigramaNodes(ORGANIGRAMA_MUNICIPAL_JERARQUICO, false),
    [],
  )

  const stats = useMemo(() => {
    const all: { verificacion: VerificacionOrg }[] = [
      ...CADENA_CONTACTO_RSU.map(p => ({
        verificacion: resolveVerificacion(cadenaContactoId(p.orden), p.verificacion),
      })),
      ...nodosJerarquicos.map(n => ({
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
    const legislativo = nodosJerarquicos.filter(n => n.rama === 'legislativo').length
    const ejecutivo = nodosJerarquicos.filter(n => n.rama === 'ejecutivo').length
    const operador = nodosJerarquicos.filter(n => n.rama === 'operador' || n.rama === 'interfaz').length
    return {
      ...counts,
      total,
      pctConfirmado: total ? Math.round((cubierto / total) * 100) : 0,
      checklistDone,
      legislativo,
      ejecutivo,
      operador,
    }
  }, [organigramaDiagnostico, nodosJerarquicos])

  return (
    <div className="space-y-5 pb-6">

      <div className="flex flex-wrap gap-2 items-center">
        <ProvenanceBadge
          tipo="manual"
          confianza={0.35}
          fuente="Plantilla Art. 115 + LOM estatal"
          advertencia="Validar organigrama firmado y concesionario antes de cabildo."
        />
        <span className="text-[10px] text-[#A8A49C]">
          {stats.pctConfirmado}% confirmados · checklist {stats.checklistDone}/{CHECKLIST_CAMPO_ORG.length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {[
          { icon: Scale, label: 'Legislativo', value: String(stats.legislativo) },
          { icon: Building2, label: 'Ejecutivo', value: String(stats.ejecutivo) },
          { icon: Network, label: 'Operador', value: String(stats.operador) },
          { icon: Users, label: 'Cadena contacto', value: String(CADENA_CONTACTO_RSU.length) },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-[10px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-[#3B6D11]" strokeWidth={2} />
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
            </div>
            <p className="font-semibold text-[18px] text-[#1C1B18]">{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
        <OrganigramaJerarquico
          resolveVerificacion={resolveVerificacion}
          onVerificacionChange={setOrganigramaVerificacion}
        />
      </section>

      <section className="rounded-[12px] border border-[#E8E4DC] bg-white overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F0EDE5]">
          <p className="text-[12px] font-semibold text-[#1C1B18]">Cadena de contacto</p>
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
                  <p className="text-[10px] text-[#6B6760] mb-2">{paso.rol} · {paso.canal}</p>
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

      <section className="rounded-[12px] border border-[#F5DCA0] bg-[#FEF7E7]/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-[#D4881E]" />
          <p className="text-[12px] font-semibold text-[#6B4800]">Vacíos e interfaces (hipótesis)</p>
        </div>
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
          Siguiente: M03 capacidad institucional · M07 organigrama objetivo.
        </p>
      </section>
    </div>
  )
}
