# ADR-002: La Capa de Juicio ("Subconsciencia") — versatilidad + asertividad sin sesgo
**Status:** Proposed (espera firma del founder)
**Date:** 17 jun 2026
**Deciders:** Braulio · Claude Master
**Relacionado:** ADR-001 (fábrica + tiers), doc 14 (protocolo de decisión), doc 29 (capacidades), `app/nous/` (semilla en el repo)

> ⚠️ **RECONCILIACIÓN (18-jun):** este ADR NO es nuevo diseño desde cero — la capa de aprendizaje/juicio YA está diseñada e implementada parcial como **NOUS (docs/architecture/FASE17R, 18, 23, 24, 25, 26, 27 + app/nous)**. Este ADR DEFIERE a NOUS como fuente canónica: el "juicio/subconsciencia" se construye SOBRE NOUS (observers, learning/feedback, gate-outcomes, projection-deltas, self-monitoring/gobernanza), NO se reimplementa. ALQ-65/67/68 deben extender NOUS, no duplicarlo.

---

## Context
El sistema debe emitir veredictos/recomendaciones con BUEN JUICIO, versátil y asertivo. Tensión: los LLM son sesgados y **sicofánticos** (tienden a darle la razón al usuario) y sobre-confiados. El juicio humano bueno proviene de cruzar **cálculo + evidencia + intuición + memoria + campo**. El founder quiere un "sub-CEO" que delegue (research, finanzas, correos) y sintetice veredictos — casi una **subconsciencia**, "no una red neuronal pero algo similar".

## Decision
Construir una **CAPA DE JUICIO** que NO vive en un solo LLM, sino que **compone facultades separadas + deliberación dialéctica + un sustrato de memoria/heurísticas auditable**, gobernada por la constitución de razonamiento y el gate humano. **NO se entrenan pesos (no es red neuronal):** se construye una arquitectura cognitiva trazable que *se comporta* como un juicio prudente. Preserva la procedencia (nuestro moat): **máximo juicio, cero opacidad.**

### Las facultades (ninguna domina)
| Facultad | Sesgo | Rol |
|---|---|---|
| Cálculo determinista | ninguno (la matemática no opina) | ROI/TIR/VAN/PERT… el LLM NUNCA calcula |
| Evidencia verificable | bajo (procedencia) | datos con fuente |
| Campo | bajo | fotos/operación = reality-check |
| Memoria | medio | casos pasados, contexto y gustos del tenant |
| Síntesis (LLM) | **alto (aquí se controla)** | pesa lo anterior |
| Constitución/valores | — | el "carácter del pensamiento", estable |

### El modelo mental: System 1 / System 2 (Kahneman) = tu "subconsciencia"
- **Subconsciencia = System 1:** memoria + heurísticas/priors + intuición, siempre de fondo. **Semilla ya en el repo: `app/nous/`** (NousInsight, NousPattern, NousInferenceCorrection).
- **Juicio deliberado = System 2:** el protocolo lento (doc 14) que razona sobre lo anterior.
- No es red neuronal: es memoria + heurísticas EXPLÍCITAS y auditables (no pesos opacos) + deliberación + cálculo + valores.

### El protocolo de veredicto del "sub-CEO" (capa de juicio)
```
1. ENMARCAR el problema (qué se decide, para quién, qué se espera).
2. REUNIR FACULTADES (delega): cálculo (determinista), research (con procedencia),
   campo (evidencia), memoria (NOUS: casos/heurísticas/preferencias).
3. DELIBERAR DIALÉCTICAMENTE: proponente vs ABOGADO DEL DIABLO/crítico.
   El sistema argumenta EN CONTRA de sí mismo antes de concluir. (anti-sicofancia)
4. EMITIR VEREDICTO con: confianza calibrada + SUPUESTOS explícitos + procedencia
   (qué facultad aportó qué). Optimiza por correctitud vs evidencia/estándar, NO por agradar.
5. PARAR EN EL BORDE: si la acción es irreversible → bandeja de gate (ALQ-50). Propone, no ejecuta.
6. REGISTRAR + CALIBRAR: veredicto → resultado real → ¿acertó? corrige priors (NOUS correction).
```

---

## Cómo se mata el sesgo/sicofancia (la "asertividad") — los supuestos de garantía
1. **El LLM nunca da el número** (lo da el cálculo) → la matemática no se puede sesgar.
2. **Deliberación dialéctica** (proponente vs crítico / self-critique) antes de concluir.
3. **Optimiza por evidencia, no por agradar:** la constitución obliga a **disentir cuando la evidencia lo exige**, aunque incomode al usuario.
4. **Confianza + supuestos explícitos** en cada veredicto (calibración, no certezas infladas).
5. **Triangulación:** dato + estándar + campo + memoria; ninguna fuente única manda.
6. **Gate humano** en lo irreversible: el juicio propone, el humano decide lo consequencial.
7. **Loop de calibración:** se mide si la confianza acertó y la **tasa de override humano** (termómetro de sicofancia/calidad).

## Bases de datos que lo alimentan
Company Profile (verdad única) · historial del tenant · datos verificados (DataPoint, PriceSeries, BenchmarkMunicipal, APIs públicas) · NOUS insights/patterns (heurísticas) · evidencia de campo · corpus de estándares/regulación (GRI/ISO/NOM) · decisiones pasadas + sus resultados · preferencias/gustos del humano (con consentimiento, LFPDPPP / ALQ-55).

---

## Options Considered
- **A. LLM-juez monolítico** (un prompt grande decide todo). ❌ Máximo sesgo/sicofancia, opaco, no calibrable.
- **B. Modelo fine-tuneado / red neuronal propia.** ❌ Caro, opaco, rompe procedencia, lento de iterar; contradice "orquestar IA existente".
- **C. (ELEGIDA) Capa de juicio compuesta + deliberación + sustrato NOUS auditable.** ✅ Versátil, asertiva, calibrable, trazable; reusa lo que ya existe; sin entrenar pesos.

## Consequences
- **Más fácil:** juicio defendible (procedencia), menos sicofancia, mejora con el tiempo (calibración), versátil por facultades reutilizables.
- **Requiere disciplina:** el sustrato de memoria/heurísticas debe permanecer AUDITABLE (no caja negra); la deliberación cuesta algún token (gobernar con los 3 niveles de modelo).
- **Anti-dispersión:** construir la versión MÍNIMA primero (NOUS + deliberación + veredicto con confianza/supuestos), no un "mini-AGI" upfront. Crece con casos reales.

## Action Items (issues)
1. [ ] Founder firma ADR-002.
2. [ ] **ALQ-65** Capa de Juicio / protocolo de veredicto del "sub-CEO".
3. [ ] **ALQ-66** Protocolo anti-sesgo/anti-sicofancia (en la constitución del engine, doc 14).
4. [ ] **ALQ-67** Sustrato de memoria/heurísticas ("subconsciencia") sobre NOUS + retrieval + preferencias (con consentimiento).
5. [ ] **ALQ-68** Loop de calibración/feedback (veredicto→resultado, override rate, corrección de priors).

---

*ADR-002 · Capa de Juicio / Subconsciencia · Alquimia Supermind · 17 jun 2026*
