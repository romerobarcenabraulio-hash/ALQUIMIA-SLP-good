# 42 · Análisis de brechas — lo que una plataforma así DEBE tener y no se ha solicitado
**Lente:** consultor McKinsey + arquitecto/dev senior. Crítico, priorizado, no exhaustivo por exhaustivo.
**Fecha:** 20 jun 2026 · Autor: Claude Master

## Tesis gobernante
El **cerebro** (ontología, agentes, juicio NOUS, ECA, scraping, data moat, módulo=bundle, Jarvis) está diseñado a profundidad de clase mundial. Las brechas **no** están en la inteligencia. Están en las cuatro capas que convierten un sistema inteligente en un **negocio vendible, defendible, seguro y no demandable**:

1. **CONFIANZA** (seguridad, privacidad, gobernanza de IA) — sin esto no le vendes a gobierno ni a empresa grande.
2. **MOTOR COMERCIAL** (pricing, GTM, éxito del cliente, SLAs) — sin esto el producto no se vuelve ingreso.
3. **RESILIENCIA OPERATIVA** (DR, calidad de dato, observabilidad, FinOps de IA) — sin esto la escala te rompe.
4. **ÉTICA/RESPONSABILIDAD DEL DOMINIO** — automatizar asesoría a gobiernos es un riesgo existencial sin scope.

Orden de lectura: si solo atiendes una, es la #1 (Confianza) porque es el portero de tu mercado.

---

## 1 · CONFIANZA — el portero del mercado (gobierno + enterprise)
Lo que falta y por qué duele si no está:

- **Aislamiento multi-tenant probado + soberanía de datos MX.** Vender a municipios/empresas exige garantía de que el dato de uno no toca al otro, y residencia de datos en México (LFPDPPP). *Riesgo si falta:* un solo cruce de datos entre tenants te mata la marca.
- **Cumplimiento como roadmap, no como ocurrencia:** SOC 2 / ISO 27001, cifrado en reposo y tránsito, gestión de llaves, clasificación de PII, derecho al olvido. *Mínimo viable:* bitácora inmutable + cifrado + DPA (data processing agreement) firmable.
- **Control de acceso fino:** RBAC (ALQ-51) + atributos + seguridad a nivel de fila (row-level). El perfil de usuario (ADR-004) DEBE colgar de esto, no al revés.
- **Gobernanza de IA (apuestas todo a los agentes):** detección de alucinación, calibración de confianza (NOUS la inicia), versionado de prompts/modelos con rollback, cola de revisión humana con SLA de escalamiento. *Riesgo si falta:* un agente recomienda mal a un municipio y no hay traza ni reversa.
- **Explicabilidad auditable:** cada recomendación debe rastrearse hasta su fuente para un auditor o un ciudadano. Procedencia por valor ya existe; falta el "por qué" de la decisión completa.

## 2 · MOTOR COMERCIAL — convertir inteligencia en ingreso
Tienes Stripe cableado, pero no la estrategia que lo llena:

- **Modelo de pricing y empaquetado:** ¿por asiento? ¿por tenant? ¿por resultado (outcome-based)? ¿por horas-consultor ahorradas? Esto define toda la arquitectura de medición de uso. *No está decidido.*
- **Movimiento de ventas:** pilot → land → expand; framework de prueba-de-valor; **calculadora de ROI para el COMPRADOR** (distinta del TIR interno que ya calculas).
- **Éxito del cliente / implementación:** la entrevista→instanciar Jarvis existe, pero falta onboarding, capacitación, **gestión del cambio** (la PYME que "no tiene idea" necesita acompañamiento, no solo software).
- **Contratos y SLAs:** plantillas de SOW, definición de SLA, DPA, niveles de soporte. Ligado a tu idea de "redactar contrato a abogado".
- **Estrategia de canal/partner:** integradores como tu amigo de BIWO; un programa, no un favor.

## 3 · RESILIENCIA OPERATIVA — que la escala no te rompa
- **DR / backup / RTO-RPO.** *Ya sabes el riesgo:* el Postgres free de Render se borra a los 30 días. Falta política de respaldo y recuperación formal.
- **Monitoreo de CALIDAD DE DATO como sistema de primera clase.** Garbage in = consultoría equivocada = responsabilidad legal. Falta: frescura del scraping (¿hace cuánto no se actualiza esta fuente?), detección de anomalías, alertas de dato viejo.
- **Observabilidad de negocio, no solo logs** (FASE9/10 cubre parte): métricas de uso, freshness, salud de agentes.
- **FinOps de IA:** presupuesto de tokens por tenant, límites duros, degradación elegante. *Crítico para tu costo-cero→escala:* sin esto, un tenant pesado te quema el margen.
- **Límite de tasa / anti-abuso / cuotas.**

