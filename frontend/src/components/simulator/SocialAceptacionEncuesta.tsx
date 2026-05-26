'use client'

/**
 * Encuesta de Aceptación Ciudadana — vista del CONSULTOR.
 *
 * Muestra:
 * 1. QR code para distribuir la encuesta en campo (brigadas)
 * 2. Resultados en tiempo real: IPC global + segmentado por tipo de vivienda
 * 3. Interpretación: qué significa el IPC para el programa
 * 4. Conexión con módulo de riesgos: badge de fuente (real vs. benchmark)
 *
 * La encuesta pública ciudadana vive en /encuesta/[municipio_id].
 * Las respuestas van a POST /api/v1/survey/respuesta → PostgreSQL.
 * Los resultados se leen desde GET /api/v1/survey/{municipio_id}/resultados.
 */

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { RefreshCw, Users, Home, Building2, Info } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { getApiUrl } from '@/lib/api'
import type { EncuestaResultados } from '@/types'
import {
  Conclusion,
  EditorialCallout,
  MarginalNote,
  SectionLabel,
} from '@/components/editorial'

// IPC benchmark de referencia (sin datos de campo)
// Fuente: SEMARNAT (2022) «Evaluación de Programas RSU», 24 municipios mexicanos
const IPC_BENCHMARK_SEMARNAT = 70

function IpcGauge({ valor, label, n }: { valor: number; label: string; n?: number }) {
  const color = valor >= 70 ? '#3B6D11' : valor >= 50 ? '#D4881E' : '#C0392B'
  const pct = Math.min(100, Math.max(0, valor))
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F0EDE5" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${pct} 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[16px] font-bold" style={{ color }}>{valor.toFixed(0)}</span>
          <span className="text-[8px] text-[#A8A49C]">IPC</span>
        </div>
      </div>
      <p className="text-[10px] font-medium text-[#1C1B18] text-center leading-tight">{label}</p>
      {n !== undefined && (
        <p className="text-[9px] text-[#A8A49C]">n={n}</p>
      )}
    </div>
  )
}

function InterpretacionIpc({ ipc, nTotal, isReal }: { ipc: number; nTotal: number; isReal: boolean }) {
  let nivel: string; let mensaje: string

  if (ipc >= 75) {
    nivel = 'Alto'
    mensaje = 'La ciudadanía tiene alta preparación y voluntad de separar. El programa puede arrancar con riesgo de adopción bajo. Prioriza el diseño operativo sobre la comunicación.'
  } else if (ipc >= 55) {
    nivel = 'Medio'
    mensaje = 'Nivel de preparación moderado. Se requiere un plan de educación ciudadana de 4-8 semanas antes del lanzamiento del CA para reducir el riesgo de abandono en el trimestre 1.'
  } else {
    nivel = 'Bajo'
    mensaje = 'Nivel crítico. Sin un programa educativo previo, la tasa de captura no llegará a la masa crítica del 30% necesaria para la viabilidad financiera del CA. Invierte primero en educación.'
  }

  return (
    <EditorialCallout label={`Nivel de preparación ciudadana: ${nivel}`}>
      {!isReal && (
        <span className="text-[9px] text-[#A8A49C]">Benchmark SEMARNAT 2022</span>
      )}
      {isReal && nTotal > 0 && (
        <span className="text-[9px] text-[#3B6D11]">Dato real · {nTotal} encuestas</span>
      )}
      <p className="mt-2">{mensaje}</p>
    </EditorialCallout>
  )
}

