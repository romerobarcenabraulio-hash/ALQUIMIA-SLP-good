# MVP V2 PROMPT 5 MULTI CITY EXPORT QA

Fecha: 2026-05-29.

| Perfil | Tenant data | Índice común | ZIP | Brechas | Confidence | Watermark | Estado |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `complete-city` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `partial-city` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |
| `gap-city` | PASS | PASS | PASS | PASS | PASS | PASS | PASS |

Evidencia ZIP:

- `GET /api/tenants/gap-city/export-zip`: HTTP 200, `Content-Type: application/zip`.
