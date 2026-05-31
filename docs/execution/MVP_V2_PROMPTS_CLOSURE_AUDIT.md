# MVP V2 Prompts Closure Audit

Fecha: 2026-05-31

## Resultado

| Prompt / paquete | Evidencia revisada | Estado | Corrección aplicada |
| --- | --- | --- | --- |
| Prompt 1 V2 | `MVP_CLOSURE_V2_RECONCILIATION.md`, `MVP_V2_PROMPT_1_STATUS.md` | PASS | Se creó status normalizado porque la evidencia existía en reconciliation. |
| Prompt 2 V2 | `MVP_V2_PROMPT_2_STATUS.md`, browser `/comenzar`, API auth full flow | PASS | Sin cambio de alcance; se verificó registro institucional/genérico y TOTP por API local. |
| Prompt 3 V2 | `MVP_V2_PROMPT_3_STATUS.md`, `/`, `/metodologia`, `/sign-in` | PASS | Se retiró CTA público de cuenta demo en login. |
| Prompt 4A V2 | `MVP_V2_PROMPT_4A_STATUS.md`, upload/no-aplica/cross-tenant | PASS | Sin cambio de alcance. |
| Prompt 4B V2 | `MVP_V2_PROMPT_4B_STATUS.md`, `/v` desktop/mobile | PASS | Se retiró fallback visible `SLP`/`ZM SLP` cuando el tenant no selecciona municipio explícito. |
| Prompt 5 / 5R V2 | `MVP_V2_PROMPT_5_STATUS.md`, `MVP_V2_PROMPT_5R_STATUS.md`, ZIP tres perfiles | PASS | Se implementó límite real en memoria: máximo 3 exportaciones preliminares por tenant/mes. |
| ARCHIVO MVP | `MVP_ARCHIVO_STATUS.md`, upload PDF, rechazo MIME, no aplica | PASS | Sin nombres internos cliente-facing. |
| Nuevos archivos base | `NEW_FILES_INTEGRATION_STATUS.md` | PASS | Los tres documentos extra existen como Markdown; `files.zip` no está presente. |

## Huecos encontrados

- Faltaba `MVP_V2_PROMPT_1_STATUS.md` aunque Prompt 1 ya cerraba PASS en reconciliation.
- `/sign-in` exponía "Acceso de demostración" y botón de cuenta demo.
- `/v` heredaba etiquetas `SLP`/`ZM SLP` desde navegación global en tenants fixture multi-ciudad.
- `/api/tenants/[id]/export-zip` declaraba límite de 3 exportaciones, pero no lo aplicaba.

## Correcciones aplicadas

- Creado `docs/execution/MVP_V2_PROMPT_1_STATUS.md`.
- Editado `frontend/src/app/login/page.tsx` para retirar demo público visible.
- Editados `frontend/src/components/layout/Header.tsx` y `frontend/src/components/layout/Sidebar.tsx` para usar lenguaje genérico multi-ciudad en `/v`, `/p`, `/e`.
- Editado `frontend/src/app/api/tenants/[id]/export-zip/route.ts` para aplicar límite preliminar real en memoria por tenant/mes.

## Decisión

MVP V2 prompts closure: PASS
