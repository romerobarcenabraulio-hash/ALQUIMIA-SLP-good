const GENERIC_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'yahoo.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
])

const INSTITUTIONAL_SUFFIXES = [
  '.gob.mx',
  '.edu.mx',
  '.unam.mx',
  '.ipn.mx',
  '.uaslp.mx',
  '.uanl.mx',
  '.udg.mx',
  '.buap.mx',
]

const KNOWN_INSTITUTIONAL_DOMAINS = new Set([
  'slp.gob.mx',
  'sanluis.gob.mx',
  'sanluispotosi.gob.mx',
  'semarnat.gob.mx',
  'inegi.org.mx',
])

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split('@')[1] ?? ''
}

export function isInstitutionalDomain(email: string): boolean {
  const domain = emailDomain(email)
  if (!domain || GENERIC_DOMAINS.has(domain)) return false
  if (KNOWN_INSTITUTIONAL_DOMAINS.has(domain)) return true
  return INSTITUTIONAL_SUFFIXES.some(suffix => domain.endsWith(suffix))
}
