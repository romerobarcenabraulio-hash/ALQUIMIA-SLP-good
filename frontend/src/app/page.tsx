'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Recycle, BarChart2, FileText, Globe, ArrowRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const MODULOS: Array<{ ruta: string; Icon: LucideIcon; titulo: string; desc: string }> = [
  { ruta: '/simulator', Icon: BarChart2, titulo: 'Simulador', desc: 'Captura, costos y TIR en la misma mesa —ajustas supuestos y ves el impacto en Cabildo.' },
  { ruta: '/ca-studio',  Icon: Recycle,   titulo: 'CA-Studio', desc: 'Diseña centros de acopio con pie y claridad: cubicación, CAPEX y la derrama que requiere el convenio.' },
  { ruta: '/hub',        Icon: FileText,  titulo: 'Hub documental', desc: 'Paquetes listos para sesión: marco legal, modelo financiero y slides —no son dictamen, son borrador defendible.' },
  { ruta: '/aprende',    Icon: Globe,     titulo: 'Centro educativo', desc: 'Secuencias breves para vecinos y comités —explican la lógica de las cinco fracciones sin hablar de “app”.' },
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

function FlujoCicloSVG() {
  return (
    <svg
      viewBox="0 0 720 140"
      className="w-full max-w-[680px] mx-auto mb-8"
      role="img"
      aria-label="Flujo: residuo doméstico → separación en 5 fracciones → centro de acopio → ingreso municipal"
    >
      {/* Nodo 1: Casa / Residuo */}
      <g transform="translate(60,70)">
        <circle r="38" fill="#F0EDE5" stroke="#E8E4DC" strokeWidth="1.5" />
        <text y="-10" textAnchor="middle" fontSize="26">🏠</text>
        <text y="24" textAnchor="middle" fontSize="9" fill="#6B6760" fontFamily="system-ui">Residuo</text>
        <text y="35" textAnchor="middle" fontSize="9" fill="#6B6760" fontFamily="system-ui">doméstico</text>
      </g>
      {/* Flecha 1→2 */}
      <path d="M100,70 L168,70" stroke="#3B6D11" strokeWidth="2" markerEnd="url(#arrow)" />

      {/* Nodo 2: Separación 5 fracciones */}
      <g transform="translate(220,70)">
        <circle r="44" fill="#EAF3DE" stroke="#3B6D11" strokeWidth="1.5" />
        <text y="-12" textAnchor="middle" fontSize="24">♻️</text>
        <text y="18" textAnchor="middle" fontSize="9" fill="#3B6D11" fontFamily="system-ui" fontWeight="600">5 fracciones</text>
        <text y="30" textAnchor="middle" fontSize="8" fill="#6B6760" fontFamily="system-ui">orgánico · PET</text>
        <text y="40" textAnchor="middle" fontSize="8" fill="#6B6760" fontFamily="system-ui">vidrio · papel · Al</text>
      </g>
      {/* Flecha 2→3 */}
      <path d="M266,70 L340,70" stroke="#3B6D11" strokeWidth="2" markerEnd="url(#arrow)" />

      {/* Nodo 3: Centro de acopio */}
      <g transform="translate(392,70)">
        <circle r="44" fill="#FEF7E7" stroke="#D4881E" strokeWidth="1.5" />
        <text y="-12" textAnchor="middle" fontSize="24">🏭</text>
        <text y="18" textAnchor="middle" fontSize="9" fill="#8B5A00" fontFamily="system-ui" fontWeight="600">Centro de</text>
        <text y="30" textAnchor="middle" fontSize="9" fill="#8B5A00" fontFamily="system-ui" fontWeight="600">acopio</text>
      </g>
      {/* Flecha 3→4 */}
      <path d="M438,70 L512,70" stroke="#D4881E" strokeWidth="2" markerEnd="url(#arrow-orange)" />

      {/* Nodo 4: Ingreso municipal */}
      <g transform="translate(564,70)">
        <circle r="44" fill="#1C1B18" stroke="#1C1B18" strokeWidth="1.5" />
        <text y="-12" textAnchor="middle" fontSize="24">💰</text>
        <text y="18" textAnchor="middle" fontSize="9" fill="white" fontFamily="system-ui" fontWeight="600">Ingreso</text>
        <text y="30" textAnchor="middle" fontSize="9" fill="white" fontFamily="system-ui" fontWeight="600">municipal</text>
      </g>

      {/* Defs flechas */}
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B6D11" />
        </marker>
        <marker id="arrow-orange" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#D4881E" />
        </marker>
      </defs>
    </svg>
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
              Propuesta técnica para cabildos —circularidad municipal con números defendibles, no marketing de software
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

        {/* Columna izquierda: flujo visual + artículo */}
        <div className="max-w-2xl flex flex-col">
          <div className="w-full overflow-x-auto">
            <FlujoCicloSVG />
          </div>

        <article>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#3B6D11] mb-5 font-medium">
            Circularidad municipal —lenguaje de cabildo
          </p>

          <h1 className="font-serif text-[36px] sm:text-[48px] leading-[1.07] tracking-[-0.025em] text-[#1C1B18] mb-7">
            La Zona Metropolitana de San Luis Potosí genera 1,850 toneladas diarias de residuos sólidos urbanos. Hoy, la totalidad se destina a relleno sanitario.
          </h1>

          <p className="text-[16px] text-[#1C1B18] leading-[1.7] mb-5">
            Eso representa entre $446 y $494 millones de pesos en valor económico recuperable que se entierra cada año. ALQUIMIA es el instrumento técnico que permite a cualquier municipio diseñar, simular y presentar ante Cabildo un programa de separación obligatoria en cinco fracciones: orgánicos, papel, plásticos, vidrio y aluminio. No es un software genérico: cada escenario está anclado al reglamento vigente del municipio, a precios reales de recicladora y a la estructura operativa de su concesionario actual.
          </p>

          <p className="text-[16px] text-[#1C1B18] leading-[1.7] mb-6">
            Un programa bien ejecutado en la ZM SLP genera 168 empleos formales directos desde la Fase 1, evita 533,178 toneladas de CO₂ equivalente al año y transforma a los recolectores de base en trabajadores con contrato y nómina. El modelo financiero calcula TIR, VPN y payback por tamaño de centro de acopio.
          </p>

          <h2 className="font-serif text-[22px] text-[#1C1B18] mb-3 mt-10">Tres puertas de entrada</h2>
          <div className="space-y-5 mb-10">
            <div>
              <h3 className="text-[14px] font-semibold text-[#1C1B18] mb-1">El funcionario público</h3>
              <p className="text-[15px] text-[#6B6760] leading-[1.7]">
                Diseña el programa y genera el paquete para Cabildo: diagnóstico jurídico, minuta de reforma, números de captura y calendario de implementación.
              </p>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#1C1B18] mb-1">El empresario</h3>
              <p className="text-[15px] text-[#6B6760] leading-[1.7]">
                Evalúa la viabilidad de operar un centro de acopio o negociar su concesión. La mesa con el alcalde deja de ser discurso —es tabla de VPN y sensibilidad.
              </p>
            </div>
            <div>
              <h3 className="text-[14px] font-semibold text-[#1C1B18] mb-1">El ciudadano</h3>
              <p className="text-[15px] text-[#6B6760] leading-[1.7]">
                Entiende por qué separar conviene y qué le toca hacer. La educación no sustituye el reglamento —lo hace legible y exigible.
              </p>
            </div>
          </div>

          {/* Indicadores anclados a ZM SLP —fuente: Capítulo SLP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 py-7 border-y border-[#E8E4DC] mb-8">
            <div>
              <p className="font-serif text-[20px] text-[#3B6D11] leading-tight mb-2">168</p>
              <p className="text-[13px] font-medium text-[#1C1B18] mb-1">Empleos formales directos</p>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">
                Generados desde la Fase 1 del programa en la ZM SLP. Recolectores de base con contrato y nómina.
              </p>
            </div>
            <div>
              <p className="font-serif text-[20px] text-[#3B6D11] leading-tight mb-2">533 mil t</p>
              <p className="text-[13px] font-medium text-[#1C1B18] mb-1">CO₂ eq. evitadas/año</p>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">
                Estimado del modelo para la ZM SLP con separación en cinco fracciones en régimen maduro.
              </p>
            </div>
            <div>
              <p className="font-serif text-[20px] text-[#3B6D11] leading-tight mb-2">$446–494 M</p>
              <p className="text-[13px] font-medium text-[#1C1B18] mb-1">Valor recuperable al año</p>
              <p className="text-[12px] text-[#6B6760] leading-relaxed">
                En materiales que hoy se entierran. El simulador desagrega por fracción, precio y municipio activo.
              </p>
            </div>
          </div>

          <p className="text-[17px] font-serif text-[#1C1B18] leading-[1.55] mb-6 border-l-4 border-[#D4881E] pl-5">
            El siguiente paso es la aprobación en Cabildo. ALQUIMIA prepara todo lo que necesitas para llegar a esa sesión con un expediente defendible.
          </p>

          <p className="text-[13px] text-[#A8A49C] leading-relaxed border-t border-[#E8E4DC] pt-5 mt-6">
            Las cifras de empleo, CO₂ y valor económico corresponden al escenario de referencia ZM SLP del modelo —no son dictamen municipal ni acto de autoridad. Cada corrida del simulador actualiza los resultados con los supuestos que elijas.
          </p>
        </article>
        </div>

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
          <h2 className="font-serif text-[28px] text-center text-[#1C1B18] mb-10">Expediente vivo —del número a la sesión de cabildo</h2>
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
            Circularidad municipal —modelo y borradores, no resolución administrativa
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
