import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { AUDIENCE_MODULES } from '@/lib/audienceModules'

/** `frontend/` (src/lib/social → .. ×3) */
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

function readSrc(relFromFrontendSrc: string): string {
  return readFileSync(path.join(root, 'src', relFromFrontendSrc), 'utf8')
}

/**
 * Superficie estable para smoke / CI ligero — no abre navegador.
 * Humano sigue `cursor-rules/SMOKE_SOCIAL_LAYER.md`.
 */
describe('smokeSocialLayerSurface (capa social)', () => {
  it('funcionario y ciudadano mantienen municipal_context (Producto puede recortar después con flag)', () => {
    expect(AUDIENCE_MODULES.functionary).toContain('municipal_context')
    expect(AUDIENCE_MODULES.citizen).toContain('municipal_context')
  })

  it('page.tsx monta SocialDemographicContextPanel en municipal_context', () => {
    const page = readSrc('app/simulator/page.tsx')
    expect(page).toContain("case 'municipal_context':")
    expect(page).toMatch(/case 'municipal_context':[\s\S]*<SocialDemographicContextPanel/)
  })

  it('panel social expone testids y sección oficial PR3', () => {
    const panel = readSrc('components/simulator/SocialDemographicContextPanel.tsx')
    expect(panel).toContain('data-testid="social-context-root"')
    expect(panel).toContain('SocialOfficialStatsSection')

    const official = readSrc('components/simulator/SocialOfficialStatsSection.tsx')
    expect(official).toContain('data-testid="social-context-official-stats"')
    expect(official).toContain('getSocialStatsSourceMode')
  })

  it('OfficialStatCard conserva anclas de disclaimers y trazabilidad', () => {
    const card = readSrc('components/simulator/OfficialStatCard.tsx')
    expect(card).toContain('data-testid="social-context-official-stat-card"')
    expect(card).toContain('data-testid="social-official-source-trace"')
    expect(card).toContain('data-testid="social-official-numeric-footer"')
    expect(card).toContain('data-testid="social-official-pre-numeric-disclaimer"')
    expect(card).toContain('data-testid="social-context-official-stat-mismatch"')
  })

  it('ruta GET /data/social-stats/slices-<BUILD_ID>.json sirve el bundle embebido', () => {
    const route = readSrc('app/data/social-stats/[filename]/route.ts')
    expect(route).toContain('SOCIAL_STATS_BUNDLE_EMBEDDED')
    expect(route).toContain('SOCIAL_STATS_BUILD_ID')
    expect(route).toContain('NextResponse.json')
  })

  it('export PR5 conserva toggle por env documentado en código', () => {
    const pr5 = readSrc('lib/social/pr5ExportConstants.ts')
    expect(pr5).toContain('NEXT_PUBLIC_SOCIAL_CONTEXT_EXPORT_HIDDEN')
    expect(pr5).toContain('NEXT_PUBLIC_CITIZEN_UI')
    expect(pr5).toContain('isSocialContextExportUiEnabled')
  })
})
