# MVP V2 Data Migration Check

Fecha: 2026-05-31

No se ejecutaron migraciones destructivas. Se revisó estructura disponible y smoke local con SQLite.

| Migración/dato base | Estado | Comando/evidencia | Resultado | Bloqueo |
| --- | --- | --- | --- | --- |
| Auth user accounts | PASS | `backend/alembic/versions/20260523_0005_user_accounts.py` | Tablas de usuarios, tokens y access logs definidas | No |
| SMS onboarding | PASS | `20260523_0006_onboarding_sms.py` | Soporte de SMS onboarding existe | No |
| Usuario municipio/reglamento | PASS | `20260523_0007_user_municipio_reglamento.py` | Perfil municipal y reglamento en onboarding | No |
| Tenants/admin Plataforma 0 MVP | PASS | `20260527_0010_admin_tenants.py` | `admin_tenants`, `tenant_states`, gates, capabilities, audit log | No |
| Tenant municipal profiles | PASS | `20260528_0011_tenant_municipal_profiles.py` | Perfiles municipales | No |
| Document drafts admin | PASS | `20260528_0012_tenant_document_drafts.py` | Borradores documentales admin | No |
| `document_gaps` MVP | PARTIAL | `backend/app/models/document_archive.py`; `session.py` crea tabla en SQLite | Modelo existe y se crea en SQLite local; falta migración Alembic dedicada | Sí para producción |
| `tenant_documents` MVP | PARTIAL | `backend/app/models/document_archive.py`; `session.py` crea tabla en SQLite | Modelo existe y se crea en SQLite local; falta migración Alembic dedicada | Sí para producción |
| Fixtures tres perfiles | PASS | `frontend/src/lib/tenantDiagnosticData.ts` | `complete-city`, `partial-city`, `gap-city`; SLP no es única vía | No |
| Founder/admin user seed | PARTIAL | Admin existe como ruta/panel; usuario real depende de despliegue | No hay seed productivo verificado | Sí para producción |

## Acción requerida antes de producción

Crear migración Alembic explícita para `document_gaps` y `tenant_documents`, y seed/procedimiento founder/admin para entorno productivo.

