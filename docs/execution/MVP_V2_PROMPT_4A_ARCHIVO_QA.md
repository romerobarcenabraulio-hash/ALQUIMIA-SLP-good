# MVP V2 PROMPT 4A · ARCHIVO QA

Fecha: 2026-05-30.

## Gate previo

Prompt 3 V2 cerró con `PROMPT 3 V2: PASS`.

## QA multi-ciudad

| Perfil | Índice común | Gaps visibles | Municipio/ZM separados | Estado |
|---|---|---|---|---|
| Municipio con documentos suficientes (`complete-city`) | 6 documentos estándar | Acuerdo de Cabildo pendiente | Alcance territorial por métrica: municipio | PASS |
| Municipio con documentos parciales (`partial-city`) | 6 documentos estándar | Reglamento, presupuesto, rutas y cuarteo | Métricas declaran alcance territorial | PASS |
| Municipio con brechas críticas (`gap-city`) | 6 documentos estándar | PMD, reglamento, organigrama, presupuesto, cuenta pública, cuarteo, censo social e infraestructura | Métricas declaran alcance territorial | PASS |

## Casos obligatorios

| Caso | Evidencia | Estado |
|---|---|---|
| Diagnóstico inicial registra gaps documentales | `requiredDocumentGapsForTenant()` crea gaps por tipo mínimo y M-code | PASS |
| Tipos mínimos mapean a módulos solicitados | `reglamento_limpia→M03B`, `plan_desarrollo→M00B`, `presupuesto/cuenta→M09`, `organigrama→M07`, `acuerdo→M15`, estudios de campo a M01/M08/M02/M06 | PASS |
| Banner de documento pendiente aparece | `DocumentGapBanner` muestra el texto requerido y resuelve alias M-code → módulo canónico del registry | PASS |
| Upload mínimo funciona | `/api/tenants/[id]/documents/upload` acepta PDF/DOCX/XLSX/JPG/PNG y registra `received` | PASS |
| Upload rechaza archivo inválido | `validateArchiveFile()` bloquea MIME no permitido y >25 MB | PASS |
| “No aplica” funciona | `/api/tenants/[id]/document-gaps/[gapId]/not-applicable` conserva gap y marca `not_applicable` | PASS |
| Documento queda asociado al tenant correcto | `tenant_id` queda en `tenant_documents`; header `x-tenant-id` bloquea mismatch | PASS |
| Cross-tenant bloqueado | Smoke HTTP con header distinto devolvió 403 | PASS |
| Estado documental visible | UI y ZIP muestran pendiente/recibido/no aplica | PASS |
| Marca de agua preliminar visible | `Watermark` muestra `ALQUIMIA · Diagnóstico en construcción · [porcentaje]% validado · [fecha]` y desaparece en `official` | PASS |
| No hay nombres internos cliente-facing | `rg` sin coincidencias en componentes/rutas cliente-facing tocadas | PASS |

## Limitación MVP

El storage MVP usa `mvp-memory://...` como almacenamiento temporal en memoria de proceso. No se presenta como storage productivo. La extracción avanzada, OCR, inbound email, digest y LLM quedan fuera de alcance.

## Decisión QA

Prompt 4A queda apto: diagnóstico inicial, brechas documentales, banner, upload, no aplica, estado visible y watermark están implementados con trazabilidad y sin validación automática.
