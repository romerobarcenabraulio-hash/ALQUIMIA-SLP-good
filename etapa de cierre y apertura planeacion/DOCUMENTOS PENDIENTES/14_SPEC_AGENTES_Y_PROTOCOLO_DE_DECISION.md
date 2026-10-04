# 14 · SPEC MAESTRA DE AGENTES Y PROTOCOLO DE DECISIÓN
**Fecha:** 15 junio 2026 (noche)
**Autor:** Claude Master (Cowork)
**Status:** Draft para aprobación del founder
**Operacionaliza:** `13_ADR-001` (rev.1). Es el documento que un agente de código IMPLEMENTA; convierte "crea los agentes" en "implementa este schema".
**Alcance deliberado (anti-dispersión):** define el *mecanismo* (engine + schema + protocolo) y *3–4 specs semilla* como ejemplos probados. NO enumera el ejército completo ni todos los módulos — esos crecen por hito (regla `08` §7: se escribe lo que cada hito necesita).

---

## 1. EL MODELO MENTAL EN UNA FIGURA

```
                ┌─────────────────────────────────────────────┐
                │              ENGINE (uno, compartido)         │  ← mecanismo
                │  ciclo del ejecutor + constitución de         │
                │  razonamiento + 3 niveles de modelo           │
                └───────────────┬───────────────────────────────┘
                                │ corre cualquier…
              ┌─────────────────┴─────────────────┐
              ▼                                     ▼
   AGENT SPEC (declarativa)              AGENT SPEC (declarativa)   ← política (dato, no código)
   Class A: builder/backend             Class B: Jarvis del cliente
   (LISTENER, ORCHESTRATOR, …)          (instanciado por tenant)
              │                                     │
              ▼                                     ▼
   CAPABILITY CATALOG (3 tiers)         LEARNING STORE (externo, con procedencia)
   conocimiento ABIERTO · soluciones    Company Profile JSON + memoria del tenant
   ABIERTAS · acciones irreversibles
   GOBERNADAS (+ gate humano)
```

Una sola "inteligencia" (modelos frontera, rentados, no propios). La *individualidad* de cada agente vive en su **spec** + su **contexto**, no en un cerebro separado. Eso es lo que hace barato tener un ejército.

---

## 2. AGENT SPEC — EL SCHEMA DECLARATIVO

Cada agente (Class A o B) es un objeto de configuración con estos campos. Esto es lo que el código carga; añadir un agente = añadir una spec validada, no escribir un programa.

```yaml
agent_spec:
  id: string                      # ej. "orchestrator", "sector.residuos", "jarvis.{tenant_id}"
  version: semver                 # versionado para propagación controlada
  class: A | B                    # A=builder/backend  B=cliente/Jarvis
  role: string                    # una frase: qué hace y para quién
  trigger:                        # cuándo se activa
    type: on_request | on_event | on_onboarding | scheduled
    by: string                    # quién lo dispara (normalmente el ORCHESTRATOR)
  intake_schema:                  # ← el "qué necesito antes de asumir" (ver §3)
    required_inputs:
      - name: string
        source_of_truth: string   # autoridad/estándar de donde DEBE venir
        if_missing: ask | escalate | block   # NUNCA "invent"
    optional_inputs: [...]
  knowledge_sources:              # tier abierto (ver §4)
    - type: standard | article | benchmark | regulation
      ref: string                 # cómo se localiza y se cita
      freshness: string           # cada cuánto se reverifica
  capabilities:                   # qué puede invocar (del catálogo, ver §5)
    deterministic: [fn_ids]       # cálculo puro, sin LLM
    llm_tasks: [task_ids]         # síntesis/interpretación (modelo medio)
    external_tools: [tool_ids]    # Gemini/Copilot/Perplexity/conectores
    irreversible_actions: [action_ids]   # SOLO con gate humano
  autonomy_level: L0 | L1 | L2 | L3       # ver §6
  reasoning_policy: ref           # apunta a la constitución de razonamiento (§3)
  output_contract:                # qué entrega y con qué procedencia
    artifact: string
    provenance: required          # cada cifra trae fuente o fórmula+inputs
  acceptance_criteria: [...]      # cómo se sabe que lo hizo bien
  tenant_scope: none | single     # A=none (compartido)  B=single (aislado por tenant)
```

**Regla dura:** ningún campo permite "inventar". `if_missing` jamás vale `invent`. La procedencia es `required` en el output. (Principios 1, 2, 4.)

---

## 3. EL PROTOCOLO DE DECISIÓN — EL "MINDSET" PREDEFINIDO

