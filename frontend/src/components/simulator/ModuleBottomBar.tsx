'use client'

import { BookOpen, Settings2, Download, LayoutDashboard } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModuleBottomBarProps {
  onProfundizar?: () => void
  onEditarSupuestos?: () => void
  onExportar?: () => void
  onVolverResumen?: () => void
  className?: string
}

export function ModuleBottomBar({
  onProfundizar,
  onEditarSupuestos,
  onExportar,
  onVolverResumen,
  className,
}: ModuleBottomBarProps) {
  const ACTIONS = [
    {
      icon: BookOpen,
      label: 'Profundizar',
      sub: 'Ver fuentes y metodología',
      color: '#1A5FA8',
      bg: 'hover:bg-[#EBF3FB] hover:border-[#B0D0F5]',
      onClick: onProfundizar,
    },
    {
      icon: Settings2,
      label: 'Editar supuestos',
      sub: 'Ajustar parámetros del modelo',
      color: '#D4881E',
      bg: 'hover:bg-[#FEF7E7] hover:border-[#F5D98A]',
      onClick: onEditarSupuestos,
    },
    {
      icon: Download,
      label: 'Exportar',
      sub: 'PDF · Excel · URL compartida',
      color: '#3B6D11',
      bg: 'hover:bg-[#EAF3DE] hover:border-[#D7E8C0]',
      onClick: onExportar,
    },
    {
      icon: LayoutDashboard,
      label: 'Volver al resumen',
      sub: 'Vista ejecutiva del proyecto',
      color: '#5A4A2A',
      bg: 'hover:bg-[#F4F2ED] hover:border-[#C8C4BC]',
      onClick: onVolverResumen,
    },
  ]

  return (
    <div className={cn('mt-4 pt-4 border-t border-[#F0EDE5]', className)}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {ACTIONS.map(({ icon: Icon, label, sub, color, bg, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick}
            className={cn(
              'flex items-center gap-2.5 rounded-[10px] border border-[#E8E4DC] bg-white px-3 py-2.5 text-left transition-colors',
              bg,
            )}
          >
            <div className="shrink-0 w-7 h-7 rounded-[7px] flex items-center justify-center" style={{ background: `${color}15` }}>
              <Icon className="w-3.5 h-3.5" style={{ color }} strokeWidth={2} />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#1C1B18] leading-none">{label}</p>
              <p className="text-[9px] text-[#A8A49C] mt-0.5 leading-snug">{sub}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
