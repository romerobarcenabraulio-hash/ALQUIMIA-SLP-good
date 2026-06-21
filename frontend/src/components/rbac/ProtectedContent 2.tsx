'use client'

import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'
import type { Permission } from '@/lib/rbac'
import { cn } from '@/lib/utils'

interface ProtectedContentProps {
  permissions: Permission | Permission[]
  match?: 'all' | 'any'
  children: ReactNode
  fallback?: ReactNode
  className?: string
}

/**
 * Component that conditionally renders content based on user permissions
 *
 * Usage:
 * <ProtectedContent permissions="access_admin_panel">
 *   <AdminPanel />
 * </ProtectedContent>
 *
 * With fallback:
 * <ProtectedContent
 *   permissions="access_admin_panel"
 *   fallback={<div>Access denied</div>}
 * >
 *   <AdminPanel />
 * </ProtectedContent>
 */
export function ProtectedContent({
  permissions,
  match = 'all',
  children,
  fallback,
  className,
}: ProtectedContentProps) {
  const { can, canAll, canAny } = useRBAC()

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  const hasAccess = match === 'all' ? canAll(permissionArray) : canAny(permissionArray)

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>
    return null
  }

  return <div className={className}>{children}</div>
}

interface ProtectedButtonProps {
  permissions: Permission | Permission[]
  match?: 'all' | 'any'
  children: ReactNode
  className?: string
}

/**
 * Button that is disabled if user lacks permissions
 */
export function ProtectedButton({
  permissions,
  match = 'all',
  children,
  className,
}: ProtectedButtonProps) {
  const { canAll, canAny } = useRBAC()

  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]
  const hasAccess = match === 'all' ? canAll(permissionArray) : canAny(permissionArray)

  return (
    <button
      disabled={!hasAccess}
      title={hasAccess ? undefined : 'Acceso denegado'}
      className={cn(
        className,
        !hasAccess && 'opacity-50 cursor-not-allowed'
      )}
    >
      {children}
    </button>
  )
}

interface AccessDeniedProps {
  feature: string
  className?: string
}

/**
 * Standard access denied message
 */
export function AccessDenied({ feature, className }: AccessDeniedProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-gray-50 p-4 flex items-center gap-3',
        className
      )}
    >
      <Lock className="h-5 w-5 text-gray-400" />
      <div>
        <p className="text-sm font-medium text-gray-900">Acceso denegado</p>
        <p className="text-sm text-gray-600">{feature}</p>
      </div>
    </div>
  )
}
