'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Briefcase, HeartHandshake, Landmark, Lock, Recycle } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { Audience } from '@/types'
import { cn } from '@/lib/utils'

type RoleCard = {
  id: Audience
  icon: typeof Landmark
  label: string
  description: string
  cta: string
  accentColor: string
  bgColor: string
  available: boolean
}

const ROLES: RoleCard[] = [
  {
    id: 'functionary',
    icon: Landmark,
    label: 'Funcionario público',
    description: 'Sala de mando institucional: diagnóstico jurídico, infraestructura, escenarios y documentos para Cabildo.',
    cta: 'Entrar como funcionario',
    accentColor: '#1A5FA8',
    bgColor: '#EBF3FB',
    available: true,
  },
  {
    id: 'citizen',
    icon: HeartHandshake,
    label: 'Ciudadano',
    description: 'Entiende cuánto genera tu vivienda, qué se puede separar y por qué una bolsa mezclada termina costando dinero y salud.',
    cta: 'Entrar como ciudadano',
    accentColor: '#3B6D11',
    bgColor: '#EAF3DE',
    available: false,
  },
  {
    id: 'entrepreneur',
    icon: Briefcase,
    label: 'Empresario',
    description: 'Modelo de viabilidad: CAPEX, TIR, Monte Carlo, trazabilidad de mercado y narrativa de consultoría senior.',
    cta: 'Entrar como empresario',
    accentColor: '#8B6B4A',
    bgColor: '#F5EDE3',
    available: false,
  },
]

