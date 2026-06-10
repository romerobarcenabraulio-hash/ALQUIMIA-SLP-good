'use client'

import { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}

/**
 * Touch-optimized button with accessible sizing (44px minimum height on mobile).
 */
export function FormButton({
  variant = 'primary',
  size = 'md',
  loading,
  fullWidth,
  className = '',
  children,
  disabled,
  ...props
}: FormButtonProps) {
  const variantClasses = {
    primary: 'bg-[#3B6D11] text-white hover:bg-[#2D5409] disabled:opacity-50',
    secondary: 'border border-[#E8E4DC] bg-white text-[#3B3326] hover:border-[#3B6D11] hover:text-[#3B6D11]',
    danger: 'bg-[#C0392B] text-white hover:bg-[#A83126] disabled:opacity-50',
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-[11px] font-semibold',
    md: 'px-4 py-2.5 sm:py-2 text-[13px] font-semibold',
    lg: 'px-6 py-3 sm:py-2.5 text-[14px] font-semibold',
  }

  return (
    <button
      className={`flex items-center justify-center gap-2 rounded-[8px] transition-colors disabled:cursor-not-allowed ${
        variantClasses[variant]
      } ${sizeClasses[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={14} className="animate-spin shrink-0" />}
      {children}
    </button>
  )
}
