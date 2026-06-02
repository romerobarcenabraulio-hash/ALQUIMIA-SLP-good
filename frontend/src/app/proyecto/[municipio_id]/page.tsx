import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

interface Props {
  params: Promise<{ municipio_id: string }>
  searchParams: Promise<{ proyecto_id?: string; tenant_id?: string }>
}

function safeTenantId(value: string) {
  return value.trim().replace(/[^a-zA-Z0-9_-]/g, '')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { municipio_id } = await params
  return {
    title: `Ejecución ${municipio_id} · ALQUIMIA`,
    description: 'Monitoreo del paquete consultivo municipal con evidencia, deltas y brechas trazables.',
  }
}

export default async function ProyectoPage({ params, searchParams }: Props) {
  const { municipio_id } = await params
  const { tenant_id } = await searchParams
  const resolvedTenant = safeTenantId(tenant_id || municipio_id)
  const target = resolvedTenant ? `/e?tenant_id=${encodeURIComponent(resolvedTenant)}` : '/e'

  redirect(target)
}
