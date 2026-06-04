'use client'

import { ReactNode } from 'react'
import { DataPoint } from '@/types/dataPoint'
import { useDataPointsByModule } from '@/hooks/useDataPointsByModule'
import { DataPointCell } from '@/components/datapoint'

interface ModuleWithDataPointsProps {
  moduleId: string
  tenantId?: string
  children: ReactNode  // Fallback content if data exists
  showEmpty?: boolean  // Show "no data" state instead of children
}

/**
 * Wrapper that loads DataPoints for a module
 * If no data exists and showEmpty=true, displays collection-focused empty state
 * Otherwise renders children (legacy behavior)
 */
export function ModuleWithDataPoints({
  moduleId,
  tenantId,
  children,
  showEmpty = false,
}: ModuleWithDataPointsProps) {
  const { data: dataPoints, loading, error } = useDataPointsByModule(moduleId, {
    tenantId,
    enabled: showEmpty,
  })

  // Error state
  if (error && showEmpty) {
    return (
      <div className="rounded-[8px] border border-[#FFCDD2] bg-[#FFEBEE] p-4 text-center">
        <p className="text-[14px] font-medium text-[#C62828]">Error cargando datos</p>
        <p className="text-[12px] text-[#B71C1C] mt-1">{error.message}</p>
      </div>
    )
  }

  // Empty state with collection CTA
  if (showEmpty && !loading && dataPoints.length === 0) {
    return (
      <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-8 text-center">
        <div className="mx-auto max-w-sm">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A8A49C]">
            Sin datos cargados
          </p>
          <p className="mt-2 text-[16px] font-medium text-[#1C1B18]">
            Sube documentos para llenar este módulo
          </p>
          <p className="mt-2 text-[13px] leading-6 text-[#6B6760]">
            Cada documento que cargues se analizará automáticamente. ALQUIMIA extraerá cifras,
            referencias y evidencia con cero invención.
          </p>
          <a
            href="/perfil"
            className="mt-4 inline-block rounded-[6px] bg-[#007ACC] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#005A9E] transition-colors"
          >
            Ir a documentos
          </a>
        </div>
      </div>
    )
  }

  // Loading state
  if (showEmpty && loading) {
    return (
      <div className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] p-4">
        <p className="text-[12px] text-[#A8A49C] animate-pulse">Cargando datos...</p>
      </div>
    )
  }

  // Data loaded, show grid of DataPointCells
  if (showEmpty && dataPoints.length > 0) {
    return (
      <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
        {dataPoints.map(dp => (
          <DataPointCell key={dp.id} dataPoint={dp} showSource={true} />
        ))}
      </div>
    )
  }

  // Default: render children (legacy modules)
  return <>{children}</>
}
