'use client'
/**
 * M03B · Marco legal — Diagnóstico Jurídico Municipal
 *
 * Principio: Una ZM no es un municipio.
 * Flujo principal: municipios activos primero (capa municipal).
 * Coordinación metropolitana (capa ZM) va en un bloque colapsable al final —
 * sin pestaña paralela, para no mezclar lectura municipal con opciones de ámbito ZM.
 *
 * Fuente: GET /legal/zm/{zm}/paquete
 * Referencia local: datos de catálogo si no hay API.
 */
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'
import { EditorialCallout } from '@/components/editorial/EditorialCallout'
import { FuenteReglamentoIcon } from '@/components/reglamento/FuenteReglamentoIcon'
import { getApiUrl } from '@/lib/api'
import { LEGAL_PDF_UPLOADED_EVENT, pdfListoParaAnalisis } from '@/lib/legalPdfGate'
import { withRequestId } from '@/lib/requestId'
import type {
  EstadoArticulo, Criticidad, LegalDiagnostic,
  PaqueteMetropolitano, DiagnosticoMunicipal, ReformEstrategia,
  SeleccionMunicipioCatalog,
} from '@/types'

// ─── Helpers visuales ─────────────────────────────────────────────────────────

function estadoChip(estado: EstadoArticulo) {
  switch (estado) {
    case 'presente_adecuado': return { bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]',  label: 'Adecuado' }
    case 'presente_obsoleto': return { bg: 'bg-[#FEF7E7]', text: 'text-[#D4881E]',  label: 'Obsoleto' }
    case 'ausente':           return { bg: 'bg-[#FBEAEA]', text: 'text-[#C0392B]',  label: 'Ausente' }
    case 'conflicto':         return { bg: 'bg-[#F3EAF5]', text: 'text-[#7B3FA0]',  label: 'Conflicto' }
  }
}

function scoreBadge(score: number) {
  if (score >= 70) return { color: '#3B6D11', bg: '#EAF3DE' }
  if (score >= 45) return { color: '#D4881E', bg: '#FEF7E7' }
  return { color: '#C0392B', bg: '#FBEAEA' }
}

const ESTRATEGIA_META: Record<ReformEstrategia, { label: string; color: string; bg: string }> = {
  A: { label: 'Reforma puntual',   color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]' },
  B: { label: 'Reforma integral',  color: 'text-[#D4881E]', bg: 'bg-[#FEF7E7]' },
  C: { label: 'Nuevo reglamento',  color: 'text-[#C0392B]', bg: 'bg-[#FBEAEA]' },
  D: { label: 'Decreto urgencia',  color: 'text-[#7B3FA0]', bg: 'bg-[#F3EAF5]' },
}

function validationLabel(status: string) {
  switch (status) {
    case 'validado_externamente': return 'validado externamente'
    case 'pendiente_validacion_juridica': return 'pendiente validacion juridica'
    case 'no_disponible': return 'fuente no disponible'
    default: return status
  }
}

const CONVENIO_BADGE: Record<string, { label: string; color: string }> = {
  firmado:    { label: 'Firmado',  color: 'text-[#3B6D11]' },
  borrador:   { label: 'Borrador', color: 'text-[#D4881E]' },
  pendiente:  { label: 'Pendiente', color: '#6B6760' },
  no_existe:  { label: 'No existe', color: 'text-[#C0392B]' },
}

function nombreActivo(
  mid: string,
  dm: DiagnosticoMunicipal | undefined,
  catalog: SeleccionMunicipioCatalog | null,
) {
  if (dm?.municipio_nombre) return dm.municipio_nombre
  if (catalog?.municipioSimulatorId === mid) return catalog.nombre
  return mid.toUpperCase()
}

