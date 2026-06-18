# BITÁCORA MAESTRA · HANDOFFS A CODEX / CLAUDE CODE
**Proyecto:** Alquimia SLP  
**Fecha inicio:** 14 junio 2026  
**Responsable CTO:** Claude (Master)  
**Responsable Ejecución:** Codex / Claude Code  

---

## Convención de registro

Cada entry contiene:
- **TIMESTAMP** — cuándo se emitió la instrucción
- **HANDOFF_ID** — código único (HO-001, HO-002, etc.)
- **ARCHIVO_INSTRUCCION** — dónde está la instrucción detallada
- **OBJETIVO** — qué se construye
- **STATUS** — [EMITIDA] → [EN_EJECUCION] → [REVISADO] → [MERGED] → [VALIDADO]
- **BLOQUES** — qué está esperando para avanzar
- **NOTAS** — contexto rápido

---

## HANDOFFS EMITIDOS

### HO-001 · VERIFICACIÓN DE ESTADO ACTUAL
- **Timestamp:** 14 junio 2026, 23:10 UTC
- **Archivo:** `documentos-pendientes/01_STATUS_BASELINE_VERIFICACION.md`
- **Objetivo:** Validar qué está realmente deployado vs documentado en handoff anterior
- **Status:** [EMITIDA] (esperando status de Codex)
- **Bloques:** Ninguno — es pre-requisito de todo lo demás
- **Notas:** Debe ejecutarse ANTES de cualquier otra instrucción

---

## TEMPLATE PARA NUEVOS HANDOFFS

```markdown
### HO-NNN · [TITULO CONCISO]
- **Timestamp:** [fecha, hora UTC]
- **Archivo:** `documentos-pendientes/NN_TITULO_ARCHIVO.md`
- **Objetivo:** [qué construir o validar, 1-2 líneas]
- **Status:** [EMITIDA]
- **Bloques:** [qué espera para empezar, o "Ninguno"]
- **Notas:** [contexto rápido]
```

---

## CRITERIOS DE ACEPTACIÓN GLOBALES

Cada handoff DEBE ser considerado MERGED solo si:
1. ✅ Código está en PR contra `main` con descripción clara
2. ✅ Validación visual completada (screenshots si aplica)
3. ✅ No hay warnings en linter/tipo-check
4. ✅ Criterios específicos del documento se cumplen al 100%

---

*Bitácora maestra · Alquimia SLP · 14 junio 2026*

---

## ACTUALIZACIÓN · 15 JUNIO 2026 — REENCUADRE Y HOJA DE RUTA 3 DÍAS

**Decisión fundacional:** Alquimia = SECTOR_PACK_POLITICA_PUBLICA_RESIDUOS_MX sobre arquitectura Supermind. El "diagnóstico" = Fase 1 del Sector Pack. La "sub-app de planeación/ejecución" = Fases 2-4 del mismo pipeline.

**División por capacidad:**
- CODEX → backend (FastAPI), Neon, Render, integración de datos
- CLAUDE CODE → frontend (Next.js), lógica de agentes, esquemas, auditoría Zero Invention

**Disciplina Git decidida:** ramas de vida ultra-corta + merge verificado mismo día (NO commits directos a main crudo). Los dos agentes nunca tocan los mismos archivos el mismo día.

### HO-D1-CODEX · Status Backend
- **Archivo:** `documentos-pendientes/06_HANDOFF_CODEX_DIA1.md`
- **Objetivo:** baseline backend + estado de los 3 agentes de Fase 1
- **Status:** [EMITIDA]
- **Salidas esperadas:** status-backend.md, status-agentes-fase1.md

### HO-D1-CLAUDECODE · Status Frontend + Sector Pack
- **Archivo:** `documentos-pendientes/07_HANDOFF_CLAUDE_CODE_DIA1.md`
- **Objetivo:** baseline frontend + consolidar Sector Pack YAML formal
- **Status:** [EMITIDA]
- **Salidas esperadas:** status-frontend.md, sector_pack_residuos_mx_v1.yaml, sector-pack-gaps.md

### Gate Día 1 (Claude Master)
- Revisar 4 archivos de status + Sector Pack YAML
- DECISIÓN: ¿baseline limpio → procede Día 2? ¿o trabajo 3x → replanificar?

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — PLAN DEFINITIVO + PROTOCOLOS

