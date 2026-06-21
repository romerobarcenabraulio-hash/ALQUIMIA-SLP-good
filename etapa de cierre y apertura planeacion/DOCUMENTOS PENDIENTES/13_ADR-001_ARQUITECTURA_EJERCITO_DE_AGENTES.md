# ADR-001: Arquitectura del "ejército de agentes" — fábrica declarativa vs. construcción uno-por-uno

**Status:** Proposed (espera firma del founder)
**Date:** 15 junio 2026 (noche)
**Deciders:** Braulio (founder) · Claude Master
**Lectura previa:** `08_PLAN_DEFINITIVO`, `10_MAPA_DE_TRABAJO_AGENTES` (§4 ciclo del ejecutor, §5 tres niveles de modelo), los 4 Principios Duros del `HANDOFF_TRANSICION`.

**Revisiones:**
- **rev.1 (15 jun, noche):** dos refinamientos del founder. (1) El "catálogo cerrado de acciones" se reemplaza por un **modelo de tiers** donde el conocimiento y las soluciones son ABIERTOS y evolutivos, y solo las **acciones irreversibles** quedan gobernadas (analogía: la universidad evoluciona su currículo, pero no deja que el alumno se auto-titule). (2) Se formaliza la **taxonomía de dos clases de agentes**: Class A (builder/backend, fijos-versionados) vs Class B (Jarvis del cliente, instanciados por tenant en la entrevista). Ver secciones marcadas [rev.1].

---

## Context

Supermind/Alquimia necesita muchos agentes especializados (uno por profesión/giro) que: (a) computan el esquema de una organización con agentes embebidos, (b) proveen soluciones y automatizaciones al día a día del usuario, (c) identifican dónde invertir y recomiendan con base en estándares internacionales, y (d) razonan el *por qué*, no solo el *qué*. La filosofía del proyecto es **orquestar herramientas de IA existentes (Gemini, Copilot, etc.), no construir un LLM propio** — ser un entorno unificado que facilita planeación y ejecución.

El founder planteó dos caminos para construir ese ejército:

- **Path 1 — fábrica/algoritmo generativo:** un meta-algoritmo que, dado un giro, sabe qué preguntar, trae un criterio predefinido de pensamiento filosófico-razonado, e instancia el comportamiento del agente. Solo se construyen módulos; los agentes están "preparados para aprender" de su entorno y de internet, y se actualizan solos.
- **Path 2 — uno por uno:** construir cada agente individualmente. Más seguro, más lento.

Fuerzas en juego: la tesis de producto (call-on-request, propagación niebla) exige *muchos* agentes baratos de añadir; el sistema debe **evolucionar e innovar** (leer hallazgos/artículos/estándares, no quedarse atrás — analogía del founder: como una universidad actualiza su currículo); los 4 Principios Duros exigen procedencia verificable y gate humano en lo irreversible; la economía exige token-eficiencia; y hay un sprint que paga la renta (GOV/Empresarial) que no se puede canibalizar con una plataforma de agentes general. **La tensión central [rev.1]:** evolución/innovación vs. rigor/auditabilidad. Se resuelve relocalizando el límite a *reversible vs. irreversible*, no a *abierto vs. cerrado*.

---

## Decision

**No se elige entre Path 1 y Path 2. Se separan mecanismo y política, y se estadifica.**

Construir **una fábrica declarativa de agentes**: un *engine* único compartido (mecanismo) sobre el cual cada agente es una *especificación de configuración* (política), invocando un **catálogo cerrado de capacidades** y volcando lo aprendido a un **almacén externo auditable**. Las primeras specs se autoran a mano (la seguridad de Path 2), corriendo sobre la infraestructura de fábrica (la escala de Path 1). La auto-generación de specs es la última etapa, y toda spec generada pasa por gate humano antes de entrar en vivo.

### Las cuatro capas (lo que hoy se funde en "el agente")

