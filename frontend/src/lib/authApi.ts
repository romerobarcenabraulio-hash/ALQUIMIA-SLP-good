import { getApiUrl } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'

export interface RegisterPayload {
  email: string
  password: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  telefono?: string
  cargo: string
  dependencia: string
  municipio_nombre?: string
  estado_mx?: string
  zm?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

export interface LoginPendingTotp {
  requires_totp: true
  pending_token: string
  message: string
}

export function persistSession(accessToken: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('alquimia_token', accessToken)
  document.cookie = `alquimia_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

export async function authRegister(payload: RegisterPayload) {
  const res = await fetch(`${getApiUrl()}/auth/register`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'No se pudo crear la cuenta')
  return data as { message: string; email: string }
}

export async function authVerifyEmail(token: string) {
  const res = await fetch(`${getApiUrl()}/auth/verify-email`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Enlace inválido o expirado')
  return data as { setup_token: string; email: string; message: string }
}

export async function authTotpSetup(setupToken: string) {
  const res = await fetch(`${getApiUrl()}/auth/totp/setup`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setup_token: setupToken }),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'No se pudo iniciar TOTP')
  return data as { otpauth_uri: string; secret_preview: string }
}

export async function authTotpActivate(setupToken: string, totpCode: string) {
  const res = await fetch(`${getApiUrl()}/auth/totp/activate`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setup_token: setupToken, totp_code: totpCode }),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Código TOTP incorrecto')
  return data as TokenResponse
}

export async function authLogin(email: string, password: string) {
  const res = await fetch(`${getApiUrl()}/auth/login`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Credenciales inválidas')
  return data as TokenResponse | LoginPendingTotp
}

export async function authLoginTotp(pendingToken: string, totpCode: string) {
  const res = await fetch(`${getApiUrl()}/auth/login/totp`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pending_token: pendingToken, totp_code: totpCode }),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Código TOTP incorrecto')
  return data as TokenResponse
}

export function isPendingTotp(data: unknown): data is LoginPendingTotp {
  return Boolean(data && typeof data === 'object' && (data as LoginPendingTotp).requires_totp === true)
}

const SETUP_KEY = 'alquimia_setup_token'

export function getSetupToken(): string | null {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(SETUP_KEY)
}

export function setSetupToken(token: string) {
  sessionStorage.setItem(SETUP_KEY, token)
}

export function clearSetupToken() {
  sessionStorage.removeItem(SETUP_KEY)
}
