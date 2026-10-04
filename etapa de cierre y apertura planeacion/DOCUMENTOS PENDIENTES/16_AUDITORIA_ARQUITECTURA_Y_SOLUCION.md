# 16 · AUDITORÍA DE ARQUITECTURA + SOLUCIÓN INNOVADORA
**Fecha:** 15 junio 2026 (noche)
**Autor:** Claude Master (Cowork) — verificado contra el repo
**Propósito:** Resolver POR ADELANTADO los supuestos que Codex y Claude Code harían solos. Cada supuesto sin resolver = un agente improvisando una decisión de arquitectura = deuda. Este doc convierte supuestos en decisiones.
**Norte:** consultoría instantánea, nacida y corriendo desde el sistema. "Palantir a nuestros pies" (no literal): nuestra competencia es la consultoría tradicional lenta; nuestra arma es la red + la procedencia + la instantaneidad.

---

## 1. INVENTARIO DE DATASETS Y APIS — LO QUE EL SISTEMA NECESITA (verificado)

### Wired (ya integrado en el repo)
| Capa | Fuente/API | Estado | Alimenta |
|---|---|---|---|
| Datos públicos MX | INEGI (MGN, DENUE, SAKBÉ ruteo) | adapter ✓, tokens en env | catálogo municipal, centros de acopio, ruteo |
| Demografía | CONAPO | adapter ✓ | población/proyección |
| Pobreza/marginación | CONEVAL | adapter ✓ | contexto socioeconómico |
| Residuos | SEMARNAT (DBGIR) | adapter ✓ | generación RSU, factores |
| Clima | SMN | adapter ✓ | logística, orgánicos |
| Finanzas | Banxico (+inflación) | adapter ✓ | costos, indexación |
| Geo | Google Places/Geocoding/Maps/Optimization | env ✓ | mapas, ruteo |
| Research web | Serper | env ✓ | reglamentos, precios (con caché) |
| LLM síntesis | Anthropic (ÁGORA) | env ✓ | documentos, síntesis |
| Pagos | Stripe | cableado ✓ | suscripciones, webhooks |
| Email/SMS | Resend / Twilio | env (opcional) | registro, 2FA |

### Diferido / a decidir
| Perplexity | DIFERIDO (sin presupuesto) — Serper+Anthropic cubren research hoy |
| Voz (STT/TTS) | Empresarial Hito 1+, NO bloqueante (texto primero) |

### Faltante / a definir (para el lado Empresarial / cliente)
- **Conectores del cliente** (su Gmail, su Copilot, su Gemini, su Drive): el sistema debe orquestarlos vía la **abstracción de proveedor** (router de capacidades). Hoy hay Google service account para Drive export; el resto se define en el contrato del Capability Catalog (`14` §5).
- **Fiscal (Hito 3, NO ahora):** SAT/CFDI, Complemento Carta Porte 3.1 — requiere validación de contador+abogado ANTES de cualquier transacción real (regla `08`).

**Decisión [resuelta]:** el MVP no necesita Perplexity ni voz ni fiscal. Con lo wired alcanza para diagnóstico nacional + primer módulo Empresarial. No encender lo diferido sin presupuesto/cliente.

---

## 2. EL FLUJO COMPLETO — DE LA ENTREVISTA AL SISTEMA DEL CLIENTE (con supuestos resueltos)

```
GitHub repo (alquimia-slp)
   │  push → CI verde → deploy
   ├─ Backend → Render (FastAPI + Postgres)
   └─ Frontend → Vercel (React/Vite)  → DEMO de la app de planificación
        │
        ▼
   [1] ENTREVISTA (LISTENER, Class A, L1)
        texto primero (voz después). 
        Supuesto resuelto: el intake sigue el intake_schema del doc 14 §2-3 →
        compuerta de insumos (qué se necesita ANTES de asumir).
        │  produce
        ▼
   [2] COMPANY PROFILE JSON  ← fuente única de verdad del tenant
        Supuesto resuelto: schema = el COMPANY_PROFILE_JSON_SPEC (pendiente, Hito 1).
        Datos con procedencia. Aislado por tenant_id (HasTenantId ya en repo).
        │
        ▼
   [3] ORCHESTRATOR (Class A, L0)
        identifica giro/profesión + tenant → rutea. No produce, no cruza tenant.
        │
        ▼
   [4] SECTOR (Class A, L1) → propone mapa de activación de módulos (call on request)
        │  usuario confirma
        ▼
   [5] MÓDULO(S) (Class A→producen para B, L2)
        consumen el Profile → entregable con procedencia → paran en el borde
        │
        ▼
   [6] JARVIS del tenant (Class B) — instanciado desde la entrevista
        personaliza, orquesta las herramientas del cliente, aprende su entorno
        (learning store externo, con procedencia; nunca auto-modifica acciones)
        │
        ▼
   [7] DEMO / APP DE PLANIFICACIÓN (Vercel)
        el cliente ve su plan ejecutable, sus documentos, sus conexiones de comercio
```

**Cada flecha es un contrato, no una suposición.** Los contratos: intake_schema (1→2), Company Profile spec (2), reglas de ruteo del orchestrator (3), mapa de activación del sector (4), output_contract de cada módulo (5), lifecycle del Jarvis (6, doc ADR-001 action item). Donde un contrato no existe aún, está listado en §5 como decisión pendiente — para que el agente NO lo invente.

---

## 3. CÓMO SE CONSTRUYE EL CÓDIGO Y EL FRONTEND (supuestos resueltos)

