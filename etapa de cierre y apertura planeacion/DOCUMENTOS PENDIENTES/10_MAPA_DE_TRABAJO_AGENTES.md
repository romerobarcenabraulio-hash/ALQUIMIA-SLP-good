# 10 · MAPA DE TRABAJO DE AGENTES — LANZAMIENTO PARALELO
**Fecha:** 15 junio 2026
**Autor:** Claude Master
**Propósito:** Dejar CRISTALINO quién trabaja dónde, en qué, con qué disciplina de tokens, para correr GOV-RSU y Empresarial en paralelo sin desperdiciar tokens ni pisarse.
**Lectura previa:** 08_PLAN_DEFINITIVO_MATERIALIZACION.md

---

## 1. EL PRINCIPIO QUE EVITA QUEMAR TOKENS A LO ESTÚPIDO

El desperdicio de tokens viene de tres fuentes, y las tres se previenen con disciplina, no con suerte:

1. **Contexto inflado:** el agente recarga toda la historia en cada llamada. → Solución: el agente lee el Company Profile JSON / el .md del módulo, NO el transcript completo ni el repo entero.
2. **Reprocesamiento:** el agente re-calcula o re-genera algo que ya existía. → Solución: si el dato está en el Profile o el cálculo en un template, se REUSA, no se regenera.
3. **LLM para lo que no necesita LLM:** usar un modelo caro para rutear, contar, o aplicar una regla. → Solución: los tres niveles de modelo (sección 4). Código puro para lo determinista.

**Regla maestra:** el LLM identifica e interpreta; el algoritmo calcula; el template rellena. Nunca uses un token de LLM para algo que una función determinista puede hacer.

---

## 2. LOS DOS STREAMS PARALELOS — SEPARACIÓN TOTAL

GOV-RSU y Empresarial corren en paralelo PERO con separación total. Esto es lo que hace que no se pisen ni compartan tokens innecesariamente.

| Aspecto | GOV-RSU (Alquimia GOV) | Empresarial (Alquimia Empresarial) |
|---|---|---|
| **Proyecto Vercel** | El actual | NUEVO, separado (dominio, env vars, analytics propios) |
| **Repo / carpetas** | `backend/app/gov/` + módulos RSU | `backend/app/empresa/` (ya existe parcial) |
| **Estado** | Cerrando (Hito 0) | Arrancando (Hito 1) |
| **Stream / agente** | 1 agente, tareas acotadas | Backend stream + Frontend stream |
| **LLM** | Perplexity (research municipal) | Por decidir (texto primero, voz después) |
| **Fuente de verdad** | Datos del municipio | Company Profile JSON de la empresa |

**Regla de no-colisión:** GOV-RSU y Empresarial NUNCA tocan los mismos archivos. La separación de carpetas (`gov/` vs `empresa/`) lo garantiza por diseño. Un agente trabajando en GOV no carga contexto de Empresarial y viceversa — eso solo ahorra tokens.

---

## 3. QUIÉN HACE QUÉ — TABLA MAESTRA DE ASIGNACIÓN

| Agente | Dominio | Carpetas que toca | Carpetas PROHIBIDAS | Modelo recomendado |
|---|---|---|---|---|
| **Codex** | Backend, infra, Render, datos, migraciones | `backend/`, `alembic/`, configs de Render | `frontend/` (es de Claude Code) | — (es el dev, no un agente del producto) |
| **Claude Code** | Frontend, lógica de agentes del producto, esquemas, auditoría | `frontend/`, `*.schema`, specs SCR | `backend/app/` core (es de Codex) | — (es el dev) |
| **Claude Master** | Estrategia, validación, planes, handoffs | `cierre-apertura-planeacion/` | código (no escribe código directo) | — |

**Y dentro del PRODUCTO, los agentes que se construyen (call on request):**

| Agente producto | Cuándo se dispara | Qué consume | Qué produce | Autonomía |
|---|---|---|---|---|
| ORCHESTRATOR | Cada request de usuario | request + tenant_id | Ruteo al agente correcto | L0 — solo rutea, nunca ejecuta, nunca cross-tenant |
| LISTENER | Onboarding | voz/texto | Company Profile JSON | L1 — escribe Profile con confirmación del usuario |
| SECTOR | Tras onboarding | Company Profile | Mapa de activación de módulos | L1 — sugiere, usuario confirma |
| (módulos E1, E2, etc.) | Call on request del ORCHESTRATOR | Company Profile | Su entregable con procedencia | Según tabla del v4 (L0–L2) |

---

## 4. CÓMO DEBE EJECUTAR EL AGENTE EJECUTOR (especificación que pediste)

Esta es la característica central. Cómo se comporta CUALQUIER agente que ejecuta una acción, para ser resolutor sin inventar y sin quemar tokens.

### El ciclo de ejecución (fijo, para todo agente)

