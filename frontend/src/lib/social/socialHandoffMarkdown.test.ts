import { describe, expect, it } from 'vitest'
import { buildSocialHandoffMarkdown } from '@/lib/social/socialHandoffMarkdown'
import type { SocialBacklogElementoMinimo } from '@/types/socialBacklogHandoff'

const sample: SocialBacklogElementoMinimo[] = [
  {
    titulo: 'Ejemplo',
    origen_capa: 'riesgo',
    severidad_interna: 'medio',
    responsable_propuesto_opcional: '',
    enlace_interno_anchor: 'module_id:x | testid:y',
  },
]

describe('buildSocialHandoffMarkdown', () => {
  it('incluye nota de recorte cuando la bitácora total supera las incluidas', () => {
    const md = buildSocialHandoffMarkdown(
      sample,
      {
        generado_iso: '2026-05-07T12:00:00.000Z',
        module_anchor: 'municipal_context',
        alcance_geo_declarado: 'Municipio (clave / CVE inequívoca)',
        catalog_simulation_epoch: 'v-test',
      },
      { bitacora: { total: 50, included: 20 } },
    )
    expect(md).toMatch(/50 entradas/)
    expect(md).toMatch(/últimas \*\*20\*\*/)
    expect(md).toMatch(/\| Ejemplo \| riesgo \| medio \|/)
  })

  it('omite nota de recorte cuando total igual a incluidas', () => {
    const md = buildSocialHandoffMarkdown(
      sample,
      {
        generado_iso: '2026-05-07T12:00:00.000Z',
        module_anchor: 'municipal_context',
        alcance_geo_declarado: 'Municipio (clave / CVE inequívoca)',
      },
      { bitacora: { total: 3, included: 3 } },
    )
    expect(md).not.toMatch(/sin volcado masivo/)
  })
})
