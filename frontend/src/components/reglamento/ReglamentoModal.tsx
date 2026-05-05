'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useMediaQuery } from 'usehooks-ts'
import { reglamentoFuentePorMunicipio } from '@/data/reglamentos'
import type { ReglamentoFuente } from '@/data/reglamentos'
import { cn } from '@/lib/utils'

function badgeClasses(estado: ReglamentoFuente['estado_verificacion']): { label: string; className: string } {
  switch (estado) {
    case 'vigente':
      return { label: 'Vigente', className: 'bg-[#EAF3DE] text-[#23470A] border-[#3B6D11]/30' }
    case 'en_revision':
      return { label: 'En revisión', className: 'bg-[#FEF7E7] text-[#8B5A00] border-[#D4881E]/40' }
    default:
      return { label: 'No localizado', className: 'bg-[#FDE8E8] text-[#8B1E1E] border-red-200' }
  }
}

function reportarFuente(reg: ReglamentoFuente) {
  const subject = encodeURIComponent(`[ALQUIMIA] Reportar fuente reglamento ${reg.municipio_id}`)
  const body = encodeURIComponent(
    `Municipio: ${reg.municipio_id}\nNombre referencia ALQUIMIA: ${reg.nombre}\n\nPropongo URL oficial:\n\n`,
  )
  const mail =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_MAIL_REPORTE_REG
      ? process.env.NEXT_PUBLIC_MAIL_REPORTE_REG
      : ''
  if (mail.includes('@')) {
    window.location.href = `mailto:${mail}?subject=${subject}&body=${body}`
    return
  }
  console.info('[Reportar fuente — configurar NEXT_PUBLIC_MAIL_REPORTE_REG]', reg)
}

export interface ReglamentoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  municipioId: string | null
}

export function ReglamentoModal({ open, onOpenChange, municipioId }: ReglamentoModalProps) {
  const titleId = useId()
  const descId = useId()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  const registro = useMemo(
    () => (municipioId ? reglamentoFuentePorMunicipio(municipioId) : undefined),
    [municipioId],
  )

  useEffect(() => {
    if (!open || !closeBtnRef.current) return undefined
    const t = window.setTimeout(() => closeBtnRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  if (!open || !municipioId) return null

  if (!registro) {
    return (
      <Dialog.Root open={open} onOpenChange={onOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40" />
          <Dialog.Content
            aria-modal="true"
            aria-labelledby={titleId}
            className={cn(
              'fixed z-[101] max-h-[90vh] overflow-y-auto border border-[#E8E4DC] bg-[#FDFCFA] p-4 shadow-xl outline-none',
              isDesktop
                ? 'left-1/2 top-1/2 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[14px]'
                : 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-[16px]',
            )}
          >
            <div className="flex justify-end">
              <Dialog.Close asChild>
                <button ref={closeBtnRef} type="button" aria-label="Cerrar" className="rounded-full border p-1">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>
            <Dialog.Title id={titleId} className="font-serif text-[18px]">
              Fuente primaria no registrada
            </Dialog.Title>
            <p className="mt-2 text-[13px] text-[#6B6760]">
              No hay entrada en <span className="font-mono">frontend/src/data/reglamentos.ts</span> para{' '}
              <span className="font-mono">{municipioId}</span>. Solicita a CSA alta de URL y captura conforme blueprint 26.
            </p>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }

  const badge = badgeClasses(registro.estado_verificacion)
  const yearLabel = registro.anio_version > 0 ? String(registro.anio_version) : '—'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/40" />
        <Dialog.Content
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className={cn(
            'fixed z-[101] flex max-h-[90vh] flex-col overflow-y-auto border border-[#E8E4DC] bg-[#FDFCFA] p-0 shadow-xl outline-none',
            isDesktop
              ? 'left-1/2 top-1/2 w-[min(100%-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[14px]'
              : 'inset-x-0 bottom-0 max-h-[88vh] rounded-t-[16px]',
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-[#E8E4DC] px-4 py-3">
            <div>
              <Dialog.Title id={titleId} className="font-serif text-[18px] text-[#1C1B18]">
                Fuente primaria del reglamento
              </Dialog.Title>
              <p id={descId} className="mt-1 text-[11px] text-[#6B6760]">
                Verificación en trazabilidad ALQUIMIA — abre el instrumento oficial en otra pestaña cuando exista enlace.
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                ref={closeBtnRef}
                type="button"
                className="rounded-full border border-[#E8E4DC] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5]"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          <div className="space-y-3 px-4 py-4 text-[13px] text-[#1C1B18]">
            <p className="font-medium leading-snug">{registro.nombre}</p>
            <p className="text-[12px] text-[#6B6760]">
              Municipio (clave simulador): <span className="font-mono">{registro.municipio_id}</span>
            </p>
            <p className="text-[12px] text-[#6B6760]">Año / versión referencia: {yearLabel}</p>
            <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium', badge.className)}>
              {badge.label}
            </span>
            <p className="text-[11px] text-[#8A857C]">Última comprobación interna: {registro.fecha_verificacion}</p>

            {registro.captura_url ? (
              <div className="overflow-hidden rounded-[10px] border border-[#E8E4DC] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={registro.captura_url}
                  alt={`Portada o referencia visual reglamento ${registro.municipio_id}`}
                  className="mx-auto max-h-48 w-auto object-contain"
                />
              </div>
            ) : null}

            {registro.articulos_clave && registro.articulos_clave.length > 0 ? (
              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C]">Artículos citados frecuentemente</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {registro.articulos_clave.map(a => (
                    <span key={a} className="rounded-full bg-[#F0EDE5] px-2 py-0.5 font-mono text-[11px] text-[#6B6760]">
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {registro.url_fuente ? (
              <a
                href={registro.url_fuente}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#2D5409]"
              >
                Abrir fuente oficial (nueva pestaña)
              </a>
            ) : (
              <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
                <p className="font-medium">Fuente pendiente de localización</p>
                <p className="mt-1 text-[11px]">
                  El equipo CSA debe registrar la URL del instrumento en `frontend/src/data/reglamentos.ts`.
                </p>
                <button
                  type="button"
                  onClick={() => reportarFuente(registro)}
                  className="mt-2 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-[12px] font-medium text-amber-900"
                >
                  Reportar fuente
                </button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

type Ctx = { openReglamento: (municipioId: string) => void }

const ReglamentoFuenteContext = createContext<Ctx | null>(null)

export function useReglamentoFuente(): Ctx {
  const c = useContext(ReglamentoFuenteContext)
  if (!c) throw new Error('useReglamentoFuente requiere ReglamentoFuenteProvider')
  return c
}

export function ReglamentoFuenteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [municipioId, setMunicipioId] = useState<string | null>(null)

  const openReglamento = useCallback((id: string) => {
    setMunicipioId(id.toLowerCase())
    setOpen(true)
  }, [])

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v)
    if (!v) setMunicipioId(null)
  }, [])

  const value = useMemo(() => ({ openReglamento }), [openReglamento])

  return (
    <ReglamentoFuenteContext.Provider value={value}>
      {children}
      <ReglamentoModal open={open} onOpenChange={handleOpenChange} municipioId={municipioId} />
    </ReglamentoFuenteContext.Provider>
  )
}
