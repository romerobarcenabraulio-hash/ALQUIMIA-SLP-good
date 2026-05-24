import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { FUNCTIONARY_MODULE_ORDER } from '@/lib/chapterConfig'

const readFrontend = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('simulator functionary surface', () => {
  it('expone 37 ítems funcionario (guía + 36 módulos) con gate_status al cierre', () => {
    expect(AUDIENCE_MODULES.functionary).toEqual([
      'guia_circularidad',
      ...FUNCTIONARY_MODULE_ORDER,
    ])
    expect(AUDIENCE_MODULES.functionary).toHaveLength(37)
    expect(AUDIENCE_MODULES.functionary).toContain('organigrama_diagnostico')
    expect(AUDIENCE_MODULES.functionary).toContain('evm_dashboard')
    expect(AUDIENCE_MODULES.functionary.at(-1)).toBe('gate_status')
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

  it('no usa cifras placeholder 379.3 ni 18 centros en stacks de mercado/logística', () => {
    const paths = [
      'src/components/simulator/stacks/MarketTraceabilityStack.tsx',
      'src/components/simulator/stacks/LogisticaOperativaStack.tsx',
      'src/components/simulator/stacks/CostoOmisionStack.tsx',
    ]
    for (const p of paths) {
      const src = readFrontend(p)
      expect(src).not.toContain('379.3')
      expect(src).not.toMatch(/18 centros/)
    }
  })

  it('guía M00 deriva conteos desde chapterConfig (sin hardcode 16)', () => {
    const guiaSource = readFrontend('src/components/simulator/stacks/GuiaCircularidadStack.tsx')

    expect(guiaSource).toContain('FUNCTIONARY_MODULE_ORDER')
    expect(guiaSource).toContain('CHAPTERS')
    expect(guiaSource).not.toMatch(/16 módulos/)
    expect(guiaSource).toContain('{MODULE_COUNT} módulos de análisis')
  })

  it('simulator page usa fondo blanco homogéneo sin wrapper con borde', () => {
    const pageSource = readFrontend('src/app/simulator/page.tsx')

    expect(pageSource).toContain('bg-surface-base')
    expect(pageSource).not.toContain("background: '#F4F2ED'")
    expect(pageSource).not.toMatch(/rounded-\[12px\] border border-\[#E8E4DC\]/)
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
