# 20 · STACK DE INTEGRACIÓN Y AUTOMATIZACIÓN + PRIMER AGENTE SDK
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork)
**Propósito:** Usar las herramientas que existen para tomar la mayor ventaja, SIN encender costos que no podemos pagar. Qué se usa ya (gratis), qué se difiere (pago), y el diseño del primer agente SDK.

---

## 1. ESTADO DE INTEGRACIONES (verificado hoy)

| Herramienta | Estado | Para qué | Costo |
|---|---|---|---|
| **Linear** | ✅ conectado · proyecto + 8 issues creados | kanban vivo que manejan Codex/Claude Code | gratis |
| **Greptile** | ✅ conectado | navegación de código + review de PRs | gratis/incluido |
| **Render** | ✅ conectado | deploy, logs, métricas, Postgres | free tier |
| **Vercel** | ✅ conectado | frontend deploy/logs | free tier |
| **Stripe** | ✅ conectado (cuenta "Alquimia") | pagos del PRODUCTO | sin costo hasta cobrar |
| **GitHub** | ⏳ falta `/mcp` | CI, PRs | gratis (doc 19) |
| **Claude Agent SDK** | ✅ instalado | construir agentes programáticos | **⚠️ cobra API Anthropic** |
| **Secrets/env** | ✅ en repo + Render | correr adaptadores de datos | gratis (APIs públicas) |

---

## 2. LA TRAMPA DEL SDK (lo más importante que tienes que saber)

**El Claude Agent SDK corre sobre la API de Anthropic → cada ejecución cuesta tokens.** Es la misma key que dijiste que no puedes fundear. Por lo tanto:

- ❌ **NO** prendemos agentes SDK "always-on" ahora. Eso sería encender justo el costo que no tenemos.
- ✅ Los **diseñamos** y los construimos cuando haya presupuesto (o un cliente que lo pague).
- ✅ Mientras tanto, la automatización sale **gratis** de lo que ya pagas por suscripción: **Codex** y **Claude Code** (workhorses), **Linear** (orquesta), **Greptile** (revisa), y **yo** (Claude Master en Cowork) manteniendo el kanban.

Regla (de doc 19): ningún costo de API se enciende sin presupuesto o cliente. El SDK entra en esa regla.

---

## 3. QUÉ USAMOS YA (gratis) PARA MÁXIMA VENTAJA

- **Linear = el tablero que ejecutan los coders.** Cada issue ya trae su `gitBranchName` (Linear lo generó). Codex/Claude Code toman un issue → trabajan en esa rama → PR → merge. El kanban .md y Linear son espejo (doc 17).
- **Codex = workhorse determinista.** Todo el diagnóstico nacional (catálogo, ingesta, cobertura, endpoints) es código puro = $0 marginal sobre tu suscripción.
- **Greptile = memoria de código + revisor.** Navega el repo (no recarga) y revisa PRs automáticamente — atrapa drift sin que pagues un LLM extra.
- **Render = verdad de runtime.** Logs/métricas para depurar deploys.
- **Claude Code = frontend + auditoría de procedencia.**

→ Con esto tienes un equipo de automatización completo **a $0 marginal**. No hace falta comprar nada más.

---

## 4. EL PRIMER AGENTE SDK (diseño — se construye con presupuesto)

Cuando haya con qué, el primer agente SDK de mayor valor:

**`auditor-cumplimiento` (read-only, gate de calidad):**
- Dispara en cada PR/handoff. Verifica contra REGLAS: ¿la salida de pytest es real?, ¿hay procedencia en cada dato?, ¿se tocó algo prohibido (git/Render destructivo)?, ¿la cobertura es honesta (sin VERDE inventado)?
- Salida: ✅/❌ + razones. No mergea; informa al gate humano.
- **Por qué no ahora:** (a) cuesta API; (b) **Greptile PR review ya cubre gran parte gratis.** Prioridad: exprimir Greptile primero; el auditor SDK entra cuando el volumen de PRs lo justifique.

Otros candidatos (más adelante, por valor): `kanban-sync` (.md ↔ Linear ↔ mover a EJECUTADOS), `diag-qa` (valida procedencia de datos ingeridos). Todos diferidos por la misma razón de costo.

