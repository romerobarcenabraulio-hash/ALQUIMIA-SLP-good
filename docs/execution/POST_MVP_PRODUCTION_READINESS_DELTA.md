# Post-MVP · Delta de readiness de producción

Fecha: 2026-05-31

## Corrección aplicada

| Bloqueo | Estado previo | Corrección | Evidencia | Estado actual |
| --- | --- | --- | --- | --- |
| Migración Alembic para `document_gaps` | PARTIAL | Se creó `20260531_0015_document_archive_tables.py` | `.venv/bin/alembic heads` devuelve `0015_document_archive_tables (head)` | PASS |
| Migración Alembic para `tenant_documents` | PARTIAL | Se creó `20260531_0015_document_archive_tables.py` | `.venv/bin/alembic heads` devuelve `0015_document_archive_tables (head)` | PASS |

## Pruebas ejecutadas

| Comando | Resultado | Salida relevante |
| --- | --- | --- |
| `.venv/bin/alembic heads` desde `backend/` | PASS | `0015_document_archive_tables (head)` |
| `PYTHONPATH=backend backend/.venv/bin/python -m pytest backend/tests/test_admin_tenants.py backend/tests/test_phase27_nous_governance.py -q` | PASS | 11 pruebas pasaron |

## Bloqueos que siguen siendo externos

| Bloqueo | Motivo | Responsable |
| --- | --- | --- |
| Storage persistente de documentos | Requiere proveedor/storage productivo y política de retención | Founder/infra |
| Legal/compliance producción | Requiere abogado; los docs existentes son drafts/preparación | Founder/legal |
| Billing/contracts | Requiere pricing, contrato y revisión legal | Founder/legal |
| Seed founder/admin productivo | Requiere identidad/correo definitivo y entorno de deploy | Founder/infra |

## Decisión

El bloqueo de migración ARCHIVO queda corregido. No se declara producción externa lista porque storage, legal, billing y seed productivo dependen de decisiones externas.
