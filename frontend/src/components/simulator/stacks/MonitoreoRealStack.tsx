'use client'

import { useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn, fmt } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'
import { KpiAnchorGrid, MarginalNote, SectionLabel } from '@/components/editorial'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PeriodRecord {
  periodo:            string
  tonSeparadas:       number | null
  tonTotalRecoleccion: number | null
  hogaresParticipando: number | null
  precioPet:          number | null
  precioPapel:        number | null
  precioComposta:     number | null
  empleosVerificados: number | null
  quejasCiudadanas:   number | null
}

const PERIODOS = [
  'Mes 1', 'Mes 2', 'Mes 3', 'Mes 4', 'Mes 5', 'Mes 6',
  'Mes 7', 'Mes 8', 'Mes 9', 'Mes 10', 'Mes 11', 'Mes 12',
  'Año 1', 'Año 2', 'Año 3',
]

type TabId = 'captura' | 'comparacion' | 'semaforo'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyRecord(periodo: string): PeriodRecord {
  return {
    periodo,
    tonSeparadas:        null,
    tonTotalRecoleccion: null,
    hogaresParticipando: null,
    precioPet:           null,
    precioPapel:         null,
    precioComposta:      null,
    empleosVerificados:  null,
    quejasCiudadanas:    null,
  }
}

type SemaforoStatus = 'verde' | 'amarillo' | 'rojo'

function calcSemaforo(proyectado: number, medido: number | null): SemaforoStatus {
  if (medido === null || proyectado === 0) return 'rojo'
  const brecha = Math.abs((medido - proyectado) / proyectado) * 100
  if (brecha <= 10) return 'verde'
  if (brecha <= 25) return 'amarillo'
  return 'rojo'
}

function SemaforoIcon({ status }: { status: SemaforoStatus }) {
  if (status === 'verde')    return <span className="text-[#3B6D11] font-mono text-[13px]">✓</span>
  if (status === 'amarillo') return <span className="text-[#D4881E] font-mono text-[13px]">△</span>
  return <span className="text-red-500 font-mono text-[13px]">✕</span>
}

function SemaforoDot({ status }: { status: SemaforoStatus }) {
  return (
    <span
      className={cn(
        'inline-block w-2.5 h-2.5 rounded-full',
        status === 'verde'    && 'bg-[#3B6D11]',
        status === 'amarillo' && 'bg-[#D4881E]',
        status === 'rojo'     && 'bg-red-500',
      )}
    />
  )
}

function RailSection({ title, children, open: defaultOpen = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#EDE9E3] last:border-b-0">
      <button type="button" onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-3 px-1 text-left">
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#6B6760] font-bold">{title}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 text-[#A8A49C] transition-transform', open && 'rotate-180')} />
      </button>
      {open && <div className="pb-3 px-1 text-[11px] leading-relaxed text-[#6B6760] space-y-1">{children}</div>}
    </div>
  )
}

// ─── Tab 1: Field Data Capture ────────────────────────────────────────────────

interface Tab1Props {
  records:    PeriodRecord[]
  onSave:     (record: PeriodRecord) => void
}

