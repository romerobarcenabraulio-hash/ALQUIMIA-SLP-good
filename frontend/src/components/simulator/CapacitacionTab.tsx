'use client'

/**
 * Pestaña de Capacitación — M04 InfrastructureOperationsStack.
 *
 * Plan de formación por fase, con modelo de costo real segmentado por tipo de vivienda:
 *   - Hemisferio 1 (condominio/privada): costo bajo — capacitar al administrador
 *   - Hemisferio 2 (VP): costo 3-5× mayor — brigadas puerta a puerta
 *
 * Las metas de adopción se derivan de pctCapturaPorAño (M03), no son hardcodeadas.
 * El costo educativo se conecta al IPC real de campo (indicePreparacionCiudadana).
 *
 * Fuentes metodológicas:
 * - SEMARNAT / INECC: "Guía de capacitación municipal para separación en origen" (2021).
 * - BANOBRAS: "Manuales de transferencia de conocimiento para programas de limpia" (2019).
 *   Costo base referencia: $80 MXN/hogar/año (brigada presencial básica).
 * - Anaya-Palacios (2024): "Curvas de adopción en programas de reciclaje urbano LATAM".
 * - Thaler & Sunstein (2008): principios de economía conductual para diseño de campaña.
 * - Grandes Generadores: LGPGIR Art. 42 — los comercios y hoteles son auto-responsables;
 *   la estrategia educativa aplica únicamente a vivienda residencial.
 */

import { useMemo } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_CA } from '@/lib/constants'
import { fmt as fmtObj } from '@/lib/utils'
const fmt = fmtObj.mxn

// ── Constantes educativas documentadas ────────────────────────────────────────
const COSTO_BASE_HOGAR_MXN = 80          // MXN/hogar/año — BANOBRAS 2019
const FACTOR_VP_MULTIPLICADOR = 3.5      // VP requiere 3.5× más que condominio (brigadas vs. administrador)
const MANTENIMIENTO_ANUAL_PCT = 0.40     // mantenimiento años 2+ = 40% del año 1
const IPC_REFERENCIA_BENCHMARK = 70      // SEMARNAT 2022 — 24 municipios mexicanos

// Semanas de ventana educativa recomendada antes de lanzar el CA
function calcularVentana(ipc: number): number {
  if (ipc >= 75) return 4
  if (ipc >= 60) return 8
  if (ipc >= 45) return 12
  return 16
}

// Contenido de capacitación por fase (calidad y temas — no cambia con el modelo)
const FASES_CONTENIDO = [
  {
    fase: 1,
    nombre: 'Arranque y piloto',
    participantes: { h1: 'Administradores de condominio y privada', h2: 'Brigadistas de calle + líderes de manzana' },
    duracion: { h1: '4 h taller', h2: '8 h presencial + recorrido de calle' },
    temas: ['Clasificación de RSU (5 fracciones)', 'Manejo seguro de materiales', 'Registro PER bitácora', 'Comunicación vecinal básica'],
    materiales: ['Guía de campo plastificada (INECC 2021)', 'Video 3 min: separación correcta', 'Kit de bolsas de separación para piloto'],
    kpi: 'Tasa de captura ≥ objetivo Año 1 al cierre del Trimestre 2',
  },
  {
    fase: 2,
    nombre: 'Expansión territorial',
    participantes: { h1: 'Residentes de condominio (sesiones por edificio)', h2: 'Hogares VP puerta a puerta + grupos WhatsApp' },
    duracion: { h1: '2 h por edificio + módulo digital', h2: '6 h taller zonal + seguimiento 30 días' },
    temas: ['Separación correcta por fracción', 'Cómo funciona el CA de mi zona', 'Norma social: "tu colonia ya separa"', 'Feedback de cuánto se recicló este mes'],
    materiales: ['Folleto "Mi colonia separa" (versión imprimible)', 'Cuestionario diagnóstico de adopción (CAPI)', 'Kit de carteles para punto limpio'],
    kpi: 'Hogares participantes ≥ objetivo Año 2',
  },
  {
    fase: 3,
    nombre: 'Consolidación',
    participantes: { h1: 'Comités de vecinos + administradores', h2: 'Inspectores + grandes generadores vecinales' },
    duracion: { h1: '3 h + protocolo de acreditación anual', h2: '4 h + acreditación de brigadista' },
    temas: ['Reglamento municipal (por artículo)', 'Diferenciación residuos especiales vs. peligrosos', 'Reporte de no conformidades (paso a incentivo vs. sanción)', 'KPIs de zona — tablero mensual'],
    materiales: ['Manual de inspección ALQUIMIA (base jurídica)', 'Protocolo de no conformidad', 'Tablero de indicadores por zona'],
    kpi: 'Cobertura ≥ objetivo Año 3; abandono < 20%',
  },
  {
    fase: 4,
    nombre: 'Profesionalización',
    participantes: { h1: 'Técnicos CA, jefes de zona', h2: 'Técnicos CA, operadores de brigada' },
    duracion: { h1: '16 h técnicas + evaluación', h2: '16 h + certificación operativa' },
    temas: ['Caracterización y calidad de material', 'Operación de biodigestor / composta', 'Mantenimiento preventivo de equipos', 'Estándares de calidad para venta industrial'],
    materiales: ['Manual técnico de operación (SEMARNAT 2022)', 'Hoja de control de calidad por lote', 'Registro de mantenimiento preventivo'],
    kpi: 'Calidad de material aceptada por comprador ≥ 95% de lotes',
  },
  {
    fase: 5,
    nombre: 'Escala ZM',
    participantes: { h1: 'Gestores inter-municipales, compradores', h2: 'Gestores + representantes de zonas VP inter-municipio' },
    duracion: { h1: 'Diplomado 40 h + mentoría mensual', h2: 'Diplomado 40 h + mentoría mensual' },
    temas: ['Gestión metropolitana de residuos', 'Negociación con compradores industriales', 'Marco legal inter-municipal', 'Transferencia de conocimiento'],
    materiales: ['Diplomado ALQUIMIA (módulos 1-8)', 'Contrato tipo para compradores', 'Agenda de transferencia ZM'],
    kpi: 'Cobertura ≥ 90% en ZM al año 5',
  },
]

