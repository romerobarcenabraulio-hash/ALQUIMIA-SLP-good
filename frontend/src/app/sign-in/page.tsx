'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { Recycle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authLogin, persistSession, isPendingTotp } from '@/lib/authApi'
import { getApiUrl } from '@/lib/api'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('redirect_url') || searchParams.get('next') || '/hub'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // TOTP step
  const [totpRequired, setTotpRequired] = useState(false)
  const [pendingToken, setPendingToken] = useState('')
  const [totpCode, setTotpCode] = useState('')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await authLogin(email.trim().toLowerCase(), password)
      if (isPendingTotp(result)) {
        setPendingToken(result.pending_token)
        setTotpRequired(true)
        return
      }
      persistSession(result.access_token)
      router.replace(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas')
    } finally {
      setLoading(false)
    }
  }

  async function handleTotp(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`${getApiUrl()}/auth/login/totp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pending_token: pendingToken, totp_code: totpCode }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.detail ?? 'Código incorrecto')
      persistSession(data.access_token)
      router.replace(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex" style={{ background: '#F4F2ED' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[400px] flex-col justify-between bg-[#1C2B15] p-10 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-[7px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="text-white font-semibold text-[15px] tracking-wide">ALQUIMIA</span>
          </div>
          <h2 className="font-serif text-[28px] leading-snug text-white">
            Plataforma de circularidad municipal
          </h2>
          <p className="mt-4 text-[13px] leading-6 text-[#8FA97A]">
            Diagnóstico jurídico · Residuos sólidos · Planeación financiera · Monitoreo continuo.
          </p>
        </div>
        <p className="text-[11px] text-[#4A6B35]">© 2026 ALQUIMIA. San Luis Potosí, México.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[400px]">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="font-semibold text-[#1C1B18] text-[14px]">ALQUIMIA</span>
          </div>

          <h1 className="font-serif text-[28px] text-[#1C1B18] leading-tight">
            {totpRequired ? 'Verificación de dos factores' : 'Acceso institucional'}
          </h1>
          <p className="mt-2 text-[13px] text-[#6B6760]">
            {totpRequired
              ? 'Ingresa el código de 6 dígitos de tu aplicación autenticadora.'
              : 'Entra con tu correo y contraseña registrados.'}
          </p>

          {error && (
            <div className="mt-4 rounded-[8px] border border-[#F5C2C0] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#A8322A]">
              {error}
            </div>
          )}

          {!totpRequired ? (
            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#3B3326] mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="tu@municipio.gob.mx"
                  className="w-full rounded-[10px] border border-[#D8D2C5] bg-white px-4 py-2.5 text-[14px] text-[#1C1B18] placeholder-[#B0A99E] outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/20"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#3B3326] mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-[10px] border border-[#D8D2C5] bg-white px-4 py-2.5 pr-10 text-[14px] text-[#1C1B18] placeholder-[#B0A99E] outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8E8980] hover:text-[#3B3326]"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-[#3B6D11] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#2D5409] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verificando…</> : 'Entrar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleTotp} className="mt-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#3B3326] mb-1.5">
                  Código de verificación
                </label>
                <input
                  type="text"
                  value={totpCode}
                  onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full rounded-[10px] border border-[#D8D2C5] bg-white px-4 py-2.5 text-[14px] text-[#1C1B18] text-center tracking-[0.3em] placeholder-[#B0A99E] outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/20"
                />
              </div>
              <button
                type="submit"
                disabled={loading || totpCode.length < 6}
                className="w-full flex items-center justify-center gap-2 rounded-[10px] bg-[#3B6D11] px-4 py-3 text-[14px] font-semibold text-white hover:bg-[#2D5409] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Verificando…</> : 'Verificar código'}
              </button>
              <button
                type="button"
                onClick={() => { setTotpRequired(false); setError(null) }}
                className="w-full text-center text-[12px] text-[#6B6760] hover:text-[#1C1B18]"
              >
                Volver al inicio de sesión
              </button>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-[#E8E4DC] space-y-2">
            <p className="text-[12px] text-[#6B6760] text-center">
              ¿No tienes cuenta?{' '}
              <Link href="/register" className="font-semibold text-[#3B6D11] hover:underline">
                Regístrate aquí
              </Link>
            </p>
            <p className="text-[12px] text-[#6B6760] text-center">
              ¿Eres consultor?{' '}
              <Link href="/acceso" className="font-semibold text-[#1C4B8F] hover:underline">
                Acceso de consultoría
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F4F2ED]">
        <Loader2 className="animate-spin text-[#3B6D11]" size={24} />
      </div>
    }>
      <SignInForm />
    </Suspense>
  )
}
