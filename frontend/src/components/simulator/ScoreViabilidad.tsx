'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'

export function ScoreViabilidad() {
  const { resultados } = useSimulatorStore()
  const score = resultados?.scorePolitico ?? 0
  const esgDelta = resultados?.ratingESGDelta ?? 0

  const nivel = score >= 70 ? { label: 'Muy viable', color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]' }
    : score >= 50 ? { label: 'Viable con ajustes', color: 'text-[#D4881E]', bg: 'bg-[#FEF7E7]' }
    : { label: 'Requiere trabajo político', color: 'text-[#C0392B]', bg: 'bg-[#FBEAEA]' }

  const components = [
    { label: 'Ambición año 1', score: Math.min(25, (resultados?.serieAnual[0]?.pctCaptura ?? 0) * 0.4) },
    { label: 'Payback vs período gov.', score: Math.min(25, resultados ? 25 - resultados.paybackMeses / 3 : 0) },
    { label: 'Empleos generados', score: Math.min(25, (resultados?.empleosTotalesDirectos ?? 0) * 0.2) },
    { label: 'CAPEX municipal', score: Math.min(15, 15) },
    { label: 'Formalización pepenadores', score: Math.min(10, 5) },
  ]

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S17 — Score de viabilidad política</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-4">¿Qué tan viable políticamente?</h2>

      <div className="flex items-start gap-6 mb-6">
        {/* Score circular */}
        <div className={cn('rounded-full w-28 h-28 flex flex-col items-center justify-center border-4', nivel.bg,
          score >= 70 ? 'border-[#3B6D11]' : score >= 50 ? 'border-[#D4881E]' : 'border-[#C0392B]')}>
          <span className={cn('font-mono text-[32px] font-medium', nivel.color)}>{score}</span>
          <span className={cn('text-[10px]', nivel.color)}>/100</span>
        </div>

        <div className="flex-1">
          <p className={cn('text-[16px] font-medium mb-1', nivel.color)}>{nivel.label}</p>
          <p className="text-[13px] text-[#6B6760] mb-3">
            Basado en 5 componentes: ambición, retorno en período de gobierno,
            empleos, inversión municipal y formalización de pepenadores.
          </p>
          {/* Barras de componentes */}
          <div className="flex flex-col gap-2">
            {components.map(c => (
              <div key={c.label} className="flex items-center gap-3">
                <span className="text-[11px] text-[#6B6760] w-44 shrink-0">{c.label}</span>
                <div className="flex-1 h-1.5 bg-[#E2DED6] rounded-full">
                  <div className="h-full bg-[#3B6D11] rounded-full" style={{ width: `${Math.min(100, c.score * 4)}%` }} />
                </div>
                <span className="font-mono text-[11px] text-[#1C1B18] w-6 text-right">{c.score.toFixed(0)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ESG — Bug 4 fix: score 0-100 normalizado, no co2eEvitadas/1000 */}
      <div className="bg-[#EBF3FB] rounded-[12px] p-4">
        <p className="text-[11px] text-[#1A5FA8] font-medium mb-1">Score ESG municipal</p>
        <p className="font-mono text-[24px] text-[#1A5FA8]">{esgDelta.toFixed(0)}<span className="text-[14px] ml-1">/100</span></p>
        <p className="text-[11px] text-[#6B6760]">CO₂e (25 pts) · empleo formal (40 pts) · pureza operativa (20 pts) · gobernanza (15 pts)</p>
      </div>
    </div>
  )
}
