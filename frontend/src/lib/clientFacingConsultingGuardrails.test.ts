import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontend(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('client-facing consulting guardrails', () => {
  it('keeps /v, /p and /e on the restored modular PlatformPage', () => {
    const routes = [
      readFrontend('src/app/v/page.tsx'),
      readFrontend('src/app/p/page.tsx'),
      readFrontend('src/app/e/page.tsx'),
    ]

    for (const source of routes) {
      expect(source).toContain('PlatformPage')
      expect(source).not.toContain('StageWorkspace')
      expect(source).not.toContain('renderDecisionModule')
    }
  })

  it('does not expose internal agent names in consulting package components', () => {
    const files = [
      'src/lib/consultingPackageEngine.ts',
      'src/components/platform/ConsultingPackagePanel.tsx',
      'src/components/platform/ConsultingDiagrams.tsx',
    ]
    const forbidden = /\b(NOUS|HERMES|ARCHIVO|AGORA|KRONOS|POLIS|AUDITOR|MARCOS|KOSMOS|EIDOS|agente|agentes)\b/i

    for (const file of files) {
      expect(readFrontend(file), file).not.toMatch(forbidden)
    }
  })

  it('routes public and onboarding surfaces to the consulting package instead of legacy simulator', () => {
    const gobiernoRsu = readFrontend('src/app/gobierno/rsu/page.tsx')
    const acceso = readFrontend('src/app/acceso/AccesoForm.tsx')
    const onboarding = readFrontend('src/components/onboarding/ClientOnboardingGate.tsx')
    const gatewayHint = readFrontend('src/components/simulator/SimulatorGatewayHint.tsx')
    const aprende = readFrontend('src/app/aprende/page.tsx')
    const caStudio = readFrontend('src/app/ca-studio/page.tsx')
    const informe = readFrontend('src/app/informe/[municipio_id]/page.tsx')

    expect(gobiernoRsu).toContain("const target = tenantId ? `/v?tenant_id=${encodeURIComponent(tenantId)}` : '/v'")
    expect(gobiernoRsu).not.toContain("router.replace('/simulator')")
    expect(acceso).toContain("searchParams.get('next') ?? '/v'")
    expect(onboarding).toContain('Continuar al paquete consultivo')
    expect(onboarding).toContain('Zona de análisis')
    expect(gatewayHint).toContain('href="/v"')
    expect(aprende).toContain('Desde la guía al paquete consultivo')
    expect(caStudio).toContain('Laboratorio técnico interno')
    expect(informe).toContain("router.push('/v')")
    expect(informe).toContain('laboratorio interno')
  })

  it('keeps login and account creation redirects on the consulting package path', () => {
    const login = readFrontend('src/app/login/page.tsx')
    const signIn = readFrontend('src/app/sign-in/page.tsx')
    const signUp = readFrontend('src/app/sign-up/page.tsx')

    expect(login).toContain('sanitizeAuthRedirectPath(params.next)')
    expect(login).toContain('redirect(`/sign-in${next}`)')
    expect(signIn).toContain('fallbackRedirectUrl="/v"')
    expect(signIn).not.toContain('forceRedirectUrl="/v"')
    expect(signUp).toContain('fallbackRedirectUrl="/v"')
    expect(signUp).not.toContain('forceRedirectUrl="/v"')
  })

  it('keeps client copy away from demo simulator positioning', () => {
    const hub = readFrontend('src/app/hub/page.tsx')
    const gobierno = readFrontend('src/app/gobierno/page.tsx')
    const faq = readFrontend('src/components/aprende/FAQSection.tsx')
    const walkthrough = readFrontend('src/components/landing/WalkthroughArticle.tsx')
    const catalog = readFrontend('src/lib/onboardingCatalog.ts')
    const landfill = readFrontend('src/components/aprende/ContadorRelleno.tsx')

    expect(hub).toContain('Paquete de consultoría RSU')
    expect(hub).toContain('ZIP índice de referencia')
    expect(hub).toContain('Referencia A')
    expect(hub).toContain('Referencia B')
    expect(hub).toContain('Referencia C')
    expect(hub).not.toContain('ZIP demo capítulo')
    expect(hub).not.toContain('{m}')
    expect(hub).not.toContain('AGORA_EXPORT_COVER_DISCLAIMER')
    expect(gobierno).toContain('Agenda una sesión de diagnóstico')
    expect(gobierno).not.toContain('Agenda una demo')
    expect(faq).toContain('se muestra una brecha crítica')
    expect(faq).not.toContain('TIRs de 109%')
    expect(walkthrough).toContain('fuente, fecha, metodo, alcance y confianza')
    expect(walkthrough).toContain('De evidencia municipal a paquete consultivo defendible')
    expect(walkthrough).not.toContain('CIUDADES')
    expect(walkthrough).not.toContain('CiudadSelector')
    expect(walkthrough).not.toContain('San Luis Potos')
    expect(walkthrough).not.toContain('medición directa en SLP')
    expect(walkthrough).not.toContain('PRECIO')
    expect(catalog).toContain('Escenarios financieros')
    expect(catalog).not.toContain('Simulador económico')
    expect(landfill).toContain('No se debe convertir una cifra nacional en verdad municipal')
    expect(landfill).not.toContain('RSU_DIA_MX')
    expect(landfill).not.toContain('precio promedio de commodities')
    expect(landfill).not.toContain('SLP')
  })

  it('does not show another municipality template as a usable regulation draft', () => {
    const modal = readFrontend('src/components/reglamento/ReglamentoModal.tsx')

    expect(modal).toContain('Adendo local pendiente')
    expect(modal).toContain('La plataforma conserva la brecha')
    expect(modal).not.toContain('Borrador redactado para San Luis Potos')
    expect(modal).not.toContain('base SLP')
    expect(modal).not.toContain('adendo?.adendoPropuesto')
  })

  it('keeps the legacy simulator quarantined away from client users', () => {
    const source = readFrontend('src/app/simulator/page.tsx')

    expect(source).toContain("router.replace(`/v?tenant_id=${encodeURIComponent(tenantId)}`)")
    expect(source).toContain('Redirigiendo al paquete consultivo.')
    expect(source).toContain('isPlatformDeveloper()')
  })

  it('keeps required consulting diagrams in the modular package', () => {
    const panel = readFrontend('src/components/platform/ConsultingPackagePanel.tsx')
    const diagrams = readFrontend('src/components/platform/ConsultingDiagrams.tsx')

    expect(panel).toContain('ConsultingDiagramSuite')
    expect(diagrams).toContain('Flujo 100% RSU')
    expect(diagrams).toContain('Mapa de captura privada')
    expect(diagrams).toContain('Cascada de escenarios')
    expect(diagrams).toContain('Matriz riesgo-impacto')
    expect(diagrams).toContain('Evidencia por claim')
    expect(diagrams).toContain('Hoja de ruta por fases')
    expect(diagrams).toContain('Las cifras bloqueadas no se sustituyen')
  })
})
