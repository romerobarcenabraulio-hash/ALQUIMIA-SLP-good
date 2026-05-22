/** Extrae fuentes únicas del snapshot de datos del simulador. */
export function snapshotFuentesUsadas(
  snapshot: { kpis?: Array<{ provenance?: { fuente_nombre?: string } }> } | null | undefined,
): string[] {
  if (!snapshot?.kpis?.length) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of snapshot.kpis) {
    const name = k.provenance?.fuente_nombre?.trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      out.push(name)
    }
  }
  return out
}
