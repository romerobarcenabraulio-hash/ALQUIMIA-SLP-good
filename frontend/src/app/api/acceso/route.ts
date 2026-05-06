import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'alquimia_access'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 días

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as Record<string, unknown>
  const code = typeof body.code === 'string' ? body.code.trim() : ''

  const expected = process.env.ACCESS_CODE ?? ''
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: 'ACCESS_CODE no configurado en el servidor.' },
      { status: 503 },
    )
  }

  if (!code || code !== expected) {
    return NextResponse.json({ ok: false, error: 'Código incorrecto.' }, { status: 401 })
  }

  const response = NextResponse.json({ ok: true })
  response.cookies.set(COOKIE_NAME, 'granted', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  })
  return response
}
