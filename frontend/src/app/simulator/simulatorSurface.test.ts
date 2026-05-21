import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { FUNCTIONARY_MODULE_ORDER } from '@/lib/chapterConfig'

const readFrontend = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('simulator functionary surface', () => {
  it('expone 32 módulos funcionario (guía + 31 capítulos) con trazabilidad al cierre', () => {
    expect(AUDIENCE_MODULES.functionary).toEqual([
      'guia_circularidad',
      ...FUNCTIONARY_MODULE_ORDER,
    ])
    expect(AUDIENCE_MODULES.functionary).toContain('organigrama_diagnostico')
    expect(AUDIENCE_MODULES.functionary.at(-1)).toBe('trazabilidad')
  })

  it('renderiza stacks dedicados para planificación, fiscal-social y escenarios', () => {
    const registrySource = readFrontend('src/app/simulator/renderDecisionModule.tsx')

    expect(registrySource).toContain("case 'plan_maestro':")
    expect(registrySource).toMatch(/case 'plan_maestro':[\s\S]*<FutureGoalsModule/)
    expect(registrySource).toContain('const FutureGoalsModule = dynamic(')
    expect(registrySource).toContain("case 'organigrama_diagnostico':")
    expect(registrySource).toContain('<OrganigramaDiagnosticoStack />')
    expect(registrySource).toContain("case 'evaluacion_socioeconomica':")
    expect(registrySource).toContain('<EvaluacionSocioeconomicaStack />')
    expect(registrySource).toMatch(/case 'escenarios_financieros':[\s\S]*<ScenariosExportStack/)
    expect(registrySource).toContain("case 'mercado_materiales':")
    expect(registrySource).toMatch(/case 'mercado_materiales':[\s\S]*pageOnly=\{2\}/)
    expect(registrySource).toContain("case 'riesgos_modelo':")
    expect(registrySource).toMatch(/case 'riesgos_modelo':[\s\S]*pageOnly=\{1\}/)
    expect(registrySource).toContain("resolveModuleId")

    const futureGoals = readFrontend('src/components/simulator/FutureGoalsModule.tsx')
    expect(futureGoals).toContain('PERT_NODES')
    expect(futureGoals).toContain('pageOnly')
    expect(readFrontend('src/components/simulator/ProgresionPlanMunicipalTiempo.tsx')).not.toContain('ResponsiveContainer')
    expect(readFrontend('src/components/simulator/stacks/ScenariosExportStack.tsx')).toContain(
      '<ImpactoFinanciero />',
    )
    expect(readFrontend('src/lib/simulator/clientModuleRegistry.ts')).toContain('buildFunctionaryJourney')
    expect(readFrontend('src/app/simulator/page.tsx')).toContain('buildFunctionaryJourney')
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
