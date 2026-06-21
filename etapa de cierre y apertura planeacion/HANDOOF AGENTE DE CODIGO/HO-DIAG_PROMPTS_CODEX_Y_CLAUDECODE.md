# HO-DIAG · PROMPTS PASTE-READY — DIAGNÓSTICO RSU NACIONAL
**Emitido por:** Claude Master (Cowork) · 15 jun 2026 (noche)
**Base:** `15_DIAGNOSTICO_RSU_NACIONAL_INSTRUCCIONES.md` + `14_SPEC...` (procedencia)
**Stream:** GOV-RSU. No toca `empresa/`.
**Cómo usar:** copia el bloque de cada agente y pégalo. El **Step 0** de cada prompt protege contra el repo en rebase: si el árbol no está limpio, el agente PARA y te avisa. Empieza por **Codex T1** (es la base, sin dependencias externas).

---

## ⚙️ PROMPT PARA CODEX — BACKEND / INGESTA NACIONAL

```
Eres Codex trabajando en el repo alquimia-slp. Stack: FastAPI + SQLAlchemy + Alembic
sobre PostgreSQL (Render); en tests SQLite. Dominio: backend/datos/migraciones. NO toques frontend/.

REGLAS DURAS (no negociables):
- Procedencia obligatoria: cada valor que persistas trae source + fecha + método. Si falta un dato
  verificable, lo pides o lo marcas pendiente; NUNCA lo inventas (if_missing ∈ {ask, escalate, block}).
- Determinista sin LLM para catálogo, factores, cobertura y cálculo. El LLM (Anthropic) SOLO para
  síntesis de texto, y tras caché. Perplexity está DIFERIDO: no lo uses.
- Git: git pull origin main; rama de vida corta por tarea (ej. feat/diag-nacional-catalogo);
  build+lint+tests verdes antes de merge; pega la salida REAL de `pytest -q` (anti-mentira); merge el mismo día.
- Cobertura honesta: nunca marques VERDE sin datos+legal verificados. AMARILLO = datos sí, legal pendiente. ROJO = sin datos.

STEP 0 — SEGURIDAD (hazlo primero, siempre):
- `git status`. Si dice "rebasing" o hay conflictos sin resolver, PARA y reporta al founder. NO continúes.
- Si el árbol está limpio: `git checkout main && git pull origin main`, crea tu rama y sigue.

CONTEXTO DEL CÓDIGO EXISTENTE (úsalo, no lo reinventes):
- app/city/municipios_mx.py  → catálogo municipal CVE INEGI (hoy ~11 municipios sembrados).
- app/national/coverage.py    → coverage_for_municipio() y coverage_for_zm() + CoverageStatus.
- app/national/rsu_footprint_map.py, circularity_heatmap.py, zm_circularity_grid.py → diagnóstico.
- app/data/adapters/          → SEMARNAT, CONAPO, CONEVAL, INEGI, DENUE, SMN, Banxico (ya existen).
- app/data/registry.py        → DataRegistry (registro de fuentes/KPIs).
- app/standards/mapper.py     → KPI → GRI 306 / SASB EM-WM / ODS / ISO 9001.
- app/research/               → Serper+Anthropic con caché (para reglamentos).

TAREAS (en orden; cada una es un PR; NO hagas las 2,469 de golpe):

T1 — CATÁLOGO NACIONAL (empieza aquí; determinista, sin dependencias externas):
  Pobla municipios_mx con los 2,469 municipios reales (CVE INEGI, entidad 2 dígitos + municipio 3 dígitos)
  desde el catálogo INEGI MGN. Estructura por estado. Tests: conteo por entidad y total nacional.
  Entrega: el catálogo nacional consultable + tests verdes (pega la salida).

T2 — INGESTA POR ADAPTADOR (con caché y procedencia):
  Para cada municipio: población/proyección (CONAPO), marginación (CONEVAL), generación RSU
  (SEMARNAT DBGIR + factor por población), centros de acopio (DENUE), clima (SMN), costos (Banxico).
  Persiste cada valor con source+fecha+método. Caché para no re-pegar a las APIs. Sin LLM.
  Env vars a usar (confirmadas en Render): INEGI_API_TOKEN, INEGI_DENUE_TOKEN, BANXICO_TOKEN, etc.

T3 — COBERTURA A ESCALA:
  Corre coverage_for_municipio sobre el catálogo. Asigna CoverageStatus real (VERDE/AMARILLO/ROJO).
  Donde no haya reglamento, AMARILLO. Nunca inventes cobertura. Endpoint de resumen por estado/ZM/nacional.

T4 — PIPELINE LEGAL DE REGLAMENTOS (la brecha):
  Usa app/research/ (Serper + Anthropic, con caché DB <6h) para buscar el reglamento de aseo/RSU por municipio.
  Salida = borrador con URL fuente. NO marca VERDE automáticamente: deja el registro en estado "pendiente de
  revisión humana". El gate humano lo aprueba. Perplexity sigue apagado.

T5 — ENDPOINTS NACIONALES:
  Footprint map, circularity grid y coverage summary a nivel estado/ZM/nacional, sirviendo datos reales.

DISCIPLINA DE OLAS (anti-dispersión):
  Ola 1 PRIMERO = las 4 ZMs actuales (SLP, QRO, MTY, GDL) + completar sus 4 estados. Valida el pipeline.
  No avances a más estados hasta que Ola 1 corra verde en CI y el founder valide una muestra.

CRITERIOS DE ACEPTACIÓN (por PR):
  [ ] Tests verdes con salida real pegada.
  [ ] Cada dato persistido con procedencia.
  [ ] CoverageStatus honesto (sin invención).
  [ ] Rama corta mergeada a main con descripción clara.
  Al cerrar sesión: commit de todo + handoff de relevo en "HANDOOF AGENTE DE CODIGO/" con qué quedó y qué falta.
```