**Documentos maestros añadidos:**
- `08_PLAN_DEFINITIVO_MATERIALIZACION.md` — plan 4-6 meses a primera venta. Stack real, calendario electoral corregido (elección 6-jun-2027, no apostar negocio a GOV), 4 hitos.
- `09_PROTOCOLO_SATURACION_CONTINUIDAD.md` — cómo relevar a Claude Master / Codex / Claude Code antes de saturarse. Los archivos recuerdan, no el agente.
- `10_MAPA_DE_TRABAJO_AGENTES.md` — lanzamiento paralelo GOV+Empresarial, separación total, especificación del agente ejecutor, token-eficiencia, tareas de integración del founder.

**Decisiones clave registradas:**
- Lanzamiento PARALELO: GOV-RSU (cerrando) + Empresarial (arrancando), separación total (`gov/` vs `empresa/`).
- Modo de operación: CALL ON REQUEST (orchestrator dispara módulos bajo demanda, no tiempo real).
- Negocio se apuesta a Empresarial (PyME), no a GOV (ventana electoral lo limita).
- Stack base = el del handoff Claude Code 14-jun (Postgres/Render, React-Vite/Vercel, Perplexity, Stripe). Migración Empresarial = decisión separada.

**TAREAS DEL FOUNDER PARA MAÑANA (16 jun):**
- A (bloqueante): destrabar CI GitHub (spending limit)
- B: integrar Greptile (navegación código, sustituye memoria de agente)
- C: confirmar acceso Render + logs + gate de merge con tests

**PENDIENTE de generar (cuando founder lo pida):**
- Handoff de las 5 tareas de cierre GOV (Hito 0) sobre stack real
- `10_TESIS_RED_ECONOMICA.md` — tesis 2 págs para socio/inversionista

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — RELEVO A COWORK + VERIFICACIÓN DEL REPO

**Relevo:** Claude Master pasó de sesión chat a Cowork, con acceso directo a la carpeta local y al repositorio. Se poblaron las 3 carpetas vacías de `etapa de cierre y apertura planeacion/` desde el ZIP fuente de verdad (00, 08, 09, 10, handoffs día 1, _superados_v1, este BITACORA).

**HALLAZGO CRÍTICO — la base "VERIFICADA" no coincide con el repo.** Primer acto en Cowork: contrastar docs vs código (Principio 2, anti-mentira). Resultado:
- Repo **congelado a mitad de un `git rebase`** (`codex/frontend-clean-origin`) desde 13-jun, conflicto sin resolver en `frontend/src/app/admin/page.tsx`. Árbol no limpio, no desplegable.
- Módulos del `HANDOFF_20260614` (`company_survey`, `obligation_matrix`, `container_inventory`, `models/container`, "1,062 tests") **no existen en el working tree ni en ninguna rama del historial.** Rama `claude/brave-tesla-bO6fE` no existe local ni en origin. Trabajo no localizable (otra máquina / branch sin push / perdido).
- `empresa/router.py` real implementa OTRA API (scian-factors + declaraciones + PDF), no la del handoff. Pero `pdf_perfil.py` da una base de PDF reusable.
- 96 archivos de test reales (suite no corrida: repo en rebase).

**Documentos nuevos (en DOCUMENTOS PENDIENTES):**
- `11_ESTADO_REAL_REPO_VERIFICADO_16jun.md` — la verdad medida del repo, con evidencia de comandos git.
- `12_HANDOFF_CIERRE_GOV_HITO0.md` — las 5 tareas de cierre GOV repartidas Codex/Claude Code, ramificadas por Escenario 1 (el trabajo aparece) / Escenario 2 (no aparece). Bloqueado por precondición.
- `BUENOS_DIAS_16JUN.md` (raíz) — brief de arranque para el founder con orden de bloqueantes corregido.

**ORDEN DE BLOQUEANTES CORREGIDO (reemplaza al de la actualización anterior):**
- 0 (nuevo, bloqueante): resolver el rebase congelado — decisión irreversible del founder.
- 0b (nuevo): localizar el trabajo del 14-jun (15 min); si no aparece → Escenario 2.
- 1: CI GitHub (spending limit). 2: Greptile. 3: Render + gate de merge.
- 4: comandar agentes con handoff `12` (bloqueado hasta 0-1).

