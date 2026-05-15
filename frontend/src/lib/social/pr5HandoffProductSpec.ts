/**
 * PR5 — Especificación de producto institucional (handoff capa social).
 * Referencia única para copy de UI y documentación embebida.
 */

/** Formato único de exportación en PR5 (reproducible, pegable en actas y tickets manuales). */
export const PR5_HANDOFF_EXPORT_FORMAT = 'Markdown' as const

/**
 * Flujo de usuario (12 líneas): pantalla → resumen → formato.
 * Mostrar en UI como referencia de producto; no es instructivo legal.
 */
export const PR5_SOCIAL_HANDOFF_UI_FLOW_LINES: readonly string[] = [
  '1. El usuario con rol municipio abre el simulador y entra al módulo «Contexto sociodemográfico y marco legal municipal» (portal funcionario).',
  '2. En el bloque «Capa social / demografía» revisa fichas de riesgo y, si aplica, la bitácora de supuestos.',
  '3. Desplaza hasta «Handoff de backlog (PR5)» al final de esa capa.',
  '4. Pulsa «Generar previsualización» para armar el snapshot actual (riesgos versionados + entradas de bitácora en memoria local).',
  '5. El panel muestra el Markdown en zona de solo lectura con encabezados y tabla acotada (no histórico ilimitado).',
  '6. Comprueba alcance territorial declarado en el mismo módulo antes de copiar.',
  '7. Pulsa «Copiar Markdown al portapapeles» para enviarlo a minuta, correo manual o herramienta externa (sin conector en PR5).',
  '8. Si el portapapeles falla, selecciona el texto manualmente desde la previsualización.',
  '9. No se ofrece PDF ni HTML como salida estándar en PR5; solo Markdown.',
  '10. Cada nueva generación sobrescribe la previsualización en pantalla; el archivo no se guarda en servidor ALQUIMIA.',
  '11. Los elementos de indicador o alerta geográfica aparecen solo si existen plantillas futuras; hoy pueden ir vacíos.',
  '12. El equipo valida el contenido copiado contra fuentes oficiales antes de uso en comunicación externa.',
]

/**
 * Regla UX: export masivo del historial completo de bitácora.
 * `no` — evita fugas de contexto, paquetes no revisables y uso indebido como «verdad» institucional.
 */
export const PR5_BULK_EXPORT_BITACORA_PERMITIDO = false as const

export const PR5_BULK_EXPORT_BITACORA_RAZON_UNA_LINEA =
  'No: un solo volcado ilimitado dificulta revisión por partes, mezcla contextos de sesión y no es acorde al alcance educativo y trazable de PR5.'
