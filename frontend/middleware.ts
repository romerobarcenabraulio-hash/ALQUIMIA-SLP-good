import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/simulator', '/hub', '/ca-studio']
const COOKIE_NAME = 'alquimia_access'

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

  const cookie = request.cookies.get(COOKIE_NAME)
  if (cookie?.value === 'granted') {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  const acceso = request.nextUrl.clone()
  acceso.pathname = '/acceso'
  acceso.searchParams.set('next', pathname)
  const response = NextResponse.redirect(acceso)
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
