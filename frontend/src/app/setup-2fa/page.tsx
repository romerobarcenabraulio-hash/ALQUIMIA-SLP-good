'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { authTotpActivate, authTotpSetup, clearSetupToken, getSetupToken, persistSession } from '@/lib/authApi'
import { isPlatformDeveloper } from '@/lib/authSession'

function Setup2faForm() {
  const router = useRouter()
  const [setupToken, setSetupTokenState] = useState<string | null>(null)
  const [otpauthUri, setOtpauthUri] = useState('')
  const [secretPreview, setSecretPreview] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = getSetupToken()
    if (!token) {
      setError('Sesión de configuración expirada. Verifica tu correo de nuevo.')
      return
    }
    setSetupTokenState(token)
    void authTotpSetup(token)
      .then(res => {
        setOtpauthUri(res.otpauth_uri)
        setSecretPreview(res.secret_preview)
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'No se pudo cargar TOTP')
      })
  }, [])

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!setupToken) return
    setLoading(true)
    setError('')
    try {
      const tokens = await authTotpActivate(setupToken, code)
      persistSession(tokens.access_token)
      clearSetupToken()
      router.push(isPlatformDeveloper() ? '/simulator' : '/gobierno')
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
        <h1 className="font-serif text-[24px] text-[#3B6D11] text-center mb-2">Seguridad TOTP</h1>
        <p className="text-[13px] text-[#6B6760] text-center mb-6 leading-relaxed">
          Escanea el código con Google Authenticator, Authy o 1Password y escribe el código de 6 dígitos.
        </p>

        {otpauthUri && (
          <div className="flex flex-col items-center gap-3 mb-6">
            <div className="p-3 bg-white border border-[#E8E4DC] rounded-[12px]">
              <QRCodeSVG value={otpauthUri} size={180} />
            </div>
            <p className="text-[10px] text-[#A8A49C] font-mono">Respaldo: {secretPreview}</p>
          </div>
        )}

        <form onSubmit={handleActivate} className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-[#6B6760] block mb-1">Código de 6 dígitos</label>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2.5 text-[15px] tracking-[0.3em] text-center font-mono"
              required
            />
          </div>
          {error && <p className="text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>}
          <button type="submit" disabled={loading || !setupToken} className="btn-primary w-full">
            {loading ? 'Activando…' : 'Activar y entrar'}
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
