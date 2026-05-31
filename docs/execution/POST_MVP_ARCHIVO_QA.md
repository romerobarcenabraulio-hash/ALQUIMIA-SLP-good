# Post-MVP Sprint 2 · ARCHIVO QA

Fecha: 2026-05-31

| Caso | Resultado esperado | Resultado real | Estado |
| --- | --- | --- | --- |
| Detectar “Reglamento de limpia” en texto | Crear mención documental clasificada | `detectDocumentMentions` devuelve `reglamento_limpia` | PASS |
| URL inválida | No aceptarla como fuente | `checkCitationUrl` devuelve `invalid_url` | PASS |
| URL 404 | Marcar inaccesible | Prueba mock devuelve `inaccessible` | PASS |
| Extraer artículos/montos/fechas | Extraer solo con cita literal | `extractStructuredFields` genera citas verificables | PASS |
| Digest 1 y 2 | Máximo 3 documentos | `calculateDigestDocCount(0)=3` | PASS |
| Digest 3 y 4 | Máximo 5 documentos | `calculateDigestDocCount(2)=5` | PASS |
| Digest posterior | Máximo 8 documentos | `calculateDigestDocCount(5)=8` | PASS |
| Inbound sin secreto | No operar silenciosamente | Endpoint bloquea con 503 | PASS |
| Inbound con payload interno | Registrar documento pendiente de revisión | Prueba unitaria procesa attachment PDF | PASS |
| Cita literal inexistente | Rechazar extracción validable | `validateLiteralCitation` exige substring exacto | PASS |
| PDF con texto básico | Extraer texto sin validar claims automáticamente | `extractTextFromFile` devuelve `native_pdf` | PASS |
| Imagen/escaneo | No inventar OCR; pedir transcripción manual | `processUploadedDocument` devuelve `requires_transcription_manual` | PASS |
| Digest semanal | Encolar sin enviar si no hay proveedor | `enqueueWeeklyDigest` crea outbox `preview_only` | PASS |
| LLM sin cita literal | Rechazar salida | `validateLlmExtraction` devuelve `rejected` | PASS |

## Riesgo residual

La QA no prueba MX/Postmark externo ni Vision API porque son servicios fuera del sandbox. El producto no falla por eso: bloquea o usa outbox local hasta que se configuren.
