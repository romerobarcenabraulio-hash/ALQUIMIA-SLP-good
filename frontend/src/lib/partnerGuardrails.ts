export type PartnerTier = 'embajador' | 'certified' | 'strategic'
export type PartnerStatus = 'pending' | 'active' | 'suspended' | 'terminated'

export interface PartnerRecord {
  id: string
  tier: PartnerTier
  status: PartnerStatus
  territory_exclusivity?: {
    estados?: string[]
    municipios?: string[]
  }
}

export interface PartnerLead {
  email: string
  municipio: string
  estado: string
  inegi_clave: string
}

export interface PartnerQualityInput {
  gates_g1_closed: number
  gates_g1_failed: number
  client_complaints_count: number
  contributions_to_knowledge_base: number
}

export function canActivatePartnerProgram(directContractsSigned: number) {
  return {
    allowed: directContractsSigned >= 3,
    required_direct_contracts: 3,
    current_direct_contracts: directContractsSigned,
    reason: directContractsSigned >= 3
      ? 'Programa elegible para revisión founder/legal antes de activación.'
      : 'No activar partners antes de 3 contratos directos firmados por founder.',
  }
}

export function assignLeadToPartner(lead: PartnerLead, partners: PartnerRecord[]) {
  const activePartners = partners.filter(partner => partner.status === 'active')
  const strategic = activePartners.find(partner =>
    partner.tier === 'strategic' &&
    partner.territory_exclusivity?.estados?.some(state => sameTerritory(state, lead.estado)),
  )
  if (strategic) return { assigned_to: 'partner' as const, partner_id: strategic.id, rule: 'strategic_state_exclusivity' }

  const certified = activePartners.find(partner =>
    partner.tier === 'certified' &&
    partner.territory_exclusivity?.municipios?.includes(lead.inegi_clave),
  )
  if (certified) return { assigned_to: 'partner' as const, partner_id: certified.id, rule: 'certified_municipality_exclusivity' }

  return { assigned_to: 'founder' as const, rule: 'no_exclusive_partner' }
}

export function partnerCanOwnTenant() {
  return {
    allowed: false,
    reason: 'Un partner actúa como consultor invitado; nunca es dueño del tenant ni cliente final.',
  }
}

export function computePartnerQualityScore(input: PartnerQualityInput) {
  const totalGates = input.gates_g1_closed + input.gates_g1_failed
  const gateScore = totalGates ? (input.gates_g1_closed / totalGates) * 100 : 0
  const complaintPenalty = Math.min(input.client_complaints_count * 15, 45)
  const contributionBonus = Math.min(input.contributions_to_knowledge_base * 2, 10)
  return Math.max(0, Math.min(100, Math.round(gateScore - complaintPenalty + contributionBonus)))
}

export function shouldSuspendPartner(score: number, consecutiveBadQuarters: number) {
  return {
    suspend: score < 80 && consecutiveBadQuarters >= 2,
    reason: score < 80 && consecutiveBadQuarters >= 2
      ? 'Métricas debajo de 80% durante 2 trimestres consecutivos.'
      : 'Mantener monitoreo y remediación documentada.',
  }
}

export function partnerActivationRedFlags() {
  return [
    'Menos de 3 contratos directos firmados.',
    'Partner intenta ser propietario del tenant.',
    'Exclusividad territorial sin revisión legal.',
    'Comisiones sin CFDI y contrato revisado.',
    'Asignación de lead sin regla explícita.',
    'Métricas de calidad debajo de 80% sin remediación.',
    'Partner pide acceso a Plataforma 0 administrativa completa sin rol aprobado.',
  ]
}

function sameTerritory(left: string, right: string) {
  return left.trim().toLowerCase() === right.trim().toLowerCase()
}
