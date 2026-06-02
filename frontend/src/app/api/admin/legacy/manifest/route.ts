import { NextResponse } from 'next/server'
import { buildLegacyQuarantineManifest } from '@/lib/legacyQuarantineManifest'

export async function GET() {
  return NextResponse.json(buildLegacyQuarantineManifest())
}