Esto es el corazón que pediste: **antes de asumir o diseñar nada, el agente sabe qué datos necesita, de qué fuente, y qué se niega a inventar.** Es una máquina de estados fija, idéntica para todo agente, inyectada por el engine. La "filosofía" del agente = este protocolo, no vibra.

```
FASE 0 · IDENTIFICAR
   ¿Qué profesión/giro/problema es este? ¿Qué entregable se espera?
   → fija qué intake_schema aplica.

FASE 1 · COMPUERTA DE INSUMOS  ←★ "qué necesito ANTES de asumir"
   Enumera required_inputs del schema. Para CADA uno:
     - ¿lo tengo, con procedencia? → sigue
     - ¿no lo tengo? → ask | escalate | block (según if_missing). NUNCA assume.
   No se diseña, no se estima, no se recomienda hasta cerrar esta compuerta.
   Prohibido el "supongamos que…".

FASE 2 · ANCLAR A ESTÁNDAR / EVIDENCIA
   ¿Bajo qué norma/estándar/artículo se resuelve esto? (knowledge_sources)
   Trae la versión VIGENTE (tier abierto, §4) + su cita. Si el estándar cambió, gana el nuevo.

FASE 3 · ELEGIR MÉTODO (el más barato que sirva)
   determinista (sin LLM) > LLM medio (síntesis) > template ($0).
   Lookup/cálculo/regla = código puro. Nunca un token para lo que una función resuelve.

FASE 4 · RAZONAR EL PORQUÉ
   No solo el "qué": por qué esta solución encaja, contra el estándar citado.
   Expone la cadena para auditoría humana.

FASE 5 · PRODUCIR CON PROCEDENCIA ADHERIDA
   Cada cifra: de dónde salió (fuente o fórmula+inputs). Cero números "plausibles".

FASE 6 · PARAR EN EL BORDE
   ¿La acción escribe al mundo externo (firma/pago/presenta/notifica)?
     Sí → prepara todo y presenta al humano: "listo, ¿ejecuto?". NO ejecuta solo.
     No → entrega completo, resolutivo.

FASE 7 · REGISTRAR
   Log inmutable: qué hice, disparador, fuente, resultado. = trazabilidad.
```

---

## 4. SOURCING DE CONOCIMIENTO ABIERTO + EL FIREWALL

Esto materializa la rev.1 (el catálogo NO es cerrado para el conocimiento):

- El agente PUEDE traer estándares nuevos, artículos académicos, benchmarks actualizados (`knowledge_sources`), siempre **con procedencia y fecha de verificación**. Es el "currículo que se actualiza".
- Lo que evoluciona es **cómo se usa el conocimiento**, no los datos fijos de la empresa.
- **FIREWALL (no negociable):** el conocimiento abierto alimenta SOLO las Fases 2–5 (anclar, razonar, producir propuestas). **Nunca cruza directo a la Fase 6** (acción irreversible). Una fuente envenenada puede sesgar una *recomendación* (que un humano revisa); jamás puede disparar una transferencia/firma/presentación. Así se abre el conocimiento sin abrir la superficie de prompt injection.

---

## 5. CAPABILITY CATALOG — LOS 3 TIERS (de ADR-001 rev.1)

| Tier | Naturaleza | Ejemplos | Gobierno |
|---|---|---|---|
| Conocimiento | ABIERTO/evolutivo | leer NOM/Eurocode/ACI vigente, artículos, benchmarks | procedencia + fecha |
| Soluciones/recomendaciones | ABIERTO/generativo | componer un diseño, un plan, un top-10 de inversión | validación humana (reversible) |
| Acciones irreversibles | GOBERNADO + gate | presentar ante SAT, pagar, firmar, notificar a tercero | catálogo curado por humano; el agente nunca añade capacidades aquí |

---

## 6. NIVELES DE AUTONOMÍA (L0–L3)

- **L0 — Solo rutea/lee.** No produce entregables ni escribe estado. (Ej. ORCHESTRATOR.)
- **L1 — Propone, humano confirma.** Escribe borradores/Profile con confirmación. (Ej. LISTENER, SECTOR.)
- **L2 — Ejecuta lo reversible solo; gate en lo irreversible.** Produce entregables completos; para en Fase 6. (Ej. módulos.)
- **L3 — Autonomía amplia en su dominio, aún con gate en lo irreversible.** Se *gana* tras historial; nunca elimina el gate de firma/pago/presentación.

Ningún nivel ejecuta una acción irreversible sin gate humano. (Principio 3.)

