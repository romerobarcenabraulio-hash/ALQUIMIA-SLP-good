# 04 · REENCUADRE MAESTRO — ALQUIMIA ES EL PRIMER SECTOR PACK DE SUPERMIND
**Fecha:** 15 junio 2026
**Autor:** Claude Master
**Estado:** Decisión arquitectónica fundacional — gobierna toda la ejecución siguiente
**Lectura previa obligatoria:** ECONOMY_SUPERMIND_FULL_SYSTEM_V2.md (secciones 2, 4, 5, 6)

---

## 1. LA DECISIÓN QUE ORDENA TODO

Alquimia no es un producto separado de Supermind. **Alquimia es `SECTOR_PACK_POLITICA_PUBLICA_RESIDUOS_MX` corriendo sobre el spine de Supermind.**

Esto no es retórica. Es la decisión que hace realizable el plazo de 3 días, porque cambia la pregunta de "¿cómo construyo Supermind?" (años) a "¿cómo termino la Fase 1 de un Sector Pack y enciendo las Fases 2-4 sobre el motor que ya existe?" (días).

Todo lo que ya tienes shipped —Phase D, registro de generadores, clasificación SCIAN, detección de outliers, agregación municipal, motor de propuestas, evaluación BANOBRAS, NOUS— **ya es** la implementación parcial de las capas de Supermind para este sector. No lo llamaste así, pero eso es lo que es.

---

## 2. TRADUCCIÓN EXACTA: SUPERMIND ↔ ALQUIMIA

### Las 8 capas, mapeadas a lo que Alquimia ya tiene o necesita

| Capa Supermind | Qué es | Estado en Alquimia |
|---|---|---|
| **L1 — Universal Spine** | Motor de razonamiento model-agnostic; patrones de razonamiento con trazas auditables | ⚠️ PARCIAL — NOUS implementa patrones rule-based, pero sin trazas `trace_id` formales. Necesita el motor de digestión de evidencia. |
| **L2 — Domain Adapter** | Vocabulario, workflows, estándares del sector residuos | ✅ EXISTE disperso — GRI 306, normas, clasificación SCIAN, modelo de mezcla de precios. **Falta consolidarlo como Sector Pack formal.** |
| **L3 — Expert Standards** | Registro versionado de normas que validan outputs | ⚠️ PARCIAL — tienes los GRI cargados, NAE-SMA-012, reglamentos. Falta el registro como oráculo de validación runtime. |
| **L4 — Human Integration** | LISTENER_ORCHESTRATOR: entrevista → Brief/Profile/Case | 🎯 **ESTO ES EL "DIAGNÓSTICO" QUE QUIERES CERRAR.** En política pública la entrevista de estructura se salta; queda solo captura de caso. |
| **L5 — Execution Engine** | Orquestación multi-agente por fases con gates de aprobación | 🎯 **ESTO ES LA "SUB-APP DE PLANEACIÓN/EJECUCIÓN" QUE QUIERES CONSTRUIR.** |
| **L6 — Auto-Neurogenesis** | Auto-mejora bajo gobernanza humana | ❌ NO MVP — difiérelo. No lo toques en 3 días ni en Sprint 1. |
| **L7 — Control Plane** | Versionado, observabilidad, feature flags, aprobaciones | ⚠️ MÍNIMO — admin table existe. Falta versionado formal y audit trail. |
| **L8 — Execution Plane** | UI renderizada por persona+sector+estado | ✅ EXISTE — alquimiaplatform.com, simulador, admin. Falta vistas por persona. |

### El insight operativo

Lo que llamas **"diagnóstico"** = **Fase 1 (Domain Analysis)** del Sector Pack.
Lo que llamas **"sub-app de planeación/ejecución/control"** = **Fases 2, 3, 4** del mismo pipeline.
El software que **"evoluciona según la etapa"** = el modelo Phase ON/OFF de L5 (agentes distintos encendidos por fase).
El **"Jarvis que conoce al usuario de principio a fin"** = el estado persistente en archivos `.md` (Tier 2/3 del modelo de estado) que sobrevive entre fases.

No estás inventando un paradigma nuevo cada vez que hablamos. Estás describiendo, con otras palabras, la arquitectura que ya documentaste en abril. La conversación de los últimos días la confirmó, no la reemplazó.

---

## 3. EL SECTOR PACK DE ALQUIMIA — ESPECIFICACIÓN INICIAL

