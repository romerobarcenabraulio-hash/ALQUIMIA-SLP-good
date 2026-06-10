import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes protected by Clerk (consulting platform)
const CLERK_PROTECTED = ['/v', '/p', '/e', '/ca-studio']
// Routes protected by custom JWT session cookie (municipal hub)
const SESSION_PROTECTED = ['/hub', '/simulator', '/gobierno/rsu', '/admin', '/api/admin']
const LEGACY_COOKIE = 'alquimia_access'
const SESSION_COOKIE = 'alquimia_session'
const ALLOW_LEGACY_AUTH_BYPASS = process.env.ALLOW_LEGACY_AUTH_BYPASS === '1'
const isClerkRoute = createRouteMatcher(CLERK_PROTECTED.map(route => `${route}(.*)`))
const isSessionRoute = createRouteMatcher(SESSION_PROTECTED.map(route => `${route}(.*)`))

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Hub/admin routes: protected by custom JWT session cookie, not Clerk
  if (isSessionRoute(request)) {
    const session = request.cookies.get(SESSION_COOKIE)
    const legacy = request.cookies.get(LEGACY_COOKIE)
    if (session?.value === '1' || legacy?.value === 'granted') {
      const response = NextResponse.next()
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
      return response
    }
    // No session cookie → redirect to custom sign-in
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // Consulting platform routes: protected by Clerk
  if (isClerkRoute(request)) {
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
  }

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
