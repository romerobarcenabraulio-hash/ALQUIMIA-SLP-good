# 08 · PLAN DEFINITIVO DE MATERIALIZACIÓN — DE HOY A LA PRIMERA VENTA
**Fecha:** 15 junio 2026
**Autor:** Claude Master
**Horizonte:** 4–6 meses (jun–dic 2026), primera venta PyME pagando antes de fin de año
**Estado:** Plan maestro de ejecución — gobierna todo lo demás
**Reemplaza:** las suposiciones de stack del 02_PLAN_SPRINT y 05_HOJA_DE_RUTA (corregidas a la realidad del handoff)

---

## 0. LAS TRES CORRECCIONES QUE ESTE PLAN INCORPORA

Este plan no parte de cero ni de suposiciones. Corrige tres cosas contra los planes previos:

**Corrección 1 — Stack real (del handoff de Claude Code, 14 jun):**
El stack que CORRE HOY es: FastAPI + SQLAlchemy + Alembic sobre **PostgreSQL en Render**, frontend **React/Vite en Vercel**, único LLM = **Perplexity**, pagos = **Stripe** (ya cableado). El aislamiento de tenants YA ESTÁ (HasTenantId mixin). El rate limiting YA ESTÁ. Hay 1,062 tests verdes. El stack del v4 (Supabase/Anthropic/Deepgram) es una decisión FUTURA para Empresarial, no la base de hoy.

**Corrección 2 — Calendario electoral (verificado 15 jun):**
Elección municipal: **6 junio 2027**. Proceso arranca **septiembre 2026** (presupuestos gubernamentales se congelan). Administraciones entrantes toman posesión ~octubre 2027. Implicación dura: **la venta a gobierno tiene su ventana AHORA (verano 2026, administraciones salientes) o hasta finales de 2027. El negocio NO se apuesta a GOV — se apuesta a Empresarial (PyME), que compra cualquier día sin ciclo electoral.**

**Corrección 3 — El concepto fusionado (de la conversación, 14-15 jun):**
Alquimia es una RED económica, no un ERP. Modo de operación: **call on request** — el ORCHESTRATOR identifica profesión/giro y dispara solicitudes de qué módulos integrar bajo demanda; no modela en tiempo real. Propagación tipo niebla: entrar por un dolor concreto, volverse indispensable por adyacencia, descartar softwares aislados uno por uno. RSU es el conejillo de indias que ejercita las tres mecánicas core (research con procedencia, transacción inter-empresa, credibilidad de red).

---

## 1. LA TESIS EN UNA FRASE

Cerrar GOV-RSU ya (prueba del motor + credibilidad institucional), y usar ese motor probado para lanzar Alquimia Empresarial a PyMEs —empezando por el módulo de mayor valor y menor fricción— hasta tener un cliente pagando antes de fin de 2026. La primera venta no es la meta final; es la validación de que el motor de red funciona con dinero real.

---

## 2. LOS CUATRO PRINCIPIOS DUROS (constitución de construcción)

Gobiernan a cada dev y cada agente de código. No negociables:

1. **Datos de fuente verificable; acciones de catálogo cerrado.** El grafo de acciones es estructura de proceso, no invención de datos.
2. **Cómputo trazable, no valores improvisados.** El agente genera el procedimiento que produce el valor y lo ejecuta determinísticamente; cada cifra trae procedencia. El LLM identifica; el algoritmo calcula. (Ej. del v4: PERT vía CPM determinístico, no LLM.)
3. **Resolutor hasta el borde de lo irreversible.** Autonomía por agente (L0–L3). Nadie ejecuta pago, firma, presentación ante autoridad o notificación externa sin gate humano.
4. **Aprende la experiencia, nunca relaja el rigor.** Personalización en orden/formato/preferencia; PROHIBIDA en procedencia de datos. El agente explica la razón de sus acciones (trazabilidad); la validación de negocio es del humano + reglas duras.

