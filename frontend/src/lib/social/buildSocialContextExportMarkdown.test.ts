import { describe, expect, it } from 'vitest'
import {
  buildSocialContextExportMarkdown,
  fenceUserMultiline,
} from '@/lib/social/buildSocialContextExportMarkdown'
import { SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER } from '@/lib/socialContextPlaceholder'
import { SOCIAL_RISK_MATRIX_ITEMS } from '@/data/socialRiskMatrixContent'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import type { SocialAssumptionLogEntry } from '@/types/socialAssumptionsLog'

const block: SociodemographicDisplayBlock = {
  geo_scope: 'municipio_cve',
  dato: 'no_disponible',
  fuente_declarada: '  Fuente de prueba  ',
}

const entries: SocialAssumptionLogEntry[] = [
  {
    id: '1',
    texto: 'Nota A',
    timestamp: '2026-01-01T00:00:00.000Z',
    manual: true,
  },
]

describe('buildSocialContextExportMarkdown (PR5)', () => {
  it('genera texto no vacío con secciones obligatorias', () => {
    const md = buildSocialContextExportMarkdown({
      block,
      disclaimerBody: SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER,
      riskItems: SOCIAL_RISK_MATRIX_ITEMS,
      assumptionEntries: entries,
      bitacoraTailN: 20,
      pr3MarkdownSection: '## Indicadores\n\n- demo',
      generatedAtIso: '2026-05-05T12:00:00.000Z',
      moduleAnchor: 'municipal_context',
    })
    expect(md.trim().length).toBeGreaterThan(200)
    expect(md).toMatch(/# Resumen contexto social/)
    expect(md).toMatch(/## Alcance y estado declarado/)
    expect(md).toMatch(/## Disclaimer/)
    expect(md).toMatch(/## Matriz cualitativa de riesgos/)
    expect(md).toMatch(/## Bitácora de supuestos/)
    expect(md).toContain('municipal_context')
    expect(md).toContain('Fuente de prueba')
  })

  it('fenceUserMultiline evita cierre accidental de fence en línea aislada', () => {
    const f = fenceUserMultiline('linea1\n```\nhack')
    expect(f).toContain('```text')
    expect(f).toContain('\\`\\`\\`')
  })
})
