# Master Blockers Register

Fecha: 2026-05-31

## Bloqueos P0/P1 para MVP local/founder

| Bloqueo | Estado | Evidencia | Acción |
| --- | --- | --- | --- |
| Crear cuenta/login/demo local | Cerrado | `MVP_V2_FINAL_STATUS.md`, `MVP_V2_STABILIZATION_STATUS.md` | Mantener smoke antes de demos |
| Multi-ciudad e índice común | Cerrado | `MVP_V2_FINAL_MULTI_CITY_DOCUMENT_QA.md` | Mantener tres perfiles de prueba |
| ARCHIVO embebido MVP/full | Cerrado | `MVP_ARCHIVO_STATUS.md`, `POST_MVP_ARCHIVO_STATUS.md` | No activar OCR externo sin proveedor |
| Visual público usable | Cerrado | `POST_MVP_VISUAL_SYSTEM_STATUS.md` | Mantener QA visual antes de cambios públicos |
| Migración ARCHIVO | Cerrado | `POST_MVP_PRODUCTION_READINESS_DELTA.md` | Ejecutar Alembic en staging/prod cuando exista entorno |

## Bloqueos externos para producción real

| Bloqueo | Severidad | Responsable | Motivo | Estado |
| --- | --- | --- | --- | --- |
| Storage persistente de documentos | P1 producción | Founder/infra | Requiere proveedor, retención y configuración productiva | Abierto externo |
| Legal/compliance final | P1 producción | Founder/legal | Los documentos actuales son preparación, no asesoría legal final | Abierto externo |
| Billing/contracts | P2 comercial | Founder/legal | Requiere pricing, contrato y revisión legal | Abierto externo |
| Seed founder/admin productivo | P1 producción | Founder/infra | Requiere identidad, dominio y entorno real | Abierto externo |
| Email provider real | P1 producción | Founder/infra | Digest/inbound/envío externo requiere proveedor configurado | Abierto externo |

## Decisión

No hay bloqueos P0/P1 que impidan revisar o demo-operar el MVP local/founder. Producción externa sigue bloqueada por decisiones de proveedor, legal e infraestructura.
