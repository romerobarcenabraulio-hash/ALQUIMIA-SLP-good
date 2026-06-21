# 29 · ROSTER DE AGENTES + MATRIZ DE CAPACIDADES + MODELOS BACKEND
**Fecha:** 17 jun 2026
**Autor:** Claude Master (Cowork) — verificado contra el backend real
**Propósito:** Que no se nos escape ningún agente ni ninguna capacidad. Cada agente del orchestrator al último peldaño, qué debe saber hacer (construir, calcular ROI/TIR, analizar noticias, redactar correos…), qué modelos backend lo soportan, y qué falta. ✅ existe · ⚠️ GAP → issue.

**Hallazgo clave (anti-mentira):** el backend YA tiene una base financiera/analítica fuerte. NO partimos de cero. Lo verifiqué en código.

---

## 1. ROSTER DE AGENTES (del orchestrator al último peldaño)

### Agentes de PRODUCTO (Class A — se construyen)
| Agente | Rol | Autonomía | Estado | Dónde |
|---|---|---|---|---|
| ORCHESTRATOR | identifica giro/tenant, rutea | L0 | spec | ALQ-26, ALQ-37 |
| LISTENER | entrevista → Company Profile | L1 | spec | ALQ-36 |
| SECTOR | mapa de activación de módulos | L1 | spec | ALQ-26, ALQ-37 |
| ORG_BUILDER | organigrama + asigna Jarvis por rol | L1 | spec | ALQ-22, ALQ-49 |
| Jarvis (Class B) | agente por empleado/tenant | L1–L2 | spec | ALQ-27 |
| Agentes de módulo (E1, E2, …) | entregable por dominio | L0–L2 | patrón | ALQ-38, ALQ-44 |
| COMMERCE_AGENT | matching comprador/generador en la Red | L1 | spec | ALQ-43 |
| GapDetector | escanea huecos nightly | L1 | ✅ existe | repo |
| Agent Builder / generador | crea specs (la fábrica) | — | gated final | ALQ-59 |

### Capa de AGENTES/herramientas que YA existe en el backend (`app/agents/`) ✅
agora · document_specs · dossier (expediente municipal) · prompt_builder · research_service · validator · **numeric_guard** (guarda de cifras/procedencia) · exporter · bundle_builder · survey_builder · survey_pdf · dna_loader · eidos_glossary/linter.
→ Mucha de la maquinaria de "generar documento con procedencia" y "validar cifras" YA está. Se REUSA, no se reinventa.

### Agentes de razonamiento/decisión existentes ✅
`app/nous/engine.py` (insights/inferencia + correcciones), `app/decision_tree/engine.py` (árbol de decisión), `app/reasoning/` (explicaciones, graph_builder).

---

## 2. MATRIZ DE CAPACIDADES DE NEGOCIO (lo que cada agente debe SABER hacer)

Regla de tier (doc 14/19): **determinista = código puro, $0** · LLM medio = síntesis · template = $0.

| Capacidad | Tier | ¿Existe? | Dónde / Gap |
|---|---|---|---|
| **ROI** (retorno) | determinista | ✅ | `models/proyecto.py: roi_servicio()` |
| **TIR / IRR** | determinista | ✅ | `services/calculator.py: _calc_tir()`; `cost_model: tir_municipio/concesionario` |
| **Motor de costos CAPEX/OPEX + confianza** | determinista | ✅ | `schemas/cost_model.py` (motor financiero Wave 0) |
| **VAN/NPV, payback, análisis de sensibilidad** | determinista | ⚠️ parcial/GAP | **ALQ-61** (generalizar para Empresarial) |
| **PERT / ruta crítica** | determinista | ✅ | `statistical/pert_analysis.py` |
| **Monte Carlo (riesgo)** | determinista | ✅ | `statistical/monte_carlo.py` |
| **Multiplicadores I-O / derrama económica** | determinista | ✅ | `statistical/io_multipliers.py` |
| **Estimación de volúmenes/impacto (macros)** | determinista | ✅ | `app/macros/` |
| **Estimación de generación RSU (factores SCIAN)** | determinista | ✅ | `empresa/` (GOV) |
| **Generación de documentos con procedencia** | template+LLM | ✅ | `app/agents/` (agora, document_specs, exporter), `pdf_perfil.py` |
| **Validación de cifras / procedencia (anti-mentira)** | determinista | ✅ | `agents/numeric_guard.py`; REGLAS |
| **Mapeo a estándares (GRI/SASB/ODS/ISO)** | determinista | ✅ | `app/standards/mapper.py` |
| **Research web con procedencia** | LLM+API | ✅ | `app/research/` (Serper/Anthropic, caché) |
| **Análisis de noticias / mercado** | LLM | ⚠️ GAP | **ALQ-62** |
| **Redacción de correos / comunicaciones** | LLM+template | ⚠️ GAP | **ALQ-63** |
| **Recomendación de decisión de negocio (ROI/TIR→consejo)** | det+LLM | ⚠️ GAP (faltan VAN/payback + capa de consejo) | ALQ-61 + ALQ-62 |
| **Compliance/obligaciones por giro** | determinista | ✅ | `empresa/obligation` (GOV) |
| **Catálogo/registro de capacidades (que ninguna se pierda)** | — | ⚠️ GAP | **ALQ-64** |

