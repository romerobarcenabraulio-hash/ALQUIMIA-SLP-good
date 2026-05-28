'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import {
  BookOpen,
  FileText,
  Home,
  LayoutDashboard,
  MapPin,
  Recycle,
  LogOut,
  ClipboardList,
} from 'lucide-react'

// ─── Top-level nav ────────────────────────────────────────────────────────────

const TOP_NAV = [
  { href: '/', Icon: Home, label: 'Inicio' },
  { href: '/v', Icon: LayoutDashboard, label: 'Plataforma', matchPrefixes: ['/v', '/p', '/e'] },
  { href: '/hub', Icon: FileText, label: 'Documentos', matchPrefix: '/hub' },
  { href: '/aprende', Icon: BookOpen, label: 'Aprende', matchPrefix: '/aprende' },
  { href: '/ca-studio', Icon: Recycle, label: 'CA-Studio', matchPrefix: '/ca-studio' },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function Sidebar({ moduleSection }: { moduleSection?: ReactNode } = {}) {
  const pathname = usePathname()
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const seleccion = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const audience = useSimulatorStore(s => s.audience)

  const cityLabel = seleccion?.nombre
    ? `${seleccion.nombre}, ${seleccion.estadoNombre}`
    : `ZM ${zmActiva}`

  return (
    <aside
      className="hidden xl:flex flex-col w-[220px] shrink-0 bg-[#1C2B15] sticky top-0 h-screen overflow-y-auto"
      aria-label="Navegación principal"
    >
      {/* Logo */}
      <div className="px-4 py-4 border-b border-[#2D4020]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-[6px] bg-[#3B6D11] flex items-center justify-center group-hover:bg-[#4A8A16] transition-colors shrink-0">
            <Recycle className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="font-serif text-[15px] text-white font-semibold leading-tight">ALQUIMIA</p>
            <p className="text-[9px] text-[#6A9A50] leading-tight">Circularidad Municipal</p>
          </div>
        </Link>
      </div>

      {/* Top-level nav */}
      <nav className="px-2 pt-3 pb-2">
        {TOP_NAV.map(({ href, Icon, label, matchPrefix, matchPrefixes }) => {
          const active = matchPrefixes
            ? matchPrefixes.some(prefix => pathname.startsWith(prefix))
            : matchPrefix
              ? pathname.startsWith(matchPrefix)
              : pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-[8px] mb-0.5 text-[12px] font-medium transition-colors',
                active
                  ? 'bg-[#2D4020] text-white'
                  : 'text-[#8AAD78] hover:text-white hover:bg-[#243320]',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2 : 1.75} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-[#2D4020] my-1" />

      {/* Module nav slot — filled by simulator page, spacer otherwise */}
      {moduleSection ? (
        <div className="flex-1 overflow-y-auto border-t border-[#2D4020] mt-1 min-h-0">
          {moduleSection}
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {/* Bottom section */}
      <div className="px-2 pb-3">
        <div className="mx-1 border-t border-[#2D4020] mb-2" />

        {/* Extra nav */}
        {[
          { href: '/hub', Icon: ClipboardList, label: 'Biblioteca' },
          { href: '/gobierno', Icon: LogOut, label: 'Cambiar servicio' },
        ].map(({ href, Icon, label }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] mb-0.5 text-[11px] text-[#4A7A35] hover:text-[#8AAD78] hover:bg-[#243320] transition-colors"
          >
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />
            {label}
          </Link>
        ))}

        {/* City / user badge */}
        {(zmActiva || audience) && (
          <div className="mt-2 mx-1 rounded-[8px] bg-[#243320] border border-[#2D4020] px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1">
              <MapPin className="w-3 h-3 text-[#5A9438] shrink-0" strokeWidth={2} />
              <p className="text-[10px] font-medium text-[#A8C898] truncate">{cityLabel}</p>
            </div>
            {audience && (
              <p className="text-[9px] text-[#4A7A35] capitalize">
                {audience === 'functionary' ? 'Funcionario público' : audience === 'citizen' ? 'Ciudadano' : 'Empresario'}
                {' · '}
                <span className="text-[#3B8A25]">Activo</span>
              </p>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