1. **Engine (compartido, uno):** el ciclo del ejecutor del `10` §4: recibir lo mínimo → verificar procedencia → método más barato que sirva → producir con procedencia → parar en el borde de lo irreversible → registrar. Incluye la **constitución de razonamiento** (la "filosofía" operacionalizada, ver abajo). Todos los agentes corren aquí.
2. **Spec (declarativa, por profesión):** objeto de configuración — rol, schema de intake (qué debe preguntar), permisos de herramientas (qué IAs externas puede disparar), nivel de autonomía L0–L3, fuentes de conocimiento, criterios de aceptación. **Es dato, no código.** Añadir un agente = añadir una spec.
3. **Catálogo por tiers — el límite es reversible vs. irreversible, no abierto vs. cerrado [rev.1]:** el "catálogo cerrado" del Principio 1 se *relocaliza*, no se borra. Tres tiers:
   - **Tier de conocimiento → ABIERTO y evolutivo.** Los agentes leen artículos, hallazgos, estándares actualizados, benchmarks. Ingieren la frontera con procedencia. Es el "currículo que se actualiza" (analogía universidad). Aquí NO se está "dejados atrás".
   - **Tier de soluciones/recomendaciones → ABIERTO/generativo, validado por humano.** Los agentes componen soluciones novedosas. La innovación vive aquí. Salida = propuesta con su cadena de razonamiento y fuentes. Reversible.
   - **Tier de acciones con efecto externo/irreversible → GOBERNADO (catálogo curado + gate humano).** Presentar ante SAT, mover dinero, firmar, notificar a un tercero. Curado por ley/dinero/responsabilidad, no por miedo a innovar. Capacidades nuevas aquí las añade un humano tras revisión, nunca el agente.
   - **Firewall (la regla que lo hace seguro):** el conocimiento abierto alimenta razonamiento y propuestas; **nunca dispara directamente una acción irreversible.** Una fuente envenenada puede sesgar una *recomendación* (que un humano revisa); no puede llegar a una transferencia. Esto preserva la resistencia a prompt injection mientras se abre el conocimiento.
4. **Learning store (acotado, externo, auditable):** lo que el agente "aprende" aterriza en el Company Profile JSON / artefacto de memoria **con procedencia**, nunca en su propio comportamiento de forma silenciosa. Personalización en forma; la *procedencia de datos de la empresa* es fija (Principio 4). Lo que evoluciona es **cómo se usa el conocimiento**, no los datos fijos de la empresa.

### Las dos clases de agentes — taxonomía [rev.1]

Distinción dura del founder: separar los agentes que *construyen el servicio* de los agentes que *se crean para el cliente*.

| | **Class A — Builder agents** | **Class B — Jarvis del cliente** |
|---|---|---|
| Qué son | Los agentes internos de Alquimia que producen el servicio | El/los agente(s) personalizados de cada empresa |
| Ejemplos | LISTENER, ORCHESTRATOR, SECTOR, agentes de módulo (E1, E2…) | El "Jarvis" de la PyME X, instanciado en su onboarding |
| Dónde viven | Backend, compartidos, multi-tenant | Dentro del contexto del tenant, aislados por `tenant_id` |
| Ciclo de vida | **Fijos-versionados:** cambian solo por el pipeline de release de Alquimia (testeados, revisados). Fijo ≠ congelado; evolucionan por release, NUNCA por auto-modificación | **Instanciados por entrevista:** nacen cuando el onboarding produce el Company Profile |
| Relación con la fábrica | **SON la fábrica** (engine + specs + catálogo) | **SON el producto de la fábrica** (una Agent Spec instanciada contra el Profile + conectores + learning store del tenant) |
| Personalización | No personalizan por tenant (son el mecanismo) | Personalizan por tenant (en forma; datos con procedencia) |
| Herramientas externas | Las de Alquimia | Las del cliente (su Gmail, su Copilot, su Gemini) vía la abstracción de proveedor |

