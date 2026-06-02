# SYSTEM TRUTH INVENTORY · Inventario honesto del sistema

**Estado:** Verdad operativa del 30 de mayo 2026
**Propósito:** Cero confusión sobre qué hace y qué NO hace el sistema
**Uso:** Founder lo consulta cuando siente que algo falta. PM lo consulta cuando alguien le pide construir algo fuera de scope.

---

## Sección 1 · Lo que el sistema HACE hoy (verdad operativa al 30 de mayo)

| Capacidad | Estado | Notas |
|---|---|---|
| Login con magic link Clerk | ✅ Funcional | Cuenta `demo@alquimiaplatform.com` opera |
| TOTP con app authenticator | ✅ Funcional | Backup codes disponibles |
| Acceso a /v como cliente simulado | ⚠️ Parcial | Cifras hardcoded de SLP, no personalizado por tenant |
| Módulos M00 a M21 visibles | ⚠️ Parcial | Algunos tienen contenido completo, otros placeholder |
| Export a PDF de módulos individuales | ⚠️ Parcial | Funciona pero sin watermark de progreso |
| Plataforma 0 administrativa | ❌ No existe | Cero pantallas construidas |
| Switcher admin/cliente | ❌ No existe | Pendiente del SPRINT_POST_AUTH bloque 1 |
| Municipio Demo precargado | ❌ No existe | Pendiente del SPRINT_POST_AUTH bloque 2 |
| Filtro institucional .gob.mx automático | ❌ No existe | Pendiente del MVP_CLOSURE_V2 Prompt 2 |
| Validación manual de dominios genéricos | ❌ No existe | Pendiente del MVP_CLOSURE_V2 Prompt 2 |
| Landing pública con narrativa nueva | ❌ No existe | Pendiente del MVP_CLOSURE_V2 Prompt 3 |
| Títulos legibles en módulos (no M0X) | ❌ No existe | Pendiente del MVP_CLOSURE_V2 Prompt 4 |
| Integración Perplexity activa | ❌ No existe | API key configurada pero no llamada en producción |
| ZIP exportable con contraseña separada | ❌ No existe | Pendiente del MVP_CLOSURE_V2 Prompt 5 |
| Watermark dinámico con porcentaje | ❌ No existe | Pendiente del MVP_CLOSURE_V2 Prompt 5 |

**Resumen honesto:** el sistema tiene 25% de la experiencia diseñada construida. El 75% restante está documentado, planeado, pero NO implementado.

---

## Sección 2 · Lo que el sistema TENDRÁ al final de esta semana (6 de junio)

Si el `WEEK_PLAN_FINAL_AND_LOCK.md` se ejecuta, al final del día 7:

| Capacidad | Probabilidad |
|---|---|
| Switcher admin/cliente funcional | Alta (95%) |
| Municipio Demo navegable con cifras coherentes | Alta (90%) |
| M03B con Justificación Técnica restituida | Alta (95%) |
| Revisión visual aplicada a módulos pilar | Alta (95%) |
| Inventario de diagramas existentes documentado | Alta (100%) |
| Feedback de cinco personas externas recogido | Media-alta (80%, depende de que esas personas respondan) |
| Dominio nuevo comprado y registrado | Media (70%, depende de disponibilidad de IMPI) |

**Resumen honesto:** al final de la semana el sistema sigue estando al 40-45% de la visión. Pero será 40-45% verificable, presentable, navegable por terceros. Eso es lo que cambia.

---

## Sección 3 · Lo que el sistema NO TENDRÁ esta semana (deliberadamente)

| Capacidad | Cuándo se construye |
|---|---|
| HERMES con APIs reales (INEGI, SEMARNAT, Periódico Oficial) | Sprint 2 (semana del 9 al 13 de junio) |
| Pipeline de inferencia inicial automática para nuevo tenant | Sprint 2 |
| Filtro institucional automático con Clerk webhook | Sprint 2 |
| Landing pública con narrativa nueva | Sprint 2 |
| Títulos legibles en todos los módulos | Sprint 2 |
| Integración Perplexity en producción | Sprint 2 |
| ZIP exportable con contraseña separada por email | Sprint 2 |
| Watermark dinámico de progreso | Sprint 2 |
| Plataforma 0 administrativa con cinco pantallas | Sprint 3 (semana del 16 al 20 de junio) |
| Modal "asumir identidad temporal" con audit log | Sprint 3 |
| Tracking de documentos solicitados | Sprint 3 |
| Tracking de pagos Stripe + Facturapi | Sprint 3 |
| Postmark Inbound para `documentos@alquimiaplatform.com` | Sprint 4 (semana del 23 al 27 de junio) |
| ARCHIVO agente embebido con código sobre LLM | Sprint 4 |
| Digest semanal de gaps documentales | Sprint 4 |
| Diagramas operativos en módulos pilar | Sprint 5 (semana del 30 de junio al 4 de julio) |
| Sistema de citado bibliográfico Chicago notes-bibliography | Sprint 5 |
| AUDITOR expandido para verificación de cumplimiento | Sprint 5 |
| Pantalla A12 de Cumplimiento por tenant | Sprint 5 |
| Integración Mifiel para contratos | Sprint 6 (mes 2) |
| Integración Stripe + Facturapi para pagos reales | Sprint 6 |
| NOUS agente de aprendizaje (capa 1) | Mes 4-6 (cuando haya 3+ clientes operando) |
| Programa de partners activado | Mes 6+ (después de 3 contratos firmados) |
| Acuerdo con BANOBRAS/NAFIN/BID/CAF | Mes 12-18 |

