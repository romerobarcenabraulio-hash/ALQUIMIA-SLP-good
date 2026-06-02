import Link from 'next/link'
import { cn } from '@/lib/utils'

export function PlatformGatewayHint({
  className,
  variant = 'default',
}: {
  className?: string
  variant?: 'default' | 'compact'
}) {
  return (
    <p
      className={cn(
        variant === 'compact' ? 'text-[11px] leading-relaxed text-[#6B6760]' : 'text-[12px] leading-relaxed text-[#6B6760]',
        className,
      )}
    >
      <Link href="/v" className="font-medium text-[#3B6D11] hover:underline">
        Paquete consultivo
      </Link>
      {' '}
      — primero define municipio, documentos disponibles y evidencia mínima; sin eso la plataforma muestra brechas críticas.
    </p>
  )
}
