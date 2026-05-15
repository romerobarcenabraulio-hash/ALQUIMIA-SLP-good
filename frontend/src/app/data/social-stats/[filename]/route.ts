import { NextResponse } from 'next/server'
import {
  SOCIAL_STATS_BUNDLE_EMBEDDED,
  SOCIAL_STATS_BUILD_ID,
} from '@/data/socialStats/embeddedBundle'

/**
 * Expone el snapshot PR3 en la ruta estable consumida por `socialStatsBundleCache`
 * (`/data/social-stats/slices-<buildId>.json`). Misma carga que el embed TS para
 * evitar drift frente a `public/data/social-stats/*.json` en despliegues edge.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
): Promise<NextResponse> {
  const { filename } = await context.params
  const expected = `slices-${SOCIAL_STATS_BUILD_ID}.json`
  if (filename !== expected) {
    return new NextResponse(null, { status: 404 })
  }
  return NextResponse.json(SOCIAL_STATS_BUNDLE_EMBEDDED, {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
    },
  })
}
