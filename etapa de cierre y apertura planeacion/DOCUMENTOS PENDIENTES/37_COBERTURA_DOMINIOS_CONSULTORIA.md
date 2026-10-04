# 37 · COBERTURA DE DOMINIOS DE CONSULTORÍA — QUÉ TENER Y CÓMO TENERLO
**Fecha:** 18 jun 2026
**Autor:** Claude Master (Cowork) — crítico, verificado contra el repo
**Propósito:** Que no se olvide ningún dominio (energía, logística, workspace, social, legal-contratos, project tracking, ERP…). Por cada uno: **qué tener** + **cómo tenerlo** (replicar/integrar/comprar, doc 36). Sin construirlos todos (anti-dispersión).

---

## 0. DOS CRÍTICAS A TUS IDEAS (importantes)
1. **"ERP" → NO lo construyas.** Es el juego del incumbente que rodeamos con niebla (doc 16). Lo útil que SÍ tienes es **project tracking** (Gantt/PERT/RACI/EVM en `planning` + modelos `proyecto`). ERP completo = **integrar** (CONTPAQi/SAP), nunca replicar. La palabra "ERP" invita al scope creep que mata startups.
2. **"Redactar contratos" → asistir, no reemplazar.** Tu `app/legal` actual es **diagnóstico regulatorio**, NO contratos. Redactar contratos = alta liability → **abogado en el loop (gate) + disclaimers** (ya existen en repo) + plantillas por jurisdicción. El sistema asiste; el abogado firma.

**Regla maestra para TODO dominio:** cada uno es **un módulo de la fábrica + su fuente de datos/estándar**. El motor los expresa todos; lo que cambia es la data/estándar del dominio. Por eso se **registran** (Module Registry ALQ-56) y se construyen **por demanda** (el 1º lo definen las entrevistas ALQ-33), no por lista.

---

## 1. MAPA DE DOMINIOS — qué tener / cómo tenerlo / estado

| Dominio | Qué tener | Cómo tenerlo | Estado en repo |
|---|---|---|---|
| **Project tracking** | Gantt/PERT/RACI/EVM, hitos, alertas | **REPLICAR** (ya es slice nuestro) | ✅ existe (GOV) → generalizar Empresarial · **ALQ-93** |
| **ERP / contabilidad** | facturación, asientos | **INTEGRAR** (CONTPAQi/SAP) — NO construir | integrar vía conector (ALQ-52) |
| **Eficiencia energética** | consumos, benchmarks CONUEE/SENER, top iniciativas+ROI | **REPLICAR módulo + COMPRAR/INTEGRAR benchmarks** | ⚠️ gap (candidato 1º módulo, doc 08) → ALQ-38/82 |
| **Optimización de logística** | rutas por distancia/carga/frecuencia | **REPLICAR** (RouteOptimizer) sobre routing existente | ⚠️ parcial (routing ✅, optimizer falta) · **ALQ-91** |
| **Diseño de área de trabajo / layout** | plano, ergonomía, código de construcción | **REPLICAR módulo + COMPRAR/INTEGRAR estándares** | ⚠️ gap (módulo por demanda) → registro ALQ-94 |
| **Programas sociales** | diagnóstico social, marginación, diseño de programa | **REPLICAR + INTEGRAR datos (CONEVAL ✅)** | ⚠️ parcial (educación/gobernanza/CONEVAL ✅) → módulo por demanda |
| **Legal — diagnóstico regulatorio** | obligaciones, reforma, contexto municipal | **REPLICAR** (es nuestro) | ✅ existe (`app/legal`) |
| **Legal — redacción de contratos** | borrador asistido + plantillas + gate abogado | **REPLICAR capacidad (LLM+template) gated** | ⚠️ gap · **ALQ-92** |
| **Finanzas / inversión** | ROI/TIR/VAN/payback + recomendación | **REPLICAR** | ✅ ROI/TIR · VAN/payback ALQ-61 |
| **Cotizaciones** | precios con procedencia | **REPLICAR + COMPRAR/INTEGRAR fuentes precio** | ✅ GOV → Empresarial ALQ-71 |
| **Residuos / circularidad (RSU)** | diagnóstico, Sankey, red | **REPLICAR** (el piloto/moat) | ✅ existe → nacional ALQ-9..12 |
| **Datos de mercado/financieros** | feeds, benchmarks | **COMPRAR** (nosotros, no el cliente) | diferido (ALQ-82) |
| **Comms / docs / firma** | Slack, Gmail, DocuSign | **INTEGRAR** (lo del cliente) | conectores ALQ-52 |

---

## 2. CÓMO SE GARANTIZA QUE NO SE OLVIDE NINGUNO
- **Módulos** → Module Registry (ALQ-56): catálogo de dominios objetivo, cada uno marcado build/integrate/buy (ALQ-90) y "por demanda". → **ALQ-94** los siembra (energía, logística, workspace, social, legal-contratos…).
- **Capacidades transversales** (finanzas, comms, análisis) → Capability Catalog (ALQ-64).
- **Fuentes de datos** por dominio → registro de fuentes (ALQ-82).
→ Los tres registros = la garantía estructural: añadir un dominio/capacidad/fuente = **registrarlo**, no improvisarlo, no olvidarlo.

---

## 3. DISCIPLINA (lo crítico)
Tu lista es la **promesa de alcance** (la fábrica los expresa todos), NO la lista de construcción. Se construye:
1. RSU (piloto, ✅) → 2. el 1º módulo Empresarial que definan las entrevistas (ALQ-33) → 3. el resto **por cliente que paga**, registrado.
NO construir energía + logística + workspace + social + contratos a la vez. Eso es la dispersión que el doc 08 §7 prohíbe.

---

## 4. ISSUES DE ESTE BARRIDO
- **ALQ-91** RouteOptimizer (optimización logística sobre routing existente).
- **ALQ-92** Capacidad legal de asistencia de contratos (plantillas + gate abogado + disclaimers).
- **ALQ-93** Generalizar project tracking (Gantt/PERT/RACI/EVM) a Empresarial.
- **ALQ-94** Catálogo de dominios objetivo en el Module Registry (sembrar la lista, build-by-demand).

---

*37 · Cobertura de Dominios de Consultoría · Alquimia Supermind · 18 jun 2026*
