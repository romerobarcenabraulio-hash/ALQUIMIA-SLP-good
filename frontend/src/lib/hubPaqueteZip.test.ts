import { describe, expect, it } from 'vitest'
import { HUB_DOCUMENTOS_CAPITULO, HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO } from '@/data/hubDocumentosCapitulo'
import { readmePaqueteMarkdown } from '@/lib/hubPaqueteZip'

describe('hubPaqueteZip · README Q-023', () => {
  it('README declara conteo elegibles y objetivo Q-023', () => {
    const md = readmePaqueteMarkdown('SLP', HUB_DOCUMENTOS_CAPITULO.SLP, '2026-05-15T00:00:00.000Z')
    expect(md).toContain('Q-023')
    expect(md).toContain(`≥${HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO}`)
    expect(md).toMatch(/Documentos con archivo en `public\/` elegibles ZIP \| 1 /)
  })
})