---

## 🎨 PROMPT PARA CLAUDE CODE — FRONTEND MAPA NACIONAL + AUDITORÍA

```
Eres Claude Code en el repo alquimia-slp. Stack: React/Vite (Vercel). Dominio: frontend/, specs SCR,
auditoría de procedencia. NO toques backend/app/ core (es de Codex).

REGLAS DURAS:
- Sin SCR aprobado, no se abre ticket de UI. Escribe el SCR_*.md de cada pantalla ANTES de codear.
- Auditoría de procedencia: cada cifra mostrada enlaza su fuente. Sin fuente → NO se muestra como dato duro.
- La honestidad de cobertura es feature: el AMARILLO/ROJO debe verse claramente, no esconderse.
- Git: rama corta, build+lint verdes antes de merge, pega el resultado, merge mismo día.

STEP 0 — SEGURIDAD:
- `git status`. Si "rebasing" o conflictos sin resolver, PARA y avisa al founder. Si no, checkout main + pull, crea rama.

CONTEXTO:
- El backend (Codex) expone: footprint map, circularity grid, coverage summary (estado/ZM/nacional),
  ficha municipal, y mapeo de KPIs a estándares (GRI 306/SASB/ODS/ISO 9001 vía app/standards/mapper.py).
- Patrón de PDF ya existente: backend empresa/pdf_perfil.py + endpoint /empresa/declaraciones/{id}/pdf → REUSA ese patrón.

TAREAS:
T1 — SCR (primero): escribe SCR de: (a) mapa nacional de huella RSU, (b) semáforo de cobertura por estado,
     (c) ficha municipal, (d) tablero de estándares. Apruébalos con el founder antes de codear.
T2 — Mapa nacional + semáforo: render del CoverageStatus con colores honestos (verde/amarillo/rojo visibles).
T3 — Ficha municipal: muestra datos con su procedencia enlazada; alimenta el ReportBuilder PDF (reusa pdf_perfil.py).
T4 — Tablero de estándares: cada KPI con su disclosure GRI/SASB/ODS/ISO y su cita.

CRITERIOS DE ACEPTACIÓN:
  [ ] SCR aprobado antes de cada pantalla.
  [ ] Cada cifra enlaza su fuente; sin fuente no se muestra como dato duro.
  [ ] Cobertura AMARILLA/ROJA visible y clara.
  [ ] Build verde, rama mergeada con descripción.
  Al cerrar: commit + handoff de relevo en "HANDOOF AGENTE DE CODIGO/".
```

---

## ORDEN DE DISPARO RECOMENDADO
1. (Si el repo aún está en rebase) Primero `HO-D0-RECON` → resolver rebase → CI verde.
2. **Codex T1** (catálogo nacional) — el primer código, sin dependencias. Empieza aquí.
3. Claude Code **T1 SCR** en paralelo (no depende del backend limpio).
4. Codex T2→T5 por olas; Claude Code T2→T4 conforme Codex expone endpoints.
5. Regla de no-colisión: Codex en backend, Claude Code en frontend, nunca los mismos archivos el mismo día.

---

*HO-DIAG Prompts · Alquimia Supermind · 15 jun 2026 (noche)*