```
1. RECIBIR — el ORCHESTRATOR le pasa: tarea + Company Profile (o datos del caso) + tenant_id
   → NO recibe el transcript completo. NO recibe el repo. Solo lo que necesita.

2. VERIFICAR PROCEDENCIA — antes de producir nada:
   → ¿Los datos que necesito están en el Profile con fuente? Sí → uso. No → los pido, NO los invento.
   → Si falta un dato verificable y es bloqueante, ESCALO al humano. No relleno con default.

3. DECIDIR EL MÉTODO:
   → ¿Es un cálculo determinista? → función pura, SIN LLM. (PERT→CPM, estimación→factor, semáforo→regla)
   → ¿Es síntesis/interpretación? → LLM (modelo medio), con el Profile como contexto, no más.
   → ¿Es generación de documento? → template + variables del Profile = $0 de API.

4. PRODUCIR CON PROCEDENCIA ADHERIDA:
   → Cada cifra trae: de dónde salió (fuente o fórmula + inputs).
   → Nunca un número "plausible" sin rastro.

5. PARAR EN EL BORDE:
   → ¿Esta acción escribe al mundo externo (envía, firma, presenta, paga, notifica)?
     Sí → PREPARO todo y presento al humano: "está listo, ¿lo ejecuto?". NO lo ejecuto solo.
     No (cálculo, borrador, análisis) → lo entrego completo, resolutivo.

6. REGISTRAR — log inmutable de qué hice, con qué disparador, qué fuente, qué resultado.
   → Esto es la trazabilidad. El agente explica la razón de sus acciones.
```

### Las reglas de token-eficiencia dentro del ciclo

- **El agente lee el Profile, no el transcript.** El transcript se procesa UNA vez (por LISTENER) → Profile. Todos los demás consumen el Profile. (Regla del v4, Cap 7.)
- **El agente carga solo su .md de módulo + el Profile.** No carga otros módulos, no carga el repo.
- **Documento desde template = $0 de API.** Si existe template, no se genera con LLM.
- **Lookup y cálculo = código puro.** Ningún token de LLM para aplicar una regla o sumar.
- **Cache de resultados:** si el mismo cálculo con los mismos inputs ya se hizo, se reutiliza.

---

## 5. LOS TRES NIVELES DE MODELO (asignación por costo)

Para cada tarea, el modelo más barato que la resuelve bien:

| Nivel | Para qué | Tipo de tarea |
|---|---|---|
| **Sin LLM (código puro)** | Lookup determinístico, cálculo, regla, semáforo, PERT/CPM, estimación por factor | Lo más barato: $0 de tokens |
| **Modelo rápido/barato (Haiku-class)** | Ruteo (ORCHESTRATOR), alertas, matching, clasificación | Tokens mínimos |
| **Modelo medio (Sonnet-class)** | Síntesis, análisis, redacción de documentos, interpretación | Tokens moderados, solo cuando se necesita razonar |

**Nunca uses modelo medio para lo que el rápido hace. Nunca uses LLM para lo que el código hace.** Esta sola regla es la diferencia entre $2,500/mes y $25,000/mes a escala.

---

## 6. DÓNDE TRABAJA CADA AGENTE — DISCIPLINA GIT (recordatorio)

- Rama por tarea, vida corta (horas, no días), merge verificado el mismo día.
- `git pull origin main` antes de empezar.
- Build + lint + tests pasan antes de mergear. Pega el resultado (anti-mentira).
- Codex en `backend/`, Claude Code en `frontend/`. Nunca los mismos archivos el mismo día.
- ¿Conflicto? PARA y reporta.
- GOV en `gov/`, Empresarial en `empresa/`. Separación total.

---

## 7. TUS TAREAS DE INTEGRACIÓN PARA MAÑANA (ordenadas por dependencia)

Estas son para ti, founder, antes de que los agentes arranquen en serio. Ordenadas para que cada una desbloquee la siguiente:

**Bloque A — Desbloquear el pipeline (primero, es bloqueante):**
1. **CI / GitHub Actions:** subir el spending limit (Settings → Billing) o repo público para runners gratis. Sin esto, no hay CI verde, no hay merge limpio. ES BLOQUEANTE.

**Bloque B — Navegación de código (para que los agentes no "recuerden", lean):**
2. **Greptile:** integrarlo para navegación semántica del código. Esto sustituye la memoria del agente — un agente nuevo navega el repo sin tener que cargar todo en contexto. Reduce tokens y hace el relevo (doc 09) casi instantáneo. Conéctalo al repo `alquimia-slp`.

**Bloque C — Despliegue y observabilidad:**
3. **Render:** confirmar que Codex tiene acceso, que los logs son legibles (fuente de verdad para errores de deploy), y las env vars de Stripe/Perplexity están bien (el handoff del 14 jun las lista).
4. **CI integrations:** una vez el CI corra, conectar tests verdes → gate de merge automático. Que no se pueda mergear a main con tests rojos.

**Dependencia:** A antes que todo. B y C en paralelo después. No empieces a programar en serio hasta que A esté resuelto — programar sobre un CI muerto es acumular deuda invisible.

---

## 8. RESUMEN DE UN VISTAZO

- **Dos streams paralelos, separación total:** GOV en `gov/`, Empresarial en `empresa/`.
- **Codex = backend. Claude Code = frontend.** Nunca los mismos archivos el mismo día.
- **El agente ejecutor:** recibe lo mínimo → verifica procedencia → método más barato que sirva → produce con rastro → para en el borde de lo irreversible → registra.
- **Token-eficiencia:** lee Profile no transcript; template = $0; código puro para lo determinista; modelo más barato que resuelva.
- **Tus tareas mañana:** CI (bloqueante) → Greptile + Render + gate de merge.
- **Cuando me sature:** doc 09, handoff de relevo, los archivos recuerdan por mí.

---

*10 · Mapa de Trabajo de Agentes · Alquimia Supermind · 15 junio 2026*
