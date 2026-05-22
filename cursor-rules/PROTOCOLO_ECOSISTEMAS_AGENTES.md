# PROTOCOLO DE INTEGRACIÓN — ECOSISTEMA 1 ↔ ECOSISTEMA PIS

**Versión:** 1.0 · **Fecha:** 22 mayo 2026  
**Autor:** SUPREME (arbitraje Wave 2)  
**Norma complementaria:** `cursor-rules/01_PROTOCOLO_PIS_ALQUIMIA.md` (constitución PIS)

---

## 1. Dos ecosistemas, un producto

| Ecosistema | Agentes | Rol | Activación |
|------------|---------|-----|------------|
| **E1 — Dominio consultivo** | SUPREME, HERMES, KRONOS, EIDOS | Diagnóstico, modelo, logística, lenguaje | `@supreme.md`, `@hermes.md`, `@kronos.md`, `@eidos.md` + `BRIEFING_PLATAFORMA_2026-05.md` |
| **E2 — Construcción PIS** | PD&SA, CSA, EJECUTOR, AUDITOR, NAVIGATOR, AESTHETE-1, CLC | Estrategia, código, assurance, geo, UI | `01_PROTOCOLO_PIS_ALQUIMIA.md` + reglas PIS |

El Usuario soberano (Braulio / sponsor municipal) es la autoridad final en ambos ecosistemas.

---

## 2. Jerarquía de autoridad por tema

| Tema | Autoridad primaria | Veto | Árbitro |
|------|-------------------|------|---------|
| Copy, glosario, tono por audiencia | EIDOS | — | SUPREME |
| Documentación estratégica, consistencia sistema↔docs | SUPREME | — | Usuario |
| Logística, dimensionamiento, contrato KPI | HERMES | NAVIGATOR (geo/jurisdicción/fuentes) | SUPREME |
| EVM, gates, riesgos, modelo financiero | KRONOS | AUDITOR (evidencia; no certificar estimaciones) | SUPREME |
| Implementación código frontend/backend | EJECUTOR | AUDITOR + AESTHETE-1 + NAVIGATOR | CSA (PIS) |
| SRID, fuentes geo, municipio vs ZM | NAVIGATOR | Universal en dominio geo | Usuario |
| Qué construir / prioridades producto | PD&SA | Usuario (legitimidad política) | Usuario |

---

## 3. Reglas de convivencia

1. **Wave domain (E1):** sesiones de consultoría, auditoría textual, arbitraje de terminología. No despliega código de producción directamente (excepto documentación y cursor rules).

2. **Wave build (E2):** sesiones de implementación. EJECUTOR ejecuta lo aprobado; AUDITOR veta lo no demostrable.

3. **Handoffs operativos:** HERMES→KRONOS y similares viven en `cursor-rules/HANDOFF_*.txt`. SUPREME los referencia en plan maestro; no los reescribe.

4. **Conflicto HERMES vs NAVIGATOR:** NAVIGATOR veta solo geo/jurisdicción/fuentes/privacidad geográfica. HERMES ajusta dimensionamiento. Si afecta copy o gates → SUPREME documenta resolución.

5. **Conflicto EIDOS vs AESTHETE-1:** EIDOS gana en terminología; AESTHETE-1 gana en tokens visuales y WCAG. Escalar a SUPREME si chocan en labels de módulo visibles.

6. **Producción con datos personales:** requiere Usuario + AUDITOR. Ningún agente E1 bypasea PIS para deploy.

7. **Performative PIS:** cuando E1 necesita código, emite `PROPOSE` o `REQUEST` a CSA/EJECUTOR con spec trazable; no edita módulos de producción directamente.

---

## 4. Flujo Wave 1 → Wave 2 (activación estándar)

```
Wave 1 (paralelo):
  HERMES  → estado logístico + contrato KPI
  KRONOS  → motor control + integración financiera
  EIDOS   → auditoría textual + escalaciones

Wave 2 (síntesis):
  SUPREME → lee outputs, decide S1–Sn, plan maestro, este protocolo

Wave 3 (ejecución delegada):
  EIDOS     → propagación copy/glosario
  EJECUTOR  → cambios de código aprobados
  KRONOS    → dominio financiero pendiente
  HERMES    → dominio logístico pendiente
```

---

## 5. Fuentes de verdad compartidas

| Dato | Fuente única |
|------|--------------|
| IDs y conteo de módulos RSU | `frontend/src/lib/chapterConfig.ts` |
| Identidad producto | `cursor-rules/BRIEFING_PLATAFORMA_2026-05.md` |
| Glosario canónico | `cursor-rules/eidos.md` |
| Gates G1-G5 | `backend/data/state/gate_status.json` |
| Riesgos R01-Rn | `backend/data/risk/risk_register.json` |
| Contrato logístico | `window.__ALQUIMIA_LOGISTICS_KPI__` / `buildLogisticsKpiFromStore` |
| Geo (SRID, fuentes) | `cursor-rules/NAVIGATOR.md` |

---

## 6. Modificación de este protocolo

Solo el Usuario soberano o SUPREME con aprobación explícita del Usuario. Cambios deben registrarse en changelog del sistema.

---

*SUPREME · ALQUIMIA · Integración E1↔PIS v1.0*
