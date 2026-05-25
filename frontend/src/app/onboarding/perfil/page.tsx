'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getEstadosMx, getMunicipiosMx } from '@/lib/api'
import {
  authOnboardingProfile,
  getSetupToken,
} from '@/lib/authApi'
import {
  ONBOARDING_SEGMENTS,
  type ClientSegment,
} from '@/lib/onboardingCatalog'
import type { EstadoMxOption, MunicipioMxApi } from '@/types'

function PerfilWizard() {
  const router = useRouter()
  const [setupToken, setSetupToken] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [segment, setSegment] = useState<ClientSegment | null>(null)
  const [serviceId, setServiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [estados, setEstados] = useState<EstadoMxOption[]>([])
  const [estadoId, setEstadoId] = useState('')
  const [municipiosApi, setMunicipiosApi] = useState<MunicipioMxApi[]>([])
  const [municipioPick, setMunicipioPick] = useState('')
  const [loadingCatalog, setLoadingCatalog] = useState(true)

  useEffect(() => {
    const token = getSetupToken()
    if (!token) {
      setError('Sesión expirada. Verifica tu correo de nuevo.')
      return
    }
    setSetupToken(token)
    getEstadosMx()
      .then(setEstados)
      .catch(() => setError('Catálogo territorial no disponible'))
      .finally(() => setLoadingCatalog(false))
  }, [])

  useEffect(() => {
    if (!estadoId) {
      setMunicipiosApi([])
      setMunicipioPick('')
      return
    }
    void getMunicipiosMx(estadoId).then(setMunicipiosApi).catch(() => {})
  }, [estadoId])

  const selectedMunicipio = municipiosApi.find(m => m.clave_inegi === municipioPick)

  const handleSubmitProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!setupToken || !segment || !serviceId) return
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    const estadoNombre = estados.find(ed => ed.estado_id === estadoId)?.nombre

    try {
      await authOnboardingProfile({
        setup_token: setupToken,
        client_segment: segment,
        service_interest: serviceId,
        cargo: String(fd.get('cargo') ?? '') || undefined,
        dependencia: String(fd.get('dependencia') ?? '') || undefined,
        organizacion: String(fd.get('organizacion') ?? '') || undefined,
        municipio_nombre: (selectedMunicipio?.nombre ?? String(fd.get('municipio_nombre') ?? '')) || undefined,
        estado_mx: (estadoNombre ?? String(fd.get('estado_mx') ?? '')) || undefined,
        clave_inegi: selectedMunicipio?.clave_inegi,
        municipio_id: selectedMunicipio?.municipio_simulator_id,
        zm: selectedMunicipio?.zm_simulator_id ?? 'SLP',
      })
      router.push('/onboarding/sms')
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar')
    }
    finally {
      setLoading(false)
    }
  }

  const segmentBlock = segment ? ONBOARDING_SEGMENTS[segment] : null

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-xl shadow-md">
        <div className="flex gap-2 mb-6">
          {[1, 2, 3].map(n => (
            <div
              key={n}
              className={`h-1 flex-1 rounded-full ${step >= n ? 'bg-[#3B6D11]' : 'bg-[#E8E4DC]'}`}
            />
          ))}
        </div>

        <h1 className="font-serif text-[24px] text-[#3B6D11] text-center mb-1">Tu perfil en ALQUIMIA</h1>
        <p className="text-[13px] text-[#6B6760] text-center mb-6">
          Paso {step} de 3 · vinculamos identidad, territorio y servicio
        </p>

        {error && !setupToken && (
          <p className="text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px] mb-4">{error}</p>
        )}

        {step === 1 && (
          <div className="space-y-3">
            <p className="text-[13px] text-[#4A4740] mb-2">¿En qué materia te interesa la plataforma?</p>
            {(Object.entries(ONBOARDING_SEGMENTS) as [ClientSegment, typeof ONBOARDING_SEGMENTS[ClientSegment]][]).map(([key, block]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setSegment(key); setServiceId(null); setStep(2) }}
                className={`w-full text-left border rounded-[12px] p-4 transition-colors ${
                  segment === key ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-[#E8E4DC] hover:border-[#3B6D11]/50'
                }`}
              >
                <p className="font-medium text-[14px] text-[#2D2A26]">{block.label}</p>
                <p className="text-[12px] text-[#6B6760] mt-1">{block.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 2 && segmentBlock && (
          <div className="space-y-3">
            <button type="button" className="text-[12px] text-[#A8A49C] hover:text-[#3B6D11] mb-1" onClick={() => setStep(1)}>
              ← Cambiar materia
            </button>
            <p className="text-[13px] text-[#4A4740]">Selecciona el servicio:</p>
            {segmentBlock.services.map(svc => (
              <button
                key={svc.id}
                type="button"
                onClick={() => { setServiceId(svc.id); setStep(3) }}
                className={`w-full text-left border rounded-[12px] p-4 transition-colors ${
                  serviceId === svc.id ? 'border-[#3B6D11] bg-[#EAF3DE]' : 'border-[#E8E4DC] hover:border-[#3B6D11]/50'
                }`}
              >
                <p className="font-medium text-[14px] text-[#2D2A26]">{svc.label}</p>
                <p className="text-[12px] text-[#6B6760] mt-1">{svc.description}</p>
              </button>
            ))}
          </div>
        )}

        {step === 3 && segment && serviceId && (
          <form onSubmit={handleSubmitProfile} className="space-y-3">
            <button type="button" className="text-[12px] text-[#A8A49C] hover:text-[#3B6D11]" onClick={() => setStep(2)}>
              ← Cambiar servicio
            </button>

            {segment === 'politica_publica' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-medium text-[#6B6760]">Estado *</span>
                    <select
                      required
                      value={estadoId}
                      disabled={loadingCatalog}
                      onChange={e => setEstadoId(e.target.value)}
                      className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
                    >
                      <option value="">Selecciona</option>
                      {estados.map(ed => (
                        <option key={ed.estado_id} value={ed.estado_id}>{ed.nombre}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-medium text-[#6B6760]">Municipio *</span>
                    <select
                      required
                      value={municipioPick}
                      disabled={!estadoId}
                      onChange={e => setMunicipioPick(e.target.value)}
                      className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
                    >
                      <option value="">Selecciona</option>
                      {municipiosApi.map(m => (
                        <option key={m.clave_inegi} value={m.clave_inegi}>{m.nombre}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#6B6760] block mb-1">Cargo *</label>
                  <input name="cargo" required className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#6B6760] block mb-1">Dependencia / área *</label>
                  <input name="dependencia" required className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2 text-[13px]" />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-[11px] font-medium text-[#6B6760] block mb-1">Organización / empresa *</label>
                  <input name="organizacion" required className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2 text-[13px]" />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-[#6B6760] block mb-1">Cargo</label>
                  <input name="cargo" className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2 text-[13px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-[11px] font-medium text-[#6B6760]">Estado (opcional)</span>
                    <select
                      value={estadoId}
                      disabled={loadingCatalog}
                      onChange={e => setEstadoId(e.target.value)}
                      className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
                    >
                      <option value="">—</option>
                      {estados.map(ed => (
                        <option key={ed.estado_id} value={ed.estado_id}>{ed.nombre}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-medium text-[#6B6760]">Municipio (opcional)</span>
                    <select
                      value={municipioPick}
                      disabled={!estadoId}
                      onChange={e => setMunicipioPick(e.target.value)}
                      className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
                    >
                      <option value="">—</option>
                      {municipiosApi.map(m => (
                        <option key={m.clave_inegi} value={m.clave_inegi}>{m.nombre}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </>
            )}

            {error && <p className="text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>}

            <button type="submit" disabled={loading || !setupToken} className="btn-primary w-full mt-2">
              {loading ? 'Guardando…' : 'Continuar a verificación SMS'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-[12px]">
          <Link href="/login" className="text-[#A8A49C] hover:text-[#3B6D11]">← Volver al login</Link>
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPerfilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#A8A49C]">Cargando…</div>}>
      <PerfilWizard />
    </Suspense>
  )
}