---

## 3. MODELOS BACKEND (≈75 verificados — inventario por dominio)

✅ Ya existen, agrupados:
- **Tenant/cuenta/acceso:** UserAccount, AdminTenant, TenantState, TenantCapability, TenantAuditLog, AccessLog, EmailVerificationToken, SmsVerificationCode.
- **Pagos:** PaymentMethod, Subscription, Invoice, Transaction.
- **Proyecto/planeación:** ProyectoMunicipal, ActividadProyecto, RevisionProyecto, AlertaProyecto, EvmSnapshot, CheckpointCostos, ImpactoReal.
- **Simulación/decisión:** Simulation, SimulationVersion, SimulationAuditLog, DecisionTreeSession, ModelCalibration.
- **NOUS (insights):** NousInsight, NousPattern, NousInferenceCorrection, NousProjectionDelta, NousGateOutcome.
- **Datos/research:** DataPoint, PriceSeries, ResearchItem, BibliographyEntry, RegulatorySource, ScrapedDocument, BenchmarkMunicipal.
- **Residuos/logística:** GeneratorResidueRecord, MunicipalResidueAggregate, RCDFraccion, Logistics* (rutas, pesajes, KPIs), GeoCentroAcopio.
- **Documentos/gates:** TenantDocument(Draft), DocumentGap, TenantGate, GateStatusLog, ComplianceTemplate.
- **Partners/red:** PartnerOrganization, TenantPartnerLink, MapaActor.

⚠️ Modelos probablemente faltantes (para lo nuevo):
- `Container` (GOV close, Escenario 2) → ALQ-13.
- Modelos de **evidencia** (archivo+fotos+procedencia) → ALQ-29.
- Modelos de **organigrama / rol / asignación de agente** → ALQ-22/49.
- Modelos de **RBAC** (rol/permiso) → ALQ-51.
- Modelo de **Agent Spec / Module Registry** → ALQ-24/56.
- Modelo de **EvidencePackage / ApprovalRequest** (bandeja de gate) → ALQ-50.

---

## 4. QUÉ CONSTRUIMOS vs QUÉ ORQUESTAMOS
- **Construimos (determinista, $0, es nuestro rigor):** todo el cálculo — ROI, TIR, VAN, payback, PERT, Monte Carlo, I-O, estimaciones, semáforos, mapeo a estándares. El LLM identifica; el algoritmo calcula.
- **Orquestamos (LLM/API existente, costo diferido):** síntesis, análisis de noticias, redacción de correos, research. Vía router de capacidades (ALQ-27), modelo más barato que sirva.
- (Doc 21: lo que aprendemos de competidores se reimplementa como capacidad propia, no se copia.)

---

## 5. HUECOS DETECTADOS → ISSUES NUEVOS
- **ALQ-61** Motor financiero de negocio: VAN/NPV + payback + sensibilidad + capa de "recomendación" sobre ROI/TIR existentes (generalizar de GOV a Empresarial). Determinista, $0.
- **ALQ-62** Capacidad de análisis de noticias/mercado (LLM+research, gated).
- **ALQ-63** Capacidad de redacción de correos/comunicaciones (LLM+template, gated).
- **ALQ-64** Catálogo/registro de Capacidades de Negocio (que ninguna capacidad se pierda; tier + agente que la usa).

→ Con esto, cada agente (orchestrator→último) tiene catalogadas sus capacidades, y el registro garantiza que añadir una nueva = registrarla, no improvisarla.

---

*29 · Roster de Agentes + Capacidades + Modelos · Alquimia Supermind · 17 jun 2026*
