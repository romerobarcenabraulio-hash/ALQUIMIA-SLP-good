# ADR-003: La Ontología de Alquimia — el spine semántico (Palantir-grade, con procedencia)
**Status:** Proposed (espera firma del founder)
**Date:** 18 jun 2026
**Deciders:** Braulio · Claude Master
**Relacionado:** ADR-001 (fábrica/tiers), ADR-002 (juicio), Company Profile (ALQ-23), situational awareness (ALQ-85), ECA (ALQ-69), integración (ALQ-95).

---

## Context
Para competir conceptualmente con Palantir necesitamos su pieza central: la **ONTOLOGÍA** (el corazón de Foundry/Gotham). Hoy tenemos FRAGMENTOS (Company Profile, modelo canónico, org-builder, catálogo de equipo, situational awareness, ECA, grafo inter-empresa) pero sin **el spine que los unifica**. Sin ontología, son tablas dispersas; con ontología, son un modelo coherente del mundo real sobre el que se razona y se actúa.

## Decision
Construir **La Ontología de Alquimia**: una capa semántica que modela la realidad de cada organización (y de la red) como:
- **OBJETOS** — entidades del mundo real: Empresa, Empleado, Equipo/Activo, Proyecto, Residuo, Cliente, Factura, Municipio, Proveedor…
- **PROPIEDADES** — atributos de cada objeto, **cada uno con procedencia** (fuente+fecha+confianza).
- **LINKS** — relaciones tipadas: Empleado —opera→ Equipo · Empresa —genera→ Residuo · Proyecto —usa→ Equipo · Empresa —compra_a→ Proveedor.
- **ACCIONES** — operaciones sobre objetos (writeback), las irreversibles **gated** (ALQ-50).

Todos los datos integrados (ERP/BIWO, scraping, evidencia de campo, APIs públicas, intake) se **mapean a la ontología** (vía la capa anti-corrupción, ALQ-95). Los agentes razonan sobre **objetos**, no sobre tablas crudas; el situational awareness **renderiza** la ontología; el motor ECA **dispara acciones** sobre objetos; el juicio (ADR-002) opera sobre el grafo de objetos.

## Nuestra ventaja vs Palantir (por diseño, no por miedo)
1. **Procedencia nativa** en cada objeto/propiedad — la suya es potente pero opaca; la nuestra es **trazable y defendible** (ante gobierno/inversionista).
2. **Auto-construida** — la ontología se arma desde la entrevista (org-builder ALQ-22), no con meses de ingenieros FDE.
3. **Cruza tenants** — la ontología abarca **múltiples empresas** (Empresa A —proveedor_de→ Empresa B). Eso es el **grafo inter-empresa = el moat** que Palantir (intra-organización) no tiene.

## La capa de datos que la alimenta (sin límite, "genial")
- **Web scraping fuerte** (fuente oficial primero, ALQ-84).
- **Adquisición aumentada por humanos (on-request):** personas buscan/suben/curan info que el scraping no alcanza (datasheets, certificaciones, datos locales). → **ALQ-103**.
- **DBs adquiribles complejas** (benchmarks, mercado) — registro de fuentes (ALQ-82).
- **APIs públicas + campo + ERP integrado.**
Todo entra a la ontología **con procedencia**. Más fuentes ricas = ontología más poderosa = mejores veredictos.

## Options Considered
- **A. Modelo canónico plano** (lo que teníamos). ❌ Insuficiente para Palantir-grade; no expresa links/acciones ni el grafo.
- **B. Ontología completa de golpe.** ❌ Dispersión/imposible; años.
- **C. (ELEGIDA) Ontología incremental.** El Company Profile/canónico ES la semilla → se eleva a objetos/links/acciones → crece por hito. El **grafo inter-empresa (network ontology) = Hito 3 = el moat.**

## Consequences
- **Unifica TODO lo diseñado** bajo un concepto: el spine. Eleva canónico, org-builder, situational awareness, ECA, juicio, red.
- Nos hace **conceptualmente Palantir-grade** con tres edges (procedencia, auto-construcción, red).
- **Disciplina:** crece incremental (semilla → org → red), no de golpe. La ambición es enorme; el orden es cómo se logra.

## Action Items
1. [ ] Founder firma ADR-003.
2. [ ] **ALQ-102** Ontología (objetos/propiedades/links/acciones con procedencia) — eleva el modelo canónico (ALQ-23); spine sobre el que razonan agentes, renderiza SA, disparan acciones.
3. [ ] **ALQ-103** Adquisición de datos aumentada por humanos (on-request) + DBs adquiribles → alimentan la ontología con procedencia.

---

*ADR-003 · La Ontología de Alquimia · Alquimia Supermind · 18 jun 2026*
