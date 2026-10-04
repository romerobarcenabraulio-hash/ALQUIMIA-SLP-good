# 43 · MOTOR DE DISCERNIMIENTO — Conectores, Metodologías y Assumptions
**Estado:** 🟢 vigente (v1, 02-jul-2026) · Autor: Claude (socio-PM) · Extiende ALQ-105 (orchestrator generador de servicios) y ADR "LLM = membrana" (ALQ-125).
**Qué resuelve:** cómo el sistema razona, a partir de un problema, cuál producto/herramienta/servicio desarrollar y por qué palanca (privado vs legislación), qué datos necesita, qué método aplica, y qué deja vivo en la nube. Sirve a los DOS servicios: automatizar el research de política pública (estilo RSU) y el motor adaptativo del sector privado.

---

## 0 · LOS DOS SERVICIOS Y DÓNDE VIVE EL HUMANO
- **Servicio A — Política pública:** determinar un problema y desarrollarlo de principio a fin (como el research de RSU) + agentes que ejecutan. El motor produce el diagnóstico, la alternativa y la herramienta.
- **Servicio B — Sector privado (Supermind directo, sin proyecto de consultoría previo):** el sistema desmembra el organigrama miembro por miembro, entiende a cada usuario y su proceso de punta a punta sin importar la profesión, vive sobre el sistema que la organización ya tiene, ajusta el frontend por usuario, y teje la red económica de a poco.
- **El humano NO se elimina.** El consultor humano aporta lo que el agente no tiene: **empatía, relación, contexto tácito y criterio en lo irreversible.** Los agentes de backend existen para **matar la burocracia** que se genera en la operación (recolección, cruces, borradores, monitoreo), no para reemplazar el juicio humano. El diseño de empatía (ALQ-79) es lo que hace que el agente *comprenda* al humano; cada corrección del consultor entrena el motor (flywheel ALQ-126).

---

## 1 · EL MOTOR DE DISCERNIMIENTO (el corazón)
Flujo de razonamiento, de problema a entregable vivo. Cada etapa mapea a una disciplina (ver ADR filosófico ALQ-125/128):

1. **Enmarcar el problema (abducción / Peirce).** Del enunciado difuso → hipótesis de causa raíz + definición medible. *"Reducir contaminación en X"* → ¿qué fuente, qué métrica, qué frontera del sistema?
2. **Estructurar (ontología / Kant).** Mapear el problema a objetos/links/procedencia (ALQ-102). Sin esto, no hay razonamiento auditable.
3. **Enumerar palancas.** Toda brecha se puede cerrar por **≥1 de 3 palancas**: (a) **herramienta/producto privado** (se vende a empresas), (b) **política/legislación** (se cambia la regla — vía DOF/regulador), (c) **híbrido** (norma que crea el mercado para la herramienta). El motor propone las tres, no una.
4. **Elegir metodología (§2).** Para cada palanca, seleccionar del catálogo el método + estándar internacional aplicable + datos requeridos.
5. **Deliberar (dialéctica / Hegel).** Por cada alternativa: tesis (propuesta) → antítesis (su mejor refutación: costo, factibilidad, dato faltante, riesgo legal, aceptación) → síntesis (la mejor versión). **Regla de paro:** deja de iterar cuando otra vuelta ya no cambiaría la recomendación (value-of-information, ALQ-127).
6. **Decidir (Bayes / teoría de decisión).** Puntuar cada alternativa por impacto esperado × factibilidad × costo × solidez de procedencia × palanca legal disponible. Recomendar.
7. **Gate humano (Kant / imperativo).** El consultor revisa: ¿es universalizable, defendible ante un ciudadano/contraloría, empático con el usuario real? Aprueba o corrige. Toda acción irreversible pasa aquí (firewall §2).
8. **Generar y desplegar.** El orchestrator compone la herramienta/entregable automáticamente y la deja **viva en la nube** (monitoreo continuo, re-scraping, alertas de política DOF→tenant). Costo de cómputo gobernado por VoI.

**Salida del motor por problema:** `{diagnóstico, 3 palancas evaluadas, alternativa recomendada, método+estándar, datos usados con procedencia, entregable generado, qué queda vivo monitoreando}`.

---

## 2 · CATÁLOGO DE METODOLOGÍAS / ALTERNATIVAS DE ANÁLISIS
La "biblioteca" sobre la que razona el motor. No es exhaustiva; es el semillero versionado (ALQ-77 corpus de estándares). **Los años/versiones exactos de cada norma se verifican en build (ver Assumption A-7).**

