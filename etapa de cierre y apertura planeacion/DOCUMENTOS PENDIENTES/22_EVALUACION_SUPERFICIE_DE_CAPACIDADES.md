# 22 · EVALUACIÓN DE LA SUPERFICIE DE CAPACIDADES — IMPLICACIONES DEL SISTEMA
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — socio y crítico
**Propósito:** Evaluar TODO lo que el sistema debe poder satisfacer (de diseñar el layout de una oficina a cuantificar una casa en Excel, cotizar, o investigar mercado en vivo) y demostrar que, por enorme que parezca, **se reduce a un solo patrón que ya diseñamos.**

---

## 1. LA CORRECCIÓN DE ENCUADRE (no somos Palantir con menos integraciones)

| | Palantir | Alquimia |
|---|---|---|
| Modelo | Fusión de datos en tiempo real, muchas integraciones | **Call-on-request**, mínimas integraciones |
| Costo | Altísimo (implementación + licencias) | **Accesible** (determinista + templates + pocas fuentes) |
| Cliente | Gobiernos, corporativos | **PyME + gobierno local** (los que nadie atiende bien) |
| Cómo gana | Profundidad de integración | **Red inter-empresa + procedencia + accesibilidad** |

Ser su competencia = **out-posicionar, no out-integrar.** Menos integraciones es lo que nos hace baratos y accesibles. "Tiempo real como Palantir" NO es la meta — es el camino caro. Nuestro "tiempo real" es **call-on-request + caché**: suficiente, barato, y suficiente para el 95% de los casos.

---

## 2. EL INSIGHT CENTRAL: TODO SE REDUCE A UN PATRÓN

Las capacidades que describes —layout de oficina, cuantificar una casa, cotizaciones, investigación de mercado— parecen mundos distintos. No lo son. **Todas son la misma primitiva** (doc 14 §3):

```
intake verificado (qué necesito antes de asumir)
   → cómputo determinista (lo que no necesita LLM)
   → template / output (xlsx, pdf, plano, dashboard) = $0
   → procedencia adherida
   → gate humano en lo irreversible
```

Cambian los `required_inputs`, los `knowledge_sources` y el formato de salida. **El motor es el mismo.** Por eso NO rediseñamos por capacidad: instanciamos una **Agent Spec** (doc 14 §2). La arquitectura ya las anticipa todas.

---

## 3. TAXONOMÍA DE CAPACIDADES (la evaluación)

Cada familia, qué requiere, y que reduce al patrón:

| Familia | Ejemplo tuyo | Insumos requeridos (fuente) | Cómputo | LLM | Output |
|---|---|---|---|---|---|
| **Diseño/espacial** | Layout de oficina | dimensiones, headcount, normas ergonómicas/código | reglas + optimización determinista | opcional (sugerir variantes) | plano / diagrama |
| **Cuantificación/estimación** | Cuantificar una casa en Excel | planos/medidas, precios unitarios | takeoff + volúmenes (determinista) | no | **xlsx** con procedencia |
| **Cotización/pricing** | Cotizaciones | catálogo, costos, márgenes | cálculo determinista | no | pdf/xlsx desde template |
| **Análisis financiero** | ROI, flujo, inversión | estados, supuestos verificados | fórmulas (determinista) | síntesis del informe | pdf/dashboard |
| **Investigación mercado/tendencias** | Live research | fuentes web/estándares | ranking/clasificación | síntesis | informe con procedencia |
| **Generación documental** | Reportes, memorias, contratos | datos del Profile | template | redacción | pdf/docx |
| **Datos/analytics** | Dashboards, KPIs | datos del tenant | agregación (determinista) | insights | dashboard |

**Observación dura:** la mayoría es **cómputo determinista + template = $0 de LLM.** El LLM solo entra en síntesis/redacción. Esto es exactamente lo que hace el modelo barato y accesible (doc 19).

---

## 4. "LIVE MARKET & TREND RESEARCH" — EL MODELO CORRECTO

Lo que pides es real y posible, pero con el diseño correcto:
- Es una **capacidad de research** que alimenta el **tier de conocimiento abierto** (ADR-001 rev.1), con procedencia.
- **Call-on-request + caché**, no streaming. Cuando un agente necesita saber "qué requiere el mercado para X", dispara research (Serper/web → síntesis), cachea, y reutiliza. Costo diferible (doc 19).
- Alimenta **recomendaciones y roadmap** (reversible, gated). **Nunca** dispara una acción irreversible directo (firewall doc 14 §4).
- "Actualización automática dictada por agentes" = el SECTOR/ORCHESTRATOR re-consulta el tier de conocimiento; las propuestas mejoran solas; el rigor y el gate no se relajan.

---

## 5. PRESUPUESTO Y ACCESIBILIDAD (por qué esto SÍ cabe en el budget)

Cada capacidad nueva ≈ **una spec + los datos/estándares de su dominio**, NO un producto nuevo. El costo se controla con el patrón:
- Determinista = $0. Template = $0. LLM solo síntesis. Integraciones mínimas.
- A escala, esto es la diferencia entre $2,500/mes y $25,000/mes (doc 08 §5).
La accesibilidad no es un eslogan: es consecuencia de que el 80% del trabajo es código determinista, no tokens.

---

## 6. QUÉ CONSTRUIMOS vs QUÉ DEBE EXPRESAR LA ARQUITECTURA (el freno honesto)

- **La arquitectura DEBE poder expresar todo lo anterior.** Eso se garantiza con un schema de Agent Spec extensible + catálogo de capabilities + output multiformato (doc 14). **Esto sí es requisito de diseño hoy** — no cerrarnos puertas.
- **Construimos AHORA:** diagnóstico RSU (Hito 0) + primer módulo Empresarial (Hito 1). Punto.
- **El patrón se valida** probándolo en 2–3 dominios reales. Una vez probado, agregar "cuantificar una casa" o "layout de oficina" es **una spec**, no un proyecto.
- **El resto = backlog (ALQ-21 / roadmap).** Se construye cuando un cliente que paga lo pide o fortalece el grafo (filtro 08 §7).

"Esto no es cualquier cosa" — cierto. Pero la grandeza no se construye de golpe; se construye un patrón que la expresa, y se prueba con dinero real. La ambición vive en la arquitectura; el sprint vive en lo que paga la renta.

---

## 7. IMPLICACIÓN DE DISEÑO A CONFIRMAR HOY (para no cerrarnos puertas)

El schema de Agent Spec (doc 14 §2) debe soportar explícitamente:
- `intake_schema` variable por dominio.
- `knowledge_sources` con estándares por dominio (ergonomía, código de construcción, precios unitarios, benchmarks de mercado).
- `output_contract.artifact` **multiformato**: xlsx, pdf, docx, plano/diagrama, dashboard.
- `external_tools` pluggables (research, geo, etc.) vía el router de capacidades.

Si el schema soporta esto, la superficie completa es alcanzable sin rediseño. (Acción: validarlo al escribir el `COMPANY_PROFILE_JSON_SPEC` y el schema de spec en Hito 1.)

---

## 8. ACCIÓN
1. Confirmar que el schema de Agent Spec (Hito 1) cumple §7 — es lo único de esto que toca diseñarse pronto.
2. Todo lo demás (layout, cuantificación, cotización, analytics) → backlog ALQ-21, por demanda de cliente.
3. Opcional ahora (gratis): corro un **live market scan** con web search para UN dominio que elijas, y lleno fichas en ALQ-21. Dime el dominio.
4. Hito 0 no se toca: RECON → CI → diagnóstico.

---

*22 · Evaluación de la Superficie de Capacidades · Alquimia Supermind · 17 jun 2026*
