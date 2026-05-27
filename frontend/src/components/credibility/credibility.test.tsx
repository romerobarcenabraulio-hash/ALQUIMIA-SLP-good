/** @vitest-environment jsdom */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { InstitutionalBadge } from '@/components/credibility/InstitutionalBadge'
import { M18MaterialityBadge } from '@/components/credibility/M18MaterialityBadge'
import { ModuleStandardsBadge } from '@/components/credibility/ModuleStandardsBadge'
import { getMetricSourceTrace } from '@/data/metricStandardsTrace'
import { INSTITUTIONAL_BODIES } from '@/lib/standardsInstitutional'

describe('credibility UI', () => {
  it('InstitutionalBadge muestra GRI · ISO · PMI · CSRD', () => {
    render(<InstitutionalBadge />)
    const el = screen.getByTestId('institutional-badge')
    expect(el.textContent).toContain('GRI')
    expect(el.textContent).toContain('ISO')
    expect(el.textContent).toContain('PMI')
    expect(el.textContent).toContain('CSRD')
    expect(INSTITUTIONAL_BODIES.every(b => b.standardsCount > 0)).toBe(true)
  })

  it('ModuleStandardsBadge renderiza pills para M01', () => {
    render(<ModuleStandardsBadge moduleId="city_baseline" />)
    expect(screen.getByTestId('module-standards-badge')).toBeTruthy()
  })

  it('M18MaterialityBadge header y crossRef', () => {
    render(<M18MaterialityBadge variant="header" />)
    expect(screen.getByTestId('m18-materiality-badge').textContent).toMatch(/CSRD ESRS 1:2023/)
    render(<M18MaterialityBadge variant="crossRef" />)
    expect(screen.getByTestId('m18-materiality-crossref')).toBeTruthy()
  })

  it('traza co2e enlaza estándares desde mapa', () => {
    const trace = getMetricSourceTrace('co2e_anual')
    expect(trace?.matrixId).toBe('emisiones')
    expect(trace?.dependentModuleCodes).toEqual(['M04', 'M13', 'M15', 'M18'])
    expect(trace?.standardCodes.length).toBeGreaterThan(0)
    expect(trace?.standardCodes.some(c => c.includes('306'))).toBe(true)
  })
})
