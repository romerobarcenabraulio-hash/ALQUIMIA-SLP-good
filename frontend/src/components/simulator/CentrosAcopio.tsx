'use client'
import { useEffect, useMemo, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { CA_CONFIG, FASES_CA, KPIS_POR_FASE } from '@/lib/constants'
import { fmt, cn } from '@/lib/utils'
import { VolumenBarChart } from '@/components/charts/VolumenBarChart'
import { getInfrastructurePlan } from '@/lib/api'
import type { InfrastructurePlanResponse } from '@/types'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { ContextoModulo } from '@/components/ui/ContextoModulo'

const CAUSAL_INFRA = [
  'RSU capturable',
  'Capacidad instalada',
  'Brecha operativa',
  'Centros propuestos',
  'CAPEX/OPEX',
  'Impacto m²/empleos',
]

export function CentrosAcopio() {
  const { mixCAs, setMixCA, resultados } = useSimulatorStore()
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const gatesAprobados = useSimulatorStore(s => s.gatesAprobados)
  const blocked = !gatesAprobados[0]

  const municipio = municipiosActivos[0] ?? 'slp'
  const rsuCapturableTonDia = useMemo(() => {
    const vol = resultados?.volCapturablePorMat as Record<string, number> | undefined
    if (!vol) return 0
    return Object.values(vol).reduce((s, v) => s + (v ?? 0), 0)
  }, [resultados])

  const payload = useMemo(
    () => ({
      municipio_id: municipio,
      zona_ids: ['zona_1'],
      rsu_capturable_ton_dia: rsuCapturableTonDia,
      horizonte_años: horizonte ?? 3,
      mix_centros: { P: mixCAs.P ?? 0, M: mixCAs.M ?? 0, G: mixCAs.G ?? 0 },
    }),
    [municipio, rsuCapturableTonDia, horizonte, mixCAs],
  )

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plan, setPlan] = useState<InfrastructurePlanResponse | null>(null)

  useEffect(() => {
    const totalMix = (payload.mix_centros.P ?? 0) + (payload.mix_centros.M ?? 0) + (payload.mix_centros.G ?? 0)
    if (totalMix === 0) {
      setPlan(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    getInfrastructurePlan(payload)
      .then(resp => { if (!cancelled) setPlan(resp) })
      .catch((err: Error) => {
        if (!cancelled) {
          setPlan(null)
          setError(err.message)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [payload])

  return (
    <div className={cn(blocked && 'overlay-blocked')}>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S13.1 — Centros de acopio</p>
      <h1 className="font-serif text-[24px] text-[#1C1B18] mb-3">
        Plan de infraestructura con trazabilidad municipal · simulación propuesta
      </h1>
      <ContextoModulo
        variante="operativo"
        titulo="¿Qué es un Centro de Acopio y por qué es la pieza central del programa?"
        cuerpo="Un Centro de Acopio (CA) es la infraestructura física donde llegan los materiales ya separados desde casas, edificios y empresas. Ahí se pesan, clasifican, compactan en pacas y se despachan a las recicladoras que pagan por ellos. Sin CA, la separación en casa no tiene destino físico y el material termina mezclado de nuevo. El simulador propone el mix óptimo de centros Pequeño (5 t/día), Mediano (15 t/día) y Grande (50 t/día) según el volumen capturable de tu municipio."
        puntos={[
          'CA Pequeño: 250 m², 5 empleos, TIR 109.5%, payback ~6 meses (Año 3).',
          'CA Mediano: 750 m², 14 empleos, TIR 155.6%, payback ~5 meses.',
          'CA Grande: 2,000 m², 34 empleos, TIR 212%, payback ~7 meses.',
          'El mix se calcula automáticamente por fase; puedes ajustarlo manualmente con los botones +/-.',
          'La brecha es RSU capturable vs. capacidad instalada — no RSU total generado.',
        ]}
        fuente="CAPEX/OPEX/TIR por escala: Bootstrap §2.3 · Modelo_BASED.xlsx. Mix por fase: Bootstrap §2.4."
        advertencia="La ubicación física de cada CA debe validarse con el municipio (uso de suelo, conectividad vial). ALQUIMIA modela la viabilidad financiera; el predio es decisión municipal."
      />

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        <InfoTile
          label="Brecha capturable"
          value={plan ? `${plan.brecha_ton_dia.toFixed(1)} t/día` : '—'}
          detail="Fuente: RSU capturable vs capacidad instalada"
        />
        <InfoTile
          label="Cobertura de capacidad"
          value={
            plan && plan.rsu_capturable_ton_dia > 0
              ? `${Math.min(100, (plan.capacidad_instalada_ton_dia / plan.rsu_capturable_ton_dia) * 100).toFixed(0)}%`
              : '—'
          }
          detail="Capacidad instalada / RSU capturable"
        />
        <InfoTile
          label="CAPEX/OPEX estimados"
          value={plan && plan.centros.length > 0 ? 'CA_CONFIG' : '—'}
          detail="Confianza media · estimación ALQUIMIA"
        />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-1 text-[11px] text-[#6B6760]">
        {CAUSAL_INFRA.map((step, i, arr) => (
          <span key={step} className="contents">
            <span className="bg-[#F0EDE5] rounded px-2 py-0.5">{step}</span>
            {i < arr.length - 1 && <span className="text-[#A8A49C]">→</span>}
          </span>
        ))}
      </div>

      {/* Cards P/M/G */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {(['P', 'M', 'G'] as const).map(tipo => {
          const ca = CA_CONFIG[tipo]
          const centrosTipo = plan?.centros.filter(c => c.tipo_id === tipo) ?? []
          return (
            <div key={tipo} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[11px] uppercase text-[#A8A49C] tracking-wide">
                    {tipo === 'P' ? 'Pequeño' : tipo === 'M' ? 'Mediano' : 'Grande'}
                  </p>
                  <p className="font-mono text-[18px] text-[#1C1B18]">{ca.capTonDia} t/día</p>
                  <p className="text-[11px] text-[#6B6760]">{ca.superficieM2} m²</p>
                  {centrosTipo.length > 0 && (
                    <p className="mt-1 text-[11px] text-[#3B6D11]">
                      {centrosTipo.length} centro(s) · estado: {centrosTipo[0].estado}
                    </p>
                  )}
                </div>
                {/* +/- counter */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setMixCA(tipo, Math.max(0, (mixCAs[tipo] ?? 0) - 1))}
                    className="w-8 h-8 rounded-full border border-[#E8E4DC] text-[#6B6760] hover:bg-[#F0EDE5] transition-colors"
                  >−</button>
                  <span className="font-mono text-[20px] w-6 text-center text-[#1C1B18]">{mixCAs[tipo] ?? 0}</span>
                  <button
                    onClick={() => setMixCA(tipo, (mixCAs[tipo] ?? 0) + 1)}
                    className="w-8 h-8 rounded-full bg-[#3B6D11] text-white hover:bg-[#2D5409] transition-colors"
                  >+</button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-[11px]">
                <Row label="CAPEX" value={fmt.mxnM(ca.capexMXN)} />
                <Row label="OPEX/mes" value={fmt.mxn(ca.opexMesMXN)} />
                <Row label="EBITDA/mes Año3" value={fmt.mxn(ca.ebitdaMesA3)} color="text-[#3B6D11]" />
                <Row label="TIR estimada del centro, no de la estrategia" value={`${ca.tir}%`} color="text-[#3B6D11]" />
                <Row label="Payback" value={`~${ca.paybackMeses} meses`} />
                <Row label="Empleos" value={`${ca.empleos} directos`} />
              </div>
            </div>
          )
        })}
      </div>

      {loading && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!loading && !error && !plan && <EmptyState />}
      {!loading && !error && plan?.status === 'blocked' && <BlockedState plan={plan} />}
      {!loading && !error && plan && plan.status !== 'blocked' && (
        <ResultState plan={plan} />
      )}

      {/* Fases de despliegue */}
      <div className="mb-6 mt-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Fases de despliegue (referencia — §2.4)</p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr className="border-b border-[#E8E4DC]">
                {['Fase','Mix','CAs','Cap t/d','CAPEX','EBITDA/mes','Cobertura'].map(h => (
                  <th key={h} className="text-left py-2 px-2 text-[#A8A49C] font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FASES_CA.map(f => (
                <tr key={f.fase} className={cn(
                  'border-b border-[#F0EDE5]',
                  f.esOptimo && 'bg-[#FEF7E7]'
                )}>
                  <td className="py-2 px-2 font-medium text-[#1C1B18]">F{f.fase}</td>
                  <td className="py-2 px-2 font-mono text-[#6B6760]">{f.mix}</td>
                  <td className="py-2 px-2 font-mono text-[#1C1B18]">{f.nCAs}</td>
                  <td className="py-2 px-2 font-mono">{f.capTonDia}</td>
                  <td className="py-2 px-2 font-mono">{fmt.mxnM(f.capexMXN)}</td>
                  <td className="py-2 px-2 font-mono text-[#3B6D11]">${f.ebitdaMesK}K</td>
                  <td className="py-2 px-2">
                    {f.esOptimo
                      ? <span className="text-[#8A4F08] bg-[#FEF7E7] border border-[#F6C84B] px-1.5 py-0.5 rounded-full">★ ÓPTIMO {f.coberturaPct}%</span>
                      : `${f.coberturaPct}%`
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gráfica volumen por material */}
      <div className="mb-6">
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">Volumen capturable por material · t/año</p>
        <VolumenBarChart />
      </div>

      {/* KPIs operativos por fase */}
      <div>
        <p className="text-[12px] font-medium text-[#6B6760] mb-3">KPIs operativos por fase</p>
        <p className="text-[11px] text-[#6B6860] mb-2">
          Fuente: CA_CONFIG ALQUIMIA · confianza media · simulación propuesta
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-[#E8E4DC]">
                <th className="text-left py-2 text-[#A8A49C] font-medium">KPI</th>
                {['F1','F2','F3','F4','F5'].map(f => (
                  <th key={f} className="text-right py-2 text-[#A8A49C] font-medium">{f}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KPIS_POR_FASE.map(kpi => (
                <tr key={kpi.kpi} className="border-b border-[#F0EDE5]">
                  <td className="py-1.5 text-[#6B6760]">{kpi.kpi}</td>
                  {[kpi.f1, kpi.f2, kpi.f3, kpi.f4, kpi.f5].map((v, i) => (
                    <td key={i} className="py-1.5 text-right font-mono text-[#1C1B18]">{v}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex justify-between items-center py-0.5 border-b border-[#F0EDE5] last:border-0">
      <span className="text-[#A8A49C]">{label}</span>
      <span className={cn('font-mono', color ?? 'text-[#1C1B18]')}>{value}</span>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      Evaluando plan de infraestructura...
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[8px] border border-dashed border-[#E8E4DC] bg-white p-4 text-[13px] text-[#6B6760]">
      <p>Configura el mix P/M/G de centros para calcular el plan de infraestructura.</p>
      <button type="button" className="mt-2 text-[12px] font-medium text-[#3B6D11] underline underline-offset-2">
        Configurar mix de centros
      </button>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-[8px] border border-red-200 bg-red-50 p-4 text-[13px] text-red-800">
      {message}
    </div>
  )
}

function BlockedState({ plan }: { plan: InfrastructurePlanResponse }) {
  return (
    <div className="rounded-[8px] border border-amber-300 bg-amber-50 p-4">
      <p className="text-[12px] font-semibold text-amber-900">Plan bloqueado</p>
      {plan.blockers.map(blocker => (
        <p key={blocker} className="mt-2 text-[12px] text-amber-800">{blocker}</p>
      ))}
      <p className="mt-3 text-[12px] font-semibold text-[#1C1B18]">Acción siguiente</p>
      <p className="mt-1 text-[12px] text-[#6B6760]">{plan.next_action}</p>
    </div>
  )
}

function ResultState({ plan }: { plan: InfrastructurePlanResponse }) {
  const warning = plan.status === 'warning'
  const helpText = 'Brecha = capturable - capacidad instalada. Si es positiva, falta capacidad; si es negativa, está sobredimensionado. Supuestos: mix y capacidades CA_CONFIG estimadas (no oficial).'
  const brecha = plan.brecha_ton_dia
  const cobertura = plan.rsu_capturable_ton_dia > 0
    ? Math.min(100, Math.round((plan.capacidad_instalada_ton_dia / plan.rsu_capturable_ton_dia) * 100))
    : 0
  const bridgeVariant = warning ? 'warning' : brecha > 0.01 ? 'warning' : 'result'
  const bridgeSummary = brecha > 0.01
    ? `Hoy capturas ${plan.rsu_capturable_ton_dia.toFixed(1)} t/día y solo tienes capacidad para ${plan.capacidad_instalada_ton_dia.toFixed(1)} t/día. La brecha de ${brecha.toFixed(1)} t/día implica abrir capacidad nueva o reasignar flujos.`
    : brecha < -0.01
      ? `Tu capacidad instalada (${plan.capacidad_instalada_ton_dia.toFixed(1)} t/día) supera el capturable (${plan.rsu_capturable_ton_dia.toFixed(1)} t/día). Hay holgura de ${Math.abs(brecha).toFixed(1)} t/día: optimiza mix o consolida centros.`
      : `Capacidad instalada (${plan.capacidad_instalada_ton_dia.toFixed(1)} t/día) está alineada con el capturable. Mantén el mix y revisa estados operativos por centro.`
  return (
    <div className="space-y-4">
      {warning && plan.warnings.length > 0 && (
        <div className="rounded-[8px] border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-900">
          {plan.warnings.map(w => <p key={w}>{w}</p>)}
        </div>
      )}

      <div className="rounded-[8px] border border-[#DAD3C7] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">Brecha de capacidad</p>
        <p className="mt-1 text-[12px] text-[#6B6760]">{helpText}</p>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px] text-[#1C1B18]">
          <InfoTile label="Flujo capturable (t/día)" value={plan.rsu_capturable_ton_dia.toFixed(2)} />
          <InfoTile label="Capacidad instalada (t/día)" value={plan.capacidad_instalada_ton_dia.toFixed(2)} />
          <InfoTile label="Brecha (capturable - instalada)" value={plan.brecha_ton_dia.toFixed(2)} highlight />
        </div>

        <NarrativeBridge
          kicker="S22 · Lectura del modelo"
          variant={bridgeVariant}
          summary={bridgeSummary}
          evidence={[
            { label: 'Capturable', value: `${plan.rsu_capturable_ton_dia.toFixed(2)} t/día` },
            { label: 'Capacidad', value: `${plan.capacidad_instalada_ton_dia.toFixed(2)} t/día` },
            { label: 'Brecha', value: `${brecha.toFixed(2)} t/día` },
            { label: 'Cobertura', value: `${cobertura}%` },
          ]}
          source={{
            fuente: plan.calculo_brecha.fuente_capacidad,
            unidad: plan.calculo_brecha.unidad,
            incertidumbre: plan.calculo_brecha.incertidumbre,
          }}
          nextStep={{
            label: brecha > 0.01 ? 'Ajusta el mix P/M/G' : 'Consolida estados de centros',
            helper: brecha > 0.01
              ? 'Aumenta centros M o G donde la zona muestre mayor brecha.'
              : 'Documenta el centro propuesto que pasa a operando.',
          }}
        />
      </div>

      <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[13px] font-semibold text-[#1C1B18]">Capacidad por material (t/día)</p>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-[12px] text-[#6B6760]">
          {Object.entries(plan.capacidad_por_material ?? {}).map(([mat, cap]) => (
            <p key={mat} className="flex justify-between">
              <span>{mat}</span>
              <span className="font-mono text-[#1C1B18]">{cap.toFixed(3)}</span>
            </p>
          ))}
        </div>
        <p className="mt-2 text-[12px] text-[#6B6760]">
          Distribución estimada por material basada en CA_CONFIG ALQUIMIA (confianza media). No es asignación oficial de flujos.
        </p>
      </div>

      {plan.centros.length > 0 && (
        <div className="rounded-[8px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[13px] font-semibold text-[#1C1B18]">Centros propuestos</p>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] text-[#6B6760]">
            {plan.centros.map(c => (
              <div key={c.id} className="border border-[#F0EDE5] rounded-[10px] p-3">
                <p className="font-semibold text-[#1C1B18]">
                  Centro {c.id.toUpperCase()} · {c.tipo_id}
                  <span
                    className={cn(
                      'ml-2 rounded-full px-2 py-0.5 text-[10px] font-medium',
                      c.estado === 'operando' ? 'bg-[#EAF8E3] text-[#2D7A0A]' : 'bg-[#FFF8E7] text-[#C47E00]',
                    )}
                  >
                    {c.estado}
                  </span>
                </p>
                <p>Municipio: {c.municipio_id || '—'} · Zona: {c.zona_id}</p>
                <p>Capacidad: {c.capacidad_ton_dia} t/día · Estado: {c.estado}</p>
                <p>Materiales: {c.materiales_aceptados.join(', ')}</p>
                <p>Recicladoras destino: {c.recicladoras_destino.join(', ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.warnings.length === 0 && (
        <div className="rounded-[8px] border border-[#DAD3C7] bg-white p-4 text-[12px] text-[#6B6760]">
          <p className="text-[13px] font-semibold text-[#1C1B18]">Texto de ayuda</p>
          <p>
            <span className="mr-2 rounded-full border border-[#E8E4DC] bg-[#FAF8F4] px-2 py-0.5 text-[10px] font-medium text-[#6B6760]">
              Simulación propuesta
            </span>
            Este plan es propositivo: los centros siguen en estado &quot;propuesto&quot; hasta validar suelo, permisos y cadena de recicladoras. La brecha se calcula contra flujo capturable (no RSU total).
          </p>
        </div>
      )}
    </div>
  )
}

function InfoTile({
  label,
  value,
  detail,
  highlight,
}: {
  label: string
  value: string
  detail?: string
  highlight?: boolean
}) {
  return (
    <div className={cn(
      'rounded-[8px] border px-3 py-2',
      highlight ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-[#E8E4DC] bg-white',
    )}>
      <p className="text-[11px] text-[#6B6760]">{label}</p>
      <p className="font-mono text-[14px] text-[#1C1B18]">{value}</p>
      {detail && <p className="mt-1 text-[11px] text-[#6B6860]">{detail}</p>}
    </div>
  )
}