**Flujo de nacimiento del Jarvis (Class B):** LISTENER (A) procesa la entrevista → Company Profile JSON → ORCHESTRATOR/SECTOR (A) selecciona la spec → se provisiona una instancia Jarvis (B) ligada a ese tenant. El aislamiento `HasTenantId` que YA está en el repo es el cimiento de Class B.

**Cómo evoluciona cada clase (sin romper rigor):**
- **Class A** evoluciona por el ciclo de release de Alquimia (la facultad actualiza el syllabus de forma central y revisada).
- **Class B** "aprende" el entorno del tenant y personaliza en forma, y se vuelve más capaz a medida que el **tier de conocimiento (abierto)** que A le provee se actualiza — sin que cada Jarvis se vuelva rogue ni se auto-reescriba.

### "Pensamiento filosófico" operacionalizado (para que no sea vibra)
Constitución de razonamiento inyectada en el engine, igual para todo agente: (1) enunciar el problema, (2) citar el estándar/fuente desde el que razona, (3) razonar el *por qué* encaja la solución (no solo el qué), (4) exponer la cadena para auditoría humana, (5) parar en lo irreversible. Filosofía = razonamiento transparente, principiado y anclado a estándares — compatible con anti-mentira. El costo se gobierna con los tres niveles de modelo (`10` §5): nadie usa modelo grande para lo que el código determinista resuelve.

---

## Options Considered

### Option A: Fábrica autónoma fuerte (Path 1 ingenuo) — agentes que auto-modifican su comportamiento/acciones desde internet
> [rev.1] Nota: lo que esta opción descarta es la auto-modificación de **comportamiento y acciones irreversibles** sin supervisión. La ingestión **abierta de conocimiento** (tier 1) NO es esta opción — eso se adopta y es deseable. El peligro es que el conocimiento auto-modifique acciones sin gate.
| Dimension | Assessment |
|-----------|------------|
| Complexity | Alta |
| Cost | Alto (razonamiento caro everywhere; difícil de acotar) |
| Scalability | Alta en teoría |
| Auditability | **Rota** — comportamiento muta, procedencia no garantizable |
| Security | **Débil** — ingestión autónoma de web = superficie de prompt injection (OWASP LLM01) |
| Team familiarity | Baja (territorio de investigación) |

**Pros:** escala máxima; visión más ambiciosa.
**Cons:** contradice Principios 1 y 4 y la decisión #4 (catálogo cerrado de arranque); no determinista (no certificable ante autoridad); inyectable; imposible de validar para flujos GOV/fiscales.

### Option B: Uno por uno (Path 2)
| Dimension | Assessment |
|-----------|------------|
| Complexity | Media por agente, alta en agregado |
| Cost | Alto en tiempo de construcción y mantenimiento |
| Scalability | **Baja** — no entrega call-on-request para todo giro |
| Auditability | Alta por agente |
| Consistency | **Baja** — cada agente reimplementa el loop; la constitución se aplica disparejo; drift |
| Team familiarity | Alta |

**Pros:** control máximo por agente; "se siente seguro".
**Cons:** no escala a la tesis de producto; mantenimiento cuadrático; inconsistencia entre agentes; lento (no paga la renta a tiempo).

### Option C (ELEGIDA): Fábrica declarativa estadificada — engine compartido + specs gobernadas
| Dimension | Assessment |
|-----------|------------|
| Complexity | Media (un engine + un schema de spec) |
| Cost | Bajo a escala (spec = dato; template = $0; tres niveles de modelo) |
| Scalability | Alta (añadir agente = añadir spec validada) |
| Auditability | **Alta** (procedencia en el engine; learning externo) |
| Security | **Fuerte** (catálogo cerrado; gate humano; sin auto-ingestión no supervisada) |
| Team familiarity | Media (patrón orchestrator-workers, conocido) |

**Pros:** consistente con los 4 Principios y la decisión #4; escala con la tesis; barato; la autonomía se *gana* por etapas sin romper rigor.
**Cons:** requiere disciplina de schema al inicio; la auto-generación llega después, no el día 1.

---

## Trade-off Analysis

