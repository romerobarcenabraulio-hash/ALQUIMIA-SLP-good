import type { DecisionModule } from '@/types'

/** El registry (`clientModuleRegistry.ts`) es la fuente canónica de labels y next_action. */
export function enrichFunctionaryModules(modules: DecisionModule[]): DecisionModule[] {
  return modules
}