---

## 3. ARQUITECTURA DE EQUIPO — STREAMS, NO HEADCOUNT

La restricción no es cuánto código hay; es cuánto puede validar el founder + Claude Master por día. Por eso el equipo se mide en STREAMS paralelos, no en personas, y se enciende por etapas.

| Etapa | Streams activos | Quién | Por qué |
|---|---|---|---|
| **Cierre GOV (sem 1, jun)** | 1 | Founder + 1 agente código | Trabajo acotado de 5 tareas. Más gente se tropieza. |
| **Empresarial MVP (jul–sep)** | 2 | Backend stream + Frontend stream | Dos capas que no se pisan: lógica/agentes vs pantallas. |
| **Red de Comercio (sep–dic)** | 3 | + stream fiscal/transaccional | El ledger 18-J LIVA + CFDI Carta Porte es delicado, merece frente propio. NO existe hasta que esté especificado. |
| **4º stream** | — | NO se contrata | Solo si un stream se satura crónicamente. Cada stream extra = carga de coordinación cuadrática, no lineal. |

**Regla de oro:** no se enciende el stream N+1 hasta que el stream N esté saturado de trabajo bien especificado y validado sin fricción. El número se gana, no se decide de antemano.

**Asignación por capacidad:**
- Backend/infra/Render/datos → Codex (resistencia en tareas largas, acceso Render)
- Frontend/lógica fina/esquemas/auditoría → Claude Code (rigor sobre velocidad)

---

## 4. EL CALENDARIO — 6 MESES, 4 HITOS DE VALOR

### HITO 0 — CIERRE GOV-RSU · Semana 1 (15–21 junio)
**Meta:** GOV-RSU en producción, desplegable, con lo que YA existe. No se construye, se cierra.

Lo que falta (según handoff de Claude Code, no según suposición):
- Router FastAPI para exponer ContainerInventory (el servicio existe, falta el router)
- Migración Alembic de tabla `containers` (hoy solo en create_all — riesgo en prod)
- KPI Dashboard: endpoints de toneladas, cobertura, semáforo por municipio
- ReportBuilder: PDF ejecutivo por municipio
- **Destrabar CI:** GitHub Actions no corre por spending limit en $0. Acción manual del founder en Settings → Billing.

**Criterio de cierre:** un municipio de prueba recorre el flujo completo, genera su reporte PDF, y los 1,062+ tests corren en CI verde. Documentar en 1 página qué tomó más de lo esperado (disciplina del v4, Cap 12).

**Stream:** 1. **Esto lo haces tú esta semana + 1 agente.**

---

### HITO 1 — FUNDACIÓN EMPRESARIAL · Semanas 2–4 (jun–jul)
**Meta:** los cimientos sobre los que se construye todo Empresarial. Sin esto, el código improvisa.

Solo DOS documentos arrancan código (no 110 — esa era ansiedad del v4):
- `MASTER_SYSTEM.md` — el universo del sistema: qué es, qué capas, qué reglas
- `DATA_MODEL.md` — el Company Profile JSON, la fuente única de verdad

Más las decisiones de arranque:
- **Decisión de stack Empresarial:** ¿se queda en Perplexity o migra a Anthropic + STT/TTS para onboarding de voz? (Recomendación: el onboarding multimodal de voz es diferenciador, pero NO es bloqueante para el MVP. Arranca con formulario de texto → mismo Company Profile JSON. Voz se añade después. No bloquees el MVP por la voz.)
- Proyecto Vercel de Empresarial **separado** del de GOV (variables, dominio, analytics — separación total, regla del v4)
- 3 conversaciones con dueños de PyME: ¿qué documento/proceso te quita el sueño? → define el primer módulo

**Criterio:** MASTER_SYSTEM.md y DATA_MODEL.md aprobados. Company Profile JSON schema cerrado. Primer módulo elegido por evidencia de cliente, no por suposición.

