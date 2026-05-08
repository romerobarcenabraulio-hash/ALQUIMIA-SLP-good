'use client'
/**
 * S4.6 — Diagnóstico Jurídico Municipal
 *
 * Principio: Una ZM no es un municipio.
 * Muestra el paquete metropolitano de dos capas:
 *
 *  Capa 1 — Municipios individuales:
 *    Cada municipio activo con su propio diagnóstico,
 *    score legal, estrategia de reforma, manifest y bloqueo municipal.
 *
 *  Capa 2 — Coordinación metropolitana:
 *    Convenio marco, homologación, estándar de datos,
 *    infraestructura compartida y oleadas de implementación.
 *
 * Fuente: GET /legal/zm/{zm}/paquete
 * Fallback: datos seed estáticos si no hay API.
 */
import { useEffect, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { cn } from '@/lib/utils'
import { FuenteReglamentoIcon } from '@/components/reglamento/FuenteReglamentoIcon'
import { getApiUrl } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'
import type {
  EstadoArticulo, Criticidad, LegalDiagnostic,
  PaqueteMetropolitano, DiagnosticoMunicipal, ReformEstrategia,
} from '@/types'

// ─── Helpers visuales ─────────────────────────────────────────────────────────

function estadoChip(estado: EstadoArticulo) {
  switch (estado) {
    case 'presente_adecuado': return { bg: 'bg-[#EAF3DE]', text: 'text-[#3B6D11]',  label: '✅' }
    case 'presente_obsoleto': return { bg: 'bg-[#FEF7E7]', text: 'text-[#D4881E]',  label: '⚠️' }
    case 'ausente':           return { bg: 'bg-[#FBEAEA]', text: 'text-[#C0392B]',  label: '❌' }
    case 'conflicto':         return { bg: 'bg-[#F3EAF5]', text: 'text-[#7B3FA0]',  label: '🔴' }
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
  firmado:    { label: '✓ Firmado',  color: 'text-[#3B6D11]' },
  borrador:   { label: '⟳ Borrador', color: 'text-[#D4881E]' },
  pendiente:  { label: '◎ Pendiente', color: '#6B6760' },
  no_existe:  { label: '✗ No existe', color: 'text-[#C0392B]' },
}

function diagnosticoTituloTeaser() {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">
        S4.6 — Diagnóstico jurídico municipal
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
              <p className="mt-1 font-mono text-[10px] text-[#8A857C] break-all">sha256: {manifest.checksum_sha256}</p>
            )}
          </div>

          {/* Gate legal municipal */}
          {(!d.can_enable_sanctions || !d.can_generate_official_document) && (
            <div className="bg-[#F3EAF5] rounded-[8px] p-3">
              <p className="text-[11px] text-[#7B3FA0] font-medium mb-1">Bloqueo legal municipal</p>
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
                {d.can_enable_sanctions ? 'Habilitadas por validacion competente.' : 'Bloqueadas hasta validacion competente.'}
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
                  className={cn('rounded-[6px] text-center py-1 text-[10px] font-mono cursor-help', c.bg, c.text)}
                >
                  {c.label}
                </div>
              )
            })}
          </div>
          <div className="flex gap-3 text-[10px] text-[#A8A49C]">
            <span>✅ adecuado</span><span>⚠️ obsoleto</span><span>❌ ausente</span><span>🔴 conflicto</span>
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
        de la ZM como autoridad ficticia única — cada decisión ejecutable sigue ligada al{' '}
        <span className="font-mono">municipio_id</span> activo mostrado en Capa&nbsp;1.
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
  const { zmActiva, municipiosActivos, setAgoraLegalBloqueado } = useSimulatorStore()

  const [paquete,  setPaquete]  = useState<PaqueteMetropolitano | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [tab,      setTab]      = useState<'municipal' | 'metropolitano'>('municipal')
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
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
        // Gate legal: bloqueado si cualquier municipio activo no puede habilitar
        // sanciones o documento oficial por falta de validación competente.
        const activosBloqueados = p.paquete_municipal.some(
          dm => municipiosActivos.includes(dm.municipio_id)
            && (!dm.diagnostic.can_enable_sanctions || !dm.diagnostic.can_generate_official_document)
        )
        setAgoraLegalBloqueado(activosBloqueados)
      })
      .catch(() => {
        // Sin API legal no hay fuente municipal validada: bloquear sanciones/documentos oficiales.
        setPaquete(null)
        setError('No se pudo cargar el contexto legal municipal. Sanciones y documentos oficiales quedan bloqueados.')
        setAgoraLegalBloqueado(true)
      })
      .finally(() => setLoading(false))
  }, [zmActiva, municipiosActivos, setAgoraLegalBloqueado])

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
          Acción siguiente: consultar /legal/{'<municipio>'}/context o revisar disponibilidad de /legal/zm/{'<zm>'}/paquete.
        </p>
      </div>
      </div>
    )
  }

  const activos    = paquete.paquete_municipal.filter(dm => municipiosActivos.includes(dm.municipio_id))
  const inactivos  = paquete.paquete_municipal.filter(dm => !municipiosActivos.includes(dm.municipio_id))
  const legalBloqueados = paquete.paquete_municipal.filter(
    dm => !dm.diagnostic.can_enable_sanctions || !dm.diagnostic.can_generate_official_document
  )

  return (
    <div className="space-y-5">
      {diagnosticoTituloTeaser()}
      <div className="rounded-[12px] border border-[#1A5FA8]/25 bg-[#EBF3FB]/40 p-4">
        <p className="text-[12px] font-semibold text-[#1C1B18]">Paquete ZM = coordinación; artículos y scores = municipio</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
          El paquete metropolitano resume convenios, datos e infraestructura compartida; los artículos del reglamento,
          el score legal y las banderas <span className="font-mono">can_enable_sanctions</span> / documento oficial se
          evalúan por <span className="font-mono">municipio_id</span>. Fuentes no validadas o simulación semilla se
          muestran según el API; validar con jurídico institucional antes de actos de autoridad.
        </p>
        <p className="mt-2 text-[11px] text-[#8A857C]">
          Sin municipio activo explícito en la simulación no hay alcance para proponer sanciones ejecutables desde esta vista.
        </p>
      </div>

      {/* ── Resumen ZM ──────────────────────────────────────────────────── */}
      <div className="rounded-[10px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <p className="text-[12px] font-medium text-[#1C1B18]">Legal municipal independiente</p>
        <p className="mt-1 text-[12px] leading-relaxed text-[#6B6760]">
          La ZM coordina territorio; no sustituye reglamentos municipales. Cada tarjeta conserva fuente,
          manifest, validacion juridica, bloqueos y accion siguiente por municipio. ALQUIMIA genera
          simulaciones e insumos expositivos, no dictamen legal ni documento oficial.
        </p>
      </div>

      {/* ── Resumen ZM ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[10px] p-3 text-center">
          <p className="font-mono text-[22px] font-medium text-[#1C1B18]">{paquete.total_municipios}</p>
          <p className="text-[10px] text-[#A8A49C]">municipios ZM</p>
        </div>
        <div className={cn(
          'rounded-[10px] p-3 text-center border',
          legalBloqueados.length > 0 ? 'bg-[#F3EAF5] border-[#7B3FA0]/20' : 'bg-[#EAF3DE] border-[#3B6D11]/20'
        )}>
          <p className={cn('font-mono text-[22px] font-medium',
            legalBloqueados.length > 0 ? 'text-[#7B3FA0]' : 'text-[#3B6D11]'
          )}>
            {legalBloqueados.length}
          </p>
          <p className="text-[10px] text-[#A8A49C]">sin validacion legal</p>
        </div>
        <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[10px] p-3 text-center">
          <p className={cn('font-mono text-[22px] font-medium',
            paquete.score_legal_zm >= 70 ? 'text-[#3B6D11]' : paquete.score_legal_zm >= 45 ? 'text-[#D4881E]' : 'text-[#C0392B]'
          )}>
            {paquete.score_legal_zm}
          </p>
          <p className="text-[10px] text-[#A8A49C]">score jurídico ZM</p>
        </div>
      </div>

      {/* ── Gate global si hay municipios activos bloqueados ────────────── */}
      {activos.some(dm => !dm.diagnostic.can_enable_sanctions || !dm.diagnostic.can_generate_official_document) && (
        <div className="bg-[#F3EAF5] border border-[#7B3FA0]/30 rounded-[12px] p-4">
          <p className="text-[12px] font-medium text-[#7B3FA0] mb-1">
            Sanciones y documentos oficiales bloqueados por municipio
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {activos.filter(dm => !dm.diagnostic.can_enable_sanctions || !dm.diagnostic.can_generate_official_document).map(dm => (
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

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F0EDE5] p-1 rounded-[10px]">
        {(['municipal', 'metropolitano'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 text-[12px] py-1.5 rounded-[8px] font-medium transition-all',
              tab === t ? 'bg-white text-[#1C1B18] shadow-sm' : 'text-[#6B6760] hover:text-[#1C1B18]'
            )}
          >
            {t === 'municipal' ? `Capa 1 — Municipal (${paquete.total_municipios})` : 'Capa 2 — Coordinación ZM'}
          </button>
        ))}
      </div>

      {/* ── Capa 1: Municipios ──────────────────────────────────────────── */}
      {tab === 'municipal' && (
        <div className="space-y-3">
          {activos.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wide text-[#A8A49C] mb-2">Municipios activos en la simulación</p>
              <div className="space-y-2">
                {activos.map(dm => (
                  <TarjetaMunicipio
                    key={dm.municipio_id}
                    dm={dm}
                    isActive={true}
                    expandido={expandido === dm.municipio_id}
                    onToggle={() => setExpandido(expandido === dm.municipio_id ? null : dm.municipio_id)}
                  />
                ))}
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
      )}

      {/* ── Capa 2: Coordinación metropolitana ─────────────────────────── */}
      {tab === 'metropolitano' && (
        <CoordinacionMetro p={paquete} />
      )}

      <p className="text-[10px] text-[#A8A49C]">Motor Jurídico v1.5 · ZM ≠ municipio</p>
    </div>
  )
}
