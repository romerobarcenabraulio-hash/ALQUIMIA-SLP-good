'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { authVerifyEmail, setSetupToken } from '@/lib/authApi'

function VerifyEmailInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) {
      setStatus('error')
      setMessage('Enlace incompleto.')
      return
    }
    void authVerifyEmail(token)
      .then(res => {
        setSetupToken(res.setup_token)
        setStatus('ok')
        setMessage(res.message)
        setTimeout(() => router.replace('/onboarding/perfil'), 1200)
      })
      .catch(err => {
        setStatus('error')
        setMessage(err instanceof Error ? err.message : 'No se pudo verificar')
      })
  }, [params, router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-md shadow-md text-center">
        {status === 'loading' && <p className="text-[#6B6760]">Verificando correo…</p>}
        {status === 'ok' && (
          <>
            <h1 className="font-serif text-[22px] text-[#3B6D11] mb-2">Correo confirmado</h1>
            <p className="text-[13px] text-[#4A4740]">{message}</p>
            <p className="text-[12px] text-[#A8A49C] mt-3">Redirigiendo a selección de perfil…</p>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="font-serif text-[22px] text-[#C0392B] mb-2">Enlace no válido</h1>
            <p className="text-[13px] text-[#4A4740] mb-4">{message}</p>
            <Link href="/register" className="text-[13px] text-[#3B6D11] hover:underline">Volver a registrarse</Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#A8A49C]">Cargando…</div>}>
      <VerifyEmailInner />
    </Suspense>
  )
}
