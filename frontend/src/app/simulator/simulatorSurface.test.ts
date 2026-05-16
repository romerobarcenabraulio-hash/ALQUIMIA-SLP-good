import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'

const readFrontend = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('simulator functionary surface', () => {
  it('mantiene el orden funcionario con bibliografia y calculos al cierre', () => {
    expect(AUDIENCE_MODULES.functionary).toEqual([
      'city_baseline',
      'municipal_context',
      'future_goals',
      'infrastructure_operations',
      'inspeccion_predios',
      'scenarios_export',
      'source_traceability',
    ])
  })

  it('muestra Gantt-PERT real en metas futuras y finanzas avanzadas en escenarios', () => {
    const pageSource = readFrontend('src/app/simulator/page.tsx')

    expect(pageSource).toContain("case 'future_goals':")
    expect(pageSource).toMatch(/case 'future_goals':[\s\S]*<FutureGoalsModule/)
    expect(pageSource).toContain('const FutureGoalsModule = dynamic(')
    const futureGoals = readFrontend('src/components/simulator/FutureGoalsModule.tsx')
    expect(futureGoals).toContain('future-goals-arm')
    expect(futureGoals).toContain('PERT y oleadas')
    expect(readFrontend('src/components/simulator/ProgresionPlanMunicipalTiempo.tsx')).not.toContain('ResponsiveContainer')
    expect(pageSource).toMatch(/case 'scenarios_export':[\s\S]*<ImpactoFinanciero \/>/)
    expect(pageSource).toContain("label: 'Bibliografía y cálculos'")
    expect(pageSource).not.toContain('Trazabilidad de datos')
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
