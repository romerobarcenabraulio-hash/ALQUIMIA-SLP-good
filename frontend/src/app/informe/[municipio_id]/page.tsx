'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

function safeTenantId(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '')
}

export default function InformePage() {
  const params = useParams()
  const router = useRouter()
  const municipioId = typeof params?.municipio_id === 'string' ? safeTenantId(params.municipio_id) : ''

  useEffect(() => {
    const target = municipioId ? `/v?tenant_id=${encodeURIComponent(municipioId)}` : '/v'
    router.replace(target)
  }, [municipioId, router])

  return (
    <main className="min-h-screen bg-[#F8F6F1] px-5 py-16 text-[#1C1B18]">
      <section className="mx-auto max-w-3xl border-t border-[#D8D2C5] pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3B6D11]">
          ALQUIMIA · Paquete consultivo
        </p>
        <h1 className="mt-4 font-serif text-[34px] leading-tight sm:text-[44px]">
          Redirigiendo al expediente consultivo vigente.
        </h1>
        <p className="mt-4 text-[15px] leading-7 text-[#4A4740]">
          Los informes heredados no se abren como producto cliente. La plataforma conserva el flujo de validación,
          evidencia, brechas y export defendible desde el paquete consultivo.
        </p>
      </section>
    </main>
  )
}