function TarjetaReglamentoPendiente({
  municipioId,
  municipioNombre,
  sinPaquete,
  manifestNextAction,
}: {
  municipioId: string
  municipioNombre: string
  sinPaquete: boolean
  manifestNextAction?: string
}) {
  return (
    <div className="rounded-[12px] border border-[#D4881E]/35 bg-[#FEF7E7]/70 p-4 ring-2 ring-[#3B6D11]/15">
      <p className="text-[13px] font-medium text-[#1C1B18]">{municipioNombre}</p>
      <p className="font-mono text-[11px] text-[#A8A49C] mt-0.5">{municipioId}</p>
      <p className="mt-2 text-[11px] leading-relaxed text-[#6B6760]">
        {sinPaquete
          ? (
              <>
                Este municipio no aparece en el paquete legal del backend (sin fila en{' '}
                <span className="font-mono text-[10px]">paquete_municipal</span>
                : reglamento no catalogado en repositorio). La matriz de diagnóstico jurídico permanece oculta hasta incorporar la fuente.
              </>
            )
          : (
              <>
                Aún no hay PDF del reglamento cargado en la plataforma. Suba el archivo en{' '}
                <a href="#panel-reglamento-ciudad" className="text-[#1A5FA8] underline underline-offset-2">
                  Alimentar reglamento
                </a>
                {' '}para habilitar el análisis jurídico de este municipio.
              </>
            )}
      </p>
      {manifestNextAction && (
        <p className="mt-2 text-[11px] text-[#1C1B18]">
          <span className="font-medium">Acción siguiente (manifiesto): </span>
          <span className="text-[#6B6760]">{manifestNextAction}</span>
        </p>
      )}
      <p className="mt-2 text-[11px]">
        <a href="#panel-reglamento-ciudad" className="text-[#1A5FA8] underline underline-offset-2">
          Ir a «Alimentar reglamento (PDF)»
        </a>
      </p>
    </div>
  )
}

function diagnosticoTituloTeaser() {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">
        M03B · Marco legal — Diagnóstico jurídico municipal
      </p>
    </div>
  )
}

// ─── Tarjeta por municipio ────────────────────────────────────────────────────

