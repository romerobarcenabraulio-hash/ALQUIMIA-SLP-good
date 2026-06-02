'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, BarChart3, FileSearch, GitBranch, Lock, Route } from 'lucide-react'
import {
  buildConsultingPackage,
  renderableClaims,
  type ConsultingPackage,
} from '@/lib/consultingPackageEngine'
import { tenantMunicipalContextHeadersFromStorage } from '@/lib/tenantRuntimeMunicipalContext'
import { buildConsultingInputRegistry } from '@/lib/consultingInputRegistry'
import type { TenantDiagnosticData } from '@/lib/tenantDiagnosticData'
import type { TenantConsultingPackageResponse } from '@/lib/tenantConsultingPackageResponse'
import { ConsultingDiagramSuite } from '@/components/platform/ConsultingDiagrams'

function consultingPackageRequestHeaders(tenantId: string, enableApiLayerFetch: boolean): Record<string, string> {
  return {
    'x-tenant-id': tenantId,
    ...tenantMunicipalContextHeadersFromStorage(),
    ...(enableApiLayerFetch ? { 'x-consulting-api-fetch-gate': 'founder-admin-reviewed' } : {}),
  }
}

function fmtNumber(value: number | null, suffix = '') {
  if (value === null) return 'Bloqueado'
  return `${value.toLocaleString('es-MX')}${suffix}`
}

function confidenceLabel(confidence: string) {
  if (confidence === 'high') return 'Alta'
  if (confidence === 'medium') return 'Media'
  if (confidence === 'low') return 'Baja'
  return 'Bloqueado'
}

function readinessStatus(gate: ConsultingPackage['readiness_gates'][number]) {
  if (gate.passed) return { label: 'Listo', className: 'text-[#3B6D11]' }
  if (gate.required) return { label: 'Bloquea plan', className: 'text-[#A1362C]' }
  return { label: 'Condiciona', className: 'text-[#8C6A13]' }
}

function planEmissionTone(mode: ConsultingPackage['plan_emission']['mode']) {
  if (mode === 'blocked_missing_regulation') return 'border-[#EBC0BA] bg-[#FBEAEA] text-[#A8322A]'
  if (mode === 'conditioned_with_gaps') return 'border-[#D7B56D] bg-[#FFF9EA] text-[#765814]'
  return 'border-[#C9DDB1] bg-[#EAF3DE] text-[#2F5B0D]'
}

function PackageDiagram({ pkg }: { pkg: ConsultingPackage }) {
  const hasScenario = pkg.scenario_set.scenarios.some(scenario => scenario.capture_ton_day !== null)
  const affirmableClaims = renderableClaims(pkg.claim_ledger).length
  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-4">
      {[
        { icon: FileSearch, label: 'Evidencia', value: affirmableClaims ? `${affirmableClaims} claims afirmables` : 'sin claims afirmables', tone: affirmableClaims ? 'ok' : 'warn' },
        { icon: GitBranch, label: 'Captura privada', value: `${pkg.private_generator_mix.length} categorías`, tone: 'ok' },
        { icon: BarChart3, label: 'Escenarios', value: hasScenario ? '5 calculados' : 'bloqueados', tone: hasScenario ? 'ok' : 'warn' },
        { icon: Route, label: 'Hoja de ruta', value: `${pkg.roadmap.length} fases`, tone: 'ok' },
      ].map(item => {
        const Icon = item.icon
        return (
          <div key={item.label} className="rounded-[8px] border border-[#E8E4DC] bg-white p-3">
            <div className="flex items-center gap-2">
              <Icon size={15} className={item.tone === 'warn' ? 'text-[#D4881E]' : 'text-[#3B6D11]'} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">{item.label}</p>
            </div>
            <p className="mt-2 font-serif text-[22px] leading-tight text-[#1C1B18]">{item.value}</p>
          </div>
        )
      })}
    </div>
  )
}