### HO-D0-CODEX · Cierre GOV backend (PENDIENTE DE EMITIR)
- **Archivo:** `documentos-pendientes/12_HANDOFF_CIERRE_GOV_HITO0.md`
- **Objetivo:** T1 router+modelo ContainerInventory, T2 migración Alembic `containers`, T3-backend endpoints KPI
- **Status:** [PRE-EMISION] — bloqueado por precondición (rebase + Escenario + CI)

### HO-D0-CLAUDECODE · Cierre GOV frontend (PENDIENTE DE EMITIR)
- **Archivo:** `documentos-pendientes/12_HANDOFF_CIERRE_GOV_HITO0.md`
- **Objetivo:** T3-frontend pantallas KPI (con SCR previo), T4 ReportBuilder PDF (reusa pdf_perfil.py)
- **Status:** [PRE-EMISION] — bloqueado por precondición

**PENDIENTE de generar (cuando founder lo pida):** `TESIS_RED_ECONOMICA.md`, `COMPANY_PROFILE_JSON_SPEC.md` (ambos Hito 1).

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — ADR-001 + PRIMER TICKET EMITIDO

**ADR-001 (Proposed, rev.1):** `documentos-pendientes/13_ADR-001_ARQUITECTURA_EJERCITO_DE_AGENTES.md`. Decisión: fábrica declarativa de agentes (engine compartido + specs + catálogo por tiers + learning store externo), estadificada. rev.1 del founder: (1) catálogo NO cerrado — modelo de tiers (conocimiento/soluciones ABIERTOS y evolutivos; solo acciones irreversibles gobernadas; firewall: conocimiento abierto nunca dispara acción irreversible directa). (2) Dos clases de agentes: Class A (builder, backend, fijos-versionados) vs Class B (Jarvis del cliente, instanciado por tenant en la entrevista). Espera firma del founder para pasar a Accepted.

**Estado de conectores (16 jun):** GitHub = plugin instalado, requiere auth manual vía `/mcp` (el flujo OAuth automático no es compatible). Render = NO está en el registry; agregar como custom MCP `https://mcp.render.com/mcp`. Greptile = NO está en el registry; custom MCP o usar Sourcegraph/Glean como alternativa one-click. Vercel = ya conectado. **Ninguno instalable por Claude directo; son acciones del founder.**

### HO-D0-RECON · Reconocimiento READ-ONLY del repo (EMITIDA)
- **Timestamp:** 15 jun 2026 (noche)
- **Agente:** Codex (git/backend/infra)
- **Archivo:** `HANDOOF AGENTE DE CODIGO/HO-D0-RECON_CODEX_16jun.md`
- **Objetivo:** medir la verdad del repo sin tocar lo irreversible — confirmar estado de rebase, localizar (o descartar) el trabajo del 14-jun, dar veredicto Escenario 1/2, reportar conteo real de tests.
- **Status:** [EMITIDA] — es el PRIMER ticket. Read-only, no toca el rebase.
- **Bloques:** Ninguno (es diagnóstico; precede a todo).
- **Salida esperada:** `HANDOOF AGENTE DE CODIGO/RECON_RESULTADO_16jun.md` con salida real + veredicto + recomendación de salida del rebase (sin ejecutarla).
- **Desbloquea:** decisión del founder sobre el rebase (bloqueante 0) y Escenario (0b); luego CI; luego HO-D0-CODEX / HO-D0-CLAUDECODE del doc 12.

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — RENDER/GREPTILE CONECTADOS + SPEC 14 + GATE DE CONSTRUCCIÓN

**Conectores:** Render y Greptile YA conectados (MCP activos). Vercel conectado. GitHub pendiente de `/mcp` manual. Toolchain suficiente; no se añaden más (anti-dispersión).

**Decisión de secuencia (Claude Master frena al founder, constructivamente):** el founder pidió disparar prompts de construcción a Codex/Claude Code para crear todos los agentes/módulos ya. Se POSPONE por 3 razones: (1) repo aún en rebase; (2) no existe spec → los agentes improvisarían el diseño core (drift); (3) es Hito 1, GOV/Hito 0 cierra primero; ADR-001 sin firmar. La spec precede al código.

