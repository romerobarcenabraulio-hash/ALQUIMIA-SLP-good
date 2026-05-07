'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Recycle, BarChart2, FileText, Globe, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MODULOS: Array<{ ruta: string; Icon: LucideIcon; titulo: string; desc: string }> = [
  { ruta: '/simulator', Icon: BarChart2, titulo: 'Simulador interactivo', desc: 'Variables en tiempo real: demografía, sensibilidades, huella y lectura documental.' },
  { ruta: '/ca-studio',  Icon: Recycle,   titulo: 'CA-Studio',             desc: 'Diseña centros de acopio en escala urbana con proyecciones financieras.' },
  { ruta: '/hub',        Icon: FileText,  titulo: 'Hub de documentos',     desc: 'Paquetes ÁGORA: marco legal, modelo financiero y piezas para Cabildo.' },
  { ruta: '/aprende',    Icon: Globe,     titulo: 'Centro educativo',       desc: 'Flujos divulgativos sin cuenta, complemento al escenario de referencia.' },
]

type Tab = 'ingresar' | 'solicitar'

function AuthModule() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('ingresar')

  // — Ingreso con código —
  const [code, setCode]         = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError]     = useState<string | null>(null)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      const res  = await fetch('/api/acceso', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) { router.push('/simulator') } else { setLoginError(data.error ?? 'Código incorrecto.') }
    } catch { setLoginError('Error de conexión. Intenta de nuevo.') }
    finally  { setLoginLoading(false) }
  }

  // — Solicitar acceso —
  const [form, setForm]           = useState({ nombre: '', email: '', org: '', rol: '' })
  const [reqLoading, setReqLoading] = useState(false)
  const [reqDone, setReqDone]       = useState(false)
  const [reqError, setReqError]     = useState<string | null>(null)

  async function handleSolicitud(e: FormEvent) {
    e.preventDefault()
    setReqError(null)
    setReqLoading(true)
    // Por ahora registramos en consola y mostramos confirmación;
    // conectar a endpoint de Supabase / correo cuando esté listo.
    await new Promise(r => setTimeout(r, 800))
    setReqLoading(false)
    setReqDone(true)
  }

  return (
    <div className="bg-white rounded-[20px] border border-[#E8E4DC] shadow-[0_4px_24px_rgba(28,27,24,0.08)] overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-[#E8E4DC]">
        {(['ingresar', 'solicitar'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-[12px] font-medium uppercase tracking-widest transition-colors
              ${tab === t
                ? 'bg-[#3B6D11] text-white'
                : 'text-[#6B6760] hover:bg-[#F8F6F1]'
              }`}
          >
            {t === 'ingresar' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      <div className="px-6 py-7">
        {tab === 'ingresar' && (
          <form onSubmit={e => void handleLogin(e)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="access-code" className="block text-[11px] uppercase tracking-widest text-[#A8A49C] mb-1.5">
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
            {loginError && (
              <p className="text-[12px] text-[#C0392B] bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading || !code}
              className="w-full rounded-[8px] bg-[#3B6D11] px-4 py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2D5409] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loginLoading ? 'Verificando…' : <><span>Ingresar a la plataforma</span><ArrowRight className="w-3.5 h-3.5" /></>}
            </button>
            <p className="text-center text-[11px] text-[#A8A49C]">
              ¿Sin código?{' '}
              <button type="button" onClick={() => setTab('solicitar')} className="text-[#3B6D11] hover:underline">
                Solicita acceso institucional
              </button>
            </p>
          </form>
        )}

        {tab === 'solicitar' && !reqDone && (
          <form onSubmit={e => void handleSolicitud(e)} className="flex flex-col gap-4">
            <p className="text-[12px] text-[#6B6760] leading-relaxed">
              Completa el formulario y te enviamos tu código de acceso en menos de 24 h.
            </p>
            {[
              { id: 'nombre', label: 'Nombre completo', placeholder: 'Tu nombre', type: 'text' },
              { id: 'email',  label: 'Correo institucional', placeholder: 'nombre@municipio.gob.mx', type: 'email' },
              { id: 'org',    label: 'Municipio u organización', placeholder: 'Nombre del ayuntamiento', type: 'text' },
              { id: 'rol',    label: 'Cargo o función', placeholder: 'Dirección de Servicios Públicos…', type: 'text' },
            ].map(f => (
              <div key={f.id}>
                <label htmlFor={`req-${f.id}`} className="block text-[11px] uppercase tracking-widest text-[#A8A49C] mb-1.5">
                  {f.label}
                </label>
                <input
                  id={`req-${f.id}`}
                  type={f.type}
                  placeholder={f.placeholder}
                  required
                  value={form[f.id as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                  className="w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2.5 text-[13px] text-[#1C1B18] placeholder:text-[#C8C4BC] focus:border-[#3B6D11] focus:outline-none focus:ring-1 focus:ring-[#3B6D11]"
                />
              </div>
            ))}
            {reqError && (
              <p className="text-[12px] text-[#C0392B] bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{reqError}</p>
            )}
            <button
              type="submit"
              disabled={reqLoading}
              className="w-full rounded-[8px] bg-[#3B6D11] px-4 py-3 text-[13px] font-medium text-white transition-colors hover:bg-[#2D5409] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reqLoading ? 'Enviando…' : 'Solicitar acceso'}
            </button>
          </form>
        )}

        {tab === 'solicitar' && reqDone && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#EAF3DE] flex items-center justify-center mx-auto mb-4">
              <span className="text-[#3B6D11] text-[22px]">✓</span>
            </div>
            <p className="font-serif text-[17px] text-[#1C1B18] mb-2">Solicitud recibida</p>
            <p className="text-[12px] text-[#6B6760] leading-relaxed max-w-xs mx-auto">
              Te enviaremos tu código de acceso a <strong className="text-[#1C1B18]">{form.email}</strong> en menos de 24 horas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="bg-[#FDFCFA]/90 backdrop-blur-sm border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3 min-w-0">
            <span className="font-serif text-[20px] text-[#3B6D11] font-semibold shrink-0">ALQUIMIA</span>
            <span className="text-[10px] leading-snug text-[#8C8880] max-w-[17rem]">
              Consultoría en circularidad municipal · propuesta técnica, no dictamen oficial hasta validación competente
            </span>
          </div>
          <nav className="hidden sm:flex items-center gap-4 text-[12px]">
            <Link href="/aprende" className="text-[#6B6760] hover:text-[#3B6D11]">Aprende</Link>
            <Link href="/simulator" className="text-[#6B6760] hover:text-[#3B6D11]">Simulador</Link>
            <Link href="/hub" className="text-[#6B6760] hover:text-[#3B6D11]">Documentos</Link>
            <Link href="/acceso" className="btn-primary text-[12px]">Acceso institucional</Link>
          </nav>
        </div>
      </header>

      {/* ── Artículo + Auth (2 columnas en desktop) ────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-16 items-start">

        {/* Columna izquierda: Artículo editorial */}
        <article className="max-w-2xl">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#3B6D11] mb-5 font-medium">
            Plataforma de consultoría en circularidad municipal
          </p>

          <h1 className="font-serif text-[36px] sm:text-[48px] leading-[1.07] tracking-[-0.025em] text-[#1C1B18] mb-7">
            México genera 120,000 toneladas de basura al día.<br />
            <span className="text-[#3B6D11]">El 75% termina enterrado.</span>
          </h1>

          <p className="text-[16px] text-[#1C1B18] leading-[1.7] mb-5">
            Cada municipio tiene la obligación legal de gestionar sus residuos sólidos urbanos — y la mayoría lo hace con presupuesto insuficiente, sin datos confiables y sin un plan de separación que sea técnicamente viable y socialmente aceptable.
          </p>

          <blockquote className="border-l-4 border-[#3B6D11] pl-5 my-7">
            <p className="font-serif text-[22px] text-[#1C1B18] leading-[1.4] italic">
              &ldquo;El problema no es la voluntad política. Es la falta de herramientas para demostrar que sí funciona.&rdquo;
            </p>
          </blockquote>

          <p className="text-[16px] text-[#6B6760] leading-[1.7] mb-5">
            ALQUIMIA es la plataforma que cierra esa brecha. Integra el marco legal vigente, los datos de generación por colonia, la ingeniería básica de centros de acopio y la narrativa institucional en un solo flujo: del diagnóstico al expediente listo para Cabildo.
          </p>

          <p className="text-[16px] text-[#6B6760] leading-[1.7] mb-8">
            Con un programa de separación en 5 fracciones, un municipio mediano puede formalizar entre 80 y 120 empleos, capturar ingresos adicionales por venta de materiales separados y reducir entre 15% y 40% el volumen enviado a relleno — todo modelado, documentado y con respaldo en la legislación aplicable.
          </p>

          {/* Stats en línea */}
          <div className="grid grid-cols-3 gap-4 py-6 border-y border-[#E8E4DC] mb-8">
            {[
              { v: '80–120', u: 'empleos formalizables', s: 'por municipio mediano' },
              { v: '+35%',   u: 'reducción a relleno',   s: 'separación 5 fracciones' },
              { v: '$263M',  u: 'MXN/año potencial',     s: 'ZM San Luis Potosí' },
            ].map(m => (
              <div key={m.v}>
                <p className="font-mono text-[22px] text-[#3B6D11] leading-none mb-1">{m.v}</p>
                <p className="text-[12px] font-medium text-[#1C1B18]">{m.u}</p>
                <p className="text-[11px] text-[#A8A49C] mt-0.5">{m.s}</p>
              </div>
            ))}
          </div>

          <p className="text-[14px] text-[#6B6760] leading-[1.7] mb-4">
            El sistema genera el diagnóstico jurídico del municipio, la iniciativa de reforma al reglamento de limpia, el modelo de concesión para centros de acopio, el plan de implementación por fases y el reporte ejecutivo para presidencia — en minutos, no en semanas.
          </p>

          <p className="text-[13px] text-[#A8A49C] leading-relaxed border-t border-[#E8E4DC] pt-5 mt-6">
            Los escenarios generados son propuestas de trabajo técnico. No constituyen dictamen oficial ni sustituyen la validación de la autoridad competente. ALQUIMIA es una herramienta de análisis y preparación, no de resolución administrativa.
          </p>
        </article>

        {/* Columna derecha: Módulo de acceso */}
        <div className="lg:sticky lg:top-24">
          <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-3 text-center lg:text-left">
            Accede a la plataforma
          </p>
          <AuthModule />
          <p className="text-[11px] text-[#A8A49C] text-center mt-4 leading-relaxed">
            Acceso demo sin cuenta:{' '}
            <Link href="/simulator" className="text-[#3B6D11] hover:underline">
              explorar simulador →
            </Link>
          </p>
        </div>
      </div>

      {/* ── Módulos ────────────────────────────────────────────────────── */}
      <section className="border-t border-[#E8E4DC] bg-[#FDFCFA] py-16">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-2 text-center">Una vez dentro</p>
          <h2 className="font-serif text-[28px] text-center text-[#1C1B18] mb-10">Todo lo que necesitas para presentar el programa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MODULOS.map(({ ruta, Icon, titulo, desc }) => (
              <Link key={ruta} href={ruta}
                className="bg-white border border-[#E8E4DC] rounded-[16px] p-6 hover:border-[#3B6D11]/30 hover:shadow-md transition-all group">
                <Icon className="w-7 h-7 text-[#3B6D11] mb-3 shrink-0" aria-hidden strokeWidth={1.75} />
                <h3 className="text-[15px] font-medium text-[#1C1B18] mb-2 group-hover:text-[#3B6D11] transition-colors">{titulo}</h3>
                <p className="text-[13px] text-[#6B6760] leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E8E4DC] py-8">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-serif text-[16px] text-[#3B6D11]">ALQUIMIA</span>
          <p className="text-[11px] text-[#A8A49C] text-center">
            Plataforma de circularidad para municipios mexicanos · consultoría y simulación
          </p>
          <nav className="flex gap-4 text-[11px] text-[#A8A49C]">
            <Link href="/aprende">Aprende</Link>
            <Link href="/simulator">Simulador</Link>
            <Link href="/hub">Hub</Link>
            <Link href="/acceso">Acceso</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