export function ConsultingPackagePanel({
  tenantData,
  showTechnicalPanel,
}: {
  tenantData: TenantDiagnosticData
  showTechnicalPanel: boolean
}) {
  const [apiResponse, setApiResponse] = useState<TenantConsultingPackageResponse | null>(null)
  const fallbackPackage = useMemo(() => {
    const inputRegistry = buildConsultingInputRegistry(tenantData)
    return buildConsultingPackage({ tenantData, inputRegistry })
  }, [tenantData])

  useEffect(() => {
    let cancelled = false
    async function loadConsultingPackage() {
      try {
        const response = await fetch(`/api/tenants/${encodeURIComponent(tenantData.tenant_id)}/consulting-package`, {
          headers: consultingPackageRequestHeaders(tenantData.tenant_id, showTechnicalPanel),
        })
        if (!response.ok) throw new Error(`consulting-package ${response.status}`)
        const payload = await response.json() as TenantConsultingPackageResponse
        if (!cancelled) setApiResponse(payload)
      } catch {
        if (!cancelled) setApiResponse(null)
      }
    }
    void loadConsultingPackage()
    return () => { cancelled = true }
  }, [showTechnicalPanel, tenantData.tenant_id])

  const pkg = apiResponse?.consulting_package ?? fallbackPackage
  const bibliographyChicago = apiResponse?.bibliography_chicago ?? []
  const compatibleBibliographyChicago = apiResponse?.compatible_bibliography_chicago ?? []
  const visibleClaims = renderableClaims(pkg.claim_ledger)
  const blockedScenario = pkg.scenario_set.scenarios.every(scenario => scenario.capture_ton_day === null)
  const criticalInputs = pkg.input_registry.sources.filter(source => source.status === 'blocked').slice(0, 6)

  return (
    <section className="mx-4 mt-6 max-w-full overflow-hidden pb-8 sm:mx-6">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
            Paquete de Consultoría RSU Gobierno
          </p>
          <h1 className="mt-2 max-w-4xl font-serif text-[30px] leading-tight text-[#1C1B18] sm:text-[36px]">
            {pkg.municipality}: análisis, escenarios, riesgos y hoja de ruta en una sola lectura.
          </h1>
          <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#4A4740]">
            {pkg.executive_diagnosis}
          </p>
          {(blockedScenario || !pkg.plan_emission.can_emit_plan) && (
            <div className={`mt-4 flex items-start gap-2 rounded-[8px] border p-3 ${planEmissionTone(pkg.plan_emission.mode)}`}>
              <Lock size={15} className="mt-0.5 shrink-0" />
              <p className="text-[12px] leading-5">
                {pkg.plan_emission.explanation}
              </p>
            </div>
          )}
          <PackageDiagram pkg={pkg} />
        </div>

        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Riesgos principales</p>
          <div className="mt-3 space-y-3">
            {pkg.risk_matrix.map(item => (
              <div key={item.risk} className="border-t border-[#F0EDE5] pt-3 first:border-t-0 first:pt-0">
                <p className="text-[13px] font-semibold text-[#1C1B18]">{item.risk}</p>
                <p className="mt-1 text-[12px] leading-5 text-[#6B6760]">{item.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConsultingDiagramSuite pkg={pkg} />

      <div className="mt-5 grid gap-3 lg:grid-cols-5">
        {pkg.scenario_set.scenarios.map(scenario => (
          <article key={scenario.id} className="rounded-[8px] border border-[#E8E4DC] bg-white p-3">
            <p className="text-[12px] font-semibold text-[#1C1B18]">{scenario.label}</p>
            <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">{scenario.conclusion}</p>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8C6A13]">
              {scenario.confidence === 'blocked'
                ? 'No cuantificado por brecha'
                : 'Escenario preliminar, no oficial'}
            </p>
            <dl className="mt-3 space-y-1 text-[11px]">
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8880]">Captura</dt>
                <dd className="font-mono text-[#1C1B18]">{fmtNumber(scenario.capture_ton_day, ' t/día')}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8880]">Circularidad</dt>
                <dd className="font-mono text-[#1C1B18]">{fmtNumber(scenario.circularity_pct, '%')}</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-[#8C8880]">Ingreso mensual</dt>
                <dd className="font-mono text-[#1C1B18]">{scenario.gross_revenue_mxn_month === null ? 'Bloqueado' : `$${fmtNumber(scenario.gross_revenue_mxn_month)}`}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-2">
        <div className="p-1">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Mapa privado de captura</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {pkg.private_generator_mix.map(item => (
              <div key={item.id} className="rounded-[8px] border border-[#F0EDE5] bg-[#FAFAF8] p-3">
                <p className="text-[12px] font-semibold text-[#1C1B18]">{item.label}</p>
                <p className="mt-1 text-[11px] text-[#6B6760]">{item.material_bias.join(' · ')}</p>
                <p className="mt-2 text-[11px] leading-5 text-[#8C6A13]">{item.rationale}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Precio ponderado por material</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#F0EDE5] text-left text-[#6B6760]">
                  <th className="py-2 pr-3 font-semibold">Material</th>
                  <th className="py-2 pr-3 font-semibold">Precio escenario</th>
                  <th className="py-2 pr-3 font-semibold">Confianza</th>
                </tr>
              </thead>
              <tbody>
                {pkg.material_price_mix.map(item => (
                  <tr key={item.material} className="border-b border-[#F7F3EA] last:border-b-0">
                    <td className="py-2 pr-3 font-semibold text-[#1C1B18]">{item.material}</td>
                    <td className="py-2 pr-3 font-mono text-[#1C1B18]">
                      {item.weighted_price_mxn_per_kg === null ? 'Bloqueado' : `$${item.weighted_price_mxn_per_kg}/kg`}
                    </td>
                    <td className="py-2 pr-3 text-[#6B6760]">{confidenceLabel(item.confidence)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] leading-5 text-[#6B6760]">
            Los precios son de escenario y requieren cotización vigente antes de comunicarse como derrama.
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Evidencia compatible</p>
          <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">
            La plataforma recomienda estas fuentes como contexto comparable. No sustituyen estudio local ni dato oficial municipal.
          </p>
          <div className="mt-3 divide-y divide-[#F0EDE5]">
            {pkg.evidence_recommendations.slice(0, 3).map(item => (
              <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold text-[#1C1B18]">{item.record.title}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8C6A13]">{item.tag}</span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-[#6B6760]">{item.explanation}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#8C6A13]">{item.unsupported_claim}</p>
              </div>
            ))}
            {!pkg.evidence_recommendations.length && (
              <p className="py-3 text-[11px] leading-5 text-[#6B6760]">Sin bibliografía compatible suficiente; conservar brechas.</p>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Insumos conectados</p>
          <dl className="mt-3 divide-y divide-[#F0EDE5] text-[11px]">
            {([
              ['Compradores/precios', pkg.input_registry.buyers_available],
              ['Marco legal', pkg.input_registry.legal_ready],
              ['Operación', pkg.input_registry.operations_ready],
              ['Inventario privado', pkg.input_registry.private_inventory_ready],
            ] as const).map(([label, ready]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3 py-2">
                <dt className="text-[#6B6760]">{label}</dt>
                <dd className={`font-semibold ${ready ? 'text-[#3B6D11]' : 'text-[#8C6A13]'}`}>
                  {ready ? 'Disponible' : 'Brecha'}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 space-y-2">
            {criticalInputs.length ? criticalInputs.map(source => (
              <p key={`${source.layer}-${source.label}`} className="text-[11px] leading-5 text-[#765814]">
                {source.label}: {source.blocks.join(', ') || 'claim bloqueado'}
              </p>
            )) : (
              <p className="text-[11px] leading-5 text-[#6B6760]">No hay bloqueos críticos de insumo en el registro actual.</p>
            )}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Gates de cierre</p>
          <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">
            Sólo el reglamento bloquea emisión del plan. Los demás pendientes condicionan alcance, confianza o cifras específicas.
          </p>
          <div className="mt-3 divide-y divide-[#F0EDE5]">
            <div className="pb-3">
              <p className={`inline-flex border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${planEmissionTone(pkg.plan_emission.mode)}`}>
                {pkg.plan_emission.label}
              </p>
              <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">
                {pkg.plan_emission.required_human_action}
              </p>
            </div>
            {pkg.readiness_gates.map(gate => {
              const status = readinessStatus(gate)
              return (
                <div key={gate.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[12px] font-semibold text-[#1C1B18]">{gate.label}</p>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.08em] ${status.className}`}>
                      {status.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-5 text-[#6B6760]">{gate.evidence}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Hoja de ruta</p>
          <ol className="mt-3 space-y-3">
            {pkg.roadmap.map(item => (
              <li key={item.phase} className="border-t border-[#F0EDE5] pt-3 first:border-t-0 first:pt-0">
                <p className="text-[13px] font-semibold text-[#1C1B18]">{item.phase}</p>
                <p className="mt-1 text-[12px] leading-5 text-[#6B6760]">Gate: {item.gate}</p>
                <p className="text-[12px] leading-5 text-[#6B6760]">Salida: {item.output}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">Evidencia por claim</p>
          {visibleClaims.length ? (
            <div className="mt-3 divide-y divide-[#F0EDE5]">
              {visibleClaims.slice(0, 4).map(claim => (
                <div key={claim.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="text-[12px] font-semibold text-[#1C1B18]">{claim.claim}</p>
                  <p className="mt-1 text-[11px] leading-5 text-[#6B6760]">
                    Fuente: {claim.source} · Fecha: {claim.source_date} · Método: {claim.method}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 flex items-start gap-2 rounded-[8px] border border-[#D7B56D] bg-[#FFF9EA] p-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#765814]" />
              <p className="text-[12px] leading-5 text-[#765814]">
                No hay claims afirmables todavía. La plataforma conserva brechas y evita publicar conclusiones sin fuente suficiente.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
            Bibliografía Chicago
          </p>
          <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">
            Las citas se consolidan en formato institucional inspirado en Chicago. Si una cifra no tiene cita, queda como brecha o pendiente.
          </p>
          <ol className="mt-3 space-y-2 text-[11px] leading-5 text-[#4A4740]">
            {bibliographyChicago.slice(0, 4).map((entry, index) => (
              <li key={entry}>{index + 1}. {entry}</li>
            ))}
            {!bibliographyChicago.length && (
              <li>Sin bibliografía suficiente; no publicar cifras como afirmación.</li>
            )}
          </ol>
        </div>

        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#6B6760]">
            Bibliografía comparable
          </p>
          <p className="mt-2 text-[11px] leading-5 text-[#6B6760]">
            Útil para contexto, hipótesis y planeación preliminar. No sustituye reglamento, estudio local ni verdad municipal.
          </p>
          <div className="mt-3 space-y-3">
            {compatibleBibliographyChicago.slice(0, 3).map(item => (
              <div key={item.id} className="border-t border-[#F0EDE5] pt-3 first:border-t-0 first:pt-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8C6A13]">
                  {item.tag} · score {item.score}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-[#4A4740]">{item.citation}</p>
                <p className="mt-1 text-[11px] leading-5 text-[#8C6A13]">{item.unsupported_claim}</p>
              </div>
            ))}
            {!compatibleBibliographyChicago.length && (
              <p className="text-[11px] leading-5 text-[#6B6760]">Sin recomendaciones compatibles; conservar brechas.</p>
            )}
          </div>
        </div>
      </div>

      {showTechnicalPanel && (
        <details className="mt-5 rounded-[8px] border border-[#D8D2C5] bg-[#F4F2ED] p-4">
          <summary className="cursor-pointer text-[12px] font-semibold uppercase tracking-[0.08em] text-[#5C574F]">
            Panel técnico interno de calibración
          </summary>
          <div className="mt-3 divide-y divide-[#DDD7CB]">
            {pkg.scenario_set.scenarios.map(scenario => (
              <div key={scenario.id} className="py-3 first:pt-0 last:pb-0">
                <p className="text-[12px] font-semibold text-[#1C1B18]">{scenario.label}</p>
                <ul className="mt-2 space-y-1 text-[11px] leading-5 text-[#6B6760]">
                  {scenario.assumptions.map(assumption => <li key={assumption}>- {assumption}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  )
}
