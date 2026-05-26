import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'
import {
  FUNCTIONARY_MODULE_ORDER,
  LEGACY_MODULE_ALIASES,
  MODULE_NUMBERS,
  resolveModuleId,
} from '@/lib/chapterConfig'
import { CLIENT_FUNCTIONARY_MODULES } from '@/lib/simulator/clientModuleRegistry'
import { getModuleEditorialBrief } from '@/data/moduleEditorialBriefs'
import { CHART_BRIEF_CATALOG } from '@/data/chartBriefCatalog'

const readFrontend = (path: string) => readFileSync(join(process.cwd(), path), 'utf8')

const BASE_CTX = {
  territorio: 'ZM San Luis Potosí',
  scope: 'zm' as const,
  municipiosCount: 3,
}

const JOURNEY_IDS = AUDIENCE_MODULES.functionary

describe('editorial inventory', () => {
  it('cada módulo del recorrido funcionario tiene brief editorial', () => {
    const missing: string[] = []
    for (const id of JOURNEY_IDS) {
      const brief = getModuleEditorialBrief(id, BASE_CTX)
      if (!brief) missing.push(id)
    }
    expect(missing, `Sin brief: ${missing.join(', ')}`).toEqual([])
  })

  it('resolveModuleId cubre todos los IDs canónicos del journey', () => {
    for (const id of FUNCTIONARY_MODULE_ORDER) {
      expect(resolveModuleId(id)).toBe(id)
    }
    for (const [legacy, canonical] of Object.entries(LEGACY_MODULE_ALIASES)) {
      expect(resolveModuleId(legacy)).toBe(canonical)
    }
  })

  it('registry incluye todos los módulos del journey excepto guía', () => {
    for (const id of FUNCTIONARY_MODULE_ORDER) {
      expect(CLIENT_FUNCTIONARY_MODULES[id], `Falta registry: ${id}`).toBeDefined()
    }
  })

  it('no contiene strings editoriales prohibidos en simulador', () => {
    const paths = [
      'src/components/simulator/stacks/GuiaCircularidadStack.tsx',
      'src/components/simulator/stacks/DobleMaterialidadStack.tsx',
      'src/components/simulator/FloatingCTA.tsx',
      'src/components/simulator/GovernancePanel.tsx',
      'src/components/simulator/NarrativeBridge.tsx',
      'src/app/simulator/renderDecisionModule.tsx',
      'src/lib/simulator/clientModuleRegistry.ts',
      'src/lib/simulator/functionaryJourneyEnrichment.ts',
      'src/data/moduleEditorialBriefs.ts',
    ]
    const forbidden = [
      /Steps for Circularity/,
      /ALQUIMIA Platform/,
      /\bS4\.6\b/,
      /16 módulos/,
      /19 módulos anteriores/,
      /Narrativa en 5 pasos/,
      /consultor senior/,
      /deja dinero sobre la mesa/,
      /FUNCTIONARY_MODULE_LABELS/,
    ]
    for (const p of paths) {
      const src = readFrontend(p)
      for (const pattern of forbidden) {
        expect(src, `${p} contiene ${pattern}`).not.toMatch(pattern)
      }
    }
  })

  it('enrichment no sobrescribe labels del registry', () => {
    const src = readFrontend('src/lib/simulator/functionaryJourneyEnrichment.ts')
    expect(src).toContain('enrichFunctionaryModules')
    expect(src).not.toMatch(/FUNCTIONARY_MODULE_LABELS\[.*\].*label/)
    expect(src).not.toContain('FUNCTIONARY_MODULE_LABELS')
  })

  it('guía M00 no ancla copy a un territorio concreto', () => {
    const brief = getModuleEditorialBrief('guia_circularidad', {
      ...BASE_CTX,
      territorio: 'ZM San Luis Potosí',
    })
    expect(brief?.situacion_actual).not.toContain('ZM San Luis Potosí')
    expect(brief?.situacion_actual).toMatch(/cualquier municipio de México/i)
  })

  it('referencias M en briefs coinciden con MODULE_NUMBERS', () => {
    const briefSrc = readFrontend('src/data/moduleEditorialBriefs.ts')
    const refs = [...briefSrc.matchAll(/\bM(\d+[A-Z]?)\b/g)].map(m => m[1]!)
    const valid = new Set(Object.values(MODULE_NUMBERS))
    const invalid = refs.filter(r => !valid.has(r))
    expect(invalid, `Referencias M inválidas: ${[...new Set(invalid)].join(', ')}`).toEqual([])
  })

  it('stacks no repiten hero de módulo (título duplicado bajo DecisionModuleShell)', () => {
    const stackPaths = [
      'src/components/simulator/stacks/CapacidadInstitucionalStack.tsx',
      'src/components/simulator/stacks/DictamenTecnicoStack.tsx',
      'src/components/simulator/stacks/EvaluacionSocioeconomicaStack.tsx',
      'src/components/simulator/stacks/ImpactoAmbientalStack.tsx',
      'src/components/simulator/stacks/InspeccionStack.tsx',
      'src/components/simulator/stacks/OrganigramaDiagnosticoStack.tsx',
      'src/components/simulator/stacks/PlanEducativoStack.tsx',
      'src/components/simulator/stacks/TeoriaCambioStack.tsx',
      'src/components/simulator/stacks/MonitoreoRealStack.tsx',
    ]
    const heroPattern = /font-serif text-\[22px\]/
    for (const p of stackPaths) {
      expect(readFrontend(p), `${p} repite hero h2`).not.toMatch(heroPattern)
    }
  })

  it('catálogo QHC cubre chartId del simulador', () => {
    const ids = new Set<string>()
    const patterns = [/chartId="([^"]+)"/g, /data-chart-id="([^"]+)"/g]

    const stackDir = join(process.cwd(), 'src/components/simulator/stacks')
    const stackFiles = readdirSync(stackDir)
      .filter(f => f.endsWith('.tsx'))
      .map(f => `src/components/simulator/stacks/${f}`)

    const simulatorFiles = [
      ...stackFiles,
      'src/components/simulator/FutureGoalsModule.tsx',
      'src/components/simulator/ImpactoFinanciero.tsx',
      'src/components/simulator/RiskTrendsPanel.tsx',
      'src/components/simulator/ImpactScenariosPanel.tsx',
      'src/components/simulator/ReferenciasCalculos.tsx',
      ...readdirSync(join(process.cwd(), 'src/components/charts'))
        .filter(f => f.endsWith('.tsx'))
        .map(f => `src/components/charts/${f}`),
    ]

    for (const p of simulatorFiles) {
      const src = readFrontend(p)
      for (const pattern of patterns) {
        for (const m of src.matchAll(pattern)) ids.add(m[1]!)
      }
    }
    const missing = [...ids].filter(id => !CHART_BRIEF_CATALOG[id])
    expect(missing, `Sin QHC en catálogo: ${missing.join(', ')}`).toEqual([])
  })

  it('gráficas Recharts no usan fontSize 8–9 en ejes (contrato EIDOS ≥10px)', () => {
    const chartPaths = [
      ...readdirSync(join(process.cwd(), 'src/components/simulator/stacks'))
        .filter(f => f.endsWith('.tsx'))
        .map(f => `src/components/simulator/stacks/${f}`),
      'src/components/simulator/FutureGoalsModule.tsx',
      'src/components/simulator/RiskTrendsPanel.tsx',
      'src/components/simulator/ImpactScenariosPanel.tsx',
      ...readdirSync(join(process.cwd(), 'src/components/charts'))
        .filter(f => f.endsWith('.tsx'))
        .map(f => `src/components/charts/${f}`),
    ]
    const axisFontPattern = /(?:tick|label)=\{\{[^}]*fontSize:\s*[89]\b/g
    const violations: string[] = []
    for (const p of chartPaths) {
      const src = readFrontend(p)
      if (!src.includes('ResponsiveContainer') && !src.includes('PlanChartFrame')) continue
      const matches = src.match(axisFontPattern)
      if (matches?.length) violations.push(`${p}: ${matches.length} axis/label fontSize 8–9`)
    }
    expect(violations, violations.join('\n')).toEqual([])
  })
})
