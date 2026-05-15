/**
 * PR30 · Q-023 — evidencia de conteo ZIP vs catálogo (sin E2E ZIP).
 *
 * Checklist manual para PR / Auditor Prompt 31:
 * - Abrir /hub (sin job), pestaña Documentos, variar ZM y leer bloque data-testid=hub-q023-zip-status.
 * - Descargar «Descargar paquete ZIP» y abrir README_paquete.md: fila «elegibles ZIP» coherente con test.
 * - Confirmar que no se marcó disponible ningún documento sin publicRelPath real bajo public/.
 */
import { describe, expect, it } from 'vitest'
import {
  HUB_DOCUMENTOS_CAPITULO,
  HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO,
  conteoDocumentosIncluiblesEnZip,
  documentosHubIncluiblesEnZip,
} from '@/data/hubDocumentosCapitulo'

describe('hubDocumentosCapitulo · Q-023 conteo ZIP', () => {
  it('objetivo Q-023 documentado es 7', () => {
    expect(HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO).toBe(7)
  })

  it('SLP: hoy 1 documento incluible (disponible + publicRelPath)', () => {
    const docs = HUB_DOCUMENTOS_CAPITULO.SLP
    const incl = documentosHubIncluiblesEnZip(docs)
    expect(incl).toHaveLength(1)
    expect(incl[0]?.id).toBe('slp-fuentes-provenance')
    expect(incl[0]?.publicRelPath).toBe('documentos_slp/fuentes_y_provenance_slp.md')
    expect(conteoDocumentosIncluiblesEnZip(docs)).toBe(1)
    expect(conteoDocumentosIncluiblesEnZip(docs)).toBeLessThan(HUB_Q023_DOCUMENTOS_LISTOS_OBJETIVO)
  })

  it('QRO y MTY: ningún incluible hasta completar public/', () => {
    expect(conteoDocumentosIncluiblesEnZip(HUB_DOCUMENTOS_CAPITULO.QRO)).toBe(0)
    expect(conteoDocumentosIncluiblesEnZip(HUB_DOCUMENTOS_CAPITULO.MTY)).toBe(0)
  })
})
