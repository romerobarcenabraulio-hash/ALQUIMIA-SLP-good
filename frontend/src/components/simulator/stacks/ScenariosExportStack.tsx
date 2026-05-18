'use client'

import { useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ImpactoFinanciero } from '@/components/simulator/ImpactoFinanciero'
import { ExportarSection } from '@/components/simulator/ExportarSection'
import { ExportadorReporte } from '@/components/simulator/ExportadorReporte'
import { DashboardKPIs } from '@/components/simulator/DashboardKPIs'
import { AlertasPanel } from '@/components/simulator/AlertasPanel'
import { GovernancePanel } from '@/components/simulator/GovernancePanel'
import { LaunchChecklist } from '@/components/simulator/LaunchChecklist'

type ScenariosExportTabId = 'finance' | 'kpi' | 'governance'

const TABS: ReadonlyArray<{ id: ScenariosExportTabId; label: string }> = [
  { id: 'finance', label: 'Finanzas y salida' },
  { id: 'kpi', label: 'Indicadores y alertas' },
  { id: 'governance', label: 'Gobernanza y arranque' },
]

export function ScenariosExportStack() {
  const [tab, setTab] = useState<ScenariosExportTabId>('finance')

  return (
    <section className="space-y-5" data-testid="scenarios-export-stack">
      <nav
        className="flex flex-wrap gap-2 rounded-[10px] border border-[#E8E4DC] bg-white p-2"
        aria-label="Subsecciones de escenarios y salida"
      >
        {TABS.map(item => (
          <TabButton
            key={item.id}
            active={tab === item.id}
            ariaSelected={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </TabButton>
        ))}
      </nav>

      <TabPanel active={tab === 'finance'} label="Finanzas y salida">
        <ImpactoFinanciero />
        <ExportarSection />
        <ExportadorReporte />
      </TabPanel>

      <TabPanel active={tab === 'kpi'} label="Indicadores y alertas">
        <DashboardKPIs />
        <AlertasPanel />
      </TabPanel>

      <TabPanel active={tab === 'governance'} label="Gobernanza y arranque">
        <GovernancePanel />
        <LaunchChecklist />
      </TabPanel>
    </section>
  )
}

function TabPanel({
  active,
  label,
  children,
}: {
  active: boolean
  label: string
  children: ReactNode
}) {
  return (
    <div
      className={cn('space-y-5', !active && 'hidden')}
      role="tabpanel"
      aria-label={label}
      aria-hidden={!active}
      hidden={!active}
    >
      {children}
    </div>
  )
}

function TabButton({
  active,
  ariaSelected,
  onClick,
  children,
}: {
  active: boolean
  ariaSelected: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={ariaSelected}
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
