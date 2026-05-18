'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, BarChart2, FileText, Recycle, Globe, CheckCircle2 } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { fmt } from '@/lib/utils'
import { landingZmSlpIngresosBrutosAnualMXN, landingZmSlpRsuTonDiaRange } from '@/lib/landingReferenceKpis'

// ─── Auth module ─────────────────────────────────────────────────────────────

type Tab = 'ingresar' | 'solicitar'

function AuthModule() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('ingresar')
  const [code, setCode] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoginError(null)
    setLoginLoading(true)
    try {
      const res = await fetch('/api/acceso', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) {
        router.push('/simulator')
      } else {
        setLoginError(data.error ?? 'Código incorrecto.')
      }
    } catch {
      setLoginError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoginLoading(false)
    }
  }

  const [form, setForm] = useState({ nombre: '', email: '', org: '', rol: '' })
  const [reqLoading, setReqLoading] = useState(false)
  const [reqDone, setReqDone] = useState(false)
  const [reqError, setReqError] = useState<string | null>(null)

  async function handleSolicitud(e: FormEvent) {
    e.preventDefault()
    setReqError(null)
    setReqLoading(true)
    await new Promise(r => setTimeout(r, 800))
    setReqLoading(false)
    setReqDone(true)
  }

  return (
    <div className="bg-white rounded-[16px] border border-[#E8E4DC] shadow-[0_4px_24px_rgba(28,27,24,0.09)] overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-[#F0EDE5]">
        <p className="text-[11px] uppercase tracking-[0.1em] text-[#A8A49C] mb-1">Acceso institucional</p>
        <p className="text-[14px] font-medium text-[#1C1B18]">Plataforma de Circularidad Municipal</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#F0EDE5]">
        {(['ingresar', 'solicitar'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={[
              'flex-1 py-2.5 text-[12px] font-medium transition-colors',
              tab === t
                ? 'text-[#3B6D11] border-b-2 border-[#3B6D11] bg-[#F6FAF0]'
                : 'text-[#6B6760] hover:bg-[#FDFCFA]',
            ].join(' ')}
          >
            {t === 'ingresar' ? 'Iniciar sesión' : 'Solicitar acceso'}
          </button>
        ))}
      </div>

      <div className="px-6 py-6">
        {tab === 'ingresar' && (
          <form onSubmit={e => void handleLogin(e)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="access-code" className="block text-[11px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1.5">
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
                className="w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2.5 text-[13px] text-[#1C1B18] placeholder:text-[#C8C4BC] focus:border-[#3B6D11] focus:outline-none focus:ring-1 focus:ring-[#3B6D11]/40 transition-colors"
              />
            </div>
            {loginError && (
              <p className="text-[12px] text-[#C0392B] bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">
                {loginError}
              </p>
            )}
            <button
              type="submit"
              disabled={loginLoading || !code}
              className="w-full rounded-[8px] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#2D5409] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loginLoading ? (
                'Verificando…'
              ) : (
                <>Ingresar a la plataforma <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
            <p className="text-center text-[11px] text-[#A8A49C]">
              ¿Sin código?{' '}
              <button type="button" onClick={() => setTab('solicitar')} className="text-[#3B6D11] hover:underline">
                Solicitar acceso institucional
              </button>
            </p>
          </form>
        )}

        {tab === 'solicitar' && !reqDone && (
          <form onSubmit={e => void handleSolicitud(e)} className="flex flex-col gap-3">
            <p className="text-[12px] text-[#6B6760] leading-relaxed">
              Completa el formulario y te enviamos tu código en menos de 24 h.
            </p>
            {([
              { id: 'nombre', label: 'Nombre completo', placeholder: 'Tu nombre', type: 'text' },
              { id: 'email', label: 'Correo institucional', placeholder: 'nombre@municipio.gob.mx', type: 'email' },
              { id: 'org', label: 'Municipio u organización', placeholder: 'Nombre del ayuntamiento', type: 'text' },
              { id: 'rol', label: 'Cargo o función', placeholder: 'Dirección de Servicios Públicos…', type: 'text' },
            ] as const).map(f => (
              <div key={f.id}>
                <label htmlFor={`req-${f.id}`} className="block text-[11px] uppercase tracking-[0.08em] text-[#A8A49C] mb-1">
                  {f.label}
                </label>
                <input
                  id={`req-${f.id}`}
                  type={f.type}
                  placeholder={f.placeholder}
                  required
                  value={form[f.id as keyof typeof form]}
                  onChange={e => setForm(p => ({ ...p, [f.id]: e.target.value }))}
                  className="w-full rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] text-[#1C1B18] placeholder:text-[#C8C4BC] focus:border-[#3B6D11] focus:outline-none focus:ring-1 focus:ring-[#3B6D11]/40 transition-colors"
                />
              </div>
            ))}
            {reqError && (
              <p className="text-[12px] text-[#C0392B] bg-red-50 border border-red-200 rounded-[8px] px-3 py-2">{reqError}</p>
            )}
            <button
              type="submit"
              disabled={reqLoading}
              className="w-full rounded-[8px] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#2D5409] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-1"
            >
              {reqLoading ? 'Enviando…' : 'Solicitar acceso'}
            </button>
          </form>
        )}

        {tab === 'solicitar' && reqDone && (
          <div className="text-center py-4">
            <div className="w-12 h-12 rounded-full bg-[#EAF3DE] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#3B6D11]" />
            </div>
            <p className="font-serif text-[17px] text-[#1C1B18] mb-2">Solicitud recibida</p>
            <p className="text-[12px] text-[#6B6760] leading-relaxed max-w-xs mx-auto">
              Te enviamos tu código a <strong className="text-[#1C1B18]">{form.email}</strong> en menos de 24 horas.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Module cards ─────────────────────────────────────────────────────────────

const MODULOS: Array<{
  num: string
  ruta: string
  Icon: LucideIcon
  titulo: string
  desc: string
  tag: string
}> = [
  {
    num: '01',
    ruta: '/simulator',
    Icon: BarChart2,
    titulo: 'Simulador',
    desc: 'Proyecciones RSU, finanzas, centros de acopio e impacto ambiental para el municipio activo.',
    tag: 'Funcionario · Ciudadano · Empresario',
  },
  {
    num: '02',
    ruta: '/ca-studio',
    Icon: Recycle,
    titulo: 'CA-Studio',
    desc: 'Diseña centros de acopio en escala urbana con proyecciones de CAPEX, OPEX y TIR.',
    tag: 'Infraestructura',
  },
  {
    num: '03',
    ruta: '/hub',
    Icon: FileText,
    titulo: 'Hub de documentos',
    desc: 'Paquetes ÁGORA: marco legal, modelo financiero y piezas para presentar ante Cabildo.',
    tag: 'Exportables',
  },
  {
    num: '04',
    ruta: '/aprende',
    Icon: Globe,
    titulo: 'Centro educativo',
    desc: 'Flujos divulgativos sin cuenta: separación, composición RSU y economía circular.',
    tag: 'Acceso libre',
  },
]

// ─── Landing page ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const rsuZm = landingZmSlpRsuTonDiaRange()
  const ingresoAnual = landingZmSlpIngresosBrutosAnualMXN()

  return (
    <div className="min-h-screen" style={{ background: '#F4F2ED' }}>
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <header className="bg-[#1C2B15] border-b border-[#2D4020] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-[18px] text-white font-semibold tracking-tight">ALQUIMIA</span>
            <span className="hidden sm:block text-[11px] text-[#6A9A50] border-l border-[#2D4020] pl-3">
              Plataforma de Circularidad Municipal
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-1 text-[12px]">
            {[
              { href: '/aprende', label: 'Aprende' },
              { href: '/simulator', label: 'Simulador' },
              { href: '/hub', label: 'Documentos' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 rounded-[6px] text-[#A8C898] hover:text-white hover:bg-[#2D4020] transition-colors"
              >
                {label}
              </Link>
            ))}
            <Link
              href="/acceso"
              className="ml-2 px-4 py-1.5 rounded-[6px] bg-[#3B6D11] text-white text-[12px] font-medium hover:bg-[#4A8A16] transition-colors"
            >
              Acceso institucional
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero section ────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-5 pt-16 pb-14 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-12 lg:gap-14 items-start">
        {/* Left: editorial */}
        <div className="max-w-2xl">
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF3DE] text-[#3B6D11] text-[11px] font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B6D11]" />
              San Luis Potosí · ZM activa
            </span>
            <span className="text-[11px] text-[#8A857C]">Programa de separación en 5 fracciones</span>
          </div>

          {/* Headline */}
          <h1 className="font-serif text-[40px] sm:text-[52px] leading-[1.05] text-[#1C1B18] mb-6">
            Convierte los residuos de tu municipio en{' '}
            <span className="text-[#3B6D11]">datos, decisiones y recursos</span>
          </h1>

          <p className="text-[16px] text-[#4A4642] leading-[1.75] mb-8">
            ALQUIMIA organiza la evidencia técnica que funcionarios, ciudadanos y empresas necesitan para entender qué se pierde,
            qué puede recuperarse y qué falta verificar — sin reemplazar la autoridad municipal.
          </p>

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-px bg-[#E8E4DC] rounded-[12px] overflow-hidden mb-10 border border-[#E8E4DC]">
            {[
              {
                value: `${fmt.num0(rsuZm.min)}–${fmt.num0(rsuZm.max)}`,
                unit: 't/día',
                label: 'RSU generado (ZM SLP)',
                color: 'text-[#1C1B18]',
              },
              {
                value: fmt.mxnM(ingresoAnual),
                unit: 'MXN/año',
                label: 'Ingresos brutos modelados',
                color: 'text-[#3B6D11]',
              },
              {
                value: '80–120',
                unit: 'empleos',
                label: 'Formales directos (est.)',
                color: 'text-[#1A5FA8]',
              },
            ].map(k => (
              <div key={k.label} className="bg-white px-4 py-4">
                <p className={`font-mono text-[22px] font-semibold leading-none mb-0.5 ${k.color}`}>
                  {k.value}
                </p>
                <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-1">{k.unit}</p>
                <p className="text-[11px] text-[#6B6760] leading-snug">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <blockquote className="border-l-[3px] border-[#3B6D11] pl-5 mb-8">
            <p className="font-serif text-[19px] text-[#1C1B18] leading-[1.5] italic">
              El sistema genera diagnóstico jurídico, modelo de concesión, plan de implementación por fases y reporte para presidencia
              — los borradores asistidos tardan minutos; el calendario político sigue siendo el del municipio.
            </p>
          </blockquote>

          {/* Disclaimer */}
          <p className="text-[11px] text-[#A8A49C] leading-relaxed border-t border-[#E8E4DC] pt-5">
            Cifras enlazadas al mismo motor que el simulador · población ZM y kg/hab·día son supuestos revisables · no constituyen estadística oficial ni promesa de ingreso.
          </p>
        </div>

        {/* Right: auth */}
        <div className="lg:sticky lg:top-20">
          <AuthModule />
          <p className="text-[11px] text-[#8A857C] text-center mt-3 leading-relaxed">
            El recorrido institucional inicia seleccionando audiencia tras el acceso.
          </p>
        </div>
      </section>

      {/* ── Modules grid ────────────────────────────────────────────────────── */}
      <section className="border-t border-[#E8E4DC] bg-white py-16">
        <div className="max-w-7xl mx-auto px-5">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-10">
            <div>
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#A8A49C] mb-1">Componentes de la plataforma</p>
              <h2 className="font-serif text-[28px] text-[#1C1B18]">Herramientas disponibles tras el acceso</h2>
            </div>
            <Link
              href="/simulator"
              className="shrink-0 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3B6D11] border border-[#3B6D11] px-4 py-2 rounded-[8px] hover:bg-[#EAF3DE] transition-colors"
            >
              Abrir simulador <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {MODULOS.map(({ num, ruta, Icon, titulo, desc, tag }) => (
              <Link
                key={ruta}
                href={ruta}
                className="group relative bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-6 hover:border-[#3B6D11]/40 hover:shadow-[0_4px_16px_rgba(59,109,17,0.08)] transition-all flex flex-col gap-4"
              >
                {/* Number badge */}
                <span className="absolute top-4 right-4 font-mono text-[11px] text-[#C8C4BC] font-medium">{num}</span>

                {/* Icon */}
                <div className="w-10 h-10 rounded-[10px] bg-[#EAF3DE] flex items-center justify-center group-hover:bg-[#D4EAB8] transition-colors">
                  <Icon className="w-5 h-5 text-[#3B6D11]" strokeWidth={1.75} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <h3 className="text-[14px] font-semibold text-[#1C1B18] mb-2 group-hover:text-[#3B6D11] transition-colors">
                    {titulo}
                  </h3>
                  <p className="text-[12px] text-[#6B6760] leading-relaxed">{desc}</p>
                </div>

                {/* Tag */}
                <span className="inline-block text-[10px] text-[#A8A49C] bg-[#F0EDE5] px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works strip ──────────────────────────────────────────────── */}
      <section className="bg-[#1C2B15] py-14">
        <div className="max-w-7xl mx-auto px-5">
          <p className="text-[11px] uppercase tracking-[0.1em] text-[#6A9A50] mb-2 text-center">Cadena del modelo</p>
          <h2 className="font-serif text-[24px] text-white text-center mb-10">
            De supuestos municipales a decisiones trazables
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { n: '1', label: 'Supuestos editables', sub: 'Municipio, horizonte, generación per cápita' },
              { n: '2', label: 'Trayectoria de captura', sub: '% y velocidad por año' },
              { n: '3', label: 'Toneladas capturadas', sub: 'Resultado del modelo' },
              { n: '4', label: 'Impactos acumulados', sub: 'Ambiental, salud, económico' },
              { n: '5', label: 'Comparación de escenarios', sub: 'Horizonte y trayectoria' },
              { n: '6', label: 'Recomendación', sub: 'Mejor equilibrio modelo' },
            ].map(step => (
              <div key={step.n} className="bg-[#243320] rounded-[10px] p-4">
                <span className="font-mono text-[20px] font-semibold text-[#5A9438] leading-none block mb-2">{step.n}</span>
                <p className="text-[12px] font-medium text-white mb-1">{step.label}</p>
                <p className="text-[11px] text-[#6A9A50] leading-snug">{step.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#E8E4DC] bg-white py-8">
        <div className="max-w-7xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[5px] bg-[#3B6D11] flex items-center justify-center">
              <Recycle className="w-3.5 h-3.5 text-white" strokeWidth={2} />
            </div>
            <span className="font-serif text-[16px] text-[#3B6D11]">ALQUIMIA</span>
          </div>
          <p className="text-[11px] text-[#A8A49C] text-center max-w-sm">
            Modelo técnico de apoyo para planeación municipal · no sustituye actos de autoridad
          </p>
          <nav className="flex gap-5 text-[11px] text-[#6B6760]">
            <Link href="/aprende" className="hover:text-[#3B6D11]">Aprende</Link>
            <Link href="/simulator" className="hover:text-[#3B6D11]">Simulador</Link>
            <Link href="/hub" className="hover:text-[#3B6D11]">Hub</Link>
            <Link href="/acceso" className="hover:text-[#3B6D11]">Acceso</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