**Resumen honesto:** el roadmap completo es de seis meses a un año. Esto NO es lento. Esto es realista. SaaS B2B serio se construye en años, no en semanas.

---

## Sección 4 · Lo que el sistema NUNCA HARÁ (decisiones arquitectónicas firmes)

| Capacidad | Por qué no |
|---|---|
| SMS para auth o MFA | Twilio falló con números mexicanos, decisión revertida |
| Password como método de auth | Magic link + TOTP es estructuralmente más seguro |
| Auto-registro sin validación institucional | Filtro por dominio .gob.mx protege calidad de leads |
| Tenants creados por funcionarios (sin founder) | Solo founder crea tenants desde Plataforma 0 |
| Modificación de tenant real sin "asumir identidad temporal" | Audit log es obligatorio por compliance |
| Exports con cumplimiento debajo del 80% | AUDITOR bloquea automáticamente |
| Publicar sugerencias de NOUS sin gate del founder | Riesgo de sesgos amplificados |
| Suspender servicio a municipios automáticamente día 91+ | Decisión política, siempre humana |
| Partners activos antes de 3 contratos directos firmados | Disciplina anti-prematura |
| Demo público con SLP visible para visitantes anónimos | Cliente real ve su municipio, no SLP |

---

## Sección 5 · Lo que el sistema NO PUEDE HACER aunque parezca posible

Esta sección existe porque hay cosas que en abstracto parecen factibles pero técnicamente requieren datos que no existen o tiempo que no cabe.

| Petición | Por qué no es factible hoy |
|---|---|
| "Embeber circularidad aproximada de todo México" | Los datos reales por municipio no existen como dataset descargable. INEGI publica agregados estatales con tres años de retraso. SEMARNAT publica diagnósticos cada cuatro años con cifras nacionales agregadas. Cifras municipales confiables existen solo para 50-100 de los 2,469 municipios. Construir el dataset es trabajo de seis a doce meses de investigación de campo. |
| "Inferir rutas de recolección automáticamente" | Requiere datos GPS del concesionario actual, capacidad y antigüedad de vehículos, horarios reales, restricciones de tránsito, peso recolectado por punto. Esos datos NO existen hasta que un cliente firma contrato y los sube. Sin datos, el algoritmo de rutas (VRP) produce output sin valor. |
| "Que el sistema haga su propia investigación de las ciudades" | Perplexity puede responder preguntas con citas pero no construye knowledge base persistente del municipio. HERMES en su versión completa hará algo parecido pero requiere construcción de Sprint 2. Hoy NO hay sistema autónomo de investigación. |
| "Plataforma de doble materialidad ESG corporativa funcional" | M18 está documentado conceptualmente pero requiere standards_map de GRI 3:2021 + CSRD ESRS 1:2023 cruzados con datos del cliente. Construcción de Sprint 5-6. |
| "Generación automática de expediente Cabildo listo para presentar" | El generador de PDF existe en parte. Pero el contenido del expediente requiere datos validados por el cliente más metodología auditada por AUDITOR. Hoy el expediente sale como borrador, no como documento defendible. |

---

## Sección 6 · Reglas para el PM cuando reciba pedidos fuera de scope

Cuando el founder (o cualquier otro) pida construir algo, el PM responde con este árbol de decisión:

**Paso 1.** ¿La petición está en la Sección 2 (Tendrá esta semana)?
- Si sí → procede según `WEEK_PLAN_FINAL_AND_LOCK.md`
- Si no → pasa al Paso 2

**Paso 2.** ¿La petición está en la Sección 3 (Tendrá en Sprints futuros)?
- Si sí → responder "Esto está planeado para Sprint N. ¿Movemos prioridad o respetamos roadmap?"
- Si no → pasa al Paso 3

**Paso 3.** ¿La petición está en la Sección 4 (Nunca hará)?
- Si sí → responder "Esta capacidad fue descartada por decisión arquitectónica documentada. ¿Reabrimos la decisión?"
- Si no → pasa al Paso 4

**Paso 4.** ¿La petición está en la Sección 5 (No puede hacer técnicamente)?
- Si sí → responder con explicación específica de por qué no es factible
- Si no → es petición nueva no documentada. Documentar y pedir founder gate antes de cualquier acción

**Esta regla protege el scope.** El founder en estado de fatiga puede pedir cosas que rompen el plan. El PM las recibe pero no las ejecuta sin verificar contra esta inventory.

---

## Sección 7 · Estado emocional implícito del sistema

Esta sección es honesta sobre algo que rara vez se documenta:

El sistema en su estado actual produce sensación de "incompleto" cuando lo navegas. Eso es CORRECTO. Un MVP que se siente completo no es MVP, es producto sobreingenierizado.

La sensación de "está en pañales" es la métrica correcta del MVP funcionando como debe. Cuando esa sensación desaparece (semana 8-12), el producto ha madurado lo suficiente para vender en serio. Antes de eso, el founder demuestra solo a prospectos que aprecian el "early access" no al mercado masivo.

Si en algún punto el founder siente "esto ya está listo para vender masivamente" antes del Sprint 6, probablemente está sobreestimando. Si siente "esto nunca va a estar listo" después del Sprint 6, probablemente está cansado.

La verdad operativa intermedia: el sistema estará listo para conversaciones serias con prospectos al final de la semana 4 (fin de Sprint 4). Antes de eso, demo personal del founder con Municipio Demo es la mejor herramienta de venta.

---

*SYSTEM TRUTH INVENTORY · Alquimia · 30 mayo 2026 · Última actualización: cada viernes*