**Doc nuevo:** `documentos-pendientes/14_SPEC_AGENTES_Y_PROTOCOLO_DE_DECISION.md` (Draft). Operacionaliza ADR-001: schema declarativo de Agent Spec, **protocolo de decisión** (mindset predefinido: compuerta de insumos "qué necesito antes de asumir" + anclar a estándar vigente + firewall conocimiento-abierto/acción-irreversible), niveles L0–L3, ejemplo trabajado (edificio/obra), specs semilla (orchestrator, listener, sector, module.E1), y el agent-builder pospuesto al final.

**GATE de construcción (doc 14 §10) — los build-prompts a Codex/Claude Code se emiten SOLO cuando:** (1) HO-D0-RECON hecho + Escenario decidido; (2) rebase resuelto/repo limpio; (3) CI verde; (4) ADR-001 firmado; (5) spec 14 aprobada. Pendiente de founder: firmar ADR-001 y aprobar spec 14.

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — DIAGNÓSTICO NACIONAL + AUDITORÍA DE ARQUITECTURA

**Auditoría verificada contra el repo (no suposición):** el motor de diagnóstico RSU está MUCHO más construido de lo que los planes implicaban. Existen: `app/national/` (cobertura, huella, circularidad), adaptadores de datos (SEMARNAT, CONAPO, CONEVAL, INEGI/DENUE, SMN, Banxico), `app/standards/mapper.py` (GRI 306/SASB/ODS/ISO 9001). PERO sembrado solo para 4 ZMs (~11 municipios) vs 2,469 nacionales. El motor está terminado; la cobertura nacional NO.

**Doc 15** `15_DIAGNOSTICO_RSU_NACIONAL_INSTRUCCIONES.md`: gap analysis + instrucciones por olas (4 ZMs → ~80 ZMs → cola larga) + tickets Codex/Claude Code + APIs a encender en Render + criterio "sistemas operativos". Clave: `CoverageStatus` honesto (VERDE/AMARILLO/ROJO), nunca inventar cobertura; reglamentos vía Serper+Anthropic (Perplexity sigue diferido) con gate humano.

**Doc 16** `16_AUDITORIA_ARQUITECTURA_Y_SOLUCION.md`: inventario datasets/APIs (wired/diferido/faltante), flujo completo entrevista→Profile→orchestrator→sector→módulo→Jarvis→demo (cada flecha = contrato, no supuesto), decisiones de build resueltas para que los agentes no improvisen, ángulo "consultoría instantánea" (moat = grafo+procedencia+instantaneidad, vs consultoría tradicional). 

**5 decisiones de negocio pendientes del founder (doc 16 §5):** alcance Ola 1; primer módulo Empresarial (E1 vs entrevistas); persistencia del Jarvis; conectores cliente prioritarios; Perplexity sí/no.

**Contratos pendientes a escribir (Hito 1, orden en doc 16 §7):** COMPANY_PROFILE_JSON_SPEC (desbloquea más), lista reversible/irreversible, reglas orchestrator/sector, lifecycle Jarvis, router de capacidades.

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — PROMPTS DE DIAGNÓSTICO EMITIDOS

**Archivo:** `HANDOOF AGENTE DE CODIGO/HO-DIAG_PROMPTS_CODEX_Y_CLAUDECODE.md`. Prompts paste-ready, autocontenidos, grounded en paths reales del repo.

### HO-DIAG-CODEX · Backend ingesta nacional (PROMPT LISTO)
- Tareas: T1 catálogo nacional 2,469 CVE INEGI (empieza aquí, determinista) → T2 ingesta por adaptador con procedencia/caché → T3 cobertura honesta → T4 pipeline reglamentos (Serper+Anthropic, gate humano) → T5 endpoints nacionales. Olas: 4 ZMs+estados primero.
- **Step 0 de seguridad embebido:** el agente PARA si el repo está en rebase. Protege contra el árbol congelado.
- **Status:** [PROMPT LISTO] — disparable en cuanto el repo esté limpio + CI verde.

### HO-DIAG-CLAUDECODE · Frontend mapa nacional + auditoría (PROMPT LISTO)
- Tareas: T1 SCR (en paralelo, no depende de backend) → T2 mapa+semáforo honesto → T3 ficha municipal+PDF (reusa pdf_perfil.py) → T4 tablero estándares.
- **Status:** [PROMPT LISTO].

