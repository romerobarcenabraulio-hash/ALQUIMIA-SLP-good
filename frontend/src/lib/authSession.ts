/** Sesión local — rol para bypass de onboarding (equipo ALQUIMIA). */

export type AuthRole = 'admin' | 'analista' | 'cliente' | string

export function getTokenPayload(): { sub?: string; rol?: AuthRole } | null {
  if (typeof window === 'undefined') return null
  const token = localStorage.getItem('alquimia_token')
  if (!token) return null
  if (token === 'demo-token') return { sub: 'demo@alquimia.mx', rol: 'analista' }
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(atob(normalized)) as { sub?: string; rol?: AuthRole }
  }
  catch {
    return null
  }
}

/** Admin y analista ven el programa completo sin gate de cliente. */
export function isPlatformDeveloper(): boolean {
  const rol = getTokenPayload()?.rol
  return rol === 'admin' || rol === 'analista'
}
