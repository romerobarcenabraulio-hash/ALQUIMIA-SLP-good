'use client'

import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { Audience } from '@/types'
import { isCircularityBaselineReadyForUi } from '@/lib/baselinePresentation'

const AUDIENCE_LABEL: Record<Audience, string> = {
  citizen: 'Ciudadano',
  functionary: 'Funcionario público',
  entrepreneur: 'Empresario',
}

const DISCLAIMER_PULSE_LS = 'alq_disclaimer_pulse_v1' as const

const ETHICAL_PULSE_COPY =
  'Propuesta de análisis — no valoración oficial hasta validación competente'

function exportPdfTitle(pathname: string, audience: Audience | null, baselineReady: boolean): string {
  if (pathname === '/simulator') {
    if (audience === 'citizen') {
      return 'La vista ciudadana no incluye exportación PDF; use el perfil Funcionario o el Hub de documentos.'
    }
    if (!baselineReady) {
      return 'Complete la línea base municipal en esta pantalla antes de exportar desde el módulo lateral.'
    }
    return 'Abra el módulo de exportación en la navegación lateral del simulador (#sim-exportador-reporte).'
  }
  return 'La exportación de borrador está disponible en el simulador (perfil institucional o empresarial).'
}

export function Header() {
  const pathname = usePathname()
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const seleccion = useSimulatorStore(s => s.seleccionMunicipioCatalog)
  const clearMunicipioSeleccion = useSimulatorStore(s => s.clearMunicipioSeleccion)
  const horizonte = useSimulatorStore(s => s.horizonte)
  const circularityBaseline = useSimulatorStore(s => s.circularityBaseline)
  const { resultados, guardarEscenario } = useSimulatorStore()
  const audience = useSimulatorStore(s => s.audience)
  const resetAudience = useSimulatorStore(s => s.resetAudience)
  const hasInit = useRef(false)

  const [scrolled, setScrolled] = useState(false)
  const [pulseDismissed, setPulseDismissed] = useState(false)
  const [pulseEligible, setPulseEligible] = useState(false)

  const baselineReady = isCircularityBaselineReadyForUi(circularityBaseline, zmActiva)
  const exportTitle = exportPdfTitle(pathname, audience, baselineReady)

  useEffect(() => {
    if (!hasInit.current) {
      useSimulatorStore.getState().recalcular()
      hasInit.current = true
    }
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const tid = window.setTimeout(() => {
      if (pathname !== '/simulator' || audience !== 'citizen') {
        setPulseEligible(false)
        return
      }
      try {
        const raw = window.localStorage.getItem(DISCLAIMER_PULSE_LS)
        const n = raw ? Number.parseInt(raw, 10) : 0
        setPulseEligible(!Number.isFinite(n) || n < 1)
      } catch {
        setPulseEligible(true)
      }
    }, 0)
    return () => window.clearTimeout(tid)
  }, [pathname, audience])

  useEffect(() => {
    if (!pulseEligible || pulseDismissed) return
    const writeTid = window.setTimeout(() => {
      try {
        window.localStorage.setItem(DISCLAIMER_PULSE_LS, '1')
      } catch {
        /* ignore */
      }
    }, 0)
    const dismissTid = window.setTimeout(() => setPulseDismissed(true), 14000)
    return () => {
      window.clearTimeout(writeTid)
      window.clearTimeout(dismissTid)
    }
  }, [pulseEligible, pulseDismissed])

  const showEthicalPulse =
    pathname === '/simulator' &&
    audience === 'citizen' &&
    pulseEligible &&
    !pulseDismissed

  const r = resultados
  const citizenKpiSoft = audience === 'citizen'

  const kpiStrip = (
    <div className="flex items-center gap-6">
      <KpiChip
        label="RSU"
        value={r ? fmt.kgd(r.rsuTotalTonDia) : '—'}
        variant={citizenKpiSoft ? 'citizen' : 'institutional'}
      />
      <KpiChip
        label="Ingreso/año"
        value={r ? fmt.mxnK(r.ingresosBrutos / (horizonte || 3)) : '—'}
        color="text-[#3B6D11]"
        variant={citizenKpiSoft ? 'citizen' : 'institutional'}
      />
      <KpiChip
        label="CO₂e/año"
        value={r ? fmt.co2(r.co2eEvitadasAnualTon) : '—'}
        color="text-[#1A5FA8]"
        variant={citizenKpiSoft ? 'citizen' : 'institutional'}
      />
      <KpiChip
        label="Empleos"
        value={r ? fmt.num0(r.empleosTotalesDirectos) : '—'}
        variant={citizenKpiSoft ? 'citizen' : 'institutional'}
      />
    </div>
  )

  const kpiRow =
    citizenKpiSoft && !baselineReady ? (
      <div className="hidden lg:flex flex-1 justify-center min-w-0 px-3">
        <Tooltip.Root delayDuration={200}>
          <Tooltip.Trigger asChild>
            <div
              className="inline-flex cursor-help rounded-md border border-transparent py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-[#3B6D11]/35"
              aria-label="Indicadores atenuados hasta captura de baseline"
            >
              <div className="opacity-40 pointer-events-none select-none">{kpiStrip}</div>
            </div>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              className="z-[100] max-w-xs rounded-md bg-[#1C1B18] px-3 py-2 text-center text-[11px] leading-snug text-white shadow-md"
              sideOffset={6}
            >
              Disponibles tras captura de baseline
              <Tooltip.Arrow className="fill-[#1C1B18]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    ) : citizenKpiSoft && baselineReady && scrolled ? (
      <div className="hidden lg:flex flex-1 justify-center min-w-0 px-3">
        <p className="text-[10px] leading-snug text-[#A8A49C] text-center tracking-wide max-w-md">
          Indicadores estimados · detalle y contexto en los módulos inferiores
        </p>
      </div>
    ) : (
      <div className="hidden lg:flex flex-1 justify-center min-w-0">{kpiStrip}</div>
    )

  return (
    <Tooltip.Provider delayDuration={200}>
      <header className="sticky top-0 z-50 bg-[#FDFCFA]/95 backdrop-blur-sm border-b border-[#E8E4DC] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 min-h-14 py-1.5 flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
        <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3 shrink-0 min-w-0 max-w-full">
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/" className="font-serif text-[20px] text-[#3B6D11] font-semibold tracking-tight hover:text-[#2D5409]">
              ALQUIMIA
            </Link>
            <span className="hidden sm:block text-[#E8E4DC]">|</span>
            {pathname === '/simulator' && seleccion ? (
              <span className="hidden sm:inline text-[11px] text-[#6B6760] max-w-[min(100%,20rem)] truncate" title={`CVE ${seleccion.claveInegi}`}>
                Municipio: <span className="font-medium text-[#1C1B18]">{seleccion.nombre}</span>
                {' · '}
                Estado: <span className="font-medium text-[#1C1B18]">{seleccion.estadoNombre}</span>
              </span>
            ) : (
              <span className="hidden sm:block text-[12px] text-[#A8A49C] uppercase tracking-wide truncate">{zmActiva}</span>
            )}
          </div>
          {pathname === '/simulator' && seleccion && (
            <button
              type="button"
              onClick={() => clearMunicipioSeleccion()}
              className="text-left sm:text-center text-[11px] font-medium text-[#3B6D11] hover:underline shrink-0"
            >
              Cambiar municipio
            </button>
          )}
          {showEthicalPulse && (
            <p
              className="text-[10px] sm:text-[11px] leading-snug text-[#8C8880] max-w-[min(100%,22rem)]"
              role="note"
            >
              {ETHICAL_PULSE_COPY}
            </p>
          )}
        </div>

        {kpiRow}

        <div className="flex flex-col items-end gap-0.5 shrink-0 ml-auto sm:ml-0">
          <div className="flex items-center gap-2 shrink-0">
            {pathname === '/simulator' && audience && (
              <div
                className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-[#E8E4DC] bg-[#FDFCFA] px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] text-[#6B6760]"
                title="Fase 22 — audiencia activa"
              >
                <span className="max-w-[72px] sm:max-w-[140px] truncate">
                  <span className="text-[#A8A49C]">Vista </span>
                  <span className="font-semibold text-[#1C1B18]">{AUDIENCE_LABEL[audience]}</span>
                </span>
                <button
                  type="button"
                  onClick={resetAudience}
                  className="shrink-0 font-medium text-[#3B6D11] hover:underline"
                >
                  Cambiar
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() =>
                guardarEscenario(
                  `Escenario ${new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`,
                )
              }
              className="hidden sm:block text-[12px] text-[#3B6D11] border border-[#3B6D11] px-3 py-1.5 rounded-[6px] hover:bg-[#EAF3DE] transition-colors"
            >
              Guardar escenario
            </button>
            <span title={exportTitle} className="inline-flex">
              <button
                type="button"
                disabled
                className="btn-primary text-[12px] px-4 py-1.5 opacity-70 cursor-not-allowed"
              >
                Exportar borrador PDF
              </button>
            </span>
          </div>
          {pathname === '/simulator' && audience && (
            <span className="xl:hidden text-[9px] text-[#A8A49C] text-right leading-tight max-w-[11rem]">
              {audience === 'citizen'
                ? 'Sin exportación en esta vista ciudadana.'
                : 'Exportación en el módulo lateral del simulador.'}
            </span>
          )}
        </div>
      </div>
    </header>
    </Tooltip.Provider>
  )
}

function KpiChip({
  label,
  value,
  color,
  variant = 'institutional',
}: {
  label: string
  value: string
  color?: string
  variant?: 'citizen' | 'institutional'
}) {
  const soft = variant === 'citizen'
  return (
    <div className="flex flex-col items-center">
      <span className={`uppercase tracking-wide text-[#A8A49C] ${soft ? 'text-[9px]' : 'text-[10px]'}`}>{label}</span>
      <span
        className={
          soft
            ? `font-sans text-[11px] font-normal tabular-nums ${color ?? 'text-[#7A756D]'}`
            : `font-mono text-[13px] font-medium ${color ?? 'text-[#1C1B18]'}`
        }
      >
        {value}
      </span>
    </div>
  )
}
