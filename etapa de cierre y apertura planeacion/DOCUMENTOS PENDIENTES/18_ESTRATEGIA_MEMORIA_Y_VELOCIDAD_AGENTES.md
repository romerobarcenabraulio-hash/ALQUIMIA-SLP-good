# 18 · ESTRATEGIA DE MEMORIA Y VELOCIDAD DE LOS AGENTES DE CÓDIGO
**Fecha:** 15 jun 2026 (noche)
**Autor:** Claude Master (Cowork) — como partner, no como ejecutor ciego
**Propósito:** Que los coders (Codex, Claude Code, Cursor) sean rápidos y baratos, sin perder rigor. Resolver el problema real de "índice y memoria".

---

## 1. DIAGNÓSTICO HONESTO (el reframe de partner)

Tu instinto fue "¿qué herramientas instalo para que los coders sean más rápidos?". Te freno ahí: **el cuello de botella no es falta de herramientas; es falta de memoria.** Los agentes son lentos/caros por tres causas, y ninguna se arregla comprando:

1. **Contexto recargado:** cargan el repo entero / el transcript en cada llamada.
2. **Memoria perdida:** olvidan decisiones entre sesiones → re-litigan, se contradicen.
3. **Re-derivación:** recalculan o re-leen lo que ya se sabía.

Más MCPs no arreglan esto; suman superficie que mantener. Ya tienes lo que importa: **Greptile** (navegar sin cargar) y **Render** (verdad de runtime). Lo demás es **convención + archivos**, no compras. Esa es la estrategia.

---

## 2. LAS DOS CAPAS DE MEMORIA (el corazón de la solución)

| Capa | Qué recuerda | Mecanismo | Quién la mantiene |
|---|---|---|---|
| **Memoria de CÓDIGO** | dónde está cada cosa, qué hace | **Greptile** (búsqueda semántica) + **`CODEMAP.md`** (índice del repo) | Codex, vía Greptile |
| **Memoria de DECISIÓN/CONTEXTO** | por qué se hizo así, convenciones, glosario, gotchas | **`AGENTS.md`/`CLAUDE.md`** (working memory) + **`memory/`** (base de conocimiento) + bitácora + `_INDICE_ESTADO` | Claude Master |

**Regla de oro:** el agente lee la memoria CHICA (AGENTS.md + el .md de su tarea) y **consulta Greptile** para el código. **Nunca carga el repo entero ni el transcript.** Eso solo, baja el costo de $$$ a $.

---

## 3. CÓMO QUEDA LA MEMORIA EN EL REPO (estructura objetivo)

```
repo/
├── AGENTS.md          ← working memory de Codex. = REGLAS_DE_EJECUCION + cómo correr + convenciones
├── CLAUDE.md          ← working memory de Claude Code. Referencia a AGENTS.md + specifics frontend
├── .cursor/rules/     ← mismas reglas para Cursor
├── CODEMAP.md         ← índice del código: qué hay en cada paquete y su rol (tabla de contenidos)
└── memory/
    ├── glossary.md    ← términos del dominio (RSU, RPBI, REPAS, SCIAN, ZM, ÁGORA, HERMES…)
    ├── decisions/     ← ADRs (ADR-001…) — por qué se eligió X
    └── gotchas.md     ← trampas ya encontradas (ej. 'metadata' reservado en SQLAlchemy; el rebase del 13-jun)
```

