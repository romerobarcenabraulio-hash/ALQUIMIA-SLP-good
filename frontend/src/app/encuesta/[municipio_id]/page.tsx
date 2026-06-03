'use client'

/**
 * Encuesta de Aceptación Ciudadana — ruta pública, sin autenticación.
 *
 * URL: /encuesta/{municipio_id}
 *
 * Diseñada para ser distribuida como QR code en campo por brigadistas.
 * Principios de economía conductual aplicados:
 *   A. Priming de valores — preguntas sobre calidad de vida antes de separación
 *   B. Comportamiento sin hipocresía — "¿qué haces hoy?" no "¿qué harías?"
 *   C. Compromiso público — el ciudadano elige su nivel, no se le impone
 *
 * Fuente metodológica: Thaler & Sunstein (2008) "Nudge"; SEMARNAT (2021)
 * "Guía de comunicación para programas de separación municipal".
 */

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api'

type TipoVivienda = 'condominio' | 'privada' | 'vp'

interface Respuestas {
  tipo_vivienda: TipoVivienda | ''
  sec_a_q1: number; sec_a_q2: number; sec_a_q3: number
  sec_b_q1: number; sec_b_q2: number; sec_b_q3: number
  sec_c_q1: number; sec_c_q2: number; sec_c_q3: number
}

const TIPO_LABELS: Record<TipoVivienda, string> = {
  condominio: 'Departamento / Condominio',
  privada:    'Casa en privada o coto',
  vp:         'Casa en calle pública',
}

function LikertScale({
  pregunta,
  valor,
  onChange,
}: {
  pregunta: string
  valor: number
  onChange: (v: number) => void
}) {
  return (
    <div className="mb-5">
      <p className="text-[14px] text-[#1C1B18] leading-snug mb-3">{pregunta}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            aria-label={`Opción ${n} de 5`}
            onClick={() => onChange(n)}
            className={[
              'flex-1 h-10 rounded-[8px] border text-[13px] font-semibold transition-all',
              valor === n
                ? 'bg-[#3B6D11] border-[#3B6D11] text-white'
                : 'border-[#D4D0C8] bg-white text-[#6B6760] hover:border-[#3B6D11] hover:text-[#3B6D11]',
            ].join(' ')}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between mt-1 px-0.5">
        <span className="text-[10px] text-[#A8A49C]">Nada</span>
        <span className="text-[10px] text-[#A8A49C]">Totalmente</span>
      </div>
    </div>
  )
}

