/**
 * @vitest-environment jsdom
 */
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'

afterEach(cleanup)
import {
  OfficialStatCard,
  SOCIAL_STAT_MISMATCH_AUDITOR_COPY,
  SOCIAL_STAT_MISMATCH_NAVIGATOR_COPY,
} from '@/components/simulator/OfficialStatCard'
import type { OfficialStatSlice } from '@/types/socialOfficialStats'

const baseSlice: OfficialStatSlice = {
  indicatorId: 'pob_tot',
  label: 'Población total',
  value: 123456,
  unit: 'hab.',
  geoLevel: 'municipio',
  geoCode: '14039',
  geoLabel: 'Municipio ejemplo',
  vintageLabel: '2020',
  sourceId: 'CPV2020',
  sourceUrl: 'https://www.inegi.org.mx',
  caveat: 'Nota de prueba',
}

describe('OfficialStatCard', () => {
  it('renderiza valor, badges obligatorios y enlace cuando sourceUrl es HTTP válido', () => {
    render(
      <OfficialStatCard
        availability="disponible_ambito_solicitado"
        slice={baseSlice}
        requestedAmbitoLabel="Municipio CVE 14039"
      />,
    )
    expect(screen.getByTestId('social-context-official-stat-card')).toHaveAttribute(
      'data-availability',
      'disponible_ambito_solicitado',
    )
    expect(screen.getByText('Población total')).toBeTruthy()
    expect(screen.getByTestId('social-official-pre-numeric-disclaimer').textContent).toMatch(/no dictamen/)
    expect(document.body.textContent).toMatch(/123[\s,\u00A0\u202F]*456/)
    expect(screen.getByTestId('social-official-badge-source').textContent).toBe('CPV2020')
    expect(screen.getByTestId('social-official-badge-vintage').textContent).toBe('2020')
    expect(screen.getByTestId('social-official-badge-geo').textContent).toBe('Municipio ejemplo')
    expect(screen.getByTestId('social-official-source-link')).toHaveAttribute(
      'href',
      'https://www.inegi.org.mx',
    )
    expect(screen.queryByTestId('social-context-official-stat-mismatch')).toBeNull()
    const fmtLine = screen.getByTestId('social-official-reading-format-line')
    expect(fmtLine.textContent).toContain('Población total')
    expect(fmtLine.textContent).toContain('CPV2020')
    expect(fmtLine.textContent).toContain('Municipio ejemplo')
    expect(fmtLine.textContent).toContain('2020')
    expect(fmtLine.textContent).toContain('Nota de prueba')
    expect(screen.getByTestId('social-official-numeric-footer').textContent).toMatch(/Unidad:/)
    expect(screen.getByTestId('social-official-numeric-footer').textContent).toMatch(/no dictamen/)
    expect(screen.getByText('Errores típicos de redacción (veto)')).toBeTruthy()
  })

  it('mismatch geo: disponible_otro_ambito muestra advertencias Auditor + Navigator sin ocultar etiquetas', () => {
    const entSlice: OfficialStatSlice = {
      ...baseSlice,
      geoLevel: 'entidad_federativa',
      geoCode: '14',
      geoLabel: 'Jalisco',
    }
    render(
      <OfficialStatCard
        availability="disponible_otro_ambito"
        slice={entSlice}
        requestedAmbitoLabel="Municipio CVE 14039"
      />,
    )
    const card = screen.getByTestId('social-context-official-stat-card')
    const m = within(card).getByTestId('social-context-official-stat-mismatch')
    expect(m.textContent).toContain('disponible_otro_ambito')
    expect(m.textContent).toContain(SOCIAL_STAT_MISMATCH_AUDITOR_COPY)
    expect(m.textContent).toContain(SOCIAL_STAT_MISMATCH_NAVIGATOR_COPY)
    expect(within(card).getByTestId('social-official-badge-geo').textContent).toBe('Jalisco')
  })

  it('sin dato: no_disponible o slice null renderiza tarjeta vacía', () => {
    const { rerender } = render(
      <OfficialStatCard
        availability="no_disponible"
        slice={null}
        requestedAmbitoLabel="Municipio CVE 99999"
      />,
    )
    const empty = screen.getByTestId('social-context-official-stat-empty')
    expect(empty).toHaveAttribute('data-availability', 'no_disponible')
    expect(empty.textContent).toMatch(/Sin dato oficial/)
    expect(empty.textContent).toMatch(/99999/)

    rerender(
      <OfficialStatCard
        availability="disponible_ambito_solicitado"
        slice={null}
        requestedAmbitoLabel="X"
      />,
    )
    expect(screen.getByTestId('social-context-official-stat-empty')).toBeTruthy()
  })
})
