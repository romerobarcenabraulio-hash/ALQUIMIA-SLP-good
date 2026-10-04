# RELEVO — CLAUDE CODE · 02 jul 2026  (RESET)

> **Ignora prompts de relevo anteriores.** Este supersede a `PROMPTS_RELEVO_3AGENTES_20jun.md` y `HO-DIAG_PROMPTS_CODEX_Y_CLAUDECODE.md` para Claude Code.

## Setup (una vez)
Referencia `REGLAS_DE_EJECUCION_AGENTES.md` (v1.3) desde `CLAUDE.md` en la raíz del repo. El rigor vive en REGLAS; esto es solo qué leer y qué hacer.

## Fuente de verdad (en este orden — nada más cuenta)
1. `main` + CI (la realidad manda).
2. Linear: **ALQ-124** (orden de operaciones) y **ALQ-108** (orden del tren).
3. `_INDICE_ESTADO.md` — SOLO los docs marcados 🟢 VIGENTE.
4. Canónico del repo: `docs/architecture/FASE*` + `cursor-rules/` — **léelos ANTES de construir** (REGLAS §3B). Los docs 14–41 DEFIEREN a esto; no reimplementan.

## PROHIBIDO como fuente (basura vieja)
`_superados_v1/`, docs 04–07, duplicados (`" 2"`, `copy`, temp), ramas muertas, y cualquier doc NO marcado 🟢 en el índice. Si dudas: no lo uses, pregúntame.

## No crees desmadre de archivos
Nada de `.md` nuevos regados. Doc nuevo = dentro de la carpeta canónica y registrado en `_INDICE_ESTADO.md`. Supersede, no dupliques.

## Tarea (avanzas por naturaleza; gate solo en lo irreversible — REGLAS §2)
1. **Tren de merge.** `git fetch --all --prune`. Inventaria las ~30 ramas → `INVENTARIO_RAMAS.md`. Arranca el tren en el orden de ALQ-108: rama que mergea limpio + CI verde → a `main` (vía el controlador único, mismo día) y sigues. `main` congelado en `ac985884d`. No reconstruyas lo que ya vive en rama (ALQ-104).
2. **Después:** limpieza de carpeta (ALQ-112 / `ordenar_carpeta_ALQ112.sh`) → `FOLDER_MAP.md`; luego specs de frontend en orden de dependencia.
- Te paras a pedir aprobación SOLO en: conflicto que requiere criterio, tests en rojo, descartar/borrar rama, o acción irreversible.

## Reporte y rastro
Ciclo palomita (REGLAS §7): codificar → auto-auditar → Greptile+CI verde → palomear. Bitácora en Linear (REGLAS §8C) + tu PR. Reporta al terminar.