function TarjetaMunicipio({
  dm, isActive, expandido, onToggle,
}: {
  dm: DiagnosticoMunicipal
  isActive: boolean
  expandido: boolean
  onToggle: () => void
}) {
  const d    = dm.diagnostic
  const s    = dm.strategy
  const meta = ESTRATEGIA_META[s.estrategia]
  const sb   = scoreBadge(d.score_legal)
  const manifest = d.source_manifest
  const legalValidated = d.legal_validation_status === 'validado_externamente'

  return (
    <div className={cn(
      'rounded-[12px] border transition-all',
      !legalValidated ? 'border-[#7B3FA0]/30 bg-[#F9F5FC]' : 'border-[#E8E4DC] bg-[#FDFCFA]',
      isActive && 'ring-2 ring-[#3B6D11]/20',
    )}>
      {/* Header de la tarjeta */}
      <div className="flex items-stretch gap-1">
        <button type="button" className="min-w-0 flex-1 text-left p-4" onClick={onToggle}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Score badge */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-mono text-[13px] font-bold"
                style={{ backgroundColor: sb.bg, color: sb.color }}
              >
                {d.score_legal}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[13px] font-medium text-[#1C1B18] truncate">{dm.municipio_nombre}</p>
                  {legalValidated
                    ? (
                      <span className="text-[10px] bg-[#EAF3DE] text-[#3B6D11] px-1.5 py-0.5 rounded-full shrink-0">
                        validado juridicamente
                      </span>
                      )
                    : (
                      <span className="text-[10px] bg-[#F3EAF5] text-[#7B3FA0] px-1.5 py-0.5 rounded-full shrink-0">
                        pendiente validacion
                      </span>
                      )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', meta.bg, meta.color)}>
                    {s.estrategia} — {meta.label}
                  </span>
                  <span className="text-[10px] text-[#A8A49C]">{s.plazo_meses}m</span>
                  <span className="text-[10px] text-[#A8A49C]">brecha {d.brecha_critica} crítica</span>
                </div>
              </div>
            </div>
            <span className="font-mono text-[12px] text-[#A8A49C] shrink-0">{expandido ? '▲' : '▼'}</span>
          </div>
        </button>
        <div className="flex shrink-0 items-center pr-3" onMouseDown={e => e.preventDefault()}>
          <FuenteReglamentoIcon
            municipioId={dm.municipio_id}
            label={`Fuente primaria del reglamento — ${dm.municipio_nombre}`}
          />
        </div>
      </div>

      {/* Detalle expandible */}
      {expandido && (
        <div className="px-4 pb-4 border-t border-[#E8E4DC] pt-3 space-y-3">
          {/* Reglamento */}
          <div>
            <p className="text-[10px] text-[#A8A49C] mb-0.5">Reglamento</p>
            <p className="text-[12px] text-[#1C1B18]">{d.reglamento_nombre}</p>
            <p className="font-mono text-[11px] text-[#A8A49C]">v{d.reglamento_version} · {d.reglamento_fuente}</p>
            <p className="mt-1 text-[11px] text-[#6B6760]">
              Manifest: {manifest.ingest_status} · {validationLabel(d.legal_validation_status)}
            </p>
            <p className="mt-1 text-[11px] text-[#6B6760]">
              Oficialidad: {d.officiality}. ALQUIMIA no emite dictamen ni documento oficial.
            </p>
            {manifest.official_url && (
              <p className="mt-1 text-[11px] text-[#6B6760] break-all">Fuente localizada: {manifest.official_url}</p>
            )}
            {manifest.checksum_sha256 && (
              <details className="mt-1 rounded-[6px] border border-[#E8E4DC] bg-white px-2 py-1 text-[10px] text-[#8A857C]">
                <summary className="cursor-pointer font-medium text-[#6B6760]">Ver huella técnica SHA-256</summary>
                <p className="mt-1 break-all font-mono">{manifest.checksum_sha256}</p>
              </details>
            )}
          </div>

          {/* Alcance municipal para oficialidad */}
          {(!d.can_enable_sanctions || !d.can_generate_official_document) && (
            <div className="bg-[#F3EAF5] rounded-[8px] p-3">
              <p className="text-[11px] text-[#7B3FA0] font-medium mb-1">Restricción de oficialidad municipal</p>
              {d.sanctions_blocked_reason && (
                <p className="text-[11px] text-[#6B6760]">{d.sanctions_blocked_reason}</p>
              )}
              {d.official_document_blocked_reason && (
                <p className="mt-1 text-[11px] text-[#6B6760]">{d.official_document_blocked_reason}</p>
              )}
              <p className="mt-2 text-[11px] text-[#1C1B18] font-medium">Accion siguiente</p>
              <p className="text-[11px] text-[#6B6760]">{d.next_action}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[8px] bg-[#EAF3DE] p-3">
              <p className="text-[10px] text-[#3B6D11] font-medium">Educacion y simulacion</p>
              <p className="text-[11px] text-[#6B6760]">Permitidas con advertencias y fuente trazada.</p>
            </div>
            <div className="rounded-[8px] bg-[#FEF7E7] p-3">
              <p className="text-[10px] text-[#D4881E] font-medium">Sanciones/documentos oficiales</p>
              <p className="text-[11px] text-[#6B6760]">
                {d.can_enable_sanctions ? 'Con revisión competente declarada.' : 'Restringidas hasta revisión competente.'}
              </p>
            </div>
          </div>

          {/* Estrategia */}
          <div className={cn('rounded-[8px] p-3', meta.bg)}>
            <p className={cn('text-[11px] font-medium mb-1', meta.color)}>Estrategia {s.estrategia} — {s.plazo_meses} meses</p>
            <p className="text-[11px] text-[#6B6760]">{s.descripcion}</p>
            <p className="mt-2 text-[10px] text-[#8A857C]">{d.legal_disclaimer}</p>
            {s.articulos_clave.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {s.articulos_clave.map(n => (
                  <span
                    key={n}
                    className="inline-flex items-center gap-0.5 rounded-full border border-[#E8E4DC] bg-white/70 py-0.5 pl-1.5 pr-0.5"
                  >
                    <span className="font-mono text-[10px] text-[#6B6760]">{n}</span>
                    <FuenteReglamentoIcon
                      municipioId={dm.municipio_id}
                      className="rounded-full border-transparent p-0.5 hover:bg-[#EAF3DE]"
                      label={`Consultar texto oficial relacionado con ${n} (${dm.municipio_nombre})`}
                    />
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Matriz artículos compacta */}
          <div className="mb-1 flex items-center justify-between gap-2">
            <span className="text-[10px] text-[#A8A49C]">Matriz compacta por artículo (insumo simulador)</span>
            <FuenteReglamentoIcon
              municipioId={dm.municipio_id}
              label={`Reglamento de referencia — ${dm.municipio_nombre}`}
              className="rounded-md"
            />
          </div>
          <div className="grid grid-cols-6 gap-1">
            {d.articulos.map((a, i) => {
              const c = estadoChip(a.estado)
              return (
                <div
                  key={i}
                  title={`${a.numero} — ${a.titulo}: ${a.estado}`}
                  className={cn('rounded-[6px] text-center px-1 py-1 text-[9px] font-medium cursor-help', c.bg, c.text)}
                >
                  {c.label}
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 text-[10px] text-[#A8A49C]">
            <span>Adecuado</span><span>Obsoleto</span><span>Ausente</span><span>Conflicto</span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Capa 2 — Coordinación metropolitana ─────────────────────────────────────

function CoordinacionMetro({ p }: { p: PaqueteMetropolitano }) {
  const c = p.paquete_metropolitano
  const cb = CONVENIO_BADGE[c.convenio_marco_zm] ?? CONVENIO_BADGE['pendiente']

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-[#6B6760] rounded-[8px] border border-[#E8E4DC] bg-[#FAF9F7] px-3 py-2">
        Coordinación territorial y convenios entre municipios. No habilita sanciones ni reglamentos a nombre
        de la ZM como autoridad ficticia única; cada decisión ejecutable sigue ligada al municipio activo mostrado en Capa&nbsp;1.
      </p>
      {/* Convenio marco */}
      <div className="flex items-center justify-between">
        <p className="text-[12px] font-medium text-[#1C1B18]">Convenio marco ZM</p>
        <span className={cn('text-[11px] font-medium', cb.color)}>{cb.label}</span>
      </div>

      {/* Grid de atributos */}
      <div className="space-y-2">
        {[
          { label: 'Homologación fracciones', value: c.homologacion_fracciones },
          { label: 'Estándar de datos',       value: c.estandar_datos         },
          { label: 'Interoperabilidad rutas', value: c.interoperabilidad_rutas },
          { label: 'Infraestructura compartida', value: c.infraestructura_compartida },
        ].map(row => (
          <div key={row.label} className="bg-[#F4F1EB] rounded-[8px] p-3">
            <p className="text-[10px] text-[#A8A49C] mb-0.5">{row.label}</p>
            <p className="text-[12px] text-[#1C1B18] leading-snug">{row.value}</p>
          </div>
        ))}
      </div>

      {/* Municipios líderes */}
      {c.municipios_lider.length > 0 && (
        <div>
          <p className="text-[11px] text-[#6B6760] mb-1">Municipio(s) que deben moverse primero:</p>
          <div className="flex flex-wrap gap-1">
            {c.municipios_lider.map(m => (
              <span key={m} className="font-mono text-[11px] bg-[#EAF3DE] text-[#3B6D11] px-2 py-0.5 rounded-full font-medium">
                {m.toUpperCase()} ★
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Oleadas */}
      {c.oleadas.length > 0 && (
        <div>
          <p className="text-[11px] font-medium text-[#6B6760] mb-2">Estrategia de oleadas</p>
          <div className="space-y-2">
            {c.oleadas.map(o => (
              <div key={o.numero} className="flex gap-3 items-start">
                <span className="font-mono text-[11px] bg-[#E2DED6] text-[#6B6760] px-2 py-0.5 rounded-full shrink-0 mt-0.5">
                  O{o.numero}
                </span>
                <div>
                  <p className="text-[12px] font-medium text-[#1C1B18]">{o.nombre}</p>
                  <p className="text-[11px] text-[#6B6760]">{o.descripcion}</p>
                  <p className="text-[10px] text-[#A8A49C] mt-0.5">
                    Mes {o.mes_inicio}–{o.mes_fin} · {o.municipios.map(m => m.toUpperCase()).join(', ')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota estratégica */}
      {c.nota && (
        <div className="bg-[#F4F1EB] rounded-[10px] p-4 border-l-4 border-[#3B6D11]">
          <p className="text-[11px] text-[#1C1B18] leading-relaxed">{c.nota}</p>
        </div>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function DiagnosticoJuridico() {
  const { zmActiva, municipiosActivos, seleccionMunicipioCatalog, setAgoraLegalBloqueado }
    = useSimulatorStore()

  const [paquete,  setPaquete]  = useState<PaqueteMetropolitano | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [legalRefreshSeq, setLegalRefreshSeq] = useState(0)

  useEffect(() => {
    const onUploaded = () => setLegalRefreshSeq(n => n + 1)
    window.addEventListener(LEGAL_PDF_UPLOADED_EVENT, onUploaded)
    return () => window.removeEventListener(LEGAL_PDF_UPLOADED_EVENT, onUploaded)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(null)
    const apiUrl = getApiUrl()

    fetch(`${apiUrl}/legal/zm/${zmActiva}/paquete`, withRequestId())
      .then(r => {
        if (!r.ok) throw new Error(`Legal municipal no disponible: ${r.status}`)
        return r.json()
      })
      .then(data => {
        const p = data as PaqueteMetropolitano
        setPaquete(p)
        const faltaReglamentoOCatalogo = municipiosActivos.some((mid) => {
          const dm = p.paquete_municipal.find(x => x.municipio_id === mid)
          return !dm || !pdfListoParaAnalisis(dm.diagnostic.source_manifest) || dm.diagnostic.agora_bloqueado
        })
        setAgoraLegalBloqueado(faltaReglamentoOCatalogo)
        useSimulatorStore.getState().setMunicipioPdfHabilitado(!faltaReglamentoOCatalogo)
      })
      .catch(() => {
        // Sin API legal no hay fuente municipal validada: restringir sanciones/documentos oficiales.
        setPaquete(null)
        setError('No se pudo cargar el contexto legal municipal. Sanciones y documentos oficiales quedan restringidos; educación, análisis y propuestas pueden continuar.')
        setAgoraLegalBloqueado(true)
      })
      .finally(() => setLoading(false))
  }, [zmActiva, municipiosActivos, setAgoraLegalBloqueado, legalRefreshSeq])

  if (loading) {
    return (
      <div>
        {diagnosticoTituloTeaser()}
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[#E2DED6] rounded-[10px]" />)}
        </div>
      </div>
    )
  }

  if (!paquete) {
    return (
      <div>
        {diagnosticoTituloTeaser()}
        <div className={cn(
        'rounded-[10px] border p-4',
        error ? 'border-red-200 bg-red-50' : 'border-[#E8E4DC] bg-[#FDFCFA]'
      )}>
        <p className={cn('text-[12px] font-medium', error ? 'text-red-800' : 'text-[#1C1B18]')}>
          {error ? 'Error de contexto legal municipal' : `Sin datos jurídicos disponibles para ${zmActiva}.`}
        </p>
        <p className={cn('mt-1 text-[12px]', error ? 'text-red-800' : 'text-[#6B6760]')}>
          {error ?? 'Selecciona una ciudad/ZM con municipios registrados para consultar diagnósticos por municipio.'}
        </p>
        <p className="mt-2 text-[11px] text-[#8A857C]">
          Acción siguiente: revisar disponibilidad del paquete jurídico municipal y volver a cargar el simulador.
        </p>
      </div>
      </div>
    )
  }

  const diagnosticables = municipiosActivos
    .map(mid => paquete.paquete_municipal.find(x => x.municipio_id === mid))
    .filter((dm): dm is DiagnosticoMunicipal =>
      dm != null && pdfListoParaAnalisis(dm.diagnostic.source_manifest),
    )

  const inactivos = paquete.paquete_municipal.filter(dm => !municipiosActivos.includes(dm.municipio_id))
  const legalBloqueados = paquete.paquete_municipal.filter(
    dm => !dm.diagnostic.can_enable_sanctions || !dm.diagnostic.can_generate_official_document
  )

  return (
    <div className="space-y-5">
      {diagnosticoTituloTeaser()}
      <EditorialCallout label="Paquete ZM = coordinación; artículos y scores = municipio">
        <p>
          El paquete metropolitano resume convenios, datos e infraestructura compartida; los artículos del reglamento,
          el score legal y las banderas de sanciones/documento oficial se evalúan por municipio. Fuentes no validadas o
          referencias de catálogo se muestran según el API; validar con jurídico institucional antes de actos de autoridad.
        </p>
        <p className="mt-2 text-[12px] text-[#8A857C]">
          Sin municipio activo explícito en la simulación no hay alcance para evaluar propuestas sancionatorias desde esta vista.
        </p>
      </EditorialCallout>

      <div className="space-y-2">
        <p className="text-[12px] font-medium text-[#1C1B18]">Legal municipal independiente</p>
        <p className="text-[12px] leading-relaxed text-[#6B6760]">
          La ZM coordina territorio; no sustituye reglamentos municipales. Cada tarjeta conserva fuente,
          manifest, validacion juridica, restricciones y accion siguiente por municipio. ALQUIMIA genera
          simulaciones e insumos expositivos, no dictamen legal ni documento oficial.
        </p>
      </div>

      <KpiAnchorGrid
        columns={3}
        items={[
          { label: 'municipios ZM', value: String(paquete.total_municipios) },
          {
            label: 'sin validacion legal',
            value: String(legalBloqueados.length),
            figureClassName: legalBloqueados.length > 0 ? 'text-[#7B3FA0]' : 'text-[#3B6D11]',
          },
          {
            label: 'score jurídico ZM',
            value: String(paquete.score_legal_zm),
            figureClassName:
              paquete.score_legal_zm >= 70
                ? 'text-[#3B6D11]'
                : paquete.score_legal_zm >= 45
                  ? 'text-[#D4881E]'
                  : 'text-[#C0392B]',
          },
        ]}
      />

      {/* ── Aviso global si hay municipios activos con restricciones ────── */}
      {diagnosticables.some(dm => !dm.diagnostic.can_enable_sanctions || !dm.diagnostic.can_generate_official_document) && (
        <div className="bg-[#F3EAF5] border border-[#7B3FA0]/30 rounded-[12px] p-4">
          <p className="text-[12px] font-medium text-[#7B3FA0] mb-1">
            Sanciones y documentos oficiales restringidos por municipio
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {diagnosticables.filter(dm => !dm.diagnostic.can_enable_sanctions || !dm.diagnostic.can_generate_official_document).map(dm => (
              <span key={dm.municipio_id} className="text-[11px] bg-white/60 text-[#7B3FA0] px-2 py-0.5 rounded-full border border-[#7B3FA0]/20">
                {dm.municipio_nombre}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-[#A8A49C] mt-2">
            Validar fuente legal municipal con autoridad/jurista competente. Educacion y simulacion pueden continuar con advertencias.
          </p>
        </div>
      )}

      {/* ── Capa municipal (siempre visible) ───────────────────────────── */}
      <div id="diagnostico-panel-municipal" className="space-y-3">
        {municipiosActivos.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#A8A49C] mb-2">Municipios activos en la simulación</p>
            <div className="space-y-2">
              {municipiosActivos.map((mid) => {
                const dm = paquete.paquete_municipal.find(x => x.municipio_id === mid)
                const bloqueadoReglamento = !dm || !pdfListoParaAnalisis(dm.diagnostic.source_manifest)
                const nombre = nombreActivo(mid, dm, seleccionMunicipioCatalog)
                if (bloqueadoReglamento) {
                  return (
                    <TarjetaReglamentoPendiente
                      key={mid}
                      municipioId={mid}
                      municipioNombre={nombre}
                      sinPaquete={!dm}
                      manifestNextAction={dm?.diagnostic.source_manifest.next_action}
                    />
                  )
                }
                return (
                  <TarjetaMunicipio
                    key={mid}
                    dm={dm}
                    isActive={true}
                    expandido={expandido === dm.municipio_id}
                    onToggle={() => setExpandido(expandido === dm.municipio_id ? null : dm.municipio_id)}
                  />
                )
              })}
            </div>
          </div>
        )}

        {inactivos.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wide text-[#A8A49C] mb-2 mt-4">Otros municipios de la ZM</p>
            <div className="space-y-2">
              {inactivos.map(dm => (
                <TarjetaMunicipio
                  key={dm.municipio_id}
                  dm={dm}
                  isActive={false}
                  expandido={expandido === dm.municipio_id}
                  onToggle={() => setExpandido(expandido === dm.municipio_id ? null : dm.municipio_id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Coordinación ZM: colapsable (sin pestaña) ─────────────────── */}
      <details className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-3">
        <summary className="cursor-pointer text-[12px] font-semibold text-[#6B6760] outline-none hover:text-[#1C1B18]">
          Coordinación metropolitana{' '}
          <span className="font-normal text-[#A8A49C]">— convenios e infra compartida</span>
        </summary>
        <div id="diagnostico-panel-metropolitano" className="mt-3 border-t border-[#EDE9E2] pt-3">
          <CoordinacionMetro p={paquete} />
        </div>
      </details>

      <p className="text-[10px] text-[#A8A49C]">Motor Jurídico v1.5 · ZM ≠ municipio</p>
    </div>
  )
}