- **AGENTS.md/CLAUDE.md** = working memory: corta, siempre cargada, dice cómo comportarse + cómo correr + dónde mirar.
- **memory/** = base de conocimiento: se consulta cuando hace falta, no se carga entera.
- **CODEMAP.md** = el "índice" que pediste: la tabla de contenidos del código, para que un agente nuevo sepa dónde está todo sin escanear 60 paquetes.

(Patrón de dos niveles — working memory + knowledge base — es el mismo de la metodología de memory-management. Probado.)

---

## 4. LA DISCIPLINA QUE LO HACE RÁPIDO (ya casi toda construida)
- **Spec antes de código** (doc 14): el agente implementa un contrato, no explora.
- **Prompts de una línea** + contrato permanente (REGLAS): cero preámbulo, cero re-explicación.
- **Tests/CI = fuente de verdad:** el agente corre tests, no re-lee para "verificar".
- **Greptile PR review:** atrapa drift automáticamente, sin que un humano re-lea todo.
- **Handoff al cerrar** (doc 09): la siguiente sesión retoma sin re-derivar.
→ El agente: lee memoria chica → consulta Greptile → ejecuta contra spec → corre tests → handoff. Nunca "se aprende el repo".

---

## 5. QUÉ INSTALAR (corto y justificado — anti-dispersión)

| Acción | ¿Vale la pena? | Por qué |
|---|---|---|
| **GitHub vía `/mcp` + CI** | SÍ (pendiente) | sin CI no hay gate de merge; con CI, caché de dependencias = tests rápidos |
| **Caché de CI** (deps + build) | SÍ, al encender CI | corta minutos por corrida |
| **Greptile** | YA ✓ | navegación = memoria de código |
| **Render** | YA ✓ | logs/métricas = verdad de runtime |
| **MCP de memoria/vector dedicado** | NO (todavía) | el repo-como-memoria + Greptile cubren; una DB de memoria extra es complejidad prematura |
| **Tracker (Linear/Asana)** | NO (aún) | la bitácora + índice .md ya hacen el kanban; agrega cuando la cola lo exija |

**Veredicto de partner:** no compres más. Instala GitHub/CI (lo que falta) y construye las dos capas de memoria con archivos. Eso da el 90% de la velocidad con el 10% de la complejidad.

---

## 6. ACCIONES CONCRETAS (microtareas reversibles, una línea cada una)
1. *"Lee REGLAS. Copia el contrato a `AGENTS.md` (raíz) y referéncialo desde `CLAUDE.md` y `.cursor/rules`. Reporta."*
2. *"Lee REGLAS. Genera `CODEMAP.md` navegando el repo con Greptile: una línea por paquete de `app/` con su rol. Reporta."*
3. *"Lee REGLAS. Crea `memory/` con `glossary.md`, `decisions/` (mueve ADR-001 aquí), `gotchas.md` (siembra: 'metadata' reservado, rebase 13-jun). Reporta."*
4. Confirmar que Greptile está indexando la rama `main` del repo.
5. Al encender CI: activar caché de dependencias.

(Todas son ediciones de docs/config = reversibles. Se hacen cuando el repo esté limpio.)

---

## 7. MÉTRICA DE ÉXITO (para saber si funcionó)
- ↓ tiempo y tokens por ticket (mismo trabajo, menos contexto cargado).
- **Cero contradicciones** entre sesiones (la memoria evita re-litigar).
- Un agente nuevo retoma con solo `AGENTS.md` + `CODEMAP.md` + su ticket. Si necesita más, falta memoria → se añade.

---

## 8. CODEMAP SEMILLA (lo que ya verifiqué del repo — Codex lo completa)
Para no empezar de cero, esto es real (verificado en `backend/app/`):

- `national/` — diagnóstico RSU nacional: cobertura, huella, circularidad (grid/heatmap), ingesta legal.
- `city/` — catálogo municipal CVE INEGI, repos municipales.
- `data/` + `data/adapters/` — fuentes oficiales: SEMARNAT, CONAPO, CONEVAL, INEGI, DENUE, SMN, Banxico.
- `research/` — Serper + Anthropic (ÁGORA) con caché; Perplexity diferido.
- `standards/` — KPI → GRI 306 / SASB / ODS / ISO 9001.
- `centros_acopio/` — sync nacional, geocoding, grafo de infraestructura, Places/DENUE.
- `empresa/` — SCIAN, declaraciones RSU, PDF (`pdf_perfil.py`).
- `statistical/` — PERT/CPM, Monte Carlo, multiplicadores I-O (cálculo determinista).
- `routers/` — endpoints (incl. `payments.py`, `stripe_webhooks.py`).
- `waste_flows/`, `residue_tracking/`, `market/`, `scenarios/`, `reasoning/`, `predios/` — completar con Greptile.

---

*18 · Estrategia de Memoria y Velocidad · Alquimia Supermind · 15 jun 2026 (noche)*
