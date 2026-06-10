'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Save, User, Building2, Shield, AlertCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'
import { useAlquimiaToken } from '@/lib/useAlquimiaToken'

interface UserProfile {
  id: string
  nombre: string
  email: string
  rol: string
  cargo: string
  telefono: string | null
  municipio_nombre: string | null
  estado_mx: string | null
  municipio_id: string | null
  onboarding_completed: boolean
  reglamento_uploaded: boolean
}

function authHeaders(): HeadersInit {
  const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function rolLabel(rol: string): string {
  const map: Record<string, string> = {
    admin: 'Administrador de plataforma',
    analista: 'Analista ALQUIMIA',
    director: 'Director municipal',
    coordinador: 'Coordinador',
    funcionario: 'Funcionario municipal',
    observer: 'Observador',
  }
  return map[rol] ?? rol
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  readOnly = false,
  hint,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  type?: string
  readOnly?: boolean
  hint?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wide text-[#6B6760]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        className={`mt-1 w-full rounded-[8px] border px-3 py-2 text-[13px] outline-none transition-colors ${
          readOnly
            ? 'border-[#E8E4DC] bg-[#F4F2ED] text-[#8E8980] cursor-default'
            : 'border-[#E8E4DC] bg-white text-[#1C1B18] focus:border-[#3B6D11] focus:ring-1 focus:ring-[#3B6D11]/20'
        }`}
      />
      {hint && <p className="mt-1 text-[10px] text-[#9E9B96]">{hint}</p>}
    </div>
  )
}

export default function PerfilPage() {
  const router = useRouter()
  const { token: bridgedToken, loading: tokenLoading } = useAlquimiaToken()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [form, setForm] = useState({ nombre: '', apellido_paterno: '', cargo: '', telefono: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (tokenLoading) return
    const token = bridgedToken
    if (!token) { router.replace('/sign-in'); return }

    fetch(`${getApiUrl()}/auth/me`, { headers: authHeaders() })
      .then(r => r.ok ? r.json() : Promise.reject('No autorizado'))
      .then((data: UserProfile) => {
        setProfile(data)
        const parts = data.nombre.split(' ')
        setForm({
          nombre: parts[0] ?? '',
          apellido_paterno: parts.slice(1).join(' ') ?? '',
          cargo: data.cargo ?? '',
          telefono: data.telefono ?? '',
        })
      })
      .catch(() => router.replace('/sign-in'))
      .finally(() => setLoading(false))
  }, [router, bridgedToken, tokenLoading])

  async function save() {
    if (!profile) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`${getApiUrl()}/auth/me`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido_paterno: form.apellido_paterno.trim(),
          cargo: form.cargo.trim(),
          telefono: form.telefono.trim() || null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).detail ?? 'Error al guardar')
      const updated: UserProfile = await res.json()
      setProfile(updated)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    localStorage.removeItem('alquimia_token')
    router.replace('/sign-in')
  }

  if (loading) {
    return (
      <AppShell>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B6D11] border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!profile) return null

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="font-serif text-[26px] font-semibold text-[#1C1B18]">Perfil</h1>
            <p className="mt-1 text-[13px] text-[#6B6760]">{rolLabel(profile.rol)}</p>
          </div>
          <button
            onClick={logout}
            className="rounded-[8px] border border-[#E8E4DC] px-3 py-1.5 text-[12px] text-[#6B6760] hover:border-red-200 hover:text-red-600 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>

        {/* Municipio context */}
        {profile.municipio_nombre && (
          <div className="mb-6 flex items-center gap-3 rounded-[12px] border border-[#C9DDB1] bg-[#EAF3DE] px-4 py-3">
            <Building2 size={16} className="shrink-0 text-[#3B6D11]" />
            <div>
              <p className="text-[13px] font-semibold text-[#2D5409]">{profile.municipio_nombre}</p>
              <p className="text-[11px] text-[#4A7C23]">{profile.estado_mx} · ID {profile.municipio_id}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-[11px] text-[#4A7C23]">
              <CheckCircle2 size={12} />
              {profile.onboarding_completed ? 'Onboarding completo' : 'Validación en curso'}
            </div>
          </div>
        )}

        {/* Editable fields */}
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <User size={14} className="text-[#3B6D11]" />
            <h2 className="text-[13px] font-semibold text-[#1C1B18]">Datos personales</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Nombre"
              value={form.nombre}
              onChange={v => setForm(f => ({ ...f, nombre: v }))}
            />
            <Field
              label="Apellido"
              value={form.apellido_paterno}
              onChange={v => setForm(f => ({ ...f, apellido_paterno: v }))}
            />
            <Field
              label="Cargo"
              value={form.cargo}
              onChange={v => setForm(f => ({ ...f, cargo: v }))}
            />
            <Field
              label="Teléfono"
              value={form.telefono}
              onChange={v => setForm(f => ({ ...f, telefono: v }))}
              type="tel"
            />
            <Field
              label="Correo electrónico"
              value={profile.email}
              readOnly
              hint="El correo no puede modificarse"
            />
            <Field
              label="Rol en plataforma"
              value={rolLabel(profile.rol)}
              readOnly
              hint="Asignado por administrador"
            />
          </div>

          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-[8px] border border-red-200 bg-red-50 px-3 py-2">
              <AlertCircle size={13} className="shrink-0 text-red-500" />
              <p className="text-[12px] text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-[8px] bg-[#3B6D11] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2D5409] disabled:opacity-60 transition-colors"
            >
              <Save size={13} />
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-[12px] text-[#3B6D11]">
                <CheckCircle2 size={13} />
                Guardado
              </span>
            )}
          </div>
        </div>

        {/* Account security */}
        <div className="mt-4 rounded-[12px] border border-[#E8E4DC] bg-white p-6">
          <div className="mb-3 flex items-center gap-2">
            <Shield size={14} className="text-[#3B6D11]" />
            <h2 className="text-[13px] font-semibold text-[#1C1B18]">Seguridad</h2>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px] text-[#3B3326]">Contraseña</p>
              <p className="text-[11px] text-[#8E8980]">Mínimo 12 caracteres, no compartir</p>
            </div>
            <a
              href="/setup-2fa"
              className="rounded-[8px] border border-[#E8E4DC] px-3 py-1.5 text-[12px] text-[#3B3326] hover:border-[#3B6D11] transition-colors"
            >
              Cambiar
            </a>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