Esto es lo que falta consolidar. Sigue el schema exacto de `SECTOR_PACK_CONSTRUCCION_EDIFICIOS` (sección 4.4 del doc Supermind), traducido a residuos municipales.

```yaml
Sector_Pack:
  id: "politica_publica_residuos_mx_v1"
  name: "Política Pública — Gestión de Residuos Sólidos Urbanos — México"
  sector: "Política Pública / Gobierno Municipal"
  sub_sector: "Gestión Integral de Residuos Sólidos Urbanos"
  country: "MX"
  version: "1.0.0"
  domain_adapter_ref: "domain_adapter_rsu_v1"

  # NOTA CLAVE: en política pública la estructura organizacional está
  # PREFABRICADA. No se entrevista "¿qué hace tu organización?".
  # La entrevista arranca en captura de caso (datos verificables del municipio).
  entry_mode: "prefab_structure_capture_case"   # vs "discover_structure" del sector privado

  personas:
    - id: "cabildo"
      label: "Cabildo / Ayuntamiento"
      description: "Órgano de decisión política. Autoridad: aprobación de programa, asignación presupuestal, decreto de reglamento. Es el gate de la etapa Validación."
      mobile_first: false
    - id: "director_servicios_publicos"
      label: "Director de Servicios Públicos Municipales"
      description: "Responsable operativo de limpia y recolección. Autoridad: operación diaria, rutas, personal de limpia."
      mobile_first: false
    - id: "director_ecologia"
      label: "Director de Ecología / Medio Ambiente"
      description: "Responsable de cumplimiento ambiental y plan de manejo. Autoridad: reportes ambientales, relación con autoridad estatal."
      mobile_first: false
    - id: "enlace_operativo"
      label: "Enlace Operativo / Capturista"
      description: "Captura datos de campo: padrón de generadores, tonelajes, rutas. Mobile-first."
      mobile_first: true

  must_have_blocks:
    - id: "reglamento_municipal"
      label: "Reglamento Municipal de Residuos"
      description: "Reglamento vigente. ES EL ÚNICO BLOQUEADOR FORMAL de progresión de módulos."
      required_fields: ["status", "fecha_publicacion", "url_periodico_oficial", "articulos_clave"]
      blocker: true
    - id: "padron_generadores"
      label: "Padrón de Generadores"
      description: "Registro de generadores con clasificación SCIAN, tonelaje, georreferencia."
      required_fields: ["generador_id", "scian", "tonelaje", "ubicacion", "fuente_dato"]
      update_frequency: "on-event"
    - id: "composicion_residuos"
      label: "Composición de Residuos (Caracterización)"
      description: "Composición medida del municipio. NUNCA del modelo por defecto — debe ser dato verificable del caso."
      required_fields: ["fraccion", "porcentaje", "fuente", "fecha_medicion", "metodo"]
      update_frequency: "on-event"
    - id: "compradores_ancla"
      label: "Compradores Ancla (Cartas de Intención)"
      description: "Únicas fuentes auditables de precio de material reciclable. Requieren carta firmada y fechada."
      required_fields: ["comprador", "material", "precio", "fecha_carta", "vigencia"]
      update_frequency: "on-event"

  default_agents:
    # FASE 1 — DIAGNÓSTICO (lo que quieres cerrar en 3 días)
    - agent_id: "diagnostico_generadores_agent"
      role: "Construcción y validación del padrón, clasificación SCIAN, detección de outliers"
      phase: "Phase_1_Diagnostico"
      status_alquimia: "✅ SHIPPED (Phase D)"
    - agent_id: "composicion_agent"
      role: "Captura y validación de composición de residuos contra fuente verificable"
      phase: "Phase_1_Diagnostico"
      status_alquimia: "⚠️ PARCIAL"
    - agent_id: "valorizacion_agent"
      role: "Modelo de mezcla de precios (Beta-PERT/LogNormal/Triangular), cálculo de potencial de valorización"
      phase: "Phase_1_Diagnostico"
      status_alquimia: "⚠️ PARCIAL — falta Monte Carlo"

    # FASE 2 — PLANEACIÓN (la sub-app a construir)
    - agent_id: "plan_manejo_agent"
      role: "Genera Plan de Manejo como documento desde estado estructurado"
      phase: "Phase_2_Planeacion"
      status_alquimia: "❌ POR CONSTRUIR"
    - agent_id: "banobras_agent"
      role: "Evaluación de viabilidad financiera, scoring BANOBRAS, Monte Carlo TIR/VPN"
      phase: "Phase_2_Planeacion"
      status_alquimia: "⚠️ PARCIAL — scoring existe, falta Monte Carlo"

    # FASE 3 — EJECUCIÓN/CONTROL
    - agent_id: "anexos_agent"
      role: "Genera Anexo Uno (bitácora) y Anexo Dos (manifiesto) automáticos — Modo B Nuevo León"
      phase: "Phase_3_Ejecucion"
      status_alquimia: "❌ POR CONSTRUIR (ventana comercial NL)"
    - agent_id: "supervision_agent"
      role: "Monitoreo de operación 36 meses, bitácora semanal, EVM"
      phase: "Phase_3_Ejecucion"
      status_alquimia: "❌ POR CONSTRUIR"

    # SOPORTE (siempre activos, no cuentan al límite por fase)
    - agent_id: "auditor_agent"
      role: "Verifica trazabilidad de cada dato a fuente (Zero Invention enforcement)"
      phase: "all"
      status_alquimia: "🎯 CRÍTICO — es el motor de digestión de evidencia"
    - agent_id: "documentation_agent"
      role: "Genera documentos institucionales (WeasyPrint+docxtpl) desde estado"
      phase: "Phase_4_Documentacion"
      status_alquimia: "⚠️ PARCIAL — HTML casero, migrar"
```

