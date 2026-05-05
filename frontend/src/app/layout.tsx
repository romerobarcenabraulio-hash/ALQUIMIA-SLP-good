import type { Metadata } from 'next'
import 'mapbox-gl/dist/mapbox-gl.css'
import './globals.css'

export const metadata: Metadata = {
  title: 'ALQUIMIA — Plataforma de Circularidad Municipal',
  description: 'Simulador de valorización de RSU para municipios mexicanos. Transforma residuos en recursos.',
  keywords: 'RSU, reciclaje, municipios, circularidad, residuos sólidos, México',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body style={{ backgroundColor: '#F8F6F1' }}>{children}</body>
    </html>
  )
}
