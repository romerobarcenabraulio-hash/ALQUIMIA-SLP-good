import { useRBAC } from '@/hooks/useRBAC'

/**
 * Hook for data modification permissions
 * Determines what data operations are allowed for the current user
 */
export function useDataPermissions() {
  const { canEditData, canModifyAssumptions, canCreateScenarios, canViewFinancials } = useRBAC()

  return {
    // Data input and editing
    canEditBaseline: canEditData,
    canEditAssumptions: canModifyAssumptions,
    canModifyParameters: canEditData,
    canUploadResearch: canEditData,

    // Scenario operations
    canCreateScenario: canCreateScenarios,
    canModifyScenario: canCreateScenarios,
    canDeleteScenario: canEditData,

    // Financial operations
    canViewFinancialData: canViewFinancials,
    canExportFinancials: canViewFinancials,

    // Data modification checks
    canModifyData: (moduleId: string): boolean => {
      // Certain modules might have additional restrictions
      const restrictedModules = ['ciudad_baseline', 'social_diagnostico']
      if (restrictedModules.includes(moduleId)) {
        return canEditData
      }
      return canEditData
    },
  }
}