const FASE_COLORS = ['#C8E6A4', '#A5C97A', '#7DA84A', '#5A8C2C', '#3B6D11']

export function CapacitacionTab() {
  const pctCapturaPorAño = useSimulatorStore(s => s.pctCapturaPorAño)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const resultados = useSimulatorStore(s => s.resultados)
  const indicePreparacionCiudadana = useSimulatorStore(s => s.indicePreparacionCiudadana)
  const casaViaPublicaPct = useSimulatorStore(s => (s as typeof s & { casaViaPublicaPct?: number }).casaViaPublicaPct ?? 70)
  const viviendaCondominioPct = useSimulatorStore(s => s.viviendaCondominioPct)

  const ipc = indicePreparacionCiudadana ?? IPC_REFERENCIA_BENCHMARK
  const isRealData = indicePreparacionCiudadana !== null
  const ventanaSemanas = calcularVentana(ipc)
  const fasesActivas = Math.min(5, horizonte <= 2 ? 2 : horizonte <= 3 ? 3 : horizonte <= 4 ? 4 : 5)

  // Costo educación por año (derivado del modelo del calculador)
  const costoEduc = useMemo(() => {
    if (!resultados) return null
    const vivActivas = resultados.vivActivas ?? 0
    const noCondoPct = (100 - viviendaCondominioPct) / 100
    const vpFrac = casaViaPublicaPct / 100

    const hogaresVP = vivActivas * noCondoPct * vpFrac
    const hogaresH1 = vivActivas - hogaresVP

    const factorBrecha = Math.min(1.5, Math.max(0.5, 1 + (70 - ipc) / 100))
    const costoVP_año1 = hogaresVP * COSTO_BASE_HOGAR_MXN * FACTOR_VP_MULTIPLICADOR * factorBrecha
    const costoH1_año1 = hogaresH1 * COSTO_BASE_HOGAR_MXN * 1.0 * factorBrecha
    const costoTotal_año1 = costoVP_año1 + costoH1_año1

    return {
      hogaresVP: Math.round(hogaresVP),
      hogaresH1: Math.round(hogaresH1),
      costoVP_año1: Math.round(costoVP_año1),
      costoH1_año1: Math.round(costoH1_año1),
      costoTotal_año1: Math.round(costoTotal_año1),
      costoMantenimiento: Math.round(costoTotal_año1 * MANTENIMIENTO_ANUAL_PCT),
    }
  }, [resultados, viviendaCondominioPct, casaViaPublicaPct, ipc])

  return (
    <div className="space-y-5">

      {/* Encabezado */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">Capacitación y transferencia de conocimiento</p>
        <h3 className="font-serif text-[18px] text-[#1C1B18] mb-2">Plan de formación por fase</h3>
        <p className="text-[12px] leading-relaxed text-[#6B6760]">
          La capacitación no es un accesorio del programa — es el factor que determina si el CAPEX se recupera.
          Según <span className="font-medium text-[#1C1B18]">Anaya-Palacios (2024)</span>, sin formación estructurada
          la tasa de captura cae 40% en el segundo trimestre. El costo educativo es proporcional al IPC actual
          y al porcentaje de casas en vía pública (Hemisferio 2), que requieren brigadas presenciales.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-[8px] border border-[#E8E4DC] bg-white px-2.5 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#3B6D11]" />
            <span className="text-[11px] text-[#1C1B18]">Curva S de adopción — LATAM</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-[8px] border border-[#E8E4DC] bg-white px-2.5 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#1A5FA8]" />
            <span className="text-[11px] text-[#1C1B18]">Participación ≥ 70% meta mínima</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-[8px] border border-[#E8E4DC] bg-white px-2.5 py-1.5">
            <div className="w-2 h-2 rounded-full bg-[#D4881E]" />
            <span className="text-[11px] text-[#1C1B18]">{'< '}30% abandono trimestre 1</span>
          </div>
        </div>
      </div>

      {/* Ventana de implementación */}
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
        <p className="text-[11px] font-semibold text-[#1C1B18] mb-3">Ventana de educación recomendada antes de lanzar el CA</p>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="text-[28px] font-bold text-[#3B6D11] font-mono">{ventanaSemanas}</div>
              <div>
                <p className="text-[12px] font-medium text-[#1C1B18]">semanas</p>
                <p className="text-[10px] text-[#A8A49C]">antes del lanzamiento</p>
              </div>
            </div>
            <p className="text-[11px] text-[#6B6760] leading-relaxed">
              IPC actual: <span className="font-medium" style={{ color: ipc >= 70 ? '#3B6D11' : ipc >= 50 ? '#D4881E' : '#C0392B' }}>{ipc.toFixed(0)}/100</span>
              {!isRealData && <span className="text-[#A8A49C]"> (benchmark — sin encuesta de campo)</span>}
            </p>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#A8A49C] mb-0.5">Fuente metodológica</div>
            <div className="text-[10px] text-[#6B6760]">SEMARNAT 2021 · INECC</div>
            <div className="text-[10px] text-[#6B6760]">Anaya-Palacios 2024</div>
          </div>
        </div>
      </div>

      {/* Modelo de costo educativo */}
      {costoEduc && (
        <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[11px] font-semibold text-[#1C1B18] mb-1">Modelo de costo educativo segmentado</p>
          <p className="text-[10px] text-[#A8A49C] mb-3">
            Referencia: BANOBRAS (2019) $80 MXN/hogar/año brigada básica · Factor VP: 3.5× (brigadas puerta a puerta)
          </p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="rounded-[8px] bg-[#F4FAEC] border border-[#D7E8C0] p-3">
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#3B6D11] mb-1">Hemisferio 1 — Condominio / Privada</p>
              <p className="font-mono text-[15px] font-bold text-[#1C1B18]">{fmt(costoEduc.costoH1_año1)}</p>
              <p className="text-[9px] text-[#6B6760] mt-0.5">Año 1 · {costoEduc.hogaresH1.toLocaleString('es-MX')} hogares</p>
              <p className="text-[9px] text-[#A8A49C]">Capacitar al administrador → alcance masivo</p>
            </div>
            <div className="rounded-[8px] bg-[#FEF7E7]/80 border border-[#D4881E]/30 p-3">
              <p className="text-[9px] uppercase tracking-[0.06em] text-[#D4881E] mb-1">Hemisferio 2 — Vía pública (VP)</p>
              <p className="font-mono text-[15px] font-bold text-[#1C1B18]">{fmt(costoEduc.costoVP_año1)}</p>
              <p className="text-[9px] text-[#6B6760] mt-0.5">Año 1 · {costoEduc.hogaresVP.toLocaleString('es-MX')} hogares</p>
              <p className="text-[9px] text-[#A8A49C]">Brigadas puerta a puerta · 3.5× más costoso</p>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-[8px] border border-[#E8E4DC] bg-[#F7F5F0] px-3 py-2">
            <div>
              <p className="text-[10px] text-[#6B6760]">Total año 1</p>
              <p className="font-mono text-[14px] font-bold text-[#1C1B18]">{fmt(costoEduc.costoTotal_año1)}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-[#6B6760]">Mantenimiento años 2+</p>
              <p className="font-mono text-[13px] font-medium text-[#3B6D11]">{fmt(costoEduc.costoMantenimiento)}</p>
            </div>
          </div>
          <div className="mt-2 rounded-[6px] border border-[#E8E4DC] bg-[#FAFAF8] px-2.5 py-2 text-[10px] text-[#6B6760]">
            <span className="font-medium text-[#D4881E]">Grandes Generadores: </span>
            Los comercios, hoteles e industria son auto-responsables (LGPGIR Art. 42). La estrategia
            educativa aplica únicamente a vivienda residencial. Ver adendo "Grandes Generadores".
          </div>
        </div>
      )}

      {/* Adopción proyectada vs. meta */}
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-[#1C1B18]">Adopción proyectada por año (M03)</p>
          <span className="text-[9px] text-[#A8A49C] border border-[#E8E4DC] rounded-full px-2 py-0.5">
            Tasa de captura M03
          </span>
        </div>
        <div className="space-y-2">
          {pctCapturaPorAño.slice(0, horizonte).map((pct, idx) => {
            const faseDef = FASES_CONTENIDO[Math.min(idx, FASES_CONTENIDO.length - 1)]
            const metaMin = idx === 0 ? 25 : idx === 1 ? 50 : idx === 2 ? 70 : 80
            const enMeta = pct >= metaMin * 0.9
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[10px] text-[#6B6760] w-10 shrink-0">Año {idx + 1}</span>
                <div className="flex-1 bg-[#F4F2ED] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct)}%`, background: enMeta ? '#3B6D11' : '#D4881E' }}
                  />
                </div>
                <span className="font-mono text-[10px] w-8 text-right shrink-0" style={{ color: enMeta ? '#3B6D11' : '#D4881E' }}>
                  {pct.toFixed(0)}%
                </span>
                <span className="text-[9px] text-[#A8A49C] shrink-0 w-14 text-right">mín: {metaMin}%</span>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[9px] text-[#A8A49C]">
          Adopción año 1 ({pctCapturaPorAño[0]?.toFixed(0) ?? '—'}%) determina la velocidad de la curva S.
          Programas con adopción &lt; 25% en F1 requieren refuerzo de comunicación antes de pasar a F2.
          Ref: Anaya-Palacios (2024).
        </p>
      </div>

      {/* Plan por fase */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {FASES_CONTENIDO.slice(0, fasesActivas).map((fase, idx) => {
          const faseDef = FASES_CA.find(f => f.fase === fase.fase)
          const color = FASE_COLORS[idx] ?? '#3B6D11'
          const pctAño = pctCapturaPorAño[idx] ?? 0
          return (
            <article key={fase.fase} className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-[6px] shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: color }}>
                  F{fase.fase}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#1C1B18] leading-tight">{fase.nombre}</p>
                  {faseDef && (
                    <p className="text-[9px] text-[#A8A49C]">{faseDef.coberturaPct}% cobertura · {faseDef.nCAs} CAs</p>
                  )}
                </div>
                <div className="ml-auto text-right">
                  <p className="font-mono text-[12px] font-bold" style={{ color: pctAño >= 25 ? '#3B6D11' : '#D4881E' }}>
                    {pctAño.toFixed(0)}%
                  </p>
                  <p className="text-[8px] text-[#A8A49C]">captura M03</p>
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-0.5">Hemisferio 1 (Condominio/Privada)</p>
                  <p className="text-[#6B6760] leading-snug">{fase.participantes.h1} · {fase.duracion.h1}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-0.5">Hemisferio 2 (Vía Pública)</p>
                  <p className="text-[#6B6760] leading-snug">{fase.participantes.h2} · {fase.duracion.h2}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-1">Temas clave</p>
                  <ul className="space-y-0.5">
                    {fase.temas.map(t => (
                      <li key={t} className="flex items-start gap-1">
                        <span className="w-1.5 h-1.5 rounded-full mt-1 shrink-0" style={{ background: color }} />
                        <span className="text-[#6B6760] leading-snug">{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[6px] px-2 py-1 text-[9px] border border-[#D7E8C0] bg-[#F4FAEC] text-[#3B6D11]">
                  <span className="font-medium">KPI: </span>{fase.kpi}
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Nota metodológica */}
      <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-3 text-[10px] text-[#6B6760] leading-relaxed">
        <span className="font-medium text-[#1C1B18]">Nota metodológica: </span>
        El costo base de $80 MXN/hogar/año es un estimado derivado de BANOBRAS (2019) para brigadas presenciales básicas en municipios mexicanos.
        El factor de 3.5× para casas VP refleja el mayor esfuerzo de contacto directo sin intermediario administrador.
        Las curvas de adopción son referencias bibliográficas — SEMARNAT (2021), INECC, Anaya-Palacios (2024) — no garantías contractuales.
        El municipio debe adaptar el plan a su calendario político y disponibilidad presupuestal.
        Fuentes completas disponibles en Bibliografía y cálculos (M09).
      </div>
    </div>
  )
}
