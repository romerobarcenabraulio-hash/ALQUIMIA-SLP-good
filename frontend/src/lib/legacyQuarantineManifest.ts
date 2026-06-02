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
    policy: 'No borrar legacy mientras exista import activo desde /v, /p, /e, /admin o export. Primero cortar dependencias cliente-facing, luego eliminar por grafo de imports y pruebas.',
    items: [
      {
        file: 'frontend/src/store/simulatorStore.ts',
        usage: 'Store histórico del simulador; contiene defaults SLP, sliders y estado de laboratorio.',
        client_facing: false,
        replacement: 'CityConsultingContext + PlatformPage + motores determinísticos de consultoría.',
        deletion_risk: 'high',
        deletion_criteria: 'rg confirma cero imports fuera de /simulator y tests legacy explícitos; /v /p /e /admin pasan sin dependencia.',
      },
      {
        file: 'frontend/src/components/simulator/**',
        usage: 'Componentes antiguos de simulación y módulos visuales heredados.',
        client_facing: false,
        replacement: 'Componentes platform/* conectados a Evidence Kernel y PlatformPage.',
        deletion_risk: 'high',
        deletion_criteria: 'Ningún componente cliente importa /components/simulator; piezas útiles extraídas a lib pura.',
      },
      {
        file: 'frontend/src/app/simulator/**',
        usage: 'Ruta de laboratorio interno/founder para pruebas de motores y visualizaciones.',
        client_facing: false,
        replacement: 'Laboratorio founder aislado o motores puros sin UI cliente.',
        deletion_risk: 'medium',
        deletion_criteria: 'Existe reemplazo admin/founder y no hay journeys comerciales activos que dependan de la ruta.',
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
