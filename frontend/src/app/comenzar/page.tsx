'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PublicPageShell } from '@/components/public/PublicPageShell'
import { authRegister } from '@/lib/authApi'
import { isInstitutionalDomain } from '@/lib/institutionalDomains'

type FormState = {
  estado: string
  municipio: string
  nombre: string
  cargo: string
  email: string
  telefono: string
  institucion: string
  password: string
}

const initialForm: FormState = {
  estado: '',
  municipio: '',
  nombre: '',
  cargo: '',
  email: '',
  telefono: '',
  institucion: '',
  password: '',
}

function municipalityRegistrationCountKey(estado: string, municipio: string) {
  return `alquimia.registrationCount.${estado.trim().toLowerCase()}.${municipio.trim().toLowerCase()}`
}

export default function ComenzarPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(initialForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')

    if (!form.estado || !form.municipio || !form.cargo || !form.email || !form.nombre || !form.password) {
      setError('Completa estado, municipio, nombre, cargo, correo y contraseña.')
      return
    }

    const key = municipalityRegistrationCountKey(form.estado, form.municipio)
    const currentCount = Number(localStorage.getItem(key) ?? '0')
    if (currentCount >= 5) {
      setError('Este municipio alcanzó el límite inicial de 5 solicitudes. Requiere validación founder/admin.')
      return
    }

    setLoading(true)
    try {
      const [nombre, ...apellidos] = form.nombre.trim().split(/\s+/)
      await authRegister({
        email: form.email,
        password: form.password,
        nombre: nombre || form.nombre,
        apellido_paterno: apellidos[0] ?? 'Pendiente',
        apellido_materno: apellidos.slice(1).join(' ') || undefined,
        telefono: form.telefono || '4441234567',
        cargo: form.cargo,
        dependencia: form.institucion,
        municipio_nombre: form.municipio,
        estado_mx: form.estado,
      })
      localStorage.setItem(key, String(currentCount + 1))
      const destAfterReg = `/comenzar/propuesta?municipio=${encodeURIComponent(form.municipio)}&estado=${encodeURIComponent(form.estado)}`
      router.push(isInstitutionalDomain(form.email) ? destAfterReg : '/pendiente-validacion')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PublicPageShell actionLabel="Metodología" actionHref="/metodologia">
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div className="flex flex-col justify-center">
          <p className="mb-3 text-[12px] font-semibold uppercase text-[#6B6760]">Acceso institucional</p>
          <h1 className="font-serif text-[46px] leading-tight text-[#1C1B18]">
            Ver el diagnóstico para mi municipio.
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-7 text-[#4A4740]">
            Crea una cuenta para solicitar la preparación preliminar. El alta de municipio oficial
            requiere validación humana; una cuenta nueva no convierte datos en oficiales.
          </p>
          <p className="mt-5 max-w-xl text-[13px] leading-6 text-[#6B6760]">
            Correos institucionales pueden pasar a preparación preliminar. Correos genéricos quedan
            pendientes de validación manual.
          </p>
        </div>

        <form onSubmit={submit} className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Estado" value={form.estado} onChange={value => update('estado', value)} required />
            <Field label="Municipio" value={form.municipio} onChange={value => update('municipio', value)} required />
            <Field label="Nombre completo" value={form.nombre} onChange={value => update('nombre', value)} required />
            <Field label="Cargo" value={form.cargo} onChange={value => update('cargo', value)} required />
            <Field label="Correo" type="email" value={form.email} onChange={value => update('email', value)} required />
            <Field label="Teléfono opcional" value={form.telefono} onChange={value => update('telefono', value)} />
            <Field label="Institución opcional" value={form.institucion} onChange={value => update('institucion', value)} />
            <Field label="Contraseña" type="password" value={form.password} onChange={value => update('password', value)} required minLength={12} />
          </div>

          {error && <p className="mt-4 rounded-[6px] border border-[#EBC0BA] bg-[#FBEAEA] px-3 py-2 text-[12px] text-[#A8322A]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded-[8px] bg-[#1C2B15] px-4 py-3 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta y solicitar diagnóstico'}
          </button>
          {form.municipio && form.estado && (
            <div className="mt-3 rounded-[6px] border border-[#D8F0C8] bg-[#F2FAF0] px-3 py-2 text-center">
              <Link
                href={`/comenzar/propuesta?municipio=${encodeURIComponent(form.municipio)}&estado=${encodeURIComponent(form.estado)}`}
                className="text-[12px] font-semibold text-[#3B6D11] hover:underline"
              >
                Ver propuesta personalizada para {form.municipio} →
              </Link>
            </div>
          )}
          <p className="mt-4 text-center text-[12px] text-[#6B6760]">
            ¿Ya tienes cuenta? <Link href="/sign-in" className="font-semibold text-[#2F5B0D]">Iniciar sesión</Link>
          </p>
        </form>
      </section>
    </PublicPageShell>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  minLength,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  minLength?: number
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-semibold text-[#5C574F]">{label}</span>
      <input
        value={value}
        onChange={event => onChange(event.target.value)}
        type={type}
        required={required}
        minLength={minLength}
        className="w-full rounded-[8px] border border-[#D8D2C5] bg-white px-3 py-2 text-[14px] outline-none focus:border-[#3B6D11]"
      />
    </label>
  )
}
