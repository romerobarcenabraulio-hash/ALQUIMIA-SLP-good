import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  CONSULTING_API_LAYER_CONTRACTS,
  consultingApiContractForLayer,
  consultingApiContractsByLayer,
} from '@/lib/consultingApiLayerContracts'
import type { ConsultingInputLayer } from '@/lib/consultingInputRegistry'

const EXPECTED_LAYERS: ConsultingInputLayer[] = [
  'national',
  'data',
  'centros_acopio',
  'macros',
  'market',
  'legal',
  'operations',
  'standards',
  'documents',
]

describe('consultingApiLayerContracts', () => {
  it('covers every consulting input layer with existing platform capabilities', () => {
    const byLayer = consultingApiContractsByLayer()

    expect(Object.keys(byLayer).sort()).toEqual([...EXPECTED_LAYERS].sort())
    for (const layer of EXPECTED_LAYERS) {
      expect(byLayer[layer].endpoint).toMatch(/^\/(api\/v1|api\/tenants|national|data|macros|market|legal|operations)/)
      expect(byLayer[layer].requiredFor.length).toBeGreaterThan(0)
    }
  })

  it('does not create parallel API namespaces for the consulting package', () => {
    const forbiddenParallelNamespaces = [/\/consulting\//i, /\/rsu-consulting/i, /\/ai\//i]

    for (const contract of CONSULTING_API_LAYER_CONTRACTS) {
      for (const pattern of forbiddenParallelNamespaces) {
        expect(contract.endpoint).not.toMatch(pattern)
      }
    }
  })

  it('matches the mounted backend router prefixes for core source layers', () => {
    const backendMain = readFileSync(join(process.cwd(), '../backend/app/main.py'), 'utf8')

    expect(backendMain).toContain('prefix="/legal"')
    expect(backendMain).toContain('prefix="/market"')
    expect(backendMain).toContain('prefix="/macros"')
    expect(backendMain).toContain('prefix="/national"')
    expect(backendMain).toContain('prefix="/operations"')
    expect(backendMain).toContain('prefix="/api/v1/centros-acopio"')
    expect(backendMain).toContain('prefix="/api/v1/standards"')
  })

  it('keeps calculation inputs out of direct official client exposure', () => {
    const calculationInputs = CONSULTING_API_LAYER_CONTRACTS.filter(contract => contract.officiality === 'calculation_input')

    expect(calculationInputs.length).toBeGreaterThan(0)
    expect(calculationInputs.every(contract => contract.clientExposure !== 'internal_only')).toBe(true)
    expect(calculationInputs.every(contract => contract.clientExposure !== 'claim_ledger_only' || contract.layer === 'market')).toBe(true)
  })

  it('throws loudly when an unknown layer tries to bypass the contract', () => {
    expect(() => consultingApiContractForLayer('unknown' as ConsultingInputLayer)).toThrow(/sin contrato API/)
  })
})
