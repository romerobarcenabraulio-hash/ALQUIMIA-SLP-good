/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import { SocialRiskMatrixCards } from '@/components/simulator/SocialRiskMatrixCards'
import { SocialAssumptionsLog } from '@/components/simulator/SocialAssumptionsLog'
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

describe('Capa social PR2 — fichas y bitácora', () => {
  it('renderiza matriz de riesgos y muestra pendiente de fuente sin enlaces falsos', () => {
    const { container } = render(<SocialRiskMatrixCards />)
    const matrix = container.querySelector('[data-testid="social-context-risk-matrix"]')
    expect(matrix).toBeTruthy()
    const cards = container.querySelectorAll('[data-testid="social-context-risk-card"]')
    expect(cards.length).toBe(SOCIAL_RISK_MATRIX_ITEMS.length)
    expect(container.textContent).toMatch(/pendiente de fuente/)
    expect(container.querySelectorAll('a[href]').length).toBe(0)
  })

  it('añade fila a bitácora y persiste en storage mock', async () => {
    const mem = memoryStorage()
    const { container } = render(
      <SocialAssumptionsLog persistence="local" _storageOverride={mem} />,
    )

    const ta = container.querySelector(
      '[data-testid="social-context-assumptions-input-texto"]',
    ) as HTMLTextAreaElement
    fireEvent.change(ta, { target: { value: 'Supuesto de prueba' } })

    const btn = container.querySelector('[data-testid="social-context-assumptions-append"]') as HTMLButtonElement
    expect(btn.disabled).toBe(false)
    fireEvent.click(btn)

    await waitFor(() => {
      const rows = container.querySelectorAll('[data-testid="social-context-assumption-row"]')
      expect(rows.length).toBe(1)
      expect(rows[0].textContent).toMatch(/Supuesto de prueba/)
      expect(rows[0].textContent).toMatch(/manual/)
    })

    expect(mem.getItem('alquimia.social.assumptionsLog.v1')).toBeTruthy()
  })
})
