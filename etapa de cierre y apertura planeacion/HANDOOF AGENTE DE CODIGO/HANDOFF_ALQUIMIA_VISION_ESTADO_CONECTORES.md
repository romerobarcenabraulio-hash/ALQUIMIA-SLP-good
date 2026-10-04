# HANDOFF — Alquimia Supermind: visión, estado, conectores y el ángulo Palantir
**Para:** nueva conversación (modelo fable) que debe IDENTIFICAR ERRORES y ORDENAR ARREGLOS.
**De:** Claude Master (PM). **Fecha:** 21 jun 2026.
**Cómo usar este doc:** léelo completo primero. Es el contexto mínimo para auditar el proyecto sin re-derivar nada. Al final hay una lista honesta de posibles errores para empezar la auditoría.

---

## 1. QUÉ ES ALQUIMIA (en una frase)
Alquimia Supermind es una **red económica de consultoría automatizada**: una sola interfaz donde agentes ("Jarvis" por rol) digieren datos de México y del mundo, identifican problemas y producen servicios de consultoría con **procedencia** (cada dato → su fuente) y **gate humano** en lo irreversible.

**NO es un ERP ni un SaaS.** Nuestro fuerte, el norte que no se negocia:
> identificar el problema + web scraping para hallar fuentes (MX y el mundo) + una filosofía de pensamiento compleja + digerir y resolver problemas con **sentido común muy desarrollado**. Inteligencia y consultoría *encima* de los sistemas del cliente — no ser el sistema.

## 2. LOS 3 HITOS (fases del negocio)
1. **Hito 1 (RSU nacional / GOV):** diagnóstico de residuos sólidos urbanos para todo México. Primer "Sector Pack". Es el activo de credibilidad (piloto).
2. **Hito 2 (Empresarial):** primer módulo para empresa + primer cliente PAGANDO. La entrevista (LISTENER) define el 1er módulo real.
3. **Hito 3 (Red + política pública):** super-supermind: orchestrator que dado un problema (eficiencia energética, zonificación, salud, educación) genera un servicio completo vendible; red inter-empresa; capa fiscal; integración/migración ERP.

Secuencia sagrada: **construir → probar (piloto GOV) → operativo → vender.** No se vende lo no probado.

## 3. EL ÁNGULO PALANTIR (honesto, sin humo)
El founder lo dice claro: aunque dijimos "nunca correr contra Palantir", competir es **inevitable** porque compartimos el concepto central: la **ONTOLOGÍA** (objetos + propiedades + links tipados + acciones, todo con procedencia).

**Dónde NO podemos ganar:** no vamos a out-construir Foundry (escala, capital, ingeniería). Pelear de frente es perder.

**Dónde SÍ ganamos (los diferenciadores reales):**
- **Procedencia NATIVA y auto-construida:** cada hecho carga fuente+fecha+método; el sistema se llena solo vía scraping 24/7 + curación humana on-request, no por integración manual cara.
- **Cruza tenants (red económica):** el grafo inter-empresa anonimizado = efecto red que Palantir no da a las PYMEs.
- **Capa de consultoría + automatización embebida (los "Jarvis"):** no vendemos una plataforma de datos que el cliente tiene que operar; vendemos el análisis y la acción, con sentido común (motor ECA) y juicio (NOUS).
- **Mercado desatendido:** gobierno municipal mexicano (RSU) y PYMEs que "no tienen ni idea" — Palantir no los toca.
- **Costo:** ellos son carísimos; nosotros arrancamos costo-cero y con build/integrate/buy (solo construimos el moat).

**Síntesis:** no "derrotamos" a Palantir de frente; les **ganamos el flanco** que no atienden, con una inteligencia más ligera, auto-construida, con procedencia y a un costo que ellos no pueden igualar. El moat es la ontología con procedencia + la red inter-empresa + la capa de consultoría, no el tamaño.

## 4. CONECTORES / MCPs (qué hay conectado y para qué)
> Nota: en una conversación nueva estos conectores pueden pedir **re-autorización** (OAuth). Si un tool no responde, hay que reconectarlo desde los ajustes de conectores.

