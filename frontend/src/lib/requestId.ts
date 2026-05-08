/**
 * Propaga X-Request-ID hacia el backend para correlación con logs estructurados.
 */
function newRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function withRequestId(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers ?? undefined)
  if (!headers.has('X-Request-ID')) headers.set('X-Request-ID', newRequestId())
  return { ...init, headers }
}
