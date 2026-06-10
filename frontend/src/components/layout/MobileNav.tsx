'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Recycle, Home, LayoutDashboard, FileText, BookOpen } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', Icon: Home, label: 'Inicio' },
  { href: '/v', Icon: LayoutDashboard, label: 'Plataforma' },
  { href: '/hub', Icon: FileText, label: 'Documentos' },
  { href: '/aprende', Icon: BookOpen, label: 'Aprende' },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <>
      {/* Hamburger button - visible only on small screens */}
      <button
        onClick={() => setOpen(!open)}
        className="xl:hidden flex items-center justify-center w-10 h-10 rounded-[8px] text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors"
        aria-label="Abrir menú"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile drawer */}
      {open && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/30 z-40 xl:hidden"
            onClick={() => setOpen(false)}
          />

          {/* Sidebar drawer */}
          <aside className="fixed left-0 top-0 z-50 h-screen w-[268px] bg-[#1C2B15] overflow-y-auto xl:hidden flex flex-col">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-[#2D4020]">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 group">
                <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center group-hover:bg-[#4A8A16] transition-colors shrink-0">
                  <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
                </div>
                <div>
                  <p className="font-serif text-[15px] text-white font-semibold leading-tight">ALQUIMIA</p>
                  <p className="text-[9px] text-[#6A9A50] leading-tight">Circularidad Municipal</p>
                </div>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-3 space-y-1">
              {NAV_ITEMS.map(({ href, Icon, label }) => {
                const isActive = pathname === href || pathname.startsWith(href + '/')
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 rounded-[8px] px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#3B6D11] text-white'
                        : 'text-[#A8A888] hover:text-white hover:bg-[#2D4020]'
                    }`}
                  >
                    <Icon size={18} className="shrink-0" />
                    <span>{label}</span>
                  </Link>
                )
              })}
            </nav>

            {/* Close button at bottom */}
            <div className="px-2 py-3 border-t border-[#2D4020]">
              <button
                onClick={() => setOpen(false)}
                className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#2D4020] px-3 py-2.5 text-[13px] font-semibold text-[#A8A888] hover:text-white hover:bg-[#3D5530] transition-colors"
              >
                <X size={16} />
                Cerrar
              </button>
            </div>
          </aside>
        </>
      )}
    </>
  )
}
