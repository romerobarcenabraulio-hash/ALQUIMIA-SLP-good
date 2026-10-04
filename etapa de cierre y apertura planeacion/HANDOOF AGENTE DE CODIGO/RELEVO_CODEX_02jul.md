# RELEVO — CODEX · 02 jul 2026  (RESET)

> **Ignora prompts de relevo anteriores.** Este supersede a `PROMPTS_RELEVO_3AGENTES_20jun.md` y `HO-DIAG_PROMPTS_CODEX_Y_CLAUDECODE.md` para Codex.

## Setup (una vez)
Copia `REGLAS_DE_EJECUCION_AGENTES.md` (v1.3) al repo como `AGENTS.md` (raíz). El rigor vive en REGLAS; esto es solo qué leer y qué hacer. Estás frágil con `.git` → NO haces cirugía de git (merge/rebase/push); de eso se encarga Claude Code (REGLAS §3C, controlador único).

## Fuente de verdad (en este orden — nada más cuenta)
1. `main` + CI (la realidad manda).
2. Linear: **ALQ-124** (orden de operaciones).
3. `_INDICE_ESTADO.md` — SOLO los docs marcados 🟢 VIGENTE.
4. Canónico del repo: `docs/architecture/FASE*` (NOUS: FASE17R/18/23–27; ECA: FASE11/13; data moat: FASE14) + `cursor-rules/` — **léelos ANTES de construir** (REGLAS §3B). Construir SOBRE lo existente, no reinventar.

## PROHIBIDO como fuente (basura vieja)
`_superados_v1/`, docs 04–07, duplicados (`" 2"`, `copy`, temp), ramas muertas, cualquier doc NO marcado 🟢. Si dudas: no lo uses, pregúntame.

## No crees desmadre de archivos
Nada de `.md` nuevos regados. Doc nuevo = dentro de la carpeta canónica y registrado en `_INDICE_ESTADO.md`. Supersede, no dupliques.

## Tarea (avanzas por naturaleza; gate solo en lo irreversible — REGLAS §2)
1. **Verdad de tests.** En `main` (`ac985884d`) corre `pytest`, registra el conteo REAL (pasan/fallan/skip) — reemplaza el "1,062" no verificado.
2. **Revisión de los 5 PRs de gate** #37, #36, #38, #34, #35 (solo lectura): por PR, semáforo verde/amarillo/rojo + hallazgos (secretos, migraciones Alembic peligrosas, consultas sin filtro de tenant, N+1, escrituras irreversibles sin gate).
3. **Después:** backend en orden de dependencia sobre lo canónico: ontología (ALQ-102/FASE14), ECA (ALQ-69/FASE11), conector anti-corrupción (ALQ-95/doc 38), brechas rojas (ALQ-115/118/121). Tests + procedencia c/u.
- Si `.git`/créditos te bloquean: párate y avísame, no fuerces.

## Reporte y rastro
Tests verdes con salida REAL pegada (anti-mentira, REGLAS §3). Bitácora en Linear (§8C). No escribes a `main` ni a ramas compartidas: propones vía PR y Claude Code integra.
