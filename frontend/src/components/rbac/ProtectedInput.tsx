'use client'

import { InputHTMLAttributes, ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'
import type { Permission } from '@/lib/rbac'
import { cn } from '@/lib/utils'

interface ProtectedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  permissions: Permission | Permission[]
  match?: 'all' | 'any'
  label?: string
  readOnlyMessage?: string
}

export function ProtectedInput({
  permissions,
  match = 'all',
  label,
  readOnlyMessage,
  className,
  disabled,
  ...props
}: ProtectedInputProps) {
  const { canAll, canAny } = useRBAC()

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  const hasAccess = match === 'all' ? canAll(permissionArray) : canAny(permissionArray)

  return (
    <label className="block">
      {label && <span className="text-[11px] font-medium text-[#6B6760]">{label}</span>}
      <div className="relative mt-1">
        <input
          disabled={disabled || !hasAccess}
          className={cn(
            'w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]',
            (!hasAccess || disabled) && 'bg-gray-100 opacity-60 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {!hasAccess && (
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        )}
      </div>
      {!hasAccess && readOnlyMessage && (
        <p className="mt-1 text-[11px] text-gray-600">{readOnlyMessage}</p>
      )}
    </label>
  )
}

interface ProtectedTextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  permissions: Permission | Permission[]
  match?: 'all' | 'any'
  label?: string
  readOnlyMessage?: string
}

export function ProtectedTextArea({
  permissions,
  match = 'all',
  label,
  readOnlyMessage,
  className,
  disabled,
  ...props
}: ProtectedTextAreaProps) {
  const { canAll, canAny } = useRBAC()

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  const hasAccess = match === 'all' ? canAll(permissionArray) : canAny(permissionArray)

  return (
    <label className="block">
      {label && <span className="text-[11px] font-medium text-[#6B6760]">{label}</span>}
      <div className="relative mt-1">
        <textarea
          disabled={disabled || !hasAccess}
          className={cn(
            'w-full rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[13px]',
            (!hasAccess || disabled) && 'bg-gray-100 opacity-60 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {!hasAccess && (
          <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
        )}
      </div>
      {!hasAccess && readOnlyMessage && (
        <p className="mt-1 text-[11px] text-gray-600">{readOnlyMessage}</p>
      )}
    </label>
  )
}