**Stream:** 1–2 (backend empieza el Company Profile; founder hace las entrevistas PyME).

---

### HITO 2 — PRIMER MÓDULO EN PRODUCCIÓN · Mes 2–3 (jul–ago)
**Meta:** un cliente PyME beta PAGANDO. No gratis. El precio valida el valor.

El módulo de arranque (recomendación, sujeta a las 3 entrevistas):
- **MODULE_E1_ENERGY** es el candidato del v4: el más rápido, valor más claro (reduce un costo concreto), no requiere la Red de Comercio. Captura consumos, contrasta vs benchmarks CONUEE/SENER por giro SCIAN, top 10 iniciativas con ROI.
- PERO: si las 3 entrevistas revelan que el dolor #1 es otro (ej. un documento legal/contable recurrente), el primer módulo es ESE. El cliente define, no el plan.

Flujo del módulo (call on request, no tiempo real):
1. Onboarding texto → Company Profile JSON (LISTENER, aunque sea por formulario primero)
2. ORCHESTRATOR identifica giro → SECTOR_AGENT propone mapa de activación
3. El módulo elegido consume el Profile → produce su entregable con procedencia
4. Gate humano antes de cualquier output que se use externamente

Antes de tocar frontend: escribir el `SCR_*.md` de cada pantalla (regla del v4 — sin SCR aprobado, no se abre ticket de UI).

**Criterio:** 1 cliente pagando $400–800 MXN/mes, usando el módulo en operación real, con el dato capturado una vez y reutilizado.

**Stream:** 2 (backend del módulo + frontend de sus pantallas).

---

### HITO 3 — RED DE COMERCIO + SEGUNDO MÓDULO · Mes 4–6 (sep–dic)
**Meta:** activar el efecto de red — el moat real — y ampliar a un segundo módulo por adyacencia.

- **MODULE_E2** (circularidad + Red de Comercio): el Sankey de residuos convierte residuo de costo a activo; la empresa publica residuos desde los datos del Sankey (sin capturar nada nuevo); COMMERCE_AGENT encuentra compradores verificados; comisión por transacción.
- **Capa fiscal (stream 3, delicado):** ledger de retenciones Art. 18-J LIVA, CFDI con Complemento Carta Porte 3.1, manifiesto, constancia de disposición valorizada. **REQUISITO PREVIO del v4: contador especialista en plataformas digitales + abogado fiscal validan ANTES de la primera transacción real.** No es opcional ni posterior.
- Verificación obligatoria antes de cualquier transacción: generador con REPAS/RIPA vigente, comprador con autorización SEMARNAT activa. Sin esos documentos, marketplace bloqueado.

**Por qué esto es el moat:** aquí nace el grafo inter-empresa. Cuando empresa A y su proveedor B están ambos dentro, sus agentes trabajan juntos desde el día uno. Eso es lo que hace irrelevante a Oracle/SAP — no por ser mejor en todo, sino por ser insustituible en la red.

**Criterio:** primer deal real en la Red de Comercio, con documentación fiscal correcta y validada por especialista.

**Stream:** 3 (se enciende el frente fiscal/transaccional).

---

## 5. ECONOMÍA DEL SISTEMA (por qué esto es viable)

Del v4, validado como sensato:
- Documento generado desde template con variables del Company Profile = **$0 de API**
- Costo por empresa onboardeada: $3–6 USD one-time
- Costo mensual por empresa activa: $0.50–2 USD
- A 1,000 empresas: API total $2,500–6,000 USD/mes vs revenue $200,000–600,000 USD/mes

Tres niveles de modelo por costo-beneficio:
- **Ruteo + alertas + matching:** modelo barato/rápido (Haiku-class)
- **Síntesis + análisis + documentos:** modelo medio (Sonnet-class)
- **Lookup determinístico + cálculo (PERT, estimaciones, semáforos):** SIN LLM, código puro

