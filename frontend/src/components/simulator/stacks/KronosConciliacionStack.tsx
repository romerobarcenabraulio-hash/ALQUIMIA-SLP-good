'use client'

export function KronosConciliacionStack() {
  return (
    <div className="rounded-[8px] border border-[#D8C4E8] bg-[#F5EFF9] p-4 text-[11px] text-[#6B6760]">
      Conciliación mensual (partidas vs. costos reales) — requiere migración{' '}
      <code className="text-[10px]">0003_evm</code> en PostgreSQL.
    </div>
  )
}
