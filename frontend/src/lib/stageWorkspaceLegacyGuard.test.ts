import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const removedParallelRenderer = ['src/components/platform', 'Stage' + 'Workspace.tsx'].join('/')
const removedParallelApiRoute = ['src/app/api/tenants/[id]', 'stage-' + 'workspace', 'route.ts'].join('/')

function readFrontend(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('client platform renderer guard', () => {
  it('keeps public platform routes on PlatformPage without the removed parallel renderer', () => {
    const files = [
      'src/app/v/page.tsx',
      'src/app/p/page.tsx',
      'src/app/e/page.tsx',
    ]

    expect(existsSync(join(process.cwd(), removedParallelRenderer))).toBe(false)
    expect(existsSync(join(process.cwd(), removedParallelApiRoute))).toBe(false)
    for (const file of files) {
      const source = readFrontend(file)
      expect(source, file).toContain('PlatformPage')
      expect(source, file).not.toContain('@/store/simulatorStore')
      expect(source, file).not.toContain('@/components/simulator')
      expect(source, file).not.toContain('@/app/simulator/renderDecisionModule')
      expect(source, file).not.toContain('useSimulatorStore')
      expect(source, file).not.toContain('Stage' + 'Workspace')
    }
  })

  it('allows PlatformPage to rescue the historical module renderer behind the platform shell', () => {
    const source = readFrontend('src/components/platform/PlatformPage.tsx')

    expect(source).toContain('@/app/simulator/renderDecisionModule')
    expect(source).toContain('renderDecisionModule({')
    expect(source).not.toContain('@/components/platform/ConsultingModuleShell')
    expect(source).not.toContain('@/components/platform/PillarModulePanel')
    expect(source).not.toContain('validationModuleSpecFor')
  })

  it('documents remaining legacy without protecting the removed parallel renderer', () => {
    const manifest = readFrontend('src/lib/legacyQuarantineManifest.ts')

    expect(manifest).toContain('simulatorStore.ts')
    expect(manifest).toContain('Renderer histórico detrás de PlatformPage')
    expect(manifest).toContain('components/simulator/**')
    expect(manifest).toContain('No borrar legacy mientras exista import activo')
    expect(manifest).toContain('/v, /p, /e, /admin o export')
    expect(manifest).not.toContain('Stage' + 'Workspace')
  })
})
