# 36 · MARCO BUILD vs INTEGRATE vs BUY — REPLICAR / APROVECHAR / COMPRAR
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork)
**Propósito:** Operacionalizar la filosofía: balance entre **aprovechar lo que ya existe (integrar)** y **crear lo que sí debemos replicar (build)**, más **comprar materia prima** cuando aporta. Cost-benefit por capacidad. Para no construir lo que no debemos ni hacerle la vida cara al cliente.

---

## 1. LA REGLA DE DECISIÓN (3 preguntas, en orden)
1. ¿Es nuestro **diferenciador/moat** o exige nuestro rigor (determinista + procedencia)? → **REPLICAR** (build).
2. ¿El cliente **ya lo usa** o es commodity con API? → **INTEGRAR** (conectar lo suyo; ni construir ni hacerle comprar).
3. ¿Es **dato/capacidad licenciable** que no podemos generar y aporta valor? → **COMPRAR** (diferido a ingreso; lo absorbemos nosotros, minimizando la carga del cliente).

**Filtro de oro:** ¿fortalece el grafo/moat? → replicar · ¿es plomería? → integrar · ¿es materia prima externa? → comprar.

**Principio que lo gobierna todo:** *minimizar las suscripciones que el cliente paga aparte.* Cada cosa que el cliente NO tiene que contratar por separado es una razón más para quedarse con nosotros (la capa unificada, doc 35).

---

## 2. MATRIZ APLICADA (cost-benefit por capacidad/competidor)

| Capacidad / competidor | Decisión | Por qué | Cost-benefit |
|---|---|---|---|
| Diagnóstico, finanzas (ROI/TIR/VAN), org-builder, juicio, ECA, situational awareness, procedencia | **REPLICAR** | es el moat + requiere rigor trazable | costo alto, pero ES el producto |
| **Slack/Teams (comms)** | **INTEGRAR** lo del cliente | construir chat = competir con Slack (perdemos) | conector barato; el Jarvis usa lo que ya tienen |
| **Gmail/Drive/Calendar/Copilot/Gemini** | **INTEGRAR** | son del cliente, commodity con API | router de capacidades (ALQ-27/52) |
| **Contabilidad (CONTPAQi)/ERP** | **INTEGRAR** (no replicar) | incumbentes pesados; los rodeamos (niebla) | conector cuando aplique |
| **DocuSign (firma)** | **INTEGRAR** | firma = acción irreversible vía conector + gate | bajo costo |
| **CRM/pipeline (Salesforce)** | **REPLICAR-lite** (módulo por demanda) | tracking simple = un módulo de la fábrica, no un CRM gigante | solo si el cliente lo pide |
| **BI/dashboards (Power BI/Tableau)** | **REPLICAR-lite** | dashboards con procedencia integrados al flujo | reusa KPIs existentes |
| **Datos de mercado/financieros (Bloomberg)** | **COMPRAR** feed (o integrar gratis) | no generamos data de mercado; el cliente NO lo contrata | diferido; pass-through o tier premium |
| **Benchmarks por sector (SCIAN, CONUEE/SENER)** | **COMPRAR/INTEGRAR** | materia prima de validez | diferido; registro de fuentes (ALQ-82) |
| **Voz premium (ElevenLabs)** | **COMPRAR** (o open-source primero) | TTS premium = materia prima | diferido (doc 24); MeloTTS primero |
| **STT / Vision-LLM** | **INTEGRAR/COMPRAR** (hospedado) | capacidad existente, pago por uso | diferido (doc 23) |
| **Modelos frontera (LLM)** | **INTEGRAR** (orquestar, no construir) | jamás construir un LLM | ADR-001 |

---

## 3. RESPUESTA A TUS EJEMPLOS
- **¿Slack en nuestro sistema?** No. Integrar el del cliente. El Jarvis es la interfaz inteligente que actúa; el chat ya lo tienen.
- **¿El cliente contrata datos financieros?** No. Integramos gratis lo común; lo profundo lo compramos nosotros y lo ofrecemos como feature. El cliente no carga esa suscripción.

---

## 4. CÓMO SE APLICA (gobernanza)
Cada capacidad nueva (de los registros ALQ-56 módulos / ALQ-64 capacidades) se **etiqueta build/integrate/buy** con su cost-benefit antes de construir. Así no replicamos plomería ni compramos lo que debemos crear. → **ALQ-90** (registro de decisiones build/integrate/buy).

---

## 5. CONCLUSIÓN DE SOCIO
Tu filosofía es exactamente correcta y ahora es regla: **replicar solo el moat, integrar la plomería que el cliente ya tiene, comprar la materia prima — y minimizar lo que el cliente paga aparte.** Eso es lo que nos hace baratos, rápidos e insustituibles a la vez. Cada vez que dudemos "¿lo construimos?", la respuesta por defecto es: *si no es moat, no.*

---

*36 · Marco Build/Integrate/Buy · Alquimia Supermind · 17 jun 2026*
