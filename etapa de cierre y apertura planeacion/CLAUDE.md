# CLAUDE.md — Contrato de ejecución ALQUIMIA (léelo ANTES de tocar nada)

> Última actualización: 13-jul-2026. Fuente de verdad operativa: main + CI. Linear es el mapa, no el territorio. Si Linear y el repo se contradicen, gana el repo.

## REGLA DE ORO (no negociable)

**Nada nuevo se construye hasta vaciar la deuda de integración.** Hoy hay ~14 PRs abiertos (ALQ-108). Tu trabajo por defecto NO es escribir código nuevo: es dejar PRs existentes listos para que el Founder (controlador único) los mergee.

## ANTES de escribir una sola línea

1. `git fetch --all` y revisa si lo que te piden **ya existe en una rama o PR abierto**. Consulta el mapa rama↔issue (ALQ-104) y la lista de PRs (`gh pr list --state open`).
2. Si ya existe → tu tarea cambia de BUILD a **REVIEW + PREPARAR MERGE** (rebase sobre main, CI verde, marcar ready). NO reconstruyas. Reconstruir lo que ya está en una rama es el error #1 de este repo.
3. Si no existe → confírmalo en el issue de Linear antes de arrancar, y solo entonces construye.

## PROHIBIDO (esto es lo que nos tiene trabados)

- ❌ Abrir un PR y dejarlo en **draft**. Un PR que abres lo dejas **Ready for review** con CI verde, o no lo abres.
- ❌ Abrir un **segundo PR con el mismo scope** que uno existente (caso #34 vs #44, #35 vs #40). Si el PR viejo está mal, coméntalo y ciérralo en el mismo movimiento; un scope = un PR vivo.
- ❌ Ramas desde bases viejas. Toda rama nueva sale de `origin/main` del día. Todo PR se rebasa sobre main antes de marcarse ready.
- ✅ **Merge autorizado (L2, orden del Founder 17-jul-2026)**: puedes mergear a main (squash) SOLO si: CI verde + Greptile pasado con comentarios resueltos + un scope por PR + base fresca de main. **EXCEPCIONES que siguen siendo del Founder**: migraciones de DB, auth/RBAC/gates, billing, secretos/config de producción. **Tripwire**: main rojo o deploy fallido tras tu merge → revierte DE INMEDIATO (revert PR, sin preguntar) y repórtalo en el issue; main rojo >30 min = auto-merge congelado hasta que el Founder lo levante.
- ❌ PRs de "fix guardrail test" que persiguen strings literales. Los guardrails validan **comportamiento** (cero invención, sellos de cita), no texto exacto (ALQ-110). Si un test se rompe por "Formato Chicago"→"formato Chicago", el test está mal, no el código.
- ❌ PRs gigantes. >15 archivos = pide partirlo o justifica por qué es indivisible en la descripción.

## OBLIGATORIO en cada sesión

1. Empieza leyendo ALQ-124 (protocolo) y ALQ-108 (orden vigente del tren) en Linear.
2. Cada rama se nombra `claude/alq-<n>-<slug>` y referencia su issue.
3. Al abrir/actualizar un PR, actualiza el issue de Linear en el mismo turno: estado, link al PR, y qué falta para merge.
4. Nada tuyo vive >1 día sin estar ready-for-review. Si no cabe en un día, es que el scope está mal cortado: córtalo.
5. Si detectas conflicto entre tu tarea y este contrato, PARA y pregunta al Founder. No improvises.

## CONECTORES: se INVOCAN en cada iteración (no son decoración)

Linear es el project/agent management; el resto de los conectores disparan evaluaciones. El loop obligatorio de CADA tarea:

0. **BITÁCORA VIVA (ALQ-134) — PRIMER acto de todo turno**: léela (10 líneas, el estado en 5 segundos: qué pasó, quién está en qué, qué sigue, qué está bloqueado, y tu nota "PARA CLAUDE CODE"). Es tu hermano poniéndote al día. Al FINAL del turno la SOBREESCRIBES con el formato fijo — jamás comentes en ella, jamás agregues secciones.
1. **Linear MCP** — toma tu issue de la cola (🚦 AHORA o 🎨 UI-BRIEF) y léelo completo. Sin issue, no hay trabajo.
2. **GitHub (`gh`)** — rama `claude/alq-<n>-<slug>`, PR contra main.
3. **Greptile MCP** — dispara el code review en cada PR y RESUELVE sus comentarios antes de marcar ready. Un PR sin review de Greptile no está listo.
4. **Vercel MCP** — tras cada deploy/preview: build logs limpios, runtime errors = 0, lee el feedback de toolbar. Todo error encontrado se registra en el issue, no se anota "luego lo veo".
5. **Lovable MCP** — SOLO tú eres el vocero (Track A, ALQ-130): brief desde issue 🎨 UI-BRIEF → prototipo → link de vuelta al issue.
6. **Cierre obligatorio: write-back a Linear MCP en el MISMO turno** — estado, links (PR, preview, prototipo), qué falta. Trabajo sin write-back = trabajo invisible = no existió.

## Definición de "terminado"

Terminado ≠ código escrito. Terminado = PR ready, rebasado sobre main, CI verde, Greptile pasado, issue de Linear actualizado, cero scope duplicado. Todo lo demás es trabajo a medias.