---

## 5. STRIPE — LISTO, PERO ES HITO 2
Stripe está cableado (cuenta "Alquimia") y los webhooks existen en el repo (`routers/stripe_webhooks.py`). Pero pagos = cuando haya un cliente que pague (Hito 2 del `08`). **No se construye nada de Stripe ahora.** Está listo para cuando llegue el primer cliente PyME.

---

## 6. RECOMENDACIÓN DE SOCIO (clara)
- **USA YA (gratis):** Linear (tablero), Codex+Claude Code (build), Greptile (navegación+review), Render (runtime). Es un equipo completo a $0 marginal.
- **DIFIERE (pago):** agentes SDK en runtime, Anthropic/ÁGORA, Stripe-producto. Se encienden con ingreso.
- **NO instales más herramientas.** Tienes todo lo necesario. Más MCPs = más superficie, no más velocidad (doc 18).
- **Aprende sobre la marcha con Linear:** es la herramienta nueva más útil para ti hoy — el tablero te enseña el ritmo solo.

---

## 7. ACCIÓN INMEDIATA
1. Abre el proyecto Linear "Hito 0 — Cierre GOV + Diagnóstico RSU Nacional" — ahí están los 8 issues ordenados.
2. Conecta GitHub (`/mcp`) → enciende CI (gratis).
3. Mueve ALQ-5 (RECON) a "In Progress" y dispáralo a Codex con su prompt de una línea.
4. El resto fluye por el tablero. Nada de SDK ni Anthropic todavía.

---

## 8 · AUTOMATIZAR CLAUDE CODE — LA REALIDAD DE COSTO (verificado jun 2026)

**Sí se puede automatizar.** Tres formas, todas reales:
- **Headless:** `claude -p "prompt" --output-format json` corre el loop completo y sale. Para scripts/CI.
- **GitHub Action oficial** (`anthropics/claude-code-action@v1`): se dispara con @claude, asignación de issue, o prompt explícito; arma el PR solo. Encaja con el flujo Linear→PR→palomear.
- **Autónomo total:** cron / push / comentario de PR.

**PERO — el cambio de facturación del 15-jun-2026 (clave para costo-cero):** la automatización de Claude Code (headless `-p`, Agent SDK **y la GitHub Action**) **YA NO cuenta contra tu suscripción normal.** Sale de un **crédito mensual de Agent SDK aparte, a tarifa de API**: ~$20 en Pro, $100 en Max 5x, $200 en Max 20x. Cuando se agota → pago por uso o se detiene; no acumula. (Hay casos documentados de facturación inesperada de $1,800 en 2 días con `-p`.)

→ **Conclusión:** automatizar Claude Code en modo daemon/GitHub Action = el mismo costo de API que dijiste no tener. NO es "gratis con la suscripción".

**Recomendación costo-cero (qué hacer HOY):**
- Usa **Claude Code interactivo** (cubierto por tu suscripción) y **deja que encadene varias tareas en una misma sesión**: le das la cola (ALQ-16 → ALQ-12 → …), se auto-audita, abre PR y sigue con la siguiente sin que pegues prompt cada vez. Eso es "automatizado" a costo de suscripción, no de API. Es lo más cercano a "déjalo trabajando solo" sin encender el crédito de Agent SDK.
- **Cuando haya presupuesto/ingreso:** enciende la **GitHub Action** (etiquetas un issue → corre en CI → PR), acotada por el crédito de Agent SDK para que sea predecible. Ahí sí es "label → palomear" sin tocar la terminal.
- **No montar** un daemon headless always-on ahora: es justo el gasto que el doc 19 difiere.

**Fuentes:** [Claude Code GitHub Actions (docs)](https://code.claude.com/docs/en/github-actions) · [Run Claude Code programmatically — headless (docs)](https://code.claude.com/docs/en/headless) · [Claude Code pricing 2026](https://www.morphllm.com/claude-code-pricing) · [Cambio de facturación 15-jun](https://www.pravinkumar.co/blog/claude-june-15-billing-change-explained-2026)

---

*20 · Stack de Integración y Automatización · Alquimia Supermind · 17 jun 2026*
