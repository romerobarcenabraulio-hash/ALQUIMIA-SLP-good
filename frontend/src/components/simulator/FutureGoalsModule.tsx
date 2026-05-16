'use client'

import { useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { SimulatorModuleErrorBoundary } from '@/components/simulator/SimulatorModuleErrorBoundary'

function loadImplementacion() {
  return import('@/components/simulator/ImplementacionEspacioTiempo')
    .then(m => ({ default: m.ImplementacionEspacioTiempo }))
    .catch(err => {
      console.error('[future_goals] ImplementacionEspacioTiempo', err)
      return { default: ChunkFailed }
    })
}

function loadProgresion() {
  return import('@/components/simulator/ProgresionPlanMunicipalTiempo')
    .then(m => ({ default: m.ProgresionPlanMunicipalTiempo }))
    .catch(err => {
      console.error('[future_goals] ProgresionPlanMunicipalTiempo', err)
      return { default: ChunkFailed }
    })
}

const ImplementacionEspacioTiempo = dynamic(loadImplementacion, {
  ssr: false,
  loading: () => <ModuleChunkLoading label="PERT y oleadas territoriales" />,
})

const ProgresionPlanMunicipalTiempo = dynamic(loadProgresion, {
  ssr: false,
  loading: () => <ModuleChunkLoading label="progresión temporal (Gantt)" />,
})

type TabId = 'pert' | 'charts'

export function FutureGoalsModule({ notice }: { notice: ReactNode }) {
  const [armed, setArmed] = useState(false)
  const [tab, setTab] = useState<TabId>('pert')

  if (!armed) {
    return (
      <section className="space-y-4" data-testid="future-goals-module">
        {notice}
        <div className="rounded-[12px] border border-[#D7E8C0] bg-[#F6FAEF] p-4">
          <p className="text-[13px] font-medium text-[#1C1B18]">Carga controlada del módulo PERT / Gantt</p>
          <p className="mt-2 text-[12px] leading-relaxed text-[#5A6347]">
            Este bloque incluye gráficas y líneas de tiempo que en algunos navegadores provocan el mensaje «This page
            couldn&apos;t load» (caída de la pestaña). Se carga solo cuando lo confirmas, en dos pestañas separadas.
          </p>
          <button
            type="button"
            onClick={() => setArmed(true)}
            className="mt-3 rounded-[8px] bg-[#3B6D11] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#2D5409]"
            data-testid="future-goals-arm"
          >
            Cargar Metas futuras / Gantt-PERT
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-5" data-testid="future-goals-module-armed">
      {notice}

      <nav
        className="flex flex-wrap gap-2 rounded-[10px] border border-[#E8E4DC] bg-white p-2"
        aria-label="Vistas del módulo de metas futuras"
      >
        <TabButton active={tab === 'pert'} onClick={() => setTab('pert')}>
          PERT y oleadas
        </TabButton>
        <TabButton active={tab === 'charts'} onClick={() => setTab('charts')}>
          Progresión y tabla
        </TabButton>
      </nav>

      {tab === 'pert' ? (
        <SimulatorModuleErrorBoundary moduleLabel="PERT y oleadas territoriales">
          <ImplementacionEspacioTiempo />
        </SimulatorModuleErrorBoundary>
      ) : (
        <SimulatorModuleErrorBoundary moduleLabel="progresión temporal (Gantt)">
          <ProgresionPlanMunicipalTiempo />
        </SimulatorModuleErrorBoundary>
      )}
    </section>
  )
}

function ChunkFailed() {
  return (
    <p className="rounded-[8px] border border-red-200 bg-red-50 p-3 text-[12px] text-red-800">
      No se pudo descargar este bloque. Recarga la página o prueba otro navegador.
    </p>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-[8px] px-3 py-2 text-[12px] font-medium transition-colors',
        active
          ? 'bg-[#EAF3DE] text-[#23470A] border border-[#3B6D11]/40'
          : 'border border-transparent text-[#6B6760] hover:bg-[#F8F6F1]',
      )}
    >
      {children}
    </button>
  )
}

function ModuleChunkLoading({ label }: { label: string }) {
  return (
    <p
      className="rounded-[12px] border border-dashed border-[#E8E4DC] bg-[#FDFCFA] px-4 py-8 text-center text-[12px] text-[#6B6760]"
      data-testid="future-goals-chunk-loading"
    >
      Cargando {label}…
    </p>
  )
}