function RoleSelector({ onSelect }: { onSelect: (role: Audience) => void }) {
  const [selected, setSelected] = useState<Audience | null>(null)

  function pick(role: RoleCard) {
    if (!role.available || selected) return
    setSelected(role.id)
    onSelect(role.id)
  }

  return (
    <div className="w-full max-w-[480px]">
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-1">¿Desde qué perspectiva ingresas?</h2>
      <p className="text-[13px] text-[#6B6760] mb-6 leading-relaxed">
        La plataforma adapta módulos, lenguaje y supuestos según tu rol.
      </p>

      <div className="space-y-3">
        {ROLES.map(role => {
          const Icon = role.icon
          const isLoading = selected === role.id

          return (
            <button
              key={role.id}
              type="button"
              disabled={!role.available || Boolean(selected)}
              onClick={() => pick(role)}
              className={cn(
                'w-full text-left rounded-[14px] border p-4 transition-all flex items-start gap-4',
                role.available
                  ? 'bg-white border-[#E8E4DC] hover:border-[#3B6D11]/30 hover:shadow-[0_4px_16px_rgba(28,27,24,0.08)] cursor-pointer'
                  : 'bg-[#FDFCFA] border-[#E8E4DC] cursor-not-allowed opacity-60',
                isLoading && 'opacity-70',
              )}
            >
              <div
                className="w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: role.bgColor }}
              >
                {role.available
                  ? <Icon className="w-4.5 h-4.5" style={{ color: role.accentColor }} strokeWidth={1.75} />
                  : <Lock className="w-4 h-4 text-[#C8C4BC]" strokeWidth={1.75} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: role.available ? '#1C1B18' : '#A8A49C' }}
                  >
                    {role.label}
                  </span>
                  {!role.available && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F4F2ED] border border-[#E0DCD6] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#A8A49C]">
                      Próximamente
                    </span>
                  )}
                  {isLoading && (
                    <span className="text-[11px] text-[#A8A49C] animate-pulse">Cargando…</span>
                  )}
                </div>
                <p className="text-[12px] text-[#6B6760] leading-snug">{role.description}</p>
              </div>

              {role.available && !isLoading && (
                <ArrowRight className="w-4 h-4 text-[#C8C4BC] shrink-0 mt-1" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function AccesoForm({ initialStep }: { initialStep: 'code' | 'role' }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/v'
  const setAudience = useSimulatorStore(s => s.setAudience)

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'code' | 'role'>(initialStep)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) {
        setStep('role')
      } else {
        setError(data.error ?? 'Código incorrecto.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleRoleSelect(role: Audience) {
    await setAudience(role)
    router.push(nextPath)
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F4F2ED' }}>
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-[#1C2B15] p-10 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-[7px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-4.5 h-4.5 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-[20px] text-white font-semibold">ALQUIMIA</span>
          </div>

          <h1 className="font-serif text-[34px] text-white leading-[1.1] mb-5">
            Plataforma de<br />Circularidad Municipal
          </h1>

          <p className="text-[14px] text-[#7AAB60] leading-[1.7] mb-8">
            Herramienta técnica para que municipios, funcionarios y empresas entiendan, modelen y ejecuten programas de separación de residuos sólidos urbanos.
          </p>

          <div className="space-y-3">
            {[
              'Diagnóstico técnico y legal de tu municipio',
              'Simulación de ingresos, empleos e impacto ambiental',
              'Generación de documentos para Cabildo con un clic',
              'Centros de acopio: diseño, CAPEX y TIR',
            ].map(item => (
              <div key={item} className="flex items-start gap-2.5">
                <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#5A9438] shrink-0" />
                <p className="text-[13px] text-[#8AAD78] leading-snug">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-2">
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors', step === 'code' ? 'bg-[#3B6D11] text-white' : 'bg-[#2D4F1A] text-[#7AAB60]')}>
              1
            </div>
            <div className="h-px w-8 bg-[#2D4F1A]" />
            <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-colors', step === 'role' ? 'bg-[#3B6D11] text-white' : 'bg-[#2D4F1A] text-[#4A7A2E]')}>
              2
            </div>
            <p className="ml-2 text-[11px] text-[#4A7A2E]">
              {step === 'code' ? 'Verificación de acceso' : 'Selección de perfil'}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-[#3A5A2A] leading-relaxed">
          Escenarios generados como propuesta técnica · no constituyen dictamen oficial · validación competente requerida
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center">
            <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-serif text-[18px] text-[#1C1B18] font-semibold">ALQUIMIA</span>
        </div>

        {step === 'code' ? (
          <div className="w-full max-w-[360px]">
            <h2 className="font-serif text-[26px] text-[#1C1B18] mb-1">Acceso institucional</h2>
            <p className="text-[13px] text-[#6B6760] mb-7 leading-relaxed">
              Ingresa tu código de acceso para continuar a la plataforma.
            </p>

            <div className="bg-white rounded-[16px] border border-[#E8E4DC] shadow-[0_4px_20px_rgba(28,27,24,0.07)] px-6 py-7">
              <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-5">
                <div>
                  <label htmlFor="access-code" className="block text-[11px] uppercase tracking-[0.09em] text-[#A8A49C] mb-1.5 font-medium">
                    Código de acceso
                  </label>
                  <input
                    id="access-code"
                    type="password"
                    autoComplete="current-password"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] px-4 py-3 text-[14px] text-[#1C1B18] placeholder:text-[#C8C4BC] focus:border-[#3B6D11] focus:outline-none focus:ring-2 focus:ring-[#3B6D11]/20 transition-all"
                  />
                </div>

                {error && (
                  <div className="rounded-[8px] bg-red-50 border border-red-200 px-3 py-2.5">
                    <p className="text-[12px] text-[#C0392B]">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !code}
                  className="w-full rounded-[10px] bg-[#3B6D11] px-4 py-3 text-[14px] font-medium text-white hover:bg-[#2D5409] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                >
                  {loading ? (
                    <span className="animate-pulse">Verificando…</span>
                  ) : (
                    <>Continuar <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>

            <div className="mt-5 text-center space-y-2">
              <p className="text-[12px] text-[#8A857C]">
                ¿Sin código?{' '}
                <Link href="/" className="text-[#3B6D11] font-medium hover:underline">
                  Solicitar acceso institucional
                </Link>
              </p>
              <p className="text-[12px] text-[#8A857C]">
                <Link href="/" className="hover:text-[#3B6D11] transition-colors">
                  ← Volver a la página principal
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <RoleSelector onSelect={role => void handleRoleSelect(role)} />
        )}
      </div>
    </div>
  )
}
