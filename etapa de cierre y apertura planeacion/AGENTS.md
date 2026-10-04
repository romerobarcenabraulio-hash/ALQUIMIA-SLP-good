# AGENTS.md — Contrato de ejecución ALQUIMIA para Codex (léelo ANTES de tocar nada)

> Última actualización: 13-jul-2026. Fuente de verdad: main + CI, no Linear ni tu memoria de la sesión anterior. Si dudas entre lo que "recuerdas" y lo que dice `git`, gana `git`.

## REGLA DE ORO

**Cero código nuevo mientras exista deuda de integración** (~14 PRs abiertos, ver ALQ-108). El modo por defecto de Codex en este repo es: rescatar, rebasar y dejar listos PRs existentes — no producir más ramas que nadie integra.

## Protocolo de arranque (cada sesión, sin excepción)

1. `git fetch --all --prune` y `gh pr list --state open` ANTES de cualquier plan.
2. Pregúntate: ¿lo que me piden ya está en una rama codex/*, claude/*, sprint-* o en un PR abierto? El 80% de las veces la respuesta es SÍ (mapa en ALQ-104).
3. Si existe → re-scope a REVIEW+MERGE-PREP: rebase sobre `origin/main`, resolver conflictos, CI verde, marcar Ready for review. **No reescribas desde cero.**
4. Si no existe → verifica el issue ALQ-# en Linear, y solo entonces construye, en rama nueva desde `origin/main` del día.

## Reglas duras

- **Un scope = un PR vivo.** Antes de abrir un PR, busca si ya hay uno con el mismo scope. Si tu versión nueva supera a una vieja (caso #44 vs #34), dilo explícito en la descripción y deja comentario en el PR viejo pidiendo su cierre. Nunca dejes dos PRs compitiendo en silencio.
- **Draft está prohibido como estado final.** Terminas la sesión con el PR Ready for review y CI verde, o cierras la rama. Un draft abandonado es deuda, no progreso.
- **Merge autorizado (L2, orden del Founder 17-jul-2026)**: puedes mergear a main (squash) SOLO si: CI verde + Greptile pasado con comentarios resueltos + un scope por PR + base fresca. **EXCEPCIONES del Founder**: migraciones de DB, auth/RBAC/gates, billing, secretos/config de producción. **Tripwire**: main rojo o deploy fallido tras tu merge → revert PR inmediato sin preguntar + reporte en el issue; main rojo >30 min = auto-merge congelado.
- **Base fresca siempre.** Rama nueva = desde `origin/main` de hoy. PR viejo = rebase sobre main antes de marcarlo ready. Un PR con base de hace 3 semanas (baseSha viejo) es un PR muerto caminando.
- **Guardrails = comportamiento, no strings** (ALQ-110). No abras PRs para "arreglar" tests que persiguen literales de texto. Si el test compara strings exactos de terminología, el fix es reescribir el test a comportamiento, y eso ya tiene PR (#37) — no lo dupliques.
- **Tamaño:** apunta a <15 archivos por PR. Los PRs de 500 archivos (caso #39) se anuncian antes y se coordinan con el Founder como sesión dedicada.
- **Límite de vida: 1 día.** Nada que produzcas debe amanecer dos veces sin estar ready. Si el scope no cabe en un día, pártelo en PRs apilables.

## Comunicación con el board

- Toda rama: `codex/alq-<n>-<slug>`, ligada a su issue.
- Todo PR: título `tipo(ALQ-n): descripción` + link al issue + qué falta para merge.
- Al terminar: comenta el issue de Linear con estado real (ready / bloqueado por X). No cierres issues: eso lo decide el Founder.

## CONECTORES: se INVOCAN en cada iteración (no son decoración)

Linear es el project/agent management; el resto de los conectores disparan evaluaciones. El loop obligatorio de CADA tarea:

0. **BITÁCORA VIVA (ALQ-134) — PRIMER acto de todo turno**: léela (10 líneas, el estado en 5 segundos, incluida tu nota "PARA CODEX"). Es el relevo de tu hermano. Al FINAL del turno la SOBREESCRIBES con el formato fijo — jamás comentes en ella, jamás agregues secciones.
1. **Linear MCP** — toma tu issue de la cola 🚦 AHORA y léelo completo. Sin issue, no hay trabajo.
2. **GitHub (`gh`)** — rama `codex/alq-<n>-<slug>`, PR contra main.
3. **Greptile** — dispara el review en cada PR y resuelve sus comentarios antes de marcar ready.
4. **Logs de deploy (Render/plataforma)** — tras cada deploy: runtime errors = 0; los errores van al issue con su traza, no a la memoria.
5. **Verificación numérica independiente** — todo cálculo determinista nuevo (motor financiero, KPIs) se valida contra un caso de prueba calculado por fuera (Wolfram/script separado). El número que solo existe en tu propio código no está verificado.
6. **Contrato OpenAPI** — eres su dueño: cada cambio de backend re-exporta `contracts/openapi.v*.json` en el mismo PR.
7. **Lovable: NO lo tocas.** Jamás.
8. **Cierre obligatorio: write-back a Linear en el MISMO turno** — estado, link al PR, qué falta para merge. Trabajo sin write-back = trabajo invisible = no existió.

## Definición de "hecho"

Código escrito ≠ hecho. Hecho = PR ready, rebasado, CI verde, Greptile pasado, sin duplicar scope, issue actualizado. Si falta uno, sigue abierto y lo dices.
