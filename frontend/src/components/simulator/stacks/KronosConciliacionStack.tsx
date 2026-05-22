'use client'

export function KronosConciliacionStack() {
  return (
    <div className="rounded-[8px] border border-[#D8C4E8] bg-[#F5EFF9] p-4">
      <h3 className="text-[13px] font-semibold text-[#4A1C7A]">
        Conciliación mensual (M20B)
      </h3>
      <p className="mt-2 text-[11px] text-[#6B6760]">
        Este módulo cargará las partidas presupuestales vs. costos reales del mes en curso.
        Requiere la tabla budget_actuals en PostgreSQL (migración 0003_evm).
      </p>
    </div>
  )
}
