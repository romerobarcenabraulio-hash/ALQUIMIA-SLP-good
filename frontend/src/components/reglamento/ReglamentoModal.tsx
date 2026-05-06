'use client'

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
} from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  ReglamentoFuente,
  reglamentoFuentePorMunicipio,
  tieneUrlFuentePrimaria,
} from '@/data/reglamentos'
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

function EspejosLocales({ rutas }: { rutas: string[] }) {
  if (rutas.length === 0) return null
  return (
    <div className="space-y-3">
      <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C]">
        Espejo en este repo (no sustituye la fuente oficial)
      </p>
      {rutas.map(p => {
        const nombre = p.split('/').pop() ?? p
        const low = p.toLowerCase()
        if (low.endsWith('.pdf')) {
          return (
            <div key={p} className="overflow-hidden rounded-[10px] border border-[#E8E4DC] bg-[#2b2926]">
              <iframe title={`Vista previa PDF ${nombre}`} src={p} className="h-[min(52vh,440px)] w-full bg-white" />
              <div className="border-t border-[#E8E4DC] bg-[#FDFCFA] px-2 py-2 text-center">
                <a
                  href={p}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-medium text-[#3B6D11] hover:underline"
                >
                  Abrir PDF completo en nueva pestaña
                </a>
              </div>
            </div>
          )
        }
        return (
          <a
            key={p}
            href={p}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-[10px] border border-[#E8E4DC] bg-[#F0EDE5] px-3 py-2 text-[12px] font-medium text-[#1C1B18] hover:bg-[#E6E1D8]"
          >
            Descargar / abrir espejo Word (.doc) — {nombre}
          </a>
        )
      })}
    </div>
  )
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
}

export interface ReglamentoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  municipioId: string | null
  articulosEtapa?: string[]
}

