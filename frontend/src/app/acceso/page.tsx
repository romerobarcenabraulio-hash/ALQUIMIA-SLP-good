'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: '#F8F6F1' }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <p className="text-center font-serif text-[28px] text-[#1C1B18] mb-1">ALQUIMIA</p>
        <p className="text-center text-[12px] text-[#A8A49C] mb-8 uppercase tracking-widest">
          Plataforma de Circularidad Municipal
        </p>

        <div className="bg-white rounded-[16px] border border-[#E8E4DC] shadow-[0_2px_12px_rgba(28,27,24,0.06)] px-6 py-8">
          <h1 className="font-serif text-[20px] text-[#1C1B18] mb-1">Acceso restringido</h1>
          <p className="text-[12px] text-[#6B6760] mb-6 leading-relaxed">
            Ingresa el código de acceso para continuar a la plataforma.
          </p>

          <form onSubmit={e => void handleSubmit(e)} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="access-code"
                className="block text-[11px] uppercase tracking-widest text-[#A8A49C] mb-1.5"
              >
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
                className="w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2.5 text-[13px] text-[#1C1B18] placeholder:text-[#C8C4BC] focus:border-[#3B6D11] focus:outline-none focus:ring-1 focus:ring-[#3B6D11]"
              />
            </div>

            {error && (
              <p className="text-[12px] text-[#C0392B] bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !code}
              className="w-full rounded-[8px] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2D5409] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Verificando…' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-[11px] text-[#A8A49C] mt-6">
          ¿Sin código?{' '}
          <a href="/" className="text-[#3B6D11] hover:underline">
            Volver a la página principal
          </a>
        </p>
      </div>
    </div>
  )
}

export default function AccesoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F6F1' }}>
        <p className="text-[#A8A49C] text-[13px]">Cargando…</p>
      </div>
    }>
      <AccesoForm />
    </Suspense>
  )
}
