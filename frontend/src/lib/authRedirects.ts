const DEFAULT_AUTH_REDIRECT = '/v'

export function sanitizeAuthRedirectPath(next?: string | null): string {
  const value = next?.trim()
  if (!value || !value.startsWith('/') || value.startsWith('//')) return DEFAULT_AUTH_REDIRECT
  if (value.startsWith('/simulator')) return DEFAULT_AUTH_REDIRECT
  return value
}
