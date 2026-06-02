import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function readFrontend(relativePath: string) {
  return readFileSync(join(process.cwd(), relativePath), 'utf8')
}

describe('client-facing consulting guardrails', () => {
  it('does not expose internal agent names in the consulting package surface', () => {
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

  it('keeps /v, /p and /e on the recognizable modular PlatformPage while StageWorkspace remains contract-only', () => {
    const routes = [
      readFrontend('src/app/v/page.tsx'),
      readFrontend('src/app/p/page.tsx'),
      readFrontend('src/app/e/page.tsx'),
    ]
    const workspace = readFrontend('src/components/platform/StageWorkspace.tsx')
    const platformPage = readFrontend('src/components/platform/PlatformPage.tsx')
    const shell = readFrontend('src/components/platform/ConsultingModuleShell.tsx')
    const specs = readFrontend('src/lib/validationModuleSpecs.ts')

    for (const source of routes) {
      expect(source).toContain('PlatformPage')
      expect(source).not.toContain('StageWorkspace')
      expect(source).not.toContain('renderDecisionModule')
      expect(source).not.toContain('simulatorStore')
    }
    expect(platformPage).toContain('PlatformModuleNav')
    expect(platformPage).toContain('PlatformModuleWorkspace')
    expect(platformPage).toContain('ConsultingModuleShell')
    expect(platformPage).toContain('Módulos de decisión')
    expect(platformPage).toContain('chapterGroups.map')
    expect(platformPage).not.toContain('chapter.rubros.map')
    expect(platformPage).not.toContain('<details')
    expect(platformPage).toContain('Sin controles libres de calibración para cliente')
    expect(platformPage).not.toContain('@/store/simulatorStore')
    expect(platformPage).not.toContain('@/components/simulator')
    expect(platformPage).not.toContain('@/app/simulator/renderDecisionModule')
    expect(platformPage).not.toContain('Este módulo no usa controles libres de simulador')
    expect(platformPage).toContain('tenantData.data && !sandboxDemo')
    expect(platformPage).toContain('activeModuleHasOperationalSpec')
    expect(platformPage).toContain('!activeModuleHasOperationalSpec && !sandboxDemo && <PillarModulePanel')
    expect(platformPage).toContain('activeModuleHasOperationalSpec || !activeModuleIsPillar')
    expect(platformPage).toContain('!sandboxDemo && <StageReadinessNotice')
    expect(workspace).not.toContain('@/store/simulatorStore')
    expect(workspace).not.toContain('@/components/simulator')
    expect(workspace).not.toContain('@/app/simulator/renderDecisionModule')
    expect(shell).toContain('DataPointDisplay')
    expect(shell).toContain('PendingDataPointDisplay')
    expect(shell).toContain('pendingDataPointLabels')
    expect(shell).toContain('subir documento, fuente pública o cálculo trazable antes de afirmar')
    expect(shell).toContain('EvidenceScopeBadge')
    expect(shell).toContain('ModuleOperationalVisualization')
    expect(shell).toContain('RsuSankeyPlaceholder')
    expect(shell).toContain('ScenarioBars')
    expect(shell).toContain('MatrixDiagram')
    expect(shell).toContain('ClaimEvidenceMatrix')
    expect(shell).toContain('ModuleDocumentUploadSection')
    expect(shell).toContain('SectionCitations')
    expect(shell).toContain('ModuleCompletionFooter')
    expect(shell).toContain('onNavigateModule')
    expect(shell).toContain('Siguiente módulo:')
    expect(shell).toContain('Continuar')
    expect(shell).toContain('Visualización operativa')
    expect(shell).toContain('Si faltan datos, la figura queda estructural')
    expect(shell).not.toContain('@/store/simulatorStore')
    expect(shell).not.toContain('@/components/simulator')
    expect(shell).not.toContain('@/app/simulator/renderDecisionModule')
    expect(specs).toContain('VALIDATION_MODULE_ORDER')
    expect(specs).toContain('Captura, costos y sensibilidad · M13')
    expect(specs).toContain('Flujo 100% RSU + Sankey')
    expect(specs).not.toContain('TIR · VPN · Monte Carlo')
  })

  it('shows planning and execution as human-gated stages instead of automatic decisions', () => {
    const source = readFrontend('src/components/platform/StageWorkspace.tsx')

    expect(source).toContain('planning')
    expect(source).toContain('execution')
    expect(source).toContain('Los pendientes condicionan alcance, confianza o cuantificación')
    expect(source).toContain('Nada estimado se muestra como oficial')
    expect(source).toContain('clientPreview')
  })

  it('routes gobierno RSU entry to the consulting package instead of the simulator', () => {
    const source = readFrontend('src/app/gobierno/rsu/page.tsx')

    expect(source).toContain('/v?tenant_id=')
    expect(source).toContain("const target = tenantId ? `/v?tenant_id=${encodeURIComponent(tenantId)}` : '/v'")
    expect(source).not.toContain("router.replace('/simulator')")
    expect(source).not.toContain('/v?tenant_id=municipio-demo')
    expect(source).toContain('paquete consultivo RSU')
  })

  it('exposes a tenant consulting package API contract for shared UI and exports', () => {
    const route = readFrontend('src/app/api/tenants/[id]/consulting-package/route.ts')
    const helper = readFrontend('src/lib/tenantConsultingPackageResponse.ts')
    const exportRoute = readFrontend('src/app/api/tenants/[id]/export-zip/route.ts')

    expect(route).toContain('buildTenantConsultingPackageResponse')
    expect(route).toContain('Acceso cross-tenant bloqueado')
    expect(helper).toContain('consulting_package')
    expect(helper).toContain('export_manifest')
    expect(helper).toContain('preliminary_not_official')
    expect(exportRoute).toContain('buildTenantConsultingPackageResponse')
    expect(exportRoute).toContain('consulting_package.json')
  })

  it('keeps hub copy oriented to consulting package instead of demo simulator language', () => {
    const source = readFrontend('src/app/hub/page.tsx')

    expect(source).toContain('Paquete de consultoría RSU')
    expect(source).toContain('ZIP índice de referencia')
    expect(source).toContain("searchParams.get('zm') ?? CITY_TABS_HUB[0]")
    expect(source).toContain('href="/v"')
    expect(source).not.toContain('municipio-demo')
    expect(source).not.toContain("?? 'SLP'")
    expect(source).not.toContain('ZIP demo capítulo')
    expect(source).not.toContain('Documentos del programa')
    expect(source).not.toContain('Paquete documental generado')
    expect(source).not.toContain('SimulatorGatewayHint')
    expect(source).not.toContain('AGORA_EXPORT_COVER_DISCLAIMER')
  })

  it('does not route client access or onboarding copy back to the legacy simulator', () => {
    const acceso = readFrontend('src/app/acceso/AccesoForm.tsx')
    const onboarding = readFrontend('src/components/onboarding/ClientOnboardingGate.tsx')
    const gatewayHint = readFrontend('src/components/platform/PlatformGatewayHint.tsx')
    const aprende = readFrontend('src/app/aprende/page.tsx')
    const caStudio = readFrontend('src/app/ca-studio/page.tsx')
    const informe = readFrontend('src/app/informe/[municipio_id]/page.tsx')

    expect(acceso).toContain("searchParams.get('next') ?? '/v'")
    expect(acceso).not.toContain('@/store/simulatorStore')
    expect(acceso).not.toContain("?? '/simulator'")
    expect(onboarding).toContain('Continuar al paquete consultivo')
    expect(onboarding).toContain('Clave INEGI municipal')
    expect(onboarding).toContain('Municipio y ZM se analizan por separado')
    expect(onboarding).toContain('El reglamento es el único bloqueo formal')
    expect(onboarding).toContain('evidencia investigada, calculada o provista por el cliente')
    expect(onboarding).not.toContain('Continuar al simulador')
    expect(onboarding).not.toContain('ZM simulador')
    expect(gatewayHint).toContain('href="/v"')
    expect(gatewayHint).toContain('Paquete consultivo')
    expect(gatewayHint).not.toContain('href="/simulator"')
    expect(aprende).toContain('Desde la guía al paquete consultivo')
    expect(aprende).not.toContain('Desde la guía al simulador')
    expect(caStudio).toContain('Laboratorio técnico interno')
    expect(caStudio).not.toContain('Módulo SimCity')
    expect(caStudio).not.toContain('Simulador 3D')
    expect(informe).toContain('router.replace(target)')
    expect(informe).toContain('/v?tenant_id=')
    expect(informe).not.toContain('@/store/simulatorStore')
    expect(informe).not.toContain('@/components/simulator')
    expect(informe).not.toContain("router.push('/simulator')")
    expect(informe).toContain("const target = municipioId ? `/v?tenant_id=${encodeURIComponent(municipioId)}` : '/v'")
    expect(informe).toContain('expediente consultivo vigente')
  })

  it('keeps legacy project and report routes redirected into the consulting stages', () => {
    const informe = readFrontend('src/app/informe/[municipio_id]/page.tsx')
    const proyecto = readFrontend('src/app/proyecto/[municipio_id]/page.tsx')

    expect(informe).toContain('/v?tenant_id=')
    expect(informe).not.toContain('@/store/simulatorStore')
    expect(informe).not.toContain('@/components/simulator')
    expect(proyecto).toContain('/e?tenant_id=')
    expect(proyecto).toContain('redirect(target)')
    expect(proyecto).not.toContain('@/store/simulatorStore')
    expect(proyecto).not.toContain('@/components/simulator')
    expect(proyecto).not.toContain('ProyectoVivoPortal')
  })

  it('does not expose direct simulator links from non-simulator client surfaces', () => {
    const header = readFrontend('src/components/layout/Header.tsx')
    const gobierno = readFrontend('src/app/gobierno/page.tsx')
    const monteCarlo = readFrontend('src/components/charts/MonteCarloVpnChart.tsx')
    const gauge = readFrontend('src/components/charts/GaugeCO2.tsx')

    expect(header).toContain('href="#propuestas-simulador"')
    expect(header).not.toContain('href="/simulator#propuestas-simulador"')
    expect(gobierno).toContain('Agenda una sesión de diagnóstico')
    expect(gobierno).toContain('Solicitud%20de%20diagnostico%20RSU')
    expect(gobierno).not.toContain('Agenda una demo')
    expect(gobierno).not.toContain('Solicitar demo')
    expect(monteCarlo).toContain('Completa la evidencia mínima')
    expect(monteCarlo).not.toContain('Configura el simulador')
    expect(gauge).not.toContain('SLP/QRO')
  })

  it('keeps account creation and login redirects on the consulting package path', () => {
    const login = readFrontend('src/app/login/page.tsx')
    const signIn = readFrontend('src/app/sign-in/page.tsx')
    const signUp = readFrontend('src/app/sign-up/page.tsx')
    const reglamentoOnboarding = readFrontend('src/app/onboarding/reglamento/page.tsx')

    expect(login).toContain('sanitizeAuthRedirectPath(params.next)')
    expect(login).toContain('redirect(`/sign-in${next}`)')
    expect(signIn).toContain('fallbackRedirectUrl="/v"')
    expect(signIn).not.toContain('forceRedirectUrl="/v"')
    expect(signUp).toContain('fallbackRedirectUrl="/v"')
    expect(signUp).not.toContain('forceRedirectUrl="/v"')
    expect(reglamentoOnboarding).toContain('disabled={!pdfReady || !setupToken}')
    expect(reglamentoOnboarding).toContain('Volver al perfil territorial')
    expect(reglamentoOnboarding).not.toContain('<Link href="/v"')
  })

  it('keeps client-facing copy aligned to the consulting system rather than simulator promises', () => {
    const acceso = readFrontend('src/app/acceso/AccesoForm.tsx')
    const gobierno = readFrontend('src/app/gobierno/page.tsx')
    const reglamentoIcon = readFrontend('src/components/reglamento/FuenteReglamentoIcon.tsx')
    const confidencePill = readFrontend('src/components/MetricConfidencePill.tsx')

    expect(acceso).toContain('escenarios cerrados')
    expect(acceso).not.toContain('Simulación de ingresos')
    expect(acceso).not.toContain('Generación de documentos para Cabildo con un clic')
    expect(gobierno).toContain('Escenarios financieros cerrados y trazables')
    expect(gobierno).not.toContain('Escenarios financieros TIR/VPN')
    expect(reglamentoIcon).toContain('Abrir reglamento de referencia para cotejo jurídico')
    expect(reglamentoIcon).not.toContain('se basa la simulación')
    expect(confidencePill).toContain("verified_official: 'Fuente oficial'")
    expect(confidencePill).not.toContain("verified_official: 'Verificado oficial'")
  })

  it('keeps onboarding service labels out of simulator positioning', () => {
    const catalog = readFrontend('src/lib/onboardingCatalog.ts')

    expect(catalog).toContain('Escenarios financieros')
    expect(catalog).toContain('supuestos trazables')
    expect(catalog).not.toContain('Simulador económico')
  })

  it('keeps public educational copy aligned to consulting package evidence rules', () => {
    const faq = readFrontend('src/components/aprende/FAQSection.tsx')
    const walkthrough = readFrontend('src/components/landing/WalkthroughArticle.tsx')
    const methodology = readFrontend('src/app/metodologia/page.tsx')

    expect(faq).toContain('se muestra una brecha crítica')
    expect(faq).toContain('no se rellena con benchmark')
    expect(faq).toContain('paquete consultivo calcula escenarios cerrados')
    expect(faq).not.toContain('El simulador ALQUIMIA')
    expect(faq).not.toContain('TIRs de 109%–212%')
    expect(walkthrough).toContain('fuente, fecha, método, alcance territorial, confianza y estado humano')
    expect(walkthrough).toContain('precios ponderados por escenario')
    expect(walkthrough).not.toContain('medición directa en SLP')
    expect(walkthrough).not.toContain('Simulador financiero')
    expect(walkthrough).not.toContain('tooltip dentro del simulador')
    expect(methodology).toContain('A · Datos investigados')
    expect(methodology).toContain('B · Datos calculados')
    expect(methodology).toContain('C · Datos del cliente')
    expect(methodology).toContain('formato Chicago')
    expect(methodology).toContain('Cero cifras sin cita')
    expect(methodology).toContain('No desbloquea un claim')
  })

  it('keeps the legacy simulator quarantined away from client users', () => {
    const source = readFrontend('src/app/simulator/page.tsx')

    expect(source).toContain("router.replace(`/v?tenant_id=${encodeURIComponent(tenantId)}`)")
    expect(source).toContain('Redirigiendo al paquete consultivo.')
    expect(source).toContain('isPlatformDeveloper()')
  })

  it('keeps a 1:1 consulting narrative with required diagram figures', () => {
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
