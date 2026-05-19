'use client'

/**
 * Pestaña de Capacitación — M04 InfrastructureOperationsStack.
 *
 * Plan de formación por fase, materiales y métricas de adopción.
 * Los indicadores de adopción están conectados a `pctCapturaPorAño` del store.
 *
 * Fuentes metodológicas:
 * - SEMARNAT / INECC: "Guía de capacitación municipal para separación en origen" (2021).
 * - BANOBRAS: "Manuales de transferencia de conocimiento para programas de limpia" (2019).
 * - Anaya-Palacios (2024): "Curvas de adopción en programas de reciclaje urbano LATAM".
 */

import { useSimulatorStore } from '@/store/simulatorStore'
import { FASES_CA } from '@/lib/constants'
import { cn } from '@/lib/utils'

// ── Datos estáticos de capacitación por fase ──────────────────────────────────
// Conectados a FASES_CA; la cobertura y empleo base vienen del store.

const FASES_CAPACITACION = [
  {
    fase: 1,
    nombre: 'Piloto inicial',
    participantes: 'Operadores de CA, recolectores de ruta, supervisores de zona',
    duracion: '8 horas presenciales + 4 e-learning',
    temas: ['Clasificación de RSU (7 categorías)', 'Manejo seguro de materiales', 'Registro PER bitácora', 'Comunicación vecinal básica'],
    materiales: ['Guía de campo plastificada (INECC 2021)', 'Presentación institucional (editable)', 'Video 3 min: separación correcta'],
    metaAdopcion: 35,
    indicador: 'Tasa de captura ≥ 35% al cierre del trimestre 2',
  },
  {
    fase: 2,
    nombre: 'Expansión territorial',
    participantes: 'Promotores ciudadanos, líderes de colonia, personal administrativo',
    duracion: '6 horas taller + módulo digital auto-dirigido',
    temas: ['Comunicación comunitaria efectiva', 'Técnicas de separación para hogares', 'Manejo de quejas y retroalimentación', 'KPIs de zona'],
    materiales: ['Folleto "Mi colonia separa" (versión imprimible)', 'Cuestionario diagnóstico de adopción (CAPI)', 'Kit de carteles para punto limpio'],
    metaAdopcion: 60,
    indicador: 'Hogares participantes ≥ 60% en Zona 1–2',
  },
  {
    fase: 3,
    nombre: 'Consolidación y mejora',
    participantes: 'Inspectores, comercios registrados, grandes generadores',
    duracion: '4 horas presencial + protocolo de acreditación',
    temas: ['Reglamento municipal aplicado (por artículo)', 'Inspección documentada vs. educativa', 'Diferenciación residuos especiales / peligrosos', 'Reporte de no conformidades'],
    materiales: ['Manual de inspección ALQUIMIA (con base jurídica)', 'Protocolo de no conformidad', 'Tablero de indicadores por zona'],
    metaAdopcion: 75,
    indicador: 'Cobertura ≥ 75% en zonas activas',
  },
  {
    fase: 4,
    nombre: 'Profesionalización',
    participantes: 'Técnicos de laboratorio, operadores de biodigestor / composta, jefes de CA',
    duracion: '16 horas prácticas + evaluación técnica',
    temas: ['Caracterización y calidad de material', 'Operación de biodigestor / composta', 'Mantenimiento preventivo de equipos', 'Estándares de calidad para venta'],
    materiales: ['Manual técnico de operación (SEMARNAT 2022)', 'Hoja de control de calidad por lote', 'Registro de mantenimiento preventivo'],
    metaAdopcion: 85,
    indicador: 'Calidad de material aceptada por comprador ≥ 95% lotes',
  },
  {
    fase: 5,
    nombre: 'Escala ZM',
    participantes: 'Gestores inter-municipales, compradores industriales, representantes sindicales',
    duracion: 'Diplomado 40 horas + mentoría mensual',
    temas: ['Gestión metropolitana de residuos', 'Negociación con compradores', 'Marco legal inter-municipal', 'Transferencia de conocimiento'],
    materiales: ['Diplomado ALQUIMIA (módulos 1–8)', 'Contrato tipo para compradores', 'Agenda de transferencia ZM'],
    metaAdopcion: 90,
    indicador: 'Cobertura ≥ 90% en ZM al año 5',
  },
]

const INDICADORES_ADOPCION = [
  { label: 'Curva S de adopción', sub: 'Anaya-Palacios 2024 — LATAM urbano', color: '#3B6D11' },
  { label: 'Participación ≥ 70%', sub: 'Meta mínima para viabilidad financiera', color: '#1A5FA8' },
  { label: '< 30% abandono primer trimestre', sub: 'Benchmark Bogotá 2012', color: '#D4881E' },
]

// ── Colores por fase ──────────────────────────────────────────────────────────
const FASE_COLORS = ['#C8E6A4', '#A5C97A', '#7DA84A', '#5A8C2C', '#3B6D11']

