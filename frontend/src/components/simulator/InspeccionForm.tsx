'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'
import { useSimulatorStore } from '@/store/simulatorStore'
import { useDataPermissions } from '@/hooks/useDataPermissions'
import { cn, formatFastApiDetail } from '@/lib/utils'
import type {
  CatalogoEscalerasSlpDto,
  EscaleraSancionDto,
  ExpedienteSancionDto,
  InspeccionPrediaDto,
  PredioRegistroDto,
  TipoInfraccionPredia,
  NivelSancion,
} from '@/types/predios'
import { ExpedientePDF } from '@/components/simulator/ExpedientePDF'
import { EditorialCallout, MarginalNote } from '@/components/editorial'

const USO_SUELO = ['habitacional', 'comercial', 'industrial', 'baldío', 'otro'] as const

const TIPO_INFRACCION: {
  value: TipoInfraccionPredia
  label: string
  descripcion: string
}[] = [
  {
    value: 'basura_clandestina',
    label: 'Basura clandestina o tiradero informal',
    descripcion: 'Residuos acumulados en vía pública, lote o predio sin manejo autorizado y sin contención adecuada.',
  },
  {
    value: 'ca_sin_permiso',
    label: 'Centro de acopio sin permiso municipal',
    descripcion:
      'Sitio donde se recolectan o clasifican residuos tipo centro de acopio sin tener el permiso o registro municipal correspondiente.',
  },
  {
    value: 'mezcla_residuos_no_autorizada',
    label: 'Mezcla de residuos no permitida',
    descripcion:
      'Separación inadecuada (por ejemplo mezcla de ordinarios reciclables o de distintas fracciones) contraria al esquema municipal vigente.',
  },
  {
    value: 'vertedero_no_autorizado',
    label: 'Vertedero o deposición control no autorizada',
    descripcion: 'Depósito o confinamiento improvisado de residuos que opera como vertedero sin autorización ambiental o municipal.',
  },
  { value: 'otro', label: 'Otro (describir en hallazgo)', descripcion: 'Otro supuesto relacionado con manejo indebido de residuos en predio.' },
]

const NIVEL_ES: Record<string, string> = {
  aviso: 'aviso',
  advertencia: 'advertencia',
  multa_menor: 'multa menor',
  multa_media: 'multa media',
  multa_maxima: 'multa máxima',
  clausura: 'clausura',
}

function NivelSelect({
  opciones,
  value,
  onChange,
}: {
  opciones: EscaleraSancionDto[]
  value: NivelSancion | ''
  onChange: (n: NivelSancion) => void
}) {
  if (opciones.length <= 1) return null
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-[#6B6760]">Escalón de la escalera (opcional)</span>
      <select
        className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px]"
        value={value}
        onChange={e => onChange(e.target.value as NivelSancion)}
      >
        {opciones.map(o => (
          <option key={o.nivel} value={o.nivel}>
            {NIVEL_ES[o.nivel] ?? o.nivel} ({o.uma_minimo}–{o.uma_maximo} UMA)
          </option>
        ))}
      </select>
    </label>
  )
}

