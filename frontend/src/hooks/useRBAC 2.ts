import { useSimulatorStore } from '@/store/simulatorStore'
import {
  audienceToRole,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  isAdminRole,
  isAdminOrFunctionary,
  type UserRole,
  type Permission,
} from '@/lib/rbac'

/**
 * Hook for accessing RBAC functionality in React components
 *
 * Usage:
 * const { canViewAdminPanel, userRole } = useRBAC()
 * if (canViewAdminPanel) { ... }
 */
export function useRBAC() {
  const audience = useSimulatorStore(s => s.audience)
  const userRole = audienceToRole(audience)

  const can = (permission: Permission): boolean => {
    return hasPermission(userRole, permission)
  }

  const canAll = (permissions: Permission[]): boolean => {
    return hasAllPermissions(userRole, permissions)
  }

  const canAny = (permissions: Permission[]): boolean => {
    return hasAnyPermission(userRole, permissions)
  }

  const permissions = getRolePermissions(userRole)

  return {
    userRole,
    audience,
    // Shorthand permission checks
    can,
    canAll,
    canAny,
    permissions,
    // Common checks
    canViewSimulator: can('view_simulator'),
    canEditData: can('edit_data'),
    canUploadDocuments: can('upload_documents'),
    canManageUsers: can('manage_users'),
    canExportReports: can('export_reports'),
    canAccessAdminPanel: can('access_admin_panel'),
    canViewAntecedentes: can('view_antecedentes'),
    canModifyAssumptions: can('modify_assumptions'),
    canCreateScenarios: can('create_scenarios'),
    canViewFinancials: can('view_financials'),
    // Role checks
    isAdmin: isAdminRole(userRole),
    isAdminOrFunctionary: isAdminOrFunctionary(userRole),
  }
}
