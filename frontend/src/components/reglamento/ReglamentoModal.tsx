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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ReglamentoFuente,
  reglamentoFuentePorMunicipio,
  tieneUrlFuentePrimaria,
} from '@/data/reglamentos'
import { adendos, CIUDADES_DISPONIBLES } from '@/data/adendos'
import { cn } from '@/lib/utils'

function badgeClasses(estado: ReglamentoFuente['estado_verificacion']): { label: string; className: string } {
  switch (estado) {
    case 'vigente':
      return { label: 'Vigente', className: 'bg-[#EAF3DE] text-[#23470A] border-[#3B6D11]/30' }
    case 'en_revision':
      return { label: 'En revisión', className: 'bg-[#FEF7E7] text-[#8B5A00] border-[#D4881E]/40' }
    default:
      return { label: 'Sin URL estable', className: 'bg-[#FDE8E8] text-[#8B1E1E] border-red-200' }
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
}: ReglamentoModalProps) {
  const titleId  = useId()
  const descId   = useId()
  const [adendoActivo, setAdendoActivo] = useState(1)

  const registro = useMemo(
    () => (municipioId ? reglamentoFuentePorMunicipio(municipioId) : undefined),
    [municipioId],
  )

  const adendo = useMemo(
    () => adendos.find(a => a.id === adendoActivo),
    [adendoActivo],
  )

  const ciudadKey = municipioId?.toLowerCase() ?? 'slp'
  const ciudadData = adendo?.ciudades[ciudadKey]

  if (!municipioId) return null

  const badge  = registro ? badgeClasses(registro.estado_verificacion) : badgeClasses('no_localizado')
  const urlOk  = registro ? tieneUrlFuentePrimaria(registro) : false

  const nombreMunicipio = CIUDADES_DISPONIBLES[ciudadKey] ?? municipioId.toUpperCase()
  const nombreReglamento = ciudadData?.nombreReglamento
    ?? registro?.nombre
    ?? 'Reglamento municipal de residuos sólidos'

  const textoVigente = ciudadData?.textoVigente ?? ''
  const esNoExiste   = textoVigente.startsWith('[NO EXISTE]') || textoVigente.startsWith('[NO DISPONIBLE')
  // El adendo es por-ciudad si existe; si no, cae al genérico (redactado base SLP).
  const textoPropuesto       = ciudadData?.adendoPropuesto ?? adendo?.adendoPropuesto ?? ''
  const adendoEstaLocalizado = Boolean(ciudadData?.adendoPropuesto)
  const efectoOp             = adendo?.efectoOperativo ?? ''
  const archivosLocales      = registro?.archivo_local ?? []
  const pdfPrimario          = archivosLocales.find(path => path.toLowerCase().endsWith('.pdf'))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal grande — casi pantalla completa.
          NB: el base DialogContent tiene `md:max-w-3xl`; usamos !important para sobreescribirlo en desktop. */}
      <DialogContent
        className="!max-w-[95vw] w-[95vw] md:!max-w-[1280px] md:w-[95vw] h-[90vh] md:h-[88vh] flex flex-col overflow-hidden p-0 gap-0"
        showClose
      >

        {/* ── Cabecera ─────────────────────────────────────────────── */}
        <DialogHeader className="shrink-0 px-5 pt-5 pb-3 border-b border-[#E8E4DC] bg-[#FDFCFA]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-[#A8A49C] mb-1">Fuente primaria del reglamento</p>
              <DialogTitle id={titleId} className="font-serif text-[18px] leading-snug text-[#1C1B18]">
                {nombreReglamento}
              </DialogTitle>
              <DialogDescription id={descId} className="text-[11px] text-[#6B6760] mt-1">
                Municipio: <span className="font-mono">{municipioId}</span>
                {ciudadData && <> · {ciudadData.numeroArticulo} · {ciudadData.anio}</>}
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium', badge.className)}>
                {badge.label}
              </span>
              {urlOk && registro?.url_fuente ? (
                <a
                  href={registro.url_fuente}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[8px] bg-[#3B6D11] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#2D5409] transition-colors"
                >
                  Abrir fuente oficial
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              ) : (
                <span className="inline-flex rounded-[8px] border border-amber-300 bg-amber-50 px-3 py-1.5 text-[11px] text-amber-900">
                  URL en verificación
                </span>
              )}
            </div>
          </div>

          {/* Selector de adendo */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-[#A8A49C] self-center mr-1">Adendo:</span>
            {adendos.map(a => (
              <button
                key={a.id}
                onClick={() => setAdendoActivo(a.id)}
                className={cn(
                  'px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-colors',
                  adendoActivo === a.id
                    ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                    : 'bg-white text-[#6B6760] border-[#E8E4DC] hover:bg-[#F0EDE5]',
                )}
                title={a.titulo}
              >
                {a.id} — {a.titulo.split(' ').slice(0, 3).join(' ')}…
              </button>
            ))}
          </div>
        </DialogHeader>

        {/* ── Cuerpo: 2 columnas ────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 divide-x divide-[#E8E4DC]">

          {/* Panel izquierdo: fuente primaria con vista previa */}
          <div className="flex flex-col w-[54%] min-w-0">
            <div className="shrink-0 px-5 py-3 border-b border-[#E8E4DC] bg-[#FAF8F5]">
              <p className="text-[10px] uppercase tracking-widest text-[#A8A49C]">Vista previa de fuente · {nombreMunicipio}</p>
              <p className="text-[11px] text-[#6B6760] mt-1 leading-snug">
                Usa el visor para leer el reglamento localizado. La propuesta de la derecha no sustituye la fuente ni certifica vigencia.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {pdfPrimario ? (
                <iframe
                  title={`Reglamento municipal ${nombreMunicipio}`}
                  src={pdfPrimario}
                  className="h-[58vh] min-h-[420px] w-full rounded-[10px] border border-[#E8E4DC] bg-white"
                />
              ) : (
                <div className="rounded-[10px] border border-[#E8E4DC] bg-white p-4">
                  <p className="text-[13px] font-medium text-[#1C1B18]">Sin PDF local embebible</p>
                  <p className="mt-2 text-[12px] leading-relaxed text-[#6B6760]">
                    Este municipio tiene archivo no PDF o URL externa. Abre la fuente oficial desde la cabecera y usa la nota de lectura
                    para ubicar artículos, transitorios o anexos.
                  </p>
                  {archivosLocales.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[11px] text-[#6B6760]">
                      {archivosLocales.map(path => (
                        <li key={path} className="font-mono">{path}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <div className="mt-4 rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
                <p className="text-[10px] uppercase tracking-widest text-[#A8A49C]">Dónde leer y qué buscar</p>
                {ciudadData && (
                  <p className="mt-2 text-[12px] text-[#6B6760] leading-relaxed">
                    {ciudadData.nombreReglamento} · {ciudadData.anio} · <span className="font-mono">{ciudadData.numeroArticulo}</span>.
                  </p>
                )}
                <p className="mt-2 text-[12px] leading-relaxed text-[#6B6760]">
                  {registro?.hint_ancla_adendo ?? 'Busca definiciones, obligaciones, atribuciones municipales, fiscalización y artículos transitorios.'}
                </p>
                {registro?.articulos_clave?.length ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-[#8C8880]">
                    Claves de lectura: {registro.articulos_clave.join(' · ')}
                  </p>
                ) : null}
                {ciudadData && !esNoExiste && textoVigente && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-[11px] font-medium text-[#3B6D11]">Ver extracto identificado</summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded-[8px] bg-white p-3 font-mono text-[11px] leading-relaxed text-[#3A3832]">
                      {textoVigente}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          </div>

          {/* Panel derecho: propuesta expositiva */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="shrink-0 px-5 py-3 border-b border-[#E8E4DC] bg-[#EAF3DE]/40">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] uppercase tracking-widest text-[#3B6D11]">
                  Adendo {adendo?.id} propuesto · {nombreMunicipio}
                </p>
                <span className="inline-flex rounded-full bg-[#EAF3DE] border border-[#3B6D11]/30 px-2 py-0.5 text-[10px] font-medium text-[#3B6D11]">
                  {adendo?.tecnica}
                </span>
              </div>
              <p className="text-[12px] text-[#1C1B18] mt-1 leading-snug">{adendo?.titulo}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {/* Aviso cuando el texto es genérico (redactado base SLP) en otra ciudad */}
              {!adendoEstaLocalizado && ciudadKey !== 'slp' && (
                <div className="mb-4 rounded-[10px] border border-amber-300 bg-amber-50 px-4 py-3">
                  <p className="text-[12px] font-semibold text-[#8B5A00] mb-1">
                    Borrador redactado para San Luis Potosí
                  </p>
                  <p className="text-[11px] leading-relaxed text-[#8B5A00]">
                    El texto de abajo cita instrumentos de SLP (Reglamento de Aseo Público, Dirección de Aseo Público, Ley sobre Régimen de Propiedad en Condominio del Estado de SLP). Antes de presentar a Cabildo de {nombreMunicipio}, sustituir referencias por las equivalentes locales: <strong>{ciudadData?.nombreReglamento ?? 'reglamento municipal de RSU'}</strong>, autoridad de aseo correspondiente y ley estatal de condominios aplicable.
                  </p>
                </div>
              )}

              {/* Texto del adendo — grande y legible */}
              <pre className="text-[15px] leading-[1.9] whitespace-pre-wrap font-sans text-[#1C1B18]">
                {textoPropuesto}
              </pre>
            </div>

            {/* Efecto operativo */}
            {efectoOp && (
              <div className="shrink-0 border-t border-[#E8E4DC] bg-[#FAFAF8] px-5 py-3">
                <p className="text-[10px] uppercase tracking-widest text-[#A8A49C] mb-1">Efecto operativo</p>
                <p className="text-[12px] text-[#6B6760] leading-relaxed">{efectoOp}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pie ──────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#E8E4DC] bg-[#FAF8F5] px-5 py-2">
          <p className="text-[10px] text-[#A8A49C]">
            [BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos] · Verificar vigencia en fuente oficial.
          </p>
        </div>
      </DialogContent>
    </Dialog>
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
  const [open, setOpen]             = useState(false)
  const [municipioId, setMunicipioId] = useState<string | null>(null)
  const [articulosEtapa, setArticulosEtapa] = useState<string[] | undefined>(undefined)

  const openReglamento = useCallback((id: string, opts?: AbrirReglamentoOpciones) => {
    setMunicipioId(id.toLowerCase())
    setArticulosEtapa(opts?.articulosEtapa)
    setOpen(true)
  }, [])

  const handleOpenChange = useCallback((v: boolean) => {
    setOpen(v)
    if (!v) { setMunicipioId(null); setArticulosEtapa(undefined) }
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
