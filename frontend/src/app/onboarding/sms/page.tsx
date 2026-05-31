'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function OnboardingSmsPage() {
  const router = useRouter()

  useEffect(() => {
    const timer = window.setTimeout(() => router.replace('/setup-2fa'), 1200)
    return () => window.clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10" style={{ background: '#F8F6F1' }}>
      <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[20px] p-8 w-full max-w-md shadow-md text-center">
        <h1 className="font-serif text-[24px] text-[#3B6D11] mb-2">Activación de cuenta</h1>
        <p className="text-[13px] text-[#6B6760] leading-relaxed mb-5">
          La verificación por teléfono fue desactivada. Continúa con la activación temporal por correo.
        </p>
        <Link href="/setup-2fa" className="btn-primary inline-flex">
          Continuar activación
        </Link>
      </div>
    </div>
  )
}