export function InspeccionForm() {
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const { canModifyParameters } = useDataPermissions()

  const opcionesMunicipioPredio = useMemo(() => {
    const raw = [...new Set(municipiosActivos.map(m => m.trim().toLowerCase()).filter(Boolean))]
    return raw.length > 0 ? raw : ['slp']
  }, [municipiosActivos])

  const [municipioExpediente, setMunicipioExpediente] = useState('slp')

  useEffect(() => {
    setMunicipioExpediente(prev => {
      if (prev && opcionesMunicipioPredio.includes(prev)) return prev
      if (opcionesMunicipioPredio.includes('slp')) return 'slp'
      return opcionesMunicipioPredio[0] ?? 'slp'
    })
  }, [opcionesMunicipioPredio])

  const escaleraSoloSlpCapital = municipioExpediente === 'slp'

  const [catalogo, setCatalogo] = useState<EscaleraSancionDto[]>([])
  const [valorUmaMxn, setValorUmaMxn] = useState<number | null>(null)
  const [direccion, setDireccion] = useState('')
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [uso, setUso] = useState<(typeof USO_SUELO)[number]>('habitacional')
  const [area, setArea] = useState('')
  const [notas, setNotas] = useState('')
  const [tipo, setTipo] = useState<TipoInfraccionPredia>('basura_clandestina')
  const [tienePermiso, setTienePermiso] = useState(false)
  const [permisoVigente, setPermisoVigente] = useState<'si' | 'no' | ''>('')
  const [hallazgo, setHallazgo] = useState('')
  const [inspectorNombre, setInspectorNombre] = useState('')
  const [inspectorCargo, setInspectorCargo] = useState('')
  const [nivelElegido, setNivelElegido] = useState<NivelSancion | ''>('')

  const [predio, setPredio] = useState<PredioRegistroDto | null>(null)
  const [inspeccion, setInspeccion] = useState<InspeccionPrediaDto | null>(null)
  const [expediente, setExpediente] = useState<ExpedienteSancionDto | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const base = getApiUrl()

  useEffect(() => {
    let cancel = false
    void (async () => {
      try {
        const r = await fetch(`${base}/predios/catalogo/sanciones-slp`, withRequestId({ cache: 'no-store' }))
        if (!r.ok) return
        const data = (await r.json()) as CatalogoEscalerasSlpDto
        if (!cancel) {
          setCatalogo(data.escaleras)
          setValorUmaMxn(data.valor_uma_referencia_mxn)
        }
      } catch {
        /* modo offline — la sección reactiva quedará vacía */
      }
    })()
    return () => {
      cancel = true
    }
  }, [base])

  const opcionesTipo = useMemo(
    () => catalogo.filter(e => e.descripcion_infraccion === tipo),
    [catalogo, tipo],
  )

  const filaPreview = useMemo(() => {
    if (!opcionesTipo.length) return null
    if (nivelElegido) {
      return opcionesTipo.find(o => o.nivel === nivelElegido) ?? opcionesTipo[0]
    }
    return opcionesTipo[0]
  }, [opcionesTipo, nivelElegido])

  useEffect(() => {
    setNivelElegido('')
  }, [tipo])

  const generarExpediente = useCallback(async () => {
    setError(null)
    setLoading(true)
    setPredio(null)
    setInspeccion(null)
    setExpediente(null)
    try {
      const latNum = lat.trim() === '' ? undefined : Number(lat)
      const lonNum = lon.trim() === '' ? undefined : Number(lon)
      const areaNum = area.trim() === '' ? undefined : Number(area)
      if (lat.trim() !== '' && Number.isNaN(latNum)) throw new Error('Latitud no numérica')
      if (lon.trim() !== '' && Number.isNaN(lonNum)) throw new Error('Longitud no numérica')
      if (area.trim() !== '' && Number.isNaN(areaNum)) throw new Error('Área no numérica')

      const bodyPredio = {
        municipio_id: municipioExpediente,
        direccion_texto: direccion.trim(),
        lat: latNum,
        lon: lonNum,
        uso_suelo_declarado: uso,
        area_m2: areaNum,
        notas: notas.trim() || undefined,
      }
      const r1 = await fetch(`${base}/predios/registro`, withRequestId({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPredio),
      }))
      if (!r1.ok)
        throw new Error(
          formatFastApiDetail(await r1.json().catch(() => null), 'Error al registrar predio'),
        )
      const pred = (await r1.json()) as PredioRegistroDto
      setPredio(pred)

      const bodyInspeccion = {
        fecha_inspeccion: new Date().toISOString().slice(0, 10),
        tipo_infraccion: tipo,
        descripcion_hallazgo: hallazgo.trim(),
        tiene_permiso_ca: tienePermiso,
        permiso_ca_vigente: tienePermiso
          ? permisoVigente === 'si'
            ? true
            : permisoVigente === 'no'
              ? false
              : undefined
          : undefined,
        inspector_nombre: inspectorNombre.trim() || undefined,
        inspector_cargo: inspectorCargo.trim() || undefined,
      }
      const r2 = await fetch(`${base}/predios/${pred.predio_id}/inspecciones`, withRequestId({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyInspeccion),
      }))
      if (!r2.ok)
        throw new Error(
          formatFastApiDetail(await r2.json().catch(() => null), 'Error al crear inspección'),
        )
      const ins = (await r2.json()) as InspeccionPrediaDto
      setInspeccion(ins)

      const bodyEx = {
        inspeccion_id: ins.inspeccion_id,
        nivel_sancion_sugerido: nivelElegido || undefined,
      }
      const r3 = await fetch(`${base}/predios/expedientes`, withRequestId({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyEx),
      }))
      if (!r3.ok) {
        const d = await r3.json().catch(() => null)
        throw new Error(
          formatFastApiDetail(
            d,
            'No se pudo generar expediente (¿municipio distinto de slp?).',
          ),
        )
      }
      const ex = (await r3.json()) as ExpedienteSancionDto
      setExpediente(ex)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [
    area,
    base,
    direccion,
    hallazgo,
    inspectorCargo,
    inspectorNombre,
    lat,
    lon,
    municipioExpediente,
    nivelElegido,
    notas,
    permisoVigente,
    tienePermiso,
    tipo,
    uso,
  ])

  if (!canModifyParameters) {
    return (
      <div className="space-y-4 rounded-xl border border-[#E8E4DC] bg-white p-5">
        <h2 className="font-serif text-[20px] text-[#1C1B18]">Formulario de Inspección</h2>
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <Lock className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-900">Acceso restringido</p>
            <p className="mt-1 text-sm text-amber-800">
              No tienes permisos para crear o editar datos de inspección. Contacta a un administrador si necesitas acceso.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {!escaleraSoloSlpCapital && (
        <EditorialCallout tone="caution" label="Alcance de expediente">
          Municipio del predio seleccionado: <span className="font-mono">{municipioExpediente}</span>. La API no generará expediente con
          cálculo UMA si el predio no está en <span className="font-mono">slp</span> (error 422 con detalle legible). Elija{' '}
          <span className="font-mono">slp</span> para obtener el borrador de expediente capital.
        </EditorialCallout>
      )}

      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A8A49C]">1. Predio</p>
        <label className="block">
          <span className="text-[11px] font-medium text-[#6B6760]">Municipio del predio (expediente)</span>
          <select
            className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px] font-mono"
            value={municipioExpediente}
            onChange={e => setMunicipioExpediente(e.target.value.toLowerCase())}
          >
            {opcionesMunicipioPredio.map(mid => (
              <option key={mid} value={mid}>
                {mid}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-[11px] leading-snug text-[#8A857C]">
            El valor rige el registro del predio ante la API del expediente. La escalera de UMA sigue siendo sólo SLP capital en este
            sprint; otros municipios no completarán POST /predios/expedientes.
          </span>
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-[#6B6760]">Dirección o ubicación (texto libre)</span>
          <input
            className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
            value={direccion}
            onChange={e => setDireccion(e.target.value)}
            placeholder="Calle, número, colonia, referencias"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-medium text-[#6B6760]">Latitud (opcional, WGS84)</span>
            <input
              className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
              value={lat}
              onChange={e => setLat(e.target.value)}
              inputMode="decimal"
              placeholder="22.1512"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-[#6B6760]">Longitud (opcional, WGS84)</span>
            <input
              className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
              value={lon}
              onChange={e => setLon(e.target.value)}
              inputMode="decimal"
              placeholder="-100.9747"
            />
          </label>
        </div>
        {/* Map preview / Ver en mapa */}
        {(lat && lon) ? (
          <a
            href={`https://www.google.com/maps?q=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-[8px] border border-[#3B6D11] bg-[#F4FAEC] px-3 py-2 text-[11px] font-medium text-[#3B6D11] hover:bg-[#EAF3DE] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Ver en mapa · {lat}, {lon}
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 ml-auto text-[#8DB87A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        ) : (
          <MarginalNote className="rounded-[8px] border border-dashed border-[#C8C4BC] px-3 py-4 flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 text-[#C8C4BC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Captura coordenadas para ver la ubicación del predio en mapa · Orientativo, no constituye registro catastral oficial.</span>
          </MarginalNote>
        )}
        <label className="block">
          <span className="text-[11px] font-medium text-[#6B6760]">Uso de suelo declarado</span>
          <select
            className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px]"
            value={uso}
            onChange={e => setUso(e.target.value as (typeof USO_SUELO)[number])}
          >
            {USO_SUELO.map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-[#6B6760]">Área del predio (m², opcional)</span>
          <input
            className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
            value={area}
            onChange={e => setArea(e.target.value)}
            inputMode="decimal"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-medium text-[#6B6760]">Notas internas (opcional)</span>
          <textarea
            className="mt-1 min-h-[64px] w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
            value={notas}
            onChange={e => setNotas(e.target.value)}
          />
        </label>
      </section>

      <section className="rounded-[12px] border border-[#E8E4DC] bg-white p-4 space-y-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A8A49C]">2. Infracción</p>
        <label className="block">
          <span className="text-[11px] font-medium text-[#6B6760]">Tipo de situación observada</span>
          <select
            className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px]"
            value={tipo}
            onChange={e => setTipo(e.target.value as TipoInfraccionPredia)}
          >
            {TIPO_INFRACCION.map(t => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <p className="text-[11px] text-[#8A857C]">
          {TIPO_INFRACCION.find(x => x.value === tipo)?.descripcion}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[13px] text-[#1C1B18]">
            <input
              type="checkbox"
              checked={tienePermiso}
              onChange={e => {
                setTienePermiso(e.target.checked)
                if (!e.target.checked) setPermisoVigente('')
              }}
            />
            ¿Tiene permiso de Centro de Acopio?
          </label>
        </div>
        {tienePermiso ? (
          <label className="block">
            <span className="text-[11px] font-medium text-[#6B6760]">Estado del permiso</span>
            <select
              className="mt-1 w-full max-w-xs rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[13px]"
              value={permisoVigente}
              onChange={e => setPermisoVigente(e.target.value as 'si' | 'no' | '')}
            >
              <option value="">Seleccionar…</option>
              <option value="si">Vigente</option>
              <option value="no">No vigente</option>
            </select>
          </label>
        ) : null}
        {tienePermiso && permisoVigente === '' ? (
          <p className="text-[11px] text-[#D4881E]">Indica si el permiso está vigente (recomendado).</p>
        ) : null}
        <label className="block">
          <span className="text-[11px] font-medium text-[#6B6760]">Descripción del hallazgo</span>
          <textarea
            className="mt-1 min-h-[96px] w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
            value={hallazgo}
            onChange={e => setHallazgo(e.target.value)}
            placeholder="Qué observó el personal, condiciones del sitio, riesgos evidentes..."
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[11px] font-medium text-[#6B6760]">Nombre del inspector (opcional)</span>
            <input
              className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
              value={inspectorNombre}
              onChange={e => setInspectorNombre(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-[#6B6760]">Cargo (opcional)</span>
            <input
              className="mt-1 w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]"
              value={inspectorCargo}
              onChange={e => setInspectorCargo(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="rounded-[12px] border border-[#E8E4DC] bg-[#FDFCFA] p-4 space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#A8A49C]">3. Sanción orientativa</p>
        {filaPreview && filaPreview.verificado_clc === false ? (
          <EditorialCallout tone="caution" label="Verificación legal pendiente">
            Los artículos del reglamento están pendientes de verificación legal (CLC). Este expediente es orientativo hasta que el equipo
            jurídico confirme los artículos exactos.
          </EditorialCallout>
        ) : null}

        {!filaPreview ? (
          <p className="text-[12px] text-[#A8A49C]">Carga catálogo desde la API para ver niveles UMA.</p>
        ) : (
          <>
            <NivelSelect
              opciones={opcionesTipo}
              value={nivelElegido || opcionesTipo[0]?.nivel || ''}
              onChange={n => setNivelElegido(n)}
            />
            <p className="text-[13px] text-[#1C1B18]">
              <span className="font-medium">Nivel (referencia sprint): </span>
              <span>{NIVEL_ES[filaPreview.nivel] ?? filaPreview.nivel}</span>
            </p>
            <p className="text-[13px] text-[#6B6760]">
              Rango: {filaPreview.uma_minimo}–{filaPreview.uma_maximo} UMA
              {valorUmaMxn != null
                ? <> ≈ ${(filaPreview.uma_minimo * valorUmaMxn).toFixed(2)}–$
                  {(filaPreview.uma_maximo * valorUmaMxn).toFixed(2)} MXN (UMA referencia $
                  {valorUmaMxn.toFixed(2)} · fuente API).</>
                : <> — conecte la API para ver equivalencia en pesos.</>}
            </p>
            <p className="text-[13px] text-[#6B6760]">
              Artículo del reglamento: <span className="font-mono text-[12px]">{filaPreview.articulo_reglamento}</span>
            </p>
            <p className="text-[12px] text-[#8A857C]">¿Clausura orientativa?: {filaPreview.genera_clausura ? 'Sí' : 'No'}</p>
          </>
        )}
      </section>

      {error && (
        <p className="rounded-[8px] border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-900" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          id="inspeccion-form-generar"
          type="button"
          disabled={loading || direccion.trim().length < 3 || hallazgo.trim().length < 10}
          onClick={() => void generarExpediente()}
          className={cn(
            'rounded-[10px] px-4 py-2.5 text-[13px] font-medium',
            loading || direccion.trim().length < 3 || hallazgo.trim().length < 10
              ? 'cursor-not-allowed border border-[#E8E4DC] bg-[#E2DED6] text-[#A8A49C]'
              : 'border border-[#1A5FA8] bg-[#1A5FA8] text-white hover:bg-[#154a87]',
          )}
        >
          {loading ? 'Generando expediente…' : 'Generar expediente técnico'}
        </button>
        {expediente && predio && inspeccion ? (
          <div id="inspeccion-expediente-pdf">
            <ExpedientePDF predio={predio} inspeccion={inspeccion} expediente={expediente} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