export function SocialAceptacionEncuesta() {
  const municipio = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const encuestaResultados = useSimulatorStore(s => s.encuestaResultados as EncuestaResultados | null)
  const indicePreparacionCiudadana = useSimulatorStore(s => s.indicePreparacionCiudadana)
  const indexAceptacionVP = useSimulatorStore(s => s.indexAceptacionVP)
  const fetchEncuestaResultados = useSimulatorStore(s => s.fetchEncuestaResultados)

  const [cargando, setCargando] = useState(false)

  const municipioId = municipio?.claveInegi ?? municipio?.municipioSimulatorId ?? 'municipio'
  const municipioNombre = municipio?.nombre ?? 'Municipio'

  const apiUrl = getApiUrl()
  const encuestaUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/encuesta/${municipioId}`

  const ipcGlobal = indicePreparacionCiudadana ?? IPC_BENCHMARK_SEMARNAT
  const ipcVP = indexAceptacionVP ?? IPC_BENCHMARK_SEMARNAT
  const isReal = indicePreparacionCiudadana !== null
  const nTotal = encuestaResultados?.n_total ?? 0

  async function actualizar() {
    setCargando(true)
    await fetchEncuestaResultados(municipioId)
    setCargando(false)
  }

  const segmentos = encuestaResultados ? [
    { label: 'Condominio', icon: Building2, valor: encuestaResultados.ipc_por_segmento['condominio'] ?? 0, n: encuestaResultados.n_condominio, hemisferio: '1' },
    { label: 'Privada / coto', icon: Home, valor: encuestaResultados.ipc_por_segmento['privada'] ?? 0, n: encuestaResultados.n_privada, hemisferio: '1' },
    { label: 'Calle pública (VP)', icon: Users, valor: encuestaResultados.ipc_por_segmento['vp'] ?? 0, n: encuestaResultados.n_vp, hemisferio: '2' },
  ] : []

  return (
    <div className="space-y-4">
      {/* Header */}
      <header>
        <SectionLabel>Encuesta de aceptación ciudadana</SectionLabel>
        <h3 className="font-serif text-[18px] text-[#1C1B18] mb-2">
          Índice de Preparación Ciudadana (IPC) — {municipioNombre}
        </h3>
        <Conclusion className="text-[16px] md:text-[17px] mb-0">
          El IPC mide en escala 0-100 la disposición real de la ciudadanía a separar residuos.
          Con datos de campo, reemplaza el benchmark de referencia de SEMARNAT (2022) y modula
          la ramp-up de captura en M03 y el score del actor &quot;Ciudadanos&quot; en el módulo de riesgos.
        </Conclusion>
      </header>

      {/* QR + Resultados en paralelo */}
      <div className="grid md:grid-cols-2 gap-4">

        {/* QR code */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5 flex flex-col items-center gap-3">
          <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C] self-start">Distribuir encuesta</p>
          <div className="p-3 border border-[#E8E4DC] rounded-[10px] bg-white">
            <QRCodeSVG
              value={encuestaUrl}
              size={140}
              level="M"
              includeMargin={false}
              fgColor="#1C1B18"
            />
          </div>
          <div className="w-full">
            <p className="text-[11px] font-medium text-[#1C1B18] text-center mb-1">Escanear con móvil</p>
            <p className="text-[10px] text-[#A8A49C] text-center break-all">{encuestaUrl}</p>
          </div>
          <div className="w-full rounded-[8px] border border-[#D7E8C0] bg-[#F4FAEC] px-3 py-2">
            <p className="text-[10px] text-[#3B6D11] leading-relaxed">
              <span className="font-medium">Para brigadistas:</span> muestra este QR en tablet al ciudadano.
              Las respuestas se guardan automáticamente. Presiona "Actualizar" para ver los nuevos datos.
            </p>
          </div>
        </div>

        {/* Resultados IPC */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C]">Resultados</p>
            <button
              type="button"
              onClick={actualizar}
              disabled={cargando}
              className="flex items-center gap-1.5 text-[10px] font-medium text-[#3B6D11] border border-[#D7E8C0] rounded-full px-3 py-1 hover:bg-[#F4FAEC] transition-colors disabled:opacity-50"
            >
              <RefreshCw size={11} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {!isReal ? (
            <div className="mb-4 rounded-[8px] bg-[#FEF7E7]/80 border border-[#D4881E]/25 px-3 py-2">
              <p className="text-[10px] text-[#5C5740] leading-relaxed">
                <Info size={10} className="inline mr-1 text-[#D4881E]" />
                Sin datos de campo — mostrando benchmark SEMARNAT 2022 (24 municipios).
                Distribuye el QR para obtener datos reales.
              </p>
            </div>
          ) : (
            <div className="mb-4 rounded-[8px] bg-[#F4FAEC] border border-[#D7E8C0] px-3 py-2">
              <p className="text-[10px] text-[#3B6D11] leading-relaxed">
                Datos reales de campo · <span className="font-medium">{nTotal} respuestas registradas</span>
                {encuestaResultados?.ultima_respuesta && (
                  <span className="text-[#6B6760]">
                    {' '}· Última: {new Date(encuestaResultados.ultima_respuesta).toLocaleDateString('es-MX')}
                  </span>
                )}
              </p>
            </div>
          )}

          <div className="flex gap-4 justify-around mb-4">
            <IpcGauge
              valor={ipcGlobal}
              label="Global"
              n={isReal ? nTotal : undefined}
            />
            <IpcGauge
              valor={isReal ? (encuestaResultados?.ipc_hemisferio1 ?? IPC_BENCHMARK_SEMARNAT) : IPC_BENCHMARK_SEMARNAT}
              label="Hemisferio 1"
              n={isReal ? (encuestaResultados?.n_condominio ?? 0) + (encuestaResultados?.n_privada ?? 0) : undefined}
            />
            <IpcGauge
              valor={ipcVP}
              label="VP (Hemis. 2)"
              n={isReal ? (encuestaResultados?.n_vp ?? 0) : undefined}
            />
          </div>

          {isReal && segmentos.length > 0 && (
            <div className="space-y-2">
              {segmentos.map(seg => {
                const pct = Math.min(100, Math.max(0, seg.valor))
                const color = pct >= 70 ? '#3B6D11' : pct >= 50 ? '#D4881E' : '#C0392B'
                const Icon = seg.icon
                return (
                  <div key={seg.label} className="flex items-center gap-2">
                    <Icon size={12} className="text-[#A8A49C] shrink-0" />
                    <span className="text-[10px] text-[#6B6760] w-28 shrink-0">{seg.label}</span>
                    <div className="flex-1 bg-[#F4F2ED] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="font-mono text-[10px] w-7 text-right shrink-0" style={{ color }}>
                      {seg.valor.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-[#A8A49C] shrink-0">n={seg.n}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Interpretación */}
      <InterpretacionIpc ipc={ipcGlobal} nTotal={nTotal} isReal={isReal} />

      {/* Implicaciones VP */}
      {ipcVP < 60 && (
        <EditorialCallout tone="caution" label="Atención: IPC bajo en casas en vía pública (Hemisferio 2)">
          El IPC del segmento VP ({ipcVP.toFixed(0)}/100) indica que la adopción en casas de calle pública
          requerirá brigadas presenciales puerta a puerta. Este segmento requiere 3-5× más inversión
          educativa por hogar que condominios. Ver Plan Educativo para el desglose de costos.
          Este dato refuerza la necesidad del Adendo 12 — la regulación sin educación previa
          no logra cambio de comportamiento sostenido.
        </EditorialCallout>
      )}

      <MarginalNote prefix="Metodología IPC">
        Escala Likert 1-5 en tres secciones (A: valores, B: comportamiento, C: compromiso).
        Ponderación: 30% / 40% / 30%. Fórmula: IPC = (promA×0.30 + promB×0.40 + promC×0.30) × 20.
        Benchmark de referencia: SEMARNAT (2022) «Evaluación de Programas RSU en 24 Municipios Mexicanos» —
        media 70/100. Las respuestas se almacenan anonimizadas en la base de datos del proyecto.
      </MarginalNote>
    </div>
  )
}
