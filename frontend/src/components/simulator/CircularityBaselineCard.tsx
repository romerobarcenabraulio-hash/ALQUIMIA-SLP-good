'use client'

import { AlertTriangle, Database } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'

export function CircularityBaselineCard() {
  const { circularityBaseline, circularityBaselineLoading, portalError } = useSimulatorStore()

  return (
    <section className="section" aria-labelledby="baseline-title">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">Baseline actual antes de metas futuras</p>
      <h2 id="baseline-title" className="font-serif text-[24px] text-[#1C1B18] mb-4">Circularidad RSU actual</h2>

      {circularityBaselineLoading && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#6B6760]">
          Calculando baseline con fuente, confianza e incertidumbre...
        </div>
      )}

      {!circularityBaselineLoading && portalError && (
        <div className="rounded-[8px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-800">
          {portalError}
        </div>
      )}

      {!circularityBaselineLoading && !portalError && !circularityBaseline && (
        <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[12px] text-[#8A857C]">
          Selecciona ciudad para cargar baseline RSU actual. No se muestran metas futuras sin baseline.
        </div>
      )}

      {!circularityBaselineLoading && circularityBaseline && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[12px] text-[#6B6760]">{circularityBaseline.city_name}</p>
              <p className="mt-1 font-mono text-[34px] leading-none text-[#1C1B18]">
                {circularityBaseline.current_circularity_pct.toFixed(1)}%
              </p>
              <p className="mt-2 text-[12px] text-[#6B6760]">{circularityBaseline.interpretation}</p>
            </div>
            <div className="rounded-[8px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
              <span className="inline-flex items-center gap-1 font-semibold">
                <AlertTriangle size={14} aria-hidden="true" />
                Estimada, no oficial
              </span>
              <p className="mt-1">Incertidumbre +/- {circularityBaseline.uncertainty_pct_points.toFixed(1)} pp</p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <Metric label="RSU municipal estimado" value={`${circularityBaseline.rsu_total_ton_day_est.toLocaleString('es-MX')} t/dia`} />
            <Metric label="Recuperacion estimada" value={`${circularityBaseline.material_recovery_ton_day_est.toLocaleString('es-MX')} t/dia`} />
            <Metric label="Confianza" value={`${Math.round(circularityBaseline.confidence * 100)}%`} />
          </div>

          <div className="mt-4 rounded-[8px] border border-[#E8E4DC] bg-[#F8F6F1] p-3">
            <p className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#1C1B18]">
              <Database size={14} aria-hidden="true" />
              Fuente: {circularityBaseline.provenance.fuente_nombre}
            </p>
            <p className="mt-1 text-[11px] text-[#6B6760]">
              Tipo {circularityBaseline.provenance.tipo} · organismo {circularityBaseline.provenance.fuente_organismo} · confianza fuente {Math.round(circularityBaseline.provenance.confianza * 100)}%
            </p>
            {circularityBaseline.provenance.advertencia && (
              <p className="mt-2 text-[11px] text-amber-900">{circularityBaseline.provenance.advertencia}</p>
            )}
          </div>

          <div className="mt-3 grid gap-2">
            {circularityBaseline.warnings.map(warning => (
              <p key={warning} className="rounded-[6px] bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                {warning}
              </p>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-3">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 font-mono text-[16px] text-[#1C1B18]">{value}</p>
    </div>
  )
}

