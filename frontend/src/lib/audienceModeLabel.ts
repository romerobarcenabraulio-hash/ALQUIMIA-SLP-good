import type { UserAudienceMode } from '@/types'

const LABELS: Record<UserAudienceMode, string> = {
  citizen: 'Ciudadanía',
  city_team: 'Equipo municipal',
  organization: 'Organización',
}

/** Etiqueta en español para UI; nunca exponer slugs internos (`city_team`, etc.). */
export function audienceModeLabel(mode: UserAudienceMode): string {
  return LABELS[mode] ?? 'Perfil'
}
