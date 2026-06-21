# 32 · PRE-MORTEM — RIESGOS, INCÓGNITAS Y QUÉ NO GARANTIZAMOS
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — en modo crítico, a la segura
**Método:** Asumimos que Alquimia fracasó. ¿Por qué? Rastreamos cada causa antes de que ocurra. Paranoia productiva: cada riesgo → mitigación → ¿cubierto o GAP→issue?

---

## 1. LO QUE NO GARANTIZAMOS (apuestas no validadas — sé honesto)
1. **Que haya una primera venta.** Todo el plan costo-cero asume que un cliente paga y eso financia el resto. **Si la venta no llega, las capas de pago (LLM, voz) nunca se encienden y nos atoramos.** ← el riesgo #1 de negocio. → ALQ-78.
2. **Calidad/disponibilidad de datos públicos** (INEGI/CONAPO/SEMARNAT): sin SLA, cambian schema, se caen, incompletos. La cobertura legal municipal puede quedar AMARILLA mucho tiempo.
3. **Que el anti-sesgo/anti-sicofancia funcione** (ADR-002 es diseño, no resultado probado). Se mide, no se asume → ALQ-68.
4. **Que el cliente dé buenos datos** (garbage-in → Profile malo) → ALQ-73.
5. **Que la elección del primer módulo sea correcta** (3 entrevistas = muestra chica) → ALQ-33.
6. **El precio** ($400–800 MXN/mes) no está validado con clientes reales.
7. **Línea base de tests real** desconocida hasta correr pytest → ALQ-31.

---

## 2. FAILURE MODES POR ÁREA (qué nos hace fallar)

### Datos & fuentes (es nuestro moat → es nuestro mayor riesgo)
- APIs públicas caídas/cambiadas/rate-limited → caché + fallback + cobertura honesta (✅) pero sin garantía.
- Reglamentos municipales sin fuente nacional curada → gap legal (AMARILLO, diferido).
- **Garbage-in del usuario** → validación de intake + tag procedencia (usuario vs verificado) → **ALQ-73 (GAP)**.
- **Bibliografía/estándares vencidos** (GRI/ISO/NOM/SCIAN/18-J cambian) → corpus con versión+fecha+fuente → **ALQ-77 (GAP)**.
- Inyección de prompt desde web/evidencia → firewall (✅ diseño) + testear → ALQ-18/74.

### IA & agentes
- **Alucinación** (LLM inventa cifras/hechos) → "el LLM nunca calcula" + procedencia + verificación (✅ principio) pero la síntesis puede mentir → auditoría ALQ-19.
- **Sicofancia/sesgo** → ADR-002 + calibración (medir) → ALQ-66/68.
- **Sobre-autonomía / bug en el gate** → si un agente ejecuta lo irreversible sin gate = desastre. El gate debe ser **fail-safe (default-deny)** → **ALQ-75 (GAP)**.
- **Agentes que fallan en silencio / loops / costo desbocado** → timeouts, presupuesto por agente, circuit breakers → **ALQ-74 (GAP)**.

### Triggers (cómo funcionan — y cómo fallan)
- **Cómo funcionan:** motor ECA (doc 31) — disparador determinista (umbral/fecha/KPI) → acción → razón(estándar) → gate en irreversible.
- **Cómo fallan:** falsos positivos (spamear al mecánico / facturar de más), falsos negativos (no actuar), **tormentas de triggers** por un glitch de datos. → idempotencia + debounce + dry-run + umbrales de confianza + rate limit → **ALQ-74 (GAP)**.

### Infra & costo
- Escenario 2 (trabajo 14-jun perdido) → reconstruir (ALQ-13). Baseline real pendiente (ALQ-31).
- Render free tier duerme / sin DR → backups + DR (ALQ-47).
- **Costo desbocado** si se enciende automatización/LLM por error (caso $1,800 doc 20) → costo-cero + gate de billing (doc 24).
- **Dependencia de proveedores** (Render/Vercel/Stripe/Anthropic/Greptile/Linear): cambian precio/términos (el cambio del 15-jun ya nos pegó) → router de capacidades multi-proveedor (ALQ-27) mitiga parcial; mantener portabilidad.
- Migraciones que rompen datos de prod → idempotentes + backup + gate (REGLAS §4).

### Negocio & mercado
- Sin venta → atorados (ALQ-78). Ventana electoral GOV (doc 08). Competencia/timing. Precio no validado.

### Legal & cumplimiento
- LFPDPPP (datos de cliente+empleados, consentimiento, brecha) → ALQ-55.
- Fiscal 18-J/CFDI mal = liability grave → especialista ANTES (ALQ-34/42).
- **Dar "consejo de negocio/financiero/fiscal" y que el cliente actúe y salga mal** → disclaimers + gate + framing "no es asesoría definitiva" → **ALQ-76 (GAP)**.
- Actuar a nombre del cliente (correos, trámites) → autorización explícita + gate.

