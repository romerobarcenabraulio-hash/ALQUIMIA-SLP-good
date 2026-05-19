import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'

const readFrontend = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('simulator functionary surface', () => {
  it('mantiene el orden funcionario con mercado/causalidad, bibliografia y calculos al cierre', () => {
    expect(AUDIENCE_MODULES.functionary).toEqual([
      'city_baseline',
      'municipal_context',
      'social_study',
      'future_goals',
      'infrastructure_operations',
      'market_traceability',
      'risk_trends',
      'inspeccion_predios',
      'scenarios_export',
      'source_traceability',
    ])
  })

  it('muestra Gantt-PERT real en metas futuras y finanzas avanzadas en escenarios', () => {
    const registrySource = readFrontend('src/app/simulator/renderDecisionModule.tsx')

    expect(registrySource).toContain("case 'future_goals':")
    expect(registrySource).toMatch(/case 'future_goals':[\s\S]*<FutureGoalsModule/)
    expect(registrySource).toContain('const FutureGoalsModule = dynamic(')
    const futureGoals = readFrontend('src/components/simulator/FutureGoalsModule.tsx')
    expect(futureGoals).toContain('future-goals-arm')
    expect(futureGoals).toContain('PERT y oleadas')
    expect(readFrontend('src/components/simulator/ProgresionPlanMunicipalTiempo.tsx')).not.toContain('ResponsiveContainer')
    expect(registrySource).toMatch(/case 'scenarios_export':[\s\S]*<ScenariosExportStack \/>/)
    expect(readFrontend('src/components/simulator/stacks/ScenariosExportStack.tsx')).toContain(
      '<ImpactoFinanciero />',
    )
    expect(registrySource).toContain("case 'market_traceability':")
    expect(registrySource).toContain("case 'risk_trends':")
    expect(readFrontend('src/lib/simulator/functionaryJourneyEnrichment.ts')).toContain(
      "label: 'Bibliografía y cálculos'",
    )
    expect(readFrontend('src/app/simulator/page.tsx')).not.toContain('Trazabilidad de datos')
  })

  it('no presenta composicion RSU como certificacion municipal', () => {
    const compositionSource = readFrontend('src/components/simulator/ComposicionRSU.tsx')

    expect(compositionSource).toContain('Referencia documental')
    expect(compositionSource).toContain('No se presentan como medición oficial del municipio activo')
    expect(compositionSource).not.toContain('Dato certificado SEMARNAT')
    expect(compositionSource).not.toContain('IPSL absorbe flujo completo SLP')
    expect(compositionSource).not.toContain('Vitro/Owens Illinois cap. disponible')
  })
})
