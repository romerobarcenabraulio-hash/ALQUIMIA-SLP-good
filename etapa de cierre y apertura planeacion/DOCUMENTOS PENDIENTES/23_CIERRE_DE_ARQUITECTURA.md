# 23 · CIERRE DE ARQUITECTURA — CANON PARA EMPEZAR A PROGRAMAR
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — con web research para cerrar decisiones abiertas
**Status:** CIERRE. A partir de aquí se programa; las instrucciones viven en Linear.
**Incorpora:** alcance gobierno (piloto RSU), interacción voz+comando por empleado, captura de evidencia (archivos + fotos).

---

## 1. LA ARQUITECTURA CANÓNICA (una sola figura, cerrada)

```
ENGINE único (mecanismo)
  = ciclo del ejecutor (doc 14 §3) + constitución de razonamiento + 3 niveles de modelo
        │ corre cualquier…
  AGENT SPEC (declarativa, dato no código)
     Class A: builder/backend (ORCHESTRATOR, LISTENER, SECTOR, módulos)
     Class B: Jarvis por EMPLEADO/tenant (instanciado en onboarding)
        │ usa…
  CAPABILITY CATALOG (3 tiers)            LEARNING STORE (externo, con procedencia)
   conocimiento ABIERTO/evolutivo          Company Profile + memoria del tenant
   soluciones ABIERTAS (gated)
   acciones IRREVERSIBLES gobernadas (+gate)
        │ entra por…
  CAPA DE INTERACCIÓN modality-agnostic: comando + texto (hoy) → voz (después)
  + EVIDENCIA: archivo que el agente arma con el usuario + fotos → extracción por visión → procedencia
```

Todo lo demás (docs 08–22) cuelga de aquí. **La arquitectura está cerrada.**

---

## 1B · ALCANCE UNIVERSAL + AUTO-CONSTRUCCIÓN DEL SISTEMA + ORGANIGRAMA (lo que vende)

**El alcance es CUALQUIER organización/sector.** No es una limitación que resolver — es el producto: **el sistema se construye a sí mismo para el cliente.** Eso es lo que vende. Y es posible justamente porque el motor es sector-agnóstico (doc 22: todo reduce a un patrón).

**El flujo de auto-construcción (de la entrevista a la organización viva):**
```
1. ENTREVISTA (LISTENER, voz/texto) → descubre la estructura real:
   roles, departamentos, procesos, dolores, herramientas que ya usan.
2. ORG_BUILDER (Class A, nuevo) → arma el ORGANIGRAMA automáticamente:
   mapea cada rol/empleado → qué Jarvis (Class B) le toca + qué automatizaciones.
3. SECTOR (Class A) → activa los módulos que ese giro necesita (call on request).
4. La FÁBRICA instancia la malla de agentes de esa empresa: un Jarvis por empleado,
   conectados según el organigrama. La organización queda "viva" en el sistema.
```

**Por qué se puede sin construir cada sector:** el organigrama es **dato estructurado** que el LISTENER extrae; la malla de agentes son **specs instanciadas** (doc 14); el motor, el protocolo y el catálogo son los mismos para cualquier giro. Universalidad = el patrón es agnóstico, NO que construyamos 100 sectores.

**El organigrama es además el mejor demo que existe:** entrevista → en minutos, un organigrama con las automatizaciones propuestas por rol, con procedencia. Eso es lo que hace decir "¿cómo lo hicieron tan rápido?". Es la consultoría instantánea hecha visible.

**Disciplina (el freno de siempre):** la universalidad es la PROMESA de la arquitectura; se PRUEBA construyendo el patrón en RSU (Hito 0) + 1 módulo Empresarial + el ORG_BUILDER (Hito 1). No se construye "cualquier sector" de golpe — se construye el constructor, y el constructor expresa cualquier sector.

---

## 2. EL MODELO DE INTERACCIÓN (nuevo alcance, aterrizado)

**Cada empleado tiene su agente (Class B Jarvis).** Interactúa por **comando + conversación**, diseñado **modality-agnostic**: la misma `intake_schema` (doc 14) recibe texto HOY y voz DESPUÉS, sin rediseño. Decisión firme (08/16): **texto primero en el MVP, voz cuando haya tracción** — pero la interfaz se diseña para voz desde el día 1.

**Validación de costo de voz (web research, jun 2026):**
- **STT:** Whisper-class hospedado ≈ $0.006/min (gpt-4o-mini-transcribe ≈ $0.003/min); soporta español. Self-host solo conviene a 3,000+ hrs/mes (requiere GPU ~$276+/mes). → MVP: STT hospedado pago-por-uso, **diferido** hasta tracción; sin infra.
- **TTS:** open-source con español y bajo costo: **MeloTTS** (CPU/edge, tiempo real, recursos mínimos), XTTS-v2, Fish Speech. → Voz de salida ≈ $0 self-host en edge cuando se active.
- **Conclusión:** la voz es asequible y NO requiere infra cara para arrancar. Se mantiene diferida sin bloquear el MVP.

