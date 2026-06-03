export interface LegacyQuarantineManifestItem {
  file: string
  usage: string
  client_facing: boolean
  replacement: string
  deletion_risk: 'low' | 'medium' | 'high'
  deletion_criteria: string
}

export interface LegacyQuarantineManifest {
  generated_at: string
  policy: string
  items: LegacyQuarantineManifestItem[]
}

export function buildLegacyQuarantineManifest(): LegacyQuarantineManifest {
  return {
    generated_at: new Date().toISOString(),
    policy: 'No borrar legacy mientras exista import activo desde /v, /p, /e, /admin o export. El rescate actual reutiliza el renderer histórico detrás de PlatformPage; separar laboratorio, controles libres y copy de simulador, luego eliminar sólo lo que quede sin imports activos.',
    items: [
      {
        file: 'frontend/src/store/simulatorStore.ts',
        usage: 'Store histórico del simulador; contiene defaults SLP, sliders y estado de laboratorio.',
        client_facing: false,
        replacement: 'Motores determinísticos y estado por tenant; los datos cliente-facing deben entrar por Evidence Kernel y grupos de plataforma, no por sliders libres.',
        deletion_risk: 'high',
        deletion_criteria: 'rg confirma cero imports desde superficies cliente y los módulos rescatados ya no leen defaults, sliders ni SLP hardcoded para afirmar datos.',
      },
      {
        file: 'frontend/src/components/simulator/**',
        usage: 'Componentes heredados con mapas, encuesta, PDF/adendos, gráficas y módulos visuales rescatables.',
        client_facing: true,
        replacement: 'Renderer histórico detrás de PlatformPage, agrupado por /v /p /e y purificado con Evidence Kernel, citas y límites de uso.',
        deletion_risk: 'high',
        deletion_criteria: 'Eliminar sólo piezas sin import activo; conservar mapas, encuesta, PDF/adendos, gráficas y stacks usados por renderDecisionModule hasta que existan equivalentes puros validados.',
      },
      {
        file: 'frontend/src/app/simulator/**',
        usage: 'Ruta de laboratorio interno/founder para pruebas de motores y visualizaciones.',
        client_facing: false,
        replacement: 'Laboratorio founder aislado; /v /p /e consumen renderDecisionModule sin exponer la ruta /simulator a cliente.',
        deletion_risk: 'medium',
        deletion_criteria: 'Existe vista admin/founder equivalente y /v /p /e ya no necesitan importar la página /simulator completa.',
      },
      {
        file: 'frontend/src/app/informe/[municipio_id]/page.tsx',
        usage: 'Informe imprimible heredado que antes consumía simulatorStore y mostraba cifras prospectivas como documento tipo reporte.',
        client_facing: false,
        replacement: 'Redirección al paquete consultivo /v con tenant_id; export defendible vive en Evidence Kernel y consulting package.',
        deletion_risk: 'low',
        deletion_criteria: 'Ruta ya no importa simulatorStore ni componentes simulator; guardrail clientFacingConsultingGuardrails lo protege.',
      },
      {
        file: 'frontend/src/app/proyecto/[municipio_id]/page.tsx',
        usage: 'Portal de proyecto vivo heredado que antes montaba ProyectoVivoPortal desde components/simulator.',
        client_facing: false,
        replacement: 'Redirección a /e con tenant_id para monitoreo institucional por etapa.',
        deletion_risk: 'low',
        deletion_criteria: 'Ruta ya no importa ProyectoVivoPortal ni components/simulator; guardrail clientFacingConsultingGuardrails lo protege.',
      },
      {
        file: 'backend/app/routers/simulate.py',
        usage: 'Endpoint histórico de simulación.',
        client_facing: false,
        replacement: 'Pipeline de consulting package, escenarios cerrados y registros de evidencia.',
        deletion_risk: 'medium',
        deletion_criteria: 'No hay consumidores frontend ni tests de MVP que lo requieran.',
      },
      {
        file: 'fixtures y seeds con SLP/demo',
        usage: 'Datos semilla útiles para pruebas, pero peligrosos si aparecen como ciudad real cliente-facing.',
        client_facing: false,
        replacement: 'Índice homogéneo por ciudad y contexto automático con brechas explícitas.',
        deletion_risk: 'medium',
        deletion_criteria: 'Toda pantalla cliente distingue sandbox, fuente, método, alcance y confianza.',
      },
    ],
  }
}
