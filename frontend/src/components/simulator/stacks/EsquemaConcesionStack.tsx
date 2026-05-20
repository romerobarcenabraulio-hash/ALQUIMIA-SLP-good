'use client'

import { useCallback, useEffect } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { useSimulatorStore } from '@/store/simulatorStore'
import { MARCO_LEGAL_CONCESION, ZMS } from '@/lib/constants'
import { fmt, cn } from '@/lib/utils'
import type { EsquemaConcesion } from '@/types'

// ── Color palette ─────────────────────────────────────────────────────────────
const C = {
  green:       '#3B6D11',
  lightGreen:  '#EAF3DE',
  border:      '#C9DDB1',
  bone:        '#FDFCFA',
  sand:        '#F4F2ED',
  borderLight: '#E8E4DC',
  textDark:    '#1C1B18',
  textMid:     '#6B6760',
  textLight:   '#A8A49C',
  amber:       '#D4881E',
  amberLight:  '#FDF4E7',
  amberBorder: '#F3C97E',
  green2:      '#6FA832',
} as const

// ── Metric card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, bold = false,
}: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className="rounded-[10px] border p-4 flex flex-col gap-1"
      style={{ borderColor: C.borderLight, background: C.bone }}
    >
      <span
        className="text-[10px] uppercase tracking-[0.06em]"
        style={{ color: C.textLight }}
      >
        {label}
      </span>
      <span
        className={cn('font-mono text-[18px]', bold ? 'font-bold' : 'font-medium')}
        style={{ color: C.textDark }}
      >
        {value}
      </span>
    </div>
  )
}

// ── Scheme card ───────────────────────────────────────────────────────────────
const SCHEME_META: Record<EsquemaConcesion, { title: string; desc: string }> = {
  A: {
    title: 'Municipal Directo',
    desc:  'Municipio opera el CA. 100% ingresos al municipio. Mayor control, mayor riesgo operativo.',
  },
  B: {
    title: 'Concesionado Privado',
    desc:  'Operador privado invierte y opera. Municipio recibe cuota (X%) + ISN + derechos.',
  },
  C: {
    title: 'APP',
    desc:  'Inversión y riesgos compartidos. Municipio recibe su % del convenio.',
  },
  D: {
    title: 'Fideicomiso BANOBRAS',
    desc:  'Financiamiento fiduciario. Municipio recibe remanente post-deuda. Tasa preferencial ~8.5%.',
  },
}

