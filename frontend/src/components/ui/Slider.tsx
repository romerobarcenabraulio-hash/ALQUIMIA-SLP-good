'use client'

interface SliderProps {
  value: number
  min: number
  max: number
  step?: number
  label: string
  unit?: string
  source?: string
  onChange: (v: number) => void
  formatValue?: (v: number) => string
}

export function Slider({ value, min, max, step = 1, label, unit, source, onChange, formatValue }: SliderProps) {
  const display = formatValue ? formatValue(value) : `${value}${unit ?? ''}`
  const pct     = ((value - min) / (max - min)) * 100

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-medium text-[#6B6760]">{label}</label>
        <span className="font-mono text-[13px] text-[#3B6D11] font-medium">{display}</span>
      </div>
      <div className="relative h-[4px] bg-[#E2DED6] rounded-full">
        <div
          className="absolute left-0 top-0 h-full bg-[#3B6D11] rounded-full"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min} max={max} step={step} value={value}
          onChange={e => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-4 -top-2"
          style={{ zIndex: 2 }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#3B6D11] rounded-full border-2 border-white shadow-sm"
          style={{ left: `calc(${pct}% - 9px)`, zIndex: 1, pointerEvents: 'none' }}
        />
      </div>
      {source && (
        <p className="text-[10px] text-[#A8A49C] italic">{source}</p>
      )}
    </div>
  )
}
