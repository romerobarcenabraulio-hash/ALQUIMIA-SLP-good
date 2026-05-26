'use client'

import { useCallback, useState } from 'react'
import { FileText, Download, Share2, Check } from 'lucide-react'
import { CotizacionRecomendada } from '@/components/simulator/CotizacionRecomendada'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { ExportadorReporte } from '@/components/simulator/ExportadorReporte'
import { GovernancePanel } from '@/components/simulator/GovernancePanel'
import { LaunchChecklist } from '@/components/simulator/LaunchChecklist'
import { cn } from '@/lib/utils'
import { MarginalNote, SectionLabel } from '@/components/editorial'

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ExpedienteCabildoStack() {
  const [urlCopied, setUrlCopied] = useState(false)

  const handleShareUrl = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setUrlCopied(true)
      window.setTimeout(() => setUrlCopied(false), 2500)
    } catch {
      scrollToSection('sim-export-empresa-plan')
    }
  }, [])

  const exportActions: Record<string, () => void> = {
    'PDF ejecutivo': () => scrollToSection('sim-export-empresa-plan'),
    'Excel con supuestos': () => scrollToSection('sim-export-reporte'),
    'Resumen para Cabildo': () => scrollToSection('sim-cotizacion-cabildo'),
    'URL compartida': () => { void handleShareUrl() },
  }

  return (
    <div className="space-y-5 pb-4">

      <div className="flex flex-wrap gap-2">
              {[
                { label: 'PDF ejecutivo', icon: FileText, color: '#C0392B', bg: 'bg-[#FDE8E8]' },
                { label: 'Excel con supuestos', icon: Download, color: '#1A5FA8', bg: 'bg-[#EBF3FB]' },
                { label: 'Resumen para Cabildo', icon: FileText, color: '#3B6D11', bg: 'bg-[#EAF3DE]' },
                { label: 'URL compartida', icon: Share2, color: '#5A4A2A', bg: 'bg-[#F4F2ED]' },
              ].map(({ label, icon: Icon, color, bg }) => (
                <button
                  key={label}
                  type="button"
                  onClick={exportActions[label]}
                  title={
                    label === 'URL compartida'
                      ? 'Copiar enlace a este escenario'
                      : `Ir a la sección de exportación: ${label}`
                  }
                  className={cn('flex items-center gap-1.5 rounded-[8px] border border-[#E8E4DC] px-3 py-1.5 text-[11px] font-medium hover:shadow-sm transition-shadow', bg)}
                >
                  {label === 'URL compartida' && urlCopied ? (
                    <Check className="w-3.5 h-3.5 text-[#3B6D11]" strokeWidth={2} />
                  ) : (
                    <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
                  )}
                  <span style={{ color: label === 'URL compartida' && urlCopied ? '#3B6D11' : color }}>
                    {label === 'URL compartida' && urlCopied ? 'URL copiada' : label}
                  </span>
                </button>
              ))}
      </div>

      <div>
        <SectionLabel>Contenido del expediente</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
          {[
            { num: '01', title: 'Diagnóstico municipal RSU', desc: 'Generación, composición, costo de omisión', fuente: 'M01 + M04' },
            { num: '02', title: 'Marco legal y metas', desc: 'LGPGIR, NOM-083, calendario de implementación', fuente: 'M03 + M05' },
            { num: '03', title: 'Infraestructura propuesta', desc: 'Centros, organigrama, logística', fuente: 'M06 + M07 + M08' },
            { num: '04', title: 'Modelo financiero', desc: 'CAPEX, OPEX, TIR, escenarios, riesgos', fuente: 'M09 + M13 + M14' },
            { num: '05', title: 'Esquema de operación', desc: 'Concesión recomendada, vehículo financiero', fuente: 'M12 + M15' },
            { num: '06', title: 'Cumplimiento de estándares', desc: 'GRI 306, SASB EM-WM, ODS mapeados', fuente: 'M18 + M19' },
          ].map(item => (
            <div key={item.num} className="flex items-start gap-3 rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-3">
              <span className="w-6 h-6 rounded-full bg-[#3B6D11] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{item.num}</span>
              <div>
                <p className="text-[11px] font-semibold text-[#1C1B18]">{item.title}</p>
                <p className="text-[10px] text-[#6B6760]">{item.desc}</p>
                <p className="text-[9px] text-[#A8A49C] mt-0.5">Fuente: {item.fuente}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="sim-cotizacion-cabildo">
        <CotizacionRecomendada />
      </div>
      <ExportarSection />
      <div id="sim-export-reporte">
        <ExportadorReporte />
      </div>
      <GovernancePanel />
      <LaunchChecklist />

      <div className="border-t border-[#E8E4DC] pt-5">
        <SectionLabel>Ruta de contratación (LAASSP)</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 mt-3">
          {[
            { route: 'Licitación pública', when: 'CAPEX > $2M MXN', plazo: '4–8 meses', docs: 'Bases, dictamen técnico, suficiencia' },
            { route: 'Invitación restringida', when: '3 proveedores calificados', plazo: '2–4 meses', docs: 'Criterios de selección, cotizaciones' },
            { route: 'Adjudicación directa', when: 'Urgencia / monto menor', plazo: '2–6 semanas', docs: 'Justificación, cotización única' },
          ].map(r => (
            <div key={r.route} className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] p-4">
              <p className="text-[11px] font-semibold text-[#3B6D11]">{r.route}</p>
              <p className="text-[10px] text-[#6B6760] mt-1">{r.when}</p>
              <p className="text-[10px] font-mono text-[#1A5FA8] mt-2">{r.plazo}</p>
              <p className="text-[9px] text-[#A8A49C] mt-1">{r.docs}</p>
            </div>
          ))}
        </div>
        <ol className="text-[11px] text-[#4A4740] space-y-1.5 list-decimal list-inside">
          <li>Punto de acuerdo en Cabildo + anexo técnico (este expediente)</li>
          <li>Dictamen de suficiencia presupuestal (Tesorería)</li>
          <li>Elaboración de bases / invitación (Compras)</li>
          <li>Fallo y contrato con cláusulas del M11</li>
        </ol>
      </div>

      <MarginalNote className="px-1">
        TIR, VPN y Monte Carlo: M13 · M14
      </MarginalNote>
    </div>
  )
}
