import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/simulator', '/hub', '/ca-studio', '/gobierno/rsu']
const LEGACY_COOKIE = 'alquimia_access'
const SESSION_COOKIE = 'alquimia_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(
    route => pathname === route || pathname.startsWith(route + '/'),
  )
  if (!isProtected) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  const session = request.cookies.get(SESSION_COOKIE)
  const legacy = request.cookies.get(LEGACY_COOKIE)
  if (session?.value === '1' || legacy?.value === 'granted') {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  const login = request.nextUrl.clone()
  login.pathname = '/login'
  login.searchParams.set('next', pathname)
  const response = NextResponse.redirect(login)
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = {
  /** Excluir `/data/**` para servir JSON bajo `public/data/` sin pasar por el middleware (PR3 sociodemográfico). */
  matcher: ['/((?!_next/static|_next/image|favicon.ico|data/).*)'],
}
