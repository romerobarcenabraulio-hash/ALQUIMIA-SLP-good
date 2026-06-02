'use client'

import Link from 'next/link'

export function InstitutionalHeader({
  label = 'Plataforma institucional',
  detail = 'Fuente · método · confianza · revisión humana',
}: {
  label?: string
  detail?: string
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface-base/95 backdrop-blur-sm">
      <div className="mx-auto flex min-h-14 max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-1.5 sm:flex-nowrap sm:px-6">
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <Link href="/" className="font-serif text-[20px] font-semibold tracking-tight text-[#3B6D11] hover:text-[#2D5409]">
            ALQUIMIA
          </Link>
          <span className="hidden text-[#E8E4DC] sm:block">|</span>
          <span className="hidden truncate text-[12px] uppercase tracking-wide text-[#A8A49C] sm:block">
            {label}
          </span>
        </div>
        <div className="text-right text-[11px] leading-5 text-[#6B6760]">
          {detail}
        </div>
      </div>
    </header>
  )
}
