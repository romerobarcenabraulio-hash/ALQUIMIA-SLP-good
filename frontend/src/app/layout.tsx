import type { Metadata } from 'next'
import { ReglamentoFuenteProvider } from '@/components/reglamento/ReglamentoModal'
import './globals.css'

export const metadata: Metadata = {
  title: 'ALQUIMIA — Consultoría integral de gestión pública municipal',
  description:
    'Plataforma de consultoría integral para gobiernos municipales: RSU, diagnóstico jurídico y entregables de consultoría.',
  keywords: 'RSU, reciclaje, municipios, circularidad, residuos sólidos, México',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-surface-base font-sans antialiased">
        <ReglamentoFuenteProvider>{children}</ReglamentoFuenteProvider>
      </body>
    </html>
  )
}
