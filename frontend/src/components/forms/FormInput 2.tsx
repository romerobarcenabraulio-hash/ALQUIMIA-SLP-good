'use client'

import { InputHTMLAttributes } from 'react'

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

/**
 * Touch-optimized form input with accessible sizing (44px minimum height on mobile).
 */
export function FormInput({
  label,
  error,
  hint,
  required,
  id,
  className = '',
  ...props
}: FormInputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-[12px] font-semibold uppercase tracking-wide text-[#6B6760]">
          {label}
          {required && <span className="text-[#C0392B] ml-1">*</span>}
        </label>
      )}

      <input
        id={inputId}
        className={`w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2.5 sm:py-2 text-[13px] sm:text-[12px] placeholder:text-[#A8A49C] outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/20 transition-colors ${
          error ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-[#C0392B]/20' : ''
        } ${className}`}
        {...props}
      />

      {error && (
        <p className="text-[11px] text-[#C0392B]">{error}</p>
      )}

      {hint && !error && (
        <p className="text-[11px] text-[#8E8980]">{hint}</p>
      )}
    </div>
  )
}
