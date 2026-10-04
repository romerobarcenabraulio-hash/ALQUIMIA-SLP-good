# 19 · MODO COSTO-CERO — CONSTRUIR GASTANDO ~$0 HASTA LA PRIMERA VENTA
**Fecha:** 15 jun 2026 (noche)
**Autor:** Claude Master (Cowork) — verificado contra el repo
**Disparador:** "no puedo poner la API key de Anthropic, no tengo dinero." → Aclaración + modo de operación sin presupuesto.

---

## 1. LA CONFUSIÓN, RESUELTA (verificado en tu `ci.yml`)

**El CI de GitHub NO necesita la API key de Anthropic.** Tu workflow `ci.yml` solo hace:
- instalar ripgrep + Python 3.12,
- correr `pytest tests/` (backend),
- `npm ci` + TypeScript + Vitest (frontend),
- un check de docs.

Cero llamadas a Anthropic, Perplexity o Serper. Los tests son código puro sobre SQLite. **CI = $0 en APIs.**

La key de Anthropic es para el PRODUCTO en runtime (ÁGORA, síntesis de documentos). Eso **ya está diferido** (docs 15/16). No la pongas. No la necesitas para construir ni para el diagnóstico.

---

## 2. LO QUE SÍ BLOQUEABA EL CI: MINUTOS DE ACTIONS (se arregla sin dinero)

El bloqueo real era el *spending limit en $0* sobre los **minutos de GitHub Actions** (cómputo), no Anthropic. Dos caminos, ambos gratis:

| Opción | Costo | Tradeoff | Precondición |
|---|---|---|---|
| **A. Repo PÚBLICO** (recomendado para $0 garantizado) | minutos de Actions **ilimitados y gratis** | el código queda abierto | **scrubear `frontend/.env.sentry-build-plugin`** (ver §3) + confirmar que no hay secretos en el historial |
| **B. Repo PRIVADO** | **2,000 min/mes gratis** (plan free) | si empujas mucho, topas el límite | el spending limit en $0 solo bloquea EXCESOS; dentro de los 2,000 min el CI corre gratis |

**Sobre hacer público:** tu propia tesis dice que el moat es **el grafo inter-empresa, no la tecnología** (`08`/`16`). Abrir el código del motor de diagnóstico no regala el moat. Es decisión tuya, pero es defendible y te da CI gratis para siempre.

**Recomendación:** si los 2,000 min/mes te alcanzan (un equipo chico rara vez los agota), quédate **privado** (Opción B) — cero exposición, cero dinero. Si los agotas o quieres CI infinito, ve **público** (Opción A) tras el scrub.

---

## 3. SEGURIDAD ANTES DE CUALQUIER COSA PÚBLICA (obligatorio)
- ✅ Tus `.env` están gitignored (verificado): los secretos reales NO están en git.
- ⚠️ **PERO** `frontend/.env.sentry-build-plugin` SÍ está trackeado. Revisa qué contiene:
  - Si es solo un DSN público de Sentry → seguro.
  - Si tiene un `SENTRY_AUTH_TOKEN` → quítalo del repo Y del historial (microtarea Codex) antes de hacer público. Rota el token.
- Regla permanente (ya en REGLAS §4): nunca exponer secretos en código, logs ni PRs.

---

## 4. INVENTARIO GRATIS vs PAGO (qué se puede construir HOY con $0)

### Gratis — construye TODO esto sin gastar
- **GitHub CI** (público o 2,000 min privado).
- **Datos públicos MX:** INEGI (MGN/DENUE/SAKBÉ), CONAPO, CONEVAL, SEMARNAT, SMN, Banxico → APIs gubernamentales gratuitas (solo requieren token gratis de registro).
- **Cómputo determinista:** catálogo nacional, factores RSU, cobertura, PERT/CPM, semáforos, circularidad → código puro, $0.
- **Documentos desde template:** $0 de API.
- **Tus suscripciones de dev:** Codex / Claude Code / Cowork son suscripción, separado del runtime. Ya las cubres.

### De pago — DIFIÉRELO hasta que haya ingreso
- **Anthropic (ÁGORA):** síntesis de documentos/reglamentos. Diferido.
- **Serper:** research web de reglamentos. Bajo costo, pero diferible (la cobertura legal puede empezar AMARILLA y llenarse cuando haya presupuesto).
- **Perplexity:** ya diferido.
- **Hosting runtime (Render):** free tier existe (servicios duermen; Postgres free limitado). Para el demo alcanza; producción real es costo menor, post-ingreso.

---

## 5. EL DIAGNÓSTICO NACIONAL EN MODO COSTO-CERO

El doc 15 ya está diseñado para esto, pero lo hago explícito:
- T1 catálogo nacional (INEGI) → **$0**.
- T2 ingesta (CONAPO/CONEVAL/SEMARNAT/SMN/Banxico) → **$0** (APIs gratis + caché).
- T3 cobertura honesta (VERDE/AMARILLO/ROJO) → **$0** (código).
- T4 reglamentos (Serper+Anthropic) → **lo único con costo. Diferir:** marcar municipios AMARILLO ("legal pendiente") y llenar VERDE cuando haya presupuesto o un cliente que lo pague. El sistema dice la verdad mientras tanto.
- T5 endpoints + mapa → **$0**.

→ **Puedes tener el diagnóstico nacional operativo, honesto y desplegado gastando ~$0.** Lo único que espera dinero es la síntesis legal automática, y eso es diferible sin romper nada.

---

## 6. LA RUTA QUE DESBLOQUEA PRESUPUESTO (el círculo virtuoso)
1. Diagnóstico nacional + cierre GOV con $0 → credibilidad + demo.
2. Primer módulo Empresarial (texto, determinista + templates) → **primer cliente pagando $400–800 MXN/mes** (`08` Hito 2).
3. Ese ingreso paga la primera API de Anthropic/Serper. El producto se financia solo.
4. Nunca enciendas un costo de API antes de que algo (cliente o credibilidad) lo justifique.

**Regla costo-cero permanente:** ningún gasto de API se enciende sin (a) presupuesto real o (b) un cliente que lo pague. Hasta entonces: determinista + datos públicos + templates.

---

## 7. ACCIONES CONCRETAS (sin dinero)
1. Revisar `frontend/.env.sentry-build-plugin` (¿secreto o DSN público?).
2. Decidir repo público (CI infinito gratis, tras scrub) vs privado (2,000 min gratis). **No requiere dinero ni Anthropic.**
3. Encender CI. NO pongas `ANTHROPIC_API_KEY` en ningún lado todavía.
4. Construir el diagnóstico nacional en modo $0 (doc 15), con reglamentos en AMARILLO hasta tener presupuesto.

---

*19 · Modo Costo-Cero · Alquimia Supermind · 15 jun 2026 (noche)*