## 4 · ÉTICA Y RESPONSABILIDAD DEL DOMINIO — el riesgo existencial
Automatizar asesoría a **gobiernos sobre gasto público** es categoría aparte:

- **Sesgo/justicia en recomendaciones de política pública** (zonificación, salud, educación): una recomendación sesgada es titular de periódico y demanda.
- **Anticorrupción y conflicto de interés** en procurement: si asesoras gasto, debes ser auditable ante contraloría.
- **Frontera del alcance del consejo + descargos:** dónde termina "información" y empieza "asesoría profesional" (ya caveateas legal/financiero; falta formalizarlo).
- **Responsabilidad civil / E&O:** ¿quién responde si el sistema aconseja mal? Circuit breakers para "consejo de alto impacto" que exigen gate humano.

---

## 5 · Brechas de PRODUCTO frecuentemente olvidadas
- **Offline-first / baja conectividad** para campo (el operador que fotografía el camión descompuesto suele no tener buena señal). La captura de evidencia debe sincronizar después.
- **App móvil de campo** como flujo de primera clase (no solo web).
- **Sistema de alertas "política viva"** (documento nuevo del DOF afecta a tenant existente → dispara alerta). *Marcado como de alto impacto en el PM brief, aún no construido.*
- **i18n/l10n** para expansión LATAM (es-MX vs es-CO, moneda, unidades).
- **Colaboración en-producto:** comentarios, aprobaciones, compartir, exportar; e-firma de entregables (integrar, no construir).

## 6 · Profundidad de la CAPA DE DATOS (tu moat real)
- **Resolución de entidades / MDM:** el mismo municipio o empresa aparece distinto en INEGI, DENUE, DOF. Sin dedup/identidad, la ontología se ensucia.
- **Linaje end-to-end** (no solo procedencia por valor): el grafo de transformaciones del dato.
- **Datasets versionados / time-travel:** "¿qué sabíamos en la fecha X?" — indispensable para defender "asesoramos con el dato vigente entonces".
- **Legal de datos scrapeados y comprados:** ToS, copyright, licenciamiento. Scrapear 24/7 es exposición legal real; el DOF es público, otras fuentes no.
- **Red económica con privacidad:** benchmarking cross-tenant anonimizado (efecto red) requiere matemática de privacidad (k-anonimato/privacidad diferencial) y data clean rooms. FASE14 lo inicia; la privacidad formal no está.

## 7 · Apuestas estratégicas no solicitadas
- **SDK/API para que clientes construyan sobre ti** (Palantir tiene Foundry SDK; si quieres ser competencia, esto es el platform play).
- **Marketplace de Sector Packs** (distribución de los paquetes sectoriales, no solo construirlos).
- **Validación/calibración del gemelo digital 3D:** ¿cómo pruebas que la simulación corresponde a la realidad? Sin calibración, es bonito pero no confiable.
- **Cierre de ciclo por RESULTADOS:** ¿la recomendación funcionó? Rastrear el resultado realizado, no solo el feedback. Esto alimenta el aprendizaje y es tu mejor material de ventas.

---

## Priorización McKinsey (qué atender y cuándo)
- **Ahora / Hito 0–1 (no negociable para vender):** aislamiento multi-tenant + DPA + bitácora inmutable; backup/DR (el de Render); modelo de pricing decidido; gate humano para consejo de alto impacto; calidad-de-dato básica (freshness).
- **Siguiente / Hito 2:** gobernanza de IA completa (eval harness, rollback), alertas "política viva", offline de campo, resolución de entidades.
- **Después / Hito 3:** SDK/marketplace, privacidad diferencial cross-tenant, cierre de ciclo por resultados, calibración del gemelo.

## SOLUCIONES por hueco (doctrina build / integrate / buy — solo construyes el moat)

