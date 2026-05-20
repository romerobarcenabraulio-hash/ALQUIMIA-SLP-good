import type { buildSociodemographicScaffoldBlock } from '@/lib/socialDemographicScaffold'
import type { Audience, DecisionModule } from '@/types'

export type SociodemographicBlock = ReturnType<typeof buildSociodemographicScaffoldBlock>

export interface DecisionModuleRenderContext {
  module: DecisionModule
  audience: Audience | null
  isOrganizationJourney: boolean
  sociodemographicBlock: SociodemographicBlock
  /** Navega programáticamente a un módulo por su module_id */
  onNavigate?: (moduleId: string) => void
}
