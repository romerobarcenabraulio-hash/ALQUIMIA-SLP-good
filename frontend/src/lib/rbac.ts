import type { Audience } from '@/types'

/**
 * Role-Based Access Control (RBAC) system for ALQUIMIA-SLP
 *
 * Defines permissions for different user roles:
 * - 'admin': Platform administrators with full access
 * - 'functionary': Government officials managing municipal data
 * - 'entrepreneur': Business users viewing scenarios
 * - 'citizen': Public users viewing education content
 */

export type UserRole = 'admin' | 'functionary' | 'entrepreneur' | 'citizen'

export type Permission =
  | 'view_simulator'
  | 'edit_data'
  | 'upload_documents'
  | 'manage_users'
  | 'export_reports'
  | 'access_admin_panel'
  | 'view_antecedentes'
  | 'modify_assumptions'
  | 'create_scenarios'
  | 'view_financials'

/**
 * Permission matrix: Role → Set of allowed permissions
 */
const ROLE_PERMISSIONS: Record<UserRole, Set<Permission>> = {
  admin: new Set([
    'view_simulator',
    'edit_data',
    'upload_documents',
    'manage_users',
    'export_reports',
    'access_admin_panel',
    'view_antecedentes',
    'modify_assumptions',
    'create_scenarios',
    'view_financials',
  ]),
  functionary: new Set([
    'view_simulator',
    'edit_data',
    'upload_documents',
    'view_antecedentes',
    'modify_assumptions',
    'create_scenarios',
    'view_financials',
  ]),
  entrepreneur: new Set([
    'view_simulator',
    'view_financials',
    'create_scenarios',
    'export_reports',
  ]),
  citizen: new Set([
    'view_simulator',
  ]),
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false
}

/**
 * Check if a role has all required permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

/**
 * Check if a role has any of the required permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return Array.from(ROLE_PERMISSIONS[role] ?? [])
}

/**
 * Map Audience to UserRole for RBAC checks
 */
export function audienceToRole(audience: Audience | null): UserRole {
  switch (audience) {
    case 'functionary':
      return 'functionary'
    case 'entrepreneur':
      return 'entrepreneur'
    case 'citizen':
      return 'citizen'
    default:
      return 'citizen'
  }
}

/**
 * Check if user is admin (special case)
 */
export function isAdminRole(role: UserRole | null): boolean {
  return role === 'admin'
}

/**
 * Check if user can access admin features
 */
export function isAdminOrFunctionary(role: UserRole | null): boolean {
  return role === 'admin' || role === 'functionary'
}