**Orden de disparo:** (si rebase) RECON→resolver→CI; luego Codex T1 + Claude Code T1-SCR en paralelo; resto por olas. Codex backend, Claude Code frontend, nunca mismos archivos el mismo día.

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — CONTRATO PERMANENTE DE EJECUCIÓN

**Archivo:** `HANDOOF AGENTE DE CODIGO/REGLAS_DE_EJECUCION_AGENTES.md` (v1.0). El rigor vive aquí, no en cada prompt → prompts del founder pasan a ser de UNA LÍNEA.
- Firewall reversible/irreversible (libre en lectura/borrador; gate en merge/force-push/rebase/destructivo/env-prod/deploy).
- Anti-desastre GitHub (nunca commit a main, rama corta, PR con tests reales, para si hay rebase) + Render (libre logs/métricas; gate en crear/borrar servicios, env vars prod, migraciones).
- Uso esperado de herramientas (Greptile para navegar, Render para logs). Procedencia obligatoria. DoD. Handoff al cerrar.
- **Setup:** colocar como `AGENTS.md` (Codex) + referenciar desde `CLAUDE.md` (Claude Code) + `.cursor/rules` para auto-carga. Microtarea cuando el repo esté limpio.
- **Formato mínimo de prompt:** "Lee REGLAS y [DOC]. Ejecuta [TAREA]. Reporta con tests."

---

## ACTUALIZACIÓN · 17 JUNIO 2026 — INTEGRACIONES EN USO + LINEAR POBLADO

**Conectado y verificado:** Linear (equipo Alquimiaplatform), Stripe (cuenta "Alquimia"), Greptile, Render, Vercel. Claude Agent SDK instalado. Secrets/env en repo+Render.

**Linear poblado (USANDO la herramienta):** proyecto "Hito 0 — Cierre GOV + Diagnóstico RSU Nacional" + 8 issues: ALQ-5 RECON, ALQ-6 rebase, ALQ-7 seguridad+CI, ALQ-8 memoria repo, ALQ-9 DIAG T1, ALQ-10 DIAG T2+T3, ALQ-11 DIAG T5, ALQ-12 frontend. Espejo del kanban .md.

**Doc 20** `20_STACK_INTEGRACION_Y_AUTOMATIZACION.md`: **trampa del SDK** — el Claude Agent SDK cobra API Anthropic = el costo que no podemos pagar → NO prender agentes SDK always-on; diseñar y construir con presupuesto. Automatización GRATIS hoy = Codex+Claude Code (subscripción) + Linear + Greptile (PR review) + Render + Claude Master. Stripe = listo pero Hito 2. Primer agente SDK diseñado (`auditor-cumplimiento`, gated; Greptile cubre gratis por ahora). Recomendación: no instalar más herramientas.

---

## ACTUALIZACIÓN · 17 JUNIO 2026 — PLAN DE 2 SEMANAS EN LINEAR + REGLAS rev.

**REGLAS rev.:** §1 reforzado — mentalidad permanente de "mejor programador + crítico" (cuestiona, propone la mejor solución no la primera, señala trade-offs). Nadie debe recordárselo. Aplica a Codex, Claude Code y Claude Master.

**Linear con plan completo de 2 semanas (16 issues, 2 milestones):**
- **Semana 1 (Recuperación + Fundaciones + GOV backend):** ALQ-5 RECON, ALQ-6 rebase, ALQ-7 seguridad+CI, ALQ-8 memoria repo, ALQ-9 DIAG T1, ALQ-13 router ContainerInventory+Alembic, ALQ-14 KPI backend.
- **Semana 2 (Diagnóstico nacional + Frontend + Auditorías):** ALQ-10 ingesta+cobertura, ALQ-11 endpoints, ALQ-12 mapa+semáforo, ALQ-15 ReportBuilder PDF, ALQ-16 Design System, ALQ-17 Greptile PR gate, ALQ-18 audit seguridad, ALQ-19 audit procedencia, ALQ-20 audit accesibilidad.
- **Asignación fija:** Codex=backend, Claude Code=frontend. Cada issue trae prompt de una línea + criterios. Auditorías de código incluidas. Estándares de diseño en ALQ-16 (DESIGN_SYSTEM.md, WCAG AA).

---

## ACTUALIZACIÓN · 17 JUNIO 2026 — CIERRE DE ARQUITECTURA (doc 23)

