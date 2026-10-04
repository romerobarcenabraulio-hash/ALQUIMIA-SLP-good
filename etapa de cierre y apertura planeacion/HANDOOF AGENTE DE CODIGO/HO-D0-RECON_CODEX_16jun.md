# HO-D0-RECON · TICKET PARA CODEX — RECONOCIMIENTO READ-ONLY DEL REPO
**Emitido por:** Claude Master (Cowork)
**Fecha:** 15 jun 2026 (noche) · ejecutar 16 jun
**Agente asignado:** Codex (dominio: git, backend, infra)
**Tipo:** Reconocimiento READ-ONLY. NO modifica el repo. NO resuelve el rebase. NO commitea. NO pushea.
**Por qué primero:** el repo está congelado a mitad de rebase y el trabajo del handoff 14-jun no está localizado (ver `11_ESTADO_REAL_REPO_VERIFICADO_16jun.md`). Antes de construir nada, hay que medir la verdad. Este ticket NO toca lo irreversible — eso es decisión del founder.

---

## PROMPT PARA PEGAR A CODEX (copia desde aquí ↓)

> Eres Codex en el repo `alquimia-slp`. Tarea de **reconocimiento READ-ONLY**. Reglas duras:
> - NO ejecutes `git rebase --abort/--continue`, NO hagas commit, NO hagas push, NO borres ni modifiques archivos. Solo lectura y reporte.
> - Si algo te pide escribir, PARA y reporta. Esto es diagnóstico, no reparación.
> - Pega la salida REAL de cada comando (anti-mentira). Nada de "debería dar".
>
> Ejecuta y reporta la salida de:
> 1. `git status` y `git branch -a` — confirma el estado de rebase y lista ramas.
> 2. `cat .git/rebase-merge/head-name; cat .git/rebase-merge/onto` — qué se rebasaba y sobre qué.
> 3. `git diff --name-only --diff-filter=U` — archivos en conflicto.
> 4. `git log --all --oneline -- "**/company_survey.py" "**/container_inventory.py" "**/container.py" "**/test_company_survey.py"` — ¿existe en CUALQUIER rama el trabajo del handoff 14-jun?
> 5. `git ls-remote --heads origin | grep -i "brave\|tesla"` — ¿existe la rama `claude/brave-tesla-bO6fE` en origin?
> 6. `git stash list` y `git reflog -20` — ¿hay trabajo guardado o recuperable que explique los módulos faltantes?
> 7. `find backend/tests -name "test_*.py" | wc -l` — conteo real de archivos de test.
> 8. SOLO SI `git status` confirma árbol limpio (sin rebase activo): `cd backend && python -m pytest -q 2>&1 | tail -20` para el número REAL de tests. Si el árbol NO está limpio, NO corras pytest; reporta "bloqueado por rebase, no se corrió".
>
> Entrega un reporte en `etapa de cierre y apertura planeacion/HANDOOF AGENTE DE CODIGO/RECON_RESULTADO_16jun.md` con:
> - **Veredicto Escenario:** ¿1 (el trabajo 14-jun existe en alguna rama/stash) o 2 (no se localiza)?
> - La salida real de cada comando.
> - Recomendación de cómo salir del rebase de forma segura (abort vs. resolver), SIN ejecutarla.
> - El número real de tests (o "no corrido, bloqueado por rebase").

(copia hasta aquí ↑)

---

## CRITERIOS DE ACEPTACIÓN
1. ✅ Existe `RECON_RESULTADO_16jun.md` con la salida real pegada (no parafraseada).
2. ✅ Veredicto Escenario 1 vs 2 explícito.
3. ✅ El repo quedó EXACTAMENTE como estaba (read-only respetado): `git status` idéntico antes/después.
4. ✅ Recomendación de salida del rebase documentada pero NO ejecutada.

## QUÉ DESBLOQUEA ESTE TICKET
- La decisión Escenario 1/2 del founder (bloqueante 0b del doc 11).
- Reemplaza el "1,062 tests" no verificado por un número real.
- Da la recomendación segura para que el founder decida el `git rebase --abort` o la resolución (bloqueante 0, decisión del founder — irreversible).

## DESPUÉS DE ESTE TICKET (no antes)
- Founder resuelve el rebase con la recomendación en mano.
- Founder conecta GitHub (`/mcp`) + Render (custom MCP) → CI verde.
- Recién entonces se emiten `HO-D0-CODEX` y `HO-D0-CLAUDECODE` del `12_HANDOFF_CIERRE_GOV_HITO0.md`.

---

*HO-D0-RECON · Alquimia Supermind · 15 jun 2026 (noche)*
