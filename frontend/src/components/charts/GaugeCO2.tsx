'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'

export function GaugeCO2() {
  const { resultados } = useSimulatorStore()
  // Bug 1 fix: usar co2eEvitadasAnualTon (anual) como KPI principal del gauge
  const val    = resultados?.co2eEvitadasAnualTon ?? 0
  const maxVal = 600000  // Techo visual conservador para ciudades medias y zonas metropolitanas.
  const pct   = Math.min(1, val / maxVal)

  // SVG semicircle 270° gauge
  const R = 80, cx = 100, cy = 100
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const arcStart = { x: cx + R * Math.cos(toRad(135)), y: cy + R * Math.sin(toRad(135)) }
  const arcEnd   = { x: cx + R * Math.cos(toRad(45)),  y: cy + R * Math.sin(toRad(45)) }
  const fillEnd  = {
    x: cx + R * Math.cos(toRad(135 + pct * 270)),
    y: cy + R * Math.sin(toRad(135 + pct * 270)),
  }

  const bigArc = pct * 270 > 180 ? 1 : 0

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 160" className="w-48 h-36">
        {/* Background arc */}
        <path
          d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 1 1 ${arcEnd.x} ${arcEnd.y}`}
          fill="none" stroke="#E2DED6" strokeWidth="12" strokeLinecap="round"
        />
        {/* Fill arc */}
        {val > 0 && (
          <path
            d={`M ${arcStart.x} ${arcStart.y} A ${R} ${R} 0 ${bigArc} 1 ${fillEnd.x} ${fillEnd.y}`}
            fill="none" stroke="#3B6D11" strokeWidth="12" strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
          />
        )}
        {/* Centro */}
        <text x={cx} y={cy - 4} textAnchor="middle" fontFamily="JetBrains Mono" fontSize="18" fontWeight="500" fill="#1C1B18">
          {(val / 1000).toFixed(0)}K
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontFamily="Inter" fontSize="10" fill="#6B6760">tCO₂e / año</text>
      </svg>
      <div className="text-center">
        <p className="font-mono text-[24px] text-[#3B6D11]">{fmt.co2(val)}</p>
        <p className="text-[12px] text-[#A8A49C]">equivalente a {(val / 0.12).toFixed(0)} árboles plantados</p>
      </div>
    </div>
  )
}
