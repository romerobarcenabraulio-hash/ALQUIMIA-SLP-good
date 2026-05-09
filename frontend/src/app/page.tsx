'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Recycle, BarChart2, FileText, Globe, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fmt } from '@/lib/utils'
import { landingZmSlpIngresosBrutosAnualMXN, landingZmSlpRsuTonDiaRange } from '@/lib/landingReferenceKpis'

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
  const rsuZm = landingZmSlpRsuTonDiaRange()
  const ingresoAnual = landingZmSlpIngresosBrutosAnualMXN()

  return (
    <div className="min-h-screen" style={{ background: '#F8F6F1' }}>
      {/* ── Navbar ─────────────────────────────────────────────────────── */}
      <header className="bg-[#FDFCFA]/90 backdrop-blur-sm border-b border-[#E8E4DC] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 min-h-14 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3 min-w-0">
            <Link href="/" className="font-serif text-[20px] text-[#3B6D11] font-semibold shrink-0 hover:text-[#2D5409]">
              ALQUIMIA
            </Link>
            <span className="text-[10px] leading-snug text-[#8C8880] max-w-[17rem]">
              Herramienta técnica para planeación municipal de circularidad
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
            Programa municipal de separación en cinco fracciones
          </p>

          <h1 className="font-serif text-[36px] sm:text-[48px] leading-[1.07] text-[#1C1B18] mb-7">
            ¿Sabes cuánto le cuesta a San Luis Potosí no separar sus residuos?
          </h1>

          <p className="text-[16px] text-[#1C1B18] leading-[1.7] mb-5">
            No solo cuesta dinero. También cuesta salud pública, tiempo, infraestructura, espacio en rellenos sanitarios y
            oportunidades económicas que hoy terminan enterradas. Con una generación de referencia de {rsuZm.kgPerCapita} kg/hab·día,
            la Zona Metropolitana de San Luis Potosí se mueve entre {fmt.num0(rsuZm.min)} y {fmt.num0(rsuZm.max)} toneladas diarias
            de residuos sólidos urbanos; ese dato debe leerse como escenario técnico, no como estadística oficial.
          </p>

          <blockquote className="border-l-4 border-[#3B6D11] pl-5 my-7">
            <p className="font-serif text-[22px] text-[#1C1B18] leading-[1.4] italic">
              ALQUIMIA no sustituye al municipio: organiza evidencia para que ciudadanía, funcionarios y empresas entiendan qué se pierde, qué se puede recuperar y qué falta verificar.
            </p>
          </blockquote>

          <p className="text-[16px] text-[#6B6760] leading-[1.7] mb-5">
            Tirar la basura parece una acción pequeña, casi automática. Detrás de esa bolsa hay personas, camiones, rutas,
            rellenos sanitarios, recolectores de base, operadores privados y autoridades municipales. Cuando todo llega mezclado,
            separar se vuelve más caro, más riesgoso y menos eficiente.
          </p>

          <p className="text-[16px] text-[#6B6760] leading-[1.7] mb-8">
            La propuesta de ALQUIMIA es convertir la separación desde vivienda, oficina, hotel, comercio y empresa en una práctica
            estructurada, medible y trazable. Primero educación y diagnóstico; luego operación, costos, fuentes, rutas y propuestas
            de política pública que cada municipio debe revisar conforme a su propia historia y madurez.
          </p>

          {/* Stats con contexto */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-7 border-y border-[#E8E4DC] mb-8">
            <div>
              <p className="font-mono text-[28px] text-[#3B6D11] leading-none mb-2">80–120</p>
              <p className="text-[13px] font-medium text-[#1C1B18] mb-1">empleos formales nuevos</p>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">
                Pepenadores y operadores que hoy trabajan en la informalidad y pueden tener contrato, IMSS y salario fijo con un programa de separación.
              </p>
            </div>
            <div>
              <p className="font-mono text-[28px] text-[#3B6D11] leading-none mb-2">15–40%</p>
              <p className="text-[13px] font-medium text-[#1C1B18] mb-1">menos basura al relleno</p>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">
                Rango según captura y pureza en el modelo; con separación en 5 fracciones buena parte de lo que hoy se entierra puede recuperarse, venderse o compostarse.
              </p>
            </div>
            <div>
              <p className="font-mono text-[28px] text-[#3B6D11] leading-none mb-2">{fmt.mxnM(ingresoAnual)}</p>
              <p className="text-[13px] font-medium text-[#1C1B18] mb-1">MXN/año (ingresos brutos modelados)</p>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">
                Promedio anual con el escenario por defecto del simulador para la ZM (precios y captura de referencia; no constituye promesa de ingreso).
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#A8A49C] leading-relaxed mb-6">
            Cifras RSU e ingreso enlazadas al mismo motor que el simulador; población ZM y kg/hab·día son supuestos revisables en la aplicación.
          </p>

          <p className="text-[14px] text-[#6B6760] leading-[1.7] mb-4">
            El sistema genera el diagnóstico jurídico del municipio, la iniciativa de reforma al reglamento de limpia, el modelo de concesión para centros de acopio, el plan de implementación por fases y el reporte ejecutivo para presidencia — los borradores asistidos tardan minutos de cómputo; el calendario político e institucional sigue siendo el del municipio.
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
          <p className="text-[11px] uppercase tracking-widest text-[#A8A49C] mb-2 text-center">Después del acceso institucional</p>
          <h2 className="font-serif text-[28px] text-center text-[#1C1B18] mb-10">Componentes operativos de la plataforma</h2>
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
            Modelo técnico de apoyo para planeación municipal; no sustituye actos de autoridad
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