export default function EncuestaPage() {
  const params = useParams()
  const municipioId = typeof params.municipio_id === 'string' ? params.municipio_id : ''

  const [paso, setPaso] = useState<'tipo' | 'a' | 'b' | 'c' | 'enviando' | 'gracias'>('tipo')
  const [respuestas, setRespuestas] = useState<Respuestas>({
    tipo_vivienda: '',
    sec_a_q1: 0, sec_a_q2: 0, sec_a_q3: 0,
    sec_b_q1: 0, sec_b_q2: 0, sec_b_q3: 0,
    sec_c_q1: 0, sec_c_q2: 0, sec_c_q3: 0,
  })
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof Respuestas>(k: K, v: Respuestas[K]) {
    setRespuestas(prev => ({ ...prev, [k]: v }))
  }

  function seccionCompleta(sec: 'a' | 'b' | 'c') {
    const keys = {
      a: ['sec_a_q1', 'sec_a_q2', 'sec_a_q3'],
      b: ['sec_b_q1', 'sec_b_q2', 'sec_b_q3'],
      c: ['sec_c_q1', 'sec_c_q2', 'sec_c_q3'],
    }[sec] as (keyof Respuestas)[]
    return keys.every(k => (respuestas[k] as number) > 0)
  }

  async function enviar() {
    setPaso('enviando')
    setError(null)
    try {
      const apiUrl = getApiUrl()
      const res = await fetch(`${apiUrl}/api/v1/survey/respuesta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipio_id:  municipioId,
          tipo_vivienda: respuestas.tipo_vivienda,
          sec_a_q1: respuestas.sec_a_q1, sec_a_q2: respuestas.sec_a_q2, sec_a_q3: respuestas.sec_a_q3,
          sec_b_q1: respuestas.sec_b_q1, sec_b_q2: respuestas.sec_b_q2, sec_b_q3: respuestas.sec_b_q3,
          sec_c_q1: respuestas.sec_c_q1, sec_c_q2: respuestas.sec_c_q2, sec_c_q3: respuestas.sec_c_q3,
          canal: 'qr',
        }),
      })
      if (!res.ok) throw new Error('Error al enviar')
      setPaso('gracias')
    } catch {
      setError('No pudimos registrar tu respuesta. Por favor intenta de nuevo.')
      setPaso('c')
    }
  }

  const progreso = paso === 'tipo' ? 10 : paso === 'a' ? 30 : paso === 'b' ? 55 : paso === 'c' ? 80 : 100

  if (paso === 'gracias') {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-[20px] shadow-sm p-8 text-center">
          <CheckCircle2 className="mx-auto mb-4 text-[#3B6D11]" size={48} />
          <h1 className="font-serif text-[24px] text-[#1C1B18] mb-2">¡Gracias!</h1>
          <p className="text-[14px] text-[#6B6760] leading-relaxed">
            Tu opinión cuenta. Con ella el municipio puede diseñar un programa de
            separación que funcione de verdad en tu colonia.
          </p>
          <p className="mt-4 text-[11px] text-[#A8A49C]">
            Puedes cerrar esta ventana.
          </p>
        </div>
      </main>
    )
  }

  if (paso === 'enviando') {
    return (
      <main className="min-h-screen bg-[#F7F5F0] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#3B6D11]" size={40} />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F5F0] flex flex-col">
      {/* Header */}
      <div className="bg-[#3B6D11] px-4 pt-8 pb-6">
        <p className="text-[10px] uppercase tracking-[0.1em] text-[#B5D98F] mb-1">ALQUIMIA · Consulta ciudadana</p>
        <h1 className="font-serif text-[22px] text-white leading-tight">
          ¿Quieres una ciudad más limpia?
        </h1>
        <p className="mt-1 text-[12px] text-[#B5D98F]">2 minutos · 9 preguntas · anónimo</p>

        {/* Barra de progreso */}
        <div className="mt-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${progreso}%` }}
          />
        </div>
      </div>

      {/* Contenido */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">

        {/* PASO 0: Tipo de vivienda */}
        {paso === 'tipo' && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#A8A49C] mb-3">Antes de empezar</p>
            <h2 className="font-serif text-[18px] text-[#1C1B18] mb-4">¿Dónde vives?</h2>
            <div className="space-y-3">
              {(Object.entries(TIPO_LABELS) as [TipoVivienda, string][]).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { set('tipo_vivienda', key); setPaso('a') }}
                  className={[
                    'w-full text-left rounded-[12px] border p-4 transition-all',
                    respuestas.tipo_vivienda === key
                      ? 'border-[#3B6D11] bg-[#F4FAEC]'
                      : 'border-[#E8E4DC] bg-white hover:border-[#3B6D11]',
                  ].join(' ')}
                >
                  <p className="text-[14px] font-medium text-[#1C1B18]">{label}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN A: Priming de valores */}
        {paso === 'a' && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#3B6D11] mb-1">Sección 1 de 3</p>
            <h2 className="font-serif text-[18px] text-[#1C1B18] mb-1">Lo que nos importa</h2>
            <p className="text-[12px] text-[#6B6760] mb-5">
              Del 1 (nada) al 5 (totalmente de acuerdo)
            </p>
            <LikertScale
              pregunta="El aire limpio y las calles ordenadas son importantes para la calidad de vida en mi ciudad."
              valor={respuestas.sec_a_q1}
              onChange={v => set('sec_a_q1', v)}
            />
            <LikertScale
              pregunta="La basura mezclada en las calles afecta mi salud y la de mi familia."
              valor={respuestas.sec_a_q2}
              onChange={v => set('sec_a_q2', v)}
            />
            <LikertScale
              pregunta="Los ciudadanos tenemos responsabilidad en cómo se maneja la basura de nuestra ciudad."
              valor={respuestas.sec_a_q3}
              onChange={v => set('sec_a_q3', v)}
            />
            <button
              type="button"
              disabled={!seccionCompleta('a')}
              onClick={() => setPaso('b')}
              className="w-full mt-2 py-3 rounded-[12px] bg-[#3B6D11] text-white font-semibold text-[14px] disabled:opacity-40 transition-opacity"
            >
              Siguiente
            </button>
          </div>
        )}

        {/* SECCIÓN B: Comportamiento actual */}
        {paso === 'b' && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#3B6D11] mb-1">Sección 2 de 3</p>
            <h2 className="font-serif text-[18px] text-[#1C1B18] mb-1">Lo que haces hoy</h2>
            <p className="text-[12px] text-[#6B6760] mb-5">
              Sin juicios — solo queremos saber la realidad
            </p>
            <LikertScale
              pregunta="En mi hogar separamos la basura orgánica de la inorgánica antes de sacarla."
              valor={respuestas.sec_b_q1}
              onChange={v => set('sec_b_q1', v)}
            />
            <LikertScale
              pregunta="Hago esto de forma frecuente (más de 3 veces por semana)."
              valor={respuestas.sec_b_q2}
              onChange={v => set('sec_b_q2', v)}
            />
            <LikertScale
              pregunta="Conozco el reglamento municipal sobre separación de residuos."
              valor={respuestas.sec_b_q3}
              onChange={v => set('sec_b_q3', v)}
            />
            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setPaso('a')}
                className="flex-1 py-3 rounded-[12px] border border-[#D4D0C8] text-[#6B6760] font-medium text-[14px]"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={!seccionCompleta('b')}
                onClick={() => setPaso('c')}
                className="flex-[2] py-3 rounded-[12px] bg-[#3B6D11] text-white font-semibold text-[14px] disabled:opacity-40 transition-opacity"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}

        {/* SECCIÓN C: Compromiso */}
        {paso === 'c' && (
          <div>
            <p className="text-[11px] uppercase tracking-[0.08em] text-[#3B6D11] mb-1">Sección 3 de 3</p>
            <h2 className="font-serif text-[18px] text-[#1C1B18] mb-1">Tu compromiso</h2>
            <p className="text-[12px] text-[#6B6760] mb-5">
              Si el municipio pone un programa, ¿participarías?
            </p>
            <LikertScale
              pregunta="Participaría activamente en un programa de separación de residuos en mi colonia."
              valor={respuestas.sec_c_q1}
              onChange={v => set('sec_c_q1', v)}
            />
            <LikertScale
              pregunta="Invitaría a mis vecinos a unirse al programa."
              valor={respuestas.sec_c_q2}
              onChange={v => set('sec_c_q2', v)}
            />
            <LikertScale
              pregunta="Aceptaría recibir una capacitación de 30 minutos sobre cómo separar correctamente."
              valor={respuestas.sec_c_q3}
              onChange={v => set('sec_c_q3', v)}
            />

            {error && (
              <div className="mb-3 rounded-[8px] bg-red-50 border border-red-200 px-3 py-2 text-[12px] text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 mt-2">
              <button
                type="button"
                onClick={() => setPaso('b')}
                className="flex-1 py-3 rounded-[12px] border border-[#D4D0C8] text-[#6B6760] font-medium text-[14px]"
              >
                Atrás
              </button>
              <button
                type="button"
                disabled={!seccionCompleta('c')}
                onClick={enviar}
                className="flex-[2] py-3 rounded-[12px] bg-[#3B6D11] text-white font-semibold text-[14px] disabled:opacity-40 transition-opacity"
              >
                Enviar respuesta
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 text-center">
        <p className="text-[10px] text-[#A8A49C]">
          Tus respuestas son anónimas · ALQUIMIA · Programa de Circularidad Municipal
        </p>
      </div>
    </main>
  )
}
