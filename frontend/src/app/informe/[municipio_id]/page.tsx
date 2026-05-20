'use client'

import type { ReactNode } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSimulatorStore } from '@/store/simulatorStore'

// ─── Format helpers ───────────────────────────────────────────────────────────

const mxn = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

const num = (n: number, d = 0) =>
  new Intl.NumberFormat('es-MX', { maximumFractionDigits: d }).format(n)

const pct = (n: number, d = 1) => `${num(n, d)}%`

// ─── Helpers for CA constants ─────────────────────────────────────────────────

const CAPEX_CA = { P: 726_476, M: 2_528_808, G: 7_131_655 } as const
const CAP_DIA  = { P: 5,       M: 15,         G: 50        } as const

const ESQUEMA_DESC: Record<string, string> = {
  A: 'Municipal Directo — El municipio opera los CAs directamente. 100 % de ingresos operativos van al municipio.',
  B: 'Concesión Privada — Un operador privado construye y opera los CAs; paga una cuota porcentual al municipio sobre ingresos brutos.',
  C: 'Asociación Público-Privada (APP) — Co-inversión: municipio aporta terreno y marco legal; empresa privada aporta capital.',
  D: 'Fideicomiso BANOBRAS — Financiamiento estructurado. Los ingresos cubren la deuda federal antes de distribuirse al municipio.',
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="break-before-page pt-8 mb-8">
      <h2 className="text-2xl font-serif font-bold text-[#3B6D11] border-b-2 border-[#3B6D11] pb-2 mb-5">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Tbl({ heads, rows }: { heads: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto mb-5">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#3B6D11] text-white">
            {heads.map((h, i) => (
              <th key={i} className="border border-green-800 px-3 py-2 text-left font-semibold whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-green-50'}>
              {row.map((cell, ci) => (
                <td key={ci} className="border border-gray-300 px-3 py-1.5 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function KpiGrid({ items }: { items: { label: string; value: string; unit?: string }[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-300 rounded p-4 bg-white">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{item.label}</div>
          <div className="font-mono text-xl font-bold text-[#3B6D11]">{item.value}</div>
          {item.unit && <div className="text-xs text-gray-500 mt-0.5">{item.unit}</div>}
        </div>
      ))}
    </div>
  )
}

function Formula({ name, expr }: { name: string; expr: string }) {
  return (
    <div className="flex gap-3 items-baseline py-1 border-b border-gray-100 last:border-0">
      <span className="font-mono text-[#3B6D11] font-semibold shrink-0 w-64">{name}</span>
      <span className="font-mono text-gray-700 text-sm">{expr}</span>
    </div>
  )
}

// ─── Main page component ──────────────────────────────────────────────────────

export default function InformePage() {
  const params  = useParams()
  const router  = useRouter()
  const municipio_id = typeof params?.municipio_id === 'string' ? params.municipio_id : ''

  const {
    resultados,
    zmActiva,
    municipiosActivos,
    horizonte,
    pctCapturaPorAño,
    mixCAs,
    encuestaResultados,
    esquemaConcesion,
    precios,
    genPercapita,
    seleccionMunicipioCatalog,
  } = useSimulatorStore()

  // ─── Guard — sin resultados ─────────────────────────────────────────────────
  if (!resultados) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow p-10 max-w-md text-center">
          <h1 className="text-2xl font-serif font-bold text-[#3B6D11] mb-4">
            Informe no disponible
          </h1>
          <p className="text-gray-600 mb-6">
            Configura el simulador primero para generar el informe.
          </p>
          <button
            onClick={() => router.push('/simulator')}
            className="bg-[#3B6D11] text-white px-6 py-2 rounded hover:bg-green-800 transition-colors"
          >
            ← Ir al simulador
          </button>
        </div>
      </div>
    )
  }

  // ─── Derived values ─────────────────────────────────────────────────────────
  const r              = resultados
  const municipioLabel = seleccionMunicipioCatalog?.nombre ?? municipiosActivos[0]?.toUpperCase() ?? zmActiva
  const fechaHoy       = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
  const pctFinal       = pctCapturaPorAño[horizonte - 1] ?? pctCapturaPorAño.at(-1) ?? 0
  const diasOp         = 300
  const totalCAs       = mixCAs.P + mixCAs.M + mixCAs.G
  const capexMix       = mixCAs.P * CAPEX_CA.P + mixCAs.M * CAPEX_CA.M + mixCAs.G * CAPEX_CA.G
  const capDiaMix      = mixCAs.P * CAP_DIA.P  + mixCAs.M * CAP_DIA.M  + mixCAs.G * CAP_DIA.G

  // Material volumes (capturable) from results
  const vol        = r.volCapturablePorMat
  const petDia     = (vol.plastico ?? 0) * 0.50
  const hdpeDia    = (vol.plastico ?? 0) * 0.50
  const papelDia   = vol.papel    ?? 0
  const vidrioDia  = vol.vidrio   ?? 0
  const alDia      = vol.aluminio ?? 0
  const compostaDia = (vol.organico ?? 0) * 0.35

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">

      {/* ── Toolbar (screen only) ───────────────────────────────────────────── */}
      <div className="print:hidden sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/simulator')}
            className="text-sm text-gray-600 hover:text-[#3B6D11] flex items-center gap-1"
          >
            ← Regresar al simulador
          </button>
          <button
            onClick={() => window.print()}
            className="bg-[#3B6D11] text-white text-sm px-5 py-2 rounded hover:bg-green-800 transition-colors"
          >
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* ── Document container ─────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto p-6 print:max-w-none print:p-0">
        <div className="bg-white shadow-lg print:shadow-none rounded-lg p-12 print:p-0">

          {/* ── PORTADA ─────────────────────────────────────────────────────── */}
          <div className="min-h-[62vh] print:min-h-0 flex flex-col justify-center pb-16 print:pb-8">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">
              ALQUIMIA Platform · Análisis de Circularidad
            </p>
            <h1 className="text-5xl font-serif font-bold text-gray-900 leading-tight mb-4">
              Informe de Circularidad Municipal
            </h1>
            <p className="text-xl text-[#3B6D11] font-semibold mb-1">
              {municipioLabel} · {fechaHoy}
            </p>
            <p className="text-sm text-gray-500 mb-10">
              Preparado por ALQUIMIA Platform · {municipio_id}
            </p>
            <div className="border border-yellow-400 bg-yellow-50 rounded p-4 text-xs text-yellow-800 max-w-2xl leading-relaxed">
              <strong>Aviso legal:</strong> Este documento es un análisis prospectivo generado por
              simulación. No constituye dictamen técnico oficial ni documento de licitación. Los
              datos proyectados requieren validación con fuentes municipales competentes antes de
              uso oficial.
            </div>
          </div>

          {/* ── RESUMEN EJECUTIVO ──────────────────────────────────────────── */}
          <Section id="resumen" title="Resumen Ejecutivo">
            <KpiGrid items={[
              { label: 'RSU generado/día',            value: num(r.rsuTotalTonDia, 1),          unit: 't/día' },
              { label: 'Captura objetivo (año final)', value: pct(pctFinal, 0),                  unit: `año ${horizonte}` },
              { label: 'Ingresos municipio/año',       value: mxn(r.ingresosMunicipioTotal),     unit: 'MXN/año' },
              { label: 'Empleos directos',             value: num(r.empleosTotalesDirectos),      unit: 'plazas' },
              { label: 'CO₂e evitadas',                value: num(r.co2eEvitadasAnualTon, 0),    unit: 't/año' },
              { label: 'TIR del programa',             value: pct(r.tir, 1),                     unit: 'retorno interno' },
            ]} />
            <div className="bg-gray-50 border-l-4 border-[#3B6D11] p-4 rounded text-sm text-gray-700 leading-relaxed">
              <strong>Veredicto:</strong> El municipio de <strong>{municipioLabel}</strong> genera{' '}
              <strong>{num(r.rsuTotalTonDia, 1)} t/día</strong> de RSU, de las cuales hoy recupera
              menos del <strong>5 %</strong>. Un programa de separación en origen, con{' '}
              <strong>{totalCAs}</strong> centros de acopio bajo esquema{' '}
              <strong>{esquemaConcesion}</strong>, proyecta capturar el{' '}
              <strong>{pct(pctFinal, 0)}</strong> de los residuos valorizables en{' '}
              <strong>{horizonte} {horizonte === 1 ? 'año' : 'años'}</strong>, generando{' '}
              <strong>{num(r.empleosTotalesDirectos)}</strong> empleos directos y{' '}
              <strong>{mxn(r.ingresosMunicipioTotal)}</strong> MXN anuales en ingresos
              municipales, a una TIR de <strong>{pct(r.tir, 1)}</strong>.
            </div>
          </Section>

          {/* ── CAP 1: DIAGNÓSTICO TERRITORIAL ────────────────────────────── */}
          <Section id="cap1" title="Capítulo 1. Diagnóstico Territorial">
            <Tbl heads={['Variable', 'Valor', 'Fórmula', 'Fuente']} rows={[
              ['Población activa',         `${num(r.pobActiva)} hab`,                    'Población × 0.85',                     'INEGI Censo 2020'],
              ['Generación RSU',           `${num(r.rsuTotalTonDia, 2)} t/día`,          'Pob × gen_per_cápita / 1,000',         'SEMARNAT Diag. 2020'],
              ['Gen. per cápita usada',    `${genPercapita} kg/hab/día`,                 'Parámetro calibrado (registry)',        'SEMARNAT 2020'],
              ['Composición RSU',          '52 % org · 13 % plást · 12 % papel · 4 % vidrio · 3 % metales · 16 % otros', 'Mix estándar', 'SEMARNAT 2022'],
              ['Vida útil relleno +',      `${num(r.extensionRelleno, 1)} años`,         'Con programa activo de desvío',         'Estimación operativa'],
              ['Costo disposición actual', `${mxn(r.rsuTotalTonDia * 365 * 320)} /año`,  'ton/año × $320/ton (disposición)',     'SEMARNAT 2021'],
            ]} />
          </Section>

          {/* ── CAP 2: CONTEXTO SOCIAL ────────────────────────────────────── */}
          <Section id="cap2" title="Capítulo 2. Contexto Social y Aceptación">
            {encuestaResultados ? (
              <Tbl heads={['Indicador', 'IPC (%)', 'N muestras']} rows={[
                ['IPC Global',                       pct(encuestaResultados.ipc_global, 1),         String(encuestaResultados.n_total)],
                ['Hemisferio 1 (condominios + privadas)', pct(encuestaResultados.ipc_hemisferio1, 1), String(encuestaResultados.n_condominio + encuestaResultados.n_privada)],
                ['Hemisferio 2 (casas vía pública)', pct(encuestaResultados.ipc_hemisferio2_vp, 1), String(encuestaResultados.n_vp)],
              ]} />
            ) : (
              <div className="bg-yellow-50 border border-yellow-300 rounded p-4 text-sm text-yellow-800 mb-4">
                Sin datos de campo para este municipio. Benchmark SEMARNAT 2022: IPC = 70 % de
                disposición ciudadana a separar residuos.
              </div>
            )}
            <Tbl heads={['Plan educativo', 'Detalle']} rows={[
              ['Duración campaña inicial',  '8–12 semanas (intensiva) + mantenimiento continuo'],
              ['Costo estimado comunicación', `${mxn(600_000)} / año (promotores + difusión)`],
              ['Estrategia',               'Talleres colonia piloto + brigadas puerta-a-puerta en VP'],
              ['Indicador de éxito',       'IPC ≥ 70 % en primeros 6 meses de operación'],
            ]} />
          </Section>

          {/* ── CAP 3: METAS Y TRAYECTORIAS ──────────────────────────────── */}
          <Section id="cap3" title="Capítulo 3. Metas y Trayectorias">
            <Tbl heads={['Año', '% Captura', 'Ton capturadas / año (est.)', 'RSU desviado de relleno']} rows={
              pctCapturaPorAño.slice(0, horizonte).map((p, i) => {
                const capTon = r.rsuTotalTonDia * (p / 100) * diasOp
                return [
                  `Año ${i + 1}`,
                  pct(p, 0),
                  `${num(capTon, 0)} t`,
                  `${mxn(capTon * 320)} ahorrado`,
                ]
              })
            } />
            <Tbl heads={['Escenario', 'Captura año final', 'Descripción']} rows={[
              ['Base (Realista)',      pct(pctFinal, 0),                               'Trayectoria configurada en el simulador'],
              ['Optimista (+15 pp)',   pct(Math.min(100, pctFinal + 15), 0),           'IPC > 85 % y logística eficiente'],
              ['Adverso (−15 pp)',     pct(Math.max(0,   pctFinal - 15), 0),           'Resistencia ciudadana alta o fallas operativas'],
            ]} />
          </Section>

          {/* ── CAP 4: INFRAESTRUCTURA ────────────────────────────────────── */}
          <Section id="cap4" title="Capítulo 4. Infraestructura y Logística">
            <Tbl heads={['Tipo CA', 'Cantidad', 'Cap. (t/día)', 'CAPEX unitario', 'CAPEX subtotal']} rows={[
              ['Pequeño (P)', num(mixCAs.P), String(CAP_DIA.P),  mxn(CAPEX_CA.P), mxn(mixCAs.P * CAPEX_CA.P)],
              ['Mediano (M)', num(mixCAs.M), String(CAP_DIA.M),  mxn(CAPEX_CA.M), mxn(mixCAs.M * CAPEX_CA.M)],
              ['Grande (G)',  num(mixCAs.G), String(CAP_DIA.G),  mxn(CAPEX_CA.G), mxn(mixCAs.G * CAPEX_CA.G)],
              ['TOTAL',       num(totalCAs), num(capDiaMix),     '—',             mxn(capexMix)],
            ]} />
            <div className="p-4 bg-gray-50 rounded border text-sm mb-4">
              <strong className="text-[#3B6D11]">Esquema de concesión seleccionado: {esquemaConcesion}</strong>
              <p className="text-gray-600 mt-1">{ESQUEMA_DESC[esquemaConcesion]}</p>
            </div>
            <p className="text-xs text-gray-500">
              CAPEX basado en CA_CONFIG SEMARNAT Guía 2022. El CAPEX total del modelo financiero
              puede diferir por escalas, terreno y economías de alcance.
            </p>
          </Section>

          {/* ── CAP 5: MERCADO ────────────────────────────────────────────── */}
          <Section id="cap5" title="Capítulo 5. Mercado y Colocación">
            <Tbl heads={['Material', 'Vol (t/día)', 'Precio MXN/ton', 'Ingreso anual est.']} rows={[
              ['PET',           num(petDia, 3),    mxn(precios.pet      * 1_000), mxn(petDia    * precios.pet      * 1_000 * diasOp)],
              ['HDPE',          num(hdpeDia, 3),   mxn(precios.hdpe     * 1_000), mxn(hdpeDia   * precios.hdpe     * 1_000 * diasOp)],
              ['Papel / Cartón', num(papelDia, 3), mxn(precios.papel    * 1_000), mxn(papelDia  * precios.papel    * 1_000 * diasOp)],
              ['Vidrio',        num(vidrioDia, 3), mxn(precios.vidrio   * 1_000), mxn(vidrioDia * precios.vidrio   * 1_000 * diasOp)],
              ['Aluminio',      num(alDia, 3),     mxn(precios.aluminio * 1_000), mxn(alDia     * precios.aluminio * 1_000 * diasOp)],
              ['Composta',      num(compostaDia, 3), 'MXN 1,800 / ton (SIAP 2023)', mxn(compostaDia * 1_800 * diasOp)],
            ]} />
            <p className="text-xs text-gray-500">
              Volúmenes estimados al {pct(pctFinal, 0)} de captura (año {horizonte}).
              Precio composta a granel ± MXN 400/ton. Días operativos: {diasOp}/año.
            </p>
          </Section>

          {/* ── CAP 6: RIESGOS ────────────────────────────────────────────── */}
          <Section id="cap6" title="Capítulo 6. Riesgos">
            <Tbl heads={['Riesgo', 'Probabilidad', 'Impacto', 'Mitigación']} rows={[
              [
                'Volatilidad de precios de materiales reciclables',
                'Media',
                'Alto',
                'Contratos forward con recicladoras; diversificación de compradores',
              ],
              [
                `Resistencia ciudadana (IPC base: ${encuestaResultados ? pct(encuestaResultados.ipc_global) : 'benchmark 70 %'})`,
                'Variable',
                'Alto',
                'Plan educativo + incentivos por colonia + brigadas puerta-a-puerta VP',
              ],
              [
                'Cambio de administración municipal (cada 3 años)',
                'Baja–Media',
                'Alto',
                'Adendos al Reglamento de Limpia + contratos formalizados con cláusula de continuidad',
              ],
            ]} />
          </Section>

          {/* ── CAP 7: RETORNO ECONÓMICO ──────────────────────────────────── */}
          <Section id="cap7" title="Capítulo 7. Retorno Económico">
            <Tbl heads={['Métrica', 'Valor', 'Interpretación']} rows={[
              ['TIR',                    pct(r.tir, 1),            '≥ 15 % es viable para concesionario privado'],
              ['VPN',                    mxn(r.vpn),               'Positivo = programa crea valor neto en horizonte'],
              ['Payback',                `${num(r.paybackMeses, 0)} meses`, 'Tiempo de recuperación del CAPEX'],
              ['EBITDA / año',           mxn(r.ebitda),            'Flujo operativo antes de amortización de deuda'],
              ['Ingresos municipio / año', mxn(r.ingresosMunicipioTotal), 'Operativos + fiscales (ISN + derechos)'],
              ['Ing. operativo (esquema)', mxn(r.ingresosMunicipioOperativo), `Esquema ${esquemaConcesion}`],
              ['Ing. fiscal (ISN + otros)', mxn(r.ingresosMunicipioFiscal), 'Impuesto sobre nómina + derechos'],
            ]} />
            <h3 className="text-base font-semibold text-gray-800 mb-3 mt-4">Derrama por sector industrial</h3>
            <Tbl heads={['Sector', 'Derrama anual estimada']} rows={[
              ['Reciclaje (PET, papel, vidrio procesado)', mxn(r.derramaIndustrialPorSector.reciclaje)],
              ['Acerera (metales → industria siderúrgica)', mxn(r.derramaIndustrialPorSector.acerera)],
              ['Agrícola (composta → fertilizante equiv.)', mxn(r.derramaIndustrialPorSector.agricola)],
            ]} />
          </Section>

          {/* ── CAP 8: DOBLE MATERIALIDAD ─────────────────────────────────── */}
          <Section id="cap8" title="Capítulo 8. Doble Materialidad">
            <Tbl heads={['Indicador', 'Estándar', 'Valor proyectado']} rows={[
              ['Residuos desviados de relleno',          'GRI 306-2',        `${num(r.rsuTotalTonDia * (pctFinal / 100) * diasOp, 0)} t/año`],
              ['Emisiones evitadas (Alcance 3)',          'GRI 305-3 / ESRS E1-6', `${num(r.co2eEvitadasAnualTon, 0)} t CO₂e/año`],
              ['Material recuperado y reciclado',         'GRI 306-4',        `${num(r.rsuTotalTonDia * (pctFinal / 100) * diasOp * 0.48, 0)} t/año`],
              ['Empleo formal en economía circular',      'GRI 401-1 / ESRS S1', `${num(r.empleosTotalesDirectos)} empleos directos`],
              ['Extensión vida útil relleno sanitario',   'ESRS E5-5',        `${num(r.extensionRelleno, 1)} años adicionales`],
              ['PM₂.₅ evitado (quema a cielo abierto)',  'ESRS E2-4',        `${num(r.pm25EvitadoTon, 2)} t/año`],
            ]} />
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              Valores prospectivos calculados por simulación. Requieren verificación anual con datos
              operativos reales. Marco: GRI Universal Standards 2021 + ESRS (EFRAG 2023). Las
              declaraciones CSRD aplican a operadores europeos con presencia en México.
            </p>
          </Section>

          {/* ── CAP 9: HOJA DE RUTA ───────────────────────────────────────── */}
          <Section id="cap9" title="Capítulo 9. Hoja de Ruta">
            <Tbl heads={['Fase', 'Actividad', 'Semanas']} rows={[
              ['1', 'Diagnóstico técnico y diseño del programa',              'Semanas 1–3'],
              ['2', 'Diseño técnico de CAs y selección de sitios',            'Semanas 2–5'],
              ['3', 'Proceso de licitación, evaluación y adjudicación',       'Semanas 3–9'],
              ['4', 'Construcción e instalación de CAs',                      'Semanas 7–18'],
              ['5', 'Equipamiento, capacitación de operadores y ed. ciudadana', 'Semanas 14–20'],
              ['6', 'Operación piloto, medición y ajustes',                   'Semanas 18+'],
            ]} />
          </Section>

          {/* ── CAP 10: ADENDOS ───────────────────────────────────────────── */}
          <Section id="cap10" title="Capítulo 10. Adendos Propuestos al Reglamento de Limpia">
            <p className="text-sm text-gray-700 mb-4">
              Los siguientes adendos son necesarios para dar base jurídica al programa bajo el
              marco LGPGIR (DOF 2022):
            </p>
            <ul className="list-disc pl-6 text-sm text-gray-700 space-y-1.5 mb-6">
              <li>Artículo de separación en origen obligatoria (Fracción I: orgánicos / Fracción II: inorgánicos reciclables)</li>
              <li>Artículo de recolección diferenciada con frecuencia y horario específicos</li>
              <li>Figura del Centro de Acopio Municipal y sus atribuciones operativas</li>
              <li>Modelo de concesión o APP (esquema {esquemaConcesion}) con cláusulas de rescisión y continuidad</li>
              <li>Estructura tarifaria para usuarios domésticos e industriales (art. 115 LGPGIR)</li>
              <li>Registro y formalización de recuperadores/pepenadores como recicladores de base</li>
              <li>Sanciones ejecutables ante incumplimiento reiterado de separación en origen</li>
            </ul>
            <div className="border border-dashed border-gray-400 rounded p-4 text-xs text-gray-500 italic">
              [Borrador de adendo pendiente de elaboración jurídica. Requiere revisión por el
              Síndico Municipal y validación ante Secretaría de Gobernación estatal antes de
              presentar al Cabildo para aprobación en sesión ordinaria.]
            </div>
          </Section>

          {/* ── APÉNDICE A: FÓRMULAS ──────────────────────────────────────── */}
          <Section id="apendiceA" title="Apéndice A. Fórmulas Clave">
            <div className="bg-gray-50 border rounded p-6 space-y-1">
              <Formula name="rsuTotalTonDia"             expr="= pobActiva × genPercapita / 1,000" />
              <Formula name="ingresosBrutos"             expr="= Σ(volMat[i] × precioMat[i] × diasOperativos)" />
              <Formula name="ingresosComposta"           expr="= volOrg × 0.35 × 1,800 MXN/ton × diasOp" />
              <Formula name="co2eEvitadas"               expr="= tonCapturada × factorEmisión_CH₄ × GWP_CH₄ (25)" />
              <Formula name="TIR"                        expr="= tasa r donde VPN(FCF, r) = 0" />
              <Formula name="ingMunicipioOp (A)"         expr="= ingresosBrutos × 1.00" />
              <Formula name="ingMunicipioOp (B)"         expr="= ingresosBrutos × pctCuotaConcesion" />
              <Formula name="ingMunicipioOp (C)"         expr="= ingresosBrutos × pctSocioPublico" />
              <Formula name="ingMunicipioOp (D)"         expr="= FCF después del servicio de deuda BANOBRAS" />
              <Formula name="ISN"                        expr="= empleos × salarioBruto × tasaISN (SLP 2 %, NL 3 %, QRO 2 %)" />
            </div>
          </Section>

          {/* ── APÉNDICE B: SUPUESTOS ─────────────────────────────────────── */}
          <Section id="apendiceB" title="Apéndice B. Supuestos y Limitaciones">
            <Tbl heads={['Supuesto', 'Valor utilizado', 'Rango incertidumbre', 'Fuente']} rows={[
              ['Generación per cápita',   `${genPercapita} kg/hab/día`,                     '± 0.2 kg/hab/día',     'SEMARNAT 2020'],
              ['Factor compostaje',        '0.35 ton compost / ton orgánico',                '± 0.05',               'SEMARNAT 2020'],
              ['Días operativos',          '300 días/año',                                   'Fijo (festivos + mant.)', 'Operativo estándar'],
              ['Precio composta granel',   'MXN 1,800 / ton',                                '± MXN 400 / ton',      'SIAP 2023'],
              ['Precio PET',               `${mxn(precios.pet * 1_000)} / ton`,              '± MXN 1,200 / ton',    'ANIPAC 2024'],
              ['IPC ciudadano',            encuestaResultados ? `${pct(encuestaResultados.ipc_global)} (campo)` : '70 % (benchmark)', 'Variable regional', 'SEMARNAT 2022 / Encuesta campo'],
              ['Tasa ISN estatal',         'SLP 2 % · NL 3 % · QRO 2 %',                   'Fijo por ley',          'Leyes de Hacienda Estatales 2025'],
              ['Vida útil equipos CAs',    '10 años',                                        'Fijo',                  'SEMARNAT Guía 2022'],
            ]} />
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              Este modelo es una herramienta de prefactibilidad. Los valores presentados tienen
              incertidumbre inherente al ser proyecciones basadas en parámetros nacionales. Antes
              de decisiones de inversión, licitación o presentación al Cabildo, se requiere un
              estudio de factibilidad técnica y financiera con datos de campo locales certificados.
            </p>
          </Section>

        </div>
      </div>

      {/* ── Print CSS ───────────────────────────────────────────────────────── */}
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 2cm 1.5cm;
          }
          .break-before-page {
            page-break-before: always;
          }
          table {
            border-collapse: collapse;
          }
          th, td {
            border: 1px solid #aaa !important;
          }
        }
      `}</style>
    </div>
  )
}
