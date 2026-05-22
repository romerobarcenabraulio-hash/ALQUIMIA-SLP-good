'use client'

import Link from 'next/link'
import { ArrowRight, Building2, Recycle, TrendingUp, Lock } from 'lucide-react'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isPlatformDeveloper } from '@/lib/authSession'

// ─── Inline login ─────────────────────────────────────────────────────────────

function LoginCard() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res2 = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res2.ok) {
        const { access_token } = await res2.json() as { access_token: string }
        localStorage.setItem('alquimia_token', access_token)
        const dest = isPlatformDeveloper() ? '/simulator' : '/gobierno'
        router.push(dest)
        return
      }
      // Demo fallback
      if (email === 'demo@alquimia.mx' && password === 'demo2025') {
        localStorage.setItem('alquimia_token', 'demo-token')
        router.push('/gobierno')
        return
      }
      setError('Credenciales incorrectas.')
    } catch {
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E8E4DC] shadow-[0_4px_24px_rgba(28,27,24,0.09)] overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-[#F0EDE5]">
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#A8A49C] mb-0.5">Acceso institucional</p>
        <p className="text-[14px] font-semibold text-[#1C1B18]">Ya tengo cuenta</p>
      </div>

      <div className="px-6 py-5">
        <form onSubmit={e => void handleLogin(e)} className="flex flex-col gap-3">
          <div>
            <label htmlFor="lp-email" className="block text-[11px] font-medium text-[#6B6760] mb-1">
              Correo
            </label>
            <input
              id="lp-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="nombre@municipio.gob.mx"
              required
              className="w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] focus:outline-none focus:border-[#3B6D11] focus:ring-1 focus:ring-[#3B6D11]/30 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="lp-pass" className="block text-[11px] font-medium text-[#6B6760] mb-1">
              Contraseña o código
            </label>
            <input
              id="lp-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] focus:outline-none focus:border-[#3B6D11] focus:ring-1 focus:ring-[#3B6D11]/30 transition-colors"
            />
          </div>

          {error && (
            <p className="text-[11px] text-red-800 bg-red-50 border border-red-200 rounded-[6px] px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-[8px] bg-[#1C2B15] text-white text-[13px] font-medium py-2.5 flex items-center justify-center gap-2 hover:bg-[#2D4020] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
          >
            {loading ? 'Verificando…' : <><span>Ingresar a mi plataforma</span><ArrowRight className="w-3.5 h-3.5" /></>}
          </button>
        </form>

        <p className="text-center text-[11px] text-[#A8A49C] mt-4">
          ¿Aún no tienes acceso?{' '}
          <Link href="/gobierno#solicitar" className="text-[#3B6D11] hover:underline">
            Solicitar demo
          </Link>
        </p>
      </div>
    </div>
  )
}

// ─── Landing ──────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F4F2ED' }}>

      {/* Navbar */}
      <header className="bg-[#0F1E0A] sticky top-0 z-40 border-b border-[#1E3510]">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-[18px] text-white font-semibold tracking-tight">ALQUIMIA</span>
            <span className="hidden sm:block text-[11px] text-[#5A8A3A] border-l border-[#1E3510] pl-3">
              Consultoría integral de gestión pública
            </span>
          </div>
          <nav className="flex items-center gap-3 text-[12px]">
            <Link href="/aprende" className="hidden sm:block text-[#A8C898] hover:text-white transition-colors px-2 py-1">
              Aprende
            </Link>
            <Link href="/gobierno" className="hidden sm:block text-[#A8C898] hover:text-white transition-colors px-2 py-1">
              Gobierno
            </Link>
            <Link href="/login" className="px-3 py-1.5 rounded-[6px] bg-[#3B6D11]/30 text-[#A8C898] hover:bg-[#3B6D11] hover:text-white transition-colors">
              Iniciar sesión
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-[#0F1E0A] pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-5 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E3510] text-[#6A9A50] text-[11px] font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11]" />
            Plataforma de consultoría integral
          </span>

          <h1 className="font-serif text-[44px] sm:text-[60px] lg:text-[72px] text-white leading-[1.02] max-w-4xl mx-auto mb-6">
            Plataforma de{' '}
            <span className="text-[#6EC247]">consultoría integral</span>
            {' '}para ciudades mexicanas
          </h1>

          <p className="text-[17px] text-[#7AAB60] leading-[1.7] max-w-2xl mx-auto mb-14">
            ALQUIMIA organiza el análisis técnico, legal y financiero que gobiernos y empresas necesitan
            para tomar decisiones sobre servicios urbanos — desde residuos hasta desarrollo urbano.
          </p>

          {/* 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">

            {/* Gobierno */}
            <Link
              href="/gobierno"
              className="group relative bg-[#1E3510] rounded-[18px] p-7 text-left hover:bg-[#243D13] transition-all border border-[#2D5018] hover:border-[#3B6D11] hover:shadow-[0_8px_32px_rgba(59,109,17,0.25)]"
            >
              <div className="w-11 h-11 rounded-[10px] bg-[#3B6D11]/40 flex items-center justify-center mb-5 group-hover:bg-[#3B6D11]/60 transition-colors">
                <Building2 className="w-5 h-5 text-[#7AC94B]" strokeWidth={1.75} />
              </div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#5A8A3A] mb-2">Sector público</p>
              <h2 className="font-serif text-[24px] text-white mb-3 leading-tight">Gobierno municipal</h2>
              <p className="text-[13px] text-[#7AAB60] leading-[1.65] mb-6">
                Diagnóstico, plan, modelo de negocio y control para cada área de gestión pública.
                Hoy disponible: RSU.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                <span className="px-2 py-0.5 rounded-full bg-[#3B6D11] text-[#D4EAB8] text-[10px] font-medium">RSU · activo</span>
                {['Salud', 'Transporte', 'Educación', 'Urb.'].map(l => (
                  <span key={l} className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#1A3010] text-[#4A7030] text-[10px]">
                    <Lock className="w-2.5 h-2.5" />
                    {l}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-white group-hover:gap-2.5 transition-all">
                Ver plataforma gobierno <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Privados */}
            <Link
              href="/privados"
              className="group relative bg-[#0E1E30] rounded-[18px] p-7 text-left hover:bg-[#132539] transition-all border border-[#1A3050] hover:border-[#1A5FA8] hover:shadow-[0_8px_32px_rgba(26,95,168,0.2)]"
            >
              <div className="w-11 h-11 rounded-[10px] bg-[#1A5FA8]/30 flex items-center justify-center mb-5 group-hover:bg-[#1A5FA8]/50 transition-colors">
                <TrendingUp className="w-5 h-5 text-[#5B9FD8]" strokeWidth={1.75} />
              </div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#3A6090] mb-2">Sector privado</p>
              <h2 className="font-serif text-[24px] text-white mb-3 leading-tight">Empresas y organizaciones</h2>
              <p className="text-[13px] text-[#5A90C0] leading-[1.65] mb-6">
                Consultoría especializada para empresas que operan o invierten en servicios urbanos,
                reciclaje y economía circular.
              </p>
              <div className="flex flex-wrap gap-1.5 mb-6">
                {['Gestión residuos', 'ESG / doble materialidad', 'Logística'].map(l => (
                  <span key={l} className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#0E2040] text-[#3A6090] text-[10px]">
                    <Lock className="w-2.5 h-2.5" />
                    {l}
                  </span>
                ))}
              </div>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#5B9FD8] group-hover:text-white group-hover:gap-2.5 transition-all">
                Explorar opciones <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>

            {/* Login */}
            <div>
              <LoginCard />
            </div>

          </div>
        </div>
      </section>

      {/* Value strip */}
      <section className="bg-white border-t border-[#E8E4DC] py-16">
        <div className="max-w-7xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#A8A49C] text-center mb-3">
            Cómo funciona ALQUIMIA
          </p>
          <h2 className="font-serif text-[28px] text-[#1C1B18] text-center mb-12">
            Del diagnóstico a la decisión en 4 pasos
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { n: '01', t: 'Diagnóstico', d: 'Datos reales del municipio: RSU, marco legal, capacidad institucional y costo de no actuar.', c: '#3B6D11' },
              { n: '02', t: 'Planificación', d: 'Plan maestro, infraestructura, organigrama y logística calibrados al territorio.', c: '#1A5FA8' },
              { n: '03', t: 'Modelo', d: 'Esquema de operación, financiamiento y escenarios TIR/VPN para decidir ante Cabildo.', c: '#D4881E' },
              { n: '04', t: 'Control', d: 'Inspección, monitoreo en tiempo real y reporte ESG / doble materialidad.', c: '#4A1C7A' },
            ].map(s => (
              <div key={s.n} className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6">
                <p className="font-mono text-[11px] text-[#A8A49C] mb-3">{s.n}</p>
                <h3 className="text-[15px] font-semibold mb-2" style={{ color: s.c }}>{s.t}</h3>
                <p className="text-[12px] text-[#6B6760] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E8E4DC] bg-[#FDFCFA] py-8">
        <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[5px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-[16px] text-[#3B6D11]">ALQUIMIA</span>
          </div>
          <p className="text-[11px] text-[#A8A49C] text-center max-w-xs">
            Plataforma de consultoría integral para gestión pública municipal · no sustituye actos de autoridad
          </p>
          <nav className="flex gap-5 text-[11px] text-[#6B6760]">
            <Link href="/aprende" className="hover:text-[#3B6D11]">Aprende</Link>
            <Link href="/gobierno" className="hover:text-[#3B6D11]">Gobierno</Link>
            <Link href="/privados" className="hover:text-[#3B6D11]">Privados</Link>
            <Link href="/login" className="hover:text-[#3B6D11]">Iniciar sesión</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
