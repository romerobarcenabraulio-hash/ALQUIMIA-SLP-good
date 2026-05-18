import type { Metadata } from 'next'
import { ReglamentoFuenteProvider } from '@/components/reglamento/ReglamentoModal'
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
      <body style={{ backgroundColor: '#F4F2ED' }}>
        <ReglamentoFuenteProvider>{children}</ReglamentoFuenteProvider>
      </body>
    </html>
  )
}
