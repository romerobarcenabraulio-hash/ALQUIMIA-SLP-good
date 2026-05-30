/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Watermark } from './Watermark'

describe('Watermark', () => {
  it('shows preliminary diagnostics as non-official work in progress', () => {
    render(<Watermark version={2} date="2026-05-30" status="preliminary_ready" validationPct={40} />)

    expect(screen.getByText(/ALQUIMIA · Diagnóstico en construcción · 40% validado · 2026-05-30 · V2/)).toBeTruthy()
  })

  it('does not render for official tenant states', () => {
    const { container } = render(<Watermark version={2} date="2026-05-30" status="official" validationPct={100} />)

    expect(container.textContent).toBe('')
  })
})
