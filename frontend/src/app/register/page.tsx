'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { authRegister } from '@/lib/authApi'

function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [emailSent, setEmailSent] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const fd = new FormData(e.currentTarget)
    try {
      const res = await authRegister({
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
        nombre: String(fd.get('nombre') ?? ''),
        apellido_paterno: String(fd.get('apellido_paterno') ?? ''),
        apellido_materno: String(fd.get('apellido_materno') ?? '') || undefined,
        telefono: String(fd.get('telefono') ?? '') || undefined,
        cargo: String(fd.get('cargo') ?? ''),
        dependencia: String(fd.get('dependencia') ?? ''),
        municipio_nombre: String(fd.get('municipio_nombre') ?? '') || undefined,
        estado_mx: String(fd.get('estado_mx') ?? '') || undefined,
        zm: String(fd.get('zm') ?? 'SLP') || 'SLP',
      })
      setEmailSent(res.email)
      setDone(true)
    }
    catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    }
    finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#F8F6F1' }}>
        <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-md shadow-md text-center">
          <h1 className="font-serif text-[24px] text-[#3B6D11] mb-3">Revisa tu correo</h1>
          <p className="text-[13px] text-[#4A4740] leading-relaxed mb-6">
            Enviamos un enlace de confirmación a <strong>{emailSent}</strong>.
            Después confirmarás tu identidad con un código TOTP (Google Authenticator, Authy, etc.).
          </p>
          <Link href="/login" className="text-[13px] text-[#3B6D11] hover:underline">Ir a iniciar sesión</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-lg shadow-md">
        <div className="text-center mb-6">
          <h1 className="font-serif text-[28px] text-[#3B6D11]">Crear cuenta</h1>
          <p className="text-[13px] text-[#6B6760] mt-1">Acceso institucional · verificación de correo + TOTP</p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              ['nombre', 'Nombre(s)', 'text', true],
              ['apellido_paterno', 'Apellido paterno', 'text', true],
              ['apellido_materno', 'Apellido materno', 'text', false],
              ['email', 'Correo institucional', 'email', true],
              ['telefono', 'Teléfono', 'tel', false],
              ['cargo', 'Cargo', 'text', true],
              ['dependencia', 'Dependencia / área', 'text', true],
              ['municipio_nombre', 'Municipio', 'text', false],
              ['estado_mx', 'Estado', 'text', false],
              ['zm', 'Zona metropolitana (código)', 'text', false],
            ] as const
          ).map(([name, label, type, required]) => (
            <div key={name} className={name === 'dependencia' || name === 'email' ? 'sm:col-span-2' : ''}>
              <label className="text-[11px] font-medium text-[#6B6760] block mb-1">{label}</label>
              <input
                name={name}
                type={type}
                required={required}
                defaultValue={name === 'zm' ? 'SLP' : undefined}
                className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2 text-[13px] bg-transparent focus:outline-none focus:border-[#3B6D11]"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="text-[11px] font-medium text-[#6B6760] block mb-1">Contraseña (mín. 10 caracteres)</label>
            <input
              name="password"
              type="password"
              required
              minLength={10}
              className="w-full border border-[#E8E4DC] rounded-[8px] px-3 py-2 text-[13px] bg-transparent focus:outline-none focus:border-[#3B6D11]"
            />
          </div>

          {error && (
            <p className="sm:col-span-2 text-[12px] text-[#C0392B] bg-[#FBEAEA] px-3 py-2 rounded-[6px]">{error}</p>
          )}

          <button type="submit" disabled={loading} className="sm:col-span-2 btn-primary w-full mt-1">
            {loading ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-5 text-center text-[12px] text-[#A8A49C]">
          ¿Ya tienes cuenta? <Link href="/login" className="text-[#3B6D11] hover:underline">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#A8A49C]">Cargando…</div>}>
      <RegisterForm />
    </Suspense>
  )
}
