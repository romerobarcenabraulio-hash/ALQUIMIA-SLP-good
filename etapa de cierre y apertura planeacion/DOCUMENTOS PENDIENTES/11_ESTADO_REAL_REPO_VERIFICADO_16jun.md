# 11 · ESTADO REAL DEL REPO — VERIFICADO CONTRA EL CÓDIGO
**Fecha:** 15 junio 2026 (noche) · preparado para la mañana del 16 jun
**Autor:** Claude Master (en Cowork — con acceso directo a la carpeta y al repo)
**Tipo:** Verificación de baseline. NO es un plan; es la verdad medida.
**Gobierna sobre:** las afirmaciones de "VERDAD VERIFICADA" del `00_EMPIEZA_AQUI.md`, el `08`, y el `HANDOFF_20260614.md` que NO coinciden con el repo.

---

## 0. POR QUÉ EXISTE ESTE DOCUMENTO

El relevo a Cowork me dio algo que el chat no tenía: **acceso directo al repositorio.** Lo primero que hice fue lo que pide el Principio 2 (cómputo trazable, anti-mentira): contrastar lo que los documentos afirman contra lo que el código realmente contiene. **No coinciden en puntos críticos.** Si mañana comandas a los agentes sobre la base del `08`/`HANDOFF_20260614` sin leer esto, gastarás un día (y tokens) construyendo sobre cimientos que no están en el repo.

Esto no contradice la estrategia (el `08` y el `10` siguen siendo el plan correcto). Contradice el **estado de partida** que esos documentos asumían.

---

## 1. LOS TRES HALLAZGOS DUROS (con evidencia)

### Hallazgo A — El repo está CONGELADO a mitad de un rebase, desde el 13 jun
El árbol de trabajo no está en una rama; está en estado `rebasing codex/frontend-clean-origin`, detenido por un conflicto sin resolver.

```
$ git branch --show-current        →  (vacío)
$ git status                        →  "(no branch, rebasing codex/frontend-clean-origin)"
Conflicto sin resolver:            UU frontend/src/app/admin/page.tsx
.git/rebase-merge/  con fecha       Jun 13 18:38   (lleva 2 días detenido)
rebase: codex/frontend-clean-origin  ONTO  ac985884d (HEAD actual de main)
```

**Implicación:** el repo no está en un estado limpio ni desplegable. Cualquier `git pull`, rama nueva, o `pytest` parte de un árbol inconsistente. **Esto es bloqueante real, anterior incluso al CI.**

### Hallazgo B — Los módulos que el HANDOFF_20260614 dice "construidos" NO están en el repo
El `HANDOFF_20260614.md` afirma haber creado, en la rama `claude/brave-tesla-bO6fE`:
`company_survey.py`, `obligation_matrix.py`, `services/container_inventory.py`, `models/container.py`, y sus tests (`test_company_survey.py`, etc.), para un total de **"1,062 tests verdes"**.

Verificación contra el repo:

```
$ find backend/app -name "company_survey*" -o -name "container_inventory*" -o -name "container.py"
   → (nada)
$ git log --all -- backend/app/empresa/company_survey.py        → SIN HISTORIA EN NINGUNA RAMA
$ git log --all -- backend/app/services/container_inventory.py  → SIN HISTORIA EN NINGUNA RAMA
$ grep -rl "ContainerInventory\|GIRO_CATALOG\|estimate_generation" backend/app  → (nada)
$ git branch -a | grep brave-tesla    → NO EXISTE (ni local, ni en origin)
$ git ls-remote --heads origin | grep brave-tesla  → no aparece
$ find backend/tests -name "test_*.py" | wc -l       → 96 archivos de test (no la suite descrita)
```

**Conclusión honesta:** la rama `claude/brave-tesla-bO6fE` que supuestamente contenía ese trabajo **no existe en este repositorio ni en su origin.** Los archivos descritos no están en ninguna rama del historial. O nunca se hizo `push`/commit, o la rama se perdió/borró. **No puedo verificar que esos módulos ni los 1,062 tests existan.** Hasta que aparezcan, deben tratarse como NO presentes.

### Hallazgo C — El `empresa/router.py` que SÍ existe implementa otra API
La API real de `empresa/` no es la del handoff. Lo que existe hoy:

```
GET   /empresa/scian-factors            (lista de giros SCIAN)
GET   /empresa/scian-factors/{codigo}
POST  /empresa/declaraciones            (CRUD de declaraciones de generación RSU)
GET   /empresa/declaraciones
GET   /empresa/declaraciones/{id}
PATCH /empresa/declaraciones/{id}/confirmar
GET   /empresa/declaraciones/{id}/pdf   (ya hay generación de PDF aquí)
Archivos reales: empresa/{router.py, schemas.py, scian_factors.py, pdf_perfil.py}
```