- **Linear** — **la bitácora y el canal único entre agentes** (REGLAS §8C). Todo el trabajo vive aquí: 1 issue = 1 tarea = 1 PR = 1 rama. Estados reflejan la realidad. Es la fuente de verdad del PM.
- **GitHub** — repo único `alquimia-slp-good` (dueño: romerobarcenabraulio-hash). Código, PRs, CI (Actions gratis por ser repo público). `main` congelado en `ac985884d`.
- **Greptile** — navegación/review de código (los agentes lo usan antes de asumir dónde está algo; review de PRs).
- **Render** — hosting backend (FastAPI) + Postgres. ⚠️ El plan free BORRA Postgres a los 30 días y la web duerme → hay que migrar a pago (~$14/mes) antes de meter dato de piloto.
- **Vercel** — hosting frontend (React/Vite). Hobby = no comercial; Pro $20 cuando haya cliente.
- **Stripe** — cobros de la plataforma (wired: routers/payments + webhooks). Falta DECIDIR el pricing (FOUNDER-03/ALQ-117).
- (Perplexity DEFERRED por presupuesto; se usa Anthropic + Serper para research.)

## 5. LOS AGENTES (quién hace qué)
- **Codex** → BACKEND (`backend/`). Prefijo en Linear: `⚙️ CODEX-##`. ⚠️ Se queda sin créditos seguido (16% al 21-jun, resetea 24-jun). Su sandbox a veces no puede escribir `.git` → requiere "Acceso total al disco" en macOS.
- **Claude Code** → FRONTEND (`frontend/`). Prefijos: `🖥️ CLAUDE CODE CÓDIGO-##` (código) y `🗂️ CLAUDE CODE ARCHIVOS-##` (ordenar archivos). Ya entregó PRs #36/#37/#38.
- **Claude Master** (el PM, esta conversación) → planeación, specs, orden de Linear, gates. Prefijo `📊/📐 PM-##`.
- **Founder (Braulio)** → decisiones irreversibles, compras, GTM, y **controlador único de merge a main**. Prefijo `💰🛡️📝🔀🔌 FOUNDER-##`.

## 6. CONVENCIÓN DE LINEAR (orden garantizado)
Cada actividad activa lleva prefijo de dueño+tipo en el título: `CODEX-##`, `CLAUDE CODE CÓDIGO-##`, `CLAUDE CODE ARCHIVOS-##`, `PM-##`, `FOUNDER-##`, más el ID real `(ALQ-##)`. Milestones agrupan por Hito + "📁 Ordenar carpeta" + "🛡️ Brechas de plataforma (doc 42)".

## 7. LAS REGLAS (contrato permanente de agentes, v1.3)
`REGLAS_DE_EJECUCION_AGENTES.md` — el rigor vive ahí, no en los prompts (por eso los prompts son de una línea). Claves:
- **§2 Firewall reversible/irreversible** (la columna): libre lo reversible; GATE humano lo irreversible (merge, deploy, pago, firma, borrar).
- **§3 / §3C** anti-desastre GitHub + **consolidar a main seguido**: ramas de vida corta, ramificar desde `origin/main` fresco (NO `git pull` sobre main sucio), merge el mismo día, **un solo controlador de merge**.
- **§6 Procedencia y honestidad:** todo dato con fuente+fecha+método; nunca inventar; parcial honesto > total falso.
- **§7 Ciclo palomita:** codificar → auto-auditar → PR/In Review → (controlador mergea) → Done. El agente NO se auto-palomea.
- **§8C Linear = bitácora única.**

## 8. ESTADO ACTUAL (21 jun)
- `main` = `origin/main` = `ac985884d` (limpio, pero **congelado**: el tren de merge NO ha progresado).
- **Deuda de integración (FOUNDER-01/ALQ-108):** ~30 ramas con trabajo real SIN mergear. Es el riesgo #1.
- **PRs listos esperando gate del founder:** #37 (guardrails), #36 (borrar 18 muertos), #38 (cablear), #34 (ContainerInventory), #35 (PDF/scraping backend).
- **Orden del founder AHORA:** limpiar y empujar TODO a main antes de que crezca el desmadre. Secuencia: mergear #37→#36→#38→#34→#35 → correr limpieza de carpeta → tren de merge del resto → cerrar ramas muertas.
- Carpeta del repo aún con basura (205 duplicados " 2", etc.) — limpieza en ARCHIVOS-01/02, bloqueada hasta main limpio.

