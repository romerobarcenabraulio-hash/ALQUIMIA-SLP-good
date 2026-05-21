import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { AccesoForm } from './AccesoForm'

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ skip_code?: string }>
}) {
  const params = await searchParams
  const cookieStore = await cookies()
  const hasAccess = cookieStore.get('alquimia_access')?.value === 'granted'
  const skipRequested = params.skip_code === '1'
  const initialStep = skipRequested && hasAccess ? 'role' : 'code'

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F2ED' }}>
        <p className="text-[#A8A49C] text-[13px]">Cargando…</p>
      </div>
    }>
      <AccesoForm initialStep={initialStep} />
    </Suspense>
  )
}
