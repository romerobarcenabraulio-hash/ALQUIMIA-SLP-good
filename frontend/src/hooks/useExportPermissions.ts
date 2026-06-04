import { useRBAC } from '@/hooks/useRBAC'

/**
 * Hook for export/report generation permissions
 * Determines what export operations are allowed for the current user
 */
export function useExportPermissions() {
  const { canExportReports, canViewFinancials, userRole } = useRBAC()

  return {
    // Report exports
    canExportPDF: canExportReports,
    canExportXLSX: canExportReports,
    canExportJSON: canExportReports && (userRole === 'admin' || userRole === 'functionary'),

    // Financial exports
    canExportFinancialReport: canExportReports && canViewFinancials,
    canExportBudgetSummary: canExportReports && canViewFinancials,

    // Data exports (more restricted)
    canExportRawData: userRole === 'admin' || userRole === 'functionary',
    canExportAuditLog: userRole === 'admin',

    // Check if any export is available
    canExportAnything: canExportReports,

    // Export format availability
    getAvailableFormats: (): Array<'pdf' | 'xlsx' | 'json'> => {
      const formats: Array<'pdf' | 'xlsx' | 'json'> = []
      if (canExportReports) {
        formats.push('pdf', 'xlsx')
      }
      if (userRole === 'admin' || userRole === 'functionary') {
        formats.push('json')
      }
      return formats
    },
  }
}