La restricción de dinero no son los devs ni el API. Es el tiempo de founder para validar. Por eso el plan protege ese tiempo con streams escalonados.

---

## 6. EL ICP — A QUIÉN LE VENDES (del v4, confirmado)

PyME mexicana: 10–200 empleados, ingresos $2M–$80M MXN/año, giros de servicios profesionales / transporte / manufactura ligera / comercio, en Monterrey / CDMX / Guadalajara. Dolor agudo (ninguna consultoría los atiende bien), poder adquisitivo para $400–800 MXN/mes, estructura suficiente para onboarding sin ERP complejo.

**Tu ubicación (Guadalupe, NL) es ventaja:** Monterrey es uno de los tres mercados ICP. Las primeras 3 entrevistas PyME deberían ser locales.

---

## 7. LO QUE NO SE HACE EN 6 MESES (anti-dispersión, escrito para frenarte)

- ❌ Los 110 archivos .md de golpe. Se escriben los que cada hito necesita, cuando los necesita.
- ❌ Onboarding de voz como bloqueante del MVP. Texto primero, voz después.
- ❌ Migration Copilot / adaptadores ERP (CONTPAQi, SAP). Eso es P5 del v4, mes 12+.
- ❌ Auto-Neurogenesis. Años, no ahora.
- ❌ Multi-país, fine-tuning por giro. Escala lejana.
- ❌ "Un Jarvis por trabajador". Se gana cuando un cliente lo pide y paga.
- ❌ Apostar el negocio a la venta a gobierno. GOV es prueba y credibilidad, no el revenue principal.

**El filtro para cada tentación de construir algo nuevo:** ¿esto fortalece el grafo inter-empresa (la red), o es solo otra función intra-empresa (otro ERP)? Si es lo segundo y no hay cliente pagando que lo pida, no se construye.

---

## 8. RIESGOS REALES Y SUS MITIGACIONES

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Contradicción de stack frena el arranque | Alta | RESUELTA: stack del handoff es la base. Migración es decisión separada de Empresarial. |
| Validación fiscal 18-J LIVA se subestima | Alta | Contratar contador+abogado fiscal ANTES de Red de Comercio (Hito 3). No después. |
| Founder se satura validando | Media-Alta | Streams escalonados (1→2→3). No encender el siguiente hasta saturar el actual. |
| El primer módulo elegido por suposición, no por cliente | Media | 3 entrevistas PyME definen el módulo. El cliente manda. |
| CI bloqueado retrasa merges limpios | Cierta (ya pasa) | Founder destraba spending limit GitHub esta semana. Bloqueante. |
| Dispersión hacia la visión grande | Alta (patrón conocido) | Este documento + el filtro de la sección 7. Releer cuando tiente construir de más. |

---

## 9. PRÓXIMOS DOCUMENTOS QUE GENERO

1. `09_HANDOFF_CIERRE_GOV_SEMANA1.md` — las 5 tareas concretas de Hito 0, repartidas, sobre stack real
2. `10_TESIS_RED_ECONOMICA.md` — la tesis de 2 págs para socio/inversionista (red vs ERP, propagación niebla, moat del grafo)
3. `11_COMPANY_PROFILE_JSON_SPEC.md` — el schema de la fuente única de verdad, cuando arranque Hito 1

---

## 10. LA PRIMERA ACCIÓN, SIN AMBIGÜEDAD

**Esta semana, tú:**
1. Destrabar el CI de GitHub (Settings → Billing → spending limit)
2. Cerrar las 5 tareas de Hito 0 con 1 agente de código
3. Agendar 3 conversaciones con dueños de PyME en Monterrey

Con eso, GOV queda cerrado y Empresarial tiene su primer dato real de cliente para elegir el módulo de arranque. El resto del plan se desdobla desde ahí.

---

*08 · Plan Definitivo de Materialización · Alquimia Supermind · 15 junio 2026*
