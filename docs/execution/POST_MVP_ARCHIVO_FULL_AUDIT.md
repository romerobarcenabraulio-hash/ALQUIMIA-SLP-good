# Post-MVP Sprint 2 · ARCHIVO completo · Auditoría de alcance

Fecha: 2026-05-31

## Resultado por componente

| Componente | Evidencia | Estado |
| --- | --- | --- |
| Detector de menciones documentales por regex | `frontend/src/lib/archivoFull.ts`, `detectDocumentMentions` | PASS |
| Verificador de URL/cita por HEAD | `checkCitationUrl` con timeout y estados explícitos | PASS |
| Clasificador por filename | `classifyDocumentByFilename` | PASS |
| Validación de archivo | `validateArchiveFile`, whitelist y 25 MB | PASS |
| Routing por tenant en upload | Headers `x-tenant-id`; bloqueo cross-tenant | PASS |
| Inbound email Postmark | `/api/archivo/inbound` existe y valida secreto | PARTIAL |
| Extracción PDF/OCR | No implementada sin librería/servicio configurado | FAIL |
| Extracción XLSX nativa | No implementada como parser estructurado | FAIL |
| Extracción regex de campos | `extractStructuredFields` con citas literales | PASS |
| Asignación a módulo | `DOCUMENT_TYPE_MODULE` y clasificación | PASS |
| Digest semanal | `buildWeeklyDigest` preview determinístico; no envío automático | PARTIAL |
| Límites operacionales | Export preliminar limitado; LLM cost explícitamente cero | PARTIAL |
| LLM con cita literal | No activado sin prompt founder y proveedor | FAIL |
| Métricas operativas | `buildOperationalMetrics` | PASS |

## Correcciones aplicadas

- Se creó `frontend/src/lib/archivoFull.ts` con componentes determinísticos.
- Se agregó `/api/archivo/inbound` protegido por `POSTMARK_INBOUND_SECRET`.
- Se agregó `/api/archivo/digest` como preview interno de digest y métricas.
- Se agregaron pruebas unitarias de detección, URL, extracción regex, digest, métricas e inbound.

## Bloqueos no maquillados

- Postmark real no está configurado en este entorno. El endpoint responde 503 si falta `POSTMARK_INBOUND_SECRET`.
- OCR/PDF avanzado y Vision API no se implementaron porque requieren dependencias/servicios no configurados.
- Extracción LLM no se activa sin prompt aprobado por founder y sin proveedor configurado.
- No existe persistencia real de `document_extractions`; la capa actual sigue en memoria para MVP.

## Decisión

ARCHIVO completo no está listo para operación real. La base determinística quedó implementada y verificada, pero el cierre completo requiere servicios externos y decisión founder/legal.
