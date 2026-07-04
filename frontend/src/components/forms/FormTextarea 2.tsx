'use client'

import { TextareaHTMLAttributes } from 'react'

interface FormTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
}

/**
 * Touch-optimized textarea with accessible sizing and auto-expand.
 */
export function FormTextarea({
  label,
  error,
  hint,
  required,
  id,
  className = '',
  rows = 4,
  ...props
}: FormTextareaProps) {
  const textareaId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 300) + 'px'
    props.onChange?.(e)
  }

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={textareaId} className="block text-[12px] font-semibold uppercase tracking-wide text-[#6B6760]">
          {label}
          {required && <span className="text-[#C0392B] ml-1">*</span>}
        </label>
      )}

      <textarea
        id={textareaId}
        rows={rows}
        className={`w-full rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2.5 sm:py-2 text-[13px] sm:text-[12px] placeholder:text-[#A8A49C] outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/20 transition-colors resize-none ${
          error ? 'border-[#C0392B] focus:border-[#C0392B] focus:ring-[#C0392B]/20' : ''
        } ${className}`}
        onChange={handleInput}
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