| Pregunta que el agente haría | Decisión (resuelta aquí) |
|---|---|
| ¿Dónde vive GOV vs Empresarial? | Separación total: `gov/`+RSU (cerrando) vs `empresa/` (arrancando). Nunca los mismos archivos el mismo día. |
| ¿Quién toca qué? | Codex = backend/datos/migraciones/Render. Claude Code = frontend/specs/auditoría. (`10` §3) |
| ¿Orden? | La spec precede al código (doc 14). Sin SCR aprobado, no se abre ticket de UI. |
| ¿LLM propio? | No. Se orquestan modelos frontera vía router de capacidades. (`14` §1) |
| ¿Cómo se despliega el demo? | GitHub → CI verde → backend a Render, frontend a Vercel. Proyecto Vercel de Empresarial SEPARADO del de GOV. |
| ¿Catálogo de acciones? | Modelo de tiers (ADR-001 rev.1): conocimiento/soluciones abiertos; acciones irreversibles gobernadas + gate. |
| ¿Aislamiento de datos? | tenant_id en todo (HasTenantId ya existe). Class B aislado por tenant; Class A compartido. |
| ¿Procedencia? | Obligatoria en todo output. `if_missing` ∈ {ask, escalate, block}, nunca invent. |
| ¿Estimaciones? | Determinista, sin LLM (factores SEMARNAT, PERT/CPM, semáforos). LLM solo síntesis. |

---

## 4. EL ÁNGULO INNOVADOR — POR QUÉ ESTO ES "CONSULTORÍA INSTANTÁNEA" (y por qué es el moat)

La consultoría tradicional es lenta porque cada engagement re-investiga desde cero, sin memoria, sin red, sin procedencia reutilizable. Nuestra arquitectura ataca exactamente eso:

1. **Procedencia reutilizable:** un dato verificado una vez (con fuente) se reutiliza en todo el grafo. El research no se repite. (Token-eficiencia + velocidad.)
2. **El grafo inter-empresa es el moat, no la tecnología.** Cuando empresa A y su proveedor B están dentro, sus Jarvis trabajan juntos desde el día uno. Eso es lo que hace irrelevante a un software aislado: no por ser mejor en todo, sino por ser insustituible en la red.
3. **Instantaneidad = determinista + caché + templates.** El documento desde template = $0 y es inmediato. El cálculo determinista no espera a un LLM. El LLM solo donde hay que razonar.
4. **Honestidad como producto:** decir qué NO se sabe (cobertura AMARILLA/ROJA, gate humano en lo irreversible) es lo que lo hace defendible ante gobierno e inversionista. Palantir vende opacidad de inteligencia; nosotros vendemos trazabilidad de inteligencia.
5. **El conocimiento evoluciona (rev.1):** el sistema lee estándares y artículos nuevos y mejora las recomendaciones, sin tocar la procedencia de los datos fijos del cliente. No se queda atrás.

**Traducción a arquitectura (no marketing):** el moat se construye con (a) el Company Profile como fuente única de verdad reutilizable, (b) el grafo de acciones/relaciones inter-tenant, (c) el protocolo del ejecutor con procedencia, (d) el router de capacidades sobre IA existente. Si esos cuatro están bien, "consultoría instantánea" es una consecuencia, no un eslogan.

---

## 5. DECISIONES QUE SOLO TÚ PUEDES TOMAR (acotadas — para no improvisar)

Resolví todo lo resoluble. Estas quedan para ti porque dependen de criterio de negocio, no técnico:

1. **Alcance de la Ola 1 del diagnóstico:** ¿4 ZMs + sus 4 estados completos, o solo las 4 ZMs? (Afecta tiempo y costo de research de reglamentos.)
2. **Primer módulo Empresarial:** el `08` recomienda E1 Energía, pero dijo "lo definen 3 entrevistas PyME". ¿Ya tienes señal de cuál es el dolor #1, o agendamos las entrevistas primero?
3. **Persistencia del Jarvis (Class B):** ¿persistente por tenant (más memoria, más costo) o instanciado on-request (más barato)? (De ADR-001.)
4. **Conectores del cliente prioritarios:** ¿Gmail/Drive primero, o Copilot/Gemini? (Define el primer adaptador del router de capacidades.)
5. **Perplexity:** ¿se mantiene diferido (Serper+Anthropic) o hay presupuesto para encenderlo?

---

## 6. LOS SUPUESTOS QUE QUEDAN BLOQUEADOS PARA EL AGENTE (resumen)

Para que Codex/Claude Code NO improvisen, ningún agente decide por su cuenta: el schema del Company Profile, las reglas de ruteo del orchestrator, el lifecycle del Jarvis, la lista reversible/irreversible, ni los conectores del cliente. Todos esos son **documentos de contrato** (doc 14 action items + el COMPANY_PROFILE_JSON_SPEC pendiente). Hasta que existan y estén firmados, el agente que los necesite **escala, no asume.**

---

## 7. PRÓXIMOS CONTRATOS A ESCRIBIR (en orden, Hito 1)
1. `COMPANY_PROFILE_JSON_SPEC.md` — la fuente única de verdad (bloquea el flujo §2).
2. Lista reversible/irreversible (ADR-001 action #2) — bloquea el catálogo de acciones.
3. Reglas de ruteo del ORCHESTRATOR + mapa de activación del SECTOR.
4. Lifecycle del Jarvis (Class B).
5. Contrato del router de capacidades (proveedores del cliente).

Dime "arranca el COMPANY_PROFILE_SPEC" y lo escribo — es el que desbloquea más cosas.

---

*16 · Auditoría de Arquitectura + Solución Innovadora · Alquimia Supermind · 15 junio 2026 (noche)*
