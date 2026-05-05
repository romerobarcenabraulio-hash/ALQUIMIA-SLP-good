import type { HubDocumentoCapitulo, ZmHubKey } from '@/data/hubDocumentosCapitulo'
import { HUB_DOCUMENTOS_CAPITULO } from '@/data/hubDocumentosCapitulo'
import type { ReglamentoFuente } from '@/data/reglamentos'
import { reglamentoFuentePorMunicipio, REGLAMENTOS_FUENTE } from '@/data/reglamentos'

/** Tabla Markdown: índice del paquete + supuestos (Blueprint 26.B). */
export function readmePaqueteMarkdown(
  zm: ZmHubKey,
  docs: HubDocumentoCapitulo[],
  fechaIso: string,
): string {
  const capitulo = zm
  let md = `# README_paquete — ALQUIMIA · programa documental (${capitulo})\n\n`
  md += `**Generado:** ${fechaIso}\n\n`
  md += `**Simulación:** los entregables no constituyen actos públicos hasta publicación institucional en los canales competentes.\n\n`
  md += `## Índice de documentos declarados\n\n`
  md += '| # | Estado | Formato | Documento | Versión | Descripción |\n'
  md += '|---|--------|-----------|-----------|---------|-------------|\n'
  docs.forEach((d, i) => {
    const est = d.estadoEntrega === 'disponible' ? 'Disponible en repo público' : 'En elaboración'
    md += `| ${i + 1} | ${est} | ${d.formato} | ${d.nombre.replace(/\|/g, '/')} | ${d.versionFecha} | ${d.descripcionLinea.replace(/\|/g, '/')} |\n`
  })
  md += `\n## Fuentes primarias · reglamentos (referencia rápida)\n\n`
  REGLAMENTOS_FUENTE.forEach(r => {
    md += `- **${r.municipio_id}** (${r.estado_verificacion}): ${r.nombre}`
    md += r.url_fuente ? ` — ${r.url_fuente}` : ' — *URL pendiente*'
    md += '\n'
  })
  md += `\n## Supuestos consolidados\n\n`
  md += `| Ítem | Valor |\n|------|-------|\n`
  md += `| ZM seleccionada | ${capitulo} |\n`
  md += `| Documentos en ZIP | sólo blobs bajo \\\`public/\\\` marcados disponibles y con fetch HTTP 200 |\n`
  md += `| Artefactos faltantes | listados como "En elaboración" en tabla superior |\n`
  md += `\n---\n*Fin README autogenerado.*\n`
  return md
}

function capituloZmKey(zm: string): ZmHubKey {
  const u = zm.toUpperCase()
  if (u === 'QRO') return 'QRO'
  if (u === 'MTY') return 'MTY'
  return 'SLP'
}

function registroCapituloReglamento(zm: ZmHubKey): ReglamentoFuente | undefined {
  if (zm === 'SLP') return reglamentoFuentePorMunicipio('slp')
  if (zm === 'QRO') return reglamentoFuentePorMunicipio('qro')
  if (zm === 'MTY') return reglamentoFuentePorMunicipio('mty')
  return undefined
}

export async function generarPaqueteZipHub(zm: string): Promise<Blob> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const key = capituloZmKey(zm)
  const docs = HUB_DOCUMENTOS_CAPITULO[key]
  const now = new Date().toISOString()
  zip.file('README_paquete.md', readmePaqueteMarkdown(key, docs, now))

  const fuenteZm = registroCapituloReglamento(key)
  if (fuenteZm?.url_fuente) {
    zip.file(
      'enlaces/reglamento_referencia_url.txt',
      `${fuenteZm.municipio_id}\t${fuenteZm.nombre}\t${fuenteZm.url_fuente}\n`,
    )
  }

  const base =
    typeof window !== 'undefined' ? window.location.origin : ''

  for (const doc of docs) {
    if (doc.estadoEntrega !== 'disponible' || !doc.publicRelPath) continue
    const url = `${base}/${doc.publicRelPath}`
    try {
      const res = await fetch(url, { cache: 'no-store' })
      if (!res.ok) continue
      const buf = await res.arrayBuffer()
      const name = doc.publicRelPath.split('/').pop() ?? doc.id
      zip.file(`documentos/${name}`, buf)
    } catch {
      /* omitir archivo si CORS/host distinto */
    }
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export function descargarBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
