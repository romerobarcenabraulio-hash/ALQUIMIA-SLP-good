import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED = ['/v', '/p', '/e', '/admin', '/api/admin', '/simulator', '/hub', '/ca-studio', '/gobierno/rsu']
const LEGACY_COOKIE = 'alquimia_access'
const SESSION_COOKIE = 'alquimia_session'
const ALLOW_LEGACY_AUTH_BYPASS = process.env.ALLOW_LEGACY_AUTH_BYPASS === '1'
const isProtectedRoute = createRouteMatcher(PROTECTED.map(route => `${route}(.*)`))

export default clerkMiddleware(async (auth, request: NextRequest) => {
  if (!isProtectedRoute(request)) {
    const response = NextResponse.next()
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  if (ALLOW_LEGACY_AUTH_BYPASS) {
    const session = request.cookies.get(SESSION_COOKIE)
    const legacy = request.cookies.get(LEGACY_COOKIE)
    if (session?.value === '1' || legacy?.value === 'granted') {
      const response = NextResponse.next()
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
      response.headers.set('X-Alquimia-Auth-Mode', 'legacy-cookie-bypass')
      return response
    }
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
    '/api/admin/:path*',
    '/simulator/:path*',
    '/hub/:path*',
    '/ca-studio/:path*',
    '/gobierno/rsu/:path*',
  ],
}
