import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontend(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('platform legacy quarantine', () => {
  it('keeps public platform routes away from simulator imports', () => {
    const files = [
      'src/app/v/page.tsx',
      'src/app/p/page.tsx',
      'src/app/e/page.tsx',
    ]

    for (const file of files) {
      const source = readFrontend(file)
      expect(source, file).not.toContain('@/store/simulatorStore')
      expect(source, file).not.toContain('@/components/simulator')
      expect(source, file).not.toContain('@/app/simulator/renderDecisionModule')
      expect(source, file).not.toContain('useSimulatorStore')
    }
  })

  it('documents deletion criteria before removing legacy files', () => {
    const manifest = readFrontend('src/lib/legacyQuarantineManifest.ts')

    expect(manifest).toContain('simulatorStore.ts')
    expect(manifest).toContain('components/simulator/**')
    expect(manifest).toContain('No borrar legacy mientras exista import activo')
    expect(manifest).toContain('/v, /p, /e, /admin o export')
  })
})