---

## 4. POR QUÉ ESTO HACE REALIZABLE LOS 3 DÍAS

El error sería intentar "terminar el diagnóstico" como si fuera un monolito difuso. Con el reencuadre, el diagnóstico es algo concreto y acotado:

**Cerrar la Fase 1 del Sector Pack = los tres agentes de diagnóstico producen sus tres `must_have_blocks` validados, con un gate de aprobación humana al final que permite pasar a Fase 2.**

Eso es:
- `diagnostico_generadores_agent` → padrón validado (✅ ya casi está)
- `composicion_agent` → composición capturada con fuente (⚠️ cerrar)
- `valorizacion_agent` → potencial de valorización calculado (⚠️ cerrar, con o sin Monte Carlo según tiempo)
- Gate: Director aprueba el diagnóstico → se desbloquea Fase 2

No es "terminar todo Alquimia". Es cerrar una fase con criterios claros. Eso sí cabe en 3 días.

---

## 5. LO QUE NO SE TOCA EN 3 DÍAS (anti-dispersión)

Escrito explícitamente para que el propio documento te frene:

- ❌ Auto-Neurogenesis (L6) — años, no ahora.
- ❌ Sector privado / entrevista de descubrimiento — es la réplica futura, no el sprint.
- ❌ "Un Jarvis por trabajador" — se gana cuando un cliente lo pide y paga.
- ❌ Composición abierta de acciones — arrancamos con catálogo cerrado (decisión ya tomada en conversación).
- ❌ Integraciones CAD/SolidWorks del blueprint Supermind — irrelevantes para residuos.
- ❌ Multi-sector — un solo Sector Pack hasta que el primero genere ingreso.

---

## 6. LOS 4 PRINCIPIOS DUROS (constitución de los agentes)

Destilados de la conversación + confirmados en el doc Supermind. Estos gobiernan a Codex y Claude Code al construir:

1. **Datos de fuente verificable; acciones de catálogo cerrado.** El grafo de acciones es estructura de proceso verificable, no invención de datos. (Supermind L3 + tu Zero Invention)
2. **Cómputo trazable, no valores improvisados.** El agente genera el procedimiento que produce el valor y lo ejecuta de forma determinista; cada cifra trae procedencia (fuente o fórmula). Nunca un número "plausible". (Supermind invariantes Spine)
3. **Resolutor hasta el borde de lo irreversible.** El agente hace todo el trabajo y se detiene en el último milímetro de cualquier acción que escriba al mundo externo (enviar, firmar, presentar, pagar). Ahí confirma. (Supermind constraint 1.5.3)
4. **Aprende la experiencia, nunca relaja el rigor.** La personalización ajusta orden, formato, preferencia; está PROHIBIDA en todo lo que toque procedencia de datos. El agente explica la razón de sus acciones (trazabilidad), pero la validación de negocio es del humano + reglas duras, no del juicio emergente del modelo.

---

## 7. SIGUIENTE DOCUMENTO

→ `05_HOJA_DE_RUTA_3_DIAS.md` — el plan día por día para cerrar Fase 1 (diagnóstico) y dejar encendida la estructura de Fase 2.

---

*04 · Reencuadre Maestro · Alquimia SLP = Sector Pack de Supermind · 15 junio 2026*
