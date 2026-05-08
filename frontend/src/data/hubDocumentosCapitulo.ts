/**
 * Inventario programa documental por ZM — Blueprint 26.B + checklist 17.1 + listado Hub SLP legacy.
 * `en_elaboracion`: visible en UI; ZIP incluye README y sólo ficheros con `publicRelPath` cuando existan.
 */

export type FormatoPaquete = 'PDF' | 'XLSX' | 'DOCX' | 'MD' | 'HTML'

export interface HubDocumentoCapitulo {
  id: string
  nombre: string
  descripcionLinea: string
  tipo: string
  formato: FormatoPaquete
  versionFecha: string
  estadoEntrega: 'disponible' | 'en_elaboracion'
  /** Ruta bajo `public/` (sin dominio). Incluida en ZIP si `estadoEntrega === 'disponible'` y fetch OK. */
  publicRelPath?: string
}

const SLP_17_1_ACCESO: HubDocumentoCapitulo[] = [
  {
    id: 'slp-marco-publicacion-acceso',
    nombre: 'Marco de publicación y control de acceso (Blueprint 17.1)',
    descripcionLinea:
      'Síntesis operativa DNS, Auth Supabase/JWT, registro de actividad y rutas protegidas según archivo ejecutado.',
    tipo: 'Gobernanza / Acceso',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-aviso-privacidad-actividad',
    nombre: 'Aviso de privacidad y registro de actividad (landing institucional)',
    descripcionLinea:
      'Copy de consultoría: qué datos se registran en acceso institucional, retención mínima y correlación sesión-fetch.',
    tipo: 'Legal / UX acceso',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-guia-dns-despliegue',
    nombre: 'Guía DNS y dominios (Vercel + api. Railway / Supabase)',
    descripcionLinea:
      'Tabla propuesta de registros A/CNAME/TLS para dominio institucional y subdominio de API.',
    tipo: 'Técnico / Infra',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-runbook-deploy',
    nombre: 'Runbook despliegue (Vercel, Railway, variables de entorno)',
    descripcionLinea:
      'Pasos reproducibles `.env.example`, pipelines y smoke post-deploy antes de exponer rutas `/hub` `/simulator`.',
    tipo: 'Técnico / CI-CD',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-auth-supabase-jwt',
    nombre: 'Supabase Auth y validación JWT en backend (control de acceso)',
    descripcionLinea:
      'Flujo email / magic link, claims mínimos y middleware FastAPI que rechaza rutas sensibles sin Bearer válido.',
    tipo: 'Gobernanza / Acceso',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-access-logs-correlation',
    nombre: 'Registro de actividad (`access_logs`) y correlación sesión-fetch',
    descripcionLinea:
      'Campos user_id, ip_hash, path, payload_hash; alineación con fetches del cliente según blueprint 17.1.',
    tipo: 'Gobernanza / Acceso',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-middleware-rutas-protegidas',
    nombre: 'Middleware frontend: rutas protegidas `/simulator`, `/ca-studio`, `/hub`',
    descripcionLinea:
      'Redirección a landing de acceso si no hay sesión Supabase verificada en cliente.',
    tipo: 'Técnico / Acceso',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-landing-institucional',
    nombre: 'Landing institucional (hero, CTAs demo vs cuenta, badges de oficialidad)',
    descripcionLinea:
      'Copy consultoría, aviso de trazabilidad y panel “qué se registra” según UX 17.1.',
    tipo: 'Legal / UX acceso',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-plantilla-env-example',
    nombre: 'Plantilla `.env.example` (Vercel, Railway, Supabase)',
    descripcionLinea:
      'Variables NEXT_PUBLIC_* y servidor documentadas sin secretos commitados.',
    tipo: 'Técnico / CI-CD',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
  {
    id: 'slp-monitoreo-health',
    nombre: 'Monitoreo mínimo: health checks Vercel/Railway y alertas básicas',
    descripcionLinea:
      'Smoke post-deploy, logs y umbrales mínimos alineados a criterios de aceptación 17.1.',
    tipo: 'Técnico / Operación',
    formato: 'MD',
    versionFecha: '2026-05-05',
    estadoEntrega: 'en_elaboracion',
  },
]

export const HUB_DOCUMENTOS_CAPITULO: Record<'SLP' | 'QRO' | 'MTY', HubDocumentoCapitulo[]> = {
  SLP: [
    {
      id: 'slp-reglamento-fuente-primaria',
      nombre: 'Reglamento municipal de limpia / RSU (fuente primaria · enlace)',
      descripcionLinea:
        'Enlace oficial o PDF en sitio municipal; ALQUIMIA no sustituye al instrumento publicado en POE/periódico oficial.',
      tipo: 'Marco Legal',
      formato: 'PDF',
      versionFecha: '2018-03-15',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-diagnostico-juridico',
      nombre: 'Diagnóstico jurídico municipal (reglamento vigente)',
      descripcionLinea:
        'Matriz de artículos, score y bloqueadores usados como insumo de simulación; requiere validación institucional.',
      tipo: 'Marco Legal',
      formato: 'PDF',
      versionFecha: '2025-01-15',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-iniciativa-reforma',
      nombre: 'Iniciativa de reforma reglamentaria',
      descripcionLinea: 'Anteproyecto articulado con brechas ALQUIMIA; no es acuerdo de cabildo.',
      tipo: 'Marco Legal',
      formato: 'DOCX',
      versionFecha: '2025-02-01',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-modelo-cfo',
      nombre: 'Modelo CFO · San Luis Potosí capital',
      descripcionLinea:
        'Modelo financiero con escenarios RSU valorización; marcado como simulación hasta cierre institucional.',
      tipo: 'Modelo financiero',
      formato: 'XLSX',
      versionFecha: '2025-01-10',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-simulacion-financiera-pdf',
      nombre: 'Simulación financiera ejecutiva (resumen CFO)',
      descripcionLinea: 'Versión ejecutiva uno-pager derivada del modelo (Blueprint 26.B).',
      tipo: 'Modelo financiero',
      formato: 'PDF',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-plan-implementacion',
      nombre: 'Plan de implementación operativa territorial',
      descripcionLinea: 'Espacio-tiempo, CA, logística y gates alineados a ZM SLP.',
      tipo: 'Operativo',
      formato: 'PDF',
      versionFecha: '2025-02-15',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-plan-circularidad-integral',
      nombre: 'Plan de circularidad integral (visión programa)',
      descripcionLinea: 'Síntesis programa metas RSU valorización para cabildo (26.B plan_circularidad).',
      tipo: 'Planeación',
      formato: 'PDF',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-benchmark-latam',
      nombre: 'Benchmark LATAM — parámetros SLP',
      descripcionLinea: 'Referencias comparativas no normativas; no son metas jurídicas.',
      tipo: 'Estudios',
      formato: 'PDF',
      versionFecha: '2025-01-20',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-fuentes-provenance',
      nombre: 'Fuentes, supuestos y trazabilidad de datos del paquete SLP',
      descripcionLinea:
        'Inventario de KPIs de referencia, advertencias Navigator y vínculos a fuentes primarias conocidas.',
      tipo: 'Trazabilidad',
      formato: 'MD',
      versionFecha: '2026-05-05',
      estadoEntrega: 'disponible',
      publicRelPath: 'documentos_slp/fuentes_y_provenance_slp.md',
    },
    ...SLP_17_1_ACCESO,
    {
      id: 'slp-carta-ciudadana',
      nombre: 'Carta ciudadana / guía breve programa de separación',
      descripcionLinea: 'Material de divulgación ciudadana alineado a tono consultoría (sin efectos legales).',
      tipo: 'Comunicación',
      formato: 'PDF',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'slp-presentacion-cabildo',
      nombre: 'Presentación para Cabildo (diapositivas)',
      descripcionLinea: 'Plantilla ejecutiva resultado simulador; revisión comunicación institucional.',
      tipo: 'Comunicación',
      formato: 'PDF',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
  ],
  QRO: [
    {
      id: 'qro-diagnostico',
      nombre: 'Diagnóstico jurídico Querétaro capital',
      descripcionLinea: 'Matrices y brechas en simulación; validar ante POE municipal.',
      tipo: 'Marco Legal',
      formato: 'PDF',
      versionFecha: '2025-03-20',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'qro-cfo',
      nombre: 'Modelo CFO · Querétaro',
      descripcionLinea: 'Simulación financiera; mismo disclaimer que hub legacy.',
      tipo: 'Modelo financiero',
      formato: 'XLSX',
      versionFecha: '2025-03-20',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'qro-plan-circularidad',
      nombre: 'Plan de circularidad ZM Querétaro (borrador)',
      descripcionLinea: 'Documento programa agregado; sin sustituir planes IMPLAN oficial.',
      tipo: 'Planeación',
      formato: 'PDF',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'qro-fuentes-provenance',
      nombre: 'Fuentes y trazabilidad (plantilla)',
      descripcionLinea: 'Plantilla pendiente de paquete QRO completo.',
      tipo: 'Trazabilidad',
      formato: 'MD',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
  ],
  MTY: [
    {
      id: 'mty-analisis-ageb',
      nombre: 'Análisis territorial AGEB Monterrey · contexto estadístico',
      descripcionLinea: 'Uso estadístico; no capa oficial Navigator sin checklist geo.',
      tipo: 'Estudios',
      formato: 'PDF',
      versionFecha: '2025-03-15',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'mty-diagnostico-juridico',
      nombre: 'Diagnóstico jurídico Monterrey SIMEPRODE (insumo simulador)',
      descripcionLinea: 'Matrices municipales Monterrey metro; efectos ejecutables por municipio.',
      tipo: 'Marco Legal',
      formato: 'PDF',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'mty-modelo-cfo',
      nombre: 'Modelo CFO · zona metropolitana Monterrey (agregado)',
      descripcionLinea: 'Simulación; desagregación por municipio obligatoria para actos públicos.',
      tipo: 'Modelo financiero',
      formato: 'XLSX',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
    {
      id: 'mty-fuentes-provenance',
      nombre: 'Fuentes y trazabilidad (plantilla MTY)',
      descripcionLinea: 'Plantilla de programa documental Monterrey.',
      tipo: 'Trazabilidad',
      formato: 'MD',
      versionFecha: '2026-05-05',
      estadoEntrega: 'en_elaboracion',
    },
  ],
}

export type ZmHubKey = keyof typeof HUB_DOCUMENTOS_CAPITULO

export function documentosHub(zm: string): HubDocumentoCapitulo[] {
  const k = zm.toUpperCase() as ZmHubKey
  return HUB_DOCUMENTOS_CAPITULO[k] ?? HUB_DOCUMENTOS_CAPITULO.SLP
}
