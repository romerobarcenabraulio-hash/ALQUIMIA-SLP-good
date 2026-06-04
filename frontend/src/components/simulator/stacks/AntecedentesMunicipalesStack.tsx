'use client'

import { useEffect } from 'react'
import { ExternalLink, History, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSimulatorStore } from '@/store/simulatorStore'
import type { AntecedenteEvento } from '@/lib/antecedentesTypes'
import { useTenantMunicipalProfile } from '@/hooks/useTenantMunicipalProfile'
import { TenantAntecedentesPanel } from '@/components/simulator/TenantProfilePanels'

const TIPO_LABEL: Record<string, string> = {
  concesion: 'Concesión',
  programa: 'Programa',
  infraestructura: 'Infraestructura',
  norma: 'Norma',
  conflicto: 'Conflicto',
  campaña: 'Campaña',
  operador: 'Operador',
  contexto: 'Contexto',
  indicador: 'Indicador',
}

function TierBadge({ tier }: { tier: string }) {
  return (
    <span className="rounded border border-[#E8E4DC] bg-[#FAFAF8] px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-[#6B6760]">
      {tier}
    </span>
  )
}

function EventoRow({ e }: { e: AntecedenteEvento }) {
  const fuente = e.fuentes[0]
  return (
    <li className="relative pl-6 pb-6 last:pb-0">
      <span
        className="absolute left-0 top-1.5 h-2 w-2 rounded-full bg-[#C8C4BC]"
        aria-hidden
      />
      <span
        className="absolute left-[3px] top-4 bottom-0 w-px bg-[#E8E4DC] last:hidden"
        aria-hidden
      />
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {e.anio && (
          <span className="font-mono text-[12px] font-semibold text-[#1C1B18]">{e.anio}</span>
        )}
        <span className="text-[10px] uppercase tracking-[0.08em] text-[#A8A49C]">
          {TIPO_LABEL[e.tipo] ?? e.tipo}
        </span>
        {fuente && <TierBadge tier={fuente.tier} />}
        {e.verificar && (
          <span className="text-[10px] font-medium text-[#8B5A00]">Verificar en archivo</span>
        )}
      </div>
      <p className="mt-1 text-[14px] font-medium leading-snug text-[#1C1B18]">{e.titulo}</p>
      <p className="mt-1.5 text-[13px] leading-[1.7] text-[#5A5750]">{e.resumen}</p>
      {fuente?.url && (
        <a
          href={fuente.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] text-[#1A5FA8] hover:underline"
        >
          Fuente <ExternalLink size={10} />
        </a>
      )}
    </li>
  )
}

export function AntecedentesMunicipalesStack() {
  const { profile } = useTenantMunicipalProfile()
  const reportaje = useSimulatorStore(s => s.antecedentesReportaje)
  const loading = useSimulatorStore(s => s.antecedentesLoading)
  const municipiosActivos = useSimulatorStore(s => s.municipiosActivos)
  const antecedentesForMunicipioId = useSimulatorStore(s => s.antecedentesForMunicipioId)
  const refreshAntecedentesReportaje = useSimulatorStore(s => s.refreshAntecedentesReportaje)

  useEffect(() => {
    if (municipiosActivos.length === 0) return
    if (antecedentesForMunicipioId) return
    void refreshAntecedentesReportaje({ refresh: true })
  }, [municipiosActivos.length, antecedentesForMunicipioId, refreshAntecedentesReportaje])

  const titulo =
    reportaje?.municipio_nombre ??
    (municipiosActivos.length === 1 ? municipiosActivos[0] : 'Municipio activo')

  if (municipiosActivos.length === 0) {
    return (
      <div className="border-t border-[#E8E4DC] pt-6">
        <p className="text-[13px] leading-relaxed text-[#6B6760]">
          Elija un municipio en la barra superior para generar el reportaje de antecedentes RSU.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="antecedentes-municipales-stack">
      <section className="border-b border-[#E8E4DC] pb-6">
        <div className="flex items-start gap-3">
          {loading ? (
            <Loader2 size={18} className="mt-0.5 shrink-0 animate-spin text-[#6B6760]" />
          ) : (
            <History size={18} className="mt-0.5 shrink-0 text-[#6B6760]" />
          )}
          <div className="min-w-0 flex-1">
            <p className="font-serif text-[18px] font-semibold leading-snug text-[#1C1B18]">
              Legado RSU en {titulo}
            </p>
            <p className="mt-2 max-w-2xl text-[13px] leading-[1.75] text-[#5A5750]">
              Cronología de programas, operadores y reformas documentada antes de abrir la línea base
              numérica. Cada hito lleva fuente citada o marca de verificación pendiente.
            </p>
            {reportaje && !loading && (
              <p className="mt-2 text-[11px] text-[#A8A49C]">
                {reportaje.eventos.length} hitos · completitud{' '}
                {Math.round(reportaje.score_completitud * 100)}%
                {reportaje.fuente_serper ? ' · research automático' : ''}
              </p>
            )}
            {loading && (
              <p className="mt-2 text-[11px] text-[#A8A49C]">Investigando fuentes públicas…</p>
            )}
          </div>
        </div>
      </section>

      <TenantAntecedentesPanel profile={profile} />

      {reportaje && !loading && (
        <>
          <section>
            <h2 className="mb-3 font-serif text-[15px] font-semibold text-[#1C1B18]">Síntesis</h2>
            <p className="max-w-2xl text-[13px] leading-[1.85] text-[#4A4740]">{reportaje.sintesis}</p>
          </section>

          {reportaje.eventos.length > 0 && (
            <section>
              <h2 className="mb-4 font-serif text-[15px] font-semibold text-[#1C1B18]">
                Línea de tiempo
              </h2>
              <ol className="border-l border-[#E8E4DC] pl-0">
                {reportaje.eventos.map(e => (
                  <EventoRow key={e.evento_id} e={e} />
                ))}
              </ol>
            </section>
          )}

          {reportaje.lecciones.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-[15px] font-semibold text-[#1C1B18]">
                Lecciones para el diseño
              </h2>
              <ul className="space-y-2">
                {reportaje.lecciones.map(l => (
                  <li
                    key={l}
                    className={cn(
                      'text-[13px] leading-[1.7] text-[#5A5750]',
                      'before:mr-2 before:text-[#A8A49C] before:content-["—"]',
                    )}
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reportaje.vacios_documentales.length > 0 && (
            <section>
              <h2 className="mb-3 font-serif text-[15px] font-semibold text-[#1C1B18]">
                Vacíos documentales
              </h2>
              <ul className="space-y-1.5">
                {reportaje.vacios_documentales.map(v => (
                  <li key={v} className="text-[12px] leading-relaxed text-[#6B6760]">
                    · {v}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {reportaje.advertencias.length > 0 && (
            <p className="text-[12px] leading-relaxed text-[#8B5A00]">
              {reportaje.advertencias.join(' · ')}
            </p>
          )}

          <p className="border-t border-[#E8E4DC] pt-4 text-[10px] leading-relaxed text-[#A8A49C]">
            Insumo ALQUIMIA · research al cambiar municipio · no acto de autoridad · verificar T3 en
            archivo municipal antes de Cabildo.
          </p>
        </>
      )}

      {!loading && !reportaje && (
        <p className="text-[13px] text-[#6B6760]">
          No se pudo cargar el reportaje. Cambie de municipio o recargue la página.
        </p>
      )}

      <p className="mt-6 text-[12px] text-[#A8A49C]">
        ¿Tiene documentos municipales relevantes?{' '}
        <a href="/perfil" className="underline hover:text-[#6B6760]">
          Súbalos desde su perfil
        </a>
        .
      </p>
    </div>
  )
}
