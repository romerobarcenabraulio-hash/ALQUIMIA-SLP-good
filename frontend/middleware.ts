import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/simulator', '/hub', '/ca-studio']
const COOKIE_NAME = 'alquimia_access'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED.some(
    route => pathname === route || pathname.startsWith(route + '/'),
  )
  if (!isProtected) return NextResponse.next()

  const cookie = request.cookies.get(COOKIE_NAME)
  if (cookie?.value === 'granted') return NextResponse.next()

  const acceso = request.nextUrl.clone()
  acceso.pathname = '/acceso'
  acceso.searchParams.set('next', pathname)
  return NextResponse.redirect(acceso)
}

export const config = {
  matcher: ['/simulator/:path*', '/hub/:path*', '/ca-studio/:path*'],
}
