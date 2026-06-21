'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Plus, Trash2, Edit2, Building2, Hospital, ShoppingCart, Users } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface Generador {
  id: string
  nombre: string
  tipo: string
  municipio: string
  estado_mx: string
  contacto_nombre?: string
  contacto_email?: string
  capacidad_generacion_ton_mes?: number
  activo: boolean
  verificado: boolean
  source: string
  created_at: string
}

const TIPO_ICONS: Record<string, React.ReactNode> = {
  empresa: <Building2 size={16} />,
  hospital: <Hospital size={16} />,
  hotel: <Building2 size={16} />,
  comercio: <ShoppingCart size={16} />,
  residencial: <Users size={16} />,
  industria: <Building2 size={16} />,
  construccion: <Building2 size={16} />,
  restaurante: <ShoppingCart size={16} />,
  escuela: <Users size={16} />,
  otro: <Building2 size={16} />,
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function GeneradoresContent() {
  const [generadores, setGeneradores] = useState<Generador[]>([])
  const [loading, setLoading] = useState(true)
  const [filterTipo, setFilterTipo] = useState('')
  const [filterActivo, setFilterActivo] = useState<boolean | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    tipo: 'empresa',
    municipio: '',
    estado_mx: '',
    contacto_nombre: '',
    contacto_email: '',
    contacto_telefono: '',
    capacidad_generacion_ton_mes: '',
  })
  const [saving, setSaving] = useState(false)

  const tenantId = typeof window !== 'undefined'
    ? sessionStorage.getItem('alquimia_active_tenant_id') || ''
    : ''

  async function loadGeneradores() {
    try {
      const params = new URLSearchParams()
      if (filterTipo) params.set('tipo', filterTipo)
      if (filterActivo !== null) params.set('activo', filterActivo.toString())

      const res = await fetch(`${getApiUrl()}/api/v1/generadores?${params}`, {
        headers: authHdr(),
      })
      const data = await res.json()
      setGeneradores(data.generadores || [])
    } catch (e) {
      console.error('Error loading generadores:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadGeneradores()
  }, [filterTipo, filterActivo, tenantId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/generadores`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({
          nombre: formData.nombre,
          tipo: formData.tipo,
          municipio: formData.municipio,
          estado_mx: formData.estado_mx,
          contacto_nombre: formData.contacto_nombre,
          contacto_email: formData.contacto_email,
          contacto_telefono: formData.contacto_telefono,
          capacidad_generacion_ton_mes: formData.capacidad_generacion_ton_mes ? parseFloat(formData.capacidad_generacion_ton_mes) : null,
        }),
      })
      if (res.ok) {
        setShowForm(false)
        setFormData({
          nombre: '',
          tipo: 'empresa',
          municipio: '',
          estado_mx: '',
          contacto_nombre: '',
          contacto_email: '',
          contacto_telefono: '',
          capacidad_generacion_ton_mes: '',
        })
        loadGeneradores()
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este generador?')) return
    try {
      await fetch(`${getApiUrl()}/api/v1/generadores/${id}`, {
        method: 'DELETE',
        headers: authHdr(),
      })
      loadGeneradores()
    } catch (e) {
      console.error('Error deleting:', e)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/hub" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Generadores de Residuos</h1>
          <p className="text-[13px] text-[#6B6760]">Empresas, hospitales y entidades en tu municipio</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-[8px] border border-[#3B6D11] bg-[#EAF3DE] px-3 py-2 text-[12px] font-semibold text-[#3B6D11] hover:bg-[#3B6D11] hover:text-white transition-colors"
          >
            <Plus size={14} />
            Agregar
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 rounded-[12px] border border-[#E8E4DC] bg-white p-4">
          <h2 className="mb-3 text-[13px] font-semibold text-[#1C1B18]">Nuevo Generador</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input
                type="text"
                placeholder="Nombre"
                required
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              />
              <select
                value={formData.tipo}
                onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              >
                <option value="empresa">Empresa</option>
                <option value="hospital">Hospital</option>
                <option value="hotel">Hotel</option>
                <option value="comercio">Comercio</option>
                <option value="residencial">Residencial</option>
                <option value="industria">Industria</option>
                <option value="construccion">Construcción</option>
              </select>
              <input
                type="text"
                placeholder="Municipio"
                required
                value={formData.municipio}
                onChange={e => setFormData({ ...formData, municipio: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              />
              <input
                type="text"
                placeholder="Estado"
                required
                value={formData.estado_mx}
                onChange={e => setFormData({ ...formData, estado_mx: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              />
              <input
                type="text"
                placeholder="Contacto"
                value={formData.contacto_nombre}
                onChange={e => setFormData({ ...formData, contacto_nombre: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.contacto_email}
                onChange={e => setFormData({ ...formData, contacto_email: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={formData.contacto_telefono}
                onChange={e => setFormData({ ...formData, contacto_telefono: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              />
              <input
                type="number"
                placeholder="Capacidad (ton/mes)"
                value={formData.capacidad_generacion_ton_mes}
                onChange={e => setFormData({ ...formData, capacidad_generacion_ton_mes: e.target.value })}
                className="rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2d5409] transition-colors disabled:opacity-40"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] text-[#6B6760] hover:bg-[#F0EDE5] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={filterTipo}
          onChange={e => setFilterTipo(e.target.value)}
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
        >
          <option value="">Todos los tipos</option>
          <option value="empresa">Empresa</option>
          <option value="hospital">Hospital</option>
          <option value="hotel">Hotel</option>
          <option value="comercio">Comercio</option>
          <option value="industria">Industria</option>
        </select>
        <select
          value={filterActivo === null ? '' : filterActivo ? 'true' : 'false'}
          onChange={e => setFilterActivo(e.target.value === '' ? null : e.target.value === 'true')}
          className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[12px] outline-none focus:border-[#3B6D11]"
        >
          <option value="">Todos los estados</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#3B6D11]" />
        </div>
      ) : (
        <div className="space-y-2">
          {generadores.map(g => (
            <div key={g.id} className="flex items-start gap-3 rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <span className="mt-1 text-[#3B6D11]">{TIPO_ICONS[g.tipo]}</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[13px] font-semibold text-[#1C1B18]">{g.nombre}</h3>
                <p className="text-[11px] text-[#6B6760]">{g.municipio} · {g.estado_mx}</p>
                {g.contacto_nombre && (
                  <p className="text-[10px] text-[#8E8980] mt-1">{g.contacto_nombre}</p>
                )}
                {g.capacidad_generacion_ton_mes && (
                  <p className="text-[10px] text-[#3B6D11] font-mono mt-1">{g.capacidad_generacion_ton_mes} ton/mes</p>
                )}
                <div className="mt-2 flex gap-2">
                  <span className={`text-[9px] font-semibold px-2 py-1 rounded-full ${g.activo ? 'bg-[#EAF3DE] text-[#2D5409]' : 'bg-[#F0EDE5] text-[#6B6760]'}`}>
                    {g.activo ? 'Activo' : 'Inactivo'}
                  </span>
                  {g.verificado && (
                    <span className="text-[9px] font-semibold px-2 py-1 rounded-full bg-[#E8F0FB] text-[#1A5FA8]">Verificado</span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#3B6D11] transition-colors"
                  title="Editar"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#FBEAEA] hover:text-[#C0392B] transition-colors"
                  title="Eliminar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}

          {generadores.length === 0 && (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-10 text-center">
              <p className="text-[13px] text-[#8E8980]">Sin generadores registrados.</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function GeneradoresPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3B6D11] border-t-transparent" />
        </div>
      }>
        <GeneradoresContent />
      </Suspense>
    </AppShell>
  )
}