El eje real no es "fábrica vs. uno-por-uno"; es **mecanismo vs. política**. Path 1 es un mecanismo (fábrica); la "seguridad" de Path 2 es solo autoría cuidadosa de política (una spec a la vez). Separándolos, se construye el engine una vez y se puebla con cuidado — se obtienen ambas propiedades.

La autonomía fuerte (Option A) es el norte correcto a *largo plazo* pero adoptarla *ahora* viola la constitución ya firmada y es exactamente el patrón que se come el sprint que paga la renta. Option B se siente segura pero es la menos consistente (drift entre agentes) y no entrega la tesis. Option C convierte "añadir un agente" en "escribir y validar una spec", que es rápido y auditable, y deja la auto-generación como una capacidad que se enciende cuando el schema está probado — y aun así con gate humano (Principio 3).

Sobre la filosofía de orquestar IA existente: se mantiene como **abstracción de proveedor orientada a capacidades** (un router: el agente pide "resume estos correos"; el router elige Gemini/Copilot/Perplexity/Anthropic según costo-capacidad). Esto es coherente con los tres niveles de modelo y con el patrón de conectores. Es barato, diferenciador, y es el moat correcto (la red, no el modelo).

---

## Consequences

**Se vuelve más fácil:** añadir giros (spec, no código); mantener consistencia (un engine, una constitución); controlar costo (tres niveles + templates); auditar (procedencia centralizada); relevar agentes (doc 09 — la spec + el learning store son los que recuerdan).

**Se vuelve más difícil / requiere disciplina:** hay que diseñar bien el *schema de spec* y el *contrato del capability catalog* desde temprano (decisión de diseño de alto apalancamiento); resistir la tentación de la auto-generación antes de tiempo.

**A revisitar:** cuándo encender la auto-generación de specs (criterio: 2–3 specs en vivo, schema estable, gate humano definido); cuándo y cómo (si acaso) permitir aprendizaje que toque comportamiento, no solo el learning store (probablemente nunca para flujos irreversibles).

**Guardarraíl anti-dispersión:** se construye la **fábrica mínima que el primer módulo que cobra necesita**, no una plataforma de agentes general. GOV/Hito 0 NO necesita la fábrica — no debe retrasar el cierre GOV.

---

## Action Items

1. [ ] Founder firma esta ADR rev.1 (o pide ajustes) — convierte Status a Accepted.
2. [ ] **Definir la frontera reversible/irreversible [rev.1]:** la lista explícita de qué acciones son "irreversibles/efecto externo" (gobernadas + gate) vs. reversibles (abiertas). Es el documento que hace operable el modelo de tiers. Hito 1.
3. [ ] Definir el **schema de la Agent Spec** (rol, intake, permisos de herramientas, autonomía L0–L3, fuentes, criterios, **clase A/B**). 1 documento, Hito 1.
4. [ ] Definir el **contrato del Capability Catalog** (3 tiers) + la abstracción de proveedor (router de IA externa por costo-capacidad). 1 documento, Hito 1.
5. [ ] **Definir el ciclo de vida del Jarvis (Class B) [rev.1]:** provisión en onboarding, aislamiento por tenant, versionado (cuándo una spec A actualizada propaga a Jarvises existentes), y costo (¿persistente por tenant o instanciado on-request?). 1 documento, Hito 1.
6. [ ] Implementar el **engine mínimo** = ciclo del ejecutor `10` §4 como código real, con la constitución de razonamiento inyectada.
7. [ ] Autorar a mano las primeras 1–3 specs (LISTENER, ORCHESTRATOR/SECTOR, primer módulo) sobre el engine.
8. [ ] NO construir el generador de specs hasta que 2–3 specs estén en vivo y el schema estable; cuando exista, toda spec generada pasa por gate humano.
9. [ ] Mantener GOV/Hito 0 fuera de esta línea de trabajo hasta que el cierre GOV esté hecho.

---

*ADR-001 · Arquitectura del Ejército de Agentes · Alquimia Supermind · 15 junio 2026 (noche)*