export function CapacitacionTab() {
  const { pctCapturaPorAño, horizonte } = useSimulatorStore()

  // Adopción proyectada: tasa de captura del primer año como proxy de adopción inicial
  const adoptionPct = pctCapturaPorAño[0] ?? 20
  const fasesActivas = Math.min(5, horizonte <= 2 ? 2 : horizonte <= 3 ? 3 : horizonte <= 4 ? 4 : 5)

  return (
    <div className="space-y-5">

      {/* Encabezado metodológico */}
      <div className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-5">
        <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">Capacitación y transferencia de conocimiento</p>
        <h3 className="font-serif text-[18px] text-[#1C1B18] mb-2">Plan de formación por fase</h3>
        <p className="text-[12px] leading-relaxed text-[#6B6760]">
          Cada fase requiere formación específica para que la tasa de captura suba de forma sostenida.
          Ref: <span className="font-medium text-[#1C1B18]">Anaya-Palacios (2024)</span> — curvas de adopción
          en programas RSU LATAM muestran que sin formación estructurada, la tasa de captura cae un 40%
          en el segundo trimestre. <span className="font-medium text-[#D4881E]">Fuente: SEMARNAT / INECC
          Guía de capacitación municipal 2021.</span>
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {INDICADORES_ADOPCION.map(ind => (
            <div key={ind.label} className="flex items-start gap-1.5 rounded-[8px] border border-[#E8E4DC] bg-white px-2.5 py-1.5">
              <div className="w-2 h-2 rounded-full mt-0.5 shrink-0" style={{ background: ind.color }} />
              <div>
                <p className="text-[11px] font-medium text-[#1C1B18]">{ind.label}</p>
                <p className="text-[9px] text-[#A8A49C]">{ind.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adopción proyectada */}
      <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold text-[#1C1B18]">Adopción proyectada vs. meta por año</p>
          <span className="text-[9px] text-[#A8A49C] border border-[#E8E4DC] rounded-full px-2 py-0.5">Fn. tasa captura año 1</span>
        </div>
        <div className="space-y-2">
          {pctCapturaPorAño.slice(0, horizonte).map((pct, idx) => {
            const fase = FASES_CAPACITACION[Math.min(idx, FASES_CAPACITACION.length - 1)]
            const meta = fase?.metaAdopcion ?? 90
            const enMeta = pct >= meta * 0.9
            return (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-[10px] text-[#6B6760] w-10 shrink-0">Año {idx + 1}</span>
                <div className="flex-1 bg-[#F4F2ED] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, pct)}%`,
                      background: enMeta ? '#3B6D11' : '#D4881E',
                    }}
                  />
                </div>
                <span className="font-mono text-[10px] w-8 text-right shrink-0" style={{ color: enMeta ? '#3B6D11' : '#D4881E' }}>
                  {pct.toFixed(0)}%
                </span>
                <span className="text-[9px] text-[#A8A49C] shrink-0">meta: {meta}%</span>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[9px] text-[#A8A49C]">
          Adopción inicial ({adoptionPct.toFixed(0)}%) determina la velocidad de subida de la curva S.
          Programas con adopción &lt; 25% en F1 requieren refuerzo de comunicación antes de pasar a F2.
        </p>
      </div>

      {/* Plan por fase */}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {FASES_CAPACITACION.slice(0, fasesActivas).map((fase, idx) => {
          const faseDef = FASES_CA.find(f => f.fase === fase.fase)
          const color = FASE_COLORS[idx] ?? '#3B6D11'
          return (
            <article
              key={fase.fase}
              className="rounded-[10px] border border-[#E8E4DC] bg-white p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-[5px] shrink-0 flex items-center justify-center text-white text-[10px] font-bold" style={{ background: color }}>
                  F{fase.fase}
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-[#1C1B18] leading-tight">{fase.nombre}</p>
                  {faseDef && (
                    <p className="text-[9px] text-[#A8A49C]">{faseDef.coberturaPct}% cobertura · {faseDef.nCAs} CAs</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-[11px]">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-0.5">Participantes</p>
                  <p className="text-[#6B6760] leading-snug">{fase.participantes}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-0.5">Duración</p>
                  <p className="font-medium text-[#1C1B18]">{fase.duracion}</p>
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
                <div>
                  <p className="text-[9px] uppercase tracking-[0.06em] text-[#A8A49C] mb-1">Materiales</p>
                  <ul className="space-y-0.5">
                    {fase.materiales.map(m => (
                      <li key={m} className="flex items-start gap-1">
                        <span className="text-[#3B6D11] shrink-0 text-[9px]">·</span>
                        <span className="text-[#6B6760] leading-snug text-[10px]">{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={cn(
                  'rounded-[6px] px-2 py-1 text-[9px] flex items-center gap-1',
                  'border border-[#D7E8C0] bg-[#F4FAEC] text-[#3B6D11]',
                )}>
                  <span className="font-medium">KPI:</span>
                  <span>{fase.indicador}</span>
                </div>
              </div>
            </article>
          )
        })}
      </div>

      {/* Nota metodológica */}
      <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FAFAF8] p-3 text-[10px] text-[#6B6760] leading-relaxed">
        <span className="font-medium text-[#1C1B18]">Nota metodológica: </span>
        Las curvas de adopción y la duración de cada módulo son referencias bibliográficas —
        SEMARNAT (2021), INECC, Anaya-Palacios (2024) — no garantías contractuales.
        El municipio debe adaptar el plan a su contexto, disponibilidad presupuestal y calendario político.
        Fuentes completas disponibles en el módulo Bibliografía y cálculos (M09).
      </div>

    </div>
  )
}
