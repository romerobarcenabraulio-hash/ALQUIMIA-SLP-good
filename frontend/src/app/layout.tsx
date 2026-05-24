import type { Metadata } from 'next'
import { Literata, Source_Sans_3 } from 'next/font/google'
import { ReglamentoFuenteProvider } from '@/components/reglamento/ReglamentoModal'
import './globals.css'

const literata = Literata({
  subsets: ['latin'],
  variable: '--font-literata',
  display: 'swap',
})

const sourceSans = Source_Sans_3({
  subsets: ['latin'],
  variable: '--font-source-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ALQUIMIA — Consultoría integral de gestión pública municipal',
  description:
    'Plataforma de consultoría integral para gobiernos municipales: RSU, diagnóstico jurídico y entregables de consultoría.',
  keywords: 'RSU, reciclaje, municipios, circularidad, residuos sólidos, México',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${literata.variable} ${sourceSans.variable}`}>
      <body className="bg-surface-base font-sans antialiased">
        <ReglamentoFuenteProvider>{children}</ReglamentoFuenteProvider>
      </body>
    </html>
  )
}
