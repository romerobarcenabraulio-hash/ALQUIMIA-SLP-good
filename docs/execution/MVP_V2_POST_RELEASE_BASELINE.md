# MVP V2 Post-Release Baseline

Fecha: 2026-05-31

| Campo | Valor |
| --- | --- |
| Commit base | `ba63380d256e7bb772165412ed1069fb357da6c3` |
| Branch | `main` |
| Entorno | Local/founder-ready; producción pendiente de configuración externa |
| Estado build/tests | PASS según `MVP_V2_FINAL_TEST_BUILD_EVIDENCE.md` y pre-push typecheck |
| Release final | `MVP V2 FINAL: PASS` |

## Flujos críticos PASS

- Landing `/`.
- `/comenzar`.
- Registro institucional y genérico.
- Login/TOTP por API.
- `/sign-in` sin demo público.
- `/preparando`.
- `/pendiente-validacion`.
- `/metodologia`.
- `/v`, `/p`, `/e`.
- ARCHIVO mínimo: gap, upload, no aplica, cross-tenant.
- ZIP con índice común, watermark y límite preliminar.
- Tres perfiles ciudad con mismo paquete documental.

## Riesgos aceptados

- Producción externa no verificada.
- Storage documental MVP en memoria.
- Límite de ZIP preliminar en memoria.
- Plataforma 0 completa fuera del alcance MVP.
- `document_gaps` y `tenant_documents` requieren migración Alembic productiva.
- Lint conserva warnings legacy con código de salida 0.

## No tocar sin aprobación founder

- No agregar partners.
- No activar ARCHIVO completo.
- No activar research/Perplexity como verdad municipal.
- No prometer producción lista sin configurar backend, DB, email, storage y CORS.
- No reintroducir demo público.
- No exponer nombres internos de agentes cliente-facing.
- No usar SLP como excepción privilegiada.

