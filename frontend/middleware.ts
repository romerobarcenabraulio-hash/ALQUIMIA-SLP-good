import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/v', '/p', '/e', '/admin', '/simulator', '/hub', '/ca-studio', '/gobierno/rsu']
const LEGACY_COOKIE = 'alquimia_access'
const SESSION_COOKIE = 'alquimia_session'
const isProtectedRoute = createRouteMatcher(PROTECTED.map(route => `${route}(.*)`))

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { pathname } = request.nextUrl

  if (!isProtectedRoute(request)) {
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

  await auth.protect()
  const response = NextResponse.next()
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
})

export const config = {
  matcher: [
    '/v/:path*',
    '/p/:path*',
    '/e/:path*',
    '/admin/:path*',
    '/simulator/:path*',
    '/hub/:path*',
    '/ca-studio/:path*',
    '/gobierno/rsu/:path*',
  ],
}