**Web research (jun 2026) para cerrar decisiones abiertas:** voz a bajo costo (STT Whisper-class hospedado ~$0.003–0.006/min; TTS open-source MeloTTS/XTTS ≈$0 edge; self-host STT solo a 3,000+ hrs/mes) y evidencia multimodal (vision-LLM Llama 3.2 Vision / hospedado, JSON, 95–99%). Voz y visión: asequibles, diferidas, sin infra cara.

**Doc 23 = CIERRE DE ARQUITECTURA.** Canon consolidado + nuevo alcance:
- **Interacción por empleado:** Jarvis (Class B) por empleado, comando+conversación, modality-agnostic (texto hoy → voz después).
- **Evidencia:** el agente arma archivo con el usuario + fotos → extracción por visión → procedencia → propuesta → **gate en lo irreversible** (ej. solicitar camión nuevo). Ejemplo del camión como ancla.
- **Alcance UNIVERSAL + auto-construcción + organigrama (§1B):** el sistema se construye solo para CUALQUIER sector — LISTENER entrevista → ORG_BUILDER arma organigrama y mapea rol→Jarvis → SECTOR activa módulos → fábrica instancia la malla. Sector-agnóstico porque el patrón es agnóstico (doc 22). El organigrama auto-generado = el mejor demo. Es la PROMESA de la arquitectura; se PRUEBA con RSU + 1 módulo + ORG_BUILDER (Hito 1), no construyendo cada sector.
- **Piloto GOV-RSU:** diagnóstico nacional + flujo de evidencia (camión) = demo de consultoría+operación instantánea.

**Linear nuevos (backlog/Hito 1, NO Hito 0):** ALQ-22 Auto-construcción + ORG_BUILDER (organigrama). (ALQ-21 inteligencia competitiva sigue en backlog.)

**ESTADO:** arquitectura CERRADA. Programar = disparar issues de Linear a ejecutores. Primero ALQ-5 (RECON) a Codex. Hito 0 intacto; voz/evidencia/org-builder = Hito 1.

---

## ACTUALIZACIÓN · 17 JUNIO 2026 — ESTÁNDAR FRONTEND CONFIRMADO + PIPELINE CLAUDE MASTER

**Estándar frontend CONFIRMADO contra el repo (no de palabra):** existe y está documentado.

---

- `docs/architecture/FASE8_AUDITORIA_VISUAL_MINTO_MCKINSEY.md` — minimalista McKinsey/Minto: reporte ejecutivo (conclusión→cifra→evidencia→tabla limpia), SIN cajas decorativas, color solo para estado/cifra/riesgo. Estado: cerrado para módulos auditados (28-may), parcial/no exhaustivo (limitaciones §6).
- `cursor-rules/OLD/AESTHETE-1.md` — constitución estética+a11y: WCAG **2.2** AA piso, OKLCH, NarrativeBridge por cifra, tokens W3C, ISO 9241, Nielsen, Tufte, Bringhurst.
- `25_tokens_y_design_as_code.md` (tokens) + `FRONTEND DEFINITIVO/` (MODULE_MAP + mockups).
- **CORRECCIÓN de error:** mis issues decían WCAG 2.1 → es **2.2**. ALQ-16 y ALQ-20 corregidos para apuntar a estas fuentes canónicas.
- **Honesto:** el estándar está confirmado; APLICARLO a las pantallas nuevas del diagnóstico sigue pendiente (ALQ-16/20). No prometo "cero errores", pero el plan ya apunta a la fuente real, no a un genérico.

**Pipeline Claude Master en Linear (milestone "Hito 1 — Contratos de diseño"):** ALQ-23 COMPANY_PROFILE_SPEC → ALQ-24 Agent Spec schema → ALQ-25 reversible/irreversible → ALQ-26 ORCHESTRATOR/SECTOR → ALQ-27 Jarvis lifecycle + router capacidades → ALQ-28 MASTER_SYSTEM+DATA_MODEL → ALQ-29 evidencia spec. + ALQ-22 ORG_BUILDER. Son los .md que Claude Master escribe cuando GOV cierre, en orden de dependencia (COMPANY_PROFILE primero).

---

## ACTUALIZACIÓN · 17 JUNIO 2026 — ALQ-31 LÍNEA BASE REAL DE TESTS BACKEND

