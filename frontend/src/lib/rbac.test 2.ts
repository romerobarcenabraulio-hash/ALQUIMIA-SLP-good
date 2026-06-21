import { describe, expect, it } from 'vitest'
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  audienceToRole,
  isAdminRole,
  isAdminOrFunctionary,
} from '@/lib/rbac'

describe('RBAC Permission System', () => {
  describe('hasPermission', () => {
    it('admin should have all permissions', () => {
      expect(hasPermission('admin', 'view_simulator')).toBe(true)
      expect(hasPermission('admin', 'edit_data')).toBe(true)
      expect(hasPermission('admin', 'upload_documents')).toBe(true)
      expect(hasPermission('admin', 'manage_users')).toBe(true)
      expect(hasPermission('admin', 'export_reports')).toBe(true)
      expect(hasPermission('admin', 'access_admin_panel')).toBe(true)
      expect(hasPermission('admin', 'view_antecedentes')).toBe(true)
      expect(hasPermission('admin', 'modify_assumptions')).toBe(true)
      expect(hasPermission('admin', 'create_scenarios')).toBe(true)
      expect(hasPermission('admin', 'view_financials')).toBe(true)
    })

    it('functionary should have most permissions except admin features', () => {
      expect(hasPermission('functionary', 'view_simulator')).toBe(true)
      expect(hasPermission('functionary', 'edit_data')).toBe(true)
      expect(hasPermission('functionary', 'upload_documents')).toBe(true)
      expect(hasPermission('functionary', 'view_antecedentes')).toBe(true)
      expect(hasPermission('functionary', 'modify_assumptions')).toBe(true)
      expect(hasPermission('functionary', 'create_scenarios')).toBe(true)
      expect(hasPermission('functionary', 'view_financials')).toBe(true)
      expect(hasPermission('functionary', 'manage_users')).toBe(false)
      expect(hasPermission('functionary', 'access_admin_panel')).toBe(false)
    })

    it('entrepreneur should have limited permissions', () => {
      expect(hasPermission('entrepreneur', 'view_simulator')).toBe(true)
      expect(hasPermission('entrepreneur', 'view_financials')).toBe(true)
      expect(hasPermission('entrepreneur', 'create_scenarios')).toBe(true)
      expect(hasPermission('entrepreneur', 'export_reports')).toBe(true)
      expect(hasPermission('entrepreneur', 'edit_data')).toBe(false)
      expect(hasPermission('entrepreneur', 'upload_documents')).toBe(false)
      expect(hasPermission('entrepreneur', 'manage_users')).toBe(false)
    })

    it('citizen should only view simulator', () => {
      expect(hasPermission('citizen', 'view_simulator')).toBe(true)
      expect(hasPermission('citizen', 'edit_data')).toBe(false)
      expect(hasPermission('citizen', 'export_reports')).toBe(false)
      expect(hasPermission('citizen', 'view_financials')).toBe(false)
      expect(hasPermission('citizen', 'create_scenarios')).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    it('should return true when user has all required permissions', () => {
      expect(hasAllPermissions('admin', ['view_simulator', 'edit_data'])).toBe(true)
      expect(hasAllPermissions('functionary', ['view_simulator', 'edit_data'])).toBe(true)
    })

    it('should return false when user lacks any required permission', () => {
      expect(hasAllPermissions('entrepreneur', ['view_simulator', 'edit_data'])).toBe(false)
      expect(hasAllPermissions('citizen', ['view_simulator', 'export_reports'])).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    it('should return true when user has at least one required permission', () => {
      expect(hasAnyPermission('entrepreneur', ['edit_data', 'view_simulator'])).toBe(true)
      expect(hasAnyPermission('citizen', ['edit_data', 'view_simulator'])).toBe(true)
    })

    it('should return false when user has none of the required permissions', () => {
      expect(hasAnyPermission('citizen', ['edit_data', 'manage_users'])).toBe(false)
      expect(hasAnyPermission('entrepreneur', ['manage_users', 'access_admin_panel'])).toBe(false)
    })
  })

  describe('getRolePermissions', () => {
    it('should return all permissions for admin', () => {
      const perms = getRolePermissions('admin')
      expect(perms.length).toBe(10)
      expect(perms).toContain('view_simulator')
      expect(perms).toContain('manage_users')
      expect(perms).toContain('access_admin_panel')
    })

    it('should return restricted permissions for citizen', () => {
      const perms = getRolePermissions('citizen')
      expect(perms.length).toBe(1)
      expect(perms).toContain('view_simulator')
      expect(perms).not.toContain('edit_data')
    })
  })

  describe('audienceToRole', () => {
    it('should map audience to correct role', () => {
      expect(audienceToRole('functionary')).toBe('functionary')
      expect(audienceToRole('entrepreneur')).toBe('entrepreneur')
      expect(audienceToRole('citizen')).toBe('citizen')
    })

    it('should default to citizen for unknown audience', () => {
      expect(audienceToRole(null)).toBe('citizen')
      expect(audienceToRole('unknown_role' as any)).toBe('citizen')
    })
  })

  describe('isAdminRole', () => {
    it('should return true for admin role', () => {
      expect(isAdminRole('admin')).toBe(true)
    })

    it('should return false for non-admin roles', () => {
      expect(isAdminRole('functionary')).toBe(false)
      expect(isAdminRole('entrepreneur')).toBe(false)
      expect(isAdminRole('citizen')).toBe(false)
      expect(isAdminRole(null)).toBe(false)
    })
  })

  describe('isAdminOrFunctionary', () => {
    it('should return true for admin and functionary', () => {
      expect(isAdminOrFunctionary('admin')).toBe(true)
      expect(isAdminOrFunctionary('functionary')).toBe(true)
    })

    it('should return false for other roles', () => {
      expect(isAdminOrFunctionary('entrepreneur')).toBe(false)
      expect(isAdminOrFunctionary('citizen')).toBe(false)
      expect(isAdminOrFunctionary(null)).toBe(false)
    })
  })
})
