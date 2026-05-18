'use client'

import { FormEvent, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Recycle } from 'lucide-react'

function AccesoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = searchParams.get('next') ?? '/simulator'

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        router.push(nextPath)
      } else {
        setError(data.error ?? 'Código incorrecto.')
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#F4F2ED' }}>
      {/* Left panel — dark brand */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between bg-[#1C2B15] p-10 shrink-0">
        {/* Logo */}
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

          {/* Feature list */}
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
        </div>

        {/* Bottom disclaimer */}
        <p className="text-[10px] text-[#3A5A2A] leading-relaxed">
          Escenarios generados como propuesta técnica · no constituyen dictamen oficial · validación competente requerida
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center">
            <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="font-serif text-[18px] text-[#1C1B18] font-semibold">ALQUIMIA</span>
        </div>

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
                  <>Ingresar <ArrowRight className="w-4 h-4" /></>
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
      </div>
    </div>
  )
}

export default function AccesoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F2ED' }}>
        <p className="text-[#A8A49C] text-[13px]">Cargando…</p>
      </div>
    }>
      <AccesoForm />
    </Suspense>
  )
}
