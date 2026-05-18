import Link from 'next/link'
import { cn } from '@/lib/utils'

/** Aviso reutilizable: el simulador exige elegir audiencia (Fase 22). */
export function SimulatorGatewayHint({
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
      <Link href="/simulator" className="font-medium text-[#3B6D11] hover:underline">
        Simulador
      </Link>
      {' '}
      — primero elige audiencia (ciudadanía, institución municipal o empresario); sin eso no carga el recorrido modular.
    </p>
  )
}