// ── Stepper question ──────────────────────────────────────────────────────────
function StepperQuestion({
  step, question, answer, onAnswer, active,
}: {
  step: number
  question: string
  answer: boolean | null
  onAnswer: (v: boolean) => void
  active: boolean
}) {
  const answered = answer !== null
  return (
    <div className="flex gap-3">
      {/* step indicator */}
      <div className="flex flex-col items-center">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-mono font-bold flex-shrink-0"
          style={{
            background: answered ? C.green : active ? C.lightGreen : C.sand,
            color:      answered ? '#fff'  : active ? C.green     : C.textLight,
            border:     `1.5px solid ${answered ? C.green : active ? C.border : C.borderLight}`,
          }}
        >
          {answered ? (answer ? 'S' : 'N') : step}
        </div>
        <div
          className="w-px flex-1 mt-1"
          style={{ background: C.borderLight, minHeight: 20 }}
        />
      </div>
      {/* content */}
      <div className="pb-5 flex-1">
        <p
          className="text-[13px] leading-[1.4] mb-3"
          style={{ color: active || answered ? C.textDark : C.textLight }}
        >
          {question}
        </p>
        {active && (
          <div className="flex gap-2">
            {([true, false] as const).map(val => (
              <button
                key={String(val)}
                onClick={() => onAnswer(val)}
                className="px-4 py-1.5 rounded-[8px] text-[12px] font-medium transition-all"
                style={{
                  background: answer === val ? C.green       : C.sand,
                  color:      answer === val ? '#fff'        : C.textMid,
                  border:     `1.5px solid ${answer === val ? C.green : C.borderLight}`,
                }}
              >
                {val ? 'Sí' : 'No'}
              </button>
            ))}
          </div>
        )}
        {answered && !active && (
          <span
            className="text-[11px] font-medium"
            style={{ color: answer ? C.green : C.amber }}
          >
            {answer ? 'Sí' : 'No'}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Recommendation result card ────────────────────────────────────────────────
interface ResultCardProps {
  variant: 'green' | 'amber'
  text: string
  legalRef: { ley: string; articulo: string } | null
  municipioLabel: string
}
function ResultCard({ variant, text, legalRef, municipioLabel }: ResultCardProps) {
  const isGreen = variant === 'green'
  return (
    <div
      className="rounded-[10px] p-4 mt-2"
      style={{
        background: isGreen ? C.lightGreen : C.amberLight,
        border:     `1px solid ${isGreen ? C.border : C.amberBorder}`,
      }}
    >
      <p className="text-[13px] leading-[1.5]" style={{ color: C.textDark }}>
        {text}
      </p>
      {legalRef && (
        <p className="text-[11px] mt-2" style={{ color: C.textMid }}>
          Base legal: {legalRef.ley} — {legalRef.articulo}
        </p>
      )}
      <p className="text-[11px] mt-1" style={{ color: C.textMid }}>
        Independientemente de la situación presupuestal, el municipio de{' '}
        <span style={{ color: isGreen ? C.green : C.amber, fontWeight: 600 }}>
          {municipioLabel}
        </span>{' '}
        tiene un camino viable hacia la implementación.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export function EsquemaConcesionStack() {
  const {
    zmActiva,
    arbolDecisionAnswers,
    esquemaConcesion,
    pctCuotaConcesion,
    pctSocioPublico,
    resultados,
    setArbolDecisionAnswer,
    setEsquemaConcesion,
    setPctCuotaConcesion,
    setPctSocioPublico,
  } = useSimulatorStore()

  const { tienepresupuesto, existeConcesionario, aceptaRenegociar } = arbolDecisionAnswers

  // Lookup estado for legal reference
  const zm = ZMS.find(z => z.id === zmActiva)
  const estado = zm?.estado ?? zmActiva
  const legalRef =
    MARCO_LEGAL_CONCESION[estado] ?? (MARCO_LEGAL_CONCESION as Record<string, { ley: string; articulo: string }>)['default'] ?? null

  // Determine which questions are active
  const q1Active = tienepresupuesto === null
  const q2Active = tienepresupuesto === false && existeConcesionario === null
  const q3Active =
    tienepresupuesto === false &&
    existeConcesionario === true &&
    aceptaRenegociar === null

  // Determine result state
  const treeComplete =
    tienepresupuesto === true ||
    (tienepresupuesto === false && existeConcesionario === false) ||
    (tienepresupuesto === false && existeConcesionario === true && aceptaRenegociar !== null)

  // Auto-set scheme based on tree result
  useEffect(() => {
    if (!treeComplete) return
    if (tienepresupuesto === true) {
      setEsquemaConcesion('A')
    } else {
      setEsquemaConcesion('B')
    }
  }, [treeComplete, tienepresupuesto, setEsquemaConcesion])

  const resetTree = useCallback(() => {
    setArbolDecisionAnswer('tienepresupuesto', null)
    setArbolDecisionAnswer('existeConcesionario', null)
    setArbolDecisionAnswer('aceptaRenegociar', null)
  }, [setArbolDecisionAnswer])

  // Compute result card content
  let resultVariant: 'green' | 'amber' = 'green'
  let resultText = ''
  if (treeComplete) {
    if (tienepresupuesto === true) {
      resultVariant = 'green'
      resultText =
        'Esquema A o C recomendado. El municipio puede operar directamente o co-invertir con un socio privado (APP).'
    } else if (tienepresupuesto === false && existeConcesionario === false) {
      resultVariant = 'amber'
      resultText =
        'Esquema B recomendado. Crear concesión nueva para RSU separado en condominios y comercios. El operador privado financia el CAPEX.'
    } else if (aceptaRenegociar === true) {
      resultVariant = 'green'
      resultText =
        'Adendo al contrato vigente. Modificar el contrato existente para incluir separación diferenciada.'
    } else {
      resultVariant = 'amber'
      resultText =
        'Concesión exclusiva para RSU separado recomendada (Hemisferio 1: condominios + comercios). Sin inversión municipal requerida.'
    }
  }

  // Financial data
  const ingOp    = resultados?.ingresosMunicipioOperativo ?? 0
  const ingFisc  = resultados?.ingresosMunicipioFiscal    ?? 0
  const ingTotal = resultados?.ingresosMunicipioTotal     ?? 0
  const ingBrutos = resultados?.ingresosBrutos ?? 0
  const ingOperador = Math.max(0, ingBrutos - ingTotal)

  const showOperadorSlice = ['B', 'C', 'D'].includes(esquemaConcesion)

  const pieData = [
    { name: 'Operativo al municipio', value: ingOp,    color: C.green },
    { name: 'Fiscal al municipio',    value: ingFisc,  color: C.green2 },
    ...(showOperadorSlice && ingOperador > 0
      ? [{ name: 'Al operador privado', value: ingOperador, color: C.borderLight }]
      : []),
  ].filter(d => d.value > 0)

  // Derrama por sector
  const derrama = resultados?.derramaIndustrialPorSector
  const barData = [
    { sector: 'Reciclaje',         value: derrama?.reciclaje ?? 0 },
    { sector: 'Acerera',           value: derrama?.acerera   ?? 0 },
    { sector: 'Agrícola/Composta', value: derrama?.agricola  ?? 0 },
  ]

  const empleos = resultados?.empleosPorSector

  const municipioLabel = zm?.municipios[0]?.nombre ?? zmActiva

  return (
    <div className="flex flex-col gap-6">

      {/* ── Section 1: Árbol de Decisión ─────────────────────────────────── */}
      <div
        className="rounded-[12px] border p-5"
        style={{ borderColor: C.borderLight, background: C.bone }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.06em]"
          style={{ color: C.textLight }}
        >
          Paso 1
        </span>
        <h3
          className="font-serif text-[18px] mt-0.5 mb-4"
          style={{ color: C.textDark }}
        >
          Árbol de Decisión Institucional
        </h3>

        <StepperQuestion
          step={1}
          question="¿El municipio tiene presupuesto disponible para CAPEX del Centro de Acopio?"
          answer={tienepresupuesto}
          onAnswer={v => setArbolDecisionAnswer('tienepresupuesto', v)}
          active={q1Active}
        />

        {(tienepresupuesto === false || existeConcesionario !== null || q2Active) && (
          <StepperQuestion
            step={2}
            question="¿Existe un concesionario de aseo urbano con contrato vigente?"
            answer={existeConcesionario}
            onAnswer={v => setArbolDecisionAnswer('existeConcesionario', v)}
            active={q2Active}
          />
        )}

        {(existeConcesionario === true || aceptaRenegociar !== null || q3Active) && (
          <StepperQuestion
            step={3}
            question="¿El concesionario acepta renegociar el contrato para incluir separación en origen?"
            answer={aceptaRenegociar}
            onAnswer={v => setArbolDecisionAnswer('aceptaRenegociar', v)}
            active={q3Active}
          />
        )}

        {treeComplete && (
          <ResultCard
            variant={resultVariant}
            text={resultText}
            legalRef={legalRef}
            municipioLabel={municipioLabel}
          />
        )}

        {(tienepresupuesto !== null) && (
          <button
            onClick={resetTree}
            className="mt-4 text-[11px] underline underline-offset-2"
            style={{ color: C.textMid }}
          >
            Reiniciar árbol
          </button>
        )}
      </div>

      {/* ── Section 2: Detalle del Esquema ───────────────────────────────── */}
      <div
        className="rounded-[12px] border p-5"
        style={{ borderColor: C.borderLight, background: C.bone }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.06em]"
          style={{ color: C.textLight }}
        >
          Paso 2
        </span>
        <h3
          className="font-serif text-[18px] mt-0.5 mb-4"
          style={{ color: C.textDark }}
        >
          Detalle del Esquema
        </h3>

        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(SCHEME_META) as [EsquemaConcesion, { title: string; desc: string }][]).map(
            ([key, meta]) => {
              const selected = esquemaConcesion === key
              return (
                <button
                  key={key}
                  onClick={() => setEsquemaConcesion(key)}
                  className="rounded-[10px] border p-4 text-left transition-all"
                  style={{
                    background:   selected ? C.lightGreen : C.sand,
                    borderColor:  selected ? C.green      : C.borderLight,
                    borderWidth:  selected ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded"
                      style={{
                        background: selected ? C.green     : C.borderLight,
                        color:      selected ? '#fff'      : C.textMid,
                      }}
                    >
                      {key}
                    </span>
                    <span
                      className="font-serif text-[14px]"
                      style={{ color: C.textDark }}
                    >
                      {meta.title}
                    </span>
                  </div>
                  <p className="text-[11px] leading-[1.45]" style={{ color: C.textMid }}>
                    {meta.desc}
                  </p>
                </button>
              )
            },
          )}
        </div>

        {/* Slider for B: pctCuotaConcesion */}
        {esquemaConcesion === 'B' && (
          <div className="mt-4 p-4 rounded-[10px]" style={{ background: C.sand, border: `1px solid ${C.borderLight}` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] uppercase tracking-[0.06em]" style={{ color: C.textLight }}>
                Cuota de concesión
              </span>
              <span className="font-mono text-[15px] font-bold" style={{ color: C.green }}>
                {pctCuotaConcesion}%
              </span>
            </div>
            <input
              type="range"
              min={5} max={15} step={1}
              value={pctCuotaConcesion}
              onChange={e => setPctCuotaConcesion(Number(e.target.value))}
              className="w-full accent-[#3B6D11]"
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: C.textLight }}>
              <span>5%</span><span>15%</span>
            </div>
          </div>
        )}

        {/* Slider for C: pctSocioPublico */}
        {esquemaConcesion === 'C' && (
          <div className="mt-4 p-4 rounded-[10px]" style={{ background: C.sand, border: `1px solid ${C.borderLight}` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[11px] uppercase tracking-[0.06em]" style={{ color: C.textLight }}>
                Participación socio público
              </span>
              <span className="font-mono text-[15px] font-bold" style={{ color: C.green }}>
                {pctSocioPublico}%
              </span>
            </div>
            <input
              type="range"
              min={10} max={90} step={5}
              value={pctSocioPublico}
              onChange={e => setPctSocioPublico(Number(e.target.value))}
              className="w-full accent-[#3B6D11]"
            />
            <div className="flex justify-between text-[10px] mt-1" style={{ color: C.textLight }}>
              <span>10%</span><span>90%</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 3: Distribución de Ingresos ──────────────────────────── */}
      <div
        className="rounded-[12px] border p-5"
        style={{ borderColor: C.borderLight, background: C.bone }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.06em]"
          style={{ color: C.textLight }}
        >
          Distribución de ingresos
        </span>
        <h3
          className="font-serif text-[18px] mt-0.5 mb-4"
          style={{ color: C.textDark }}
        >
          Ingresos al Municipio
        </h3>

        <div className="grid grid-cols-3 gap-3 mb-5">
          <MetricCard label="Operativo al municipio" value={fmt.mxn(ingOp)} />
          <MetricCard label="Fiscal al municipio"    value={fmt.mxn(ingFisc)} />
          <MetricCard label="Total al municipio"     value={fmt.mxn(ingTotal)} bold />
        </div>

        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => fmt.mxn(v)}
                contentStyle={{
                  background: C.bone, border: `1px solid ${C.borderLight}`,
                  borderRadius: 8, fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div
            className="h-[120px] rounded-[10px] flex items-center justify-center text-[12px]"
            style={{ background: C.sand, color: C.textLight }}
          >
            Completa la configuración para ver la distribución
          </div>
        )}
      </div>

      {/* ── Section 4: Derrama por Industria y Empleos ───────────────────── */}
      <div
        className="rounded-[12px] border p-5"
        style={{ borderColor: C.borderLight, background: C.bone }}
      >
        <span
          className="text-[10px] uppercase tracking-[0.06em]"
          style={{ color: C.textLight }}
        >
          Impacto económico regional
        </span>
        <h3
          className="font-serif text-[18px] mt-0.5 mb-4"
          style={{ color: C.textDark }}
        >
          Derrama por Industria y Empleos por Sector
        </h3>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={barData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={C.borderLight} vertical={false} />
            <XAxis
              dataKey="sector"
              tick={{ fontSize: 10, fill: C.textMid }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: C.textLight }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => fmt.mxnK(v as number)}
            />
            <Tooltip
              formatter={(v: number) => fmt.mxn(v)}
              contentStyle={{
                background: C.bone, border: `1px solid ${C.borderLight}`,
                borderRadius: 8, fontSize: 12,
              }}
            />
            <Bar dataKey="value" fill={C.green} radius={[4, 4, 0, 0]} name="Derrama MXN" />
          </BarChart>
        </ResponsiveContainer>

        {/* Empleos por sector chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {[
            { label: 'Centros de Acopio', value: empleos?.centrosAcopio ?? 0 },
            { label: 'Recicladoras',      value: empleos?.recicladoras  ?? 0 },
            { label: 'Acerera',           value: empleos?.acerera       ?? 0 },
            { label: 'Agrícola',          value: empleos?.agricola      ?? 0 },
          ].map(chip => (
            <div
              key={chip.label}
              className="rounded-[10px] border p-3 text-center"
              style={{ borderColor: C.border, background: C.lightGreen }}
            >
              <span className="font-mono text-[16px] font-bold" style={{ color: C.green }}>
                {fmt.num0(chip.value)}
              </span>
              <p className="text-[10px] uppercase tracking-[0.06em] mt-0.5" style={{ color: C.textMid }}>
                {chip.label}
              </p>
            </div>
          ))}
        </div>

        {/* Source citations */}
        <div className="mt-4 flex flex-col gap-1">
          {[
            'Acerera: CANACERO Informe 2023 — 3.2 empleos/kt chatarra procesada',
            'Agrícola: SAGARPA/SADER SIAP 2023 — composta a MXN 1,800/ton, 2.1 emp/ha',
          ].map(cite => (
            <p key={cite} className="text-[10px]" style={{ color: C.textLight }}>
              {cite}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}
