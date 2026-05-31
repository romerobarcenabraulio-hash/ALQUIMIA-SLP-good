import Link from 'next/link'
import type { ReactNode } from 'react'

type PublicPageShellProps = {
  children: ReactNode
  actionLabel?: string
  actionHref?: string
}

export function PublicPageShell({
  children,
  actionLabel = 'Comenzar',
  actionHref = '/comenzar',
}: PublicPageShellProps) {
  return (
    <main className="min-h-screen bg-[#F4F2ED] text-[#1C1B18]">
      <header className="border-b border-[#E8E4DC] bg-[#FDFCFA]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-6">
          <Link href="/" className="font-serif text-[22px] font-semibold leading-none">
            ALQUIMIA
          </Link>
          <nav className="flex min-w-0 items-center gap-3 text-[13px]">
            <Link href="/metodologia" className="hidden text-[#4A4740] hover:text-[#1C1B18] sm:inline">
              Metodología
            </Link>
            <Link href="/sign-in" className="hidden text-[#4A4740] hover:text-[#1C1B18] sm:inline">
              Iniciar sesión
            </Link>
            <Link href={actionHref} className="rounded-[8px] bg-[#1C2B15] px-4 py-2 font-semibold text-white">
              {actionLabel}
            </Link>
          </nav>
        </div>
      </header>
      {children}
    </main>
  )
}

export function PublicHero({
  eyebrow,
  title,
  body,
  children,
}: {
  eyebrow: string
  title: string
  body?: string
  children?: ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-6 lg:py-20">
      <p className="mb-4 text-[12px] font-semibold uppercase text-[#6B6760]">{eyebrow}</p>
      <h1 className="max-w-5xl text-balance font-serif text-[42px] leading-[1.05] tracking-[0] text-[#1C1B18] md:text-[62px]">
        {title}
      </h1>
      {body && (
        <p className="mt-6 max-w-3xl text-[16px] leading-8 text-[#4A4740] md:text-[17px]">
          {body}
        </p>
      )}
      {children}
    </section>
  )
}
