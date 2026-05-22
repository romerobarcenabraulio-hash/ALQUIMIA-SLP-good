import type { MunicipalLegalSourceManifest } from '@/types'

/** True cuando hay PDF en plataforma y el municipio puede analizarse. */
export function pdfListoParaAnalisis(manifest: MunicipalLegalSourceManifest | null | undefined): boolean {
  return manifest?.ingest_status === 'descargado'
}

export const LEGAL_PDF_UPLOADED_EVENT = 'alquimia:legal-pdf-uploaded'

export function notifyLegalPdfUploaded(municipioId: string) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(
    new CustomEvent(LEGAL_PDF_UPLOADED_EVENT, { detail: { municipioId: municipioId.toLowerCase() } }),
  )
}