---

## 8B. FILOSOFÍA Y PUNTO CIEGO — qué previene Linear y qué NO (leer con cuidado)
**Linear es el mapa, no el territorio.** Previene *olvidos* y *descoordinación*. NO previene bugs, regresiones, malos merges ni análisis equivocado. Un agente puede mover una tarjeta a "Done" con el código roto — ya pasó (el "187 commits" fue un dato falso; el loop de guardrails vivía "verde").

Lo que de verdad evita los problemas es un **TRÍO**, no Linear solo:
1. **Linear** = memoria + plan (contra olvido/descoordinación).
2. **CI + Greptile + tests** = compuerta de correctitud (contra bugs/regresiones).
3. **Firewall reversible/irreversible + controlador único de merge (§2/§3C)** = compuerta de seguridad (contra el desastre destructivo).

**REGLA QUE CIERRA EL PUNTO CIEGO: la realidad manda sobre Linear.** Si Linear y `main`/CI no coinciden, gana `main`/CI; se corrige Linear, nunca al revés. Auditar SIEMPRE contra el repo/CI, no contra el tablero.

**Bus factor = 1:** el controlador único de merge es el founder. Si se ausenta, la cola crece y regresa la deuda de integración. Falta: suplente designado o auto-merge en verde (gate solo para lo irreversible).

**El riesgo mayor no es el desorden del tablero — es (a) no shippear (deuda de integración) y (b) shippear análisis equivocado a un gobierno (brecha ética, doc 42).** No optimizar lo visible (tablero ordenado) por encima de lo consecuente (producto funcionando, seguro, entregado).

## 9. LISTA HONESTA DE POSIBLES ERRORES (para que fable audite y ordene arreglos)
Empieza tu auditoría por aquí; confírmalos o descártalos con evidencia, no des nada por hecho:

1. **Deuda de integración sin cerrar:** main lleva congelado desde el 13-jun. Cada día que pasa, más divergencia. ¿El tren de merge tiene orden y controlador claro? ¿Los PRs #34-38 pasan CI+Greptile?
2. **Ownership mixto sin resolver:** varias tareas son "Claude Master spec + Codex build" (ej. ontología ALQ-102, ECA ALQ-69, conector ALQ-95). Se etiquetaron PM-## pero les falta el issue de BUILD separado. ¿Se pierde el build?
3. **Backlog viejo sin etiquetar:** ALQ-1 a ALQ-59 (specs de Hito 1, todos en Backlog) aún sin prefijo de dueño. Orden incompleto.
4. **Codex frágil:** sin créditos + problema de permisos `.git`. ¿El backend queda bloqueado? ¿Plan B?
5. **Multi-agente sobre una sola carpeta:** Codex, Claude Code y el de carpeta comparten el mismo working dir → colisiones de `.git`. ¿Worktrees o serializar?
6. **Persistencia de datos (DR):** Render free borra Postgres a 30 días. Si ya hay dato de piloto, riesgo real (FOUNDER-02/ALQ-116).
7. **Pricing sin decidir:** Stripe cableado pero sin modelo de cobro (FOUNDER-03).
8. **Brechas de confianza (doc 42):** aislamiento multi-tenant, auth/RBAC, circuit-breaker de consejo de alto impacto — NO negociables antes de un piloto, hoy en backlog.
9. **Dispersión vs foco:** el plan cubre RSU + Empresarial + política pública + ERP + red. ¿Se está construyendo Hito 3 mientras Hito 0/1 no cierra? (patrón "planear más que construir").
10. **Guardrails/EIDOS:** ¿el refactor a "validar comportamiento, no strings" (CÓDIGO-02/ALQ-110, PR #37) de verdad corta el loop de fixes?

**Tu tarea, fable:** verifica cada punto contra Linear + el repo, marca cuáles son errores reales, priorízalos, y ordena a los agentes (con la convención y las REGLAS) los arreglos — sin romper el firewall §2 ni saltarte el controlador de merge único.

*Handoff · Alquimia Supermind · 21 jun 2026 · Claude Master*
