import { describe, expect, it } from 'vitest'
import {
  assignLeadToPartner,
  canActivatePartnerProgram,
  computePartnerQualityScore,
  partnerActivationRedFlags,
  partnerCanOwnTenant,
  shouldSuspendPartner,
} from './partnerGuardrails'

describe('partnerGuardrails', () => {
  it('blocks partner activation before 3 direct contracts', () => {
    expect(canActivatePartnerProgram(2)).toMatchObject({ allowed: false })
    expect(canActivatePartnerProgram(3)).toMatchObject({ allowed: true })
  })

  it('assigns leads by explicit exclusivity rules, otherwise founder', () => {
    const lead = { email: 'dir@gob.mx', municipio: 'Ciudad A', estado: 'Jalisco', inegi_clave: '14039' }

    expect(assignLeadToPartner(lead, [
      { id: 'p-strategic', tier: 'strategic', status: 'active', territory_exclusivity: { estados: ['Jalisco'] } },
    ])).toMatchObject({ assigned_to: 'partner', partner_id: 'p-strategic', rule: 'strategic_state_exclusivity' })

    expect(assignLeadToPartner(lead, [
      { id: 'p-certified', tier: 'certified', status: 'active', territory_exclusivity: { municipios: ['14039'] } },
    ])).toMatchObject({ assigned_to: 'partner', partner_id: 'p-certified', rule: 'certified_municipality_exclusivity' })

    expect(assignLeadToPartner(lead, [])).toMatchObject({ assigned_to: 'founder' })
  })

  it('prevents partners from owning tenants', () => {
    expect(partnerCanOwnTenant()).toMatchObject({ allowed: false })
  })

  it('suspends only after repeated quality failure', () => {
    const score = computePartnerQualityScore({
      gates_g1_closed: 6,
      gates_g1_failed: 4,
      client_complaints_count: 1,
      contributions_to_knowledge_base: 0,
    })

    expect(score).toBeLessThan(80)
    expect(shouldSuspendPartner(score, 1).suspend).toBe(false)
    expect(shouldSuspendPartner(score, 2).suspend).toBe(true)
  })

  it('documents red flags that block premature activation', () => {
    expect(partnerActivationRedFlags()).toContain('Menos de 3 contratos directos firmados.')
    expect(partnerActivationRedFlags()).toContain('Partner intenta ser propietario del tenant.')
  })
})
