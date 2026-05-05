'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/api'

export default function LoginPage() {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]  = useState(false)
  const [error, setError]     = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${getApiUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) throw new Error('Credenciales inválidas')
      const { access_token } = await res.json()
      localStorage.setItem('alquimia_token', access_token)
      router.push('/simulator')
    } catch (err: unknown) {
      // Demo fallback
      if (email === 'demo@alquimia.mx' && password === 'demo2025') {
        localStorage.setItem('alquimia_token', 'demo-token')
        router.push('/simulator')
      } else {
        setError('Credenciales inválidas. Usa demo@alquimia.mx / demo2025')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-md shadow-md">
        <div className="text-center mb-8">
          <h1 className="font-serif text-[32px] text-[#3B6D11]">ALQUIMIA</h1>
          <p className="text-[13px] text-[#6B6760] mt-1">Plataforma de circularidad municipal</p>
        </div>

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

        <div className="mt-6 pt-6 border-t border-[#E8E4DC]">
          <p className="text-[11px] text-[#A8A49C] text-center mb-2">Acceso de demostración</p>
          <button
            onClick={() => { setEmail('demo@alquimia.mx'); setPassword('demo2025') }}
            className="w-full text-[12px] text-[#3B6D11] border border-[#3B6D11]/30 rounded-[8px] py-2 hover:bg-[#EAF3DE] transition-colors"
          >
            Usar cuenta demo
          </button>
        </div>

        <p className="text-center mt-4">
          <a href="/aprende" className="text-[12px] text-[#A8A49C] hover:text-[#3B6D11]">
            Centro educativo público →
          </a>
        </p>
      </div>
    </div>
  )
}