---

## 7. EJEMPLO TRABAJADO — TU CASO DEL EDIFICIO

Para mostrar el mindset en concreto. Un agente de "diseño/estimación de obra" recibe: "diseña/estima este edificio". El protocolo NO lo deja asumir nada:

**Fase 1 — Compuerta de insumos (antes de cualquier diseño):**

| Insumo requerido | Fuente de verdad | Si falta |
|---|---|---|
| Estudio de mecánica de suelos (capacidad de carga, NAF) | Estudio geotécnico del predio | **block** (no se diseña cimentación sin esto) |
| Uso de suelo y restricciones | Reglamento de zonificación municipal vigente | escalate |
| Programa arquitectónico (m², niveles, ocupación) | Cliente | ask |
| Zona sísmica y vientos | Manual CFE / código sísmico vigente del estado | block |
| Código estructural aplicable | NTC / ACI 318 / Eurocode (versión vigente) | block |
| Presupuesto y plazo | Cliente | ask |

→ El agente **se niega a suponer** la capacidad de carga del suelo, la zona sísmica, o el uso de suelo. Sin geotécnico, no propone cimentación: lo pide o bloquea.

**Fase 2 — Anclar:** trae la *versión vigente* del código (no la que "recuerda"), la cita, y si hay un artículo/estándar nuevo relevante (p. ej. actualización de NTC), gana el nuevo.

**Fase 3 — Método:** dimensionamiento estructural = cálculo determinista (no LLM). El LLM solo redacta la memoria de cálculo y razona alternativas.

**Fase 5 — Procedencia:** cada carga, factor y dimensión trae su fórmula + inputs + código citado.

**Fase 6 — Borde:** entrega diseño + memoria (reversible, completo). NO firma planos ni presenta ante autoridad: prepara el paquete y pide gate humano (perito responsable).

Este patrón es idéntico para cualquier profesión: cambian los `required_inputs` y los `knowledge_sources`; el protocolo es el mismo. Eso es lo que el "agent builder" instancia.

---

## 8. SPECS SEMILLA (Class A) — para arrancar y probar el schema

Se autoran a mano estas 3–4 (la seguridad de Path 2 sobre la fábrica de Path 1). El resto se generan después, con gate.

- **`orchestrator` (A, L0):** trigger on_request. Identifica profesión/giro + tenant_id; rutea a la spec correcta. No produce, no cruza tenant. Modelo: rápido/barato.
- **`listener` (A, L1):** trigger on_onboarding. Convierte entrevista (texto primero, voz después) → Company Profile JSON. Escribe Profile con confirmación. Es quien "da a luz" al Jarvis del tenant.
- **`sector` (A, L1):** tras onboarding. Consume Profile → propone mapa de activación de módulos. Sugiere; el usuario confirma.
- **`module.E1` (A→produce para B, L2):** ejemplo de módulo call-on-request. Consume Profile → entregable con procedencia. Para en el borde.

**El "agent builder" (la fábrica/meta):** genera una spec nueva a partir de una profesión. **Se construye al final** (ADR-001), y toda spec generada pasa por gate humano antes de entrar en vivo. NO es del arranque.

---

## 9. LO QUE ESTE DOC NO HACE (límite explícito)

- ❌ No enumera todos los módulos ni todos los giros. Eso es el "ansia de los 110 .md". Crecen por hito.
- ❌ No construye el agent-builder automático todavía.
- ❌ No arranca código: es la spec que el código implementará DESPUÉS del gate (§siguiente).

---

## 10. GATE ANTES DE CONSTRUIR (qué desbloquea los build-prompts)

Los tickets de construcción a Codex/Claude Code se emiten **solo cuando**:
1. ✅ HO-D0-RECON ejecutado → Escenario 1/2 decidido.
2. ✅ Rebase resuelto → repo limpio (decisión del founder).
3. ✅ CI verde (GitHub conectado + spending limit).
4. ✅ ADR-001 firmado (Proposed → Accepted).
5. ✅ Esta spec (14) aprobada por el founder.

Con eso, "crea los agentes" deja de ser improvisación y pasa a ser "implementa el §2 y §3 de este doc, empezando por las specs semilla del §8". Ahí sí, los build-prompts a Codex (engine + loader + specs A backend) y Claude Code (contratos de spec + auditoría de procedencia + pantallas) son precisos y rigurosos.

---

*14 · Spec Maestra de Agentes y Protocolo de Decisión · Alquimia Supermind · 15 junio 2026 (noche)*