El handoff describía `/empresa/survey/giros`, `/empresa/survey/estimar`, `/empresa/obligaciones`. **No existen.** Sí existe una base de SCIAN + declaraciones + PDF, que es un punto de partida distinto y útil, pero NO el que el `08` asume para el Hito 0.

---

## 2. QUÉ SIGNIFICA PARA EL HITO 0 (cierre GOV)

El `08` define el Hito 0 como **"no se construye, se cierra"**: agregar router a un ContainerInventory que ya existe, migración Alembic de `containers`, KPI dashboard, ReportBuilder, destrabar CI.

Pero el ContainerInventory **no existe en el repo**. Entonces el Hito 0, como está escrito, parte de una premisa falsa. Hay dos escenarios y la mañana del 16 empieza por discriminar cuál es:

- **Escenario 1 — El trabajo existe pero está fuera de este clon** (en otra máquina, en un branch no pusheado, en un stash). → Recuperarlo y pushearlo es la tarea #0. Barato si aparece.
- **Escenario 2 — El trabajo se perdió o nunca se commiteó.** → El Hito 0 deja de ser "cerrar" y pasa a ser "construir esos módulos desde cero sobre la base SCIAN/declaraciones que SÍ existe". Cambia el tamaño del sprint (de ~días a más), pero el plan estratégico del `08` sigue siendo válido.

**No decido esto por ti porque depende de información que solo tú tienes** (¿en qué máquina trabajó el agente del 14-jun? ¿hay otro clon?). Es lo primero a resolver mañana.

---

## 3. EL ORDEN DE BLOQUEANTES, CORREGIDO

El `00_EMPIEZA_AQUI` lista tus tareas como: (1) CI, (2) Greptile, (3) Render. La verificación inserta dos pasos ANTES:

| # | Bloqueante | Por qué va primero | Acción |
|---|---|---|---|
| **0** | Rebase congelado | El árbol no está limpio; nada parte de un estado sano | Decidir: `git rebase --abort` (volver a estado previo seguro) o resolver el conflicto en `admin/page.tsx`. **Decisión tuya — es irreversible, no la tomo solo.** |
| **0b** | Localizar el trabajo del 14-jun | El Hito 0 depende de si existe o no | Buscar la rama `brave-tesla` / el clon donde corrió ese agente. Si no aparece, asumir Escenario 2. |
| 1 | CI GitHub (spending limit) | Sin CI verde no hay merge limpio | Settings → Billing → subir límite, o repo público |
| 2 | Greptile | Sustituye memoria de agente, navega el repo | Conectar al repo `alquimia-slp` |
| 3 | Render + logs + gate de merge | Observabilidad y despliegue | Confirmar acceso Codex + env vars |

**0 y 0b son nuevos y van primero.** Programar sobre un repo en rebase + sin saber si la base existe = la "deuda invisible" que advierte el `10`.

---

## 4. LO QUE SÍ ESTÁ CONFIRMADO (la base real sobre la que se construye)

Para no sonar solo a malas noticias — esto es verdad medida y es buen cimiento:

- Stack confirmado en el árbol: FastAPI + SQLAlchemy + **Alembic** (carpeta `backend/alembic/` presente), config de Render, frontend React/Vite.
- **Stripe cableado de verdad:** `routers/payments.py` + `routers/stripe_webhooks.py` + `models/payment.py` existen.
- **Perplexity como único LLM:** `app/research/` presente.
- `empresa/` tiene base real: catálogo SCIAN, declaraciones RSU, y **generación de PDF ya funcionando** (`pdf_perfil.py` + endpoint `/declaraciones/{id}/pdf`).
- 96 archivos de test en `backend/tests/` (no se pudo correr la suite: el repo está en rebase; el conteo de "tests verdes" se valida después de resolver el bloqueante 0).
- App modular grande (~60 subpaquetes en `app/`): hay mucho construido. El problema no es falta de código; es estado git inconsistente + un handoff que describe trabajo no localizable.

---

## 5. RECOMENDACIÓN (resolutor, no socrático)

1. Mañana, **antes de CI**, resuelve el rebase. Lo más seguro si no recuerdas qué estabas rebasando: `git rebase --abort` y partir de `main` limpio. Si el trabajo de `frontend/admin/page.tsx` importa, resuelve el conflicto a mano primero.
2. Dedica 15 min a localizar el trabajo del 14-jun (¿otra laptop? ¿branch sin push?). Si en 15 min no aparece, **declara Escenario 2** y seguimos: el `12_HANDOFF_CIERRE_GOV_HITO0.md` ya está escrito para ambos casos.
3. Luego sí: CI → Greptile → Render, tal como tu `00` lo tiene.
4. Cuando el repo esté limpio, corre `cd backend && python -m pytest -q` y registra el número REAL de tests verdes en la bitácora. Ese número reemplaza al "1,062" no verificable.

---

*11 · Estado Real del Repo Verificado · Alquimia Supermind · 15 junio 2026 (noche)*
