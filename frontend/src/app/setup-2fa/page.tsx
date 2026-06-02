'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authCompleteSetup, clearSetupToken, getSetupToken, persistSession } from '@/lib/authApi'

function Setup2faForm() {
  const router = useRouter()
  const [setupToken, setSetupTokenState] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getSetupToken()
    if (!token) {
      setError('Sesión de configuración expirada. Verifica tu correo de nuevo.')
      return
    }
    setSetupTokenState(token)
  }, [])

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupToken) return
    setLoading(true)
    setError('')
    try {
      const tokens = await authCompleteSetup(setupToken)
      persistSession(tokens.access_token)
      clearSetupToken()
      router.push('/v')
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo activar la cuenta')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-md shadow-md">
        <h1 className="font-serif text-[24px] text-[#3B6D11] text-center mb-2">Activación de cuenta</h1>
        <p className="text-[13px] text-[#6B6760] text-center mb-6 leading-relaxed">
          Paso final temporal · la verificación adicional está desactivada por ahora. Activa tu acceso y entra a la plataforma.
        </p>

        <form onSubmit={handleActivate} className="space-y-4">
          {error && <p className="text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>}
          <button type="submit" disabled={loading || !setupToken} className="btn-primary w-full">
            {loading ? 'Activando…' : 'Entrar a la plataforma'}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px]">
          <Link href="/login" className="text-[#A8A49C] hover:text-[#3B6D11]">← Volver al login</Link>
        </p>
      </div>
    </div>
  )
}

export default function Setup2faPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#A8A49C]">Cargando…</div>}>
      <Setup2faForm />
    </Suspense>
  )
}
