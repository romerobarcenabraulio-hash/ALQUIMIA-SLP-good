import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import { FUNCTIONARY_MODULE_ORDER } from '@/lib/chapterConfig'

const readFrontend = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

describe('simulator functionary surface', () => {
  it('expone 24 ítems funcionario tras consolidación Fase 5 (guía + 23 módulos)', () => {
    expect(AUDIENCE_MODULES.functionary).toEqual([
      'guia_circularidad',
      ...FUNCTIONARY_MODULE_ORDER,
    ])
    expect(AUDIENCE_MODULES.functionary).toHaveLength(24)
    expect(AUDIENCE_MODULES.functionary).toContain('antecedentes_municipales')
    expect(AUDIENCE_MODULES.functionary).toContain('evm_dashboard')
    expect(AUDIENCE_MODULES.functionary).not.toContain('gate_status')
    expect(AUDIENCE_MODULES.functionary.at(-1)).toBe('risk_dashboard')
  })

  it('renderiza stacks dedicados para planificación, fiscal-social y escenarios', () => {
    const registrySource = readFrontend('src/app/simulator/renderDecisionModule.tsx')

    expect(registrySource).toContain("case 'roadmap_implementacion':")
    expect(registrySource).toMatch(/function RoadmapConsolidatedModule\(\)[\s\S]*<FutureGoalsModule/)
    expect(registrySource).toMatch(/label: 'Roadmap'[\s\S]*label: 'Cronograma'[\s\S]*label: 'Ruta crítica'[\s\S]*label: 'Oleadas'/)
    expect(registrySource).toContain('const FutureGoalsModule = dynamic(')
    expect(registrySource).toContain('function SocialAuthorityConsolidatedModule')
    expect(registrySource).toMatch(/label: 'Demografía'[\s\S]*label: 'Encuesta'[\s\S]*label: 'Actores'[\s\S]*label: 'Autoridad'/)
    expect(registrySource).toContain('<OrganigramaDiagnosticoStack />')
    expect(registrySource).toContain('function OmissionImpactConsolidatedModule')
    expect(registrySource).toContain('<EvaluacionSocioeconomicaStack />')
    expect(registrySource).toMatch(/label: 'Rutas y vehículos'[\s\S]*label: 'Educación ciudadana'/)
    expect(registrySource).toMatch(/label: 'EVM'[\s\S]*label: 'Conciliación'/)
    expect(registrySource).toMatch(/label: 'Riesgos'[\s\S]*label: 'Gates'/)
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

    expect(guiaSource).toContain('countJourneyModeModules')
    expect(guiaSource).toContain('CHAPTERS')
    expect(guiaSource).not.toMatch(/16 módulos/)
    expect(guiaSource).toContain('CHAPTER_COUNT')
    expect(guiaSource).toContain('countJourneyModeModules')
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
