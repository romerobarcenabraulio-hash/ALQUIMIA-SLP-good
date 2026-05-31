'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authLogin, authLoginTotp, isPendingTotp, persistSession } from '@/lib/authApi'
import { isPlatformDeveloper } from '@/lib/authSession'

function loginDestination(next?: string | null): string {
  if (next) return next
  if (isPlatformDeveloper()) return '/v'
  return '/v'
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F6F1' }}>
          <p className="text-[#A8A49C] text-[13px]">Cargando acceso…</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [pendingToken, setPendingToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')

  const finishLogin = (accessToken: string) => {
    persistSession(accessToken)
    router.push(loginDestination(next))
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authLogin(email, password)
      if (isPendingTotp(data)) {
        setPendingToken(data.pending_token)
        return
      }
      finishLogin(data.access_token)
    }
    catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Credenciales inválidas')
    }
    finally {
      setLoading(false)
    }
  }

  const handleTotp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pendingToken) return
    setLoading(true)
    setError('')
    try {
      const data = await authLoginTotp(pendingToken, totpCode)
      finishLogin(data.access_token)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-md shadow-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-[32px] text-[#3B6D11]">ALQUIMIA</h1>
          <p className="text-[13px] text-[#6B6760] mt-1">Acceso seguro · correo y contraseña</p>
        </div>

        {!pendingToken ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-medium text-[#6B6760] block mb-1">Correo electrónico</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="usuario@municipio.gob.mx"
                className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2.5 text-[13px] bg-transparent focus:outline-none focus:border-[#3B6D11] transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6B6760] block mb-1">Contraseña</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2.5 text-[13px] bg-transparent focus:outline-none focus:border-[#3B6D11] transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleTotp} className="flex flex-col gap-4">
            <p className="text-[13px] text-[#4A4740] leading-relaxed">
              Ingresa el código de verificación de 6 dígitos.
            </p>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={totpCode}
              onChange={e => setTotpCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2.5 text-[15px] tracking-[0.3em] text-center font-mono"
              required
              autoFocus
            />
            {error && (
              <p className="text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>
            )}
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Verificando…' : 'Confirmar código'}
            </button>
            <button
              type="button"
              className="text-[12px] text-[#A8A49C] hover:text-[#3B6D11]"
              onClick={() => { setPendingToken(null); setTotpCode(''); setError('') }}
            >
              ← Volver a contraseña
            </button>
          </form>
        )}

        <div className="mt-6 pt-6 border-t border-[#E8E4DC] space-y-3">
          <p className="text-[12px] text-center text-[#6B6760]">
            ¿Primera vez?{' '}
            <Link href="/comenzar" className="text-[#3B6D11] font-medium hover:underline">Solicitar acceso institucional</Link>
          </p>
        </div>

        <div className="mt-5 pt-5 border-t border-[#E8E4DC] flex justify-between text-[12px]">
          <Link href="/" className="text-[#A8A49C] hover:text-[#3B6D11]">← Inicio</Link>
          <Link href="/aprende" className="text-[#A8A49C] hover:text-[#3B6D11]">Centro educativo →</Link>
        </div>
      </div>
    </div>
  )
}
