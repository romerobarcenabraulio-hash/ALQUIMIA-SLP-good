'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authUploadReglamento, getSetupToken } from '@/lib/authApi'

function ReglamentoUploadForm() {
  const router = useRouter()
  const [setupToken, setSetupToken] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [pdfReady, setPdfReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = getSetupToken()
    if (!token) setError('Sesión expirada. Verifica tu correo de nuevo.')
    else setSetupToken(token)
  }, [])

  const handleUpload = async (file: File) => {
    if (!setupToken) return
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const res = await authUploadReglamento(setupToken, file)
      setPdfReady(true)
      setMessage(res.message)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el PDF')
      setPdfReady(false)
    }
    finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-lg shadow-md">
        <h1 className="font-serif text-[24px] text-[#3B6D11] text-center mb-2">Reglamento municipal</h1>
        <p className="text-[13px] text-[#6B6760] text-center mb-6 leading-relaxed">
          Sube el PDF más reciente del reglamento de aseo, limpia o gestión integral de residuos
          del municipio que quieres analizar. Al activar tu cuenta, la plataforma inicia
          el análisis jurídico con este documento.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
            e.target.value = ''
          }}
        />

        <button
          type="button"
          disabled={uploading || !setupToken}
          onClick={() => fileInputRef.current?.click()}
          className="w-full rounded-[10px] border border-[#1A5FA8]/30 bg-[#EBF3FB] px-4 py-3 text-[13px] font-medium text-[#1A5FA8] hover:bg-[#DCEAF8] disabled:opacity-50"
        >
          {uploading ? 'Subiendo PDF…' : pdfReady ? 'Reemplazar PDF' : 'Subir reglamento (PDF)'}
        </button>

        {message && <p className="mt-3 text-[12px] text-[#3B6D11]">{message}</p>}
        {error && <p className="mt-3 text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>}

        <button
          type="button"
          disabled={!pdfReady || !setupToken}
          onClick={() => router.push('/setup-2fa')}
          className="btn-primary w-full mt-6 disabled:opacity-40"
        >
          Continuar a TOTP
        </button>

        <p className="mt-5 text-center text-[12px]">
          <Link href="/onboarding/sms" className="text-[#A8A49C] hover:text-[#3B6D11]">← Volver a SMS</Link>
        </p>
      </div>
    </div>
  )
}

export default function OnboardingReglamentoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#A8A49C]">Cargando…</div>}>
      <ReglamentoUploadForm />
    </Suspense>
  )
}