### Personas & ejecución
- **Founder = cuello de botella y persona-clave** (validación + único dueño). Riesgo de un solo punto de falla. → streams escalonados (doc 08) + relevo de agentes (doc 09); pero el founder no es relevable hoy.
- Complejidad del propio plan (32 docs, ~78 issues) → riesgo de coordinación → disciplina de cadencia (doc 17) + Linear como única ejecución.

---

## 3. PERSPECTIVAS QUE FALTAN (¿de quién no hemos pensado?)
- **El empleado que usa el Jarvis:** ¿lo adoptará? Cambio cultural/usabilidad → ALQ-57 (nav fácil) ayuda, pero la adopción no está garantizada.
- **El dueño PyME (comprador):** confianza + disposición a pagar → entrevistas (ALQ-33).
- **El gobierno (compra pública):** proceso, política, tiempos.
- **El regulador (SEMARNAT/SAT):** cumplimiento.
- **El inversionista/socio:** la tesis (TESIS_RED, pendiente).
- **El escéptico/competidor:** ¿qué dirían que está mal? (este doc es ese ejercicio).

---

## 4. RESPUESTAS A TUS PREGUNTAS CONCRETAS
- **¿Cómo se harán los triggers?** Motor ECA determinista (doc 31) + salvaguardas (idempotencia/debounce/dry-run/gate) → ALQ-69 + ALQ-74/75.
- **¿Qué agentes?** Roster completo en doc 29 (ORCHESTRATOR→último + capa NOUS + Jarvis).
- **¿Qué datos de la web?** Research vía Serper+Anthropic (cacheado, con procedencia, firewall anti-injection): reglamentos, precios, noticias/mercado. Nunca dispara acción irreversible directa.
- **¿Qué bases de datos internas pedimos al usuario?** (intake del Company Profile, validado — ALQ-23/73): finanzas básicas, operación/procesos, equipo/maquinaria, empleados/roles, documentos, herramientas que ya usa (para conectar). Cada dato etiquetado usuario-vs-verificado, con confianza.
- **¿Qué obtenemos de bibliografía?** Corpus de estándares/regulación con versión+fecha+fuente (GRI/SASB/ODS/ISO, NOM/LGPGIR, SCIAN, 18-J/CFDI) → ALQ-77. El sistema cita siempre la versión vigente.

---

## 5. DECISIONES QUE REQUIEREN AL HUMANO (no las asumimos)
- Repo público / billing CI (ALQ-7). · Resolver/aceptar Escenario 2 (✅). · Primer módulo (tras entrevistas, ALQ-33). · Precio real. · Persistencia del Jarvis (ADR-001). · Encender cada API de pago (Hito 2). · Aprobar cada merge a main + cada acción irreversible (gate). · Contratar contador/abogado (ALQ-34). · Cuándo abrir la Red de Comercio. · Plan de venta/pipeline (ALQ-78).

---

## 6. NUEVOS ISSUES DE ESTE PRE-MORTEM (IDs reales en Linear — autoritativo)
- **🔴 ALQ-73** Plan de ingreso / pipeline de venta (mitiga el riesgo #1: "sin venta = atorados").
- **🔴 ALQ-74** Fail-safe del Gate (default-deny; lo irreversible NUNCA se ejecuta sin aprobación, ni por bug).
- **ALQ-75** Robustez de agentes y triggers (timeouts, presupuesto, circuit breaker, idempotencia/debounce/dry-run).
- **ALQ-76** Validación de datos en intake (anti garbage-in).
- **ALQ-77** Corpus de estándares/bibliografía con versión+fecha+fuente.
- **ALQ-78** Disclaimers de responsabilidad (no es asesoría legal/financiera/fiscal definitiva).
*(Las menciones de ALQ-NN en las secciones 1–5 son por tema; esta lista §6 es la autoritativa de IDs.)*

---

## 7. CONCLUSIÓN DE SOCIO
No estamos soñando: el plan es sólido y la arquitectura es defendible. Pero los tres riesgos que de verdad pueden hundirlo son: **(1) que no llegue la primera venta** (ALQ-73), **(2) un fallo del gate o un trigger desbocado** que haga algo irreversible mal (ALQ-74 gate + ALQ-75 triggers), y **(3) calidad de datos** (ALQ-76 intake + ALQ-77 corpus). Esos tres merecen tu atención por encima del resto. Todo lo demás está cubierto o mitigado.

---

*32 · Pre-mortem y Registro de Riesgos · Alquimia Supermind · 17 jun 2026*
