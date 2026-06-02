import { currentUser } from '@clerk/nextjs/server'

export const TEMPORARY_ADMIN_EMAILS = new Set(['romero.barcena.braulio@gmail.com'])

export const MX_STATES = [
  ['01', 'Aguascalientes'], ['02', 'Baja California'], ['03', 'Baja California Sur'], ['04', 'Campeche'],
  ['05', 'Coahuila de Zaragoza'], ['06', 'Colima'], ['07', 'Chiapas'], ['08', 'Chihuahua'],
  ['09', 'Ciudad de México'], ['10', 'Durango'], ['11', 'Guanajuato'], ['12', 'Guerrero'],
  ['13', 'Hidalgo'], ['14', 'Jalisco'], ['15', 'México'], ['16', 'Michoacán de Ocampo'],
  ['17', 'Morelos'], ['18', 'Nayarit'], ['19', 'Nuevo León'], ['20', 'Oaxaca'],
  ['21', 'Puebla'], ['22', 'Querétaro'], ['23', 'Quintana Roo'], ['24', 'San Luis Potosí'],
  ['25', 'Sinaloa'], ['26', 'Sonora'], ['27', 'Tabasco'], ['28', 'Tamaulipas'],
  ['29', 'Tlaxcala'], ['30', 'Veracruz de Ignacio de la Llave'], ['31', 'Yucatán'], ['32', 'Zacatecas'],
] as const

export function isAdminMetadata(metadata: Record<string, unknown> | null | undefined) {
  return (
    metadata?.role === 'founder'
    || metadata?.role === 'admin'
    || metadata?.role === 'analista'
    || metadata?.has_admin_access === true
    || metadata?.bypass_payment_gates === true
  )
}

function normalizeEmail(email: string | null | undefined) {
  return email?.toLowerCase().trim() ?? ''
}

export async function canUseLocalAdminFallback() {
  return (await localAdminAuthContext()).allowed
}

export async function localAdminAuthContext() {
  const user = await currentUser().catch(() => null)
  const emails = user
    ? [
      user.primaryEmailAddress?.emailAddress,
      ...user.emailAddresses.map(email => email.emailAddress),
    ].map(normalizeEmail).filter(Boolean)
    : []
  const adminMetadataDetected = isAdminMetadata(user?.publicMetadata as Record<string, unknown> | undefined)
  const temporaryAdminDetected = emails.some(email => TEMPORARY_ADMIN_EMAILS.has(email))

  return {
    allowed: Boolean(user) && (temporaryAdminDetected || adminMetadataDetected),
    signed_in: Boolean(user),
    email_count: emails.length,
    primary_email_detected: Boolean(user?.primaryEmailAddress?.emailAddress),
    admin_metadata_detected: adminMetadataDetected,
    temporary_admin_detected: temporaryAdminDetected,
  }
}

export function stateIdFromName(state: string) {
  const normalized = state.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const found = MX_STATES.find(([, label]) => label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalized)
  return found?.[0] ?? ''
}
