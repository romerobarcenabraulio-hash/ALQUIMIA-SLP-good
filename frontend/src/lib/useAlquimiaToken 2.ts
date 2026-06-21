'use client'

/**
 * Clerk → Backend JWT bridge.
 *
 * All /api/v1 endpoints require the backend JWT (`alquimia_token`).
 * Clerk handles identity; this hook exchanges the Clerk session token
 * for a backend JWT on first load and caches it in localStorage.
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { getApiUrl } from '@/lib/api'

const TOKEN_KEY = 'alquimia_token'

function tokenIsValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    // 60s margin so we don't use a token about to expire
    return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now() + 60_000
  } catch {
    return false
  }
}

export async function exchangeClerkForJwt(clerkToken: string): Promise<string> {
  const res = await fetch(`${getApiUrl()}/auth/clerk-exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clerk_token: clerkToken }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'No se pudo validar la sesión')
  localStorage.setItem(TOKEN_KEY, data.access_token)
  document.cookie = `alquimia_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
  return data.access_token
}

export function useAlquimiaToken(): { token: string | null; loading: boolean; error: string | null } {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return
    let cancelled = false

    const stored = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
    if (stored && tokenIsValid(stored)) {
      setToken(stored)
      setLoading(false)
      return
    }

    if (!isSignedIn) {
      // Not a Clerk session — keep legacy token if present (custom JWT login)
      setToken(stored ?? null)
      setLoading(false)
      return
    }

    ;(async () => {
      try {
        const clerkToken = await getToken()
        if (!clerkToken) throw new Error('Sesión de Clerk no disponible')
        const jwt = await exchangeClerkForJwt(clerkToken)
        if (!cancelled) setToken(jwt)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error de sesión')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [isLoaded, isSignedIn, getToken])

  return { token, loading, error }
}