---

## 3. CAPTURA DE EVIDENCIA (nuevo alcance — el ejemplo del camión)

El agente **arma un archivo de evidencia CON el usuario** + **fotos que evidencian el problema** (p. ej. la falla del motor de un camión para solicitar uno nuevo). Flujo cerrado:

```
1. CAPTURA: empleado describe (voz/texto) + adjunta fotos.
2. EXTRACCIÓN POR VISIÓN: un vision-LLM extrae datos estructurados de las fotos → JSON
   (web research: Llama 3.2 Vision / vision-LLMs, 95–99% precisión, mobile-first, salida JSON).
3. EVIDENCIA CON PROCEDENCIA: el archivo lleva timestamp, geo, autor, foto-hash, extracción.
   = registro auditable, no "dicho".
4. PROPUESTA: el agente arma la solicitud (ej. reemplazo de camión) con la evidencia adherida.
5. GATE (firewall doc 14 §4): "solicitar/comprar un camión nuevo" es IRREVERSIBLE/externo →
   el agente PREPARA todo y lo presenta al humano que autoriza. NUNCA lo ejecuta solo.
```

**Costo:** la extracción por visión puede usar un modelo abierto (Llama 3.2 Vision vía Ollama) para acercarse a $0, o uno hospedado. Diferible como la voz. La evidencia + procedencia es lo que hace defendible una solicitud ante gobierno o dirección — es el mismo principio anti-mentira aplicado a operación de campo.

---

## 4. EL PILOTO GOV-RSU (cómo se ve el demo)

El diagnóstico RSU nacional (docs 15) **es** el piloto de gobierno. La narrativa del demo une las dos piezas:
- **Diagnóstico:** mapa nacional de huella + semáforo de cobertura honesto + ficha municipal + PDF ejecutivo (Hito 0).
- **Operación con evidencia:** un empleado municipal reporta por voz/comando una falla (camión, contenedor) con fotos → el agente arma la evidencia con procedencia → genera la solicitud → gate del responsable. (Hito 1, modelo ya cerrado aquí.)
Juntos muestran la tesis: **consultoría + operación instantánea, con procedencia, accesible.**

---

## 5. LO QUE ESTE CIERRE CONFIRMA PARA EL SCHEMA (doc 14 §2 — sin rediseño)

El Agent Spec ya soporta esto; al implementarlo, confirmar:
- `intake_schema` recibe **multimodal** (texto, voz, foto) — mismo contrato.
- `capabilities.external_tools`: STT, TTS, vision-LLM como herramientas pluggables del router.
- `output_contract.artifact` multiformato (incluye **archivo de evidencia** con procedencia).
- `irreversible_actions`: solicitar/comprar/notificar → siempre gate (ej. nuevo camión).

---

## 6. QUÉ SE PROGRAMA AHORA (sin ambigüedad)

- **Hito 0 (ya en Linear, ALQ-5…ALQ-20):** RECON → rebase → CI → diagnóstico RSU nacional + GOV close. **Esto arranca YA.** Voz/evidencia NO son Hito 0.
- **Hito 1 (backlog, nuevos contratos de diseño):** COMPANY_PROFILE_JSON_SPEC, capa de interacción modality-agnostic, spec de evidencia+visión, lifecycle Jarvis, **ORG_BUILDER / auto-construcción + organigrama**. Se escriben cuando GOV cierre.
- **Costo:** voz y visión diferidas (hospedado pago-por-uso o modelos abiertos), sin infra cara. Modo costo-cero intacto (doc 19).

**La arquitectura está cerrada. Programar = disparar los issues de Linear a los ejecutores.** El primero: ALQ-5 (RECON) a Codex.

---

## Sources
- [Whisper API Pricing 2026 — OpenAI vs Groq vs Google (TokenMix)](https://tokenmix.ai/blog/whisper-api-pricing)
- [OpenAI Whisper API Pricing 2026 + cheaper alternatives (diyai.io)](https://diyai.io/ai-tools/speech-to-text/openai-whisper-api-pricing-2026/)
- [Best Open-Source Text-to-Speech Models in 2026 (BentoML)](https://www.bentoml.com/blog/exploring-the-world-of-open-source-text-to-speech-models)
- [Popular Open-Source TTS Models 2026 (Hyperstack)](https://www.hyperstack.cloud/blog/guides/popular-open-source-text-to-speech-models)
- [Extract Data from Document Photos with Vision LLMs (TableFlow)](https://tableflow.com/blog/image-to-data)
- [Advanced Image Data Extraction with Llama 3.2 Vision (CloudThat)](https://www.cloudthat.com/resources/blog/advanced-image-data-extraction-with-llama-3-2-vision-and-ollama)

---

*23 · Cierre de Arquitectura · Alquimia Supermind · 17 jun 2026*
