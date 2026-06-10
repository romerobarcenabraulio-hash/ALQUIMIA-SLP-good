'use client'

import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#F8F6F1] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="grid w-full items-center gap-8 md:grid-cols-[minmax(0,1fr)_420px]">
          <section className="max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#3B6D11]">ALQUIMIA</p>
            <h1 className="mt-3 font-serif text-[34px] leading-tight text-[#1C1B18] md:text-[44px]">
              Crear acceso
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-7 text-[#4A4740]">
              Crea una cuenta para preparar la revisión inicial. El alta oficial de municipio o tenant queda sujeta a validación humana.
            </p>
          </section>
          <div className="flex justify-center">
            <SignUp
              routing="hash"
              signInUrl="/sign-in"
              fallbackRedirectUrl="/hub"
              appearance={{
                elements: {
                  card: 'shadow-md border border-[#E8E4DC]',
                  headerTitle: 'font-serif text-[#1C1B18]',
                  formButtonPrimary: 'bg-[#3B6D11] hover:bg-[#2D5409]',
                },
              }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
