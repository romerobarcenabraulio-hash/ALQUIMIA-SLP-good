'use client'

import { AlertTriangle, ArrowRight, CheckCircle2, CircleDollarSign, FileSearch, GitBranch, Route } from 'lucide-react'
import { renderableClaims, type ConsultingPackage } from '@/lib/consultingPackageEngine'

function shortMoney(value: number | null) {
  if (value === null) return 'Bloqueado'
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}k`
  return `$${value.toLocaleString('es-MX')}`
}

function DiagramFrame({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-t border-[#D8D2C5] pt-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6B6760]">{eyebrow}</p>
      <h3 className="mt-1 font-serif text-[22px] leading-tight text-[#1C1B18]">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function RsuFlowDiagram({ pkg }: { pkg: ConsultingPackage }) {
  const generation = pkg.claim_ledger.find(entry => entry.id.includes('rsu_generation'))
  const characterizationBlocked = pkg.evidence_gaps.some(gap => /cuarteo|caracterizaci/i.test(`${gap.label} ${gap.reason}`))
  const buyersBlocked = !pkg.input_registry.buyers_available
  const steps = [
    {
      label: 'Generación',
      value: generation && generation.confidence !== 'blocked' ? generation.claim.replace(/^.*?:\s*/, '') : 'Sin cifra afirmable',
      status: generation && generation.confidence !== 'blocked' ? 'ready' : 'conditioned',
    },
    {
      label: 'Caracterización',
      value: characterizationBlocked ? 'Brecha local' : 'Fuente disponible',
      status: characterizationBlocked ? 'blocked' : 'ready',
    },
    {
      label: 'Captura privada',
      value: `${pkg.private_generator_mix.length} categorías`,
      status: 'conditioned',
    },
    {
      label: 'Mercado',
      value: buyersBlocked ? 'Compradores faltantes' : 'Precio escenario',
      status: buyersBlocked ? 'blocked' : 'ready',
    },
  ]

  return (
    <div className="grid gap-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:items-stretch">
      {steps.map((step, index) => (
        <div key={step.label} className="contents">
          <div className={`min-h-[112px] border p-4 ${step.status === 'ready' ? 'border-[#C9DDB1] bg-[#F7FBF2]' : step.status === 'blocked' ? 'border-[#EBC0BA] bg-[#FBEAEA]' : 'border-[#D7B56D] bg-[#FFF9EA]'}`}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">{step.label}</p>
            <p className="mt-3 font-serif text-[21px] leading-tight text-[#1C1B18]">{step.value}</p>
          </div>
          {index < steps.length - 1 && (
            <div className="hidden items-center justify-center text-[#8C8880] lg:flex">
              <ArrowRight size={18} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function PrivateCaptureMap({ pkg }: { pkg: ConsultingPackage }) {
  const visible = pkg.private_generator_mix.slice(0, 10)
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
      {visible.map(item => (
        <div key={item.id} className="min-h-[104px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[12px] font-semibold leading-5 text-[#1C1B18]">{item.label}</p>
            <span className={`shrink-0 border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.08em] ${item.evidence_status === 'documented' ? 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]' : 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]'}`}>
              {item.share_pct === null ? 'Brecha' : `${item.share_pct}%`}
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">{item.material_bias.slice(0, 3).join(' · ')}</p>
        </div>
      ))}
    </div>
  )
}

function ScenarioLadder({ pkg }: { pkg: ConsultingPackage }) {
  const maxRevenue = Math.max(...pkg.scenario_set.scenarios.map(scenario => scenario.gross_revenue_mxn_month ?? 0), 1)
  return (
    <div className="space-y-3">
      {pkg.scenario_set.scenarios.map(scenario => {
        const pct = Math.max(8, Math.round(((scenario.gross_revenue_mxn_month ?? 0) / maxRevenue) * 100))
        return (
          <div key={scenario.id} className="grid gap-2 md:grid-cols-[160px_minmax(0,1fr)_120px] md:items-center">
            <div>
              <p className="text-[12px] font-semibold text-[#1C1B18]">{scenario.label}</p>
              <p className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760]">{scenario.confidence}</p>
            </div>
            <div className="h-8 border border-[#E8E4DC] bg-[#FDFCFA]">
              <div
                className={`h-full ${scenario.confidence === 'blocked' ? 'bg-[#EBC0BA]' : 'bg-[#8AA66F]'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="font-mono text-[12px] text-[#1C1B18]">{shortMoney(scenario.gross_revenue_mxn_month)}</p>
          </div>
        )
      })}
    </div>
  )
}

