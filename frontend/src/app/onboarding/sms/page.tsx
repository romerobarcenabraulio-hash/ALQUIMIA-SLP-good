'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authSmsVerify, getSetupToken } from '@/lib/authApi'

function SmsVerifyForm() {
  const router = useRouter()
  const [setupToken, setSetupToken] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [phoneMasked, setPhoneMasked] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const sentRef = useRef(false)

  useEffect(() => {
    const token = getSetupToken()
    if (!token) {
      setError('Sesión expirada. Verifica tu correo de nuevo.')
      return
    }
    setSetupToken(token)
    if (sentRef.current) return
    sentRef.current = true
    setSending(true)
    import('@/lib/authApi').then(({ authSmsSend }) =>
      authSmsSend(token)
        .then(res => setPhoneMasked(res.phone_masked))
        .catch(err => setError(err instanceof Error ? err.message : 'No se pudo enviar SMS'))
        .finally(() => setSending(false)),
    )
  }, [])

  const handleResend = async () => {
    if (!setupToken) return
    setSending(true)
    setError('')
    try {
      const { authSmsSend } = await import('@/lib/authApi')
      const res = await authSmsSend(setupToken)
      setPhoneMasked(res.phone_masked)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar')
    }
    finally {
      setSending(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupToken) return
    setLoading(true)
    setError('')
    try {
      const res = await authSmsVerify(setupToken, code)
      router.push(res.next_path || '/setup-2fa')
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto')
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-md shadow-md">
        <h1 className="font-serif text-[24px] text-[#3B6D11] text-center mb-2">Verificación SMS</h1>
        <p className="text-[13px] text-[#6B6760] text-center mb-2 leading-relaxed">
          Vinculamos tu identidad: correo, nombre y teléfono quedan asociados a esta cuenta.
        </p>
        <p className="text-[12px] text-[#A8A49C] text-center mb-6">
          {sending
            ? 'Enviando código…'
            : `Código enviado a ${phoneMasked || 'tu móvil'}. Solo se usa al crear la cuenta.`}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2.5 text-[15px] tracking-[0.3em] text-center font-mono"
            placeholder="000000"
            required
            autoFocus
          />
          {error && <p className="text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>}
          <button type="submit" disabled={loading || !setupToken || code.length < 6} className="btn-primary w-full">
            {loading ? 'Verificando…' : 'Confirmar teléfono'}
          </button>
        </form>

        <button
          type="button"
          disabled={sending || !setupToken}
          onClick={handleResend}
          className="mt-4 w-full text-[12px] text-[#3B6D11] hover:underline disabled:opacity-50"
        >
          Reenviar código
        </button>

        <p className="mt-5 text-center text-[12px]">
          <Link href="/onboarding/perfil" className="text-[#A8A49C] hover:text-[#3B6D11]">← Volver al perfil</Link>
        </p>
      </div>
    </div>
  )
}

export default function OnboardingSmsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#A8A49C]">Cargando…</div>}>
      <SmsVerifyForm />
    </Suspense>
  )
}