**Issue Linear:** ALQ-31 · Fijar línea base de tests.

**Objetivo:** reemplazar el conteo no verificado de "1,062 tests" por evidencia real de suite backend.

**Comando local ejecutado por Codex (CI-equivalente, con SQLite):**

```bash
DATABASE_URL='sqlite:///./alquimia_ci.db' SECRET_KEY='alquimia-secret-dev-local' PYTHONPATH='/Users/braulioromerobarcena/Documents/alquimia-slp/backend' backend/.venv/bin/pytest backend/tests/ -q
```

**Salida real resumida:**

```text
965 passed, 44 skipped, 116 warnings in 17.34s
```

**Confirmación remota GitHub Actions:** PR #29, workflow run `27717922975`, job `checks`, step `Backend — venv, deps, pytest` terminó en `success` sobre commit `4a979b4b1837d3385e0b82a6d36675d8fd726b50`.

**Estado honesto:** la línea base backend queda fijada en **965 tests passed + 44 skipped**. El CI global del PR #29 aún NO está verde porque falla el step frontend `Frontend — npm ci, TypeScript, Vitest` con 8 fallos en guardrails/contexto cliente. No palomear tareas como Done hasta que ese gate quede resuelto y Greptile pueda revisar.

---

## ACTUALIZACIÓN · 17 JUNIO 2026 — REGLA DE PALOMITA (DoD por tarea) + LINEAR COMO CHECKLIST

**REGLAS §7 reforzado:** la palomita se gana. Ciclo obligatorio por tarea: **codificar → auto-auditar (checklist §7B) → corregir → PR con review Greptile + CI verde → palomear (Done) → siguiente.** No se avanza con la tarea anterior sin auditar. Auto-auditoría = el agente es su propio crítico más duro (tests reales, procedencia, honestidad, prohibidos, frontend WCAG 2.2/editorial, relectura del diff). La auditoría deja de ser solo issues finales (ALQ-18/19/20) y pasa a ser gate de CADA tarea.

**Linear convertido en checklist guiado:** cada issue ejecutable (ALQ-5…20) reescrito con 👤 quién · 📋 PROMPT para pegar · 🎯 qué · ✅ hecho cuando, y encadenado por blockedBy. CM (23–29) encadenados desde ALQ-23. Flujo: abrir issue desbloqueado → pegar PROMPT al agente → al cumplir DoD palomear → desbloversiona el siguiente. Arranque único: ALQ-5 (RECON) → Codex.

---

## ACTUALIZACIÓN · 17 JUNIO 2026 (tarde) — HITO 0 EN MARCHA + VEREDICTO RECON

**Completado y palomeado en Linear:** ✅ ALQ-5 RECON · ✅ ALQ-6 rebase resuelto (repo limpio, rama codex/frontend-clean-origin) · ✅ ALQ-7 CI · ✅ ALQ-8 memoria repo (AGENTS.md, CLAUDE.md, .cursor/rules/agents-contract.mdc, CODEMAP.md, memory/ — verificados en working tree) · ✅ ALQ-17 Greptile gate. Claude Code → ALQ-16 In Progress.

**VEREDICTO RECON = ESCENARIO 2 (verificado en RECON_RESULTADO_16jun.md):** el trabajo del handoff 14-jun (company_survey, container_inventory, container.py, tests) NO se localiza en refs ni stashes. → GOV close se **construye desde cero** sobre la base SCIAN/declaraciones existente. ALQ-13 actualizado a Escenario 2 (construir modelo+servicio+router+migración). Implicación: el sprint de GOV es más grande de lo que asumía "exponer lo existente"; la estrategia (08/10) no cambia.

**Pendiente de fijar:** `pytest` NO se corrió en RECON (estaba bloqueado por el rebase). Ahora que el repo está limpio, correrlo para registrar el conteo REAL de tests (reemplaza el "1,062" no verificado).

**Automatización de Claude Code CONFIRMADA:** CLAUDE.md auto-carga AGENTS.md + REGLAS (fuente canónica) → mentalidad/firewall/palomita cargados solos; CI + Greptile como gates independientes; repo limpio. Claude Code puede correr el ciclo autónomo (rama → auto-audit → PR → Greptile+CI → merge gated → deploy Vercel) en sus carriles (frontend/). Merge a main + deploy = gate del founder.

---

