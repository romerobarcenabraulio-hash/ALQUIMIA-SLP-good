import { NextRequest, NextResponse } from 'next/server'
import { getTrendscapeBaseline } from '@/data/trendscapeBaseline'

export const dynamic = 'force-dynamic'

/**
 * GET /api/trendscape
 * Agrega tendencias para el módulo "Riesgos y tendencias".
 *
 * Configuración opcional (servidor):
 * - TRENDSCAPE_UPSTREAM_URL: URL base del proveedor (GET; se reenvían query params).
 * - TRENDSCAPE_API_KEY: enviada como Bearer si existe.
 *
 * Sin upstream o si falla: respuesta baseline curada ALQUIMIA (orientación consultiva).
 */
export async function GET(req: NextRequest) {
  const upstream = process.env.TRENDSCAPE_UPSTREAM_URL?.trim()
  const search = req.nextUrl.searchParams.toString()

  if (upstream) {
    try {
      const url = search ? `${upstream}${upstream.includes('?') ? '&' : '?'}${search}` : upstream
      const headers: HeadersInit = { Accept: 'application/json' }
      const key = process.env.TRENDSCAPE_API_KEY?.trim()
      if (key) headers.Authorization = `Bearer ${key}`

      const res = await fetch(url, { headers, cache: 'no-store' })
      if (res.ok) {
        const data = (await res.json()) as unknown
        return NextResponse.json({
          source: 'upstream',
          provenance: 'Proveedor externo configurado en TRENDSCAPE_UPSTREAM_URL',
          payload: data,
        })
      }
    } catch {
      // fallback below
    }
  }

  const baseline = getTrendscapeBaseline()
  return NextResponse.json(baseline, {
    headers: { 'X-Trendscape-Fallback': 'alquimia_baseline' },
  })
}