function RiskMatrixDiagram({ pkg }: { pkg: ConsultingPackage }) {
  const risks = pkg.risk_matrix.slice(0, 6)
  const cells = ['Bajo', 'Medio', 'Alto', 'Medio', 'Alto', 'Crítico', 'Alto', 'Crítico', 'Crítico']
  return (
    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <div className="grid grid-cols-3 gap-1 text-center text-[11px] font-semibold">
        {cells.map((label, index) => (
          <div key={`${label}-${index}`} className={`min-h-[54px] p-2 ${label === 'Crítico' ? 'bg-[#FBEAEA] text-[#A8322A]' : label === 'Alto' ? 'bg-[#FFF9EA] text-[#765814]' : 'bg-[#EAF3DE] text-[#2F5B0D]'}`}>
            {label}
          </div>
        ))}
      </div>
      <div className="divide-y divide-[#E8E4DC] border-y border-[#E8E4DC]">
        {risks.map(item => (
          <div key={item.risk} className="grid gap-2 py-3 md:grid-cols-[120px_minmax(0,1fr)]">
            <span className={`w-fit border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${item.level === 'high' ? 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]' : item.level === 'medium' ? 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]' : 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'}`}>
              {item.level}
            </span>
            <div>
              <p className="text-[12px] font-semibold text-[#1C1B18]">{item.risk}</p>
              <p className="mt-1 text-[11px] leading-5 text-[#6B6760]">{item.mitigation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EvidenceClaimMap({ pkg }: { pkg: ConsultingPackage }) {
  const claims = renderableClaims(pkg.claim_ledger).slice(0, 4)
  const gaps = pkg.evidence_gaps.slice(0, 4)
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className="border border-[#C9DDB1] bg-[#F7FBF2] p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-[#2F5B0D]" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#2F5B0D]">Claims afirmables</p>
        </div>
        <div className="mt-3 divide-y divide-[#DDE8D1]">
          {claims.length ? claims.map(claim => (
            <p key={claim.id} className="py-2 text-[11px] leading-5 text-[#1C1B18]">{claim.claim}</p>
          )) : <p className="py-2 text-[11px] leading-5 text-[#6B6760]">Sin claims afirmables todavía.</p>}
        </div>
      </div>
      <div className="border border-[#D7B56D] bg-[#FFF9EA] p-4">
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-[#765814]" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#765814]">Brechas que limitan</p>
        </div>
        <div className="mt-3 divide-y divide-[#F1DFAE]">
          {gaps.length ? gaps.map(gap => (
            <p key={gap.id} className="py-2 text-[11px] leading-5 text-[#5C574F]">{gap.label}: {gap.blocks.join(', ')}</p>
          )) : <p className="py-2 text-[11px] leading-5 text-[#6B6760]">Sin brechas críticas en el paquete actual.</p>}
        </div>
      </div>
    </div>
  )
}

function RoadmapDiagram({ pkg }: { pkg: ConsultingPackage }) {
  return (
    <div className="grid gap-2 md:grid-cols-5">
      {pkg.roadmap.map((item, index) => (
        <div key={item.phase} className="border border-[#E8E4DC] bg-[#FDFCFA] p-3">
          <p className="font-mono text-[11px] text-[#8C8880]">0{index + 1}</p>
          <p className="mt-2 text-[12px] font-semibold text-[#1C1B18]">{item.phase}</p>
          <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">{item.output}</p>
        </div>
      ))}
    </div>
  )
}

export function ConsultingDiagramSuite({ pkg }: { pkg: ConsultingPackage }) {
  return (
    <section className="mt-8 space-y-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DiagramFrame eyebrow="Figura 1" title="Flujo 100% RSU">
          <RsuFlowDiagram pkg={pkg} />
        </DiagramFrame>
        <DiagramFrame eyebrow="Figura 2" title="Mapa de captura privada">
          <PrivateCaptureMap pkg={pkg} />
        </DiagramFrame>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <DiagramFrame eyebrow="Figura 3" title="Cascada de escenarios">
          <ScenarioLadder pkg={pkg} />
        </DiagramFrame>
        <DiagramFrame eyebrow="Figura 4" title="Matriz riesgo-impacto">
          <RiskMatrixDiagram pkg={pkg} />
        </DiagramFrame>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <DiagramFrame eyebrow="Figura 5" title="Evidencia por claim">
          <EvidenceClaimMap pkg={pkg} />
        </DiagramFrame>
        <DiagramFrame eyebrow="Figura 6" title="Hoja de ruta por fases">
          <RoadmapDiagram pkg={pkg} />
        </DiagramFrame>
      </div>

      <div className="grid gap-3 text-[12px] text-[#6B6760] md:grid-cols-3">
        {[
          { icon: FileSearch, label: 'Cada figura hereda fuente, método y confianza del paquete.' },
          { icon: CircleDollarSign, label: 'Las cifras bloqueadas no se sustituyen con estimaciones decorativas.' },
          { icon: GitBranch, label: 'Municipio, ZM y benchmark permanecen separados.' },
          { icon: Route, label: 'La ruta muestra gates humanos, no decisiones automáticas.' },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-start gap-2 border-t border-[#E8E4DC] pt-3">
              <Icon size={15} className="mt-0.5 shrink-0 text-[#6B6760]" />
              <span>{item.label}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}
