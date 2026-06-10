'use client'

import { SelectHTMLAttributes } from 'react'

interface Option {
  value: string
  label: string
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  options: Option[]
}

/**
 * Touch-optimized form select with accessible sizing.
 */
export function FormSelect({
  label,
  error,
  hint,
  required,
  id,
  options,
  className = '',
  ...props
}: FormSelectProps) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-[12px] font-semibold uppercase tracking-wide text-[#6B6760]">
          {label}
          {required && <span className="text-[#C0392B] ml-1">*</span>}
        </label>
      )}

      <select
        id={selectId}
        className={`w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2.5 sm:py-2 text-[13px] sm:text-[12px] outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/20 transition-colors appearance-none cursor-pointer ${
          error ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-[#C0392B]/20' : ''
        } ${className}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238E8980' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          paddingRight: '2.5rem',
        }}
        {...props}
      >
        <option value="">Selecciona una opción</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>

      {error && (
        <p className="text-[11px] text-[#C0392B]">{error}</p>
      )}

      {hint && !error && (
        <p className="text-[11px] text-[#8E8980]">{hint}</p>
      )}
    </div>
  )
}
