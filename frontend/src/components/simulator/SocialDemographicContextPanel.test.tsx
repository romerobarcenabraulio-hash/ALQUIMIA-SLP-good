/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { SocialDemographicContextPanel } from '@/components/simulator/SocialDemographicContextPanel'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import { SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER } from '@/lib/socialContextPlaceholder'

const baseBlock: SociodemographicDisplayBlock = {
  geo_scope: 'municipio_cve',
  dato: 'no_disponible',
  fuente_declarada: '',
  screen_anchor: 'municipal_context',
}

function queryInRender(ui: ReactNode) {
  const { container } = render(ui)
  const root = container.querySelector('[data-testid="social-context-root"]')
  expect(root).toBeTruthy()
  return root as HTMLElement
}

describe('SocialDemographicContextPanel · PR1 andamiaje', () => {
  it('renderiza raíz y declara geo_scope / dato', () => {
    const root = queryInRender(
      <SocialDemographicContextPanel block={baseBlock} moduleAnchor="municipal_context" />,
    )
    expect(
      root.querySelector('[data-testid="social-context-geo-scope"]')?.getAttribute('data-geo-scope'),
    ).toBe('municipio_cve')
    expect(
      root.querySelector('[data-testid="social-context-dato-estado"]')?.getAttribute('data-dato'),
    ).toBe('no_disponible')
  })

  it('muestra estado vacío cuando no hay dato ni fuente', () => {
    const root = queryInRender(
      <SocialDemographicContextPanel block={baseBlock} moduleAnchor="municipal_context" />,
    )
    expect(root.querySelector('[data-testid="social-context-empty"]')).toBeTruthy()
  })

  it('muestra disclaimer de Auditoría y cuerpo literal exportado', () => {
    const root = queryInRender(
      <SocialDemographicContextPanel block={baseBlock} moduleAnchor="municipal_context" />,
    )
    const disc = root.querySelector('[data-testid="social-context-disclaimer"]')
    expect(disc).toBeTruthy()
    expect(disc?.textContent).toMatch(/Antes de KPIs/)
    const body = root.querySelector('[data-testid="social-context-disclaimer-body"]')
    expect(body?.textContent?.trim()).toBe(SOCIAL_DEMOGRAPHIC_UI_DISCLAIMER)
    expect(disc?.textContent).toMatch(/exclusivamente expositiva/)
    expect(disc?.textContent).toMatch(/Prohibido en copy/)
    expect(disc?.textContent).toMatch(/Permitido con calificadores/)
    expect(disc?.textContent).toMatch(/Checklist Legal/)
  })

  it('incluye marco de lectura INEGI/CONEVAL (disclosure oficial)', () => {
    const root = queryInRender(
      <SocialDemographicContextPanel block={baseBlock} moduleAnchor="municipal_context" />,
    )
    expect(root.querySelector('[data-testid="official-sources-reading-disclosure"]')).toBeTruthy()
    expect(root.textContent).toMatch(/Lectura de fuentes oficiales/)
    expect(root.textContent).toMatch(/INEGI, CONEVAL/)
    expect(root.textContent).toMatch(/Checklist de merge antes de exponer un número/)
    expect(root.textContent).toMatch(/certificación de cumplimiento normativo/)
    expect(root.textContent).toMatch(/KPI agregado o derivado/)
  })
})