| Dominio | Problema típico | Método / marco | Estándar de referencia | Dato requerido | Entregable |
|---|---|---|---|---|---|
| Eficiencia energética (conductual) | Alto consumo residencial/PyME | Home Energy Reports / comparación normativa + nudges (estilo Opower/Oracle) · Community-Based Social Marketing · RCT | ISO 50001 (EnMS) como marco | Consumo histórico (CFE), clima (CONAGUA/NOAA), encuesta | Encuesta + reporte comparativo + intervención medible |
| Eficiencia energética (técnica) | Dónde y cuánto ahorrar | Auditoría energética (niveles ASHRAE I–III) · Medición & Verificación | ISO 50002 (auditorías) · IPMVP (M&V, EVO) | Facturas, inventario de equipos, mediciones | Auditoría + cartera de medidas con payback |
| Construcción / materiales | Huella ambiental de una obra/producto | Análisis de Ciclo de Vida (LCA) · EPD · LCA a nivel edificio | ISO 14040/14044 (LCA) · ISO 14025 / EN 15804 (EPD) · EN 15978 (edificio) | Materiales, energía, transporte, ecoinvent/EPDs | Herramienta de LCA + huella + hotspots + alternativas |
| Carbono corporativo | Inventario y reducción de GEI | GHG Protocol (alcances 1/2/3) · Huella de carbono de producto | GHG Protocol · ISO 14064 (org) · ISO 14067 (producto) | Actividad energética, compras, logística | Inventario GEI + plan de reducción |
| Agua | Estrés hídrico / huella | Water Footprint | ISO 14046 | Consumo, cuenca, CONAGUA | Huella hídrica + medidas |
| Residuos (RSU) | Cobertura y circularidad | Material Flow Analysis (ya implementado en RSU) | — | INEGI/municipal, scraping | Diagnóstico nacional (Hito 0) |
| Política pública (general) | ¿Regular o no, y cómo? | Análisis Costo-Beneficio · Evaluación de Impacto Regulatorio (RIA / manifiesto CONAMER) · MCDA (multicriterio) · DPSIR (presión-estado-respuesta) | Guías OCDE · marco CONAMER (MX) | Marco legal (DOF), datos sectoriales | Propuesta de política + MIR |
| Financiero / negocio | ¿Conviene la intervención? | VAN/TIR/payback · sensibilidad · Monte Carlo | — (motor propio ALQ-61) | Costos, ingresos, tasa | Caso de negocio |
| Logística / operación | Ruteo, recolección | Optimización de rutas (distancia/carga/frecuencia) | — (ALQ-91) | Puntos, restricciones, INEGI/SAKBÉ | Rutas optimizadas |

---

## 3 · CONECTORES Y BASES DE DATOS A INCORPORAR
Todo entra por el conector MCP-style + capa anti-corrupción (ALQ-95): **read libre / write gated**, mapeado a la ontología con procedencia. Vía: **MCP oficial > API oficial envuelta > scraping/OCR (pipeline confirmado)**.

**Gobierno / público MX:** INEGI (censo, ENIGH, económicos), DENUE (directorio de establecimientos), DOF (legislación viva → alertas política ALQ-122), datos.gob.mx (Datos Abiertos), CompraNet (licitaciones), SEMARNAT (ambiental), CONAGUA (agua/clima), CONUEE/SENER (energía), CFE (consumo/tarifas), SAT/CFDI (fiscal, Hito 3), IMSS, catálogos municipales.

**Estándares internacionales (el pipeline scraping→OCR→.md→código):** ISO, IEC, EN/CEN, ASHRAE, IPCC (factores de emisión), IEA, GHG Protocol, EPA/EEA, ecoinvent (base LCA — licenciable, *buy*), EPDs/Environdec. Estos alimentan el corpus versionado (ALQ-77).

**Sistemas privados del cliente (integrar, no reconstruir):** ERPs (SAP, CONTPAQi, Aspel, BIWO ALQ-101), CRM, contabilidad, Google Workspace / Microsoft 365, Slack/Teams, almacenamiento (Drive/Box). Descubiertos por el perfil de integración por tenant (ALQ-96).

**Económico / mercado:** Banxico, INEGI económico, precios de commodities/energía, tarifas, tipos de cambio (para cotización ALQ-71 y casos de negocio).

**Adquiridas / licenciables (buy):** ecoinvent, bases de factores de emisión, padrones sectoriales, datos catastrales. Regla build/integrate/buy (doc 36): comprar materia prima, no construirla.

---

## 4 · ASSUMPTIONS A CLARIFICAR (las premisas peligrosas)
Si alguna es falsa, el motor razona sobre arena. Hay que pinchar cada una antes de construir ancho:

- **A-1 · Disponibilidad y calidad del dato público MX.** Se asume que existe dato suficiente y fresco por municipio/sector. Realidad: es parcheado. → El motor debe declarar cobertura honesta y degradar con procedencia, no rellenar.
- **A-2 · Acceso técnico al sistema del cliente.** Se asume que el ERP/CRM tiene API o es scrapeable. Realidad: muchos PyME están en Excel/papel/WhatsApp. → La capa anti-corrupción y el asistente de migración (ALQ-97) deben cubrir el caso "sin API".
- **A-3 · Autoridad legal para actuar.** ¿Quién es responsable si el sistema recomienda algo que se ejecuta? → Todo write al mundo es gated; disclaimers (ALQ-78); frontera reversible/irreversible enumerada (ALQ-25, no como principio, como lista).
- **A-4 · Capacidad del consultor humano.** ¿Cuántos clientes por consultor sostiene el modelo si el humano sigue en el loop? → Define el margen y el límite de escala del Servicio B. Es un supuesto de unit economics, no técnico.
- **A-5 · Quién paga y por qué palanca.** GOV paga distinto que privado; una política (legislación) no tiene comprador directo. → El discernimiento palanca-privada-vs-legislación debe incluir "¿hay quién financie esta palanca?".
- **A-6 · Que un método mapea a un entregable automáticamente.** El paso metodología→herramienta-generada NO es trivial (es el corazón del orchestrator ALQ-105). → Arrancar con 1 dominio (energía o construcción) end-to-end antes de generalizar.
- **A-7 · Versión vigente de cada norma.** Los estándares cambian de año/edición. → El corpus (ALQ-77) versiona con fecha/fuente; el motor cita la edición y re-verifica vía scraping. Nunca hardcodear un número de norma sin procedencia.
- **A-8 · Aislamiento entre clientes para la red.** La red económica cruza tenants; asume que se puede anonimizar sin fugar. → Depende de multi-tenant + RLS (ALQ-115) — brecha roja, precede a la red.
- **A-9 · Que "adaptarse a todo" es vendible.** El nicho es la adaptabilidad, pero eso no se demuestra en abstracto. → Motor universal por dentro, **primera venta angosta** por fuera (una organización, un rol, un proceso doloroso). Palantir entró por defensa; nosotros por RSU.

---

## 5 · BALANCE HUMAN-INPUT ↔ AUTOMATIZACIÓN
| Fase | Agente (automatiza, mata burocracia) | Humano (empatía + criterio) |
|---|---|---|
| Entender al usuario | LISTENER: entrevista adaptativa, descubre proceso y dolor (ALQ-80) | Relación, lectura de lo tácito, confianza |
| Reunir dato | Scraping 24/7, OCR, cruces, ontología con procedencia | Validar fuentes ambiguas (curación on-request ALQ-103) |
| Analizar | Correr método del catálogo, deliberación dialéctica, casos de negocio | Sanity-check del enunciado y de los supuestos |
| Recomendar | Ranking de palancas + alternativa con procedencia | **Gate:** ¿empático, defendible, universalizable? |
| Ejecutar | Generar entregable/herramienta, dejarla viva en la nube, monitorear | Aprobar lo irreversible; presentar al cliente |
| Aprender | Registrar cada override como corpus (ALQ-126) | Su corrección ES el dato de entrenamiento |

**Regla:** el agente llega hasta el borde de lo irreversible y ahí para. La empatía y el criterio son el producto; la burocracia es lo que se automatiza.

---

## 6 · EJEMPLOS TRABAJADOS (los que planteaste)
**Eficiencia energética → reducir contaminación.**
- Palanca privada: herramienta de análisis conductual estilo Opower — encuesta + comparación normativa (tu casa vs similares) + nudges, con M&V (IPMVP) para probar el ahorro. Se vende a comercializadoras/municipios.
- Palanca legislación: estándar mínimo de eficiencia o programa de reporte obligatorio (vía CONUEE/DOF).
- Discernimiento: si hay comprador (utility, gran consumidor) → privada; si el ahorro es difuso y social → política. El motor propone ambas y el humano elige con el cliente.

**Construcción → reducir contaminación.**
- Palanca privada: herramienta de LCA (ISO 14040/14044) + huella a nivel edificio (EN 15978) que da hotspots y materiales alternativos. Se vende a constructoras/desarrolladores.
- Palanca legislación: exigir EPD (ISO 14025/EN 15804) en obra pública o código de construcción con límite de carbono embebido.
- Discernimiento: el mismo motor, distinta palanca según haya mercado o haga falta la norma para crearlo (híbrido: la norma crea el mercado de la herramienta).

---

## 7 · GANCHOS Y PRÓXIMOS PASOS
- Extiende: ALQ-105 (orchestrator), ALQ-102 (ontología), ALQ-95 (conector), ALQ-77 (corpus de estándares), ALQ-79 (empatía), ALQ-125/126/127 (membrana/flywheel/VoI).
- Falta un ADR: **"Motor de Deliberación Dialéctica"** (la etapa 5, con regla de paro por VoI) — crear como issue.
- Arrancar por 1 dominio end-to-end (recomendación: eficiencia energética, por dato disponible) para probar el mapeo método→herramienta-generada (A-6) antes de generalizar.