## ACTUALIZACIÓN · 17 JUNIO 2026 (tarde) — ROADMAP COMPLETO MATERIALIZADO EN LINEAR + ESTÁNDAR DE MERCADO

**Linear ahora cubre TODO el roadmap (6 milestones):** Semana 1, Semana 2, Hito 1 (contratos CM 22-29), **Hito 2** (ALQ-36–41: engine+LISTENER, ORCHESTRATOR/SECTOR, 1º módulo BE/FE, onboarding+Vercel separado, 🎯 1 PyME pagando = auto-sostenible), **Hito 3** (ALQ-42–45+34: fiscal 18-J LIVA/CFDI Carta Porte, COMMERCE_AGENT+marketplace verificado, E2 Sankey, 🎯 primer deal real), **Producción/Calidad cross-cutting** (ALQ-46 observabilidad+Sentry, ALQ-47 backups/DR+performance). Hitos futuros = EPICS; se desglosan al entrar (doc 17).

**Estándar elevado (por petición del founder): NIVEL MERCADO, NO MVP GENÉRICO.** Añadido a la descripción del proyecto Linear: producción real, no demo; procedencia + WCAG 2.2 AA + tests + seguridad + observabilidad por defecto; "funciona en mi máquina" no es Done. CI bloqueado (ALQ-7) sigue siendo el bloqueante operativo del momento → founder hace el repo público.

---

## ACTUALIZACIÓN · 17 JUNIO 2026 (tarde) — BARRIDO DE COMPLETITUD + ANTI-REGRESIÓN + NAVEGACIÓN

**Doc 28 (inventario paranoico de specs):** barrido exhaustivo de superficies/funciones/agentes/módulos de RSU→fin. 9 huecos detectados → **ALQ-48..56**: perfil UI, organigrama UI, 🔴 bandeja de aprobación/gate (la más crítica, donde aterriza el firewall), RBAC, conectores cliente, notificaciones, visor de procedencia/audit, privacidad LFPDPPP, Module Registry. Los "cientos de giros" NO se enumeran: se garantiza fábrica + Module Registry.

**Anti-regresión (REGLAS §3B nuevo):** entender antes de editar (Greptile), no sobrescribir código que funciona, diff atómico, no green→red, no refactor fuera de alcance, backward-compatible, parar si el cambio se vuelve bola de nieve. + **ALQ-58** guardarraíl en CI (branch protection: no merge si rompe tests/baja cobertura).

**Calidad (REGLAS §1 reforzado):** mentalidad "mejor programador + revisor + consultor élite + diseñador, nivel McKinsey/Minto; la paranoia en buen sentido = garantía del producto".

**Navegación (ALQ-57):** spec de Arquitectura de Información + navegación fácil como red social, sobre AESTHETE-1/Nielsen/ISO 9241, SUS≥80.

**Docs nuevos:** 26 (estimación), 27 (trazabilidad de 43 ideas), 28 (inventario). Total roadmap en Linear: ALQ-5..58.

---

## ACTUALIZACIÓN · 15 JUNIO 2026 (noche) — ESTRATEGIA DE MEMORIA Y VELOCIDAD + TABLERO

**Doc 17** `17_GOBERNANZA_DOCUMENTAL_Y_CADENCIA.md`: kanban de carpetas, ciclo de vida del .md (DRAFT→APPROVED→EMITIDA→EN_EJECUCION→EJECUTADO→movido), mapa de cadencia por hito, lazo continuo de Claude Master. **Tablero vivo** `_INDICE_ESTADO.md` (raíz) creado.

**Doc 18** `18_ESTRATEGIA_MEMORIA_Y_VELOCIDAD_AGENTES.md`: reframe de partner — el cuello de botella es MEMORIA, no herramientas. Dos capas: (1) memoria de código = Greptile + `CODEMAP.md`; (2) memoria de decisión = `AGENTS.md`/`CLAUDE.md` + `memory/` (glossary, decisions/ADRs, gotchas) + bitácora/índice. Disciplina: agente lee memoria chica + consulta Greptile, nunca el repo entero. **Qué instalar:** solo GitHub/CI + caché (lo demás ya está); NO agregar memoria-DB ni tracker todavía (anti-dispersión). Microtareas reversibles para plantar AGENTS.md/CODEMAP/memory cuando el repo esté limpio.
