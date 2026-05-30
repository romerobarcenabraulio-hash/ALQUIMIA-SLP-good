# MVP ARCHIVO QA

Fecha: 2026-05-29.

## Alcance verificado

ARCHIVO entra al MVP como capacidad embebida de la plataforma. En superficies cliente-facing no se usa el nombre interno: la UI muestra brechas documentales, carga segura, estado recibido, pendiente de validación y opción no aplica.

| Caso | Resultado esperado | Evidencia | Estado |
|---|---|---|---|
| Módulo con gap muestra banner | Banner sobrio con “Documento pendiente para completar este módulo” | `DocumentGapBanner` filtra `document_gaps` por `module_id` activo | PASS |
| Upload acepta PDF válido | Documento queda `received` y pendiente de validación humana | `registerTenantDocument()` acepta `application/pdf`; test `documentArchiveStore` | PASS |
| Upload rechaza archivo no permitido | JS/otros tipos no entran | `validateArchiveFile()` whitelist PDF/DOCX/XLSX/JPG/PNG | PASS |
| Upload rechaza archivo demasiado grande | >25 MB bloqueado | `MAX_DOCUMENT_BYTES = 25MB`; test unitario | PASS |
| Documento queda asociado al tenant correcto | `tenant_id` se registra en `tenant_documents` | API `/api/tenants/[id]/documents/upload`; header `x-tenant-id` | PASS |
| Documento queda asociado al módulo correcto | Filename clasifica módulo/document_type | `classifyDocumentByFilename()` mapea reglamento, presupuesto, organigrama, PMD, cuenta y acuerdo | PASS |
| Usuario de otro tenant no puede ver/registrar documento | Cross-tenant bloqueado si header no coincide | APIs upload/no-aplica responden 403 ante mismatch | PASS |
| “No aplica” oculta request sin borrar trazabilidad | Gap cambia a `not_applicable` | API `/document-gaps/[gapId]/not-applicable`; test unitario | PASS |
| Paquete documental conserva mismo índice | Misma longitud para complete/partial/gap | `STANDARD_CITY_DOCUMENT_INDEX`; test unitario | PASS |
| ZIP/export muestra estado documental | Índice y documentos incluyen gaps/documentos recibidos | `/api/tenants/[id]/export-zip` agrega Estado documental y Documentos recibidos | PASS |
| No aparece “ARCHIVO” cliente-facing | UI usa “la plataforma”, “documento recibido”, “pendiente de validación” | Auditoría por `rg` en rutas/componentes cliente-facing | PASS |
| No aparece ningún nombre interno de agente cliente-facing | No hay NOUS/HERMES/AGORA/KRONOS/POLIS/AUDITOR/agente | Auditoría por `rg` en superficies tocadas | PASS |

## Smoke HTTP local

| Comando | Evidencia | Estado |
|---|---|---|
| `GET /api/tenants/partial-city/data` | HTTP 200; respuesta incluye `document_gaps`, `tenant_documents` y `documentary_status` | PASS |
| `HEAD /api/tenants/partial-city/export-zip` | HTTP 200; `content-type: application/zip` y límite preliminar visible | PASS |
| `POST /api/tenants/partial-city/documents/upload` con PDF | HTTP 200; documento `received`, módulo `marco_legal`, advertencia de revisión humana | PASS |
| `POST /document-gaps/.../not-applicable` | HTTP 200; gap pasa a `not_applicable` sin borrar trazabilidad | PASS |
| `POST` cross-tenant con header distinto | HTTP 403; `Acceso cross-tenant bloqueado` | PASS |

## Decisión QA

ARCHIVO MVP queda integrado como gestión documental mínima: detecta brechas, solicita documentos, registra recepción, permite no aplica y preserva trazabilidad sin validar automáticamente claims.
