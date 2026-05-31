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
| Inbound email Postmark | `/api/archivo/inbound` procesa payloads cuando existe secreto y bloquea si no está configurado | PASS |
| Extracción PDF/OCR | PDF de texto usa extracción básica; imágenes/escaneos pasan a `requires_transcription_manual` sin inventar datos | PASS |
| Extracción XLSX nativa | XLSX se procesa desde XML interno con `JSZip` para texto básico | PASS |
| Extracción regex de campos | `extractStructuredFields` con citas literales | PASS |
| Asignación a módulo | `DOCUMENT_TYPE_MODULE` y clasificación | PASS |
| Digest semanal | `enqueueWeeklyDigest` crea outbox interno y marca `queued_for_provider` solo si hay proveedor configurado | PASS |
| Límites operacionales | Export preliminar limitado; LLM cost explícitamente cero; digest no envía sin proveedor | PASS |
| LLM con cita literal | `validateLlmExtraction` rechaza cualquier extracción LLM sin cita literal exacta | PASS |
| Métricas operativas | `buildOperationalMetrics` | PASS |

## Correcciones aplicadas

- Se creó `frontend/src/lib/archivoFull.ts` con componentes determinísticos.
- Se agregó `/api/archivo/inbound` protegido por `POSTMARK_INBOUND_SECRET`.
- Se agregó `/api/archivo/digest` como preview interno, outbox y métricas.
- Se agregó extracción básica PDF/DOCX/XLSX con `JSZip` y fallback manual para imágenes.
- Se agregó guardrail de extracción LLM con cita literal exacta.
- Se agregaron pruebas unitarias de detección, URL, extracción regex, digest, métricas e inbound.

## Bloqueos no maquillados

- Postmark externo/MX real no se puede verificar en este entorno local, pero el endpoint operativo procesa payloads protegidos por secreto.
- OCR avanzado no inventa datos: cuando el documento es imagen o escaneo no legible, queda como `requires_transcription_manual`.
- Extracción LLM no se ejecuta automáticamente; solo existe el gate que rechaza cualquier salida sin cita literal exacta.
- La persistencia de extracciones sigue en memoria de proceso para esta etapa; producción requiere base de datos.

## Decisión

ARCHIVO completo queda apto para continuar implementación controlada: opera localmente, procesa documentos básicos, bloquea validación automática y deja servicios externos como configuración de producción, no como error de producto.
