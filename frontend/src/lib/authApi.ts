import { getApiUrl } from '@/lib/api'
import { withRequestId } from '@/lib/requestId'
import type { ClientSegment } from '@/lib/onboardingCatalog'

export interface RegisterPayload {
  email: string
  password: string
  nombre: string
  apellido_paterno: string
  apellido_materno?: string
  telefono: string
  cargo?: string
  dependencia?: string
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

export interface UserProfile {
  id: string
  nombre: string
  email: string
  rol: string
  zm: string
  client_segment?: string | null
  service_interest?: string | null
  municipio_id?: string | null
  municipio_nombre?: string | null
  estado_mx?: string | null
  reglamento_uploaded?: boolean
  onboarding_completed?: boolean
}

export interface OnboardingProfilePayload {
  setup_token: string
  client_segment: ClientSegment
  service_interest: string
  cargo?: string
  dependencia?: string
  organizacion?: string
  municipio_nombre?: string
  estado_mx?: string
  clave_inegi?: string
  municipio_id?: string
  zm?: string
}

export function persistSession(accessToken: string) {
  if (typeof window === 'undefined') return
  localStorage.setItem('alquimia_token', accessToken)
  document.cookie = `alquimia_session=1; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`
}

function authHeaders(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  const token = localStorage.getItem('alquimia_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function authRegister(payload: RegisterPayload) {
  const res = await fetch(`${getApiUrl()}/auth/register`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'No se pudo crear la cuenta')
  return data as { message: string; email: string; verification_url?: string }
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

export async function authOnboardingProfile(payload: OnboardingProfilePayload) {
  const res = await fetch(`${getApiUrl()}/auth/onboarding/profile`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'No se pudo guardar el perfil')
  return data as {
    message: string
    client_segment: string
    service_interest: string
    requires_reglamento_pdf: boolean
    municipio_id?: string
  }
}

export async function authSmsSend(setupToken: string) {
  const res = await fetch(`${getApiUrl()}/auth/sms/send`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setup_token: setupToken, purpose: 'onboarding' }),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'No se pudo enviar SMS')
  return data as { message: string; phone_masked: string }
}

export async function authSmsVerify(setupToken: string, smsCode: string) {
  const res = await fetch(`${getApiUrl()}/auth/sms/verify`, withRequestId({
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ setup_token: setupToken, sms_code: smsCode }),
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'Código SMS incorrecto')
  return data as {
    message: string
    phone_masked: string
    requires_reglamento_pdf: boolean
    next_path: string
  }
}

export async function authUploadReglamento(setupToken: string, file: File) {
  const form = new FormData()
  form.append('setup_token', setupToken)
  form.append('file', file)
  const res = await fetch(`${getApiUrl()}/auth/onboarding/upload-reglamento`, withRequestId({
    method: 'POST',
    body: form,
  }))
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail ?? 'No se pudo subir el PDF')
  return data as { ok: boolean; municipio_id: string; analysis_ready: boolean; message: string }
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

export async function authMe(): Promise<UserProfile | null> {
  const res = await fetch(`${getApiUrl()}/auth/me`, withRequestId({
    headers: { ...authHeaders() },
  }))
  if (!res.ok) return null
  return res.json() as Promise<UserProfile>
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
