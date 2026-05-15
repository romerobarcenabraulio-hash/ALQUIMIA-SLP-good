/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { SocialContextHandoffPanel } from '@/components/simulator/SocialContextHandoffPanel'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import { SOCIAL_ASSUMPTIONS_KEY_V1 } from '@/lib/social/socialAssumptionsStorage'
import { SOCIAL_RISK_MATRIX_ITEMS } from '@/data/socialRiskMatrixContent'

function memoryStorage(): Storage {
  const m = new Map<string, string>()
  return {
    get length() {
      return m.size
    },
    clear: () => m.clear(),
    getItem: k => m.get(k) ?? null,
    key: i => Array.from(m.keys())[i] ?? null,
    removeItem: k => {
      m.delete(k)
    },
    setItem: (k, v) => {
      m.set(k, v)
    },
  }
}

const block: SociodemographicDisplayBlock = {
  geo_scope: 'municipio_cve',
  dato: 'no_disponible',
  fuente_declarada: '',
}

describe('SocialContextHandoffPanel', () => {
  it('genera tabla con fichas de riesgo y permite copiar Markdown', async () => {
    const mem = memoryStorage()
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })

    const { container } = render(
      <SocialContextHandoffPanel
        block={block}
        moduleAnchor="municipal_context"
        persistence="local"
        _storageOverride={mem}
      />,
    )

    fireEvent.click(container.querySelector('[data-testid="social-context-handoff-generate"]') as HTMLButtonElement)

    await waitFor(() => {
      expect(container.querySelectorAll('[data-testid="social-context-handoff-preview-table"] tbody tr').length).toBe(
        SOCIAL_RISK_MATRIX_ITEMS.length,
      )
    })

    fireEvent.click(container.querySelector('[data-testid="social-context-handoff-copy-md"]') as HTMLButtonElement)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled()
      const arg = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
      expect(arg).toMatch(/Handoff capa social/)
      expect(arg).toMatch(/\| .* \| riesgo \|/)
    })

    vi.unstubAllGlobals()
  })

  it('incluye supuestos recientes de bitácora en la tabla', async () => {
    const mem = memoryStorage()
    mem.setItem(
      SOCIAL_ASSUMPTIONS_KEY_V1,
      JSON.stringify({
        schemaVersion: 1,
        entries: [
          { id: 'e1', texto: 'Nota de bitácora', timestamp: '2026-05-07T00:00:00.000Z', manual: true },
        ],
      }),
    )

    const { container } = render(
      <SocialContextHandoffPanel
        block={block}
        moduleAnchor="municipal_context"
        persistence="local"
        _storageOverride={mem}
      />,
    )

    fireEvent.click(container.querySelector('[data-testid="social-context-handoff-generate"]') as HTMLButtonElement)

    await waitFor(() => {
      const rows = container.querySelectorAll('[data-testid="social-context-handoff-preview-table"] tbody tr')
      expect(rows.length).toBe(SOCIAL_RISK_MATRIX_ITEMS.length + 1)
      expect(container.textContent).toMatch(/Nota de bitácora/)
      expect(container.textContent).toMatch(/supuesto/)
    })
  })
})
