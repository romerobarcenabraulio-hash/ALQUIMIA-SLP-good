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
import { adendos } from '@/data/adendos'
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

  const nombreReglamento = ciudadData?.nombreReglamento
    ?? registro?.nombre
    ?? 'Reglamento municipal de residuos sólidos'

  const textoVigente = ciudadData?.textoVigente ?? ''
  const esNoExiste   = textoVigente.startsWith('[NO EXISTE]') || textoVigente.startsWith('[NO DISPONIBLE')
  const textoPropuesto = adendo?.adendoPropuesto ?? ''
  const efectoOp       = adendo?.efectoOperativo ?? ''

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Modal grande — casi pantalla completa */}
      <DialogContent
        className="max-w-[95vw] w-full h-[90vh] flex flex-col overflow-hidden p-0 gap-0"
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

          {/* Panel izquierdo: Texto vigente */}
          <div className="flex flex-col w-[38%] min-w-0">
            <div className="shrink-0 px-4 py-2 border-b border-[#E8E4DC] bg-[#FAF8F5]">
              <p className="text-[10px] uppercase tracking-widest text-[#A8A49C]">📄 Reglamento vigente</p>
              {ciudadData && (
                <p className="text-[10px] text-[#A8A49C] mt-0.5">{ciudadData.nombreReglamento} · {ciudadData.anio}</p>
              )}
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {!ciudadData ? (
                <p className="text-[12px] text-[#A8A49C] text-center py-8">
                  Sin texto verificado para {municipioId?.toUpperCase()} en este adendo.
                </p>
              ) : esNoExiste ? (
                <div className="rounded-[10px] bg-[#FEF7E7] border border-[#FCD34D] p-4">
                  <p className="text-[12px] font-medium text-[#8B5A00] mb-1">
                    {textoVigente.startsWith('[NO EXISTE]')
                      ? 'Artículo no existe en el reglamento vigente'
                      : 'PDF del reglamento pendiente de carga'}
                  </p>
                  <p className="text-[11px] text-[#6B6760] leading-relaxed">
                    {textoVigente.replace(/^\[NO EXISTE\]\s*/, '').replace(/^\[NO DISPONIBLE.*?\]\s*/, '')}
                  </p>
                </div>
              ) : (
                <pre className="text-[12px] text-[#3A3832] leading-[1.7] whitespace-pre-wrap font-mono">
                  {textoVigente}
                </pre>
              )}
            </div>
          </div>

          {/* Panel derecho: Adendo propuesto — texto grande y prominente */}
          <div className="flex flex-col flex-1 min-w-0">
            <div className="shrink-0 px-4 py-2 border-b border-[#E8E4DC] bg-[#EAF3DE]/40">
              <div className="flex items-center gap-2">
                <p className="text-[10px] uppercase tracking-widest text-[#3B6D11]">
                  ✏️ Adendo {adendo?.id} — {adendo?.titulo}
                </p>
                <span className="inline-flex rounded-full bg-[#EAF3DE] border border-[#3B6D11]/30 px-2 py-0.5 text-[10px] font-medium text-[#3B6D11]">
                  {adendo?.tecnica}
                </span>
                <span className="text-[9px] font-medium text-[#D97706] uppercase tracking-wide ml-auto">
                  [BORRADOR — revisión legal]
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {/* Texto del adendo — grande y legible */}
              <pre className="text-[14px] leading-[1.85] whitespace-pre-wrap font-sans text-[#1C1B18]">
                {textoPropuesto}
              </pre>
            </div>

            {/* Efecto operativo */}
            {efectoOp && (
              <div className="shrink-0 border-t border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-[#A8A49C] mb-1">Efecto operativo</p>
                <p className="text-[12px] text-[#6B6760] leading-relaxed">{efectoOp}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Pie ──────────────────────────────────────────────────── */}
        <div className="shrink-0 border-t border-[#E8E4DC] bg-[#FAF8F5] px-5 py-2">
          <p className="text-[10px] text-[#A8A49C]">
            trace: CLC-ADENDOS-Q013 · [BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos] ·
            Verificar vigencia en fuente oficial (POE, DOF o Gaceta municipal).
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