export function ReglamentoModal({
  open,
  onOpenChange,
  municipioId,
  articulosEtapa,
}: ReglamentoModalProps) {
  const titleId = useId()
  const descId = useId()

  const registro = useMemo(
    () => (municipioId ? reglamentoFuentePorMunicipio(municipioId) : undefined),
    [municipioId],
  )

  const articulosMostrados = useMemo(() => {
    const fromReg = registro?.articulos_clave ?? []
    const extra = articulosEtapa ?? []
    return [...new Set([...fromReg, ...extra].filter(Boolean))]
  }, [registro, articulosEtapa])

  if (!municipioId) return null

  const tienePdfEspejo = Boolean(
    registro?.archivo_local?.some(p => p.toLowerCase().endsWith('.pdf')),
  )

  const shell = (body: ReactNode) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(tienePdfEspejo && 'md:max-w-[64rem]')} showClose>
        {body}
      </DialogContent>
    </Dialog>
  )

  if (!registro) {
    return shell(
      <>
        <DialogHeader className="shrink-0">
          <DialogTitle id={titleId}>Fuente primaria no registrada</DialogTitle>
          <DialogDescription id={descId}>
            No hay entrada en <span className="font-mono">frontend/src/data/reglamentos.ts</span> para{' '}
            <span className="font-mono">{municipioId}</span>. Solicita a CSA alta de URL y captura conforme blueprint 26.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <p className="text-[11px] leading-relaxed text-[#6B6760]">
            Verifica la versión vigente en la fuente oficial. ALQUIMIA reproduce metadatos de consultoría, no certifica
            vigencia normativa.
          </p>
        </DialogFooter>
      </>,
    )
  }

  const badge = badgeClasses(registro.estado_verificacion)
  const yearLabel = registro.anio_version > 0 ? String(registro.anio_version) : '—'
  const urlOk = tieneUrlFuentePrimaria(registro)
  const pub = (registro.fecha_publicacion ?? '').trim()

  return shell(
    <>
      <DialogHeader className="shrink-0">
        <DialogTitle id={titleId}>Fuente primaria del reglamento</DialogTitle>
        <DialogDescription id={descId}>
          Verificación en trazabilidad ALQUIMIA — abre el instrumento oficial en otra pestaña cuando exista enlace
          directo.
        </DialogDescription>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium', badge.className)}>
            {badge.label}
          </span>
          {!urlOk && (
            <span className="inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-950">
              Fuente en verificación
            </span>
          )}
        </div>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 text-[13px] text-[#1C1B18]">
          <p className="font-medium leading-snug">{registro.nombre}</p>
          <p className="text-[12px] text-[#6B6760]">
            Municipio (clave simulador): <span className="font-mono">{registro.municipio_id}</span> · ZM{' '}
            <span className="font-mono">{registro.zm_id}</span>
          </p>
          <p className="text-[12px] text-[#6B6760]">Año / versión referencia: {yearLabel}</p>
          <p className="text-[12px] text-[#6B6760]">
            <span className="font-medium text-[#1C1B18]">Publicación (referencia):</span>{' '}
            {pub || 'Consultar fecha en Periódico Oficial del Estado, DOF o Gaceta municipal competente.'}
          </p>
          {urlOk && (
            <p className="break-all text-[11px] text-[#3B6D11]">
              <span className="font-medium text-[#1C1B18]">URL indicada: </span>
              {registro.url_fuente}
            </p>
          )}
          <p className="text-[11px] text-[#8A857C]">Última comprobación interna: {registro.fecha_verificacion}</p>

          {registro.hint_ancla_adendo ? (
            <p className="rounded-[10px] border border-[#E8E4DC] bg-[#FAFAF8] px-3 py-2 text-[11px] leading-snug text-[#6B6760]">
              {registro.hint_ancla_adendo}
            </p>
          ) : null}

          <div>
            <p className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C]">Artículos relevantes citados</p>
            {articulosMostrados.length > 0 ? (
              <div className="mt-1 flex flex-wrap gap-1">
                {articulosMostrados.map(a => (
                  <span key={a} className="rounded-full bg-[#F0EDE5] px-2 py-0.5 font-mono text-[11px] text-[#6B6760]">
                    {a}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[12px] text-[#8A857C]">
                Sin artículos listados en catálogo para esta vista — revisa el instrumento completo en la fuente oficial.
              </p>
            )}
          </div>

          {registro.archivo_local && registro.archivo_local.length > 0 ? (
            <EspejosLocales rutas={registro.archivo_local} />
          ) : null}

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

          {urlOk ? (
            <a
              href={registro.url_fuente}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center rounded-[10px] bg-[#3B6D11] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#2D5409]"
            >
              Ver documento oficial
            </a>
          ) : (
            <div className="rounded-[10px] border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-950">
              <p className="font-medium">Fuente en verificación</p>
              <p className="mt-1 text-[11px]">
                Aún no hay URL estable al PDF o al punto exacto en POE/DOF. El equipo CSA debe completar{' '}
                <span className="font-mono">url_fuente</span> en{' '}
                <span className="font-mono">reglamentos.ts</span>.
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
      </div>

      <DialogFooter>
        <p className="text-[11px] leading-relaxed text-[#6B6760]">
          Verifica la versión vigente en la fuente oficial (POE, DOF o sitio municipal competente). ALQUIMIA no certifica
          vigencia ni sustituye al instrumento publicado.
        </p>
      </DialogFooter>
    </>,
  )
}

export type AbrirReglamentoOpciones = { articulosEtapa?: string[] }

type Ctx = { openReglamento: (municipioId: string, opts?: AbrirReglamentoOpciones) => void }

const ReglamentoFuenteContext = createContext<Ctx | null>(null)

export function useReglamentoFuente(): Ctx {
  const c = useContext(ReglamentoFuenteContext)
  if (!c) throw new Error('useReglamentoFuente requiere ReglamentoFuenteProvider')
  return c
}

export function ReglamentoFuenteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [municipioId, setMunicipioId] = useState<string | null>(null)
  const [articulosEtapa, setArticulosEtapa] = useState<string[] | undefined>(undefined)

  const openReglamento = useCallback((id: string, opts?: AbrirReglamentoOpciones) => {
    setMunicipioId(id.toLowerCase())
    setArticulosEtapa(opts?.articulosEtapa)
    setOpen(true)
  }, [])

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v)
    if (!v) {
      setMunicipioId(null)
      setArticulosEtapa(undefined)
    }
  }, [])

  const value = useMemo(() => ({ openReglamento }), [openReglamento])

  return (
    <ReglamentoFuenteContext.Provider value={value}>
      {children}
      <ReglamentoModal
        open={open}
        onOpenChange={handleOpenChange}
        municipioId={municipioId}
        articulosEtapa={articulosEtapa}
      />
    </ReglamentoFuenteContext.Provider>
  )
}