**Confianza**
- Aislamiento multi-tenant → **BUILD** (row-level security en Postgres + middleware tenant-guard; ya hay base, hay que probarlo).
- Soberanía de datos MX → **INTEGRATE** (región de datos en MX del proveedor).
- SOC2/ISO → **BUY** compliance-as-a-service (Vanta/Drata) cuando haya ingreso; por ahora **implementar los controles**.
- Cifrado/KMS → **INTEGRATE** (KMS del cloud).
- PII / derecho al olvido → **BUILD** (etiquetas de clasificación en la ontología + flujo de borrado).
- RBAC fino + row-level → **INTEGRATE** proveedor de auth (Clerk/Supabase Auth, no rodar el tuyo) + **BUILD** las reglas (extiende ALQ-51).
- Gobernanza de IA → **BUILD** núcleo (NOUS) + **INTEGRATE** observabilidad/eval open-source (Langfuse/Helicone, amigable a costo-cero) + versionado de prompts + cola de revisión.
- Explicabilidad → **BUILD** (traza de decisión sobre la ontología — es diferenciador).

**Comercial**
- Pricing/empaquetado → **DECIDIR** (estrategia) + **BUILD** medición de uso ligera sobre Stripe. Recomendación: tiers por tenant + componente outcome-based.
- Calculadora de ROI para el comprador → **BUILD** (reusa tu motor TIR/ROI, empácalo cara-cliente).
- Movimiento de ventas / PoV → **PLAYBOOK** (proceso, no código).
- Éxito del cliente / cambio → **PROCESO** + apóyate en el flujo entrevista→Jarvis.
- Contratos/SLA/DPA → **BUY** plantillas legales + **INTEGRATE** e-firma (DocuSign).
- Canal/partner (BIWO) → **PROCESO** (programa, no favor).

**Operación**
- DR/backup → **INTEGRATE** Postgres administrado con respaldos. **Decisión dura: salir del Postgres free de Render ANTES de meter dato de un piloto** (~$14/mo).
- Calidad de dato (freshness/anomalía) → **BUILD** sobre el pipeline de scraping (moat).
- Observabilidad de negocio → **INTEGRATE** (Grafana/Render + Langfuse) + **BUILD** métricas de negocio.
- FinOps de IA → **BUILD** presupuesto de tokens por tenant + **INTEGRATE** tracking de costo (Helicone).
- Rate limit/anti-abuso → **INTEGRATE** (librería/middleware).

**Ética/Responsabilidad**
- Sesgo/justicia en política pública → **BUILD** checks en la ruta de recomendación + **PROCESO** revisión humana.
- Anticorrupción/auditable → **BUILD** bitácora inmutable + checks de conflicto en procurement.
- Frontera del consejo/descargos → **BUY** plantillas legales + **PROCESO**.
- E&O / circuit breakers → **BUILD** gate de "consejo de alto impacto" (cuelga del firewall reversible/irreversible) + **BUY** seguro (negocio).

**Producto**
- Offline-first campo → **BUILD** (PWA + sync; integra librería de sync). Móvil = **PWA primero**, no nativo (costo-cero).
- Alertas "política viva" (DOF→tenant) → **BUILD** sobre el scraping (alto impacto, barato).
- i18n → **INTEGRATE** (i18next) — diferir hasta LATAM.
- Colaboración/e-firma → **INTEGRATE** (las herramientas del cliente + DocuSign).

**Datos (moat)**
- Resolución de entidades/MDM → **BUILD** (dedup sobre la ontología).
- Linaje end-to-end → **BUILD** (extiende procedencia a grafo de transformaciones).
- Datasets versionados/time-travel → **BUILD** (tablas temporales / ontología event-sourced).
- Legal de datos scrapeados → **PROCESO**/abogado + **BUILD** respeto de robots/ToS en el scraper.
- Privacidad cross-tenant → **BUILD** (k-anonimato/privacidad diferencial) — Hito 3.

**Estratégico**
- SDK/API, Marketplace de Sector Packs → **BUILD**, Hito 3.
- Calibración del gemelo 3D → **BUILD** harness de validación.
- Cierre de ciclo por resultados → **BUILD** (rastrear resultado realizado) — tu mejor material de ventas.

## Una verdad incómoda
El mayor riesgo no es técnico: es **vender antes de tener Confianza y Responsabilidad resueltas**. Un piloto exitoso con un cruce de datos o un consejo sesgado a un gobierno cuesta más que diez ventas. La inteligencia ya es tu fortaleza; la disciplina de confianza es lo que te deja cobrarla.

*Doc 42 · Gap analysis · Alquimia Supermind · 20 jun 2026*
