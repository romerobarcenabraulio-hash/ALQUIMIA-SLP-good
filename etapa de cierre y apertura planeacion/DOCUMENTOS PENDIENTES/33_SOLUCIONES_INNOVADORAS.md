# 33 · SOLUCIONES INNOVADORAS — DEL RIESGO A LA VENTAJA
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — modo solución + crítico
**Propósito:** Convertir cada riesgo del pre-mortem (doc 32) y cada gran pregunta en soluciones concretas e innovadoras. Why/for-what/how/with-whom. Cómo igualar/superar a Palantir. La empatía y la entrevista que "leen" al usuario.

---

## 1. EL PORQUÉ (golden circle — el sentido de todo)
- **WHY:** democratizar la consultoría de élite — rigor McKinsey + fuerza de red, a precio que una PyME/municipio sí paga. Las buenas decisiones no deben ser privilegio del rico.
- **PARA QUÉ:** que decidan mejor con rigor trazable y se conecten en una economía que los hace más fuertes juntos.
- **CÓMO:** orquestar IA existente + cálculo determinista + procedencia + grafo inter-empresa + empatía adaptativa + call-on-request.
- **CON QUIÉN:** PyMEs (ICP), municipios (piloto/credibilidad), proveedores/socios (la red), agentes de código + Claude Master.
→ Pendiente formalizar como manifiesto/tesis para socio/inversionista (TESIS_RED).

## 2. IGUALAR/SUPERAR A PALANTIR (ventajas asimétricas)
No competimos en profundidad de fusión de datos. Ganamos en:
| Eje | Palantir | Alquimia |
|---|---|---|
| Precio/acceso | altísimo | accesible (determinista+templates, pocas integraciones) |
| Time-to-value | meses (ingenieros FDE) | minutos (auto-construcción + organigrama) |
| Alcance del moat | intra-organización | **red inter-empresa (grafo)** |
| Transparencia | caja de inteligencia | **trazabilidad como producto** (cada cifra con fuente) |
| Interlocutor | analista de datos | **cualquiera** (empatía adaptativa) |
→ Tesis: *consultoría instantánea que cualquiera puede pagar.*

## 3. ★ EMPATÍA ADAPTATIVA — leer al usuario (la innovación radical)
**Solución:** un **perfil de comunicación** por persona, inferido de la conversación: rol/seniority, nivel de expertise, riqueza de vocabulario, estilo (formal/casual), carga cognitiva tolerable, estado emocional. El sistema **adapta el registro** del output (mismo contenido; distinto para un CFO, un operador, un alcalde).
- **Señales para "leer":** complejidad de frases, jerga usada, sofisticación de preguntas, correcciones, latencia. Perfil ligero, actualizable, **auditable (no caja negra)**.
- **La regla de oro que lo hace defendible:** **empatía en la FORMA, NUNCA en la VERDAD.** Adapta tono/vocabulario/ritmo; jamás dobla el veredicto para agradar. Resuelve empatía vs sicofancia (ADR-002).
- **Anclaje:** AESTHETE-1 ya tiene "segmentación de audiencia" como estándar; esto lo lleva a la generación de lenguaje.
→ **ALQ-79**.

## 4. ★ MOTOR DE ENTREVISTA ADAPTATIVA — desmembrar y leer (no un chat cualquiera)
**Solución:** entrevista ramificada (sobre `app/decision_tree` existente) que elige la siguiente pregunta según la respuesta, con metodologías probadas:
- **Jobs-to-be-Done** (qué "trabajo" contrata el cliente), **The Mom Test** (conducta pasada, no hipótesis), **SPIN** (Situación→Problema→Implicación→Necesidad), **laddering** (medio→fin), **5 porqués**.
- **Tres salidas de UNA conversación:** (1) el **dolor #1**, (2) los **datos verificados** del Company Profile, (3) el **perfil de comunicación** (§3).
- Preguntas para **revelar**, no solo recolectar; **no-sesgadas** (sin preguntas tendenciosas); **progressive profiling** (pide lo necesario ahora, aprende el resto con el tiempo).
→ **ALQ-80**.

## 5. SOLUCIONES A LOS 3 RIESGOS TOP (doc 32)

### Riesgo 1 — "no se vende hasta estar probado/operativo" (corregiste bien la secuencia)
**Secuencia correcta:** CONSTRUIR (Hito 0/1) → **PROBAR con el piloto GOV-RSU (gratis, es nuestro laboratorio y nuestra prueba)** → OPERATIVO → **VENDER** (Hito 2). 
**Innovaciones:**
- El **piloto GOV es el activo de credibilidad** que hace fácil la primera venta PyME ("ya corre con un municipio").
- **Design-partner / beta:** 1 PyME co-construye gratis/descuento → valida + testimonio + caso real, sin esperar el producto perfecto.
- El pipeline (ALQ-73) se PREPARA en paralelo para vender el día que esté operativo, no antes.
→ ALQ-73 reframeado + **ALQ-83** (design-partner).

### Riesgo 2 — fallo de gate / trigger desbocado
**Innovación: SHADOW MODE.** Durante beta, el sistema **propone acciones pero solo las registra (no ejecuta)**. Ves la calidad de su juicio sin riesgo, acumulas datos de calibración y confianza, y solo "le das las llaves" cuando demuestra acierto. + gate fail-safe (ALQ-74) + robustez de triggers (ALQ-75).
→ **ALQ-81**.

### Riesgo 3 — calidad/validez de datos
**Innovación: registro de fuentes pluggable + triangulación.** Públicas gratis (INEGI/CONAPO/…) + **bases adquiribles por sector** (benchmarks financieros por SCIAN, CONUEE/SENER energía, etc.) que se enchufan cuando haya presupuesto. Cada dato con confianza + procedencia; triangulación (dato+estándar+campo+memoria); cobertura honesta (AMARILLO donde falte). + validación de intake (ALQ-76) + corpus versionado (ALQ-77).
→ **ALQ-82**.

## 6. BASES DE DATOS QUE PODEMOS ADQUIRIR (para validez)
- **Gratis ya:** INEGI, CONAPO, CONEVAL, SEMARNAT, SMN, Banxico, DENUE.
- **Adquiribles/integrables (diferidas, costo-cero hasta ingreso):** benchmarks financieros por sector SCIAN, CONUEE/SENER (energía), datos de mercado/precios, textos normativos ISO/GRI, padrones sectoriales.
- El **registro de fuentes (ALQ-82)** las enchufa sin reescribir; cada una con licencia/costo/confianza documentados.

## 7. LA SECUENCIA, CORREGIDA (tu punto)
**Construir → Probar (piloto GOV, gratis) → Operativo → Vender.** No se vende antes. El pre-mortem no dice "vende ya"; dice "ten el pipeline listo para el día que esté operativo". El producto probado ES el requisito de la venta.

## 8. NUEVOS ISSUES
- **ALQ-79** Empatía adaptativa / perfil de comunicación (forma sí, verdad no).
- **ALQ-80** Motor de entrevista adaptativa (JTBD/Mom Test/SPIN/laddering sobre decision_tree).
- **ALQ-81** Shadow mode (propone-y-registra, no ejecuta; calibra confianza antes de dar llaves).
- **ALQ-82** Registro de fuentes de datos pluggable (públicas + adquiribles por sector).
- **ALQ-83** Programa design-partner/beta (1 PyME co-construye) + pipeline listo para vender al operar.

---

*33 · Soluciones Innovadoras · Alquimia Supermind · 17 jun 2026*
