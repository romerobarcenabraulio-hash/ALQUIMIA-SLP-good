'use client'

/**
 * Punto de entrada para el módulo RSU del sector gobierno.
 * Si el usuario no tiene sesión activa, redirige a login.
 * Si tiene sesión, redirige al simulador (que maneja onboarding + audiencia).
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Recycle } from 'lucide-react'

export default function GobiernoRsuEntryPage() {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
    if (token) {
      router.replace('/simulator')
    } else {
      router.replace('/login?next=/gobierno/rsu')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F2ED' }}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-[10px] bg-[#EAF3DE] flex items-center justify-center">
          <Recycle className="w-5 h-5 text-[#3B6D11]" strokeWidth={1.75} />
        </div>
        <p className="text-[13px] text-[#6B6760]">Cargando módulo RSU…</p>
      </div>
    </div>
  )
}
