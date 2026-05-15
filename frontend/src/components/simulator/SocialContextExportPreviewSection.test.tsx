/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { SocialContextMarkdownPreview } from '@/components/simulator/SocialContextMarkdownPreview'
import { SocialContextExportPreviewSection } from '@/components/simulator/SocialContextExportPreviewSection'
import type { SociodemographicDisplayBlock } from '@/types/socialDemographicContext'
import { SIMULATOR_STATE_DEFAULT, useSimulatorStore } from '@/store/simulatorStore'
import { isSocialContextExportUiEnabled } from '@/lib/social/pr5ExportConstants'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  useSimulatorStore.setState(SIMULATOR_STATE_DEFAULT)
})

describe('PR5 Markdown preview seguro', () => {
  it('no deja scripts ejecutables ni javascript: en enlaces', () => {
    const malicious = '# T\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))'
    const { container } = render(<SocialContextMarkdownPreview markdown={malicious} />)
    expect(container.querySelector('script')).toBeNull()
    expect(container.querySelector('a[href^="javascript:"]')).toBeNull()
  })
})

describe('SocialContextExportPreviewSection', () => {
  const block: SociodemographicDisplayBlock = {
    geo_scope: 'municipio_cve',
    dato: 'no_disponible',
    fuente_declarada: '',
  }

  beforeEach(() => {
    useSimulatorStore.setState({ ...SIMULATOR_STATE_DEFAULT, municipiosActivos: ['slp'] })
  })

  it('copiar usa clipboard cuando está disponible', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })

    render(
      <SocialContextExportPreviewSection block={block} moduleAnchor="test" persistence="session" />,
    )
    fireEvent.click(screen.getByTestId('social-pr5-copy-md'))
    await vi.waitFor(() => {
      expect(writeText).toHaveBeenCalled()
    })
    const arg = writeText.mock.calls[0][0] as string
    expect(arg.length).toBeGreaterThan(100)
    expect(arg).toMatch(/Resumen contexto social/)
  })
})

describe('isSocialContextExportUiEnabled', () => {
  it('devuelve false si export oculto o modo ciudadano', () => {
    vi.stubEnv('NEXT_PUBLIC_SOCIAL_CONTEXT_EXPORT_HIDDEN', '1')
    expect(isSocialContextExportUiEnabled()).toBe(false)
    vi.unstubAllEnvs()
    vi.stubEnv('NEXT_PUBLIC_CITIZEN_UI', 'true')
    expect(isSocialContextExportUiEnabled()).toBe(false)
  })
})
