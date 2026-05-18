import type { Metadata } from 'next'
import ProyectoVivoPortal from '@/components/simulator/ProyectoVivoPortal'

interface Props {
  params: Promise<{ municipio_id: string }>
  searchParams: Promise<{ proyecto_id?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { municipio_id } = await params
  return {
    title: `Proyecto ${municipio_id} · ALQUIMIA`,
    description: 'Portal del proyecto vivo — seguimiento en tiempo real del programa de circularidad municipal.',
  }
}

export default async function ProyectoPage({ params, searchParams }: Props) {
  const { municipio_id } = await params
  const { proyecto_id } = await searchParams

  // Si no hay proyecto_id en query, usamos municipio_id como fallback.
  // En producción el link generado al vender el servicio incluirá el UUID del proyecto.
  const resolvedId = proyecto_id || municipio_id

  return (
    <ProyectoVivoPortal
      proyectoId={resolvedId}
      municipioId={municipio_id}
    />
  )
}