function TabCaptura({ records, onSave }: Tab1Props) {
  const [periodo, setPeriodo] = useState(PERIODOS[0])
  const [form, setForm]       = useState<Omit<PeriodRecord, 'periodo'>>({
    tonSeparadas:        null,
    tonTotalRecoleccion: null,
    hogaresParticipando: null,
    precioPet:           null,
    precioPapel:         null,
    precioComposta:      null,
    empleosVerificados:  null,
    quejasCiudadanas:    null,
  })
  const [saved, setSaved] = useState<string | null>(null)

  function numField(
    label: string,
    key: keyof Omit<PeriodRecord, 'periodo'>,
    unit?: string,
  ) {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-[#6B6760]">
          {label}{unit && <span className="text-[#A8A49C] ml-1">({unit})</span>}
        </label>
        <input
          type="number"
          min={0}
          step="any"
          placeholder="—"
          value={form[key] ?? ''}
          onChange={e => {
            const v = e.target.value === '' ? null : parseFloat(e.target.value)
            setForm(f => ({ ...f, [key]: v }))
          }}
          className={cn(
            'font-mono text-[13px] text-[#1C1B18]',
            'border border-[#E8E4DC] rounded-[8px] px-3 py-2',
            'bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/25 focus:border-[#C9DDB1]',
            'placeholder-[#A8A49C]',
          )}
        />
      </div>
    )
  }

  function handleSave() {
    onSave({ periodo, ...form })
    setSaved(periodo)
    setForm({
      tonSeparadas: null, tonTotalRecoleccion: null,
      hogaresParticipando: null, precioPet: null,
      precioPapel: null, precioComposta: null,
      empleosVerificados: null, quejasCiudadanas: null,
    })
    setTimeout(() => setSaved(null), 3500)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Period selector */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] text-[#6B6760]">Período de reporte</label>
        <select
          value={periodo}
          onChange={e => setPeriodo(e.target.value)}
          className={cn(
            'font-mono text-[13px] text-[#1C1B18]',
            'border border-[#E8E4DC] rounded-[8px] px-3 py-2',
            'bg-[#FDFCFA] focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/25',
          )}
        >
          {PERIODOS.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {numField('Toneladas separadas reales',         'tonSeparadas',        't/mes')}
        {numField('Toneladas totales recolectadas',     'tonTotalRecoleccion', 't/mes')}
        {numField('Hogares participando activamente',   'hogaresParticipando', 'hogares')}
        {numField('Precio real obtenido por PET',       'precioPet',           'MXN/ton')}
        {numField('Precio real obtenido por papel',     'precioPapel',         'MXN/ton')}
        {numField('Precio real obtenido por composta',  'precioComposta',      'MXN/ton')}
        {numField('N° de empleos directos verificados', 'empleosVerificados',  'empleos')}
        {numField('N° de quejas ciudadanas recibidas',  'quejasCiudadanas',    'quejas')}
      </div>

      {/* Save button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className={cn(
            'px-4 py-2 rounded-[8px] text-[13px] font-medium',
            'bg-[#3B6D11] text-white',
            'hover:bg-[#2f5a0d] transition-colors',
          )}
        >
          Guardar período
        </button>
        {saved && (
          <p className="text-[12px] text-[#3B6D11] font-medium">
            ✓ Datos del {saved} guardados localmente.
          </p>
        )}
      </div>

      {/* Session note */}
      <p className="text-[11px] text-[#A8A49C] border border-[#E8E4DC] rounded-[8px] px-3 py-2 bg-[#F4F2ED]">
        Datos de sesión — no persistentes entre recargas.
      </p>

      {/* Saved records summary */}
      {records.length > 0 && (
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-[#6B6760] font-medium">Períodos guardados ({records.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {records.map(r => (
              <span
                key={r.periodo}
                className="font-mono text-[11px] bg-[#EAF3DE] text-[#3B6D11] border border-[#C9DDB1] rounded-[6px] px-2 py-0.5"
              >
                {r.periodo}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 2: Proyectado vs Real ────────────────────────────────────────────────

interface Tab2Props {
  records:           PeriodRecord[]
  pctCapturaPorAño:  number[]
}

function TabComparacion({ records, pctCapturaPorAño }: Tab2Props) {
  const resultados = useSimulatorStore(s => s.resultados)
  const r          = resultados

  if (!r) {
    return (
      <p className="text-[13px] text-[#6B6760] py-6 text-center">
        Sin resultados calculados aún. Configura la ZM activa para ver proyecciones.
      </p>
    )
  }

  // Latest record with actual data
  const lastRecord = records.length > 0 ? records[records.length - 1] : null

  // Captura tasa
  const pctCapturaProyectada = pctCapturaPorAño[0] ?? 20
  const pctCapturaMedida     =
    lastRecord?.tonSeparadas && lastRecord?.tonTotalRecoleccion
      ? (lastRecord.tonSeparadas / lastRecord.tonTotalRecoleccion) * 100
      : null

  // Ton separadas/mes proyectadas
  const tonSepProyectada = r.rsuTotalTonDia * 25 * pctCapturaProyectada / 100
  const tonSepMedida     = lastRecord?.tonSeparadas ?? null

  // Empleos
  const empleosProyectados = r.empleosTotalesDirectos
  const empleosMedidos     = lastRecord?.empleosVerificados ?? null

  // Ingresos
  const ingresosProyectados = r.ingresosMunicipioTotal
  // Ingresos medidos: no direct field, show null
  const ingresosMedidos: number | null = null

  interface KPIRow {
    label:      string
    proyectado: number
    medido:     number | null
    unit:       string
  }

  const kpis: KPIRow[] = [
    {
      label: 'Tasa de captura (%)',
      proyectado: pctCapturaProyectada,
      medido:     pctCapturaMedida,
      unit:       '%',
    },
    {
      label: 'Toneladas separadas/mes',
      proyectado: tonSepProyectada,
      medido:     tonSepMedida,
      unit:       't',
    },
    {
      label: 'Empleos directos',
      proyectado: empleosProyectados,
      medido:     empleosMedidos,
      unit:       'emp',
    },
    {
      label: 'Ingresos municipio/año',
      proyectado: ingresosProyectados,
      medido:     ingresosMedidos,
      unit:       'MXN',
    },
  ]

  function fmtValue(v: number | null, unit: string): string {
    if (v === null) return '—'
    if (unit === 'MXN') return fmt.mxn(v)
    if (unit === '%')   return `${fmt.num(v)}%`
    return `${fmt.num(v)} ${unit}`
  }

  function brecha(proy: number, med: number | null): string {
    if (med === null || proy === 0) return '—'
    const diff = ((med - proy) / proy) * 100
    return `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`
  }

  const nConDatos = records.length

  return (
    <div className="flex flex-col gap-5">
      {records.length === 0 ? (
        <div className="rounded-[10px] border border-[#E8E4DC] bg-[#F4F2ED] px-4 py-5 text-center">
          <p className="text-[13px] text-[#6B6760]">
            Sin datos de campo aún. Registra el primer período en la pestaña anterior.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] border-collapse">
              <thead>
                <tr className="border-b border-[#E8E4DC]">
                  {['Indicador', 'Proyectado', 'Medido', 'Brecha', 'Semáforo'].map(h => (
                    <th
                      key={h}
                      className="text-left text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] font-medium pb-2 pr-4 last:pr-0"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpis.map(kpi => {
                  const status = calcSemaforo(kpi.proyectado, kpi.medido)
                  return (
                    <tr key={kpi.label} className="border-b border-[#F4F2ED]">
                      <td className="py-2.5 pr-4 text-[#1C1B18] font-medium">{kpi.label}</td>
                      <td className="py-2.5 pr-4 font-mono text-[#6B6760]">
                        {fmtValue(kpi.proyectado, kpi.unit)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[#1C1B18]">
                        {fmtValue(kpi.medido, kpi.unit)}
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-[#6B6760]">
                        {brecha(kpi.proyectado, kpi.medido)}
                      </td>
                      <td className="py-2.5">
                        <SemaforoIcon status={status} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confidence badge */}
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-[8px] text-[12px]',
          nConDatos === 0
            ? 'bg-[#FEF7E7] text-[#D4881E] border border-[#D4881E]/20'
            : 'bg-[#EAF3DE] text-[#3B6D11] border border-[#C9DDB1]',
        )}
      >
        {nConDatos === 0 ? (
          <>
            <span>🟠</span>
            <span>Proyectado — Solo datos del simulador disponibles</span>
          </>
        ) : (
          <>
            <span>🟢</span>
            <span>Mixto — {nConDatos} {nConDatos === 1 ? 'período' : 'períodos'} con datos reales</span>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Tab 3: Semáforo de Desempeño ────────────────────────────────────────────

interface Tab3Props {
  records:          PeriodRecord[]
  pctCapturaPorAño: number[]
}

function TabSemaforo({ records, pctCapturaPorAño }: Tab3Props) {
  const resultados = useSimulatorStore(s => s.resultados)
  const r          = resultados

  const lastRecord = records.length > 0 ? records[records.length - 1] : null

  // Compute live values
  const pctCapturaProyectada = pctCapturaPorAño[0] ?? 20
  const pctCapturaMedida     =
    lastRecord?.tonSeparadas && lastRecord?.tonTotalRecoleccion
      ? (lastRecord.tonSeparadas / lastRecord.tonTotalRecoleccion) * 100
      : null

  const empleosMedidos    = lastRecord?.empleosVerificados ?? null
  const empleosProyectado = r?.empleosTotalesDirectos ?? 0

  const ingresosProy  = r?.ingresosMunicipioTotal ?? 0
  const co2eProyected = r?.co2eEvitadasAnualTon ?? 0
  const quejas        = lastRecord?.quejasCiudadanas ?? null

  interface KPICard {
    label:      string
    value:      string
    sub?:       string
    status:     SemaforoStatus
    big?:       boolean
  }

  const cards: KPICard[] = [
    {
      label:  'Tasa de captura',
      value:  pctCapturaMedida !== null ? `${fmt.num(pctCapturaMedida)}%` : `${pctCapturaProyectada}% proy.`,
      sub:    `Meta: ${pctCapturaProyectada}%`,
      status: calcSemaforo(pctCapturaProyectada, pctCapturaMedida),
    },
    {
      label:  'Empleos directos',
      value:  empleosMedidos !== null ? fmt.num0(empleosMedidos) : (r ? fmt.num0(empleosProyectado) : '—'),
      sub:    r ? `Proyectado: ${fmt.num0(empleosProyectado)}` : undefined,
      status: calcSemaforo(empleosProyectado, empleosMedidos),
    },
    {
      label:  'Ingresos municipio',
      value:  r ? fmt.mxn(ingresosProy) : '—',
      sub:    'Proyectado anual',
      status: 'verde' as SemaforoStatus,   // no real data available for this KPI
    },
    {
      label:  'CO₂e evitadas',
      value:  r ? fmt.co2(co2eProyected) : '—',
      sub:    'Proyectado anual',
      status: 'verde' as SemaforoStatus,
    },
    {
      label:  'Quejas ciudadanas',
      value:  quejas !== null ? fmt.num0(quejas) : '—',
      sub:    quejas !== null ? (quejas > 5 ? 'Supera umbral (>5/mes)' : 'Dentro del umbral') : 'Sin dato',
      status: quejas === null ? 'rojo' : quejas > 5 ? 'rojo' : 'verde',
    },
    {
      label:  'Períodos con datos',
      value:  String(records.length),
      sub:    records.length === 0 ? 'Sin registros aún' : `Último: ${records[records.length - 1].periodo}`,
      status: records.length === 0 ? 'rojo' : records.length < 3 ? 'amarillo' : 'verde',
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <KpiAnchorGrid
        columns={3}
        items={cards.map(card => ({
          label: card.sub ? `${card.label} · ${card.sub}` : card.label,
          value: card.value,
          figureClassName: cn(
            card.status === 'verde'    && 'text-[#3B6D11]',
            card.status === 'amarillo' && 'text-[#D4881E]',
            card.status === 'rojo'     && 'text-red-600',
          ),
        }))}
      />

      <MarginalNote>
        El semáforo se actualiza automáticamente cuando se registran datos de campo en la pestaña anterior.{' '}
        Verde = ≤10% de brecha vs proyección · Amarillo = 10-25% · Rojo = &gt;25% o sin dato.
      </MarginalNote>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MonitoreoRealStack() {
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)

  const [activeTab, setActiveTab]   = useState<TabId>('captura')
  const [records, setRecords]       = useState<PeriodRecord[]>([])

  function handleSave(record: PeriodRecord) {
    setRecords(prev => {
      const idx = prev.findIndex(r => r.periodo === record.periodo)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = record
        return next
      }
      return [...prev, record]
    })
  }

  const TABS: { id: TabId; label: string }[] = [
    { id: 'captura',     label: 'Captura de Datos' },
    { id: 'comparacion', label: 'Proyectado vs. Real' },
    { id: 'semaforo',    label: 'Semáforo de Desempeño' },
  ]

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px] gap-6 items-start">
      <div className="overflow-hidden border border-[#E8E4DC] rounded-[12px]">
        <div className="px-6 pt-4 pb-0 border-b border-[#E8E4DC]">
          <div className="flex gap-0 -mb-px overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-shrink-0 px-4 py-2.5 text-[12px] font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-[#3B6D11] text-[#3B6D11]'
                    : 'border-transparent text-[#6B6760] hover:text-[#1C1B18]',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {activeTab === 'captura' && (
            <TabCaptura records={records} onSave={handleSave} />
          )}
          {activeTab === 'comparacion' && (
            <TabComparacion records={records} pctCapturaPorAño={pctCapturaPorAño} />
          )}
          {activeTab === 'semaforo' && (
            <TabSemaforo records={records} pctCapturaPorAño={pctCapturaPorAño} />
          )}
        </div>
      </div>

      <aside className="sticky top-4 border-l border-[#E8E4DC] pl-4">
        <SectionLabel as="span">Metodología</SectionLabel>
        <RailSection title="Captura de campo" open>
          <p>Registros manuales por periodo — toneladas separadas, hogares, precios de mercado y quejas ciudadanas.</p>
        </RailSection>
        <RailSection title="Comparación">
          <p>Brecha proyectado vs. medido usando pctCapturaPorAño del simulador y datos capturados en campo.</p>
        </RailSection>
        <RailSection title="Semáforo">
          <p>Verde ≤10% brecha · Amarillo 10-25% · Rojo &gt;25% o sin dato registrado.</p>
        </RailSection>
        <RailSection title="Límites">
          <p>No sustituye PER oficial ni dictamen SEMARNAT. Los datos no se persisten en servidor en esta versión.</p>
        </RailSection>
      </aside>
    </div>
  )
}
