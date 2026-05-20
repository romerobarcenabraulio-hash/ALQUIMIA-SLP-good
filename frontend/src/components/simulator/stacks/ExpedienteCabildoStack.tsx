'use client'

import { FileText, Download, Share2, Zap } from 'lucide-react'
import { CotizacionRecomendada } from '@/components/simulator/CotizacionRecomendada'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { ExportadorReporte } from '@/components/simulator/ExportadorReporte'
import { GovernancePanel } from '@/components/simulator/GovernancePanel'
import { LaunchChecklist } from '@/components/simulator/LaunchChecklist'
import { cn } from '@/lib/utils'

export function ExpedienteCabildoStack() {
  return (
    <div className="space-y-5 pb-4">

      {/* Hero */}
      <div className="rounded-[12px] border border-[#D7E8C0] bg-gradient-to-br from-[#F4FAEC] to-[#EBF3FB] p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-10 h-10 rounded-[10px] bg-[#3B6D11] flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-semibold text-[#1A4200] mb-1">Expediente completo para sesión de Cabildo</p>
            <p className="text-[12px] text-[#5A6347] mb-3">
              Todo lo que necesitas para presentar el programa ante Cabildo y obtener la autorización de inversión.
              El expediente incluye: análisis financiero, cotización, plan de gobernanza y checklist de arranque.
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'PDF ejecutivo', icon: FileText, color: '#C0392B', bg: 'bg-[#FDE8E8]' },
                { label: 'Excel con supuestos', icon: Download, color: '#1A5FA8', bg: 'bg-[#EBF3FB]' },
                { label: 'Resumen para Cabildo', icon: FileText, color: '#3B6D11', bg: 'bg-[#EAF3DE]' },
                { label: 'URL compartida', icon: Share2, color: '#5A4A2A', bg: 'bg-[#F4F2ED]' },
              ].map(({ label, icon: Icon, color, bg }) => (
                <button key={label} type="button"
                  className={cn('flex items-center gap-1.5 rounded-[8px] border border-[#E8E4DC] px-3 py-1.5 text-[11px] font-medium hover:shadow-sm transition-shadow', bg)}>
                  <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
                  <span style={{ color }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What a complete cabildo package includes */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-6 py-5">
        <p className="text-[12px] font-semibold text-[#1C1B18] mb-3">El expediente contiene</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            { num: '01', title: 'Diagnóstico municipal RSU', desc: 'Generación, composición, contrafactual', fuente: 'M01 + M04' },
            { num: '02', title: 'Marco legal y metas', desc: 'LGPGIR, NOM-083, calendario de implementación', fuente: 'M03 + M05' },
            { num: '03', title: 'Infraestructura propuesta', desc: 'Centros, organigrama, logística', fuente: 'M06 + M07 + M08' },
            { num: '04', title: 'Modelo financiero', desc: 'CAPEX, OPEX, TIR, escenarios, riesgos', fuente: 'M09 + M13 + M14' },
            { num: '05', title: 'Esquema de operación', desc: 'Concesión recomendada, vehículo financiero', fuente: 'M12 + M15' },
            { num: '06', title: 'Cumplimiento de estándares', desc: 'GRI 306, SASB EM-WM, ODS mapeados', fuente: 'M20 + M21' },
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

      <CotizacionRecomendada />
      <ExportarSection />
      <ExportadorReporte />
      <GovernancePanel />
      <LaunchChecklist />

      {/* Cross-reference note */}
      <div className="rounded-[10px] border border-[#D7E8C0] bg-[#EAF3DE] px-4 py-3 text-[11px] text-[#3B5F23]">
        <span className="font-semibold">Análisis financiero completo:</span> Para ver TIR, VPN, Monte Carlo y análisis de sensibilidad, ve a M13 Retorno Financiero y M14 Análisis de Riesgo.
      </div>
    </div>
  )
}
