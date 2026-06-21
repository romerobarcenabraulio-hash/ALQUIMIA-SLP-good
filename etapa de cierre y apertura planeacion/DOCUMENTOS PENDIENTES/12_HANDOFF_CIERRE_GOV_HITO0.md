# 12 · HANDOFF DE CIERRE GOV — HITO 0
**Fecha:** 15 junio 2026 (noche) · para ejecutar a partir del 16 jun
**Autor:** Claude Master (Cowork)
**Lectura previa obligatoria:** `11_ESTADO_REAL_REPO_VERIFICADO_16jun.md` → `08` → `10`
**Reparte:** Codex (backend) · Claude Code (frontend) — nunca los mismos archivos el mismo día
**Meta del Hito 0 (del 08):** GOV-RSU desplegable, un municipio recorre el flujo completo y genera su PDF, CI verde.

---

## 0. PRECONDICIÓN — NO SE EMITE NINGÚN TICKET HASTA QUE ESTO SE CUMPLA

Por el `11`, el repo está en rebase congelado y los módulos base que el `08` asumía no están localizables. **Ningún agente arranca código hasta:**

1. ✅ Rebase resuelto o abortado → `git status` limpio en una rama de trabajo. (Tarea tuya, 16-jun, bloqueante 0.)
2. ✅ Decisión Escenario 1 vs 2 tomada (¿apareció el trabajo del 14-jun?). (Tarea tuya, bloqueante 0b.)
3. ✅ CI verde corriendo (bloqueante 1).

Programar antes de esto es acumular deuda invisible (regla del `10`, §7). Este handoff está escrito para ejecutarse DESPUÉS de esos tres checks.

---

## 1. LAS 5 TAREAS DEL HITO 0 — RAMIFICADAS POR ESCENARIO

El `08` lista 5 entregables. Su forma cambia según el `11`:

| # | Entregable | Escenario 1 (el trabajo del 14-jun aparece) | Escenario 2 (no aparece — asumir por defecto) |
|---|---|---|---|
| T1 | Router ContainerInventory | Exponer el servicio existente vía FastAPI | **Construir** modelo `Container` + servicio + router desde cero |
| T2 | Migración Alembic `containers` | Crear migración de la tabla ya modelada | Crear modelo Y migración juntos |
| T3 | KPI Dashboard (toneladas, cobertura, semáforo/municipio) | Endpoints sobre datos existentes | Endpoints + lógica de agregación desde cero |
| T4 | ReportBuilder (PDF ejecutivo por municipio) | Reusar patrón PDF existente | Reusar `empresa/pdf_perfil.py` como base (ya genera PDF) |
| T5 | Destrabar CI | — (tarea del founder) | — (tarea del founder) |

**Nota clave para T4:** el repo YA tiene generación de PDF funcionando (`empresa/pdf_perfil.py` + endpoint `/empresa/declaraciones/{id}/pdf`). En ambos escenarios, el ReportBuilder GOV **reusa ese patrón**, no lo reinventa. Eso es token-eficiencia (regla `10` §4: si existe, se reusa).

---

## 2. REPARTO POR AGENTE (separación total, regla `10` §3)

### CODEX — backend / datos / migraciones / Render
- **T1** Modelo + servicio + router `ContainerInventory` en `backend/app/` (carpeta `gov/` si se adopta la separación del `10`, o donde viva el dominio RSU).
- **T2** Migración Alembic de `containers` (hoy, si existe, solo en `create_all` — riesgo en prod). Verificar con `alembic history` antes.
- **T3** (backend) Endpoints KPI: toneladas, cobertura, semáforo por municipio. Cálculo **determinista, sin LLM** (regla 4 principios duros #2).
- Carpetas permitidas: `backend/`, `alembic/`, config Render. **Prohibido:** `frontend/`.

### CLAUDE CODE — frontend / lógica fina / esquemas / auditoría
- **T3** (frontend) Pantallas del KPI dashboard. Antes de tocar UI: escribir el `SCR_*.md` de cada pantalla (regla v4 — sin SCR aprobado, no se abre ticket de UI).
- **T4** ReportBuilder: estructura del PDF ejecutivo por municipio, reusando el patrón de `pdf_perfil.py`. Define el template + variables (documento desde template = $0 de API).
- **T4** (auditoría) Verificar procedencia de cada cifra del reporte (Principio #2: cada número trae su fuente o fórmula).
- Carpetas permitidas: `frontend/`, specs `SCR_*`, esquemas. **Prohibido:** `backend/app/` core.

### FOUNDER (tú)
- **T5** Destrabar CI (Settings → Billing). Bloqueante de TODO el merge.
- Validación de cada PR antes de merge (gate humano).

---

## 3. DISCIPLINA DE EJECUCIÓN (no negociable, del `09` y `10`)

Para CADA tarea, el agente:
1. `git pull origin main` antes de empezar. Rama de vida corta por tarea.
2. Lee SOLO lo que necesita (el .md de su tarea + el código de su dominio), NO el repo entero ni el transcript. (Token-eficiencia.)
3. Verifica procedencia antes de producir. Dato sin fuente → lo pide, no lo inventa.
4. Cálculo determinista → función pura, SIN LLM. Solo síntesis/redacción usa LLM.
5. Build + lint + tests pasan antes de mergear. **Pega el resultado real del pytest (anti-mentira).**
6. Merge verificado el mismo día. ¿Conflicto? PARA y reporta.
7. Al cerrar sesión: commit de todo + handoff de relevo en `HANDOOF AGENTE DE CODIGO/` con timestamp (formato `09` §3).

---

## 4. CRITERIO DE CIERRE DEL HITO 0 (del `08`, sin cambios)

- [ ] Un municipio de prueba recorre el flujo completo end-to-end.
- [ ] Genera su reporte PDF ejecutivo.
- [ ] La suite de tests corre en **CI verde** (y se registra el número REAL de tests en la bitácora, reemplazando el "1,062" no verificado).
- [ ] T1–T4 mergeadas a `main` con PR + validación humana.
- [ ] Documentar en 1 página qué tomó más de lo esperado (disciplina v4, Cap 12).

---

## 5. LO QUE NO SE HACE EN EL HITO 0 (anti-dispersión, `08` §7)

- ❌ Empresarial (eso es Hito 1, arranca después de cerrar GOV).
- ❌ RouteOptimizer (§6 del handoff 14-jun) — es "Media", no bloquea el cierre. Después.
- ❌ Onboarding de voz, migración a Anthropic, Red de Comercio. Nada de eso es Hito 0.
- ❌ Reescribir lo que ya funciona (Stripe, Perplexity, SCIAN/declaraciones). Se reusa.

**Filtro ante cualquier tentación:** ¿esto cierra GOV con lo mínimo desplegable, o es expansión? Si es expansión, no entra al Hito 0.

---

## 6. ENTRADAS EN BITÁCORA QUE GENERA ESTE HANDOFF

Al emitir los tickets (después de la precondición §0), registrar en `BITACORA_MAESTRA.md`:
- `HO-D0-CODEX` → T1, T2, T3-backend
- `HO-D0-CLAUDECODE` → T3-frontend, T4
- Status inicial `[EMITIDA]`, bloqueados por la precondición §0 hasta que se cumpla.

---

*12 · Handoff Cierre GOV Hito 0 · Alquimia Supermind · 15 junio 2026 (noche)*
